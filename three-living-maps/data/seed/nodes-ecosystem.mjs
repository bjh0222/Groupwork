// 生态地图节点（E- 前缀）。结构为「参与者 × 关系链」。
// participant_role: 论文方法 / 模型提供方 / 开源社区 / 应用 / 使用者 / 学术机构 / 会议 / 成本项 / 规则与责任
// chain: main_a（论文->模型方->社区->本组应用->使用者）| side_b（成本承担）| dim_c（其他观察维度）
const NOW = '2026-11-01';

function e(id, o) {
  return {
    id,
    title: o.t,
    map_type: 'ecosystem',
    node_type: o.type,
    section: o.chain === 'main_a' ? 'A' : o.chain === 'side_b' ? 'B' : 'C',
    summary: o.s,
    details: o.d,
    tags: o.tags || [],
    source_ids: o.src,
    evidence_status: o.ev || '已核实',
    evidence_note: o.evn || null,
    knowledge_status: '未评估',
    career_tracks: o.tr || ['all'],
    participant_role: o.role,
    chain: o.chain,
    cost_side: o.cost || null,
    why_included: o.why,
    last_checked: o.lc || NOW,
    fast_variable: !!o.fast,
    limit: o.limit || null
  };
}

export const ecosystemNodes = [
  // ========== 主线 A-1：论文与方法 ==========
  e('E-PA-RAG', {
    t: '论文：RAG（Lewis 等，NeurIPS 2020）', type: 'paper', chain: 'main_a', role: '论文方法',
    s: '《Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks》，本项目主技术路线的原始出处；会议归属经 arXiv Comments 与 Semantic Scholar 双重印证。',
    d: [
      '核心贡献：提出把参数化记忆（seq2seq 模型）与非参数化记忆（稠密向量索引）结合，用于知识密集型任务。',
      '在生态链中的位置：这是「论文 -> 模型提供方 -> 工具社区 -> 本组应用」链条的起点之一，几乎所有后续 RAG 工程实践都可追溯到此。',
      '核实记录（2026-11-01）：arXiv Comments 明确写有 "Accepted at NeurIPS 2020"；Semantic Scholar venue 为 Neural Information Processing Systems、year 2020、引用数 20461。两源一致，标为已核实。',
      '作者机构（来自 Semantic Scholar 元数据，单一来源故标部分核实）：Facebook AI Research、New York University、University College London。',
      '对本项目的直接影响：领域节点 D-C-RAG、技术路线 D-A-RAG、中枢任务 D-TASK-CORE 的方法依据。'
    ],
    tags: ['论文', 'RAG', 'NeurIPS 2020'], src: ['S-01'], tr: ['scientist'],
    why: '本项目主技术路线的原始文献，是整条生态链的起点，必须纳入。',
    evn: '会议归属已核实（arXiv Comments + S2 venue 双源一致）；作者机构仅来自 Semantic Scholar 元数据，标为部分核实。'
  }),
  e('E-PA-TRANSFORMER', {
    t: '论文：Attention Is All You Need（Vaswani 等，NeurIPS 2017）', type: 'paper', chain: 'main_a', role: '论文方法',
    s: 'Transformer 与自注意力机制的原始论文，是全部大语言模型的架构基础；Semantic Scholar 引用数已超 20 万。',
    d: [
      '核心贡献：提出完全基于注意力的 Transformer 架构，取代循环与卷积结构。',
      '在生态链中的位置：位于 RAG 等应用方法的上游——没有 Transformer 就没有后续所有 LLM 应用层工作。',
      '核实记录（2026-11-01）：arXiv Comments 仅写 "15 pages, 5 figures"（未标会议）；Semantic Scholar venue 为 Neural Information Processing Systems、year 2017、引用数 200819。会议归属为单一来源印证，标为部分核实。',
      '作者机构（S2 元数据）：Google、University of Toronto。',
      '对本项目的直接影响：D-C-AR（自回归生成）、D-C-CTX（上下文窗口的架构约束）的原理来源。'
    ],
    tags: ['论文', 'Transformer', '架构基础'], src: ['S-02'], tr: ['scientist'],
    why: '所有 LLM 应用的架构前提；不纳入则无法解释上下文窗口与自回归生成的约束来源。',
    evn: '会议归属仅由 Semantic Scholar 单一来源印证（arXiv Comments 未标会议），故标部分核实。'
  }),
  e('E-PA-REACT', {
    t: '论文：ReAct（Yao 等，ICLR 2023）', type: 'paper', chain: 'main_a', role: '论文方法',
    s: '提出「推理 + 行动」交错的智能体范式，是智能体循环与工具调用类应用的直接来源。',
    d: [
      '核心贡献：把推理轨迹与外部行动交错，使模型能通过工具补充知识并自我修正。',
      '核实记录（2026-11-01）：arXiv Comments 写有 "v3 is the ICLR camera ready version"；Semantic Scholar venue 为 International Conference on Learning Representations、year 2022、引用数 13321。两源一致指向 ICLR，标为已核实（年份差异系 arXiv 首发年与会议年之别）。',
      '作者机构（S2 元数据）：University of California, Davis。',
      '对本项目的关系：D-C-AGENT 与 D-A-AGENTIC 的方法来源；本项目未实现该路线，但明确记录了不采用的理由。',
      '生态意义：ReAct 是「论文方法 -> 框架实现」链条的典型——LangChain 等框架把该范式封装为可直接调用的 Agent 抽象。'
    ],
    tags: ['论文', '智能体', 'ICLR 2023'], src: ['S-04'], tr: ['scientist', 'engineer'],
    why: '智能体路线的原始文献；本项目把它作为对照路线记录，需要可追溯的出处。'
  }),
  e('E-PA-TOOLFORMER', {
    t: '论文：Toolformer（Schick 等，NeurIPS 2023）', type: 'paper', chain: 'main_a', role: '论文方法',
    s: '证明语言模型可通过自监督学会何时调用外部 API，是工具调用能力进入模型训练阶段的关键工作。',
    d: [
      '核心贡献：模型自己生成 API 调用标注并按是否降低困惑度筛选，从而学会工具使用。',
      '核实记录（2026-11-01）：Semantic Scholar venue 为 Neural Information Processing Systems、year 2023；arXiv Comments 未标会议。单一来源印证，标为部分核实。',
      '作者机构（S2 元数据）：FAIR / Facebook、University of Washington。',
      '对本项目的关系：D-C-TOOL 的研究来源；也解释了为什么现在主流商用模型（GLM-4.6、deepseek-flash）都原生支持 Function Calling（S-16、S-17）。',
      '生态意义：把「工具调用」从应用层技巧变成模型层能力，直接推动了 MCP 等标准接口出现。'
    ],
    tags: ['论文', '工具调用', 'NeurIPS 2023'], src: ['S-05'], tr: ['scientist', 'engineer'],
    why: '解释产业模型为何普遍支持 Function Calling，连接学术方法与产品能力。',
    evn: '会议归属仅由 Semantic Scholar 单一来源印证，标部分核实。'
  }),
  e('E-PA-RAGSURVEY', {
    t: '论文：RAG Survey（Gao 等，2023，持续更新）', type: 'paper', chain: 'main_a', role: '论文方法',
    s: 'RAG 领域综述，提出 Naive / Advanced / Modular RAG 三范式划分与检索前-检索-检索后-生成的环节框架。',
    d: [
      '核心贡献：系统梳理 RAG 的演进、关键环节与评测维度，是入门该领域最高效的单一文献。',
      '核实记录（2026-11-01）：arXiv Comments 标注 "Ongoing Work"；Semantic Scholar venue 为 arXiv.org（预印本，未标会议）、year 2023、引用数 4419。因此本项目将其定性为「高影响力预印本综述」而非会议论文，标为部分核实。',
      '对本项目的关系：D-C-RAG 的范式划分、D-C-CHUNK 的分块环节定位、D-A-FINETUNE 与 RAG 分工的对比依据。',
      '使用注意：作为持续更新的综述，引用时须以访问日期版本为准；本项目访问版本为 2026-11-01。'
    ],
    tags: ['论文', '综述', '预印本'], src: ['S-10'], tr: ['scientist'],
    why: '提供 RAG 的整体框架与术语口径，使本项目节点划分有文献依据而非自创。',
    ev: '部分核实',
    evn: '属持续更新的 arXiv 预印本综述（Comments 标注 Ongoing Work，S2 venue 为 arXiv.org），未取得会议归属，标部分核实。'
  }),
  e('E-PA-HELM', {
    t: '论文/基准：HELM（Stanford CRFM，2022）', type: 'benchmark', chain: 'main_a', role: '学术机构成果',
    s: '《Holistic Evaluation of Language Models》，由 Stanford CRFM 撰写的多维模型评估框架，本项目评测维度设计的方法论参照。',
    d: [
      '核心贡献：主张跨场景、多维度（准确性、鲁棒性、公平性、效率等）评估，而非单一榜单分数。',
      '核实记录（2026-11-01）：arXiv Comments 明确写 "Authored by the Center for Research on Foundation Models (CRFM) at the Stanford Institute for Human-Centered AI"；Semantic Scholar venue 为 arXiv.org。机构归属已由 arXiv 一手信息核实；会议归属未取得，标为部分核实。',
      '对本项目的关系：D-C-EVALDIM 与 D-AB-04 的方法论依据；评测报告的「多维度 + 局限性」结构直接源于此。',
      '生态意义：HELM 代表学术机构在「谁来评价模型」这一问题上的角色——厂商自评（如 S-16）之外的独立第三方评估。'
    ],
    tags: ['评测基准', 'Stanford', '方法论'], src: ['S-06', 'S-39'], tr: ['scientist'],
    why: '本项目评测体系的直接方法论来源，且代表学术机构在评估生态中的独立角色。',
    evn: '机构归属由 arXiv Comments 一手核实；会议归属未取得（S2 venue 为 arXiv.org），标部分核实。'
  }),
  e('E-PA-JUDGE', {
    t: '论文：LLM-as-a-Judge / MT-Bench（Zheng 等，NeurIPS 2023 D&B）', type: 'paper', chain: 'main_a', role: '论文方法',
    s: '系统研究用 LLM 做自动评分的一致性与偏差，明确指出位置偏差、冗长偏差与自我偏好偏差。',
    d: [
      '核心贡献：提出 MT-Bench 与 Chatbot Arena，并量化 LLM 裁判的偏差来源。',
      '核实记录（2026-11-01）：arXiv Comments 写 "NeurIPS 2023 Datasets and Benchmarks Track"；Semantic Scholar venue 为 Neural Information Processing Systems、year 2023、引用数 12751。两源一致，标为已核实。',
      '对本项目的关系：D-A-LLMJUDGE 的方法来源与风险警示。本项目据此把自动评分明确标注为「待人工复核」，并只让裁判做要点命中判断而非开放式打分。',
      '诚实标注：本项目评测使用了 LLM 辅助判断，存在裁判与被评模型同源导致自我偏好的风险，已写入评测报告局限性章节。'
    ],
    tags: ['论文', '评测', 'NeurIPS 2023'], src: ['S-07'], tr: ['scientist'],
    why: '本项目评测方法的直接依据，且提供了必须诚实披露的偏差风险。'
  }),
  e('E-PA-LOSTMID', {
    t: '论文：Lost in the Middle（Liu 等，TACL 2023）', type: 'paper', chain: 'main_a', role: '论文方法',
    s: '实证表明关键信息位于长上下文中间时模型使用效果显著下降，性能呈 U 形分布。',
    d: [
      '核心贡献：用多模型多任务实验揭示长上下文的位置效应，推翻「窗口越大越好」的朴素假设。',
      '核实记录（2026-11-01）：arXiv Comments 写 "Accepted for publication in Transactions of the Association for Computational Linguistics (TACL)"；Semantic Scholar venue 为 TACL、year 2023、引用数 5788。两源一致，标为已核实。',
      '作者机构（S2 元数据）：Stanford University、Samaya AI。',
      '对本项目的直接工程影响：检索片段排序策略——top-1 置于资料区首、top-2 置于尾，K 默认 5。这是「论文结论直接改变一行代码」的典型案例，也是认知地图中系统拆解方法的素材。'
    ],
    tags: ['论文', '上下文', 'TACL 2023', '实证'], src: ['S-08'], tr: ['scientist', 'engineer'],
    why: '其结论直接改变了本项目的提示构造代码，是学术成果落地为工程决策的实例。'
  }),
  e('E-PA-SELFRAG', {
    t: '论文：Self-RAG（Asai 等，ICLR 2024）', type: 'paper', chain: 'main_a', role: '论文方法',
    s: '引入反思标记让模型自主决定检索时机并批判自身输出，代表 RAG 从「固定管线」走向「自适应」的演进方向。',
    d: [
      '核心贡献：训练模型输出 reflection token，实现按需检索与自我批判。',
      '核实记录（2026-11-01）：arXiv Comments 仅写 "30 pages, 2 figures, 12 tables"（未标会议）；Semantic Scholar venue 为 International Conference on Learning Representations、year 2023。会议归属为单一来源印证，标为部分核实。',
      '作者机构（S2 元数据）：University of Washington。',
      '对本项目的关系：D-C-AGENT 与 D-A-AGENTIC 的演进方向记录；本项目未实现，原因是延迟与成本不可控（决策见 DECISIONS.md）。',
      '生态意义：说明「何时检索」正在从工程参数变成模型能力，这会改变未来 RAG 应用的架构分工。'
    ],
    tags: ['论文', '自适应检索', '演进方向'], src: ['S-09'], tr: ['scientist'],
    why: '记录技术演进方向，支撑发展观分析（方法出现的条件与带来的新限制）。',
    ev: '部分核实',
    evn: '会议归属（ICLR）仅由 Semantic Scholar 单一来源印证，arXiv Comments 未标会议，故标部分核实。'
  }),
  e('E-PA-INJECTION', {
    t: '论文：间接提示注入（Greshake 等，AISec@CCS 2023）', type: 'paper', chain: 'main_a', role: '论文方法',
    s: '《Not what you have signed up for》，首次系统演示对真实 LLM 集成应用的间接提示注入攻击，是本项目安全设计的依据。',
    d: [
      '核心贡献：证明攻击者可把指令藏进模型会读取的外部内容（网页、文档），从而劫持 LLM 应用行为。',
      '核实记录（2026-11-01）：Semantic Scholar venue 为 AISec@CCS、year 2023、引用数 2393；arXiv Comments 未标会议。单一来源印证，标为部分核实。',
      '作者机构（S2 元数据）：Max Planck Institute for Security and Privacy。',
      '对本项目的直接影响：D-C-INJ 的研究来源，以及五项防护设计（输入校验、资料与指令隔离、白名单输出、密钥服务端隔离、限流）的直接依据。',
      '诚实标注：该论文的攻击面在 RAG 系统中天然存在，本项目措施降低成功率但不能保证免疫，残余风险已写入节点详情与验收报告。'
    ],
    tags: ['论文', '安全', '提示注入'], src: ['S-11'], tr: ['engineer', 'scientist'],
    why: '本项目安全架构的唯一直接文献依据，缺此则防护措施无法追溯。',
    evn: '会议归属仅由 Semantic Scholar 单一来源印证，标部分核实。'
  }),
  e('E-PA-RARR', {
    t: '论文：RARR（Gao 等，ACL 2023）', type: 'paper', chain: 'main_a', role: '论文方法',
    s: '通过事后检索与修订提升输出的可归因性，把「归属证据」确立为独立于正确性的评估目标。',
    d: [
      '核心贡献：提出 Research-and-Revise 框架，在不大幅改写原文的前提下为输出补充证据或修正错误。',
      '核实记录（2026-11-01）：arXiv Comments 写 "ACL 2023"；Semantic Scholar venue 为 Annual Meeting of the Association for Computational Linguistics、引用数 409。两源一致，标为已核实（S2 year 字段为 2022，系 arXiv 首发年）。',
      '作者机构（S2 元数据）：Carnegie Mellon University、University of California, Irvine。',
      '对本项目的关系：D-C-FAITH 与 D-TASK-CMP-02 的理论依据——「引用准确性」必须与「答案正确性」分开计分。'
    ],
    tags: ['论文', '可归因性', 'ACL 2023'], src: ['S-12'], tr: ['scientist'],
    why: '确立「可归因性」为独立评估目标，直接支撑本项目引用校验设计。'
  }),
  e('E-PA-FLARE', {
    t: '论文：FLARE / Active RAG（Jiang 等，EMNLP 2023）', type: 'paper', chain: 'main_a', role: '论文方法',
    s: '《Active Retrieval Augmented Generation》，在生成过程中按置信度主动触发检索，说明「何时检索」本身是设计变量。',
    d: [
      '核心贡献：提出前瞻式主动检索，在模型即将生成低置信内容时提前检索。',
      '核实记录（2026-11-01）：arXiv Comments 写 "EMNLP 2023"；Semantic Scholar venue 为 Conference on Empirical Methods in Natural Language Processing、year 2023、引用数 950。两源一致，标为已核实。',
      '作者机构（S2 元数据）：Carnegie Mellon University、Beihang University、Sea AI Lab。',
      '对本项目的关系：D-C-AGENT 中「主动检索变体」的出处；本项目采用固定检索时机（每次提问检索一次），是有意识的简化。'
    ],
    tags: ['论文', '主动检索', 'EMNLP 2023'], src: ['S-13'], tr: ['scientist'],
    why: '与 Self-RAG 共同构成 RAG 演进方向的证据，支撑发展观分析。'
  }),
  e('E-PA-GORILLA', {
    t: '论文：Gorilla（Patil 等，NeurIPS 2023）', type: 'paper', chain: 'main_a', role: '论文方法',
    s: '面向大规模 API 调用的模型训练与评测，指出 API 文档变化会导致模型调用失败这一现实工程问题。',
    d: [
      '核心贡献：提出可检索感知的 API 调用训练方法与 APIBench 评测。',
      '核实记录（2026-11-01）：Semantic Scholar venue 为 Neural Information Processing Systems、year 2023、引用数 1827；arXiv Comments 未标会议。单一来源印证，标为部分核实。',
      '作者机构（S2 元数据）：UC Berkeley。',
      '对本项目的关系：D-C-TOOL 的研究来源之一；其「API 文档会变」的结论正是本项目把所有平台能力标注核查日期的理由。',
      '生态意义：揭示模型提供方与工具提供方之间的耦合风险——工具改接口，模型就会调用失败。'
    ],
    tags: ['论文', 'API 调用', 'NeurIPS 2023'], src: ['S-14'], tr: ['engineer', 'scientist'],
    why: '解释工具生态与模型能力的耦合风险，支撑「快变量必须标注核查日期」的治理规则。',
    evn: '会议归属仅由 Semantic Scholar 单一来源印证，标部分核实。'
  }),
  e('E-PA-COT', {
    t: '论文：Chain-of-Thought（Wei 等，NeurIPS 2022）', type: 'paper', chain: 'main_a', role: '论文方法',
    s: '证明思维链提示能显著提升大模型多步推理表现，是纯提示路线能力的上限参照。',
    d: [
      '核心贡献：仅需在提示中加入中间推理示例，即可大幅提升多步推理准确率。',
      '核实记录（2026-11-01）：Semantic Scholar venue 为 Neural Information Processing Systems、year 2022、引用数 23480；arXiv Comments 未标会议。单一来源印证，标为部分核实。',
      '作者机构（S2 元数据）：Google、Inflection AI。',
      '对本项目的关系：D-C-PROMPT 与 D-A-PROMPTONLY 的依据。本项目在 RAG 管线内部保留思维链技巧，用于组织「先列依据、再给结论」的输出结构。'
    ],
    tags: ['论文', '提示工程', 'NeurIPS 2022'], src: ['S-03'], tr: ['scientist', 'designer'],
    why: '纯提示路线的能力依据，也是本项目输出结构设计的来源。',
    evn: '会议归属仅由 Semantic Scholar 单一来源印证，标部分核实。'
  }),
  // ========== 主线 A-2：模型提供方 ==========
  e('E-OR-ZHIPU', {
    t: '智谱AI（北京智谱华章科技股份有限公司 / Z.ai）', type: 'company', chain: 'main_a', role: '模型提供方',
    s: '国内大模型厂商，提供 GLM 系列模型与 MaaS 服务，官网自述为「一站式大模型开发平台」；本项目主模型渠道。',
    d: [
      '可核实事实（核查日期 2026-11-01）：官网 zhipuai.cn 首页列出 GLM-5.3、GLM-5.2 等模型与 GLM MaaS 产品；文档站 docs.bigmodel.cn 提供完整 API 与定价文档（含 /llms.txt 索引）。',
      '在本项目中的角色：提供 GLM-4.7-Flash（免费档）作为 AI 助手主模型，GLM-4.6 作为质量上限对照（S-15、S-16）。',
      '与开源社区的关系：GitHub 组织 THUDM 可访问（本次抓取确认），说明其同时参与开源生态。',
      '商业立场提示：GLM-4.6 的「对齐 Claude Sonnet 4」等能力表述为厂商自评（S-16），本项目引用时一律标注「官方称」，不作为独立核实结论。',
      '成本承担关系：智谱承担模型训练与推理算力成本，通过按 token 计费回收；本项目作为应用方承担调用成本（见辅线 B）。'
    ],
    tags: ['厂商', '智谱', 'GLM', '模型提供方'], src: ['S-15', 'S-16', 'S-19'], tr: ['engineer'],
    why: '本项目实际使用的模型提供方，主链条中「模型提供方」环节的核心参与者。', fast: true
  }),
  e('E-OR-DEEPSEEK', {
    t: 'DeepSeek（杭州深度求索人工智能基础技术研究有限公司）', type: 'company', chain: 'main_a', role: '模型提供方',
    s: '国内大模型厂商，提供 deepseek-flash 与 deepseek-v4-pro 两档 API，价格采用高峰/空闲双时段制；本项目备用模型渠道。',
    d: [
      '可核实事实（核查日期 2026-11-01）：官网首页公告 DeepSeek V4.1 Flash 已更新至 V4.1-Flash-1017；API 文档提供 OpenAI 与 Anthropic 两种兼容 BASE URL；定价页给出 flash 与 pro 两档的完整价格与并发限制（S-17、S-18、S-20）。',
      '在本项目中的角色：备用模型渠道 + 成本对照。代码路径完整可用，但因未取得官方密钥，对 DeepSeek 官方端点的真实调用在本次交付中未验证（已在 D-T-DSAPI 诚实标注）。',
      '定价机制的生态意义：高峰/空闲双价（空闲为高峰一半）是一种用价格引导算力削峰的产业做法，直接影响应用方的调用策略——本项目因此把评测安排在可控时段并记录运行时间。',
      'Search/Fetch 独立计费（每 1,000 次成功请求 5 元），且官方声明自 2026-11-01 00:00 起对 Agent 工具场景开始收费，说明「附加能力单独计价」正成为行业趋势。'
    ],
    tags: ['厂商', 'DeepSeek', '模型提供方', '定价'], src: ['S-17', 'S-18', 'S-20'], tr: ['engineer'],
    why: '本项目备用渠道，且其双时段定价是「谁承担成本」辅线的关键案例。', fast: true
  }),
  e('E-OR-GOOGLE', {
    t: 'Google（Transformer 与 CoT 的提出机构）', type: 'org', chain: 'main_a', role: '学术/产业机构',
    s: 'Transformer（2017）与 Chain-of-Thought（2022）两篇奠基论文的作者机构，是本项目所用方法的学术源头之一。',
    d: [
      '核实依据（2026-11-01）：Semantic Scholar 对 1706.03762 与 2201.11903 的作者机构字段均包含 Google；两篇论文在本项目涉及的 14 篇中出现频次并列最高（各 2 篇）。',
      '在生态链中的位置：属于「论文/方法」环节的上游贡献者，其成果通过开源实现与商用模型扩散到整个产业。',
      '证据强度标注（诚实）：机构归属来自 Semantic Scholar 的元数据聚合，属单一来源；论文本身未在本次研究中逐篇核对作者单位页脚，故标为部分核实。',
      '与本项目的关系：不直接提供本项目使用的服务，但其方法（自注意力、思维链）通过 D-C-AR、D-C-PROMPT 影响本项目的实现。'
    ],
    tags: ['机构', 'Google', '论文源头'], src: ['S-02', 'S-03'], tr: ['scientist'],
    why: '本项目所用两项基础方法的提出机构，用于说明学术成果如何进入产业应用。',
    ev: '部分核实',
    evn: '机构归属来自 Semantic Scholar 元数据（单一来源），未逐篇核对论文作者单位页脚。'
  }),
  e('E-OR-STANFORD', {
    t: 'Stanford University / CRFM', type: 'lab', chain: 'main_a', role: '学术机构',
    s: 'HELM 评测体系的撰写机构（Center for Research on Foundation Models，隶属 Stanford HAI），代表独立第三方评估力量。',
    d: [
      '核实依据（2026-11-01）：arXiv Comments 一手注明 HELM 由 Stanford CRFM 撰写（S-06）；CRFM 官网 crfm.stanford.edu 可访问，列出 People / Report / Research / HELM / Levanter / FMTI / Openness / Ecosystem Graphs / Policy 等栏目（S-39）。',
      '另有 Lost in the Middle（S-08）作者机构含 Stanford University，Semantic Scholar 亦确认；说明该校在「长上下文使用」与「模型评估」两个方向均有产出。',
      '在生态链中的位置：不参与模型销售，而是提供评估框架与开放性研究，制约厂商自评的片面性。',
      '对本项目的关系：D-C-EVALDIM 的多维度评估思想来源；也提醒本项目「厂商称对齐某某模型」这类表述需要独立评估佐证。'
    ],
    tags: ['机构', 'Stanford', 'CRFM', '评测'], src: ['S-06', 'S-08', 'S-39'], tr: ['scientist'],
    why: '代表生态中的独立评估角色，与厂商自评形成对照，是理解「谁在评价模型」的关键参与者。'
  }),
  e('E-OR-CMU', {
    t: 'Carnegie Mellon University', type: 'lab', chain: 'main_a', role: '学术机构',
    s: 'RARR（可归因性）与 FLARE（主动检索）两篇论文的作者机构之一，在本项目涉及的可靠性方向上贡献集中。',
    d: [
      '核实依据（2026-11-01）：Semantic Scholar 对 2210.08726（RARR）与 2305.06983（FLARE）的作者机构字段均包含 Carnegie Mellon University。',
      '在生态链中的位置：与 Google、Stanford、UW 并列，是本项目引用论文中出现频次 >= 2 的四家机构之一。',
      '证据强度标注：机构归属为 Semantic Scholar 单一来源，标为部分核实。',
      '对本项目的关系：其成果支撑 D-C-FAITH（可归因性）与 D-C-AGENT（主动检索变体）两个概念节点。'
    ],
    tags: ['机构', 'CMU', '论文源头'], src: ['S-12', 'S-13'], tr: ['scientist'],
    why: '在「可归因性 + 主动检索」这一本项目核心关注方向上贡献集中的学术机构。',
    ev: '部分核实',
    evn: '机构归属来自 Semantic Scholar 元数据（单一来源）。'
  }),
  e('E-OR-UW', {
    t: 'University of Washington', type: 'lab', chain: 'main_a', role: '学术机构',
    s: 'Self-RAG 与 Toolformer 两篇论文的作者机构之一，方向覆盖自适应检索与工具调用训练。',
    d: [
      '核实依据（2026-11-01）：Semantic Scholar 对 2310.11511（Self-RAG）与 2302.04761（Toolformer）的作者机构字段均包含 University of Washington。',
      '在生态链中的位置：本项目引用论文中出现频次 >= 2 的四家机构之一。',
      '证据强度标注：机构归属为 Semantic Scholar 单一来源，标为部分核实。',
      '对本项目的关系：其成果支撑 D-C-AGENT（自我批判变体）与 D-C-TOOL（工具调用训练）两个概念节点。'
    ],
    tags: ['机构', 'UW', '论文源头'], src: ['S-09', 'S-05'], tr: ['scientist'],
    why: '在工具调用与自适应检索方向贡献集中的学术机构。',
    ev: '部分核实',
    evn: '机构归属来自 Semantic Scholar 元数据（单一来源）。'
  }),
  e('E-OR-FAIR', {
    t: 'Meta / Facebook AI Research (FAIR)', type: 'lab', chain: 'main_a', role: '学术/产业机构',
    s: 'RAG 原始论文与 Toolformer 的作者机构之一，是本项目主技术路线的学术源头。',
    d: [
      '核实依据（2026-11-01）：Semantic Scholar 对 2005.11401（RAG）标注 Facebook AI Research，对 2302.04761（Toolformer）标注 FAIR / Facebook。',
      '在生态链中的位置：RAG 概念的提出方，其成果通过开源框架（LangChain、LlamaIndex）与商用模型（GLM、DeepSeek 均支持检索增强形态）扩散。',
      '证据强度标注：机构归属为 Semantic Scholar 单一来源，标为部分核实；RAG 论文的会议归属本身已双源核实（NeurIPS 2020）。',
      '对本项目的关系：整条主链条 A 的起点机构——没有 RAG 论文就没有本项目的技术路线。'
    ],
    tags: ['机构', 'FAIR', 'RAG 源头'], src: ['S-01', 'S-05'], tr: ['scientist'],
    why: '本项目主技术路线（RAG）的提出机构，主链条 A 的起点。',
    ev: '部分核实',
    evn: '机构归属来自 Semantic Scholar 元数据（单一来源）；论文会议归属已双源核实。'
  }),

  // ========== 主线 A-3：开源框架与工具社区 ==========
  e('E-COM-LANGCHAIN', {
    t: 'LangChain（开源框架社区）', type: 'community', chain: 'main_a', role: '开源社区',
    s: '把论文方法封装成可调用工程组件的主流开源框架，自我定位为 agent engineering platform；在链条中承担「论文 -> 可用系统」的转化环节。',
    d: [
      '核实依据（2026-11-01）：官方文档 python.langchain.com/docs/introduction/ 可访问；GitHub 仓库 langchain-ai/langchain 可访问，仓库描述为 "The agent engineering platform"（S-32）。',
      '在生态链中的位置：介于模型提供方与应用开发者之间，降低接入门槛，同时形成对模型接口的适配层。',
      '与本项目关系：本项目未采用（管线单一、需要可逐行解释的实现），但该「未采用」决策本身是有依据的技术取舍，记录在 DECISIONS.md 与 D-T-LANGCHAIN。',
      '生态观察：框架社区的存在使小团队也能快速搭出 RAG 应用，但也带来版本升级风险与「黑盒依赖」问题——这是产业分工的典型张力。'
    ],
    tags: ['开源', '框架', '社区'], src: ['S-32'], tr: ['engineer'],
    why: '「论文 -> 应用」链条中不可绕过的转化环节，也是本项目做出「不采用」决策的对照对象。'
  }),
  e('E-COM-LLAMAINDEX', {
    t: 'LlamaIndex（开源检索框架社区）', type: 'community', chain: 'main_a', role: '开源社区',
    s: '专注把私有数据变成可检索索引的开源框架，是 RAG 工程化的另一主流选择。',
    d: [
      '核实依据（2026-11-01）：官方文档 docs.llamaindex.ai/en/stable/ 可访问，页面标注由 LlamaParse 制作者维护（S-33）。',
      '与 LangChain 的分工（本项目理解，标注为推断）：LlamaIndex 聚焦数据索引与检索，LangChain 聚焦模型与工具编排；两者在实践中常被组合使用。',
      '与本项目关系：未采用，但其索引抽象启发了本项目「节点即分块」的设计（D-C-CHUNK）。',
      '生态观察：检索框架的出现说明「怎么把私域资料变成可检索资产」已成为独立的专业问题，而非应用的附属细节。'
    ],
    tags: ['开源', '框架', '检索'], src: ['S-33'], tr: ['engineer'],
    why: 'RAG 工程化的另一主要开源选择，与 LangChain 共同构成工具社区环节。',
    evn: '与 LangChain 的分工描述为本项目推断，非官方表述。'
  }),
  e('E-COM-HF', {
    t: 'Hugging Face（模型与数据集托管社区）', type: 'community', chain: 'main_a', role: '开源社区',
    s: '开源模型、数据集与 Spaces 应用的主要托管平台，使论文附带的模型与数据可被第三方复现。',
    d: [
      '核实依据（2026-11-01）：huggingface.co 与 huggingface.co/docs/hub/index 均可访问，提供 Models / Datasets / Spaces / Docs / Enterprise / Pricing 等栏目（S-36）。',
      '在本项目链条中的具体作用：智谱将 GLM-4.6 的测试题目与 Agent 轨迹数据集公开托管在 HF（zai-org/CC-Bench-trajectories，S-16），这使厂商自评具备了可被第三方检验的入口。',
      '生态观察：HF 把「可复现性」从学术要求变成了产业基础设施，是学术生态与商业生态的交汇点。',
      '访问性提示（快变量）：国内网络访问 HF 可能不稳定；本项目运行时不从 HF 下载任何模型，因此网站可用性不受影响。'
    ],
    tags: ['开源', '数据集', '托管'], src: ['S-16', 'S-36'], tr: ['scientist', 'engineer'],
    why: '连接学术成果与工程可用资产的枢纽，也是厂商自评数据的可验证渠道。', fast: true
  }),
  e('E-COM-VLLM', {
    t: 'vLLM（开源推理引擎社区）', type: 'community', chain: 'main_a', role: '开源社区',
    s: '高吞吐 LLM 推理服务引擎，代表「用自有算力承载开源模型、绕开按 token 计费」的产业路线。',
    d: [
      '核实依据（2026-11-01）：docs.vllm.ai/en/latest/ 可访问（S-34）。',
      '在生态链中的位置：位于模型提供方与应用之间，改变成本结构——从「按调用付费」变为「按硬件与运维付费」。',
      '与 MaaS 的成本对照（本项目分析，标注为推断）：MaaS 成本随调用量线性增长、无需运维；自建推理成本前置为 GPU 与人力，调用量越大单位成本越低。临界点取决于实际 QPS，本项目无 GPU 条件，无法给出实测值。',
      '本项目关系：未部署，作为成本对照与产业分工的观察对象记录。'
    ],
    tags: ['开源', '推理引擎', '成本'], src: ['S-34'], tr: ['engineer'],
    why: '代表与 MaaS 对立的成本路线，是理解「谁承担算力成本」的必要参与者。',
    evn: '与 MaaS 的成本临界点分析为本项目推断，无实测数据。'
  }),
  e('E-COM-OLLAMA', {
    t: 'Ollama（本地模型运行时社区）', type: 'community', chain: 'main_a', role: '开源社区',
    s: '在本地或自有服务器运行开源模型的工具，代表「零 API 费用、数据不出机」的部署路线。',
    d: [
      '核实依据（2026-11-01）：ollama.com 可访问，页面显示 GitHub 185.5K stars，支持本地与云端运行模型（S-35）。',
      '在生态链中的位置：把 LLM 能力下沉到个人设备，使无网络或数据敏感场景也能使用模型。',
      '本项目关系：未部署（交付环境无可用 GPU，CPU 推理延迟无法满足课堂演示）。因此本项目的离线降级不是本地模型，而是「非生成式检索直出」——不调用任何模型，直接用检索命中的节点与来源组织答案。',
      '生态观察：本地运行时的普及正在降低「必须依赖厂商 API」的锁定风险，但也带来模型能力与云端旗舰档的差距问题。'
    ],
    tags: ['开源', '本地部署', '降级'], src: ['S-35', 'S-26'], tr: ['engineer'],
    why: '代表零 API 成本路线，且直接关联本项目「离线降级」设计的取舍。', fast: true
  }),
  e('E-COM-ARXIV', {
    t: 'arXiv（预印本平台）', type: 'community', chain: 'main_a', role: '信息渠道',
    s: '本项目全部 14 篇论文的原始获取渠道，也是该领域成果扩散速度的关键基础设施。',
    d: [
      '核实依据（2026-11-01）：arxiv.org 摘要页与 export.arxiv.org API 均可访问；本项目通过 API 批量取得标题、作者、Comments 与日期字段（研究记录存于 _research/arxiv_api.json）。',
      '在生态链中的位置：使论文在正式会议发表前即可被产业界读取，压缩了「学术成果 -> 工程应用」的时间差。RAG（2020-05）、ReAct（2022-10）到 LangChain 等框架的工程化间隔都很短，arXiv 是重要原因。',
      '对本项目的方法论意义：本项目所有论文结论都以 arXiv 摘要页为一手来源，并交叉核对 Semantic Scholar 的 venue 字段，形成双源核实（见 D-R-PAPERS）。',
      '使用限制（诚实标注）：arXiv 摘要页只提供标题、作者、摘要与 Comments，不提供全文；本项目未逐篇下载 PDF 核对正文，因此涉及论文内部细节（如具体实验数值）的结论一律不写入地图。'
    ],
    tags: ['信息渠道', '预印本', '一手来源'], src: ['S-01', 'S-41', 'S-43'], tr: ['scientist'],
    why: '本项目全部论文结论的获取渠道，且是理解该领域扩散速度的关键节点。',
    limit: '本项目仅核实 arXiv 摘要页信息，未下载论文全文；涉及论文内部实验数值的结论不纳入地图。'
  }),
  e('E-CONF-NEURIPS', {
    t: 'NeurIPS（Conference on Neural Information Processing Systems）', type: 'conference', chain: 'main_a', role: '学术会议',
    s: '本项目引用论文中出现最频繁的会议：RAG、CoT、Toolformer、MT-Bench、Gorilla 五篇的归属会议。',
    d: [
      '核实依据（2026-11-01）：neurips.cc 可访问（页面显示 2026 Conference，S-37）；各论文会议归属来自 arXiv Comments 与 Semantic Scholar venue 交叉核实（见来源库 S-01/S-03/S-05/S-07/S-14 与 _research/venue-notes.md）。',
      '在本项目中的角色：RAG 主路线（NeurIPS 2020）、思维链（NeurIPS 2022）、工具调用（NeurIPS 2023）、LLM 裁判（NeurIPS 2023 D&B）、API 调用（NeurIPS 2023）——覆盖了本项目五个核心概念的出处。',
      '会议类别的诚实标注：CCF 官网本次访问返回 WAF 挑战页，未能取得推荐目录正文（S-41），因此本项目不标注「CCF A 类」，该字段记为待核实。这是对课程「不得凭印象标注会议类别」的直接执行。',
      '生态意义：顶会是学术成果的信誉背书机制，也是产业界筛选可信方法的低成本信号。'
    ],
    tags: ['会议', 'NeurIPS', '学术'], src: ['S-01', 'S-03', 'S-05', 'S-07', 'S-14', 'S-37', 'S-41'], tr: ['scientist'],
    why: '本项目五篇核心论文的归属会议，是理解成果可信度信号的关键参与者。',
    evn: '会议存在性与官网可访问性已核实；CCF 类别标注因官网 WAF 拦截未取得，记为待核实。', fast: true
  }),
  e('E-CONF-ICLR', {
    t: 'ICLR（International Conference on Learning Representations）', type: 'conference', chain: 'main_a', role: '学术会议',
    s: 'ReAct 与 Self-RAG 的归属会议，采用公开评审机制，是表示学习领域的顶级会议。',
    d: [
      '核实依据（2026-11-01）：iclr.cc 可访问（页面显示 2027 Conference，S-38）；ReAct 的 ICLR 归属由 arXiv Comments（"v3 is the ICLR camera ready version"）与 Semantic Scholar venue 双源核实；Self-RAG 仅由 Semantic Scholar 单源印证，标为部分核实。',
      '在本项目中的角色：智能体循环（ReAct）与自适应检索（Self-RAG）两个演进方向的方法出处。',
      '会议类别的诚实标注：同 NeurIPS，CCF 类别未取得，记为待核实。',
      '生态意义：ICLR 的公开评审模式（OpenReview）使审稿意见可被外界查看，是学术透明度的一种制度设计。'
    ],
    tags: ['会议', 'ICLR', '学术'], src: ['S-04', 'S-09', 'S-38', 'S-41'], tr: ['scientist'],
    why: '智能体与自适应检索两条演进路线的归属会议。',
    evn: '会议官网可访问性已核实；ReAct 归属双源核实，Self-RAG 归属单源（部分核实）；CCF 类别未取得（待核实）。', fast: true
  }),
  e('E-CONF-ACL', {
    t: 'ACL / EMNLP / TACL（自然语言处理学术阵地）', type: 'conference', chain: 'main_a', role: '学术会议',
    s: 'NLP 领域的主要会议与期刊：RARR（ACL 2023）、FLARE（EMNLP 2023）、Lost in the Middle（TACL 2023）的发表阵地。',
    d: [
      '核实依据（2026-11-01）：三者的会议/期刊归属均由 arXiv Comments 与 Semantic Scholar venue 双源核实（S-12、S-13、S-08 与 _research/venue-notes.md）。acl-org.org 本次访问出现 SSL EOF 错误，未能取得官网内容，故官网可访问性记为待核实，但论文归属证据独立于官网。',
      '在本项目中的角色：可归因性（RARR）、主动检索（FLARE）、长上下文位置效应（Lost in the Middle）三个直接支撑本项目设计的成果出处。',
      '与 NeurIPS/ICLR 的分工（本项目观察，标注为推断）：ACL/EMNLP 更聚焦语言任务本身的评测与语料，NeurIPS/ICLR 更聚焦模型与方法；RAG 应用层工作两边都有。',
      '会议类别的诚实标注：CCF 类别未取得，记为待核实。'
    ],
    tags: ['会议', 'ACL', 'EMNLP', 'TACL'], src: ['S-08', 'S-12', 'S-13', 'S-41'], tr: ['scientist'],
    why: '本项目三项直接落地成果（可归因性、主动检索、上下文排序）的发表阵地。',
    evn: '论文归属双源核实；acl-org.org 官网本次访问 SSL 失败，官网可访问性记为待核实；CCF 类别未取得。', fast: true
  }),

  // ========== 主线 A-4：本组应用 与 A-5：使用者 ==========
  e('E-APP-THREEMAPS', {
    t: '本组应用：三张活地图课程问答网站', type: 'participant', chain: 'main_a', role: '应用',
    s: '本小组构建的交互式网站，把课程资料、三张地图与地图约束的 AI 问答整合为一个可公开访问的学习平台；是主链条 A 的落点。',
    d: [
      '技术构成（全部为本项目实际实现）：Node.js + Express 后端、node:sqlite 单文件数据库（九张表）、React 19 + Vite + Tailwind v4 前端、Zustand 全局联动状态机、自建轻量检索、GLM/DeepSeek 双渠道 AI 调用与非生成式降级、Playwright 端到端测试。',
      '在链条中的位置：上游是论文方法（RAG、可归因性、上下文排序）与模型提供方（智谱、DeepSeek），下游是选课同学；它把学术成果与商用能力转化为大一学生可直接使用的学习工具。',
      '与工具社区的关系：本项目选择不使用 LangChain / LlamaIndex 等框架，改为自建轻量实现，理由记录在 DECISIONS.md（管线单一、需可逐行解释、减少依赖风险）。',
      '内容治理机制：证据四级状态、快变量核查日期与过期标记、候选内容池审核、更新记录、反馈入口——这些不是附加功能，而是课程「持续更新的活地图」要求的直接实现。',
      '诚实边界：本项目为课程作业规模的应用，未经受真实高并发与长期运维考验；相关限制已写入验收报告。'
    ],
    tags: ['本项目', '应用', '落点'], src: ['S-24', 'S-26', 'S-43'], tr: ['scientist', 'engineer', 'designer'],
    why: '主链条 A 的落点，本项目自身在生态中的位置。'
  }),
  e('E-US-STUDENTS', {
    t: '使用者：选课同学（AI 专业大一学生）', type: 'user', chain: 'main_a', role: '使用者',
    s: '本应用的直接使用者，也是同学互评的评价主体；其真实需求与反馈是地图「活」起来的动力来源。',
    d: [
      '角色定位（依据课程要求 S-24）：三张地图须可被同学直接浏览、无需逐人申请权限、无需安装软件、国内普通网络可访问——这些约束直接决定了本项目的技术选型（自建静态前端 + 轻量后端，而非需要账号体系的低代码平台）。',
      '在链条中的位置：位于主链条 A 的末端，同时通过「反馈入口」形成回流：同学提出疑问或纠错 -> 进入反馈表 -> 核实后修改地图并写入更新记录。',
      '同时是互评者：课程互评重点包括宏观框架清晰度、知识与课程用途、生态关系理解、思考方法复用性、真实理解程度、持续更新实质修改、网站可用性（S-24）。本项目据此把「证据状态可见」「更新记录可查」「反馈可提交」做成一等公民功能。',
      '诚实标注：本项目尚无真实同学使用数据与反馈记录（网站刚交付），相关统计显示「尚未采集」，不虚构用户反馈。'
    ],
    tags: ['使用者', '同学', '互评'], src: ['S-24', 'S-26'], tr: ['designer', 'scientist'],
    why: '主链条 A 的末端与反馈回流的起点，课程要求的核心服务对象。',
    limit: '尚无真实同学使用与反馈数据，统计显示「尚未采集」。'
  }),
  e('E-US-TEAM', {
    t: '本小组成员（内容建设与维护者）', type: 'participant', chain: 'main_a', role: '应用方',
    s: '承担资料核实、内容建设、代码实现与后续维护的小组成员；其真实贡献只能来自提交记录、更新日志或成员确认。',
    d: [
      '角色定位：既是应用的建设者，也是生态链中「应用方」环节——需要决定采用哪些模型、框架与平台，并承担相应成本与维护责任。',
      '贡献记录规则（依据 S-26）：成员贡献只依据真实提交记录、更新日志或成员确认，不得自动编造。本项目当前 update_log 中的 updated_by 字段记录的是执行主体（如 admin / system / 匿名访问者），未标注具体成员姓名。',
      '诚实标注：本次交付由 AI Agent（Codex）在用户提供的项目资料基础上完成研究、内容建设与代码实现；小组成员的具体分工与贡献需由成员本人确认后通过管理端补录，本项目不代为虚构。',
      '维护入口：管理端支持节点/关系/来源的增删改、候选内容审核、反馈处理与更新记录写入，成员可据此持续维护（见 docs/OPERATIONS.md）。'
    ],
    tags: ['小组', '维护者', '贡献记录'], src: ['S-24', 'S-26', 'S-44'], tr: ['scientist', 'engineer', 'designer'],
    why: '生态链中的「应用方」环节，也是内容治理与持续维护的责任主体。',
    ev: '部分核实',
    evn: '成员名单与分工已有小组编制的《小组分工细则》V1.1（2026-11-02，S-44）为依据：刘京（内容治理与文档）、秦伟轩（数据与后端）、鲍家弘（前端与可视化）、解子杰（组长·AI/评测）。该细则签字确认栏当前为空白，故标为部分核实（已编制、待签字）；签字完成后经管理端改为已核实。',
    limit: '成员签字确认尚未完成；真实 API 费用仍无账单，标为尚未采集。'
  }),
  e('E-ORG-TEAMSTRUCT', {
    t: '小组分工结构（4 人 × 模块负责制）', type: 'org', chain: 'dim_c', role: '应用方组织',
    s: '本小组按「模块负责到人 + 工作量均衡 + 交叉评审」组织：4 人各牵头一个技术大模块与一块地图内容，工作量约 25%/人（实测 25:24:24:27）。',
    d: [
      '组织原则（S-44 原文）：① 模块负责到人——牵头人即验收第一责任人；② 工作量均衡——技术与内容双线按约 25%/人切分；③ 交叉协作互相评审——接口联调、内容验收、评测出题、部署上线均多人共同完成；④ 成果可追溯——每项任务对应网站页面、数据库记录或仓库文档；⑤ 诚实原则——分工与贡献只依据真实提交记录与成员确认。',
      '四人角色与牵头模块：刘京＝内容治理机制与项目文档（证据四级状态、快变量复核、候选池规则、更新记录规范）＋认知地图 30 节点＋来源库统一验收；秦伟轩＝数据库 9 表、26 个 API、管理端、安全与限流、备份导出＋生态地图 22 节点（含 14 篇论文双源核实）；鲍家弘＝全站 12 路由页面、三图 SVG 渲染、X-Ray 透视、成长罗盘、主题与移动端、管理端界面＋领域地图 34 节点；解子杰（组长）＝项目统筹、BM25 检索引擎、AI 助手全链路、14 题评测体系、测试体系、部署上线＋领域地图 33 节点。',
      '内容建设量化分摊（S-44，合计与线上实测一致）：领域节点 鲍34/解33＝67；生态节点 刘22/秦22＝44；认知节点 刘30＝30；节点合计 52/22/34/33＝141；关系登记 58/48/64/63＝233；来源提交 12/11/10/10＝43；评测题 3/3/4/4＝14。',
      '协作机制（S-44）：Git 功能分支 + 交叉评审（前端鲍家弘把关、后端秦伟轩把关、AI/检索/测试解子杰把关、内容文档刘京把关）；DATA-DICTIONARY 为接口唯一事实来源；内容流水线「撰写→来源→验收→入库→呈现」；反馈转修改闭环；每周例会对应课程「每周至少检查一次」；密钥纪律（只存服务端环境变量）。',
      '阶段里程碑 P1–P6：选题规划→数据建设与框架→功能开发→联调测试与评测→部署交付（2026-11-01 上线）→运维与持续更新（每周复核快变量）。',
      '诚实标注：细则签字确认栏为空白，自述「经全体成员确认后生效」；本站在签字完成前按「已编制、待签字确认」展示，不宣称已完成签字。'
    ],
    tags: ['分工', '组织', '协作机制', '量化分摊'], src: ['S-44'], tr: ['scientist', 'engineer', 'designer'],
    why: '课程要求「每位成员需承担具体任务并保留记录」，且期末需提交成员贡献说明；分工细则是贡献追溯的组织依据，纳入生态地图的「应用方」维度。',
    ev: '部分核实',
    evn: '分工内容来自小组编制的细则 V1.1（一手项目文档）；签字确认未完成，故标部分核实。量化分摊数字与线上实测数据（141/233/43/14）逐项核对一致。'
  }),
  // ========== 辅线 B：谁承担成本 ==========
  e('E-COST-TOKEN', {
    t: '成本项：按 token 计费的模型推理', type: 'cost', chain: 'side_b', role: '成本构成',
    s: '应用侧最主要的可变成本。产业侧按「元/百万 tokens」计价，并区分输入/输出与缓存命中，输出通常显著贵于输入。',
    d: [
      '产业侧官方数据（核查日期 2026-11-01）：智谱 GLM-5.3 输入 8 元 / 输出 28 元；GLM-5 输入 4–6 元 / 输出 18–22 元；GLM-4.7-FlashX 输入 0.5 元 / 输出 3 元；GLM-4.7-Flash 输入与输出均为「免费」（S-15）。',
      'DeepSeek 官方数据（同日核查）：deepseek-flash 输入（缓存未命中）空闲 1 元 / 高峰 2 元，输出空闲 4 元 / 高峰 8 元；deepseek-v4-pro 输入空闲 4.5 元 / 高峰 9.0 元，输出空闲 13.5 元 / 高峰 27.0 元（S-17）。',
      '结构规律（本项目据官方数字归纳）：输出单价普遍为输入单价的 2.7–3.5 倍，因此「控制回答长度」是最直接的成本手段；缓存命中价可低至未命中价的 1/45（DeepSeek flash：0.02 vs 1），因此复用系统提示与固定资料块能显著降本。',
      '本组实际成本（诚实标注）：本次交付通过本机已配置的 OpenAI 兼容网关调用 glm-* 模型，未产生可查询的独立账单；ai_usage 表已记录每次调用的 token 用量与耗时，但对应金额无法核算，界面显示「尚未采集」。'
    ],
    tags: ['成本', 'token', '计费'], src: ['S-15', 'S-17', 'S-43'], tr: ['engineer'],
    cost_side: '产业侧按量计费，应用侧按调用量承担',
    why: '辅线 B「谁承担成本」的核心项，有完整官方定价数据支撑。', fast: true,
    limit: '本组实际费用金额尚未采集（无可查询账单），仅有用量与耗时记录。'
  }),
  e('E-COST-FREE', {
    t: '成本项：免费档与限时免费策略', type: 'cost', chain: 'side_b', role: '成本构成',
    s: '厂商用「免费」「限时免费」吸引开发者，把成本从应用侧转移到厂商侧的市场推广预算；这是本项目能以近零成本运行的直接原因。',
    d: [
      '官方数据（核查日期 2026-11-01）：智谱定价页中 GLM-4.7-Flash 输入/输出均标「免费」，GLM-4-Flash-250414、GLM-Z1-Flash、GLM-4.6V-Flash、CogView-3-Flash 等亦为免费档；多数模型的「缓存存储」标注为「限时免费」（S-15）。',
      '成本承担分析（本项目推断，已标注）：免费档的算力成本由厂商承担，其商业动机是扩大开发者生态与后续向付费档转化；「限时免费」措辞本身即保留了随时收费的权利。',
      '对本项目的意义：选用 GLM-4.7-Flash 作为主渠道，使课堂演示与 14 题评测的反复运行几乎不产生费用，这是学生项目可行的前提条件。',
      '风险提示（快变量）：免费策略随时可能调整。本项目已把该节点标记为快变量，超过 4 周未复核时前端自动显示「信息可能过期」，并要求在答辩前重新核对定价页。'
    ],
    tags: ['成本', '免费档', '商业策略'], src: ['S-15', 'S-19'], tr: ['engineer', 'designer'],
    cost_side: '厂商承担（市场推广成本）',
    why: '解释「为什么学生项目能低成本跑通 RAG」，是成本辅线的关键环节。', fast: true,
    evn: '免费档价格为官方数据（已核实）；厂商商业动机分析为本项目推断。'
  }),
  e('E-COST-PEAK', {
    t: '成本项：高峰/空闲双时段定价', type: 'cost', chain: 'side_b', role: '成本构成',
    s: 'DeepSeek 对同一模型在工作日高峰与空闲时段收取不同价格（空闲为高峰的一半），用价格信号引导调用方削峰填谷。',
    d: [
      '官方规则（核查日期 2026-11-01）：北京时间周一至周五（不含中国法定节假日）9:00–12:00、14:00–18:00 为高峰时段；其余时段包括周末及法定节假日全天为空闲时段；空闲时段价格为高峰的一半（S-17）。',
      '产业逻辑（本项目分析，标注为推断）：算力是刚性供给，高峰拥堵会推高整体成本；用价格区分时段比硬性限流更有效地平滑负载。这属于产业侧成本向应用侧的传导机制设计。',
      '对应用侧的实际影响：调用时机本身成为成本变量。本项目评测脚本记录每次运行时间戳，使成本可按时段核算；若未来跑大批量评测，应安排在空闲时段。',
      '与缓存策略的组合：DeepSeek 缓存命中价在空闲时段低至 0.02 元/百万 tokens，与高峰时段未命中的 2 元相差 100 倍，说明「时段 + 缓存」两项优化的叠加收益极大。'
    ],
    tags: ['成本', '定价机制', '算力'], src: ['S-17'], tr: ['engineer'],
    cost_side: '应用侧按调用时段承担不同单价',
    why: '展示产业侧如何用定价机制传导算力成本，是理解成本结构的典型案例。', fast: true,
    evn: '时段规则与价格为官方数据（已核实）；产业逻辑分析为本项目推断。'
  }),
  e('E-COST-ADDON', {
    t: '成本项：附加能力单独计价（Search / Fetch）', type: 'cost', chain: 'side_b', role: '成本构成',
    s: '检索与抓取等附加 API 按请求次数单独计费，且原先免费的场景会转为收费——说明「能力打包」正在细化为「能力计价」。',
    d: [
      '官方数据（核查日期 2026-11-01）：DeepSeek Search 与 Fetch 均为每 1,000 次成功请求 5 元；官方明确声明，用户在 DeepSeek Harness / Claude Code / Codex 中通过服务端工具调用访问 Search/Fetch 的部分此前未计费，将自北京时间 2026 年 11 月 1 日 00:00 起按次收费（S-17）。',
      '智谱侧同类结构：定价页把「模型推理」「搜索工具服务」「知识库服务」分列计费，知识库服务另有独立计费说明（S-15）。',
      '对应用侧的影响（本项目分析）：一旦 RAG 应用改用厂商托管检索，成本模型从「纯 token」变为「token + 检索次数」，估算方式完全不同；本项目自建检索正是为了避免这类不可预期的附加计费。',
      '时间点意义：该收费政策生效日恰好是本项目核查日（2026-11-01），是「快变量必须标注核查日期」的极佳实例——同一条信息在一天前后含义不同。'
    ],
    tags: ['成本', '附加计费', '快变量'], src: ['S-15', 'S-17'], tr: ['engineer'],
    cost_side: '应用侧按次承担',
    why: '展示计费结构细化的趋势，且其生效日期与本项目核查日重合，是快变量治理的实证案例。', fast: true
  }),
  e('E-COST-INFRA', {
    t: '成本项：应用侧基础设施与运维', type: 'cost', chain: 'side_b', role: '成本构成',
    s: '除模型调用外，应用侧还需承担托管、域名、数据库、监控与人力维护成本；本项目通过零依赖选型把这些压到最低。',
    d: [
      '本项目的成本结构（实际选型结果）：数据库用 node:sqlite 单文件（Node 内置，零额外服务与费用）；后端为单进程 Express；前端为静态构建产物；无向量数据库、无消息队列、无第三方 SaaS 依赖。',
      '可核实的技术依据：node:sqlite 为 Node.js 官方内置模块（S-27），本项目实测 Node v24.21.0 可用，因此不产生数据库服务费用。',
      '人力成本（诚实标注）：本次交付的研究、内容建设与代码实现由 AI Agent 完成，但内容核实标准、技术取舍判断与验收仍需要人参与；实际人力投入时长本项目未记录，标为「尚未采集」。',
      '部署成本（诚实标注）：课程要求云端运行且国内普通网络可访问（S-24）。本次交付已完成生产构建与本地端到端验证，但公开托管地址需要账号所有者授权，属外部阻塞项（见 docs/EXTERNAL-BLOCKERS.md）。'
    ],
    tags: ['成本', '基础设施', '运维'], src: ['S-24', 'S-26', 'S-27'], tr: ['engineer'],
    cost_side: '应用侧（本组）承担',
    why: '补全成本辅线的应用侧构成，避免只谈模型费用而忽略托管与人力。',
    limit: '人力投入时长与实际托管费用尚未采集。'
  }),
  e('E-COST-TRAIN', {
    t: '成本项：模型训练与算力（产业上游）', type: 'cost', chain: 'side_b', role: '成本构成',
    s: '模型提供方承担训练与推理算力的巨额前置成本，通过 API 定价与订阅回收；这是整条成本链的最上游。',
    d: [
      '可核实的规模线索：智谱官方披露 GLM-4.6 总参数 355B、激活参数 32B（S-16）。参数量级本身即说明训练与部署所需算力规模，但官方未公布训练成本数字，本项目不推测具体金额。',
      '成本传导链条（本项目分析，标注为推断）：芯片与电力 -> 模型训练 -> 推理服务（MaaS 定价 / 自建 vLLM）-> 应用开发（token 成本 + 基础设施）-> 使用者（免费或订阅）。每一环都会把部分成本向下传导或通过规模摊薄。',
      'MoE 架构的成本意义：GLM-4.6 的「总参 355B / 激活 32B」说明采用混合专家结构，单次推理只激活部分参数，这直接降低推理成本——是产业侧降低单位 token 成本的关键手段。',
      '对本项目的关系：解释了为什么免费档模型能够存在（激活参数少、推理成本低），也解释了为什么旗舰档与免费档价差可达数十倍。'
    ],
    tags: ['成本', '训练', '算力', '上游'], src: ['S-15', 'S-16', 'S-34'], tr: ['scientist', 'engineer'],
    cost_side: '模型提供方承担，通过定价回收',
    why: '成本辅线的最上游，缺此则无法解释免费档为何存在、旗舰档为何昂贵。', fast: true,
    evn: '参数量为官方数据（已核实）；成本传导链条与 MoE 降本分析为本项目推断，官方未公布训练成本金额。'
  }),

  // ========== 其他观察维度（选取与主线直接相关的少量案例）==========
  e('E-DIM-FEISHU', {
    t: '飞书（多维表格 / 妙搭）：平台方的权限与公开访问约束', type: 'org', chain: 'dim_c', role: '平台方',
    s: '课程建议的低代码平台。本项目研究后未采用其作为运行时数据源，原因是公开访问与服务端凭据管理的约束无法在本次研究中核实。',
    d: [
      '可核实事实（2026-11-01）：飞书多维表格产品页 feishu.cn/product/base 可访问，官方定位为「AI 驱动的表格与业务系统搭建平台」（S-22）；开放平台提供服务端 API 文档（bitable-v1，S-21）；课程讲义整理稿标注原始作业要求页面由妙搭生成并托管在 feishuapp.com 子域（S-23）。',
      '本次研究遇到的限制（诚实标注）：① 抓取多维表格 API 文档页仅返回标题，正文由前端异步渲染，具体端点参数未能核实；② 尝试访问 feishu.cn 下的妙搭产品页与开放平台妙搭文档路径返回 404 或空壳标题，未取得妙搭官方能力说明。',
      '由此得出的判断：「妙搭是否支持匿名公开访问 + 服务端安全调用第三方模型 API」这一关键问题无法核实。按方案 5.1「不得将未经验证的平台能力当作前提」，本项目改用自建技术栈。',
      '保留的互通能力：导出脚本支持 CSV/JSON，使内容数据可随时搬入多维表格由小组协作维护，避免单向锁定（见 docs/OPERATIONS.md）。',
      '规则与责任维度的观察：低代码平台把数据托管在厂商体系内，公开访问依赖平台分享设置与账号体系；这与课程「无需逐人申请权限」的要求存在张力，是平台选型必须核实的合规点。'
    ],
    tags: ['平台', '飞书', '规则与责任', '无法核实'], src: ['S-21', 'S-22', 'S-23', 'S-26'], tr: ['designer', 'engineer'],
    why: '课程明确建议的平台，其能力边界直接影响架构选型；「无法核实」的结论本身是重要研究成果。', fast: true,
    ev: '部分核实',
    evn: '产品存在性与定位已核实；API 端点细节与妙搭能力说明未取得，相关判断标注为无法核实。'
  }),
  e('E-DIM-SEC', {
    t: '规则与责任：数据权限、隐私与密钥边界', type: 'participant', chain: 'dim_c', role: '规则与责任',
    s: '本项目的责任边界设计：不收集个人信息、不索取用户密钥、管理写权限与公开读权限分离、生产日志不记录敏感内容。',
    d: [
      '课程与方案依据：讲义要求「不索取个人模型密钥，不暴露账号凭据」（S-24）；方案要求「密钥只存服务端」「前端不得包含密钥」「公开访问权限与管理权限严格分离」「生产日志不得记录 API Key 与用户敏感内容」（S-26）。',
      '本项目的实际实现：① 模型密钥只在服务端环境变量，前端与仓库均无凭据，提供 .env.example 模板；② 管理端写接口需 ADMIN_TOKEN（长度 >= 12），未配置时管理写操作全部返回 501 而非静默放行（默认安全）；③ 反馈接口允许完全匿名，匿名时不落库姓名；④ 错误信息经 sanitize 处理，过滤 Bearer/sk- 等凭据模式；⑤ CSP、X-Frame-Options、nosniff 等安全响应头全站启用。',
      '知识产权维度：全部论文标注作者与出处，官方文档标注发布机构与访问日期，课程资料标注整理日期与原始来源；不转载全文，只记录结论与出处。',
      '数据权限维度：项目语料为课程公开讲义与培养方案附件，不含他人隐私数据；网站不接入任何有写权限或涉及隐私的外部工具，因此即使发生提示注入，最坏损失也被限制在「回答内容被带偏」。'
    ],
    tags: ['规则与责任', '安全', '隐私', '知识产权'], src: ['S-11', 'S-24', 'S-26'], tr: ['engineer', 'designer'],
    why: '课程生态地图明确要求的「规则与责任」观察维度，且本项目有可核实的具体实现。'
  }),
  e('E-DIM-COMPETE', {
    t: '竞争与替代：模型渠道之间的可替换性', type: 'participant', chain: 'dim_c', role: '竞争关系',
    s: 'OpenAI 兼容接口成为事实标准，使 GLM、DeepSeek 等渠道可互相替换；应用方因此获得议价与容灾能力。',
    d: [
      '可核实事实（核查日期 2026-11-01）：DeepSeek 同时提供 OpenAI 兼容与 Anthropic 兼容 BASE URL（S-17、S-18）；智谱提供独立文档站与 API（S-15、S-16）。接口形态趋同使切换成本主要在配置层而非代码层。',
      '本项目的落地：AI 调用层实现多渠道列表（主 + 备 + 显式 fallback），主渠道失败自动切换备用渠道，全部失败则降级为非生成式检索直出。这意味着单一厂商故障不会导致网站核心功能不可用。',
      '竞争维度观察（本项目分析，标注为推断）：免费档（GLM-4.7-Flash）与低价档（deepseek-flash）的竞争使学生与初创团队几乎零成本可用；而旗舰档（GLM-5.3、deepseek-v4-pro）之间以能力与生态竞争，价差达数十倍。',
      '对使用者的意义：可替换性降低了锁定风险，但也带来「同一问题在不同渠道答案不同」的一致性问题——本项目在评测报告中记录所用渠道与时间，正是为了应对这一问题。'
    ],
    tags: ['竞争', '可替换性', '接口标准'], src: ['S-15', 'S-17', 'S-18', 'S-26'], tr: ['engineer'],
    why: '展示产业竞争如何转化为应用方的容灾能力与议价能力，与本项目多渠道实现直接对应。', fast: true,
    evn: '接口兼容性与定价为官方数据（已核实）；竞争格局分析为本项目推断。'
  }),
  e('E-DIM-UPSTREAM', {
    t: '产业上下游：从论文到使用者的完整链条', type: 'participant', chain: 'dim_c', role: '产业逻辑',
    s: '本项目的生态主线可概括为五段：学术机构与论文 -> 模型提供方 -> 开源框架与托管社区 -> 应用开发（本组）-> 使用者（选课同学）。',
    d: [
      '第一段（学术）：FAIR 提出 RAG、Google 提出 Transformer 与 CoT、Stanford CRFM 提出 HELM、CMU/UW 推进可归因性与自适应检索；成果通过 arXiv 快速扩散，由 NeurIPS/ICLR/ACL 等会议提供信誉背书。',
      '第二段（模型提供方）：智谱与 DeepSeek 把方法工程化为可调用 API，并以免费档、双时段定价、附加能力计价等方式设计商业模型。',
      '第三段（开源社区）：LangChain、LlamaIndex 提供编排与索引抽象，Hugging Face 托管模型与数据集，vLLM、Ollama 提供自建推理与本地运行选项。',
      '第四段（应用）：本组从上述环节中选择组合——采用 RAG 方法与 GLM 免费档，不使用编排框架，自建轻量检索与 SQLite 存储，形成课程问答网站。',
      '第五段（使用者）：选课同学浏览三张地图、使用 AI 助手、提交反馈；反馈回流到候选内容池与更新记录，使地图持续演化。',
      '缺失环节观察（本项目分析，标注为推断）：链条中「独立第三方评估」环节相对薄弱——HELM 等学术评测存在，但面向具体应用场景（如课程问答）的公开评测很少，这正是本项目自建评测集的原因。'
    ],
    tags: ['产业逻辑', '上下游', '链条'], src: ['S-01', 'S-15', 'S-32', 'S-36', 'S-24'], tr: ['scientist', 'engineer', 'designer'],
    why: '生态地图的核心结构说明，把分散的参与者组织成一条可解释的链条。',
    evn: '五段链条的构成基于各参与者的已核实资料；「缺失环节」为本项目推断。'
  }),
  e('E-DIM-INTL', {
    t: '国际合作与竞争：方法开源、能力自评与独立评测', type: 'participant', chain: 'dim_c', role: '国际维度',
    s: '本项目引用的方法全部来自国际公开学术成果，模型能力则由中国厂商提供；厂商自评与国际独立评测之间构成一种可观察的张力。',
    d: [
      '方法来源的国际化（已核实）：本项目 14 篇论文的作者机构横跨美国（Google、FAIR、Stanford、CMU、UW、UC Berkeley、UC Davis、UCI、NYU）、英国（UCL）、德国（MPI-SP）与中国（Beihang University、Sea AI Lab），其中 FLARE 一文的作者机构同时包含中国高校（北航）与美国高校（CMU）及产业实验室（Sea AI Lab），属跨国合作实例（数据来源：Semantic Scholar 作者机构字段，2026-11-01）。',
      '能力自评与国际对标（已核实，含厂商立场）：智谱官方称 GLM-4.6 的代码能力「对齐 Claude Sonnet 4」，并公开了测试题目与 Agent 轨迹数据集供业界验证（S-16）。这是中国厂商以国际头部模型为参照系的直接表述。',
      '独立评测的位置：Stanford CRFM 的 HELM 代表学术界的独立评估努力（S-06、S-39）；LLM-as-a-Judge 研究则提醒自动评测本身存在偏差（S-07）。',
      '本项目的立场（诚实标注）：对厂商自评数据一律标注「官方称」，不将其作为独立核实结论；对国际会议归属只采用可双源印证的表述，不标注未能核实的 CCF 类别（S-41）。'
    ],
    tags: ['国际维度', '合作与竞争', '评测'], src: ['S-06', 'S-07', 'S-13', 'S-16', 'S-39', 'S-41'], tr: ['scientist'],
    why: '课程要求的国际合作与竞争维度，本项目有可核实的跨国作者机构与厂商对标表述作为支撑。',
    evn: '论文作者机构来自 Semantic Scholar 元数据（单一来源，部分核实）；厂商对标表述为官方自述（已核实其存在，含厂商立场）。'
  })
];

export default ecosystemNodes;