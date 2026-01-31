const Router = require('@koa/router');
const adminArticleController = require('../../controllers/adminArticleController');
const adminAuth = require('../../middleware/adminAuth');

const router = new Router({ prefix: '/api/admin/articles' });

// 管理员文章路由（需要认证）
router.use(adminAuth);

router.get('/', adminArticleController.getArticles.bind(adminArticleController));
router.get('/:id', adminArticleController.getArticleById.bind(adminArticleController));
router.post('/', adminArticleController.createArticle.bind(adminArticleController));
router.put('/:id', adminArticleController.updateArticle.bind(adminArticleController));
router.delete('/:id', adminArticleController.deleteArticle.bind(adminArticleController));
router.patch('/:id/toggle-publish', adminArticleController.togglePublish.bind(adminArticleController));
router.patch('/:id/toggle-top', adminArticleController.toggleTop.bind(adminArticleController));
router.post('/batch-delete', adminArticleController.batchDelete.bind(adminArticleController));

module.exports = router;
