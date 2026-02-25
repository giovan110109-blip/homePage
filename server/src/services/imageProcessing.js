const sharp = require("sharp");
const exiftool = require("exiftool-vendored").exiftool;
const heicConvert = require("heic-convert");
const path = require("path");
const fs = require("fs").promises;

// ESM 依赖使用动态导入
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

/**
 * 图片处理服务
 * 集成 sharp, thumbhash, exiftool-vendored, heic-convert
 */
class ImageProcessingService {
  /**
   * 获取 Orientation 方向描述
   */
  getOrientationDescription(orientation) {
    const descriptions = {
      1: "正常",
      2: "水平翻转",
      3: "旋转180°",
      4: "垂直翻转",
      5: "旋转90°+水平翻转",
      6: "旋转90°",
      7: "旋转90°+垂直翻转",
      8: "旋转270°",
    };
    return descriptions[orientation] || "未知";
  }

  /**
   * 检测文件类型
   */
  async detectFileType(buffer) {
    const { fileTypeFromBuffer } = await getFileType();
    const type = await fileTypeFromBuffer(buffer);
    return type;
  }

  /**
   * 转换 HEIC 到 JPEG
   * 优先使用 Sharp（可禁用自动旋转），失败时回退到 heic-convert
   */
  async convertHeicToJpeg(buffer) {
    try {
      console.log("🔄 使用 Sharp 处理 HEIC 图片...");
      const jpegBuffer = await sharp(buffer, {
        failOnError: false,
        limitInputPixels: false,
        autoRotate: false,
      })
        .jpeg({ quality: 100 })
        .toBuffer();
      console.log("✅ Sharp 处理 HEIC 成功");
      return jpegBuffer;
    } catch (sharpError) {
      console.warn(
        `⚠️ Sharp 处理 HEIC 失败: ${sharpError.message}，尝试 heic-convert...`,
      );
    }

    try {
      const outputBuffer = await heicConvert({
        buffer,
        format: "JPEG",
        quality: 1.0,
      });
      const jpegBuffer = Buffer.from(outputBuffer);
      console.log("✅ heic-convert 转换 HEIC 成功（注意：可能已应用旋转）");
      return jpegBuffer;
    } catch (error) {
      throw new Error(`HEIC 转换失败: ${error.message}`);
    }
  }

  /**
   * 预处理图片 - 格式转换
   * HEIC/BMP 转换为 JPEG
   */
  async preprocessImage(buffer, mimeType) {
    // 检测是否为 HEIC
    if (mimeType === "image/heic" || mimeType === "image/heif") {
      return await this.convertHeicToJpeg(buffer);
    }

    // 检测是否为 BMP，转换为 JPEG
    if (mimeType === "image/bmp" || mimeType === "image/x-ms-bmp") {
      console.log("检测到 BMP 格式，转换为 JPEG");
      const jpegBuffer = await sharp(buffer).jpeg({ quality: 95 }).toBuffer();
      return jpegBuffer;
    }

    return buffer;
  }

