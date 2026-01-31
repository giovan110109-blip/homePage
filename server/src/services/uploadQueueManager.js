const EventEmitter = require('events')
const path = require('path')
const fs = require('fs').promises
const os = require('os')
const UploadTask = require('../models/uploadTask')
const Photo = require('../models/photo')
const imageProcessing = require('./imageProcessing')
const geocoding = require('./geocoding')

/**
 * 上传任务队列管理器
 * 负责处理照片上传任务的排队、处理和状态管理
 */
class UploadQueueManager extends EventEmitter {
  constructor() {
    super()
    this.isRunning = false
    this.concurrency = 2 // 同时处理2个任务
    this.activeWorkers = 0
    this.pollInterval = null
    const baseUploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
    this.uploadDir = process.env.UPLOAD_PHOTOS_DIR || path.join(baseUploadDir, 'photos')
    this.webpDir = process.env.UPLOAD_WEBP_DIR || path.join(baseUploadDir, 'photos-webp')
    const rawBaseUrl = 'https://serve.giovan.cn/uploads'
    this.uploadBaseUrl = rawBaseUrl.replace(/\/$/, '')
  }

  /**
   * 启动队列管理器
   */
  async start() {
    if (this.isRunning) {
      console.log('队列管理器已在运行')
      return
    }

    this.isRunning = true
    console.log('🚀 上传队列管理器已启动')

    // 每5秒检查一次队列
    this.pollInterval = setInterval(()  => {
      this.processQueue().catch(err => {
        console.error('处理队列出错:', err)
      })
    }, 5000)

    // 立即处理一次
    await this.processQueue()
  }

