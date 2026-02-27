const BaseController = require('../utils/baseController');
const { HttpStatus } = require('../utils/response');
const articleService = require('../services/articleService');
const { getClientInfo } = require('../utils/requestInfo');
const { cache, invalidateCache } = require('../utils/cache');

class ArticleController extends BaseController {
    async getPublishedArticles(ctx) {
        try {
            const { page, limit, category, tag, keyword } = ctx.query;
            
            if (!keyword) {
                const cacheKey = `articles:${page || 1}:${limit || 10}:${category || 'all'}:${tag || 'all'}`;
                const cached = cache.get(cacheKey);
                if (cached) {
                    ctx.set('X-Cache', 'HIT');
                    return this.paginated(ctx, cached.items, cached.pagination, '获取文章列表成功');
                }
                ctx.set('X-Cache', 'MISS');
            }

            const result = await articleService.getPublishedArticles({ page, limit, category, tag, keyword });
            
            if (!keyword) {
                const cacheKey = `articles:${page || 1}:${limit || 10}:${category || 'all'}:${tag || 'all'}`;
                cache.set(cacheKey, result, 60);
            }
            
            this.paginated(ctx, result.items, result.pagination, '获取文章列表成功');
        } catch (error) {
            this.fail(ctx, error);
        }
    }

    async getArticleDetail(ctx) {
        try {
            const { id } = ctx.params;
            const cacheKey = `article:${id}`;
            
            const cached = cache.get(cacheKey);
            if (cached) {
                ctx.set('X-Cache', 'HIT');
                return this.ok(ctx, cached, '获取文章详情成功');
            }
            ctx.set('X-Cache', 'MISS');

            const article = await articleService.getArticleById(id);

            if (!article || article.status !== 'published') {
                this.throwHttpError('文章不存在或未发布', HttpStatus.NOT_FOUND);
            }

            cache.set(cacheKey, article, 120);

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

            invalidateCache(`article:${id}`);
            invalidateCache(/^articles:/);

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

            invalidateCache(`article:${id}`);
            invalidateCache(/^articles:/);

            this.ok(ctx, result, action === 'remove' ? '取消表态成功' : '表态成功');
        } catch (error) {
            this.fail(ctx, error);
        }
    }

    async getHotArticles(ctx) {
        try {
            const { limit } = ctx.query;
            const cacheKey = `hot-articles:${limit || 5}`;
            
            const cached = cache.get(cacheKey);
            if (cached) {
                ctx.set('X-Cache', 'HIT');
                return this.ok(ctx, cached, '获取热门文章成功');
            }
            ctx.set('X-Cache', 'MISS');

            const articles = await articleService.getHotArticles(limit);
            cache.set(cacheKey, articles, 300);

            this.ok(ctx, articles, '获取热门文章成功');
        } catch (error) {
            this.fail(ctx, error);
        }
    }

    async getCategories(ctx) {
        try {
            const cacheKey = 'article-categories';
            
            const cached = cache.get(cacheKey);
            if (cached) {
                ctx.set('X-Cache', 'HIT');
                return this.ok(ctx, cached, '获取分类成功');
            }
            ctx.set('X-Cache', 'MISS');

            const categories = await articleService.getCategories();
            cache.set(cacheKey, categories, 600);

            this.ok(ctx, categories, '获取分类成功');
        } catch (error) {
            this.fail(ctx, error);
        }
    }

    async getTags(ctx) {
        try {
            const cacheKey = 'article-tags';
            
            const cached = cache.get(cacheKey);
            if (cached) {
                ctx.set('X-Cache', 'HIT');
                return this.ok(ctx, cached, '获取标签成功');
            }
            ctx.set('X-Cache', 'MISS');

            const tags = await articleService.getTags();
            cache.set(cacheKey, tags, 600);

            this.ok(ctx, tags, '获取标签成功');
        } catch (error) {
            this.fail(ctx, error);
        }
    }
}

const controller = new ArticleController();
module.exports = controller;
