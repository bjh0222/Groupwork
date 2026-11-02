// 数据库层：node:sqlite（Node >= 22.5）。九张表，含外键、索引、唯一约束。
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

export const DB_PATH = process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'maps.sqlite');

let db = null;

export function getDb() {
  if (db) return db;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  migrate(db);
  return db;
}

function migrate(d) {
  d.exec(`
  CREATE TABLE IF NOT EXISTS sources (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    publisher TEXT,
    author TEXT,
    url TEXT,
    published_at TEXT,
    accessed_at TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN
      ('paper','official_doc','pricing','curriculum','project_doc','community','benchmark','tool_doc')),
    supports TEXT NOT NULL DEFAULT '[]',
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS nodes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    map_type TEXT NOT NULL CHECK (map_type IN ('domain','ecosystem','cognition')),
    node_type TEXT NOT NULL,
    section TEXT,
    summary TEXT NOT NULL,
    details TEXT NOT NULL DEFAULT '[]',
    tags TEXT NOT NULL DEFAULT '[]',
    source_ids TEXT NOT NULL DEFAULT '[]',
    evidence_status TEXT NOT NULL DEFAULT '待核实' CHECK (evidence_status IN
      ('已核实','部分核实','推断','待核实')),
    evidence_note TEXT,
    knowledge_status TEXT NOT NULL DEFAULT '未评估' CHECK (knowledge_status IN
      ('未评估','已初步理解','已经尝试','待深入学习')),
    career_tracks TEXT NOT NULL DEFAULT '["all"]',
    participant_role TEXT,
    chain TEXT,
    cost_side TEXT,
    method_ref TEXT,
    case_ref TEXT,
    last_checked TEXT NOT NULL,
    fast_variable INTEGER NOT NULL DEFAULT 0,
    limit_note TEXT,
    is_candidate INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published','draft','archived'))
  );

  CREATE TABLE IF NOT EXISTS relations (
    id TEXT PRIMARY KEY,
    source_node_id TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    target_node_id TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    relation_type TEXT NOT NULL,
    coverage TEXT CHECK (coverage IN
      ('前置基础','核心覆盖','部分涉及','实践应用','自主拓展')),
    description TEXT NOT NULL,
    reasoning_chain TEXT,
    source_ids TEXT NOT NULL DEFAULT '[]',
    evidence_status TEXT NOT NULL DEFAULT '待核实' CHECK (evidence_status IN
      ('已核实','部分核实','推断','待核实')),
    checked_at TEXT NOT NULL,
    direction_hint TEXT,
    UNIQUE (source_node_id, target_node_id, relation_type)
  );

  CREATE TABLE IF NOT EXISTS update_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    object_type TEXT NOT NULL CHECK (object_type IN
      ('node','relation','source','eval','feedback','candidate','system')),
    object_id TEXT,
    evidence TEXT,
    change TEXT NOT NULL,
    reason TEXT,
    updated_by TEXT NOT NULL DEFAULT 'system',
    source_ids TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    from_name TEXT,
    anonymous INTEGER NOT NULL DEFAULT 1,
    question TEXT NOT NULL,
    verify TEXT,
    change TEXT,
    reason TEXT,
    status TEXT NOT NULL DEFAULT '待处理' CHECK (status IN
      ('待处理','已采纳','已回复','未采纳','转候选')),
    related_node_id TEXT,
    reply TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS candidate_content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    source_hint TEXT,
    found_by TEXT NOT NULL DEFAULT 'unknown',
    found_at TEXT NOT NULL,
    review_status TEXT NOT NULL DEFAULT '待审核' CHECK (review_status IN
      ('待审核','已通过','已淘汰')),
    reviewed_by TEXT,
    reviewed_at TEXT,
    rejection_reason TEXT,
    target_map TEXT CHECK (target_map IN ('domain','ecosystem','cognition'))
  );

  CREATE TABLE IF NOT EXISTS eval_items (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    question TEXT NOT NULL,
    reference_points TEXT NOT NULL DEFAULT '[]',
    source_ids TEXT NOT NULL DEFAULT '[]',
    expected_nodes TEXT NOT NULL DEFAULT '[]',
    grading TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS eval_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_at TEXT NOT NULL,
    model TEXT,
    channel TEXT,
    node_version TEXT,
    total INTEGER NOT NULL,
    passed INTEGER NOT NULL,
    scores TEXT NOT NULL DEFAULT '{}',
    items TEXT NOT NULL DEFAULT '[]',
    totals TEXT NOT NULL DEFAULT '{}',
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS ai_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts TEXT NOT NULL,
    channel TEXT,
    model TEXT,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    latency_ms INTEGER DEFAULT 0,
    status TEXT NOT NULL,
    question_hash TEXT,
    error TEXT,
    cost_note TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_nodes_map ON nodes(map_type);
  CREATE INDEX IF NOT EXISTS idx_nodes_type ON nodes(node_type);
  CREATE INDEX IF NOT EXISTS idx_nodes_status ON nodes(status);
  CREATE INDEX IF NOT EXISTS idx_nodes_evidence ON nodes(evidence_status);
  CREATE INDEX IF NOT EXISTS idx_rel_src ON relations(source_node_id);
  CREATE INDEX IF NOT EXISTS idx_rel_tgt ON relations(target_node_id);
  CREATE INDEX IF NOT EXISTS idx_rel_type ON relations(relation_type);
  CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
  CREATE INDEX IF NOT EXISTS idx_candidate_status ON candidate_content(review_status);
  CREATE INDEX IF NOT EXISTS idx_usage_ts ON ai_usage(ts);
  CREATE INDEX IF NOT EXISTS idx_update_date ON update_log(date);
  `);
}

