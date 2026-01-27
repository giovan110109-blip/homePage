const { Response, HttpStatus, HttpError } = require('./response');

// 通用控制器基类，提供统一的响应与错误处理
class BaseController {
    ok(ctx, data = null, message = '', meta) {
        ctx.status = HttpStatus.OK;
        ctx.body = Response.success(data, message, HttpStatus.OK, meta);
    }

    created(ctx, data = null, message = '') {
        ctx.status = HttpStatus.CREATED;
        ctx.body = Response.created(data, message);
    }

    noContent(ctx, message = '') {
        ctx.status = HttpStatus.NO_CONTENT;
        ctx.body = Response.noContent(message);
    }

    paginated(ctx, items = [], pagination = {}, message = '') {
        ctx.status = HttpStatus.OK;
        ctx.body = Response.paginated(items, pagination, message);
    }

    fail(ctx, error, fallbackStatus = HttpStatus.INTERNAL_ERROR) {
        const status = error instanceof HttpError ? error.status : (error?.status || fallbackStatus);
        ctx.status = status;
        ctx.body = Response.fromError(error, status);
    }

    throwHttpError(message, status = HttpStatus.BAD_REQUEST, details) {
        throw new HttpError(message, status, details);
    }
}

module.exports = BaseController;
