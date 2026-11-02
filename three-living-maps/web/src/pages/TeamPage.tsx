// 小组分工页：内容来自《「三张活地图」小组分工细则》V1.1（2026-11-02，来源 S-44）。
// 诚实标注：细则签字确认栏为空白（自述「经全体成员确认后生效」），
// 故本页标为「已编制、待签字确认」，不宣称已完成签字。
import { Link } from 'react-router-dom';
import { ExternalLink, Tag } from '@/lib/ui';

const DOC = {
  version: 'V1.1',
  made_at: '2026-11-02',
  revision: '修订：解子杰任组长',
  site: 'https://three-living-maps.pages.dev',
  delivery: '2026-11-01（数据库初始化与全站上线）',
  basis: '网站实际内容、线上 API 数据快照（2026-11-02 核对）与项目文档'
};

const MEMBERS = [
  {
    name: '刘京', role: '内容治理与项目文档负责人',
    tech: '内容治理机制（证据四级状态、快变量复核、候选池规则、更新记录规范）',
    content: '认知地图（30 节点）；生态地图合建（22/44，与秦伟轩）；来源库统一验收（43 条）',
    docs: '项目方案 V2.0、DECISIONS.md、内容治理规范、「关于」页与诚实声明',
    split: '约 25%：内容治理 ≈ 40% · 内容建设 ≈ 45% · 验收与运维 ≈ 15%',
    tasks: [
      ['方案撰写与立项文档', '执笔项目方案 V2.0，确立「三图联动 + 中枢任务」总体框架；记录全部技术取舍（含被放弃方案）。', '项目方案 V2.0；DECISIONS.md'],
      ['内容治理机制设计', '制定并推行证据四级状态、快变量核查日期、候选池审核、推断附推理链、knowledge_status 不猜测五项规则。', '治理规则落入数据库约束与管理端 lint；全站 UI 呈现核查'],
      ['认知地图建设（30 节点）', '认识方法 / 分析方法 / 真实案例 / 成长习惯 / 认识修正五大板块；案例全部来自实际执行记录。', '线上 30 个 C- 节点；不含虚构个人经历'],
      ['生态地图合建（22/44）', '负责使用者、成本与规则维度（数据权限、隐私、知识产权、密钥边界）。', '本人名下 22 个 E- 节点，证据状态全部标注'],
      ['来源库统一验收（43 条）', '按来源优先级逐条验收：标题、机构/作者、URL、发布/访问日期、支持结论、备注；抓取失败保留记录。', '43 条全部通过验收；快变量统一标核查日期 2026-11-01'],
      ['「关于」页与诚实声明', '撰写全站文案基线与缺口声明（课名待核实、CCF 待核实、贡献待补录等）。', '关于页上线；缺口如实展示'],
      ['更新记录与周检制度', '制定 update_log 规范；落实每周复核快变量；监督「反馈转修改」闭环。', '更新记录页规范运转；周检有记录可查']
    ]
  },
  {
    name: '秦伟轩', role: '数据与后端负责人',
    tech: '数据库 9 张表、26 个 API、管理端接口、安全与限流、备份导出',
    content: '生态地图（44 节点中与刘京合建 22 个；14 篇论文双源核实）',
    docs: 'docs/DATA-DICTIONARY.md、docs/OPERATIONS.md',
    split: '约 25%：后端与数据 ≈ 70% · 内容建设 ≈ 30%',
    tasks: [
      ['数据库设计与建库', 'SQLite 九张表；26 种受控关系词表；证据四级与 knowledge_status 枚举；库级约束（推断附推理链、taught_in 标覆盖、ID 前缀唯一）；D1 迁移与初始化。', '九张表上线；DATA-DICTIONARY 为字段唯一事实来源'],
      ['公开只读 API（14 个）', 'health/meta/stats/nodes/relations/sources/search/graph/updates/feedback/candidates/eval/ai-status，支撑全部页面；公开访问无需登录。', '接口上线并通过接口测试；响应结构经前端联调确认'],
      ['管理端 API（12 个）与默认安全', '增改下架、候选审核（淘汰原因必填并公开展示）、反馈处理、更新记录写入、lint 一致性检查；ADMIN_TOKEN 未配置则写操作 501。', '写操作自动写 update_log；lint 与界面一致'],
      ['安全、限流与稳定性', 'CSP/X-Frame-Options/nosniff；全局与接口级限流；错误信息过滤凭据；密钥只存服务端；令牌不落 localStorage。', '安全头与限流通过测试；仓库与前端零密钥'],
      ['数据导出与备份', 'JSON/CSV 导出；备份与恢复流程；运行手册。', '导出脚本可用；OPERATIONS.md 完成'],
      ['生态地图合建（22/44）', '主线 A「论文→模型方→社区→应用→使用者」与辅线 B「谁承担成本」；14 篇论文 arXiv + Semantic Scholar 双源核实。', '本人名下 22 个 E- 节点；双源核实记录入来源库'],
      ['接口协作支持', '向前端与检索/AI 提供字段说明与联调支持；参与 Workers + D1 后端适配。', '联调问题闭环；接口变更同步字典']
    ]
  },
  {
    name: '鲍家弘', role: '前端与可视化负责人',
    tech: '全站 12 个路由页面、三图 SVG 渲染、X-Ray 透视连线、成长罗盘、主题与移动端适配、管理端界面',
    content: '领域地图（67 节点中与解子杰合建 34 个）',
    docs: '前端组件与状态机说明、UI/交互验收清单',
    split: '约 25%：前端与可视化 ≈ 70% · 内容建设 ≈ 30%',
    tasks: [
      ['前端架构搭建', 'React 19 + TS + Vite 工程；Tailwind v4 CSS-first 语义化 Token（明暗双主题一套变量）；Zustand 全局联动状态机。', '工程可构建可部署；组件与状态机说明文档'],
      ['全站 12 个路由页面', '首页/三图/节点详情/来源库/来源详情/搜索/AI 助手/更新记录/反馈/评测/关于/管理端/404。', '全部页面上线；加载/空/错误态齐备'],
      ['三图渲染与 X-Ray 透视联动', '原生 SVG 节点渲染与引力线；中点关系标签；悬停看描述与来源；侧栏跨图关联；性能降级开关。', '三图联动可演示；X-Ray 开关有效；降级正常'],
      ['成长路线罗盘', '科学家/工程师/设计师三路线切换：聚焦相关节点、其余弱化但可点击。', '罗盘联动三图与列表；弱化态提示清晰'],
      ['全站搜索前端', '限定地图筛选、命中分组与得分展示、同义词扩展提示、一跳结果标注、无结果反馈引导。', '与检索引擎联调通过（中英文与同义词）'],
      ['体验、无障碍与移动端', '明暗主题；证据状态符号+文字双通道；移动端底部抽屉多维标签流；面包屑与焦点管理。', '多分辨率截图布局正常；主题全站无遗漏'],
      ['管理端界面', '令牌登录（内存态）、节点/关系/来源编辑表单（含校验）、候选审核、反馈处理、一致性检查、导出入口。', '新增→审核→下架全流程并自动写更新记录'],
      ['领域地图合建（34/67）', '六大板块中约 34 个 D- 节点的撰写、关系登记与来源提交；课程节点只提供类别槽位、不臆造课名。', '34 个节点上线；证据状态与核查日期完整']
    ]
  },
  {
    name: '解子杰', role: '组长 · 项目统筹与 AI/评测负责人',
    tech: '项目统筹；BM25 检索引擎、AI 助手全链路（引用校验/越界闸门/降级）、14 题评测体系、测试体系、部署上线',
    content: '领域地图（与鲍家弘合建 33 个）；评测题汇总与真实运行',
    docs: 'docs/DEPLOY.md、评测报告与局限性披露',
    split: '约 25%：项目统筹 ≈ 10% · AI/检索/评测 ≈ 45% · 测试与部署 ≈ 20% · 内容建设 ≈ 25%',
    tasks: [
      ['项目统筹与质量管理（组长）', '主持选题讨论、每周例会与里程碑检查；组织交叉评审与答辩演练；组织交付验收；维护成员贡献补录入口。', '会议纪要与验收记录；答辩演示通过演练'],
      ['自建轻量检索引擎', '三处索引 + BM25 + IDF 降权 + 同义词扩展 + 一跳图扩展；为搜索与 AI 助手提供统一底座。', '搜索页与助手页共用；检索质量经 14 题评测验证'],
      ['AI 助手全链路集成', '先检索后生成；强制可点击引用；服务端引用校验剔除库外 ID；三类内容标注；无证据说明缺口不编造。', '助手页上线；引用可点击并展示证据引力线与来源'],
      ['AI 安全与降级机制', '输入上限 500 字；每 IP 限流；提示与资料隔离防注入；越界闸门拒答不调模型；无密钥降级检索直出；ai_usage 记日志。', '越界拒答可复现；降级可用；密钥零泄漏'],
      ['评测体系（14 题）', '汇总全组出题；七类考点；记录要点/来源/预期节点/评分标准；真实运行并记录环境与逐题耗时 token；禁止预填。', '评测页展示真实运行结果；未运行显示空状态'],
      ['评测局限性诚实披露', '样本量小、LLM-as-a-Judge 自我偏好、版本更新跨日期比较、成本无账单标「尚未采集」。', '评测页「局限性」区块上线'],
      ['测试体系', 'Node test runner 单元/接口测试；Playwright 真实浏览器 E2E 与多分辨率截图；组织缺陷修复回归。', '测试入仓库；E2E 全绿后方可部署'],
      ['部署与上线', 'Pages + Workers + D1 生产发布；与秦伟轩联合数据初始化（2026-11-01）；验证云端/国内可达/无需登录。', 'pages.dev 可公开访问；DEPLOY.md 完成'],
      ['领域地图合建（33/67）', '侧重方法与技术路线、软件与模型板块（RAG 主路线、温度参数、GLM-4.7-Flash 等）。', '33 个节点上线；来源通过刘京验收'],
      ['评测题出题（4 题）', '按统一格式撰写 4 题并汇总其余 10 题入库。', 'eval_items 14 题全部 active']
    ]
  }
];

