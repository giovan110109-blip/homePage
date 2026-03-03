const crypto = require('crypto');
const BaseController = require('../utils/baseController');
const { HttpStatus } = require('../utils/response');
const User = require('../models/user');
const QrSession = require('../models/qrSession');
const { issueToken, verifyToken } = require('../utils/adminTokenStore');
const { verifyPassword } = require('../utils/password');

const QR_SESSION_TTL = 5 * 60 * 1000;

const getWechatConfig = () => ({
  appid: process.env.WECHAT_APPID,
  secret: process.env.WECHAT_SECRET,
});

const fetchWechatSession = async (code) => {
  const { appid, secret } = getWechatConfig();
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;
  const response = await fetch(url);
  return response.json();
};

class WechatAuthController extends BaseController {
  async wechatLogin(ctx) {
    try {
      const { code, userInfo } = ctx.request.body || {};

      if (!code) {
        this.throwHttpError('缺少code参数', HttpStatus.BAD_REQUEST);
      }

      const { appid, secret } = getWechatConfig();
      if (!appid || !secret) {
        this.throwHttpError('微信小程序配置缺失', HttpStatus.INTERNAL_ERROR);
      }

      const data = await fetchWechatSession(code);

      if (data.errcode) {
        console.error('微信登录失败:', data);
        this.throwHttpError(data.errmsg || '微信登录失败', HttpStatus.BAD_REQUEST);
      }

      const { openid, session_key, unionid } = data;

      let user = await User.findOne({ wechatOpenId: openid }).populate('roleIds', 'name code');

      if (!user) {
        this.throwHttpError('未绑定账号，请绑定账号登录', HttpStatus.BAD_REQUEST);
      }

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

      const userInfoData = {
        _id: user._id,
        wechatOpenId: openid,
        nickname: user.nickname,
        avatar: user.avatar,
        roles: (user.roleIds || []).map(r => ({
          _id: r._id,
          name: r.name,
          code: r.code
        }))
      };
      const token = issueToken(userInfoData);

      this.ok(ctx, {
        token,
        user: {
          _id: user._id,
          nickname: user.nickname,
          avatar: user.avatar,
          roles: (user.roleIds || []).map(r => ({
            _id: r._id,
            name: r.name,
            code: r.code
          }))
        },
      }, '登录成功');
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  async bindAccount(ctx) {
    try {
      const { username, password, code } = ctx.request.body || {};

      if (!username || !password || !code) {
        this.throwHttpError('参数不完整', HttpStatus.BAD_REQUEST);
      }

      const { appid, secret } = getWechatConfig();
      if (!appid || !secret) {
        this.throwHttpError('微信小程序配置缺失', HttpStatus.INTERNAL_ERROR);
      }

      const data = await fetchWechatSession(code);

      if (data.errcode) {
        this.throwHttpError(data.errmsg || '微信授权失败', HttpStatus.BAD_REQUEST);
      }

      const { openid, session_key, unionid } = data;

      const existingBind = await User.findOne({ wechatOpenId: openid });
      if (existingBind) {
        this.throwHttpError('该微信已绑定其他账号', HttpStatus.BAD_REQUEST);
      }

      const user = await User.findOne({ username }).populate('roleIds', 'name code');
      if (!user) {
        this.throwHttpError('用户名不存在', HttpStatus.BAD_REQUEST);
      }

      if (user.wechatOpenId) {
        this.throwHttpError('该账号已绑定其他微信', HttpStatus.BAD_REQUEST);
      }

      const passOK = await verifyPassword(password, user.passwordHash);
      if (!passOK) {
        this.throwHttpError('密码错误', HttpStatus.BAD_REQUEST);
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
        roles: (user.roleIds || []).map(r => ({
          _id: r._id,
          name: r.name,
          code: r.code
        }))
      };
      const token = issueToken(userInfoData);

      this.ok(ctx, {
        token,
        user: {
          _id: user._id,
          nickname: user.nickname,
          avatar: user.avatar,
          roles: (user.roleIds || []).map(r => ({
            _id: r._id,
            name: r.name,
            code: r.code
          }))
        },
      }, '绑定成功');
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  async getCurrentUser(ctx) {
    try {
      const authHeader = ctx.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        this.throwHttpError('未登录', HttpStatus.UNAUTHORIZED);
      }

      const token = authHeader.slice(7);
      const tokenUser = verifyToken(token);

      if (!tokenUser) {
        this.throwHttpError('登录已过期，请重新登录', HttpStatus.UNAUTHORIZED);
      }

      console.log('getCurrentUser - tokenUser:', JSON.stringify(tokenUser));
      
      const user = await User.findById(tokenUser._id).select('-passwordHash -wechatSessionKey');
      console.log('getCurrentUser - user found:', user ? user._id : 'null');
      
      if (!user) {
        this.throwHttpError('用户不存在', HttpStatus.NOT_FOUND);
      }

      this.ok(ctx, user);
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  async updateUserInfo(ctx) {
    try {
      const authHeader = ctx.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        this.throwHttpError('未登录', HttpStatus.UNAUTHORIZED);
      }

      const token = authHeader.slice(7);
      const tokenUser = verifyToken(token);

      if (!tokenUser) {
        this.throwHttpError('登录已过期，请重新登录', HttpStatus.UNAUTHORIZED);
      }

      const { userInfo } = ctx.request.body || {};
      if (!userInfo) {
        this.throwHttpError('缺少用户信息', HttpStatus.BAD_REQUEST);
      }

      const user = await User.findById(tokenUser._id);
      if (!user) {
        this.throwHttpError('用户不存在', HttpStatus.NOT_FOUND);
      }

      user.wechatNickname = userInfo.nickName;
      user.wechatAvatar = userInfo.avatarUrl;
      if (!user.nickname) user.nickname = userInfo.nickName;
      if (!user.avatar) user.avatar = userInfo.avatarUrl;

      await user.save();

      this.ok(ctx, {
        _id: user._id,
        nickname: user.nickname,
        avatar: user.avatar,
        role: user.role,
      }, '更新成功');
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  async scanQr(ctx) {
    try {
      const { qrToken } = ctx.request.body || {};
      const authHeader = ctx.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        this.throwHttpError('未登录', HttpStatus.UNAUTHORIZED);
      }

      if (!qrToken) {
        this.throwHttpError('缺少二维码Token', HttpStatus.BAD_REQUEST);
      }

      const token = authHeader.slice(7);
      const tokenUser = verifyToken(token);

      if (!tokenUser) {
        this.throwHttpError('登录已过期', HttpStatus.UNAUTHORIZED);
      }

      const session = await QrSession.findOne({ qrToken });
      if (!session) {
        this.throwHttpError('二维码已过期', HttpStatus.BAD_REQUEST);
      }

      if (session.status !== 'pending') {
        this.throwHttpError('二维码已被使用', HttpStatus.BAD_REQUEST);
      }

      const user = await User.findById(tokenUser._id);
      if (!user) {
        this.throwHttpError('用户不存在', HttpStatus.NOT_FOUND);
      }

      session.status = 'scanned';
      session.userId = user._id;
      session.userInfo = {
        _id: user._id.toString(),
        nickname: user.nickname,
        avatar: user.avatar,
        role: user.role,
      };
      await session.save();

      this.ok(ctx, { status: 'scanned' }, '扫码成功');
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  async confirmQr(ctx) {
    try {
      const { qrToken } = ctx.request.body || {};
      const authHeader = ctx.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        this.throwHttpError('未登录', HttpStatus.UNAUTHORIZED);
      }

      if (!qrToken) {
        this.throwHttpError('缺少二维码Token', HttpStatus.BAD_REQUEST);
      }

      const token = authHeader.slice(7);
      const tokenUser = verifyToken(token);

      if (!tokenUser) {
        this.throwHttpError('登录已过期', HttpStatus.UNAUTHORIZED);
      }

      const session = await QrSession.findOne({ qrToken });
      if (!session || session.status !== 'scanned') {
        this.throwHttpError('无效的授权请求', HttpStatus.BAD_REQUEST);
      }

      if (tokenUser._id.toString() !== session.userId.toString()) {
        this.throwHttpError('用户不匹配', HttpStatus.FORBIDDEN);
      }

      session.status = 'confirmed';
      session.confirmedAt = new Date();

      const pcToken = issueToken(session.userInfo);
      session.pcToken = pcToken;
      await session.save();

      this.ok(ctx, { status: 'confirmed' }, '授权成功');
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  async createQrSession(ctx) {
    try {
      const qrToken = crypto.randomBytes(16).toString('hex');
      
      await QrSession.create({
        qrToken,
        status: 'pending',
        expiresAt: new Date(Date.now() + QR_SESSION_TTL),
      });

      this.ok(ctx, { qrToken }, '创建成功');
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  async checkQrStatus(ctx) {
    try {
      const { qrToken } = ctx.params;
      const session = await QrSession.findOne({ qrToken });

      if (!session) {
        this.throwHttpError('二维码已过期', HttpStatus.NOT_FOUND);
      }

      const result = {
        status: session.status,
      };

      if (session.status === 'scanned' && session.userInfo) {
        result.userInfo = session.userInfo;
      }

      if (session.status === 'confirmed' && session.pcToken) {
        result.token = session.pcToken;
        result.user = session.userInfo;
        await QrSession.deleteOne({ qrToken });
      }

      this.ok(ctx, result);
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  async generateQrCode(ctx) {
    try {
      const { qrToken } = ctx.query;

      if (!qrToken) {
        this.throwHttpError('缺少qrToken', HttpStatus.BAD_REQUEST);
      }

      const { appid, secret } = getWechatConfig();
      if (!appid || !secret) {
        console.error('微信小程序配置缺失: WECHAT_APPID 或 WECHAT_SECRET 未设置');
        this.throwHttpError('微信小程序配置缺失', HttpStatus.INTERNAL_ERROR);
      }

      const tokenRes = await fetch(
        `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`
      );
      const tokenData = await tokenRes.json();

      if (tokenData.errcode) {
        console.error('获取access_token失败:', tokenData);
        this.throwHttpError(`获取access_token失败: ${tokenData.errmsg}`, HttpStatus.INTERNAL_ERROR);
      }

      const accessToken = tokenData.access_token;

      const qrRes = await fetch(
        `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${accessToken}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scene: qrToken,
            width: 280,
            auto_color: false,
            line_color: { r: 99, g: 102, b: 241 },
          }),
        }
      );

      const contentType = qrRes.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        const errorData = await qrRes.json();
        console.error('生成小程序码失败:', errorData);
        this.throwHttpError(errorData.errmsg || '生成小程序码失败', HttpStatus.INTERNAL_ERROR);
      }

      const buffer = Buffer.from(await qrRes.arrayBuffer());
      ctx.set('Content-Type', 'image/png');
      ctx.set('Cache-Control', 'no-cache');
      ctx.body = buffer;
    } catch (err) {
      this.fail(ctx, err);
    }
  }
}

module.exports = new WechatAuthController();
