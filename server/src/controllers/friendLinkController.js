const BaseController = require('../utils/baseController');
const { HttpStatus } = require('../utils/response');
const friendLinkService = require('../services/friendLinkService');
const { getClientInfo } = require('../utils/requestInfo');
const { getLocationByIp } = require('../utils/ipLocator');

class FriendLinkController extends BaseController {
    /**
     * POST /api/friend-links  创建友情链接申请
     */
    async create(ctx) {
        try {
            const payload = ctx.request.body || {};
            const { name, url, description, avatar, email, rss, category, tags } = payload;

            // 验证必填字段
            if (!name || !url || !description || !email) {
                this.throwHttpError('name, url, description, email are required', HttpStatus.BAD_REQUEST);
            }

            // 验证URL格式
            try {
                new URL(url);
            } catch {
                this.throwHttpError('Invalid URL format', HttpStatus.BAD_REQUEST);
            }

            // 检查邮箱是否已申请过
            const exists = await friendLinkService.checkEmailExists(email);
            if (exists) {
                this.throwHttpError('This email has already submitted a friend link application', HttpStatus.BAD_REQUEST);
            }

            // 获取客户端信息和地理位置
            const client = ctx.state.clientInfo || getClientInfo(ctx);
            const location = await getLocationByIp(client.ip);

            const doc = await friendLinkService.create({
                name,
                url,
                description,
                avatar,
                email,
                rss,
                category: category || 'other',
                tags: tags || [],
                status: 'pending', // 需要审核
                ip: client.ip,
                userAgent: client.userAgent,
                browser: client.browser,
                os: client.os,
                deviceType: client.deviceType,
                referer: client.referer,
                location
            });

            this.created(ctx, doc, 'Friend link application submitted successfully');
        } catch (err) {
            this.fail(ctx, err);
        }
    }

    /**
     * GET /api/friend-links  获取已通过的友情链接列表（前台）
     */
    async list(ctx) {
        try {
            const links = await friendLinkService.getApprovedLinks();
            this.ok(ctx, links);
        } catch (err) {
            this.fail(ctx, err);
        }
    }

    /**
     * POST /api/friend-links/:id/click  记录点击
     */
    async recordClick(ctx) {
        try {
            const { id } = ctx.params;
            await friendLinkService.incrementClick(id);
            this.ok(ctx, null, 'Click recorded');
        } catch (err) {
            this.fail(ctx, err);
        }
    }

    /**
     * GET /api/admin/friend-links  管理后台：分页查询所有友情链接
     */
    async adminList(ctx) {
        try {
            const { page = 1, pageSize = 20, status, isActive, category } = ctx.query;
            
            const result = await friendLinkService.list({
                page: Number(page),
                pageSize: Number(pageSize),
                status,
                isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
                category
            });

            this.ok(ctx, result);
        } catch (err) {
            this.fail(ctx, err);
        }
    }

    /**
     * GET /api/admin/friend-links/:id  管理后台：获取单个友情链接详情
     */
    async getById(ctx) {
        try {
            const { id } = ctx.params;
            const link = await friendLinkService.findById(id);
            
            if (!link) {
                this.throwHttpError('Friend link not found', HttpStatus.NOT_FOUND);
            }

            this.ok(ctx, link);
        } catch (err) {
            this.fail(ctx, err);
        }
    }

    /**
     * PUT /api/admin/friend-links/:id  管理后台：更新友情链接
     */
    async update(ctx) {
        try {
            const { id } = ctx.params;
            const payload = ctx.request.body || {};

            const updated = await friendLinkService.update(id, payload);
            if (!updated) {
                this.throwHttpError('Friend link not found', HttpStatus.NOT_FOUND);
            }

            this.ok(ctx, updated, 'Friend link updated successfully');
        } catch (err) {
            this.fail(ctx, err);
        }
    }

    /**
     * PUT /api/admin/friend-links/:id/review  管理后台：审核友情链接
     */
    async review(ctx) {
        try {
            const { id } = ctx.params;
            const { status, reason } = ctx.request.body || {};

            if (!status || !['approved', 'rejected'].includes(status)) {
                this.throwHttpError('Invalid status. Must be "approved" or "rejected"', HttpStatus.BAD_REQUEST);
            }

            if (status === 'rejected' && !reason) {
                this.throwHttpError('Reason is required when rejecting', HttpStatus.BAD_REQUEST);
            }

            // 从认证信息中获取审核人（如果有的话）
            const reviewedBy = ctx.state.user?.username || 'admin';

            const updated = await friendLinkService.review(id, { status, reason, reviewedBy });
            if (!updated) {
                this.throwHttpError('Friend link not found', HttpStatus.NOT_FOUND);
            }

            this.ok(ctx, updated, `Friend link ${status} successfully`);
        } catch (err) {
            this.fail(ctx, err);
        }
    }

    /**
     * DELETE /api/admin/friend-links/:id  管理后台：删除友情链接
     */
    async delete(ctx) {
        try {
            const { id } = ctx.params;
            const deleted = await friendLinkService.delete(id);
            
            if (!deleted) {
                this.throwHttpError('Friend link not found', HttpStatus.NOT_FOUND);
            }

            this.ok(ctx, null, 'Friend link deleted successfully');
        } catch (err) {
            this.fail(ctx, err);
        }
    }

    /**
     * PUT /api/admin/friend-links/sort  管理后台：批量更新排序
     */
    async updateSort(ctx) {
        try {
            const { updates } = ctx.request.body || {};
            
            if (!Array.isArray(updates) || updates.length === 0) {
                this.throwHttpError('Updates array is required', HttpStatus.BAD_REQUEST);
            }

            await friendLinkService.updateSort(updates);
            this.ok(ctx, null, 'Sort order updated successfully');
        } catch (err) {
            this.fail(ctx, err);
        }
    }
}

module.exports = new FriendLinkController();
