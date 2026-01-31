const BaseController = require('../utils/baseController');
const { HttpStatus } = require('../utils/response');
const Article = require('../models/article');
const reactionService = require('../services/reactionService');

class AdminArticleController extends BaseController {
    // 获取所有文章（管理后台）
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

            const total = await Article.countDocuments(query);
            const articles = await Article.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(Number(limit))
                .lean();

            const ids = articles.map(a => String(a._id));
            const countsMap = await reactionService.getCountsMap('article', ids);
            const merged = articles.map(a => ({
                ...a,
                reactions: countsMap[String(a._id)] || reactionService.emptyCounts()
            }));

            ctx.body = {
                success: true,
                data: {
                    articles: merged,
                    pagination: {
                        total,
                        page: Number(page),
                        limit: Number(limit),
                        pages: Math.ceil(total / limit)
                    }
                }
            };
        } catch (error) {
            this.throwHttpError(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // 获取单篇文章详情
    async getArticleById(ctx) {
        try {
            const { id } = ctx.params;
            const article = await Article.findById(id);

            if (!article) {
                this.throwHttpError('文章不存在', HttpStatus.NOT_FOUND);
            }

            ctx.body = {
                success: true,
                data: article
            };
        } catch (error) {
            this.throwHttpError(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // 创建文章
    async createArticle(ctx) {
        try {
            const articleData = ctx.request.body;

            // 验证必填字段
            if (!articleData.title || !articleData.content) {
                this.throwHttpError('标题和内容不能为空', HttpStatus.BAD_REQUEST);
            }

            // 从登录用户获取作者信息
            const user = ctx.state.user;
            articleData.author = {
                name: user.nickname || user.username,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
                bio: '网站管理员'
            };

            const article = await Article.create(articleData);

            ctx.body = {
                success: true,
                data: article
            };
        } catch (error) {
            this.throwHttpError(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // 更新文章
    async updateArticle(ctx) {
        try {
            const { id } = ctx.params;
            const updateData = ctx.request.body;

            const article = await Article.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            );

            if (!article) {
                this.throwHttpError('文章不存在', HttpStatus.NOT_FOUND);
            }

            ctx.body = {
                success: true,
                data: article
            };
        } catch (error) {
            this.throwHttpError(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // 删除文章
    async deleteArticle(ctx) {
        try {
            const { id } = ctx.params;

            const article = await Article.findByIdAndDelete(id);

            if (!article) {
                this.throwHttpError('文章不存在', HttpStatus.NOT_FOUND);
            }

            ctx.body = {
                success: true,
                message: '删除成功'
            };
        } catch (error) {
            this.throwHttpError(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // 切换发布状态
    async togglePublish(ctx) {
        try {
            const { id } = ctx.params;

            const article = await Article.findById(id);
            if (!article) {
                this.throwHttpError('文章不存在', HttpStatus.NOT_FOUND);
            }

            // 切换状态
            article.status = article.status === 'published' ? 'draft' : 'published';

            // 如果是发布，设置发布时间
            if (article.status === 'published' && !article.publishedAt) {
                article.publishedAt = new Date();
            }

            await article.save();

            ctx.body = {
                success: true,
                data: article
            };
        } catch (error) {
            this.throwHttpError(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // 切换置顶状态
    async toggleTop(ctx) {
        try {
            const { id } = ctx.params;

            const article = await Article.findById(id);
            if (!article) {
                this.throwHttpError('文章不存在', HttpStatus.NOT_FOUND);
            }

            // 切换置顶状态
            article.isTop = !article.isTop;

            await article.save();

            ctx.body = {
                success: true,
                data: article
            };
        } catch (error) {
            this.throwHttpError(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // 批量删除文章
    async batchDelete(ctx) {
        try {
            const { ids } = ctx.request.body;

            if (!Array.isArray(ids) || ids.length === 0) {
                this.throwHttpError('请提供要删除的文章ID列表', HttpStatus.BAD_REQUEST);
            }

            const result = await Article.deleteMany({ _id: { $in: ids } });

            ctx.body = {
                success: true,
                message: `成功删除 ${result.deletedCount} 篇文章`
            };
        } catch (error) {
            this.throwHttpError(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}

const controller = new AdminArticleController();
module.exports = controller;
