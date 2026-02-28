const Router = require('@koa/router')
const photoController = require('../../controllers/photoController')

const router = new Router({ prefix: '/api/photos' })

// 照片上传
router.post('/upload', photoController.upload.bind(photoController))

// 任务状态 - 注意：具体路由必须在参数路由之前
router.post('/tasks/batch', photoController.getTaskStatuses.bind(photoController))
router.get('/tasks/stats', photoController.getQueueStats.bind(photoController))
router.get('/tasks/failed', photoController.getFailedTasks.bind(photoController))
router.get('/tasks/:taskId', photoController.getTaskStatus.bind(photoController))
router.post('/tasks/:taskId/retry', photoController.retryTask.bind(photoController))

// 照片列表和详情
router.get('/', photoController.getPhotos.bind(photoController))
router.get('/:id', photoController.getPhotoDetail.bind(photoController))

// 地图数据
router.get('/map/data', photoController.getMapData.bind(photoController))

// 照片管理（需要管理员权限）
router.put('/:id', photoController.updatePhoto.bind(photoController))
router.delete('/:id', photoController.deletePhoto.bind(photoController))
router.post('/batch-delete', photoController.batchDeletePhotos.bind(photoController))

// 照片元数据管理
router.post('/:id/location', photoController.updatePhotoLocation.bind(photoController))
router.post('/:id/rotate', photoController.rotatePhoto.bind(photoController))
router.post('/:id/refresh-geoinfo', photoController.refreshPhotoGeoinfo.bind(photoController))
router.post('/:id/refresh-exif', photoController.refreshPhotoExif.bind(photoController))

module.exports = router
