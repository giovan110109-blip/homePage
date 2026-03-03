const mongoose = require('mongoose');

const QrSessionSchema = new mongoose.Schema({
  qrToken: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'scanned', 'confirmed'],
    default: 'pending'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userInfo: {
    _id: String,
    nickname: String,
    avatar: String,
    role: String
  },
  pcToken: {
    type: String
  },
  expiresAt: {
    type: Date,
    required: true,
    expires: 0
  }
}, {
  timestamps: true
});

QrSessionSchema.index({ qrToken: 1 });
QrSessionSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('QrSession', QrSessionSchema);
