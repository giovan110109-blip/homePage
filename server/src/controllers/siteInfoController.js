const BaseController = require("../utils/baseController");
const SiteInfo = require("../models/siteInfo");
const { HttpStatus } = require("../utils/response");

const ACTIVITY_STATUSES = new Set(["写代码", "修图", "看电影", "摸鱼中"]);
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isAdminPlus = (user) =>
  user?.role === "admin-plus" ||
  (Array.isArray(user?.roles) &&
    user.roles.some((role) => role?.code === "admin-plus"));

class SiteInfoController extends BaseController {
  async getPublic(ctx) {
    try {
      const doc = await SiteInfo.findOne().lean();
      this.ok(ctx, doc || {}, "获取站点信息成功");
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  async getAdmin(ctx) {
    try {
      const doc = await SiteInfo.findOne().lean();
      this.ok(ctx, doc || {}, "获取站点信息成功");
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  async upsert(ctx) {
    try {
      const payload = ctx.request.body || {};
      if (
        !isAdminPlus(ctx.state.user) &&
        ("activityStatus" in payload || "activityStatusDate" in payload)
      ) {
        delete payload.activityStatus;
        delete payload.activityStatusDate;
      }

      if ("activityStatus" in payload || "activityStatusDate" in payload) {
        this.validateActivityStatusPayload(payload);
      }

      const doc = await SiteInfo.findOneAndUpdate({}, payload, {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        lean: true,
      });

      this.ok(ctx, doc, "站点信息保存成功");
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  async updateActivityStatus(ctx) {
    try {
      if (!isAdminPlus(ctx.state.user)) {
        this.throwHttpError("仅 admin-plus 可修改今日状态", HttpStatus.FORBIDDEN);
      }

      const payload = ctx.request.body || {};
      this.validateActivityStatusPayload(payload);

      const doc = await SiteInfo.findOneAndUpdate(
        {},
        {
          activityStatus: payload.activityStatus,
          activityStatusDate: payload.activityStatusDate,
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
          lean: true,
        },
      );

      this.ok(
        ctx,
        {
          activityStatus: doc.activityStatus,
          activityStatusDate: doc.activityStatusDate,
        },
        "今日状态保存成功",
      );
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  validateActivityStatusPayload(payload) {
    if (!ACTIVITY_STATUSES.has(payload.activityStatus)) {
      this.throwHttpError("无效的今日状态", HttpStatus.BAD_REQUEST);
    }

    if (!DATE_KEY_PATTERN.test(payload.activityStatusDate || "")) {
      this.throwHttpError("无效的状态日期", HttpStatus.BAD_REQUEST);
    }
  }
}

module.exports = new SiteInfoController();
