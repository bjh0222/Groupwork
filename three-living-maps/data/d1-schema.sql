PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  publisher TEXT, author TEXT, url TEXT,
  published_at TEXT, accessed_at TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('paper','official_doc','pricing','curriculum','project_doc','community','benchmark','tool_doc')),
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
  evidence_status TEXT NOT NULL DEFAULT '待核实' CHECK (evidence_status IN ('已核实','部分核实','推断','待核实')),
  evidence_note TEXT,
  knowledge_status TEXT NOT NULL DEFAULT '未评估' CHECK (knowledge_status IN ('未评估','已初步理解','已经尝试','待深入学习')),
  career_tracks TEXT NOT NULL DEFAULT '["all"]',
  participant_role TEXT, chain TEXT, cost_side TEXT, method_ref TEXT, case_ref TEXT,
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
  coverage TEXT CHECK (coverage IN ('前置基础','核心覆盖','部分涉及','实践应用','自主拓展')),
  description TEXT NOT NULL,
  reasoning_chain TEXT,
  source_ids TEXT NOT NULL DEFAULT '[]',
  evidence_status TEXT NOT NULL DEFAULT '待核实' CHECK (evidence_status IN ('已核实','部分核实','推断','待核实')),
  checked_at TEXT NOT NULL,
  UNIQUE (source_node_id, target_node_id, relation_type)
);

CREATE TABLE IF NOT EXISTS update_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  object_type TEXT NOT NULL CHECK (object_type IN ('node','relation','source','eval','feedback','candidate','system')),
  object_id TEXT, evidence TEXT, change TEXT NOT NULL, reason TEXT,
  updated_by TEXT NOT NULL DEFAULT 'system',
  source_ids TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL, from_name TEXT, anonymous INTEGER NOT NULL DEFAULT 1,
  question TEXT NOT NULL, verify TEXT, change TEXT, reason TEXT,
  status TEXT NOT NULL DEFAULT '待处理' CHECK (status IN ('待处理','已采纳','已回复','未采纳','转候选')),
  related_node_id TEXT, reply TEXT, created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS candidate_content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL, source_hint TEXT, found_by TEXT NOT NULL DEFAULT 'unknown',
  found_at TEXT NOT NULL,
  review_status TEXT NOT NULL DEFAULT '待审核' CHECK (review_status IN ('待审核','已通过','已淘汰')),
  reviewed_by TEXT, reviewed_at TEXT, rejection_reason TEXT,
  target_map TEXT CHECK (target_map IN ('domain','ecosystem','cognition'))
);

CREATE TABLE IF NOT EXISTS eval_items (
  id TEXT PRIMARY KEY, category TEXT NOT NULL, question TEXT NOT NULL,
  reference_points TEXT NOT NULL DEFAULT '[]', source_ids TEXT NOT NULL DEFAULT '[]',
  expected_nodes TEXT NOT NULL DEFAULT '[]', grading TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS eval_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_at TEXT NOT NULL, model TEXT, channel TEXT, node_version TEXT,
  total INTEGER NOT NULL, passed INTEGER NOT NULL,
  scores TEXT NOT NULL DEFAULT '{}', items TEXT NOT NULL DEFAULT '[]', totals TEXT NOT NULL DEFAULT '{}', notes TEXT
);

CREATE TABLE IF NOT EXISTS ai_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL, channel TEXT, model TEXT,
  prompt_tokens INTEGER DEFAULT 0, completion_tokens INTEGER DEFAULT 0, latency_ms INTEGER DEFAULT 0,
  status TEXT NOT NULL, question_hash TEXT, error TEXT, cost_note TEXT
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
