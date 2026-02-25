const Photo = require("../models/photo");
const Album = require("../models/album");
const UploadTask = require("../models/uploadTask");
const uploadQueue = require("../services/uploadQueueManager");
const cache = require("../services/cacheService");
const path = require("path");
const fs = require("fs");
const fsp = fs.promises;
const { HttpStatus, Response } = require("../utils/response");

class PhotoController {
  /**
   * 上传照片
   */
  async upload(ctx) {
    try {
      const file = ctx.request.files?.file;

      if (!file) {
        ctx.body = Response.error("请选择要上传的文件", HttpStatus.BAD_REQUEST);
        return;
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
        throw new Error("无法获取上传文件的临时路径");
      }

      // 方法1: 使用 fs.copyFile (跨设备推荐)
      await fsp.copyFile(tempPath, filePath);
      // 删除临时文件
      await fsp.unlink(tempPath).catch(() => {});

      console.log(`文件已保存: ${filePath}`);

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
      console.error("上传失败:", error);
      ctx.body = Response.error(
        `上传失败: ${error.message}`,
        HttpStatus.INTERNAL_ERROR,
      );
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
        ctx.body = Response.error("任务不存在", HttpStatus.NOT_FOUND);
        return;
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
      ctx.body = Response.error(error.message, HttpStatus.INTERNAL_ERROR);
    }
  }

