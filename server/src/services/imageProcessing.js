const sharp = require("sharp");
const exiftool = require("exiftool-vendored").exiftool;
const heicConvert = require("heic-convert");
const path = require("path");
const fs = require("fs").promises;

let fileTypeModule = null;
const getFileType = async () => {
  if (!fileTypeModule) {
    fileTypeModule = await import("file-type");
  }
  return fileTypeModule;
};

let thumbhashModule = null;
const getThumbhash = async () => {
  if (!thumbhashModule) {
    thumbhashModule = await import("thumbhash");
  }
  return thumbhashModule;
};

const SHARP_DEFAULT_OPTIONS = {
  failOnError: false,
  limitInputPixels: false,
  autoRotate: false,
};

const ORIENTATION_ROTATIONS = {
  2: { flop: true },
  3: { rotate: 180 },
  4: { flip: true },
  5: { flop: true, rotate: 90 },
  6: { rotate: 90 },
  7: { flop: true, rotate: 270 },
  8: { rotate: 270 },
};

const ORIENTATION_DESCRIPTIONS = {
  1: "正常",
  2: "水平翻转",
  3: "旋转180°",
  4: "垂直翻转",
  5: "旋转90°+水平翻转",
  6: "旋转90°",
  7: "旋转90°+垂直翻转",
  8: "旋转270°",
};

const EXIF_SKIP_KEYS = [
  "SourceFile",
  "ThumbnailImage",
  "PreviewImage",
  "JpgFromRaw",
  "OtherImage",
  "BinaryData",
  "BinaryThumbnail",
  "Base64",
];

class ImageProcessingService {
  createSharpInstance(buffer, options = {}) {
    return sharp(buffer, { ...SHARP_DEFAULT_OPTIONS, ...options });
  }

  applyOrientationRotation(image, orientation) {
    const orientNum = parseInt(orientation);
    if (!orientNum || orientNum === 1 || !ORIENTATION_ROTATIONS[orientNum]) {
      return image;
    }

    const rotation = ORIENTATION_ROTATIONS[orientNum];
    if (rotation.flop) image = image.flop();
    if (rotation.flip) image = image.flip();
    if (rotation.rotate) image = image.rotate(rotation.rotate);

    return image;
  }

  getOrientationDescription(orientation) {
    return ORIENTATION_DESCRIPTIONS[orientation] || "未知";
  }

  async detectFileType(buffer) {
    const { fileTypeFromBuffer } = await getFileType();
    return await fileTypeFromBuffer(buffer);
  }

  async convertHeicToJpeg(buffer) {
    try {
      console.log("🔄 使用 Sharp 处理 HEIC 图片...");
      const jpegBuffer = await this.createSharpInstance(buffer)
        .jpeg({ quality: 100 })
        .toBuffer();
      console.log("✅ Sharp 处理 HEIC 成功");
      return jpegBuffer;
    } catch (sharpError) {
      console.warn(
        `⚠️ Sharp 处理 HEIC 失败: ${sharpError.message}，尝试 heic-convert...`
      );
    }

    try {
      const outputBuffer = await heicConvert({
        buffer,
        format: "JPEG",
        quality: 1.0,
      });
      console.log("✅ heic-convert 转换 HEIC 成功（注意：可能已应用旋转）");
      return Buffer.from(outputBuffer);
    } catch (error) {
      throw new Error(`HEIC 转换失败: ${error.message}`);
    }
  }

  async preprocessImage(buffer, mimeType) {
    if (mimeType === "image/heic" || mimeType === "image/heif") {
      return await this.convertHeicToJpeg(buffer);
    }

    if (mimeType === "image/bmp" || mimeType === "image/x-ms-bmp") {
      console.log("检测到 BMP 格式，转换为 JPEG");
      return await this.createSharpInstance(buffer)
        .jpeg({ quality: 95 })
        .toBuffer();
    }

    return buffer;
  }

  async rotateByOrientation(buffer, orientation) {
    const orientNum = parseInt(orientation);
    if (!orientNum || orientNum === 1) {
      console.log("✅ Orientation 为 1，无需旋转");
      return buffer;
    }

    if (isNaN(orientNum) || orientNum < 1 || orientNum > 8) {
      console.warn(`⚠️ 无效的 EXIF Orientation 值: ${orientation}`);
      return buffer;
    }

    console.log(`🔧 准备旋转操作: Orientation ${orientNum}`);

    try {
      let image = this.createSharpInstance(buffer);
      image = this.applyOrientationRotation(image, orientNum);

      const rotatedBuffer = await image.toBuffer();
      console.log(
        `✅ 旋转完成 (Orientation ${orientNum}): ${buffer.length} → ${rotatedBuffer.length} bytes`
      );
      return rotatedBuffer;
    } catch (error) {
      console.error(`❌ 旋转图片失败:`, error.message);
      return buffer;
    }
  }

