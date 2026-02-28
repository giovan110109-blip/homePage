const Router = require("@koa/router");
const wechatAuthController = require("../../controllers/wechatAuthController");

const router = new Router({ prefix: "/api/auth" });

router.post("/wechat-login", wechatAuthController.wechatLogin.bind(wechatAuthController));
router.post("/bind-account", wechatAuthController.bindAccount.bind(wechatAuthController));
router.get("/me", wechatAuthController.getCurrentUser.bind(wechatAuthController));
router.post("/update-userinfo", wechatAuthController.updateUserInfo.bind(wechatAuthController));
router.post("/scan-qr", wechatAuthController.scanQr.bind(wechatAuthController));
router.post("/confirm-qr", wechatAuthController.confirmQr.bind(wechatAuthController));
router.post("/create-qr-session", wechatAuthController.createQrSession.bind(wechatAuthController));
router.get("/check-qr-status/:qrToken", wechatAuthController.checkQrStatus.bind(wechatAuthController));
router.get("/generate-qr-code", wechatAuthController.generateQrCode.bind(wechatAuthController));

module.exports = router;
