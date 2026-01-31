const mongoose = require('mongoose')

const albumSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    coverPhoto: { type: mongoose.Schema.Types.ObjectId, ref: 'Photo' },
    
    // 相册类型
    type: {
      type: String,
      enum: ['normal', 'smart'], // smart 相册基于条件自动添加照片
      default: 'normal'
    },
    
    // 智能相册条件
    smartCriteria: {
      tags: [String],
      dateRange: {
        start: Date,
        end: Date
      },
      location: {
        country: String,
        city: String
      },
      camera: {
        make: String,
        model: String
      }
    },
    
    // 可见性
    visibility: {
      type: String,
      enum: ['public', 'unlisted', 'private'],
      default: 'public'
    },
    
    // 排序
    sortOrder: {
      type: String,
      enum: ['dateTaken_desc', 'dateTaken_asc', 'created_desc', 'created_asc', 'manual'],
      default: 'dateTaken_desc'
    },
    
    // 创建者
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  {
    timestamps: true
  }
)

albumSchema.index({ createdBy: 1 })
albumSchema.index({ visibility: 1 })
albumSchema.index({ type: 1 })

module.exports = mongoose.model('Album', albumSchema)
