const Share = require('../models/Share')
const FileItem = require('../models/FileItem')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

const generateShareCode = () => {
  return crypto.randomBytes(6).toString('base64url')
}

class ShareController {
  async create(ctx) {
    try {
      const { fileId, password, expiresAt, maxDownloads } = ctx.request.body
      const userId = ctx.state.user._id

      const file = await FileItem.findOne({
        _id: fileId,
        owner: userId,
        isDeleted: false
      })

      if (!file) {
        ctx.status = 404
        ctx.body = {
          success: false,
          message: '文件不存在'
        }
        return
      }

      const shareCode = generateShareCode()
      
      const shareData = {
        shareCode,
        fileId,
        owner: userId,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        maxDownloads: maxDownloads || 0
      }

      if (password && password.trim()) {
        shareData.password = await bcrypt.hash(password.trim(), 10)
      }

      const share = await Share.create(shareData)

      ctx.body = {
        success: true,
        data: {
          shareCode: share.shareCode,
          expiresAt: share.expiresAt,
          hasPassword: !!share.password
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

  async getShare(ctx) {
    try {
      const { shareCode } = ctx.params

      const share = await Share.findOne({
        shareCode,
        isActive: true
      }).populate('fileId')

      if (!share) {
        ctx.status = 404
        ctx.body = {
          success: false,
          message: '分享链接不存在或已过期'
        }
        return
      }

      if (share.expiresAt && new Date() > share.expiresAt) {
        ctx.status = 410
        ctx.body = {
          success: false,
          message: '分享链接已过期'
        }
        return
      }

      if (share.maxDownloads > 0 && share.downloadCount >= share.maxDownloads) {
        ctx.status = 410
        ctx.body = {
          success: false,
          message: '分享链接已达到最大下载次数'
        }
        return
      }

      const file = share.fileId
      if (!file || file.isDeleted) {
        ctx.status = 404
        ctx.body = {
          success: false,
          message: '文件不存在'
        }
        return
      }

      ctx.body = {
        success: true,
        data: {
          shareCode: share.shareCode,
          file: {
            id: file._id,
            name: file.name,
            size: file.size,
            mimeType: file.mimeType
          },
          hasPassword: !!share.password,
          expiresAt: share.expiresAt
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

  async verifyPassword(ctx) {
    try {
      const { shareCode } = ctx.params
      const { password } = ctx.request.body

      const share = await Share.findOne({
        shareCode,
        isActive: true
      })

      if (!share) {
        ctx.status = 404
        ctx.body = {
          success: false,
          message: '分享链接不存在'
        }
        return
      }

      if (!share.password) {
        ctx.body = {
          success: true,
          data: { verified: true }
        }
        return
      }

      if (!password) {
        ctx.status = 400
        ctx.body = {
          success: false,
          message: '请输入密码'
        }
        return
      }

      const isValid = await bcrypt.compare(password, share.password)

      ctx.body = {
        success: true,
        data: { verified: isValid }
      }
    } catch (error) {
      ctx.status = 500
      ctx.body = {
        success: false,
        message: error.message
      }
    }
  }

  async download(ctx) {
    try {
      const { shareCode } = ctx.params
      const { password } = ctx.query

      const share = await Share.findOne({
        shareCode,
        isActive: true
      }).populate('fileId')

      if (!share) {
        ctx.status = 404
        ctx.body = {
          success: false,
          message: '分享链接不存在或已过期'
        }
        return
      }

      if (share.expiresAt && new Date() > share.expiresAt) {
        ctx.status = 410
        ctx.body = {
          success: false,
          message: '分享链接已过期'
        }
        return
      }

      if (share.maxDownloads > 0 && share.downloadCount >= share.maxDownloads) {
        ctx.status = 410
        ctx.body = {
          success: false,
          message: '分享链接已达到最大下载次数'
        }
        return
      }

      if (share.password) {
        if (!password) {
          ctx.status = 401
          ctx.body = {
            success: false,
            message: '需要密码'
          }
          return
        }
        const isValid = await bcrypt.compare(password, share.password)
        if (!isValid) {
          ctx.status = 401
          ctx.body = {
            success: false,
            message: '密码错误'
          }
          return
        }
      }

      const file = share.fileId
      if (!file || file.isDeleted) {
        ctx.status = 404
        ctx.body = {
          success: false,
          message: '文件不存在'
        }
        return
      }

      share.downloadCount += 1
      await share.save()

      const path = require('path')
      const fs = require('fs')
      const fsp = fs.promises
      const baseUploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
      const filePath = path.join(baseUploadDir, 'files', file.storageKey)

      try {
        await fsp.access(filePath)
      } catch {
        ctx.status = 404
        ctx.body = {
          success: false,
          message: '文件不存在'
        }
        return
      }

      ctx.set('Content-Type', file.mimeType || 'application/octet-stream')
      ctx.set('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`)
      ctx.body = fs.createReadStream(filePath)
    } catch (error) {
      ctx.status = 500
      ctx.body = {
        success: false,
        message: error.message
      }
    }
  }

  async list(ctx) {
    try {
      const userId = ctx.state.user._id

      const shares = await Share.find({ owner: userId, isActive: true })
        .populate('fileId', 'name size mimeType type')
        .sort({ createdAt: -1 })

      const data = shares.map(s => ({
        id: s._id,
        shareCode: s.shareCode,
        file: s.fileId,
        hasPassword: !!s.password,
        expiresAt: s.expiresAt,
        downloadCount: s.downloadCount,
        maxDownloads: s.maxDownloads,
        createdAt: s.createdAt
      }))

      ctx.body = {
        success: true,
        data
      }
    } catch (error) {
      ctx.status = 500
      ctx.body = {
        success: false,
        message: error.message
      }
    }
  }

  async delete(ctx) {
    try {
      const { id } = ctx.params
      const userId = ctx.state.user._id

      const share = await Share.findOneAndUpdate(
        { _id: id, owner: userId },
        { isActive: false },
        { new: true }
      )

      if (!share) {
        ctx.status = 404
        ctx.body = {
          success: false,
          message: '分享链接不存在'
        }
        return
      }

      ctx.body = {
        success: true,
        message: '分享链接已删除'
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

module.exports = new ShareController()
