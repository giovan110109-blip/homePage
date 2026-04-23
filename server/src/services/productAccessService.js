const Product = require('../models/product');
const ProductPermission = require('../models/productPermission');
const ProductRole = require('../models/productRole');
const User = require('../models/user');
const UserProductGrant = require('../models/userProductGrant');
const { NotFoundError, ValidationError } = require('../utils/errors');

const DEFAULT_PRODUCTS = [
  {
    name: '文件管理',
    code: 'giovan-file',
    description: '负责文件树、上传、分享、回收站和操作日志的业务产品。',
    accessMode: '来源识别 + 接口拦截',
    homePath: '/files',
    origins: ['https://file.giovan.cn', 'http://localhost:3000'],
    pathPrefixes: ['/api/files', '/api/share', '/api/logs'],
    sort: 10,
    status: 'active',
  },
  {
    name: '工具中心',
    code: 'tools-center',
    description: '承接内部工具、脚本能力与轻量工作台的统一权限入口。',
    accessMode: '来源识别 + 首次进入探测',
    homePath: '/tools',
    origins: ['https://tools.giovan.cn', 'http://localhost:3001'],
    pathPrefixes: ['/api/tools', '/api/toolbox'],
    sort: 20,
    status: 'active',
  },
];

const DEFAULT_PERMISSIONS = [
  {
    productCode: 'giovan-file',
    groupKey: 'access',
    groupLabel: '准入与浏览',
    groupDescription: '决定能否进入文件系统以及基础浏览能力。',
    sort: 10,
    permissions: [
      ['进入文件系统', 'file.access', '允许进入 giovan-file 主界面。'],
      ['查看列表', 'file.list', '查看文件树、列表与基础统计。'],
      ['预览文件', 'file.preview', '查看图片、视频和文档预览。'],
      ['下载文件', 'file.download', '允许下载文件与导出副本。'],
    ],
  },
  {
    productCode: 'giovan-file',
    groupKey: 'edit',
    groupLabel: '编辑操作',
    groupDescription: '用于描述上传、重命名和移动等编辑型动作。',
    sort: 20,
    permissions: [
      ['上传文件', 'file.upload', '允许上传与新建目录。'],
      ['重命名', 'file.rename', '允许修改文件或目录名称。'],
      ['移动文件', 'file.move', '允许移动文件和目录。'],
      ['复制文件', 'file.copy', '允许复制文件和目录。'],
      ['收藏文件', 'file.favorite', '允许收藏和取消收藏。'],
    ],
  },
  {
    productCode: 'giovan-file',
    groupKey: 'ops',
    groupLabel: '高风险操作',
    groupDescription: '需要由后端强校验的敏感动作集合。',
    sort: 30,
    permissions: [
      ['删除文件', 'file.delete', '允许放入回收站与批量删除。'],
      ['查看回收站', 'trash.view', '查看已删除资源。'],
      ['恢复文件', 'trash.restore', '允许从回收站恢复。'],
      ['彻底删除', 'trash.delete', '允许永久删除。'],
      ['创建分享', 'file.share', '允许生成分享链接与密码。'],
      ['查看日志', 'logs.read', '查看文件操作日志与行为统计。'],
      ['查看容量', 'storage.read', '查看用户或产品维度的容量统计。'],
    ],
  },
  {
    productCode: 'tools-center',
    groupKey: 'workspace',
    groupLabel: '工具空间',
    groupDescription: '控制进入工具中心及基础使用范围。',
    sort: 10,
    permissions: [
      ['进入工具中心', 'tools.access', '允许进入 tools-center。'],
      ['查看工具列表', 'tools.list', '查看工具清单与说明。'],
      ['执行工具', 'tools.run', '允许运行已有工具。'],
    ],
  },
  {
    productCode: 'tools-center',
    groupKey: 'manage',
    groupLabel: '工具维护',
    groupDescription: '用于维护工具配置与执行范围。',
    sort: 20,
    permissions: [
      ['编辑工具配置', 'tools.write', '允许调整工具配置。'],
      ['发布工具', 'tools.publish', '允许发布或下线工具。'],
      ['查看执行记录', 'tools.logs.read', '查看执行日志与运行情况。'],
    ],
  },
];

