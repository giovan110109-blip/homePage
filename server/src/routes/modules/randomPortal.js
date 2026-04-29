const Router = require('@koa/router');
const randomPortalController = require('../../controllers/randomPortalController');

const router = new Router({ prefix: '/api/random-portal' });

router.get('/', randomPortalController.open.bind(randomPortalController));

module.exports = router;
