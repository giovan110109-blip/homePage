const EventEmitter = require("events");
const path = require("path");
const fs = require("fs").promises;
const os = require("os");
const UploadTask = require("../models/uploadTask");
const Photo = require("../models/photo");
const imageProcessing = require("./imageProcessing");
const videoOptimizer = require("./videoOptimizer");
const geocoding = require("./geocoding");
const imageTagService = require("./imageTagService");
const queueService = require("./queueService");
const {
  isLikelyLiveVideo,
  LIVEPHOTO_MAX_TIME_DIFF_MS,
} = require("./photoUtils");

const QUEUE_NAME = "upload:queue";

class UploadQueueManager extends EventEmitter {
  constructor() {
    super();
    this.isRunning = false;
    this.concurrency = parseInt(process.env.UPLOAD_CONCURRENCY || "4");
    this.activeWorkers = 0;
    this.consumerId = null;
    const baseUploadDir =
      process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
    this.uploadDir =
      process.env.UPLOAD_PHOTOS_DIR || path.join(baseUploadDir, "photos");
    this.webpDir =
      process.env.UPLOAD_WEBP_DIR || path.join(baseUploadDir, "photos-webp");

    const CDN_ENABLED = process.env.CDN_ENABLED === "true";
    const CDN_BASE_URL = process.env.CDN_BASE_URL || "";
    const LOCAL_BASE_URL =
      process.env.UPLOAD_BASE_URL_SERVER + process.env.UPLOAD_BASE_URL;

    this.uploadBaseUrl =
      CDN_ENABLED && CDN_BASE_URL ? CDN_BASE_URL : LOCAL_BASE_URL;
    this.uploadBaseUrl = this.uploadBaseUrl.replace(/\/$/, "");
  }

  async start() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    this.consumerId = `consumer-${Date.now()}`;

    while (this.isRunning) {
      try {
        const tasks = await queueService.getPendingTasks(
          QUEUE_NAME,
          this.concurrency,
        );

        if (tasks.length === 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }

        for (const task of tasks) {
          if (this.activeWorkers >= this.concurrency) {
            break;
          }

          this.processTask(task).catch((err) => {
            console.error(`任务 ${task.id} 处理失败:`, err);
            queueService.failTask(QUEUE_NAME, task.id, err);
          });
        }
      } catch (error) {
        console.error("处理队列出错:", error);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  stop() {
    this.isRunning = false;
  }

  async processTask(task) {
    this.activeWorkers++;
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "upload-"));

    try {
      console.log(`开始处理任务: ${task.id}`);

      await UploadTask.findOneAndUpdate(
        { taskId: task.id },
        { status: "processing", attempts: { $inc: 1 } },
      );

      this.emit("taskStarted", task);

      const filePath = path.join(this.uploadDir, task.storageKey);
      const derivedBaseName = this.extractBaseName(task);

      const fileType = this.detectFileType(task);

      if (fileType.isVideo) {
        await this.handleVideoTask(task, filePath, derivedBaseName);
        return;
      }

      const fileBuffer = await fs.readFile(filePath);

      const isVideoByContent = await this.detectVideoFromContent(fileBuffer);
      if (isVideoByContent) {
        await this.handleVideoTask(task, filePath, derivedBaseName);
        return;
      }

      await this.handleImageTask(
        task,
        fileBuffer,
        tempDir,
        filePath,
        derivedBaseName,
      );
    } catch (error) {
      console.error(`任务 ${task.id} 处理失败:`, error);
      await queueService.failTask(QUEUE_NAME, task.id, error);
    } finally {
      this.activeWorkers--;
    }
  }

  extractBaseName(task) {
    return (
      task.baseName ||
      (task.storageKey
        ? task.storageKey
            .replace(/_\d{13}(?=\.[^.]+$)/, "")
            .replace(/\.[^.]+$/, "")
        : "") ||
      (task.originalFileName
        ? task.originalFileName.replace(/\.[^/.]+$/, "")
        : "")
    );
  }