  /**
   * 批量获取任务状态
   */
  async getTaskStatuses(ctx) {
    try {
      const { taskIds } = ctx.request.body || {};

      if (!Array.isArray(taskIds) || taskIds.length === 0) {
        ctx.body = Response.error("taskIds 不能为空", HttpStatus.BAD_REQUEST);
        return;
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
      ctx.body = Response.error(error.message, HttpStatus.INTERNAL_ERROR);
    }
  }

  /**
   * 获取队列统计
   */
  async getQueueStats(ctx) {
    try {
      const stats = await uploadQueue.getStats();
      ctx.body = Response.success(stats, "获取成功");
    } catch (error) {
      ctx.body = Response.error(error.message, HttpStatus.INTERNAL_ERROR);
    }
  }

  /**
   * 获取失败任务列表
   */
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
      ctx.body = Response.error(error.message, HttpStatus.INTERNAL_ERROR);
    }
  }

  /**
   * 重试失败任务
   */
  async retryTask(ctx) {
    try {
      const { taskId } = ctx.params;
      const task = await UploadTask.findOne({ taskId }).lean();

      if (!task) {
        ctx.body = Response.error("任务不存在", HttpStatus.NOT_FOUND);
        return;
      }

      task.status = "pending";
      task.stage = "upload";
      // 重试时重置进度为 5（表示重新处理开始），前端 Math.max 保护会确保不倒退显示
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
      ctx.body = Response.error(error.message, HttpStatus.INTERNAL_ERROR);
    }
  }

  /**
   * 获取照片列表
   */
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
      const cacheKey = `photos:${JSON.stringify(query)}:${page}:${limit}`;

      const cached = await cache.get(cacheKey);
      if (cached) {
        ctx.body = Response.success(
          {
            photos: cached.photos,
            pagination: cached.pagination,
          },
          "获取成功（缓存）",
        );
        return;
      }

      const [photos, total] = await Promise.all([
        Photo.find(query)
          .sort({ sort: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .select("-exif")
          .lean(),
        Photo.countDocuments(query),
      ]);

      const result = {
        photos,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      };

      await cache.set(cacheKey, result, 600);

      ctx.body = Response.success(result, "获取成功");
    } catch (error) {
      ctx.body = Response.error(error.message, HttpStatus.INTERNAL_ERROR);
    }
  }

  /**
   * 获取照片详情
   */
  async getPhotoDetail(ctx) {
    try {
      const { id } = ctx.params;
      const photo = await Photo.findById(id).lean();

      if (!photo) {
        ctx.body = Response.error("照片不存在", HttpStatus.NOT_FOUND);
        return;
      }

      await Photo.findByIdAndUpdate(id, { $inc: { views: 1 } });

      ctx.body = Response.success(photo, "获取成功");
    } catch (error) {
      ctx.body = Response.error(error.message, HttpStatus.INTERNAL_ERROR);
    }
  }

  /**
   * 获取地图数据（聚合位置信息）
   */
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
      ctx.body = Response.error(error.message, HttpStatus.INTERNAL_ERROR);
    }
  }

  /**
   * 删除照片
   */
  async deletePhoto(ctx) {
    try {
      const { id } = ctx.params;
      const photo = await Photo.findById(id).lean();

      if (!photo) {
        ctx.body = Response.error("照片不存在", HttpStatus.NOT_FOUND);
        return;
      }

      // 删除文件
      const baseUploadDir =
        process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
      const uploadDir = path.join(baseUploadDir, "photos");
      const thumbnailDir =
        process.env.THUMBNAIL_DIR || path.join(baseUploadDir, "thumbnails");
      const webpDir =
        process.env.UPLOAD_WEBP_DIR || path.join(baseUploadDir, "photos-webp");

      // 推导 WebP 文件名（基于 storageKey）
      const webpFileName = `${path.parse(photo.storageKey).name}.webp`;

      const fileDeletions = [
        // 删除原始文件
        fsp.unlink(path.join(uploadDir, photo.storageKey)).catch(() => {}),
        // 删除缩略图
        photo.thumbnailKey
          ? fsp
              .unlink(path.join(thumbnailDir, photo.thumbnailKey))
              .catch(() => {})
          : Promise.resolve(),
        // 删除 WebP 文件（根据命名规则推导）
        fsp.unlink(path.join(webpDir, webpFileName)).catch(() => {}),
        // 删除原始高分辨率文件（如果与 storageKey 不同）
        photo.originalKey && photo.originalKey !== photo.storageKey
          ? fsp.unlink(path.join(uploadDir, photo.originalKey)).catch(() => {})
          : Promise.resolve(),
        // 删除 Live Photo 视频文件（如果存在）
        photo.videoKey
          ? fsp.unlink(path.join(uploadDir, photo.videoKey)).catch(() => {})
          : Promise.resolve(),
      ];

      await Promise.all(fileDeletions);
      await photo.deleteOne();

      await cache.delPattern('photos:*');
      await cache.del(`photo:${id}`);

      ctx.body = Response.success(null, "删除成功");
    } catch (error) {
      ctx.body = Response.error(error.message, HttpStatus.INTERNAL_ERROR);
    }
  }

  /**
   * 批量删除照片
   */
  async batchDeletePhotos(ctx) {
    try {
      const { ids } = ctx.request.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        ctx.body = Response.error(
          "请提供要删除的照片ID列表",
          HttpStatus.BAD_REQUEST,
        );
        return;
      }

      console.log(`[BATCH DELETE] 开始批量删除 ${ids.length} 张照片`);

      const photos = await Photo.find({ _id: { $in: ids } }).lean();

      if (photos.length === 0) {
        ctx.body = Response.error("未找到要删除的照片", HttpStatus.NOT_FOUND);
        return;
      }

      const baseUploadDir =
        process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
      const uploadDir = path.join(baseUploadDir, "photos");
      const thumbnailDir =
        process.env.THUMBNAIL_DIR || path.join(baseUploadDir, "thumbnails");
      const webpDir =
        process.env.UPLOAD_WEBP_DIR || path.join(baseUploadDir, "photos-webp");

      // 删除所有相关文件
      const fileDeletions = [];
      for (const photo of photos) {
        const webpFileName = `${path.parse(photo.storageKey).name}.webp`;

        fileDeletions.push(
          fsp.unlink(path.join(uploadDir, photo.storageKey)).catch(() => {}),
          photo.thumbnailKey
            ? fsp
                .unlink(path.join(thumbnailDir, photo.thumbnailKey))
                .catch(() => {})
            : Promise.resolve(),
          fsp.unlink(path.join(webpDir, webpFileName)).catch(() => {}),
          photo.originalKey && photo.originalKey !== photo.storageKey
            ? fsp
                .unlink(path.join(uploadDir, photo.originalKey))
                .catch(() => {})
            : Promise.resolve(),
          photo.videoKey
            ? fsp.unlink(path.join(uploadDir, photo.videoKey)).catch(() => {})
            : Promise.resolve(),
        );
      }

      await Promise.all(fileDeletions);

      // 删除数据库记录
      const result = await Photo.deleteMany({ _id: { $in: ids } });

      console.log(`[BATCH DELETE] 成功删除 ${result.deletedCount} 张照片`);
      ctx.body = Response.success(
        { deletedCount: result.deletedCount },
        `成功删除 ${result.deletedCount} 张照片`,
      );
    } catch (error) {
      console.error("[BATCH DELETE] 批量删除失败:", error);
      ctx.body = Response.error(
        error.message || "批量删除失败",
        HttpStatus.INTERNAL_ERROR,
      );
    }
  }

  /**
   * 更新照片信息
   */
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
        ctx.body = Response.error("照片不存在", HttpStatus.NOT_FOUND);
        return;
      }

      ctx.body = Response.success(photo, "更新成功");
    } catch (error) {
      ctx.body = Response.error(error.message, HttpStatus.INTERNAL_ERROR);
    }
  }

  /**
   * 手动设置照片位置信息
   */
  async updatePhotoLocation(ctx) {
    try {
      const { id } = ctx.params;
      const { latitude, longitude } = ctx.request.body;

      if (typeof latitude !== "number" || typeof longitude !== "number") {
        ctx.body = Response.error("经纬度必须是数字", HttpStatus.BAD_REQUEST);
        return;
      }

      const photo = await Photo.findById(id).lean();
      if (!photo) {
        ctx.body = Response.error("照片不存在", HttpStatus.NOT_FOUND);
        return;
      }

      // 更新位置信息
      photo.location = {
        latitude,
        longitude,
        coordinates: [longitude, latitude],
      };

      // 先保存位置信息
      await photo.save();

      // 异步执行反向地理编码（不阻塞响应）
      const geocoding = require("../services/geocoding");
      geocoding
        .reverseGeocode(latitude, longitude)
        .then(async (geoinfo) => {
          if (geoinfo) {
            photo.geoinfo = geoinfo;
            await photo.save();
            console.log(
              `✅ 照片 ${photo._id} 地理信息已更新:`,
              geoinfo.formatted,
            );
          }
        })
        .catch((geoError) => {
          console.warn(
            `⚠️  照片 ${photo._id} 反向地理编码失败:`,
            geoError.message,
          );
        });

      ctx.body = Response.success(
        photo,
        "位置信息更新成功，地理信息正在后台获取",
      );
    } catch (error) {
      ctx.body = Response.error(error.message, HttpStatus.INTERNAL_ERROR);
    }
  }

  /**
   * 重新获取照片的地理位置信息（基于现有的经纬度）
   */
  async refreshPhotoGeoinfo(ctx) {
    try {
      const { id } = ctx.params;
      const photo = await Photo.findById(id).lean();

      if (!photo) {
        ctx.body = Response.error("照片不存在", HttpStatus.NOT_FOUND);
        return;
      }

      if (!photo.location?.latitude || !photo.location?.longitude) {
        ctx.body = Response.error("照片没有位置信息", HttpStatus.BAD_REQUEST);
        return;
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
      ctx.body = Response.error(error.message, HttpStatus.INTERNAL_ERROR);
    }
  }

  /**
   * 重新提取照片的 EXIF 信息
   */
  async refreshPhotoExif(ctx) {
    try {
      const { id } = ctx.params;
      const photo = await Photo.findById(id).lean();

      if (!photo) {
        ctx.body = Response.error("照片不存在", HttpStatus.NOT_FOUND);
        return;
      }

      // 获取原始文件路径（优先使用 originalKey，因为它保留了完整的 EXIF）
      const baseUploadDir =
        process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
      const uploadDir = path.join(baseUploadDir, "photos");
      const fileKey = photo.originalKey || photo.storageKey;
      const filePath = path.join(uploadDir, fileKey);

      // 检查文件是否存在
      if (
        !(await fsp
          .access(filePath)
          .then(() => true)
          .catch(() => false))
      ) {
        ctx.body = Response.error("原始文件不存在", HttpStatus.NOT_FOUND);
        return;
      }

      // 重新提取 EXIF
      const imageProcessing = require("../services/imageProcessing");
      const exifData = await imageProcessing.extractExif({
        filePath,
        originalFileName: photo.originalFileName,
      });

      // 更新照片信息
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

        // 如果有新的位置信息，也更新地理信息
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
      ctx.body = Response.error(error.message, HttpStatus.INTERNAL_ERROR);
    }
  }

  /**
   * 旋转照片
   */
  async rotatePhoto(ctx) {
    try {
      const { id } = ctx.params;
      const { degree } = ctx.request.body;

      console.log(
        `\n[ROTATE] 接收旋转请求 - Photo ID: ${id}, 角度: ${degree}°`,
      );

      if (!degree || ![90, -90, 180].includes(degree)) {
        ctx.body = Response.error(
          "无效的旋转角度，仅支持 90, -90, 180",
          HttpStatus.BAD_REQUEST,
        );
        return;
      }

      const photo = await Photo.findById(id).lean();
      if (!photo) {
        ctx.body = Response.error("照片不存在", HttpStatus.NOT_FOUND);
        return;
      }

      // 获取原始文件路径
      const baseUploadDir =
        process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
      const uploadDir = path.join(baseUploadDir, "photos");
      const fileKey = photo.originalKey || photo.storageKey;
      const filePath = path.join(uploadDir, fileKey);

      console.log(`[ROTATE] 文件路径: ${filePath}`);

      // 检查文件是否存在
      if (
        !(await fsp
          .access(filePath)
          .then(() => true)
          .catch(() => false))
      ) {
        console.log(`[ROTATE] ❌ 文件不存在`);
        ctx.body = Response.error("原始文件不存在", HttpStatus.NOT_FOUND);
        return;
      }

      console.log(`[ROTATE] ✓ 文件存在`);

      const sharp = require("sharp");
      const fileExt = path.extname(fileKey).toLowerCase();

      // 获取当前图片信息
      let image = sharp(filePath);
      const metadata = await image.metadata();
      console.log(
        `[ROTATE] 原始尺寸: ${metadata.width}x${metadata.height}, 格式: ${metadata.format}`,
      );

      let newWidth = metadata.width;
      let newHeight = metadata.height;

      // 旋转 90 或 -90 度会交换宽高
      if (Math.abs(degree) === 90) {
        const temp = newWidth;
        newWidth = newHeight;
        newHeight = temp;
      }

      // 关键修改：直接使用 toFile 方式，让 sharp 自动处理格式
      // 先备份原文件
      const backupPath = filePath + ".backup";
      await fsp.copyFile(filePath, backupPath);

      try {
        // 创建旋转处理链
        let pipeline = sharp(filePath).rotate(degree);

        // 根据原始格式输出，确保格式一致
        if (fileExt === ".webp") {
          pipeline = pipeline.webp({
            quality: 90,
            effort: 6, // 增加压缩努力
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
          // 默认使用原格式
          pipeline = pipeline.withMetadata();
        }

        // 写入文件
        await pipeline.toFile(filePath + ".rotated");

        // 验证文件是否创建成功
        const rotatedStats = await fsp.stat(filePath + ".rotated");
        console.log(`[ROTATE] ✓ 旋转文件已创建: ${rotatedStats.size} bytes`);

        if (rotatedStats.size === 0) {
          throw new Error("旋转后文件为空");
        }

        // 替换原文件
        await fsp.rename(filePath + ".rotated", filePath);

        // 验证替换后的文件
        const finalStats = await fsp.stat(filePath);
        console.log(`[ROTATE] ✓ 文件已替换: ${finalStats.size} bytes`);

        // 删除备份文件
        await fsp.unlink(backupPath).catch(() => {});

        console.log("[ROTATE] ✓ 文件旋转成功");
      } catch (rotateError) {
        console.error("[ROTATE] ❌ 旋转失败:", rotateError.message);
        // 恢复备份
        await fsp.rename(backupPath, filePath).catch(() => {});
        throw rotateError;
      }

      // 同步旋转 WebP 版本（如果存在）
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
          console.log(`[ROTATE] 旋转 WebP: ${webpPath}`);
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
            throw new Error("WebP 旋转后文件为空");
          }

          await fsp.rename(webpPath + ".rotated", webpPath);
          await fsp.unlink(webpBackupPath).catch(() => {});
          console.log("[ROTATE] ✓ WebP 旋转成功");
        } catch (webpError) {
          console.warn("[ROTATE] ⚠️ WebP 旋转失败:", webpError.message);
          await fsp.rename(webpPath + ".backup", webpPath).catch(() => {});
        }
      }

      // 重新生成缩略图（如果存在）
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
          console.log(`[ROTATE] 重新生成缩略图: ${thumbnailPath}`);
          await sharp(filePath)
            .resize(400, 400, { fit: "inside", withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toFile(thumbnailPath + ".rotated");

          await fsp.rename(thumbnailPath + ".rotated", thumbnailPath);
          console.log("[ROTATE] ✓ 缩略图生成成功");
        } catch (thumbError) {
          console.warn("[ROTATE] ⚠️ 重新生成缩略图失败:", thumbError.message);
        }
      }

      // 重新生成 ThumbHash（用于模糊占位图）
      try {
        console.log("[ROTATE] 重新生成 ThumbHash...");
        const imageProcessing = require("../services/imageProcessing");
        const rotatedBuffer = await fsp.readFile(filePath);
        const newThumbHash = await imageProcessing.generateThumbHash(rotatedBuffer);
        if (newThumbHash) {
          photo.thumbnailHash = newThumbHash;
          console.log("[ROTATE] ✓ ThumbHash 生成成功");
        }
      } catch (thumbHashError) {
        console.warn("[ROTATE] ⚠️ ThumbHash 生成失败:", thumbHashError.message);
      }

      // 更新数据库中的尺寸信息
      photo.width = newWidth;
      photo.height = newHeight;

      // 更新 EXIF 信息中的方向标记（设为 1，表示正常）
      if (photo.exif) {
        photo.exif.orientation = 1;
      }

      // 关键：更新 updatedAt 时间戳，这样前端可以用时间戳清除缓存
      photo.updatedAt = new Date();

      await photo.save();

      console.log(
        `[ROTATE] ✓ 数据库已更新: ${newWidth}x${newHeight}, updatedAt: ${photo.updatedAt}`,
      );
      ctx.body = Response.success(photo, "图片旋转成功");
    } catch (error) {
      console.error("[ROTATE] ❌ 旋转图片失败:", error);
      ctx.body = Response.error(
        error.message || "旋转图片失败",
        HttpStatus.INTERNAL_ERROR,
      );
    }
  }
}

module.exports = new PhotoController();