  /**
   * 停止队列管理器
   */
  stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
    this.isRunning = false
    console.log('⏹️  上传队列管理器已停止')
  }

  /**
   * 处理队列
   */
  async processQueue() {
    if (this.activeWorkers >= this.concurrency) {
      return
    }

    try {
      // 获取待处理的任务
      const tasks = await UploadTask.find({
        status: { $in: ['pending', 'failed'] },
        $expr: { $lt: ['$attempts', '$maxAttempts'] }
      })
        .sort({ priority: -1, createdAt: 1 })
        .limit(this.concurrency - this.activeWorkers)

      if (tasks.length === 0) {
        return
      }

      // 处理每个任务
      for (const task of tasks) {
        this.processTask(task).catch(err => {
          console.error(`任务 ${task.taskId} 处理失败:`, err)
        })
      }
    } catch (error) {
      console.error('获取任务列表失败:', error)
    }
  }

  /**
   * 处理单个任务
   */
  async processTask(task) {
    this.activeWorkers++
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'upload-'))

    try {
      console.log(`开始处理任务: ${task.taskId}`)

      // 更新状态为处理中
      task.status = 'processing'
      task.attempts += 1
      await task.save()

      this.emit('taskStarted', task)

      // 阶段1: 读取文件
      task.stage = 'upload'
      task.progress = 10
      await task.save()

      const filePath = path.join(this.uploadDir, task.storageKey)

      // 统一计算 baseName（优先任务字段，其次从 storageKey/原始文件名派生）
      const derivedBaseName = task.baseName
        || (task.storageKey ? task.storageKey.replace(/_\d{13}(?=\.[^.]+$)/, '').replace(/\.[^.]+$/, '') : '')
        || (task.originalFileName ? task.originalFileName.replace(/\.[^/.]+$/, '') : '')
      
      // 检查是否为视频文件（mimeType 为空时用扩展名兜底）
      const videoExts = ['.mp4', '.mov', '.avi', '.mkv', '.m4v']
      const imageExts = ['.jpg', '.jpeg', '.png', '.heic', '.heif', '.webp', '.gif', '.tiff', '.tif']
      const storageExt = path.extname(task.storageKey || '').toLowerCase()
      const originalExt = path.extname(task.originalFileName || '').toLowerCase()
      const isImageByExt = imageExts.includes(storageExt) || imageExts.includes(originalExt)
      const isVideoByExt = videoExts.includes(storageExt) || videoExts.includes(originalExt)
      const isImage = task.mimeType?.startsWith('image/') || isImageByExt
      const isVideo = task.mimeType?.startsWith('video/') || (isVideoByExt && !isImage)
      
      // 如果是视频文件，直接标记为完成，不进行图片处理
      if (isVideo) {
        console.log(`检测到视频文件: ${task.storageKey}，跳过图片处理流程`)
        
        // 查找或更新已存在的 Photo 记录（可能是之前上传的图片）
        let existingPhoto = null
        if (derivedBaseName) {
          existingPhoto = await Photo.findOne({
            $or: [
              { baseName: derivedBaseName },
              { originalFileName: { $regex: `^${derivedBaseName}\\.` } },
              { storageKey: { $regex: `^${derivedBaseName}_` } }
            ]
          })
        }
        
        if (existingPhoto) {
          // 更新现有记录，添加视频信息
          existingPhoto.isLive = true
          existingPhoto.videoUrl = `${this.uploadBaseUrl}/photos/${task.storageKey}`
          existingPhoto.videoKey = task.storageKey
          if (!existingPhoto.baseName && derivedBaseName) {
            existingPhoto.baseName = derivedBaseName
          }
          await existingPhoto.save()
          
          task.status = 'completed'
          task.progress = 100
          task.photoId = existingPhoto._id
          task.completedAt = new Date()
          await task.save()
          
          console.log(`✅ 视频文件已关联到照片: ${existingPhoto._id}`)
          this.emit('taskCompleted', task, existingPhoto)
        } else {
          // 没有找到匹配的图片，创建或更新占位记录等待后续图片合并
          const placeholder = await Photo.findOneAndUpdate(
            { storageKey: task.storageKey },
            {
              $set: {
                title: derivedBaseName || task.originalFileName.replace(/\.[^/.]+$/, ''),
                originalFileName: task.originalFileName,
                baseName: derivedBaseName,
                storageKey: task.storageKey,
                mimeType: task.mimeType,
                isLive: true,
                videoUrl: `${this.uploadBaseUrl}/photos/${task.storageKey}`,
                videoKey: task.storageKey,
                status: 'processing',
                uploadedBy: task.uploadedBy
              }
            },
            { new: true, upsert: true, setDefaultsOnInsert: true, timestamps: true }
          )

          task.status = 'completed'
          task.progress = 100
          task.photoId = placeholder._id
          task.completedAt = new Date()
          await task.save()
          
          console.log(`✅ 视频文件已保存，创建占位记录 ${placeholder._id}`)
          this.emit('taskCompleted', task, placeholder)
        }
        
        return
      }
      
      const fileBuffer = await fs.readFile(filePath)

      // 基于文件内容再次检测类型，确保视频不会进入图片处理流程
      try {
        const { fileTypeFromBuffer } = require('file-type')
        const detected = await fileTypeFromBuffer(fileBuffer)
        const detectedExt = detected?.ext ? `.${detected.ext}`.toLowerCase() : ''
        const detectedMime = detected?.mime || ''

        const videoExts = ['.mp4', '.mov', '.avi', '.mkv', '.m4v']
        const isVideoByDetect = detectedMime.startsWith('video/') || videoExts.includes(detectedExt)

        if (isVideoByDetect) {
          console.log(`检测到视频文件(内容识别): ${task.storageKey}，跳过图片处理流程`)

          // 复用视频处理逻辑
          let existingPhoto = null
          if (derivedBaseName) {
            existingPhoto = await Photo.findOne({
              $or: [
                { baseName: derivedBaseName },
                { originalFileName: { $regex: `^${derivedBaseName}\\.` } },
                { storageKey: { $regex: `^${derivedBaseName}_` } }
              ]
            })
          }

          if (existingPhoto) {
            existingPhoto.isLive = true
            existingPhoto.videoUrl = `${this.uploadBaseUrl}/photos/${task.storageKey}`
            existingPhoto.videoKey = task.storageKey
            if (!existingPhoto.baseName && derivedBaseName) {
              existingPhoto.baseName = derivedBaseName
            }
            await existingPhoto.save()

            task.status = 'completed'
            task.progress = 100
            task.photoId = existingPhoto._id
            task.completedAt = new Date()
            await task.save()

            console.log(`✅ 视频文件已关联到照片: ${existingPhoto._id}`)
            this.emit('taskCompleted', task, existingPhoto)
          } else {
            const placeholder = await Photo.findOneAndUpdate(
              { storageKey: task.storageKey },
              {
                $set: {
                  title: derivedBaseName || task.originalFileName.replace(/\.[^/.]+$/, ''),
                  originalFileName: task.originalFileName,
                  baseName: derivedBaseName,
                  storageKey: task.storageKey,
                  mimeType: task.mimeType || detectedMime,
                  isLive: true,
                  videoUrl: `${this.uploadBaseUrl}/photos/${task.storageKey}`,
                  videoKey: task.storageKey,
                  status: 'processing',
                  uploadedBy: task.uploadedBy
                }
              },
              { new: true, upsert: true, setDefaultsOnInsert: true, timestamps: true }
            )

            task.status = 'completed'
            task.progress = 100
            task.photoId = placeholder._id
            task.completedAt = new Date()
            await task.save()

            console.log(`✅ 视频文件已保存，创建占位记录 ${placeholder._id}`)
            this.emit('taskCompleted', task, placeholder)
          }

          return
        }
      } catch (err) {
        console.error('内容类型检测失败，继续走原逻辑:', err)
      }

      // 阶段2: 格式转换和元数据提取
      task.stage = 'format_conversion'
      task.progress = 20
      await task.save()

      const processed = await imageProcessing.processImage(
        fileBuffer,
        task.originalFileName,
        tempDir,
        { sourceFilePath: filePath }
      )

      // 若原图为 HEIC/HEIF，转存为 JPG 以便浏览器访问
      let finalStorageKey = task.storageKey
      let finalMimeType = task.mimeType
      if (['image/heic', 'image/heif'].includes(task.mimeType)) {
        const baseName = path.parse(task.storageKey).name
        finalStorageKey = `${baseName}.jpg`
        finalMimeType = 'image/jpeg'
        const finalPath = path.join(this.uploadDir, finalStorageKey)
        await fs.writeFile(finalPath, processed.processedBuffer)
        await fs.unlink(filePath).catch(() => {})
      }

      // 生成 WebP 版本
      const webpFileName = `${path.parse(finalStorageKey).name}.webp`
      const webpPath = path.join(this.webpDir, webpFileName)
      await fs.mkdir(path.dirname(webpPath), { recursive: true })
      
      const webpBuffer = await new Promise((resolve, reject) => {
        require('sharp')(processed.processedBuffer)
          .webp({ quality: 80 })
          .toBuffer((err, data) => {
            if (err) reject(err)
            else resolve(data)
          })
      })
      await fs.writeFile(webpPath, webpBuffer)

      // 阶段3: 生成缩略图
      task.stage = 'thumbnail_generation'
      task.progress = 50
      await task.save()

      // 阶段4: 反向地理编码
      task.stage = 'location_lookup'
      task.progress = 70
      await task.save()

      let geoinfo = null
      if (processed.location) {
        geoinfo = await geocoding.reverseGeocode(
          processed.location.latitude,
          processed.location.longitude
        )
      }

      // 阶段5: 保存到数据库
      task.stage = 'database_save'
      task.progress = 90
      await task.save()

      // 提取拍摄日期
      const dateTaken = processed.exif.DateTimeOriginal 
        ? new Date(processed.exif.DateTimeOriginal)
        : new Date()
      
      // Live Photo 处理：检查是否有配对的视频文件
      let isLive = false
      let videoUrl = null
      let videoKey = null
      
      // 方式1：通过 task.pairedFile（上传时检测到的）
      if (task.isLivePhoto && task.pairedFile) {
        const pairedExt = path.extname(task.pairedFile).toLowerCase()
        const videoExts = ['.mp4', '.mov', '.avi', '.mkv', '.m4v']
        
        if (videoExts.includes(pairedExt)) {
          isLive = true
          videoKey = task.pairedFile
          videoUrl = `${this.uploadBaseUrl}/photos/${task.pairedFile}`
        }
      }
      
      // 方式2：如果上传时未检测到，现在再次检查文件系统
      if (!isLive && derivedBaseName) {
        try {
          const uploadedFiles = await fs.readdir(this.uploadDir)
          const videoExts = ['.mp4', '.mov', '.avi', '.mkv', '.m4v']
          
          for (const file of uploadedFiles) {
            // 提取文件的 baseName（去掉结尾的 _时间戳 和扩展名）
            const fileBaseName = file
              .replace(/_\d{13}(?=\.[^.]+$)/, '')
              .replace(/\.[^.]+$/, '')
            const fileExt = path.extname(file).toLowerCase()
            
            // 找到同名视频文件
            if (fileBaseName === derivedBaseName && videoExts.includes(fileExt)) {
              isLive = true
              videoKey = file
              videoUrl = `${this.uploadBaseUrl}/photos/${file}`
              console.log(`✨ 检测到同名视频文件: ${file}`)
              break
            }
          }
        } catch (err) {
          console.error('检查配对视频文件失败:', err)
        }
      }

      // 方式3：如果数据库中已有同 baseName 的记录（含视频占位），优先合并
      let existingByBase = null
      if (derivedBaseName) {
        existingByBase = await Photo.findOne({ baseName: derivedBaseName })

        if (existingByBase?.videoKey) {
          isLive = true
          videoKey = existingByBase.videoKey
          videoUrl = existingByBase.videoUrl
        }
      }

      // 创建或更新Photo记录（避免重复 key）
      const photoData = {
        title: task.originalFileName.replace(/\.[^/.]+$/, ''),
        originalFileName: task.originalFileName,
        baseName: derivedBaseName,
        storageKey: finalStorageKey,
        thumbnailKey: undefined,
        fileSize: task.fileSize,
        mimeType: finalMimeType,
        
        width: processed.metadata.width,
        height: processed.metadata.height,
        aspectRatio: processed.metadata.width / processed.metadata.height,
        
        originalUrl: `${this.uploadBaseUrl}/photos-webp/${webpFileName}`,
        thumbnailUrl: undefined,
        thumbnailHash: processed.thumbHash,
        
        // Live Photo
        isLive,
        videoUrl,
        videoKey,
        
        exif: processed.exif,
        dateTaken,
        
        location: processed.location ? {
          latitude: processed.location.latitude,
          longitude: processed.location.longitude,
          altitude: processed.location.altitude,
          coordinates: [processed.location.longitude, processed.location.latitude]
        } : undefined,
        
        geoinfo,
        
        camera: {
          make: processed.exif.Make,
          model: processed.exif.Model,
          lens: processed.exif.LensModel,
          focalLength: processed.exif.FocalLength,
          aperture: processed.exif.FNumber,
          shutterSpeed: processed.exif.ExposureTime,
          iso: processed.exif.ISO,
          flash: processed.exif.Flash,
          exposureProgram: processed.exif.ExposureProgram
        },
        
        status: 'completed',
        uploadedBy: task.uploadedBy
      }

      // 对于 Live Photo，使用 baseName 作为唯一标识，合并视频和图片为一条记录
      let query
      if (existingByBase?._id) {
        query = { _id: existingByBase._id }
      } else if (isLive && derivedBaseName) {
        // 查找同 baseName 的现有记录
        query = { 
          $or: [
            { storageKey: finalStorageKey },
            { baseName: derivedBaseName },
            { originalFileName: { $regex: `^${derivedBaseName}\\.` } },
            { storageKey: { $regex: `^${derivedBaseName}_` } }
          ]
        }
      } else {
        query = derivedBaseName
          ? { $or: [{ storageKey: finalStorageKey }, { baseName: derivedBaseName }] }
          : { storageKey: finalStorageKey }
      }
      
      const photo = await Photo.findOneAndUpdate(
        query,
        { $set: photoData },
        { new: true, upsert: true, setDefaultsOnInsert: true, timestamps: true }
      )

      // 完成任务
      task.storageKey = finalStorageKey
      task.mimeType = finalMimeType
      task.status = 'completed'
      task.progress = 100
      task.photoId = photo._id
      task.completedAt = new Date()
      await task.save()

      console.log(`✅ 任务完成: ${task.taskId} -> Photo ${photo._id}`)
      this.emit('taskCompleted', task, photo)

    } catch (error) {
      console.error(`❌ 任务失败: ${task.taskId}`, error)

      task.status = task.attempts >= task.maxAttempts ? 'failed' : 'pending'
      task.error = {
        message: error.message,
        stack: error.stack,
        stage: task.stage
      }
      if (task.status === 'failed') {
        task.failedAt = new Date()
      }
      await task.save()

      this.emit('taskFailed', task, error)
    } finally {
      this.activeWorkers--
      
      // 清理临时目录
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {})
    }
  }

  /**
   * 创建新任务
   */
  async createTask(fileData) {
    const task = new UploadTask({
      taskId: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      originalFileName: fileData.originalFileName,
      fileSize: fileData.fileSize,
      mimeType: fileData.mimeType,
      storageKey: fileData.storageKey,
      uploadedBy: fileData.uploadedBy,
      status: 'pending',
      priority: fileData.priority || 0
    })

    await task.save()
    console.log(`📝 创建新任务: ${task.taskId}`)
    
    // 立即触发处理
    setImmediate(() => this.processQueue())
    
    return task
  }

  /**
   * 获取任务状态
   */
  async getTaskStatus(taskId) {
    return await UploadTask.findOne({ taskId })
  }

  /**
   * 获取队列统计信息
   */
  async getStats() {
    const [pending, processing, completed, failed] = await Promise.all([
      UploadTask.countDocuments({ status: 'pending' }),
      UploadTask.countDocuments({ status: 'processing' }),
      UploadTask.countDocuments({ status: 'completed' }),
      UploadTask.countDocuments({ status: 'failed' })
    ])

    return {
      pending,
      processing,
      completed,
      failed,
      activeWorkers: this.activeWorkers,
      concurrency: this.concurrency
    }
  }
}

// 导出单例
const queueManager = new UploadQueueManager()
module.exports = queueManager
