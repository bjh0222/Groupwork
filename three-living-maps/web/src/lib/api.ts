// 前端 API 客户端：统一错误处理、超时与深链接安全。
// 前端不含任何密钥；所有写操作走 /api/admin/* 并需要用户在管理页手动输入令牌（仅存内存）。
import type {
  AiAnswer, CandidateEntry, EvalItem, EvalRun, FeedbackEntry, MapNode,
  Meta, NodeDetail, Relation, SearchHit, Source, UpdateEntry
} from './types';

const BASE = (import.meta.env?.VITE_API_BASE as string | undefined) || '';

export class ApiError extends Error {
  status: number;
  code: string;
  messages?: string[];
  constructor(status: number, code: string, message: string, messages?: string[]) {
    super(message);
    this.status = status;
    this.code = code;
    this.messages = messages;
  }
}

async function req<T>(path: string, init?: RequestInit & { timeoutMs?: number }): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), init?.timeoutMs ?? 30000);
  try {
    const res = await fetch(BASE + path, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
      signal: ctrl.signal
    });
    const text = await res.text();
    let data: unknown = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!res.ok) {
      const d = (data || {}) as { error?: string; message?: string; messages?: string[] };
      throw new ApiError(res.status, d.error || 'http_' + res.status,
        d.message || ('请求失败（' + res.status + '）'), d.messages);
    }
    return data as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if ((e as Error).name === 'AbortError') {
      throw new ApiError(0, 'timeout', '请求超时，请检查网络后重试。');
    }
    throw new ApiError(0, 'network', '无法连接服务器：' + ((e as Error).message || '网络错误'));
  } finally {
    clearTimeout(timer);
  }
}

const qs = (o: Record<string, unknown>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) {
    if (v === undefined || v === null || v === '') continue;
    p.set(k, String(v));
  }
  const s = p.toString();
  return s ? '?' + s : '';
};

// ---------- 公开只读 ----------
export const api = {
  health: () => req<{ ok: boolean; time: string; node: string; ai: boolean; admin: boolean }>('/api/health'),
  meta: () => req<Meta>('/api/meta'),
  stats: () => req<{ ok: boolean; stats: Record<string, number | Record<string, number>> }>('/api/stats'),

  nodes: (o: { map?: string; type?: string; q?: string; track?: string; evidence?: string; status?: string } = {}) =>
    req<{ ok: boolean; count: number; nodes: MapNode[] }>('/api/nodes' + qs(o)),

  node: (id: string) => req<NodeDetail>('/api/nodes/' + encodeURIComponent(id)),

  relations: (o: { node?: string; type?: string } = {}) =>
    req<{ ok: boolean; count: number; relations: Relation[] }>('/api/relations' + qs(o)),

  sources: (o: { type?: string } = {}) =>
    req<{ ok: boolean; count: number; sources: Source[] }>('/api/sources' + qs(o)),

  source: (id: string) =>
    req<{ ok: boolean; source: Source; used_by: { id: string; title: string; map_type: string; node_type: string }[] }>(
      '/api/sources' + qs({ id })),

  search: (q: string, o: { map?: string; limit?: number } = {}) =>
    req<{ ok: boolean; query: string; hits: SearchHit[]; total: number; synonymHits?: string[]; degraded?: boolean; message?: string }>(
      '/api/search' + qs({ q, ...o })),

  graph: (map?: string) =>
    req<{ ok: boolean; nodes: MapNode[]; relations: Relation[] }>('/api/graph' + qs({ map })),

  updates: (o: { limit?: number; type?: string } = {}) =>
    req<{ ok: boolean; count: number; updates: UpdateEntry[] }>('/api/updates' + qs(o)),

  feedback: (o: { status?: string } = {}) =>
    req<{ ok: boolean; count: number; feedback: FeedbackEntry[] }>('/api/feedback' + qs(o)),

  candidates: (o: { status?: string } = {}) =>
    req<{ ok: boolean; count: number; candidates: CandidateEntry[] }>('/api/candidates' + qs(o)),

  eval: () => req<{ ok: boolean; items: EvalItem[]; runs: EvalRun[]; latest: EvalRun | null }>('/api/eval'),

  // ---------- AI 助手 ----------
  aiStatus: () => req<{ ok: boolean; enabled: boolean; note: string | null;
    channels: { id: string; name: string; model: string }[] }>('/api/ai/status'),

  ask: (question: string, opts: { topK?: number; timeoutMs?: number } = {}) =>
    req<AiAnswer>('/api/ai/ask', {
      method: 'POST',
      body: JSON.stringify({ question, top_k: opts.topK }),
      timeoutMs: opts.timeoutMs ?? 180000
    }),

  // ---------- 公开写入（限流，允许匿名）----------
  submitFeedback: (body: {
    question: string; from_name?: string; anonymous?: boolean;
    verify?: string; change?: string; reason?: string; related_node_id?: string;
  }) => req<{ ok: boolean; id: number; message: string }>('/api/feedback', {
    method: 'POST', body: JSON.stringify(body)
  }),

  submitCandidate: (body: { content: string; source_hint?: string; found_by?: string; target_map?: string }) =>
    req<{ ok: boolean; id: number; message: string }>('/api/candidates', {
      method: 'POST', body: JSON.stringify(body)
    })
};

