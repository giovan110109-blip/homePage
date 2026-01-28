const Router = require('@koa/router');
const controller = require('../../controllers/siteInfoController');

const router = new Router({
  prefix: '/api'
});

router.get('/site-info', controller.getPublic.bind(controller));

module.exports = router;