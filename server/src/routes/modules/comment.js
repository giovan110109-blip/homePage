const Router = require('@koa/router');
const commentController = require('../../controllers/commentController');

const router = new Router({ prefix: '/comments' });

// 创建评论或回复
router.post('/', commentController.create.bind(commentController));
// 获取评论列表
router.get('/', commentController.list.bind(commentController));

module.exports = router;