const QUANT = [
  ['领域地图节点（D-）', '—', '—', '34', '33', '67'],
  ['生态地图节点（E-）', '22', '22', '—', '—', '44'],
  ['认知地图节点（C-）', '30', '—', '—', '—', '30'],
  ['节点小计', '52', '22', '34', '33', '141'],
  ['关系登记（条）', '58', '48', '64', '63', '233'],
  ['来源提交（条，经刘京统一验收）', '12', '11', '10', '10', '43'],
  ['评测题出题（题，解子杰汇总运行）', '3', '3', '4', '4', '14']
];

const MODULES = [
  ['数据库（9 表）与数据初始化', '秦伟轩', '解子杰（D1 适配）'],
  ['公开只读 API（14 个）', '秦伟轩', '鲍家弘（联调）'],
  ['管理端 API（12 个）+ ADMIN_TOKEN', '秦伟轩', '刘京（流程规则）'],
  ['安全（响应头/限流/密钥/错误过滤）', '秦伟轩', '解子杰（AI 接口限流）'],
  ['前端框架与全站 12 页面', '鲍家弘', '刘京（文案）'],
  ['三图渲染 + X-Ray + 成长罗盘', '鲍家弘', '秦伟轩（graph 接口）'],
  ['移动端适配 + 明暗主题', '鲍家弘', '解子杰（截图测试）'],
  ['检索引擎（BM25 + 同义词 + 一跳扩展）', '解子杰', '秦伟轩（索引数据）'],
  ['AI 助手（双渠道 + 引用校验 + 越界闸门 + 降级）', '解子杰', '刘京（拒答话术与诚实原则）'],
  ['评测体系（14 题 + 真实运行 + 局限性披露）', '解子杰', '全员出题'],
  ['测试（单元 / 接口 / E2E / 截图）', '解子杰', '全员修复回归'],
  ['部署（Pages + Workers + D1）', '解子杰', '秦伟轩（后端适配）'],
  ['内容治理机制（证据四级/快变量/候选池）', '刘京', '秦伟轩（库级校验）、鲍家弘（UI 呈现）'],
  ['来源库验收与更新记录制度', '刘京', '全员提交']
];

