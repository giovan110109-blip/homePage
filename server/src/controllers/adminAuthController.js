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

      // 确保默认管理员用户存在（首次启动自动创建）
      let defaultAdmin = await User.findOne({ username: adminUser, role: 'admin' });
      if (!defaultAdmin) {
        defaultAdmin = await User.create({
          username: adminUser,
          passwordHash: hashPassword(adminPass),
          role: 'admin',
          status: 'active',
          nickname: '管理员',
        });
      }

      // 从数据库查询用户（支持任何 role=admin 的用户）
      let user = await User.findOne({ username, role: 'admin' });
      
      if (!user) {
        this.throwHttpError('账号或密码错误', HttpStatus.UNAUTHORIZED);
      }

      if (user.status !== 'active') {
        this.throwHttpError('账号已禁用', HttpStatus.FORBIDDEN);
      }

      const passOk = hashPassword(password) === user.passwordHash;
      if (!passOk) {
        this.throwHttpError('账号或密码错误', HttpStatus.UNAUTHORIZED);
      }

      user.lastLoginAt = new Date();
      await user.save();

      const userInfo = { 
        _id: user._id,
        username: user.username, 
        nickname: user.nickname,
        avatar: user.avatar,
        role: user.role 
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