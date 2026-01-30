const mongoose = require('mongoose');

// IP 定位信息（复用结构）
const LocationSchema = new mongoose.Schema({
    city: String,          // 城市
    region: String,        // 省/州/区域
    country: String,       // 国家名称
    countryCode: String,   // 国家代码（如 CN/US）
    isp: String,           // 运营商/ISP
    org: String,           // 组织/ASN
    lat: Number,           // 纬度
    lon: Number            // 经度
}, { _id: false });

const FriendLinkSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },                 // 网站名称
    url: { type: String, required: true, trim: true },                  // 网站链接
    description: { type: String, required: true, trim: true },          // 网站描述
    avatar: { type: String, trim: true },                               // 网站头像/Logo URL
    email: { type: String, required: true, trim: true },                // 联系邮箱
    rss: { type: String, trim: true },                                  // RSS 订阅地址（可选）
    category: { type: String, default: 'other', trim: true },           // 分类（技术博客、设计、工具等）
    tags: [{ type: String, trim: true }],                               // 标签
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'], 
        default: 'pending' 
    },                                                                   // 审核状态
    reason: { type: String, trim: true },                               // 拒绝原因（status=rejected 时）
    sort: { type: Number, default: 0 },                                 // 排序权重，越大越靠前
    isActive: { type: Boolean, default: true },                         // 是否显示
    ip: { type: String, trim: true },                                   // 申请者 IP
    userAgent: { type: String, trim: true },                            // 原始 UA
    browser: { type: String, trim: true },                              // 解析后的浏览器
    os: { type: String, trim: true },                                   // 解析后的操作系统
    deviceType: { type: String, trim: true },                           // 设备类型
    referer: { type: String, trim: true },                              // 来源页面
    location: LocationSchema,                                           // IP 定位信息
    clicks: { type: Number, default: 0 },                               // 点击次数统计
    lastClickedAt: { type: Date },                                      // 最后点击时间
    reviewedAt: { type: Date },                                         // 审核时间
    reviewedBy: { type: String, trim: true }                            // 审核人
}, { timestamps: true });

// 索引
FriendLinkSchema.index({ status: 1, isActive: 1, sort: -1 });
FriendLinkSchema.index({ email: 1 });
FriendLinkSchema.index({ createdAt: -1 });

module.exports = mongoose.model('FriendLink', FriendLinkSchema);
