// 首页：选题说明、三张地图入口、数据规模、AI 能力演示入口、诚实声明。
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { useMapStore } from '@/store/useMapStore';
import { AIAssistantLens } from '@/components/AIAssistantLens';
import { Tag } from '@/lib/ui';
import type { Meta } from '@/lib/types';

const CARDS = [
  { id: 'domain', to: '/maps/domain', title: '领域地图', glyph: '◈',
    desc: '问题与任务、概念与原理、方法与技术路线、软件与模型、数据与实践资源、课程与学习路径六大板块，共 67 个节点。',
    points: ['中枢任务：基于课程资料的知识问答', '领域总问题：如何让 LLM 可靠回答它不完全知道的内容', '培养要求 → 能力 → 课程 → 概念 → 实践 的关联链', '三条成长路线：科学家 / 工程师 / 设计师'] },
  { id: 'ecosystem', to: '/maps/ecosystem', title: '生态地图', glyph: '◇',
    desc: '以「参与者 × 关系链」组织，共 45 个节点：论文、模型提供方、开源社区、本组应用、使用者，以及成本与规则维度。',
    points: ['主线 A：论文 → 模型提供方 → 开源社区 → 本组应用 → 使用者', '辅线 B：谁承担成本（含官方定价与核查日期）', '14 篇论文经 arXiv + Semantic Scholar 双源核实', '规则与责任：数据权限、隐私、知识产权、密钥边界'] },
  { id: 'cognition', to: '/maps/cognition', title: '认知地图', glyph: '◉',
    desc: '认识方法、分析方法、真实案例、成长习惯与认识修正，共 30 个节点；案例全部来自本项目实际执行记录。',
    points: ['认识方法：系统观、发展观（课程要求）+ 证据观（项目自定义，已标注）', '分析方法：课程列出六种，其中三种配有真实案例', '认识修正按「原来以为 → 变化 → 现在理解 → 仍不知道」四段书写', '个人经历与成员贡献留补录入口，不虚构'] }
];

