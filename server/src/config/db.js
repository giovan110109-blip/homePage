const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
    if (process.env.SKIP_DB === '1' || process.env.SKIP_DB === 'true') {
        logger.info('Skipping MongoDB connection because SKIP_DB is set');
        return;
    }

    try {
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

        const conn = await mongoose.connect(uri, {
            maxPoolSize: 10,
            minPoolSize: 2,
            socketTimeoutMS: 30000,
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 15000,
            maxIdleTimeMS: 60000,
            heartbeatFrequencyMS: 10000,
            retryWrites: true,
            retryReads: true,
        });
        logger.info(`MongoDB 已连接: ${conn.connection.host}`);

        mongoose.connection.on('error', (err) => {
            logger.error('MongoDB 连接错误:', err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB 连接断开，尝试重连...');
        });

        mongoose.connection.on('reconnected', () => {
            logger.info('MongoDB 已重连');
        });
    } catch (error) {
        logger.error('MongoDB 连接失败:', error);
        process.exit(1);
    }
};

module.exports = connectDB;