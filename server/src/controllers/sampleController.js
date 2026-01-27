const BaseController = require('../utils/baseController');
const { HttpStatus } = require('../utils/response');
const sampleService = require('../services/sampleService');
const { getClientInfo } = require('../utils/requestInfo');

// Demo controller showcasing BaseController + BaseService helpers
class SampleController extends BaseController {
    // GET /api/samples?page=1&pageSize=10&status=active&name=Alpha
    async list(ctx) {
        try {
            const { page = 1, pageSize = 10, status, name } = ctx.query;
            const { items, pagination } = await sampleService.listWithFilter({ page, pageSize, status, name });
            this.paginated(ctx, items, pagination, 'Fetched sample list');
        } catch (err) {
            this.fail(ctx, err);
        }
    }

    // GET /api/samples/:id
    async detail(ctx) {
        try {
            const item = await sampleService.getById(ctx.params.id);
            if (!item) this.throwHttpError('Sample not found', HttpStatus.NOT_FOUND);

            this.ok(ctx, item, 'Fetched sample detail');
        } catch (err) {
            this.fail(ctx, err);
        }
    }

    // POST /api/samples
    async create(ctx) {
        try {
            const payload = ctx.request.body || {};
            const created = await sampleService.create(payload);
            this.created(ctx, created, 'Created sample');
        } catch (err) {
            this.fail(ctx, err);
        }
    }

    // PUT /api/samples/:id
    async update(ctx) {
        try {
            const payload = ctx.request.body || {};
            const updated = await sampleService.updateById(ctx.params.id, payload);
            if (!updated) this.throwHttpError('Sample not found', HttpStatus.NOT_FOUND);

            this.ok(ctx, updated, 'Updated sample');
        } catch (err) {
            this.fail(ctx, err);
        }
    }

    // DELETE /api/samples/:id
    async remove(ctx) {
        try {
            const removed = await sampleService.deleteById(ctx.params.id);
            if (!removed) this.throwHttpError('Sample not found', HttpStatus.NOT_FOUND);

            this.noContent(ctx, 'Deleted sample');
        } catch (err) {
            this.fail(ctx, err);
        }
    }

    // GET /api/samples/search?name=Alpha&status=active
    async search(ctx) {
        try {
            const { name, status } = ctx.query;
            const filter = {};
            if (name) filter.name = new RegExp(name, 'i');
            if (status) filter.status = status;

            const results = await sampleService.findManyByFields(filter, { sort: { createdAt: -1 } });
            this.ok(ctx, results, 'Search success');
        } catch (err) {
            this.fail(ctx, err);
        }
    }

    // POST /api/samples/bulk
    async bulkCreate(ctx) {
        try {
            const payload = Array.isArray(ctx.request.body) ? ctx.request.body : [];
            const inserted = await sampleService.bulkCreate(payload);
            this.created(ctx, inserted, 'Bulk created samples');
        } catch (err) {
            this.fail(ctx, err);
        }
    }

    // PATCH /api/samples/:id/tag
    async addTag(ctx) {
        try {
            const { tag } = ctx.request.body || {};
            const updated = await sampleService.addTag(ctx.params.id, tag);
            if (!updated) this.throwHttpError('Sample not found or no tag provided', HttpStatus.BAD_REQUEST);
            this.ok(ctx, updated, 'Tag added');
        } catch (err) {
            this.fail(ctx, err);
        }
    }

    // PATCH /api/samples/:id/disable
    async disable(ctx) {
        try {
            const updated = await sampleService.disable(ctx.params.id);
            if (!updated) this.throwHttpError('Sample not found', HttpStatus.NOT_FOUND);
            this.ok(ctx, updated, 'Sample disabled');
        } catch (err) {
            this.fail(ctx, err);
        }
    }

    // GET /api/samples/stats/status
    async countByStatus(ctx) {
        try {
            const stats = await sampleService.countByStatus();
            this.ok(ctx, stats, 'Stats by status');
        } catch (err) {
            this.fail(ctx, err);
        }
    }

    // GET /api/samples/client-info
    async clientInfo(ctx) {
        try {
            const info = getClientInfo(ctx);
            this.ok(ctx, info, 'Client info fetched');
        } catch (err) {
            this.fail(ctx, err);
        }
    }
}

module.exports = new SampleController();
