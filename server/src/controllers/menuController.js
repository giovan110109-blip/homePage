const Menu = require('../models/menu')
const Role = require('../models/role')
const { Response } = require('../utils/response')
const { NotFoundError, ValidationError } = require('../utils/errors')

class MenuController {
  normalizeActions(actions = []) {
    if (!Array.isArray(actions)) {
      return []
    }

    return actions
      .map((item, index) => {
        if (!item || typeof item !== 'object') {
          return null
        }

        const key = typeof item.key === 'string' ? item.key.trim() : ''
        const name = typeof item.name === 'string' ? item.name.trim() : ''

        if (!key || !name) {
          return null
        }

        return {
          key,
          name,
          description: typeof item.description === 'string' ? item.description.trim() : '',
          sort: Number(item.sort) || index,
          status: item.status === 'inactive' ? 'inactive' : 'active',
        }
      })
      .filter(Boolean)
  }

  serializeMenu(menu) {
    return {
      ...menu,
      actions: this.normalizeActions(menu.actions),
    }
  }

  async list(ctx) {
    try {
      const { status } = ctx.query
      
      const query = {}
      if (status) query.status = status
      
      const menus = await Menu.find(query)
        .sort({ sort: 1, createdAt: 1 })
        .lean()

      const tree = this.buildTree(menus.map((item) => this.serializeMenu(item)))
      
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
        .select('_id name path icon parentId actions sort status')
        .sort({ sort: 1 })
        .lean()

      ctx.body = Response.success(menus.map((item) => this.serializeMenu(item)))
    } catch (error) {
      throw error
    }
  }
  
  async create(ctx) {
    try {
      const { name, path, icon, parentId, sort, actions } = ctx.request.body
      
      if (!name || !path) {
        throw new ValidationError('菜单名称和路径不能为空')
      }
      
      const menu = new Menu({
        name,
        path,
        icon,
        parentId: parentId || null,
        actions: this.normalizeActions(actions),
        sort: sort || 0
      })
      
      await menu.save()

      const createdMenu = await Menu.findById(menu._id).lean()
      ctx.body = Response.success(this.serializeMenu(createdMenu), '创建成功')
    } catch (error) {
      throw error
    }
  }
  
  async update(ctx) {
    try {
      const { id } = ctx.params
      const { name, path, icon, parentId, sort, status, actions } = ctx.request.body
      
      const menu = await Menu.findById(id)
      if (!menu) {
        throw new NotFoundError('菜单不存在')
      }
      
      if (name) menu.name = name
      if (path) menu.path = path
      if (icon !== undefined) menu.icon = icon
      if (parentId !== undefined) menu.parentId = parentId || null
      if (actions !== undefined) menu.actions = this.normalizeActions(actions)
      if (sort !== undefined) menu.sort = sort
      if (status) menu.status = status
      menu.updatedAt = new Date()
      
      await menu.save()

      const updatedMenu = await Menu.findById(menu._id).lean()
      ctx.body = Response.success(this.serializeMenu(updatedMenu), '更新成功')
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
