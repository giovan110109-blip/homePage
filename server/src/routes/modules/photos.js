const Router = require('@koa/router')
const photoController = require('../../controllers/photoController')
const { verifyToken } = require('../../utils/adminTokenStore')

const auth = async (ctx, next) => {
  const token = ctx.get('authorization')?.replace('Bearer ', '') || ctx.get('x-admin-token')
  if (!token) {
    ctx.status = 401
    ctx.body = { code: 401, message: '未登录', success: false }
    return
  }
  const user = await verifyToken(token)
  if (!user) {
    ctx.status = 401
    ctx.body = { code: 401, message: '登录已过期', success: false }
    return
  }
  ctx.state.user = user
  await next()
}

const router = new Router({ prefix: '/api/photos' })

// 照片上传（需要认证）
router.post('/upload', auth, photoController.upload.bind(photoController))

// 任务状态 - 注意：具体路由必须在参数路由之前
router.post('/tasks/batch', auth, photoController.getTaskStatuses.bind(photoController))
router.get('/tasks/stats', auth, photoController.getQueueStats.bind(photoController))
router.get('/tasks/failed', auth, photoController.getFailedTasks.bind(photoController))
router.get('/tasks/:taskId', auth, photoController.getTaskStatus.bind(photoController))
router.post('/tasks/:taskId/retry', auth, photoController.retryTask.bind(photoController))

// 照片列表和详情
router.get('/', photoController.getPhotos.bind(photoController))
router.get('/:id', photoController.getPhotoDetail.bind(photoController))

// 地图数据
router.get('/map/data', photoController.getMapData.bind(photoController))

module.exports = router
