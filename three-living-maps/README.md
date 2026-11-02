# 三张活地图 · 大语言模型应用开发与评估

> 课程《人工智能前沿与创新》大作业 · 面向 AI 专业大一学生的技术地图、产业生态与学习路径
> 一个**可公开访问、可持续更新、可演示**的交互式学习网站：三张相互关联的地图 + 与地图数据深度集成的 AI 概念助手。

**在线地址（长期托管，不依赖个人电脑）**
- 主地址（国内普通网络可达）：https://three-living-maps.pages.dev
- 备用地址（全球可达）：https://three-living-maps.three-living-maps.workers.dev

**数据规模**：141 节点（领域 67 / 生态 45 / 认知 30）· 233 关系 · 43 来源 · 14 道评测题 · 核查日期 2026-11-01

---

## 一、技术栈

| 层 | 技术 | 版本（2026-11-01 实测） | 用途 |
|---|---|---|---|
| 前端框架 | React + TypeScript | 19.3 / 5.9 | 组件化 UI、类型安全 |
| 构建 | Vite（Rolldown） | 8.3 | 开发服务器与生产构建 |
| 样式 | Tailwind CSS（CSS-first `@theme`） | 4.3 | 「庄重典雅」语义化设计 Token：墨色/宣纸/朱砂/翡翠/琥珀/科技蓝，明暗双主题 |
| 全局状态 | Zustand | 5.0 | 联动状态机 `useMapStore`（activeNodeId / activeMap / careerTrack / isXRayActive） |
| 可视化 | 原生 SVG + `getBoundingClientRect` | — | X-Ray 知识引力线（渐变光效 + 脉冲 + 中点关系标签） |
| 路由 | react-router-dom | 7.18 | SPA 深链接（刷新不丢路由） |
| 后端 | Node.js + Express | 24 / 5.3 | 公开只读 API + 受控管理 API |
| 数据库 | SQLite（Node 内置 `node:sqlite`） | — | 单文件、零依赖、可导出；九张表 |
| 检索 | 自建 BM25 + IDF + passage 级打分 + 同义词扩展 + 一跳图扩展 | — | 可解释检索（返回命中字段与得分） |
| AI | **DeepSeek deepseek-flash（官方密钥，主）** / 智谱 GLM-4.7-Flash（备），OpenAI 兼容 | — | 地图约束的概念问答；三级降级 |
| 云托管 | Cloudflare Pages/Workers + D1 | — | 长期公网地址；D1 与本地 SQLite 同 schema |
| 测试 | Node 内置 test runner + Playwright/Chromium | — | 单元 84 项 + 浏览器 E2E 104 项 + Worker 冒烟 18 项 |

**为什么自建检索而不用向量数据库 / LangChain**：语料规模小、需要可解释（能说出命中了哪个词）、少一份依赖与密钥；完整论证见 `DECISIONS.md` D-03/D-04。

---

## 二、功能

### 1. 三张地图（同一网站、共享节点与来源）
- **领域地图**：六大板块——问题与任务、概念与原理、方法与技术路线、软件与模型、数据与实践资源、课程与学习路径。中枢任务是「基于课程资料的知识问答」。
- **生态地图**：参与者 × 关系链。主线 A「论文 → 模型提供方 → 开源社区 → 本组应用 → 使用者」；辅线 B「谁承担成本」（含官方定价与核查日期）；另有规则与责任等观察维度。
- **认知地图**：认识方法（系统观/发展观为课程要求，证据观为项目自定义并已标注）、六种分析方法（三种配真实案例）、成长习惯、认识修正（四段结构）、成员补录入口。

### 2. 三图联动透视镜（X-Ray）与动态溯源
- 点击任一节点：图内画出带渐变与脉冲的**知识引力线**，中点标注关系类型，悬停看描述与来源；侧栏「关联星群」列出它在**另外两张地图**的关联，可一键跨图跳转。
- 右侧抽屉展开节点详情：定义、关系（含推理链）、来源（URL/发布日/访问日/支持结论）、继续探索推荐。
- 一键关闭 X-Ray（性能降级）→ 自动切换为静态关联列表，功能不丢失。

