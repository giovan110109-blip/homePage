const Router = require('@koa/router')
const shareController = require('../controllers/shareController')
const { requireGiovanFileAccess } = require('../middleware/productPermission')

const router = new Router({ prefix: '/api/share' })

router.post('/create', requireGiovanFileAccess(['file.access', 'file.share']), shareController.create.bind(shareController))
router.get('/list', requireGiovanFileAccess(['file.access', 'file.share']), shareController.list.bind(shareController))
router.delete('/:id', requireGiovanFileAccess(['file.access', 'file.share']), shareController.delete.bind(shareController))
router.get('/:shareCode', shareController.getShare.bind(shareController))
router.post('/:shareCode/verify', shareController.verifyPassword.bind(shareController))
router.get('/:shareCode/download', shareController.download.bind(shareController))

module.exports = router