const DEFAULT_ROLES = [
  {
    productCode: 'giovan-file',
    name: '文件只读员',
    code: 'giovan-file-viewer',
    description: '可查看、预览、下载，不可编辑和删除。',
    summary: '负责查看、预览和下载，适用于纯消费型账号。',
    suggestedFor: '内容审核、外包协作、客户只读账号',
    permissionCodes: [
      'file.access',
      'file.list',
      'file.preview',
      'file.download',
      'file.favorite',
      'trash.view',
      'storage.read',
    ],
    sort: 10,
    status: 'active',
    isBuiltIn: true,
  },
  {
    productCode: 'giovan-file',
    name: '文件编辑员',
    code: 'giovan-file-editor',
    description: '在只读基础上增加上传、重命名、移动和复制。',
    summary: '在只读基础上增加上传、命名和目录整理能力。',
    suggestedFor: '运营同学、资料维护者、日常协作者',
    permissionCodes: [
      'file.access',
      'file.list',
      'file.preview',
      'file.download',
      'file.upload',
      'file.rename',
      'file.move',
      'file.copy',
      'file.favorite',
      'trash.view',
      'trash.restore',
      'storage.read',
    ],
    sort: 20,
    status: 'active',
    isBuiltIn: true,
  },
  {
    productCode: 'giovan-file',
    name: '文件管理员',
    code: 'giovan-file-admin',
    description: '具备删除、分享、日志查看和回收站管理能力。',
    summary: '覆盖删除、分享、回收站和日志，是文件系统完整管理角色。',
    suggestedFor: '项目负责人、系统管理员、核心运营',
    permissionCodes: [
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
    sort: 30,
    status: 'active',
    isBuiltIn: true,
  },
  {
    productCode: 'tools-center',
    name: '工具执行员',
    code: 'tools-center-operator',
    description: '可进入工具中心并执行已开放工具。',
    summary: '可进入工具中心并执行已经开放的工具。',
    suggestedFor: '普通使用者、运营支持、值班同学',
    permissionCodes: ['tools.access', 'tools.list', 'tools.run'],
    sort: 10,
    status: 'active',
    isBuiltIn: true,
  },
  {
    productCode: 'tools-center',
    name: '工具管理员',
    code: 'tools-center-admin',
    description: '可维护工具配置、发布工具和查看日志。',
    summary: '负责维护工具配置、发布策略与日志追踪。',
    suggestedFor: '平台维护者、工具负责人',
    permissionCodes: [
      'tools.access',
      'tools.list',
      'tools.run',
      'tools.write',
      'tools.publish',
      'tools.logs.read',
    ],
    sort: 20,
    status: 'active',
    isBuiltIn: true,
  },
];

let seedEnsured = false;

const uniqueStrings = (items = []) =>
  Array.from(
    new Set(
      items
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean)
    )
  );

const normalizeStringArray = (items) => uniqueStrings(Array.isArray(items) ? items : []);

const ensureSeeds = async () => {
  if (seedEnsured) {
    return;
  }

  const [productCount, permissionCount, roleCount] = await Promise.all([
    Product.countDocuments(),
    ProductPermission.countDocuments(),
    ProductRole.countDocuments(),
  ]);

  if (productCount === 0) {
    await Product.insertMany(DEFAULT_PRODUCTS);
  }

  if (permissionCount === 0) {
    const permissionDocs = DEFAULT_PERMISSIONS.flatMap((group) =>
      group.permissions.map(([name, code, description], index) => ({
        productCode: group.productCode,
        name,
        code,
        description,
        groupKey: group.groupKey,
        groupLabel: group.groupLabel,
        groupDescription: group.groupDescription,
        sort: group.sort + index,
        status: 'active',
      }))
    );

    await ProductPermission.insertMany(permissionDocs);
  }

  if (roleCount === 0) {
    await ProductRole.insertMany(DEFAULT_ROLES);
  }

  seedEnsured = true;
};

