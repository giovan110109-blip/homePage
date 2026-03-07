const OperationLog = require('../models/OperationLog')

const actionLabels = {
  upload: '上传文件',
  download: '下载文件',
  delete: '删除',
  rename: '重命名',
  move: '移动',
  copy: '复制',
  create_folder: '创建文件夹',
  share: '分享',
  favorite: '收藏',
  login: '登录',
  logout: '退出登录'
}

const logOperation = async ({ userId, action, resourceType = 'file', resourceId = null, resourceName = null, details = null, ip = null, userAgent = null }) => {
  try {
    await OperationLog.create({
      user: userId,
      action,
      resourceType,
      resourceId,
      resourceName,
      details,
      ip,
      userAgent
    })
  } catch (error) {
    console.error('记录操作日志失败:', error)
  }
}

const logFromContext = async (ctx, { action, resourceType = 'file', resourceId = null, resourceName = null, details = null }) => {
  const userId = ctx.state.user?._id
  if (!userId) return

  const ip = ctx.ip || ctx.get('x-forwarded-for') || ctx.get('x-real-ip')
  const userAgent = ctx.get('user-agent')

  await logOperation({
    userId,
    action,
    resourceType,
    resourceId,
    resourceName,
    details,
    ip,
    userAgent
  })
}

module.exports = {
  logOperation,
  logFromContext,
  actionLabels
}
