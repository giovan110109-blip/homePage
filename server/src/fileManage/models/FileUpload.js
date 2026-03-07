const mongoose = require('mongoose')

const fileChunkSchema = new mongoose.Schema(
  {
    uploadId: { type: String, required: true, index: true },
    chunkIndex: { type: Number, required: true },
    chunkHash: { type: String, required: true },
    chunkSize: { type: Number, required: true },
    storageKey: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
  },
  { timestamps: false }
)

fileChunkSchema.index({ uploadId: 1, chunkIndex: 1 }, { unique: true })

const fileUploadSchema = new mongoose.Schema(
  {
    uploadId: { type: String, required: true, unique: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String },
    chunkSize: { type: Number, required: true },
    totalChunks: { type: Number, required: true },
    uploadedChunks: [{ type: Number }],
    fileHash: { type: String },
    status: {
      type: String,
      enum: ['uploading', 'completed', 'cancelled', 'expired'],
      default: 'uploading'
    },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'FileItem', default: null },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'FileItem' },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
    completedAt: { type: Date }
  },
  { timestamps: true }
)

fileUploadSchema.index({ owner: 1, status: 1 })
fileUploadSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

fileUploadSchema.methods.getProgress = function() {
  return Math.round((this.uploadedChunks.length / this.totalChunks) * 100)
}

fileUploadSchema.methods.isChunkUploaded = function(chunkIndex) {
  return this.uploadedChunks.includes(chunkIndex)
}

fileUploadSchema.methods.getMissingChunks = function() {
  const allChunks = Array.from({ length: this.totalChunks }, (_, i) => i)
  return allChunks.filter(i => !this.uploadedChunks.includes(i))
}

module.exports = {
  FileChunk: mongoose.model('FileChunk', fileChunkSchema),
  FileUpload: mongoose.model('FileUpload', fileUploadSchema)
}
