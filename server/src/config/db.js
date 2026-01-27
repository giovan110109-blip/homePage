const mongoose = require('mongoose');

const connectDB = async () => {
    if (process.env.SKIP_DB === '1' || process.env.SKIP_DB === 'true') {
        console.log('Skipping MongoDB connection because SKIP_DB is set');
        return;
    }

    try {
        // 优先使用完整连接串 MONGODB_URI
        let uri = process.env.MONGODB_URI;

        if (!uri) {
            const required = [
                'MONGODB_USERNAME',
                'MONGODB_PASSWORD',
                'MONGODB_HOST',
                'MONGODB_PORT',
                'MONGODB_DATABASE',
            ];
            const missing = required.filter((k) => !process.env[k]);
            if (missing.length) {
                throw new Error(`Missing Mongo env vars: ${missing.join(', ')}`);
            }

            const username = process.env.MONGODB_USERNAME;
            const password = encodeURIComponent(process.env.MONGODB_PASSWORD);
            const host = process.env.MONGODB_HOST;
            const port = process.env.MONGODB_PORT;
            const db = process.env.MONGODB_DATABASE;
            const authSource = process.env.MONGODB_AUTH_SOURCE || 'admin';

            uri = `mongodb://${username}:${password}@${host}:${port}/${db}?authSource=${authSource}`;
        }

        const conn = await mongoose.connect(uri);
        console.log(`MongoDB 已连接: ${conn.connection.host}`);

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB 连接错误:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB 连接断开');
        });
    } catch (error) {
        console.error('MongoDB 连接失败:', error);
        // 生产环境建议退出；如需开发不中断，可设置 SKIP_DB=true
        process.exit(1);
    }
};

module.exports = connectDB;