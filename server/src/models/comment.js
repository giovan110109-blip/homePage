const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  targetId: { type: String, required: true }, // 关联对象，如文章ID、留言板ID
  parentId: { type: String, default: null }, // 主评论为null，回复为评论ID
  name: { type: String, required: true },
  email: { type: String, required: true },
  website: { type: String },
  avatar: { type: String },
  content: { type: String, required: true },
  status: { type: String, default: 'approved' }, // 状态：approved, pending, deleted
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

module.exports = mongoose.model('Comment', CommentSchema);
