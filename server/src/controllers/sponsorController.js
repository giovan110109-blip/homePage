const BaseController = require("../utils/baseController");
const { HttpStatus } = require("../utils/response");
const sponsorService = require("../services/sponsorService");

class SponsorController extends BaseController {
  // GET /api/sponsors
  async listPublic(ctx) {
    try {
      const { page = 1, pageSize = 50 } = ctx.query;
      const { items, pagination } = await sponsorService.paginate(
        {},
        {
          page,
          pageSize,
          sort: { date: -1, createdAt: -1 },
          populate: { path: "method", select: "name icon qrCode" },
        },
      );
      this.paginated(ctx, items, pagination, "获取赞助列表成功");
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  // GET /api/admin/sponsors
  async listAdmin(ctx) {
    try {
      const { page = 1, pageSize = 20 } = ctx.query;
      const { items, pagination } = await sponsorService.paginate(
        {},
        {
          page,
          pageSize,
          sort: { date: -1, createdAt: -1 },
          populate: { path: "method", select: "name icon qrCode" },
        },
      );
      this.paginated(ctx, items, pagination, "获取赞助列表成功");
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  // POST /api/admin/sponsors
  async create(ctx) {
    try {
      const payload = ctx.request.body || {};
      if (!payload.name || payload.amount === undefined) {
        this.throwHttpError("名称和金额是必填项", HttpStatus.BAD_REQUEST);
      }

      const amount = Number(payload.amount);
      if (!Number.isFinite(amount)) {
        this.throwHttpError("金额必须是数字", HttpStatus.BAD_REQUEST);
      }

      const doc = await sponsorService.create({
        name: payload.name,
        amount,
        message: payload.message,
        date: payload.date || undefined,
        method: payload.method || undefined,
      });

      this.created(ctx, doc, "赞助创建成功");
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  // PUT /api/admin/sponsors/:id
  async update(ctx) {
    try {
      const payload = ctx.request.body || {};
      if (payload.amount !== undefined) {
        const amount = Number(payload.amount);
        if (!Number.isFinite(amount)) {
          this.throwHttpError("金额必须是数字", HttpStatus.BAD_REQUEST);
        }
        payload.amount = amount;
      }

      const updated = await sponsorService.updateById(ctx.params.id, payload);
      if (!updated) this.throwHttpError("赞助未找到", HttpStatus.NOT_FOUND);
      this.ok(ctx, updated, "赞助更新成功");
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  // DELETE /api/admin/sponsors/:id
  async remove(ctx) {
    try {
      const removed = await sponsorService.deleteById(ctx.params.id);
      if (!removed) this.throwHttpError("赞助未找到", HttpStatus.NOT_FOUND);
      this.ok(ctx, removed, "赞助删除成功");
    } catch (err) {
      this.fail(ctx, err);
    }
  }
}

module.exports = new SponsorController();
