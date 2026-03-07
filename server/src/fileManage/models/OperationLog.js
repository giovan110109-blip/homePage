const mongoose = require('mongoose')

const operationLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { 
      type: String, 
      required: true,
      enum: ['upload', 'download', 'delete', 'rename', 'move', 'copy', 'create_folder', 'share', 'favorite', 'login', 'logout']
    },
    resourceType: { type: String, enum: ['file', 'folder', 'share'], default: 'file' },
    resourceId: { type: mongoose.Schema.Types.ObjectId },
    resourceName: { type: String },
    details: { type: mongoose.Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String }
  },
  {
    timestamps: true
  }
)

operationLogSchema.index({ user: 1, createdAt: -1 })
operationLogSchema.index({ action: 1 })
operationLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 })

module.exports = mongoose.model('OperationLog', operationLogSchema)
