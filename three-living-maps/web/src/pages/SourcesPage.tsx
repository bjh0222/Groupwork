// 来源库：全部来源，可按类型筛选，展示支持的具体结论与被哪些节点引用。
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { EmptyState, ErrorState, ExternalLink, Loading, Tag } from '@/lib/ui';

const TYPE_LABEL: Record<string, string> = {
  paper: '论文', official_doc: '官方文档', pricing: '官方定价', curriculum: '培养方案',
  project_doc: '项目资料', community: '社区/机构', benchmark: '运行记录', tool_doc: '工具文档'
};

export function SourcesPage() {
  const [type, setType] = useState('all');
  const [q, setQ] = useState('');
  const { data, loading, error, retry } = useAsync(() => api.sources({}), []);
  const [usedBy, setUsedBy] = useState<Record<string, { id: string; title: string }[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);

  const sources = data?.sources || [];
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of sources) m.set(s.source_type, (m.get(s.source_type) || 0) + 1);
    return m;
  }, [sources]);

  const filtered = useMemo(() => sources.filter((s) => {
    if (type !== 'all' && s.source_type !== type) return false;
    if (q.trim()) {
      const t = q.trim().toLowerCase();
      const hay = (s.title + ' ' + (s.publisher || '') + ' ' + (s.author || '') + ' ' + (s.supports || []).join(' ') + ' ' + (s.notes || '')).toLowerCase();
      if (!hay.includes(t)) return false;
    }
    return true;
  }), [sources, type, q]);

  const loadUsedBy = async (id: string) => {
    if (usedBy[id]) return;
    try {
      const r = await api.source(id);
      setUsedBy((p) => ({ ...p, [id]: r.used_by.map((u) => ({ id: u.id, title: u.title })) }));
    } catch { setUsedBy((p) => ({ ...p, [id]: [] })); }
  };

  return (
    <div className="mx-auto max-w-[1100px] px-3 py-5 sm:px-5">
      <header className="mb-4">
        <h1 className="font-serif text-[22px] sm:text-[26px]">来源库</h1>
        <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-secondary">
          全站每条关键事实与关系都可追溯到这里的来源。记录包含标题、发布机构/作者、原始 URL、发布日期、访问日期、
          支持的具体结论与备注。涉及价格、模型版本、平台功能等<b>快变量</b>的来源均标注核查日期（本项目统一为 2026-11-01）。
        </p>
        <p className="mt-2 text-[12px] text-muted">
          来源优先级：项目内资料 → 官方文档/定价页/公告 → 原始论文与机构官方资料 → 高质量技术文档 → 其他公开资料（仅作线索）。
          抓取失败的来源同样保留记录并说明原因，不做掩盖。
        </p>
      </header>

      <div className="card mb-4 flex flex-wrap items-center gap-3 p-2.5 text-[12px]">
        <label htmlFor="src-q" className="sr-only">搜索来源</label>
        <input id="src-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索标题、机构、结论…"
          className="min-w-0 flex-1 rounded-sm border border-strong bg-[color:var(--surface-raised)] px-2.5 py-1.5 text-[12.5px] outline-none focus:border-[color:var(--accent)] sm:max-w-xs" />
        <label htmlFor="src-type" className="text-muted">类型</label>
        <select id="src-type" value={type} onChange={(e) => setType(e.target.value)}
          className="rounded-sm border border-strong bg-[color:var(--surface-raised)] px-2 py-1 text-[12px]">
          <option value="all">全部（{sources.length}）</option>
          {[...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t, c]) => (
            <option key={t} value={t}>{TYPE_LABEL[t] || t}（{c}）</option>
          ))}
        </select>
        <span className="ml-auto text-[11px] text-muted">显示 {filtered.length} / {sources.length}</span>
      </div>

      {loading && <Loading label="正在加载来源库…" />}
      {error && <ErrorState message={error} onRetry={retry} />}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState title="没有符合条件的来源" hint="试试更换关键词或类型筛选。" />
      )}

      <ul className="space-y-2.5">
        {filtered.map((s) => {
          const open = expanded === s.id;
          return (
            <li key={s.id} className="card p-3">
              <div className="flex flex-wrap items-baseline gap-2">
                <Link to={'/source/' + encodeURIComponent(s.id)} className="font-mono text-[11px] text-muted hover:text-[color:var(--accent)]">{s.id}</Link>
                <span className="text-[14px] font-medium leading-snug">{s.title}</span>
                <Tag tone="muted">{TYPE_LABEL[s.source_type] || s.source_type}</Tag>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted">
                {s.publisher && <span>发布：{s.publisher}</span>}
                {s.author && <span>作者：{s.author}</span>}
                {s.published_at && <span>发布日：{s.published_at}</span>}
                <span>访问日：{s.accessed_at}</span>
              </div>
              {s.url && <div className="mt-1 text-[11.5px]"><ExternalLink href={s.url} className="text-[color:var(--accent)]">{s.url}</ExternalLink></div>}
              {s.supports && s.supports.length > 0 && (
                <ul className="mt-2 space-y-0.5 border-l-2 border-[color:var(--border-strong)] pl-2.5 text-[12px] leading-snug text-secondary">
                  {(open ? s.supports : s.supports.slice(0, 2)).map((sp, i) => <li key={i}>· {sp}</li>)}
                </ul>
              )}
              {s.notes && <p className="mt-1.5 text-[11.5px] leading-snug text-muted">{s.notes}</p>}
              <div className="mt-2 flex items-center gap-3">
                {s.supports && s.supports.length > 2 && (
                  <button onClick={() => setExpanded(open ? null : s.id)} className="text-[11.5px] text-muted underline decoration-dotted hover:text-[color:var(--accent)]">
                    {open ? '收起结论' : '展开全部 ' + s.supports.length + ' 条结论'}
                  </button>
                )}
                <button onClick={() => { setExpanded(open ? null : s.id); loadUsedBy(s.id); }}
                  className="text-[11.5px] text-muted underline decoration-dotted hover:text-[color:var(--accent)]">
                  被哪些节点引用
                </button>
              </div>
              {open && usedBy[s.id] && (
                <div className="mt-2 flex flex-wrap gap-1.5 border-t border-subtle pt-2">
                  {usedBy[s.id].length === 0 ? <span className="text-[11.5px] text-muted">暂无节点引用该来源。</span> :
                    usedBy[s.id].map((u) => (
                      <Link key={u.id} to={'/node/' + encodeURIComponent(u.id)}
                        className="inline-flex items-center gap-1 rounded-sm border border-subtle px-2 py-0.5 text-[11px] text-secondary hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]">
                        <span className="font-mono text-[9.5px] opacity-60">{u.id}</span>{u.title}
                      </Link>
                    ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}