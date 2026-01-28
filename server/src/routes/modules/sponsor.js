const Router = require('@koa/router');
const sponsorController = require('../../controllers/sponsorController');
const sponsorMethodController = require('../../controllers/sponsorMethodController');

const router = new Router({
  prefix: '/api'
});

router.get('/sponsors', sponsorController.listPublic.bind(sponsorController));
router.get('/sponsor-methods', sponsorMethodController.listPublic.bind(sponsorMethodController));

module.exports = router;
