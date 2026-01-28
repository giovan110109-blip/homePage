const Router = require('@koa/router');
const controller = require('../../controllers/sponsorMethodController');

const router = new Router({
  prefix: '/api/admin/sponsor-methods'
});

router.get('/', controller.listAdmin.bind(controller));
router.post('/', controller.create.bind(controller));
router.put('/:id', controller.update.bind(controller));
router.delete('/:id', controller.remove.bind(controller));

module.exports = router;
