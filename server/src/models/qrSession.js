const mongoose = require('mongoose');

const QrSessionSchema = new mongoose.Schema({
  qrToken: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'scanned', 'confirmed', 'denied'],
    default: 'pending'
  },
  productCode: {
    type: String,
    default: ''
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userInfo: {
    _id: String,
    nickname: String,
    avatar: String,
    roles: [{
      _id: String,
      name: String,
      code: String
    }]
  },
  pcToken: {
    type: String
  },
  errorMessage: {
    type: String,
    default: ''
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
