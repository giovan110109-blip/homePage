const accessLogService = require('../services/accessLogService');
const { getLocationByIp } = require('../utils/ipLocator');

const shouldSkip = (ctx) => {
  const path = ctx.path || '';
  if (path === '/api/access-logs/ping') return false;
  return path.startsWith('/api');
};

module.exports = async (ctx, next) => {
  if (shouldSkip(ctx)) {
    await next();
    return;
  }

  const client = ctx.state.clientInfo || {};
  const start = Date.now();
  await next();
  const duration = Date.now() - start;

  try {
    const location = await getLocationByIp(client.ip);
    await accessLogService.create({
      ip: client.ip,
      path: client.path,
      method: client.method,
      status: ctx.status,
      duration,
      userAgent: client.userAgent,
      browser: client.browser,
      os: client.os,
      deviceType: client.deviceType,
      referer: client.referer,
      language: client.language,
      location,
    });
  } catch (err) {
    // ignore logging errors
  }
};
