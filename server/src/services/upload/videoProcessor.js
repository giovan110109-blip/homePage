/**
 * 视频处理器
 */

const path = require("path");
const fs = require("fs").promises;
const Photo = require("../../models/photo");
const videoOptimizer = require("../videoOptimizer");
const {
  extractBaseName,
  VIDEO_EXTENSIONS,
  isLikelyLiveVideo,
  LIVEPHOTO_MAX_TIME_DIFF_MS,
} = require("./photoUtils");

class VideoProcessor {
  constructor(config) {
    this.uploadDir = config.uploadDir;
    this.uploadBaseUrl = config.uploadBaseUrl;
  }

  async process(task) {
    console.log(`检测到视频文件: ${task.storageKey}，开始优化处理`);

    const derivedBaseName = extractBaseName(task);
    const videoExt = path.extname(task.storageKey).toLowerCase();
    let optimizedVideoKey = task.storageKey;
    const filePath = path.join(this.uploadDir, task.storageKey);

    if (videoExt === ".mov") {
      const baseName = path.parse(task.storageKey).name;
      const optimizedPath = path.join(
        this.uploadDir,
        `${baseName}_optimized.mp4`
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

    const existingPhoto = await this.findExistingPhoto(derivedBaseName);

    if (existingPhoto) {
      return await this.updateExistingPhoto(
        existingPhoto,
        optimizedVideoKey,
        derivedBaseName,
        task
      );
    } else {
      return await this.createPlaceholder(
        optimizedVideoKey,
        derivedBaseName,
        task
      );
    }
  }

  async findExistingPhoto(baseName) {
    if (!baseName) return null;

    return await Photo.findOne({
      $or: [
        { baseName },
        { originalFileName: { $regex: `^${baseName}\\.` } },
        { storageKey: { $regex: `^${baseName}_` } },
      ],
    });
  }

  async updateExistingPhoto(photo, videoKey, baseName, task) {
    photo.isLive = true;
    photo.videoUrl = `${this.uploadBaseUrl}/photos/${videoKey}`;
    photo.videoKey = videoKey;
    if (!photo.baseName && baseName) {
      photo.baseName = baseName;
    }
    await photo.save();

    return {
      status: "completed",
      photoId: photo._id,
      photo,
    };
  }

  async createPlaceholder(videoKey, baseName, task) {
    const placeholder = await Photo.findOneAndUpdate(
      { storageKey: videoKey },
      {
        $set: {
          title:
            baseName || task.originalFileName.replace(/\.[^/.]+$/, ""),
          originalFileName: task.originalFileName,
          baseName,
          storageKey: videoKey,
          mimeType: task.mimeType,
          isLive: true,
          videoUrl: `${this.uploadBaseUrl}/photos/${videoKey}`,
          videoKey,
          status: "processing",
          uploadedBy: task.uploadedBy,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        timestamps: true,
      }
    );

    return {
      status: "completed",
      photoId: placeholder._id,
      photo: placeholder,
    };
  }

  async detectVideoFromContent(fileBuffer) {
    try {
      const fileType = await import("file-type");
      const { fileTypeFromBuffer } = fileType;
      const detected = await fileTypeFromBuffer(fileBuffer);
      const detectedExt = detected?.ext
        ? `.${detected.ext}`.toLowerCase()
        : "";
      const detectedMime = detected?.mime || "";

      const isVideo =
        detectedMime.startsWith("video/") ||
        VIDEO_EXTENSIONS.includes(detectedExt);

      return { isVideo, detectedMime, detectedExt };
    } catch (err) {
      console.error("内容类型检测失败:", err);
      return { isVideo: false };
    }
  }
}

module.exports = VideoProcessor;
