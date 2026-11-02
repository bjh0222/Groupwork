# 运维文档（OPERATIONS.md）

> 覆盖：备份、恢复、密钥轮换、日常维护、每周复核流程、故障排查。

## 一、备份与恢复

### 备份
```bash
npm run backup
```
- 用 SQLite 官方 `VACUUM INTO` 生成**一致性快照**（WAL 模式下直接复制文件可能不一致）。
- 同时导出 JSON + CSV（人类可读，可直接导入飞书多维表格或其他平台）。
- 输出到 `data/backups/<时间戳>/`，含 `maps-backup.sqlite`、`export/`、`MANIFEST.json`。
- 自动只保留最近 10 份。

### 恢复
```bash
npm run backup                      # 恢复前先备份当前状态（稳妥）
npm run restore -- data/backups/<时间戳>
```
- 恢复前会把当前库另存为 `<库名>.pre-restore-<时间戳>`，避免误操作不可逆。
- 恢复后自动打印各表行数做校验。
- 回滚：把 `.pre-restore-*` 文件复制回 `data/maps.sqlite` 即可。

### 建议节奏
- 每次批量修改内容前手动备份。
- 生产环境配置定时任务（cron / systemd timer）每日自动 `npm run backup`。

## 二、数据导出与平台迁移

```bash
npm run export      # 导出全库到 data/export/（每表 .json + .csv + full-export.json 整库快照）
```
- CSV 带 BOM，可直接用 Excel / 飞书多维表格打开。
- 这是「避免平台锁定」的落地：数据随时可搬出，也可从导出重建。
- 迁移到飞书多维表格：把 `nodes.csv`、`relations.csv`、`sources.csv` 分别导入为三张表，按 `id` / `source_node_id` / `target_node_id` / `source_ids` 建立关联。

## 三、密钥管理

### 配置
密钥只放服务端环境变量（`.env.local` 或容器 `.env`），**绝不**写进前端、代码或提交到仓库。
- `.gitignore` 已排除 `.env`、`.env.local`、`.env.*.local`。
- 前端构建产物经 E2E 实测扫描，确认不含密钥或网关地址。

### 轮换
```bash
# 1. 在模型平台生成新密钥
# 2. 更新 .env.local 或容器 .env 中的 ZHIPU_API_KEY / DEEPSEEK_API_KEY
# 3. 重启服务使新密钥生效
systemctl restart three-living-maps      # systemd
# 或 docker compose up -d                 # 容器（会重读 .env）
# 4. 在旧密钥失效前，确认新密钥可用（调用一次 AI 助手）
# 5. 在平台吊销旧密钥
```
- 服务端不缓存密钥到磁盘，重启即重新读取环境变量。
- `ADMIN_TOKEN` 轮换同理；轮换后管理端需重新登录（令牌只存浏览器内存）。

### 密钥泄露应急
1. 立即在平台吊销泄露的密钥。
2. 生成新密钥并更新环境变量、重启服务。
3. 检查 `ai_usage` 表有无异常调用量（按 ts 排序看是否有突发高频）。
4. 若 `ADMIN_TOKEN` 泄露，检查 `update_log` 有无异常写入。

## 四、日常维护

### 内容维护（管理端）
配置 `ADMIN_TOKEN` 后访问 `/admin`：
- **节点**：新增/编辑/下架；填证据状态、核查日期、来源、边界说明。
- **关系**：新增/编辑；`taught_in` 必须选覆盖程度，「推断」必须填推理链（前端表单与后端校验双重强制）。
- **来源**：新增/编辑；被引用的来源不可删除（需先解除引用）。
- **候选池**：审核访问者推荐与 AI 生成内容，通过后才进正式地图。
- **反馈**：处理同学反馈，填核实方式与实际改动，状态流转写入更新记录。
- **一致性检查**：等价于 `npm run lint:data`。

所有写操作**自动写入更新记录**（日期/对象/依据/变更/原因/执行者）。

### 命令行维护
```bash
npm run lint:data   # 一致性校验：孤立节点、悬空引用、缺失来源、词表越界、超期未复核
npm run seed        # 重新装载种子数据（幂等，用于修复或升级 schema 后）
npm run reset-db    # 重置为干净种子状态（会先自动备份；测试污染后用）
```

## 五、每周复核流程（课程要求「每周至少检查一次」）

1. **快变量复核**：`npm run lint:data` 会报告超期未复核的快变量节点（`stale` 计数）。逐个核对官方定价页/文档，更新 `last_checked`（管理端编辑节点即可，会自动写更新记录）。
   - 智谱定价：https://docs.bigmodel.cn/cn/guide/start/pricing
   - DeepSeek 定价：https://api-docs.deepseek.com/zh-cn/quick_start/pricing
2. **处理反馈**：`/admin` 反馈分区，逐条核实并流转状态。
3. **审核候选池**：新推荐内容做来源检查与逻辑检查。
4. **重跑评测**（可选）：`npm run eval`，对比历史运行看质量是否漂移。
5. **备份**：`npm run backup`。

## 六、故障排查

| 症状 | 可能原因 | 处理 |
|---|---|---|
| 启动报 `node:sqlite` 不存在 | Node < 22.5 | 升级到 Node 24：`node -v` 应 ≥ 22.5 |
| 首页 503「前端尚未构建」 | 未执行 `npm run build` | 运行 `npm run build` 生成 `web/dist` |
| AI 助手一直「降级模式」 | 未配置密钥，或渠道全部失败 | 检查 `.env.local` 的 `ZHIPU_API_KEY`；看 `ai_usage` 表的 error 列 |
| AI 返回 `truncated` | 思考型模型输出额度被推理占满 | 提高 `AI_MAX_TOKENS`（默认 3200，上限 4000） |
| AI 请求 503/429 | 模型网关限流 | 已有指数退避重试；持续失败会自动降级为检索直出，网站仍可用 |
| 管理端显示「未启用」 | 未配置 `ADMIN_TOKEN` 或长度 < 12 | 设置 ≥ 12 位的 `ADMIN_TOKEN` 并重启 |
| 管理端写操作 403 | 令牌错误或未输入 | 重新输入正确令牌 |
| 深链接刷新 404 | 未用本项目的 Express 托管（SPA 回退缺失） | 用 `npm start` 而非纯静态服务器；或给静态服务器配置 SPA 回退 |
| 移动端横向溢出 | 自定义内容过宽 | 检查新增节点 details 是否含超长不可断字符串 |
| 数据库锁定 `SQLITE_BUSY` | 多进程同时写 | 确保只有一个 server 实例写库；备份用 `VACUUM INTO` 不锁主库 |

### 日志位置
- 开发模式：请求日志打印到 stdout（`METHOD PATH STATUS 耗时`）。
- 生产模式：不打印请求日志（避免噪声与潜在敏感信息）。
- AI 调用：`ai_usage` 表（含状态、耗时、token、脱敏错误、问题哈希）。
- 错误：`console.error('[server]', ...)`，已脱敏（过滤 Bearer/sk- 凭据）。

### 健康检查
```bash
curl -s http://localhost:8787/api/health
# {"ok":true,"time":"...","node":"v24.x","env":"production","ai":true,"admin":true}
```
`ai:false` 表示未配置密钥（降级可用）；`admin:false` 表示管理端未启用。