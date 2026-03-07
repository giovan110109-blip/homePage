const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const fileItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ['file', 'folder'], required: true },
    size: { type: Number, default: 0 },
    mimeType: { type: String },
    extension: { type: String },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'FileItem', default: null },
    path: { type: String, default: '/' },
    storageKey: { type: String },
    thumbnailKey: { type: String },
    url: { type: String },
    thumbnailUrl: { type: String },
    description: { type: String },
    tags: [{ type: String }],
    isFavorite: { type: Boolean, default: false },
    isLocked: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false },
    isPrivate: { type: Boolean, default: false },
    password: { type: String },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    permissions: {
      read: { type: Boolean, default: true },
      write: { type: Boolean, default: true },
      delete: { type: Boolean, default: true },
      share: { type: Boolean, default: true }
    },
    metadata: {
      width: { type: Number },
      height: { type: Number },
      duration: { type: Number },
      pages: { type: Number },
      author: { type: String },
      createdAt: { type: Date },
      modifiedAt: { type: Date }
    },
    version: { type: Number, default: 1 },
    versions: [{
      version: { type: Number },
      storageKey: { type: String },
      size: { type: Number },
      createdAt: { type: Date },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
    trashInfo: {
      deletedAt: { type: Date },
      deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      originalPath: { type: String }
    },
    isDeleted: { type: Boolean, default: false }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

fileItemSchema.virtual('children', {
  ref: 'FileItem',
  localField: '_id',
  foreignField: 'parentId'
})

fileItemSchema.index({ owner: 1, parentId: 1, isDeleted: 1 })
fileItemSchema.index({ owner: 1, name: 1 })
fileItemSchema.index({ owner: 1, type: 1 })
fileItemSchema.index({ owner: 1, isFavorite: 1 })
fileItemSchema.index({ owner: 1, isDeleted: 1, deletedAt: 1 })

fileItemSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.extension = this.name.includes('.') 
      ? this.name.split('.').pop().toLowerCase() 
      : null
  }
  next()
})

fileItemSchema.methods.getFullPath = function() {
  return this.parentId ? `${this.path}/${this.name}` : `/${this.name}`
}

fileItemSchema.statics.findByPath = function(ownerId, path) {
  return this.findOne({ owner: ownerId, path: path, isDeleted: false })
}

fileItemSchema.statics.findChildren = function(parentId, ownerId) {
  const query = { owner: ownerId, isDeleted: false }
  if (parentId) {
    query.parentId = parentId
  } else {
    query.parentId = null
  }
  return this.find(query).sort({ type: 1, name: 1 })
}

fileItemSchema.statics.findDeleted = function(ownerId) {
  return this.find({ owner: ownerId, isDeleted: true }).sort({ 'trashInfo.deletedAt': -1 })
}

fileItemSchema.statics.search = function(ownerId, keyword, options = {}) {
  const query = {
    owner: ownerId,
    isDeleted: false,
    name: { $regex: keyword, $options: 'i' }
  }
  
  if (options.type) {
    query.type = options.type
  }
  
  if (options.mimeType) {
    query.mimeType = { $regex: options.mimeType, $options: 'i' }
  }
  
  return this.find(query)
    .sort({ [options.sortBy || 'name']: options.sortOrder === 'desc' ? -1 : 1 })
    .limit(options.limit || 50)
}

module.exports = mongoose.model('FileItem', fileItemSchema)
