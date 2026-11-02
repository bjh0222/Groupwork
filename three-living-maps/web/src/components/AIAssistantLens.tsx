// AI 概念助手的可视化引力线与边界保护（方案 §三.4）。
// · 回答中的图谱概念渲染为可点击胶囊；点击后拉出「证据引力线」并展开来源与核查日期
// · 超出地图边界或证据不足时呈现「知识边界雾化」提示，绝不伪造地图结论
// · 无密钥时显示降级说明（非生成式检索直出），不谎称模型已回答
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, api } from '@/lib/api';
import { useMapStore } from '@/store/useMapStore';
import { EvidenceBadge, EmptyState, ExternalLink, Tag, RichText } from '@/lib/ui';
import type { AiAnswer, MapNode, Source } from '@/lib/types';

interface Capsule { text: string; nodeId: string }

/** 从回答文本解析可点击胶囊。只认回答里真实出现、且在本次检索上下文内的节点 ID，
 *  这是引用校验的第二道前端防线（服务端已校验一次）。 */
function parseCapsules(answer: string, nodeIds: string[], nodeMap: Map<string, MapNode>): Capsule[] {
  const out: Capsule[] = [];
  const seen = new Set<string>();
  for (const id of nodeIds) {
    if (seen.has(id)) continue;
    if (!answer.includes(id)) continue;
    const n = nodeMap.get(id);
    if (n) { out.push({ text: n.title, nodeId: id }); seen.add(id); }
  }
  return out;
}

