// X-Ray 联动透视与引力线（方案 §三.2）。
// 实现要点：
// 1) 全屏透明 SVG 覆盖层，pointer-events 仅落在连线与标签上，不遮挡卡片点击；
// 2) 连线坐标来自真实 DOM 测量（data-node-id 元素的 getBoundingClientRect），
//    而非估算布局——这样在任意图表/列表/详情布局下都能准确连线；
// 3) 测量用 requestAnimationFrame + ResizeObserver 触发，并用 transform 而非重排，保证单帧内完成；
// 4) 渐变光效 linearGradient + 流动虚线 + 中点关系标签（悬停显示描述与来源）；
// 5) isXRayActive=false 时完全不渲染（性能降级开关），改由侧边栏静态展示关联。
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useMapStore } from '@/store/useMapStore';
import type { MapType, Relation } from '@/lib/types';

export interface XRayLink {
  relation: Relation;
  /** 对端节点 id */
  otherId: string;
  otherTitle: string;
  otherMap: MapType | null;
  /** 方向：out = 当前节点指向对端 */
  direction: 'in' | 'out';
}

interface Pt { x: number; y: number }

export function XRayOverlay({ links, containerRef }: { links: XRayLink[]; containerRef?: React.RefObject<HTMLElement | null> }) {
  const activeNodeId = useMapStore((s) => s.activeNodeId);
  const isXRayActive = useMapStore((s) => s.isXRayActive);
  const activeMap = useMapStore((s) => s.activeMap);
  const [pts, setPts] = useState<Map<string, Pt>>(new Map());
  const [hovered, setHovered] = useState<string | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const rafRef = useRef<number | null>(null);

  /**
   * 测量连线锚点的视口中心坐标。
   * 锚点有两类，data-xray-id 优先于 data-node-id：
   *  · data-xray-id —— X-Ray 星群面板中的中心节点与关联 chip（始终在视口内，保证线一定画得出来）；
   *  · data-node-id —— 地图页/详情页的节点卡片（可能滚动出视口）。
   * 实测教训：只用 data-node-id 时，长列表中选中节点的关联节点常在视口外，
   * 端点过滤后连线数为 0，导致核心亮点功能形同未实现。
   */
  const measure = useCallback(() => {
    const scope = containerRef?.current ?? document;
    const next = new Map<string, Pt>();
    // 先收地图卡片
    for (const el of scope.querySelectorAll<HTMLElement>('[data-node-id]')) {
      const id = el.dataset.nodeId;
      if (!id) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      next.set(id, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
    }
    // 再用星群锚点覆盖（优先）
    for (const el of document.querySelectorAll<HTMLElement>('[data-xray-id]')) {
      const id = el.dataset.xrayId;
      if (!id) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      next.set(id, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
    }
    setPts(next);
    setSize({ w: window.innerWidth, h: window.innerHeight });
  }, [containerRef]);

  // 首次布局后立即测量（useLayoutEffect 避免闪烁），随后在滚动/尺寸变化时更新
  useLayoutEffect(() => { if (activeNodeId && isXRayActive) measure(); }, [activeNodeId, isXRayActive, measure]);

  useEffect(() => {
    if (!isXRayActive || !activeNodeId) return;
    let ticking = false;
    const schedule = () => {
      if (ticking) return;
      ticking = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => { ticking = false; measure(); });
    };
    schedule();
    const ro = new ResizeObserver(schedule);
    ro.observe(document.body);
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('scroll', schedule, { passive: true, capture: true });
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isXRayActive, activeNodeId, measure, activeMap, links.length]);

  // 只保留两端都在视口内、可测量的连线
  const drawn = useMemo(() => {
    if (!isXRayActive || !activeNodeId) return [];
    const center = pts.get(activeNodeId);
    if (!center) return [];
    const out: { link: XRayLink; from: Pt; to: Pt; mid: Pt }[] = [];
    for (const l of links) {
      const to = pts.get(l.otherId);
      if (!to) continue;
      // 视口外（含滚动出屏）的端点跳过，避免画出无意义的长直线
      if (to.y < -200 || to.y > size.h + 200 || to.x < -200 || to.x > size.w + 200) continue;
      out.push({ link: l, from: center, to, mid: { x: (center.x + to.x) / 2, y: (center.y + to.y) / 2 } });
    }
    return out;
  }, [isXRayActive, activeNodeId, pts, links, size]);

  if (!isXRayActive || !activeNodeId || drawn.length === 0) return null;

  const gid = 'xray-grad-' + activeNodeId.replace(/[^a-zA-Z0-9]/g, '');

  return (
    <svg
      className="pointer-events-none fixed inset-0 z-30"
      width={size.w || '100%'} height={size.h || '100%'}
      viewBox={`0 0 ${size.w} ${size.h}`}
      aria-hidden="true"
      data-testid="xray-overlay"
    >
      <defs>
        <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--xray-from)" />
          <stop offset="100%" stopColor="var(--xray-to)" />
        </linearGradient>
        <filter id={gid + '-glow'} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.6" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {drawn.map(({ link, from, to, mid }) => {
        const key = link.relation.id;
        const isHover = hovered === key;
        // 用二次贝塞尔做出弧度，避免多条线重叠成一条
        const dx = to.x - from.x, dy = to.y - from.y;
        const dist = Math.hypot(dx, dy) || 1;
        const bow = Math.min(70, dist * 0.16);
        const nx = -dy / dist, ny = dx / dist;
        const cx = mid.x + nx * bow, cy = mid.y + ny * bow;
        const path = `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;
        return (
          <g key={key} className="xray-pulse">
            <path d={path} fill="none" stroke={`url(#${gid})`} strokeWidth={isHover ? 2.6 : 1.5}
              strokeOpacity={isHover ? 0.95 : 0.62} filter={`url(#${gid}-glow)`} strokeLinecap="round" />
            <path d={path} fill="none" stroke="var(--xray-from)" strokeWidth={1}
              strokeOpacity={0.5} strokeDasharray="5 9" className="xray-line" />
            <circle cx={to.x} cy={to.y} r={isHover ? 5 : 3.4} fill="var(--xray-to)" opacity={0.85} />
            {/* 关系标签：可交互（悬停查看描述与来源） */}
            <g className="pointer-events-auto" onMouseEnter={() => setHovered(key)} onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'help' }}>
              <rect x={cx - 44} y={cy - 11} width={88} height={22} rx={3}
                fill="var(--surface-raised)" stroke="var(--border-strong)" strokeWidth={0.8} opacity={0.96} />
              <text x={cx} y={cy + 4} textAnchor="middle" fontSize={11}
                fontFamily="var(--font-mono)" fill="var(--text-primary)">
                {(link.relation.relation_type || '').slice(0, 14)}
              </text>
              {isHover && (
                <foreignObject x={cx - 150} y={cy + 14} width={300} height={120} style={{ overflow: 'visible' }}>
                  <div className="rounded-md border border-strong bg-[color:var(--surface-raised)] p-2 text-[11.5px] leading-snug shadow-raised">
                    <div className="mb-1 font-mono text-[10px] text-muted">
                      {link.direction === 'out' ? '→ ' : '← '}{link.relation.relation_type}
                      {link.relation.coverage ? ' · ' + link.relation.coverage : ''}
                    </div>
                    <div className="text-secondary">{link.relation.description}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(link.relation.source_ids || []).map((s) => (
                        <span key={s} className="rounded-sm border border-subtle px-1 font-mono text-[10px] text-muted">{s}</span>
                      ))}
                      <span className="rounded-sm border border-subtle px-1 text-[10px] text-muted">
                        {link.relation.evidence_status}
                      </span>
                    </div>
                  </div>
                </foreignObject>
              )}
            </g>
          </g>
        );
      })}
    </svg>
  );
}
