const BaseController = require('../utils/baseController');
const productAccessService = require('../services/productAccessService');
const productAccessAuditService = require('../services/productAccessAuditService');

const getActor = (ctx) => ({
  actorId: ctx.state.user?._id || null,
  actorName: ctx.state.user?.nickname || ctx.state.user?.username || '',
});

class ProductController extends BaseController {
  async list(ctx) {
    try {
      const { keyword, status } = ctx.query;
      const items = await productAccessService.listProducts({ keyword, status });
      this.ok(ctx, items, '获取产品列表成功');
    } catch (error) {
      this.fail(ctx, error);
    }
  }

  async getAll(ctx) {
    try {
      const items = await productAccessService.getProductOptions();
      this.ok(ctx, items, '获取产品选项成功');
    } catch (error) {
      this.fail(ctx, error);
    }
  }

  async create(ctx) {
    try {
      const item = await productAccessService.createProduct(ctx.request.body || {});
      await productAccessAuditService.record({
        ...getActor(ctx),
        action: 'create',
        resourceType: 'product',
        resourceId: item.id,
        resourceName: item.name,
        productCode: item.code,
        summary: `创建产品 ${item.name}`,
        changes: ctx.request.body || {},
      });
      this.created(ctx, item, '产品创建成功');
    } catch (error) {
      this.fail(ctx, error);
    }
  }

  async update(ctx) {
    try {
      const item = await productAccessService.updateProduct(ctx.params.id, ctx.request.body || {});
      await productAccessAuditService.record({
        ...getActor(ctx),
        action: 'update',
        resourceType: 'product',
        resourceId: item.id,
        resourceName: item.name,
        productCode: item.code,
        summary: `更新产品 ${item.name}`,
        changes: ctx.request.body || {},
      });
      this.ok(ctx, item, '产品更新成功');
    } catch (error) {
      this.fail(ctx, error);
    }
  }

  async delete(ctx) {
    try {
      await productAccessService.deleteProduct(ctx.params.id);
      await productAccessAuditService.record({
        ...getActor(ctx),
        action: 'delete',
        resourceType: 'product',
        resourceId: ctx.params.id,
        summary: `删除产品 ${ctx.params.id}`,
      });
      this.ok(ctx, null, '产品删除成功');
    } catch (error) {
      this.fail(ctx, error);
    }
  }
}

module.exports = new ProductController();
