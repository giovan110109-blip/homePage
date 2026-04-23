const BaseService = require('../utils/baseService');
const ProductAccessAudit = require('../models/productAccessAudit');

class ProductAccessAuditService extends BaseService {
  constructor() {
    super(ProductAccessAudit);
  }

  async record(payload = {}) {
    return this.create({
      actorId: payload.actorId || null,
      actorName: payload.actorName || '',
      action: payload.action,
      resourceType: payload.resourceType,
      resourceId: payload.resourceId || '',
      resourceName: payload.resourceName || '',
      productCode: payload.productCode || '',
      targetUserId: payload.targetUserId || null,
      targetUsername: payload.targetUsername || '',
      summary: payload.summary || '',
      changes: payload.changes ?? null,
    });
  }
}

module.exports = new ProductAccessAuditService();
