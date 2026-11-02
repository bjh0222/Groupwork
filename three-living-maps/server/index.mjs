// Express 服务：公开只读 API + AI 助手 + 反馈 + 受控管理端 + 静态资源。
// 安全要点：密钥只在服务端；生产日志不记录密钥；管理写操作需 ADMIN_TOKEN；全局限流。
// 必须为第一个 import：env 在模块顶层完成加载（见 server/lib/env.mjs 注释）
import './lib/env.mjs';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getDb, listNodes, getNode, listRelations, listSources, listUpdateLog, listFeedback,
  listCandidates, stats, j, parseSrc
} from './lib/db.mjs';
import { search, buildContext } from './lib/retrieval.mjs';
import { ask, validateQuestion, rateLimit, aiStatus, sanitize, MAX_QUESTION_LEN } from './lib/ai.mjs';
import {
  adminEnabled, checkAdmin, upsertNode, deleteNode, upsertRelation, deleteRelation,
  upsertSource, deleteSource, addCandidate, reviewCandidate, addFeedback, updateFeedback,
  addUpdate, lint, REL_TYPES, COVERAGE, EVIDENCE, KSTAT, NODE_TYPES
} from './lib/admin.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'web', 'dist');
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', true);
app.use(express.json({ limit: '256kb' }));

// ---------- 安全响应头 ----------
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'"
  ].join('; '));
  if (NODE_ENV === 'production') res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// ---------- 极简访问日志（不记录密钥与完整问题文本）----------
app.use((req, res, next) => {
  const t = Date.now();
  res.on('finish', () => {
    if (req.path.startsWith('/api/health')) return;
    const line = `${new Date().toISOString()} ${req.method} ${req.path} ${res.statusCode} ${Date.now() - t}ms`;
    if (NODE_ENV !== 'production') console.log(line);
  });
  next();
});

// ---------- 全局限流（内存版；单实例足够）----------
function globalRate(max, windowMs) {
  const hits = new Map();
  return (req, res, next) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (arr.length >= max) {
      res.setHeader('Retry-After', String(Math.ceil(windowMs / 1000)));
      return res.status(429).json({ ok: false, error: 'rate_limited', message: '请求过于频繁，请稍后再试。' });
    }
    arr.push(now); hits.set(key, arr);
    if (hits.size > 5000) for (const [k, v] of hits) if (!v.length) hits.delete(k);
    next();
  };
}
app.use('/api/', globalRate(Number(process.env.API_RATE_PER_MIN || 240), 60_000));

const clientKey = (req) => (req.get('x-forwarded-for') || req.ip || 'local').split(',')[0].trim();

// ---------- 公开只读 API ----------
app.get('/api/health', (req, res) => {
  try { getDb(); } catch (e) { return res.status(500).json({ ok: false, error: 'db_unavailable', message: sanitize(e.message) }); }
  res.json({ ok: true, time: new Date().toISOString(), node: process.version, env: NODE_ENV, ai: aiStatus().enabled, admin: adminEnabled() });
});

app.get('/api/meta', (req, res) => {
  res.json({
    ok: true,
    relation_types: REL_TYPES, coverage: COVERAGE, evidence_status: EVIDENCE,
    knowledge_status: KSTAT, node_types: NODE_TYPES,
    ai: aiStatus(), admin_enabled: adminEnabled(),
    max_question_len: MAX_QUESTION_LEN,
    stats: stats()
  });
});

app.get('/api/nodes', (req, res) => {
  const { map, type, q, track, evidence, status } = req.query;
  const rows = listNodes({
    mapType: str(map), nodeType: str(type), search: str(q), careerTrack: str(track),
    evidence: str(evidence), status: status ? str(status) : 'published'
  });
  res.json({ ok: true, count: rows.length, nodes: rows });
});

app.get('/api/nodes/:id', (req, res) => {
  const n = getNode(req.params.id);
  if (!n) return res.status(404).json({ ok: false, error: 'not_found', message: '节点不存在：' + req.params.id });
  const rels = listRelations({ nodeId: n.id });
  const byId = new Map(listNodes({ status: null }).filter((x) => !x.is_candidate).map((x) => [x.id, x]));
  const all = rels.map((r) => ({
    ...r,
    direction: r.source_node_id === n.id ? 'out' : 'in',
    other_id: r.source_node_id === n.id ? r.target_node_id : r.source_node_id,
    other_title: (byId.get(r.source_node_id === n.id ? r.target_node_id : r.source_node_id) || {}).title || null,
    other_map: (byId.get(r.source_node_id === n.id ? r.target_node_id : r.source_node_id) || {}).map_type || null,
    other_type: (byId.get(r.source_node_id === n.id ? r.target_node_id : r.source_node_id) || {}).node_type || null
  }));
  const sources = (n.source_ids || []).map((sid) => parseSrc(getDb().prepare('SELECT * FROM sources WHERE id=?').get(sid) || null)).filter(Boolean);
  // 「继续探索」推荐：前置知识 / 相关任务 / 工具 / 论文 / 生态关系 / 实践案例
  const explore = buildExplore(n, all, byId);
  res.json({ ok: true, node: n, relations: all, sources, explore });
});

