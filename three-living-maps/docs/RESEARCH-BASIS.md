# 研究依据清单（RESEARCH-BASIS）

> 本清单记录本项目关键结论的资料来源与核实方式。所有联网核实均在 **2026-11-01** 进行，抓取记录保存于项目内 `research/`（arxiv.json / arxiv_api.json / official*.json / s2.json / venue-notes.md）。
> 完整来源（含 URL、发布机构、作者、访问日期、支持的具体结论）见网站「来源库」或 `data/export/sources.json`。

## 一、核实方法

### 论文：双源交叉核实
每篇论文用两个独立来源核对会议归属：
1. **arXiv 摘要页 Comments 字段**（一手，作者自填）；
2. **Semantic Scholar Graph API 的 venue 字段**（独立聚合源）。

两源一致 → 标「已核实」；仅单源 → 标「部分核实」；均无 → 标「待核实」。

### 官方资料：实际抓取
智谱定价页与模型文档、DeepSeek 定价页与 API 文档、飞书产品页、Node/Vite/Tailwind/React/Zustand 官方文档均实际抓取并摘录关键数据，标注访问日期。

### 抓取失败的诚实记录
- **CCF 官网**（www.ccf.org.cn）：返回站点 WAF 挑战页（响应体含 `CF_APP_WAF`），未取得推荐目录正文 → 所有论文**不标注** CCF A/B 类。
- **acl-org.org**：SSL EOF 错误，未取得官网内容 → 论文归属依据 arXiv + Semantic Scholar，不依赖官网。
- **飞书妙搭产品页/文档**：返回 404 或空壳标题 → 能力标注「无法核实」。
- **openai.com/api/pricing**：403 Forbidden → 未采用 OpenAI 定价数据。

## 二、论文清单（14 篇，全部经 arXiv 原文核实）

| arXiv ID | 简称 | 会议归属 | 核实结论 | 作者机构（Semantic Scholar） |
|---|---|---|---|---|
| 2005.11401 | RAG | NeurIPS 2020 | 已核实（双源一致） | Facebook AI Research, NYU, UCL |
| 1706.03762 | Transformer | NeurIPS 2017 | 部分核实（S2 单源；arXiv Comments 未标会议） | Google, U. Toronto |
| 2201.11903 | Chain-of-Thought | NeurIPS 2022 | 部分核实（S2 单源） | Google, Inflection AI |
| 2210.03629 | ReAct | ICLR 2023 | 已核实（arXiv Comments「ICLR camera ready」+ S2 一致） | UC Davis |
| 2302.04761 | Toolformer | NeurIPS 2023 | 部分核实（S2 单源） | FAIR/Facebook, U. Washington |
| 2211.09110 | HELM | arXiv 预印本 | 机构已核实（arXiv Comments 注明 Stanford CRFM） | Stanford University |
| 2306.05685 | MT-Bench / LLM-as-a-Judge | NeurIPS 2023 D&B | 已核实（双源一致） | — |
| 2307.03172 | Lost in the Middle | TACL 2023 | 已核实（arXiv Comments「Accepted...TACL」+ S2 一致） | Stanford, Samaya AI |
| 2310.11511 | Self-RAG | ICLR 2024 | 部分核实（S2 单源） | U. Washington |
| 2312.10997 | RAG Survey | arXiv 预印本（Ongoing Work） | 部分核实（持续更新综述） | — |
| 2302.12173 | 间接提示注入 | AISec@CCS 2023 | 部分核实（S2 单源） | MPI for Security and Privacy |
| 2210.08726 | RARR | ACL 2023 | 已核实（arXiv Comments「ACL 2023」+ S2 一致） | CMU, UC Irvine |
| 2305.06983 | FLARE / Active RAG | EMNLP 2023 | 已核实（arXiv Comments「EMNLP 2023」+ S2 一致） | CMU, Beihang, Sea AI Lab |
| 2305.15334 | Gorilla | NeurIPS 2023 | 部分核实（S2 单源） | UC Berkeley |

**会议类别（CCF A/B）**：全部标注「待核实」，原因见上（CCF 官网 WAF 拦截）。这是课程「不得凭印象标注会议类别」要求的直接执行。

