const AipImageClassifyClient = require('baidu-aip-sdk').imageClassify

const APP_ID = '117186214'
const API_KEY = 'DcsDB1pmg8U5QQvG8OrSjiDM'
const SECRET_KEY = 'cXBYKtEMlKFgJrlB7PT0npQzZxYlF5nn'

const client = new AipImageClassifyClient(APP_ID, API_KEY, SECRET_KEY)

class ImageTagService {
  async getTags(imageBuffer) {
    try {
      const result = await client.advancedGeneral(imageBuffer, {
        BaikeNum: 0
      })
      
      if (result.result && result.result.length > 0) {
        const tags = result.result
          .filter(item => item.score > 0.3)
          .map(item => ({
            keyword: item.keyword,
            score: Math.round(item.score * 100) / 100
          }))
        
        console.log(`🏷️ 图片标签识别成功: ${tags.map(t => t.keyword).join(', ')}`)
        return tags
      }
      
      return []
    } catch (error) {
      console.error('❌ 图片标签识别失败:', error.message)
      return []
    }
  }

  async getScene(imageBuffer) {
    try {
      const result = await client.sceneAdvancedClassify(imageBuffer)
      
      if (result.result && result.result.length > 0) {
        const scenes = result.result
          .filter(item => item.score > 0.3)
          .map(item => ({
            scene: item.keyword,
            score: Math.round(item.score * 100) / 100
          }))
        
        console.log(`🏞️ 场景识别成功: ${scenes.map(s => s.scene).join(', ')}`)
        return scenes
      }
      
      return []
    } catch (error) {
      console.error('❌ 场景识别失败:', error.message)
      return []
    }
  }

  async analyze(imageBuffer) {
    const [tags, scenes] = await Promise.all([
      this.getTags(imageBuffer),
      this.getScene(imageBuffer)
    ])
    
    return {
      tags,
      scenes,
      allKeywords: [
        ...tags.map(t => t.keyword),
        ...scenes.map(s => s.scene)
      ].filter((v, i, a) => a.indexOf(v) === i)
    }
  }
}

module.exports = new ImageTagService()
