const Photo = require("../models/photo");
const Album = require("../models/album");
const UploadTask = require("../models/uploadTask");
const uploadQueue = require("../services/uploadQueueManager");
const path = require("path");
const fs = require("fs");
const fsp = fs.promises;
const { HttpStatus, Response } = require("../utils/response");
const {
  NotFoundError,
  ValidationError,
  InternalError,
} = require("../utils/errors");

class PhotoController {
  processPhotos(photos) {
    return photos.map((photo) => {
      const updatedPhoto = { ...photo };

      if (updatedPhoto.location) {
        const hasValidCoords = updatedPhoto.location.latitude != null && 
                               updatedPhoto.location.longitude != null;
        if (!hasValidCoords) {
          updatedPhoto.location = null;
        }
      }

      return updatedPhoto;
    });
  }

  async deletePhotoFiles(photo) {
    const baseUploadDir =
      process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
    const uploadDir = path.join(baseUploadDir, "photos");
    const thumbnailDir =
      process.env.THUMBNAIL_DIR || path.join(baseUploadDir, "thumbnails");
    const webpDir =
      process.env.UPLOAD_WEBP_DIR || path.join(baseUploadDir, "photos-webp");

    const webpFileName = `${path.parse(photo.storageKey).name}.webp`;

    const fileDeletions = [
      fsp.unlink(path.join(uploadDir, photo.storageKey)).catch(() => {}),
      photo.thumbnailKey
        ? fsp.unlink(path.join(thumbnailDir, photo.thumbnailKey)).catch(() => {})
        : Promise.resolve(),
      fsp.unlink(path.join(webpDir, webpFileName)).catch(() => {}),
      photo.originalKey && photo.originalKey !== photo.storageKey
        ? fsp.unlink(path.join(uploadDir, photo.originalKey)).catch(() => {})
        : Promise.resolve(),
      photo.videoKey
        ? fsp.unlink(path.join(uploadDir, photo.videoKey)).catch(() => {})
        : Promise.resolve(),
    ];

    await Promise.all(fileDeletions);
  }

