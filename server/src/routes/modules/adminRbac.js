const Router = require('@koa/router')
const roleController = require('../../controllers/roleController')
const menuController = require('../../controllers/menuController')

const router = new Router({ prefix: '/api/admin' })

router.get('/roles', roleController.list.bind(roleController))
router.get('/roles/all', roleController.getAll.bind(roleController))
router.post('/roles', roleController.create.bind(roleController))
router.put('/roles/:id', roleController.update.bind(roleController))
router.delete('/roles/:id', roleController.delete.bind(roleController))
router.get('/roles/:id/menus', roleController.getMenus.bind(roleController))
router.put('/roles/:id/menus', roleController.updateMenus.bind(roleController))

router.get('/menus', menuController.list.bind(menuController))
router.get('/menus/all', menuController.getAll.bind(menuController))
router.post('/menus', menuController.create.bind(menuController))
router.put('/menus/:id', menuController.update.bind(menuController))
router.delete('/menus/:id', menuController.delete.bind(menuController))

module.exports = router
