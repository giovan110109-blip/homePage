const BaseController = require("../utils/baseController");
const { HttpStatus } = require("../utils/response");
const messageService = require("../services/messageService");
const { getClientInfo } = require("../utils/requestInfo");
const { getLocationByIp } = require("../utils/ipLocator");
const reactionService = require("../services/reactionService");
const ReactionLog = require("../models/reactionLog");
const Comment = require("../models/comment");
const { getAvatarByEmail } = require("../utils/emailAvatar");
const { sendEmail } = require("../utils/sendEmail");
const { containsSensitiveWords, filterSensitiveWords } = require("../utils/sensitiveWords");
const { sanitizePlainText, normalizeHttpUrl } = require("../utils/inputSanitizer");

class MessageController extends BaseController {
  isAdminRequest(ctx) {
    return ctx.path.startsWith("/api/admin/");
  }

  getListFilter(ctx) {
    const { status, isPrivate } = ctx.query;
    const filter = {};
    if (this.isAdminRequest(ctx)) {
      if (status) filter.status = status;
      if (typeof isPrivate !== "undefined") {
        filter.isPrivate = this.parseBoolean(isPrivate) ? true : { $ne: true };
      }
    } else {
      filter.status = "approved";
      filter.isPrivate = { $ne: true };
    }
    return filter;
  }

