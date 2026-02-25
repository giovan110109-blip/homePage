/**
 * 上传任务队列管理器
 * 负责处理照片上传任务的排队、处理和状态管理
 */

const EventEmitter = require("events");
const path = require("path");
const fs = require("fs").promises;
const os = require("os");

const UploadTask = require("../models/uploadTask");
const imageProcessing = require("./imageProcessing");

const {
  extractBaseName,
  detectFileType,
  VIDEO_EXTENSIONS,
} = require("./upload/photoUtils");
const VideoProcessor = require("./upload/videoProcessor");
const ImageProcessor = require("./upload/imageProcessor");

class UploadQueueManager extends EventEmitter {
  constructor() {
    super();
    this.isRunning = false;
    this.concurrency = parseInt(process.env.UPLOAD_CONCURRENCY || "4");
    this.activeWorkers = 0;
    this.pollInterval = null;

    const baseUploadDir =
      process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
    this.uploadDir =
      process.env.UPLOAD_PHOTOS_DIR || path.join(baseUploadDir, "photos");
    this.webpDir =
      process.env.UPLOAD_WEBP_DIR || path.join(baseUploadDir, "photos-webp");
    this.uploadBaseUrl = "https://serve.giovan.cn/uploads";

    this.videoProcessor = new VideoProcessor({
      uploadDir: this.uploadDir,
      uploadBaseUrl: this.uploadBaseUrl,
    });

    this.imageProcessor = new ImageProcessor({
      uploadDir: this.uploadDir,
      webpDir: this.webpDir,
      uploadBaseUrl: this.uploadBaseUrl,
    });

    console.log(
      `⚙️  上传队列配置 - 并发数: ${this.concurrency}, 轮询间隔: 5秒`
    );
  }

  async start() {
    if (this.isRunning) {
      console.log("队列管理器已在运行");
      return;
    }

    this.isRunning = true;
    console.log("🚀 上传队列管理器已启动");

    this.pollInterval = setInterval(() => {
      this.processQueue().catch((err) => {
        console.error("处理队列出错:", err);
      });
    }, 5000);

    await this.processQueue();
  }

  stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isRunning = false;
    console.log("⏹️  上传队列管理器已停止");
  }

  async processQueue() {
    if (this.activeWorkers >= this.concurrency) {
      return;
    }

    try {
      const tasks = await UploadTask.find({
        status: { $in: ["pending", "failed"] },
        $expr: { $lt: ["$attempts", "$maxAttempts"] },
      })
        .sort({ priority: -1, createdAt: 1 })
        .limit(this.concurrency - this.activeWorkers);

      if (tasks.length === 0) {
        return;
      }

      for (const task of tasks) {
        this.processTask(task).catch((err) => {
          console.error(`任务 ${task.taskId} 处理失败:`, err);
        });
      }
    } catch (error) {
      console.error("获取任务列表失败:", error);
    }
  }

  async processTask(task) {
    this.activeWorkers++;
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "upload-"));

    try {
      console.log(`开始处理任务: ${task.taskId}`);

      task.status = "processing";
      task.attempts += 1;
      await task.save();

      this.emit("taskStarted", task);

      task.stage = "upload";
      task.progress = 10;
      await task.save();

      const filePath = path.join(this.uploadDir, task.storageKey);
      const derivedBaseName = extractBaseName(task);
      const { isVideo: isVideoByExt } = detectFileType(task);

      if (isVideoByExt) {
        await this.handleVideoTask(task, derivedBaseName);
        return;
      }

      const fileBuffer = await fs.readFile(filePath);

      const { isVideo: isVideoByContent, detectedMime } =
        await this.videoProcessor.detectVideoFromContent(fileBuffer);

      if (isVideoByContent) {
        console.log(
          `检测到视频文件(内容识别): ${task.storageKey}，跳过图片处理流程`
        );
        await this.handleVideoTask(task, derivedBaseName, detectedMime);
        return;
      }

      await this.handleImageTask(task, fileBuffer, tempDir, filePath);
    } catch (error) {
      console.error(`❌ 任务失败: ${task.taskId}`, error);

      task.status = task.attempts >= task.maxAttempts ? "failed" : "pending";
      task.error = {
        message: error.message,
        stack: error.stack,
        stage: task.stage,
      };
      if (task.status === "failed") {
        task.failedAt = new Date();
      }
      await task.save();

      this.emit("taskFailed", task, error);
    } finally {
      this.activeWorkers--;
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }

  async handleVideoTask(task, derivedBaseName, mimeType) {
    if (mimeType) {
      task.mimeType = mimeType;
    }

    const result = await this.videoProcessor.process(task);

    task.status = result.status;
    task.progress = 100;
    task.photoId = result.photoId;
    task.completedAt = new Date();
    await task.save();

    console.log(`✅ 视频任务完成: ${task.taskId} -> Photo ${result.photoId}`);
    this.emit("taskCompleted", task, result.photo);
  }

  async handleImageTask(task, fileBuffer, tempDir, filePath) {
    task.stage = "format_conversion";
    task.progress = 20;
    await task.save();

    const processed = await imageProcessing.processImage(
      fileBuffer,
      task.originalFileName,
      tempDir,
      { sourceFilePath: filePath }
    );

    task.stage = "metadata_extraction";
    task.progress = 35;
    await task.save();

    const { photo } = await this.imageProcessor.process(task, processed, fileBuffer);

    task.stage = "database_save";
    task.progress = 90;
    await task.save();

    task.storageKey = photo.storageKey;
    task.status = "completed";
    task.progress = 100;
    task.photoId = photo._id;
    task.completedAt = new Date();
    await task.save();

    console.log(`✅ 任务完成: ${task.taskId} -> Photo ${photo._id}`);
    this.emit("taskCompleted", task, photo);
  }

  async createTask(fileData) {
    const task = new UploadTask({
      taskId: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      originalFileName: fileData.originalFileName,
      fileSize: fileData.fileSize,
      mimeType: fileData.mimeType,
      storageKey: fileData.storageKey,
      priority: fileData.priority || 0,
      isLivePhoto: fileData.isLivePhoto,
      pairedFile: fileData.pairedFile,
      baseName: fileData.baseName,
      uploadedBy: fileData.uploadedBy,
    });

    await task.save();

    if (!this.isRunning) {
      await this.start();
    } else {
      this.processQueue().catch(console.error);
    }

    return task;
  }

  async getTaskStatus(taskId) {
    return await UploadTask.findOne({ taskId });
  }

  async getStats() {
    const [pending, processing, completed, failed] = await Promise.all([
      UploadTask.countDocuments({ status: "pending" }),
      UploadTask.countDocuments({ status: "processing" }),
      UploadTask.countDocuments({ status: "completed" }),
      UploadTask.countDocuments({ status: "failed" }),
    ]);

    return {
      pending,
      processing,
      completed,
      failed,
      activeWorkers: this.activeWorkers,
      concurrency: this.concurrency,
      isRunning: this.isRunning,
    };
  }

  async retryTask(taskId) {
    const task = await UploadTask.findOne({ taskId });

    if (!task) {
      throw new Error("任务不存在");
    }

    task.status = "pending";
    task.attempts = 0;
    task.failedAt = null;
    await task.save();

    this.processQueue().catch((err) => {
      console.error("重试触发处理失败:", err);
    });

    return task;
  }
}

module.exports = new UploadQueueManager();
