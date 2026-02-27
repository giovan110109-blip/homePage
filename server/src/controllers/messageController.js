const BaseController = require("../utils/baseController");
const { HttpStatus } = require("../utils/response");
const messageService = require("../services/messageService");
const { getClientInfo } = require("../utils/requestInfo");
const { getLocationByIp } = require("../utils/ipLocator");
const reactionService = require("../services/reactionService");
const ReactionLog = require("../models/reactionLog");
const { getAvatarByEmail } = require("../utils/emailAvatar");
const { sendEmail } = require("../utils/sendEmail");
const { containsSensitiveWords, filterSensitiveWords } = require("../utils/sensitiveWords");

class MessageController extends BaseController {
  async create(ctx) {
    try {
      const payload = ctx.request.body || {};
      if (!payload.name || !payload.email || !payload.content) {
        this.throwHttpError("名称、邮箱和内容为必填项", HttpStatus.BAD_REQUEST);
      }

      const sensitiveCheck = containsSensitiveWords(payload.content);
      if (sensitiveCheck.hasSensitive) {
        this.throwHttpError(
          "留言内容包含敏感词，请修改后重试",
          HttpStatus.BAD_REQUEST,
        );
      }

      const client = ctx.state.clientInfo || getClientInfo(ctx);
      const location = await getLocationByIp(client.ip);
      const emailAvatar = getAvatarByEmail(payload.email);

      const avatar = emailAvatar ? emailAvatar : payload.avatar;
      const filteredContent = filterSensitiveWords(payload.content);

      const doc = await messageService.create({
        name: payload.name,
        email: payload.email,
        website: payload.website,
        avatar,
        content: filteredContent,
        status: "approved",
        ip: client.ip,
        userAgent: client.userAgent,
        browser: client.browser,
        os: client.os,
        deviceType: client.deviceType,
        referer: client.referer,
        language: client.language,
        location,
      });

      await sendEmail({
        email: payload.email,
        type: 5,
        name: payload.name,
        content: filteredContent,
      });
      await sendEmail({
        email: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
        type: 10,
        name: payload.name,
        content: filteredContent,
      });

      this.created(ctx, doc, "留言成功");
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  // GET /api/messages?page=1&pageSize=10&status=approved  分页查询留言，附带表态计数
  async list(ctx) {
    try {
      const { page = 1, pageSize = 10, status } = ctx.query;
      const filter = {};
      if (status) filter.status = status;

      const { items, pagination } = await messageService.paginate(filter, {
        page,
        pageSize,
        sort: { createdAt: -1 },
      });
      const ids = items.map((i) => String(i._id));
      const countsMap = await reactionService.getCountsMap("message", ids); // 批量获取表态计数
      const merged = items.map((i) => ({
        ...i,
        reactions: countsMap[String(i._id)] || reactionService.emptyCounts(),
      }));

      this.paginated(ctx, merged, pagination, "获取留言成功");
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
      if (!reactionService.allowed.includes(type)) {
        this.throwHttpError("无效的表态类型", HttpStatus.BAD_REQUEST);
      }

      const client = ctx.state.clientInfo || getClientInfo(ctx);
      const ip = client?.ip || ctx.ip || ctx.request.ip;
      const targetId = String(ctx.params.id);

      if (action === "remove") {
        const removed = await ReactionLog.findOneAndDelete({
          targetType: "message",
          targetId,
          type,
          ip,
        });
        if (!removed) {
          this.throwHttpError("您未表态过该表情", HttpStatus.BAD_REQUEST);
        }
        const counts = await reactionService.unreact("message", targetId, type); // 取消表态
        if (!counts)
          this.throwHttpError(
            "无可取消的表态或留言未找到",
            HttpStatus.BAD_REQUEST,
          );
        this.ok(ctx, counts, "表态已取消");
        return;
      }

      const existed = await ReactionLog.findOne({
        targetType: "message",
        targetId,
        type,
        ip,
      }).lean();
      if (existed) {
        this.throwHttpError("您已经表态过该表情", HttpStatus.BAD_REQUEST);
      }

      await ReactionLog.create({ targetType: "message", targetId, type, ip });
      const counts = await reactionService.react("message", targetId, type); // 新增表态
      this.ok(ctx, counts, "表态已更新");
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