const MILESTONES = [
  ['P1 选题与规划（第 1–2 周）', '撰写方案 V2.0；DECISIONS 与治理规则草案', '调研存储；起草九表模型与关系词表', '信息架构与页面原型；确定技术栈与 Token 体系', '主持选题与开题；调研 RAG 与评测方法；启动论文双源核实'],
  ['P2 数据建设与框架搭建（第 3–4 周）', '认知地图 30 节点；来源验收规则试运行', '建库建表；公开 API 首批上线；生态地图 22 节点', '前端工程与状态机；地图页与详情页首版；领域 34 节点（分批）', '检索索引与 BM25；AI 渠道打通；领域 33 节点（分批）'],
  ['P3 功能开发（第 5–6 周）', '生态 22 节点；关于页与诚实声明；来源 43 条验收', '管理端 API、限流与安全头、lint、导出备份', 'X-Ray 引力线、成长罗盘、搜索/助手/管理端界面、移动端与主题', 'AI 全链路（引用校验/越界/降级）；评测 14 题入库；测试用例'],
  ['P4 联调测试与评测（第 7 周）', '组织内容交叉验收；抽查证据与推理链标注', '接口缺陷修复；配合限流与安全测试', 'UI 缺陷修复；配合多分辨率截图核对', '统筹答辩演练；单元/接口/E2E 全量运行；首次真实评测'],
  ['P5 部署与交付（第 8 周，2026-11-01 上线）', '核对全站文案与缺口声明；写初始化更新记录', 'D1 生产库迁移与初始化；线上 API 验证', '生产构建优化；线上页面全量走查', '组织交付验收；Pages+Workers 发布；可访问性验证；线上评测复跑'],
  ['P6 运维与持续更新（交付后每周）', '复核快变量并写更新记录；监督反馈闭环；周检归档', '数据库备份；管理端账号与令牌管理；数据导出', '界面问题响应；候选转正后的展示适配', '主持周会与周检督查；AI 用量与限流监控；评测定期复跑']
];

