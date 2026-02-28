/**
 * 地理编码缓存服务
 * 调用高德 API 进行反向地理编码，并提供缓存
 */
class GeocodingService {
  constructor() {
    this.amapUrl = 'https://restapi.amap.com/v3'
    this.amapKey = process.env.AMAP_KEY
    
    this.cache = new Map()
    this.cacheExpiry = 24 * 60 * 60 * 1000
    this.maxCacheSize = 1000
  }

  _isExpired(cached) {
    return Date.now() - cached.timestamp > this.cacheExpiry
  }

  _cleanupExpired() {
    for (const [key, value] of this.cache.entries()) {
      if (this._isExpired(value)) {
        this.cache.delete(key)
      }
    }
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

    const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`
    
    const cached = this.cache.get(cacheKey)
    if (cached && !this._isExpired(cached)) {
      return cached.data
    }
    
    if (cached) {
      this.cache.delete(cacheKey)
    }

    try {
      const url = new URL(`${this.amapUrl}/geocode/regeo`)
      url.searchParams.append('key', this.amapKey)
      url.searchParams.append('location', `${longitude},${latitude}`)
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

      const rawCity = regeocode.addressComponent?.city
      const city = Array.isArray(rawCity) ? rawCity[0] || null : rawCity || null

      const geoinfo = {
        displayName: regeocode.formatted_address,
        province: regeocode.addressComponent?.province,
        city,
        district: regeocode.addressComponent?.district,
        street: regeocode.addressComponent?.streetNumber?.street,
        streetNumber: regeocode.addressComponent?.streetNumber?.number
      }

      this.cache.set(cacheKey, {
        data: geoinfo,
        timestamp: Date.now()
      })

      if (this.cache.size > this.maxCacheSize) {
        this._cleanupExpired()
        
        if (this.cache.size > this.maxCacheSize) {
          const firstKey = this.cache.keys().next().value
          this.cache.delete(firstKey)
        }
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
