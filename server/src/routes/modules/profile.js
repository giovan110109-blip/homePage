const Router = require('@koa/router');
const profileController = require('../../controllers/profileController');
const adminAuth = require('../../middleware/adminAuth');

const router = new Router({ prefix: '/api/admin/profile' });

// 需要认证
router.use(adminAuth);

// 获取当前用户信息
router.get('/', profileController.getProfile.bind(profileController));

// 更新当前用户信息
router.put('/', profileController.updateProfile.bind(profileController));

module.exports = router;
