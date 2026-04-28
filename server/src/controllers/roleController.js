const Role = require('../models/role')
const Menu = require('../models/menu')
const User = require('../models/user')
const { Response } = require('../utils/response')
const { ForbiddenError, NotFoundError, ValidationError } = require('../utils/errors')
const { buildActionOwnerMap, normalizeActionKeys } = require('../utils/adminRbac')

class RoleController {
  serializeRole(role) {
    if (!role) {
      return null
    }

    const source = typeof role.toObject === 'function' ? role.toObject() : role
    return {
      ...source,
      actionKeys: normalizeActionKeys(source.actionKeys),
    }
  }

  assertPermission(ctx, permissionKey) {
    const roleCodes = Array.isArray(ctx.state.user?.roles)
      ? ctx.state.user.roles.map((role) => role?.code)
      : []

    if (roleCodes.includes('admin-plus')) {
      return
    }

    const permissionCodes = Array.isArray(ctx.state.user?.permissionCodes)
      ? ctx.state.user.permissionCodes
      : []

    if (!permissionCodes.includes(permissionKey)) {
      throw new ForbiddenError('当前账号没有执行该操作的按钮权限')
    }
  }

  async resolveRolePermissions(payload = {}) {
    const menus = await Menu.find({})
      .select('_id path actions')
      .lean()

    const actionOwnerMap = buildActionOwnerMap(menus)
    const actionKeys = normalizeActionKeys(payload.actionKeys)
    const invalidActionKeys = actionKeys.filter((key) => !actionOwnerMap.has(key))

    if (invalidActionKeys.length > 0) {
      throw new ValidationError(`存在无效按钮权限：${invalidActionKeys.join('、')}`)
    }

    const menuIds = new Set(
      Array.isArray(payload.menuIds)
        ? payload.menuIds.map((item) => String(item))
        : []
    )

    actionKeys.forEach((key) => {
      const owner = actionOwnerMap.get(key)
      if (owner?.menuId) {
        menuIds.add(owner.menuId)
      }
    })

    return {
      menuIds: Array.from(menuIds),
      actionKeys,
    }
  }

  async list(ctx) {
    try {
      this.assertPermission(ctx, 'admin.roles.read')
      const { page = 1, limit = 10, name, status } = ctx.query
      const skip = (parseInt(page) - 1) * parseInt(limit)
      
      const query = {}
      if (name) query.name = { $regex: name, $options: 'i' }
      if (status) query.status = status
      
      const [roles, total] = await Promise.all([
        Role.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .populate('menuIds', 'name path icon parentId actions sort status')
          .lean(),
        Role.countDocuments(query)
      ])

      const items = roles.map((role) => this.serializeRole(role))
      
      ctx.body = Response.success({
        data: items,
        meta: {
          page: parseInt(page),
          pageSize: parseInt(limit),
          total,
          pageCount: Math.ceil(total / parseInt(limit))
        }
      })
    } catch (error) {
      throw error
    }
  }
  
  async getAll(ctx) {
    try {
      this.assertPermission(ctx, 'admin.roles.read')
      const roles = await Role.find({ status: 'active' })
        .select('_id name code')
        .lean()
      ctx.body = Response.success(roles)
    } catch (error) {
      throw error
    }
  }
  
  async create(ctx) {
    try {
      this.assertPermission(ctx, 'admin.roles.create')
      const { name, code, description } = ctx.request.body
      
      if (!name || !code) {
        throw new ValidationError('角色名称和编码不能为空')
      }
      
      const existing = await Role.findOne({ code })
      if (existing) {
        throw new ValidationError('角色编码已存在')
      }
      
      const { menuIds, actionKeys } = await this.resolveRolePermissions(ctx.request.body)

      const role = new Role({
        name,
        code,
        description,
        menuIds,
        actionKeys,
      })
      
      await role.save()

      const createdRole = await Role.findById(role._id)
        .populate('menuIds', 'name path icon parentId actions sort status')
        .lean()

      ctx.body = Response.success(this.serializeRole(createdRole), '创建成功')
    } catch (error) {
      throw error
    }
  }
  
