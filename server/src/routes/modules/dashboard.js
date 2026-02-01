const Router = require('@koa/router');
const dashboardController = require('../../controllers/dashboardController');

const router = new Router({ prefix: '/api/admin/dashboard' });

// GET /api/admin/dashboard/stats - 获取仪表板统计数据
router.get('/stats', async (ctx) => {
  await dashboardController.getStats(ctx);
});

module.exports = router;
