const Router = require('@koa/router');
const controller = require('../../controllers/accessLogController');

const router = new Router({
  prefix: '/api/admin/access-logs'
});

router.get('/', controller.list.bind(controller));

module.exports = router;
