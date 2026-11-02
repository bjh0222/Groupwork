// 反馈与候选内容：访问者可匿名提交疑问/纠错/新来源；同时展示处理状态与候选池审核情况。
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ApiError, api } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { EmptyState, ErrorState, Loading, Tag } from '@/lib/ui';
import type { MapType } from '@/lib/types';

const STATUS_LABEL: Record<string, string> = {
  '待处理': '待处理', '已采纳': '已采纳', '已回复': '已回复', '未采纳': '未采纳', '转候选': '转入候选池'
};

export function FeedbackPage() {
  const [sp] = useSearchParams();
  const presetNode = sp.get('node') || '';
  const presetType = sp.get('type') || 'feedback';
  const [tab, setTab] = useState<'feedback' | 'candidate'>(presetType === 'candidate' ? 'candidate' : 'feedback');

  // 反馈表单
  const [question, setQuestion] = useState('');
  const [relatedNode, setRelatedNode] = useState(presetNode);
  const [verify, setVerify] = useState('');
  const [anonymous, setAnonymous] = useState(true);
  const [fromName, setFromName] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // 候选表单
  const [cContent, setCContent] = useState('');
  const [cHint, setCHint] = useState('');
  const [cMap, setCMap] = useState<MapType | ''>('');
  const [cBusy, setCBusy] = useState(false);
  const [cMsg, setCMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const fb = useAsync(() => api.feedback({}), []);
  const cand = useAsync(() => api.candidates({}), []);

  useEffect(() => { if (presetNode) setRelatedNode(presetNode); }, [presetNode]);

  const submitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = question.trim();
    if (!q) { setMsg({ ok: false, text: '请填写你的疑问、纠错或建议。' }); return; }
    setBusy(true); setMsg(null);
    try {
      const r = await api.submitFeedback({
        question: q, related_node_id: relatedNode.trim() || undefined,
        verify: verify.trim() || undefined, anonymous, from_name: anonymous ? undefined : fromName.trim()
      });
      setMsg({ ok: true, text: r.message });
      setQuestion(''); setVerify('');
      fb.retry();
    } catch (err) {
      const ae = err as ApiError;
      setMsg({ ok: false, text: ae.message + (ae.status === 429 ? '（提交过于频繁，请稍后再试）' : '') });
    } finally { setBusy(false); }
  };

  const submitCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = cContent.trim();
    if (!c) { setCMsg({ ok: false, text: '请填写你希望纳入地图的内容或线索。' }); return; }
    setCBusy(true); setCMsg(null);
    try {
      const r = await api.submitCandidate({ content: c, source_hint: cHint.trim() || undefined, found_by: '访问者', target_map: cMap || undefined });
      setCMsg({ ok: true, text: r.message });
      setCContent(''); setCHint('');
      cand.retry();
    } catch (err) {
      const ae = err as ApiError;
      setCMsg({ ok: false, text: ae.message + (ae.status === 429 ? '（提交过于频繁，请稍后再试）' : '') });
    } finally { setCBusy(false); }
  };

  const inputCls = 'w-full rounded-sm border border-strong bg-[color:var(--surface-raised)] px-3 py-2 text-[13px] outline-none transition focus:border-[color:var(--accent)]';

  return (
    <div className="mx-auto max-w-[900px] px-3 py-5 sm:px-5">
      <header className="mb-4">
        <h1 className="font-serif text-[22px] sm:text-[26px]">反馈与更新</h1>
        <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-secondary">
          课程要求「新成果或反馈应能促使内容与关系修正」，并要求协作习惯中的<b>反馈转修改</b>。
          你可以<b>匿名</b>提交疑问、纠错或新来源；本站不收集任何个人身份信息，匿名提交时连昵称都不会保存。
          采纳后的修改会写入<Link to="/updates" className="mx-1 underline decoration-dotted">更新记录</Link>。
        </p>
      </header>

      <div className="mb-4 flex gap-2" role="tablist" aria-label="反馈类型">
        <button role="tab" aria-selected={tab === 'feedback'} onClick={() => setTab('feedback')}
          className={'rounded-sm px-3 py-1.5 text-[13px] transition ' + (tab === 'feedback' ? 'bg-[color:var(--accent)] text-[color:var(--text-on-accent)]' : 'border border-strong text-secondary')}>
          疑问 / 纠错
        </button>
        <button role="tab" aria-selected={tab === 'candidate'} onClick={() => setTab('candidate')}
          className={'rounded-sm px-3 py-1.5 text-[13px] transition ' + (tab === 'candidate' ? 'bg-[color:var(--accent)] text-[color:var(--text-on-accent)]' : 'border border-strong text-secondary')}>
          推荐新内容 / 新来源
        </button>
      </div>

      {tab === 'feedback' ? (
        <form onSubmit={submitFeedback} className="card mb-5 space-y-3 p-4">
          <div>
            <label htmlFor="fb-q" className="mb-1 block text-[12px] font-medium text-secondary">你的疑问、纠错或建议 <span className="text-[color:var(--accent)]">*</span></label>
            <textarea id="fb-q" value={question} onChange={(e) => setQuestion(e.target.value)} rows={4} maxLength={2000}
              placeholder="例如：D-C-CTX 节点里的 GLM-5.3 上下文长度与官方定价页当前数据不一致，建议复核。" className={inputCls} />
            <p className="mt-1 text-[11px] text-muted">{question.length}/2000 字</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="fb-node" className="mb-1 block text-[12px] font-medium text-secondary">相关节点 ID（可选）</label>
              <input id="fb-node" value={relatedNode} onChange={(e) => setRelatedNode(e.target.value)} placeholder="如 D-C-CTX" className={inputCls} />
            </div>
            <div>
              <label htmlFor="fb-verify" className="mb-1 block text-[12px] font-medium text-secondary">你的核实方式或依据（可选）</label>
              <input id="fb-verify" value={verify} onChange={(e) => setVerify(e.target.value)} maxLength={1000} placeholder="如：官方定价页 2026-11-05 复核" className={inputCls} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex cursor-pointer items-center gap-1.5 text-[12.5px] text-secondary">
              <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="accent-[color:var(--accent)]" />
              匿名提交（推荐，不保存任何身份信息）
            </label>
            {!anonymous && (
              <label className="flex items-center gap-1.5 text-[12.5px] text-secondary">
                署名
                <input value={fromName} onChange={(e) => setFromName(e.target.value)} maxLength={60} placeholder="昵称或姓名"
                  className="rounded-sm border border-strong bg-[color:var(--surface-raised)] px-2 py-1 text-[12.5px] outline-none focus:border-[color:var(--accent)]" />
              </label>
            )}
          </div>
          {msg && (
            <p role="status" className={'rounded-sm px-3 py-2 text-[12.5px] ' + (msg.ok ? 'bg-[color:var(--ev-verified-bg)] text-[color:var(--ev-verified)]' : 'bg-[color:var(--ev-partial-bg)] text-[color:var(--ev-partial)]')}>
              {msg.text}
            </p>
          )}
          <button type="submit" data-testid="fb-submit" disabled={busy}
            className="rounded-sm bg-[color:var(--accent)] px-4 py-2 text-[13px] text-[color:var(--text-on-accent)] transition hover:bg-[color:var(--accent-strong)] disabled:opacity-50">
            {busy ? '提交中…' : '提交反馈'}
          </button>
        </form>
      ) : (
        <form onSubmit={submitCandidate} className="card mb-5 space-y-3 p-4">
          <p className="text-[12px] leading-relaxed text-muted">
            推荐的内容会先进入<b>候选内容池</b>，经来源检查与逻辑检查后才可能进入正式地图。
            这是课程「自动获取信息需核实后进入正式地图」要求的实现方式——AI 生成与外部推荐的内容不会未经审核直接成为已核实事实。
          </p>
          <div>
            <label htmlFor="c-content" className="mb-1 block text-[12px] font-medium text-secondary">内容或线索 <span className="text-[color:var(--accent)]">*</span></label>
            <textarea id="c-content" value={cContent} onChange={(e) => setCContent(e.target.value)} rows={4} maxLength={4000}
              placeholder="例如：建议增加「上下文缓存」概念节点，官方文档说明其可显著降低重复注入成本。" className={inputCls} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="c-hint" className="mb-1 block text-[12px] font-medium text-secondary">来源线索（可选）</label>
              <input id="c-hint" value={cHint} onChange={(e) => setCHint(e.target.value)} placeholder="URL、论文编号或文档位置" className={inputCls} />
            </div>
            <div>
              <label htmlFor="c-map" className="mb-1 block text-[12px] font-medium text-secondary">建议归入的地图（可选）</label>
              <select id="c-map" value={cMap} onChange={(e) => setCMap(e.target.value as MapType | '')} className={inputCls}>
                <option value="">不确定</option>
                <option value="domain">领域地图</option>
                <option value="ecosystem">生态地图</option>
                <option value="cognition">认知地图</option>
              </select>
            </div>
          </div>
          {cMsg && (
            <p role="status" className={'rounded-sm px-3 py-2 text-[12.5px] ' + (cMsg.ok ? 'bg-[color:var(--ev-verified-bg)] text-[color:var(--ev-verified)]' : 'bg-[color:var(--ev-partial-bg)] text-[color:var(--ev-partial)]')}>
              {cMsg.text}
            </p>
          )}
          <button type="submit" disabled={cBusy}
            className="rounded-sm bg-[color:var(--accent)] px-4 py-2 text-[13px] text-[color:var(--text-on-accent)] transition hover:bg-[color:var(--accent-strong)] disabled:opacity-50">
            {cBusy ? '提交中…' : '提交到候选池'}
          </button>
        </form>
      )}

      {/* 处理结果 */}
      <section className="mb-5">
        <h2 className="mb-2 font-serif text-[16px]">反馈处理情况（{(fb.data?.feedback || []).length}）</h2>
        {fb.loading && <Loading label="加载中…" />}
        {fb.error && <ErrorState message={fb.error} onRetry={fb.retry} />}
        {!fb.loading && !fb.error && (fb.data?.feedback || []).length === 0 && (
          <EmptyState title="尚无反馈记录"
            hint="网站刚交付，还没有真实同学反馈。这里不会显示虚构的样例数据。提交后会显示处理状态与回复。" />
        )}
        <ul className="space-y-2">
          {(fb.data?.feedback || []).map((f) => (
            <li key={f.id} className="card p-3">
              <div className="flex flex-wrap items-center gap-2 text-[11.5px]">
                <span className="font-mono text-muted">#{f.id}</span>
                <time dateTime={f.date} className="text-muted">{f.date}</time>
                <Tag tone={f.status === '待处理' ? 'muted' : 'accent'}>{STATUS_LABEL[f.status] || f.status}</Tag>
                <span className="text-muted">{f.anonymous ? '匿名' : (f.from_name || '署名')}</span>
                {f.related_node_id && (
                  <Link to={'/node/' + encodeURIComponent(f.related_node_id)} className="font-mono text-muted underline decoration-dotted hover:text-[color:var(--accent)]">{f.related_node_id}</Link>
                )}
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-secondary">{f.question}</p>
              {f.verify && <p className="mt-1 text-[12px] text-muted">提交者依据：{f.verify}</p>}
              {f.reply && (
                <p className="mt-1.5 rounded-sm bg-[color:var(--surface-sunken)] px-2.5 py-1.5 text-[12px] leading-snug text-secondary">
                  <span className="font-medium text-[color:var(--text-primary)]">回复：</span>{f.reply}
                </p>
              )}
              {f.change && <p className="mt-1 text-[12px] text-secondary"><span className="text-muted">实际改动：</span>{f.change}</p>}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-serif text-[16px]">候选内容池（{(cand.data?.candidates || []).length}）</h2>
        {cand.loading && <Loading label="加载中…" />}
        {!cand.loading && (cand.data?.candidates || []).length === 0 && (
          <EmptyState title="候选池为空" hint="AI 生成内容、访问者推荐与自动采集的内容都会先进入这里，经审核后才进正式地图。" />
        )}
        <ul className="space-y-2">
          {(cand.data?.candidates || []).map((c) => (
            <li key={c.id} className="card p-3">
              <div className="flex flex-wrap items-center gap-2 text-[11.5px]">
                <span className="font-mono text-muted">#{c.id}</span>
                <time dateTime={c.found_at} className="text-muted">{c.found_at.slice(0, 10)}</time>
                <Tag tone={c.review_status === '已通过' ? 'accent' : 'muted'}>{c.review_status}</Tag>
                <span className="text-muted">来源线索：{c.found_by}</span>
                {c.target_map && <Tag tone="muted">{c.target_map === 'domain' ? '领域' : c.target_map === 'ecosystem' ? '生态' : '认知'}</Tag>}
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-secondary">{c.content}</p>
              {c.source_hint && <p className="mt-1 text-[12px] text-muted">线索：{c.source_hint}</p>}
              {c.rejection_reason && <p className="mt-1 text-[12px] text-[color:var(--ev-partial)]">淘汰原因：{c.rejection_reason}</p>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}