  detectFileType(task) {
    const videoExts = [".mp4", ".mov", ".avi", ".mkv", ".m4v"];
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
    const storageExt = path.extname(task.storageKey || "").toLowerCase();
    const originalExt = path.extname(task.originalFileName || "").toLowerCase();
    const isImageByExt =
      imageExts.includes(storageExt) || imageExts.includes(originalExt);
    const isVideoByExt =
      videoExts.includes(storageExt) || videoExts.includes(originalExt);
    const isImage = task.mimeType?.startsWith("image/") || isImageByExt;
    const isVideo =
      task.mimeType?.startsWith("video/") || (isVideoByExt && !isImage);

    return { isVideo, isImage };
  }

  async detectVideoFromContent(fileBuffer) {
    try {
      const fileType = await import("file-type");
      const { fileTypeFromBuffer } = fileType;
      const detected = await fileTypeFromBuffer(fileBuffer);
      const detectedExt = detected?.ext ? `.${detected.ext}`.toLowerCase() : "";
      const detectedMime = detected?.mime || "";

      const videoExts = [".mp4", ".mov", ".avi", ".mkv", ".m4v"];
      return (
        detectedMime.startsWith("video/") || videoExts.includes(detectedExt)
      );
    } catch (err) {
      console.error("内容类型检测失败，继续走原逻辑:", err);
      return false;
    }
  }

  async handleVideoTask(task, filePath, derivedBaseName) {
    const videoExt = path.extname(task.storageKey).toLowerCase();
    let optimizedVideoKey = task.storageKey;

    if (videoExt === ".mov") {
      const baseName = path.parse(task.storageKey).name;
      const optimizedPath = path.join(
        this.uploadDir,
        `${baseName}_optimized.mp4`,
      );

      const result = await videoOptimizer
        .quickOptimizeMOV(filePath, optimizedPath)
        .catch((err) => {
          console.warn("视频优化失败，使用原始文件:", err.message);
          return { success: false };
        });

      if (result.success) {
        await fs.unlink(filePath).catch(() => {});
        optimizedVideoKey = `${baseName}_optimized.mp4`;
        task.storageKey = optimizedVideoKey;
      }
    }

    const existingPhoto = await this.findExistingPhoto(derivedBaseName);

    if (existingPhoto) {
      await this.updateExistingPhotoWithVideo(
        existingPhoto,
        optimizedVideoKey,
        derivedBaseName,
      );
    } else {
      await this.createPlaceholderPhoto(
        task,
        optimizedVideoKey,
        derivedBaseName,
      );
    }
  }

  async findExistingPhoto(derivedBaseName) {
    if (!derivedBaseName) return null;

    return await Photo.findOne({
      $or: [
        { baseName: derivedBaseName },
        { originalFileName: { $regex: `^${derivedBaseName}\\.` } },
        { storageKey: { $regex: `^${derivedBaseName}_` } },
      ],
    });
  }

  async updateExistingPhotoWithVideo(photo, videoKey, derivedBaseName) {
    photo.isLive = true;
    photo.videoUrl = `${this.uploadBaseUrl}/photos/${videoKey}`;
    photo.videoKey = videoKey;
    if (!photo.baseName && derivedBaseName) {
      photo.baseName = derivedBaseName;
    }
    await photo.save();

    await queueService.completeTask(QUEUE_NAME, photo.taskId || photo._id, {
      photoId: photo._id,
      status: "completed",
    });

    this.emit("taskCompleted", { id: photo.taskId || photo._id }, photo);
  }

