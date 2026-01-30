const Router = require('@koa/router');
const controller = require('../../controllers/friendLinkController');
const adminAuth = require('../../middleware/adminAuth');

const router = new Router({ prefix: '/api/admin/friend-links' });

// 所有路由都需要管理员认证
router.use(adminAuth);

router.get('/', controller.adminList.bind(controller));                 // 分页查询所有友情链接
router.get('/:id', controller.getById.bind(controller));                // 获取单个友情链接详情
router.put('/:id', controller.update.bind(controller));                 // 更新友情链接
router.put('/:id/review', controller.review.bind(controller));          // 审核友情链接
router.delete('/:id', controller.delete.bind(controller));              // 删除友情链接
router.put('/sort', controller.updateSort.bind(controller));            // 批量更新排序

module.exports = router;
