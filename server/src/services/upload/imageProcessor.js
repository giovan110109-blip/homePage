/**
 * 图片处理器
 */

const path = require("path");
const fs = require("fs").promises;
const sharp = require("sharp");
const Photo = require("../../models/photo");
const geocoding = require("../geocoding");
const imageTagService = require("../imageTagService");
const {
  extractBaseName,
  isLikelyLiveVideo,
  VIDEO_EXTENSIONS,
  LIVEPHOTO_MAX_TIME_DIFF_MS,
} = require("./photoUtils");

class ImageProcessor {
  constructor(config) {
    this.uploadDir = config.uploadDir;
    this.webpDir = config.webpDir;
    this.uploadBaseUrl = config.uploadBaseUrl;
  }

  async process(task, processed, fileBuffer) {
    const derivedBaseName = extractBaseName(task);

    const { finalStorageKey, finalMimeType } = await this.handleHeicConversion(
      task,
      processed
    );

    await this.saveOriginalFile(
      finalStorageKey,
      processed.processedBuffer,
      task.mimeType,
      fileBuffer
    );

    const webpFileName = await this.generateWebpThumbnail(
      finalStorageKey,
      processed
    );

    const geoinfo = await this.getGeoInfo(processed.location);

    const dateTaken = processed.exif.DateTimeOriginal
      ? new Date(processed.exif.DateTimeOriginal)
      : new Date();

    const imageTags = await this.getImageTags(processed.processedBuffer);

    const livePhotoInfo = await this.detectLivePhoto(
      derivedBaseName,
      dateTaken,
      task
    );

    const nextSort = await this.getNextSort();

    const photoData = this.buildPhotoData({
      task,
      processed,
      finalStorageKey,
      webpFileName,
      geoinfo,
      dateTaken,
      imageTags,
      livePhotoInfo,
      nextSort,
    });

    const photo = await this.savePhoto(photoData, finalStorageKey);

    return { photo, webpFileName };
  }

  async handleHeicConversion(task, processed) {
    let finalStorageKey = task.storageKey;
    let finalMimeType = task.mimeType;

    if (["image/heic", "image/heif"].includes(task.mimeType)) {
      const baseName = path.parse(task.storageKey).name;
      finalStorageKey = `${baseName}.jpg`;
      finalMimeType = "image/jpeg";
      const finalPath = path.join(this.uploadDir, finalStorageKey);
      await fs.writeFile(finalPath, processed.processedBuffer);

      const oldPath = path.join(this.uploadDir, task.storageKey);
      await fs.unlink(oldPath).catch(() => {});
    }

    return { finalStorageKey, finalMimeType };
  }

  async saveOriginalFile(finalStorageKey, processedBuffer, mimeType, originalBuffer) {
    const originalStorageKey = finalStorageKey;
    const originalPath = path.join(this.uploadDir, originalStorageKey);
    const buffer = ["image/heic", "image/heif"].includes(mimeType)
      ? processedBuffer
      : originalBuffer;
    await fs.writeFile(originalPath, buffer);
  }

  async generateWebpThumbnail(finalStorageKey, processed) {
    const webpFileName = `${path.parse(finalStorageKey).name}.webp`;
    const webpPath = path.join(this.webpDir, webpFileName);
    await fs.mkdir(path.dirname(webpPath), { recursive: true });

    const imageInfo = await sharp(processed.processedBuffer).metadata();
    const targetWidth = 600;

    const orientation = parseInt(processed.exif?.Orientation) || 1;
    console.log(
      `🔄 WebP 生成 - EXIF Orientation: ${processed.exif?.Orientation} (解析后: ${orientation})`
    );

    let webpImage = sharp(processed.processedBuffer, {
      failOnError: false,
      limitInputPixels: false,
      autoRotate: false,
    });

    if (orientation === 1) {
      console.log(`✅ WebP 无需旋转 (Orientation: ${orientation}, 图片已正确方向)`);
    } else if (orientation === 3) {
      console.log(`🔄 WebP 应用旋转: 180°`);
      webpImage = webpImage.rotate(180);
    } else if (orientation === 6) {
      console.log(`🔄 WebP 应用旋转: 90°`);
      webpImage = webpImage.rotate(90);
    } else if (orientation === 8) {
      console.log(`🔄 WebP 应用旋转: 270°`);
      webpImage = webpImage.rotate(270);
    } else {
      console.log(`✅ WebP 无需旋转 (Orientation: ${orientation})`);
    }

    const webpBuffer = await webpImage
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
      `WebP 缩略图: ${imageInfo.width}x${imageInfo.height} -> 600px宽, ${(webpBuffer.length / 1024).toFixed(1)}KB (压缩${compressionRatio}%)`
    );