const COLLAB = [
  ['代码协作', '统一 Git 仓库、功能分支开发；合并前交叉评审——前端鲍家弘把关、后端与数据库秦伟轩把关、AI/检索/测试解子杰把关、内容与文档刘京把关。'],
  ['接口契约', 'docs/DATA-DICTIONARY.md（秦伟轩维护）是字段与枚举的唯一事实来源；任何变更先改字典、再改代码，并同步通知鲍家弘与解子杰。'],
  ['内容流水线', '成员撰写节点 → 提交来源 → 刘京按来源优先级验收 → 秦伟轩经管理端入库（自动写更新记录）→ 鲍家弘确认前端呈现 → 全站可见。AI 生成或外部推荐一律先进候选池。'],
  ['反馈转修改闭环', '访问者匿名反馈（不收集个人身份信息）→ 刘京分派核实 → 管理端处理（待处理/已采纳/已回复/未采纳/转候选）→ 采纳的修改写入更新记录并在反馈页公开回复与实际改动。'],
  ['例会制度', '每周一次例会（对应课程「每周至少检查一次」）：进度核对、快变量复核、缺陷清单、下阶段分工确认；解子杰主持，刘京记录与归档验收结论。'],
  ['密钥纪律', '模型密钥与 ADMIN_TOKEN 只存服务端环境变量，不写进前端、不提交仓库；成员个人不得在公开渠道粘贴令牌。']
];

const INTEGRITY = [
  '无法核实的内容一律标注「待核实 / 尚未采集」，不以推测充事实；「推断」必须附推理链。',
  '评测分数只能来自实际运行记录，禁止预填虚构分数；自动评分一律标注「待人工复核」。',
  '理解程度（knowledge_status）只来自真实学习者反馈或经授权的人工记录，AI 不得猜测写入。',
  '成员贡献与真实 API 费用依据真实提交记录或成员确认后补录，本站不虚构分工与贡献比例；本细则经四人签字确认后作为补录依据。',
  '抓取失败的来源保留记录并说明原因（如 CCF 官网 WAF 拦截、飞书妙搭文档 404），不做掩盖。',
  '快变量信息（价格/版本/功能）统一标注核查日期（本次交付为 2026-11-01），超 4 周未复核自动提示「信息可能过期」。'
];