function str(v) { return typeof v === 'string' && v.trim() ? v.trim() : null; }

function buildExplore(n, rels, byId) {
  const groups = { prerequisites: [], related_tasks: [], tools: [], papers: [], ecosystem: [], practices: [] };
  const seen = new Set();
  const push = (arr, r) => {
    const id = r.other_id;
    if (!id || seen.has(arr.name + id)) return;
    seen.add(arr.name + id);
    arr.push({ id, title: r.other_title, map_type: r.other_map, node_type: r.other_type, relation_type: r.relation_type, evidence_status: r.evidence_status });
  };
  for (const r of rels) {
    const other = byId.get(r.other_id);
    if (!other) continue;
    const t = other.node_type;
    if (r.relation_type === 'requires_knowledge' || r.relation_type === 'based_on' || r.relation_type === '前置基础') push(groups.prerequisites, r);
    else if (t === 'task' || t === 'problem') push(groups.related_tasks, r);
    else if (t === 'tool' || t === 'model') push(groups.tools, r);
    else if (t === 'paper') push(groups.papers, r);
    else if (other.map_type === 'ecosystem' || r.relation_type === '提出' || r.relation_type === '开源') push(groups.ecosystem, r);
    else if (t === 'case' || t === 'habit' || t === 'resource' || other.map_type === 'cognition') push(groups.practices, r);
    else push(groups.related_tasks, r);
  }
  return groups;
}

app.get('/api/relations', (req, res) => {
  const { node, type } = req.query;
  const rows = listRelations({ nodeId: str(node), relationType: str(type) });
  res.json({ ok: true, count: rows.length, relations: rows });
});

app.get('/api/sources', (req, res) => {
  const { id, type } = req.query;
  if (id) {
    const s = parseSrc(getDb().prepare('SELECT * FROM sources WHERE id=?').get(String(id)) || null);
    if (!s) return res.status(404).json({ ok: false, error: 'not_found', message: '来源不存在' });
    const usedBy = getDb().prepare("SELECT id,title,map_type,node_type FROM nodes WHERE source_ids LIKE ? AND is_candidate=0").all('%"' + s.id + '"%');
    return res.json({ ok: true, source: s, used_by: usedBy });
  }
  const rows = listSources({ sourceType: str(type) });
  res.json({ ok: true, count: rows.length, sources: rows });
});

app.get('/api/search', (req, res) => {
  const q = str(req.query.q);
  if (!q) return res.json({ ok: true, query: '', hits: [], total: 0, message: '请输入关键词。' });
  if (q.length > 200) return res.status(400).json({ ok: false, error: 'too_long', message: '搜索词过长（上限 200 字）。' });
  const map = str(req.query.map);
  const r = search(q, { limit: Math.min(Number(req.query.limit) || 20, 50), mapTypes: map ? [map] : null });
  res.json({ ok: true, ...r });
});

app.get('/api/graph', (req, res) => {
  const map = str(req.query.map);
  const nodes = listNodes({ mapType: map });
  const ids = new Set(nodes.map((n) => n.id));
  const rels = listRelations().filter((r) => ids.has(r.source_node_id) || ids.has(r.target_node_id));
  res.json({ ok: true, nodes: nodes.map((n) => ({
    id: n.id, title: n.title, map_type: n.map_type, node_type: n.node_type, section: n.section,
    evidence_status: n.evidence_status, career_tracks: n.career_tracks, fast_variable: n.fast_variable,
    stale: n.stale, summary: n.summary, participant_role: n.participant_role, chain: n.chain
  })), relations: rels });
});

app.get('/api/updates', (req, res) => {
  const rows = listUpdateLog({ limit: Math.min(Number(req.query.limit) || 200, 500), objectType: str(req.query.type) });
  res.json({ ok: true, count: rows.length, updates: rows.map((r) => ({ ...r, source_ids: safeJson(r.source_ids) })) });
});