export function AIAssistantLens() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [res, setRes] = useState<AiAnswer | null>(null);
  const [maxLen, setMaxLen] = useState(500);
  const [aiEnabled, setAiEnabled] = useState<boolean | null>(null);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const [pinnedSources, setPinnedSources] = useState<Source[]>([]);
  const [pinnedNode, setPinnedNode] = useState<MapNode | null>(null);
  const [loadingPinned, setLoadingPinned] = useState(false);
  const [history, setHistory] = useState<{ q: string }[]>([]);
  const [nodeMap, setNodeMap] = useState<Map<string, MapNode>>(new Map());
  const lensRef = useRef<HTMLDivElement | null>(null);
  const setActiveNode = useMapStore((s) => s.setActiveNode);

  useEffect(() => {
    api.aiStatus().then((s) => { setAiEnabled(s.enabled); setAiNote(s.note); }).catch(() => setAiEnabled(false));
    api.meta().then((m) => setMaxLen(m.max_question_len || 500)).catch(() => undefined);
    api.nodes({}).then((r) => setNodeMap(new Map(r.nodes.map((n) => [n.id, n])))).catch(() => undefined);
  }, []);

  const submit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = question.trim();
    if (!q) return;
    if (q.length > maxLen) { setErr('问题过长（上限 ' + maxLen + ' 字），请精简后重试。'); return; }
    setBusy(true); setErr(null); setPinned(null); setPinnedSources([]); setPinnedNode(null);
    try {
      const r = await api.ask(q);
      setRes(r);
      setHistory((h) => [{ q }, ...h].slice(0, 6));
    } catch (e2) {
      const ae = e2 as ApiError;
      setErr(ae.message + (ae.status === 429 ? '（接口限流，请稍后再试）' : ''));
      setRes(null);
    } finally { setBusy(false); }
  }, [question, maxLen]);

  const capsules = useMemo(() => {
    if (!res?.answer) return [];
    return parseCapsules(res.answer, res.context?.node_ids || [], nodeMap);
  }, [res, nodeMap]);

  /** 点击胶囊：拉出证据引力线 + 展开原始来源与核查日期 */
  const openCapsule = useCallback(async (nodeId: string) => {
    setPinned(nodeId);
    setLoadingPinned(true);
    setActiveNode(nodeId, { openDrawer: true });
    try {
      const d = await api.node(nodeId);
      setPinnedSources(d.sources || []);
      setPinnedNode(d.node);
    } catch { setPinnedSources([]); setPinnedNode(null); }
    finally { setLoadingPinned(false); }
    requestAnimationFrame(() => {
      const el = document.querySelector('[data-node-id="' + nodeId + '"]');
      if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }, [setActiveNode]);

  const outOfScope = res?.status === 'out_of_scope' || res?.out_of_scope === true;
  const degraded = res?.status === 'degraded';
  const truncated = res?.status === 'truncated';
  const noEvidence = res?.status === 'no_evidence';
  const boundary = outOfScope || noEvidence || truncated;

  return (
    <div ref={lensRef} className="space-y-4" data-testid="ai-assistant">
      <form onSubmit={submit} className="card p-3">
        <label htmlFor="ai-q" className="mb-2 block text-xs font-medium text-secondary">
          向地图提问（只依据已核实的课程资料作答）
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="ai-q" name="ai-q" type="text" value={question}
            onChange={(e) => setQuestion(e.target.value)} maxLength={maxLen}
            placeholder="例如：什么是 RAG？本项目为什么选它作为主路线？"
            className="min-w-0 flex-1 rounded-sm border border-strong bg-[color:var(--surface-raised)] px-3 py-2 text-sm outline-none transition focus:border-[color:var(--accent)]"
            aria-describedby="ai-hint" disabled={busy}
          />
          <button type="submit" data-testid="ai-submit" disabled={busy || !question.trim()}
            className="flex-none rounded-sm bg-[color:var(--accent)] px-4 py-2 text-sm font-medium text-[color:var(--text-on-accent)] transition hover:bg-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-45">
            {busy ? '检索并生成中…' : '提问'}
          </button>
        </div>
        <p id="ai-hint" className="mt-2 text-[11px] leading-snug text-muted">
          {question.length}/{maxLen} 字 · 每 IP 限流 ·
          {aiEnabled === false
            ? ' 当前未配置模型密钥，以「非生成式检索直出」作答（不调用模型）'
            : ' 回答仅依据地图内已核实内容，无依据时明确说明缺口'}
        </p>
        {aiNote && aiEnabled === false && (
          <p className="mt-2 rounded-sm bg-[color:var(--surface-sunken)] px-2 py-1.5 text-[11.5px] leading-snug text-secondary">
            <span className="font-medium">降级模式：</span>{aiNote}
          </p>
        )}
      </form>

      {!res && !busy && (
        <div className="flex flex-wrap gap-2">
          {['什么是 RAG？', '毕业要求 3 列出了哪些核心方法？', 'GLM-4.7-Flash 的官方定价是多少？',
            '为什么本项目不用 LangChain？'].map((s) => (
            <button key={s} onClick={() => setQuestion(s)}
              className="rounded-full border border-subtle px-3 py-1 text-[12px] text-secondary transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]">
              {s}
            </button>
          ))}
        </div>
      )}

      {err && (
        <div role="alert" data-testid="ai-error" className="card border-[color:var(--ev-partial)] p-3 text-sm text-secondary">
          <span className="font-medium text-[color:var(--ev-partial)]">请求失败：</span>{err}
        </div>
      )}

      {busy && (
        <div data-testid="ai-busy" className="card flex items-center gap-3 p-4 text-sm text-muted" role="status" aria-live="polite">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
          正在检索地图并生成回答，可能需要十几秒…
        </div>
      )}
      {res && !busy && (
        <div className="card overflow-hidden" data-testid="ai-result">
          <div className="flex flex-wrap items-center gap-2 border-b border-subtle bg-[color:var(--surface-sunken)] px-3 py-2 text-[11.5px]">
            <span className="font-medium text-secondary">
              {outOfScope ? '超出地图边界' : noEvidence ? '资料未覆盖' : truncated ? '生成被截断'
                : degraded ? '降级模式（检索直出）' : 'AI 回答'}
            </span>
            <span className="text-muted" aria-hidden="true">·</span>
            <span className="text-muted">证据状态：{res.evidence || '未知'}</span>
            {res.model && <Tag tone="muted">{res.model}</Tag>}
            {res.latency_ms ? <Tag tone="muted">{(res.latency_ms / 1000).toFixed(1)}s</Tag> : null}
            {res.context && <Tag tone="muted">命中 {res.context.total_hits} 条</Tag>}
            {res.context && typeof res.context.confidence === 'number' && (
              <Tag tone="muted">置信度 {res.context.confidence.toFixed(2)}</Tag>
            )}
            {res.context && typeof res.context.lexical_overlap === 'number' && (
              <Tag tone="muted">词汇重叠 {res.context.lexical_overlap.toFixed(2)}</Tag>
            )}
          </div>

          {/* 知识边界雾化：越界 / 无证据 / 截断 */}
          {boundary && (
            <div className="fog-panel border-b border-subtle bg-[color:var(--ev-unverified-bg)] px-4 py-3" data-testid="boundary-fog">
              <div className="mb-1 flex items-center gap-2 font-serif text-sm text-secondary">
                <span aria-hidden="true">◌</span>
                {outOfScope ? '这个问题在地图之外' : truncated ? '模型未能产出正文' : '课程资料未覆盖这个问题'}
              </div>
              <p className="whitespace-pre-line text-[13px] leading-relaxed text-secondary">
                {res.answer || res.message}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => navigate('/feedback')}
                  className="rounded-sm border border-strong px-3 py-1 text-[12px] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]">
                  提交反馈 / 补充来源
                </button>
                <button onClick={() => navigate('/maps/domain')}
                  className="rounded-sm border border-strong px-3 py-1 text-[12px] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]">
                  浏览领域地图
                </button>
              </div>
              <p className="mt-2 text-[11px] text-muted">
                本站不会为了「看起来回答了」而编造地图之外的结论。
              </p>
            </div>
          )}

          {/* 正文 */}
          {res.answer && !boundary && (
            <div className="px-4 py-3">
              <div className="whitespace-pre-line text-[14px] leading-[1.85] text-[color:var(--text-primary)]">
                <RichText text={res.answer} />
              </div>
              {res.warning && (
                <p className="mt-3 rounded-sm bg-[color:var(--ev-partial-bg)] px-2 py-1.5 text-[11.5px] text-[color:var(--ev-partial)]">
                  ⚠ {res.warning}
                </p>
              )}
            </div>
          )}

          {/* 概念胶囊 */}
          {capsules.length > 0 && (
            <div className="border-t border-subtle px-4 py-3">
              <div className="mb-2 text-[11px] font-medium text-muted">
                回答引用的图谱概念（点击查看证据引力线与来源）
              </div>
              <div className="flex flex-wrap gap-2">
                {capsules.map((c) => (
                  <button key={c.nodeId} onClick={() => openCapsule(c.nodeId)}
                    aria-pressed={pinned === c.nodeId} data-capsule={c.nodeId}
                    className={
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] transition ' +
                      (pinned === c.nodeId
                        ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]'
                        : 'border-strong text-secondary hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]')
                    }>
                    <span aria-hidden="true" className="font-mono text-[10px] opacity-60">{c.nodeId}</span>
                    {c.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 证据引力线抽屉 */}
          {pinned && (
            <div className="border-t-2 border-[color:var(--accent)] bg-[color:var(--accent-soft)] px-4 py-3" data-testid="evidence-drawer">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="font-serif text-sm text-[color:var(--accent-strong)]">
                  证据引力线 · {(pinnedNode || nodeMap.get(pinned))?.title || pinned}
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => navigate('/node/' + encodeURIComponent(pinned))}
                    className="text-[12px] underline decoration-dotted">打开节点详情</button>
                  <button onClick={() => { setPinned(null); setPinnedSources([]); setPinnedNode(null); }}
                    className="text-[12px] text-muted hover:text-[color:var(--text-primary)]" aria-label="关闭证据抽屉">✕</button>
                </div>
              </div>

              {pinnedNode && (
                <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px]">
                  <EvidenceBadge status={pinnedNode.evidence_status} />
                  <span className="text-muted">核查日期：{pinnedNode.last_checked}</span>
                  {pinnedNode.stale && <span className="text-[color:var(--ev-partial)]">⚠ 信息可能过期</span>}
                  {pinnedNode.evidence_note && <span className="text-muted">· {pinnedNode.evidence_note}</span>}
                </div>
              )}

              {loadingPinned ? (
                <p className="text-[12px] text-muted">正在加载来源…</p>
              ) : pinnedSources.length === 0 ? (
                <p className="text-[12px] text-secondary">
                  该节点未登记外部来源（属项目自定义分析框架，或来源待补）。
                </p>
              ) : (
                <ul className="space-y-2">
                  {pinnedSources.map((s) => (
                    <li key={s.id} className="rounded-sm border border-subtle bg-[color:var(--surface-raised)] p-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] text-muted">{s.id}</span>
                        <span className="text-[13px] font-medium">{s.title}</span>
                        <Tag tone="muted">{s.source_type}</Tag>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
                        {s.publisher && <span>发布：{s.publisher}</span>}
                        {s.author && <span>作者：{s.author}</span>}
                        {s.published_at && <span>发布日：{s.published_at}</span>}
                        <span>访问日：{s.accessed_at}</span>
                      </div>
                      {s.url && (
                        <div className="mt-1 text-[11.5px]">
                          <ExternalLink href={s.url} className="text-[color:var(--accent)]">{s.url}</ExternalLink>
                        </div>
                      )}
                      {s.supports && s.supports.length > 0 && (
                        <ul className="mt-1.5 space-y-0.5 border-l-2 border-[color:var(--border-strong)] pl-2 text-[11.5px] leading-snug text-secondary">
                          {s.supports.slice(0, 4).map((sp, i) => <li key={i}>· {sp}</li>)}
                        </ul>
                      )}
                      {s.notes && <p className="mt-1.5 text-[11px] leading-snug text-muted">{s.notes}</p>}
                    </li>
                  ))}
                </ul>
              )}

              {res?.citations && res.citations.sources && res.citations.sources.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
                  <span>本回答引用的来源：</span>
                  {res.citations.sources.map((s) => <Tag key={s} tone="muted">{s}</Tag>)}
                </div>
              )}
            </div>
          )}

          {/* 检索依据（可解释性） */}
          {res.context && (
            <details className="border-t border-subtle px-4 py-2.5">
              <summary className="cursor-pointer text-[11.5px] text-muted">
                检索依据（命中 {res.context.total_hits} 条，节点 {res.context.node_ids.length} 个）
                {res.context.synonym_hits && res.context.synonym_hits.length
                  ? ' · 同义词扩展：' + res.context.synonym_hits.join('、') : ''}
              </summary>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {res.context.node_ids.map((id) => {
                  const n = nodeMap.get(id);
                  return (
                    <button key={id} onClick={() => openCapsule(id)}
                      className="inline-flex items-center gap-1 rounded-sm border border-subtle px-2 py-0.5 text-[11px] text-secondary transition hover:border-[color:var(--accent)]">
                      <span className="font-mono opacity-60">{id}</span>
                      {n ? (n.title.length > 18 ? n.title.slice(0, 18) + '…' : n.title) : ''}
                      {n && <EvidenceBadge status={n.evidence_status} compact className="ml-0.5" />}
                    </button>
                  );
                })}
              </div>
            </details>
          )}
        </div>
      )}

      {!res && !busy && !err && (
        <EmptyState
          title="尚未提问"
          hint={
            <>
              助手只依据三张地图中<b>已核实的内容</b>作答，并给出可点击的节点引用与原始来源。
              资料未覆盖时会明确说明缺口，不会编造。
            </>
          }
        />
      )}

      {history.length > 0 && (
        <div className="text-[11.5px] text-muted">
          <span className="mr-2">本次会话提问：</span>
          {history.map((h, i) => (
            <button key={i} onClick={() => setQuestion(h.q)} className="mr-2 underline decoration-dotted hover:text-[color:var(--accent)]">
              {h.q.length > 22 ? h.q.slice(0, 22) + '…' : h.q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}