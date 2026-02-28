// 优先加载仓库根 .env，其次回退到 server/.env，最后默认加载环境
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

(() => {
  const rootEnv = path.resolve(__dirname, "../../.env");
  const serverEnv = path.resolve(__dirname, "../.env");
  if (fs.existsSync(rootEnv)) {
    dotenv.config({ path: rootEnv });
    return;
  }
  if (fs.existsSync(serverEnv)) {
    dotenv.config({ path: serverEnv });
    return;
  }
  dotenv.config();
})();

const Koa = require("koa");
const koaBody = require("koa-body");
const cors = require("@koa/cors");
const koaStatic = require("koa-static");
const mount = require("koa-mount");
const compress = require("koa-compress");
const helmet = require("koa-helmet");
const mongoose = require("mongoose");
const registerRoutes = require("./routes");
const connectDB = require("./config/db");
const logger = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");
const requestInfo = require("./middleware/requestInfo");
const rateLimitTimestamp = require("./middleware/rateLimitTimestamp");
const adminAuth = require("./middleware/adminAuth");
const accessLogger = require("./middleware/accessLogger");
const uploadQueue = require("./services/uploadQueueManager");
const timeoutMiddleware = require("./middleware/timeout");
const appLogger = require("./utils/logger");

// 连接数据库
connectDB();

// 仅在第一个 Worker 进程中启动上传队列管理器
if (process.env.WORKER_ID === "0") {
  uploadQueue.start().catch((err) => {
    appLogger.error("Failed to start upload queue:", err);
  });
} else {
  appLogger.info(
    `Worker ${process.pid} skipping upload queue startup (managed by Worker 0)`,
  );
}

const app = new Koa();
const port = process.env.PORT || 3000;

// 解析 JSON、表单和文件上传（统一使用 koa-body，避免重复消费请求流）
app.use(
  koaBody({
    multipart: true,
    urlencoded: true,
    json: true,
    text: true,
    formidable: {
      maxFileSize: 200 * 1024 * 1024, // 200MB
      maxFields: 1000,
      maxFieldsSize: 2 * 1024 * 1024, // 2MB per field
      keepExtensions: true,
      allowEmptyFiles: false,
    },
  }),
);

// CORS
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((s) => s.trim())
  : ["http://localhost:3000", "http://localhost:5173", "http://localhost:8999"];

app.use(
  cors({
    origin: (ctx) => {
      const requestOrigin = ctx.get("Origin");
      if (!requestOrigin) return "*";
      if (allowedOrigins.includes(requestOrigin)) {
        return requestOrigin;
      }
      if (process.env.NODE_ENV === "development") {
        return requestOrigin;
      }
      return allowedOrigins[0];
    },
    allowHeaders: ["Content-Type", "Authorization", "x-request-timestamp"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  }),
);

// 安全头中间件 - XSS 防护、CSP、防点击劫持等
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        fontSrc: ["'self'", "data:"],
        connectSrc: ["'self'", "https:"],
        mediaSrc: ["'self'", "https:", "blob:"],
        objectSrc: ["'none'"],
        frameSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
  }),
);

// Gzip 压缩中间件 - 压缩 JSON、HTML、CSS、JS 等文本响应
app.use(
  compress({
    filter: (contentType) => {
      return /text|json|javascript|css|xml/i.test(contentType);
    },
    threshold: 1024,
    gzip: {
      flush: require("zlib").constants.Z_SYNC_FLUSH,
    },
    deflate: {
      flush: require("zlib").constants.Z_SYNC_FLUSH,
    },
    br: false,
  }),
);

// 静态文件：对外暴露 uploads 目录（放在限流前，避免静态资源被时间戳校验拦截）
const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
const uploadBaseUrl = process.env.UPLOAD_BASE_URL || "/uploads";

// 为视频文件添加缓存头
const videoCache = (ctx, next) => {
  if (
    ctx.path.endsWith(".mov") ||
    ctx.path.endsWith(".mp4") ||
    ctx.path.endsWith(".m4v")
  ) {
    // 视频文件：24小时缓存，支持 CDN
    ctx.set("Cache-Control", "public, max-age=86400, s-maxage=86400");
    ctx.set("Expires", new Date(Date.now() + 86400000).toUTCString());
    ctx.set("ETag", `"${Date.now()}"`);
  }
  return next();
};

// 为图片文件添加缓存控制（支持查询参数区分版本）
const photoCache = async (ctx, next) => {
  await next();

  // 匹配图片路径
  if (
    ctx.path.startsWith("/uploads/photos/") ||
    ctx.path.startsWith("/uploads/photos-webp/")
  ) {
    const isImage = /\.(jpg|jpeg|png|webp|gif|heic)$/i.test(ctx.path);

    if (isImage) {
      // 如果URL中有时间戳参数（如 ?t=xxx），说明是更新后的版本，可以长期缓存
      if (ctx.query.t) {
        // 带时间戳的图片：1年缓存（因为URL变了就是新版本），支持 CDN
        ctx.set(
          "Cache-Control",
          "public, max-age=31536000, s-maxage=31536000, immutable",
        );
        ctx.set("Expires", new Date(Date.now() + 31536000000).toUTCString());
      } else {
        // 没有时间戳：短期缓存，允许重新验证，支持 CDN
        ctx.set(
          "Cache-Control",
          "public, max-age=300, s-maxage=3600, must-revalidate",
        );
        ctx.set("Expires", new Date(Date.now() + 300000).toUTCString());
      }
    }
  }
};

app.use(videoCache);
app.use(photoCache);
app.use(
  mount(
    uploadBaseUrl,
    koaStatic(uploadDir, {
      maxage: 0, // 禁用默认缓存，由中间件控制
    }),
  ),
);

// 对外暴露 WebP 目录
const webpDir =
  process.env.UPLOAD_WEBP_DIR || path.join(uploadDir, "photos-webp");
app.use(
  mount(
    "/uploads/photos-webp",
    koaStatic(webpDir, {
      maxage: 0, // 禁用默认缓存，由中间件控制
    }),
  ),
);

// 全局中间件：日志、请求信息、错误处理
app.use(logger);
app.use(requestInfo);
app.use(errorHandler);

// 请求超时中间件
app.use(timeoutMiddleware);

app.use(
  rateLimitTimestamp({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 10 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 20,
    maxSkewMs: Number(process.env.RATE_LIMIT_SKEW_MS) || 5 * 60 * 1000,
  }),
);
app.use(accessLogger);
app.use(adminAuth);

// 注册路由
registerRoutes(app);

// 启动服务器
const server = app.listen(port, () => {
  appLogger.info(`Server running at http://localhost:${port}`);
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
  appLogger.info(`Received ${signal}, closing gracefully...`);
  server.close(() => {
    appLogger.info("HTTP server closed");
  });
  await mongoose.connection.close();
  appLogger.info("MongoDB connection closed");
  process.exit(0);
};

["SIGINT", "SIGTERM"].forEach((sig) => {
  process.on(sig, () => {
    shutdown(sig).catch((err) => {
      console.error("Error during shutdown", err);
      process.exit(1);
    });
  });
});
