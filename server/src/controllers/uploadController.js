const BaseController = require('../utils/baseController');
const Uploader = require('../utils/uploader');
const { HttpStatus } = require('../utils/response');

class UploadController extends BaseController {
    constructor() {
        super();
        this.uploader = new Uploader();
    }

    // POST /api/upload  (multipart/form-data, field name: file)
    async upload(ctx) {
        try {
            const files = ctx.request.files;
            if (!files || !files.file) {
                this.throwHttpError('未找到上传文件字段 file', HttpStatus.BAD_REQUEST);
            }
            const file = files.file;
            const saved = await this.uploader.saveStream(file.stream, file.name);
            this.created(ctx, saved, '上传成功');
        } catch (err) {
            this.fail(ctx, err);
        }
    }
}

module.exports = new UploadController();
