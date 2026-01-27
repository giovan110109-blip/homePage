// 简单的内存限流中间件（演示用，单实例有效）
// options: { windowMs, max }
module.exports = function rateLimitMemory(options = {}) {
    const windowMs = options.windowMs || 60 * 1000; // default 1 minute
    const max = options.max || 60; // default 60 requests per window
    const hits = new Map();

    return async (ctx, next) => {
        const now = Date.now();
        const key = ctx.ip || ctx.request.ip || 'unknown';
        const record = hits.get(key) || { count: 0, start: now };

        // reset window if expired
        if (now - record.start >= windowMs) {
            record.count = 0;
            record.start = now;
        }

        record.count += 1;
        hits.set(key, record);

        if (record.count > max) {
            ctx.status = 429;
            ctx.body = {
                code: 429,
                success: false,
                message: 'Too many requests, please try again later.'
            };
            return;
        }

        await next();
    };
};
