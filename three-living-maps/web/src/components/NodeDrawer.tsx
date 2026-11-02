// 节点详情抽屉（桌面端右侧滑出）：承载跨图联动、关系、来源、继续探索。
// 移动端不渲染（由 MobileDock 承担），避免横向溢出与双重抽屉。
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, ApiError } from '@/lib/api';
import { useMapStore } from '@/store/useMapStore';
import { EvidenceBadge, KnowledgeBadge, StaleFlag, ExternalLink, Loading, ErrorState, Tag } from '@/lib/ui';
import { nodeTypeLabel } from './MapNodeCard';
import type { NodeDetail } from '@/lib/types';

export function NodeDrawer() {
  const navigate = useNavigate();
  const activeNodeId = useMapStore((s) => s.activeNodeId);
  const drawerOpen = useMapStore((s) => s.drawerOpen);
  const setDrawerOpen = useMapStore((s) => s.setDrawerOpen);
  const closeOverlays = useMapStore((s) => s.closeOverlays);
  const setActiveNode = useMapStore((s) => s.setActiveNode);
  const isXRayActive = useMapStore((s) => s.isXRayActive);
  const [data, setData] = useState<NodeDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const upd = () => setIsMobile(mq.matches);
    upd();
    mq.addEventListener('change', upd);
    return () => mq.removeEventListener('change', upd);
  }, []);

  useEffect(() => {
    if (!activeNodeId) { setData(null); setErr(null); return; }
    let cancelled = false;
    setLoading(true); setErr(null);
    api.node(activeNodeId)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e: ApiError) => { if (!cancelled) setErr(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activeNodeId]);

  // ESC 关闭
  useEffect(() => {
    // ESC 只收起抽屉，保留选中节点：星群面板与 X-Ray 引力线继续显示（三图联动不中断）
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && drawerOpen) closeOverlays(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen, closeOverlays]);

  if (isMobile) return null;
  if (!activeNodeId || !drawerOpen) return null;

  const n = data?.node;
  const rels = (data?.relations || []).slice().sort((a, b) => (a.direction === b.direction ? 0 : a.direction === 'out' ? -1 : 1));

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/25 fade-in" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
      <aside className="drawer-right fixed right-0 top-0 z-50 flex h-full w-full max-w-[520px] flex-col border-l border-subtle bg-[color:var(--surface-raised)] shadow-raised"
        role="dialog" aria-modal="true" aria-label={n ? '节点详情：' + n.title : '节点详情'} data-testid="node-drawer">
        <div className="flex items-start justify-between gap-3 border-b border-subtle px-4 py-3">
          <div className="min-w-0">
            {loading && !n && <div className="text-sm text-muted">加载中…</div>}
            {n && (
              <>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
                  <span className="font-mono">{n.id}</span>
                  <span aria-hidden="true">·</span>
                  <span>{nodeTypeLabel(n.node_type)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{n.map_type === 'domain' ? '领域地图' : n.map_type === 'ecosystem' ? '生态地图' : '认知地图'}</span>
                </div>
                <h2 className="mt-0.5 font-serif text-[17px] leading-snug">{n.title}</h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <EvidenceBadge status={n.evidence_status} />
                  <KnowledgeBadge status={n.knowledge_status} />
                  <StaleFlag stale={n.stale} lastChecked={n.last_checked} />
                </div>
              </>
            )}
          </div>
          <button onClick={() => setDrawerOpen(false)} aria-label="关闭抽屉"
            className="flex-none rounded-sm border border-strong px-2 py-1 text-[12px] text-muted transition hover:text-[color:var(--text-primary)]">✕</button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {loading && !n && <Loading label="正在加载节点详情…" />}
          {err && <ErrorState message={err} onRetry={() => activeNodeId && setActiveNode(activeNodeId, { openDrawer: true })} />}
          {n && (
            <div className="space-y-5">
              <section>
                <p className="text-[13.5px] leading-relaxed text-[color:var(--text-primary)]">{n.summary}</p>
                {n.details && n.details.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {n.details.map((d, i) => (
                      <li key={i} className="border-l-2 border-[color:var(--border-strong)] pl-2.5 text-[12.5px] leading-relaxed text-secondary">{d}</li>
                    ))}
                  </ul>
                )}
                {n.evidence_note && (
                  <p className="mt-2 rounded-sm bg-[color:var(--surface-sunken)] px-2.5 py-2 text-[11.5px] leading-snug text-muted">
                    <span className="font-medium text-secondary">证据说明：</span>{n.evidence_note}
                  </p>
                )}
                {(n.limit || n.limit_note) && (
                  <p className="mt-2 rounded-sm border-l-2 border-[color:var(--ev-partial)] bg-[color:var(--ev-partial-bg)] px-2.5 py-2 text-[11.5px] leading-snug text-secondary">
                    <span className="font-medium text-[color:var(--ev-partial)]">边界与未解决：</span>{n.limit || n.limit_note}
                  </p>
                )}
                {n.why_included && (
                  <p className="mt-2 text-[11.5px] leading-snug text-muted">
                    <span className="font-medium text-secondary">为什么纳入地图：</span>{n.why_included}
                  </p>
                )}
              </section>

              <Meta n={n} />

              <section>
                <h3 className="mb-2 font-serif text-[14px]">关系（{rels.length}）</h3>
                {rels.length === 0 ? (
                  <p className="text-[12px] text-muted">暂无登记关系。</p>
                ) : (
                  <ul className="space-y-1.5">
                    {rels.map((r) => (
                      <li key={r.id} className="rounded-sm border border-subtle px-2.5 py-1.5">
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                          <span className="text-muted">{r.direction === 'out' ? '→' : '←'}</span>
                          <span className="font-mono text-[color:var(--accent)]">{r.relation_type}</span>
                          {r.coverage && <Tag tone="muted">{r.coverage}</Tag>}
                          <EvidenceBadge status={r.evidence_status} compact />
                          <button onClick={() => { setActiveNode(r.other_id!, { openDrawer: true, map: (r.other_map as never) || undefined }); navigate('/node/' + encodeURIComponent(r.other_id!)); }}
                            className="ml-auto text-secondary underline decoration-dotted hover:text-[color:var(--accent)]">
                            {r.other_title || r.other_id}
                            {r.other_map && r.other_map !== n.map_type && <span className="ml-1 text-[10px] text-muted">跨图</span>}
                          </button>
                        </div>
                        <p className="mt-1 text-[12px] leading-snug text-secondary">{r.description}</p>
                        {r.reasoning_chain && (
                          <p className="mt-1 rounded-sm bg-[color:var(--ev-inferred-bg)] px-2 py-1 text-[11px] leading-snug text-secondary">
                            <span className="font-medium text-[color:var(--ev-inferred)]">推理链：</span>{r.reasoning_chain}
                          </p>
                        )}
                        {r.source_ids && r.source_ids.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {r.source_ids.map((s) => (
                              <Link key={s} to={'/source/' + encodeURIComponent(s)} className="rounded-sm border border-subtle px-1 font-mono text-[10px] text-muted hover:text-[color:var(--accent)]">{s}</Link>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h3 className="mb-2 font-serif text-[14px]">来源（{(data?.sources || []).length}）</h3>
                {(data?.sources || []).length === 0 ? (
                  <p className="text-[12px] text-muted">该节点未登记外部来源（可能属项目自定义分析框架）。</p>
                ) : (
                  <ul className="space-y-1.5">
                    {(data?.sources || []).map((s) => (
                      <li key={s.id} className="rounded-sm border border-subtle px-2.5 py-1.5">
                        <div className="flex flex-wrap items-baseline gap-1.5">
                          <Link to={'/source/' + encodeURIComponent(s.id)} className="font-mono text-[10.5px] text-muted hover:text-[color:var(--accent)]">{s.id}</Link>
                          <span className="text-[12.5px] font-medium">{s.title}</span>
                        </div>
                        <div className="mt-0.5 flex flex-wrap gap-x-2.5 text-[10.5px] text-muted">
                          {s.publisher && <span>{s.publisher}</span>}
                          <span>访问 {s.accessed_at}</span>
                          {s.published_at && <span>发布 {s.published_at}</span>}
                        </div>
                        {s.url && <div className="mt-0.5 text-[11px]"><ExternalLink href={s.url} className="text-[color:var(--accent)]">{s.url.length > 60 ? s.url.slice(0, 60) + '…' : s.url}</ExternalLink></div>}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {data?.explore && <ExploreSection e={data.explore} onPick={(id) => { setActiveNode(id, { openDrawer: true }); navigate('/node/' + encodeURIComponent(id)); }} />}

              <div className="flex flex-wrap gap-2 border-t border-subtle pt-3">
                <button onClick={() => { setDrawerOpen(false); navigate('/node/' + encodeURIComponent(n.id)); }}
                  className="rounded-sm bg-[color:var(--accent)] px-3 py-1.5 text-[12.5px] text-[color:var(--text-on-accent)] transition hover:bg-[color:var(--accent-strong)]">
                  打开完整详情页
                </button>
                <button onClick={() => { setDrawerOpen(false); navigate('/feedback?node=' + encodeURIComponent(n.id)); }}
                  className="rounded-sm border border-strong px-3 py-1.5 text-[12.5px] text-secondary transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]">
                  对这个节点提反馈
                </button>
                {!isXRayActive && (
                  <span className="self-center text-[11px] text-muted">X-Ray 已关闭，当前为静态关联展示</span>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function Meta({ n }: { n: NodeDetail['node'] }) {
  const rows: [string, string][] = [];
  if (n.participant_role) rows.push(['生态角色', n.participant_role]);
  if (n.chain) rows.push(['所在链条', n.chain === 'main_a' ? '主线 A：论文→模型方→社区→应用→使用者' : n.chain === 'side_b' ? '辅线 B：谁承担成本' : '其他观察维度']);
  if (n.cost_side) rows.push(['成本承担方', n.cost_side]);
  if (n.method_ref) rows.push(['对应方法', n.method_ref]);
  if (n.case_ref) rows.push(['关联案例', n.case_ref]);
  if (n.fast_variable) rows.push(['快变量', '是（价格/版本/功能等，需定期复核）']);
  rows.push(['核查日期', n.last_checked]);
  if (n.tags && n.tags.length) rows.push(['标签', n.tags.join(' · ')]);
  if (!rows.length) return null;
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-sm bg-[color:var(--surface-sunken)] px-2.5 py-2 text-[11.5px]">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted">{k}</dt>
          <dd className="text-secondary">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function ExploreSection({ e, onPick }: { e: NodeDetail['explore']; onPick: (id: string) => void }) {
  const groups: [string, typeof e.prerequisites][] = [
    ['前置知识', e.prerequisites], ['相关任务', e.related_tasks], ['工具与模型', e.tools],
    ['论文与团队', e.papers], ['生态关系', e.ecosystem], ['实践案例', e.practices]
  ];
  const shown = groups.filter(([, arr]) => arr && arr.length > 0);
  if (!shown.length) return null;
  return (
    <section>
      <h3 className="mb-2 font-serif text-[14px]">继续探索</h3>
      <div className="space-y-2.5">
        {shown.map(([label, arr]) => (
          <div key={label}>
            <div className="mb-1 text-[11px] font-medium text-muted">{label}</div>
            <div className="flex flex-wrap gap-1.5">
              {arr.map((x) => (
                <button key={x.id + label} onClick={() => onPick(x.id)}
                  className="inline-flex items-center gap-1 rounded-sm border border-subtle px-2 py-1 text-[11.5px] text-secondary transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]">
                  {x.map_type && <span className="font-mono text-[9.5px] opacity-55" title={x.map_type === 'domain' ? '领域地图' : x.map_type === 'ecosystem' ? '生态地图' : '认知地图'}>{x.map_type === 'domain' ? 'D' : x.map_type === 'ecosystem' ? 'E' : 'C'}</span>}
                  {x.title || x.id}
                  <span className="font-mono text-[9.5px] text-muted">{x.relation_type}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}