  /**
   * 根据 EXIF Orientation 旋转图片到正常方向
   * EXIF Orientation 值：
   * 1: 正常（0°）
   * 2: 水平翻转
   * 3: 旋转 180°
   * 4: 垂直翻转
   * 5: 旋转 90° 然后水平翻转
   * 6: 旋转 90° 顺时针
   * 7: 旋转 90° 然后垂直翻转
   * 8: 旋转 270° 顺时针（或 90° 逆时针）
   */
  async rotateByOrientation(buffer, orientation) {
    if (!orientation || orientation === 1) {
      console.log("✅ Orientation 为 1，无需旋转");
      return buffer;
    }

    try {
      // 验证orientation是有效的数字
      const orientNum = parseInt(orientation);
      if (isNaN(orientNum) || orientNum < 1 || orientNum > 8) {
        console.warn(
          `⚠️ 无效的 EXIF Orientation 值: ${orientation}，使用原始图像`,
        );
        return buffer;
      }

      console.log(`🔧 准备旋转操作: Orientation ${orientNum}`);

      let image = sharp(buffer, {
        failOnError: false,
        limitInputPixels: false,
        autoRotate: false, // 禁用自动旋转，手动处理
      });

      switch (orientNum) {
        case 1:
          console.log("✅ Orientation = 1，图片已正常");
          return buffer;
        case 2:
          console.log("🔄 执行: 水平翻转 (flop)");
          image = image.flop();
          break;
        case 3:
          console.log("🔄 执行: 旋转 180°");
          image = image.rotate(180);
          break;
        case 4:
          console.log("🔄 执行: 垂直翻转 (flip)");
          image = image.flip();
          break;
        case 5:
          // Orientation 5: 水平翻转 + 旋转90° CW
          console.log("🔄 执行: 水平翻转 + 旋转 90°");
          image = image.flop().rotate(90);
          break;
        case 6:
          // Orientation 6: 旋转 90° CW
          console.log("🔄 执行: 旋转 90°");
          image = image.rotate(90);
          break;
        case 7:
          // Orientation 7: 水平翻转 + 旋转 270° CW (等同于垂直翻转 + 旋转 90° CCW)
          console.log("🔄 执行: 水平翻转 + 旋转 270°");
          image = image.flop().rotate(270);
          break;
        case 8:
          // Orientation 8: 旋转 270° CW (即 90° CCW)
          console.log("🔄 执行: 旋转 270°");
          image = image.rotate(270);
          break;
        default:
          console.warn(
            `⚠️ 未知的 EXIF Orientation: ${orientNum}，使用原始图像`,
          );
          return buffer;
      }

      const rotatedBuffer = await image.toBuffer();
      console.log(
        `✅ 旋转完成 (Orientation ${orientNum}): ${buffer.length} → ${rotatedBuffer.length} bytes`,
      );
      return rotatedBuffer;
    } catch (error) {
      console.error(
        `❌ 旋转图片失败 (Orientation: ${orientation}):`,
        error.message,
      );
      console.log("⚠️ 使用原始图像");
      return buffer;
    }
  }
  /**
   * 创建临时文件并写入 buffer
   */
  async writeTempFile(buffer, tempDir, filename) {
    const tempFilePath = path.join(tempDir, `${filename}_${Date.now()}`);
    await fs.writeFile(tempFilePath, buffer);
    return tempFilePath;
  }

  /**
   * 从 buffer 提取 EXIF（通过临时文件）
   */
  async extractExifFromBuffer(buffer, tempDir, originalFileName) {
    const ext = (originalFileName && path.extname(originalFileName)) || ".jpg";
    const safeOriginalName = path
      .basename(originalFileName || "image")
      .replace(ext, "");
    const tempFilePath = await this.writeTempFile(
      buffer,
      tempDir,
      `exif_${safeOriginalName}${ext}`,
    );

    try {
      return await this.extractExif({
        filePath: tempFilePath,
        buffer,
        inputBuffer: buffer,
        originalFileName,
        tempDir,
      });
    } finally {
      await fs.unlink(tempFilePath).catch(() => {});
    }
  }