    return webpFileName;
  }

  async getGeoInfo(location) {
    if (!location) return null;
    return await geocoding.reverseGeocode(location.latitude, location.longitude);
  }

  async getImageTags(buffer) {
    try {
      const tagResult = await imageTagService.analyze(buffer);
      console.log("📋 tagResult:", JSON.stringify(tagResult, null, 2));
      return tagResult.allKeywords || [];
    } catch (tagError) {
      console.warn("⚠️ 图片标签识别失败，继续处理:", tagError.message);
      return [];
    }
  }

  async detectLivePhoto(derivedBaseName, dateTaken, task) {
    let isLive = false;
    let videoUrl = null;
    let videoKey = null;

    if (task.isLivePhoto && task.pairedFile) {
      const pairedExt = path.extname(task.pairedFile).toLowerCase();
      if (VIDEO_EXTENSIONS.includes(pairedExt)) {
        const pairedPath = path.join(this.uploadDir, task.pairedFile);
        const valid = await isLikelyLiveVideo(
          pairedPath,
          dateTaken,
          task.createdAt
        );
        if (valid) {
          isLive = true;
          videoKey = task.pairedFile;
          videoUrl = `${this.uploadBaseUrl}/photos/${task.pairedFile}`;
        }
      }
    }

    if (!isLive && derivedBaseName) {
      const result = await this.searchForMatchingVideo(
        derivedBaseName,
        dateTaken,
        task.createdAt
      );
      if (result) {
        isLive = true;
        videoKey = result.videoKey;
        videoUrl = result.videoUrl;
      }
    }

    if (!isLive && derivedBaseName) {
      const existingByBase = await Photo.findOne({ baseName: derivedBaseName });
      if (existingByBase?.videoKey && existingByBase?.isLive) {
        const timeDiff =
          existingByBase.createdAt && task.createdAt
            ? Math.abs(
                new Date(existingByBase.createdAt).getTime() -
                  new Date(task.createdAt).getTime()
              )
            : 0;
        if (timeDiff <= LIVEPHOTO_MAX_TIME_DIFF_MS) {
          isLive = true;
          videoKey = existingByBase.videoKey;
          videoUrl = existingByBase.videoUrl;
        }
      }
    }

    return { isLive, videoUrl, videoKey };
  }

  async searchForMatchingVideo(baseName, dateTaken, taskCreatedAt) {
    try {
      const uploadedFiles = await fs.readdir(this.uploadDir);

      for (const file of uploadedFiles) {
        const fileBaseName = file
          .replace(/_\d{13}(?=\.[^.]+$)/, "")
          .replace(/\.[^.]+$/, "");
        const fileExt = path.extname(file).toLowerCase();

        if (fileBaseName === baseName && VIDEO_EXTENSIONS.includes(fileExt)) {
          const videoPath = path.join(this.uploadDir, file);
          const valid = await isLikelyLiveVideo(
            videoPath,
            dateTaken,
            taskCreatedAt
          );
          if (valid) {
            console.log(`✨ 检测到 LivePhoto 视频文件: ${file}`);
            return {
              videoKey: file,
              videoUrl: `${this.uploadBaseUrl}/photos/${file}`,
            };
          }
        }
      }
    } catch (err) {
      console.error("检查配对视频文件失败:", err);
    }
    return null;
  }

  async getNextSort() {
    const maxSortPhoto = await Photo.findOne()
      .sort({ sort: -1 })
      .select("sort");
    return (maxSortPhoto?.sort || 0) + 1;
  }

  buildPhotoData({
    task,
    processed,
    finalStorageKey,
    webpFileName,
    geoinfo,
    dateTaken,
    imageTags,
    livePhotoInfo,
    nextSort,
  }) {
    const originalStorageKey = finalStorageKey;

    return {
      title: task.originalFileName.replace(/\.[^/.]+$/, ""),
      originalFileName: task.originalFileName,
      baseName: extractBaseName(task),
      storageKey: finalStorageKey,
      originalKey: originalStorageKey,
      thumbnailKey: webpFileName,
      fileSize: task.fileSize,
      mimeType: task.mimeType,

      width: processed.metadata.width,
      height: processed.metadata.height,
      aspectRatio: processed.metadata.width / processed.metadata.height,

      originalUrl: `${this.uploadBaseUrl}/photos-webp/${webpFileName}`,
      originalFileUrl: `${this.uploadBaseUrl}/photos/${originalStorageKey}`,
      thumbnailUrl: processed.thumbHashDataURL,
      thumbnailHash: processed.thumbHash,

      isLive: livePhotoInfo.isLive,
      videoUrl: livePhotoInfo.videoUrl,
      videoKey: livePhotoInfo.videoKey,

      exif: processed.exif,
      dateTaken,

      location: processed.location
        ? {
            latitude: processed.location.latitude,
            longitude: processed.location.longitude,
            altitude: processed.location.altitude,
            coordinates: [
              processed.location.longitude,
              processed.location.latitude,
            ],
          }
        : undefined,

      geoinfo,

      sort: nextSort,

      camera: {
        make: processed.exif.Make,
        model: processed.exif.Model,
        lens: processed.exif.LensModel,
        focalLength: processed.exif.FocalLength,
        aperture: processed.exif.FNumber,
        shutterSpeed: processed.exif.ExposureTime,
        iso: processed.exif.ISO,
        flash: processed.exif.Flash,
        exposureProgram: processed.exif.ExposureProgram,
      },

      tags: imageTags,

      status: "completed",
      uploadedBy: task.uploadedBy,
    };
  }

  async savePhoto(photoData, storageKey) {
    const query = { storageKey };

    return await Photo.findOneAndUpdate(query, { $set: photoData }, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      timestamps: true,
    });
  }
}

module.exports = ImageProcessor;