### 3. 成长罗盘
顶部切换 AI 科学家 / 工程师 / 设计师：不属于该路线的节点平滑降透明 + 缩放 + 去色，聚焦北极星路径；切回「全部」恢复。

### 4. AI 概念助手（与地图数据集成，不是独立聊天框）
- 流程：输入校验 → 检索正式节点/关系/来源 → 注入受约束提示 → 调用模型 → **服务端引用校验**（剔除不在检索结果内的 ID）→ 返回结构化回答。
- 回答区分三类：【资料事实】/【基于资料的解释】/【资料未覆盖】；每条结论附来源 ID。
- 回答中的图谱概念渲染为**可点击胶囊**，点击拉出「证据引力线」并展开原始论文/讲义来源与核查日期。
- **越界问题**（与课程资料无词汇重叠）走「知识边界雾化」拒答，不调用模型、不编造。
- **三级降级**：主渠道 → 备用渠道 → 非生成式检索直出（无密钥时网站核心功能仍完整可用）。

### 5. 内容治理与可信度
- **证据四级状态**：已核实 / 部分核实 / 推断 / 待核实，全站节点与关系均标注，且同时用符号与文字（不单靠颜色）。
- **快变量管理**：价格、模型版本、平台功能标注核查日期；超 4 周未复核自动显示「信息可能过期」。
- **候选内容池**：AI 生成与外部推荐先进候选区，经来源检查与逻辑检查后才进正式地图。
- **更新记录**：所有增删改自动写入（日期/对象/依据/变更/原因/执行者），反映真实修改。
- **反馈闭环**：可匿名提交疑问/纠错/新来源 → 核实 → 修改 → 状态流转 → 更新记录。
- **理解程度**（knowledge_status）只来自真实学习者反馈，无数据显示「未评估」，AI 不猜测。

### 6. 来源库与可追溯
43 条来源，每条含标题、发布机构/作者、原始 URL、发布日期、访问日期、支持的具体结论、备注。论文经 **arXiv 摘要页 + Semantic Scholar 双源交叉核实**会议归属；抓取失败的来源（如 CCF 官网 WAF 拦截）同样保留记录并说明原因。

### 7. 评测
14 题覆盖七类考点（事实查询/概念解释/多节点推理/资料定位/拒答/易混淆辨析/越界处理）。分数只能由 `npm run eval` 实际运行产生；自动评分标注「待人工复核」；报告含运行环境、逐题耗时与 token、局限性披露。

### 8. 移动端与无障碍
- < 768px：全屏 SVG 联动转为**底部滑出的抽屉式多维标签流**（水平 Tab：领域解构/生态链条/认知反思），三种视口实测无横向溢出。
- 状态标签同时含符号与文字；`:focus-visible` 焦点环；`aria-*` 齐备；尊重 `prefers-reduced-motion`。

### 9. 小组分工页（/team）与成员贡献
- 首页右下角固定入口「小组分工」→ /team：展示 4 名成员角色、牵头技术/内容模块、任务明细、量化分摊表（合计与线上数据一致）、14 项技术模块归属、P1–P6 里程碑矩阵、协作机制与诚信约定。
- 原件 PDF 在线可查（/team-division.pdf）；来源记录 S-44；生态节点 E-ORG-TEAMSTRUCT。
- 诚实标注：签字确认栏留空，标「已编制、待签字确认」。

### 10. 管理端与运维
- `/admin`：节点/关系/来源增删改、候选审核、反馈处理、一致性检查；未配置 `ADMIN_TOKEN` 时写操作返回 501（默认拒绝）。
- 备份/恢复/导出：`npm run backup` / `restore` / `export`（JSON+CSV，可迁入飞书多维表格）。
- 背景水印：校徽 SVG 固定层、5% 不透明度、不拦截交互（`web/public/watermark.svg`）。

