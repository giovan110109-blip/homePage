const Router = require('@koa/router');
const productController = require('../../controllers/productController');
const productRoleController = require('../../controllers/productRoleController');
const productPermissionController = require('../../controllers/productPermissionController');

const router = new Router({ prefix: '/api/admin' });

router.get('/products', productController.list.bind(productController));
router.get('/products/all', productController.getAll.bind(productController));
router.post('/products', productController.create.bind(productController));
router.put('/products/:id', productController.update.bind(productController));
router.delete('/products/:id', productController.delete.bind(productController));

router.get('/product-roles', productRoleController.list.bind(productRoleController));
router.get('/product-roles/by-product/:productCode', productRoleController.byProduct.bind(productRoleController));
router.post('/product-roles', productRoleController.create.bind(productRoleController));
router.put('/product-roles/:id', productRoleController.update.bind(productRoleController));
router.delete('/product-roles/:id', productRoleController.delete.bind(productRoleController));

router.get('/product-permissions', productPermissionController.list.bind(productPermissionController));
router.get('/product-permissions/meta', productPermissionController.meta.bind(productPermissionController));
router.get('/product-permissions/by-product/:productCode', productPermissionController.byProduct.bind(productPermissionController));
router.post('/product-permissions', productPermissionController.create.bind(productPermissionController));
router.put('/product-permissions/:id', productPermissionController.update.bind(productPermissionController));
router.delete('/product-permissions/:id', productPermissionController.delete.bind(productPermissionController));

module.exports = router;
