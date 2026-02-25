const BaseController = require('../utils/baseController');
const { HttpStatus } = require('../utils/response');

class GeoController extends BaseController {
  async searchAddress(ctx) {
    try {
      const { address, city } = ctx.query;

      if (!address) {
        this.throwHttpError('请提供地址信息', HttpStatus.BAD_REQUEST);
      }

      const amapKey = process.env.AMAP_KEY;
      if (!amapKey) {
        console.error('❌ 缺少 AMAP_KEY 环境变量');
        this.throwHttpError('服务配置错误', HttpStatus.INTERNAL_ERROR);
      }

      const url = new URL('https://restapi.amap.com/v3/geocode/geo');
      url.searchParams.append('key', amapKey);
      url.searchParams.append('address', address);
      if (city) {
        url.searchParams.append('city', city);
      }
      url.searchParams.append('output', 'json');

      console.log(`🔍 [GEO] 搜索地址: ${address}${city ? ` (${city})` : ''}`);

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.status !== '1') {
        console.warn(`⚠️  [GEO] 高德 API 错误: ${data.info}`);
        this.throwHttpError(`地址搜索失败: ${data.info}`, HttpStatus.BAD_REQUEST);
      }

      if (!data.geocodes || data.geocodes.length === 0) {
        console.log(`⚠️  [GEO] 未找到地址: ${address}`);
        this.ok(ctx, [], '未找到该地址');
        return;
      }

      const results = data.geocodes.slice(0, 10).map(result => {
        const [lng, lat] = result.location.split(',').map(Number);
        return {
          latitude: lat,
          longitude: lng,
          displayName: result.formatted_address,
          citycode: result.citycode,
          adcode: result.adcode
        };
      });

      console.log(`✅ [GEO] 找到 ${results.length} 个地址匹配`);

      this.ok(ctx, results, '查询成功');
    } catch (error) {
      console.error('[GEO] ❌ 地址搜索失败:', error.message);
      this.fail(ctx, error);
    }
  }

  async reverseGeocode(ctx) {
    try {
      const { latitude, longitude } = ctx.query;

      if (!latitude || !longitude) {
        this.throwHttpError('请提供经纬度信息', HttpStatus.BAD_REQUEST);
      }

      const amapKey = process.env.AMAP_KEY;
      if (!amapKey) {
        console.error('❌ 缺少 AMAP_KEY 环境变量');
        this.throwHttpError('服务配置错误', HttpStatus.INTERNAL_ERROR);
      }

      const url = new URL('https://restapi.amap.com/v3/geocode/regeo');
      url.searchParams.append('key', amapKey);
      url.searchParams.append('location', `${longitude},${latitude}`);
      url.searchParams.append('output', 'json');

      console.log(`🔍 [GEO] 反向查询: ${latitude}, ${longitude}`);

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.status !== '1') {
        console.warn(`⚠️  [GEO] 高德 API 错误: ${data.info}`);
        this.throwHttpError(`地址查询失败: ${data.info}`, HttpStatus.BAD_REQUEST);
      }

      const regeocode = data.regeocode;
      console.log(`✅ [GEO] 查询到地址: ${regeocode.formatted_address}`);

      this.ok(ctx, {
        displayName: regeocode.formatted_address,
        province: regeocode.addressComponent?.province,
        city: regeocode.addressComponent?.city,
        district: regeocode.addressComponent?.district,
        street: regeocode.addressComponent?.streetNumber?.street,
        streetNumber: regeocode.addressComponent?.streetNumber?.number
      }, '查询成功');
    } catch (error) {
      console.error('[GEO] ❌ 反向查询失败:', error.message);
      this.fail(ctx, error);
    }
  }
}

module.exports = new GeoController();
