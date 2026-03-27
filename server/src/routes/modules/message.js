const Router = require('@koa/router');
const controller = require('../../controllers/messageController');

const router = new Router({
    prefix: '/api/messages'
});

router.get('/', controller.list.bind(controller));
router.post('/', controller.create.bind(controller));
router.post('/:id/react', controller.react.bind(controller));

module.exports = router;