// ---------- JSON 列的读写辅助 ----------
const JSON_COLS_NODE = ['details', 'tags', 'source_ids', 'career_tracks'];
const JSON_COLS_REL = ['source_ids'];
const JSON_COLS_SRC = ['supports'];

export function parseRow(row, jsonCols) {
  if (!row) return null;
  const o = { ...row };
  for (const c of jsonCols) {
    if (o[c] == null) continue;
    if (typeof o[c] === 'string') { try { o[c] = JSON.parse(o[c]); } catch { o[c] = []; } }
  }
  if ('fast_variable' in o) o.fast_variable = !!o.fast_variable;
  if ('is_candidate' in o) o.is_candidate = !!o.is_candidate;
  return o;
}
export const parseNode = (r) => parseRow(r, JSON_COLS_NODE);
export const parseRel = (r) => parseRow(r, JSON_COLS_REL);
export const parseSrc = (r) => parseRow(r, JSON_COLS_SRC);

export const j = (v) => JSON.stringify(v == null ? null : v);

// ---------- 读 ----------
export function listNodes({ mapType, nodeType, status = 'published', search, careerTrack, evidence, staleDays = 28, now = null } = {}) {
  const d = getDb();
  const where = [];
  const args = [];
  where.push('is_candidate = 0');
  if (status) { where.push('status = ?'); args.push(status); }
  if (mapType) { where.push('map_type = ?'); args.push(mapType); }
  if (nodeType) { where.push('node_type = ?'); args.push(nodeType); }
  if (evidence) { where.push('evidence_status = ?'); args.push(evidence); }
  if (search) {
    where.push('(title LIKE ? OR summary LIKE ? OR details LIKE ? OR tags LIKE ?)');
    const like = '%' + search + '%';
    args.push(like, like, like, like);
  }
  if (careerTrack && careerTrack !== 'all') {
    where.push('(career_tracks LIKE ? OR career_tracks LIKE ?)');
    args.push('%"' + careerTrack + '"%', '%"all"%');
  }
  const rows = d.prepare('SELECT * FROM nodes WHERE ' + where.join(' AND ') + ' ORDER BY section, id').all(...args);
  const today = now || new Date().toISOString().slice(0, 10);
  return rows.map((r) => {
    const n = parseNode(r);
    n.stale = isStale(n, today, staleDays);
    return n;
  });
}

export function isStale(node, today, staleDays = 28) {
  if (!node.fast_variable) return false;
  const lc = node.last_checked;
  if (!lc) return true;
  const diff = (Date.parse(today) - Date.parse(lc)) / 86400000;
  return Number.isFinite(diff) && diff > staleDays;
}