const groupPermissions = (permissions) => {
  const groupMap = new Map();

  permissions.forEach((permission) => {
    const key = permission.groupKey || 'default';
    const current = groupMap.get(key) || {
      key,
      label: permission.groupLabel || key,
      description: permission.groupDescription || '',
      permissions: [],
      sort: permission.sort || 0,
    };

    current.permissions.push({
      id: String(permission._id),
      label: permission.name,
      value: permission.code,
      description: permission.description || '',
      status: permission.status,
      sort: permission.sort || 0,
    });

    if (typeof permission.sort === 'number') {
      current.sort = Math.min(current.sort, permission.sort);
    }

    groupMap.set(key, current);
  });

  return Array.from(groupMap.values())
    .sort((a, b) => a.sort - b.sort)
    .map((group) => ({
      key: group.key,
      label: group.label,
      description: group.description,
      permissions: group.permissions.sort((a, b) => a.sort - b.sort),
    }));
};

const getMemberCountByRoleCode = async (roleCode) =>
  UserProductGrant.countDocuments({
    enabled: true,
    roleCodes: roleCode,
  });

const mapProductRecord = async (product) => {
  const [memberCount, roleCount, permissionCount] = await Promise.all([
    UserProductGrant.countDocuments({
      productCode: product.code,
      enabled: true,
    }),
    ProductRole.countDocuments({ productCode: product.code }),
    ProductPermission.countDocuments({ productCode: product.code }),
  ]);

  return {
    id: String(product._id),
    name: product.name,
    code: product.code,
    status: product.status,
    description: product.description || '',
    accessMode: product.accessMode || '',
    homePath: product.homePath || '',
    loginPath: product.loginPath || '',
    icon: product.icon || '',
    origins: normalizeStringArray(product.origins),
    pathPrefixes: normalizeStringArray(product.pathPrefixes),
    memberCount,
    roleCount,
    permissionCount,
    updatedAt: product.updatedAt,
    createdAt: product.createdAt,
  };
};

const isExpired = (expiresAt) =>
  Boolean(expiresAt) && new Date(expiresAt).getTime() < Date.now();

const mapPermissionDetail = (permission) => ({
  id: String(permission._id),
  label: permission.name,
  value: permission.code,
  description: permission.description || '',
  groupKey: permission.groupKey || '',
  groupLabel: permission.groupLabel || '',
  status: permission.status,
  sort: permission.sort || 0,
});

const buildEffectiveGrant = ({
  product,
  grant,
  roleMap,
  permissionMap,
}) => {
  const roleCodes = normalizeStringArray(grant?.roleCodes);
  const extraPermissionCodes = normalizeStringArray(grant?.extraPermissionCodes);
  const denyPermissionCodes = normalizeStringArray(grant?.denyPermissionCodes);
  const grantExpired = isExpired(grant?.expiresAt);
  const accessEnabled =
    product.status === 'active' &&
    Boolean(grant?.enabled) &&
    !grantExpired;

  const rolePermissionCodes = new Set();
  const resolvedRoles = roleCodes.flatMap((roleCode) => {
    const role = roleMap.get(`${product.code}:${roleCode}`);

    if (!role || role.status !== 'active') {
      return [];
    }

    normalizeStringArray(role.permissionCodes).forEach((code) => {
      rolePermissionCodes.add(code);
    });

    return [
      {
        code: role.code,
        name: role.name,
        permissionCodes: normalizeStringArray(role.permissionCodes),
      },
    ];
  });

  const permissionCodes = new Set([
    ...Array.from(rolePermissionCodes),
    ...extraPermissionCodes,
  ]);

  denyPermissionCodes.forEach((code) => {
    permissionCodes.delete(code);
  });

  const effectivePermissionCodes = accessEnabled
    ? Array.from(permissionCodes).filter((code) => {
        const permission = permissionMap.get(`${product.code}:${code}`);
        return permission?.status === 'active';
      })
    : [];

  const effectivePermissions = effectivePermissionCodes
    .map((code) => permissionMap.get(`${product.code}:${code}`))
    .filter(Boolean)
    .sort((left, right) => (left.sort || 0) - (right.sort || 0))
    .map((permission) => mapPermissionDetail(permission));

  return {
    id: grant ? String(grant._id) : `draft-${product.code}`,
    productCode: product.code,
    productName: product.name,
    productStatus: product.status,
    enabled: Boolean(grant?.enabled),
    accessEnabled,
    expired: grantExpired,
    roleCodes,
    resolvedRoles,
    extraPermissionCodes,
    denyPermissionCodes,
    effectivePermissionCodes,
    effectivePermissionCount: effectivePermissionCodes.length,
    effectivePermissions,
    expiresAt: grant?.expiresAt || null,
    remark: grant?.remark || '',
  };
};

