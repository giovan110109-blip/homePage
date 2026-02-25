const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT_MS || '30000');

const timeoutMiddleware = async (ctx, next) => {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      const err = new Error('Request timeout');
      err.status = 504;
      err.code = 'REQUEST_TIMEOUT';
      reject(err);
    }, REQUEST_TIMEOUT);
  });

  try {
    await Promise.race([next(), timeoutPromise]);
  } catch (err) {
    if (err.code === 'REQUEST_TIMEOUT') {
      ctx.status = 504;
      ctx.body = {
        code: 504,
        message: '请求超时',
        data: null
      };
    } else {
      throw err;
    }
  }
};

module.exports = timeoutMiddleware;