---

## 三、用法

### 环境要求
- Node.js **≥ 22.5**（推荐 24.x，内置 `node:sqlite`）
- 无需数据库服务、无需 Docker（可选）

### 快速开始（本地）
```bash
npm install          # 安装依赖
npm run seed         # 装载数据：142 节点 / 238 关系 / 44 来源 / 14 评测题 -> data/maps.sqlite
npm run dev          # 开发模式：前端 :5173（自动代理 /api）+ 后端 :8787
# 或生产模式
npm run build        # 构建前端到 web/dist
npm start            # Express 托管静态产物 + API，默认 http://localhost:8787
```
打开 http://localhost:8787 即可。**无需任何密钥**即可浏览全部地图、来源、评测与更新记录；AI 助手在未配置密钥时以「检索直出」模式工作。

### 启用 AI 生成模式（可选；不启用则为检索直出降级，功能完整）
```bash
cp .env.example .env.local     # .env.local 已被 .gitignore 排除
# 编辑 .env.local，填入（当前项目默认渠道为 DeepSeek 官方）：
#   DEEPSEEK_API_KEY=...       # platform.deepseek.com 官方密钥
#   DEEPSEEK_BASE_URL=https://api.deepseek.com
#   DEEPSEEK_MODEL=deepseek-flash
#   （可选备用）ZHIPU_API_KEY=... / ZHIPU_BASE_URL=https://open.bigmodel.cn/api/paas/v4
npm start                      # 重启生效
```
密钥只存服务端环境变量；前端与仓库均无凭据。云端（Pages/Workers）用 `wrangler pages secret put LLM_API_KEY` 等方式配置，同样不进仓库。

### 启用管理端（可选）
```bash
# .env.local 中设置（长度 >= 12）：
ADMIN_TOKEN=<随机串>
npm start
# 浏览器访问 /admin，输入同一令牌。令牌只存浏览器内存，刷新即失效。
```

### 常用命令
```bash
npm run seed              # 装载/刷新种子数据（幂等）
npm run build             # 生产构建前端
npm start                 # 启动（生产）
npm run dev               # 开发模式
npm run lint:data         # 数据一致性校验（孤立节点/悬空引用/缺失来源/词表越界/超期未复核）
npm run eval              # 真实运行评测集 -> data/eval-results.json
npm run eval -- --baseline# 追加无检索基线对照
npm test                  # 单元测试（79 项）
node tests/e2e.mjs        # 浏览器 E2E（97 项，需先 build）
node tests/worker-smoke.mjs  # Cloudflare 版公网冒烟（18 项）
npm run typecheck         # TypeScript 检查
npm run export            # 导出全库 JSON + CSV（可迁入飞书多维表格）
npm run backup            # 一致性快照备份到 data/backups/
npm run restore -- <dir>  # 从备份恢复
npm run reset-db          # 重置为干净种子状态（自动先备份）
npm run screenshots       # 生成演示截图到 docs/screenshots/
npm run tunnel            # SSH 隧道临时公网地址（演示退路）
node scripts/gen-d1-sql.mjs          # 生成 D1 同步 SQL（从种子）
node scripts/gen-d1-sql.mjs --live   # 生成 D1 同步 SQL（从当前本地库，含管理端修改）
```

### 典型使用路径（给同学/互评者）
1. 首页看选题与三图概览 → 点「进入地图」。
2. 地图页点任一节点 → 看 X-Ray 引力线与侧栏跨图关联 → 抽屉里看来源与核查日期。
3. 顶部切成长罗盘（科学家/工程师/设计师）看路线聚焦。
4. AI 助手提问 → 看回答的证据状态 → 点概念胶囊 → 展开原始来源。
5. 发现错误？「反馈」页匿名提交；维护者在 `/admin` 处理并写入更新记录。
6. 「评测」页看真实运行结果与局限性；「关于」页看研究依据与诚实声明。

