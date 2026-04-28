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

const productMenuPathPatterns = [
  /^\/admin\/product-management(?:\/.*)?$/,
  /^\/product-management(?:\/.*)?$/,
]

const isProductMenu = (menu) =>
  productMenuPathPatterns.some((pattern) => pattern.test(menu.path || '')) ||
  /产品角色|产品权限|产品管理/.test(menu.name || '')

const main = async () => {
  loadEnv()
  await connectDB()

  const menus = await Menu.find({
    $or: [
      { path: { $regex: 'product-management', $options: 'i' } },
      { name: { $regex: '产品(管理|角色|权限)', $options: 'i' } },
    ],
  })
    .select('_id name path actions')
    .lean()

  const targets = menus.filter(isProductMenu)

  if (targets.length === 0) {
    console.log(JSON.stringify({ matched: 0, cleared: [] }, null, 2))
    return
  }

  const ids = targets.map((item) => item._id)
  await Menu.updateMany(
    { _id: { $in: ids } },
    {
      $set: {
        actions: [],
        updatedAt: new Date(),
      },
    },
  )

  console.log(JSON.stringify({
    matched: targets.length,
    cleared: targets.map((item) => ({
      id: String(item._id),
      name: item.name,
      path: item.path,
      previousActionKeys: Array.isArray(item.actions)
        ? item.actions.map((action) => action.key)
        : [],
    })),
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
