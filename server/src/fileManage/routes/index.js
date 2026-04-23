const Router = require('@koa/router')
const fileController = require('../controllers/fileController')
const uploadController = require('../controllers/uploadController')
const { requireGiovanFileAccess } = require('../middleware/productPermission')

const router = new Router({ prefix: '/api/files' })

router.get('/access', requireGiovanFileAccess(['file.access']), async (ctx) => {
  ctx.body = {
    success: true,
    message: '获取文件产品权限成功',
    data: ctx.state.productAccess,
  }
})
router.get('/list', requireGiovanFileAccess(['file.access', 'file.list']), fileController.list.bind(fileController))
router.get('/storage', requireGiovanFileAccess(['file.access', 'storage.read']), fileController.getStorageUsage.bind(fileController))
router.post('/folder', requireGiovanFileAccess(['file.access', 'file.upload']), fileController.createFolder.bind(fileController))
router.post('/verify-folder-password', requireGiovanFileAccess(['file.access', 'file.list']), fileController.verifyFolderPassword.bind(fileController))
router.get('/:id/info', requireGiovanFileAccess(['file.access', 'file.preview']), fileController.getFileInfo.bind(fileController))
router.get('/:id/preview', requireGiovanFileAccess(['file.access', 'file.preview']), fileController.preview.bind(fileController))
router.get('/:id/thumbnail', requireGiovanFileAccess(['file.access', 'file.preview']), fileController.getThumbnail.bind(fileController))
router.get('/:id/folder-size', requireGiovanFileAccess(['file.access', 'file.list']), fileController.getFolderSize.bind(fileController))
router.put('/:id/rename', requireGiovanFileAccess(['file.access', 'file.rename']), fileController.rename.bind(fileController))
router.post('/delete', requireGiovanFileAccess(['file.access', 'file.delete']), fileController.delete.bind(fileController))
router.get('/trash', requireGiovanFileAccess(['file.access', 'trash.view']), fileController.getTrash.bind(fileController))
router.post('/restore', requireGiovanFileAccess(['file.access', 'trash.restore']), fileController.restore.bind(fileController))
router.post('/permanent-delete', requireGiovanFileAccess(['file.access', 'trash.delete']), fileController.permanentDelete.bind(fileController))
router.get('/search', requireGiovanFileAccess(['file.access', 'file.list']), fileController.search.bind(fileController))
router.post('/:id/favorite', requireGiovanFileAccess(['file.access', 'file.favorite']), fileController.toggleFavorite.bind(fileController))
router.get('/favorites', requireGiovanFileAccess(['file.access', 'file.favorite']), fileController.getFavorites.bind(fileController))
router.get('/tree', requireGiovanFileAccess(['file.access', 'file.list']), fileController.getTree.bind(fileController))
router.get('/:id/download', requireGiovanFileAccess(['file.access', 'file.download']), fileController.download.bind(fileController))
router.post('/upload', requireGiovanFileAccess(['file.access', 'file.upload']), fileController.upload.bind(fileController))
router.post('/copy', requireGiovanFileAccess(['file.access', 'file.copy']), fileController.copy.bind(fileController))
router.post('/move', requireGiovanFileAccess(['file.access', 'file.move']), fileController.move.bind(fileController))

router.post('/upload/init', requireGiovanFileAccess(['file.access', 'file.upload']), uploadController.initUpload.bind(uploadController))
router.post('/upload/chunk', requireGiovanFileAccess(['file.access', 'file.upload']), uploadController.uploadChunk.bind(uploadController))
router.post('/upload/complete', requireGiovanFileAccess(['file.access', 'file.upload']), uploadController.completeUpload.bind(uploadController))
router.get('/upload/status/:uploadId', requireGiovanFileAccess(['file.access', 'file.upload']), uploadController.getUploadStatus.bind(uploadController))
router.post('/upload/cancel', requireGiovanFileAccess(['file.access', 'file.upload']), uploadController.cancelUpload.bind(uploadController))

module.exports = router
