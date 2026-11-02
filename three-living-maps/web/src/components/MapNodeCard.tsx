// 带罗盘权重与状态感知的节点卡片（方案 §三.3）。
// · 证据徽章：四级状态 + 图形符号 + 文字标签（不只靠颜色）
// · 成长罗盘过滤：非当前路线节点平滑降透明/缩放/去色
import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMapStore } from '@/store/useMapStore';
import { EvidenceBadge, StaleFlag } from '@/lib/ui';
import type { CareerTrack, MapNode } from '@/lib/types';

const NODE_TYPE_LABEL: Record<string, string> = {
  task: '任务', problem: '问题', concept: '概念', approach: '技术路线', tool: '工具', model: '模型',
  resource: '资源', requirement: '培养要求', ability: '能力', course: '课程', pathway: '成长路线',
  participant: '参与者', org: '机构', company: '企业', lab: '实验室', community: '开源社区',
  conference: '学术会议', paper: '论文', dataset: '数据集', user: '使用者', cost: '成本项',
  method: '分析方法', habit: '成长习惯', case: '真实案例', revision: '认识修正', principle: '认识方法',
  benchmark: '评测基准'
};

export const nodeTypeLabel = (t: string) => NODE_TYPE_LABEL[t] || t;

/** 该节点是否属于当前成长罗盘路线（career_tracks 含 'all' 视为通用）。 */
export function matchesTrack(node: MapNode, track: CareerTrack): boolean {
  if (track === 'all') return true;
  const tr = node.career_tracks || [];
  return tr.includes('all') || tr.includes(track);
}

interface Props {
  node: MapNode;
  /** 是否为当前选中节点 */
  active?: boolean;
  /** 是否为 X-Ray 关联节点（高亮但不选中） */
  linked?: boolean;
  /** 关系标签（作为关联节点出现时显示） */
  relationLabel?: string;
  compact?: boolean;
  showTrackDim?: boolean;
  /** true = 点击直接跳到详情页（搜索结果等场景）；
   *  false = 就地打开抽屉并触发 X-Ray 联动（地图页，默认）。
   *  实测教训：地图页若点击即跳转，页面卸载后星群与引力线永远渲染不出来。 */
  navigateOnOpen?: boolean;
  onOpen?: (id: string) => void;
}

export const MapNodeCard = memo(function MapNodeCard({
  node, active = false, linked = false, relationLabel, compact = false, showTrackDim = true,
  navigateOnOpen = false, onOpen
}: Props) {
  const navigate = useNavigate();
  const careerTrack = useMapStore((s) => s.careerTrack);
  const setActiveNode = useMapStore((s) => s.setActiveNode);
  const inTrack = matchesTrack(node, careerTrack);
  const dimmed = showTrackDim && !inTrack;

  const open = () => {
    // 先更新全局状态（驱动星群与 X-Ray），再按需跳转
    setActiveNode(node.id, { openDrawer: true, map: node.map_type });
    onOpen?.(node.id);
    if (navigateOnOpen) navigate('/node/' + encodeURIComponent(node.id));
  };

  return (
    <article
      data-node-id={node.id}
      data-map={node.map_type}
      aria-current={active ? 'true' : undefined}
      onClick={open}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } }}
      role="button"
      tabIndex={0}
      className={[
        'group relative cursor-pointer rounded-md border p-3 text-left transition-[opacity,transform,filter,border-color,box-shadow] duration-200',
        'track-transition',
        dimmed ? 'track-dimmed' : 'track-focus',
        active
          ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] shadow-raised'
          : linked
            ? 'border-[color:var(--accent)]/50 bg-[color:var(--surface-raised)]'
            : 'border-subtle bg-[color:var(--surface-raised)] hover:border-strong hover:shadow-soft'
      ].join(' ')}
    >
      {/* 首行：类型点 + 标题 + 证据徽章 */}
      <div className="flex items-start gap-2">
        <span aria-hidden="true" className={`nt-dot nt-${node.node_type} mt-1.5`} />
        <h3 className={`min-w-0 flex-1 font-serif leading-snug ${compact ? 'text-[13.5px]' : 'text-[15px]'}`}>
          {node.title}
        </h3>
        <div className="flex flex-none flex-col items-end gap-1">
          <EvidenceBadge status={node.evidence_status} compact={compact} />
          {node.stale && <StaleFlag stale lastChecked={node.last_checked} />}
        </div>
      </div>

      {/* 次行：类型 / 关系 / 地图 */}
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
        <span className="font-mono opacity-70">{node.id}</span>
        <span className="text-[color:var(--border-strong)]" aria-hidden="true">·</span>
        <span>{nodeTypeLabel(node.node_type)}</span>
        {relationLabel && (
          <>
            <span className="text-[color:var(--border-strong)]" aria-hidden="true">·</span>
            <span className="font-mono text-[color:var(--accent)]">{relationLabel}</span>
          </>
        )}
        {!compact && node.participant_role && (
          <>
            <span className="text-[color:var(--border-strong)]" aria-hidden="true">·</span>
            <span>{node.participant_role}</span>
          </>
        )}
      </div>

      {/* 摘要 */}
      {!compact && (
        <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-secondary">{node.summary}</p>
      )}

      {/* 罗盘不属于该路线时的说明（保持可访问：文字说明而非仅视觉弱化）*/}
      {dimmed && !compact && (
        <p className="mt-2 rounded-sm bg-[color:var(--surface-sunken)] px-2 py-1 text-[11px] leading-snug text-muted">
          不属于当前「{careerTrack === 'scientist' ? 'AI 科学家' : careerTrack === 'engineer' ? 'AI 工程师' : 'AI 设计师'}」路线，已弱化显示；点击仍可查看。
        </p>
      )}

      {/* 局限提示 */}
      {!compact && (node.limit || node.limit_note) && (
        <p className="mt-2 border-l-2 border-[color:var(--ev-partial)] pl-2 text-[11.5px] leading-snug text-muted">
          <span className="font-medium text-[color:var(--ev-partial)]">边界：</span>
          {node.limit || node.limit_note}
        </p>
      )}
    </article>
  );
});
