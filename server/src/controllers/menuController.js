const Menu = require('../models/menu')
const Role = require('../models/role')
const { Response } = require('../utils/response')
const { NotFoundError, ValidationError } = require('../utils/errors')

class MenuController {
  async list(ctx) {
    try {
      const { status } = ctx.query
      
      const query = {}
      if (status) query.status = status
      
      const menus = await Menu.find(query)
        .sort({ sort: 1, createdAt: 1 })
        .lean()
      
      const tree = this.buildTree(menus)
      
      ctx.body = Response.success(tree)
    } catch (error) {
      throw error
    }
  }
  
  buildTree(menus, parentId = null) {
    return menus
      .filter(menu => String(menu.parentId) === String(parentId))
      .map(menu => ({
        ...menu,
        children: this.buildTree(menus, menu._id)
      }))
  }
  
  async getAll(ctx) {
    try {
      const menus = await Menu.find({ status: 'active' })
        .select('_id name path icon')
        .sort({ sort: 1 })
        .lean()
      
      ctx.body = Response.success(menus)
    } catch (error) {
      throw error
    }
  }
  
  async create(ctx) {
    try {
      const { name, path, icon, parentId, sort } = ctx.request.body
      
      if (!name || !path) {
        throw new ValidationError('菜单名称和路径不能为空')
      }
      
      const menu = new Menu({
        name,
        path,
        icon,
        parentId: parentId || null,
        sort: sort || 0
      })
      
      await menu.save()
      
      ctx.body = Response.success(menu, '创建成功')
    } catch (error) {
      throw error
    }
  }
  
  async update(ctx) {
    try {
      const { id } = ctx.params
      const { name, path, icon, parentId, sort, status } = ctx.request.body
      
      const menu = await Menu.findById(id)
      if (!menu) {
        throw new NotFoundError('菜单不存在')
      }
      
      if (name) menu.name = name
      if (path) menu.path = path
      if (icon !== undefined) menu.icon = icon
      if (parentId !== undefined) menu.parentId = parentId || null
      if (sort !== undefined) menu.sort = sort
      if (status) menu.status = status
      menu.updatedAt = new Date()
      
      await menu.save()
      
      ctx.body = Response.success(menu, '更新成功')
    } catch (error) {
      throw error
    }
  }
  
  async delete(ctx) {
    try {
      const { id } = ctx.params
      
      const menu = await Menu.findById(id)
      if (!menu) {
        throw new NotFoundError('菜单不存在')
      }
      
      const children = await Menu.find({ parentId: id })
      if (children.length > 0) {
        throw new ValidationError('该菜单下存在子菜单，无法删除')
      }

      const rolesWithMenu = await Role.countDocuments({ menuIds: id })
      if (rolesWithMenu > 0) {
        throw new ValidationError(`该菜单已分配给 ${rolesWithMenu} 个角色，无法删除`)
      }
      
      await Menu.deleteOne({ _id: id })
      
      ctx.body = Response.success(null, '删除成功')
    } catch (error) {
      throw error
    }
  }
}

module.exports = new MenuController()