class ProductAccessService {
  async listProducts({ keyword = '', status } = {}) {
    await ensureSeeds();

    const query = {};
    if (status) {
      query.status = status;
    }

    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { code: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
      ];
    }

    const products = await Product.find(query).sort({ sort: 1, createdAt: 1 }).lean();
    return Promise.all(products.map((product) => mapProductRecord(product)));
  }

  async getProductOptions() {
    await ensureSeeds();

    const products = await Product.find({ status: 'active' })
      .sort({ sort: 1, createdAt: 1 })
      .select('_id name code')
      .lean();

    return products.map((item) => ({
      id: String(item._id),
      name: item.name,
      code: item.code,
    }));
  }

  async createProduct(payload) {
    await ensureSeeds();

    if (!payload.name || !payload.code) {
      throw new ValidationError('产品名称和编码不能为空');
    }

    const existing = await Product.findOne({ code: payload.code.trim() }).lean();
    if (existing) {
      throw new ValidationError('产品编码已存在');
    }

    const product = await Product.create({
      name: payload.name.trim(),
      code: payload.code.trim(),
      description: payload.description?.trim() || '',
      accessMode: payload.accessMode?.trim() || '来源识别',
      homePath: payload.homePath?.trim() || '',
      loginPath: payload.loginPath?.trim() || '',
      icon: payload.icon?.trim() || '',
      origins: normalizeStringArray(payload.origins),
      pathPrefixes: normalizeStringArray(payload.pathPrefixes),
      sort: Number(payload.sort) || 0,
      status: payload.status === 'inactive' ? 'inactive' : 'active',
    });

    return mapProductRecord(product.toObject());
  }

  async updateProduct(id, payload) {
    await ensureSeeds();

    const product = await Product.findById(id);
    if (!product) {
      throw new NotFoundError('产品不存在');
    }

    const previousCode = product.code;
    const nextCode = payload.code?.trim();

    if (nextCode && nextCode !== previousCode) {
      const existing = await Product.findOne({ code: nextCode }).lean();
      if (existing) {
        throw new ValidationError('产品编码已存在');
      }
      product.code = nextCode;
    }

    if (payload.name) product.name = payload.name.trim();
    if (payload.description !== undefined) product.description = payload.description?.trim() || '';
    if (payload.accessMode !== undefined) product.accessMode = payload.accessMode?.trim() || '';
    if (payload.homePath !== undefined) product.homePath = payload.homePath?.trim() || '';
    if (payload.loginPath !== undefined) product.loginPath = payload.loginPath?.trim() || '';
    if (payload.icon !== undefined) product.icon = payload.icon?.trim() || '';
    if (payload.origins !== undefined) product.origins = normalizeStringArray(payload.origins);
    if (payload.pathPrefixes !== undefined) product.pathPrefixes = normalizeStringArray(payload.pathPrefixes);
    if (payload.sort !== undefined) product.sort = Number(payload.sort) || 0;
    if (payload.status) product.status = payload.status === 'inactive' ? 'inactive' : 'active';

    await product.save();

    if (nextCode && nextCode !== previousCode) {
      await Promise.all([
        ProductPermission.updateMany({ productCode: previousCode }, { productCode: nextCode }),
        ProductRole.updateMany({ productCode: previousCode }, { productCode: nextCode }),
        UserProductGrant.updateMany({ productCode: previousCode }, { productCode: nextCode }),
      ]);
    }

    return mapProductRecord(product.toObject());
  }

  async deleteProduct(id) {
    await ensureSeeds();

    const product = await Product.findById(id);
    if (!product) {
      throw new NotFoundError('产品不存在');
    }

    const [roleCount, permissionCount, grantCount] = await Promise.all([
      ProductRole.countDocuments({ productCode: product.code }),
      ProductPermission.countDocuments({ productCode: product.code }),
      UserProductGrant.countDocuments({ productCode: product.code }),
    ]);

    if (roleCount > 0 || permissionCount > 0 || grantCount > 0) {
      throw new ValidationError('当前产品仍关联角色、权限或授权记录，无法删除');
    }

    await Product.deleteOne({ _id: id });
    return true;
  }

  async listProductPermissions({ productCode, status } = {}) {
    await ensureSeeds();

    const query = {};
    if (productCode) query.productCode = productCode;
    if (status) query.status = status;

    return ProductPermission.find(query)
      .sort({ productCode: 1, groupKey: 1, sort: 1, createdAt: 1 })
      .lean();
  }

  async createProductPermission(payload) {
    await ensureSeeds();

    if (!payload.productCode || !payload.name || !payload.code) {
      throw new ValidationError('所属产品、权限名称和权限编码不能为空');
    }

    if (!payload.groupKey || !payload.groupLabel) {
      throw new ValidationError('权限分组标识和分组名称不能为空');
    }

    const product = await Product.findOne({ code: payload.productCode }).lean();
    if (!product) {
      throw new ValidationError('所属产品不存在');
    }

    const existing = await ProductPermission.findOne({ code: payload.code.trim() }).lean();
    if (existing) {
      throw new ValidationError('权限编码已存在');
    }

    return ProductPermission.create({
      productCode: payload.productCode.trim(),
      name: payload.name.trim(),
      code: payload.code.trim(),
      description: payload.description?.trim() || '',
      groupKey: payload.groupKey.trim(),
      groupLabel: payload.groupLabel.trim(),
      groupDescription: payload.groupDescription?.trim() || '',
      sort: Number(payload.sort) || 0,
      status: payload.status === 'inactive' ? 'inactive' : 'active',
    });
  }

  async updateProductPermission(id, payload) {
    await ensureSeeds();

    const permission = await ProductPermission.findById(id);
    if (!permission) {
      throw new NotFoundError('权限点不存在');
    }

    const nextProductCode = payload.productCode?.trim() || permission.productCode;
    const product = await Product.findOne({ code: nextProductCode }).lean();
    if (!product) {
      throw new ValidationError('所属产品不存在');
    }

    const previousCode = permission.code;
    const previousProductCode = permission.productCode;
    const nextCode = payload.code?.trim();

    if (nextCode && nextCode !== previousCode) {
      const existing = await ProductPermission.findOne({ code: nextCode }).lean();
      if (existing) {
        throw new ValidationError('权限编码已存在');
      }
      permission.code = nextCode;
    }

    permission.productCode = nextProductCode;
    if (payload.name) permission.name = payload.name.trim();
    if (payload.description !== undefined) permission.description = payload.description?.trim() || '';
    if (payload.groupKey) permission.groupKey = payload.groupKey.trim();
    if (payload.groupLabel) permission.groupLabel = payload.groupLabel.trim();
    if (payload.groupDescription !== undefined) permission.groupDescription = payload.groupDescription?.trim() || '';
    if (payload.sort !== undefined) permission.sort = Number(payload.sort) || 0;
    if (payload.status) permission.status = payload.status === 'inactive' ? 'inactive' : 'active';

    await permission.save();

    if (nextCode && nextCode !== previousCode) {
      await Promise.all([
        ProductRole.updateMany(
          { permissionCodes: previousCode },
          { $set: { 'permissionCodes.$[item]': nextCode } },
          { arrayFilters: [{ item: previousCode }] }
        ),
        UserProductGrant.updateMany(
          { extraPermissionCodes: previousCode },
          { $set: { 'extraPermissionCodes.$[item]': nextCode } },
          { arrayFilters: [{ item: previousCode }] }
        ),
        UserProductGrant.updateMany(
          { denyPermissionCodes: previousCode },
          { $set: { 'denyPermissionCodes.$[item]': nextCode } },
          { arrayFilters: [{ item: previousCode }] }
        ),
      ]);
    }

    if (nextProductCode !== previousProductCode) {
      await Promise.all([
        ProductRole.updateMany(
          { productCode: previousProductCode, permissionCodes: permission.code },
          { $pull: { permissionCodes: permission.code } }
        ),
        UserProductGrant.updateMany(
          { productCode: previousProductCode },
          {
            $pull: {
              extraPermissionCodes: permission.code,
              denyPermissionCodes: permission.code,
            },
          }
        ),
      ]);
    }

    return permission.toObject();
  }

  async deleteProductPermission(id) {
    await ensureSeeds();

    const permission = await ProductPermission.findById(id);
    if (!permission) {
      throw new NotFoundError('权限点不存在');
    }

    const roleCount = await ProductRole.countDocuments({ permissionCodes: permission.code });
    if (roleCount > 0) {
      throw new ValidationError(`该权限点已被 ${roleCount} 个产品角色使用，无法删除`);
    }

    const grantCount = await UserProductGrant.countDocuments({
      $or: [
        { extraPermissionCodes: permission.code },
        { denyPermissionCodes: permission.code },
      ],
    });
    if (grantCount > 0) {
      throw new ValidationError(`该权限点已出现在 ${grantCount} 条用户授权记录中，无法删除`);
    }

    await ProductPermission.deleteOne({ _id: id });
    return true;
  }

  async getProductPermissionGroups(productCode) {
    await ensureSeeds();

    const query = {};
    if (productCode) {
      query.productCode = productCode;
    }

    const permissions = await ProductPermission.find(query)
      .sort({ productCode: 1, groupKey: 1, sort: 1, createdAt: 1 })
      .lean();

    if (productCode) {
      return groupPermissions(permissions);
    }

    const productCodes = Array.from(new Set(permissions.map((item) => item.productCode)));
    return productCodes.reduce((acc, code) => {
      acc[code] = groupPermissions(permissions.filter((item) => item.productCode === code));
      return acc;
    }, {});
  }

  async listProductRoles({ productCode, keyword = '', status } = {}) {
    await ensureSeeds();

    const query = {};
    if (productCode) query.productCode = productCode;
    if (status) query.status = status;
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { code: { $regex: keyword, $options: 'i' } },
        { summary: { $regex: keyword, $options: 'i' } },
      ];
    }

    const [roles, products] = await Promise.all([
      ProductRole.find(query)
        .sort({ productCode: 1, sort: 1, createdAt: 1 })
        .lean(),
      Product.find({}).select('name code').lean(),
    ]);

    const productNameMap = new Map(
      products.map((item) => [item.code, item.name])
    );

    const roleItems = await Promise.all(
      roles.map(async (role) => ({
        id: String(role._id),
        productCode: role.productCode,
        productName: productNameMap.get(role.productCode) || role.productCode,
        name: role.name,
        code: role.code,
        status: role.status,
        summary: role.summary || role.description || '',
        description: role.description || '',
        memberCount: await getMemberCountByRoleCode(role.code),
        permissionCodes: normalizeStringArray(role.permissionCodes),
        suggestedFor: role.suggestedFor || '',
        isBuiltIn: Boolean(role.isBuiltIn),
        updatedAt: role.updatedAt,
        createdAt: role.createdAt,
      }))
    );

    return roleItems;
  }

  async getProductRoleOptions(productCode) {
    await ensureSeeds();

    const query = { status: 'active' };
    if (productCode) query.productCode = productCode;

    const roles = await ProductRole.find(query)
      .sort({ sort: 1, createdAt: 1 })
      .select('productCode name code description permissionCodes')
      .lean();

    return roles;
  }

  async createProductRole(payload) {
    await ensureSeeds();

    if (!payload.productCode || !payload.name || !payload.code) {
      throw new ValidationError('所属产品、角色名称和编码不能为空');
    }

    const product = await Product.findOne({ code: payload.productCode }).lean();
    if (!product) {
      throw new ValidationError('所属产品不存在');
    }

    const existing = await ProductRole.findOne({ code: payload.code.trim() }).lean();
    if (existing) {
      throw new ValidationError('产品角色编码已存在');
    }

    const validPermissionCodes = await this.getPermissionCodeSet(payload.productCode);
    const permissionCodes = normalizeStringArray(payload.permissionCodes);
    permissionCodes.forEach((code) => {
      if (!validPermissionCodes.has(code)) {
        throw new ValidationError(`存在无效权限编码：${code}`);
      }
    });

    const role = await ProductRole.create({
      productCode: payload.productCode,
      name: payload.name.trim(),
      code: payload.code.trim(),
      description: payload.description?.trim() || '',
      summary: payload.summary?.trim() || '',
      suggestedFor: payload.suggestedFor?.trim() || '',
      permissionCodes,
      sort: Number(payload.sort) || 0,
      status: payload.status === 'inactive' ? 'inactive' : 'active',
      isBuiltIn: Boolean(payload.isBuiltIn),
    });

    const [item] = await this.listProductRoles({ productCode: role.productCode, keyword: role.code });
    return item || role.toObject();
  }

  async updateProductRole(id, payload) {
    await ensureSeeds();

    const role = await ProductRole.findById(id);
    if (!role) {
      throw new NotFoundError('产品角色不存在');
    }

    const nextProductCode = payload.productCode || role.productCode;
    const product = await Product.findOne({ code: nextProductCode }).lean();
    if (!product) {
      throw new ValidationError('所属产品不存在');
    }

    const previousCode = role.code;
    const previousProductCode = role.productCode;
    const nextRoleCode = payload.code?.trim();

    if (nextRoleCode && nextRoleCode !== previousCode) {
      const existing = await ProductRole.findOne({ code: nextRoleCode }).lean();
      if (existing) {
        throw new ValidationError('产品角色编码已存在');
      }
      role.code = nextRoleCode;
    }

    if (payload.permissionCodes !== undefined) {
      const validPermissionCodes = await this.getPermissionCodeSet(nextProductCode);
      const permissionCodes = normalizeStringArray(payload.permissionCodes);
      permissionCodes.forEach((code) => {
        if (!validPermissionCodes.has(code)) {
          throw new ValidationError(`存在无效权限编码：${code}`);
        }
      });
      role.permissionCodes = permissionCodes;
    }

    role.productCode = nextProductCode;
    if (payload.name) role.name = payload.name.trim();
    if (payload.description !== undefined) role.description = payload.description?.trim() || '';
    if (payload.summary !== undefined) role.summary = payload.summary?.trim() || '';
    if (payload.suggestedFor !== undefined) role.suggestedFor = payload.suggestedFor?.trim() || '';
    if (payload.sort !== undefined) role.sort = Number(payload.sort) || 0;
    if (payload.status) role.status = payload.status === 'inactive' ? 'inactive' : 'active';
    if (payload.isBuiltIn !== undefined) role.isBuiltIn = Boolean(payload.isBuiltIn);

    await role.save();

    if (nextRoleCode && nextRoleCode !== previousCode) {
      await UserProductGrant.updateMany(
        { roleCodes: previousCode },
        { $set: { 'roleCodes.$[item]': nextRoleCode } },
        { arrayFilters: [{ item: previousCode }] }
      );
    }

    if (nextProductCode !== previousProductCode) {
      await UserProductGrant.updateMany(
        { productCode: previousProductCode, roleCodes: role.code },
        { $pull: { roleCodes: role.code } }
      );
    }

    const [item] = await this.listProductRoles({ productCode: role.productCode, keyword: role.code });
    return item || role.toObject();
  }

  async deleteProductRole(id) {
    await ensureSeeds();

    const role = await ProductRole.findById(id);
    if (!role) {
      throw new NotFoundError('产品角色不存在');
    }

    const grantCount = await UserProductGrant.countDocuments({ roleCodes: role.code });
    if (grantCount > 0) {
      throw new ValidationError(`该产品角色已分配给 ${grantCount} 条授权记录，无法删除`);
    }

    await ProductRole.deleteOne({ _id: id });
    return true;
  }

  async getPermissionCodeSet(productCode) {
    const permissions = await ProductPermission.find({ productCode, status: 'active' })
      .select('code')
      .lean();
    return new Set(permissions.map((item) => item.code));
  }

  async getUserProductGrants(userId) {
    await ensureSeeds();

    const user = await User.findById(userId).select('_id').lean();
    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    const [products, grants, roles, permissions] = await Promise.all([
      Product.find({}).sort({ sort: 1, createdAt: 1 }).lean(),
      UserProductGrant.find({ userId }).lean(),
      ProductRole.find({}).lean(),
      ProductPermission.find({}).lean(),
    ]);

    const grantMap = new Map(grants.map((item) => [item.productCode, item]));
    const roleMap = new Map(roles.map((role) => [`${role.productCode}:${role.code}`, role]));
    const permissionMap = new Map(
      permissions.map((permission) => [`${permission.productCode}:${permission.code}`, permission])
    );

    return products.map((product) =>
      buildEffectiveGrant({
        product,
        grant: grantMap.get(product.code),
        roleMap,
        permissionMap,
      })
    );
  }

  async getUserProductAccess(userId, productCode) {
    await ensureSeeds();

    const user = await User.findById(userId).select('_id').lean();
    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    const product = await Product.findOne({ code: productCode }).lean();
    if (!product) {
      throw new NotFoundError('产品不存在');
    }

    const [grant, roles, permissions] = await Promise.all([
      UserProductGrant.findOne({ userId, productCode }).lean(),
      ProductRole.find({ productCode }).lean(),
      ProductPermission.find({ productCode }).lean(),
    ]);
    const roleMap = new Map(roles.map((role) => [`${role.productCode}:${role.code}`, role]));
    const permissionMap = new Map(
      permissions.map((permission) => [`${permission.productCode}:${permission.code}`, permission])
    );

    return buildEffectiveGrant({
      product,
      grant,
      roleMap,
      permissionMap,
    });
  }

  async updateUserProductGrants(userId, grants = []) {
    await ensureSeeds();

    const user = await User.findById(userId).select('_id').lean();
    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    const products = await Product.find({}).select('code').lean();
    const validProductCodes = new Set(products.map((item) => item.code));

    const roleList = await ProductRole.find({}).select('productCode code').lean();
    const roleCodeMap = new Map();
    roleList.forEach((item) => {
      const current = roleCodeMap.get(item.productCode) || new Set();
      current.add(item.code);
      roleCodeMap.set(item.productCode, current);
    });

    const permissionList = await ProductPermission.find({}).select('productCode code').lean();
    const permissionCodeMap = new Map();
    permissionList.forEach((item) => {
      const current = permissionCodeMap.get(item.productCode) || new Set();
      current.add(item.code);
      permissionCodeMap.set(item.productCode, current);
    });

    const normalizedGrants = Array.isArray(grants)
      ? grants.map((item) => ({
          productCode: typeof item.productCode === 'string' ? item.productCode.trim() : '',
          enabled: Boolean(item.enabled),
          roleCodes: normalizeStringArray(item.roleCodes),
          extraPermissionCodes: normalizeStringArray(item.extraPermissionCodes),
          denyPermissionCodes: normalizeStringArray(item.denyPermissionCodes),
          expiresAt: item.expiresAt ? new Date(item.expiresAt) : null,
          remark: typeof item.remark === 'string' ? item.remark.trim() : '',
        }))
      : [];

    normalizedGrants.forEach((grant) => {
      if (!grant.productCode || !validProductCodes.has(grant.productCode)) {
        throw new ValidationError(`存在无效产品编码：${grant.productCode || '空值'}`);
      }

      const validRoleCodes = roleCodeMap.get(grant.productCode) || new Set();
      grant.roleCodes.forEach((roleCode) => {
        if (!validRoleCodes.has(roleCode)) {
          throw new ValidationError(`产品 ${grant.productCode} 存在无效角色：${roleCode}`);
        }
      });

      const validPermissionCodes = permissionCodeMap.get(grant.productCode) || new Set();
      [...grant.extraPermissionCodes, ...grant.denyPermissionCodes].forEach((code) => {
        if (!validPermissionCodes.has(code)) {
          throw new ValidationError(`产品 ${grant.productCode} 存在无效权限：${code}`);
        }
      });
    });

    await Promise.all(
      normalizedGrants.map((grant) =>
        UserProductGrant.findOneAndUpdate(
          { userId, productCode: grant.productCode },
          {
            userId,
            productCode: grant.productCode,
            enabled: grant.enabled,
            roleCodes: grant.roleCodes,
            extraPermissionCodes: grant.extraPermissionCodes,
            denyPermissionCodes: grant.denyPermissionCodes,
            expiresAt: grant.expiresAt,
            remark: grant.remark,
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          }
        )
      )
    );

    return this.getUserProductGrants(userId);
  }

  async getAdminMeta() {
    await ensureSeeds();

    const [products, roles, permissionGroupsByProduct] = await Promise.all([
      this.listProducts(),
      this.getProductRoleOptions(),
      this.getProductPermissionGroups(),
    ]);

    const roleOptionsByProduct = roles.reduce((acc, item) => {
      const current = acc[item.productCode] || [];
      current.push({
        label: item.name,
        value: item.code,
        description: item.description || '',
        permissionCodes: normalizeStringArray(item.permissionCodes),
      });
      acc[item.productCode] = current;
      return acc;
    }, {});

    return {
      products,
      roleOptionsByProduct,
      permissionGroupsByProduct,
    };
  }
}

module.exports = new ProductAccessService();
