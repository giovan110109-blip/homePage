const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  username: {
    type: String,
    required: true
  },
  nickname: {
    type: String
  },
  avatar: {
    type: String
  },
  role: {
    type: String,
    default: 'user'
  },
  roles: [{
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role'
    },
    name: {
      type: String
    },
    code: {
      type: String
    }
  }],
  roleIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role'
  }],
  expiresAt: {
    type: Date,
    required: true,
    expires: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

tokenSchema.index({ userId: 1, expiresAt: 1 });

module.exports = mongoose.model('Token', tokenSchema);
