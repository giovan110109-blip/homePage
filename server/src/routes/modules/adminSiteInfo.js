const Router = require('@koa/router');
const controller = require('../../controllers/siteInfoController');

const router = new Router({
  prefix: '/api/admin/site-info'
});

router.get('/', controller.getAdmin.bind(controller));
router.put('/', controller.upsert.bind(controller));

module.exports = router;