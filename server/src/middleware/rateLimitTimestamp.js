const { Response } = require('../utils/response');

const MAX_MAP_SIZE = 10000;
const CLEANUP_INTERVAL = 60 * 1000;

module.exports = function rateLimitTimestamp(options = {}) {
  const windowMs = options.windowMs || 10 * 1000;
  const max = options.max || 20;
  const header = (options.header || 'x-request-timestamp').toLowerCase();
  const maxSkewMs = options.maxSkewMs || 5 * 60 * 1000;
  const hits = new Map();

  setInterval(() => {
    const now = Date.now();
    for (const [key, list] of hits) {
      const recent = list.filter((t) => now - t < windowMs);
      if (recent.length === 0) {
        hits.delete(key);
      } else {
        hits.set(key, recent);
      }
    }
  }, CLEANUP_INTERVAL);

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

    if (hits.size >= MAX_MAP_SIZE) {
      const oldestKey = hits.keys().next().value;
      if (oldestKey) {
        hits.delete(oldestKey);
      }
    }

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
