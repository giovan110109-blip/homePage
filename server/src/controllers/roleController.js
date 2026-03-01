const Role = require('../models/role')
const Menu = require('../models/menu')
const User = require('../models/user')
const { Response } = require('../utils/response')
const { NotFoundError, ValidationError } = require('../utils/errors')

class RoleController {
  async list(ctx) {
    try {
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
          .populate('menuIds', 'name path icon')
          .lean(),
        Role.countDocuments(query)
      ])
      
      ctx.body = Response.success({
        data: roles,
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
      const { name, code, description, menuIds = [] } = ctx.request.body
      
      if (!name || !code) {
        throw new ValidationError('角色名称和编码不能为空')
      }
      
      const existing = await Role.findOne({ code })
      if (existing) {
        throw new ValidationError('角色编码已存在')
      }
      
      const role = new Role({
        name,
        code,
        description,
        menuIds
      })
      
      await role.save()
      
      ctx.body = Response.success(role, '创建成功')
    } catch (error) {
      throw error
    }
  }
  
  async update(ctx) {
    try {
      const { id } = ctx.params
      const { name, code, description, menuIds, status } = ctx.request.body
      
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
      
      if (name) role.name = name
      if (code) role.code = code
      if (description !== undefined) role.description = description
      if (menuIds) role.menuIds = menuIds
      if (status) role.status = status
      role.updatedAt = new Date()
      
      await role.save()
      
      ctx.body = Response.success(role, '更新成功')
    } catch (error) {
      throw error
    }
  }
  
  async delete(ctx) {
    try {
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
      const { id } = ctx.params
      
      const role = await Role.findById(id).populate('menuIds')
      if (!role) {
        throw new NotFoundError('角色不存在')
      }
      
      ctx.body = Response.success(role.menuIds)
    } catch (error) {
      throw error
    }
  }
  
  async updateMenus(ctx) {
    try {
      const { id } = ctx.params
      const { menuIds } = ctx.request.body
      
      const role = await Role.findById(id)
      if (!role) {
        throw new NotFoundError('角色不存在')
      }
      
      role.menuIds = menuIds
      role.updatedAt = new Date()
      await role.save()
      
      ctx.body = Response.success(role, '更新成功')
    } catch (error) {
      throw error
    }
  }
}

module.exports = new RoleController()
