const sharp = require('sharp')
const exiftool = require('exiftool-vendored').exiftool
const heicConvert = require('heic-convert')
const path = require('path')
const fs = require('fs').promises

// ESM 依赖使用动态导入
let fileTypeModule = null
const getFileType = async () => {
  if (!fileTypeModule) {
    fileTypeModule = await import('file-type')
  }
  return fileTypeModule
}

let thumbhashModule = null
const getThumbhash = async () => {
  if (!thumbhashModule) {
    thumbhashModule = await import('thumbhash')
  }
  return thumbhashModule
}

/**
 * 图片处理服务
 * 集成 sharp, thumbhash, exiftool-vendored, heic-convert
 */
class ImageProcessingService {
  /**
   * 检测文件类型
   */
  async detectFileType(buffer) {
    const { fileTypeFromBuffer } = await getFileType()
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
   * HEIC/BMP 转换为 JPEG
   */
  async preprocessImage(buffer, mimeType) {
    // 检测是否为 HEIC
    if (mimeType === 'image/heic' || mimeType === 'image/heif') {
      return await this.convertHeicToJpeg(buffer)
    }
    
    // 检测是否为 BMP，转换为 JPEG
    if (mimeType === 'image/bmp' || mimeType === 'image/x-ms-bmp') {
      console.log('检测到 BMP 格式，转换为 JPEG')
      const jpegBuffer = await sharp(buffer)
        .jpeg({ quality: 95 })
        .toBuffer()
      return jpegBuffer
    }
    
    return buffer
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
      // 已是正常方向
      return buffer
    }

    try {
      let image = sharp(buffer, {
        failOnError: false,
        limitInputPixels: false,
        autoRotate: false  // 禁用自动旋转，手动处理
      })

      switch (orientation) {
        case 2:
          image = image.flop()  // 水平翻转
          break
        case 3:
          image = image.rotate(180)  // 旋转 180°
          break
        case 4:
          image = image.flip()  // 垂直翻转
          break
        case 5:
          image = image.rotate(90).flop()  // 旋转 90° + 水平翻转
          break
        case 6:
          image = image.rotate(90)  // 旋转 90° 顺时针
          break
        case 7:
          image = image.rotate(90).flip()  // 旋转 90° + 垂直翻转
          break
        case 8:
          image = image.rotate(270)  // 旋转 270° 顺时针
          break
        default:
          return buffer
      }

      const rotatedBuffer = await image.toBuffer()
      console.log(`✅ 图片已根据 EXIF Orientation (${orientation}) 纠正`)
      return rotatedBuffer
    } catch (error) {
      console.warn('⚠️ 旋转图片失败，使用原始图像:', error.message)
      return buffer
    }
  }
  async extractExif({ filePath, buffer, originalFileName, tempDir }) {
    const readExifFromFile = async (targetPath) => {
      try {
        // -ee: 读取嵌入数据（如缩略图/子文件）
        // -n: 以数值输出，便于解析
        const tags = await exiftool.read(targetPath, ['-ee', '-n'])
        return tags
      } catch (error) {
        // 如果 Perl 不可用或其他错误，返回空对象而不是抛出
        if (error.message?.includes('Perl must be installed')) {
          console.warn('⚠️ Perl 未安装，跳过 EXIF 提取')
        } else {
          console.warn('⚠️ EXIF 读取失败，继续处理图像:', error.message)
        }
        return {}
      }
    }
    
    try {
      let tags = null
      if (filePath) {
        tags = await readExifFromFile(filePath)
      }
      
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
      
      const buildExifData = (sourceTags) => {
        const exifData = {}

        for (const [key, value] of Object.entries(sourceTags || {})) {
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
      }

      let exifData = buildExifData(tags)

      if (!exifData || Object.keys(exifData).length === 0) {
        console.warn('⚠️ 未读取到 EXIF（可能被客户端剥离或 Perl 不可用）')
      } else {
        const orientation = exifData.Orientation || 1
        console.log(`📸 EXIF 提取成功，Orientation: ${orientation} ${orientation !== 1 ? '(需要纠正)' : '(正常)'}`)
      }

      // 回退：如果没有EXIF，尝试从原始buffer写临时文件再读
      if ((!exifData || Object.keys(exifData).length === 0) && buffer && tempDir) {
        const ext = (originalFileName && path.extname(originalFileName)) || '.jpg'
        const tempFilePath = path.join(tempDir, `exif_${Date.now()}${ext}`)
        try {
          await fs.writeFile(tempFilePath, buffer)
          const fallbackTags = await readExifFromFile(tempFilePath)
          exifData = buildExifData(fallbackTags)
        } finally {
          await fs.unlink(tempFilePath).catch(() => {})
        }
      }

      return exifData
    } catch (error) {
      console.error('EXIF 提取异常:', error.message)
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
    const image = sharp(buffer, {
      autoRotate: false  // 禁用自动旋转，只读取元数据
    })
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
   * 生成缩略图 - 优化版
   * 使用 Sharp 高质量缩放 + WebP 格式
   */
  async generateThumbnail(buffer, options = {}) {
    const {
      width = 600,  // 600px宽度，适合网页显示
      height = null, // 自动计算高度保持宽高比
      fit = 'inside', // inside模式保持完整内容
      quality = 85,  // WebP质量，平衡大小和画质
      format = 'webp' // 默认使用WebP格式
    } = options

    const sharpInstance = sharp(buffer, {
      failOnError: false,
      limitInputPixels: false, // 允许大图片
      autoRotate: false // 禁用自动旋转，避免重复旋转
    })

    // 配置缩放参数
    const resizeOptions = {
      width,
      height,
      fit,
      withoutEnlargement: true, // 防止放大小图片
      kernel: 'lanczos3' // 高质量缩放算法
    }

    // 根据格式输出
    if (format === 'webp') {
      const thumbnail = await sharpInstance
        .resize(resizeOptions)
        .webp({
          quality,
          effort: 6, // 最大压缩努力程度(0-6)
          smartSubsample: true, // 智能色度二次采样
          nearLossless: false, // 有损压缩获得更小体积
          alphaQuality: 90 // 透明度质量
        })
        .toBuffer() // 移除元数据减小体积
      return thumbnail
    } else {
      // JPEG 格式（兼容模式）
      const thumbnail = await sharpInstance
        .resize(resizeOptions)
        .jpeg({
          quality,
          mozjpeg: true, // 使用 MozJPEG 优化器
          progressive: true, // 渐进式JPEG
          optimiseCoding: true // 优化霍夫曼编码
        })
        .toBuffer() // 移除元数据减小体积
      return thumbnail
    }
  }

  /**
   * 生成 ThumbHash
   * 用于显示模糊占位符
   */
  async generateThumbHash(buffer) {
    try {
      const th = await getThumbhash()
      const encode = typeof th.rgbaToThumbHash === 'function'
        ? th.rgbaToThumbHash
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

      // 3. 先提取 EXIF（在旋转前，避免 Sharp 旋转导致 EXIF 丢失）
      const safeOriginalName = path.basename(originalFileName || 'image')
      let tempFilePath = null
      let exifSourcePath = options.sourceFilePath

      if (!exifSourcePath) {
        tempFilePath = path.join(tempDir, safeOriginalName)
        await fs.writeFile(tempFilePath, result.processedBuffer)
        exifSourcePath = tempFilePath
      }
      
      result.exif = await this.extractExif({
        filePath: exifSourcePath,
        buffer: inputBuffer,
        originalFileName,
        tempDir
      })
      result.location = this.parseGPSCoordinates(result.exif)

      // 3.1 根据 EXIF Orientation 旋转图片到正常方向
      const orientation = result.exif?.Orientation || 1
      if (orientation && orientation !== 1) {
        console.log(`📐 检测到图片方向异常 (Orientation: ${orientation})，正在纠正...`)
        result.processedBuffer = await this.rotateByOrientation(result.processedBuffer, orientation)
      } else {
        console.log(`✅ 图片方向正常 (Orientation: ${orientation || 1})`)
      }

      // 4. 提取元数据
      result.metadata = await this.getImageMetadata(result.processedBuffer)

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
