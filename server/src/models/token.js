const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Token', tokenSchema);
