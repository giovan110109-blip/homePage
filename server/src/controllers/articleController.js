const BaseController = require('../utils/baseController');
const { HttpStatus } = require('../utils/response');
const Article = require('../models/article');
const reactionService = require('../services/reactionService');
const ReactionLog = require('../models/reactionLog');
const { getClientInfo } = require('../utils/requestInfo');

class ArticleController extends BaseController {
    // 获取已发布文章列表（前台展示）
    async getPublishedArticles(ctx) {
        try {
            const { page = 1, limit = 10, category, tag, keyword } = ctx.query;

            const query = { status: 'published' };
            if (category) query.category = category;
            if (tag) query.tags = tag;
            if (keyword) {
                query.$text = { $search: keyword };
            }

            const total = await Article.countDocuments(query);
            const articles = await Article.find(query)
                .select('-content') // 列表不返回完整内容
                .sort({ isTop: -1, publishedAt: -1 })
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

    // 获取文章详情（前台展示）
    async getArticleDetail(ctx) {
        try {
            const { id } = ctx.params;
            const article = await Article.findOne({ _id: id, status: 'published' });

            if (!article) {
                this.throwHttpError('文章不存在或未发布', HttpStatus.NOT_FOUND);
            }

            // 增加浏览次数
            article.views += 1;
            await article.save();

            ctx.body = {
                success: true,
                data: article
            };
        } catch (error) {
            this.throwHttpError(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // 点赞文章
    async likeArticle(ctx) {
        try {
            const { id } = ctx.params;
            const clientIp = ctx.ip || ctx.request.ip;

            const article = await Article.findOne({ _id: id, status: 'published' });
            if (!article) {
                this.throwHttpError('文章不存在或未发布', HttpStatus.NOT_FOUND);
            }

            const likedIndex = article.likedBy.indexOf(clientIp);
            let liked = true;

            if (likedIndex > -1) {
                // 已点赞则取消点赞
                article.likedBy.splice(likedIndex, 1);
                article.likes = Math.max(0, article.likes - 1);
                liked = false;
            } else {
                article.likes += 1;
                article.likedBy.push(clientIp);
            }

            await article.save();

            ctx.body = {
                success: true,
                data: { likes: article.likes, liked }
            };
        } catch (error) {
            this.throwHttpError(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // POST /api/articles/:id/react  body: { type: '<emojiId>', action?: 'add' | 'remove' }
    async react(ctx) {
        try {
            const { id } = ctx.params;
            const { type, action = 'add' } = ctx.request.body || {};
            if (!reactionService.allowed.includes(type)) {
                this.throwHttpError('invalid reaction type', HttpStatus.BAD_REQUEST);
            }

            const client = ctx.state.clientInfo || getClientInfo(ctx);
            const ip = client?.ip || ctx.ip || ctx.request.ip;
            const targetId = String(id);

            if (action === 'remove') {
                const removed = await ReactionLog.findOneAndDelete({
                    targetType: 'article',
                    targetId,
                    type,
                    ip
                });
                if (!removed) {
                    this.throwHttpError('您未表态过该表情', HttpStatus.BAD_REQUEST);
                }
                const counts = await reactionService.unreact('article', targetId, type);
                if (!counts) {
                    this.throwHttpError('无法取消表态', HttpStatus.BAD_REQUEST);
                }
                ctx.body = {
                    success: true,
                    data: counts
                };
                return;
            }

            const existed = await ReactionLog.findOne({
                targetType: 'article',
                targetId,
                type,
                ip
            }).lean();
            if (existed) {
                this.throwHttpError('您已经表态过该表情', HttpStatus.BAD_REQUEST);
            }

            await ReactionLog.create({ targetType: 'article', targetId, type, ip });
            const counts = await reactionService.react('article', targetId, type);

            ctx.body = {
                success: true,
                data: counts
            };
        } catch (error) {
            this.throwHttpError(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // 获取热门文章
    async getHotArticles(ctx) {
        try {
            const { limit = 5 } = ctx.query;

            const articles = await Article.find({ status: 'published' })
                .select('title coverImage views likes publishedAt')
                .sort({ views: -1, likes: -1 })
                .limit(Number(limit));

            ctx.body = {
                success: true,
                data: articles
            };
        } catch (error) {
            this.throwHttpError(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // 获取所有分类
    async getCategories(ctx) {
        try {
            const categories = await Article.distinct('category', { status: 'published' });

            ctx.body = {
                success: true,
                data: categories.filter(Boolean)
            };
        } catch (error) {
            this.throwHttpError(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // 获取所有标签
    async getTags(ctx) {
        try {
            const articles = await Article.find({ status: 'published' }, 'tags');
            const allTags = articles.flatMap(article => article.tags);
            const uniqueTags = [...new Set(allTags)];

            ctx.body = {
                success: true,
                data: uniqueTags
            };
        } catch (error) {
            this.throwHttpError(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}

const controller = new ArticleController();
module.exports = controller;
