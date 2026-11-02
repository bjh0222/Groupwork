// 管理端写操作层：公开只读与管理写入严格分离。
// 管理令牌通过环境变量 ADMIN_TOKEN 配置；未配置时管理端写操作全部禁用（默认安全）。
import { getDb, j, parseNode, parseRel, parseSrc } from './db.mjs';

export const EVIDENCE = ['已核实', '部分核实', '推断', '待核实'];
export const KSTAT = ['未评估', '已初步理解', '已经尝试', '待深入学习'];
export const REL_TYPES = [
  'solves', 'based_on', 'implemented_by', 'requires_knowledge', 'alternative_to', 'complements', 'evaluated_by',
  '提出', '采用', '依赖', '改进', '质疑',
  'taught_in', 'enables_practice', '资助', '付费', '提供', '定价', '合作', '竞争', '孵化', '开源',
  '分析', '修正认识', '支撑习惯', '记录于'
];
export const COVERAGE = ['前置基础', '核心覆盖', '部分涉及', '实践应用', '自主拓展'];
export const NODE_TYPES = [
  'task', 'problem', 'concept', 'approach', 'tool', 'model', 'resource',
  'requirement', 'ability', 'course', 'pathway',
  'participant', 'org', 'company', 'lab', 'community', 'conference', 'paper', 'dataset', 'user', 'cost',
  'method', 'habit', 'case', 'revision', 'principle'
];

export function adminEnabled() { return !!process.env.ADMIN_TOKEN && process.env.ADMIN_TOKEN.length >= 12; }

export function checkAdmin(req) {
  if (!adminEnabled()) return { ok: false, code: 'admin_disabled', message: '管理端未启用：服务端未配置 ADMIN_TOKEN（长度需 >= 12）。' };
  const h = req.get('x-admin-token') || '';
  const auth = req.get('authorization') || '';
  const token = h || (auth.startsWith('Bearer ') ? auth.slice(7) : '');
  if (!token) return { ok: false, code: 'missing_token', message: '缺少管理员令牌。' };
  if (token !== process.env.ADMIN_TOKEN) return { ok: false, code: 'forbidden', message: '管理员令牌无效。' };
  return { ok: true };
}

const nowIso = () => new Date().toISOString();
const today = () => nowIso().slice(0, 10);

