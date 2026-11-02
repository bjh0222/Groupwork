// 节点详情页：深链接可刷新，完整展示定义、关系、来源、继续探索、更新历史与反馈入口。
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { useMapStore } from '@/store/useMapStore';
import { XRayOverlay, type XRayLink } from '@/components/XRayOverlay';
import { EvidenceBadge, KnowledgeBadge, StaleFlag, ErrorState, Loading, Tag, ExternalLink } from '@/lib/ui';
import { nodeTypeLabel } from '@/components/MapNodeCard';
import type { MapNode } from '@/lib/types';

const MAP_LABEL = { domain: '领域地图', ecosystem: '生态地图', cognition: '认知地图' } as const;

export function NodePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const setActiveNode = useMapStore((s) => s.setActiveNode);
  const setActiveMap = useMapStore((s) => s.setActiveMap);
  const activeNodeId = useMapStore((s) => s.activeNodeId);

  const { data, loading, error, retry } = useAsync(() => api.node(id || ''), [id]);
  const [neighbors, setNeighbors] = useState<Map<string, MapNode>>(new Map());

  const node = data?.node;

  // 进入详情页时同步全局状态（驱动 X-Ray 与抽屉）
  useEffect(() => {
    if (node) {
      setActiveMap(node.map_type);
      if (activeNodeId !== node.id) setActiveNode(node.id, { openDrawer: false, map: node.map_type });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node?.id]);

  // 加载关联节点实体，用于渲染卡片与 X-Ray 连线
  useEffect(() => {
    const rels = data?.relations || [];
    if (!rels.length) return;
    let cancelled = false;
    const ids = [...new Set(rels.map((r) => r.other_id!).filter(Boolean))];
    const missing = ids.filter((i) => !neighbors.has(i));
    if (!missing.length) return;
    Promise.all(missing.map((i) => api.node(i).then((d) => d.node).catch(() => null)))
      .then((res) => {
        if (cancelled) return;
        setNeighbors((prev) => {
          const next = new Map(prev);
          res.forEach((n, i) => { if (n) next.set(missing[i], n); });
          return next;
        });
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.relations?.length]);

  const xrayLinks = useMemo<XRayLink[]>(() => {
    if (!node) return [];
    return (data?.relations || [])
      .filter((r) => r.other_id && neighbors.has(r.other_id))
      .map((r) => ({
        relation: r, otherId: r.other_id!, otherTitle: r.other_title || r.other_id!,
        otherMap: r.other_map || node.map_type, direction: r.direction || 'out'
      }));
  }, [data, neighbors, node]);

  if (loading && !node) {
    return <div className="mx-auto max-w-[1100px] px-4 py-10"><Loading label="正在加载节点…" /></div>;
  }
  if (error || !node) {
    return (
      <div className="mx-auto max-w-[1100px] px-4 py-10">
        <ErrorState message={error || '节点不存在'} onRetry={retry}
          hint="该节点可能已下架，或链接有误。可返回首页浏览三张地图。" />
        <div className="mt-4 text-center">
          <Link to="/" className="text-[13px] underline decoration-dotted hover:text-[color:var(--accent)]">返回首页</Link>
        </div>
      </div>
    );
  }

  const rels = data?.relations || [];
  const outRels = rels.filter((r) => r.direction === 'out');
  const inRels = rels.filter((r) => r.direction === 'in');

  return (
    <div ref={containerRef} className="mx-auto max-w-[1100px] px-3 py-5 sm:px-5">
      <nav aria-label="面包屑" className="mb-3 flex flex-wrap items-center gap-1.5 text-[11.5px] text-muted">
        <Link to="/" className="hover:text-[color:var(--accent)]">首页</Link>
        <span aria-hidden="true">/</span>
        <Link to={'/maps/' + node.map_type} className="hover:text-[color:var(--accent)]">{MAP_LABEL[node.map_type]}</Link>
        <span aria-hidden="true">/</span>
        <span className="font-mono">{node.id}</span>
      </nav>

      <header className="card mb-4 p-4">
        <div className="flex flex-wrap items-center gap-1.5 text-[11.5px] text-muted">
          <span aria-hidden="true" className={'nt-dot nt-' + node.node_type} />
          <span>{nodeTypeLabel(node.node_type)}</span>
          {node.section && <><span aria-hidden="true">·</span><span>板块 {node.section}</span></>}
          {node.participant_role && <><span aria-hidden="true">·</span><span>{node.participant_role}</span></>}
        </div>
        <h1 className="mt-1 font-serif text-[22px] leading-snug sm:text-[26px]">{node.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <EvidenceBadge status={node.evidence_status} />
          <KnowledgeBadge status={node.knowledge_status} />
          <StaleFlag stale={node.stale} lastChecked={node.last_checked} />
          <Tag tone="muted">核查日期 {node.last_checked}</Tag>
          {node.fast_variable && <Tag tone="accent">快变量</Tag>}
        </div>
        <p className="mt-3 text-[14px] leading-relaxed text-[color:var(--text-primary)]">{node.summary}</p>
        {node.evidence_note && (
          <p className="mt-2 rounded-sm bg-[color:var(--surface-sunken)] px-2.5 py-2 text-[12px] leading-snug text-secondary">
            <span className="font-medium">证据说明：</span>{node.evidence_note}
          </p>
        )}
        {(node.limit || node.limit_note) && (
          <p className="mt-2 rounded-sm border-l-2 border-[color:var(--ev-partial)] bg-[color:var(--ev-partial-bg)] px-2.5 py-2 text-[12px] leading-snug text-secondary">
            <span className="font-medium text-[color:var(--ev-partial)]">边界与未解决问题：</span>{node.limit || node.limit_note}
          </p>
        )}
        {node.why_included && (
          <p className="mt-2 text-[12px] leading-snug text-muted">
            <span className="font-medium text-secondary">为什么纳入地图：</span>{node.why_included}
          </p>
        )}
        {node.tags && node.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">{node.tags.map((t) => <Tag key={t}>{t}</Tag>)}</div>
        )}
      </header>

      {node.details && node.details.length > 0 && (
        <section className="card mb-4 p-4">
          <h2 className="mb-2 font-serif text-[16px]">详细说明</h2>
          <ul className="space-y-2">
            {node.details.map((d, i) => (
              <li key={i} className="border-l-2 border-[color:var(--border-strong)] pl-3 text-[13px] leading-relaxed text-secondary">{d}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-4">
          <h2 className="mb-2 font-serif text-[16px]">指向其他节点（{outRels.length}）</h2>
          <RelList rels={outRels} neighbors={neighbors} onOpen={(nid, m) => { setActiveNode(nid, { openDrawer: false, map: m }); navigate('/node/' + encodeURIComponent(nid)); }} />
        </section>
        <section className="card p-4">
          <h2 className="mb-2 font-serif text-[16px]">被其他节点指向（{inRels.length}）</h2>
          <RelList rels={inRels} neighbors={neighbors} onOpen={(nid, m) => { setActiveNode(nid, { openDrawer: false, map: m }); navigate('/node/' + encodeURIComponent(nid)); }} />
        </section>
      </div>

      <section className="card mt-4 p-4">
        <h2 className="mb-2 font-serif text-[16px]">来源（{(data?.sources || []).length}）</h2>
        {(data?.sources || []).length === 0 ? (
          <p className="text-[12.5px] text-muted">
            该节点未登记外部来源。若其 evidence_status 为「推断」，说明它是项目自定义的分析框架结构（推理链见关系条目）。
          </p>
        ) : (
          <ul className="space-y-2">
            {(data?.sources || []).map((s) => (
              <li key={s.id} className="rounded-sm border border-subtle p-2.5">
                <div className="flex flex-wrap items-baseline gap-2">
                  <Link to={'/source/' + encodeURIComponent(s.id)} className="font-mono text-[11px] text-muted hover:text-[color:var(--accent)]">{s.id}</Link>
                  <span className="text-[13.5px] font-medium">{s.title}</span>
                  <Tag tone="muted">{s.source_type}</Tag>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted">
                  {s.publisher && <span>发布：{s.publisher}</span>}
                  {s.author && <span>作者：{s.author}</span>}
                  {s.published_at && <span>发布日：{s.published_at}</span>}
                  <span>访问日：{s.accessed_at}</span>
                </div>
                {s.url && <div className="mt-1 text-[11.5px]"><ExternalLink href={s.url} className="text-[color:var(--accent)]">{s.url}</ExternalLink></div>}
                {s.supports && s.supports.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5 border-l-2 border-[color:var(--border-strong)] pl-2.5 text-[12px] leading-snug text-secondary">
                    {s.supports.map((sp, i) => <li key={i}>· {sp}</li>)}
                  </ul>
                )}
                {s.notes && <p className="mt-1.5 text-[11.5px] leading-snug text-muted">{s.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {data?.explore && <ExploreFull e={data.explore} neighbors={neighbors}
        onOpen={(nid, m) => { setActiveNode(nid, { openDrawer: false, map: m }); navigate('/node/' + encodeURIComponent(nid)); }} />}

      <section className="card mt-4 p-4">
        <h2 className="mb-2 font-serif text-[16px]">对这个节点有疑义？</h2>
        <p className="mb-3 text-[12.5px] leading-relaxed text-secondary">
          如果你发现内容有错、来源不可靠、或有新证据，请提交反馈。我们会核实后修改，并把改动写入
          <Link to="/updates" className="mx-1 underline decoration-dotted">更新记录</Link>
          （记录日期、对象、依据、变更内容与原因）。
        </p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => navigate('/feedback?node=' + encodeURIComponent(node.id))}
            className="rounded-sm bg-[color:var(--accent)] px-3 py-1.5 text-[12.5px] text-[color:var(--text-on-accent)] transition hover:bg-[color:var(--accent-strong)]">
            提交反馈 / 纠错
          </button>
          <button onClick={() => navigate('/feedback?type=candidate&node=' + encodeURIComponent(node.id))}
            className="rounded-sm border border-strong px-3 py-1.5 text-[12.5px] text-secondary transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]">
            推荐新来源（进候选池）
          </button>
        </div>
      </section>

      <XRayOverlay links={xrayLinks} containerRef={containerRef} />
    </div>
  );
}

function RelList({ rels, neighbors, onOpen }: {
  rels: NonNullable<ReturnType<typeof Object>> extends never ? never : any[];
  neighbors: Map<string, MapNode>;
  onOpen: (id: string, m?: MapNode['map_type']) => void;
}) {
  if (!rels.length) return <p className="text-[12.5px] text-muted">暂无。</p>;
  return (
    <ul className="space-y-2">
      {rels.map((r) => {
        const n = neighbors.get(r.other_id);
        return (
          <li key={r.id} className="rounded-sm border border-subtle p-2.5">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="font-mono text-[color:var(--accent)]">{r.relation_type}</span>
              {r.coverage && <Tag tone="muted">{r.coverage}</Tag>}
              <EvidenceBadge status={r.evidence_status} compact />
              {r.other_map && r.other_map !== n?.map_type && null}
            </div>
            <button onClick={() => onOpen(r.other_id, n?.map_type)}
              className="mt-1 block text-left text-[13px] font-medium leading-snug hover:text-[color:var(--accent)]">
              {r.other_title || r.other_id}
              {n && <span className="ml-1.5 text-[10.5px] font-normal text-muted">
                {n.map_type === 'domain' ? '领域' : n.map_type === 'ecosystem' ? '生态' : '认知'}
              </span>}
            </button>
            <p className="mt-1 text-[12px] leading-snug text-secondary">{r.description}</p>
            {r.reasoning_chain && (
              <p className="mt-1 rounded-sm bg-[color:var(--ev-inferred-bg)] px-2 py-1 text-[11.5px] leading-snug text-secondary">
                <span className="font-medium text-[color:var(--ev-inferred)]">推理链：</span>{r.reasoning_chain}
              </p>
            )}
            {r.source_ids && r.source_ids.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {r.source_ids.map((s: string) => (
                  <Link key={s} to={'/source/' + encodeURIComponent(s)} className="rounded-sm border border-subtle px-1 font-mono text-[10px] text-muted hover:text-[color:var(--accent)]">{s}</Link>
                ))}
                <span className="text-[10px] text-muted">核查 {r.checked_at}</span>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function ExploreFull({ e, neighbors, onOpen }: { e: any; neighbors: Map<string, MapNode>; onOpen: (id: string, m?: MapNode['map_type']) => void }) {
  const groups: [string, any[]][] = [
    ['前置知识', e.prerequisites], ['相关任务', e.related_tasks], ['工具与模型', e.tools],
    ['论文与团队', e.papers], ['生态关系', e.ecosystem], ['实践案例', e.practices]
  ];
  const shown = groups.filter(([, a]) => a && a.length);
  if (!shown.length) return null;
  return (
    <section className="card mt-4 p-4">
      <h2 className="mb-2 font-serif text-[16px]">继续探索</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {shown.map(([label, arr]) => (
          <div key={label}>
            <div className="mb-1 text-[11.5px] font-medium text-muted">{label}</div>
            <div className="flex flex-wrap gap-1.5">
              {arr.map((x: any) => {
                const n = neighbors.get(x.id);
                return (
                  <button key={x.id + label} onClick={() => onOpen(x.id, n?.map_type)}
                    className="inline-flex items-center gap-1 rounded-sm border border-subtle px-2 py-1 text-[11.5px] text-secondary transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]">
                    {x.title || x.id}
                    <span className="font-mono text-[9.5px] text-muted">{x.relation_type}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}