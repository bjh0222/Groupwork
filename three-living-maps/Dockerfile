FROM node:24-alpine
# 三张活地图：单容器部署（前端静态产物由 Express 托管，SQLite 单文件库）
WORKDIR /app

# 先装依赖以利用层缓存
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

COPY . .

# 构建前端（需 devDependencies），随后裁剪为生产依赖
RUN npm run build && npm prune --omit=dev

# 数据目录持久化挂载点
RUN mkdir -p /app/data
VOLUME ["/app/data"]

ENV NODE_ENV=production
ENV PORT=8787
ENV HOST=0.0.0.0
EXPOSE 8787

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8787)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# 首次启动自动装载种子数据（幂等），随后提供服务
CMD ["sh", "-c", "node scripts/seed.mjs && exec node server/index.mjs"]