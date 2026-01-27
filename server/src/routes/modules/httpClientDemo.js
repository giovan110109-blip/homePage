const Router = require('@koa/router');
const controller = require('../../controllers/httpClientDemoController');

const router = new Router({
    prefix: '/api/http-demo'
});

router.get('/posts', controller.listPosts.bind(controller));
router.get('/posts/:id', controller.postDetail.bind(controller));

module.exports = router;
