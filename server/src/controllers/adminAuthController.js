const BaseController = require('../utils/baseController');
const { HttpStatus } = require('../utils/response');
const { issueToken } = require('../utils/adminTokenStore');
const { verifyPassword, hashPassword } = require('../utils/password');
const User = require('../models/user');

const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000;

const getAttemptsKey = (ip, username) => `${ip}:${username}`;

const checkLoginAttempts = (ip, username) => {
  const key = getAttemptsKey(ip, username);
  const attempts = loginAttempts.get(key);
  
  if (attempts && Date.now() < attempts.lockUntil) {
    const remainingMinutes = Math.ceil((attempts.lockUntil - Date.now()) / 60000);
    return { locked: true, remainingMinutes };
  }
  
  return { locked: false };
};

const recordFailedAttempt = (ip, username) => {
  const key = getAttemptsKey(ip, username);
  const attempts = loginAttempts.get(key) || { count: 0, lockUntil: 0 };
  
  attempts.count++;
  
  if (attempts.count >= MAX_ATTEMPTS) {
    attempts.lockUntil = Date.now() + LOCKOUT_TIME;
    attempts.count = 0;
  }
  
  loginAttempts.set(key, attempts);
  return attempts;
};

const clearLoginAttempts = (ip, username) => {
  const key = getAttemptsKey(ip, username);
  loginAttempts.delete(key);
};

const loginAttemptsCleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, attempts] of loginAttempts.entries()) {
    if (attempts.lockUntil && now > attempts.lockUntil) {
      loginAttempts.delete(key);
    }
  }
}, 60 * 1000);

const gracefulShutdown = () => {
  clearInterval(loginAttemptsCleanupTimer);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

class AdminAuthController extends BaseController {
  async login(ctx) {
    try {
      const { username, password } = ctx.request.body || {};
      const ip = ctx.ip || ctx.request.ip || 'unknown';

      if (!username || !password) {
        this.throwHttpError('请输入账号和密码', HttpStatus.BAD_REQUEST);
      }

      const attemptCheck = checkLoginAttempts(ip, username);
      if (attemptCheck.locked) {
        this.throwHttpError(
          `登录失败次数过多，请 ${attemptCheck.remainingMinutes} 分钟后重试`,
          HttpStatus.TOO_MANY_REQUESTS
        );
      }

      const user = await User.findOne({ username, role: 'admin' });
      
      if (!user) {
        recordFailedAttempt(ip, username);
        this.throwHttpError('账号或密码错误', HttpStatus.UNAUTHORIZED);
      }

      if (user.status !== 'active') {
        this.throwHttpError('账号已禁用', HttpStatus.FORBIDDEN);
      }

      const passOk = await verifyPassword(password, user.passwordHash);
      if (!passOk) {
        const attempts = recordFailedAttempt(ip, username);
        const remaining = MAX_ATTEMPTS - attempts.count;
        if (remaining > 0 && remaining <= 3) {
          this.throwHttpError(`账号或密码错误，还剩 ${remaining} 次尝试机会`, HttpStatus.UNAUTHORIZED);
        } else {
          this.throwHttpError('账号或密码错误', HttpStatus.UNAUTHORIZED);
        }
      }

      clearLoginAttempts(ip, username);

      user.lastLoginAt = new Date();
      await user.save();

      const userInfo = { 
        _id: user._id,
        username: user.username, 
        nickname: user.nickname,
        avatar: user.avatar,
        role: user.role 
      };
      const token = await issueToken(userInfo);
      this.ok(ctx, { token, user: userInfo }, '登录成功');
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
}

module.exports = new AdminAuthController();
