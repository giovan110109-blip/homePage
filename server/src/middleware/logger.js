// 简单请求日志中间件：记录方法、路径、耗时
module.exports = async (ctx, next) => {
    const start = Date.now();
    await next();
    const cost = Date.now() - start;
    console.log(`[REQ] ${ctx.method} ${ctx.path} - ${ctx.status || 0} - ${cost}ms`);
};
