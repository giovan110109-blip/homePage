const path = require('path')
const fs = require('fs')
const https = require('https')
const http = require('http')
const dotenv = require('dotenv')
const mongoose = require('mongoose')

const User = require('../models/user')
const connectDB = require('../config/db')
const { issueToken, revokeToken } = require('../utils/adminTokenStore')

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

const requestJson = (url, token) =>
  new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http
    const req = client.request(
      url,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-request-timestamp': String(Date.now()),
        },
        timeout: 10000,
      },
      (res) => {
        const chunks = []

        res.on('data', (chunk) => chunks.push(chunk))
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8')

          try {
            resolve({
              statusCode: res.statusCode,
              body: JSON.parse(body),
            })
          } catch (error) {
            reject(new Error(`接口未返回 JSON：${body.slice(0, 200)}`))
          }
        })
      },
    )

    req.on('timeout', () => req.destroy(new Error('接口请求超时')))
    req.on('error', reject)
    req.end()
  })

const flatten = (items) =>
  (Array.isArray(items) ? items : []).flatMap((item) => [
    item,
    ...flatten(item.children),
  ])

const main = async () => {
  loadEnv()
  await connectDB()

  const user = await User.findOne({ status: 'active' })
    .populate('roleIds', 'name code')
    .lean()
  if (!user) {
    throw new Error('未找到可用于验证的后台用户')
  }

  const token = await issueToken(user, 5 * 60 * 1000)
  const target = process.env.ADMIN_API_VERIFY_URL || 'https://serve.giovan.cn/api/admin/menus/all'

  try {
    const response = await requestJson(target, token)
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error(`接口状态异常：${response.statusCode} ${JSON.stringify(response.body).slice(0, 300)}`)
    }

    const menus = flatten(response.body?.data)
    const roleMenu = menus.find((item) => item?.path === '/admin/roles')

    if (!roleMenu) {
      throw new Error('线上 /api/admin/menus/all 未返回 /admin/roles 菜单')
    }

    const actionKeys = Array.isArray(roleMenu.actions)
      ? roleMenu.actions.map((item) => item.key)
      : []
    const missingKeys = expectedActionKeys.filter((key) => !actionKeys.includes(key))

    if (missingKeys.length > 0) {
      throw new Error(`线上 /api/admin/menus/all 角色管理菜单缺少按钮权限：${missingKeys.join(', ')}`)
    }

    console.log(JSON.stringify({
      target,
      menuId: roleMenu._id || roleMenu.id,
      path: roleMenu.path,
      actionKeys,
    }, null, 2))
  } finally {
    await revokeToken(token)
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })
