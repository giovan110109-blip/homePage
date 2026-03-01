const Router = require("@koa/router");
const momentController = require("../../controllers/momentController");

const router = new Router({ prefix: "/api/moments" });

router.get("/", momentController.getMoments.bind(momentController));
router.get("/geocode/reverse", momentController.reverseGeocode.bind(momentController));
router.get("/:id", momentController.getMomentDetail.bind(momentController));
router.post("/:id/like", momentController.likeMoment.bind(momentController));
router.post("/:id/react", momentController.reactMoment.bind(momentController));

module.exports = router;
