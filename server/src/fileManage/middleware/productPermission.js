const { verifyToken } = require('../../utils/adminTokenStore');
const productAccessService = require('../../services/productAccessService');
const User = require('../../models/user');

const PRODUCT_CODE = 'giovan-file';
const SUPER_ADMIN_CODE = 'admin-plus';

const getToken = (ctx) => {
  let token = ctx.get('authorization')?.replace('Bearer ', '') || ctx.get('x-admin-token');
  if (!token) {
    token = ctx.query.token;
  }
  return token;
};

const hasSuperAdminRole = (user) =>
  Array.isArray(user?.roles) &&
  user.roles.some((role) => role?.code === SUPER_ADMIN_CODE);

const ensureAuthenticatedUser = async (ctx) => {
  const token = getToken(ctx);
  if (!token) {
    ctx.status = 401;
    ctx.body = { success: false, message: '未登录' };
    return null;
  }

  const user = await verifyToken(token);
  if (!user) {
    ctx.status = 401;
    ctx.body = { success: false, message: '登录已过期' };
    return null;
  }

  const hydratedUser = await User.findById(user._id)
    .select('_id username nickname realName avatar email phone roleIds status')
    .populate('roleIds', 'name code')
    .lean();

  if (!hydratedUser || hydratedUser.status !== 'active') {
    ctx.status = 403;
    ctx.body = { success: false, message: '账号已被禁用' };
    return null;
  }

  const normalizedUser = {
    _id: hydratedUser._id,
    username: hydratedUser.username,
    nickname: hydratedUser.nickname,
    realName: hydratedUser.realName,
    avatar: hydratedUser.avatar,
    email: hydratedUser.email,
    phone: hydratedUser.phone,
    role: hydratedUser.roleIds?.[0]?.code || hydratedUser.roleIds?.[0]?.name || 'user',
    roleIds: (hydratedUser.roleIds || []).map((role) => role._id),
    roles: (hydratedUser.roleIds || []).map((role) => ({
      _id: role._id,
      name: role.name,
      code: role.code,
    })),
  };

  ctx.state.user = normalizedUser;
  return normalizedUser;
};

const buildGrantedAccess = (user) => ({
  productCode: PRODUCT_CODE,
  enabled: true,
  accessEnabled: true,
  expired: false,
  effectivePermissionCodes: [
    'file.access',
    'file.list',
    'file.preview',
    'file.download',
    'file.upload',
    'file.rename',
    'file.move',
    'file.copy',
    'file.favorite',
    'file.delete',
    'file.share',
    'trash.view',
    'trash.restore',
    'trash.delete',
    'logs.read',
    'storage.read',
  ],
  effectivePermissions: [],
  roleCodes: [],
  resolvedRoles: user?.roles || [],
});

const loadProductAccess = async (ctx, user) => {
  if (hasSuperAdminRole(user)) {
    const access = buildGrantedAccess(user);
    ctx.state.productAccess = access;
    return access;
  }

  const access = await productAccessService.getUserProductAccess(user._id, PRODUCT_CODE);
  ctx.state.productAccess = access;
  return access;
};

const requireGiovanFileAccess = () => async (ctx, next) => {
  const user = await ensureAuthenticatedUser(ctx);
  if (!user) {
    return;
  }

  const access = await loadProductAccess(ctx, user);

  if (!access?.accessEnabled) {
    ctx.status = 403;
    ctx.body = {
      success: false,
      message: access?.expired ? '当前产品授权已过期' : '当前账号未开通文件管理权限',
      code: 403,
      details: {
        productCode: PRODUCT_CODE,
        expired: Boolean(access?.expired),
      },
    };
    return;
  }

  await next();
};

module.exports = {
  requireGiovanFileAccess,
};
