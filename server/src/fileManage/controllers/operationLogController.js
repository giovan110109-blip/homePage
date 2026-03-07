const OperationLog = require('../models/OperationLog')
const mongoose = require('mongoose')

class OperationLogController {
  async list(ctx) {
    try {
      const userId = ctx.state.user._id
      const { page = 1, pageSize = 50, action, startDate, endDate } = ctx.query

      const query = { user: userId }

      if (action && action !== 'all') {
        query.action = action
      }

      if (startDate || endDate) {
        query.createdAt = {}
        if (startDate) {
          query.createdAt.$gte = new Date(startDate)
        }
        if (endDate) {
          query.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z')
        }
      }

      const skip = (parseInt(page) - 1) * parseInt(pageSize)
      const limit = parseInt(pageSize)

      const [logs, total] = await Promise.all([
        OperationLog.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        OperationLog.countDocuments(query)
      ])

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

      const data = logs.map(log => ({
        id: log._id,
        action: log.action,
        actionLabel: actionLabels[log.action] || log.action,
        resourceType: log.resourceType,
        resourceName: log.resourceName,
        details: log.details,
        ip: log.ip,
        createdAt: log.createdAt
      }))

      ctx.body = {
        success: true,
        data: {
          logs: data,
          total,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalPages: Math.ceil(total / parseInt(pageSize))
        }
      }
    } catch (error) {
      ctx.status = 500
      ctx.body = {
        success: false,
        message: error.message
      }
    }
  }

  async stats(ctx) {
    try {
      const userId = ctx.state.user._id
      const { days = 7 } = ctx.query

      const startDate = new Date()
      startDate.setDate(startDate.getDate() - parseInt(days))
      startDate.setHours(0, 0, 0, 0)

      const stats = await OperationLog.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              action: '$action',
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.action',
            dailyStats: {
              $push: {
                date: '$_id.date',
                count: '$count'
              }
            },
            totalCount: { $sum: '$count' }
          }
        }
      ])

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

      const result = stats.map(s => ({
        action: s._id,
        actionLabel: actionLabels[s._id] || s._id,
        totalCount: s.totalCount,
        dailyStats: s.dailyStats.sort((a, b) => a.date.localeCompare(b.date))
      }))

      ctx.body = {
        success: true,
        data: result
      }
    } catch (error) {
      ctx.status = 500
      ctx.body = {
        success: false,
        message: error.message
      }
    }
  }
}

module.exports = new OperationLogController()
