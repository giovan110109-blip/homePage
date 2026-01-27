// 全局错误处理中间件
const { Response, HttpStatus } = require('../utils/response');

module.exports = async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        console.error('Unhandled error:', err);
        const status = err.status || HttpStatus.INTERNAL_ERROR;
        ctx.status = status;
        ctx.body = Response.fromError(err, status);
    }
};
