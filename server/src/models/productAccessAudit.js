const mongoose = require('mongoose');

const ProductAccessAuditSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    actorName: { type: String, trim: true, default: '' },
    action: {
      type: String,
      enum: ['create', 'update', 'delete', 'grant-update'],
      required: true,
      index: true,
    },
    resourceType: {
      type: String,
      enum: ['product', 'product-role', 'product-permission', 'user-product-grant'],
      required: true,
      index: true,
    },
    resourceId: { type: String, trim: true, default: '' },
    resourceName: { type: String, trim: true, default: '' },
    productCode: { type: String, trim: true, default: '', index: true },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    targetUsername: { type: String, trim: true, default: '' },
    summary: { type: String, trim: true, default: '' },
    changes: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

ProductAccessAuditSchema.index({ createdAt: -1, productCode: 1 });

module.exports = mongoose.model('ProductAccessAudit', ProductAccessAuditSchema);