app.get('/api/feedback', (req, res) => {
  const rows = listFeedback({ status: str(req.query.status) });
  res.json({ ok: true, count: rows.length, feedback: rows.map(redactFeedback) });
});

app.get('/api/candidates', (req, res) => {
  const rows = listCandidates({ status: str(req.query.status) });
  res.json({ ok: true, count: rows.length, candidates: rows });
});

app.get('/api/eval', (req, res) => {
  const d = getDb();
  const items = d.prepare('SELECT * FROM eval_items WHERE active=1 ORDER BY id').all().map((r) => ({
    ...r, reference_points: safeJson(r.reference_points), source_ids: safeJson(r.source_ids), expected_nodes: safeJson(r.expected_nodes)
  }));
  const runs = d.prepare('SELECT * FROM eval_runs ORDER BY id DESC LIMIT 10').all().map((r) => ({
    ...r, scores: safeJson(r.scores), items: safeJson(r.items), totals: safeJson(r.totals)
  }));
  res.json({ ok: true, items, runs, latest: runs[0] || null });
});

app.get('/api/stats', (req, res) => res.json({ ok: true, stats: stats() }));

function safeJson(v) { if (v == null) return null; if (typeof v !== 'string') return v; try { return JSON.parse(v); } catch { return v; } }
function redactFeedback(f) {
  const o = { ...f };
  if (o.anonymous) { o.from_name = null; }
  return o;
}

// ---------- 反馈提交（公开，限流，允许匿名）----------
const fbRate = globalRate(Number(process.env.FEEDBACK_RATE_PER_MIN || 6), 60_000);
app.post('/api/feedback', fbRate, (req, res) => {
  const r = addFeedback(req.body || {});
  if (!r.ok) return res.status(400).json({ ok: false, error: 'validation', messages: r.errors });
  res.json({ ok: true, id: r.id, message: '感谢反馈！我们会在核实后处理，处理结果会显示在「反馈与更新」页面。' });
});

// ---------- 候选内容提交（公开，限流）----------
const candRate = globalRate(Number(process.env.CANDIDATE_RATE_PER_MIN || 6), 60_000);
app.post('/api/candidates', candRate, (req, res) => {
  const r = addCandidate(req.body || {});
  if (!r.ok) return res.status(400).json({ ok: false, error: 'validation', messages: r.errors });
  res.json({ ok: true, id: r.id, message: '已加入候选内容池，需经来源检查与逻辑检查后才会进入正式地图。' });
});

// ---------- AI 助手（地图约束的概念查询与解释）----------
const aiRate = globalRate(Number(process.env.AI_RATE_PER_MIN || 10), 60_000);
app.post('/api/ai/ask', aiRate, async (req, res) => {
  const v = validateQuestion((req.body || {}).question);
  if (!v.ok) return res.status(400).json({ ok: false, error: v.code, message: v.message });

  const rl = rateLimit(clientKey(req) + ':ai');
  if (!rl.ok) return res.status(429).json({ ok: false, error: 'rate_limited', message: 'AI 请求过于频繁，请在 ' + rl.retryAfterSec + ' 秒后再试。', retry_after_sec: rl.retryAfterSec });

  try {
    const ctx = buildContext(v.question, { topK: Number(req.body.top_k) || 5 });
    const out = await ask(v.question, ctx, { clientKey: clientKey(req) });
    res.json({
      ok: true,
      question: v.question,
      ...out,
      context: {
        total_hits: ctx.total_hits,
        synonym_hits: ctx.synonymHits,
        confidence: Math.round((ctx.confidence || 0) * 100) / 100,
        node_ids: ctx.node_ids,
        sources: (ctx.sources || []).map((s) => ({ id: s.source_id, title: s.title, url: s.url, accessed_at: s.accessed_at }))
      }
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'ai_error', message: sanitize(e.message || String(e)) });
  }
});

app.get('/api/ai/status', (req, res) => res.json({ ok: true, ...aiStatus() }));

// ---------- 管理端（写权限，需 ADMIN_TOKEN）----------
const admin = express.Router();
admin.use((req, res, next) => {
  const c = checkAdmin(req);
  if (!c.ok) {
    const code = c.code === 'forbidden' || c.code === 'missing_token' ? 403 : 501;
    return res.status(code).json({ ok: false, error: c.code, message: c.message });
  }
  next();
});
admin.use(globalRate(Number(process.env.ADMIN_RATE_PER_MIN || 120), 60_000));

