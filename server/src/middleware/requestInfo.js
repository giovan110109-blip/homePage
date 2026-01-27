// 将请求信息附加到 ctx.state.clientInfo，方便后续使用
const { getClientInfo } = require('../utils/requestInfo');

module.exports = async (ctx, next) => {
    ctx.state.clientInfo = getClientInfo(ctx);
    await next();
};
