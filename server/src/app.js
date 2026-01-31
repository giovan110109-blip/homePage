// 优先加载仓库根 .env，其次回退到 server/.env，最后默认加载环境
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

(() => {
  const rootEnv = path.resolve(__dirname, '../../.env');
  const serverEnv = path.resolve(__dirname, '../.env');
  if (fs.existsSync(rootEnv)) {
    dotenv.config({ path: rootEnv });
    console.log('Loaded env from project root .env');
    return;
  }
  if (fs.existsSync(serverEnv)) {
    dotenv.config({ path: serverEnv });
    console.log('Loaded env from server/.env');
    return;
  }
  dotenv.config();
  console.log('Loaded env from process environment');
})();

const Koa = require('koa');
const koaBody = require('koa-body');
const cors = require('@koa/cors');
const koaStatic = require('koa-static');
const mount = require('koa-mount');
const mongoose = require('mongoose');
const registerRoutes = require('./routes');
const connectDB = require('./config/db');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const requestInfo = require('./middleware/requestInfo');
const rateLimitTimestamp = require('./middleware/rateLimitTimestamp');
const adminAuth = require('./middleware/adminAuth');
const accessLogger = require('./middleware/accessLogger');
const uploadQueue = require('./services/uploadQueueManager');

// 连接数据库
connectDB();

// 启动上传队列管理器
uploadQueue.start().catch(err => {
  console.error('Failed to start upload queue:', err);
});

const app = new Koa();
const port = process.env.PORT || 3000;

// 解析 JSON、表单和文件上传（统一使用 koa-body，避免重复消费请求流）
app.use(koaBody({
  multipart: true,
  urlencoded: true,
  json: true,
  text: true,
  formidable: {
    maxFileSize: 200 * 1024 * 1024, // 200MB
    maxFields: 1000,
    maxFieldsSize: 2 * 1024 * 1024, // 2MB per field
    keepExtensions: true,
    allowEmptyFiles: false
  }
}));

// CORS
app.use(cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization', 'x-request-timestamp'],
}));

// 静态文件：对外暴露 uploads 目录（放在限流前，避免静态资源被时间戳校验拦截）
const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const uploadBaseUrl = process.env.UPLOAD_BASE_URL || '/uploads';

// 为视频文件添加缓存头
const videoCache = (ctx, next) => {
  if (ctx.path.endsWith('.mov') || ctx.path.endsWith('.mp4') || ctx.path.endsWith('.m4v')) {
    // 视频文件：24小时缓存
    ctx.set('Cache-Control', 'public, max-age=86400, immutable');
    ctx.set('ETag', `"${Date.now()}"`);
  }
  return next();
};

app.use(videoCache);
app.use(mount(uploadBaseUrl, koaStatic(uploadDir, {
  maxage: 86400000, // 24小时
})));

// 对外暴露 WebP 目录
const webpDir = process.env.UPLOAD_WEBP_DIR || path.join(uploadDir, 'photos-webp');
app.use(mount('/uploads/photos-webp', koaStatic(webpDir, {
  maxage: 86400000, // 24小时
})));

// 全局中间件：日志、请求信息、错误处理
app.use(logger);
app.use(requestInfo);
app.use(errorHandler);
app.use(rateLimitTimestamp({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 10 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 20,
  maxSkewMs: Number(process.env.RATE_LIMIT_SKEW_MS) || 5 * 60 * 1000,
}));
app.use(accessLogger);
app.use(adminAuth);

// 注册路由
registerRoutes(app);

// 启动服务器
const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// 设置服务器超时（用于处理大文件上传）
// keepAliveTimeout: 保持连接打开的时间，防止 keep-alive 连接被过早关闭
// headersTimeout: 等待完整 HTTP 头的时间
// requestTimeout: 接收完整请求的时间（Node.js 18+）
server.keepAliveTimeout = 10 * 60 * 1000; // 10分钟
server.headersTimeout = 11 * 60 * 1000; // 11分钟（必须大于 keepAliveTimeout）

// 如果是 Node.js 18+，设置 requestTimeout
if (server.requestTimeout !== undefined) {
  server.requestTimeout = 15 * 60 * 1000; // 15分钟用于处理多个大文件
}

const shutdown = async (signal) => {
  console.log(`Received ${signal}, closing gracefully...`);
  server.close(() => {
    console.log('HTTP server closed');
  });
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
  process.exit(0);
};

['SIGINT', 'SIGTERM'].forEach((sig) => {
  process.on(sig, () => {
    shutdown(sig).catch((err) => {
      console.error('Error during shutdown', err);
      process.exit(1);
    });
  });
});