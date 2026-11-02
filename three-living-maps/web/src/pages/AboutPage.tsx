// 关于页：项目说明、技术架构、研究依据、诚实声明与外部阻塞项。
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { ExternalLink } from '@/lib/ui';
import type { Meta } from '@/lib/types';

export function AboutPage() {
  const [meta, setMeta] = useState<Meta | null>(null);
  useEffect(() => { api.meta().then(setMeta).catch(() => setMeta(null)); }, []);
  const s = (meta?.stats || {}) as Record<string, number | Record<string, number>>;

  return (
    <div className="mx-auto max-w-[900px] px-3 py-5 sm:px-5">
      <h1 className="mb-4 font-serif text-[22px] sm:text-[26px]">关于本项目</h1>

      <section className="card mb-4 p-4">
        <h2 className="mb-2 font-serif text-[16px]">选题与目标</h2>
        <p className="text-[13px] leading-relaxed text-secondary">
          课程《人工智能前沿与创新》大作业要求小组选择一个感兴趣的人工智能领域，建设<b>三张相互关联、能够持续更新的地图</b>，
          并通过<b>同一个交互式网站</b>呈现。本组选题为「大语言模型应用开发与评估——面向 AI 专业大一学生的技术地图、产业生态与学习路径」，
          中枢任务是「基于课程资料的知识问答」。
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-secondary">
          目标是帮助大一学生建立宏观框架、理解主要关系、探索成长方向：知道这个领域要解决什么问题、有哪些概念与方法、
          产业中谁在做什么、成本由谁承担，以及从培养要求到具体实践的学习路径该怎么走。
        </p>
      </section>

      <section className="card mb-4 p-4">
        <h2 className="mb-2 font-serif text-[16px]">三张地图的分工与联动</h2>
        <ul className="space-y-1.5 text-[13px] leading-relaxed text-secondary">
          <li>· <b>领域地图</b>（{String((s.nodes_by_map as Record<string, number>)?.domain ?? '—')} 节点）：问题与任务、概念与原理、方法与技术路线、软件与模型、数据与实践资源、课程与学习路径。</li>
          <li>· <b>生态地图</b>（{String((s.nodes_by_map as Record<string, number>)?.ecosystem ?? '—')} 节点）：参与者 × 关系链。主线 A 从论文到本组应用，辅线 B 谁承担成本，另选取少量直接相关的其他观察维度。</li>
          <li>· <b>认知地图</b>（{String((s.nodes_by_map as Record<string, number>)?.cognition ?? '—')} 节点）：认识方法、分析方法、真实案例、成长习惯与认识修正。</li>
          <li>· <b>联动机制</b>：全站节点 ID 唯一（D-/E-/C- 前缀区分），三图共享节点与来源，不为同一概念建重复副本。
            选中任一节点时，<Link to="/maps/domain" className="underline decoration-dotted">X-Ray 透视镜</Link>会在图内画出引力线，
            侧栏列出它在另外两张地图中的关联；移动端转为底部抽屉的多维标签流。</li>
        </ul>
      </section>

      <section className="card mb-4 p-4">
        <h2 className="mb-2 font-serif text-[16px]">技术架构</h2>
        <dl className="grid gap-x-4 gap-y-1.5 text-[12.5px] sm:grid-cols-[auto_1fr]">
          <dt className="text-muted">前端</dt><dd className="text-secondary">React 19 + TypeScript + Vite + Tailwind CSS v4（CSS-first 语义化 Token）+ Zustand 全局联动状态机 + 原生 SVG 引力线</dd>
          <dt className="text-muted">后端</dt><dd className="text-secondary">Node.js + Express 5，公开只读 API 与受控管理 API 分离</dd>
          <dt className="text-muted">存储</dt><dd className="text-secondary">SQLite（Node 内置 <code className="font-mono text-[11.5px]">node:sqlite</code>），九张表：nodes / relations / sources / update_log / feedback / candidate_content / eval_items / eval_runs / ai_usage</dd>
          <dt className="text-muted">检索</dt><dd className="text-secondary">自建轻量检索：三处索引（节点/关系/来源结论）+ BM25 打分 + IDF 降权高频词 + 同义词扩展 + 一跳图扩展</dd>
          <dt className="text-muted">AI</dt><dd className="text-secondary">
            主渠道智谱 GLM-4.7-Flash，备用 DeepSeek deepseek-flash，均为 OpenAI 兼容形态；
            强制引用 + 服务端引用校验 + 越界闸门 + 无密钥时降级为非生成式检索直出
          </dd>
          <dt className="text-muted">测试</dt><dd className="text-secondary">Node 内置 test runner（单元/接口）+ Playwright 真实浏览器端到端测试与多分辨率截图</dd>
          <dt className="text-muted">安全</dt><dd className="text-secondary">密钥只在服务端环境变量；CSP/X-Frame-Options/nosniff 等响应头；全局限流 + AI/反馈接口独立限流；管理端需 ADMIN_TOKEN（未配置则写操作返回 501）；错误信息过滤凭据</dd>
        </dl>
        <p className="mt-3 border-t border-subtle pt-2 text-[12px] leading-relaxed text-muted">
          选型理由与全部技术取舍（含被放弃的方案）记录在仓库根目录 <code className="font-mono">DECISIONS.md</code>；
          数据结构见 <code className="font-mono">docs/DATA-DICTIONARY.md</code>；运维见 <code className="font-mono">docs/OPERATIONS.md</code>。
        </p>
      </section>

      <section className="card mb-4 p-4">
        <h2 className="mb-2 font-serif text-[16px]">研究依据与核实方式</h2>
        <ul className="space-y-1.5 text-[13px] leading-relaxed text-secondary">
          <li>· <b>项目内一手资料</b>：课程讲义整理稿（作业要求与五章讲义目录）、2026 级人工智能专业培养方案附件、项目方案 V2.0。</li>
          <li>· <b>论文核实</b>：14 篇论文逐篇抓取 arXiv 摘要页，提取 citation_author、citation_online_date 与 Comments 字段；
            再用 Semantic Scholar Graph API 的 venue 与 authors.affiliations 字段交叉核实。两源一致标「已核实」，单源标「部分核实」。</li>
          <li>· <b>官方资料核实</b>：智谱定价页与 GLM-4.6 模型文档、DeepSeek 定价页与 API 文档、飞书产品页与开放平台文档、
            Node.js/Vite/Tailwind/React/Zustand 官方文档，均在 2026-11-01 实际抓取并摘录关键数据。</li>
          <li>· <b>运行记录</b>：模型调用的耗时与 token 用量、评测运行结果均来自实际执行，写入数据库与 JSON 文件。</li>
        </ul>
        <p className="mt-2 text-[12.5px] text-muted">
          完整来源清单见<Link to="/sources" className="mx-1 underline decoration-dotted">来源库</Link>（{String(s.sources ?? '—')} 条），
          每条含标题、发布机构、作者、URL、发布日期、访问日期、支持的具体结论与备注。
        </p>
      </section>

      <section className="card mb-4 border-[color:var(--ev-partial)] p-4">
        <h2 className="mb-2 font-serif text-[16px]">诚实声明：本站明确标注的缺口</h2>
        <ul className="space-y-1.5 text-[13px] leading-relaxed text-secondary">
          <li>· <b>具体课名待核实</b>：培养方案附件只含培养目标（3 条）与毕业要求（10 条），不含课程目录、学分表与教学进程表；
            公开渠道也未定位到对应学校的官方文件。因此课程节点只提供「类别槽位」，<b>不臆造任何课名</b>。</li>
          <li>· <b>CCF 会议类别待核实</b>：CCF 官网访问返回 WAF 挑战页，未能取得推荐目录正文。所有论文一律<b>不标注 A/B 类</b>，只保留可双源印证的会议名。</li>
          <li>· <b>飞书妙搭能力无法核实</b>：妙搭产品页与开放平台文档路径返回 404 或空壳标题。结论限定为「无法核实，故不作为架构前提」，
            <b>不断言平台不满足要求</b>。</li>
          <li>· <b>成员分工已编制、待签字确认</b>：四人角色、牵头模块与量化分摊见<Link to="/team" className="mx-1 underline decoration-dotted">小组分工</Link>（依据细则 V1.1，2026-11-02）；签字栏如实留空。真实 API 费用仍无账单，显示「尚未采集」，通过<Link to="/feedback" className="mx-1 underline decoration-dotted">补录入口</Link>等待成员填写。</li>
          <li>· <b>同学反馈数据为空</b>：网站刚交付，尚无真实使用与反馈数据；反馈页显示空状态与提交入口，<b>不展示虚构样例</b>。</li>
          <li>· <b>DeepSeek 官方端点未验证</b>：备用渠道代码路径完整（切换 BASE URL 与密钥即可），但本次交付未取得官方密钥，真实调用未验证。</li>
          <li>· <b>理解程度均为「未评估」</b>：knowledge_status 只能来自真实学习者反馈或经授权的人工记录，AI 不得猜测写入。</li>
          <li>· <b>认知地图不含虚构个人经历</b>：真实案例全部来自本项目实际执行记录（可追溯到研究抓取记录与运行数据）；
            个人学习经历留待成员按四段结构补录。</li>
        </ul>
      </section>

      <section className="card mb-4 p-4">
        <h2 className="mb-2 font-serif text-[16px]">外部阻塞事项（需账号所有者完成）</h2>
        <p className="mb-2 text-[12.5px] leading-relaxed text-secondary">
          以下事项必须由账号所有者本人操作，Agent 无法代办。除这些之外，其余工作均已完成。
        </p>
        <ol className="space-y-2 text-[13px] leading-relaxed text-secondary">
          <li>
            <b>1. 公开托管地址</b>：课程要求网站云端运行、国内普通网络可访问、无需登录。生产构建与端到端测试已完成，
            但发布到公网需要平台账号授权（或一台可 SSH 的服务器）。最短路径见 <code className="font-mono text-[12px]">docs/DEPLOY.md</code>。
          </li>
          <li>
            <b>2. 正式模型密钥</b>：当前使用本机已配置的兼容网关完成真实调用与评测。若要用官方端点，
            需在智谱/DeepSeek 开放平台申请密钥并填入服务端环境变量（<code className="font-mono text-[12px]">.env.example</code> 有完整说明）。
            <b>不要把密钥写进前端或提交到仓库。</b>
          </li>
          <li>
            <b>3. 成员名单与贡献说明</b>：需小组成员确认后通过管理端补录；本项目不代为编造分工与贡献比例。
          </li>
          <li>
            <b>4. 完整培养方案 / 课程大纲</b>：若能取得学校官方文件，课程类别槽位可拆分为具体课程节点，课程关联链会更完整。
          </li>
        </ol>
      </section>

      <section className="card p-4">
        <h2 className="mb-2 font-serif text-[16px]">维护方式</h2>
        <p className="text-[13px] leading-relaxed text-secondary">
          维护人员配置 <code className="font-mono text-[12px]">ADMIN_TOKEN</code> 后即可通过
          <Link to="/admin" className="mx-1 underline decoration-dotted">管理端</Link>
          新增/编辑/下架节点、关系与来源，审核候选内容，处理反馈，并写入更新记录。
          数据可随时导出为 JSON/CSV（<code className="font-mono text-[12px]">npm run export</code>），
          备份与恢复见 <code className="font-mono text-[12px]">npm run backup</code> / <code className="font-mono text-[12px]">npm run restore</code>。
        </p>
        <p className="mt-2 text-[12.5px] text-muted">
          课程要求「每周至少检查一次」：建议每周复核快变量节点（价格、模型版本、平台功能），
          更新 last_checked 并写入更新记录；管理端的一致性检查（<code className="font-mono text-[12px]">npm run lint:data</code>）可发现孤立节点、悬空引用与缺失来源。
        </p>
      </section>

      <p className="mt-4 text-center text-[11.5px] text-muted">
        本页所有快变量信息的核查日期为 2026-11-01。价格、模型版本与平台功能可能已变化，
        复核途径见<ExternalLink href="https://docs.bigmodel.cn/cn/guide/start/pricing" className="mx-1">智谱定价页</ExternalLink>与
        <ExternalLink href="https://api-docs.deepseek.com/zh-cn/quick_start/pricing" className="mx-1">DeepSeek 定价页</ExternalLink>。
      </p>
    </div>
  );
}