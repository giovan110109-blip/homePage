const Router = require('@koa/router');
const controller = require('../../controllers/uploadController');

const router = new Router({
    prefix: '/api/upload'
});

// 支持单文件上传，表单字段名 file
router.post('/', controller.upload.bind(controller));

module.exports = router;
