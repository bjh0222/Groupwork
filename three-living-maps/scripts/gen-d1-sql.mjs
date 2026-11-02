// 生成 D1 同步 SQL（与本地 SQLite 数据一致）。用法：
//   node scripts/gen-d1-sql.mjs          # 从种子数据生成（默认）
//   node scripts/gen-d1-sql.mjs --live   # 从当前本地库生成（含管理端修改/反馈/更新记录）
import fs from 'node:fs';
import path from 'node:path';

const LIVE = process.argv.includes('--live');
const ROOT = path.resolve(import.meta.dirname, '..');
const esc = (v) => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return String(v);
  // 数组/对象必须序列化为 JSON 字符串入库（SQLite 的 JSON 列以 TEXT 存储）。
  // 实测教训：初版对数组直接 String(v) 得到逗号拼接文本，导致 D1 中
  // sources.supports / nodes.details / tags / source_ids / career_tracks 等全部损坏，
  // 前端 parseJson 静默回退为空数组，Worker 检索因此丢失 details 文本。
  if (typeof v === 'object') return "'" + JSON.stringify(v).replace(/'/g, "''") + "'";
  return "'" + String(v).replace(/'/g, "''") + "'";
};
const J = (v) => JSON.stringify(v == null ? null : v);

let sources, allNodes, relations, evalItems, updates, feedback, candidates;
if (LIVE) {
  process.chdir(ROOT);
  const { getDb } = await import('../server/lib/db.mjs');
  const d = getDb();
  sources = d.prepare('SELECT * FROM sources').all();
  allNodes = d.prepare('SELECT * FROM nodes').all();
  relations = d.prepare('SELECT * FROM relations').all();
  evalItems = d.prepare('SELECT * FROM eval_items').all();
  updates = d.prepare('SELECT * FROM update_log').all();
  feedback = d.prepare('SELECT * FROM feedback').all();
  candidates = d.prepare('SELECT * FROM candidate_content').all();
  // live 模式：行已是扁平结构，JSON 列需重新序列化
  sources = sources.map((s) => ({ ...s, supports: typeof s.supports === 'string' ? s.supports : J(s.supports) }));
  allNodes = allNodes.map((n) => ({ ...n, details: typeof n.details === 'string' ? n.details : J(n.details),
    tags: typeof n.tags === 'string' ? n.tags : J(n.tags), source_ids: typeof n.source_ids === 'string' ? n.source_ids : J(n.source_ids),
    career_tracks: typeof n.career_tracks === 'string' ? n.career_tracks : J(n.career_tracks) }));
  relations = relations.map((r) => ({ ...r, source_ids: typeof r.source_ids === 'string' ? r.source_ids : J(r.source_ids) }));
  evalItems = evalItems.map((e) => ({ ...e, reference_points: typeof e.reference_points === 'string' ? e.reference_points : J(e.reference_points),
    source_ids: typeof e.source_ids === 'string' ? e.source_ids : J(e.source_ids), expected_nodes: typeof e.expected_nodes === 'string' ? e.expected_nodes : J(e.expected_nodes) }));
  updates = updates.map((u) => ({ ...u, source_ids: typeof u.source_ids === 'string' ? u.source_ids : J(u.source_ids) }));
} else {
  ({ sources } = await import('../data/seed/sources.mjs'));
  const dn = (await import('../data/seed/nodes-domain.mjs')).domainNodes;
  const en = (await import('../data/seed/nodes-ecosystem.mjs')).ecosystemNodes;
  const cn = (await import('../data/seed/nodes-cognition.mjs')).cognitionNodes;
  allNodes = [...dn, ...en, ...cn].map((n) => ({ ...n, details: J(n.details || []), tags: J(n.tags || []),
    source_ids: J(n.source_ids || []), career_tracks: J(n.career_tracks || ['all']),
    evidence_note: n.evidence_note ?? null, knowledge_status: n.knowledge_status || '未评估',
    participant_role: n.participant_role ?? null, chain: n.chain ?? null, cost_side: n.cost_side ?? null,
    method_ref: n.method_ref ?? null, case_ref: n.case_ref ?? null, limit_note: n.limit ?? n.limit_note ?? null,
    fast_variable: n.fast_variable ? 1 : 0, section: n.section ?? null,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString() }));
  relations = (await import('../data/seed/relations.mjs')).relations.map((r) => ({ ...r, source_ids: J(r.source_ids || []) }));
  evalItems = (await import('../data/seed/evalset.mjs')).evalItems.map((e) => ({ ...e,
    reference_points: J(e.reference_points), source_ids: J(e.source_ids), expected_nodes: J(e.expected_nodes), active: 1 }));
  updates = []; feedback = []; candidates = [];
}

const L = [];
for (const s of sources) L.push(`INSERT OR REPLACE INTO sources (id,title,publisher,author,url,published_at,accessed_at,source_type,supports,notes) VALUES (${esc(s.id)},${esc(s.title)},${esc(s.publisher)},${esc(s.author)},${esc(s.url)},${esc(s.published_at)},${esc(s.accessed_at)},${esc(s.source_type)},${esc(s.supports)},${esc(s.notes)});`);
for (const n of allNodes) L.push(`INSERT OR REPLACE INTO nodes (id,title,map_type,node_type,section,summary,details,tags,source_ids,evidence_status,evidence_note,knowledge_status,career_tracks,participant_role,chain,cost_side,method_ref,case_ref,last_checked,fast_variable,limit_note,is_candidate,status,created_at,updated_at) VALUES (${esc(n.id)},${esc(n.title)},${esc(n.map_type)},${esc(n.node_type)},${esc(n.section)},${esc(n.summary)},${esc(n.details)},${esc(n.tags)},${esc(n.source_ids)},${esc(n.evidence_status)},${esc(n.evidence_note)},${esc(n.knowledge_status)},${esc(n.career_tracks)},${esc(n.participant_role)},${esc(n.chain)},${esc(n.cost_side)},${esc(n.method_ref)},${esc(n.case_ref)},${esc(n.last_checked)},${esc(n.fast_variable)},${esc(n.limit_note)},${esc(n.is_candidate)},${esc(n.status)},${esc(n.created_at)},${esc(n.updated_at)});`);
const seen = new Set();
for (const r of relations) {
  const k = r.source_node_id + '|' + r.target_node_id + '|' + r.relation_type;
  if (seen.has(k)) continue; seen.add(k);
  L.push(`INSERT OR REPLACE INTO relations (id,source_node_id,target_node_id,relation_type,coverage,description,reasoning_chain,source_ids,evidence_status,checked_at) VALUES (${esc(r.id)},${esc(r.source_node_id)},${esc(r.target_node_id)},${esc(r.relation_type)},${esc(r.coverage)},${esc(r.description)},${esc(r.reasoning_chain)},${esc(r.source_ids)},${esc(r.evidence_status)},${esc(r.checked_at)});`);
}
for (const e of evalItems) L.push(`INSERT OR REPLACE INTO eval_items (id,category,question,reference_points,source_ids,expected_nodes,grading,active) VALUES (${esc(e.id)},${esc(e.category)},${esc(e.question)},${esc(e.reference_points)},${esc(e.source_ids)},${esc(e.expected_nodes)},${esc(e.grading)},${esc(e.active ?? 1)});`);
for (const u of (updates || [])) L.push(`INSERT INTO update_log (date,object_type,object_id,evidence,change,reason,updated_by,source_ids,created_at) VALUES (${esc(u.date)},${esc(u.object_type)},${esc(u.object_id)},${esc(u.evidence)},${esc(u.change)},${esc(u.reason)},${esc(u.updated_by)},${esc(u.source_ids)},${esc(u.created_at)});`);
for (const fb of (feedback || [])) L.push(`INSERT INTO feedback (date,from_name,anonymous,question,verify,change,reason,status,related_node_id,reply,created_at) VALUES (${esc(fb.date)},${esc(fb.from_name)},${esc(fb.anonymous)},${esc(fb.question)},${esc(fb.verify)},${esc(fb.change)},${esc(fb.reason)},${esc(fb.status)},${esc(fb.related_node_id)},${esc(fb.reply)},${esc(fb.created_at)});`);
for (const c of (candidates || [])) L.push(`INSERT INTO candidate_content (content,source_hint,found_by,found_at,review_status,reviewed_by,reviewed_at,rejection_reason,target_map) VALUES (${esc(c.content)},${esc(c.source_hint)},${esc(c.found_by)},${esc(c.found_at)},${esc(c.review_status)},${esc(c.reviewed_by)},${esc(c.reviewed_at)},${esc(c.rejection_reason)},${esc(c.target_map)});`);

fs.writeFileSync(path.join(ROOT, 'data', 'd1-seed.sql'), L.join('\n') + '\n', 'utf8');
console.log('[gen-d1] mode=' + (LIVE ? 'live' : 'seed') + ' 语句数=' + L.length);