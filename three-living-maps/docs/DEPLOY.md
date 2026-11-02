# 部署指南（DEPLOY.md）

> 课程要求：网站**云端运行、不依赖个人电脑开机、国内普通网络可访问、无需安装软件、无需逐人申请权限**。
> 本项目已完成生产构建与端到端验证；发布到公网需要账号所有者授权平台账号或提供可 SSH 的服务器（见 `EXTERNAL-BLOCKERS.md`）。

## 方式一：容器部署（推荐）

仓库含 `Dockerfile` 与 `docker-compose.yml`。

```bash
# 在项目根目录
cp .env.example .env
# 编辑 .env 填入密钥（可选）与 ADMIN_TOKEN（启用管理端）

docker compose up -d --build
# 访问 http://<服务器IP>:8787
```

- 数据持久化：`./data` 挂载为卷，SQLite 库与导出文件都在其中，重建容器不丢数据。
- 首次启动自动执行 `npm run seed` 装载种子数据（库为空时）。
- 内置 HEALTHCHECK，容器异常会自动重启（`restart: unless-stopped`）。
- 密钥通过 `.env` 注入，**不写进 Dockerfile 或镜像**。

生产建议用 nginx 反向代理并配置 HTTPS：

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.example;
    ssl_certificate     /etc/letsencrypt/live/your-domain/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain/privkey.pem;
    location / {
        proxy_pass http://127.0.0.1:8787;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 240s;   # AI 生成可能需要较长时间
    }
}
```

## 方式二：云服务器 VPS（systemd + nginx）

```bash
# 1. 安装 Node.js 24（需 >= 22.5 以使用 node:sqlite）
#    以 nvm 为例：
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc && nvm install 24 && nvm use 24

# 2. 获取代码并安装
cd /opt && git clone <你的仓库地址> three-living-maps && cd three-living-maps
npm install

# 3. 构建前端 + 装载数据
npm run build
npm run seed

# 4. 配置环境变量
cp .env.example .env && nano .env   # 填密钥与 ADMIN_TOKEN

# 5. 用 systemd 常驻运行
sudo tee /etc/systemd/system/three-living-maps.service > /dev/null <<'UNIT'
[Unit]
Description=Three Living Maps
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/three-living-maps
EnvironmentFile=/opt/three-living-maps/.env
Environment=NODE_ENV=production
Environment=PORT=8787
ExecStart=/usr/bin/node server/index.mjs
Restart=always
RestartSec=3
# 以非 root 用户运行
User=www-data

[Install]
WantedBy=multi-user.target
UNIT

sudo systemctl daemon-reload
sudo systemctl enable --now three-living-maps
sudo systemctl status three-living-maps

# 6. nginx 反代（同上）+ 防火墙放行 80/443
```

## 方式三：临时公开演示（SSH 隧道）

答辩现场或临时演示，无需购买服务器：

```bash
npm run build
npm start            # 终端 A：本地服务
npm run tunnel       # 终端 B：通过 localhost.run / serveo 获得 https 地址
```

- 隧道地址在进程存活期间有效，Ctrl+C 后失效。
- **限制**：依赖本机开机与网络，不满足课程「不依赖个人电脑开机」的长期要求，仅作临时演示与退路。
- 若 22 端口出站被封锁，隧道会失败并打印替代方案。

## 部署后自检清单

```bash
curl -s http://<域名>/api/health | jq .          # 期望 ok:true, ai:true/false, admin:true/false
curl -s http://<域名>/api/stats | jq .stats      # 期望 nodes>=141, relations>=233, sources>=43
```

浏览器打开首页，逐项确认：
- [ ] 首页、三张地图、节点详情、来源库、搜索、AI 助手、评测、更新记录、反馈均可访问
- [ ] 节点深链接刷新不丢路由（如 `/node/D-C-RAG` 直接刷新）
- [ ] 移动端（手机浏览器或 DevTools 390×844）无横向溢出，底部抽屉可用
- [ ] AI 助手能回答领域内问题、对越界问题拒答
- [ ] 管理端未配置 ADMIN_TOKEN 时显示「未启用」；配置后可写
- [ ] HTTPS 生效，无混合内容告警

## 环境变量完整清单

见 `.env.example`（含每一项的说明与默认值）。关键项：

| 变量 | 生产建议 |
|---|---|
| `NODE_ENV` | `production`（启用 HSTS、关闭详细错误） |
| `ZHIPU_API_KEY` / `DEEPSEEK_API_KEY` | 至少配一个；不配则 AI 降级为检索直出（网站仍可用） |
| `ADMIN_TOKEN` | 长度 ≥ 12 的随机串；不配则管理端写操作全部禁用 |
| `DB_PATH` | 指向持久化卷，避免容器重建丢数据 |
| `PORT` / `HOST` | 默认 8787 / 0.0.0.0 |

## 国内访问注意事项

- 本项目运行时**不依赖任何境外服务**：模型走国内渠道（智谱/DeepSeek），前端无 CDN 外链，字体用系统字体栈。
- Hugging Face 等仅在来源库中作为链接出现，网站运行不请求它们，因此不受其国内访问稳定性影响。
- 若部署在境内服务器，建议完成 ICP 备案（取决于托管商要求）。
---

## 方式四：Cloudflare Workers + D1（已部署，长期托管首选）

**当前状态（2026-11-01 实测）**：已部署并验证。

- Worker 地址：`https://three-living-maps.three-living-maps.workers.dev`
- 数据库：D1 `three-living-maps`（与本地 SQLite 同 schema、同数据：141 节点 / 233 关系 / 43 来源 / 14 评测题）
- 冒烟测试：18/18 通过（首页、三图、星群、X-Ray、深链接刷新、来源库、搜索、AI 生成/降级/越界拒答、反馈真实写入 D1、管理端门控、移动端抽屉、无 JS 错误）

