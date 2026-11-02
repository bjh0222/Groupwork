// 地图页：三张地图的统一容器。
// · 顶部说明 + 筛选（类型/证据/成长罗盘）
// · 节点按板块分组渲染，选中节点时通过 X-Ray 覆盖层画出跨图引力线
// · 跨图联动：选中节点后，侧栏列出它在其他两张地图中的关联
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { useMapStore } from '@/store/useMapStore';
import { MapNodeCard, matchesTrack, nodeTypeLabel } from '@/components/MapNodeCard';
import { XRayOverlay, type XRayLink } from '@/components/XRayOverlay';
import { XRayConstellation } from '@/components/XRayConstellation';
import { EmptyState, ErrorState, Loading, Tag } from '@/lib/ui';
import { COG_SECTION_LABELS, ECO_CHAIN_LABELS, SECTION_LABELS } from '@/lib/types';
import type { MapNode, MapType } from '@/lib/types';

const MAP_TITLE: Record<MapType, { t: string; sub: string }> = {
  domain: { t: '领域地图', sub: '以中枢任务「基于课程资料的知识问答」辐射六大板块：问题与任务、概念与原理、方法与技术路线、软件与模型、数据与实践资源、课程与学习路径。' },
  ecosystem: { t: '生态地图', sub: '以「参与者 × 关系链」组织：主线 A 从论文到本组应用，辅线 B 谁承担成本，并选取与主线直接相关的少量其他观察维度。' },
  cognition: { t: '认知地图', sub: '认识方法、分析方法、真实案例、成长习惯与认识修正；真实案例来自本项目实际执行记录，个人经历由成员补录，不虚构。' }
};

