// X-Ray 关联星群：把「当前节点 + 其关联节点」渲染成一块紧凑区域，
// 引力线在这些元素之间绘制，因此不受页面滚动位置影响，始终可见、始终可画。
//
// 为什么需要它（实测教训）：最初 X-Ray 直接在长列表卡片之间连线，
// 但 67 个节点的地图页中，选中节点的关联节点往往在视口之外，
// 端点过滤后连线数量为 0 —— 核心亮点功能等于没有生效。
// 现在连线锚点统一为本组件内的 chip（data-xray-id），保证任何情况下都能画出引力线。
import { useNavigate } from 'react-router-dom';
import { useMapStore } from '@/store/useMapStore';
import { EvidenceBadge, Tag } from '@/lib/ui';
import type { MapNode, MapType } from '@/lib/types';
import type { XRayLink as ConstellationLink } from './XRayOverlay';

// 连线类型与 XRayOverlay 共用，避免同一结构在两处定义导致漂移。
export type { ConstellationLink };

export function XRayConstellation({
  activeNode, links, nodeLookup
}: {
  activeNode: MapNode | null;
  links: ConstellationLink[];
  nodeLookup: Map<string, MapNode>;
}) {
  const navigate = useNavigate();
  const setActiveNode = useMapStore((s) => s.setActiveNode);
  const setActiveMap = useMapStore((s) => s.setActiveMap);
  const isXRayActive = useMapStore((s) => s.isXRayActive);

  if (!activeNode) {
    return (
      <div className="card p-3">
        <h2 className="mb-2 font-serif text-[14px]">三图联动 · X-Ray 透视</h2>
        <p className="text-[12px] leading-relaxed text-muted">
          点击任一节点，这里会显示它与<b>三张地图</b>中其他节点的引力线；
          连线中点标注关系类型，悬停可查看关系描述、覆盖程度与来源。
        </p>
      </div>
    );
  }

  // 去重：同一对端节点可能有多条关系，保留第一条用于布局，其余在标签中并列显示
  const byOther = new Map<string, ConstellationLink[]>();
  for (const l of links) {
    if (!byOther.has(l.otherId)) byOther.set(l.otherId, []);
    byOther.get(l.otherId)!.push(l);
  }
  const items = [...byOther.entries()].slice(0, 14);

  const mapGlyph = (m: MapType | null) => (m === 'domain' ? 'D' : m === 'ecosystem' ? 'E' : m === 'cognition' ? 'C' : '?');
  const mapLabel = (m: MapType | null) => (m === 'domain' ? '领域' : m === 'ecosystem' ? '生态' : m === 'cognition' ? '认知' : '未知');

  const go = (id: string, m: MapType | null) => {
    if (m) setActiveMap(m);
    setActiveNode(id, { openDrawer: true, map: (m || undefined) as MapType | undefined });
    navigate('/node/' + encodeURIComponent(id));
  };

  return (
    <div className="card p-3" data-testid="constellation">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="font-serif text-[14px]">三图联动 · X-Ray 透视</h2>
        <span className="text-[10.5px] text-muted">{links.length} 条关系</span>
      </div>

      {!isXRayActive && (
        <p className="mb-2 rounded-sm bg-[color:var(--surface-sunken)] px-2 py-1 text-[11px] leading-snug text-muted">
          X-Ray 动画已关闭（性能降级模式），以下为静态关联展示；点击顶部「X-Ray」可重新开启引力线。
        </p>
      )}

      {/* 中心节点（引力线的起点锚点） */}
      <div data-xray-id={activeNode.id}
        className="mb-2 rounded-sm border border-[color:var(--accent)] bg-[color:var(--accent-soft)] px-2.5 py-1.5">
        <div className="flex items-center gap-1.5 text-[10.5px] text-muted">
          <span className="font-mono">{activeNode.id}</span>
          <span aria-hidden="true">·</span>
          <span>{mapLabel(activeNode.map_type)}地图</span>
        </div>
        <div className="font-serif text-[13.5px] leading-snug text-[color:var(--accent-strong)]">{activeNode.title}</div>
      </div>

      {items.length === 0 ? (
        <p className="text-[12px] text-muted">该节点暂无登记关系。</p>
      ) : (
        <ul className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
          {items.map(([otherId, ls]) => {
            const other = nodeLookup.get(otherId) || null;
            const first = ls[0];
            const crossMap = other && other.map_type !== activeNode.map_type;
            return (
              <li key={otherId} data-xray-id={otherId}>
                <button onClick={() => go(otherId, other?.map_type ?? null)}
                  className="w-full rounded-sm border border-subtle px-2 py-1.5 text-left transition hover:border-[color:var(--accent)]">
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="text-muted">{first.direction === 'out' ? '→' : '←'}</span>
                    <span className="font-mono text-[color:var(--accent)]">
                      {ls.map((l) => l.relation.relation_type).slice(0, 2).join(' / ')}
                      {ls.length > 2 && ' +' + (ls.length - 2)}
                    </span>
                    {first.relation.coverage && <Tag tone="muted">{first.relation.coverage}</Tag>}
                    <span className="ml-auto flex items-center gap-1">
                      {crossMap && <span className="rounded-sm bg-[color:var(--ev-inferred-bg)] px-1 font-mono text-[9px] text-[color:var(--ev-inferred)]" title="跨图关联">{mapGlyph(other?.map_type ?? null)} 跨图</span>}
                      <EvidenceBadge status={first.relation.evidence_status} compact />
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-[12px] leading-snug text-[color:var(--text-primary)]">
                    {other?.title || first.otherTitle || otherId}
                  </div>
                  <div className="mt-0.5 line-clamp-2 text-[10.5px] leading-snug text-muted">{first.relation.description}</div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {links.length > items.length && (
        <p className="mt-2 text-[10.5px] text-muted">
          另有 {links.length - items.length} 条关系未在此显示，可在
          <button onClick={() => go(activeNode.id, activeNode.map_type)} className="mx-1 underline decoration-dotted hover:text-[color:var(--accent)]">节点详情页</button>
          查看完整列表。
        </p>
      )}
    </div>
  );
}