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
const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

const LIVEPHOTO_MAX_VIDEO_SIZE = 12 * 1024 * 1024; // 12MB
const LIVEPHOTO_MAX_TIME_DIFF_MS = 10 * 60 * 1000; // 10分钟

const getVideoDurationSeconds = async (filePath) => {
  try {
    const { stdout } = await execFileAsync(
      "ffprobe",
      [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        filePath,
      ],
      { timeout: 5000 },
    );
    const duration = parseFloat(String(stdout).trim());
    return Number.isFinite(duration) ? duration : null;
  } catch (error) {
    return null;
  }
};

const isLikelyLiveVideo = async (videoPath, imageDateTaken, taskCreatedAt) => {
  try {
    const stats = await fs.stat(videoPath);
    if (stats.size > LIVEPHOTO_MAX_VIDEO_SIZE) return false;

    const refTime = imageDateTaken || taskCreatedAt;
    if (refTime) {
      const diff = Math.abs(stats.mtimeMs - new Date(refTime).getTime());
      if (diff > LIVEPHOTO_MAX_TIME_DIFF_MS) return false;
    }

    return true;
  } catch {
    return false;
  }
};

const QUEUE_NAME = 'upload:queue';

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
    const rawBaseUrl = "https://serve.giovan.cn/uploads";
    this.uploadBaseUrl = rawBaseUrl.replace(/\/$/, "");

    console.log(
      `⚙️  上传队列配置 - 并发数: ${this.concurrency}, 模式: 消息队列`,
    );
  }

  async start() {
    if (this.isRunning) {
      console.log("队列管理器已在运行");
      return;
    }

    this.isRunning = true;
    console.log("🚀 上传队列管理器已启动（消息队列模式）");

    this.consumerId = `consumer-${Date.now()}`;

    while (this.isRunning) {
      try {
        const tasks = await queueService.getPendingTasks(QUEUE_NAME, this.concurrency);

        if (tasks.length === 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        console.log(`📋 获取到 ${tasks.length} 个待处理任务`);

        for (const task of tasks) {
          if (this.activeWorkers >= this.concurrency) {
            console.log(`⏸️  已达到最大并发数 ${this.concurrency}，等待中...`);
            break;
          }

          this.processTask(task).catch((err) => {
            console.error(`任务 ${task.id} 处理失败:`, err);
            queueService.failTask(QUEUE_NAME, task.id, err);
          });
        }
      } catch (error) {
        console.error("处理队列出错:", error);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  stop() {
    this.isRunning = false;
    console.log("⏹️  上传队列管理器已停止");
  }

  async processTask(task) {
    this.activeWorkers++;
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "upload-"));

    try {
      console.log(`开始处理任务: ${task.id}`);

      await UploadTask.findOneAndUpdate(
        { taskId: task.id },
        { status: 'processing', attempts: { $inc: 1 } }
      );

      this.emit("taskStarted", task);

      const filePath = path.join(this.uploadDir, task.storageKey);

      const derivedBaseName =
        task.baseName ||
        (task.storageKey
          ? task.storageKey
              .replace(/_\d{13}(?=\.[^.]+$)/, "")
              .replace(/\.[^.]+$/, "")
          : "") ||
        (task.originalFileName
          ? task.originalFileName.replace(/\.[^/.]+$/, "")
          : "");

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
      const originalExt = path
        .extname(task.originalFileName || "")
        .toLowerCase();
      const isImageByExt =
        imageExts.includes(storageExt) || imageExts.includes(originalExt);
      const isVideoByExt =
        videoExts.includes(storageExt) || videoExts.includes(originalExt);
      const isImage = task.mimeType?.startsWith("image/") || isImageByExt;
      const isVideo =
        task.mimeType?.startsWith("video/") || (isVideoByExt && !isImage);

      if (isVideo) {
        console.log(`检测到视频文件: ${task.storageKey}，开始优化处理`);

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
            console.log(`✅ 视频已优化: ${optimizedVideoKey}`);
          }
        }

        let existingPhoto = null;
        if (derivedBaseName) {
          existingPhoto = await Photo.findOne({
            $or: [
              { baseName: derivedBaseName },
              { originalFileName: { $regex: `^${derivedBaseName}\\.` } },
              { storageKey: { $regex: `^${derivedBaseName}_` } },
            ],
          });
        }

        if (existingPhoto) {
          existingPhoto.isLive = true;
          existingPhoto.videoUrl = `${this.uploadBaseUrl}/photos/${optimizedVideoKey}`;
          existingPhoto.videoKey = optimizedVideoKey;
          if (!existingPhoto.baseName && derivedBaseName) {
            existingPhoto.baseName = derivedBaseName;
          }
          await existingPhoto.save();

          await queueService.completeTask(QUEUE_NAME, task.id, {
            photoId: existingPhoto._id,
            status: 'completed',
          });

          console.log(`✅ 视频文件已关联到照片: ${existingPhoto._id}`);
          this.emit("taskCompleted", task, existingPhoto);
        } else {
          const placeholder = await Photo.findOneAndUpdate(
            { storageKey: optimizedVideoKey },
            {
              $set: {
                title:
                  derivedBaseName ||
                  task.originalFileName.replace(/\.[^/.]+$/, ""),
                originalFileName: task.originalFileName,
                baseName: derivedBaseName,
                storageKey: optimizedVideoKey,
                mimeType: task.mimeType,
                isLive: true,
                videoUrl: `${this.uploadBaseUrl}/photos/${optimizedVideoKey}`,
                videoKey: optimizedVideoKey,
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
            status: 'completed',
          });

          console.log(`✅ 视频文件已保存，创建占位记录 ${placeholder._id}`);
          this.emit("taskCompleted", task, placeholder);
        }

        return;
      }

      const fileBuffer = await fs.readFile(filePath);

      try {
        const fileType = await import("file-type");
        const { fileTypeFromBuffer } = fileType;
        const detected = await fileTypeFromBuffer(fileBuffer);
        const detectedExt = detected?.ext
          ? `.${detected.ext}`.toLowerCase()
          : "";
        const detectedMime = detected?.mime || "";

        const videoExts = [".mp4", ".mov", ".avi", ".mkv", ".m4v"];
        const isVideoByDetect =
          detectedMime.startsWith("video/") || videoExts.includes(detectedExt);

        if (isVideoByDetect) {
          console.log(
            `检测到视频文件(内容识别): ${task.storageKey}，跳过图片处理流程`,
          );

          let existingPhoto = null;
          if (derivedBaseName) {
            existingPhoto = await Photo.findOne({
              $or: [
                { baseName: derivedBaseName },
                { originalFileName: { $regex: `^${derivedBaseName}\\.` } },
                { storageKey: { $regex: `^${derivedBaseName}_` } },
              ],
            });
          }

          if (existingPhoto) {
            existingPhoto.isLive = true;
            existingPhoto.videoUrl = `${this.uploadBaseUrl}/photos/${task.storageKey}`;
            existingPhoto.videoKey = task.storageKey;
            if (!existingPhoto.baseName && derivedBaseName) {
              existingPhoto.baseName = derivedBaseName;
            }
            await existingPhoto.save();

            await queueService.completeTask(QUEUE_NAME, task.id, {
              photoId: existingPhoto._id,
              status: 'completed',
            });

            console.log(`✅ 视频文件已关联到照片: ${existingPhoto._id}`);
            this.emit("taskCompleted", task, existingPhoto);
          } else {
            const placeholder = await Photo.findOneAndUpdate(
              { storageKey: task.storageKey },
              {
                $set: {
                  title:
                    derivedBaseName ||
                    task.originalFileName.replace(/\.[^/.]+$/, ""),
                  originalFileName: task.originalFileName,
                  baseName: derivedBaseName,
                  storageKey: task.storageKey,
                  mimeType: task.mimeType || detectedMime,
                  isLive: true,
                  videoUrl: `${this.uploadBaseUrl}/photos/${task.storageKey}`,
                  videoKey: task.storageKey,
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
              status: 'completed',
            });

            console.log(`✅ 视频文件已保存，创建占位记录 ${placeholder._id}`);
            this.emit("taskCompleted", task, placeholder);
          }

          return;
        }
      } catch (err) {
        console.error("内容类型检测失败，继续走原逻辑:", err);
      }

      const processed = await imageProcessing.processImage(
        fileBuffer,
        task.originalFileName,
        tempDir,
        { sourceFilePath: filePath },
      );

      let finalStorageKey = task.storageKey;
      let finalMimeType = task.mimeType;
      if (["image/heic", "image/heif"].includes(task.mimeType)) {
        const baseName = path.parse(task.storageKey).name;
        finalStorageKey = `${baseName}.jpg`;
        finalMimeType = "image/jpeg";
        const finalPath = path.join(this.uploadDir, finalStorageKey);
        await fs.writeFile(finalPath, processed.processedBuffer);
        await fs.unlink(filePath).catch(() => {});
      }

      let originalStorageKey = finalStorageKey;
      const originalPath = path.join(this.uploadDir, originalStorageKey);
      const originalBuffer = ["image/heic", "image/heif"].includes(task.mimeType)
        ? processed.processedBuffer
        : fileBuffer;
      await fs.writeFile(originalPath, originalBuffer);

      const webpFileName = `${path.parse(finalStorageKey).name}.webp`;
      const webpPath = path.join(this.webpDir, webpFileName);
      await fs.mkdir(path.dirname(webpPath), { recursive: true });

      const sharp = require("sharp");
      const imageInfo = await sharp(processed.processedBuffer).metadata();

      const targetWidth = 600;

      const webpBuffer = await sharp(processed.processedBuffer, {
        failOnError: false,
        limitInputPixels: false,
        autoRotate: false,
      })
        .resize(targetWidth, null, {
          fit: "inside",
          withoutEnlargement: true,
          kernel: "lanczos3",
        })
        .webp({
          quality: 85,
          effort: 6,
          smartSubsample: true,
          nearLossless: false,
          alphaQuality: 90,
        })
        .toBuffer();

      await fs.writeFile(webpPath, webpBuffer);

      const compressionRatio = (
        (1 - webpBuffer.length / processed.processedBuffer.length) *
        100
      ).toFixed(1);
      console.log(
        `WebP 缩略图: ${imageInfo.width}x${imageInfo.height} -> 600px宽, ${(webpBuffer.length / 1024).toFixed(1)}KB (压缩${compressionRatio}%)`,
      );

      let geoinfo = null;
      if (processed.location) {
        geoinfo = await geocoding.reverseGeocode(
          processed.location.latitude,
          processed.location.longitude,
        );
      }

      let imageTags = [];
      try {
        const tagResult = await imageTagService.analyze(
          processed.processedBuffer,
        );
        console.log("📋 tagResult:", JSON.stringify(tagResult, null, 2));
        imageTags = tagResult.allKeywords || [];
        console.log("📋 imageTags:", imageTags);
      } catch (tagError) {
        console.warn("⚠️ 图片标签识别失败，继续处理:", tagError.message);
      }

      let isLive = false;
      let videoUrl = null;
      let videoKey = null;

      if (task.isLivePhoto && task.pairedFile) {
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
            isLive = true;
            videoKey = task.pairedFile;
            videoUrl = `${this.uploadBaseUrl}/photos/${task.pairedFile}`;
          }
        }
      }

      if (!isLive && derivedBaseName) {
        try {
          const uploadedFiles = await fs.readdir(this.uploadDir);
          const videoExts = [".mp4", ".mov", ".avi", ".mkv", ".m4v"];

          for (const file of uploadedFiles) {
            const fileBaseName = file
              .replace(/_\d{13}(?=\.[^.]+$)/, "")
              .replace(/\.[^.]+$/, "");
            const fileExt = path.extname(file).toLowerCase();

            if (
              fileBaseName === derivedBaseName &&
              videoExts.includes(fileExt)
            ) {
              const videoPath = path.join(this.uploadDir, file);
              const valid = await isLikelyLiveVideo(
                videoPath,
                task.dateTaken,
                task.createdAt,
              );
              if (valid) {
                isLive = true;
                videoKey = file;
                videoUrl = `${this.uploadBaseUrl}/photos/${file}`;
                console.log(`✨ 检测到 LivePhoto 视频文件: ${file}`);
              }
              break;
            }
          }
        } catch (err) {
          console.error("检查配对视频文件失败:", err);
        }
      }

      let existingByBase = null;
      if (derivedBaseName) {
        existingByBase = await Photo.findOne({ baseName: derivedBaseName });

        if (existingByBase?.videoKey && existingByBase?.isLive) {
          const timeDiff =
            existingByBase.createdAt && task.createdAt
              ? Math.abs(
                  new Date(existingByBase.createdAt).getTime() -
                    new Date(task.createdAt).getTime(),
                )
              : 0;

          if (timeDiff > LIVEPHOTO_MAX_TIME_DIFF_MS) {
            console.log(
              `⏸️  检测到同名 LivePhoto 已过期 (${Math.round(timeDiff / 60000)}分钟），创建新记录`,
            );
            existingByBase = null;
          }
        }
      }

      const photoData = {
        title:
          derivedBaseName || task.originalFileName.replace(/\.[^/.]+$/, ""),
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
        status: existingByBase ? "processing" : "completed",
        uploadedBy: task.uploadedBy,
      };

      let photo = null;
      if (existingByBase) {
        existingByBase.isLive = true;
        existingByBase.videoUrl = videoUrl;
        existingByBase.videoKey = videoKey;
        if (!existingByBase.baseName && derivedBaseName) {
          existingByBase.baseName = derivedBaseName;
        }
        await existingByBase.save();

        photo = existingByBase;

        await queueService.completeTask(QUEUE_NAME, task.id, {
          photoId: existingByBase._id,
          status: 'completed',
        });

        console.log(`✅ 图片信息已更新到 LivePhoto: ${existingByBase._id}`);
      } else {
        photo = await Photo.create(photoData);

        await queueService.completeTask(QUEUE_NAME, task.id, {
          photoId: photo._id,
          status: 'completed',
        });

        console.log(`✅ 新照片已创建: ${photo._id}`);
      }

      this.emit("taskCompleted", task, photo);
    } catch (error) {
      console.error(`任务 ${task.id} 处理失败:`, error);

      await queueService.failTask(QUEUE_NAME, task.id, error);
    } finally {
      this.activeWorkers--;
    }
  }
}

module.exports = new UploadQueueManager();