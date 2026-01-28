const mongoose = require('mongoose');

const FooterContactSchema = new mongoose.Schema({
  email: { type: String, trim: true },
  phone: { type: String, trim: true },
  wechat: { type: String, trim: true },
  address: { type: String, trim: true },
}, { _id: false });

const SocialLinkSchema = new mongoose.Schema({
  platform: { type: String, trim: true },
  url: { type: String, trim: true },
  icon: { type: String, trim: true },
}, { _id: false });

const SiteInfoSchema = new mongoose.Schema({
  // 个人信息
  name: { type: String, trim: true },
  title: { type: String, trim: true },
  bio: { type: String, trim: true },
  avatar: { type: String, trim: true },
  email: { type: String, trim: true },
  wechat: { type: String, trim: true },
  location: { type: String, trim: true },
  website: { type: String, trim: true },
  socialLinks: [SocialLinkSchema],

  // 网站信息
  siteName: { type: String, trim: true },
  siteLogo: { type: String, trim: true },
  siteTitle: { type: String, trim: true },
  siteDescription: { type: String, trim: true },

  // 备案与底部联系方式
  icp: { type: String, trim: true },
  icpLink: { type: String, trim: true },
  publicSecurity: { type: String, trim: true },
  publicSecurityLink: { type: String, trim: true },
  footerContact: FooterContactSchema,
}, { timestamps: true });

module.exports = mongoose.model('SiteInfo', SiteInfoSchema);