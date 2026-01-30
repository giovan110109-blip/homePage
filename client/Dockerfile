# 多阶段构建 - 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 启用 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 复制 monorepo 相关文件和依赖清单
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./
COPY packages ./packages

# 安装所有依赖（包括 workspace 依赖）
RUN pnpm install --frozen-lockfile

# 复制源代码和环境变量文件
COPY . .

# 接收构建参数并设置为环境变量供 Vite 使用
ARG VITE_API_BASE_URL
ARG VITE_SITE_TITLE
ARG VITE_SITE_DESCRIPTION
ARG VITE_API_BASE_URL_LOCAL

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_SITE_TITLE=$VITE_SITE_TITLE
ENV VITE_SITE_DESCRIPTION=$VITE_SITE_DESCRIPTION
ENV VITE_API_BASE_URL_LOCAL=$VITE_API_BASE_URL_LOCAL

# 构建生产版本
RUN pnpm build

# 生产阶段 - 使用 nginx 提供静态文件服务
FROM nginx:alpine AS runner

# 复制自定义 nginx 配置
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf

# 复制构建产物到 nginx 目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
