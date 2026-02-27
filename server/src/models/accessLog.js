const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
  city: String,
  region: String,
  country: String,
  countryCode: String,
  isp: String,
  org: String,
  lat: Number,
  lon: Number,
}, { _id: false });

const AccessLogSchema = new mongoose.Schema({
  ip: { type: String, trim: true },
  page: { type: String, trim: true },
  title: { type: String, trim: true },
  path: { type: String, trim: true },
  method: { type: String, trim: true },
  status: { type: Number },
  duration: { type: Number },
  userAgent: { type: String, trim: true },
  browser: { type: String, trim: true },
  os: { type: String, trim: true },
  deviceType: { type: String, trim: true },
  referer: { type: String, trim: true },
  language: { type: String, trim: true },
  location: LocationSchema,
}, { timestamps: true });

AccessLogSchema.index({ createdAt: -1 });
AccessLogSchema.index({ ip: 1 });
AccessLogSchema.index({ path: 1 });

module.exports = mongoose.model('AccessLog', AccessLogSchema);