  async readExifFromFile(filePath) {
    try {
      return await exiftool.read(filePath, ["-ee", "-n"]);
    } catch (error) {
      if (error.message?.includes("Perl must be installed")) {
        console.warn("⚠️ Perl 未安装，跳过 EXIF 提取");
      } else {
        console.warn("⚠️ EXIF 读取失败:", error.message);
      }
      return {};
    }
  }

  buildExifData(tags) {
    const exifData = {};

    for (const [key, value] of Object.entries(tags || {})) {
      if (EXIF_SKIP_KEYS.includes(key) || typeof value === "function") {
        continue;
      }

      if (value instanceof Date) {
        exifData[key] = value.toISOString();
        continue;
      }

      if (Buffer.isBuffer(value)) {
        continue;
      }

      if (typeof value === "object" && value !== null) {
        try {
          const size = JSON.stringify(value).length;
          if (size > 1024 * 1024) continue;
        } catch (e) {
          continue;
        }
      }

      if (typeof value === "string" && value.length > 5120) {
        exifData[key] = value.substring(0, 5120) + "...[截断]";
        continue;
      }

      exifData[key] = value;
    }

    return exifData;
  }

  async extractExif({ filePath, buffer, inputBuffer, originalFileName, tempDir }) {
    let exifData = {};

    if (filePath) {
      const tags = await this.readExifFromFile(filePath);
      exifData = this.buildExifData(tags);
    }

    if (Object.keys(exifData).length === 0) {
      console.warn("⚠️ 未读取到 EXIF");

      if (inputBuffer && tempDir) {
        exifData = await this.tryFallbackExif(
          inputBuffer,
          originalFileName,
          tempDir,
          "原始 buffer"
        );
      }

      if (Object.keys(exifData).length === 0 && buffer && tempDir) {
        exifData = await this.tryFallbackExif(
          buffer,
          originalFileName,
          tempDir,
          "处理后 buffer"
        );
      }
    } else {
      console.log(
        `✅ EXIF 提取成功 | Orientation: ${exifData.Orientation || 1} | 字段数: ${Object.keys(exifData).length}`
      );
    }

    return exifData;
  }

  async tryFallbackExif(buffer, originalFileName, tempDir, source) {
    const ext = (originalFileName && path.extname(originalFileName)) || ".jpg";
    const tempFilePath = path.join(tempDir, `exif_${Date.now()}${ext}`);

    try {
      console.log(`🔄 尝试从 ${source} 提取 EXIF...`);
      await fs.writeFile(tempFilePath, buffer);
      const tags = await this.readExifFromFile(tempFilePath);
      const exifData = this.buildExifData(tags);

      if (Object.keys(exifData).length > 0) {
        console.log(`✅ 从 ${source} 恢复了 EXIF 数据`);
        return exifData;
      }
    } catch (err) {
      console.warn(`❌ 从 ${source} 提取 EXIF 失败:`, err.message);
    } finally {
      await fs.unlink(tempFilePath).catch(() => {});
    }

    return {};
  }

  async autoDetectOrientation(buffer) {
    try {
      const metadata = await this.createSharpInstance(buffer).metadata();
      if (!metadata?.width || !metadata?.height) return null;

      const aspectRatio = metadata.width / metadata.height;

      if (metadata.height > metadata.width && aspectRatio < 0.6) {
        console.log(`📐 自动检测: 宽高比 ${aspectRatio.toFixed(2)}，需要旋转`);
        return 6;
      }

      return null;
    } catch (error) {
      console.warn("❌ 自动方向检测失败:", error.message);
      return null;
    }
  }

  parseGPSCoordinates(exifData) {
    if (!exifData.GPSLatitude || !exifData.GPSLongitude) {
      return null;
    }

    let latitude =
      typeof exifData.GPSLatitude === "number"
        ? exifData.GPSLatitude
        : parseFloat(exifData.GPSLatitude);

    let longitude =
      typeof exifData.GPSLongitude === "number"
        ? exifData.GPSLongitude
        : parseFloat(exifData.GPSLongitude);

    if (exifData.GPSLatitudeRef === "S") latitude = -latitude;
    if (exifData.GPSLongitudeRef === "W") longitude = -longitude;

    return {
      latitude,
      longitude,
      altitude: exifData.GPSAltitude,
    };
  }

