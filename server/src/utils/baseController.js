const { Response, HttpStatus, HttpError } = require('./response');
const {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  TooManyRequestsError,
  InternalError,
} = require('./errors');

const ERROR_CLASS_MAP = {
  [HttpStatus.BAD_REQUEST]: ValidationError,
  [HttpStatus.UNAUTHORIZED]: UnauthorizedError,
  [HttpStatus.FORBIDDEN]: ForbiddenError,
  [HttpStatus.NOT_FOUND]: NotFoundError,
  [HttpStatus.CONFLICT]: ConflictError,
  [HttpStatus.TOO_MANY_REQUESTS]: TooManyRequestsError,
  [HttpStatus.INTERNAL_ERROR]: InternalError,
};

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
        let status = fallbackStatus;
        if (error instanceof AppError) {
            status = error.status;
        } else if (error instanceof HttpError) {
            status = error.status;
        } else if (error?.status) {
            status = error.status;
        }
        ctx.status = status;
        ctx.body = Response.fromError(error, status);
    }

    throwHttpError(message, status = HttpStatus.BAD_REQUEST, details) {
        const ErrorClass = ERROR_CLASS_MAP[status] || InternalError;
        const error = new ErrorClass(message);
        if (details) error.details = details;
        throw error;
    }
}

module.exports = BaseController;
