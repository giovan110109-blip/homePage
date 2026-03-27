const Photo = require("../models/photo");
const Album = require("../models/album");
const UploadTask = require("../models/uploadTask");
const uploadQueue = require("../services/uploadQueueManager");
const imageProcessing = require("../services/imageProcessing");
const geocoding = require("../services/geocoding");
const {
  extractBaseNameFromFilename,
} = require("../services/upload/photoUtils");
const path = require("path");
const fs = require("fs");
const fsp = fs.promises;
const { HttpStatus, Response } = require("../utils/response");
const {
  NotFoundError,
  ValidationError,
  InternalError,
} = require("../utils/errors");

const IMAGE_EXTS = [
  ".jpg", ".jpeg", ".png", ".heic", ".heif", ".webp", ".gif", ".tiff", ".tif"
];

const VIDEO_EXTS = [".mp4", ".mov", ".avi", ".mkv", ".m4v"];

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

  getTaskOwnerQuery(ctx) {
    const uploadedBy = ctx.state.user?._id;
    if (!uploadedBy) {
      throw new ValidationError("未登录");
    }
    return { uploadedBy };
  }

  serializeTask(task) {
    return {
      taskId: task.taskId,
      status: task.status,
      stage: task.stage,
      progress: task.progress,
      error: task.error,
      photoId: task.photoId,
    };
  }

  getDateTakenFromExif(exifData = {}) {
    const candidates = [
      exifData.DateTimeOriginal,
      exifData.CreateDate,
      exifData.DateCreated,
      exifData.DateTimeDigitized,
      exifData.ModifyDate,
    ];

    for (const value of candidates) {
      if (!value) continue;
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }

    return null;
  }

  buildPhotoLocation(location) {
    if (location?.latitude == null || location?.longitude == null) {
      return null;
    }

    return {
      latitude: location.latitude,
      longitude: location.longitude,
      altitude: location.altitude,
      coordinates: [location.longitude, location.latitude],
    };
  }

  buildCameraFromExif(exifData = {}) {
    const camera = {
      make: exifData.Make,
      model: exifData.Model,
      lens: exifData.LensModel,
      focalLength: exifData.FocalLength,
      aperture: exifData.FNumber,
      shutterSpeed: exifData.ExposureTime,
      iso: exifData.ISO,
      flash: exifData.Flash,
      exposureProgram: exifData.ExposureProgram,
    };

    const hasCameraData = Object.values(camera).some(
      (value) => value !== undefined && value !== null && value !== ""
    );

    return hasCameraData ? camera : null;
  }

  async fileExists(filePath) {
    return fsp
      .access(filePath)
      .then(() => true)
      .catch(() => false);
  }

  getPhotoStorageInfo(photo) {
    const baseUploadDir =
      process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
    const uploadDir = path.join(baseUploadDir, "photos");
    const webpDir =
      process.env.UPLOAD_WEBP_DIR || path.join(baseUploadDir, "photos-webp");
    const fileKey = photo.originalKey || photo.storageKey;
    const filePath = path.join(uploadDir, fileKey);
    const webpFileName = `${path.parse(photo.storageKey).name}.webp`;
    const webpPath = path.join(webpDir, webpFileName);

    return {
      baseUploadDir,
      uploadDir,
      webpDir,
      fileKey,
      filePath,
      webpFileName,
      webpPath,
    };
  }

  applyImageOutputFormat(image, fileExt, options = {}) {
    const { keepMetadata = false, metadataOrientation = 1 } = options;
    let pipeline = image;

    if (keepMetadata) {
      pipeline = pipeline.withMetadata({ orientation: metadataOrientation });
    }

    if (fileExt === ".webp") {
      return pipeline.webp({
        quality: 90,
        effort: 6,
      });
    }

    if (fileExt === ".png") {
      return pipeline.png({
        quality: 90,
        effort: 9,
      });
    }

    if (fileExt === ".jpg" || fileExt === ".jpeg") {
      return pipeline.jpeg({
        quality: 90,
        progressive: true,
        mozjpeg: true,
      });
    }

    if (fileExt === ".gif") {
      return pipeline.gif();
    }

    return pipeline;
  }

  async replaceFileWithBuffer(filePath, buffer) {
    const backupPath = `${filePath}.backup`;
    const tempPath = `${filePath}.tmp`;

    if (await this.fileExists(filePath)) {
      await fsp.copyFile(filePath, backupPath);
    }

    try {
      await fsp.writeFile(tempPath, buffer);

      const nextStats = await fsp.stat(tempPath);
      if (!nextStats.size) {
        throw new ValidationError("生成的文件为空");
      }

      await fsp.rename(tempPath, filePath);
      await fsp.unlink(backupPath).catch(() => {});
    } catch (error) {
      await fsp.unlink(tempPath).catch(() => {});
      if (await this.fileExists(backupPath)) {
        await fsp.rename(backupPath, filePath).catch(() => {});
      }
      throw error;
    }
  }

  async syncPhotoExifFields(photo, exifData = {}, options = {}) {
    const { refreshGeoinfo = false } = options;

    photo.exif = exifData || {};

    const dateTaken = this.getDateTakenFromExif(exifData);
    if (dateTaken) {
      photo.dateTaken = dateTaken;
    }

    const location = imageProcessing.parseGPSCoordinates(exifData);
    if (location) {
      photo.location = this.buildPhotoLocation(location);

      if (refreshGeoinfo) {
        try {
          const geoinfo = await geocoding.reverseGeocode(
            location.latitude,
            location.longitude
          );
          if (geoinfo) {
            photo.geoinfo = geoinfo;
          }
        } catch (geoError) {
          console.warn("反向地理编码失败:", geoError.message);
        }
      }
    }

    const camera = this.buildCameraFromExif(exifData);
    if (camera) {
      photo.camera = camera;
    }
  }

  async rebuildPhotoDerivedAssets(photo, displayBuffer, options = {}) {
    const { webpPath } = this.getPhotoStorageInfo(photo);
    const metadata = await imageProcessing.getImageMetadata(displayBuffer, 1);

    await fsp.mkdir(path.dirname(webpPath), { recursive: true });

    const webpBuffer = await imageProcessing.generateThumbnail(displayBuffer, {
      width: 600,
      quality: 85,
      format: "webp",
    });

    await this.replaceFileWithBuffer(webpPath, webpBuffer);

    let thumbnailHash = photo.thumbnailHash || null;
    let thumbnailUrl = photo.thumbnailUrl || null;

    try {
      const nextThumbnailHash = await imageProcessing.generateThumbHash(
        displayBuffer,
        1
      );
      if (nextThumbnailHash) {
        thumbnailHash = nextThumbnailHash;
        thumbnailUrl = await imageProcessing.thumbHashToDataURL(
          nextThumbnailHash
        );
      }
    } catch (thumbHashError) {
      console.warn("ThumbHash 生成失败:", thumbHashError.message);
    }

    photo.width = metadata.width;
    photo.height = metadata.height;
    photo.aspectRatio =
      metadata.width && metadata.height
        ? metadata.width / metadata.height
        : photo.aspectRatio;
    photo.thumbnailHash = thumbnailHash;
    photo.thumbnailUrl = thumbnailUrl;

    return metadata;
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
      const isImage =
        mimeType.startsWith("image/") || IMAGE_EXTS.includes(extLower);
      const isVideo =
        mimeType.startsWith("video/") || VIDEO_EXTS.includes(extLower);

      let pairedFile = null;
      let isLivePhoto = false;

      if (isImage || isVideo) {
        // 查找所有文件
        const allFiles = await fsp.readdir(uploadDir);
        const pairCandidates = [];

        // 查找同名但不同类型的文件
        for (const existingFile of allFiles) {
          const existingBaseName = extractBaseNameFromFilename(existingFile);
          const existingExt = path.extname(existingFile).toLowerCase();

          // 名字匹配且类型不同（比较原始 baseName）
          if (existingBaseName === baseName && existingFile !== filename) {
            if (isImage && VIDEO_EXTS.includes(existingExt)) {
              pairCandidates.push(existingFile);
            } else if (isVideo && IMAGE_EXTS.includes(existingExt)) {
              pairCandidates.push(existingFile);
            }
          }
        }

        if (pairCandidates.length > 0) {
          const candidateStats = await Promise.all(
            pairCandidates.map(async (candidate) => {
              try {
                const stats = await fsp.stat(path.join(uploadDir, candidate));
                return { candidate, mtimeMs: stats.mtimeMs || 0 };
              } catch {
                return { candidate, mtimeMs: 0 };
              }
            })
          );

          candidateStats.sort((a, b) => b.mtimeMs - a.mtimeMs);
          pairedFile = candidateStats[0]?.candidate || null;
          isLivePhoto = Boolean(pairedFile);
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
      const task = await uploadQueue.getTaskStatus(
        taskId,
        this.getTaskOwnerQuery(ctx)
      );

      if (!task) {
        throw new NotFoundError("任务不存在");
      }

      ctx.body = Response.success(this.serializeTask(task), "获取成功");
    } catch (error) {
      throw error;
    }
  }

  async getTaskStatuses(ctx) {
    try {
      const { taskIds } = ctx.request.body || {};
      const ownerQuery = this.getTaskOwnerQuery(ctx);

      if (!Array.isArray(taskIds) || taskIds.length === 0) {
        throw new ValidationError("taskIds 不能为空");
      }

      const tasks = await UploadTask.find({
        ...ownerQuery,
        taskId: { $in: taskIds },
      }).lean();

      const data = taskIds.map((id) => {
        const task = tasks.find((t) => t.taskId === id);
        if (!task) {
          return {
            taskId: id,
            status: "not_found",
          };
        }

        return this.serializeTask(task);
      });

      ctx.body = Response.success({ tasks: data }, "获取成功");
    } catch (error) {
      throw error;
    }
  }

  async getQueueStats(ctx) {
    try {
      const stats = await uploadQueue.getStats(this.getTaskOwnerQuery(ctx));
      ctx.body = Response.success(stats, "获取成功");
    } catch (error) {
      throw error;
    }
  }

  async getFailedTasks(ctx) {
    try {
      const { page = 1, limit = 20 } = ctx.query;
      const ownerQuery = this.getTaskOwnerQuery(ctx);
      const pageNum = Math.max(parseInt(page, 10) || 1, 1);
      const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
      const skip = (pageNum - 1) * limitNum;

      const [tasks, total] = await Promise.all([
        UploadTask.find({ ...ownerQuery, status: "failed" })
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        UploadTask.countDocuments({ ...ownerQuery, status: "failed" }),
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
      const task = await UploadTask.findOne({
        taskId,
        ...this.getTaskOwnerQuery(ctx),
      });

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
      const locationGroups = await Photo.aggregate([
        {
          $match: {
            status: "completed",
            visibility: "public",
            "location.latitude": { $exists: true, $ne: null },
            "location.longitude": { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: {
              lat: { $round: ["$location.latitude", 3] },
              lng: { $round: ["$location.longitude", 3] },
            },
            city: { $first: "$geoinfo.city" },
            country: { $first: "$geoinfo.country" },
            count: { $sum: 1 },
            photos: { $push: "$$ROOT" },
          },
        },
        {
          $project: {
            _id: 0,
            city: { $ifNull: ["$city", "$country", "Unknown"] },
            location: {
              latitude: "$_id.lat",
              longitude: "$_id.lng",
            },
            count: 1,
            photos: {
              $slice: [
                {
                  $map: {
                    input: { $slice: ["$photos", 50] },
                    as: "photo",
                    in: {
                      _id: "$$photo._id",
                      title: "$$photo.title",
                      thumbnailUrl: "$$photo.thumbnailUrl",
                      originalUrl: "$$photo.originalUrl",
                      originalFileUrl: "$$photo.originalFileUrl",
                      dateTaken: "$$photo.dateTaken",
                      width: "$$photo.width",
                      height: "$$photo.height",
                      thumbnailHash: "$$photo.thumbnailHash",
                      isLive: "$$photo.isLive",
                      videoUrl: "$$photo.videoUrl",
                    },
                  },
                },
                50,
              ],
            },
          },
        },
        { $sort: { count: -1 } },
      ]);

      ctx.body = Response.success(locationGroups, "获取成功");
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

      const { filePath, fileKey } = this.getPhotoStorageInfo(photo);

      if (!(await this.fileExists(filePath))) {
        throw new NotFoundError("原始文件不存在");
      }

      const sourceBuffer = await fsp.readFile(filePath);
      const extractedExif = await imageProcessing.extractExif({
        filePath,
        originalFileName: photo.originalFileName || fileKey,
      });
      const exifData = {
        ...(photo.exif || {}),
        ...(extractedExif || {}),
      };

      const orientation = imageProcessing.getOrientationValue(
        exifData?.Orientation
      );
      const displayBuffer =
        orientation === 1
          ? sourceBuffer
          : await imageProcessing.rotateByOrientation(sourceBuffer, orientation);

      await this.syncPhotoExifFields(photo, exifData, { refreshGeoinfo: true });
      await this.rebuildPhotoDerivedAssets(photo, displayBuffer);

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

      const { filePath, fileKey } = this.getPhotoStorageInfo(photo);

      if (!(await this.fileExists(filePath))) {
        throw new NotFoundError("原始文件不存在");
      }

      const originalBuffer = await fsp.readFile(filePath);
      const extractedCurrentExif = await imageProcessing.extractExif({
        filePath,
        originalFileName: photo.originalFileName || fileKey,
      });
      const currentExif = {
        ...(photo.exif || {}),
        ...(extractedCurrentExif || {}),
      };
      const currentOrientation = imageProcessing.getOrientationValue(
        currentExif?.Orientation ?? photo.exif?.Orientation
      );
      const fileExt = path.extname(fileKey).toLowerCase();

      const displayBuffer =
        currentOrientation === 1
          ? originalBuffer
          : await imageProcessing.rotateByOrientation(
              originalBuffer,
              currentOrientation
            );

      let rotatedImage = imageProcessing.createSharpInstance(displayBuffer);
      rotatedImage = rotatedImage.rotate(degree);
      rotatedImage = this.applyImageOutputFormat(rotatedImage, fileExt, {
        keepMetadata: true,
        metadataOrientation: 1,
      });

      const rotatedOriginalBuffer = await rotatedImage.toBuffer();
      if (!rotatedOriginalBuffer.length) {
        throw new ValidationError("旋转后文件为空");
      }

      await this.replaceFileWithBuffer(filePath, rotatedOriginalBuffer);

      const rotatedMetadata = await this.rebuildPhotoDerivedAssets(
        photo,
        rotatedOriginalBuffer
      );

      const syncedExifFromFile = await imageProcessing.extractExif({
        filePath,
        originalFileName: photo.originalFileName || fileKey,
      });
      const mergedExif = imageProcessing.updateExifOrientationAndDimensions(
        {
          ...(currentExif || {}),
          ...(syncedExifFromFile || {}),
        },
        rotatedMetadata.width,
        rotatedMetadata.height
      );

      await this.syncPhotoExifFields(photo, mergedExif, {
        refreshGeoinfo: false,
      });

      await photo.save();

      ctx.body = Response.success(photo, "图片旋转成功");
    } catch (error) {
      console.error("旋转图片失败:", error);
      throw error;
    }
  }
}

module.exports = new PhotoController();
