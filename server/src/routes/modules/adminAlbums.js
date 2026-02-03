const Router = require('@koa/router')
const adminAuth = require('../../middleware/adminAuth')
const adminAlbumController = require('../../controllers/adminAlbumController')

const router = new Router({ prefix: '/api/admin/albums' })

router.use(adminAuth)

router.get('/', adminAlbumController.list.bind(adminAlbumController))
router.post('/', adminAlbumController.create.bind(adminAlbumController))
router.put('/:id', adminAlbumController.update.bind(adminAlbumController))
router.delete('/:id', adminAlbumController.remove.bind(adminAlbumController))

module.exports = router
