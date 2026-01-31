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
   * 获取 Orientation 方向描述
   */
  getOrientationDescription(orientation) {
    const descriptions = {
      1: '正常',
      2: '水平翻转',
      3: '旋转180°',
      4: '垂直翻转',
      5: '旋转90°+水平翻转',
      6: '旋转90°',
      7: '旋转90°+垂直翻转',
      8: '旋转270°'
    }
    return descriptions[orientation] || '未知'
  }

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
  async convertHeicToJpeg(buffer, originalBuffer = null) {
    try {
      const outputBuffer = await heicConvert({
        buffer,
        format: 'JPEG',
        quality: 0.95
      })
      const jpegBuffer = Buffer.from(outputBuffer)
      
      // 如果转换后丢失了方向信息，尝试从原始buffer恢复
      // 这个在后续的旋转处理中会通过EXIF提取来解决
      console.log('✅ HEIC 已转换为 JPEG 格式')
      return jpegBuffer
    } catch (error) {
      console.error(`❌ HEIC 转换失败: ${error.message}`)
      // HEIC转换失败，尝试用Sharp直接处理
      try {
        console.log('🔄 尝试使用 Sharp 处理 HEIC 图片...')
        const jpegBuffer = await sharp(buffer, {
          failOnError: false,
          limitInputPixels: false,
          autoRotate: false
        })
          .jpeg({ quality: 95 })
          .toBuffer()
        console.log('✅ Sharp 处理 HEIC 成功')
        return jpegBuffer
      } catch (sharpError) {
        throw new Error(`HEIC 转换失败（Sharp也失败）: ${sharpError.message}`)
      }
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
      console.log('✅ Orientation 为 1，无需旋转')
      return buffer
    }

    try {
      // 验证orientation是有效的数字
      const orientNum = parseInt(orientation)
      if (isNaN(orientNum) || orientNum < 1 || orientNum > 8) {
        console.warn(`⚠️ 无效的 EXIF Orientation 值: ${orientation}，使用原始图像`)
        return buffer
      }

      console.log(`🔧 准备旋转操作: Orientation ${orientNum}`)

      let image = sharp(buffer, {
        failOnError: false,
        limitInputPixels: false,
        autoRotate: false  // 禁用自动旋转，手动处理
      })

      switch (orientNum) {
        case 1:
          console.log('✅ Orientation = 1，图片已正常')
          return buffer
        case 2:
          console.log('🔄 执行: 水平翻转 (flop)')
          image = image.flop()
          break
        case 3:
          console.log('🔄 执行: 旋转 180°')
          image = image.rotate(180)
          break
        case 4:
          console.log('🔄 执行: 垂直翻转 (flip)')
          image = image.flip()
          break
        case 5:
          // Orientation 5: 水平翻转 + 旋转90° CW
          console.log('🔄 执行: 水平翻转 + 旋转 90°')
          image = image.flop().rotate(90)
          break
        case 6:
          // Orientation 6: 旋转 90° CW
          console.log('🔄 执行: 旋转 90°')
          image = image.rotate(90)
          break
        case 7:
          // Orientation 7: 水平翻转 + 旋转 270° CW (等同于垂直翻转 + 旋转 90° CCW)
          console.log('🔄 执行: 水平翻转 + 旋转 270°')
          image = image.flop().rotate(270)
          break
        case 8:
          // Orientation 8: 旋转 270° CW (即 90° CCW)
          console.log('🔄 执行: 旋转 270°')
          image = image.rotate(270)
          break
          image = image.rotate(90)
          break
        default:
          console.warn(`⚠️ 未知的 EXIF Orientation: ${orientNum}，使用原始图像`)
          return buffer
      }

      const rotatedBuffer = await image.toBuffer()
      console.log(`✅ 旋转完成 (Orientation ${orientNum}): ${buffer.length} → ${rotatedBuffer.length} bytes`)
      return rotatedBuffer
    } catch (error) {
      console.error(`❌ 旋转图片失败 (Orientation: ${orientation}):`, error.message)
      console.log('⚠️ 使用原始图像')
      return buffer
    }
  }
  async extractExif({ filePath, buffer, inputBuffer, originalFileName, tempDir }) {
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
        console.log(`✅ EXIF 提取成功 | Orientation: ${orientation} | 字段数: ${Object.keys(exifData).length}`)
      }

      // 回退1：如果没有EXIF，且有原始buffer，尝试从原始buffer读
      if ((!exifData || Object.keys(exifData).length === 0) && buffer && buffer !== inputBuffer && tempDir) {
        console.log('🔄 尝试从原始 buffer 恢复 EXIF...')
        const ext = (originalFileName && path.extname(originalFileName)) || '.jpg'
        const tempFilePath = path.join(tempDir, `exif_raw_${Date.now()}${ext}`)
        try {
          // 尝试从原始 inputBuffer 读取EXIF（可能更多EXIF数据）
          if (inputBuffer) {
            await fs.writeFile(tempFilePath, inputBuffer)
            const fallbackTags = await readExifFromFile(tempFilePath)
            const fallbackData = buildExifData(fallbackTags)
            if (fallbackData && Object.keys(fallbackData).length > 0) {
              console.log(`✅ 从原始 buffer 恢复了 EXIF 数据 | Orientation: ${fallbackData.Orientation || 1}`)
              exifData = fallbackData
            }
          }
        } catch (err) {
          console.warn('❌ 从原始 buffer 恢复 EXIF 失败:', err.message)
        } finally {
          await fs.unlink(tempFilePath).catch(() => {})
        }
      }

      // 回退2：如果仍然没有EXIF，尝试从处理后的buffer写临时文件再读
      if ((!exifData || Object.keys(exifData).length === 0) && buffer && tempDir) {
        console.log('🔄 尝试从处理后 buffer 提取 EXIF...')
        const ext = (originalFileName && path.extname(originalFileName)) || '.jpg'
        const tempFilePath = path.join(tempDir, `exif_processed_${Date.now()}${ext}`)
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
   * 自动检测图片是否需要旋转（基于宽高比）
   * 如果图片的宽高比异常，可能表示需要旋转
   */
  async autoDetectOrientation(buffer) {
    try {
      const metadata = await sharp(buffer).metadata()
      if (!metadata) return null
      
      const { width, height } = metadata
      if (!width || !height) return null
      
      const aspectRatio = width / height
      
      // 如果宽度明显小于高度（高度大于宽度），可能是竖拍照片被横存
      // 这通常意味着需要旋转90°或270°
      if (height > width && aspectRatio < 0.6) {
        console.log(`📐 自动检测: 宽高比 ${aspectRatio.toFixed(2)}，检测到需要旋转`)
        return 6 // 旋转90°
      }
      
      return null
    } catch (error) {
      console.warn('❌ 自动方向检测失败:', error.message)
      return null
    }
  }

  /**
   * 解析 GPS 坐标
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

      // 2. 先从原始文件提取EXIF（在格式转换前，保留原始方向信息）
      // 这对于HEIC很重要，因为转换后会丢失EXIF
      console.log(`📸 MIME 类型: ${mimeType}`)
      const safeOriginalName = path.basename(originalFileName || 'image')
      let tempInputPath = null
      
      // 如果是HEIC，先从原始HEIC提取EXIF
      let originalExif = {}
      if (mimeType === 'image/heic' || mimeType === 'image/heif') {
        console.log('📄 检测到HEIC格式，优先从原始文件提取EXIF...')
        tempInputPath = path.join(tempDir, `raw_${Date.now()}_${safeOriginalName}`)
        await fs.writeFile(tempInputPath, inputBuffer)
        
        originalExif = await this.extractExif({
          filePath: tempInputPath,
          buffer: inputBuffer,
          inputBuffer: inputBuffer,
          originalFileName,
          tempDir
        })
        
        console.log(`✅ 从原始HEIC提取EXIF完成，Orientation: ${originalExif.Orientation || 1}`)
      }

      // 3. 格式转换（HEIC -> JPEG）
      result.processedBuffer = await this.preprocessImage(inputBuffer, mimeType)

      // 4. 如果是HEIC且已提取EXIF，直接使用；否则从转换后的文件提取
      if ((mimeType === 'image/heic' || mimeType === 'image/heif') && Object.keys(originalExif).length > 0) {
        console.log(`♻️ 复用从原始HEIC提取的EXIF数据`)
        result.exif = originalExif
      } else {
        // 从处理后的buffer提取EXIF
        let exifSourcePath = options.sourceFilePath
        if (!exifSourcePath) {
          exifSourcePath = path.join(tempDir, `processed_${Date.now()}_${safeOriginalName}`)
          await fs.writeFile(exifSourcePath, result.processedBuffer)
        }
        
        result.exif = await this.extractExif({
          filePath: exifSourcePath,
          buffer: result.processedBuffer,
          inputBuffer: inputBuffer,
          originalFileName,
          tempDir
        })
      }

      // 清理临时文件
      if (tempInputPath) {
        await fs.unlink(tempInputPath).catch(() => {})
      }
      result.location = this.parseGPSCoordinates(result.exif)

      // 3.1 根据 EXIF Orientation 旋转图片到正常方向
      let orientation = result.exif?.Orientation || 1
      
      // 如果没有EXIF Orientation，尝试自动检测
      if (!result.exif?.Orientation) {
        const autoOrientation = await this.autoDetectOrientation(result.processedBuffer)
        if (autoOrientation) {
          console.log(`⚠️ 没有找到EXIF Orientation，使用自动检测结果: ${autoOrientation}`)
          orientation = autoOrientation
        }
      }
      
      const orientDesc = this.getOrientationDescription(orientation)
      console.log(`📐 EXIF Orientation: ${orientation} (${orientDesc})`)
      
      if (orientation && orientation !== 1) {
        console.log(`🔄 开始纠正图片方向: ${orientation} → 1`)
        const beforeRotateSize = result.processedBuffer.length
        result.processedBuffer = await this.rotateByOrientation(result.processedBuffer, orientation)
        const afterRotateSize = result.processedBuffer.length
        console.log(`✅ 图片方向已纠正 | 大小: ${beforeRotateSize} → ${afterRotateSize} bytes`)
      } else {
        console.log(`✅ 图片方向已正常，无需纠正`)
      }

      // 4. 提取元数据
      result.metadata = await this.getImageMetadata(result.processedBuffer)

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
