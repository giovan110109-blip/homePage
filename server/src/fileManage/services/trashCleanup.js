const mongoose = require('mongoose')
const FileItem = require('../models/FileItem')
const path = require('path')
const fs = require('fs')
const fsp = fs.promises

const TRASH_EXPIRE_DAYS = 30

const cleanExpiredTrash = async () => {
  try {
    const expireDate = new Date()
    expireDate.setDate(expireDate.getDate() - TRASH_EXPIRE_DAYS)
    
    const expiredItems = await FileItem.find({
      isDeleted: true,
      'trashInfo.deletedAt': { $lt: expireDate }
    })

    console.log(`🗑️ 开始清理 ${expiredItems.length} 个过期回收站项目...`)

    const baseUploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
    const filesDir = path.join(baseUploadDir, 'files')
    const thumbnailDir = path.join(baseUploadDir, 'thumbnails')

    for (const item of expiredItems) {
      try {
        if (item.type === 'file' && item.storageKey) {
          const filePath = path.join(filesDir, item.storageKey)
          await fsp.unlink(filePath).catch(() => {})
        }

        if (item.thumbnailKey) {
          const thumbnailPath = path.join(thumbnailDir, item.thumbnailKey)
          await fsp.unlink(thumbnailPath).catch(() => {})
        }

        await FileItem.deleteOne({ _id: item._id })
        
        console.log(`  ✅ 已永久删除: ${item.name}`)
      } catch (error) {
        console.error(`  ❌ 删除失败: ${item.name}`, error.message)
      }
    }

    console.log(`✅ 回收站清理完成`)
    return { success: true, deletedCount: expiredItems.length }
  } catch (error) {
    console.error('回收站清理失败:', error)
    return { success: false, error: error.message }
  }
}

const startTrashCleanupSchedule = () => {
  const runCleanup = async () => {
    const hour = new Date().getHours()
    if (hour === 3) {
      console.log('⏰ 执行定时回收站清理任务...')
      await cleanExpiredTrash()
    }
  }

  setInterval(runCleanup, 60 * 60 * 1000)
  
  console.log('📅 回收站自动清理任务已启动（每天凌晨3点执行）')
}

module.exports = {
  cleanExpiredTrash,
  startTrashCleanupSchedule,
  TRASH_EXPIRE_DAYS
}
