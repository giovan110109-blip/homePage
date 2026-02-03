const axios = require('axios')

/**
 * 地理编码服务
 * 支持反向地理编码（经纬度转地址）
 */
class GeocodingService {
  constructor() {
    // 使用 Nominatim (OpenStreetMap) 免费API
    // 生产环境建议使用 Mapbox 或 Google Maps
    this.nominatimUrl = 'https://nominatim.openstreetmap.org'
    this.userAgent = 'HomePage-Gallery/1.0'
    
    // 缓存，避免重复请求
    this.cache = new Map()
  }

  /**
   * 反向地理编码
   * @param {number} latitude 纬度
   * @param {number} longitude 经度
   * @returns {Promise<Object|null>} 地理信息对象
   */
  async reverseGeocode(latitude, longitude) {
    if (!latitude || !longitude) {
      return null
    }

    // 检查缓存（精确到小数点后4位，约11米精度）
    const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    try {
      const response = await axios.get(`${this.nominatimUrl}/reverse`, {
        params: {
          lat: latitude,
          lon: longitude,
          format: 'json',
          addressdetails: 1,
          'accept-language': 'zh-CN,en'
        },
        headers: {
          'User-Agent': this.userAgent
        },
        timeout: 30000 // 增加到 30 秒
      })

      const { address, display_name } = response.data

      const geoinfo = {
        country: address.country || null,
        countryCode: address.country_code ? address.country_code.toUpperCase() : null,
        region: address.state || address.province || address.region || null,
        city: address.city || address.town || address.village || address.county || null,
        locationName: display_name || null,
        formatted: display_name || null
      }

      // 缓存结果
      this.cache.set(cacheKey, geoinfo)

      // 限制缓存大小
      if (this.cache.size > 1000) {
        const firstKey = this.cache.keys().next().value
        this.cache.delete(firstKey)
      }

      return geoinfo
    } catch (error) {
      console.error('反向地理编码失败:', error.message)
      return null
    }
  }

  /**
   * 清空缓存
   */
  clearCache() {
    this.cache.clear()
  }
}

module.exports = new GeocodingService()
