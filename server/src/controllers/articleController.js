const BaseController = require('../utils/baseController');
const { HttpStatus } = require('../utils/response');
const articleService = require('../services/articleService');
const { getClientInfo } = require('../utils/requestInfo');

class ArticleController extends BaseController {
    async getPublishedArticles(ctx) {
        try {
            const { page, limit, category, tag, keyword } = ctx.query;
            const result = await articleService.getPublishedArticles({ page, limit, category, tag, keyword });
            this.paginated(ctx, result.items, result.pagination, '获取文章列表成功');
        } catch (error) {
            this.fail(ctx, error);
        }
    }

    async getArticleDetail(ctx) {
        try {
            const { id } = ctx.params;
            const article = await articleService.getArticleById(id);

            if (!article || article.status !== 'published') {
                this.throwHttpError('文章不存在或未发布', HttpStatus.NOT_FOUND);
            }

            this.ok(ctx, article, '获取文章详情成功');
        } catch (error) {
            this.fail(ctx, error);
        }
    }

    async likeArticle(ctx) {
        try {
            const { id } = ctx.params;
            const clientIp = ctx.ip || ctx.request.ip;

            const result = await articleService.likeArticle(id, clientIp);
            if (!result) {
                this.throwHttpError('文章不存在或未发布', HttpStatus.NOT_FOUND);
            }

            this.ok(ctx, result, '操作成功');
        } catch (error) {
            this.fail(ctx, error);
        }
    }

    async react(ctx) {
        try {
            const { id } = ctx.params;
            const { type, action = 'add' } = ctx.request.body || {};
            const client = ctx.state.clientInfo || getClientInfo(ctx);
            const ip = client?.ip || ctx.ip || ctx.request.ip;

            const result = await articleService.react(id, type, ip, action);
            if (!result) {
                this.throwHttpError(
                    action === 'remove' ? '您未表态过该表情' : '您已经表态过该表情',
                    HttpStatus.BAD_REQUEST
                );
            }

            this.ok(ctx, result, action === 'remove' ? '取消表态成功' : '表态成功');
        } catch (error) {
            this.fail(ctx, error);
        }
    }

    async getHotArticles(ctx) {
        try {
            const { limit } = ctx.query;
            const articles = await articleService.getHotArticles(limit);
            this.ok(ctx, articles, '获取热门文章成功');
        } catch (error) {
            this.fail(ctx, error);
        }
    }

    async getCategories(ctx) {
        try {
            const categories = await articleService.getCategories();
            this.ok(ctx, categories, '获取分类成功');
        } catch (error) {
            this.fail(ctx, error);
        }
    }

    async getTags(ctx) {
        try {
            const tags = await articleService.getTags();
            this.ok(ctx, tags, '获取标签成功');
        } catch (error) {
            this.fail(ctx, error);
        }
    }
}

const controller = new ArticleController();
module.exports = controller;
