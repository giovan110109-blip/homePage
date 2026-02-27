const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
    city: String,
    region: String,
    country: String,
    countryCode: String,
    isp: String,
    org: String,
    lat: Number,
    lon: Number
}, { _id: false });

const MessageSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    website: { type: String, trim: true },
    avatar: { type: String, trim: true },
    content: { type: String, required: true, trim: true },
    status: { type: String, enum: ['pending', 'approved'], default: 'pending' },
    ip: { type: String, trim: true },
    userAgent: { type: String, trim: true },
    browser: { type: String, trim: true },
    os: { type: String, trim: true },
    deviceType: { type: String, trim: true },
    referer: { type: String, trim: true },
    language: { type: String, trim: true },
    location: LocationSchema
}, { timestamps: true });

MessageSchema.index({ status: 1, createdAt: -1 });
MessageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Message', MessageSchema);
