const mongoose = require('mongoose');

const ArticleSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },                // 文章标题
    content: { type: String, required: true },                          // 文章内容（HTML格式）
    coverImage: { type: String, trim: true },                           // 封面图片 URL
    summary: { type: String, trim: true },                              // 摘要
    category: { type: String, trim: true },                             // 分类
    tags: [{ type: String, trim: true }],                               // 标签数组
    status: { 
        type: String, 
        enum: ['draft', 'published'], 
        default: 'draft' 
    },                                                                   // 发布状态
    author: {
        name: { type: String, required: true },                         // 作者名称
        avatar: { type: String },                                       // 作者头像
        bio: { type: String }                                           // 作者简介
    },
    views: { type: Number, default: 0 },                                // 浏览次数
    likes: { type: Number, default: 0 },                                // 点赞次数
    likedBy: [{ type: String }],                                        // 点赞用户 IP 列表
    publishedAt: { type: Date },                                        // 发布时间
    isTop: { type: Boolean, default: false },                           // 是否置顶
    allowComment: { type: Boolean, default: true }                      // 是否允许评论
}, { timestamps: true });

// 索引
ArticleSchema.index({ status: 1, publishedAt: -1 });
ArticleSchema.index({ category: 1 });
ArticleSchema.index({ tags: 1 });
ArticleSchema.index({ title: 'text', summary: 'text', content: 'text' });  // 全文搜索索引

module.exports = mongoose.model('Article', ArticleSchema);
