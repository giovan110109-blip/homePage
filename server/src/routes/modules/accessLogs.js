const Router = require('@koa/router');
const controller = require('../../controllers/accessLogController');

const router = new Router({
  prefix: '/api'
});

router.post('/access-logs/ping', controller.ping.bind(controller));

module.exports = router;
