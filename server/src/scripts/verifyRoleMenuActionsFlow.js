const path = require('path')
const fs = require('fs')
const dotenv = require('dotenv')
const mongoose = require('mongoose')

const Menu = require('../models/menu')
const menuController = require('../controllers/menuController')
const roleController = require('../controllers/roleController')
const connectDB = require('../config/db')
const { collectRoleActionKeys } = require('../utils/adminRbac')

const expectedActionKeys = [
  'admin.roles.read',
  'admin.roles.create',
  'admin.roles.update',
  'admin.roles.delete',
]

const loadEnv = () => {
  const rootEnv = path.resolve(__dirname, '../../../.env')
  const serverEnv = path.resolve(__dirname, '../../.env')

  if (fs.existsSync(rootEnv)) {
    dotenv.config({ path: rootEnv })
    return
  }

  if (fs.existsSync(serverEnv)) {
    dotenv.config({ path: serverEnv })
    return
  }

  dotenv.config()
}

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message)
  }
}

const createContext = (query = {}) => ({
  query,
  body: null,
})

const extractData = (body) => body?.data ?? body

const main = async () => {
  loadEnv()
  await connectDB()

  const roleMenu = await Menu.findOne({ path: '/admin/roles' }).lean()
  assert(roleMenu, '数据库未找到 /admin/roles 角色管理菜单')

  const dbActionKeys = (roleMenu.actions || []).map((item) => item.key)
  expectedActionKeys.forEach((key) => {
    assert(dbActionKeys.includes(key), `数据库角色管理菜单缺少按钮权限：${key}`)
  })

  const allCtx = createContext()
  await menuController.getAll(allCtx)
  const allMenus = extractData(allCtx.body)
  const allRoleMenu = allMenus.find((item) => String(item._id) === String(roleMenu._id))
  assert(allRoleMenu, '/api/admin/menus/all 序列化结果缺少角色管理菜单')
  expectedActionKeys.forEach((key) => {
    assert(
      allRoleMenu.actions.some((item) => item.key === key),
      `/api/admin/menus/all 序列化结果缺少按钮权限：${key}`,
    )
  })

  const manageCtx = createContext()
  await menuController.list(manageCtx)
  const managedMenus = extractData(manageCtx.body)
  const flatten = (items) =>
    items.flatMap((item) => [item, ...flatten(Array.isArray(item.children) ? item.children : [])])
  const managedRoleMenu = flatten(managedMenus).find((item) => String(item._id) === String(roleMenu._id))
  assert(managedRoleMenu, '/api/admin/menus/manage 序列化结果缺少角色管理菜单')
  expectedActionKeys.forEach((key) => {
    assert(
      managedRoleMenu.actions.some((item) => item.key === key),
      `/api/admin/menus/manage 序列化结果缺少按钮权限：${key}`,
    )
  })

  const resolved = await roleController.resolveRolePermissions({
    menuIds: [],
    actionKeys: expectedActionKeys,
  })
  assert(
    resolved.menuIds.includes(String(roleMenu._id)),
    '角色权限保存解析未自动绑定按钮所属菜单',
  )
  expectedActionKeys.forEach((key) => {
    assert(resolved.actionKeys.includes(key), `角色权限保存解析缺少按钮权限：${key}`)
  })

  const collected = collectRoleActionKeys([
    {
      actionKeys: expectedActionKeys,
      menuIds: [roleMenu],
    },
  ])
  expectedActionKeys.forEach((key) => {
    assert(collected.includes(key), `登录用户权限下发缺少按钮权限：${key}`)
  })

  console.log(JSON.stringify({
    menuId: String(roleMenu._id),
    path: roleMenu.path,
    actionKeys: expectedActionKeys,
    checks: [
      'database actions',
      '/api/admin/menus/all serialization',
      '/api/admin/menus/manage serialization',
      'role permission save resolution',
      'login permission code collection',
    ],
  }, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })
