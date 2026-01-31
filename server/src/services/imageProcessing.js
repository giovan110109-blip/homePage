const sharp = require('sharp')
const thumbhash = require('thumbhash')
const exiftool = require('exiftool-vendored').exiftool
const { fileTypeFromBuffer } = require('file-type')
const heicConvert = require('heic-convert')
const path = require('path')
const fs = require('fs').promises

/**
 * 图片处理服务
 * 集成 sharp, thumbhash, exiftool-vendored, heic-convert
 */
class ImageProcessingService {
  /**
   * 检测文件类型
   */
  async detectFileType(buffer) {
    const type = await fileTypeFromBuffer(buffer)
    return type
  }

  /**
   * 转换 HEIC 到 JPEG
   */
  async convertHeicToJpeg(buffer) {
    try {
      const outputBuffer = await heicConvert({
        buffer,
        format: 'JPEG',
        quality: 0.95
      })
      return Buffer.from(outputBuffer)
    } catch (error) {
      throw new Error(`HEIC 转换失败: ${error.message}`)
    }
  }

  /**
   * 预处理图片 - 格式转换
   * 如果是HEIC，转换为JPEG；否则返回原buffer
   */
  async preprocessImage(buffer, mimeType) {
    // 检测是否为 HEIC
    if (mimeType === 'image/heic' || mimeType === 'image/heif') {
      return await this.convertHeicToJpeg(buffer)
    }
    return buffer
  }

  /**
   * 提取EXIF元数据
   */
  async extractExif(filePath) {
    try {
      const tags = await exiftool.read(filePath)
      
      // 提取完整的EXIF信息，但过滤掉过大的二进制数据
      const exifData = {}
      
      // 安全地复制所有EXIF字段，跳过二进制/过大的数据
      const skipKeys = [
        'SourceFile', 
        'ThumbnailImage',
        'PreviewImage',
        'JpgFromRaw',
        'OtherImage',
        'BinaryData',
        'BinaryThumbnail',
        'Base64'
      ]
      
      for (const [key, value] of Object.entries(tags)) {
        // 跳过内部方法和二进制数据
        if (skipKeys.includes(key) || typeof value === 'function') {
          continue
        }
        
        // 处理Date对象
        if (value instanceof Date) {
          exifData[key] = value.toISOString()
          continue
        }
        
        // 处理Buffer（跳过）
        if (Buffer.isBuffer(value)) {
          continue
        }
        
        // 检查是否是对象且过大（超过1MB）
        if (typeof value === 'object' && value !== null) {
          try {
            const size = JSON.stringify(value).length
            if (size > 1024 * 1024) {
              continue
            }
          } catch (e) {
            continue
          }
        }
        
        // 检查字符串是否过长（超过5KB）
        if (typeof value === 'string' && value.length > 5120) {
          exifData[key] = value.substring(0, 5120) + '...[截断]'
          continue
        }
        
        // 保存该字段
        exifData[key] = value
      }
      
      return exifData
    } catch (error) {
      console.error('EXIF 提取错误:', error)
      return {}
    }
  }

  /**
   * 解析GPS坐标
   */
  parseGPSCoordinates(exifData) {
    if (!exifData.GPSLatitude || !exifData.GPSLongitude) {
      return null
    }

    let latitude = typeof exifData.GPSLatitude === 'number' 
      ? exifData.GPSLatitude 
      : parseFloat(exifData.GPSLatitude)
      
    let longitude = typeof exifData.GPSLongitude === 'number'
      ? exifData.GPSLongitude
      : parseFloat(exifData.GPSLongitude)

    // 处理方向
    if (exifData.GPSLatitudeRef === 'S') latitude = -latitude
    if (exifData.GPSLongitudeRef === 'W') longitude = -longitude

    return {
      latitude,
      longitude,
      altitude: exifData.GPSAltitude
    }
  }

