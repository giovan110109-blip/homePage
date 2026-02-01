const Router = require('@koa/router');
const controller = require('../../controllers/adminAuthController');

const router = new Router({
  prefix: '/api/admin'
});

router.post('/login', controller.login.bind(controller));
router.get('/verify', controller.verify.bind(controller));

module.exports = router;