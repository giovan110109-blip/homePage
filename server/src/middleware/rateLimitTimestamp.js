const { Response } = require('../utils/response');

// 基于时间戳的限流中间件（单实例内存版）
// options: { windowMs, max, header, maxSkewMs }
module.exports = function rateLimitTimestamp(options = {}) {
  const windowMs = options.windowMs || 10 * 1000; // 10秒窗口
  const max = options.max || 20; // 窗口内最多请求数
  const header = (options.header || 'x-request-timestamp').toLowerCase();
  const maxSkewMs = options.maxSkewMs || 5 * 60 * 1000; // 允许客户端时钟偏差
  const hits = new Map();

  return async (ctx, next) => {
    const url = ctx.request.url || ctx.url || '';
    if (url.includes('/upload') || url.includes('/generate-qr-code')) {
      return await next();
    }
    const now = Date.now();
    const tsRaw = ctx.get(header);
    const ts = Number(tsRaw);

    if (!Number.isFinite(ts)) {
      ctx.status = 400;
      ctx.body = Response.error('无效时间戳', 400);
      return;
    }

    if (Math.abs(now - ts) > maxSkewMs) {
      ctx.status = 400;
      ctx.body = Response.error('时间戳偏差过大', 400);
      return;
    }

    const key = `${ctx.ip || ctx.request.ip || 'unknown'}:${ctx.path}`;
    const list = hits.get(key) || [];
    const recent = list.filter((t) => now - t < windowMs);
    recent.push(now);
    hits.set(key, recent);

    if (recent.length > max) {
      ctx.status = 429;
      ctx.set('Retry-After', String(Math.ceil(windowMs / 1000)));
      ctx.body = Response.error('请求过于频繁，请稍后再试', 429);
      return;
    }

    await next();
  };
};