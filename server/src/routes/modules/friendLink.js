const Router = require('@koa/router');
const controller = require('../../controllers/friendLinkController');

const router = new Router({ prefix: '/api/friend-links' });

// 公开接口
router.get('/', controller.list.bind(controller));                      // 获取已通过的友情链接
router.post('/', controller.create.bind(controller));                   // 申请友情链接
router.post('/:id/click', controller.recordClick.bind(controller));     // 记录点击

module.exports = router;
