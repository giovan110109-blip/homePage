const Router = require("@koa/router");
const photoController = require("../../controllers/photoController");
const adminAuth = require("../../middleware/adminAuth");

const router = new Router({ prefix: "/api/admin/photos" });

router.use(adminAuth);

router.get("/", photoController.getPhotos.bind(photoController));
router.get("/map/data", photoController.getMapData.bind(photoController));
router.get("/:id", photoController.getPhotoDetail.bind(photoController));
router.put("/:id", photoController.updatePhoto.bind(photoController));
router.delete("/:id", photoController.deletePhoto.bind(photoController));
router.post("/batch-delete", photoController.batchDeletePhotos.bind(photoController));
router.post("/:id/location", photoController.updatePhotoLocation.bind(photoController));
router.post("/:id/rotate", photoController.rotatePhoto.bind(photoController));
router.post(
  "/:id/refresh-geoinfo",
  photoController.refreshPhotoGeoinfo.bind(photoController),
);
router.post(
  "/:id/refresh-exif",
  photoController.refreshPhotoExif.bind(photoController),
);

module.exports = router;
