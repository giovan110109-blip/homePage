const Router = require('@koa/router');
const commentController = require('../../controllers/commentController');

const router = new Router({
  prefix: '/api/admin/comments'
});

router.delete('/:id', commentController.remove.bind(commentController));

module.exports = router;
