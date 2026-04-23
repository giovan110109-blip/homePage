const mongoose = require('mongoose');

const ProductRoleSchema = new mongoose.Schema(
  {
    productCode: { type: String, required: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true, default: '' },
    summary: { type: String, trim: true, default: '' },
    suggestedFor: { type: String, trim: true, default: '' },
    permissionCodes: [{ type: String, trim: true }],
    sort: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    isBuiltIn: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ProductRoleSchema.index({ productCode: 1, sort: 1 });

module.exports = mongoose.model('ProductRole', ProductRoleSchema);
