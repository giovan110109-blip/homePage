const BaseController = require("../utils/baseController");
const { HttpStatus } = require("../utils/response");
const messageService = require("../services/messageService");
const { getClientInfo } = require("../utils/requestInfo");
const { getLocationByIp } = require("../utils/ipLocator");
const reactionService = require("../services/reactionService");
const ReactionLog = require("../models/reactionLog");
const { getAvatarByEmail } = require("../utils/emailAvatar");
const { sendEmail } = require("../utils/sendEmail");
class MessageController extends BaseController {
  // POST /api/messages  创建留言
  async create(ctx) {
    try {
      const payload = ctx.request.body || {};
      if (!payload.name || !payload.email || !payload.content) {
        this.throwHttpError(
          "name, email, content are required",
          HttpStatus.BAD_REQUEST,
        );
      }

      // 获取客户端信息和地理位置
      const client = ctx.state.clientInfo || getClientInfo(ctx);
      const location = await getLocationByIp(client.ip);
      // 使用邮箱生成头像
      const emailAvatar = getAvatarByEmail(payload.email);

      const avatar = emailAvatar ? emailAvatar : payload.avatar;
      const doc = await messageService.create({
        name: payload.name,
        email: payload.email,
        website: payload.website,
        avatar,
        content: payload.content,
        // 暂时取消人工审核，直接标记为通过
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
      //发送邮件
      await sendEmail({
        email: payload.email,
        type: 5,
        name: payload.name,
        content: payload.content,
      });
      //通知我有新的留言
      await sendEmail({
        email: "14945447@qq.com",
        type: 10,
        name: payload.name,
        content: payload.content,
      });

      this.created(ctx, doc, "Message created");
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

      this.paginated(ctx, merged, pagination, "Fetched messages");
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
      if (!updated)
        this.throwHttpError("Message not found", HttpStatus.NOT_FOUND);
      this.ok(ctx, updated, "Message approved");
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  // DELETE /api/messages/:id  删除留言
  async remove(ctx) {
    try {
      const removed = await messageService.deleteById(ctx.params.id);
      if (!removed)
        this.throwHttpError("Message not found", HttpStatus.NOT_FOUND);
      this.ok(ctx, removed, "Message deleted");
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  // POST /api/messages/:id/react  body: { type: '<emojiId>', action?: 'add' | 'remove' }  表态/取消表态
  async react(ctx) {
    try {
      const { type, action = "add" } = ctx.request.body || {};
      if (!reactionService.allowed.includes(type)) {
        this.throwHttpError("invalid reaction type", HttpStatus.BAD_REQUEST);
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
            "no reaction to remove or message not found",
            HttpStatus.BAD_REQUEST,
          );
        this.ok(ctx, counts, "Reaction removed");
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
      this.ok(ctx, counts, "Reaction updated");
    } catch (err) {
      this.fail(ctx, err);
    }
  }
}

module.exports = new MessageController();
