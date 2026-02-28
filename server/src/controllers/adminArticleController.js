const BaseController = require('../utils/baseController');
const { HttpStatus } = require('../utils/response');
const articleService = require('../services/articleService');
const reactionService = require('../services/reactionService');

class AdminArticleController extends BaseController {
    async getArticles(ctx) {
        try {
            const { page = 1, limit = 10, status, category, keyword } = ctx.query;

            const query = {};
            if (status) query.status = status;
            if (category) query.category = category;
            if (keyword) {
                query.$or = [
                    { title: new RegExp(keyword, 'i') },
                    { summary: new RegExp(keyword, 'i') }
                ];
            }

            const result = await articleService.paginate(query, {
                page,
                pageSize: limit,
                sort: { createdAt: -1 }
            });

            const ids = result.items.map(a => String(a._id));
            const countsMap = await reactionService.getCountsMap('article', ids);
            result.items = result.items.map(a => ({
                ...a,
                reactions: countsMap[String(a._id)] || reactionService.emptyCounts()
            }));

            this.paginated(ctx, result.items, result.pagination, '获取文章列表成功');
        } catch (error) {
            this.fail(ctx, error);
        }
    }

    async getArticleById(ctx) {
        try {
            const { id } = ctx.params;
            const article = await articleService.getById(id);

            if (!article) {
                this.throwHttpError('文章不存在', HttpStatus.NOT_FOUND);
            }

            this.ok(ctx, article, '获取文章详情成功');
        } catch (error) {
            this.fail(ctx, error);
        }
    }

    async createArticle(ctx) {
        try {
            const articleData = ctx.request.body;

            if (!articleData.title || !articleData.content) {
                this.throwHttpError('标题和内容不能为空', HttpStatus.BAD_REQUEST);
            }

            const user = ctx.state.user;
            const article = await articleService.createArticle(articleData, user);

            this.created(ctx, article, '文章创建成功');
        } catch (error) {
            this.fail(ctx, error);
        }
    }

    async updateArticle(ctx) {
        try {
            const { id } = ctx.params;
            const updateData = ctx.request.body;

            const article = await articleService.updateById(id, updateData);

            if (!article) {
                this.throwHttpError('文章不存在', HttpStatus.NOT_FOUND);
            }

            this.ok(ctx, article, '文章更新成功');
        } catch (error) {
            this.fail(ctx, error);
        }
    }

    async deleteArticle(ctx) {
        try {
            const { id } = ctx.params;

            const article = await articleService.deleteById(id);

            if (!article) {
                this.throwHttpError('文章不存在', HttpStatus.NOT_FOUND);
            }

            this.ok(ctx, null, '删除成功');
        } catch (error) {
            this.fail(ctx, error);
        }
    }

    async togglePublish(ctx) {
        try {
            const { id } = ctx.params;

            const article = await articleService.togglePublish(id);

            if (!article) {
                this.throwHttpError('文章不存在', HttpStatus.NOT_FOUND);
            }

            this.ok(ctx, article, '状态切换成功');
        } catch (error) {
            this.fail(ctx, error);
        }
    }

    async toggleTop(ctx) {
        try {
            const { id } = ctx.params;

            const article = await articleService.toggleTop(id);

            if (!article) {
                this.throwHttpError('文章不存在', HttpStatus.NOT_FOUND);
            }

            this.ok(ctx, article, '置顶状态切换成功');
        } catch (error) {
            this.fail(ctx, error);
        }
    }

    async batchDelete(ctx) {
        try {
            const { ids } = ctx.request.body;

            if (!Array.isArray(ids) || ids.length === 0) {
                this.throwHttpError('请提供要删除的文章ID列表', HttpStatus.BAD_REQUEST);
            }

            const result = await articleService.model.deleteMany({ _id: { $in: ids } });

            this.ok(ctx, { deletedCount: result.deletedCount }, `成功删除 ${result.deletedCount} 篇文章`);
        } catch (error) {
            this.fail(ctx, error);
        }
    }
}

module.exports = new AdminArticleController();
