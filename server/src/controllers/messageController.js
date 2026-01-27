const BaseController = require('../utils/baseController');
const { HttpStatus } = require('../utils/response');
const messageService = require('../services/messageService');
const { getClientInfo } = require('../utils/requestInfo');
const { getLocationByIp } = require('../utils/ipLocator');
const reactionService = require('../services/reactionService');

class MessageController extends BaseController {
    // POST /api/messages  创建留言
    async create(ctx) {
        try {
            const payload = ctx.request.body || {};
            if (!payload.name || !payload.email || !payload.content) {
                this.throwHttpError('name, email, content are required', HttpStatus.BAD_REQUEST);
            }

            // 获取客户端信息和地理位置
            const client = ctx.state.clientInfo || getClientInfo(ctx);
            const location = await getLocationByIp(client.ip);

            const doc = await messageService.create({
                name: payload.name,
                email: payload.email,
                website: payload.website,
                content: payload.content,
                // 暂时取消人工审核，直接标记为通过
                status: 'approved',
                ip: client.ip,
                userAgent: client.userAgent,
                browser: client.browser,
                os: client.os,
                deviceType: client.deviceType,
                referer: client.referer,
                language: client.language,
                location
            });

            this.created(ctx, doc, 'Message created');
        } catch (err) {
            this.fail(ctx, err);
        }
    }

    // GET /api/messages?page=1&pageSize=10&status=approved  分页查询留言，附带表态计数
    async list(ctx) {
        try {
            const { page = 1, pageSize = 10, status } = ctx.query;
            const filter = {};
            if (status) filter.status = status;

            const { items, pagination } = await messageService.paginate(filter, {
                page,
                pageSize,
                sort: { createdAt: -1 }
            });
            const ids = items.map(i => String(i._id));
            const countsMap = await reactionService.getCountsMap('message', ids); // 批量获取表态计数
            const merged = items.map(i => ({ ...i, reactions: countsMap[String(i._id)] || reactionService.emptyCounts() }));

            this.paginated(ctx, merged, pagination, 'Fetched messages');
        } catch (err) {
            this.fail(ctx, err);
        }
    }

    // PATCH /api/messages/:id/approve  审核通过
    async approve(ctx) {
        try {
            const updated = await messageService.updateById(ctx.params.id, { status: 'approved' });
            if (!updated) this.throwHttpError('Message not found', HttpStatus.NOT_FOUND);
            this.ok(ctx, updated, 'Message approved');
        } catch (err) {
            this.fail(ctx, err);
        }
    }

    // POST /api/messages/:id/react  body: { type: '<emojiId>', action?: 'add' | 'remove' }  表态/取消表态
    async react(ctx) {
        try {
            const { type, action = 'add' } = ctx.request.body || {};
            if (!reactionService.allowed.includes(type)) {
                this.throwHttpError('invalid reaction type', HttpStatus.BAD_REQUEST);
            }

            if (action === 'remove') {
                const counts = await reactionService.unreact('message', ctx.params.id, type); // 取消表态
                if (!counts) this.throwHttpError('no reaction to remove or message not found', HttpStatus.BAD_REQUEST);
                this.ok(ctx, counts, 'Reaction removed');
                return;
            }

            const counts = await reactionService.react('message', ctx.params.id, type); // 新增表态
            this.ok(ctx, counts, 'Reaction updated');
        } catch (err) {
            this.fail(ctx, err);
        }
    }
}

module.exports = new MessageController();
