const Router = require('@koa/router')
const fileController = require('../controllers/fileController')
const uploadController = require('../controllers/uploadController')
const { verifyToken } = require('../../utils/adminTokenStore')

const auth = async (ctx, next) => {
  let token = ctx.get('authorization')?.replace('Bearer ', '') || ctx.get('x-admin-token')
  if (!token) {
    token = ctx.query.token
  }
  if (!token) {
    ctx.status = 401
    ctx.body = { success: false, message: '未登录' }
    return
  }
  const user = await verifyToken(token)
  if (!user) {
    ctx.status = 401
    ctx.body = { success: false, message: '登录已过期' }
    return
  }
  ctx.state.user = user
  await next()
}

const router = new Router({ prefix: '/api/files' })

router.get('/list', auth, fileController.list.bind(fileController))
router.get('/storage', auth, fileController.getStorageUsage.bind(fileController))
router.post('/folder', auth, fileController.createFolder.bind(fileController))
router.post('/verify-folder-password', auth, fileController.verifyFolderPassword.bind(fileController))
router.get('/:id/info', auth, fileController.getFileInfo.bind(fileController))
router.get('/:id/preview', auth, fileController.preview.bind(fileController))
router.get('/:id/thumbnail', auth, fileController.getThumbnail.bind(fileController))
router.get('/:id/folder-size', auth, fileController.getFolderSize.bind(fileController))
router.put('/:id/rename', auth, fileController.rename.bind(fileController))
router.post('/delete', auth, fileController.delete.bind(fileController))
router.get('/trash', auth, fileController.getTrash.bind(fileController))
router.post('/restore', auth, fileController.restore.bind(fileController))
router.post('/permanent-delete', auth, fileController.permanentDelete.bind(fileController))
router.get('/search', auth, fileController.search.bind(fileController))
router.post('/:id/favorite', auth, fileController.toggleFavorite.bind(fileController))
router.get('/favorites', auth, fileController.getFavorites.bind(fileController))
router.get('/tree', auth, fileController.getTree.bind(fileController))
router.get('/:id/download', auth, fileController.download.bind(fileController))
router.post('/upload', auth, fileController.upload.bind(fileController))
router.post('/copy', auth, fileController.copy.bind(fileController))
router.post('/move', auth, fileController.move.bind(fileController))

router.post('/upload/init', auth, uploadController.initUpload.bind(uploadController))
router.post('/upload/chunk', auth, uploadController.uploadChunk.bind(uploadController))
router.post('/upload/complete', auth, uploadController.completeUpload.bind(uploadController))
router.get('/upload/status/:uploadId', auth, uploadController.getUploadStatus.bind(uploadController))
router.post('/upload/cancel', auth, uploadController.cancelUpload.bind(uploadController))

module.exports = router
