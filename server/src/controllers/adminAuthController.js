const BaseController = require('../utils/baseController');
const { HttpStatus } = require('../utils/response');
const { issueToken, verifyToken, refreshToken, shouldRefreshToken } = require('../utils/adminTokenStore');
const { verifyPassword, hashPassword } = require('../utils/password');
const User = require('../models/user');
const Role = require('../models/role');
const Menu = require('../models/menu');
const LoginAttempt = require('../models/loginAttempt');

const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000;

class AdminAuthController extends BaseController {
  async login(ctx) {
    try {
      const { username, password } = ctx.request.body || {};
      const ip = ctx.ip || ctx.request.ip || 'unknown';

      if (!username || !password) {
        this.throwHttpError('请输入账号和密码', HttpStatus.BAD_REQUEST);
      }

      const attemptCheck = await LoginAttempt.checkAttempts(ip, username);
      if (attemptCheck.locked) {
        this.throwHttpError(
          `登录失败次数过多，请 ${attemptCheck.remainingMinutes} 分钟后重试`,
          HttpStatus.TOO_MANY_REQUESTS
        );
      }

      const user = await User.findOne({ username });
      
      if (!user) {
        await LoginAttempt.recordFailure(ip, username, MAX_ATTEMPTS, LOCKOUT_TIME);
        this.throwHttpError('账号或密码错误', HttpStatus.UNAUTHORIZED);
      }

      if (user.status !== 'active') {
        this.throwHttpError('账号已禁用', HttpStatus.FORBIDDEN);
      }

      const passOk = await verifyPassword(password, user.passwordHash);
      if (!passOk) {
        const result = await LoginAttempt.recordFailure(ip, username, MAX_ATTEMPTS, LOCKOUT_TIME);
        if (result.locked) {
          this.throwHttpError('登录失败次数过多，请 15 分钟后重试', HttpStatus.TOO_MANY_REQUESTS);
        }
        const remaining = MAX_ATTEMPTS - result.attempts;
        if (remaining > 0 && remaining <= 3) {
          this.throwHttpError(`账号或密码错误，还剩 ${remaining} 次尝试机会`, HttpStatus.UNAUTHORIZED);
        } else {
          this.throwHttpError('账号或密码错误', HttpStatus.UNAUTHORIZED);
        }
      }

      await LoginAttempt.clearAttempts(ip, username);

      user.lastLoginAt = new Date();
      await user.save();

      const userInfo = { 
        _id: user._id,
        username: user.username, 
        nickname: user.nickname,
        avatar: user.avatar,
        roleIds: user.roleIds
      };
      const token = await issueToken(userInfo);
      const tokenData = await verifyToken(token);
      this.ok(ctx, {
        token,
        user: userInfo,
        expiresAt: tokenData?.expiresAt,
      }, '登录成功');
    } catch (err) {
      this.fail(ctx, err, err.statusCode || HttpStatus.UNAUTHORIZED);
    }
  }

  async verify(ctx) {
    try {
      const user = ctx.state.user;
      this.ok(ctx, {
        valid: true,
        user: user
      }, 'Token is valid');
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  async refresh(ctx) {
    try {
      const authHeader = ctx.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        this.throwHttpError('未登录', HttpStatus.UNAUTHORIZED);
      }

      const oldToken = authHeader.slice(7);
      const tokenData = await verifyToken(oldToken);

      if (!tokenData) {
        this.throwHttpError('Token 无效或已过期', HttpStatus.UNAUTHORIZED);
      }

      const result = await refreshToken(oldToken);
      if (!result) {
        this.throwHttpError('Token 刷新失败', HttpStatus.UNAUTHORIZED);
      }

      this.ok(ctx, {
        token: result.token,
        expiresAt: result.expiresAt,
        user: result.user
      }, 'Token 刷新成功');
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  async getUserMenus(ctx) {
    try {
      const userId = ctx.state.user._id;
      
      const user = await User.findById(userId).populate('roleIds');
      if (!user) {
        this.throwHttpError('用户不存在', HttpStatus.NOT_FOUND);
      }

      if (!user.roleIds || user.roleIds.length === 0) {
        const tree = this.buildMenuTree([]);
        return this.ok(ctx, tree, '获取菜单成功');
      }

      const roles = await Role.find({ 
        _id: { $in: user.roleIds },
        status: 'active'
      }).populate('menuIds');

      if (roles.length === 0) {
        const tree = this.buildMenuTree([]);
        return this.ok(ctx, tree, '获取菜单成功');
      }

      const menuIdSet = new Set();
      roles.forEach(role => {
        if (role.menuIds) {
          role.menuIds.forEach(menu => {
            menuIdSet.add(String(menu._id));
          });
        }
      });

      const menuIds = Array.from(menuIdSet);
      
      let menus = [];
      if (menuIds.length > 0) {
        menus = await Menu.find({ 
          _id: { $in: menuIds },
          status: 'active'
        }).sort({ sort: 1 }).lean();
      }

      const tree = this.buildMenuTree(menus);
      
      this.ok(ctx, tree, '获取菜单成功');
    } catch (err) {
      this.fail(ctx, err);
    }
  }

  buildMenuTree(menus, parentId = null) {
    const dashboardMenu = {
      _id: 'dashboard',
      name: '仪表板',
      path: '/admin',
      icon: 'LayoutDashboard',
      parentId: null,
      sort: 0,
      status: 'active',
      children: []
    };

    const filteredMenus = menus
      .filter(menu => String(menu.parentId) === String(parentId))
      .sort((a, b) => a.sort - b.sort)
      .map(menu => ({
        ...menu,
        children: this.buildMenuTree(menus, menu._id)
      }));

    if (parentId === null) {
      return [dashboardMenu, ...filteredMenus];
    }
    return filteredMenus;
  }
}

module.exports = new AdminAuthController();
