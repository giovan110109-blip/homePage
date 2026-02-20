const Router = require("@koa/router");
const User = require("../../models/user");
const { HttpStatus, Response } = require("../../utils/response");
const { issueToken, verifyToken } = require("../../utils/adminTokenStore");
const crypto = require("crypto");

const router = new Router({ prefix: "/api/auth" });

const hashPassword = (value) =>
  crypto.createHash("sha256").update(String(value)).digest("hex");

const qrSessions = new Map();

router.post("/wechat-login", async (ctx) => {
  try {
    const { code, userInfo } = ctx.request.body;

    if (!code) {
      ctx.body = Response.error("缺少code参数", HttpStatus.BAD_REQUEST);
      return;
    }

    const appid = process.env.WECHAT_APPID;
    const secret = process.env.WECHAT_SECRET;

    if (!appid || !secret) {
      ctx.body = Response.error(
        "微信小程序配置缺失",
        HttpStatus.INTERNAL_ERROR,
      );
      return;
    }

    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.errcode) {
      console.error("微信登录失败:", data);
      ctx.body = Response.error(
        data.errmsg || "微信登录失败",
        HttpStatus.BAD_REQUEST,
      );
      return;
    }

    const { openid, session_key, unionid } = data;

    let user = await User.findOne({ wechatOpenId: openid });

    if (!user) {
      user = new User({
        wechatOpenId: openid,
        wechatUnionId: unionid,
        wechatSessionKey: session_key,
        wechatNickname: userInfo?.nickName,
        wechatAvatar: userInfo?.avatarUrl,
        nickname: userInfo?.nickName,
        avatar: userInfo?.avatarUrl,
        role: "user",
        status: "active",
        lastLoginAt: new Date(),
      });
      await user.save();
    } else {
      user.wechatSessionKey = session_key;
      if (unionid) user.wechatUnionId = unionid;
      if (userInfo) {
        user.wechatNickname = userInfo.nickName;
        user.wechatAvatar = userInfo.avatarUrl;
        if (!user.nickname) user.nickname = userInfo.nickName;
        if (!user.avatar) user.avatar = userInfo.avatarUrl;
      }
      user.lastLoginAt = new Date();
      await user.save();
    }

    const userInfoData = {
      _id: user._id,
      wechatOpenId: openid,
      nickname: user.nickname,
      avatar: user.avatar,
      role: user.role,
    };
    const token = issueToken(userInfoData);

    ctx.body = Response.success(
      {
        token,
        user: {
          _id: user._id,
          nickname: user.nickname,
          avatar: user.avatar,
          role: user.role,
        },
      },
      "登录成功",
    );
  } catch (error) {
    console.error("微信登录错误:", error);
    ctx.body = Response.error(error.message, HttpStatus.INTERNAL_ERROR);
  }
});

router.post("/bind-account", async (ctx) => {
  try {
    const { username, password, code } = ctx.request.body;

    if (!username || !password || !code) {
      ctx.body = Response.error("参数不完整", HttpStatus.BAD_REQUEST);
      return;
    }

    const appid = process.env.WECHAT_APPID;
    const secret = process.env.WECHAT_SECRET;

    if (!appid || !secret) {
      ctx.body = Response.error(
        "微信小程序配置缺失",
        HttpStatus.INTERNAL_ERROR,
      );
      return;
    }

    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.errcode) {
      ctx.body = Response.error(
        data.errmsg || "微信授权失败",
        HttpStatus.BAD_REQUEST,
      );
      return;
    }

    const { openid, session_key, unionid } = data;

    const existingBind = await User.findOne({ wechatOpenId: openid });
    if (existingBind) {
      ctx.body = Response.error("该微信已绑定其他账号", HttpStatus.BAD_REQUEST);
      return;
    }

    const user = await User.findOne({ username });
    if (!user) {
      ctx.body = Response.error("用户名不存在", HttpStatus.BAD_REQUEST);
      return;
    }

    if (user.wechatOpenId) {
      ctx.body = Response.error("该账号已绑定其他微信", HttpStatus.BAD_REQUEST);
      return;
    }

    if (user.passwordHash !== hashPassword(password)) {
      ctx.body = Response.error("密码错误", HttpStatus.BAD_REQUEST);
      return;
    }

    user.wechatOpenId = openid;
    user.wechatUnionId = unionid;
    user.wechatSessionKey = session_key;
    user.lastLoginAt = new Date();
    await user.save();

    const userInfoData = {
      _id: user._id,
      wechatOpenId: openid,
      nickname: user.nickname,
      avatar: user.avatar,
      role: user.role,
    };
    const token = issueToken(userInfoData);

    ctx.body = Response.success(
      {
        token,
        user: {
          _id: user._id,
          nickname: user.nickname,
          avatar: user.avatar,
          role: user.role,
        },
      },
      "绑定成功",
    );
  } catch (error) {
    console.error("绑定账号错误:", error);
    ctx.body = Response.error(error.message, HttpStatus.INTERNAL_ERROR);
  }
});

router.get("/me", async (ctx) => {
  try {
    const authHeader = ctx.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ctx.body = Response.error("未登录", HttpStatus.UNAUTHORIZED);
      return;
    }

    const token = authHeader.slice(7);
    const tokenUser = verifyToken(token);

    if (!tokenUser) {
      ctx.body = Response.error(
        "登录已过期，请重新登录",
        HttpStatus.UNAUTHORIZED,
      );
      return;
    }

    const user = await User.findById(tokenUser._id).select(
      "-passwordHash -wechatSessionKey",
    );
    if (!user) {
      ctx.body = Response.error("用户不存在", HttpStatus.NOT_FOUND);
      return;
    }

    ctx.body = Response.success(user);
  } catch (error) {
    ctx.body = Response.error(error.message, HttpStatus.INTERNAL_ERROR);
  }
});

