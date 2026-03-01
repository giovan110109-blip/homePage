const { Response, HttpStatus } = require('../utils/response');
const { verifyToken } = require('../utils/adminTokenStore');
const User = require('../models/user');

const getToken = (ctx) => {
  const auth = ctx.get('authorization');
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
  return ctx.get('x-admin-token');
};

module.exports = async (ctx, next) => {
  if (!ctx.path.startsWith('/api/admin')) {
    await next();
    return;
  }

  if (ctx.path === '/api/admin/login') {
    await next();
    return;
  }

  const token = getToken(ctx);
  const user = await verifyToken(token);
  if (!user) {
    ctx.status = HttpStatus.UNAUTHORIZED;
    ctx.body = Response.error('未登录或登录已过期', HttpStatus.UNAUTHORIZED);
    return;
  }

  const dbUser = await User.findById(user._id).select('status');
  if (!dbUser || dbUser.status !== 'active') {
    ctx.status = HttpStatus.FORBIDDEN;
    ctx.body = Response.error('账号已被禁用', HttpStatus.FORBIDDEN);
    return;
  }

  ctx.state.user = user;
  await next();
};