export function HomePage() {
  const [meta, setMeta] = useState<Meta | null>(null);
  const setActiveMap = useMapStore((s) => s.setActiveMap);

  useEffect(() => { api.meta().then(setMeta).catch(() => setMeta(null)); }, []);
  const stats = (meta?.stats || {}) as Record<string, number | Record<string, number>>;

  return (
    <div className="mx-auto max-w-[1400px] px-3 py-6 sm:px-5">
      {/* 选题 */}
      <section className="mb-7">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-[11.5px] text-muted">
          <Tag tone="muted">课程《人工智能前沿与创新》大作业</Tag>
          <Tag tone="muted">小组作业 · 三张相互关联、可持续更新的地图</Tag>
        </div>
        <h1 className="font-serif text-[26px] leading-tight sm:text-[32px]">
          大语言模型应用开发与评估
        </h1>
        <p className="mt-1 font-serif text-[15px] text-secondary sm:text-[17px]">
          面向 AI 专业大一学生的技术地图、产业生态与学习路径
        </p>
        <p className="mt-3 max-w-3xl text-[13.5px] leading-relaxed text-secondary">
          本站围绕一个中枢任务——<b>基于课程资料的知识问答</b>——组织三张地图，并提供一个
          <b>与地图数据深度集成的 AI 助手</b>：它只依据地图中已核实的内容作答，每条结论都附可点击的节点引用与原始来源；
          资料未覆盖时明确说明缺口，越界问题直接拒答，绝不编造。
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-[11.5px]">
          <Tag>{String(stats.nodes ?? '—')} 个节点</Tag>
          <Tag>{String(stats.relations ?? '—')} 条关系</Tag>
          <Tag>{String(stats.sources ?? '—')} 条来源</Tag>
          <Tag>{String(stats.eval_items ?? '—')} 道评测题</Tag>
          <Tag tone="accent">快变量核查日期 2026-11-01</Tag>
        </div>
      </section>

      {/* 三张地图入口 */}
      <section className="mb-7">
        <h2 className="mb-3 font-serif text-[19px]">三张地图</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {CARDS.map((c) => (
            <Link key={c.id} to={c.to} onClick={() => setActiveMap(c.id as never)}
              className="card group flex flex-col p-4 transition hover:border-[color:var(--accent)] hover:shadow-raised">
              <div className="mb-1.5 flex items-baseline gap-2">
                <span aria-hidden="true" className="text-[18px] text-[color:var(--accent)]">{c.glyph}</span>
                <h3 className="font-serif text-[17px]">{c.title}</h3>
              </div>
              <p className="text-[12.5px] leading-relaxed text-secondary">{c.desc}</p>
              <ul className="mt-2.5 space-y-1 border-t border-subtle pt-2.5">
                {c.points.map((p, i) => (
                  <li key={i} className="flex gap-1.5 text-[11.5px] leading-snug text-muted">
                    <span aria-hidden="true" className="flex-none text-[color:var(--accent)]">·</span>{p}
                  </li>
                ))}
              </ul>
              <span className="mt-3 text-[12px] text-[color:var(--accent)] group-hover:underline">进入地图 →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* AI 能力演示 */}
      <section className="mb-7">
        <div className="mb-3 flex flex-wrap items-baseline gap-2">
          <h2 className="font-serif text-[19px]">AI 概念助手</h2>
          <span className="text-[11.5px] text-muted">
            与地图数据集成 · 强制引用 · 无证据即拒答 · 越界问题走「知识边界雾化」
          </span>
          <Link to="/assistant" className="ml-auto text-[12px] underline decoration-dotted hover:text-[color:var(--accent)]">
            全屏使用
          </Link>
        </div>
        <AIAssistantLens />
      </section>

      {/* 治理与诚实声明 */}
      <section className="mb-4 grid gap-3 md:grid-cols-2">
        <div className="card p-4">
          <h2 className="mb-2 font-serif text-[15px]">内容治理机制</h2>
          <ul className="space-y-1.5 text-[12.5px] leading-relaxed text-secondary">
            <li>· <b>证据四级状态</b>：已核实 / 部分核实 / 推断 / 待核实，全站节点与关系均标注，且同时用符号与文字（不单靠颜色）。</li>
            <li>· <b>快变量复核</b>：价格、模型版本、平台功能标注核查日期，超过 4 周未复核自动显示「信息可能过期」。</li>
            <li>· <b>候选内容池</b>：AI 生成与自动采集内容先进候选区，经来源检查与逻辑检查后才进正式地图。</li>
            <li>· <b>推断需附推理链</b>：证据状态为「推断」的关系必须写明推理过程，数据库层强制校验。</li>
            <li>· <b>理解程度不由 AI 猜测</b>：knowledge_status 只来自真实学习者反馈，无数据时显示「未评估」。</li>
          </ul>
        </div>
        <div className="card border-[color:var(--ev-partial)] p-4">
          <h2 className="mb-2 font-serif text-[15px]">本站明确标注的缺口</h2>
          <ul className="space-y-1.5 text-[12.5px] leading-relaxed text-secondary">
            <li>· <b>具体课名待核实</b>：培养方案附件只含培养目标与毕业要求，不含课程目录，因此课程节点只提供「类别槽位」，不臆造课名。</li>
            <li>· <b>CCF 会议类别待核实</b>：CCF 官网访问返回 WAF 挑战页，未能取得目录正文，故所有论文一律不标注 A/B 类，只保留可双源印证的会议名。</li>
            <li>· <b>成员贡献与真实费用尚未采集</b>：贡献只依据真实提交记录或成员确认；API 费用无可查询账单，界面显示「尚未采集」。</li>
            <li>· <b>同学反馈数据为空</b>：网站刚交付，反馈页显示空状态与提交入口，不展示虚构样例。</li>
            <li>· <b>DeepSeek 官方端点未验证</b>：备用渠道代码路径完整，但因未取得官方密钥，真实调用未验证，相关结论标注待核实。</li>
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to="/about" className="rounded-sm border border-strong px-2.5 py-1 text-[12px] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]">查看研究依据</Link>
            <Link to="/eval" className="rounded-sm border border-strong px-2.5 py-1 text-[12px] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]">查看评测报告</Link>
          </div>
        </div>
      </section>

      {/* 右下角固定入口：小组分工（用户指定位置与名称） */}
      <Link to="/team"
        aria-label="查看小组分工细则"
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full border border-strong bg-[color:var(--surface-raised)] px-4 py-2 text-[13px] font-medium text-secondary shadow-raised transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
        data-testid="team-entry">
        <span aria-hidden="true" className="text-[15px] leading-none">◈</span>
        小组分工
      </Link>
    </div>
  );
}