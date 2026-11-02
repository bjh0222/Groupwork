// 全站搜索：命中节点、关系、来源，展示得分与命中理由（可解释检索）。
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { useMapStore } from '@/store/useMapStore';
import { EvidenceBadge, EmptyState, ErrorState, Loading, Tag } from '@/lib/ui';
import { nodeTypeLabel } from '@/components/MapNodeCard';
import type { MapType } from '@/lib/types';

export function SearchPage() {
  const [sp, setSp] = useSearchParams();
  const q = sp.get('q') || '';
  const [input, setInput] = useState(q);
  const [map, setMap] = useState<string>(sp.get('map') || 'all');
  const setActiveNode = useMapStore((s) => s.setActiveNode);

  const { data, loading, error, retry } = useAsync(
    () => q.trim() ? api.search(q, { map: map === 'all' ? undefined : map, limit: 40 }) : Promise.resolve(null),
    [q, map]
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = input.trim();
    setSp((prev) => { const n = new URLSearchParams(prev); if (v) n.set('q', v); else n.delete('q'); if (map !== 'all') n.set('map', map); else n.delete('map'); return n; });
  };

  const hits = data?.hits || [];
  const grouped = useMemo(() => {
    const g: Record<string, typeof hits> = { node: [], relation: [], source: [] };
    for (const h of hits) (g[h.kind] || g.node).push(h);
    return g;
  }, [hits]);

  return (
    <div className="mx-auto max-w-[1000px] px-3 py-5 sm:px-5">
      <h1 className="mb-3 font-serif text-[22px] sm:text-[26px]">搜索</h1>
      <form onSubmit={submit} className="card mb-4 flex flex-col gap-2 p-3 sm:flex-row sm:items-center" role="search">
        <label htmlFor="s-q" className="sr-only">搜索关键词</label>
        <input id="s-q" type="search" value={input} onChange={(e) => setInput(e.target.value)} autoFocus
          placeholder="搜索节点、概念、关系、来源…（支持中英文与同义词，如 RAG / 检索增强生成）"
          className="min-w-0 flex-1 rounded-sm border border-strong bg-[color:var(--surface-raised)] px-3 py-2 text-sm outline-none focus:border-[color:var(--accent)]" />
        <select value={map} onChange={(e) => setMap(e.target.value)} aria-label="限定地图"
          className="rounded-sm border border-strong bg-[color:var(--surface-raised)] px-2 py-2 text-[12.5px]">
          <option value="all">全部地图</option>
          <option value="domain">领域地图</option>
          <option value="ecosystem">生态地图</option>
          <option value="cognition">认知地图</option>
        </select>
        <button type="submit" className="rounded-sm bg-[color:var(--accent)] px-4 py-2 text-sm text-[color:var(--text-on-accent)] transition hover:bg-[color:var(--accent-strong)]">搜索</button>
      </form>

      {!q.trim() && <EmptyState title="输入关键词开始搜索" hint="检索覆盖节点标题/摘要/详情/标签、关系描述、来源支持结论三处索引，并对同义词做扩展。" />}
      {loading && <Loading label="检索中…" />}
      {error && <ErrorState message={error} onRetry={retry} />}

      {data && !loading && (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-[12px] text-muted">
            <span>「{q}」共命中 {data.total} 条，显示前 {hits.length} 条</span>
            {data.synonymHits && data.synonymHits.length > 0 && (
              <Tag tone="muted">同义词扩展：{data.synonymHits.join('、')}</Tag>
            )}
          </div>

          {hits.length === 0 && (
            <EmptyState title="没有找到相关内容"
              hint={<>
                换个说法试试，或
                <Link to="/feedback" className="mx-1 underline decoration-dotted">提交反馈</Link>
                告诉我们你希望地图覆盖这个主题。本站不会为了「有结果」而返回不相关内容。
              </>} />
          )}

          {grouped.node.length > 0 && (
            <section className="mb-5">
              <h2 className="mb-2 border-b border-subtle pb-1 font-serif text-[15px]">节点（{grouped.node.length}）</h2>
              <ul className="space-y-2">
                {grouped.node.map((h) => (
                  <li key={h.id}>
                    <button onClick={() => { setActiveNode(h.id, { openDrawer: true, map: (h.map_type as MapType) }); }}
                      className="card w-full p-3 text-left transition hover:border-[color:var(--accent)]">
                      <Link to={'/node/' + encodeURIComponent(h.id)} onClick={(e) => e.stopPropagation()}
                        className="flex flex-wrap items-baseline gap-2">
                        <span className="font-mono text-[11px] text-muted">{h.id}</span>
                        <span className="text-[14px] font-medium">{h.title}</span>
                        {h.node_type && <Tag tone="muted">{nodeTypeLabel(h.node_type)}</Tag>}
                        {h.evidence_status && <EvidenceBadge status={h.evidence_status} compact />}
                        <span className="ml-auto font-mono text-[10.5px] text-muted">得分 {h.score}</span>
                      </Link>
                      <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-secondary">{h.snippet}</p>
                      {h.why && h.why.length > 0 && (
                        <p className="mt-1 text-[10.5px] text-muted">命中字段：{h.why.join(' · ')}
                          {h.via_relation && <span className="ml-1 text-[color:var(--accent)]">（经关系 {h.via_relation} 关联）</span>}
                        </p>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {grouped.relation.length > 0 && (
            <section className="mb-5">
              <h2 className="mb-2 border-b border-subtle pb-1 font-serif text-[15px]">关系（{grouped.relation.length}）</h2>
              <ul className="space-y-1.5">
                {grouped.relation.map((h) => (
                  <li key={h.id} className="card p-2.5">
                    <div className="flex flex-wrap items-center gap-2 text-[12px]">
                      <Link to={'/node/' + encodeURIComponent(h.source_node_id!)} className="text-secondary hover:text-[color:var(--accent)]">{h.title}</Link>
                      {h.evidence_status && <EvidenceBadge status={h.evidence_status} compact />}
                      <span className="ml-auto font-mono text-[10.5px] text-muted">得分 {h.score}</span>
                    </div>
                    <p className="mt-1 text-[12px] leading-snug text-secondary">{h.snippet}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {grouped.source.length > 0 && (
            <section>
              <h2 className="mb-2 border-b border-subtle pb-1 font-serif text-[15px]">来源（{grouped.source.length}）</h2>
              <ul className="space-y-1.5">
                {grouped.source.map((h) => (
                  <li key={h.id} className="card p-2.5">
                    <Link to={'/source/' + encodeURIComponent(h.id)} className="flex flex-wrap items-baseline gap-2">
                      <span className="font-mono text-[11px] text-muted">{h.id}</span>
                      <span className="text-[13px] font-medium hover:text-[color:var(--accent)]">{h.title}</span>
                      <span className="ml-auto font-mono text-[10.5px] text-muted">得分 {h.score}</span>
                    </Link>
                    {h.snippet && <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-secondary">{h.snippet}</p>}
                    {h.accessed_at && <p className="mt-0.5 text-[10.5px] text-muted">访问日期 {h.accessed_at}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}