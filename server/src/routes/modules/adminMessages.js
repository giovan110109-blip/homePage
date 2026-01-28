const Router = require('@koa/router');
const controller = require('../../controllers/messageController');

const router = new Router({
  prefix: '/api/admin/messages'
});

// GET /api/admin/messages?page=1&pageSize=10&status=approved
router.get('/', controller.list.bind(controller));

// PATCH /api/admin/messages/:id/approve
router.patch('/:id/approve', controller.approve.bind(controller));
router.delete('/:id', controller.remove.bind(controller));

module.exports = router;