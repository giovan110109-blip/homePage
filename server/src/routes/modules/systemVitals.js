const Router = require("@koa/router");
const controller = require("../../controllers/systemVitalsController");

const router = new Router({
  prefix: "/api/system-vitals",
});

router.get("/", controller.summary.bind(controller));

module.exports = router;
