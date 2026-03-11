const Router = require("@koa/router");
const npsController = require("../../controllers/npsController");

const router = new Router({ prefix: "/api/nps" });

// 认证
router.post("/auth/gettime", npsController.getServerTime.bind(npsController));
router.post("/auth/getauthkey", npsController.getAuthKey.bind(npsController));

// 仪表盘
router.post("/dashboard/stats", npsController.getStats.bind(npsController));

// 隧道管理
router.post("/tunnel/list", npsController.getTunnelList.bind(npsController));
router.post("/tunnel/get", npsController.getOneTunnel.bind(npsController));
router.post("/tunnel/add", npsController.addTunnel.bind(npsController));
router.post("/tunnel/edit", npsController.editTunnel.bind(npsController));
router.post("/tunnel/start", npsController.startTunnel.bind(npsController));
router.post("/tunnel/stop", npsController.stopTunnel.bind(npsController));
router.post("/tunnel/delete", npsController.deleteTunnel.bind(npsController));

// 域名解析管理
router.post("/host/list", npsController.getHostList.bind(npsController));
router.post("/host/add", npsController.addHost.bind(npsController));
router.post("/host/edit", npsController.editHost.bind(npsController));
router.post("/host/delete", npsController.deleteHost.bind(npsController));

// 客户端管理
router.post("/client/list", npsController.getClientList.bind(npsController));
router.post("/client/get", npsController.getOneClient.bind(npsController));
router.post("/client/add", npsController.addClient.bind(npsController));
router.post("/client/edit", npsController.editClient.bind(npsController));
router.post("/client/delete", npsController.deleteClient.bind(npsController));

module.exports = router;
