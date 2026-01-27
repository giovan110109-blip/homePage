const Router = require('@koa/router')

const router = new Router()

router.get('/health', (ctx) => {
  ctx.status = 200
  ctx.body = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
  }
})

module.exports = router
