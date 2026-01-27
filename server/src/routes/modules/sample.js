const Router = require('@koa/router');
const sampleController = require('../../controllers/sampleController');

const router = new Router({
    prefix: '/api/samples'
});

router.get('/', sampleController.list.bind(sampleController));
router.get('/search', sampleController.search.bind(sampleController));
router.get('/stats/status', sampleController.countByStatus.bind(sampleController));
router.post('/bulk', sampleController.bulkCreate.bind(sampleController));
router.patch('/:id/tag', sampleController.addTag.bind(sampleController));
router.patch('/:id/disable', sampleController.disable.bind(sampleController));
router.get('/client-info', sampleController.clientInfo.bind(sampleController));
router.get('/:id', sampleController.detail.bind(sampleController));
router.post('/', sampleController.create.bind(sampleController));
router.put('/:id', sampleController.update.bind(sampleController));
router.delete('/:id', sampleController.remove.bind(sampleController));

module.exports = router;