export function MapPage() {
  const { map } = useParams();
  const mapType = (['domain', 'ecosystem', 'cognition'].includes(map || '') ? map : 'domain') as MapType;
  const containerRef = useRef<HTMLDivElement | null>(null);

  const setActiveMap = useMapStore((s) => s.setActiveMap);
  const activeNodeId = useMapStore((s) => s.activeNodeId);
  const careerTrack = useMapStore((s) => s.careerTrack);
  const isXRayActive = useMapStore((s) => s.isXRayActive);

  // 全局节点索引：跨图关联的对端节点不在本页 nodes 中，需要单独取标题与所属地图
  const [allNodesById, setAllNodesById] = useState<Map<string, MapNode>>(new Map());
  useEffect(() => {
    let cancelled = false;
    api.nodes({}).then((r) => {
      if (!cancelled) setAllNodesById(new Map(r.nodes.map((n) => [n.id, n])));
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [evFilter, setEvFilter] = useState<string>('all');
  const [onlyTrack, setOnlyTrack] = useState(false);

  useEffect(() => { setActiveMap(mapType); }, [mapType, setActiveMap]);

  const { data, loading, error, retry } = useAsync(
    () => Promise.all([api.graph(mapType), api.relations({})]),
    [mapType]
  );

  const nodes = data?.[0].nodes || [];
  const allRels = data?.[1].relations || [];

  // 当前地图内的关系（两端都在本图，或至少一端在本图）用于图内连线
  const nodeIds = useMemo(() => new Set(nodes.map((n) => n.id)), [nodes]);

  // 类型筛选项
  const types = useMemo(() => {
    const s = new Map<string, number>();
    for (const n of nodes) s.set(n.node_type, (s.get(n.node_type) || 0) + 1);
    return [...s.entries()].sort((a, b) => b[1] - a[1]);
  }, [nodes]);

  const filtered = useMemo(() => nodes.filter((n) => {
    if (typeFilter !== 'all' && n.node_type !== typeFilter) return false;
    if (evFilter !== 'all' && n.evidence_status !== evFilter) return false;
    if (onlyTrack && !matchesTrack(n, careerTrack)) return false;
    return true;
  }), [nodes, typeFilter, evFilter, onlyTrack, careerTrack]);

  // 分组
  const groups = useMemo(() => {
    const labels = mapType === 'domain' ? SECTION_LABELS : mapType === 'ecosystem' ? ECO_CHAIN_LABELS : COG_SECTION_LABELS;
    const g = new Map<string, MapNode[]>();
    for (const n of filtered) {
      // 生态地图按 chain（main_a/side_b/dim_c）分组，领域按 section（A-F），认知按 section（1-6）
      const key = mapType === 'ecosystem' ? (n.chain || 'main_a') : (n.section || '1');
      if (!g.has(key)) g.set(key, []);
      g.get(key)!.push(n);
    }
    const order = Object.keys(labels);
    return [...g.entries()].sort((a, b) => {
      const ia = order.indexOf(a[0]); const ib = order.indexOf(b[0]);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    }).map(([k, arr]) => ({ key: k, label: labels[k] || k, nodes: arr }));
  }, [filtered, mapType]);

  // 选中节点的跨图关联（用于 X-Ray 连线 + 侧栏）
  const activeNode = nodes.find((n) => n.id === activeNodeId) || allNodesById.get(activeNodeId || '') || null;
  const xrayLinks = useMemo<XRayLink[]>(() => {
    if (!activeNodeId) return [];
    return allRels
      .filter((r) => r.source_node_id === activeNodeId || r.target_node_id === activeNodeId)
      .map((r): XRayLink | null => {
        const isOut = r.source_node_id === activeNodeId;
        const otherId = isOut ? r.target_node_id : r.source_node_id;
        // 对端可能属于其他地图：标题从全局索引取（跨图节点不在本页 nodes 中）
        const other = nodes.find((n) => n.id === otherId) || allNodesById.get(otherId) || null;
        return {
          relation: r, otherId,
          otherTitle: other?.title || otherId,
          otherMap: (other?.map_type || mapType) as MapType,
          direction: isOut ? 'out' : 'in'
        };
      })
      .filter((x): x is XRayLink => !!x);
  }, [activeNodeId, allRels, nodes, allNodesById, mapType]);

  const meta = MAP_TITLE[mapType];

  return (
    <div ref={containerRef} className="mx-auto max-w-[1400px] px-3 py-5 sm:px-5">
      {/* 地图说明 */}
      <header className="mb-4">
        <h1 className="font-serif text-[22px] sm:text-[26px]">{meta.t}</h1>
        <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-secondary">{meta.sub}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11.5px] text-muted">
          <Tag>{nodes.length} 个节点</Tag>
          <Tag>{allRels.filter((r) => nodeIds.has(r.source_node_id) || nodeIds.has(r.target_node_id)).length} 条相关关系</Tag>
          {careerTrack !== 'all' && <Tag tone="accent">成长罗盘：{careerTrack === 'scientist' ? 'AI 科学家' : careerTrack === 'engineer' ? 'AI 工程师' : 'AI 设计师'}</Tag>}
          <Tag tone="muted">X-Ray {isXRayActive ? '开' : '关'}</Tag>
        </div>
      </header>

      {/* 筛选栏 */}
      <div className="card mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 p-2.5 text-[12px]">
        <div className="flex items-center gap-1.5">
          <label htmlFor="f-type" className="text-muted">类型</label>
          <select id="f-type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-sm border border-strong bg-[color:var(--surface-raised)] px-2 py-1 text-[12px]">
            <option value="all">全部</option>
            {types.map(([t, c]) => <option key={t} value={t}>{nodeTypeLabel(t)}（{c}）</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <label htmlFor="f-ev" className="text-muted">证据状态</label>
          <select id="f-ev" value={evFilter} onChange={(e) => setEvFilter(e.target.value)}
            className="rounded-sm border border-strong bg-[color:var(--surface-raised)] px-2 py-1 text-[12px]">
            <option value="all">全部</option>
            <option value="已核实">已核实</option>
            <option value="部分核实">部分核实</option>
            <option value="推断">推断</option>
            <option value="待核实">待核实</option>
          </select>
        </div>
        <label className="flex cursor-pointer items-center gap-1.5 text-secondary">
          <input type="checkbox" checked={onlyTrack} onChange={(e) => setOnlyTrack(e.target.checked)} className="accent-[color:var(--accent)]" />
          只看当前成长路线
        </label>
        <span className="ml-auto text-[11px] text-muted">显示 {filtered.length} / {nodes.length}</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        {/* 主区：分组节点 */}
        <div>
          {loading && <Loading label="正在加载地图…" />}
          {error && <ErrorState message={error} onRetry={retry} />}
          {!loading && !error && filtered.length === 0 && (
            <EmptyState title="没有符合条件的节点" hint="试试放宽筛选条件，或切换成长罗盘。" />
          )}
          <div className="space-y-6">
            {groups.map((g) => (
              <section key={g.key}>
                <h2 className="mb-2 flex items-baseline gap-2 border-b border-subtle pb-1 font-serif text-[15px]">
                  {g.label}
                  <span className="text-[11px] font-normal text-muted">{g.nodes.length}</span>
                </h2>
                <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-2">
                  {g.nodes.map((n) => (
                    <MapNodeCard key={n.id} node={n}
                      active={n.id === activeNodeId}
                      linked={xrayLinks.some((l) => l.otherId === n.id)} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        {/* 侧栏：选中节点的三图联动（X-Ray 星群 + 图例） */}
        <aside className="lg:sticky lg:top-[104px] lg:self-start">
          <XRayConstellation activeNode={activeNode} links={xrayLinks} nodeLookup={allNodesById} />

          {/* 图例 */}
          <div className="card mt-3 p-3 text-[11.5px]">
            <h3 className="mb-1.5 font-serif text-[13px]">证据状态图例</h3>
            <ul className="space-y-1 text-muted">
              <li><span className="mr-1 font-mono text-[color:var(--ev-verified)]">✓</span>已核实：一手来源直接支持</li>
              <li><span className="mr-1 font-mono text-[color:var(--ev-partial)]">◐</span>部分核实：仅部分结论获支持</li>
              <li><span className="mr-1 font-mono text-[color:var(--ev-inferred)]">→</span>推断：附推理链</li>
              <li><span className="mr-1 font-mono text-[color:var(--ev-unverified)]">?</span>待核实：证据不足</li>
            </ul>
            <p className="mt-2 border-t border-subtle pt-1.5 text-[11px] text-muted">
              状态同时用符号与文字标注，不单靠颜色区分。
            </p>
          </div>
        </aside>
      </div>

      {/* X-Ray 覆盖层：仅在开启且有选中节点时渲染 */}
      <XRayOverlay links={xrayLinks} containerRef={containerRef} />
    </div>
  );
}