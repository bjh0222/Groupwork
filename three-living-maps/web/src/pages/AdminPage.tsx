// 管理端：维护节点、关系、来源、候选内容与反馈。
// 令牌仅存内存（不落 localStorage），避免 XSS 窃取持久凭据；未配置 ADMIN_TOKEN 时后端返回 501。
import { useCallback, useEffect, useState } from 'react';
import { adminApi, api, setAdminToken } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { EmptyState, ErrorState, Loading, Tag } from '@/lib/ui';
import type { CandidateEntry, FeedbackEntry, MapNode, Source } from '@/lib/types';

type Tab = 'nodes' | 'relations' | 'sources' | 'candidates' | 'feedback' | 'lint';

export function AdminPage() {
  const [token, setToken] = useState('');
  const [authed, setAuthed] = useState(false);
  const [adminEnabled, setAdminEnabled] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>('nodes');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => { api.meta().then((m) => setAdminEnabled(m.admin_enabled)).catch(() => setAdminEnabled(false)); }, []);

  const tryAuth = async () => {
    setAdminToken(token.trim());
    setMsg(null);
    try {
      await adminApi.lint();
      setAuthed(true);
      setMsg({ ok: true, text: '令牌有效，已进入管理端。' });
    } catch (e) {
      const err = e as { status?: number; message?: string };
      setAuthed(false);
      setAdminToken('');
      setMsg({ ok: false, text: (err.status === 501 ? '服务端未启用管理端（未配置 ADMIN_TOKEN，或长度不足 12）。' : '令牌无效或权限不足：' + (err.message || '')) });
    }
  };

  if (adminEnabled === false) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-10">
        <div className="card p-5">
          <h1 className="mb-2 font-serif text-[19px]">管理端未启用</h1>
          <p className="text-[13px] leading-relaxed text-secondary">
            服务端未配置 <code className="rounded-sm bg-[color:var(--surface-sunken)] px-1 font-mono text-[12px]">ADMIN_TOKEN</code>，
            因此所有写操作被禁用（默认安全：未配置即不可写，而不是默认放行）。
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-secondary">启用方式：</p>
          <ol className="mt-1 list-decimal space-y-1 pl-5 text-[12.5px] text-muted">
            <li>在服务端环境或 <code className="font-mono">.env.local</code> 中设置 <code className="font-mono">ADMIN_TOKEN</code>（长度 ≥ 12 的随机字符串）。</li>
            <li>重启服务（<code className="font-mono">npm start</code>）。</li>
            <li>回到本页输入同一令牌。</li>
          </ol>
          <p className="mt-3 border-t border-subtle pt-2 text-[12px] text-muted">
            令牌只在浏览器内存中用于请求头，不会写入 localStorage，刷新页面即失效——这是有意的安全设计。
          </p>
        </div>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="mx-auto max-w-[520px] px-4 py-10">
        <div className="card p-5">
          <h1 className="mb-1 font-serif text-[19px]">管理端登录</h1>
          <p className="mb-3 text-[12.5px] leading-relaxed text-muted">
            公开访问无需登录；只有维护人员需要令牌才能新增、编辑、审核与下架内容。
          </p>
          <label htmlFor="adm-token" className="mb-1 block text-[12px] font-medium text-secondary">管理员令牌</label>
          <input id="adm-token" type="password" value={token} onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') tryAuth(); }} autoComplete="off"
            className="w-full rounded-sm border border-strong bg-[color:var(--surface-raised)] px-3 py-2 text-[13px] outline-none focus:border-[color:var(--accent)]" />
          {msg && (
            <p role="status" className={'mt-2 rounded-sm px-2.5 py-1.5 text-[12px] ' + (msg.ok ? 'bg-[color:var(--ev-verified-bg)] text-[color:var(--ev-verified)]' : 'bg-[color:var(--ev-partial-bg)] text-[color:var(--ev-partial)]')}>
              {msg.text}
            </p>
          )}
          <button onClick={tryAuth} disabled={!token.trim()}
            className="mt-3 w-full rounded-sm bg-[color:var(--accent)] px-4 py-2 text-[13px] text-[color:var(--text-on-accent)] transition hover:bg-[color:var(--accent-strong)] disabled:opacity-50">
            进入管理端
          </button>
        </div>
      </div>
    );
  }

  const TABS: [Tab, string][] = [
    ['nodes', '节点'], ['relations', '关系'], ['sources', '来源'],
    ['candidates', '候选池'], ['feedback', '反馈'], ['lint', '一致性检查']
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-3 py-5 sm:px-5">
      <header className="mb-4 flex flex-wrap items-baseline gap-2">
        <h1 className="font-serif text-[22px] sm:text-[26px]">管理端</h1>
        <span className="text-[12px] text-muted">写权限已启用 · 所有改动会自动写入更新记录</span>
        <button onClick={() => { setAuthed(false); setAdminToken(''); setToken(''); }}
          className="ml-auto text-[12px] text-muted underline decoration-dotted hover:text-[color:var(--accent)]">退出</button>
      </header>

      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="管理端分区">
        {TABS.map(([t, label]) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={'rounded-sm px-3 py-1.5 text-[13px] transition ' + (tab === t ? 'bg-[color:var(--accent)] text-[color:var(--text-on-accent)]' : 'border border-strong text-secondary hover:text-[color:var(--accent)]')}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'nodes' && <NodeAdmin onMsg={setMsg} />}
      {tab === 'relations' && <RelationAdmin onMsg={setMsg} />}
      {tab === 'sources' && <SourceAdmin onMsg={setMsg} />}
      {tab === 'candidates' && <CandidateAdmin onMsg={setMsg} />}
      {tab === 'feedback' && <FeedbackAdmin onMsg={setMsg} />}
      {tab === 'lint' && <LintPanel />}
    </div>
  );
}