function logUpdate({ object_type, object_id, change, reason, evidence, updated_by, source_ids }) {
  getDb().prepare(`INSERT INTO update_log (date, object_type, object_id, evidence, change, reason, updated_by, source_ids, created_at)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(today(), object_type, object_id || null, evidence || null,
      change, reason || null, updated_by || 'admin', j(source_ids || []), nowIso());
}

// ---------- 校验 ----------
function asArr(v, fallback = []) {
  if (Array.isArray(v)) return v;
  if (v == null || v === '') return fallback;
  if (typeof v === 'string') { try { const p = JSON.parse(v); return Array.isArray(p) ? p : [v]; } catch { return v.split(',').map((s) => s.trim()).filter(Boolean); } }
  return fallback;
}

export function validateNode(body, { partial = false } = {}) {
  const errs = [];
  const get = (k) => body?.[k];
  if (!partial || 'id' in (body || {})) {
    const id = get('id');
    if (!id || !/^[A-Za-z0-9._-]{2,64}$/.test(id)) errs.push('id 必须为 2-64 位字母数字或 . _ -');
  }
  if (!partial || 'title' in (body || {})) {
    if (!get('title') || String(get('title')).length > 200) errs.push('title 必填且不超过 200 字');
  }
  if (!partial || 'map_type' in (body || {})) {
    if (!['domain', 'ecosystem', 'cognition'].includes(get('map_type'))) errs.push('map_type 必须是 domain/ecosystem/cognition');
  }
  if (!partial || 'node_type' in (body || {})) {
    if (!NODE_TYPES.includes(get('node_type'))) errs.push('node_type 不在受控词表内: ' + get('node_type'));
  }
  if (!partial || 'summary' in (body || {})) {
    const s = get('summary');
    if (!s || String(s).length < 8) errs.push('summary 必填且不少于 8 字');
    if (s && String(s).length > 600) errs.push('summary 不超过 600 字');
  }
  if ('evidence_status' in (body || {}) && !EVIDENCE.includes(get('evidence_status'))) errs.push('evidence_status 不在四级状态内');
  if ('knowledge_status' in (body || {}) && !KSTAT.includes(get('knowledge_status'))) errs.push('knowledge_status 不在受控词表内');
  if ('details' in (body || {}) && !Array.isArray(asArr(get('details'), null)) && get('details') != null) errs.push('details 必须是数组');
  // 正式节点必须有来源依据（方案 3.1 / lint 规则）。
  // 此前遗漏该校验，导致管理端可写入 lint 判为 error 的数据（实测：空 source_ids 也能保存成功）。
  // 例外：候选内容（is_candidate）与项目自定义分析框架节点，后者要求显式写明 evidence_note 说明性质。
  const srcIds = asArr(get('source_ids'));
  const isCandidate = !!get('is_candidate');
  if (!isCandidate && srcIds.length === 0) {
    if (!get('evidence_note') || String(get('evidence_note')).trim().length < 8) {
      errs.push('正式节点必须有来源依据（source_ids）；若属项目自定义分析框架而无外部来源，需在 evidence_note 中说明其性质（不少于 8 字）');
    }
  }
  return errs;
}

export function validateRelation(body) {
  const errs = [];
  const d = getDb();
  if (!body?.source_node_id || !d.prepare('SELECT 1 FROM nodes WHERE id=?').get(body.source_node_id)) errs.push('source_node_id 不存在');
  if (!body?.target_node_id || !d.prepare('SELECT 1 FROM nodes WHERE id=?').get(body.target_node_id)) errs.push('target_node_id 不存在');
  if (body?.source_node_id && body.source_node_id === body.target_node_id) errs.push('不允许自环关系');
  if (!REL_TYPES.includes(body?.relation_type)) errs.push('relation_type 不在受控词表内: ' + body?.relation_type);
  if (!body?.description || String(body.description).length < 4) errs.push('description 必填且不少于 4 字');
  if ('evidence_status' in (body || {}) && !EVIDENCE.includes(body.evidence_status)) errs.push('evidence_status 不在四级状态内');
  if (body?.coverage && !COVERAGE.includes(body.coverage)) errs.push('coverage 不在五档覆盖程度内');
  if (body?.relation_type === 'taught_in' && !body?.coverage) errs.push('taught_in 关系必须说明覆盖程度（coverage）');
  if (body?.evidence_status === '推断' && !body?.reasoning_chain) errs.push('推断关系必须给出推理链（reasoning_chain）');
  return errs;
}

export function validateSource(body) {
  const errs = [];
  if (!body?.id || !/^S-\d{2,4}$/.test(body.id)) errs.push('id 格式应为 S-NN');
  if (!body?.title) errs.push('title 必填');
  if (!body?.accessed_at || !/^\d{4}-\d{2}-\d{2}$/.test(body.accessed_at)) errs.push('accessed_at 必填，格式 YYYY-MM-DD');
  const TYPES = ['paper', 'official_doc', 'pricing', 'curriculum', 'project_doc', 'community', 'benchmark', 'tool_doc'];
  if (!TYPES.includes(body?.source_type)) errs.push('source_type 不在受控词表内');
  if (body?.url && !/^(https?:\/\/|file:\/\/\/)/.test(body.url)) errs.push('url 必须是 http(s):// 或 file:/// 开头');
  if (body?.published_at && !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(body.published_at)) errs.push('published_at 格式应为 YYYY 或 YYYY-MM-DD');
  return errs;
}

// ---------- 写操作 ----------
export function upsertNode(body, actor = 'admin') {
  const errs = validateNode(body);
  if (errs.length) return { ok: false, errors: errs };
  const d = getDb();
  const existing = d.prepare('SELECT * FROM nodes WHERE id=?').get(body.id);
  const row = {
    id: body.id,
    title: body.title,
    map_type: body.map_type,
    node_type: body.node_type,
    section: body.section ?? existing?.section ?? null,
    summary: body.summary,
    details: j(asArr(body.details)),
    tags: j(asArr(body.tags)),
    source_ids: j(asArr(body.source_ids)),
    evidence_status: body.evidence_status ?? existing?.evidence_status ?? '待核实',
    evidence_note: body.evidence_note ?? existing?.evidence_note ?? null,
    knowledge_status: body.knowledge_status ?? existing?.knowledge_status ?? '未评估',
    career_tracks: j(asArr(body.career_tracks, ['all'])),
    participant_role: body.participant_role ?? existing?.participant_role ?? null,
    chain: body.chain ?? existing?.chain ?? null,
    cost_side: body.cost_side ?? existing?.cost_side ?? null,
    method_ref: body.method_ref ?? existing?.method_ref ?? null,
    case_ref: body.case_ref ?? existing?.case_ref ?? null,
    last_checked: body.last_checked ?? existing?.last_checked ?? today(),
    fast_variable: body.fast_variable ? 1 : 0,
    limit_note: body.limit ?? body.limit_note ?? existing?.limit_note ?? null,
    is_candidate: body.is_candidate ? 1 : 0,
    status: body.status ?? existing?.status ?? 'published'
  };
  // 来源引用完整性
  for (const sid of asArr(body.source_ids)) {
    if (!d.prepare('SELECT 1 FROM sources WHERE id=?').get(sid)) return { ok: false, errors: ['source_ids 中的 ' + sid + ' 不存在，请先创建来源'] };
  }
  if (existing) {
    d.prepare(`UPDATE nodes SET title=?, map_type=?, node_type=?, section=?, summary=?, details=?, tags=?, source_ids=?,
      evidence_status=?, evidence_note=?, knowledge_status=?, career_tracks=?, participant_role=?, chain=?, cost_side=?,
      method_ref=?, case_ref=?, last_checked=?, fast_variable=?, limit_note=?, is_candidate=?, status=?, updated_at=? WHERE id=?`)
      .run(row.title, row.map_type, row.node_type, row.section, row.summary, row.details, row.tags, row.source_ids,
        row.evidence_status, row.evidence_note, row.knowledge_status, row.career_tracks, row.participant_role, row.chain,
        row.cost_side, row.method_ref, row.case_ref, row.last_checked, row.fast_variable, row.limit_note,
        row.is_candidate, row.status, nowIso(), row.id);
  } else {
    d.prepare(`INSERT INTO nodes (id,title,map_type,node_type,section,summary,details,tags,source_ids,evidence_status,
      evidence_note,knowledge_status,career_tracks,participant_role,chain,cost_side,method_ref,case_ref,last_checked,
      fast_variable,limit_note,is_candidate,status,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(row.id, row.title, row.map_type, row.node_type, row.section, row.summary, row.details, row.tags, row.source_ids,
        row.evidence_status, row.evidence_note, row.knowledge_status, row.career_tracks, row.participant_role, row.chain,
        row.cost_side, row.method_ref, row.case_ref, row.last_checked, row.fast_variable, row.limit_note,
        row.is_candidate, row.status, nowIso(), nowIso());
  }
  logUpdate({ object_type: 'node', object_id: row.id, updated_by: actor,
    change: (existing ? '更新节点 ' : '新增节点 ') + row.id + '「' + row.title + '」（证据状态 ' + row.evidence_status + '）',
    reason: body.reason || null, evidence: body.evidence_note || null, source_ids: asArr(body.source_ids) });
  return { ok: true, node: parseNode(d.prepare('SELECT * FROM nodes WHERE id=?').get(row.id)) };
}

export function deleteNode(id, actor = 'admin', reason = null) {
  const d = getDb();
  const existing = d.prepare('SELECT * FROM nodes WHERE id=?').get(id);
  if (!existing) return { ok: false, errors: ['节点不存在'] };
  d.prepare('DELETE FROM relations WHERE source_node_id=? OR target_node_id=?').run(id, id);
  d.prepare('DELETE FROM nodes WHERE id=?').run(id);
  logUpdate({ object_type: 'node', object_id: id, updated_by: actor, change: '下架节点 ' + id + '「' + parseNode(existing).title + '」', reason });
  return { ok: true };
}

export function upsertRelation(body, actor = 'admin') {
  const errs = validateRelation(body);
  if (errs.length) return { ok: false, errors: errs };
  const d = getDb();
  const id = body.id || ('R-' + body.source_node_id + '--' + body.relation_type + '--' + body.target_node_id);
  for (const sid of asArr(body.source_ids)) {
    if (!d.prepare('SELECT 1 FROM sources WHERE id=?').get(sid)) return { ok: false, errors: ['source_ids 中的 ' + sid + ' 不存在'] };
  }
  const existing = d.prepare('SELECT * FROM relations WHERE id=?').get(id);
  const vals = [body.source_node_id, body.target_node_id, body.relation_type, body.coverage ?? null, body.description,
    body.reasoning_chain ?? null, j(asArr(body.source_ids)), body.evidence_status ?? '待核实',
    body.checked_at ?? today(), body.direction_hint ?? null];
  if (existing) {
    d.prepare(`UPDATE relations SET source_node_id=?, target_node_id=?, relation_type=?, coverage=?, description=?,
      reasoning_chain=?, source_ids=?, evidence_status=?, checked_at=?, direction_hint=? WHERE id=?`)
      .run(...vals, id);
  } else {
    d.prepare(`INSERT INTO relations (id,source_node_id,target_node_id,relation_type,coverage,description,reasoning_chain,
      source_ids,evidence_status,checked_at,direction_hint) VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(id, ...vals);
  }
  logUpdate({ object_type: 'relation', object_id: id, updated_by: actor,
    change: (existing ? '更新关系 ' : '新增关系 ') + body.source_node_id + ' —' + body.relation_type + '→ ' + body.target_node_id,
    reason: body.reason || null, source_ids: asArr(body.source_ids) });
  return { ok: true, relation: parseRel(d.prepare('SELECT * FROM relations WHERE id=?').get(id)) };
}

export function deleteRelation(id, actor = 'admin', reason = null) {
  const d = getDb();
  const ex = d.prepare('SELECT * FROM relations WHERE id=?').get(id);
  if (!ex) return { ok: false, errors: ['关系不存在'] };
  d.prepare('DELETE FROM relations WHERE id=?').run(id);
  logUpdate({ object_type: 'relation', object_id: id, updated_by: actor, change: '删除关系 ' + id, reason });
  return { ok: true };
}

export function upsertSource(body, actor = 'admin') {
  const errs = validateSource(body);
  if (errs.length) return { ok: false, errors: errs };
  const d = getDb();
  const ex = d.prepare('SELECT * FROM sources WHERE id=?').get(body.id);
  const vals = [body.title, body.publisher ?? null, body.author ?? null, body.url ?? null, body.published_at ?? null,
    body.accessed_at, body.source_type, j(asArr(body.supports)), body.notes ?? null];
  if (ex) d.prepare(`UPDATE sources SET title=?,publisher=?,author=?,url=?,published_at=?,accessed_at=?,source_type=?,supports=?,notes=? WHERE id=?`).run(...vals, body.id);
  else d.prepare(`INSERT INTO sources (id,title,publisher,author,url,published_at,accessed_at,source_type,supports,notes) VALUES (?,?,?,?,?,?,?,?,?,?)`).run(body.id, ...vals);
  logUpdate({ object_type: 'source', object_id: body.id, updated_by: actor,
    change: (ex ? '更新来源 ' : '新增来源 ') + body.id + '《' + body.title + '》', reason: body.reason || null });
  return { ok: true, source: parseSrc(d.prepare('SELECT * FROM sources WHERE id=?').get(body.id)) };
}

export function deleteSource(id, actor = 'admin', reason = null) {
  const d = getDb();
  const used = d.prepare("SELECT id FROM nodes WHERE source_ids LIKE ?").get('%"' + id + '"%');
  if (used) return { ok: false, errors: ['来源 ' + id + ' 仍被节点 ' + used.id + ' 引用，请先解除引用'] };
  const ex = d.prepare('SELECT * FROM sources WHERE id=?').get(id);
  if (!ex) return { ok: false, errors: ['来源不存在'] };
  d.prepare('DELETE FROM sources WHERE id=?').run(id);
  logUpdate({ object_type: 'source', object_id: id, updated_by: actor, change: '删除来源 ' + id, reason });
  return { ok: true };
}

// ---------- 候选内容池 ----------
export function addCandidate(body) {
  const content = String(body?.content || '').trim();
  if (!content || content.length > 4000) return { ok: false, errors: ['content 必填且不超过 4000 字'] };
  const d = getDb();
  const r = d.prepare(`INSERT INTO candidate_content (content, source_hint, found_by, found_at, review_status, target_map)
    VALUES (?,?,?,?,'待审核',?)`).run(content, body.source_hint || null, body.found_by || 'visitor', nowIso(),
      ['domain', 'ecosystem', 'cognition'].includes(body.target_map) ? body.target_map : null);
  return { ok: true, id: Number(r.lastInsertRowid) };
}

export function reviewCandidate(id, { review_status, reviewed_by, rejection_reason }, actor = 'admin') {
  if (!['待审核', '已通过', '已淘汰'].includes(review_status)) return { ok: false, errors: ['review_status 非法'] };
  if (review_status === '已淘汰' && !rejection_reason) return { ok: false, errors: ['淘汰必须填写原因'] };
  const d = getDb();
  const ex = d.prepare('SELECT * FROM candidate_content WHERE id=?').get(Number(id));
  if (!ex) return { ok: false, errors: ['候选记录不存在'] };
  d.prepare('UPDATE candidate_content SET review_status=?, reviewed_by=?, reviewed_at=?, rejection_reason=? WHERE id=?')
    .run(review_status, reviewed_by || actor, nowIso(), rejection_reason || null, Number(id));
  logUpdate({ object_type: 'candidate', object_id: String(id), updated_by: actor,
    change: '候选内容 #' + id + ' 审核为「' + review_status + '」', reason: rejection_reason || null });
  return { ok: true };
}

// ---------- 反馈 ----------
export function addFeedback(body) {
  const q = String(body?.question || '').trim();
  if (!q || q.length > 2000) return { ok: false, errors: ['question 必填且不超过 2000 字'] };
  const d = getDb();
  if (body.related_node_id && !d.prepare('SELECT 1 FROM nodes WHERE id=?').get(body.related_node_id)) {
    return { ok: false, errors: ['related_node_id 不存在'] };
  }
  const anon = body.anonymous === false ? 0 : 1;
  const from = anon ? null : String(body.from_name || '').slice(0, 60) || null;
  // created_at 为 NOT NULL 且无默认值，必须显式提供（此前遗漏导致提交反馈 500）
  const r = d.prepare(`INSERT INTO feedback (date, from_name, anonymous, question, verify, change, reason, status, related_node_id, created_at)
    VALUES (?,?,?,?,?,?,?,'待处理',?,?)`).run(today(), from, anon, q,
      body.verify ? String(body.verify).slice(0, 1000) : null,
      body.change ? String(body.change).slice(0, 1000) : null,
      body.reason ? String(body.reason).slice(0, 1000) : null,
      body.related_node_id || null, nowIso());
  logUpdate({ object_type: 'feedback', object_id: String(r.lastInsertRowid), updated_by: anon ? '匿名访问者' : (from || '访问者'),
    change: '收到新反馈：' + q.slice(0, 80) + (q.length > 80 ? '…' : '') });
  return { ok: true, id: Number(r.lastInsertRowid) };
}

export function updateFeedback(id, { status, reply, change, reason }, actor = 'admin') {
  const STAT = ['待处理', '已采纳', '已回复', '未采纳', '转候选'];
  if (status && !STAT.includes(status)) return { ok: false, errors: ['status 非法'] };
  const d = getDb();
  const ex = d.prepare('SELECT * FROM feedback WHERE id=?').get(Number(id));
  if (!ex) return { ok: false, errors: ['反馈不存在'] };
  d.prepare('UPDATE feedback SET status=?, reply=?, change=?, reason=? WHERE id=?')
    .run(status || ex.status, reply ?? ex.reply, change ?? ex.change, reason ?? ex.reason, Number(id));
  logUpdate({ object_type: 'feedback', object_id: String(id), updated_by: actor,
    change: '反馈 #' + id + ' 状态改为「' + (status || ex.status) + '」', reason: reason || null });
  return { ok: true };
}

// ---------- 更新记录 ----------
export function addUpdate(body, actor = 'admin') {
  if (!body?.change) return { ok: false, errors: ['change 必填'] };
  const TYPES = ['node', 'relation', 'source', 'eval', 'feedback', 'candidate', 'system'];
  if (body.object_type && !TYPES.includes(body.object_type)) return { ok: false, errors: ['object_type 非法'] };
  logUpdate({ object_type: body.object_type || 'system', object_id: body.object_id || null, updated_by: actor,
    change: String(body.change).slice(0, 1000), reason: body.reason || null, evidence: body.evidence || null,
    source_ids: asArr(body.source_ids) });
  return { ok: true };
}

// ---------- 数据一致性校验（也可由 npm run lint:data 调用）----------
export function lint() {
  const d = getDb();
  const problems = [];
  const nodes = d.prepare('SELECT * FROM nodes WHERE is_candidate=0').all().map(parseNode);
  const ids = new Set(nodes.map((n) => n.id));
  const srcIds = new Set(d.prepare('SELECT id FROM sources').all().map((r) => r.id));
  const rels = d.prepare('SELECT * FROM relations').all().map(parseRel);

  for (const n of nodes) {
    if (!n.source_ids || !n.source_ids.length) problems.push({ level: 'error', where: n.id, msg: '正式节点缺少来源' });
    for (const s of n.source_ids || []) if (!srcIds.has(s)) problems.push({ level: 'error', where: n.id, msg: '引用了不存在的来源 ' + s });
    if (!n.summary || n.summary.length < 8) problems.push({ level: 'error', where: n.id, msg: 'summary 过短' });
    if (!n.details || !n.details.length) problems.push({ level: 'warn', where: n.id, msg: '缺少 details' });
    if (n.evidence_status === '推断' && !n.evidence_note) problems.push({ level: 'warn', where: n.id, msg: '推断状态建议附推理说明' });
    if (n.evidence_status === '待核实' && !n.evidence_note) problems.push({ level: 'warn', where: n.id, msg: '待核实建议说明缺口原因' });
  }
  const relCount = new Map();
  for (const n of nodes) relCount.set(n.id, 0);
  for (const r of rels) {
    if (!ids.has(r.source_node_id)) problems.push({ level: 'error', where: r.id, msg: '关系源节点不存在 ' + r.source_node_id });
    if (!ids.has(r.target_node_id)) problems.push({ level: 'error', where: r.id, msg: '关系目标节点不存在 ' + r.target_node_id });
    if (!REL_TYPES.includes(r.relation_type)) problems.push({ level: 'error', where: r.id, msg: 'relation_type 超出受控词表: ' + r.relation_type });
    if (r.relation_type === 'taught_in' && !r.coverage) problems.push({ level: 'error', where: r.id, msg: 'taught_in 缺少 coverage' });
    if (r.evidence_status === '推断' && !r.reasoning_chain) problems.push({ level: 'error', where: r.id, msg: '推断关系缺少推理链' });
    for (const s of r.source_ids || []) if (!srcIds.has(s)) problems.push({ level: 'error', where: r.id, msg: '关系引用了不存在的来源 ' + s });
    relCount.set(r.source_node_id, (relCount.get(r.source_node_id) || 0) + 1);
    relCount.set(r.target_node_id, (relCount.get(r.target_node_id) || 0) + 1);
  }
  for (const n of nodes) {
    if ((relCount.get(n.id) || 0) === 0) problems.push({ level: 'warn', where: n.id, msg: '孤立节点（无任何关系）' });
  }
  return { ok: problems.filter((p) => p.level === 'error').length === 0, problems,
    counts: { nodes: nodes.length, relations: rels.length, sources: srcIds.size } };
}