  async update(ctx) {
    try {
      this.assertPermission(ctx, 'admin.roles.update')
      const { id } = ctx.params
      const { name, code, description, status } = ctx.request.body
      
      const role = await Role.findById(id)
      if (!role) {
        throw new NotFoundError('角色不存在')
      }
      
      if (code && code !== role.code) {
        const existing = await Role.findOne({ code })
        if (existing) {
          throw new ValidationError('角色编码已存在')
        }
      }
      
      const shouldUpdatePermissions =
        ctx.request.body.menuIds !== undefined ||
        ctx.request.body.actionKeys !== undefined
      const resolvedPermissions = shouldUpdatePermissions
        ? await this.resolveRolePermissions({
            menuIds:
              ctx.request.body.menuIds !== undefined
                ? ctx.request.body.menuIds
                : role.menuIds,
            actionKeys:
              ctx.request.body.actionKeys !== undefined
                ? ctx.request.body.actionKeys
                : role.actionKeys,
          })
        : null

      if (name) role.name = name
      if (code) role.code = code
      if (description !== undefined) role.description = description
      if (resolvedPermissions) {
        role.menuIds = resolvedPermissions.menuIds
        role.actionKeys = resolvedPermissions.actionKeys
      }
      if (status) role.status = status
      role.updatedAt = new Date()
      
      await role.save()

      const updatedRole = await Role.findById(role._id)
        .populate('menuIds', 'name path icon parentId actions sort status')
        .lean()

      ctx.body = Response.success(this.serializeRole(updatedRole), '更新成功')
    } catch (error) {
      throw error
    }
  }
  
  async delete(ctx) {
    try {
      this.assertPermission(ctx, 'admin.roles.delete')
      const { id } = ctx.params
      
      const role = await Role.findById(id)
      if (!role) {
        throw new NotFoundError('角色不存在')
      }

      const usersWithRole = await User.countDocuments({ roleIds: id })
      if (usersWithRole > 0) {
        throw new ValidationError(`该角色已分配给 ${usersWithRole} 个用户，无法删除`)
      }
      
      await Role.deleteOne({ _id: id })
      
      ctx.body = Response.success(null, '删除成功')
    } catch (error) {
      throw error
    }
  }
  
  async getMenus(ctx) {
    try {
      this.assertPermission(ctx, 'admin.roles.read')
      const { id } = ctx.params
      
      const role = await Role.findById(id).populate('menuIds')
      if (!role) {
        throw new NotFoundError('角色不存在')
      }
      
      ctx.body = Response.success({
        menus: role.menuIds,
        actionKeys: normalizeActionKeys(role.actionKeys),
      })
    } catch (error) {
      throw error
    }
  }
  
  async updateMenus(ctx) {
    try {
      this.assertPermission(ctx, 'admin.roles.update')
      const { id } = ctx.params
      
      const role = await Role.findById(id)
      if (!role) {
        throw new NotFoundError('角色不存在')
      }
      
      const resolvedPermissions = await this.resolveRolePermissions({
        menuIds: ctx.request.body.menuIds,
        actionKeys:
          ctx.request.body.actionKeys !== undefined
            ? ctx.request.body.actionKeys
            : role.actionKeys,
      })

      role.menuIds = resolvedPermissions.menuIds
      role.actionKeys = resolvedPermissions.actionKeys
      role.updatedAt = new Date()
      await role.save()

      const updatedRole = await Role.findById(role._id)
        .populate('menuIds', 'name path icon parentId actions sort status')
        .lean()

      ctx.body = Response.success(this.serializeRole(updatedRole), '更新成功')
    } catch (error) {
      throw error
    }
  }
}

module.exports = new RoleController()
