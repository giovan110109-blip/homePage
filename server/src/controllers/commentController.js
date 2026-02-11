const Comment = require("../models/comment");
const { HttpStatus } = require("../utils/response");
const BaseController = require("../utils/baseController");

class CommentController extends BaseController {
  // 创建评论或回复
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
      const doc = await Comment.create({
        targetId: payload.targetId,
        parentId: payload.parentId || null,
        name: payload.name,
        email: payload.email,
        website: payload.website,
        avatar: payload.avatar,
        content: payload.content,
        status: "approved",
        ip: ctx.ip,
        userAgent: ctx.request.headers["user-agent"],
        browser: payload.browser,
        os: payload.os,
        deviceType: payload.deviceType,
        referer: payload.referer,
        language: payload.language,
        location: payload.location,
      });
      this.created(ctx, doc, "评论成功");
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  // 获取评论列表（支持分页、主评论/回复）
  async list(ctx) {
    try {
      const { targetId, parentId = null, page = 1, pageSize = 10 } = ctx.query;
      if (!targetId) {
        this.throwHttpError("targetId is required", HttpStatus.BAD_REQUEST);
      }
      const filter = { targetId, parentId };
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
}

module.exports = new CommentController();
