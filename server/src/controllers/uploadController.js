const fs = require('fs');
const path = require('path');
const fsp = fs.promises;
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
            let file = files.file;
            if (Array.isArray(file)) file = file[0];

            // 兼容不同解析器：优先使用 file.stream，否则尝试从 file.path 创建可读流
            let stream = file.stream;
            if (!stream && file.path) {
                stream = fs.createReadStream(file.path);
            }

            if (!stream) {
                this.throwHttpError('上传的文件流不可用', HttpStatus.BAD_REQUEST);
            }

            let saved = await this.uploader.saveStream(stream, file.name || file.filename || 'unknown');
            // 只返回相对路径，让前端根据自己的 API 基础地址来构建完整 URL
            // 这样无论部署在哪里（localhost、生产服务器、Docker 等）都能正确工作
            this.created(ctx, saved, '上传成功');
        } catch (err) {
            this.fail(ctx, err);
        }
    }

    // DELETE /api/upload/:filename  删除已上传的文件（管理员）
    async delete(ctx) {
        try {
            const filename = ctx.params.filename;
            if (!filename) {
                this.throwHttpError('缺少文件名参数', HttpStatus.BAD_REQUEST);
            }

            // 防止路径穿越
            if (filename.includes('..') || path.isAbsolute(filename)) {
                this.throwHttpError('非法的文件名', HttpStatus.BAD_REQUEST);
            }

            const filePath = path.join(this.uploader.uploadDir, filename);

            try {
                await fsp.access(filePath);
            } catch (err) {
                this.throwHttpError('文件不存在', HttpStatus.NOT_FOUND);
            }

            await fsp.unlink(filePath);

            this.noContent(ctx, '删除成功');
        } catch (err) {
            this.fail(ctx, err);
        }
    }
}

module.exports = new UploadController();