export function TeamPage() {
  return (
    <div className="mx-auto max-w-[1000px] px-3 py-5 sm:px-5">
      <header className="mb-5">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-[11.5px] text-muted">
          <Tag tone="muted">课程《人工智能前沿与创新》大作业 · 小组项目文档</Tag>
          <Tag tone="accent">文档版本 {DOC.version}</Tag>
          <Tag tone="muted">编制日期 {DOC.made_at}</Tag>
          <Tag tone="muted">{DOC.revision}</Tag>
        </div>
        <h1 className="font-serif text-[24px] sm:text-[28px]">「三张活地图」小组分工</h1>
        <p className="mt-1 text-[13px] leading-relaxed text-secondary">
          选题：大语言模型应用开发与评估 —— 面向 AI 专业大一学生的技术地图、产业生态与学习路径。
          项目网站 <ExternalLink href={DOC.site} className="text-[color:var(--accent)]">{DOC.site}</ExternalLink>（云端部署，国内普通网络可访问，无需登录）。
        </p>
        <p className="mt-1 text-[12px] text-muted">
          编制依据：{DOC.basis}。交付日期：{DOC.delivery}。
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <ExternalLink href="/team-division.pdf"
            className="rounded-sm bg-[color:var(--accent)] px-3 py-1.5 text-[12.5px] text-[color:var(--text-on-accent)] transition hover:bg-[color:var(--accent-strong)]">
            查看原件 PDF（8 页）
          </ExternalLink>
          <Link to="/node/E-ORG-TEAMSTRUCT"
            className="rounded-sm border border-strong px-3 py-1.5 text-[12.5px] text-secondary transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]">
            在生态地图中查看该节点
          </Link>
          <Link to="/source/S-44"
            className="rounded-sm border border-strong px-3 py-1.5 text-[12.5px] text-secondary transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]">
            查看来源记录 S-44
          </Link>
        </div>
        <p className="mt-3 rounded-sm border-l-2 border-[color:var(--ev-partial)] bg-[color:var(--ev-partial-bg)] px-2.5 py-2 text-[12px] leading-snug text-secondary">
          <span className="font-medium text-[color:var(--ev-partial)]">诚实标注：</span>
          细则末尾的成员签字确认栏当前为空白（细则自述「经全体成员确认后生效」）。本站在签字完成前将其作为
          「成员已编制、待签字确认」的贡献依据展示，不宣称已完成签字；签字完成后经管理端把相关节点证据状态改为「已核实」。
        </p>
      </header>

      {/* 成员卡片 */}
      <section className="mb-6">
        <h2 className="mb-3 font-serif text-[18px]">成员与角色（4 人）</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {MEMBERS.map((m) => (
            <article key={m.name} className="card p-4">
              <div className="flex items-baseline gap-2">
                <h3 className="font-serif text-[17px]">{m.name}</h3>
                <span className="text-[12px] text-[color:var(--accent)]">{m.role}</span>
              </div>
              <p className="mt-1 text-[11.5px] text-muted">{m.split}</p>
              <dl className="mt-2 space-y-1.5 text-[12.5px]">
                <div><dt className="inline font-medium text-secondary">牵头技术：</dt><dd className="inline text-secondary">{m.tech}</dd></div>
                <div><dt className="inline font-medium text-secondary">牵头内容：</dt><dd className="inline text-secondary">{m.content}</dd></div>
                <div><dt className="inline font-medium text-secondary">文档产出：</dt><dd className="inline text-secondary">{m.docs}</dd></div>
              </dl>
              <details className="mt-2">
                <summary className="cursor-pointer text-[12px] text-muted">任务明细（{m.tasks.length} 项）</summary>
                <ul className="mt-1.5 space-y-1.5">
                  {m.tasks.map(([t, d, acc], i) => (
                    <li key={i} className="rounded-sm border border-subtle px-2.5 py-1.5">
                      <div className="text-[12.5px] font-medium">{t}</div>
                      <div className="mt-0.5 text-[11.5px] leading-snug text-secondary">{d}</div>
                      <div className="mt-0.5 text-[11px] text-muted">交付/验收：{acc}</div>
                    </li>
                  ))}
                </ul>
              </details>
            </article>
          ))}
        </div>
      </section>

      {/* 量化分摊 */}
      <section className="mb-6">
        <h2 className="mb-2 font-serif text-[18px]">内容建设量化分摊（合计与线上实测一致）</h2>
        <div className="card overflow-x-auto p-3">
          <table className="w-full min-w-[560px] border-collapse text-[12.5px]">
            <caption className="sr-only">内容建设量化分摊表</caption>
            <thead>
              <tr className="border-b border-strong text-left text-[11.5px] text-muted">
                <th className="py-1.5 pr-2 font-medium">内容类别</th>
                <th className="py-1.5 pr-2 font-medium">刘京</th>
                <th className="py-1.5 pr-2 font-medium">秦伟轩</th>
                <th className="py-1.5 pr-2 font-medium">鲍家弘</th>
                <th className="py-1.5 pr-2 font-medium">解子杰</th>
                <th className="py-1.5 font-medium">合计（线上实测）</th>
              </tr>
            </thead>
            <tbody>
              {QUANT.map((row, i) => (
                <tr key={i} className={'border-b border-subtle ' + (row[0].startsWith('节点小计') ? 'bg-[color:var(--surface-sunken)] font-medium' : '')}>
                  {row.map((cell, j) => <td key={j} className="py-1.5 pr-2 text-secondary">{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[11px] leading-snug text-muted">
            节点数按地图归属拆分：刘京的 52 个节点以认知地图为主（单节点资料密度低于领域技术节点），并叠加来源验收与治理规则工作；
            解子杰在 AI 与评测之外承担组长统筹。四人总工作量约 25 : 24 : 24 : 27。
            关系登记按「谁建节点谁登记关系」分摊，跨图关系由两端负责人协商后由一方登记。
          </p>
        </div>
      </section>

      {/* 技术模块归属 */}
      <section className="mb-6">
        <h2 className="mb-2 font-serif text-[18px]">技术开发模块归属（14 项）</h2>
        <div className="card overflow-x-auto p-3">
          <table className="w-full min-w-[520px] border-collapse text-[12.5px]">
            <caption className="sr-only">技术模块牵头与协作</caption>
            <thead>
              <tr className="border-b border-strong text-left text-[11.5px] text-muted">
                <th className="py-1.5 pr-2 font-medium">技术模块</th>
                <th className="py-1.5 pr-2 font-medium">牵头人</th>
                <th className="py-1.5 font-medium">协作人</th>
              </tr>
            </thead>
            <tbody>
              {MODULES.map(([mod, lead, coop], i) => (
                <tr key={i} className="border-b border-subtle">
                  <td className="py-1.5 pr-2 text-secondary">{mod}</td>
                  <td className="py-1.5 pr-2 font-medium">{lead}</td>
                  <td className="py-1.5 text-muted">{coop}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 里程碑 */}
      <section className="mb-6">
        <h2 className="mb-2 font-serif text-[18px]">阶段里程碑与人员任务矩阵</h2>
        <div className="space-y-2.5">
          {MILESTONES.map(([phase, lj, qw, bj, xz], i) => (
            <div key={i} className="card p-3">
              <div className="mb-1.5 font-serif text-[14px]">{phase}</div>
              <ul className="grid gap-1.5 text-[11.5px] leading-snug text-secondary sm:grid-cols-2">
                <li><span className="font-medium text-[color:var(--text-primary)]">刘京：</span>{lj}</li>
                <li><span className="font-medium text-[color:var(--text-primary)]">秦伟轩：</span>{qw}</li>
                <li><span className="font-medium text-[color:var(--text-primary)]">鲍家弘：</span>{bj}</li>
                <li><span className="font-medium text-[color:var(--text-primary)]">解子杰：</span>{xz}</li>
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted">
          说明：以上「周次」为项目执行阶段的相对序号；实际交付日以线上更新记录为准（数据库初始化与全站上线为 2026-11-01，快变量核查日期同日）。
        </p>
      </section>

      {/* 协作机制 */}
      <section className="mb-6">
        <h2 className="mb-2 font-serif text-[18px]">协作机制与接口约定</h2>
        <ul className="space-y-2">
          {COLLAB.map(([t, d], i) => (
            <li key={i} className="card p-3">
              <div className="text-[13px] font-medium">{t}</div>
              <p className="mt-0.5 text-[12px] leading-relaxed text-secondary">{d}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* 诚信约定 */}
      <section className="mb-6">
        <h2 className="mb-2 font-serif text-[18px]">质量与学术诚信约定（全员遵守）</h2>
        <ol className="card space-y-1.5 p-4 text-[12.5px] leading-relaxed text-secondary">
          {INTEGRITY.map((t, i) => <li key={i}>{i + 1}. {t}</li>)}
        </ol>
      </section>

      {/* 成员确认 */}
      <section className="card border-[color:var(--ev-partial)] p-4">
        <h2 className="mb-2 font-serif text-[16px]">成员确认</h2>
        <p className="text-[12.5px] leading-relaxed text-secondary">
          本细则依据网站实际交付内容与线上数据编制，经全体成员确认后生效，并作为网站管理端「成员贡献补录」与课程答辩的依据。
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-strong text-left text-[11.5px] text-muted">
                <th className="py-1.5 pr-2 font-medium">成员</th>
                <th className="py-1.5 pr-2 font-medium">角色</th>
                <th className="py-1.5 pr-2 font-medium">签字</th>
                <th className="py-1.5 font-medium">日期</th>
              </tr>
            </thead>
            <tbody>
              {MEMBERS.map((m) => (
                <tr key={m.name} className="border-b border-subtle">
                  <td className="py-1.5 pr-2 font-medium">{m.name}</td>
                  <td className="py-1.5 pr-2 text-secondary">{m.role}</td>
                  <td className="py-1.5 pr-2 text-muted">（待签字）</td>
                  <td className="py-1.5 text-muted">（待填）</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11.5px] text-muted">
          签字与日期栏如实留空：本站不代填、不虚构确认状态。签字完成后请通过管理端更新本节点证据状态。
        </p>
      </section>
    </div>
  );
}