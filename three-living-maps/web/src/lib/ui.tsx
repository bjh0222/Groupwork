// 共享 UI 原语：证据徽章、状态标签、空/错/加载态。
// 无障碍要求（方案 §2.2）：状态不得仅靠颜色区分，必须同时有文字标签与形状/图标差异。
import { type ReactNode } from 'react';
import type { EvidenceStatus, KnowledgeStatus } from './types';

// ---------- 证据徽章 ----------
const EV_STYLE: Record<EvidenceStatus, { cls: string; glyph: string; label: string; title: string }> = {
  '已核实': { cls: 'ev-verified', glyph: '✓', label: '已核实', title: '一手来源直接支持该结论，且信息与当前状态相符' },
  '部分核实': { cls: 'ev-partial', glyph: '◐', label: '部分核实', title: '只有部分结论获得支持，或来源存在时间/范围限制' },
  '推断': { cls: 'ev-inferred', glyph: '→', label: '推断', title: '基于已知事实形成的推理，附有推理链' },
  '待核实': { cls: 'ev-unverified', glyph: '?', label: '待核实', title: '尚未找到足够可靠证据' }
};

export function EvidenceBadge({ status, compact = false, className = '' }:
  { status: EvidenceStatus | string; compact?: boolean; className?: string }) {
  const s = EV_STYLE[status as EvidenceStatus] ?? EV_STYLE['待核实'];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[11px] leading-none font-medium ${s.cls} ${className}`}
      title={s.title}
      aria-label={'证据状态：' + s.label}
    >
      <span aria-hidden="true" className="font-mono">{s.glyph}</span>
      {!compact && <span>{s.label}</span>}
    </span>
  );
}

// ---------- 理解程度（knowledge_status）----------
const KS_STYLE: Record<KnowledgeStatus, { cls: string; label: string }> = {
  '未评估': { cls: 'ks-none', label: '未评估' },
  '已初步理解': { cls: 'ks-low', label: '已初步理解' },
  '已经尝试': { cls: 'ks-mid', label: '已经尝试' },
  '待深入学习': { cls: 'ks-todo', label: '待深入学习' }
};

export function KnowledgeBadge({ status, className = '' }: { status: KnowledgeStatus | string; className?: string }) {
  const s = KS_STYLE[status as KnowledgeStatus] ?? KS_STYLE['未评估'];
  return (
    <span className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[11px] leading-none ${s.cls} ${className}`}
      title="理解程度只能来自真实学习者反馈或经授权的人工记录；无数据时显示未评估">
      <span aria-hidden="true" className="mr-1 font-mono">◍</span>{s.label}
    </span>
  );
}

// ---------- 通用标签 ----------
export function Tag({ children, tone = 'neutral', title }: { children: ReactNode; tone?: 'neutral' | 'accent' | 'muted'; title?: string }) {
  const tones = {
    neutral: 'border-subtle text-secondary',
    accent: 'accent-soft border-transparent text-[color:var(--accent-strong)]',
    muted: 'border-subtle text-muted'
  } as const;
  return (
    <span title={title} className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[11px] leading-tight ${tones[tone]}`}>
      {children}
    </span>
  );
}

// ---------- 快变量过期提示 ----------
export function StaleFlag({ stale, lastChecked }: { stale?: boolean; lastChecked?: string }) {
  if (!stale) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[11px] leading-none ev-partial"
      title={'该节点属快变量（价格/版本/功能等），上次核查 ' + (lastChecked || '未知') + '，已超过 4 周未复核'}>
      <span aria-hidden="true" className="font-mono">⚠</span>信息可能过期
    </span>
  );
}

// ---------- 状态容器 ----------
export function Loading({ label = '正在加载…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-muted" role="status" aria-live="polite">
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry, hint }: { message: string; onRetry?: () => void; hint?: string }) {
  return (
    <div className="card mx-auto max-w-lg p-6 text-center" role="alert">
      <div className="mb-2 font-serif text-lg">加载失败</div>
      <p className="mb-1 text-sm text-secondary">{message}</p>
      {hint && <p className="mb-4 text-xs text-muted">{hint}</p>}
      {onRetry && (
        <button onClick={onRetry}
          className="mt-3 rounded-sm border border-strong px-4 py-1.5 text-sm transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]">
          重试
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-strong px-6 py-14 text-center">
      <div className="mb-2 font-serif text-base text-secondary">{title}</div>
      {hint && <div className="max-w-md text-sm text-muted">{hint}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ---------- 外链（安全：noopener noreferrer）----------
export function ExternalLink({ href, children, className = '' }: { href: string; children: ReactNode; className?: string }) {
  const isFile = href.startsWith('file:');
  return (
    <a href={href} target={isFile ? undefined : '_blank'} rel={isFile ? undefined : 'noopener noreferrer'}
      className={`inline-flex items-center gap-1 break-all ${className}`}
      title={isFile ? '本地项目文件（不可点击打开）' : href}>
      {children}
      {!isFile && <span aria-hidden="true" className="text-[10px] opacity-60">↗</span>}
    </a>
  );
}

// ---------- 行内富文本：只解析 **加粗** 与 `代码` ----------
// 安全设计：不使用 dangerouslySetInnerHTML。React 默认会对文本节点转义，
// 我们只把 **...** 与 `...` 拆成 <strong>/<code> 元素，其余内容仍按纯文本渲染，
// 因此模型输出中的 <script> 等标签不会被执行（已有 E2E XSS 回归测试覆盖整体转义）。
const RICH_RE = /\*\*([^*\n]+)\*\*|`([^`\n]+)`/g;
export function RichText({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  const src = text || '';
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  RICH_RE.lastIndex = 0;
  while ((m = RICH_RE.exec(src))) {
    if (m.index > last) parts.push(src.slice(last, m.index));
    if (m[1] !== undefined) parts.push(<strong key={'b' + key++} className="font-semibold">{m[1]}</strong>);
    else parts.push(<code key={'c' + key++} className="rounded-sm bg-[color:var(--surface-sunken)] px-1 font-mono text-[0.92em]">{m[2]}</code>);
    last = m.index + m[0].length;
  }
  if (last < src.length) parts.push(src.slice(last));
  return <>{parts}</>;
}