const mongoose = require('mongoose');

const UserProductGrantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    productCode: { type: String, required: true, trim: true, index: true },
    enabled: { type: Boolean, default: false },
    roleCodes: [{ type: String, trim: true }],
    extraPermissionCodes: [{ type: String, trim: true }],
    denyPermissionCodes: [{ type: String, trim: true }],
    expiresAt: { type: Date, default: null },
    remark: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

UserProductGrantSchema.index({ userId: 1, productCode: 1 }, { unique: true });

module.exports = mongoose.model('UserProductGrant', UserProductGrantSchema);
