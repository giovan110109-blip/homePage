const path = require('path')
const fs = require('fs')
const dotenv = require('dotenv')
const mongoose = require('mongoose')

const Menu = require('../models/menu')
const connectDB = require('../config/db')

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

const roleMenuActions = [
  {
    key: 'admin.roles.read',
    name: '查询',
    description: '查看角色列表和角色权限配置',
    sort: 1,
    status: 'active',
  },
  {
    key: 'admin.roles.create',
    name: '新增',
    description: '新增后台角色',
    sort: 2,
    status: 'active',
  },
  {
    key: 'admin.roles.update',
    name: '编辑',
    description: '编辑角色信息和分配菜单按钮权限',
    sort: 3,
    status: 'active',
  },
  {
    key: 'admin.roles.delete',
    name: '删除',
    description: '删除后台角色',
    sort: 4,
    status: 'active',
  },
]

const findRoleMenu = async () => {
  const candidates = await Menu.find({
    $or: [
      { name: '角色管理' },
      { path: '/admin/roles' },
      { path: '/roles' },
      { path: { $regex: 'roles', $options: 'i' } },
      { path: { $regex: 'role', $options: 'i' } },
    ],
  })
    .sort({ sort: 1, createdAt: 1 })
    .lean()

  if (candidates.length === 0) {
    return null
  }

  return (
    candidates.find((item) => item.name === '角色管理') ||
    candidates.find((item) => item.path === '/admin/roles') ||
    candidates.find((item) => item.path === '/roles') ||
    candidates[0]
  )
}

const main = async () => {
  loadEnv()
  await connectDB()

  const menu = await findRoleMenu()

  if (!menu) {
    throw new Error('未找到角色管理菜单，请先在菜单管理中创建角色管理菜单')
  }

  await Menu.updateOne(
    { _id: menu._id },
    {
      $set: {
        actions: roleMenuActions,
        updatedAt: new Date(),
      },
    },
  )

  const updated = await Menu.findById(menu._id).select('_id name path actions').lean()
  console.log(JSON.stringify(updated, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })
