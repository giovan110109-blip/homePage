const Router = require('@koa/router');
const controller = require('../../controllers/adminAuthController');

const router = new Router({
  prefix: '/api/admin'
});

router.post('/login', controller.login.bind(controller));
router.get('/verify', controller.verify.bind(controller));
router.post('/refresh', controller.refresh.bind(controller));
router.get('/menus', controller.getUserMenus.bind(controller));

module.exports = router;