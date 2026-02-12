const Comment = require("../models/comment");
const Message = require("../models/message");
const { HttpStatus } = require("../utils/response");
const BaseController = require("../utils/baseController");
const { getClientInfo } = require("../utils/requestInfo");
const { getLocationByIp } = require("../utils/ipLocator");
const { getAvatarByEmail } = require("../utils/emailAvatar");
const { sendEmail } = require("../utils/sendEmail");

class CommentController extends BaseController {
  async create(ctx) {
    try {
      const payload = ctx.request.body || {};
      if (
        !payload.name ||
        !payload.email ||
        !payload.content ||
        !payload.targetId
      ) {
        this.throwHttpError(
          "name, email, content, targetId are required",
          HttpStatus.BAD_REQUEST,
        );
      }

      const client = ctx.state.clientInfo || getClientInfo(ctx);
      const location = await getLocationByIp(client.ip);
      const avatar = payload.isAdmin 
        ? payload.avatar 
        : (getAvatarByEmail(payload.email) || payload.avatar);

      const doc = await Comment.create({
        targetId: payload.targetId,
        parentId: payload.parentId || null,
        name: payload.name,
        email: payload.email,
        website: payload.website,
        avatar,
        content: payload.content,
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

      // 发送邮件通知
      this.sendCommentNotification(payload, doc).catch(err => {
        console.error("发送评论通知邮件失败:", err);
      });

      this.created(ctx, doc, "评论成功");
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  async sendCommentNotification(payload, comment) {
    const { parentId, targetId, name, content } = payload;
    
    // 不给自己发送通知
    let recipientEmail = null;
    let recipientName = null;
    let emailType = null;

    if (parentId) {
      // 对评论进行回复 (type=7)
      const parentComment = await Comment.findById(parentId).lean();
      if (parentComment && parentComment.email !== payload.email) {
        recipientEmail = parentComment.email;
        recipientName = parentComment.name;
        emailType = 7;
      }
    } else {
      // 对留言进行评论 (type=6)
      const message = await Message.findById(targetId).lean();
      if (message && message.email !== payload.email) {
        recipientEmail = message.email;
        recipientName = message.name;
        emailType = 6;
      }
    }

    if (recipientEmail && emailType) {
      // TODO: 在这里实现发送邮件
      await sendEmail({
        email: recipientEmail,
        type: emailType,
        name: recipientName,
        content: content,
        commenterName: name,
      });
      console.log(`[邮件通知] type=${emailType}, to=${recipientEmail}, name=${recipientName}, commenterName=${name}`);
    }
  }

  async list(ctx) {
    try {
      const { targetId, page = 1, pageSize = 100 } = ctx.query;
      if (!targetId) {
        this.throwHttpError("targetId is required", HttpStatus.BAD_REQUEST);
      }
      const filter = { targetId, status: "approved" };
      const total = await Comment.countDocuments(filter);
      const items = await Comment.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(Number(pageSize));
      this.paginated(ctx, items, { page, pageSize, total }, "获取评论列表成功");
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  async remove(ctx) {
    try {
      const removed = await Comment.findByIdAndDelete(ctx.params.id);
      if (!removed) {
        this.throwHttpError("评论未找到", HttpStatus.NOT_FOUND);
      }
      this.ok(ctx, removed, "评论已删除");
    } catch (err) {
      this.fail(ctx, err);
    }
  }
}

module.exports = new CommentController();
