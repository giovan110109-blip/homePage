const mongoose = require('mongoose')

const shareSchema = new mongoose.Schema(
  {
    shareCode: { type: String, required: true, unique: true },
    fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'FileItem', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    password: { type: String },
    expiresAt: { type: Date },
    maxDownloads: { type: Number, default: 0 },
    downloadCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  {
    timestamps: true
  }
)

shareSchema.index({ shareCode: 1 })
shareSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

module.exports = mongoose.model('Share', shareSchema)
