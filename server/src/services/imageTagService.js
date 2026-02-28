const AipImageClassifyClient = require('baidu-aip-sdk').imageClassify

const APP_ID = '117186214'
const API_KEY = 'DcsDB1pmg8U5QQvG8OrSjiDM'
const SECRET_KEY = 'cXBYKtEMlKFgJrlB7PT0npQzZxYlF5nn'

const client = new AipImageClassifyClient(APP_ID, API_KEY, SECRET_KEY)

class ImageTagService {
  async getTags(imageBuffer) {
    try {
      const imageBase64 = imageBuffer.toString('base64')
      
      const result = await Promise.race([
        client.advancedGeneral(imageBase64, { BaikeNum: 0 }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('百度API请求超时')), 30000)
        )
      ])
      
      console.log('📊 百度API返回:', JSON.stringify(result, null, 2))
      
      if (result.result && result.result.length > 0) {
        const tags = result.result
          .filter(item => item.score > 0.2)
          .map(item => ({
            keyword: item.keyword,
            score: Math.round(item.score * 100) / 100
          }))
        
        console.log(`🏷️ 图片标签识别成功: ${tags.map(t => t.keyword).join(', ')}`)
        return tags
      }
      
      console.log('⚠️ 百度API返回无结果:', result)
      return []
    } catch (error) {
      console.error('❌ 图片标签识别失败:', error.message)
      return []
    }
  }

  async analyze(imageBuffer) {
    const tags = await this.getTags(imageBuffer)
    
    return {
      tags,
      allKeywords: tags.map(t => t.keyword)
    }
  }
}

module.exports = new ImageTagService()
