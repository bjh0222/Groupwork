// 来源库 seed 数据。所有 URL 均已在 2026-11-01 通过实际网络请求访问验证（见 _research/ 抓取记录）。
// source_type: paper | official_doc | pricing | curriculum | project_doc | community | benchmark | tool_doc

export const sources = [
  {
    id: 'S-01',
    title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks',
    publisher: 'arXiv / NeurIPS 2020',
    author: 'Patrick Lewis, Ethan Perez, Aleksandra Piktus 等',
    url: 'https://arxiv.org/abs/2005.11401',
    published_at: '2020-05-22',
    accessed_at: '2026-11-01',
    source_type: 'paper',
    supports: [
      'RAG 方法的原始定义：把参数化记忆（seq2seq 模型）与非参数化记忆（可检索的稠密向量索引）结合',
      'RAG 面向知识密集型 NLP 任务，可在生成时引入外部知识',
      'RAG 属于「检索 + 生成」技术路线的奠基工作'
    ],
    notes: 'arXiv 摘要页 Comments 字段标注 "Accepted at NeurIPS 2020"，会议归属以此为准；抓取时间 2026-11-01。'
  },
  {
    id: 'S-02',
    title: 'Attention Is All You Need',
    publisher: 'arXiv / NeurIPS 2017',
    author: 'Ashish Vaswani, Noam Shazeer, Niki Parmar 等',
    url: 'https://arxiv.org/abs/1706.03762',
    published_at: '2017-06-12',
    accessed_at: '2026-11-01',
    source_type: 'paper',
    supports: [
      'Transformer 架构与自注意力机制的提出',
      '自回归生成的架构基础',
      '上下文窗口长度受注意力计算规模约束'
    ],
    notes: 'arXiv 页面 Comments 标注 "15 pages, 5 figures"；本页为 v7 修订（citation_online_date 2023-08-02）。'
  },
  {
    id: 'S-03',
    title: 'Chain-of-Thought Prompting Elicits Reasoning in Large Language Models',
    publisher: 'arXiv / NeurIPS 2022',
    author: 'Jason Wei, Xuezhi Wang, Dale Schuurmans 等',
    url: 'https://arxiv.org/abs/2201.11903',
    published_at: '2022-01-28',
    accessed_at: '2026-11-01',
    source_type: 'paper',
    supports: [
      '思维链提示可显著提升大模型在多步推理任务上的表现',
      '纯提示路线的能力上限与适用条件'
    ],
    notes: 'arXiv citation_online_date 2023-01-10（后续修订版本）。'
  },
  {
    id: 'S-04',
    title: 'ReAct: Synergizing Reasoning and Acting in Language Models',
    publisher: 'arXiv / ICLR 2023',
    author: 'Shunyu Yao, Jeffrey Zhao, Dian Yu 等',
    url: 'https://arxiv.org/abs/2210.03629',
    published_at: '2022-10-06',
    accessed_at: '2026-11-01',
    source_type: 'paper',
    supports: [
      '「推理 + 行动」交替的智能体循环范式',
      '智能体通过外部工具（如检索）补充自身知识'
    ],
    notes: 'arXiv Comments 标注 "v3 is the ICLR camera ready version with some typos fixed"，会议归属以此为准。'
  },
  {
    id: 'S-05',
    title: 'Toolformer: Language Models Can Teach Themselves to Use Tools',
    publisher: 'arXiv / NeurIPS 2023',
    author: 'Timo Schick, Jane Dwivedi-Yu, Roberto Dessì 等',
    url: 'https://arxiv.org/abs/2302.04761',
    published_at: '2023-02-09',
    accessed_at: '2026-11-01',
    source_type: 'paper',
    supports: [
      '工具调用（function calling）能力的研究来源',
      '模型可在训练阶段学会何时调用外部 API'
    ],
    notes: 'arXiv 摘要页可访问，抓取于 2026-11-01。'
  },
  {
    id: 'S-06',
    title: 'Holistic Evaluation of Language Models (HELM)',
    publisher: 'arXiv / Stanford CRFM',
    author: 'Percy Liang, Rishi Bommasani 等（Stanford CRFM）',
    url: 'https://arxiv.org/abs/2211.09110',
    published_at: '2022-11-16',
    accessed_at: '2026-11-01',
    source_type: 'paper',
    supports: [
      '多维度、跨场景的模型评估方法论',
      '本项目评测集设计的参照框架（正确性、鲁棒性、公平性、效率等维度）'
    ],
    notes: 'arXiv Comments 注明由 Stanford CRFM 撰写。Stanford CRFM 官网 https://crfm.stanford.edu/ 同日可访问。'
  },
  {
    id: 'S-07',
    title: 'Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena',
    publisher: 'arXiv / NeurIPS 2023 Datasets and Benchmarks Track',
    author: 'Lianmin Zheng, Wei-Lin Chiang  Ying Sheng 等',
    url: 'https://arxiv.org/abs/2306.05685',
    published_at: '2023-06-09',
    accessed_at: '2026-11-01',
    source_type: 'paper',
    supports: [
      'LLM-as-a-Judge 自动评分方法及其偏差（位置偏差、冗长偏差、自我偏好）',
      '本项目评测中「自动评分需人工抽检」的依据'
    ],
    notes: 'arXiv Comments 标注 "NeurIPS 2023 Datasets and Benchmarks Track"。'
  },
  {
    id: 'S-08',
    title: 'Lost in the Middle: How Language Models Use Long Contexts',
    publisher: 'arXiv / TACL',
    author: 'Nelson F. Liu, Kevin Lin, John Hewitt 等',
    url: 'https://arxiv.org/abs/2307.03172',
    published_at: '2023-07-06',
    accessed_at: '2026-11-01',
    source_type: 'paper',
    supports: [
      '长上下文中信息位置显著影响模型使用效果（U 形曲线）',
      '本项目检索结果排序策略的依据：最相关片段置于上下文首尾'
    ],
    notes: 'arXiv Comments 标注 "Accepted for publication in Transactions of the Association for Computational Linguistics"。'
  },
  {
    id: 'S-09',
    title: 'Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection',
    publisher: 'arXiv / ICLR 2024',
    author: 'Akari Asai, Zeqiu Wu, Yizhong Wang 等',
    url: 'https://arxiv.org/abs/2310.11511',
    published_at: '2023-10-17',
    accessed_at: '2026-11-01',
    source_type: 'paper',
    supports: [
      '自适应检索与自我批判（reflection token）路线',
      '「按需检索、生成后自我校验」的前沿方法，本项目未实现，作为演进方向记录'
    ],
    notes: '会议归属标注为 ICLR 2024 系依据 arXiv 页面公开信息；本次抓取未在 Comments 字段直接读到该标注，故本条会议信息证据状态记为「部分核实」。'
  },
  {
    id: 'S-10',
    title: 'Retrieval-Augmented Generation for Large Language Models: A Survey',
    publisher: 'arXiv',
    author: 'Yunfan Gao, Yun Xiong, Xinyu Gao 等',
    url: 'https://arxiv.org/abs/2312.10997',
    published_at: '2023-12-17',
    accessed_at: '2026-11-01',
    source_type: 'paper',
    supports: [
      'RAG 的三种范式划分：Naive RAG / Advanced RAG / Modular RAG',
      'RAG 系统的关键环节（检索前处理、检索、检索后处理、生成）与评测维度'
    ],
    notes: 'arXiv Comments 标注 "Ongoing Work"，属持续更新综述；引用时以访问日期版本为准。'
  },
  {
    id: 'S-11',
    title: 'Not what you\'ve signed up for: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection',
    publisher: 'arXiv',
    author: 'Kai Greshake, Sahar Abdelnabi, Shailesh Mishra 等',
    url: 'https://arxiv.org/abs/2302.12173',
    published_at: '2023-02-23',
    accessed_at: '2026-11-01',
    source_type: 'paper',
    supports: [
      '间接提示注入攻击的定义与现实应用中的可行性',
      '本项目 AI 助手需要做提示注入防护、检索内容隔离与输出边界约束'
    ],
    notes: 'arXiv 摘要页可访问，抓取于 2026-11-01。'
  },
  {
    id: 'S-12',
    title: 'RARR: Researching and Revising What Language Models Say, Using Language Models',
    publisher: 'arXiv / ACL 2023',
    author: 'Luyu Gao, Zhuyun Dai, Panupong Pasupat 等',
    url: 'https://arxiv.org/abs/2210.08726',
    published_at: '2022-10-17',
    accessed_at: '2026-11-01',
    source_type: 'paper',
    supports: [
      '事后检索与修订（attribution / editing）以提升输出可归因性',
      '「忠实度」作为独立评估维度的研究来源'
    ],
    notes: 'arXiv Comments 标注 "ACL 2023"。'
  },
  {
    id: 'S-13',
    title: 'Active Retrieval Augmented Generation',
    publisher: 'arXiv / EMNLP 2023',
    author: 'Zhengbao Jiang, Frank F. Xu, Luyu Gao 等',
    url: 'https://arxiv.org/abs/2305.06983',
    published_at: '2023-05-11',
    accessed_at: '2026-11-01',
    source_type: 'paper',
    supports: [
      'FLARE：在生成过程中按置信度主动触发检索',
      '「何时检索」是 RAG 设计的独立决策点'
    ],
    notes: 'arXiv Comments 标注 "EMNLP 2023"。'
  },
  {
    id: 'S-14',
    title: 'Gorilla: Large Language Model Connected with Massive APIs',
    publisher: 'arXiv',
    author: 'Fanjia Xu, Shishir G. Patil 等',
    url: 'https://arxiv.org/abs/2305.15334',
    published_at: '2023-05-24',
    accessed_at: '2026-11-01',
    source_type: 'paper',
    supports: [
      '面向大规模 API 调用的模型训练与评测',
      '工具调用生态中「API 文档变化导致调用失败」的现实问题'
    ],
    notes: 'arXiv 摘要页可访问，抓取于 2026-11-01。'
  },
  {
    id: 'S-15',
    title: 'API 定价 · 智谱AI开放文档',
    publisher: '智谱AI（北京智谱华章科技股份有限公司）',
    author: '智谱AI 官方',
    url: 'https://docs.bigmodel.cn/cn/guide/start/pricing',
    published_at: null,
    accessed_at: '2026-11-01',
    source_type: 'pricing',
    supports: [
      'GLM-4.7-Flash 输入/输出单价为「免费」（200K 上下文），缓存存储限时免费',
      'GLM-4.7-FlashX：输入 0.5 元/百万 Tokens，输出 3 元/百万 Tokens（200K 上下文）',
      'GLM-4.6 属「更多文本模型」档位之外的旗舰档位；GLM-5 系列输入 4–8 元、输出 18–28 元/百万 Tokens',
      'GLM 系列 Token 与汉字换算比例约 1:1.6，实际以接口返回用量为准'
    ],
    notes: '快变量。价格页面随时变动，本条记录核查日期 2026-11-01，超过 4 周未复核时前端自动标记「信息可能过期」。'
  },
  {
    id: 'S-16',
    title: 'GLM-4.6 模型说明 · 智谱AI开放文档',
    publisher: '智谱AI',
    author: '智谱AI 官方',
    url: 'https://docs.bigmodel.cn/cn/guide/models/text/glm-4.6',
    published_at: null,
    accessed_at: '2026-11-01',
    source_type: 'official_doc',
    supports: [
      'GLM-4.6 总参数 355B、激活参数 32B；上下文窗口 200K；最大输出 128K Tokens',
      '支持深度思考、流式输出、Function Calling、上下文缓存、结构化输出、MCP',
      '官方称其代码能力对齐 Claude Sonnet 4，并公开了测试题目与 Agent 轨迹数据集'
    ],
    notes: '快变量（模型能力与版本）。核查日期 2026-11-01。厂商自评数据，属一手来源但含厂商立场，引用时已注明。'
  },
  {
    id: 'S-17',
    title: '模型 & 价格 · DeepSeek API Docs',
    publisher: '杭州深度求索人工智能基础技术研究有限公司（DeepSeek）',
    author: 'DeepSeek 官方',
    url: 'https://api-docs.deepseek.com/zh-cn/quick_start/pricing',
    published_at: null,
    accessed_at: '2026-11-01',
    source_type: 'pricing',
    supports: [
      'deepseek-flash（DeepSeek-V4.1-Flash-1017）：输入 1 元/百万 tokens（缓存未命中、高峰时段 2 元）、输出 4 元/百万 tokens（高峰 8 元）；缓存命中空闲 0.02 元、高峰 0.04 元',
      'deepseek-v4-pro（DeepSeek-V4-Pro-0813）：输入 4.5 元/百万 tokens（高峰 9.0 元）、输出 13.5 元/百万 tokens（高峰 27.0 元）',
      '空闲时段（工作日 12:00–14:00、18:00 后至次日 9:00、周末与法定节假日全天）价格为高峰时段的一半',
      'deepseek-flash 上下文 1M、最大输出 384K，支持 JSON Output、Tool Calls、Responses API；deepseek-v4-pro 不支持图像理解',
      'Search/Fetch 独立按次计费：每 1,000 次成功请求 5 元，2026-11-01 00:00 起对 Harness/Claude Code/Codex 场景开始收费'
    ],
    notes: '快变量。核查日期 2026-11-01。页面明确声明「产品价格可能发生变动，DeepSeek 保留修改价格的权利」。'
  },
  {
    id: 'S-18',
    title: '首次调用 API（BASE URL 与兼容格式）· DeepSeek API Docs',
    publisher: 'DeepSeek',
    author: 'DeepSeek 官方',
    url: 'https://api-docs.deepseek.com/zh-cn/quick_start/basic_usage',
    published_at: null,
    accessed_at: '2026-11-01',
    source_type: 'official_doc',
    supports: [
      'DeepSeek 提供 OpenAI 兼容 BASE URL https://api.deepseek.com 与 Anthropic 兼容 BASE URL',
      '支持标准 chat/completions 调用形态，便于本项目做多渠道路由'
    ],
    notes: '快变量（接口形态）。核查日期 2026-11-01。'
  },
  {
    id: 'S-19',
    title: '智谱AI 开放平台（Z.ai）官网',
    publisher: '智谱AI / Z.ai',
    author: '智谱AI 官方',
    url: 'https://www.zhipuai.cn/',
    published_at: null,
    accessed_at: '2026-11-01',
    source_type: 'official_doc',
    supports: [
      '智谱提供 GLM MaaS（模型即服务）与 GLM 系列模型（GLM-5.3、GLM-5.2 等在官网首页列出）',
      '智谱定位为「一站式大模型开发平台」'
    ],
    notes: '快变量（在售模型列表）。核查日期 2026-11-01。'
  },
  {
    id: 'S-20',
    title: 'DeepSeek | 深度求索 官网',
    publisher: 'DeepSeek',
    author: 'DeepSeek 官方',
    url: 'https://www.deepseek.com/',
    published_at: null,
    accessed_at: '2026-11-01',
    source_type: 'official_doc',
    supports: [
      'DeepSeek 提供网页版应用、API 开放平台与 DeepSeek Harness',
      '官网首页公告 DeepSeek V4.1 Flash 已更新至 V4.1-Flash-1017'
    ],
    notes: '快变量（版本公告）。核查日期 2026-11-01。'
  },
  {
    id: 'S-21',
    title: '多维表格概述 · 飞书开放平台 服务端 API 文档',
    publisher: '飞书（北京字节跳动科技有限公司）',
    author: '飞书开放平台',
    url: 'https://open.feishu.cn/document/server-docs/docs/bitable-v1/bitable-overview',
    published_at: null,
    accessed_at: '2026-11-01',
    source_type: 'official_doc',
    supports: [
      '飞书多维表格提供服务端 API（bitable-v1），可用于数据读写与备份导出',
      '多维表格调用需要 tenant/user access token，属受控凭据'
    ],
    notes: '本次抓取该页面仅返回标题（正文由前端异步渲染），API 存在性成立，具体端点参数标注为「部分核实」。核查日期 2026-11-01。'
  },
  {
    id: 'S-22',
    title: '飞书多维表格｜AI 驱动的表格与业务系统搭建平台 · 飞书官网',
    publisher: '飞书',
    author: '飞书官方',
    url: 'https://www.feishu.cn/product/base',
    published_at: null,
    accessed_at: '2026-11-01',
    source_type: 'official_doc',
    supports: [
      '飞书多维表格官方定位为「AI 驱动的表格与业务系统搭建平台」',
      '多维表格属于协作型低代码数据工具，公开访问与权限边界依赖飞书账号体系'
    ],
    notes: '抓取时页面正文由 JS 渲染，仅取得标题；产品定位描述来自页面 title。核查日期 2026-11-01。'
  },
  {
    id: 'S-23',
    title: '飞书妙搭 · 课程讲义中给出的实例应用页面',
    publisher: '飞书妙搭（feishuapp.com）',
    author: '课程资料整理',
    url: 'https://icnw85hd2glo.feishuapp.com/app/app_17fwqe7be7c',
    published_at: '2026-10-17',
    accessed_at: '2026-10-17',
    source_type: 'project_doc',
    supports: [
      '课程大作业「三张活地图」的作业要求原文来源（讲义整理稿标注的原始网页）',
      '妙搭生成的应用可通过 feishuapp.com 子域访问'
    ],
    notes: '该 URL 来自项目内讲义整理稿的标注，本次未再次联网核验其可访问性，故证据状态为「部分核实」。访问日期沿用整理稿标注日期。'
  },
  {
    id: 'S-24',
    title: '人工智能前沿与创新-三张活地图讲义-一-课程大作业.md',
    publisher: '本项目仓库（课程讲义整理稿）',
    author: '课程组 / 小组整理',
    url: 'file:///D:/桌面/大作业/人工智能前沿与创新-三张活地图讲义-一-课程大作业.md',
    published_at: '2026-10-17',
    accessed_at: '2026-11-01',
    source_type: 'project_doc',
    supports: [
      '大作业要求：三张地图（领域/生态/认知）通过同一交互式网站呈现，中期起云端公开访问',
      '课程明确要求的认知方法：系统观（局部与整体、瓶颈）、发展观（方法出现背景、条件变化）',
      '课程列举的六种分析方法：问题定义、系统拆解、对照比较、演进分析、多目标取舍、反例与边界检查；要求选 2–3 种给出本组实际例子',
      '课程要求的六类成长习惯：思维、学习、实践、管理、认识更新、协作',
      '理解程度标注三档：已初步理解、已经尝试、待深入学习',
      '课程关联五档：前置基础、核心覆盖、部分涉及、实践应用、自主拓展',
      '关系词表需说明「采用/依赖/资助/付费/合作/竞争」等具体关系，未证实联系标注为推断',
      'AI 回答不能作为事实证据；自动获取信息需核实后进入正式地图；每周至少检查一次',
      '访问要求：云端运行、国内普通网络可访问、无需安装软件、无需逐人申请权限、不索取个人模型密钥',
      '现场展示 8 分钟结构：选题 1 分钟、三图 3 分钟、AI 能力 2 分钟、认识变化 1 分钟、未知与后续 1 分钟'
    ],
    notes: '一手项目资料（课程讲义整理稿），本地文件，无公开 URL。整理日期 2026-10-17。'
  },
  {
    id: 'S-25',
    title: '附件.培养方案(1).docx —— 2026级人工智能专业培养方案',
    publisher: '项目附件（学校培养方案节选）',
    author: '未署名（学校教务文件）',
    url: 'file:///D:/桌面/大作业/附件.培养方案(1).docx',
    published_at: null,
    accessed_at: '2026-11-01',
    source_type: 'curriculum',
    supports: [
      '培养目标三条（面向 AI 基础理论/核心算法/智能系统与行业应用；毕业时能力；毕业五年左右发展）',
      '毕业要求共 10 条，原文条目包括：1 数理基础与科学思维；2 计算基础与系统实现；3 人工智能核心理论与方法；4 智能系统设计与工程实现；5 交叉应用；6 科研训练与探究；7 协作沟通与项目推进；8 负责任人工智能与科技伦理；9 国际视野与跨文化交流；10 前沿追踪与终身学习',
      '毕业要求 3 明确列出「机器学习、深度学习、表示学习、推理规划、生成模型、感知与多模态处理、决策与智能体」',
      '毕业要求 4 明确列出「数据获取与处理、模型构建、训练评估、系统集成、部署优化和持续迭代」',
      '毕业要求 6 明确列出「文献检索、问题分析、实验设计、结果解释和学术表达」',
      '毕业要求 8 明确列出「安全性、公平性、透明性、隐私保护、知识产权、可解释性和社会影响」'
    ],
    notes: '一手项目资料（本地 docx，Apache POI 生成，dc:creator=Apache POI，创建时间 2026-10-17T09:20:02Z）。重要限制：该附件只包含「培养目标」与「毕业要求」，不含课程目录、学分表或教学进程表，因此所有具体课名均无法从该文件核实。'
  },
  {
    id: 'S-26',
    title: '三张活地图-项目完整方案-V2.0-一步到位版.md',
    publisher: '本项目仓库',
    author: '项目方案文档',
    url: 'file:///D:/桌面/大作业/三张活地图-项目完整方案-V2.0-一步到位版.md',
    published_at: null,
    accessed_at: '2026-11-01',
    source_type: 'project_doc',
    supports: [
      '数据模型要求（nodes / relations / sources / update_log / feedback / candidate_content 六实体及字段）',
      '证据四级状态：已核实、部分核实、推断、待核实',
      '快变量 4 周复核规则',
      '受控关系词表（solves / based_on / implemented_by / requires_knowledge / alternative_to / complements / evaluated_by / 提出 / 采用 / 依赖 / 改进 / 质疑 / taught_in / enables_practice / 资助 / 付费 / 提供 / 定价 / 合作 / 竞争 / 孵化 / 开源）',
      '三图联动透视镜与动态溯源引擎的交互规格、移动端降级与 X-Ray 开关要求',
      'AI 能力必须与地图数据集成、无命中时不得编造',
      '评测集 10–20 题及必须评估的维度'
    ],
    notes: '项目内部规格文档（一手）。本地文件。'
  },
  {
    id: 'S-27',
    title: 'SQLite | Node.js v24 Documentation（node:sqlite）',
    publisher: 'Node.js 官方',
    author: 'Node.js 项目',
    url: 'https://nodejs.org/docs/latest-v24.x/api/sqlite.html',
    published_at: null,
    accessed_at: '2026-11-01',
    source_type: 'tool_doc',
    supports: [
      'Node.js 内置 node:sqlite 模块提供 DatabaseSync、prepare/run/all 同步 API，无需原生编译依赖',
      '本项目选择 SQLite 作为存储层的技术依据'
    ],
    notes: '本地实测：Node v24.21.0 下 node:sqlite 建表/插入/查询通过（见 tests/）。'
  },
  {
    id: 'S-28',
    title: 'Installing Tailwind CSS with Vite · Tailwind CSS v4.3 Docs',
    publisher: 'Tailwind Labs',
    author: 'Tailwind CSS 官方',
    url: 'https://tailwindcss.com/docs/installation/using-vite',
    published_at: null,
    accessed_at: '2026-11-01',
    source_type: 'tool_doc',
    supports: [
      'Tailwind v4 通过 @tailwindcss/vite 插件接入 Vite，CSS 中使用 @import "tailwindcss"',
      'v4 使用 CSS-first 主题配置（@theme）而非 tailwind.config.js'
    ],
    notes: '抓取于 2026-11-01，页面显示版本 v4.3。'
  },
  {
    id: 'S-29',
    title: 'Getting Started | Vite',
    publisher: 'Vite 官方',
    author: 'Vite 团队',
    url: 'https://vite.dev/guide/',
    published_at: null,
    accessed_at: '2026-11-01',
    source_type: 'tool_doc',
    supports: [
      'Vite 提供开发服务器与生产构建（Rollup 打包）',
      '本项目前端构建与静态资源产出方式'
    ],
    notes: '抓取于 2026-11-01，导航显示 ViteConf 2026。'
  },
  {
    id: 'S-30',
    title: 'Zustand Docs',
    publisher: 'Zustand / pmndrs',
    author: 'Zustand 官方文档',
    url: 'https://zustand.docs.pmnd.rs/',
    published_at: null,
    accessed_at: '2026-11-01',
    source_type: 'tool_doc',
    supports: [
      'Zustand 为轻量全局状态库，提供 hooks-first 的 store 与选择器订阅',
      '本项目 useMapStore 全局联动状态机的实现依据'
    ],
    notes: '抓取于 2026-11-01。'
  },
  {
    id: 'S-31',
    title: 'React Reference Overview (React v19.3)',
    publisher: 'React 官方',
    author: 'React 团队',
    url: 'https://react.dev/reference/react',
    published_at: null,
    accessed_at: '2026-11-01',
    source_type: 'tool_doc',
    supports: [
      'React 19 提供 useActionState 等新 hooks；本项目使用 React 19.3.1',
      '组件化渲染与受控交互的实现基础'
    ],
    notes: '抓取于 2026-11-01，页面标注 React v19.3。'
  },
  {
    id: 'S-32',
    title: 'LangChain overview - Docs by LangChain',
    publisher: 'LangChain',
    author: 'LangChain 官方',
    url: 'https://python.langchain.com/docs/introduction/',
    published_at: null,
    accessed_at: '2026-11-01',
    source_type: 'community',
    supports: [
      'LangChain 自我定位为 agent engineering platform，提供模型/检索/工具的编排抽象',
      '开源框架社区在「论文方法 → 工程可用组件」链条中的位置'
    ],
    notes: '抓取于 2026-11-01；GitHub 仓库 https://github.com/langchain-ai/langchain 同日可访问。'
  },
  {
    id: 'S-33',
    title: 'LlamaIndex Framework Developer Documentation',
    publisher: 'LlamaIndex',
    author: 'LlamaIndex 官方',
    url: 'https://docs.llamaindex.ai/en/stable/',
    published_at: null,
    accessed_at: '2026-11-01',
    source_type: 'community',
    supports: [
      'LlamaIndex 提供数据接入、索引与检索框架，是 RAG 工程化的主流开源选择之一',
      '本项目「未采用重型框架、自建轻量检索」的对照参照'
    ],
    notes: '抓取于 2026-11-01。'
  },
  {
    id: 'S-34',
    title: 'vLLM Documentation',
    publisher: 'vLLM 项目',
    author: 'vLLM 社区',
    url: 'https://docs.vllm.ai/en/latest/',
    published_at: null,
    accessed_at: '2026-11-01',
    source_type: 'community',
    supports: [
      'vLLM 为高吞吐 LLM 推理服务引擎，代表「自建推理服务」路线',
      '与 MaaS（按 token 付费）路线的成本对照'
    ],
    notes: '抓取于 2026-11-01。本项目未部署 vLLM（无 GPU 条件），作为生态节点记录。'
  },
  {
    id: 'S-35',
    title: 'Ollama',
    publisher: 'Ollama',
    author: 'Ollama 官方',
    url: 'https://ollama.com/',
    published_at: null,
    accessed_at: '2026-11-01',
    source_type: 'community',
    supports: [
      'Ollama 支持在本地与云端运行开源模型，代表「本地部署、零 API 费用」路线',
      '本项目离线降级能力的可选实现路径'
    ],
    notes: '抓取于 2026-11-01（页面显示 GitHub 185.5K stars）。本项目未实际部署。'
  },
  {
    id: 'S-36',
    title: 'Hugging Face Hub documentation',
    publisher: 'Hugging Face',
    author: 'Hugging Face 官方',
    url: 'https://huggingface.co/docs/hub/index',
    published_at: null,
    accessed_at: '2026-11-01',
    source_type: 'community',
    supports: [
      'Hugging Face Hub 提供模型、数据集与 Spaces 托管，是开源模型与数据集的主要分发渠道',
      '生态链中「模型提供方 ↔ 开源社区」的连接点'
    ],
    notes: '抓取于 2026-11-01；https://huggingface.co/ 同日可访问。'
  },
  {
    id: 'S-37',
    title: 'NeurIPS 2026 Conference 官网',
    publisher: 'Neural Information Processing Systems Foundation',
    author: 'NeurIPS',
    url: 'https://neurips.cc/',
    published_at: null,
    accessed_at: '2026-11-01',
    source_type: 'community',
    supports: [
      'NeurIPS 为机器学习领域顶级学术会议，官网可查会议信息',
      'RAG（S-01）、CoT（S-03）、Toolformer（S-05）、HELM（S-06）等论文的会议归属参照'
    ],
    notes: '抓取于 2026-11-01（页面显示 2026 Conference）。会议类别（CCF A/B）未从 CCF 官方站点取得，见 S-41。'
  },
  {
    id: 'S-38',
    title: 'ICLR 2027 Conference 官网',
    publisher: 'International Conference on Learning Representations',
    author: 'ICLR',
    url: 'https://iclr.cc/',
    published_at: null,
    accessed_at: '2026-11-01',
    source_type: 'community',
    supports: [
      'ICLR 为表示学习领域顶级学术会议，采用公开评审',
      'ReAct（S-04）的会议归属参照（arXiv Comments 标注 ICLR camera ready）'
    ],
    notes: '抓取于 2026-11-01（页面显示 2027 Conference）。'
  },
  {
    id: 'S-39',
    title: 'Stanford Center for Research on Foundation Models (CRFM)',
    publisher: 'Stanford HAI / CRFM',
    author: 'Stanford CRFM',
    url: 'https://crfm.stanford.edu/',
    published_at: null,
    accessed_at: '2026-11-01',
    source_type: 'community',
    supports: [
      'CRFM 是 HELM 评测体系与基础模型研究的代表性学术机构',
      '生态地图中「学术团队 → 评测基准 → 产业实践」的关系依据'
    ],
    notes: '抓取于 2026-11-01，页面列出 People/Report/Research/HELM/Levanter/FMTI/Openness/Ecosystem Graphs/Policy 等栏目。'
  },
  {
    id: 'S-40',
    title: 'Ragas Documentation',
    publisher: 'Ragas（Exploding Gradients）',
    author: 'Ragas 官方',
    url: 'https://docs.ragas.io/',
    published_at: null,
    accessed_at: '2026-11-01',
    source_type: 'tool_doc',
    supports: [
      'Ragas 提供 RAG 专用评测指标（如 faithfulness、answer relevancy、context precision/recall）',
      '本项目评测维度命名与定义的外部参照'
    ],
    notes: '抓取于 2026-11-01。本项目自建轻量评测脚本，未引入 Ragas 依赖。'
  },
  {
    id: 'S-41',
    title: 'CCF 推荐国际学术会议目录（中国计算机学会）',
    publisher: '中国计算机学会 CCF',
    author: 'CCF',
    url: 'https://www.ccf.org.cn/Academic_Evaluation/By_category/',
    published_at: null,
    accessed_at: '2026-11-01',
    source_type: 'official_doc',
    supports: [
      '未取得：本次访问该 URL 返回站点 WAF 挑战页（CF_APP_WAF），未能取得目录正文'
    ],
    notes: '抓取失败记录（2026-11-01）。因此本项目所有会议「CCF A/B 类」标注一律记为「待核实」，不得凭印象标注；仅保留 arXiv 页面明确写出的会议名（如 NeurIPS 2020、ICLR 2023、ACL 2023、EMNLP 2023）。'
  },
  {
    id: 'S-42',
    title: 'Playwright（本项目端到端测试工具）',
    publisher: 'Microsoft',
    author: 'Playwright 团队',
    url: 'https://playwright.dev/',
    published_at: null,
    accessed_at: '2026-11-01',
    source_type: 'tool_doc',
    supports: [
      'Playwright 支持 Chromium 无头浏览器自动化，用于本项目真实端到端验收测试与截图',
      '本地实测：playwright 1.62.1 + chromium-1248 可用（见 tests/e2e.mjs 运行记录）'
    ],
    notes: '本地运行时环境中已存在 playwright 1.62.1 与 Chromium 浏览器包；官网 URL 未在本次联网抓取列表中，可访问性以本地实测为准。'
  },
  {
    id: 'S-43',
    title: '本项目实际模型调用与评测运行记录',
    publisher: '本项目（three-living-maps）',
    author: 'Codex Agent 实测',
    url: 'file:///D:/桌面/大作业/three-living-maps/data/eval-results.json',
    published_at: '2026-11-01',
    accessed_at: '2026-11-01',
    source_type: 'benchmark',
    supports: [
      '本项目 AI 助手的真实运行结果、耗时、token 用量与评分（由 scripts/run-eval.mjs 实际执行生成）',
      '评测环境信息（Node 版本、模型渠道、并发数）'
    ],
    notes: '一手运行数据。所有分数来自实际执行，禁止预填；重新执行 npm run eval 可复现。'
  },
  {
    id: 'S-44',
    title: '「三张活地图」小组分工细则（V1.1）',
    publisher: '本项目小组（成员确认文档）',
    author: '刘京 · 秦伟轩 · 鲍家弘 · 解子杰（组长）',
    url: 'file:///D:/BJH/三张活地图-小组分工细则.pdf',
    published_at: '2026-11-02',
    accessed_at: '2026-11-02',
    source_type: 'project_doc',
    supports: [
      '小组成员 4 人及角色：刘京（内容治理与项目文档负责人）、秦伟轩（数据与后端负责人）、鲍家弘（前端与可视化负责人）、解子杰（组长·项目统筹与 AI/评测负责人）',
      '工作量占比约 25%/人，实测分摊 25:24:24:27；技术开发与内容建设双线切分',
      '内容建设量化分摊：领域节点 鲍34/解33；生态节点 刘22/秦22；认知节点 刘30；关系登记 58/48/64/63；来源提交 12/11/10/10；评测题 3/3/4/4（合计与线上 141/233/43/14 一致）',
      '技术开发模块归属 13 项（数据库/公开API/管理端/安全/前端/三图渲染/移动端/检索/AI/评测/测试/部署/内容治理），每项含牵头人与协作人',
      '阶段里程碑 P1–P6 人员任务矩阵（选题规划→数据建设→功能开发→联调测试→部署交付→运维更新）',
      '协作机制：Git 分支+交叉评审、DATA-DICTIONARY 为接口唯一事实来源、内容流水线（撰写→来源→验收→入库→呈现）、反馈转修改闭环、每周例会、密钥纪律',
      '质量与学术诚信约定 6 条（待核实标注、禁止预填分数、knowledge_status 不猜测、贡献依据真实记录、抓取失败保留记录、快变量标核查日期）',
      '文档版本 V1.1，编制日期 2026-11-02（修订：解子杰任组长）；成员签字确认栏当前为空白，细则经四人签字后生效'
    ],
    notes: '一手项目文档（PDF，8 页，789104 字节），2026-11-02 由 pypdf 提取全文存档于 research/分工细则-extracted.txt。诚实标注：成员签字栏为空白，细则自述「经全体成员确认后生效」；本站在签字完成前将其作为「成员已编制、待签字确认」的贡献依据展示，不宣称已完成签字。'
  }
];


export default sources;