const inputCls = 'w-full rounded-sm border border-strong bg-[color:var(--surface-raised)] px-2.5 py-1.5 text-[12.5px] outline-none focus:border-[color:var(--accent)]';
const labelCls = 'mb-1 block text-[11.5px] font-medium text-secondary';

function useNotify(onMsg: (m: { ok: boolean; text: string } | null) => void) {
  return useCallback((ok: boolean, text: string) => onMsg({ ok, text }), [onMsg]);
}

// ---------- 节点维护 ----------
function NodeAdmin({ onMsg }: { onMsg: (m: { ok: boolean; text: string } | null) => void }) {
  const notify = useNotify(onMsg);
  const { data, loading, error, retry } = useAsync(() => api.nodes({ status: 'published' }), []);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<MapNode | null>(null);
  const [form, setForm] = useState({ title: '', map_type: 'domain', node_type: 'concept', summary: '', details: '', tags: '', source_ids: '', evidence_status: '已核实', knowledge_status: '未评估', last_checked: '', evidence_note: '', limit_note: '', reason: '' });
  const [busy, setBusy] = useState(false);

  const nodes = (data?.nodes || []).filter((n) => !q.trim() || (n.title + n.id + n.summary).toLowerCase().includes(q.trim().toLowerCase()));

  const startNew = () => {
    setEditing({} as MapNode);
    setForm({ title: '', map_type: 'domain', node_type: 'concept', summary: '', details: '', tags: '', source_ids: '', evidence_status: '待核实', knowledge_status: '未评估', last_checked: new Date().toISOString().slice(0, 10), evidence_note: '', limit_note: '', reason: '' });
  };
  const startEdit = (n: MapNode) => {
    setEditing(n);
    setForm({
      title: n.title, map_type: n.map_type, node_type: n.node_type, summary: n.summary,
      details: (n.details || []).join('\n'), tags: (n.tags || []).join(', '), source_ids: (n.source_ids || []).join(', '),
      evidence_status: n.evidence_status, knowledge_status: n.knowledge_status, last_checked: n.last_checked,
      evidence_note: n.evidence_note || '', limit_note: n.limit || n.limit_note || '', reason: ''
    });
  };

  const save = async () => {
    setBusy(true);
    const body: Record<string, unknown> = {
      id: editing?.id || undefined, title: form.title, map_type: form.map_type, node_type: form.node_type,
      summary: form.summary, details: form.details.split('\n').map((x) => x.trim()).filter(Boolean),
      tags: form.tags.split(',').map((x) => x.trim()).filter(Boolean),
      source_ids: form.source_ids.split(',').map((x) => x.trim()).filter(Boolean),
      evidence_status: form.evidence_status, knowledge_status: form.knowledge_status,
      last_checked: form.last_checked || new Date().toISOString().slice(0, 10),
      evidence_note: form.evidence_note || null, limit: form.limit_note || null, reason: form.reason || null
    };
    if (!editing?.id) {
      const id = window.prompt('新节点 ID（领域 D-、生态 E-、认知 C- 前缀，2-64 位）');
      if (!id) { setBusy(false); return; }
      body.id = id.trim();
    }
    try {
      const r = await adminApi.saveNode(body);
      notify(true, '已保存节点 ' + (r.node?.id || body.id) + '，并写入更新记录。');
      setEditing(null); retry();
    } catch (e) {
      const err = e as { messages?: string[]; message?: string };
      notify(false, '保存失败：' + ((err.messages || []).join('；') || err.message));
    } finally { setBusy(false); }
  };

  const del = async (n: MapNode) => {
    const reason = window.prompt('下架节点 ' + n.id + '「' + n.title + '」的原因（会写入更新记录）');
    if (reason === null) return;
    try { await adminApi.deleteNode(n.id, reason || undefined); notify(true, '已下架 ' + n.id); retry(); }
    catch (e) { notify(false, '下架失败：' + ((e as { message?: string }).message || '')); }
  };

  if (editing) {
    return (
      <div className="card space-y-3 p-4">
        <h2 className="font-serif text-[16px]">{editing.id ? '编辑节点 ' + editing.id : '新增节点'}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className={labelCls} htmlFor="n-title">标题 *</label><input id="n-title" className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={labelCls} htmlFor="n-map">地图</label>
              <select id="n-map" className={inputCls} value={form.map_type} onChange={(e) => setForm({ ...form, map_type: e.target.value })}>
                <option value="domain">领域</option><option value="ecosystem">生态</option><option value="cognition">认知</option>
              </select></div>
            <div><label className={labelCls} htmlFor="n-type">类型</label>
              <select id="n-type" className={inputCls} value={form.node_type} onChange={(e) => setForm({ ...form, node_type: e.target.value })}>
                {['task','problem','concept','approach','tool','model','resource','requirement','ability','course','pathway','participant','org','company','lab','community','conference','paper','dataset','user','cost','method','habit','case','revision','principle','benchmark'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select></div>
          </div>
        </div>
        <div><label className={labelCls} htmlFor="n-sum">摘要 *（不少于 8 字）</label><textarea id="n-sum" className={inputCls} rows={3} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></div>
        <div><label className={labelCls} htmlFor="n-det">详细说明（每行一条）</label><textarea id="n-det" className={inputCls} rows={6} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className={labelCls} htmlFor="n-tags">标签（逗号分隔）</label><input id="n-tags" className={inputCls} value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></div>
          <div><label className={labelCls} htmlFor="n-src">来源 ID（逗号分隔，须已存在）</label><input id="n-src" className={inputCls} value={form.source_ids} onChange={(e) => setForm({ ...form, source_ids: e.target.value })} /></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div><label className={labelCls} htmlFor="n-ev">证据状态</label>
            <select id="n-ev" className={inputCls} value={form.evidence_status} onChange={(e) => setForm({ ...form, evidence_status: e.target.value })}>
              {['已核实','部分核实','推断','待核实'].map((x) => <option key={x} value={x}>{x}</option>)}
            </select></div>
          <div><label className={labelCls} htmlFor="n-ks">理解程度</label>
            <select id="n-ks" className={inputCls} value={form.knowledge_status} onChange={(e) => setForm({ ...form, knowledge_status: e.target.value })}>
              {['未评估','已初步理解','已经尝试','待深入学习'].map((x) => <option key={x} value={x}>{x}</option>)}
            </select></div>
          <div><label className={labelCls} htmlFor="n-lc">核查日期</label><input id="n-lc" type="date" className={inputCls} value={form.last_checked} onChange={(e) => setForm({ ...form, last_checked: e.target.value })} /></div>
        </div>
        <div><label className={labelCls} htmlFor="n-evn">证据说明</label><input id="n-evn" className={inputCls} value={form.evidence_note} onChange={(e) => setForm({ ...form, evidence_note: e.target.value })} /></div>
        <div><label className={labelCls} htmlFor="n-lim">边界 / 未解决问题</label><input id="n-lim" className={inputCls} value={form.limit_note} onChange={(e) => setForm({ ...form, limit_note: e.target.value })} /></div>
        <div><label className={labelCls} htmlFor="n-rea">本次修改原因（写入更新记录）</label><input id="n-rea" className={inputCls} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
        <div className="flex gap-2">
          <button onClick={save} disabled={busy} className="rounded-sm bg-[color:var(--accent)] px-4 py-2 text-[13px] text-[color:var(--text-on-accent)] disabled:opacity-50">{busy ? '保存中…' : '保存'}</button>
          <button onClick={() => setEditing(null)} className="rounded-sm border border-strong px-4 py-2 text-[13px] text-secondary">取消</button>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="font-serif text-[16px]">节点（{nodes.length}）</h2>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="筛选标题/ID/摘要…" className="ml-auto w-52 rounded-sm border border-strong bg-[color:var(--surface-raised)] px-2.5 py-1.5 text-[12.5px] outline-none focus:border-[color:var(--accent)]" aria-label="筛选节点" />
        <button onClick={startNew} className="rounded-sm bg-[color:var(--accent)] px-3 py-1.5 text-[12.5px] text-[color:var(--text-on-accent)]">+ 新增节点</button>
      </div>
      {loading && <Loading />}
      {error && <ErrorState message={error} onRetry={retry} />}
      <ul className="max-h-[60vh] space-y-1 overflow-y-auto pr-1">
        {nodes.map((n) => (
          <li key={n.id} className="flex flex-wrap items-center gap-2 rounded-sm border border-subtle px-2.5 py-1.5 text-[12.5px]">
            <span className="font-mono text-[10.5px] text-muted">{n.id}</span>
            <span className="min-w-0 flex-1 truncate">{n.title}</span>
            <Tag tone="muted">{n.map_type}</Tag>
            <Tag tone="muted">{n.evidence_status}</Tag>
            <button onClick={() => startEdit(n)} className="text-[11.5px] text-muted underline decoration-dotted hover:text-[color:var(--accent)]">编辑</button>
            <button onClick={() => del(n)} className="text-[11.5px] text-muted underline decoration-dotted hover:text-[color:var(--ev-partial)]">下架</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
// ---------- 关系维护 ----------
const REL_TYPES = ['solves','based_on','implemented_by','requires_knowledge','alternative_to','complements','evaluated_by','提出','采用','依赖','改进','质疑','taught_in','enables_practice','资助','付费','提供','定价','合作','竞争','孵化','开源','分析','修正认识','支撑习惯','记录于'];
const COVERAGE = ['前置基础','核心覆盖','部分涉及','实践应用','自主拓展'];

function RelationAdmin({ onMsg }: { onMsg: (m: { ok: boolean; text: string } | null) => void }) {
  const notify = useNotify(onMsg);
  const rel = useAsync(() => api.relations({}), []);
  const nd = useAsync(() => api.nodes({}), []);
  const [form, setForm] = useState({ source_node_id: '', target_node_id: '', relation_type: 'based_on', coverage: '', description: '', reasoning_chain: '', source_ids: '', evidence_status: '已核实', checked_at: new Date().toISOString().slice(0, 10), reason: '' });
  const [busy, setBusy] = useState(false);
  const nodeIds = (nd.data?.nodes || []).map((n) => n.id);

  const save = async () => {
    setBusy(true);
    try {
      await adminApi.saveRelation({
        source_node_id: form.source_node_id, target_node_id: form.target_node_id, relation_type: form.relation_type,
        coverage: form.coverage || null, description: form.description, reasoning_chain: form.reasoning_chain || null,
        source_ids: form.source_ids.split(',').map((x) => x.trim()).filter(Boolean),
        evidence_status: form.evidence_status, checked_at: form.checked_at, reason: form.reason || null
      });
      notify(true, '已保存关系，并写入更新记录。');
      setForm({ ...form, description: '', reasoning_chain: '', reason: '' });
      rel.retry();
    } catch (e) {
      const err = e as { messages?: string[]; message?: string };
      notify(false, '保存失败：' + ((err.messages || []).join('；') || err.message));
    } finally { setBusy(false); }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
      <div className="card space-y-2.5 p-4">
        <h2 className="font-serif text-[15px]">新增 / 修改关系</h2>
        <div><label className={labelCls} htmlFor="r-src">源节点 *</label>
          <input id="r-src" list="node-ids-r" className={inputCls} value={form.source_node_id} onChange={(e) => setForm({ ...form, source_node_id: e.target.value })} placeholder="如 D-C-RAG" />
          <datalist id="node-ids-r">{nodeIds.map((i) => <option key={i} value={i} />)}</datalist></div>
        <div><label className={labelCls} htmlFor="r-tgt">目标节点 *</label>
          <input id="r-tgt" list="node-ids-r2" className={inputCls} value={form.target_node_id} onChange={(e) => setForm({ ...form, target_node_id: e.target.value })} placeholder="如 D-C-EMB" />
          <datalist id="node-ids-r2">{nodeIds.map((i) => <option key={i} value={i} />)}</datalist></div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className={labelCls} htmlFor="r-type">关系类型 *</label>
            <select id="r-type" className={inputCls} value={form.relation_type} onChange={(e) => setForm({ ...form, relation_type: e.target.value })}>
              {REL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select></div>
          <div><label className={labelCls} htmlFor="r-cov">覆盖程度（taught_in 必填）</label>
            <select id="r-cov" className={inputCls} value={form.coverage} onChange={(e) => setForm({ ...form, coverage: e.target.value })}>
              <option value="">—</option>{COVERAGE.map((c) => <option key={c} value={c}>{c}</option>)}
            </select></div>
        </div>
        <div><label className={labelCls} htmlFor="r-desc">关系描述 *</label><textarea id="r-desc" className={inputCls} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div><label className={labelCls} htmlFor="r-chain">推理链（证据状态为「推断」时必填）</label><textarea id="r-chain" className={inputCls} rows={2} value={form.reasoning_chain} onChange={(e) => setForm({ ...form, reasoning_chain: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className={labelCls} htmlFor="r-srcs">来源 ID</label><input id="r-srcs" className={inputCls} value={form.source_ids} onChange={(e) => setForm({ ...form, source_ids: e.target.value })} placeholder="S-01, S-26" /></div>
          <div><label className={labelCls} htmlFor="r-ev">证据状态</label>
            <select id="r-ev" className={inputCls} value={form.evidence_status} onChange={(e) => setForm({ ...form, evidence_status: e.target.value })}>
              {['已核实','部分核实','推断','待核实'].map((x) => <option key={x} value={x}>{x}</option>)}
            </select></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className={labelCls} htmlFor="r-at">核查日期</label><input id="r-at" type="date" className={inputCls} value={form.checked_at} onChange={(e) => setForm({ ...form, checked_at: e.target.value })} /></div>
          <div><label className={labelCls} htmlFor="r-rea">修改原因</label><input id="r-rea" className={inputCls} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
        </div>
        <button onClick={save} disabled={busy} className="w-full rounded-sm bg-[color:var(--accent)] px-4 py-2 text-[13px] text-[color:var(--text-on-accent)] disabled:opacity-50">{busy ? '保存中…' : '保存关系'}</button>
      </div>

      <div className="card p-4">
        <h2 className="mb-2 font-serif text-[15px]">现有关系（{(rel.data?.relations || []).length}）</h2>
        {rel.loading && <Loading />}
        <ul className="max-h-[62vh] space-y-1 overflow-y-auto pr-1">
          {(rel.data?.relations || []).map((r) => (
            <li key={r.id} className="rounded-sm border border-subtle px-2.5 py-1.5 text-[12px]">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[10.5px] text-muted">{r.source_node_id}</span>
                <span className="font-mono text-[color:var(--accent)]">{r.relation_type}</span>
                <span className="font-mono text-[10.5px] text-muted">{r.target_node_id}</span>
                {r.coverage && <Tag tone="muted">{r.coverage}</Tag>}
                <Tag tone="muted">{r.evidence_status}</Tag>
              </div>
              <p className="mt-0.5 line-clamp-2 leading-snug text-secondary">{r.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---------- 来源维护 ----------
function SourceAdmin({ onMsg }: { onMsg: (m: { ok: boolean; text: string } | null) => void }) {
  const notify = useNotify(onMsg);
  const src = useAsync(() => api.sources({}), []);
  const [editing, setEditing] = useState<Source | null>(null);
  const [form, setForm] = useState({ id: '', title: '', publisher: '', author: '', url: '', published_at: '', accessed_at: new Date().toISOString().slice(0, 10), source_type: 'official_doc', supports: '', notes: '', reason: '' });
  const [busy, setBusy] = useState(false);

  const startNew = () => { setEditing({} as Source); setForm({ id: '', title: '', publisher: '', author: '', url: '', published_at: '', accessed_at: new Date().toISOString().slice(0, 10), source_type: 'official_doc', supports: '', notes: '', reason: '' }); };
  const startEdit = (s: Source) => { setEditing(s); setForm({ id: s.id, title: s.title, publisher: s.publisher || '', author: s.author || '', url: s.url || '', published_at: s.published_at || '', accessed_at: s.accessed_at, source_type: s.source_type, supports: (s.supports || []).join('\n'), notes: s.notes || '', reason: '' }); };

  const save = async () => {
    setBusy(true);
    try {
      await adminApi.saveSource({
        id: form.id, title: form.title, publisher: form.publisher || null, author: form.author || null,
        url: form.url || null, published_at: form.published_at || null, accessed_at: form.accessed_at,
        source_type: form.source_type, supports: form.supports.split('\n').map((x) => x.trim()).filter(Boolean),
        notes: form.notes || null, reason: form.reason || null
      });
      notify(true, '已保存来源 ' + form.id + '。'); setEditing(null); src.retry();
    } catch (e) {
      const err = e as { messages?: string[]; message?: string };
      notify(false, '保存失败：' + ((err.messages || []).join('；') || err.message));
    } finally { setBusy(false); }
  };

  if (editing) {
    return (
      <div className="card space-y-2.5 p-4">
        <h2 className="font-serif text-[15px]">{editing.id ? '编辑来源 ' + editing.id : '新增来源'}</h2>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <div><label className={labelCls} htmlFor="s-id">ID *（格式 S-NN）</label><input id="s-id" className={inputCls} value={form.id} disabled={!!editing.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="S-44" /></div>
          <div><label className={labelCls} htmlFor="s-type">类型 *</label>
            <select id="s-type" className={inputCls} value={form.source_type} onChange={(e) => setForm({ ...form, source_type: e.target.value })}>
              {['paper','official_doc','pricing','curriculum','project_doc','community','benchmark','tool_doc'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select></div>
        </div>
        <div><label className={labelCls} htmlFor="s-title">标题 *</label><input id="s-title" className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <div><label className={labelCls} htmlFor="s-pub">发布机构</label><input id="s-pub" className={inputCls} value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })} /></div>
          <div><label className={labelCls} htmlFor="s-auth">作者</label><input id="s-auth" className={inputCls} value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} /></div>
        </div>
        <div><label className={labelCls} htmlFor="s-url">URL</label><input id="s-url" className={inputCls} value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} /></div>
        <div className="grid gap-2.5 sm:grid-cols-3">
          <div><label className={labelCls} htmlFor="s-pd">发布日期</label><input id="s-pd" className={inputCls} value={form.published_at} onChange={(e) => setForm({ ...form, published_at: e.target.value })} placeholder="YYYY-MM-DD" /></div>
          <div><label className={labelCls} htmlFor="s-ad">访问日期 *</label><input id="s-ad" type="date" className={inputCls} value={form.accessed_at} onChange={(e) => setForm({ ...form, accessed_at: e.target.value })} /></div>
          <div><label className={labelCls} htmlFor="s-rea">修改原因</label><input id="s-rea" className={inputCls} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
        </div>
        <div><label className={labelCls} htmlFor="s-sup">支持的具体结论（每行一条）*</label><textarea id="s-sup" className={inputCls} rows={5} value={form.supports} onChange={(e) => setForm({ ...form, supports: e.target.value })} /></div>
        <div><label className={labelCls} htmlFor="s-notes">备注（含证据限制说明）</label><textarea id="s-notes" className={inputCls} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        <div className="flex gap-2">
          <button onClick={save} disabled={busy} className="rounded-sm bg-[color:var(--accent)] px-4 py-2 text-[13px] text-[color:var(--text-on-accent)] disabled:opacity-50">{busy ? '保存中…' : '保存'}</button>
          <button onClick={() => setEditing(null)} className="rounded-sm border border-strong px-4 py-2 text-[13px] text-secondary">取消</button>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="font-serif text-[15px]">来源（{(src.data?.sources || []).length}）</h2>
        <button onClick={startNew} className="ml-auto rounded-sm bg-[color:var(--accent)] px-3 py-1.5 text-[12.5px] text-[color:var(--text-on-accent)]">+ 新增来源</button>
      </div>
      {src.loading && <Loading />}
      <ul className="max-h-[62vh] space-y-1 overflow-y-auto pr-1">
        {(src.data?.sources || []).map((s) => (
          <li key={s.id} className="flex flex-wrap items-center gap-2 rounded-sm border border-subtle px-2.5 py-1.5 text-[12.5px]">
            <span className="font-mono text-[10.5px] text-muted">{s.id}</span>
            <span className="min-w-0 flex-1 truncate">{s.title}</span>
            <Tag tone="muted">{s.source_type}</Tag>
            <span className="text-[10.5px] text-muted">访问 {s.accessed_at}</span>
            <button onClick={() => startEdit(s)} className="text-[11.5px] text-muted underline decoration-dotted hover:text-[color:var(--accent)]">编辑</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- 候选内容审核 ----------
function CandidateAdmin({ onMsg }: { onMsg: (m: { ok: boolean; text: string } | null) => void }) {
  const notify = useNotify(onMsg);
  const cand = useAsync(() => api.candidates({}), []);
  const review = async (c: CandidateEntry, status: string) => {
    let reason: string | undefined;
    if (status === '已淘汰') {
      const r = window.prompt('淘汰原因（必填，会公开展示）');
      if (!r) return; reason = r;
    }
    try { await adminApi.reviewCandidate(c.id, { review_status: status, rejection_reason: reason }); notify(true, '候选 #' + c.id + ' 已标记为「' + status + '」。'); cand.retry(); }
    catch (e) { notify(false, '操作失败：' + ((e as { message?: string }).message || '')); }
  };
  return (
    <div className="card p-4">
      <h2 className="mb-2 font-serif text-[15px]">候选内容池（{(cand.data?.candidates || []).length}）</h2>
      <p className="mb-3 text-[12px] leading-relaxed text-muted">
        AI 生成内容、访问者推荐与自动采集的内容先进入这里，经<b>来源检查</b>与<b>逻辑检查</b>后才可进入正式地图。
        通过审核后，应把内容整理为正式节点（在「节点」分区新增），并在此标注已通过。
      </p>
      {cand.loading && <Loading />}
      {!cand.loading && (cand.data?.candidates || []).length === 0 && <EmptyState title="候选池为空" hint="访问者可通过反馈页推荐新内容。" />}
      <ul className="space-y-2">
        {(cand.data?.candidates || []).map((c) => (
          <li key={c.id} className="rounded-sm border border-subtle p-3">
            <div className="flex flex-wrap items-center gap-2 text-[11.5px]">
              <span className="font-mono text-muted">#{c.id}</span>
              <time className="text-muted">{c.found_at.slice(0, 10)}</time>
              <Tag tone={c.review_status === '已通过' ? 'accent' : 'muted'}>{c.review_status}</Tag>
              <span className="text-muted">来自 {c.found_by}</span>
              {c.target_map && <Tag tone="muted">{c.target_map}</Tag>}
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-secondary">{c.content}</p>
            {c.source_hint && <p className="mt-1 text-[12px] text-muted">来源线索：{c.source_hint}</p>}
            {c.rejection_reason && <p className="mt-1 text-[12px] text-[color:var(--ev-partial)]">淘汰原因：{c.rejection_reason}</p>}
            {c.review_status === '待审核' && (
              <div className="mt-2 flex gap-2">
                <button onClick={() => review(c, '已通过')} className="rounded-sm border border-[color:var(--ev-verified)] px-3 py-1 text-[12px] text-[color:var(--ev-verified)]">通过</button>
                <button onClick={() => review(c, '已淘汰')} className="rounded-sm border border-strong px-3 py-1 text-[12px] text-secondary">淘汰</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- 反馈处理 ----------
function FeedbackAdmin({ onMsg }: { onMsg: (m: { ok: boolean; text: string } | null) => void }) {
  const notify = useNotify(onMsg);
  const fb = useAsync(() => api.feedback({}), []);
  const act = async (f: FeedbackEntry) => {
    const status = window.prompt('新状态（待处理 / 已采纳 / 已回复 / 未采纳 / 转候选）', f.status);
    if (!status) return;
    const reply = window.prompt('回复内容（会公开展示，可留空）', f.reply || '') ?? undefined;
    const change = window.prompt('实际改动说明（可留空）', f.change || '') ?? undefined;
    try { await adminApi.updateFeedback(f.id, { status, reply, change }); notify(true, '反馈 #' + f.id + ' 已更新为「' + status + '」。'); fb.retry(); }
    catch (e) { notify(false, '操作失败：' + ((e as { message?: string }).message || '')); }
  };
  const list = fb.data?.feedback || [];
  return (
    <div className="card p-4">
      <h2 className="mb-2 font-serif text-[15px]">反馈（{list.length}）</h2>
      <p className="mb-3 text-[12px] leading-relaxed text-muted">
        处理反馈时应填写核实方式与实际改动；采纳的修改会写入更新记录，形成课程要求的「反馈转修改」闭环。
      </p>
      {fb.loading && <Loading />}
      {!fb.loading && list.length === 0 && <EmptyState title="尚无反馈" hint="访问者提交后会显示在这里。" />}
      <ul className="space-y-2">
        {list.map((f) => (
          <li key={f.id} className="rounded-sm border border-subtle p-3">
            <div className="flex flex-wrap items-center gap-2 text-[11.5px]">
              <span className="font-mono text-muted">#{f.id}</span>
              <time className="text-muted">{f.date}</time>
              <Tag tone={f.status === '待处理' ? 'muted' : 'accent'}>{f.status}</Tag>
              <span className="text-muted">{f.anonymous ? '匿名' : (f.from_name || '署名')}</span>
              {f.related_node_id && <span className="font-mono text-muted">{f.related_node_id}</span>}
              <button onClick={() => act(f)} className="ml-auto text-[11.5px] text-muted underline decoration-dotted hover:text-[color:var(--accent)]">处理</button>
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-secondary">{f.question}</p>
            {f.verify && <p className="mt-1 text-[12px] text-muted">提交者依据：{f.verify}</p>}
            {f.reply && <p className="mt-1 text-[12px] text-secondary"><span className="text-muted">回复：</span>{f.reply}</p>}
            {f.change && <p className="mt-1 text-[12px] text-secondary"><span className="text-muted">改动：</span>{f.change}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- 一致性检查 ----------
function LintPanel() {
  const { data, loading, error, retry } = useAsync(() => adminApi.lint(), []);
  const problems = (data?.problems || []) as { level: string; where: string; msg: string }[];
  const errs = problems.filter((p) => p.level === 'error');
  const warns = problems.filter((p) => p.level === 'warn');
  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center gap-2">
        <h2 className="font-serif text-[15px]">数据一致性检查</h2>
        <button onClick={retry} className="ml-auto rounded-sm border border-strong px-3 py-1 text-[12px] text-secondary">重新检查</button>
      </div>
      {loading && <Loading label="检查中…" />}
      {error && <ErrorState message={error} onRetry={retry} />}
      {data && (
        <>
          <div className="mb-3 flex flex-wrap gap-2 text-[12px]">
            <Tag tone={data.ok ? 'accent' : 'muted'}>{data.ok ? '✓ 通过（无错误）' : '✗ 存在错误'}</Tag>
            {data.counts && <Tag tone="muted">节点 {data.counts.nodes} · 关系 {data.counts.relations} · 来源 {data.counts.sources}</Tag>}
            <Tag tone="muted">错误 {errs.length} · 警告 {warns.length}</Tag>
          </div>
          <p className="mb-3 text-[12px] leading-relaxed text-muted">
            检查项：正式节点是否有来源、引用的来源是否存在、关系两端节点是否存在、relation_type 是否在受控词表内、
            taught_in 是否标注覆盖程度、推断关系是否附推理链、孤立节点。等价于命令行 <code className="font-mono">npm run lint:data</code>。
          </p>
          {problems.length === 0 ? (
            <EmptyState title="没有发现问题" hint="所有节点、关系与来源引用均一致。" />
          ) : (
            <ul className="max-h-[55vh] space-y-1 overflow-y-auto pr-1">
              {problems.map((p, i) => (
                <li key={i} className={'flex items-baseline gap-2 rounded-sm px-2.5 py-1.5 text-[12px] ' + (p.level === 'error' ? 'bg-[color:var(--ev-partial-bg)]' : 'bg-[color:var(--surface-sunken)]')}>
                  <span className={'font-mono text-[10.5px] ' + (p.level === 'error' ? 'text-[color:var(--ev-partial)]' : 'text-muted')}>{p.level === 'error' ? 'ERR' : 'WARN'}</span>
                  <span className="font-mono text-[10.5px] text-muted">{p.where}</span>
                  <span className="text-secondary">{p.msg}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}