### 维护者每周流程（课程要求「每周至少检查一次」）
1. `npm run lint:data` → 处理超期未复核的快变量（核对官方定价页后更新 last_checked）。
2. `/admin` 处理反馈与候选池。
3. （可选）`npm run eval` 对比质量漂移。
4. `npm run backup`。
5. 若用云端：`node scripts/gen-d1-sql.mjs --live && npx wrangler d1 execute three-living-maps --remote --file=data/d1-seed.sql` 同步到 D1。

---

## 四、部署

详见 `docs/DEPLOY.md`。四种路径：
1. **Cloudflare Pages + D1（已部署，推荐）**：`*.pages.dev` 国内可达；`wrangler.toml` 已配置。
2. **Cloudflare Workers + D1**：`worker/wrangler.workers.toml`；全球可达但大陆 DNS 污染 `workers.dev`。
3. **容器**：`Dockerfile` + `docker-compose.yml`。
4. **VPS**：systemd + nginx（文档含现成配置）。

> 中国大陆可达性实测：`workers.dev` 在 AliDNS/DNSPod/Google/本机解析器均被污染为伪造 IP；`pages.dev` 未被污染。故国内长期地址用 Pages 版。

---

## 五、目录结构

```
three-living-maps/
├── web/                 # React 前端（src/components|pages|store|lib）
│   └── public/watermark.svg   # 背景水印（校徽）
├── server/              # Express 后端（index.mjs + lib/{db,retrieval,ai,prompt,admin,env}.mjs）
├── shared/              # retrieval-core.mjs：Node 与 Worker 共用的检索内核
├── worker/              # Cloudflare Worker 版后端 + wrangler.workers.toml
├── data/seed/           # 种子数据：nodes-{domain,ecosystem,cognition} / relations / sources / evalset
├── scripts/             # seed / run-eval / export / backup / restore / validate-data / screenshots / tunnel / reset-db / gen-d1-sql
├── tests/               # unit.test.mjs(84) / e2e.mjs(104) / worker-smoke.mjs(18)
├── docs/                # DATA-DICTIONARY / DEPLOY / OPERATIONS / ACCEPTANCE-REPORT / RESEARCH-BASIS / EXTERNAL-BLOCKERS / screenshots
├── research/            # 联网核实原始记录（arXiv/SemanticScholar/官方页抓取）
├── DECISIONS.md         # 17 项技术决策（背景/候选/决定/依据/取舍/重新权衡条件）
└── wrangler.toml        # Cloudflare Pages 部署配置（含 D1 绑定）
```

---

## 六、测试与验收

- 单元测试 **84/84**、浏览器 E2E **104/104**、Worker 公网冒烟 **18/18**、数据 lint **0 error / 0 warning**。
- 评测真实运行：7/14 通过；**引用有效性 1.00、编造引用 0**；拒答正确 3/3。
- 完整结果与逐条证据见 `docs/ACCEPTANCE-REPORT.md`；未解决限制与外部阻塞见同文件 §6 与 `docs/EXTERNAL-BLOCKERS.md`。

## 七、诚实声明（摘要）

- 具体课名：培养方案附件不含课程目录 → 只提供「课程类别槽位」，标待核实，**不臆造课名**。
- CCF 会议类别：官网 WAF 拦截未取得 → 全部标待核实，只保留双源印证的会议名。
- 成员贡献 / 真实 API 费用 / 同学反馈：无记录 → 显示「尚未采集 / 待开展」，**不虚构**；补录入口已就绪。
- 认知地图案例：全部来自本项目实际执行记录（可追溯到研究抓取与运行数据）；个人经历留待成员补录。

完整清单见首页「诚实声明」与 `docs/ACCEPTANCE-REPORT.md`。