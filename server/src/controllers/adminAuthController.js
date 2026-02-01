const BaseController = require('../utils/baseController');
const { HttpStatus } = require('../utils/response');
const { issueToken } = require('../utils/adminTokenStore');
const User = require('../models/user');
const crypto = require('crypto');

const hashPassword = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

class AdminAuthController extends BaseController {
  // POST /api/admin/login
  async login(ctx) {
    try {
      const { username, password } = ctx.request.body || {};
      const adminUser = process.env.ADMIN_USER || 'admin';
      const adminPass = process.env.ADMIN_PASSWORD || 'admin';

      if (!username || !password) {
        this.throwHttpError('请输入账号和密码', HttpStatus.BAD_REQUEST);
      }

      if (username !== adminUser) {
        this.throwHttpError('账号或密码错误', HttpStatus.UNAUTHORIZED);
      }

      // 确保管理员用户存在（首次启动自动创建）
      let admin = await User.findOne({ username: adminUser, role: 'admin' });
      if (!admin) {
        admin = await User.create({
          username: adminUser,
          passwordHash: hashPassword(adminPass),
          role: 'admin',
          status: 'active',
          nickname: '管理员',
        });
      }

      if (admin.status !== 'active') {
        this.throwHttpError('账号已禁用', HttpStatus.FORBIDDEN);
      }

      const passOk = hashPassword(password) === admin.passwordHash;
      if (!passOk) {
        this.throwHttpError('账号或密码错误', HttpStatus.UNAUTHORIZED);
      }

      admin.lastLoginAt = new Date();
      await admin.save();

      const userInfo = { 
        _id: admin._id,
        username: admin.username, 
        nickname: admin.nickname,
        avatar: admin.avatar,
        role: admin.role 
      };
      const token = issueToken(userInfo);
      this.ok(ctx, { token, user: userInfo }, '登录成功');
    } catch (err) {
      this.fail(ctx, err, HttpStatus.UNAUTHORIZED);
    }
  }

  // GET /api/admin/verify - 验证 token 是否有效
  async verify(ctx) {
    try {
      // token 已通过中间件验证，ctx.state.user 存在表示 token 有效
      const user = ctx.state.user;
      this.ok(ctx, {
        valid: true,
        user: user
      }, 'Token is valid');
    } catch (err) {
      this.fail(ctx, err);
    }
  }
}

module.exports = new AdminAuthController();