const Router = require('@koa/router');
const controller = require('../../controllers/adminUserController');

const router = new Router({
  prefix: '/api/admin/users'
});

router.get('/', controller.list.bind(controller)); // 获取用户列表
router.post('/', controller.create.bind(controller)); // 创建用户
router.get('/:id', controller.detail.bind(controller)); // 获取用户详情
router.put('/:id', controller.update.bind(controller)); // 更新用户
router.post('/:id/reset-password', controller.resetPassword.bind(controller)); // 重置密码
router.delete('/:id', controller.delete.bind(controller)); // 删除用户

module.exports = router;
