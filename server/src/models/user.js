const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, trim: true, unique: true },
    passwordHash: { type: String, required: true },
    nickname: { type: String, trim: true },
    realName: { type: String, trim: true },
    avatar: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    gender: { type: String, enum: ['male', 'female', 'unknown'], default: 'unknown' },
    birthday: { type: Date },
    location: { type: String, trim: true },
    bio: { type: String, trim: true },
    roleIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }],
    status: { type: String, enum: ['active', 'inactive', 'banned'], default: 'active' },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });

module.exports = mongoose.model('User', UserSchema);