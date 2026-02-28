const HttpStatus = {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    REQUEST_TIMEOUT: 408,
    CONFLICT: 409,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_ERROR: 500,
    NOT_IMPLEMENTED: 501,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504
};

// 响应消息
const HttpMessage = {
    [HttpStatus.OK]: '服务器成功返回请求的数据',
    [HttpStatus.CREATED]: '新建或修改数据成功',
    [HttpStatus.ACCEPTED]: '请求已进入后台排队',
    [HttpStatus.NO_CONTENT]: '删除数据成功',
    [HttpStatus.BAD_REQUEST]: '请求错误',
    [HttpStatus.UNAUTHORIZED]: '未授权，请重新登录',
    [HttpStatus.FORBIDDEN]: '拒绝访问',
    [HttpStatus.NOT_FOUND]: '请求的资源不存在',
    [HttpStatus.REQUEST_TIMEOUT]: '请求超时',
    [HttpStatus.INTERNAL_ERROR]: '服务器内部错误',
    [HttpStatus.NOT_IMPLEMENTED]: '服务未实现',
    [HttpStatus.BAD_GATEWAY]: '网关错误',
    [HttpStatus.SERVICE_UNAVAILABLE]: '服务不可用',
    [HttpStatus.GATEWAY_TIMEOUT]: '网关超时'
};

// 标准化的可抛出 HTTP 错误
class HttpError extends Error {
    constructor(message, status = HttpStatus.INTERNAL_ERROR, details) {
        super(message);
        this.name = 'HttpError';
        this.status = status;
        this.details = details;
    }
}

class Response {
    static success(data = null, message = '', code = HttpStatus.OK, meta) {
        // 如果第一个参数是字符串，说明它是消息
        if (typeof data === 'string') {
            return {
                code: message || HttpStatus.OK, // 第二个参数是状态码
                data: null,
                message: data, // 第一个参数是消息
                success: true
            };
        }

        const body = {
            code,
            data,
            message: message || HttpMessage[code],
            success: true
        };

        if (meta !== undefined) {
            body.meta = meta;
        }

        return body;
    }

    static paginated(items = [], pagination = {}, message = '', code = HttpStatus.OK) {
        const page = Number(pagination.page || pagination.current || 1);
        const pageSize = Number(pagination.pageSize || pagination.limit || items.length || 0);
        const total = Number(pagination.total || items.length || 0);
        const pageCount = Number(pagination.pageCount || (pageSize ? Math.ceil(total / pageSize) : 0));

        return Response.success(items, message || HttpMessage[code], code, {
            page,
            pageSize,
            total,
            pageCount
        });
    }

    static created(data = null, message = '') {
        return {
            code: HttpStatus.CREATED,
            data,
            message: message || HttpMessage[HttpStatus.CREATED],
            success: true
        };
    }

    static noContent(message = '') {
        return {
            code: HttpStatus.NO_CONTENT,
            data: null,
            message: message || HttpMessage[HttpStatus.NO_CONTENT],
            success: true
        };
    }

    static error(message = '', code = HttpStatus.INTERNAL_ERROR, details) {
        const body = {
            code,
            data: null,
            message: message || HttpMessage[code],
            success: false
        };

        if (details !== undefined) {
            body.details = details;
        }

        return body;
    }

    static fromError(error, fallbackCode = HttpStatus.INTERNAL_ERROR) {
        if (error instanceof HttpError) {
            return Response.error(error.message, error.status, error.details);
        }

        const status = error.status || error.code || fallbackCode;
        const message = error.message || HttpMessage[status] || HttpMessage[fallbackCode];
        const details = error.details || error.data;

        return Response.error(message, status, details);
    }
}

module.exports = { Response, HttpStatus, HttpMessage, HttpError }; 