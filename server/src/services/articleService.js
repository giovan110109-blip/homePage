const BaseService = require('../utils/baseService');
const Article = require('../models/article');
const reactionService = require('./reactionService');
const ReactionLog = require('../models/reactionLog');

class ArticleService extends BaseService {
  constructor() {
    super(Article);
  }

  async getPublishedArticles({ page = 1, limit = 10, category, tag, keyword }) {
    const query = { status: 'published' };
    if (category) query.category = category;
    if (tag) query.tags = tag;
    if (keyword) {
      query.$text = { $search: keyword };
    }

    const pageNum = Math.max(parseInt(page), 1);
    const limitNum = Math.min(Math.max(parseInt(limit), 1), 100);

    const result = await this.paginate(query, {
      page: pageNum,
      pageSize: limitNum,
      sort: { isTop: -1, publishedAt: -1 },
      select: '-content'
    });

    const ids = result.items.map(a => String(a._id));
    const countsMap = await reactionService.getCountsMap('article', ids);
    result.items = result.items.map(a => ({
      ...a,
      reactions: countsMap[String(a._id)] || reactionService.emptyCounts()
    }));

    return result;
  }

  async getArticleById(id) {
    const article = await this.getById(id);
    if (article && article.status === 'published') {
      await Article.findByIdAndUpdate(id, { $inc: { views: 1 } });
    }
    return article;
  }

  async createArticle(articleData, user) {
    articleData.author = {
      name: user.nickname || user.username,
      avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
      bio: 'Giovan'
    };
    return await this.create(articleData);
  }

  async togglePublish(id) {
    const article = await this.getById(id);
    if (!article) return null;

    const newStatus = article.status === 'published' ? 'draft' : 'published';
    const updateData = { status: newStatus };

    if (newStatus === 'published' && !article.publishedAt) {
      updateData.publishedAt = new Date();
    }

    return await this.updateById(id, updateData);
  }

  async toggleTop(id) {
    const article = await this.getById(id);
    if (!article) return null;

    return await this.updateById(id, { isTop: !article.isTop });
  }

  async getHotArticles(limit = 5) {
    const limitNum = Math.min(Math.max(parseInt(limit), 1), 20);
    return await this.model.find({ status: 'published' })
      .select('title coverImage views likes publishedAt')
      .sort({ views: -1, likes: -1 })
      .limit(limitNum)
      .lean();
  }

  async getCategories() {
    const categories = await this.model.distinct('category', { status: 'published' });
    return categories.filter(Boolean);
  }

  async getTags() {
    const articles = await this.model.find({ status: 'published' }, 'tags');
    const allTags = articles.flatMap(article => article.tags);
    return [...new Set(allTags)];
  }

  async react(id, type, ip, action = 'add') {
    const targetId = String(id);

    if (action === 'remove') {
      const removed = await ReactionLog.findOneAndDelete({
        targetType: 'article',
        targetId,
        type,
        ip
      });
      if (!removed) return null;
      return await reactionService.unreact('article', targetId, type);
    }

    const existed = await ReactionLog.findOne({
      targetType: 'article',
      targetId,
      type,
      ip
    }).lean();
    if (existed) return null;

    await ReactionLog.create({ targetType: 'article', targetId, type, ip });
    return await reactionService.react('article', targetId, type);
  }

  async likeArticle(id, clientIp) {
    const article = await this.model.findOne({ _id: id, status: 'published' }).lean();
    if (!article) return null;

    const likedIndex = article.likedBy.indexOf(clientIp);
    let liked = true;

    if (likedIndex > -1) {
      await this.model.findByIdAndUpdate(id, { $inc: { likes: -1 }, $pull: { likedBy: clientIp } });
      liked = false;
    } else {
      await this.model.findByIdAndUpdate(id, { $inc: { likes: 1 }, $push: { likedBy: clientIp } });
    }

    return { likes: article.likes + (liked ? 1 : -1), liked };
  }
}

module.exports = new ArticleService();