### 重要实测发现：`workers.dev` 在中国大陆被 DNS 污染

用原始 DNS 报文实测（绕过本地缓存，直查各公共解析器）：

| 解析器 | `*.workers.dev` 返回 | 判定 |
|---|---|---|
| AliDNS 223.5.5.5 | 104.244.43.167（Twitter 段） | **污染** |
| DNSPod 119.29.29.29 | 154.83.15.45 | **污染** |
| Google 8.8.8.8 | 104.244.43.167 | **污染** |
| 本机 LAN 解析器 | 31.13.94.10（Meta 段） | **污染** |
| DoH 1.1.1.1（加密） | 172.67.130.72 / 104.21.3.58 | 真实 Cloudflare |
| AliDNS / DNSPod 查 `*.pages.dev` | 104.16–198.41 段 | **真实 Cloudflare** |

结论：**明文 DNS 下 `workers.dev` 全域被污染，普通国内网络打不开；`pages.dev` 未被污染，可达。**
因此满足课程「国内普通网络可访问」的长期地址应使用 `*.pages.dev`（或自有域名）。

### 部署命令

```bash
# 1) 登录（设备码流程，Edge 里输入代码授权）
npx wrangler login --device

# 2) 建 D1 库（已建则跳过）
npx wrangler d1 create three-living-maps
# 把返回的 database_id 填进 wrangler.toml / worker/wrangler.workers.toml

# 3) 灌入 schema 与种子数据
node scripts/gen-d1-sql.mjs                 # 从种子生成 data/d1-schema.sql + d1-seed.sql
node scripts/gen-d1-sql.mjs --live          # 或从当前本地库生成（含管理端修改/反馈/更新记录）
npx wrangler d1 execute three-living-maps --remote --file=data/d1-schema.sql
npx wrangler d1 execute three-living-maps --remote --file=data/d1-seed.sql

# 4) 密钥（存为 Worker secret，不进代码/仓库）
npx wrangler secret put LLM_API_KEY
npx wrangler secret put LLM_BASE_URL
npx wrangler secret put LLM_MODEL
npx wrangler secret put ADMIN_TOKEN          # 可选：启用管理端

# 5a) Workers 版（全球可达，国内 DNS 被污染）
npx wrangler deploy -c worker/wrangler.workers.toml

# 5b) Pages 版（*.pages.dev，国内普通网络可达）—— 见下方说明
npx wrangler pages deploy pages-dist --project-name three-living-maps
```

### Pages 版（国内可达地址）的构建

Pages 部署目录 `pages-dist/` = 前端产物 + 打包后的 Worker：

```bash
npm run build                                  # 产出 web/dist
python - <<'PY'                                # 或手动复制
import shutil, os
os.makedirs('pages-dist', exist_ok=True)
for f in os.listdir('web/dist'):
    s=os.path.join('web/dist',f); d=os.path.join('pages-dist',f)
    shutil.rmtree(d, ignore_errors=True) if os.path.isdir(s) else (os.remove(d) if os.path.exists(d) else None)
    shutil.copytree(s,d) if os.path.isdir(s) else shutil.copy2(s,d)
PY
npx esbuild worker/src/worker.mjs --bundle --format=esm --platform=browser --outfile=pages-dist/_worker.js
npx wrangler pages deploy pages-dist --project-name three-living-maps
```

> 说明：`_worker.js` 必须用 esbuild 打包，因为它 `import` 了仓库内的 `shared/retrieval-core.mjs`（Pages 部署目录外的文件不会被上传）。
> SPA 深链接回落在 Worker 内实现（静态 404 且 `Accept: text/html` 时回 `index.html`），不依赖 Pages 的 not_found_handling 配置。

### 数据同步（本地 → D1）

本地通过管理端修改内容后，同步到云端：

```bash
node scripts/gen-d1-sql.mjs --live
npx wrangler d1 execute three-living-maps --remote --file=data/d1-seed.sql
```

（`INSERT OR REPLACE` 幂等；反馈/候选/更新记录为 `INSERT` 追加。D1 上的反馈不会自动回流本地，如需双向同步请定期 `npm run export` 归档。）

### 自有域名（可选，彻底解决 DNS 问题）

若账号下有域名 zone：在 Cloudflare 控制台 Workers & Pages → 项目 → Custom domains 添加，例如 `maps.example.com`。
自有域名走 Cloudflare 任播，国内解析与连通性通常优于被污染的 `workers.dev`。当前账号**无任何 zone**（API 实测 `zones?per_page=50` 返回 0），故此路径需先购买/转入域名。