const BaseController = require('../utils/baseController');
const productAccessService = require('../services/productAccessService');
const productAccessAuditService = require('../services/productAccessAuditService');

const getActor = (ctx) => ({
  actorId: ctx.state.user?._id || null,
  actorName: ctx.state.user?.nickname || ctx.state.user?.username || '',
});

class ProductRoleController extends BaseController {
  async list(ctx) {
    try {
      const { productCode, keyword, status } = ctx.query;
      const items = await productAccessService.listProductRoles({
        productCode,
        keyword,
        status,
      });
      this.ok(ctx, items, '获取产品角色列表成功');
    } catch (error) {
      this.fail(ctx, error);
    }
  }

  async byProduct(ctx) {
    try {
      const items = await productAccessService.getProductRoleOptions(ctx.params.productCode);
      this.ok(ctx, items, '获取产品角色选项成功');
    } catch (error) {
      this.fail(ctx, error);
    }
  }

  async create(ctx) {
    try {
      const item = await productAccessService.createProductRole(ctx.request.body || {});
      await productAccessAuditService.record({
        ...getActor(ctx),
        action: 'create',
        resourceType: 'product-role',
        resourceId: item.id || String(item._id || ''),
        resourceName: item.name,
        productCode: item.productCode,
        summary: `创建产品角色 ${item.name}`,
        changes: ctx.request.body || {},
      });
      this.created(ctx, item, '产品角色创建成功');
    } catch (error) {
      this.fail(ctx, error);
    }
  }

  async update(ctx) {
    try {
      const item = await productAccessService.updateProductRole(ctx.params.id, ctx.request.body || {});
      await productAccessAuditService.record({
        ...getActor(ctx),
        action: 'update',
        resourceType: 'product-role',
        resourceId: item.id || String(item._id || ctx.params.id),
        resourceName: item.name,
        productCode: item.productCode,
        summary: `更新产品角色 ${item.name}`,
        changes: ctx.request.body || {},
      });
      this.ok(ctx, item, '产品角色更新成功');
    } catch (error) {
      this.fail(ctx, error);
    }
  }

  async delete(ctx) {
    try {
      await productAccessService.deleteProductRole(ctx.params.id);
      await productAccessAuditService.record({
        ...getActor(ctx),
        action: 'delete',
        resourceType: 'product-role',
        resourceId: ctx.params.id,
        summary: `删除产品角色 ${ctx.params.id}`,
      });
      this.ok(ctx, null, '产品角色删除成功');
    } catch (error) {
      this.fail(ctx, error);
    }
  }
}

module.exports = new ProductRoleController();
