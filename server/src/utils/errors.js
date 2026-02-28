class AppError extends Error {
  constructor(message, code = 500, status = 500) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(message = '资源不存在') {
    super(message, 404, 404);
  }
}

class ValidationError extends AppError {
  constructor(message = '参数验证失败') {
    super(message, 400, 400);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = '未授权，请先登录') {
    super(message, 401, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = '无权访问') {
    super(message, 403, 403);
  }
}

class ConflictError extends AppError {
  constructor(message = '资源冲突') {
    super(message, 409, 409);
  }
}

class TooManyRequestsError extends AppError {
  constructor(message = '请求过于频繁，请稍后重试') {
    super(message, 429, 429);
  }
}

class InternalError extends AppError {
  constructor(message = '服务器内部错误') {
    super(message, 500, 500);
  }
}

class ServiceUnavailableError extends AppError {
  constructor(message = '服务暂时不可用') {
    super(message, 503, 503);
  }
}

module.exports = {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  TooManyRequestsError,
  InternalError,
  ServiceUnavailableError,
};
