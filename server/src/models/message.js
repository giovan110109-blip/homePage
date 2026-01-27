const mongoose = require('mongoose');

// IP 定位信息
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

const MessageSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },                 // 留言者姓名/昵称
    email: { type: String, required: true, trim: true },                // 联系邮箱
    website: { type: String, trim: true },                              // 个人网站（可选）
    content: { type: String, required: true, trim: true },              // 留言内容
    status: { type: String, enum: ['pending', 'approved'], default: 'pending' }, // 审核状态
    ip: { type: String, trim: true },                                   // 客户端 IP
    userAgent: { type: String, trim: true },                            // 原始 UA
    browser: { type: String, trim: true },                              // 解析后的浏览器
    os: { type: String, trim: true },                                   // 解析后的操作系统
    deviceType: { type: String, trim: true },                           // 设备类型（desktop/mobile）
    referer: { type: String, trim: true },                              // 来源页面 Referer
    language: { type: String, trim: true },                             // Accept-Language
    location: LocationSchema                                            // IP 定位信息
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);
