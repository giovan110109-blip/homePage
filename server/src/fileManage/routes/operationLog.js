const Router = require('@koa/router')
const operationLogController = require('../controllers/operationLogController')
const { requireGiovanFileAccess } = require('../middleware/productPermission')

const router = new Router({ prefix: '/api/logs' })

router.get('/list', requireGiovanFileAccess(['file.access', 'logs.read']), operationLogController.list.bind(operationLogController))
router.get('/stats', requireGiovanFileAccess(['file.access', 'logs.read']), operationLogController.stats.bind(operationLogController))

module.exports = router
