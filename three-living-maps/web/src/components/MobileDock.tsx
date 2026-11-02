// 移动端降级（方案 §四）：屏幕 < 768px 时，全屏 SVG 联动转为
// 「底部向上滑出的抽屉式多维标签流」，水平 Tab 切换领域解构 / 生态链条 / 认知反思，
// 保证无横向溢出且触控可完成全部主要交互。
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useMapStore } from '@/store/useMapStore';
import { EvidenceBadge, StaleFlag, Tag } from '@/lib/ui';
import { nodeTypeLabel } from './MapNodeCard';
import type { MapNode, Relation, Source } from '@/lib/types';

type Tab = 'domain' | 'ecosystem' | 'cognition';
const TAB_LABEL: Record<Tab, string> = {
  domain: '领域解构', ecosystem: '生态链条', cognition: '认知反思'
};

export function MobileDock() {
  const navigate = useNavigate();
  const activeNodeId = useMapStore((s) => s.activeNodeId);
  const drawerOpen = useMapStore((s) => s.drawerOpen);
  const setDrawerOpen = useMapStore((s) => s.setDrawerOpen);
  const closeOverlays = useMapStore((s) => s.closeOverlays);
  const setActiveNode = useMapStore((s) => s.setActiveNode);
  const mobileTab = useMapStore((s) => s.mobileTab);
  const setMobileTab = useMapStore((s) => s.setMobileTab);
  const isXRayActive = useMapStore((s) => s.isXRayActive);

  const [isMobile, setIsMobile] = useState(false);
  const [node, setNode] = useState<MapNode | null>(null);
  const [rels, setRels] = useState<Relation[]>([]);
  const [srcs, setSrcs] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const upd = () => setIsMobile(mq.matches);
    upd();
    mq.addEventListener('change', upd);
    return () => mq.removeEventListener('change', upd);
  }, []);

  useEffect(() => {
    if (!activeNodeId) { setNode(null); setRels([]); setSrcs([]); return; }
    let cancelled = false;
    setLoading(true);
    api.node(activeNodeId)
      .then((d) => { if (cancelled) return; setNode(d.node); setRels(d.relations || []); setSrcs(d.sources || []); })
      .catch(() => { if (!cancelled) { setNode(null); setRels([]); setSrcs([]); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activeNodeId]);

  if (!isMobile) return null;

  // 未选中节点时提供一个可收起的入口条，避免遮挡内容
  if (!activeNodeId || !drawerOpen) return null;

  // 按当前 Tab 过滤：领域解构=领域节点及关系；生态链条=生态；认知反思=认知
  const relsForTab = rels.filter((r) => r.other_map === mobileTab || (node && node.map_type === mobileTab));
  const relatedNodes = relsForTab.map((r) => ({
    id: r.other_id!, title: r.other_title || r.other_id!, rel: r.relation_type,
    coverage: r.coverage, ev: r.evidence_status, map: r.other_map, dir: r.direction
  }));

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 max-h-[78vh] overflow-hidden rounded-t-xl border-t border-strong bg-[color:var(--surface-raised)] shadow-raised drawer-up"
      role="dialog" aria-modal="true" aria-label={'节点详情：' + (node?.title || '')} data-testid="mobile-dock">
      {/* 抓手 + 关闭 */}
      <div className="flex items-center justify-between gap-2 border-b border-subtle px-3 pt-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[10.5px] text-muted">
            {node && <span className="font-mono">{node.id}</span>}
            {node && <span aria-hidden="true">·</span>}
            {node && <span>{nodeTypeLabel(node.node_type)}</span>}
          </div>
          <div className="truncate font-serif text-[15px] leading-snug">{node?.title || (loading ? '加载中…' : '未选中节点')}</div>
        </div>
        <div className="flex flex-none items-center gap-1.5">
          {node && <EvidenceBadge status={node.evidence_status} compact />}
          <button onClick={() => closeOverlays()} aria-label="收起底部抽屉"
            className="rounded-sm border border-strong px-2 py-1 text-[12px] text-muted">✕</button>
        </div>
      </div>

      {/* 水平 Tab：三图多维标签流 */}
      <div className="flex gap-1 overflow-x-auto border-b border-subtle px-2 py-1.5" role="tablist" aria-label="多维标签流">
        {(Object.keys(TAB_LABEL) as Tab[]).map((t) => (
          <button key={t} role="tab" aria-selected={mobileTab === t} onClick={() => setMobileTab(t)}
            className={
              'flex-none rounded-full px-3 py-1 text-[12px] transition ' +
              (mobileTab === t
                ? 'bg-[color:var(--accent)] text-[color:var(--text-on-accent)]'
                : 'border border-strong text-secondary')
            }>
            {TAB_LABEL[t]}
            {t === (node?.map_type as Tab) && <span className="ml-1 text-[9px] opacity-70">当前</span>}
          </button>
        ))}
      </div>

      <div className="max-h-[52vh] overflow-y-auto overscroll-contain px-3 py-3">
        {node && (
          <>
            {node.stale && <div className="mb-2"><StaleFlag stale lastChecked={node.last_checked} /></div>}
            <p className="text-[13px] leading-relaxed text-[color:var(--text-primary)]">{node.summary}</p>
            {node.details && node.details.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {node.details.slice(0, 4).map((d, i) => (
                  <li key={i} className="border-l-2 border-[color:var(--border-strong)] pl-2.5 text-[12px] leading-relaxed text-secondary">{d}</li>
                ))}
              </ul>
            )}
            {(node.limit || node.limit_note) && (
              <p className="mt-2 rounded-sm border-l-2 border-[color:var(--ev-partial)] bg-[color:var(--ev-partial-bg)] px-2 py-1.5 text-[11.5px] leading-snug text-secondary">
                <span className="font-medium text-[color:var(--ev-partial)]">边界：</span>{node.limit || node.limit_note}
              </p>
            )}
          </>
        )}

        {/* 当前 Tab 的关联节点（替代桌面端的 SVG 引力线） */}
        <div className="mt-3">
          <div className="mb-1.5 flex items-baseline justify-between">
            <h3 className="font-serif text-[13.5px]">{TAB_LABEL[mobileTab]} · 关联（{relatedNodes.length}）</h3>
            {!isXRayActive && <span className="text-[10.5px] text-muted">X-Ray 已关，静态展示</span>}
          </div>
          {relatedNodes.length === 0 ? (
            <p className="text-[12px] text-muted">该节点在「{TAB_LABEL[mobileTab]}」维度下暂无登记关联。</p>
          ) : (
            <ul className="space-y-1.5">
              {relatedNodes.map((r, i) => (
                <li key={r.id + i}>
                  <button
                    onClick={() => { setActiveNode(r.id, { openDrawer: true, map: (r.map as never) || undefined }); navigate('/node/' + encodeURIComponent(r.id)); }}
                    className="w-full rounded-sm border border-subtle px-2.5 py-1.5 text-left transition active:border-[color:var(--accent)]">
                    <div className="flex items-center gap-1.5 text-[10.5px]">
                      <span className="text-muted">{r.dir === 'out' ? '→' : '←'}</span>
                      <span className="font-mono text-[color:var(--accent)]">{r.rel}</span>
                      {r.coverage && <Tag tone="muted">{r.coverage}</Tag>}
                      <EvidenceBadge status={r.ev} compact />
                    </div>
                    <div className="mt-0.5 text-[12.5px] leading-snug text-[color:var(--text-primary)]">{r.title}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 来源 */}
        <div className="mt-3">
          <h3 className="mb-1.5 font-serif text-[13.5px]">来源（{srcs.length}）</h3>
          {srcs.length === 0 ? (
            <p className="text-[12px] text-muted">未登记外部来源。</p>
          ) : (
            <ul className="space-y-1">
              {srcs.slice(0, 5).map((s) => (
                <li key={s.id} className="rounded-sm border border-subtle px-2 py-1.5">
                  <div className="flex items-baseline gap-1.5">
                    <Link to={'/source/' + encodeURIComponent(s.id)} className="font-mono text-[10px] text-muted">{s.id}</Link>
                    <span className="min-w-0 flex-1 truncate text-[12px]">{s.title}</span>
                  </div>
                  <div className="text-[10.5px] text-muted">访问 {s.accessed_at}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-3 flex gap-2 pb-2">
          <button onClick={() => { setDrawerOpen(false); navigate('/node/' + encodeURIComponent(node!.id)); }}
            className="flex-1 rounded-sm bg-[color:var(--accent)] px-3 py-2 text-[12.5px] text-[color:var(--text-on-accent)]">
            打开完整详情页
          </button>
          <button onClick={() => { setDrawerOpen(false); navigate('/feedback?node=' + encodeURIComponent(node!.id)); }}
            className="flex-none rounded-sm border border-strong px-3 py-2 text-[12.5px] text-secondary">
            提反馈
          </button>
        </div>
      </div>
    </div>
  );
}