  /**
   * 获取图片元数据（使用sharp）
   */
  async getImageMetadata(buffer) {
    const image = sharp(buffer)
    const metadata = await image.metadata()
    
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      space: metadata.space,
      channels: metadata.channels,
      depth: metadata.depth,
      density: metadata.density,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation
    }
  }

  /**
   * 生成缩略图
   */
  async generateThumbnail(buffer, options = {}) {
    const {
      width = 400,
      height = 400,
      fit = 'cover',
      quality = 80
    } = options

    const thumbnail = await sharp(buffer)
      .resize(width, height, { fit })
      .jpeg({ quality })
      .toBuffer()

    return thumbnail
  }

  /**
   * 生成 ThumbHash
   * 用于显示模糊占位符
   */
  async generateThumbHash(buffer) {
    try {
      const encode = typeof thumbhash.rgbaToThumbHash === 'function'
        ? thumbhash.rgbaToThumbHash
        : null
      if (!encode) {
        throw new Error('thumbhash.rgbaToThumbHash 不可用')
      }

      // 生成一个小尺寸的图片用于ThumbHash
      const image = sharp(buffer)
      const { width, height } = await image.metadata()

      // 缩放到 100px 宽度，保持宽高比
      const maxSize = 100
      const aspectRatio = width / height
      let thumbWidth, thumbHeight

      if (aspectRatio > 1) {
        thumbWidth = maxSize
        thumbHeight = Math.round(maxSize / aspectRatio)
      } else {
        thumbHeight = maxSize
        thumbWidth = Math.round(maxSize * aspectRatio)
      }

      const resized = await image
        .resize(thumbWidth, thumbHeight, { fit: 'inside' })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })

      const { data, info } = resized
      // 使用thumbhash.encode方法
      const thumbHashBuffer = encode(info.width, info.height, data)
      
      // 转换为 Base64（thumbhash 返回 Uint8Array，需要先转 Buffer）
      return Buffer.from(thumbHashBuffer).toString('base64')
    } catch (error) {
      console.error('ThumbHash 生成错误:', error)
      return null
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
      processedBuffer: null
    }

    try {
      // 1. 检测文件类型
      const fileTypeResult = await this.detectFileType(inputBuffer)
      const mimeType = fileTypeResult?.mime || 'application/octet-stream'

      // 2. 格式转换（HEIC -> JPEG）
      result.processedBuffer = await this.preprocessImage(inputBuffer, mimeType)

      // 3. 提取元数据
      result.metadata = await this.getImageMetadata(result.processedBuffer)

      // 4. 提取EXIF（优先使用原始文件，避免格式转换导致信息丢失）
      const safeOriginalName = path.basename(originalFileName || 'image')
      let tempFilePath = null
      let exifSourcePath = options.sourceFilePath

      if (!exifSourcePath) {
        tempFilePath = path.join(tempDir, safeOriginalName)
        await fs.writeFile(tempFilePath, result.processedBuffer)
        exifSourcePath = tempFilePath
      }
      
      result.exif = await this.extractExif(exifSourcePath)
      result.location = this.parseGPSCoordinates(result.exif)

      // 清理临时文件
      if (tempFilePath) {
        await fs.unlink(tempFilePath).catch(() => {})
      }

      // 5. 生成缩略图
      result.thumbnail = await this.generateThumbnail(result.processedBuffer, {
        width: 800,
        height: 800,
        quality: 85
      })

      // 6. 生成ThumbHash（非关键，失败不中断流程）
      try {
        result.thumbHash = await this.generateThumbHash(result.processedBuffer)
        if (!result.thumbHash && result.thumbnail) {
          result.thumbHash = await this.generateThumbHash(result.thumbnail)
        }
      } catch (error) {
        console.warn('ThumbHash 生成失败，继续处理:', error.message)
        result.thumbHash = null
      }

      return result
    } catch (error) {
      console.error('图片处理失败:', error)
      throw error
    }
  }

  /**
   * 关闭exiftool进程
   */
  async close() {
    await exiftool.end()
  }
}

module.exports = new ImageProcessingService()
