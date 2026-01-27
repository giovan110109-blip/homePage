const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const crypto = require('crypto');

/**
 * 简单上传基类
 * - 目录与访问前缀可通过环境变量配置：
 *   UPLOAD_DIR: 本地保存目录（默认 uploads）
 *   UPLOAD_BASE_URL: 对外访问前缀（默认 /uploads）
 */
class Uploader {
    constructor(options = {}) {
        this.uploadDir = options.uploadDir || process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
        this.baseUrl = options.baseUrl || process.env.UPLOAD_BASE_URL || '/uploads';
    }

    async ensureDir() {
        await fsp.mkdir(this.uploadDir, { recursive: true });
    }

    generateFilename(originalName = '') {
        const ext = path.extname(originalName) || '';
        const name = crypto.randomBytes(8).toString('hex');
        return `${Date.now()}-${name}${ext}`;
    }

    buildPublicUrl(filename) {
        // 确保前缀有且仅有一个斜杠分隔
        return `${this.baseUrl.replace(/\/$/, '')}/${filename}`;
    }

    /**
        * 保存 Buffer
        * @param {Buffer} buffer 文件内容
        * @param {string} originalName 原始文件名（用于保留扩展名）
        */
    async saveBuffer(buffer, originalName) {
        await this.ensureDir();
        const filename = this.generateFilename(originalName);
        const filePath = path.join(this.uploadDir, filename);
        await fsp.writeFile(filePath, buffer);
        return {
            filename,
            path: filePath,
            url: this.buildPublicUrl(filename)
        };
    }

    /**
        * 保存可读流（适用于 koa-body 上传的 file.stream）
        * @param {Readable} stream 文件流
        * @param {string} originalName 原始文件名
        */
    async saveStream(stream, originalName) {
        await this.ensureDir();
        const filename = this.generateFilename(originalName);
        const filePath = path.join(this.uploadDir, filename);

        await new Promise((resolve, reject) => {
            const write = fs.createWriteStream(filePath);
            stream.pipe(write);
            stream.on('error', reject);
            write.on('error', reject);
            write.on('finish', resolve);
        });

        return {
            filename,
            path: filePath,
            url: this.buildPublicUrl(filename)
        };
    }
}

module.exports = Uploader;