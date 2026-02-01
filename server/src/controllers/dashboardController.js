const BaseController = require('../utils/baseController');
const { HttpStatus } = require('../utils/response');
const Message = require('../models/message');
const Article = require('../models/article');
const ReactionLog = require('../models/reactionLog');
const { ReactionModel } = require('../models/reaction');
const Photo = require('../models/photo');
const AccessLog = require('../models/accessLog');

class DashboardController extends BaseController {
  // GET /api/admin/dashboard/stats - 获取仪表板统计数据
  async getStats(ctx) {
    try {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // 并发获取各种统计数据
      const [
        totalMessages,
        newMessages,
        totalArticles,
        publishedArticles,
        newReactions,
        totalPhotos,
        newPhotos,
        totalAccessLogs,
        newAccessLogs,
        totalAccessCount,
        newAccessCount
      ] = await Promise.all([
        // 留言统计
        Message.countDocuments({}),
        Message.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
        
        // 文章统计
        Article.countDocuments({}),
        Article.countDocuments({ status: 'published' }),
        
        // 反应（近一周增量：文章 + 留言）
        ReactionLog.countDocuments({
          targetType: { $in: ['article', 'message'] },
          createdAt: { $gte: oneWeekAgo }
        }),
        
        // 图片统计
        Photo.countDocuments({ status: 'completed' }),
        Photo.countDocuments({ status: 'completed', createdAt: { $gte: oneWeekAgo } }),
        
        // 访问日志总数
        AccessLog.countDocuments({}),
        AccessLog.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
        
        // 访问数统计
        AccessLog.aggregate([
          { $group: { _id: null, total: { $sum: 1 } } }
        ]),
        AccessLog.aggregate([
          { $match: { createdAt: { $gte: oneWeekAgo } } },
          { $group: { _id: null, total: { $sum: 1 } } }
        ])
      ]);

      // 统计各类型反应（文章 + 留言）
      const reactionStats = await ReactionModel.aggregate([
        { $match: { targetType: { $in: ['article', 'message'] } } },
        { $project: { counts: { $objectToArray: '$counts' } } },
        { $unwind: '$counts' },
        {
          $group: {
            _id: '$counts.k',
            count: { $sum: '$counts.v' }
          }
        }
      ]);

      const reactionMap = {};
      let totalReactions = 0;
      reactionStats.forEach(stat => {
        reactionMap[stat._id] = stat.count;
        totalReactions += stat.count;
      });

      // 计算增长百分比
      const calcGrowth = (newVal, oldVal) => {
        if (oldVal === 0) return newVal > 0 ? 100 : 0;
        return Math.round(((newVal - (oldVal - newVal)) / (oldVal - newVal)) * 100);
      };

      const currentWeekMessages = newMessages;
      const prevWeekMessages = totalMessages - newMessages;
      const messageGrowth = calcGrowth(currentWeekMessages, prevWeekMessages);

      const currentWeekPhotos = newPhotos;
      const prevWeekPhotos = totalPhotos - newPhotos;
      const photoGrowth = calcGrowth(currentWeekPhotos, prevWeekPhotos);

      const currentWeekAccess = newAccessCount[0]?.total || 0;
      const prevWeekAccess = (totalAccessCount[0]?.total || 0) - currentWeekAccess;
      const accessGrowth = calcGrowth(currentWeekAccess, prevWeekAccess);

      const currentWeekReactions = newReactions;
      const prevWeekReactions = totalReactions - newReactions;
      const reactionGrowth = calcGrowth(currentWeekReactions, prevWeekReactions);

      const data = {
        messages: {
          total: totalMessages,
          new: newMessages,
          growth: messageGrowth >= 0 ? `↑ ${messageGrowth}%` : `↓ ${Math.abs(messageGrowth)}%`
        },
        articles: {
          total: totalArticles,
          published: publishedArticles,
          draft: totalArticles - publishedArticles
        },
        photos: {
          total: totalPhotos,
          new: newPhotos,
          growth: photoGrowth >= 0 ? `↑ ${photoGrowth}%` : `↓ ${Math.abs(photoGrowth)}%`
        },
        reactions: {
          total: totalReactions,
          new: newReactions,
          growth: reactionGrowth >= 0 ? `↑ ${reactionGrowth}%` : `↓ ${Math.abs(reactionGrowth)}%`,
          byType: reactionMap
        },
        access: {
          total: totalAccessCount[0]?.total || 0,
          new: currentWeekAccess,
          growth: accessGrowth >= 0 ? `↑ ${accessGrowth}%` : `↓ ${Math.abs(accessGrowth)}%`
        }
      };

      this.ok(ctx, data, 'Dashboard stats fetched successfully');
    } catch (err) {
      this.fail(ctx, err);
    }
  }
}

module.exports = new DashboardController();
