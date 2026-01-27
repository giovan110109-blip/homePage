// 提取请求方信息（IP、UA 等）
function getClientIp(ctx) {
    const forwarded = ctx.get('x-forwarded-for');
    if (forwarded) {
        const list = forwarded.split(',').map(ip => ip.trim()).filter(Boolean);
        if (list.length) return list[0];
    }
    return ctx.ip || ctx.request.ip || null;
}

function parseUserAgent(ua = '') {
    const uaLower = ua.toLowerCase();
    let browser = 'unknown';
    if (uaLower.includes('edg/')) browser = 'edge';
    else if (uaLower.includes('chrome')) browser = 'chrome';
    else if (uaLower.includes('safari')) browser = 'safari';
    else if (uaLower.includes('firefox')) browser = 'firefox';

    let os = 'unknown';
    if (uaLower.includes('windows')) os = 'windows';
    else if (uaLower.includes('mac os') || uaLower.includes('macintosh')) os = 'macos';
    else if (uaLower.includes('android')) os = 'android';
    else if (uaLower.includes('iphone') || uaLower.includes('ipad') || uaLower.includes('ios')) os = 'ios';
    else if (uaLower.includes('linux')) os = 'linux';

    const deviceType = /mobile|android|iphone|ipad/i.test(ua) ? 'mobile' : 'desktop';

    return { browser, os, deviceType };
}

function getClientInfo(ctx) {
    const ua = ctx.get('user-agent') || '';
    const ip = getClientIp(ctx);
    const uaInfo = parseUserAgent(ua);

    return {
        ip,
        ips: ctx.ips || [],
        userAgent: ua,
        browser: uaInfo.browser,
        os: uaInfo.os,
        deviceType: uaInfo.deviceType,
        referer: ctx.get('referer') || ctx.get('referrer') || '',
        language: ctx.get('accept-language') || '',
        method: ctx.method,
        path: ctx.path
    };
}

module.exports = { getClientInfo, parseUserAgent, getClientIp };