  parseBoolean(value) {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["true", "1", "yes", "on"].includes(normalized)) return true;
      if (["false", "0", "no", "off"].includes(normalized)) return false;
    }
    return false;
  }

  async create(ctx) {
    try {
      const payload = ctx.request.body || {};
      const name = sanitizePlainText(payload.name, { collapseWhitespace: true });
      const email = sanitizePlainText(payload.email, {
        collapseWhitespace: true,
      }).toLowerCase();
      const website = normalizeHttpUrl(payload.website);
      const content = sanitizePlainText(payload.content);
      const isPrivate = this.parseBoolean(payload.isPrivate);
      const requireEmailNotification = this.parseBoolean(payload.requireEmailNotification);

      if (!name || !email || !content) {
        this.throwHttpError("名称、邮箱和内容为必填项", HttpStatus.BAD_REQUEST);
      }

      const sensitiveCheck = containsSensitiveWords(content);
      if (sensitiveCheck.hasSensitive) {
        this.throwHttpError(
          "留言内容包含敏感词，请修改后重试",
          HttpStatus.BAD_REQUEST,
        );
      }

      const client = ctx.state.clientInfo || getClientInfo(ctx);
      const location = await getLocationByIp(client.ip);
      const emailAvatar = getAvatarByEmail(email);

      const avatar = emailAvatar ? emailAvatar : payload.avatar;
      const filteredContent = filterSensitiveWords(content);
      const visitorNumber = await messageService.getNextVisitorNumber();

      const doc = await messageService.create({
        name,
        email,
        website: website || undefined,
        avatar,
        content: filteredContent,
        isPrivate,
        requireEmailNotification,
        status: "approved",
        ip: client.ip,
        userAgent: client.userAgent,
        browser: client.browser,
        os: client.os,
        deviceType: client.deviceType,
        referer: client.referer,
        language: client.language,
        visitorNumber,
        location,
      });

      if (!requireEmailNotification) {
        await sendEmail({
          email,
          type: 5,
          name,
          content: filteredContent,
        });
      }
      await sendEmail({
        email: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
        type: 10,
        name,
        content: filteredContent,
        isPrivate,
        requireEmailNotification,
      });

      this.created(ctx, doc, "留言成功");
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  // GET /api/messages?page=1&pageSize=10&status=approved  分页查询留言，附带表态计数
  async list(ctx) {
    try {
      const { page = 1, pageSize = 10 } = ctx.query;
      const filter = this.getListFilter(ctx);

      const { items, pagination } = await messageService.paginate(filter, {
        page,
        pageSize,
        sort: { createdAt: -1 },
      });
      const ids = items.map((i) => String(i._id));
      const countsMap = await reactionService.getCountsMap("message", ids);
      const emailCountsMap = await messageService.getEmailCountsMap(
        filter,
        items.map((i) => i.email),
      );
      
      const commentCounts = await Comment.aggregate([
        { $match: { targetId: { $in: ids }, status: "approved" } },
        { $group: { _id: "$targetId", count: { $sum: 1 } } }
      ]);
      const commentCountMap = {};
      commentCounts.forEach(item => {
        commentCountMap[item._id] = item.count;
      });
      
      const pageNumber = Number(pagination.page || page || 1);
      const pageSizeNumber = Number(pagination.pageSize || pageSize || items.length || 10);
      const totalNumber = Number(pagination.total || 0);
      const merged = items.map((i, index) => ({
        ...i,
        visitorNumber:
          Number(i.visitorNumber) > 0
            ? Number(i.visitorNumber)
            : Math.max(totalNumber - ((pageNumber - 1) * pageSizeNumber + index), 1),
        visitorMessageCount: emailCountsMap[String(i.email || '').trim().toLowerCase()] || 1,
        reactions: countsMap[String(i._id)] || reactionService.emptyCounts(),
        commentCount: commentCountMap[String(i._id)] || 0,
      }));
      const passportStats = await messageService.getPassportStats(filter);

      this.paginated(ctx, merged, { ...pagination, passportStats }, "获取留言成功");
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  // GET /api/messages/stats  获取留言护照全量统计
  async stats(ctx) {
    try {
      const filter = this.getListFilter(ctx);
      const [total, passportStats] = await Promise.all([
        messageService.count(filter),
        messageService.getPassportStats(filter),
      ]);

      this.ok(ctx, { total, ...passportStats }, "获取留言统计成功");
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  // GET /api/messages/:id  获取单条公开留言
  async detail(ctx) {
    try {
      const message = await messageService.findOneByFields({
        _id: ctx.params.id,
        status: "approved",
        isPrivate: { $ne: true },
      });
      if (!message) this.throwHttpError("留言未找到", HttpStatus.NOT_FOUND);
      this.ok(ctx, message, "获取留言成功");
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  // PATCH /api/messages/:id/approve  审核通过
  async approve(ctx) {
    try {
      const updated = await messageService.updateById(ctx.params.id, {
        status: "approved",
      });
      if (!updated) this.throwHttpError("留言未找到", HttpStatus.NOT_FOUND);
      this.ok(ctx, updated, "留言审核通过");
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  // DELETE /api/messages/:id  删除留言
  async remove(ctx) {
    try {
      const removed = await messageService.deleteById(ctx.params.id);
      if (!removed) this.throwHttpError("留言未找到", HttpStatus.NOT_FOUND);
      this.ok(ctx, removed, "留言已删除");
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  // POST /api/messages/:id/react  body: { type: '<emojiId>', action?: 'add' | 'remove' }  表态/取消表态
  async react(ctx) {
    try {
      const { type, action = "add" } = ctx.request.body || {};
      const ip = ctx.ip || ctx.request.ip;
      const targetId = String(ctx.params.id);

      const result = await reactionService.handleReact("message", targetId, type, ip, action);
      if (!result) {
        this.throwHttpError(
          action === "remove" ? "您未表态过该表情" : "您已经表态过该表情",
          HttpStatus.BAD_REQUEST
        );
      }

      this.ok(ctx, result, action === "remove" ? "表态已取消" : "表态已更新");
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  // PATCH /api/messages/:id/refresh-avatar  根据邮箱重新获取头像
  async refreshAvatar(ctx) {
    try {
      const message = await messageService.getById(ctx.params.id);
      if (!message) this.throwHttpError("留言未找到", HttpStatus.NOT_FOUND);
      
      const newAvatar = getAvatarByEmail(message.email);
      const updated = await messageService.updateById(ctx.params.id, {
        avatar: newAvatar,
      });
      
      this.ok(ctx, updated, "头像已更新");
    } catch (err) {
      this.fail(ctx, err);
    }
  }
}

module.exports = new MessageController();