**作者机构的证据强度**：来自 Semantic Scholar 元数据聚合（单一来源），标为「部分核实」；论文本身未逐篇下载 PDF 核对作者单位页脚。

## 三、官方资料核实要点（核查日期 2026-11-01）

### 智谱 GLM（docs.bigmodel.cn）
- GLM-4.7-Flash：上下文 200K，输入/输出单价「免费」，缓存存储「限时免费」。
- GLM-4.6：总参 355B / 激活 32B，上下文 200K，最大输出 128K，支持 Function Calling / MCP / 结构化输出。
- 计费公式：调用费用 = 未命中缓存输入 + 缓存命中 + 输出 + 缓存存储。
- GLM 系列 token 与汉字换算约 1:1.6。
- 官网首页列出 GLM-5.3、GLM-5.2 等。

### DeepSeek（api-docs.deepseek.com）
- deepseek-flash（V4.1-Flash-1017）：1M 上下文，最大输出 384K；输入空闲 1 / 高峰 2，输出空闲 4 / 高峰 8（元/百万 tokens）；缓存命中空闲低至 0.02；并发 2500。
- deepseek-v4-pro（V4-Pro-0813）：输入空闲 4.5 / 高峰 9.0，输出空闲 13.5 / 高峰 27.0；并发 500；不支持图像理解。
- 高峰时段：周一至周五 9:00–12:00、14:00–18:00（不含法定节假日）；空闲为高峰一半。
- Search/Fetch：每 1000 次成功请求 5 元，自 2026-11-01 00:00 起对 Agent 工具场景收费。
- 提供 OpenAI 兼容（api.deepseek.com）与 Anthropic 兼容 BASE URL。

### 飞书
- 多维表格产品页（feishu.cn/product/base）：官方定位「AI 驱动的表格与业务系统搭建平台」。
- 服务端 API 属 bitable-v1 系列；文档正文由前端异步渲染，抓取仅得标题（端点参数标「部分核实」）。
- 妙搭：产品页/文档路径 404 或空壳，能力「无法核实」。

### 技术文档
- Node.js `node:sqlite`（v24 文档）：DatabaseSync 同步 API，本地实测 Node v24.21.0 可用。
- Tailwind v4：`@tailwindcss/vite` 插件 + `@import "tailwindcss"` + `@theme` CSS-first 配置。
- Vite / React 19.3 / Zustand：官方文档均可访问。

## 四、项目内一手资料

| 资料 | 说明 | 可核实内容 |
|---|---|---|
| 课程讲义整理稿（S-24） | 本地 md，整理日期 2026-10-17 | 作业要求、三张地图说明、功能要求、7 周提交安排、8 分钟展示结构、互评重点、访问要求、资料规范 |
| 培养方案附件（S-25） | 本地 docx，Apache POI 生成，创建 2026-10-17 | 培养目标 3 条 + 毕业要求 10 条（**不含课程目录**） |
| 项目方案 V2.0（S-26） | 本地 md | 数据模型、证据四级、快变量规则、关系词表、交互规格、执行纪律 |

## 五、运行记录（一手实测数据）

- **模型调用**：`ai_usage` 表记录每次调用的渠道、模型、token、耗时、状态（问题只存哈希，不存原文）。
- **评测运行**：`data/eval-results.json` 与 `eval_runs` 表，含运行时间、模型渠道、Node 版本、逐题结果。
- **思考模式实测**：glm-4.7-flash 在 `max_tokens=200` 时 `reasoning_tokens=199`、`content` 为空；glm-4.6、glm-5 同样复现。据此调整预算与解析逻辑。
- **网关限流实测**：本次交付所用兼容网关限流严重（多次 503/429，单次简短调用最长 326 秒），已配置指数退避重试 + 自动降级。

## 六、本项目未依赖的资料（诚实标注）

- 未下载任何论文 PDF 全文（仅核实摘要页元数据），因此涉及论文内部实验数值的结论**不写入地图**。
- 未取得学校官方完整培养方案（仅项目附件的培养目标/毕业要求部分），因此**不填具体课名**。
- 未取得 DeepSeek 官方密钥，因此备用渠道对官方端点的真实调用**未验证**。
- 未产生真实同学使用/反馈数据、成员贡献记录、可查询的 API 账单，相关处一律显示「尚未采集 / 待开展」。