const mongoose = require('mongoose')

const uploadTaskSchema = new mongoose.Schema(
  {
    // 任务标识
    taskId: { type: String, required: true, unique: true },
    
    // 文件信息
    originalFileName: { type: String, required: true },
    fileSize: Number,
    mimeType: String,
    storageKey: String,
    
    // Live Photo 信息
    isLivePhoto: { type: Boolean, default: false },
    pairedFile: String, // 配对的视频/图片文件名
    baseName: String, // 文件基础名（不含扩展名）
    
    // 任务状态
    status: {
      type: String,
      enum: ['pending', 'uploading', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    
    // 处理阶段
    stage: {
      type: String,
      enum: [
        'upload',
        'format_conversion', // HEIC -> JPEG
        'metadata_extraction', // EXIF提取
        'thumbnail_generation',
        'location_lookup', // 反向地理编码
        'database_save',
        'tag_recognition'
      ],
    },
    
    // 进度
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    
    // 错误信息
    error: {
      message: String,
      stack: String,
      stage: String
    },
    
    // 重试次数
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    
    // 优先级
    priority: {
      type: Number,
      default: 0,
      min: 0,
      max: 10
    },
    
    // 关联的照片ID（处理完成后）
    photoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Photo' },
    
    // 上传者
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    // 完成时间
    completedAt: Date,
    failedAt: Date
  },
  {
    timestamps: true
  }
)

uploadTaskSchema.index({ status: 1 })
uploadTaskSchema.index({ uploadedBy: 1 })
uploadTaskSchema.index({ createdAt: -1 })
uploadTaskSchema.index({ priority: -1, createdAt: 1 }) // 按优先级和创建时间排序

module.exports = mongoose.model('UploadTask', uploadTaskSchema)
