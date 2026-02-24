/**
 * 重新生成所有照片的 thumbnailUrl
 * 将 thumbnailHash (base64) 转换为 data URL
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') })
const mongoose = require('mongoose')
const Photo = require('../models/photo')
const imageProcessing = require('../services/imageProcessing')

async function main() {
  console.log('🚀 开始重新生成所有照片的 thumbnailUrl...\n')
  
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/homepage')
  console.log('✅ 数据库连接成功\n')

  const photos = await Photo.find({
    thumbnailHash: { $exists: true, $ne: null }
  })

  console.log(`📊 找到 ${photos.length} 张需要处理的照片\n`)

  let successCount = 0
  let failCount = 0

  for (const photo of photos) {
    try {
      console.log(`处理: ${photo.originalFileName} (${photo._id})`)
      
      const thumbHashDataURL = await imageProcessing.thumbHashToDataURL(photo.thumbnailHash)
      
      if (thumbHashDataURL) {
        photo.thumbnailUrl = thumbHashDataURL
        await photo.save()
        console.log(`  ✅ 成功更新 thumbnailUrl`)
        successCount++
      } else {
        console.log(`  ⚠️ 转换失败，跳过`)
        failCount++
      }
    } catch (error) {
      console.error(`  ❌ 处理失败: ${error.message}`)
      failCount++
    }
  }

  console.log('\n📈 处理完成!')
  console.log(`  成功: ${successCount}`)
  console.log(`  失败: ${failCount}`)

  await mongoose.disconnect()
  console.log('\n👋 数据库连接已关闭')
}

main().catch(console.error)
