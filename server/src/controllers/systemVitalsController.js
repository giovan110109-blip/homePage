const BaseController = require("../utils/baseController");
const AccessLog = require("../models/accessLog");

const bootedAt = new Date();

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const getDeployLabel = () => {
  const deployedAt =
    process.env.DEPLOYED_AT ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.RENDER_GIT_COMMIT ||
    process.env.COMMIT_SHA;

  if (!deployedAt) return bootedAt.toISOString();
  if (/^[a-f0-9]{7,40}$/i.test(deployedAt)) return deployedAt.slice(0, 7);
  return deployedAt;
};

class SystemVitalsController extends BaseController {
  async summary(ctx) {
    const startedAt = Date.now();

    try {
      const now = new Date();
      const today = startOfToday();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const [todayVisits, recentTotal, recentHealthy, recentErrors, latencySample] =
        await Promise.all([
          AccessLog.countDocuments({ createdAt: { $gte: today } }),
          AccessLog.countDocuments({ createdAt: { $gte: last24Hours } }),
          AccessLog.countDocuments({
            createdAt: { $gte: last24Hours },
            status: { $gte: 200, $lt: 400 },
          }),
          AccessLog.find({
            createdAt: { $gte: last24Hours },
            status: { $gte: 400 },
          })
            .sort({ createdAt: -1 })
            .limit(1)
            .select("path status createdAt")
            .lean(),
          AccessLog.find({
            createdAt: { $gte: last24Hours },
            duration: { $type: "number", $gte: 0 },
          })
            .sort({ createdAt: -1 })
            .limit(40)
            .select("duration")
            .lean(),
        ]);

      const observedUptime =
        recentTotal > 0 ? Number(((recentHealthy / recentTotal) * 100).toFixed(2)) : 100;
      const averageLatency =
        latencySample.length > 0
          ? Math.round(
              latencySample.reduce((sum, item) => sum + Number(item.duration || 0), 0) /
                latencySample.length,
            )
          : Date.now() - startedAt;

      this.ok(
        ctx,
        {
          uptime: observedUptime,
          latency: Math.max(1, averageLatency),
          deployedAt: getDeployLabel(),
          todayVisits,
          recentError: recentErrors[0]
            ? {
                path: recentErrors[0].path || "unknown",
                status: recentErrors[0].status || 500,
                time: recentErrors[0].createdAt,
              }
            : null,
          checkedAt: now.toISOString(),
        },
        "获取系统生命体征成功",
      );
    } catch (err) {
      this.fail(ctx, err);
    }
  }
}

module.exports = new SystemVitalsController();
