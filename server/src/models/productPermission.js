const mongoose = require('mongoose');

const ProductPermissionSchema = new mongoose.Schema(
  {
    productCode: { type: String, required: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true, default: '' },
    groupKey: { type: String, required: true, trim: true },
    groupLabel: { type: String, required: true, trim: true },
    groupDescription: { type: String, trim: true, default: '' },
    sort: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

ProductPermissionSchema.index({ productCode: 1, groupKey: 1, sort: 1 });

module.exports = mongoose.model('ProductPermission', ProductPermissionSchema);
