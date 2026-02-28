const mongoose = require('mongoose');

const SponsorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  amount: { type: Number, required: true },
  message: { type: String, trim: true },
  date: { type: Date, default: Date.now },
  method: { type: mongoose.Schema.Types.ObjectId, ref: 'SponsorMethod' },
}, { timestamps: true });

SponsorSchema.index({ date: -1 });
SponsorSchema.index({ method: 1 });

module.exports = mongoose.model('Sponsor', SponsorSchema);
