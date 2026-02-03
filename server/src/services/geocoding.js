/**
 * 地理编码缓存服务
 * 调用高德 API 进行反向地理编码，并提供缓存
 */
class GeocodingService {
  constructor() {
    this.amapUrl = 'https://restapi.amap.com/v3'
    this.amapKey = process.env.AMAP_KEY
    
    // 缓存，避免重复请求
    this.cache = new Map()
  }

  /**
   * 反向地理编码 - 调用高德 API
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
      const url = new URL(`${this.amapUrl}/geocode/regeo`)
      url.searchParams.append('key', this.amapKey)
      url.searchParams.append('location', `${longitude},${latitude}`) // 高德是 lon,lat 格式
      url.searchParams.append('output', 'json')

      const response = await fetch(url.toString())
      const data = await response.json()

      if (data.status !== '1') {
        console.warn('高德反向地理编码失败:', data.info)
        return null
      }

      const regeocode = data.regeocode
      if (!regeocode) {
        return null
      }

      const geoinfo = {
        displayName: regeocode.formatted_address,
        province: regeocode.addressComponent?.province,
        city: regeocode.addressComponent?.city,
        district: regeocode.addressComponent?.district,
        street: regeocode.addressComponent?.streetNumber?.street,
        streetNumber: regeocode.addressComponent?.streetNumber?.number
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
      console.error('高德反向地理编码失败:', error.message)
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
