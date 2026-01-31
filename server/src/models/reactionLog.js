const mongoose = require('mongoose');

const ReactionLogSchema = new mongoose.Schema(
  {
    targetType: { type: String, required: true, index: true },
    targetId: { type: String, required: true, index: true },
    type: { type: String, required: true, index: true },
    ip: { type: String, required: true, index: true }
  },
  { timestamps: true }
);

ReactionLogSchema.index({ targetType: 1, targetId: 1, type: 1, ip: 1 }, { unique: true });

module.exports = mongoose.model('ReactionLog', ReactionLogSchema);