  async getImageMetadata(buffer) {
    const metadata = await this.createSharpInstance(buffer).metadata();

    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      space: metadata.space,
      channels: metadata.channels,
      depth: metadata.depth,
      density: metadata.density,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation,
    };
  }

  async resizeImage(buffer, options = {}) {
    const {
      width,
      height = null,
      fit = "inside",
      kernel = "lanczos3",
    } = options;

    return this.createSharpInstance(buffer).resize(width, height, {
      fit,
      withoutEnlargement: true,
      kernel,
    });
  }

  async generateThumbnail(buffer, options = {}) {
    const { width = 600, height = null, fit = "inside", quality = 85, format = "webp" } = options;

    const image = await this.resizeImage(buffer, { width, height, fit });

    if (format === "webp") {
      return await image
        .webp({
          quality,
          effort: 6,
          smartSubsample: true,
          nearLossless: false,
          alphaQuality: 90,
        })
        .toBuffer();
    }

    return await image
      .jpeg({
        quality,
        mozjpeg: true,
        progressive: true,
        optimiseCoding: true,
      })
      .toBuffer();
  }

  async generateThumbHash(buffer) {
    try {
      const th = await getThumbhash();
      const encode = th.rgbaToThumbHash;
      if (!encode) throw new Error("thumbhash.rgbaToThumbHash 不可用");

      const { width, height } = await this.createSharpInstance(buffer).metadata();

      const maxSize = 100;
      const aspectRatio = width / height;
      const [thumbWidth, thumbHeight] =
        aspectRatio > 1
          ? [maxSize, Math.round(maxSize / aspectRatio)]
          : [Math.round(maxSize * aspectRatio), maxSize];

      const { data, info } = await this.createSharpInstance(buffer)
        .resize(thumbWidth, thumbHeight, { fit: "inside" })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const thumbHashBuffer = encode(info.width, info.height, data);
      return Buffer.from(thumbHashBuffer).toString("base64");
    } catch (error) {
      console.error("ThumbHash 生成错误:", error);
      return null;
    }
  }

  async thumbHashToDataURL(base64ThumbHash) {
    try {
      const th = await getThumbhash();
      const toDataURL = th.thumbHashToDataURL;
      if (!toDataURL) throw new Error("thumbhash.thumbHashToDataURL 不可用");

      const buffer = Buffer.from(base64ThumbHash, "base64");
      return toDataURL(new Uint8Array(buffer));
    } catch (error) {
      console.error("ThumbHash 转 data URL 错误:", error);
      return null;
    }
  }

  async processImage(inputBuffer, originalFileName, tempDir, options = {}) {
    const result = {
      metadata: null,
      exif: null,
      location: null,
      thumbnail: null,
      thumbHash: null,
      thumbHashDataURL: null,
      processedBuffer: null,
    };

    try {
      const fileTypeResult = await this.detectFileType(inputBuffer);
      const mimeType = fileTypeResult?.mime || "application/octet-stream";

      console.log(`📸 MIME 类型: ${mimeType}`);
      const safeOriginalName = path.basename(originalFileName || "image");

      let originalExif = {};
      let tempInputPath = null;

      if (mimeType === "image/heic" || mimeType === "image/heif") {
        console.log("📄 检测到HEIC格式，优先从原始文件提取EXIF...");
        tempInputPath = path.join(tempDir, `raw_${Date.now()}_${safeOriginalName}`);
        await fs.writeFile(tempInputPath, inputBuffer);

        originalExif = await this.extractExif({
          filePath: tempInputPath,
          buffer: inputBuffer,
          inputBuffer,
          originalFileName,
          tempDir,
        });

        console.log(
          `✅ 从原始HEIC提取EXIF完成，Orientation: ${originalExif.Orientation || 1}`
        );
      }

      result.processedBuffer = await this.preprocessImage(inputBuffer, mimeType);

      if (
        (mimeType === "image/heic" || mimeType === "image/heif") &&
        Object.keys(originalExif).length > 0
      ) {
        console.log(`♻️ 复用从原始HEIC提取的EXIF数据`);
        result.exif = originalExif;
      } else {
        let exifSourcePath = options.sourceFilePath;
        if (!exifSourcePath) {
          exifSourcePath = path.join(tempDir, `processed_${Date.now()}_${safeOriginalName}`);
          await fs.writeFile(exifSourcePath, result.processedBuffer);
        }

        result.exif = await this.extractExif({
          filePath: exifSourcePath,
          buffer: result.processedBuffer,
          inputBuffer,
          originalFileName,
          tempDir,
        });
      }

      if (tempInputPath) {
        await fs.unlink(tempInputPath).catch(() => {});
      }

      result.location = this.parseGPSCoordinates(result.exif);

      const orientation = result.exif?.Orientation || 1;
      console.log(
        `📐 EXIF Orientation: ${orientation} (${this.getOrientationDescription(orientation)}) - 保留原始方向`
      );

      result.metadata = await this.getImageMetadata(result.processedBuffer);

      result.thumbnail = await this.generateThumbnail(result.processedBuffer, {
        width: 800,
        height: 800,
        quality: 85,
      });

      try {
        result.thumbHash = await this.generateThumbHash(result.processedBuffer);
        if (!result.thumbHash && result.thumbnail) {
          result.thumbHash = await this.generateThumbHash(result.thumbnail);
        }
        if (result.thumbHash) {
          result.thumbHashDataURL = await this.thumbHashToDataURL(result.thumbHash);
        }
      } catch (error) {
        console.warn("ThumbHash 生成失败，继续处理:", error.message);
        result.thumbHash = null;
        result.thumbHashDataURL = null;
      }

      return result;
    } catch (error) {
      console.error("图片处理失败:", error);
      throw error;
    }
  }

  async close() {
    await exiftool.end();
  }
}

module.exports = new ImageProcessingService();
