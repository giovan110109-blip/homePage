const BaseController = require("../utils/baseController");
const { HttpStatus } = require("../utils/response");
const Message = require("../models/message");
const Article = require("../models/article");
const ReactionLog = require("../models/reactionLog");
const { ReactionModel } = require("../models/reaction");
const Photo = require("../models/photo");
const AccessLog = require("../models/accessLog");

class DashboardController extends BaseController {
  // GET /api/admin/dashboard/stats - 获取仪表板统计数据
  async getStats(ctx) {
    try {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // 使用聚合管道合并查询
      const [
        messageStats,
        articleStats,
        photoStats,
        accessStats,
        newReactions,
        reactionStats,
      ] = await Promise.all([
        // 留言统计
        Message.aggregate([
          {
            $facet: {
              total: [{ $count: "count" }],
              new: [
                { $match: { createdAt: { $gte: oneWeekAgo } } },
                { $count: "count" }
              ]
            }
          }
        ]),

        // 文章统计
        Article.aggregate([
          {
            $facet: {
              total: [{ $count: "count" }],
              published: [
                { $match: { status: "published" } },
                { $count: "count" }
              ]
            }
          }
        ]),

        // 图片统计
        Photo.aggregate([
          {
            $facet: {
              total: [
                { $match: { status: "completed" } },
                { $count: "count" }
              ],
              new: [
                { $match: { status: "completed", createdAt: { $gte: oneWeekAgo } } },
                { $count: "count" }
              ]
            }
          }
        ]),

        // 访问日志统计
        AccessLog.aggregate([
          {
            $facet: {
              total: [{ $count: "count" }],
              new: [
                { $match: { createdAt: { $gte: oneWeekAgo } } },
                { $count: "count" }
              ]
            }
          }
        ]),

        // 反应（近一周增量：文章 + 留言）
        ReactionLog.countDocuments({
          targetType: { $in: ["article", "message"] },
          createdAt: { $gte: oneWeekAgo },
        }),

        // 统计各类型反应（文章 + 留言）
        ReactionModel.aggregate([
          { $match: { targetType: { $in: ["article", "message"] } } },
          { $project: { counts: { $objectToArray: "$counts" } } },
          { $unwind: "$counts" },
          {
            $group: {
              _id: "$counts.k",
              count: { $sum: "$counts.v" },
            },
          },
        ]),
      ]);

      const totalMessages = messageStats[0]?.total[0]?.count || 0;
      const newMessages = messageStats[0]?.new[0]?.count || 0;

      const totalArticles = articleStats[0]?.total[0]?.count || 0;
      const publishedArticles = articleStats[0]?.published[0]?.count || 0;

      const totalPhotos = photoStats[0]?.total[0]?.count || 0;
      const newPhotos = photoStats[0]?.new[0]?.count || 0;

      const totalAccessLogs = accessStats[0]?.total[0]?.count || 0;
      const newAccessLogs = accessStats[0]?.new[0]?.count || 0;

      const reactionMap = {};
      let totalReactions = 0;
      reactionStats.forEach((stat) => {
        reactionMap[stat._id] = stat.count;
        totalReactions += stat.count;
      });

      // 计算增长百分比
      const calcGrowth = (newVal, oldVal) => {
        if (oldVal === 0) return newVal > 0 ? 100 : 0;
        return Math.round(
          ((newVal - (oldVal - newVal)) / (oldVal - newVal)) * 100,
        );
      };

      const currentWeekMessages = newMessages;
      const prevWeekMessages = totalMessages - newMessages;
      const messageGrowth = calcGrowth(currentWeekMessages, prevWeekMessages);

      const currentWeekPhotos = newPhotos;
      const prevWeekPhotos = totalPhotos - newPhotos;
      const photoGrowth = calcGrowth(currentWeekPhotos, prevWeekPhotos);

      const currentWeekAccess = newAccessLogs;
      const prevWeekAccess = totalAccessLogs - newAccessLogs;
      const accessGrowth = calcGrowth(currentWeekAccess, prevWeekAccess);

      const currentWeekReactions = newReactions;
      const prevWeekReactions = totalReactions - newReactions;
      const reactionGrowth = calcGrowth(
        currentWeekReactions,
        prevWeekReactions,
      );

      const data = {
        messages: {
          total: totalMessages,
          new: newMessages,
          growth:
            messageGrowth >= 0
              ? `↑ ${messageGrowth}%`
              : `↓ ${Math.abs(messageGrowth)}%`,
        },
        articles: {
          total: totalArticles,
          published: publishedArticles,
          draft: totalArticles - publishedArticles,
        },
        photos: {
          total: totalPhotos,
          new: newPhotos,
          growth:
            photoGrowth >= 0
              ? `↑ ${photoGrowth}%`
              : `↓ ${Math.abs(photoGrowth)}%`,
        },
        reactions: {
          total: totalReactions,
          new: newReactions,
          growth:
            reactionGrowth >= 0
              ? `↑ ${reactionGrowth}%`
              : `↓ ${Math.abs(reactionGrowth)}%`,
          byType: reactionMap,
        },
        access: {
          total: totalAccessLogs,
          new: currentWeekAccess,
          growth:
            accessGrowth >= 0
              ? `↑ ${accessGrowth}%`
              : `↓ ${Math.abs(accessGrowth)}%`,
        },
      };

      this.ok(ctx, data, "获取仪表板统计数据成功");
    } catch (err) {
      this.fail(ctx, err);
    }
  }
}

module.exports = new DashboardController();
