const Router = require('@koa/router')
const photoController = require('../../controllers/photoController')

const router = new Router({ prefix: '/api/photos' })

// 照片上传
router.post('/upload', photoController.upload.bind(photoController))

// 任务状态
router.post('/tasks/batch', photoController.getTaskStatuses.bind(photoController))
router.get('/tasks/stats', photoController.getQueueStats.bind(photoController))
router.get('/tasks/:taskId', photoController.getTaskStatus.bind(photoController))
router.get('/tasks/failed', photoController.getFailedTasks.bind(photoController))
router.post('/tasks/:taskId/retry', photoController.retryTask.bind(photoController))

// 照片列表和详情
router.get('/', photoController.getPhotos.bind(photoController))
router.get('/:id', photoController.getPhotoDetail.bind(photoController))

// 地图数据
router.get('/map/data', photoController.getMapData.bind(photoController))

// 照片管理（需要管理员权限）
router.put('/:id', photoController.updatePhoto.bind(photoController))
router.delete('/:id', photoController.deletePhoto.bind(photoController))

module.exports = router