  async createPlaceholderPhoto(task, videoKey, derivedBaseName) {
    const placeholder = await Photo.findOneAndUpdate(
      { storageKey: videoKey },
      {
        $set: {
          title:
            derivedBaseName || task.originalFileName.replace(/\.[^/.]+$/, ""),
          originalFileName: task.originalFileName,
          baseName: derivedBaseName,
          storageKey: videoKey,
          mimeType: task.mimeType,
          isLive: true,
          videoUrl: `${this.uploadBaseUrl}/photos/${videoKey}`,
          videoKey: videoKey,
          status: "processing",
          uploadedBy: task.uploadedBy,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        timestamps: true,
      },
    );

    await queueService.completeTask(QUEUE_NAME, task.id, {
      photoId: placeholder._id,
      status: "completed",
    });

    this.emit("taskCompleted", task, placeholder);
  }

  async handleImageTask(task, fileBuffer, tempDir, filePath, derivedBaseName) {
    console.log(`📸 开始处理图片: ${task.originalFileName}`);
    const processed = await imageProcessing.processImage(
      fileBuffer,
      task.originalFileName,
      tempDir,
      { sourceFilePath: filePath },
    );

    console.log(`🔄 处理 HEIC 转换...`);
    const { finalStorageKey, finalMimeType } = await this.handleHeicConversion(
      task,
      processed.processedBuffer,
      filePath,
    );

    console.log(`💾 保存原始图片: ${finalStorageKey}`);
    await this.saveOriginalFile(
      finalStorageKey,
      processed.processedBuffer,
      fileBuffer,
      task.mimeType,
    );

    console.log(`🖼️ 生成 WebP 缩略图...`);
    await this.generateWebpThumbnail(
      finalStorageKey,
      processed.processedBuffer,
    );

    console.log(`🌍 获取地理位置信息...`);
    const geoinfo = await this.getGeoInfo(processed.location);

    console.log(`🏷️ 识别图片标签...`);
    const imageTags = await this.getImageTags(processed.processedBuffer);

    console.log(`🎥 检查 LivePhoto 视频...`);
    const { isLive, videoUrl, videoKey } = await this.findLivePhotoVideo(
      task,
      derivedBaseName,
    );

    console.log(`📦 构建图片数据...`);
    const photoData = this.buildPhotoData(
      task,
      derivedBaseName,
      finalStorageKey,
      finalMimeType,
      processed,
      geoinfo,
      imageTags,
      isLive,
      videoUrl,
      videoKey,
    );

    await this.savePhoto(
      task,
      photoData,
      derivedBaseName,
      isLive,
      videoUrl,
      videoKey,
    );
  }

  async handleHeicConversion(task, processedBuffer, filePath) {
    let finalStorageKey = task.storageKey;
    let finalMimeType = task.mimeType;

    if (["image/heic", "image/heif"].includes(task.mimeType)) {
      const baseName = path.parse(task.storageKey).name;
      finalStorageKey = `${baseName}.jpg`;
      finalMimeType = "image/jpeg";
      const finalPath = path.join(this.uploadDir, finalStorageKey);
      await fs.writeFile(finalPath, processedBuffer);
      await fs.unlink(filePath).catch(() => {});
    }

    return { finalStorageKey, finalMimeType };
  }

  async saveOriginalFile(
    finalStorageKey,
    processedBuffer,
    fileBuffer,
    originalMimeType,
  ) {
    const originalPath = path.join(this.uploadDir, finalStorageKey);
    const originalBuffer = ["image/heic", "image/heif"].includes(
      originalMimeType,
    )
      ? processedBuffer
      : fileBuffer;

    console.log(`🧹 移除 EXIF Orientation 标签...`);
    const sharp = require("sharp");
    const cleanBuffer = await sharp(originalBuffer)
      .withMetadata({ orientation: 1 })
      .toBuffer();

    await fs.writeFile(originalPath, cleanBuffer);
    console.log(`✅ 原始图片已保存: ${finalStorageKey}`);
  }

  async generateWebpThumbnail(finalStorageKey, processedBuffer) {
    const webpFileName = `${path.parse(finalStorageKey).name}.webp`;
    const webpPath = path.join(this.webpDir, webpFileName);
    await fs.mkdir(path.dirname(webpPath), { recursive: true });

    console.log(`🎨 生成 WebP 缩略图: ${webpFileName}`);
    const webpBuffer = await imageProcessing.generateThumbnail(
      processedBuffer,
      {
        width: 600,
        format: "webp",
      },
    );

    console.log(`💾 保存 WebP 缩略图: ${webpPath}`);
    await fs.writeFile(webpPath, webpBuffer);

    const sharp = require("sharp");
    const imageInfo = await sharp(processedBuffer).metadata();
    const compressionRatio = (
      (1 - webpBuffer.length / processedBuffer.length) *
      100
    ).toFixed(1);
    console.log(
      `✅ WebP 缩略图: ${imageInfo.width}x${imageInfo.height} -> 600px宽, ${(webpBuffer.length / 1024).toFixed(1)}KB (压缩${compressionRatio}%)`,
    );
  }

  async getGeoInfo(location) {
    if (!location) {
      console.log(`⚠️ 无地理位置信息`);
      return null;
    }
    console.log(`📍 解析地理位置: ${location.latitude}, ${location.longitude}`);
    return await geocoding.reverseGeocode(
      location.latitude,
      location.longitude,
    );
  }

  async getImageTags(processedBuffer) {
    try {
      console.log(`🔍 分析图片内容...`);
      const tagResult = await imageTagService.analyze(processedBuffer);
      const tags = tagResult.allKeywords || [];
      console.log(`✅ 识别到 ${tags.length} 个标签: ${tags.join(", ")}`);
      return tags;
    } catch (tagError) {
      console.warn("图片标签识别失败，继续处理:", tagError.message);
      return [];
    }
  }

  async findLivePhotoVideo(task, derivedBaseName) {
    let isLive = false;
    let videoUrl = null;
    let videoKey = null;

    if (task.isLivePhoto && task.pairedFile) {
      console.log(`📎 检查配对文件: ${task.pairedFile}`);
      const pairedExt = path.extname(task.pairedFile).toLowerCase();
      const videoExts = [".mp4", ".mov", ".avi", ".mkv", ".m4v"];

      if (videoExts.includes(pairedExt)) {
        const pairedPath = path.join(this.uploadDir, task.pairedFile);
        const valid = await isLikelyLiveVideo(
          pairedPath,
          task.dateTaken,
          task.createdAt,
        );
        if (valid) {
          console.log(`✅ 找到配对视频: ${task.pairedFile}`);
          isLive = true;
          videoKey = task.pairedFile;
          videoUrl = `${this.uploadBaseUrl}/photos/${task.pairedFile}`;
        }
      }
    }

    if (!isLive && derivedBaseName) {
      console.log(`🔍 搜索匹配的视频文件: ${derivedBaseName}`);
      const result = await this.searchForMatchingVideo(
        derivedBaseName,
        task.dateTaken,
        task.createdAt,
      );
      if (result) {
        console.log(`✅ 找到匹配视频: ${result.videoKey}`);
        isLive = result.isLive;
        videoKey = result.videoKey;
        videoUrl = result.videoUrl;
      } else {
        console.log(`⚠️ 未找到匹配的视频文件`);
      }
    }

    return { isLive, videoUrl, videoKey };
  }

  async searchForMatchingVideo(derivedBaseName, dateTaken, createdAt) {
    try {
      const uploadedFiles = await fs.readdir(this.uploadDir);
      const videoExts = [".mp4", ".mov", ".avi", ".mkv", ".m4v"];

      for (const file of uploadedFiles) {
        const fileBaseName = file
          .replace(/_\d{13}(?=\.[^.]+$)/, "")
          .replace(/\.[^.]+$/, "");
        const fileExt = path.extname(file).toLowerCase();

        if (fileBaseName === derivedBaseName && videoExts.includes(fileExt)) {
          const videoPath = path.join(this.uploadDir, file);
          const valid = await isLikelyLiveVideo(
            videoPath,
            dateTaken,
            createdAt,
          );
          if (valid) {
            return {
              isLive: true,
              videoKey: file,
              videoUrl: `${this.uploadBaseUrl}/photos/${file}`,
            };
          }
          break;
        }
      }
    } catch (err) {
      console.error("检查配对视频文件失败:", err);
    }
    return null;
  }

  buildPhotoData(
    task,
    derivedBaseName,
    finalStorageKey,
    finalMimeType,
    processed,
    geoinfo,
    imageTags,
    isLive,
    videoUrl,
    videoKey,
  ) {
    return {
      title: derivedBaseName || task.originalFileName.replace(/\.[^/.]+$/, ""),
      originalFileName: task.originalFileName,
      baseName: derivedBaseName,
      storageKey: finalStorageKey,
      mimeType: finalMimeType,
      fileSize: processed.fileSize,
      width: processed.width,
      height: processed.height,
      aspectRatio: processed.aspectRatio,
      dateTaken: processed.exif?.DateTimeOriginal
        ? new Date(processed.exif.DateTimeOriginal)
        : new Date(),
      location: processed.location,
      geoinfo: geoinfo,
      camera: processed.camera,
      exif: processed.exif,
      tags: imageTags,
      isLive,
      videoUrl,
      videoKey,
      uploadedBy: task.uploadedBy,
    };
  }

  async savePhoto(
    task,
    photoData,
    derivedBaseName,
    isLive,
    videoUrl,
    videoKey,
  ) {
    console.log(`💾 保存图片到数据库...`);
    const existingByBase = await this.findExistingPhotoForUpdate(
      derivedBaseName,
      task.createdAt,
    );

    if (existingByBase) {
      console.log(`🔄 更新现有图片: ${existingByBase._id}`);
      await this.updateExistingPhoto(
        existingByBase,
        isLive,
        videoUrl,
        videoKey,
        derivedBaseName,
        task.id,
      );
    } else {
      console.log(`➕ 创建新图片记录...`);
      await this.createNewPhoto(photoData, task.id);
    }
  }

  async findExistingPhotoForUpdate(derivedBaseName, taskCreatedAt) {
    if (!derivedBaseName) return null;

    console.log(`🔍 查找现有图片: ${derivedBaseName}`);
    const existingByBase = await Photo.findOne({ baseName: derivedBaseName });

    if (existingByBase?.videoKey && existingByBase?.isLive && taskCreatedAt) {
      const timeDiff = Math.abs(
        new Date(existingByBase.createdAt).getTime() -
          new Date(taskCreatedAt).getTime(),
      );

      if (timeDiff > LIVEPHOTO_MAX_TIME_DIFF_MS) {
        console.log(`⚠️ 时间差过大，不更新现有图片`);
        return null;
      }
    }

    return existingByBase;
  }

  async updateExistingPhoto(
    photo,
    isLive,
    videoUrl,
    videoKey,
    derivedBaseName,
    taskId,
  ) {
    console.log(`📝 更新 LivePhoto 信息...`);
    photo.isLive = isLive;
    photo.videoUrl = videoUrl;
    photo.videoKey = videoKey;
    if (!photo.baseName && derivedBaseName) {
      photo.baseName = derivedBaseName;
    }
    await photo.save();

    await queueService.completeTask(QUEUE_NAME, taskId, {
      photoId: photo._id,
      status: "completed",
    });

    console.log(`✅ 图片信息已更新到 LivePhoto: ${photo._id}`);
    this.emit("taskCompleted", { id: taskId }, photo);
  }

  async createNewPhoto(photoData, taskId) {
    console.log(`📝 创建新图片记录...`);
    photoData.status = "completed";
    const photo = await Photo.create(photoData);

    await queueService.completeTask(QUEUE_NAME, taskId, {
      photoId: photo._id,
      status: "completed",
    });

    this.emit("taskCompleted", { id: taskId }, photo);
  }
}

module.exports = new UploadQueueManager();
