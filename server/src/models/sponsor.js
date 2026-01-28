const mongoose = require('mongoose');

const SponsorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  amount: { type: Number, required: true },
  message: { type: String, trim: true },
  date: { type: Date, default: Date.now },
  method: { type: mongoose.Schema.Types.ObjectId, ref: 'SponsorMethod' },
}, { timestamps: true });

module.exports = mongoose.model('Sponsor', SponsorSchema);
