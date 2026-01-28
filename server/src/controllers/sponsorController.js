const BaseController = require('../utils/baseController');
const { HttpStatus } = require('../utils/response');
const sponsorService = require('../services/sponsorService');

class SponsorController extends BaseController {
  // GET /api/sponsors
  async listPublic(ctx) {
    try {
      const { page = 1, pageSize = 50 } = ctx.query;
      const { items, pagination } = await sponsorService.paginate({}, {
        page,
        pageSize,
        sort: { date: -1, createdAt: -1 },
        populate: { path: 'method', select: 'name icon qrCode' },
      });
      this.paginated(ctx, items, pagination, 'Fetched sponsors');
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  // GET /api/admin/sponsors
  async listAdmin(ctx) {
    try {
      const { page = 1, pageSize = 20 } = ctx.query;
      const { items, pagination } = await sponsorService.paginate({}, {
        page,
        pageSize,
        sort: { date: -1, createdAt: -1 },
        populate: { path: 'method', select: 'name icon qrCode' },
      });
      this.paginated(ctx, items, pagination, 'Fetched sponsors');
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  // POST /api/admin/sponsors
  async create(ctx) {
    try {
      const payload = ctx.request.body || {};
      if (!payload.name || payload.amount === undefined) {
        this.throwHttpError('name and amount are required', HttpStatus.BAD_REQUEST);
      }

      const amount = Number(payload.amount);
      if (!Number.isFinite(amount)) {
        this.throwHttpError('amount must be a number', HttpStatus.BAD_REQUEST);
      }

      const doc = await sponsorService.create({
        name: payload.name,
        amount,
        message: payload.message,
        date: payload.date || undefined,
        method: payload.method || undefined,
      });

      this.created(ctx, doc, 'Sponsor created');
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
          this.throwHttpError('amount must be a number', HttpStatus.BAD_REQUEST);
        }
        payload.amount = amount;
      }

      const updated = await sponsorService.updateById(ctx.params.id, payload);
      if (!updated) this.throwHttpError('Sponsor not found', HttpStatus.NOT_FOUND);
      this.ok(ctx, updated, 'Sponsor updated');
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  // DELETE /api/admin/sponsors/:id
  async remove(ctx) {
    try {
      const removed = await sponsorService.deleteById(ctx.params.id);
      if (!removed) this.throwHttpError('Sponsor not found', HttpStatus.NOT_FOUND);
      this.ok(ctx, removed, 'Sponsor deleted');
    } catch (err) {
      this.fail(ctx, err);
    }
  }
}

module.exports = new SponsorController();