  /**
   * 上传照片
   */
  async upload(ctx) {
    try {
      const file = ctx.request.files?.file;

      if (!file) {
        throw new ValidationError("请选择要上传的文件");
      }

      // 确保上传目录存在
      const baseUploadDir =
        process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
      const uploadDir = path.join(baseUploadDir, "photos");
      await fsp.mkdir(uploadDir, { recursive: true });

      // 提取原始文件名信息
      const originalName =
        file.originalFilename || file.name || file.newFilename || "unknown";
      const ext = path.extname(originalName);
      const baseName = path.parse(originalName).name;

      // 生成存储文件名：保留原始 baseName + 时间戳（避免重复）+ 扩展名
      const timestamp = Date.now();
      const filename = `${baseName}_${timestamp}${ext}`;
      const filePath = path.join(uploadDir, filename);

      // 使用流式写入而不是rename,这样可以跨设备工作
      const tempPath = file.filepath || file.path;
      if (!tempPath) {
        throw new InternalError("无法获取上传文件的临时路径");
      }

      // 方法1: 使用 fs.copyFile (跨设备推荐)
      await fsp.copyFile(tempPath, filePath);
      // 删除临时文件
      await fsp.unlink(tempPath).catch(() => {});

      // Live Photo 检测：检查是否有同名的视频/图片文件
      const mimeType = file.mimetype || file.type || file.mimeType || "";
      const extLower = ext.toLowerCase();
      const imageExts = [
        ".jpg",
        ".jpeg",
        ".png",
        ".heic",
        ".heif",
        ".webp",
        ".gif",
        ".tiff",
        ".tif",
      ];
      const videoExts = [".mp4", ".mov", ".avi", ".mkv", ".m4v"];
      const isImage =
        mimeType.startsWith("image/") || imageExts.includes(extLower);
      const isVideo =
        mimeType.startsWith("video/") || videoExts.includes(extLower);

      let pairedFile = null;
      let isLivePhoto = false;

      if (isImage || isVideo) {
        // 查找所有文件
        const allFiles = await fsp.readdir(uploadDir);

        // 查找同名但不同类型的文件
        for (const existingFile of allFiles) {
          // 提取文件的 baseName（去掉结尾的 _时间戳 和扩展名）
          const existingBaseName = existingFile
            .replace(/_\d{13}(?=\.[^.]+$)/, "")
            .replace(/\.[^.]+$/, "");
          const existingExt = path.extname(existingFile).toLowerCase();

          // 名字匹配且类型不同（比较原始 baseName）
          if (existingBaseName === baseName && existingFile !== filename) {
            const videoExts = [".mp4", ".mov", ".avi", ".mkv", ".m4v"];
            const imageExts = [
              ".jpg",
              ".jpeg",
              ".png",
              ".heic",
              ".heif",
              ".webp",
            ];

            if (isImage && videoExts.includes(existingExt)) {
              pairedFile = existingFile;
              isLivePhoto = true;
              break;
            } else if (isVideo && imageExts.includes(existingExt)) {
              pairedFile = existingFile;
              isLivePhoto = true;
              break;
            }
          }
        }
      }

      // 创建任务
      const taskData = {
        originalFileName: originalName,
        fileSize: file.size,
        mimeType: file.mimetype || file.type || file.mimeType,
        storageKey: filename,
        priority: 0,
        isLivePhoto,
        pairedFile,
        baseName,
      };

      // 如果有用户信息则添加,否则不添加
      if (ctx.state.user?._id) {
        taskData.uploadedBy = ctx.state.user._id;
      }

      const task = await uploadQueue.createTask(taskData);

      ctx.body = Response.success(
        {
          taskId: task.taskId,
          filename,
          status: task.status,
        },
        "上传成功，开始处理",
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取任务状态
   */
  async getTaskStatus(ctx) {
    try {
      const { taskId } = ctx.params;
      const task = await uploadQueue.getTaskStatus(taskId);

      if (!task) {
        throw new NotFoundError("任务不存在");
      }

      ctx.body = Response.success(
        {
          taskId: task.taskId,
          status: task.status,
          stage: task.stage,
          progress: task.progress,
          error: task.error,
          photoId: task.photoId,
        },
        "获取成功",
      );
    } catch (error) {
      throw error;
    }
  }

  async getTaskStatuses(ctx) {
    try {
      const { taskIds } = ctx.request.body || {};

      if (!Array.isArray(taskIds) || taskIds.length === 0) {
        throw new ValidationError("taskIds 不能为空");
      }

      const tasks = await UploadTask.find({ taskId: { $in: taskIds } }).lean();

      const data = taskIds.map((id) => {
        const task = tasks.find((t) => t.taskId === id);
        if (!task) {
          return {
            taskId: id,
            status: "not_found",
          };
        }

        return {
          taskId: task.taskId,
          status: task.status,
          stage: task.stage,
          progress: task.progress,
          error: task.error,
          photoId: task.photoId,
        };
      });

      ctx.body = Response.success({ tasks: data }, "获取成功");
    } catch (error) {
      throw error;
    }
  }

  async getQueueStats(ctx) {
    try {
      const stats = await uploadQueue.getStats();
      ctx.body = Response.success(stats, "获取成功");
    } catch (error) {
      throw error;
    }
  }

  async getFailedTasks(ctx) {
    try {
      const { page = 1, limit = 20 } = ctx.query;
      const pageNum = Math.max(parseInt(page, 10) || 1, 1);
      const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
      const skip = (pageNum - 1) * limitNum;

      const [tasks, total] = await Promise.all([
        UploadTask.find({ status: "failed" })
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        UploadTask.countDocuments({ status: "failed" }),
      ]);

      ctx.body = Response.success(
        {
          tasks: tasks.map((t) => ({
            taskId: t.taskId,
            originalFileName: t.originalFileName,
            status: t.status,
            stage: t.stage,
            progress: t.progress,
            error: t.error,
            attempts: t.attempts,
            maxAttempts: t.maxAttempts,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
          })),
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
          },
        },
        "获取成功",
      );
    } catch (error) {
      throw error;
    }
  }

  async retryTask(ctx) {
    try {
      const { taskId } = ctx.params;
      const task = await UploadTask.findOne({ taskId });

      if (!task) {
        throw new NotFoundError("任务不存在");
      }

      task.status = "pending";
      task.stage = "upload";
      task.progress = 5;
      task.error = null;
      task.attempts = 0;
      task.failedAt = null;
      await task.save();

      // 立即触发处理
      uploadQueue.processQueue().catch((err) => {
        console.error("重试触发处理失败:", err);
      });

      ctx.body = Response.success(
        { taskId: task.taskId, status: task.status },
        "已重试",
      );
    } catch (error) {
      throw error;
    }
  }

  async getPhotos(ctx) {
    try {
      const {
        page = 1,
        limit = 20,
        tag,
        album,
        startDate,
        endDate,
        visibility,
      } = ctx.query;

      const query = { status: "completed" };

      if (visibility) {
        query.visibility = visibility;
      }

      if (tag) {
        query.tags = tag;
      }

      if (album) {
        query.albums = album;
      }

      if (startDate || endDate) {
        query.dateTaken = {};
        if (startDate) query.dateTaken.$gte = new Date(startDate);
        if (endDate) query.dateTaken.$lte = new Date(endDate);
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [photos, total] = await Promise.all([
        Photo.find(query)
          .sort({ sort: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .select("-exif")
          .lean(),
        Photo.countDocuments(query),
      ]);

      const updatedPhotos = this.processPhotos(photos);

      const result = {
        photos: updatedPhotos,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      };

      ctx.body = Response.success(result, "获取成功");
    } catch (error) {
      throw error;
    }
  }

  async getPhotoDetail(ctx) {
    try {
      const { id } = ctx.params;
      const photo = await Photo.findById(id).lean();

      if (!photo) {
        throw new NotFoundError("照片不存在");
      }

      await Photo.findByIdAndUpdate(id, { $inc: { views: 1 } });

      ctx.body = Response.success(photo, "获取成功");
    } catch (error) {
      throw error;
    }
  }

  async getMapData(ctx) {
    try {
      const photos = await Photo.find({
        status: "completed",
        visibility: "public",
        "location.coordinates": { $exists: true, $ne: null },
      })
        .select(
          "_id title thumbnailUrl originalUrl location geoinfo dateTaken width height thumbHash",
        )
        .sort({ dateTaken: -1 })
        .lean();

      // 按坐标点聚合（精度到小数点后3位，约100米）
      const locationGroups = {};

      photos.forEach((photo) => {
        // 保留3位小数的坐标作为key，精度约100米
        const lat = photo.location?.latitude;
        const lng = photo.location?.longitude;

        if (!lat || !lng) return;

        const precision = 1000; // 3位小数
        const roundedLat = Math.round(lat * precision) / precision;
        const roundedLng = Math.round(lng * precision) / precision;
        const key = `${roundedLat},${roundedLng}`;

        if (!locationGroups[key]) {
          locationGroups[key] = {
            city: photo.geoinfo?.city || photo.geoinfo?.country || "Unknown",
            location: {
              latitude: roundedLat,
              longitude: roundedLng,
            },
            count: 0,
            photos: [],
          };
        }
        locationGroups[key].photos.push({
          _id: photo._id,
          title: photo.title,
          thumbnailUrl: photo.thumbnailUrl,
          originalUrl: photo.originalUrl,
          dateTaken: photo.dateTaken,
          geoinfo: photo.geoinfo,
          width: photo.width,
          height: photo.height,
          thumbHash: photo.thumbHash,
        });
        locationGroups[key].count += 1;
      });

      ctx.body = Response.success(Object.values(locationGroups), "获取成功");
    } catch (error) {
      throw error;
    }
  }

  async deletePhoto(ctx) {
    try {
      const { id } = ctx.params;
      const photo = await Photo.findById(id).lean();

      if (!photo) {
        throw new NotFoundError("照片不存在");
      }

      await this.deletePhotoFiles(photo);
      await Photo.deleteOne({ _id: id });

      ctx.body = Response.success(null, "删除成功");
    } catch (error) {
      throw error;
    }
  }

  async batchDeletePhotos(ctx) {
    try {
      const { ids } = ctx.request.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        throw new ValidationError("请提供要删除的照片ID列表");
      }

      const photos = await Photo.find({ _id: { $in: ids } }).lean();

      if (photos.length === 0) {
        throw new NotFoundError("未找到要删除的照片");
      }

      await Promise.all(photos.map(photo => this.deletePhotoFiles(photo)));

      const result = await Photo.deleteMany({ _id: { $in: ids } });

      ctx.body = Response.success(
        { deletedCount: result.deletedCount },
        `成功删除 ${result.deletedCount} 张照片`,
      );
    } catch (error) {
      throw error;
    }
  }

  async updatePhoto(ctx) {
    try {
      const { id } = ctx.params;
      const updates = ctx.request.body;

      const allowedFields = ["title", "description", "tags", "visibility"];
      const filteredUpdates = {};

      allowedFields.forEach((field) => {
        if (updates[field] !== undefined) {
          filteredUpdates[field] = updates[field];
        }
      });

      const photo = await Photo.findByIdAndUpdate(id, filteredUpdates, {
        new: true,
        runValidators: true,
      });

      if (!photo) {
        throw new NotFoundError("照片不存在");
      }

      ctx.body = Response.success(photo, "更新成功");
    } catch (error) {
      throw error;
    }
  }

  async updatePhotoLocation(ctx) {
    try {
      const { id } = ctx.params;
      const { latitude, longitude } = ctx.request.body;

      if (typeof latitude !== "number" || typeof longitude !== "number") {
        throw new ValidationError("经纬度必须是数字");
      }

      const photo = await Photo.findById(id);
      if (!photo) {
        throw new NotFoundError("照片不存在");
      }

      photo.location = {
        latitude,
        longitude,
        coordinates: [longitude, latitude],
      };

      await photo.save();

      const photoId = photo._id;
      const geocoding = require("../services/geocoding");
      geocoding
        .reverseGeocode(latitude, longitude)
        .then(async (geoinfo) => {
          if (geoinfo) {
            const photoToUpdate = await Photo.findById(photoId);
            if (photoToUpdate) {
              photoToUpdate.geoinfo = geoinfo;
              await photoToUpdate.save();
            }
          }
        })
        .catch((geoError) => {
          console.warn("反向地理编码失败:", geoError.message);
        });

      ctx.body = Response.success(photo, "位置信息更新成功，地理信息正在后台获取");
    } catch (error) {
      throw error;
    }
  }

  async refreshPhotoGeoinfo(ctx) {
    try {
      const { id } = ctx.params;
      const photo = await Photo.findById(id);

      if (!photo) {
        throw new NotFoundError("照片不存在");
      }

      if (!photo.location?.latitude || !photo.location?.longitude) {
        throw new ValidationError("照片没有位置信息");
      }

      const geocoding = require("../services/geocoding");
      const geoinfo = await geocoding.reverseGeocode(
        photo.location.latitude,
        photo.location.longitude,
      );

      photo.geoinfo = geoinfo;
      await photo.save();

      ctx.body = Response.success(photo, "地理位置信息更新成功");
    } catch (error) {
      throw error;
    }
  }

  async refreshPhotoExif(ctx) {
    try {
      const { id } = ctx.params;
      const photo = await Photo.findById(id);

      if (!photo) {
        throw new NotFoundError("照片不存在");
      }

      const baseUploadDir =
        process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
      const uploadDir = path.join(baseUploadDir, "photos");
      const fileKey = photo.originalKey || photo.storageKey;
      const filePath = path.join(uploadDir, fileKey);

      if (
        !(await fsp
          .access(filePath)
          .then(() => true)
          .catch(() => false))
      ) {
        throw new NotFoundError("原始文件不存在");
      }

      const imageProcessing = require("../services/imageProcessing");
      const exifData = await imageProcessing.extractExif({
        filePath,
        originalFileName: photo.originalFileName,
      });

      photo.exif = exifData.exif;
      if (exifData.dateTaken) {
        photo.dateTaken = exifData.dateTaken;
      }
      if (exifData.location) {
        photo.location = {
          latitude: exifData.location.latitude,
          longitude: exifData.location.longitude,
          altitude: exifData.location.altitude,
          coordinates: [
            exifData.location.longitude,
            exifData.location.latitude,
          ],
        };

        const geocoding = require("../services/geocoding");
        try {
          const geoinfo = await geocoding.reverseGeocode(
            exifData.location.latitude,
            exifData.location.longitude,
          );
          photo.geoinfo = geoinfo;
        } catch (geoError) {
          console.warn("反向地理编码失败:", geoError.message);
        }
      }
      if (exifData.camera) {
        photo.camera = exifData.camera;
      }

      await photo.save();

      ctx.body = Response.success(photo, "EXIF 信息更新成功");
    } catch (error) {
      throw error;
    }
  }

  async rotatePhoto(ctx) {
    try {
      const { id } = ctx.params;
      const { degree } = ctx.request.body;

      console.log(
        `\n[ROTATE] 接收旋转请求 - Photo ID: ${id}, 角度: ${degree}°`,
      );

      if (!degree || ![90, -90, 180].includes(degree)) {
        throw new ValidationError("无效的旋转角度，仅支持 90, -90, 180");
      }

      const photo = await Photo.findById(id);
      if (!photo) {
        throw new NotFoundError("照片不存在");
      }

      const baseUploadDir =
        process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
      const uploadDir = path.join(baseUploadDir, "photos");
      const fileKey = photo.originalKey || photo.storageKey;
      const filePath = path.join(uploadDir, fileKey);

      if (
        !(await fsp
          .access(filePath)
          .then(() => true)
          .catch(() => false))
      ) {
        throw new NotFoundError("原始文件不存在");
      }

      const sharp = require("sharp");
      const fileExt = path.extname(fileKey).toLowerCase();

      let image = sharp(filePath);
      const metadata = await image.metadata();

      let newWidth = metadata.width;
      let newHeight = metadata.height;

      if (Math.abs(degree) === 90) {
        const temp = newWidth;
        newWidth = newHeight;
        newHeight = temp;
      }

      const backupPath = filePath + ".backup";
      await fsp.copyFile(filePath, backupPath);

      try {
        let pipeline = sharp(filePath).rotate(degree);

        if (fileExt === ".webp") {
          pipeline = pipeline.webp({
            quality: 90,
            effort: 6,
          });
        } else if (fileExt === ".png") {
          pipeline = pipeline.png({
            quality: 90,
            effort: 9,
          });
        } else if (fileExt === ".jpg" || fileExt === ".jpeg") {
          pipeline = pipeline.jpeg({
            quality: 90,
            progressive: true,
            mozjpeg: true,
          });
        } else if (fileExt === ".gif") {
          pipeline = pipeline.gif();
        } else {
          pipeline = pipeline.withMetadata();
        }

        await pipeline.toFile(filePath + ".rotated");

        const rotatedStats = await fsp.stat(filePath + ".rotated");
        console.log(`[ROTATE] ✓ 旋转文件已创建: ${rotatedStats.size} bytes`);

        if (rotatedStats.size === 0) {
          throw new ValidationError("旋转后文件为空");
        }

        await fsp.rename(filePath + ".rotated", filePath);

        const finalStats = await fsp.stat(filePath);
        console.log(`[ROTATE] ✓ 文件已替换: ${finalStats.size} bytes`);

        await fsp.unlink(backupPath).catch(() => {});
      } catch (rotateError) {
        console.error("旋转失败:", rotateError.message);
        await fsp.rename(backupPath, filePath).catch(() => {});
        throw rotateError;
      }

      const webpDir =
        process.env.UPLOAD_WEBP_DIR || path.join(baseUploadDir, "photos-webp");
      const webpFileName = `${path.parse(photo.storageKey).name}.webp`;
      const webpPath = path.join(webpDir, webpFileName);

      if (
        await fsp
          .access(webpPath)
          .then(() => true)
          .catch(() => false)
      ) {
        try {
          const webpBackupPath = webpPath + ".backup";
          await fsp.copyFile(webpPath, webpBackupPath);

          await sharp(webpPath)
            .rotate(degree)
            .webp({
              quality: 90,
              effort: 6,
            })
            .toFile(webpPath + ".rotated");

          const webpRotatedStats = await fsp.stat(webpPath + ".rotated");
          if (webpRotatedStats.size === 0) {
            throw new ValidationError("WebP 旋转后文件为空");
          }

          await fsp.rename(webpPath + ".rotated", webpPath);
          await fsp.unlink(webpBackupPath).catch(() => {});
        } catch (webpError) {
          console.warn("WebP 旋转失败:", webpError.message);
          await fsp.rename(webpPath + ".backup", webpPath).catch(() => {});
        }
      }

      const thumbnailDir = path.join(uploadDir, "thumbnails");
      const thumbnailKey =
        path.basename(fileKey, path.extname(fileKey)) + "_thumb.jpg";
      const thumbnailPath = path.join(thumbnailDir, thumbnailKey);

      if (
        await fsp
          .access(thumbnailPath)
          .then(() => true)
          .catch(() => false)
      ) {
        try {
          await sharp(filePath)
            .resize(400, 400, { fit: "inside", withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toFile(thumbnailPath + ".rotated");

          await fsp.rename(thumbnailPath + ".rotated", thumbnailPath);
        } catch (thumbError) {
          console.warn("重新生成缩略图失败:", thumbError.message);
        }
      }

      try {
        const imageProcessing = require("../services/imageProcessing");
        const rotatedBuffer = await fsp.readFile(filePath);
        const newThumbHash =
          await imageProcessing.generateThumbHash(rotatedBuffer);
        if (newThumbHash) {
          photo.thumbnailHash = newThumbHash;
        }
      } catch (thumbHashError) {
        console.warn("ThumbHash 生成失败:", thumbHashError.message);
      }

      photo.width = newWidth;
      photo.height = newHeight;

      if (photo.exif) {
        photo.exif.orientation = 1;
      }

      photo.updatedAt = new Date();

      await photo.save();

      ctx.body = Response.success(photo, "图片旋转成功");
    } catch (error) {
      console.error("旋转图片失败:", error);
      throw error;
    }
  }
}

module.exports = new PhotoController();
