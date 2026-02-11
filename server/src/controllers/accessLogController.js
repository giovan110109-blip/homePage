const BaseController = require("../utils/baseController");
const accessLogService = require("../services/accessLogService");
const { getLocationByIp } = require("../utils/ipLocator");

class AccessLogController extends BaseController {
  // GET /api/admin/access-logs?page=1&pageSize=20
  async list(ctx) {
    try {
      const { page = 1, pageSize = 20 } = ctx.query;
      const { items, pagination } = await accessLogService.paginate(
        {},
        {
          page,
          pageSize,
          sort: { createdAt: -1 },
        },
      );
      this.paginated(ctx, items, pagination, "获取访问日志列表成功");
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  // POST /api/access-logs/ping
  async ping(ctx) {
    try {
      const client = ctx.state.clientInfo || {};
      const payload = ctx.request.body || {};
      if (payload?.path && String(payload.path).startsWith("/admin")) {
        this.ok(ctx, null, "已忽略管理员访问日志");
        return;
      }
      const location = await getLocationByIp(client.ip);

      await accessLogService.create({
        ip: client.ip,
        page: payload.path,
        title: payload.title,
        path: payload.path || client.path,
        method: client.method,
        status: 200,
        duration: 0,
        userAgent: client.userAgent,
        browser: client.browser,
        os: client.os,
        deviceType: client.deviceType,
        referer: client.referer,
        language: client.language,
        location,
      });

      this.ok(ctx, null, "已记录访问日志");
    } catch (err) {
      this.fail(ctx, err);
    }
  }
}

module.exports = new AccessLogController();
