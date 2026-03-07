const Router = require('@koa/router')
const shareController = require('../controllers/shareController')
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

const router = new Router({ prefix: '/api/share' })

router.post('/create', auth, shareController.create.bind(shareController))
router.get('/list', auth, shareController.list.bind(shareController))
router.delete('/:id', auth, shareController.delete.bind(shareController))
router.get('/:shareCode', shareController.getShare.bind(shareController))
router.post('/:shareCode/verify', shareController.verifyPassword.bind(shareController))
router.get('/:shareCode/download', shareController.download.bind(shareController))

module.exports = router
