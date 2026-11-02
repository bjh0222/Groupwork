// 页脚：项目信息、数据规模、诚实声明。
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';

export function AppFooter() {
  const [stats, setStats] = useState<Record<string, number | Record<string, number>> | null>(null);
  useEffect(() => { api.stats().then((r) => setStats(r.stats)).catch(() => setStats(null)); }, []);
  const byMap = (stats?.nodes_by_map || {}) as Record<string, number>;

  return (
    <footer className="mt-10 border-t border-subtle bg-[color:var(--surface-raised)]">
      <div className="mx-auto grid max-w-[1400px] gap-6 px-4 py-8 text-[12.5px] leading-relaxed text-secondary sm:px-6 md:grid-cols-3">
        <div>
          <div className="mb-2 font-serif text-[15px] text-[color:var(--text-primary)]">三张活地图</div>
          <p className="text-muted">
            课程《人工智能前沿与创新》大作业 · 选题「大语言模型应用开发与评估」·
            面向 AI 专业大一学生的技术地图、产业生态与学习路径。
          </p>
          <p className="mt-2 text-[11.5px] text-muted">
            数据规模：{stats ? String(stats.nodes) : '—'} 个节点（领域 {byMap.domain ?? '—'} / 生态 {byMap.ecosystem ?? '—'} / 认知 {byMap.cognition ?? '—'}）·
            {' '}{stats ? String(stats.relations) : '—'} 条关系 · {stats ? String(stats.sources) : '—'} 条来源
          </p>
        </div>
        <div>
          <div className="mb-2 font-medium text-[color:var(--text-primary)]">内容治理</div>
          <ul className="space-y-1 text-muted">
            <li>· 证据四级状态：已核实 / 部分核实 / 推断 / 待核实</li>
            <li>· 快变量标注核查日期，超 4 周未复核自动提示「信息可能过期」</li>
            <li>· AI 生成内容与自动采集内容先进候选池，经核实后才入正式地图</li>
            <li>· 理解程度（knowledge_status）只来自真实学习者反馈，无数据显示「未评估」</li>
          </ul>
        </div>
        <div>
          <div className="mb-2 font-medium text-[color:var(--text-primary)]">诚实声明</div>
          <ul className="space-y-1 text-muted">
            <li>· 无法核实的内容一律标注「待核实 / 尚未采集」，不以推测充事实</li>
            <li>· 小组成员贡献、真实 API 费用、同学反馈数据待成员补录，本站不虚构</li>
            <li>· 论文会议类别（CCF A/B）因官网拦截未取得，全部标注待核实</li>
            <li>· 具体课名因培养方案附件不含课程目录，仅提供「课程类别槽位」</li>
          </ul>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
            <Link to="/about" className="underline decoration-dotted hover:text-[color:var(--accent)]">关于与数据来源</Link>
            <Link to="/eval" className="underline decoration-dotted hover:text-[color:var(--accent)]">评测报告</Link>
            <Link to="/admin" className="underline decoration-dotted hover:text-[color:var(--accent)]">管理端</Link>
            <Link to="/team" className="underline decoration-dotted hover:text-[color:var(--accent)]">小组分工</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-subtle px-4 py-3 text-center text-[11px] text-muted sm:px-6">
        所有价格、模型版本与平台功能信息的核查日期均为 2026-11-01；此类快变量可能已发生变化。
      </div>
    </footer>
  );
}