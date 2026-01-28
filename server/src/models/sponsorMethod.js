const mongoose = require('mongoose');

const SponsorMethodSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  icon: { type: String, trim: true },
  qrCode: { type: String, trim: true },
  description: { type: String, trim: true },
  sort: { type: Number, default: 0 },
  enabled: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('SponsorMethod', SponsorMethodSchema);
