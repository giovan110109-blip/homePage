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
const sharp = require("sharp");
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
  isAdminRequest(ctx) {
    return ctx.path.startsWith("/api/admin/");
  }

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
        sortBy,
        sortOrder,
      } = ctx.query;

      const query = { status: "completed" };
      const isAdminRequest = this.isAdminRequest(ctx);
      const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
      const parsedLimit = Math.min(
        Math.max(parseInt(limit, 10) || 20, 1),
        200,
      );

      if (isAdminRequest && visibility) {
        query.visibility = visibility;
      } else if (!isAdminRequest) {
        query.visibility = "public";
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

      const skip = (parsedPage - 1) * parsedLimit;
      const normalizedSortBy = ["sort", "dateTaken", "createdAt", "updatedAt"].includes(sortBy)
        ? sortBy
        : "sort";
      const normalizedSortOrder = sortOrder === "asc" ? 1 : -1;
      const sortQuery = normalizedSortBy === "sort"
        ? { sort: normalizedSortOrder, createdAt: normalizedSortOrder }
        : {
            [normalizedSortBy]: normalizedSortOrder,
            createdAt: normalizedSortOrder,
          };

      const [photos, total] = await Promise.all([
        Photo.find(query)
          .sort(sortQuery)
          .skip(skip)
          .limit(parsedLimit)
          .select("-exif")
          .lean(),
        Photo.countDocuments(query),
      ]);

      const updatedPhotos = this.processPhotos(photos);

      const result = {
        photos: updatedPhotos,
        pagination: {
          total,
          page: parsedPage,
          limit: parsedLimit,
          pages: Math.ceil(total / parsedLimit),
          totalPages: Math.ceil(total / parsedLimit),
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
      const query = { _id: id };

      if (!this.isAdminRequest(ctx)) {
        query.status = "completed";
        query.visibility = "public";
      }

      const photo = await Photo.findOne(query).lean();

      if (!photo) {
        throw new NotFoundError("照片不存在");
      }

      await Photo.findByIdAndUpdate(id, { $inc: { views: 1 } });

      ctx.body = Response.success(photo, "获取成功");
    } catch (error) {
      throw error;
    }
  }

  async getPhotoShareImage(ctx) {
    try {
      const { id } = ctx.params;
      const query = { _id: id, status: "completed", visibility: "public" };
      const photo = await Photo.findOne(query).lean();

      if (!photo) {
        throw new NotFoundError("照片不存在");
      }

      const { filePath, webpPath } = this.getPhotoStorageInfo(photo);
      const sourcePath = (await this.fileExists(filePath)) ? filePath : webpPath;

      if (!(await this.fileExists(sourcePath))) {
        throw new NotFoundError("照片源文件不存在");
      }

      const width = 1200;
      const height = 630;
      const cardX = 58;
      const cardY = 58;
      const cardWidth = 1084;
      const cardHeight = 514;
      const imageWidth = 492;
      const imageHeight = 402;
      const imageX = 94;
      const imageY = 114;
      const rightX = 640;
      const overlayHeight = 200;
      const title = (photo.title || "Giovan Photo").trim();
      const description = (photo.description || "分享这张照片").trim();
      const dateLabel = photo.dateTaken
        ? new Date(photo.dateTaken).toISOString().slice(0, 10)
        : "Unknown Date";
      const locationLabel =
        photo.geoinfo?.city ||
        photo.geoinfo?.region ||
        photo.geoinfo?.country ||
        photo.geoinfo?.locationName ||
        "Somewhere";

      const escapeXml = (value = "") =>
        String(value)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\"/g, "&quot;")
          .replace(/'/g, "&apos;");

      const truncate = (value = "", maxLength = 120) => {
        const normalized = String(value).replace(/\s+/g, " ").trim();
        if (!normalized) return "";
        if (normalized.length <= maxLength) return normalized;
        return `${normalized.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
      };
      const wrapLines = (value = "", maxCharsPerLine = 18, maxLines = 3) => {
        const normalized = truncate(value, maxCharsPerLine * maxLines + 8);
        const lines = [];

        for (
          let index = 0;
          index < normalized.length && lines.length < maxLines;
          index += maxCharsPerLine
        ) {
          lines.push(normalized.slice(index, index + maxCharsPerLine));
        }

        if (
          normalized.length > maxCharsPerLine * maxLines &&
          lines.length > 0
        ) {
          const lastIndex = lines.length - 1;
          lines[lastIndex] = `${lines[lastIndex].slice(0, -1)}…`;
        }

        return lines;
      };

      const imageBuffer = await sharp(sourcePath)
        .rotate()
        .resize(imageWidth, imageHeight, {
          fit: "cover",
          position: "centre",
        })
        .jpeg({ quality: 88 })
        .toBuffer();

      const blurredBackground = await sharp(sourcePath)
        .rotate()
        .resize(width, height, {
          fit: "cover",
          position: "centre",
        })
        .blur(20)
        .modulate({ brightness: 0.65, saturation: 1.08 })
        .jpeg({ quality: 82 })
        .toBuffer();

      const titleLines = wrapLines(title, 14, 2);
      const descriptionLines = wrapLines(description, 30, 3);
      const metaText = escapeXml(`${dateLabel} / ${locationLabel}`);

      const overlaySvg = Buffer.from(`
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="pageGlow" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
              <stop stop-color="#0F172A"/>
              <stop offset="0.45" stop-color="#111827"/>
              <stop offset="1" stop-color="#020617"/>
            </linearGradient>
            <linearGradient id="cardGlow" x1="58" y1="58" x2="1142" y2="572" gradientUnits="userSpaceOnUse">
              <stop stop-color="rgba(255,255,255,0.22)"/>
              <stop offset="1" stop-color="rgba(255,255,255,0.08)"/>
            </linearGradient>
            <linearGradient id="imageFade" x1="0" y1="0" x2="0" y2="1">
              <stop stop-color="rgba(255,255,255,0)"/>
              <stop offset="1" stop-color="rgba(2,6,23,0.28)"/>
            </linearGradient>
          </defs>
          <rect width="${width}" height="${height}" fill="url(#pageGlow)"/>
          <circle cx="1045" cy="88" r="190" fill="rgba(56,189,248,0.20)"/>
          <circle cx="168" cy="566" r="220" fill="rgba(244,114,182,0.14)"/>
          <rect x="${cardX}" y="${cardY}" width="${cardWidth}" height="${cardHeight}" rx="36" fill="rgba(10,14,24,0.58)" stroke="rgba(255,255,255,0.18)" stroke-width="1.5"/>
          <rect x="${cardX}" y="${cardY}" width="${cardWidth}" height="${cardHeight}" rx="36" fill="url(#cardGlow)"/>
          <rect x="${imageX}" y="${imageY}" width="${imageWidth}" height="${imageHeight}" rx="28" fill="rgba(15,23,42,0.55)"/>
          <rect x="${imageX}" y="${imageY + imageHeight - overlayHeight}" width="${imageWidth}" height="${overlayHeight}" rx="0" fill="url(#imageFade)"/>
          <text x="${rightX}" y="150" fill="rgba(255,255,255,0.72)" font-size="22" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif" letter-spacing="3">PHOTO STORY</text>
          <text x="${rightX}" y="218" fill="#FFFFFF" font-size="54" font-weight="700" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif">
            ${titleLines
              .map((line, index) => `<tspan x="${rightX}" dy="${index === 0 ? 0 : 64}">${escapeXml(line)}</tspan>`)
              .join("")}
          </text>
          <text x="${rightX}" y="336" fill="rgba(226,232,240,0.88)" font-size="26" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif">
            ${descriptionLines
              .map((line, index) => `<tspan x="${rightX}" dy="${index === 0 ? 0 : 36}">${escapeXml(line)}</tspan>`)
              .join("")}
          </text>
          <rect x="${rightX}" y="352" width="228" height="48" rx="24" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.14)"/>
          <text x="${rightX + 26}" y="383" fill="#F8FAFC" font-size="21" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif">${metaText}</text>
          <text x="${rightX}" y="468" fill="rgba(148,163,184,0.92)" font-size="22" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif">Giovan Gallery</text>
          <text x="${rightX}" y="505" fill="rgba(255,255,255,0.96)" font-size="28" font-weight="600" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif">Share this frame</text>
        </svg>
      `);

      const roundedMaskSvg = Buffer.from(`
        <svg width="${imageWidth}" height="${imageHeight}" viewBox="0 0 ${imageWidth} ${imageHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${imageWidth}" height="${imageHeight}" rx="28" fill="#fff"/>
        </svg>
      `);

      const roundedImage = await sharp(imageBuffer)
        .composite([{ input: roundedMaskSvg, blend: "dest-in" }])
        .png()
        .toBuffer();

      const output = await sharp(blurredBackground)
        .composite([
          { input: overlaySvg },
          { input: roundedImage, left: imageX, top: imageY },
        ])
        .png()
        .toBuffer();

      ctx.type = "image/png";
      ctx.set("Cache-Control", "public, max-age=300, s-maxage=3600");
      ctx.body = output;
    } catch (error) {
      throw error;
    }
  }

  async getPhotoSharePage(ctx) {
    try {
      const { id } = ctx.params;
      const query = { _id: id, status: "completed", visibility: "public" };
      const photo = await Photo.findOne(query).lean();

      if (!photo) {
        throw new NotFoundError("照片不存在");
      }

      const escapeHtml = (value = "") =>
        String(value)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");

      const truncate = (value = "", maxLength = 160) => {
        const normalized = String(value).replace(/\s+/g, " ").trim();
        if (!normalized) return "";
        if (normalized.length <= maxLength) return normalized;
        return `${normalized.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
      };

      const locationLabel =
        photo.geoinfo?.city ||
        photo.geoinfo?.region ||
        photo.geoinfo?.country ||
        photo.geoinfo?.locationName ||
        "";
      const dateLabel = photo.dateTaken
        ? new Date(photo.dateTaken).toISOString().slice(0, 10)
        : "";
      const title = truncate(photo.title || "Giovan Gallery", 70);
      const description = truncate(
        [
          photo.description || "",
          [dateLabel, locationLabel].filter(Boolean).join(" · "),
        ]
          .filter(Boolean)
          .join(" | ") || "查看这张照片的拍摄信息与分享卡片",
        180,
      );

      const shareImageUrl = new URL(
        `/api/photos/${photo._id}/share-image`,
        ctx.origin,
      ).toString();
      const sharePageUrl = new URL(
        `/api/photos/${photo._id}/share`,
        ctx.origin,
      ).toString();
      const targetUrl = new URL(
        `/#/gallery?photoId=${photo._id}`,
        ctx.origin,
      ).toString();

      ctx.type = "text/html; charset=utf-8";
      ctx.set("Cache-Control", "public, max-age=300, s-maxage=3600");
      ctx.body = `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(sharePageUrl)}" />
    <meta property="og:image" content="${escapeHtml(shareImageUrl)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(shareImageUrl)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(shareImageUrl)}" />
    <meta http-equiv="refresh" content="0;url=${escapeHtml(targetUrl)}" />
    <link rel="canonical" href="${escapeHtml(targetUrl)}" />
    <script>
      window.location.replace(${JSON.stringify(targetUrl)});
    </script>
  </head>
  <body>
    <p>Redirecting to <a href="${escapeHtml(targetUrl)}">${escapeHtml(targetUrl)}</a></p>
  </body>
</html>`;
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
