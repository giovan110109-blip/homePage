FROM node:18-alpine AS base

WORKDIR /app

# 预装 pnpm（使用 corepack）
RUN corepack enable && corepack prepare pnpm@latest --activate

# 仅复制依赖清单，利用缓存
COPY package.json pnpm-lock.yaml ./

FROM base AS deps
RUN pnpm install --frozen-lockfile --prod

FROM base AS runner
ENV NODE_ENV=production

# 复制 node_modules 和源码
COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 3000

# 可通过环境变量 PORT 覆盖
CMD ["node", "src/app.js"]


# docker build -t koa-app .
# docker run -d --name koa-app -p 3000:3000 --env-file .env koa-app