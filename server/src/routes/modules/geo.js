const Router = require('@koa/router')
const geoController = require('../../controllers/geoController')

const router = new Router({ prefix: '/api/geo' })

// 地址搜索
router.get('/search', geoController.searchAddress.bind(geoController))

// 反向地理编码
router.get('/reverse', geoController.reverseGeocode.bind(geoController))

module.exports = router