router.post("/update-userinfo", async (ctx) => {
  try {
    const authHeader = ctx.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ctx.body = Response.error("未登录", HttpStatus.UNAUTHORIZED);
      return;
    }

    const token = authHeader.slice(7);
    const tokenUser = verifyToken(token);

    if (!tokenUser) {
      ctx.body = Response.error(
        "登录已过期，请重新登录",
        HttpStatus.UNAUTHORIZED,
      );
      return;
    }

    const { userInfo } = ctx.request.body;
    if (!userInfo) {
      ctx.body = Response.error("缺少用户信息", HttpStatus.BAD_REQUEST);
      return;
    }

    const user = await User.findById(tokenUser._id);
    if (!user) {
      ctx.body = Response.error("用户不存在", HttpStatus.NOT_FOUND);
      return;
    }

    user.wechatNickname = userInfo.nickName;
    user.wechatAvatar = userInfo.avatarUrl;
    if (!user.nickname) user.nickname = userInfo.nickName;
    if (!user.avatar) user.avatar = userInfo.avatarUrl;

    await user.save();

    ctx.body = Response.success(
      {
        _id: user._id,
        nickname: user.nickname,
        avatar: user.avatar,
        role: user.role,
      },
      "更新成功",
    );
  } catch (error) {
    ctx.body = Response.error(error.message, HttpStatus.INTERNAL_ERROR);
  }
});

router.post("/scan-qr", async (ctx) => {
  try {
    const { qrToken } = ctx.request.body;
    const authHeader = ctx.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ctx.body = Response.error("未登录", HttpStatus.UNAUTHORIZED);
      return;
    }

    if (!qrToken) {
      ctx.body = Response.error("缺少二维码Token", HttpStatus.BAD_REQUEST);
      return;
    }

    const token = authHeader.slice(7);
    const tokenUser = verifyToken(token);

    if (!tokenUser) {
      ctx.body = Response.error("登录已过期", HttpStatus.UNAUTHORIZED);
      return;
    }

    const session = qrSessions.get(qrToken);
    if (!session) {
      ctx.body = Response.error("二维码已过期", HttpStatus.BAD_REQUEST);
      return;
    }

    if (session.status !== "pending") {
      ctx.body = Response.error("二维码已被使用", HttpStatus.BAD_REQUEST);
      return;
    }

    const user = await User.findById(tokenUser._id);

    if (!user) {
      ctx.body = Response.error("用户不存在", HttpStatus.NOT_FOUND);
      return;
    }

    session.status = "scanned";
    session.userId = user._id;
    session.userInfo = {
      _id: user._id,
      nickname: user.nickname,
      avatar: user.avatar,
      role: user.role,
    };

    ctx.body = Response.success({ status: "scanned" }, "扫码成功");
  } catch (error) {
    ctx.body = Response.error(error.message, HttpStatus.INTERNAL_ERROR);
  }
});

router.post("/confirm-qr", async (ctx) => {
  try {
    const { qrToken } = ctx.request.body;
    const authHeader = ctx.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ctx.body = Response.error("未登录", HttpStatus.UNAUTHORIZED);
      return;
    }

    if (!qrToken) {
      ctx.body = Response.error("缺少二维码Token", HttpStatus.BAD_REQUEST);
      return;
    }

    const token = authHeader.slice(7);
    const tokenUser = verifyToken(token);

    if (!tokenUser) {
      ctx.body = Response.error("登录已过期", HttpStatus.UNAUTHORIZED);
      return;
    }

    const session = qrSessions.get(qrToken);
    if (!session || session.status !== "scanned") {
      ctx.body = Response.error("无效的授权请求", HttpStatus.BAD_REQUEST);
      return;
    }

    if (tokenUser._id.toString() !== session.userId.toString()) {
      ctx.body = Response.error("用户不匹配", HttpStatus.FORBIDDEN);
      return;
    }

    session.status = "confirmed";
    session.confirmedAt = new Date();

    const pcToken = issueToken(session.userInfo);
    session.pcToken = pcToken;

    ctx.body = Response.success({ status: "confirmed" }, "授权成功");
  } catch (error) {
    ctx.body = Response.error(error.message, HttpStatus.INTERNAL_ERROR);
  }
});

router.post("/create-qr-session", async (ctx) => {
  try {
    const qrToken = crypto.randomUUID();
    qrSessions.set(qrToken, {
      status: "pending",
      createdAt: new Date(),
    });

    setTimeout(
      () => {
        qrSessions.delete(qrToken);
      },
      5 * 60 * 1000,
    );

    ctx.body = Response.success({ qrToken }, "创建成功");
  } catch (error) {
    ctx.body = Response.error(error.message, HttpStatus.INTERNAL_ERROR);
  }
});

router.get("/check-qr-status/:qrToken", async (ctx) => {
  try {
    const { qrToken } = ctx.params;
    const session = qrSessions.get(qrToken);

    if (!session) {
      ctx.body = Response.error("二维码已过期", HttpStatus.NOT_FOUND);
      return;
    }

    const result = {
      status: session.status,
    };

    if (session.status === "scanned" && session.userInfo) {
      result.userInfo = session.userInfo;
    }

    if (session.status === "confirmed" && session.pcToken) {
      result.token = session.pcToken;
      result.user = session.userInfo;
      qrSessions.delete(qrToken);
    }

    ctx.body = Response.success(result);
  } catch (error) {
    ctx.body = Response.error(error.message, HttpStatus.INTERNAL_ERROR);
  }
});

module.exports = router;
