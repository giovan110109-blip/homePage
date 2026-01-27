const BaseController = require('../utils/baseController');
const { HttpStatus } = require('../utils/response');
const HttpClient = require('../utils/httpClient');

// 示例：演示如何用 HttpClient 访问外部接口（jsonplaceholder）
class HttpClientDemoController extends BaseController {
    // GET /api/http-demo/posts
    async listPosts(ctx) {
        try {
            const data = await HttpClient.get('https://jsonplaceholder.typicode.com/posts', {
                params: { _limit: 5 }
            });
            this.ok(ctx, data, 'Fetched external posts');
        } catch (err) {
            this.fail(ctx, err, HttpStatus.BAD_GATEWAY);
        }
    }

    // GET /api/http-demo/posts/:id
    async postDetail(ctx) {
        try {
            const { id } = ctx.params;
            const data = await HttpClient.get(`https://jsonplaceholder.typicode.com/posts/${id}`);
            if (!data) this.throwHttpError('Post not found', HttpStatus.NOT_FOUND);
            this.ok(ctx, data, 'Fetched external post detail');
        } catch (err) {
            this.fail(ctx, err, HttpStatus.BAD_GATEWAY);
        }
    }
}

module.exports = new HttpClientDemoController();
