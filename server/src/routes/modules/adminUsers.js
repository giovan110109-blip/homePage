const Router = require('@koa/router');
const controller = require('../../controllers/adminUserController');

const router = new Router({
  prefix: '/api/admin/users'
});

router.get('/', controller.list.bind(controller));
router.post('/', controller.create.bind(controller));
router.get('/:id', controller.detail.bind(controller));
router.put('/:id', controller.update.bind(controller));
router.put('/:id/roles', controller.updateRoles.bind(controller));
router.post('/:id/reset-password', controller.resetPassword.bind(controller));
router.delete('/:id', controller.delete.bind(controller));

module.exports = router;
