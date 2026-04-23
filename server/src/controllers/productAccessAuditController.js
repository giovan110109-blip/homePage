const BaseController = require('../utils/baseController');
const productAccessAuditService = require('../services/productAccessAuditService');

class ProductAccessAuditController extends BaseController {
  async list(ctx) {
    try {
      const {
        page = 1,
        pageSize = 20,
        productCode,
        resourceType,
        action,
        targetUserId,
      } = ctx.query;

      const filter = {};
      if (productCode) filter.productCode = productCode;
      if (resourceType) filter.resourceType = resourceType;
      if (action) filter.action = action;
      if (targetUserId) filter.targetUserId = targetUserId;

      const { items, pagination } = await productAccessAuditService.paginate(filter, {
        page,
        pageSize,
        sort: { createdAt: -1 },
      });

      this.paginated(ctx, items, pagination, '获取产品权限审计日志成功');
    } catch (error) {
      this.fail(ctx, error);
    }
  }
}

module.exports = new ProductAccessAuditController();
