const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true, default: '' },
    accessMode: { type: String, trim: true, default: '来源识别' },
    homePath: { type: String, trim: true, default: '' },
    loginPath: { type: String, trim: true, default: '' },
    icon: { type: String, trim: true, default: '' },
    origins: [{ type: String, trim: true }],
    pathPrefixes: [{ type: String, trim: true }],
    sort: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

ProductSchema.index({ status: 1, sort: 1 });

module.exports = mongoose.model('Product', ProductSchema);
