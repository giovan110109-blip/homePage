const Router = require('@koa/router')
const operationLogController = require('../controllers/operationLogController')
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

const router = new Router({ prefix: '/api/logs' })

router.get('/list', auth, operationLogController.list.bind(operationLogController))
router.get('/stats', auth, operationLogController.stats.bind(operationLogController))

module.exports = router
