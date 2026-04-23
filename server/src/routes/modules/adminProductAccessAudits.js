const Router = require('@koa/router');
const controller = require('../../controllers/productAccessAuditController');

const router = new Router({ prefix: '/api/admin/product-access-audits' });

router.get('/', controller.list.bind(controller));

module.exports = router;