// ---------- 管理端（令牌仅存内存，不落 localStorage，避免 XSS 窃取持久凭据）----------
let adminToken = '';
export function setAdminToken(t: string) { adminToken = t; }
export function getAdminToken() { return adminToken; }

export const adminApi = {
  lint: () => req<{ ok: boolean; problems: unknown[]; counts: Record<string, number> }>(
    '/api/admin/lint', { headers: { 'x-admin-token': adminToken } }),
  saveNode: (body: unknown) => req<{ ok: boolean; node?: MapNode; messages?: string[] }>(
    '/api/admin/nodes', { method: 'POST', body: JSON.stringify(body), headers: { 'x-admin-token': adminToken } }),
  deleteNode: (id: string, reason?: string) => req<{ ok: boolean; messages?: string[] }>(
    '/api/admin/nodes/' + encodeURIComponent(id), { method: 'DELETE', body: JSON.stringify({ reason }), headers: { 'x-admin-token': adminToken } }),
  saveRelation: (body: unknown) => req<{ ok: boolean; relation?: Relation; messages?: string[] }>(
    '/api/admin/relations', { method: 'POST', body: JSON.stringify(body), headers: { 'x-admin-token': adminToken } }),
  deleteRelation: (id: string, reason?: string) => req<{ ok: boolean; messages?: string[] }>(
    '/api/admin/relations/' + encodeURIComponent(id), { method: 'DELETE', body: JSON.stringify({ reason }), headers: { 'x-admin-token': adminToken } }),
  saveSource: (body: unknown) => req<{ ok: boolean; source?: Source; messages?: string[] }>(
    '/api/admin/sources', { method: 'POST', body: JSON.stringify(body), headers: { 'x-admin-token': adminToken } }),
  deleteSource: (id: string, reason?: string) => req<{ ok: boolean; messages?: string[] }>(
    '/api/admin/sources/' + encodeURIComponent(id), { method: 'DELETE', body: JSON.stringify({ reason }), headers: { 'x-admin-token': adminToken } }),
  reviewCandidate: (id: number, body: { review_status: string; rejection_reason?: string }) =>
    req<{ ok: boolean; messages?: string[] }>('/api/admin/candidates/' + id + '/review',
      { method: 'POST', body: JSON.stringify(body), headers: { 'x-admin-token': adminToken } }),
  updateFeedback: (id: number, body: { status?: string; reply?: string; change?: string; reason?: string }) =>
    req<{ ok: boolean; messages?: string[] }>('/api/admin/feedback/' + id,
      { method: 'POST', body: JSON.stringify(body), headers: { 'x-admin-token': adminToken } }),
  addUpdate: (body: { object_type?: string; object_id?: string; change: string; reason?: string; evidence?: string; source_ids?: string[] }) =>
    req<{ ok: boolean; messages?: string[] }>('/api/admin/updates',
      { method: 'POST', body: JSON.stringify(body), headers: { 'x-admin-token': adminToken } })
};
