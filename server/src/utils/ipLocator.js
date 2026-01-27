const HttpClient = require('./httpClient');

// 判断是否为私网 IP
function isPrivateIp(ip) {
    if (!ip) return true;
    return /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|127\.|::1)/.test(ip);
}

async function getLocationByIp(ip) {
    if (!ip || isPrivateIp(ip)) return null;
    try {
        // 使用公共免费接口 ipapi.co
        const data = await HttpClient.get(`https://ipapi.co/${ip}/json/`);
        if (!data || data.error) return null;
        return {
            city: data.city,
            region: data.region,
            country: data.country_name,
            countryCode: data.country,
            isp: data.org,
            org: data.org,
            lat: data.latitude,
            lon: data.longitude
        };
    } catch (err) {
        return null;
    }
}

module.exports = { getLocationByIp };
