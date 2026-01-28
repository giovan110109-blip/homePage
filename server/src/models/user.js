const mongoose = require('mongoose');

// 用户基础信息（预留微信登录相关字段）
const UserSchema = new mongoose.Schema(
  {
    username: { type: String, trim: true, unique: true, sparse: true }, // 账号（后台登录）
    passwordHash: { type: String, trim: true }, // 密码哈希（后台登录）
    role: { type: String, enum: ['admin', 'user'], default: 'user' }, // 角色
    status: { type: String, enum: ['active', 'disabled'], default: 'active' }, // 状态

    // 个人信息
    nickname: { type: String, trim: true },
    realName: { type: String, trim: true },
    avatar: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    gender: { type: String, enum: ['unknown', 'male', 'female'], default: 'unknown' },
    birthday: { type: Date },
    location: { type: String, trim: true },

    // 微信小程序登录预留字段
    wechatOpenId: { type: String, trim: true, unique: true, sparse: true },
    wechatUnionId: { type: String, trim: true, unique: true, sparse: true },
    wechatSessionKey: { type: String, trim: true },
    wechatNickname: { type: String, trim: true },
    wechatAvatar: { type: String, trim: true },

    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);