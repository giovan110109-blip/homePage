const BaseController = require("../utils/baseController");
const { HttpStatus } = require("../utils/response");
const sponsorMethodService = require("../services/sponsorMethodService");

class SponsorMethodController extends BaseController {
  // GET /api/sponsor-methods
  async listPublic(ctx) {
    try {
      const items = await sponsorMethodService.findManyByFields(
        { enabled: true },
        { sort: { sort: 1, createdAt: -1 } },
      );
      this.ok(ctx, items, "Fetched sponsor methods");
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  // GET /api/admin/sponsor-methods
  async listAdmin(ctx) {
    try {
      const items = await sponsorMethodService.findManyByFields(
        {},
        { sort: { sort: 1, createdAt: -1 } },
      );
      this.ok(ctx, items, "Fetched sponsor methods");
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  // POST /api/admin/sponsor-methods
  async create(ctx) {
    try {
      const payload = ctx.request.body || {};
      if (!payload.name) {
        this.throwHttpError("name is required", HttpStatus.BAD_REQUEST);
      }

      const doc = await sponsorMethodService.create({
        name: payload.name,
        icon: payload.icon,
        qrCode: payload.qrCode,
        description: payload.description,
        sort: payload.sort ?? 0,
        enabled: payload.enabled !== false,
      });

      this.created(ctx, doc, "赞助方式创建成功");
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  // PUT /api/admin/sponsor-methods/:id
  async update(ctx) {
    try {
      const payload = ctx.request.body || {};
      const updated = await sponsorMethodService.updateById(
        ctx.params.id,
        payload,
      );
      if (!updated) this.throwHttpError("赞助方式未找到", HttpStatus.NOT_FOUND);
      this.ok(ctx, updated, "赞助方式更新成功");
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  // DELETE /api/admin/sponsor-methods/:id
  async remove(ctx) {
    try {
      const removed = await sponsorMethodService.deleteById(ctx.params.id);
      if (!removed) this.throwHttpError("赞助方式未找到", HttpStatus.NOT_FOUND);
      this.ok(ctx, removed, "赞助方式删除成功");
    } catch (err) {
      this.fail(ctx, err);
    }
  }
}

module.exports = new SponsorMethodController();
