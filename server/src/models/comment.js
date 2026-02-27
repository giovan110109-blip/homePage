const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  targetId: { type: String, required: true },
  parentId: { type: String, default: null },
  name: { type: String, required: true },
  email: { type: String, required: true },
  website: { type: String },
  avatar: { type: String },
  content: { type: String, required: true },
  status: { type: String, default: 'approved' },
  ip: { type: String },
  userAgent: { type: String },
  browser: { type: String },
  os: { type: String },
  deviceType: { type: String },
  referer: { type: String },
  language: { type: String },
  location: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

CommentSchema.index({ targetId: 1, status: 1, createdAt: -1 });
CommentSchema.index({ parentId: 1 });
CommentSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', CommentSchema);
