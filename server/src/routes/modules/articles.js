const Router = require('@koa/router');
const articleController = require('../../controllers/articleController');

const router = new Router({ prefix: '/api/articles' });

// 前台文章路由
router.get('/', articleController.getPublishedArticles.bind(articleController));
router.get('/hot', articleController.getHotArticles.bind(articleController));
router.get('/categories', articleController.getCategories.bind(articleController));
router.get('/tags', articleController.getTags.bind(articleController));
router.get('/:id', articleController.getArticleDetail.bind(articleController));
router.post('/:id/like', articleController.likeArticle.bind(articleController));
router.post('/:id/react', articleController.react.bind(articleController));

module.exports = router;
