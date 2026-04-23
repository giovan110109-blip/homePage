const BaseController = require('../utils/baseController');
const productAccessService = require('../services/productAccessService');
const productAccessAuditService = require('../services/productAccessAuditService');

const getActor = (ctx) => ({
  actorId: ctx.state.user?._id || null,
  actorName: ctx.state.user?.nickname || ctx.state.user?.username || '',
});

class ProductPermissionController extends BaseController {
  async list(ctx) {
    try {
      const { productCode, status } = ctx.query;
      const items = await productAccessService.listProductPermissions({
        productCode,
        status,
      });
      this.ok(ctx, items, '获取产品权限列表成功');
    } catch (error) {
      this.fail(ctx, error);
    }
  }

  async byProduct(ctx) {
    try {
      const items = await productAccessService.getProductPermissionGroups(ctx.params.productCode);
      this.ok(ctx, items, '获取产品权限分组成功');
    } catch (error) {
      this.fail(ctx, error);
    }
  }

  async meta(ctx) {
    try {
      const data = await productAccessService.getAdminMeta();
      this.ok(ctx, data, '获取产品权限元数据成功');
    } catch (error) {
      this.fail(ctx, error);
    }
  }

  async create(ctx) {
    try {
      const item = await productAccessService.createProductPermission(ctx.request.body || {});
      await productAccessAuditService.record({
        ...getActor(ctx),
        action: 'create',
        resourceType: 'product-permission',
        resourceId: String(item._id || item.id || ''),
        resourceName: item.name,
        productCode: item.productCode,
        summary: `创建产品权限 ${item.name}`,
        changes: ctx.request.body || {},
      });
      this.created(ctx, item, '产品权限创建成功');
    } catch (error) {
      this.fail(ctx, error);
    }
  }

  async update(ctx) {
    try {
      const item = await productAccessService.updateProductPermission(
        ctx.params.id,
        ctx.request.body || {},
      );
      await productAccessAuditService.record({
        ...getActor(ctx),
        action: 'update',
        resourceType: 'product-permission',
        resourceId: String(item._id || item.id || ctx.params.id),
        resourceName: item.name,
        productCode: item.productCode,
        summary: `更新产品权限 ${item.name}`,
        changes: ctx.request.body || {},
      });
      this.ok(ctx, item, '产品权限更新成功');
    } catch (error) {
      this.fail(ctx, error);
    }
  }

  async delete(ctx) {
    try {
      await productAccessService.deleteProductPermission(ctx.params.id);
      await productAccessAuditService.record({
        ...getActor(ctx),
        action: 'delete',
        resourceType: 'product-permission',
        resourceId: ctx.params.id,
        summary: `删除产品权限 ${ctx.params.id}`,
      });
      this.ok(ctx, null, '产品权限删除成功');
    } catch (error) {
      this.fail(ctx, error);
    }
  }
}

module.exports = new ProductPermissionController();
