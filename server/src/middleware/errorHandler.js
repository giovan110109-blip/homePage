// 全局错误处理中间件
const { Response, HttpStatus, HttpError } = require("../utils/response");
const { AppError } = require("../utils/errors");
const logger = require("../utils/logger");

const ERROR_MESSAGES = {
  400: "请求参数错误",
  401: "未授权，请先登录",
  403: "无权访问",
  404: "资源不存在",
  409: "资源冲突",
  429: "请求过于频繁",
  500: "服务器内部错误",
  503: "服务暂时不可用",
};

module.exports = async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    let status = err.status || err.code || HttpStatus.INTERNAL_ERROR;
    let message = err.message || ERROR_MESSAGES[status] || "未知错误";

    if (err instanceof AppError) {
      status = err.status;
      message = err.message;
      logger.warn(`[${err.name}] ${message}`);
    } else if (err instanceof HttpError) {
      logger.warn(`[HttpError] ${message}`);
    } else {
      logger.error("Unhandled error:", err);
    }

    ctx.status = status;
    ctx.body = Response.fromError(err, status);
  }
};