  async extractExif({
    filePath,
    buffer,
    inputBuffer,
    originalFileName,
    tempDir,
  }) {
    const readExifFromFile = async (targetPath) => {
      try {
        const tags = await exiftool.read(targetPath, ["-ee", "-n"]);
        return tags;
      } catch (error) {
        if (error.message?.includes("Perl must be installed")) {
          console.warn("⚠️ Perl 未安装，跳过 EXIF 提取");
        } else {
          console.warn("⚠️ EXIF 读取失败，继续处理图像:", error.message);
        }
        return {};
      }
    };

    try {
      let tags = null;
      if (filePath) {
        tags = await readExifFromFile(filePath);
      }

      const skipKeys = [
        "SourceFile",
        "ThumbnailImage",
        "PreviewImage",
        "JpgFromRaw",
        "OtherImage",
        "BinaryData",
        "BinaryThumbnail",
        "Base64",
      ];

      const buildExifData = (sourceTags) => {
        const exifData = {};

        for (const [key, value] of Object.entries(sourceTags || {})) {
          if (skipKeys.includes(key) || typeof value === "function") {
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
              if (size > 1024 * 1024) {
                continue;
              }
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
      };

      let exifData = buildExifData(tags);

      if (!exifData || Object.keys(exifData).length === 0) {
        console.warn("⚠️ 未读取到 EXIF（可能被客户端剥离或 Perl 不可用）");
      } else {
        const orientation = exifData.Orientation || 1;
        console.log(
          `✅ EXIF 提取成功 | Orientation: ${orientation} | 字段数: ${Object.keys(exifData).length}`,
        );
      }

      if (
        (!exifData || Object.keys(exifData).length === 0) &&
        buffer &&
        buffer !== inputBuffer &&
        tempDir
      ) {
        console.log("🔄 尝试从原始 buffer 恢复 EXIF...");
        if (inputBuffer) {
          const fallbackData = await this.extractExifFromBuffer(
            inputBuffer,
            tempDir,
            originalFileName,
          );
          if (fallbackData && Object.keys(fallbackData).length > 0) {
            console.log(
              `✅ 从原始 buffer 恢复了 EXIF 数据 | Orientation: ${fallbackData.Orientation || 1}`,
            );
            exifData = fallbackData;
          }
        }
      }

      if (
        (!exifData || Object.keys(exifData).length === 0) &&
        buffer &&
        tempDir
      ) {
        console.log("🔄 尝试从处理后 buffer 提取 EXIF...");
        const fallbackData = await this.extractExifFromBuffer(
          buffer,
          tempDir,
          originalFileName,
        );
        exifData = fallbackData;
      }

      return exifData;
    } catch (error) {
      console.error("EXIF 提取异常:", error.message);
      return {};
    }
  }

  /**
   * 计算缩放尺寸（保持宽高比）
   */
  calculateResizeDimensions(width, height, maxSize) {
    if (!width || !height) return { width: maxSize, height: maxSize };

    const aspectRatio = width / height;

    if (aspectRatio > 1) {
      return {
        width: maxSize,
        height: Math.round(maxSize / aspectRatio),
      };
    } else {
      return {
        height: maxSize,
        width: Math.round(maxSize * aspectRatio),
      };
    }
  }

  /**
   * 自动检测图片是否需要旋转（基于宽高比）
   * 如果图片的宽高比异常，可能表示需要旋转
   */
  async autoDetectOrientation(buffer) {
    try {
      const metadata = await this.getImageMetadata(buffer);
      if (!metadata) return null;

      const { width, height } = metadata;
      if (!width || !height) return null;

      const aspectRatio = width / height;

      // 如果宽度明显小于高度（高度大于宽度），可能是竖拍照片被横存
      // 这通常意味着需要旋转90°或270°
      if (height > width && aspectRatio < 0.6) {
        console.log(
          `📐 自动检测: 宽高比 ${aspectRatio.toFixed(2)}，检测到需要旋转`,
        );
        return 6; // 旋转90°
      }

      return null;
    } catch (error) {
      console.warn("❌ 自动方向检测失败:", error.message);
      return null;
    }
  }

  /**
   * 解析 GPS 坐标
   */
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

    // 处理方向
    if (exifData.GPSLatitudeRef === "S") latitude = -latitude;
    if (exifData.GPSLongitudeRef === "W") longitude = -longitude;

    return {
      latitude,
      longitude,
      altitude: exifData.GPSAltitude,
    };
  }

  /**
   * 获取图片元数据（使用sharp）
   */
  async getImageMetadata(buffer) {
    const image = sharp(buffer, {
      autoRotate: false, // 禁用自动旋转，只读取元数据
    });
    const metadata = await image.metadata();

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

  /**
   * 生成缩略图 - 优化版
   * 使用 Sharp 高质量缩放 + WebP 格式
   */
  async generateThumbnail(buffer, options = {}) {
    const {
      width = 600,
      height = null,
      fit = "inside",
      quality = 85,
      format = "webp",
    } = options;

    const sharpInstance = sharp(buffer, {
      failOnError: false,
      limitInputPixels: false,
      autoRotate: false,
    });

    const resizeOptions = {
      width,
      height,
      fit,
      withoutEnlargement: true,
      kernel: "lanczos3",
    };

    if (format === "webp") {
      const thumbnail = await sharpInstance
        .resize(resizeOptions)
        .withMetadata({ orientation: 1 })
        .webp({
          quality,
          effort: 6,
          smartSubsample: true,
          nearLossless: false,
          alphaQuality: 90,
        })
        .toBuffer();
      return thumbnail;
    } else {
      const thumbnail = await sharpInstance
        .resize(resizeOptions)
        .withMetadata({ orientation: 1 })
        .jpeg({
          quality,
          mozjpeg: true,
          progressive: true,
          optimiseCoding: true,
        })
        .toBuffer();
      return thumbnail;
    }
  }

  /**
   * 生成 ThumbHash
   * 用于显示模糊占位符
   */
  async generateThumbHash(buffer) {
    try {
      const th = await getThumbhash();
      const encode =
        typeof th.rgbaToThumbHash === "function" ? th.rgbaToThumbHash : null;
      if (!encode) {
        throw new Error("thumbhash.rgbaToThumbHash 不可用");
      }

      const metadata = await this.getImageMetadata(buffer);
      const { width, height } = metadata;
      const maxSize = 100;

      const { width: thumbWidth, height: thumbHeight } =
        this.calculateResizeDimensions(width, height, maxSize);

      const resized = await sharp(buffer)
        .resize(thumbWidth, thumbHeight, { fit: "inside" })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const { data, info } = resized;
      const thumbHashBuffer = encode(info.width, info.height, data);

      return Buffer.from(thumbHashBuffer).toString("base64");
    } catch (error) {
      console.error("ThumbHash 生成错误:", error);
      return null;
    }
  }

  /**
   * 将 ThumbHash base64 转换为 data URL
   */
  async thumbHashToDataURL(base64ThumbHash) {
    try {
      const th = await getThumbhash();
      const toDataURL =
        typeof th.thumbHashToDataURL === "function"
          ? th.thumbHashToDataURL
          : null;
      if (!toDataURL) {
        throw new Error("thumbhash.thumbHashToDataURL 不可用");
      }

      const buffer = Buffer.from(base64ThumbHash, "base64");
      const bytes = new Uint8Array(buffer);
      return toDataURL(bytes);
    } catch (error) {
      console.error("ThumbHash 转 data URL 错误:", error);
      return null;
    }
  }

  /**
   * 完整处理图片流程
   */
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
      let tempInputPath = null;

      let originalExif = {};
      if (mimeType === "image/heic" || mimeType === "image/heif") {
        console.log("📄 检测到HEIC格式，优先从原始文件提取EXIF...");
        const ext = path.extname(safeOriginalName) || ".heic";
        const baseName = safeOriginalName.replace(ext, "");
        tempInputPath = await this.writeTempFile(
          inputBuffer,
          tempDir,
          `raw_${baseName}${ext}`,
        );

        originalExif = await this.extractExif({
          filePath: tempInputPath,
          buffer: inputBuffer,
          inputBuffer: inputBuffer,
          originalFileName,
          tempDir,
        });

        console.log(
        `✅ 从原始HEIC提取EXIF完成，Orientation: ${originalExif.Orientation || 1}`,
      );
      }

      console.log(`🔄 预处理图片（格式转换）...`);
      result.processedBuffer = await this.preprocessImage(
        inputBuffer,
        mimeType,
      );

      if (
        (mimeType === "image/heic" || mimeType === "image/heif") &&
        Object.keys(originalExif).length > 0
      ) {
        console.log(`♻️ 复用从原始HEIC提取的EXIF数据`);
        result.exif = originalExif;
      } else {
        console.log(`📋 提取 EXIF 元数据...`);
        let exifSourcePath = options.sourceFilePath;
        if (!exifSourcePath) {
          const ext = path.extname(safeOriginalName) || ".jpg";
          const baseName = safeOriginalName.replace(ext, "");
          exifSourcePath = await this.writeTempFile(
            result.processedBuffer,
            tempDir,
            `processed_${baseName}${ext}`,
          );
        }

        result.exif = await this.extractExif({
          filePath: exifSourcePath,
          buffer: result.processedBuffer,
          inputBuffer: inputBuffer,
          originalFileName,
          tempDir,
        });
        console.log(`✅ EXIF 提取完成`);
      }

      if (tempInputPath) {
        await fs.unlink(tempInputPath).catch(() => {});
      }
      
      console.log(`📍 解析 GPS 坐标...`);
      result.location = this.parseGPSCoordinates(result.exif);
      if (result.location) {
        console.log(`✅ GPS 坐标: ${result.location.latitude}, ${result.location.longitude}`);
      } else {
        console.log(`⚠️ 无 GPS 坐标`);
      }

      const orientation = result.exif?.Orientation || 1;
      const orientDesc = this.getOrientationDescription(orientation);
      console.log(
        `📐 EXIF Orientation: ${orientation} (${orientDesc})`,
      );

      console.log(`📊 获取图片元数据...`);
      result.metadata = await this.getImageMetadata(result.processedBuffer);
      console.log(`✅ 图片尺寸: ${result.metadata.width}x${result.metadata.height}`);

      if (orientation !== 1) {
        console.log(`🔄 根据 EXIF Orientation ${orientation} 旋转图片到正常方向`);
        result.processedBuffer = await this.rotateByOrientation(
          result.processedBuffer,
          orientation,
        );
        console.log(`✅ 图片旋转完成`);
      }

      console.log(`🖼️ 生成缩略图...`);
      result.thumbnail = await this.generateThumbnail(result.processedBuffer, {
        width: 800,
        height: 800,
        quality: 85,
      });
      console.log(`✅ 缩略图生成完成`);

      console.log(`🔢 生成 ThumbHash...`);
      try {
        result.thumbHash = await this.generateThumbHash(result.processedBuffer);
        if (!result.thumbHash && result.thumbnail) {
          result.thumbHash = await this.generateThumbHash(result.thumbnail);
        }
        // 7. 将 thumbHash 转换为 data URL
        if (result.thumbHash) {
          result.thumbHashDataURL = await this.thumbHashToDataURL(
            result.thumbHash,
          );
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

  /**
   * 关闭exiftool进程
   */
  async close() {
    await exiftool.end();
  }
}

module.exports = new ImageProcessingService();