export function getNode(id, { today = null } = {}) {
  const d = getDb();
  const r = d.prepare('SELECT * FROM nodes WHERE id = ?').get(id);
  if (!r) return null;
  const n = parseNode(r);
  n.stale = isStale(n, today || new Date().toISOString().slice(0, 10));
  return n;
}

export function listRelations({ nodeId, relationType, mapPair } = {}) {
  const d = getDb();
  if (nodeId) {
    const rows = d.prepare(
      'SELECT * FROM relations WHERE source_node_id = ? OR target_node_id = ? ORDER BY id').all(nodeId, nodeId);
    return rows.map(parseRel);
  }
  let sql = 'SELECT * FROM relations';
  const args = [];
  const where = [];
  if (relationType) { where.push('relation_type = ?'); args.push(relationType); }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY id';
  const rows = d.prepare(sql).all(...args);
  return rows.map(parseRel);
}

export function listSources({ id, sourceType } = {}) {
  const d = getDb();
  if (id) {
    const r = d.prepare('SELECT * FROM sources WHERE id = ?').get(id);
    return r ? [parseSrc(r)] : [];
  }
  let sql = 'SELECT * FROM sources';
  const args = [];
  if (sourceType) { sql += ' WHERE source_type = ?'; args.push(sourceType); }
  sql += ' ORDER BY id';
  return d.prepare(sql).all(...args).map(parseSrc);
}

export function listUpdateLog({ limit = 200, objectType } = {}) {
  const d = getDb();
  if (objectType) {
    return d.prepare('SELECT * FROM update_log WHERE object_type = ? ORDER BY date DESC, id DESC LIMIT ?').all(objectType, limit);
  }
  return d.prepare('SELECT * FROM update_log ORDER BY date DESC, id DESC LIMIT ?').all(limit);
}

export function listFeedback({ status, limit = 200 } = {}) {
  const d = getDb();
  if (status) return d.prepare('SELECT * FROM feedback WHERE status = ? ORDER BY id DESC LIMIT ?').all(status, limit);
  return d.prepare('SELECT * FROM feedback ORDER BY id DESC LIMIT ?').all(limit);
}

export function listCandidates({ status, limit = 200 } = {}) {
  const d = getDb();
  if (status) return d.prepare('SELECT * FROM candidate_content WHERE review_status = ? ORDER BY id DESC LIMIT ?').all(status, limit);
  return d.prepare('SELECT * FROM candidate_content ORDER BY id DESC LIMIT ?').all(limit);
}

export function stats() {
  const d = getDb();
  const one = (sql, ...a) => d.prepare(sql).get(...a);
  return {
    nodes: one("SELECT COUNT(*) c FROM nodes WHERE is_candidate=0 AND status='published'").c,
    nodes_by_map: {
      domain: one("SELECT COUNT(*) c FROM nodes WHERE map_type='domain' AND is_candidate=0 AND status='published'").c,
      ecosystem: one("SELECT COUNT(*) c FROM nodes WHERE map_type='ecosystem' AND is_candidate=0 AND status='published'").c,
      cognition: one("SELECT COUNT(*) c FROM nodes WHERE map_type='cognition' AND is_candidate=0 AND status='published'").c
    },
    relations: one('SELECT COUNT(*) c FROM relations').c,
    sources: one('SELECT COUNT(*) c FROM sources').c,
    updates: one('SELECT COUNT(*) c FROM update_log').c,
    feedback: one('SELECT COUNT(*) c FROM feedback').c,
    feedback_pending: one("SELECT COUNT(*) c FROM feedback WHERE status='待处理'").c,
    candidates: one('SELECT COUNT(*) c FROM candidate_content').c,
    candidates_pending: one("SELECT COUNT(*) c FROM candidate_content WHERE review_status='待审核'").c,
    eval_items: one('SELECT COUNT(*) c FROM eval_items WHERE active=1').c,
    stale: one("SELECT COUNT(*) c FROM nodes WHERE fast_variable=1 AND is_candidate=0 AND status='published' AND last_checked < date('now','-28 day')").c,
    ai_calls: one('SELECT COUNT(*) c FROM ai_usage').c
  };
}