admin.post('/nodes', (req, res) => {
  const r = upsertNode(req.body || {}, 'admin');
  res.status(r.ok ? 200 : 400).json(r.ok ? { ok: true, node: r.node } : { ok: false, error: 'validation', messages: r.errors });
});
admin.delete('/nodes/:id', (req, res) => {
  const r = deleteNode(req.params.id, 'admin', req.body?.reason || req.query.reason || null);
  res.status(r.ok ? 200 : 400).json(r.ok ? { ok: true } : { ok: false, messages: r.errors });
});
admin.post('/relations', (req, res) => {
  const r = upsertRelation(req.body || {}, 'admin');
  res.status(r.ok ? 200 : 400).json(r.ok ? { ok: true, relation: r.relation } : { ok: false, error: 'validation', messages: r.errors });
});
admin.delete('/relations/:id', (req, res) => {
  const r = deleteRelation(req.params.id, 'admin', req.body?.reason || null);
  res.status(r.ok ? 200 : 400).json(r.ok ? { ok: true } : { ok: false, messages: r.errors });
});
admin.post('/sources', (req, res) => {
  const r = upsertSource(req.body || {}, 'admin');
  res.status(r.ok ? 200 : 400).json(r.ok ? { ok: true, source: r.source } : { ok: false, error: 'validation', messages: r.errors });
});
admin.delete('/sources/:id', (req, res) => {
  const r = deleteSource(req.params.id, 'admin', req.body?.reason || null);
  res.status(r.ok ? 200 : 400).json(r.ok ? { ok: true } : { ok: false, messages: r.errors });
});
admin.post('/candidates/:id/review', (req, res) => {
  const r = reviewCandidate(req.params.id, req.body || {}, 'admin');
  res.status(r.ok ? 200 : 400).json(r.ok ? { ok: true } : { ok: false, messages: r.errors });
});
admin.post('/feedback/:id', (req, res) => {
  const r = updateFeedback(req.params.id, req.body || {}, 'admin');
  res.status(r.ok ? 200 : 400).json(r.ok ? { ok: true } : { ok: false, messages: r.errors });
});
admin.post('/updates', (req, res) => {
  const r = addUpdate(req.body || {}, 'admin');
  res.status(r.ok ? 200 : 400).json(r.ok ? { ok: true } : { ok: false, messages: r.errors });
});
admin.get('/lint', (req, res) => res.json({ ok: true, ...lint() }));
app.use('/api/admin', admin);

// ---------- 静态资源（生产构建）----------
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST, { index: false, maxAge: '1h', setHeaders: (res, p) => {
    if (/\.(js|css)$/.test(p)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } }));
}

// SPA 回退（深链接刷新不丢路由）
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  if (req.path.startsWith('/api/')) return next();
  const idx = path.join(DIST, 'index.html');
  if (!fs.existsSync(idx)) {
    return res.status(503).type('html').send(
      '<!doctype html><meta charset="utf-8"><title>三张活地图 · 尚未构建</title>' +
      '<body style="font-family:system-ui;padding:40px;line-height:1.8">' +
      '<h1>前端尚未构建</h1><p>API 已运行（<code>/api/health</code> 可用）。</p>' +
      '<p>请执行 <code>npm run build</code> 生成 <code>web/dist</code>，或用 <code>npm run dev</code> 启动开发服务器。</p></body>');
  }
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(idx);
});

// ---------- 错误处理 ----------
app.use((err, req, res, next) => {
  if (err?.type === 'entity.too.large') return res.status(413).json({ ok: false, error: 'payload_too_large', message: '请求体过大。' });
  if (err instanceof SyntaxError) return res.status(400).json({ ok: false, error: 'invalid_json', message: 'JSON 解析失败。' });
  console.error('[server]', sanitize(err?.message || String(err)));
  res.status(500).json({ ok: false, error: 'internal', message: NODE_ENV === 'production' ? '服务器内部错误。' : sanitize(err?.message || String(err)) });
});

getDb();
const server = app.listen(PORT, HOST, () => {
  console.log(`[三张活地图] API ${NODE_ENV} 已启动: http://localhost:${PORT}`);
  console.log(`[三张活地图] AI 渠道: ${aiStatus().enabled ? aiStatus().channels.map((c) => c.id + '(' + c.model + ')').join(', ') : '未配置（降级为检索直出）'}`);
  console.log(`[三张活地图] 管理端: ${adminEnabled() ? '已启用' : '未启用（设置 ADMIN_TOKEN 后开启）'}`);
});

const shutdown = (sig) => { server.close(() => { console.log('[三张活地图] 已关闭 (' + sig + ')'); process.exit(0); }); setTimeout(() => process.exit(1), 5000); };
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

export default app;