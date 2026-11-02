// 与后端数据契约一致的 TypeScript 类型定义。
export type MapType = 'domain' | 'ecosystem' | 'cognition';
export type EvidenceStatus = '已核实' | '部分核实' | '推断' | '待核实';
export type KnowledgeStatus = '未评估' | '已初步理解' | '已经尝试' | '待深入学习';
export type CareerTrack = 'scientist' | 'engineer' | 'designer' | 'all';

export interface Source {
  id: string; title: string; publisher: string | null; author: string | null;
  url: string | null; published_at: string | null; accessed_at: string;
  source_type: string; supports: string[]; notes: string | null;
}

export interface MapNode {
  id: string; title: string; map_type: MapType; node_type: string; section: string | null;
  summary: string; details: string[]; tags: string[]; source_ids: string[];
  evidence_status: EvidenceStatus; evidence_note: string | null;
  knowledge_status: KnowledgeStatus; career_tracks: CareerTrack[];
  participant_role?: string | null; chain?: string | null; cost_side?: string | null;
  method_ref?: string | null; case_ref?: string | null;
  last_checked: string; fast_variable: boolean; limit?: string | null; limit_note?: string | null;
  stale?: boolean; why_included?: string | null;
}

export interface Relation {
  id: string; source_node_id: string; target_node_id: string; relation_type: string;
  coverage?: string | null; description: string; reasoning_chain?: string | null;
  source_ids: string[]; evidence_status: EvidenceStatus; checked_at: string;
  // 详情接口附加
  direction?: 'in' | 'out'; other_id?: string; other_title?: string | null;
  other_map?: MapType | null; other_type?: string | null;
}

export interface ExploreGroup {
  id: string; title: string | null; map_type: MapType | null; node_type: string | null;
  relation_type: string; evidence_status: EvidenceStatus;
  /** 后端 explore 分组会附带对端节点所在地图，便于前端标注跨图 */
  other_map?: MapType | null;
}
export interface Explore {
  prerequisites: ExploreGroup[]; related_tasks: ExploreGroup[]; tools: ExploreGroup[];
  papers: ExploreGroup[]; ecosystem: ExploreGroup[]; practices: ExploreGroup[];
}

export interface SearchHit {
  kind: 'node' | 'relation' | 'source'; id: string; title: string;
  map_type: MapType | null; node_type: string; evidence_status: EvidenceStatus | null;
  snippet: string; score: number; why?: string[]; coverage?: number; matched_terms?: string[];
  source_node_id?: string; target_node_id?: string; url?: string; accessed_at?: string;
  via_relation?: string;
}

export interface UpdateEntry {
  id: number; date: string; object_type: string; object_id: string | null;
  evidence: string | null; change: string; reason: string | null;
  updated_by: string; source_ids: string[] | null; created_at: string;
}

export interface FeedbackEntry {
  id: number; date: string; from_name: string | null; anonymous: number;
  question: string; verify: string | null; change: string | null; reason: string | null;
  status: string; related_node_id: string | null; reply: string | null; created_at: string;
}

export interface CandidateEntry {
  id: number; content: string; source_hint: string | null; found_by: string;
  found_at: string; review_status: string; reviewed_by: string | null;
  reviewed_at: string | null; rejection_reason: string | null; target_map: MapType | null;
}

export interface EvalItem {
  id: string; category: string; question: string; reference_points: string[];
  source_ids: string[]; expected_nodes: string[]; grading: string; active: number;
}
export interface EvalRun {
  id: number; run_at: string; model: string | null; channel: string | null;
  node_version: string | null; total: number; passed: number;
  scores: Record<string, number>; items: unknown[]; totals: Record<string, number>; notes: string | null;
}

export interface AiAnswer {
  ok: boolean; question?: string; mode: 'generative' | 'retrieval_only' | 'out_of_scope';
  status: string; answer: string | null; reasoning?: string | null;
  citations?: { nodes: string[]; sources: string[] }; dropped_citations?: string[];
  grounded?: boolean; evidence?: string; message?: string; warning?: string | null;
  truncated?: boolean; finish_reason?: string | null;
  channel?: string | null; model?: string | null; usage?: unknown; latency_ms?: number;
  degraded_reason?: string; error_message?: string; out_of_scope?: boolean;
  context?: {
    total_hits: number; synonym_hits: string[]; confidence: number;
    lexical_overlap?: number; node_ids: string[];
    sources: { id: string; title: string; url: string | null; accessed_at: string }[];
  };
}

export interface Meta {
  relation_types: string[]; coverage: string[]; evidence_status: EvidenceStatus[];
  knowledge_status: KnowledgeStatus[]; node_types: string[];
  ai: { enabled: boolean; channels: { id: string; name: string; model: string; baseUrl?: string }[];
        primary: { id: string; model: string } | null; note: string | null };
  admin_enabled: boolean; max_question_len: number;
  stats: Record<string, number | Record<string, number>>;
}

export interface NodeDetail {
  ok: boolean; node: MapNode; relations: Relation[]; sources: Source[]; explore: Explore;
}

export const SECTION_LABELS: Record<string, string> = {
  A: 'A. 问题与任务', B: 'B. 概念与原理', C: 'C. 方法与技术路线',
  D: 'D. 软件与模型', E: 'E. 数据与实践资源', F: 'F. 课程与学习路径'
};

export const ECO_CHAIN_LABELS: Record<string, string> = {
  main_a: '主线 A：从论文到本组应用',
  side_b: '辅线 B：谁承担成本',
  dim_c: '其他观察维度'
};

export const COG_SECTION_LABELS: Record<string, string> = {
  '1': '一、认识方法', '2': '二、分析方法', '3': '三、真实案例',
  '4': '四、成长习惯', '5': '五、认识修正', '6': '六、真实记录入口'
};

export const TRACK_LABELS: Record<CareerTrack, string> = {
  all: '全部路线', scientist: 'AI 科学家', engineer: 'AI 工程师', designer: 'AI 设计师'
};
