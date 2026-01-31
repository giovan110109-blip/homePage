/**
 * 数据库迁移脚本：为现有照片添加 sort 字段
 * 
 * 运行方式：node src/scripts/migratePhotoSort.js
 */

const mongoose = require('mongoose')
const Photo = require('../models/photo')
const dbConfig = require('../config/db')

async function migratePhotoSort() {
  try {
    console.log('🔌 连接数据库...')
    await mongoose.connect(dbConfig.url)
    console.log('✅ 数据库连接成功')

    // 获取所有没有 sort 字段的照片，按创建时间排序
    const photos = await Photo.find({ 
      $or: [
        { sort: { $exists: false } },
        { sort: 0 }
      ]
    }).sort({ createdAt: 1 })

    console.log(`📸 找到 ${photos.length} 张需要迁移的照片`)

    if (photos.length === 0) {
      console.log('✨ 所有照片已经有 sort 字段，无需迁移')
      return
    }

    // 获取当前最大的 sort 值
    const maxSortPhoto = await Photo.findOne({ sort: { $gt: 0 } }).sort({ sort: -1 }).select('sort')
    let currentSort = maxSortPhoto?.sort || 0

    console.log(`📊 当前最大 sort 值: ${currentSort}`)
    console.log('🔄 开始迁移...')

    let count = 0
    for (const photo of photos) {
      currentSort++
      await Photo.updateOne(
        { _id: photo._id },
        { $set: { sort: currentSort } }
      )
      count++
      
      if (count % 100 === 0) {
        console.log(`  已处理 ${count}/${photos.length}`)
      }
    }

    console.log(`✅ 迁移完成！共更新 ${count} 张照片`)
    console.log(`📈 sort 范围: ${(maxSortPhoto?.sort || 0) + 1} - ${currentSort}`)

  } catch (error) {
    console.error('❌ 迁移失败:', error)
    throw error
  } finally {
    await mongoose.connection.close()
    console.log('👋 数据库连接已关闭')
  }
}

// 执行迁移
migratePhotoSort()
  .then(() => {
    console.log('🎉 脚本执行成功')
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 脚本执行失败:', error)
    process.exit(1)
  })
