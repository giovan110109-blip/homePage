/**
 * 地理编码控制器
 * 使用高德 API 进行地址搜索
 */

const { Response, HttpStatus } = require('../utils/response')

class GeoController {
  /**
   * 地址搜索 - 调用高德 API
   */
  async searchAddress(ctx) {
    try {
      const { address, city } = ctx.query

      if (!address) {
        ctx.status = HttpStatus.BAD_REQUEST
        ctx.body = Response.error('请提供地址信息', HttpStatus.BAD_REQUEST)
        return
      }

      const amapKey = process.env.AMAP_KEY
      if (!amapKey) {
        console.error('❌ 缺少 AMAP_KEY 环境变量')
        ctx.status = HttpStatus.INTERNAL_ERROR
        ctx.body = Response.error('服务配置错误', HttpStatus.INTERNAL_ERROR)
        return
      }

      const url = new URL('https://restapi.amap.com/v3/geocode/geo')
      url.searchParams.append('key', amapKey)
      url.searchParams.append('address', address)
      if (city) {
        url.searchParams.append('city', city)
      }
      url.searchParams.append('output', 'json')

      console.log(`🔍 [GEO] 搜索地址: ${address}${city ? ` (${city})` : ''}`)

      const response = await fetch(url.toString())
      const data = await response.json()

      if (data.status !== '1') {
        console.warn(`⚠️  [GEO] 高德 API 错误: ${data.info}`)
        ctx.status = HttpStatus.BAD_REQUEST
        ctx.body = Response.error(`地址搜索失败: ${data.info}`, HttpStatus.BAD_REQUEST)
        return
      }

      if (!data.geocodes || data.geocodes.length === 0) {
        console.log(`⚠️  [GEO] 未找到地址: ${address}`)
        ctx.status = HttpStatus.OK
        ctx.body = Response.success([], '未找到该地址')
        return
      }

      // 返回所有搜索结果（最多10个）
      const results = data.geocodes.slice(0, 10).map(result => {
        const [lng, lat] = result.location.split(',').map(Number)
        return {
          latitude: lat,
          longitude: lng,
          displayName: result.formatted_address,
          citycode: result.citycode,
          adcode: result.adcode
        }
      })

      console.log(`✅ [GEO] 找到 ${results.length} 个地址匹配`)

      ctx.status = HttpStatus.OK
      ctx.body = Response.success(results, '查询成功')
    } catch (error) {
      console.error('[GEO] ❌ 地址搜索失败:', error.message)
      ctx.status = HttpStatus.INTERNAL_ERROR
      ctx.body = Response.error(error.message || '地址搜索失败', HttpStatus.INTERNAL_ERROR)
    }
  }

  /**
   * 反向地理编码 - 根据坐标查询地址
   */
  async reverseGeocode(ctx) {
    try {
      const { latitude, longitude } = ctx.query

      if (!latitude || !longitude) {
        ctx.status = HttpStatus.BAD_REQUEST
        ctx.body = Response.error('请提供经纬度信息', HttpStatus.BAD_REQUEST)
        return
      }

      const amapKey = process.env.AMAP_KEY
      if (!amapKey) {
        console.error('❌ 缺少 AMAP_KEY 环境变量')
        ctx.status = HttpStatus.INTERNAL_ERROR
        ctx.body = Response.error('服务配置错误', HttpStatus.INTERNAL_ERROR)
        return
      }

      const url = new URL('https://restapi.amap.com/v3/geocode/regeo')
      url.searchParams.append('key', amapKey)
      url.searchParams.append('location', `${longitude},${latitude}`)
      url.searchParams.append('output', 'json')

      console.log(`🔍 [GEO] 反向查询: ${latitude}, ${longitude}`)

      const response = await fetch(url.toString())
      const data = await response.json()

      if (data.status !== '1') {
        console.warn(`⚠️  [GEO] 高德 API 错误: ${data.info}`)
        ctx.status = HttpStatus.BAD_REQUEST
        ctx.body = Response.error(`地址查询失败: ${data.info}`, HttpStatus.BAD_REQUEST)
        return
      }

      const regeocode = data.regeocode
      console.log(`✅ [GEO] 查询到地址: ${regeocode.formatted_address}`)

      ctx.status = HttpStatus.OK
      ctx.body = Response.success(
        {
          displayName: regeocode.formatted_address,
          province: regeocode.addressComponent?.province,
          city: regeocode.addressComponent?.city,
          district: regeocode.addressComponent?.district,
          street: regeocode.addressComponent?.streetNumber?.street,
          streetNumber: regeocode.addressComponent?.streetNumber?.number
        },
        '查询成功'
      )
    } catch (error) {
      console.error('[GEO] ❌ 反向查询失败:', error.message)
      ctx.status = HttpStatus.INTERNAL_ERROR
      ctx.body = Response.error(error.message || '地址查询失败', HttpStatus.INTERNAL_ERROR)
    }
  }
}

module.exports = new GeoController()
