const Router = require("@koa/router");
const momentController = require("../../controllers/momentController");

const router = new Router({ prefix: "/api/admin/moments" });

router.post(
  "/",
  momentController.createMoment.bind(momentController)
);
router.put(
  "/:id",
  momentController.updateMoment.bind(momentController)
);
router.delete(
  "/:id",
  momentController.deleteMoment.bind(momentController)
);
router.post(
  "/upload",
  momentController.uploadMedia.bind(momentController)
);
router.get(
  "/gallery/photos",
  momentController.getGalleryPhotos.bind(momentController)
);
router.get(
  "/list",
  momentController.getAdminMoments.bind(momentController)
);

module.exports = router;
