// 检索层（Node 侧）：数据库访问 + 一跳图扩展 + AI 上下文组装。
// 打分算法全部委托给 shared/retrieval-core.mjs（与 Cloudflare Worker 共用同一实现，避免漂移）。
import { getDb, parseNode, parseRel, parseSrc, getNode } from './db.mjs';
import {
  tokenize, expandQuery, searchCore, buildCorpusStats, prepareDocs, applyRelevanceFloor
} from '../../shared/retrieval-core.mjs';

let corpusCache = null;

function buildCorpus() {
  const d = getDb();
  const nodes = d.prepare("SELECT * FROM nodes WHERE is_candidate=0 AND status='published'").all().map(parseNode);
  const rels = d.prepare('SELECT * FROM relations').all().map(parseRel);
  const srcs = d.prepare('SELECT * FROM sources').all().map(parseSrc);
  const byId = new Map(nodes.map((n) => [n.id, n]));

  const docs = [];
  for (const n of nodes) {
    docs.push({
      kind: 'node', id: n.id, row: n, display_title: n.title || '',
      fields: { title: n.title || '', summary: n.summary || '', details: (n.details || []).join(' '), tags: (n.tags || []).join(' ') },
      passages: (n.details || []).filter((x) => x && String(x).trim())
    });
  }
  for (const r of rels) {
    const a = byId.get(r.source_node_id), b = byId.get(r.target_node_id);
    docs.push({
      kind: 'relation', id: r.id, row: r,
      display_title: ((a ? a.title : r.source_node_id) + ' —' + r.relation_type + '→ ' + (b ? b.title : r.target_node_id)),
      // 关系不设 title 索引字段：relation_type 只有 1-2 个 token，BM25 长度归一化会让短字段
      // 命中得分暴涨，压过真正相关的节点（实测已踩坑）。关系类型放进低权重 tags。
      fields: {
        title: '',
        summary: r.description || '',
        details: (r.reasoning_chain || '') + ' ' + ((a ? a.title : '') + ' ' + (b ? b.title : '')),
        tags: ((r.relation_type || '') + ' ' + (r.coverage || '')).trim()
      }
    });
  }
  for (const s of srcs) {
    docs.push({
      kind: 'source', id: s.id, row: s, display_title: s.title || '',
      fields: {
        title: s.title || '', summary: (s.supports || []).join(' '),
        details: (s.notes || '') + ' ' + (s.publisher || '') + ' ' + (s.author || ''), tags: s.source_type || ''
      }
    });
  }
  prepareDocs(docs);
  const stats = buildCorpusStats(docs);
  corpusCache = { docs, byId, ...stats };
  return corpusCache;
}

function corpus() { return corpusCache || buildCorpus(); }
export function invalidateCorpus() { corpusCache = null; }
/** 暴露 IDF 表，供评测脚本的词面降级判据过滤常见词。 */
export function getCorpusIdf() { return corpus().idf; }

export function search(query, { limit = 8, mapTypes = null, graphExpand = true } = {}) {
  const C = corpus();
  // applyFloor:false —— 下限必须在图扩展「之后」应用（原始实现顺序），否则邻居排序漂移
  const res = searchCore(query, C.docs, C, { limit, mapTypes, applyFloor: false });
  if (!res.hits || res.degraded) return res;
  if (res.irrelevant) return { ...res, hits: [], total: 0 };
  // 图扩展复用与 searchCore 相同的「有区分度查询词」，保证扩展方向与查询一致
  const { expanded } = expandQuery(query);
  const useTerms = (() => {
    const u = expanded.filter((t) => (C.idf.get(t) || 0) > 0.15);
    return u.length ? u : expanded;
  })();

  let out = res.hits;

  // ---------- 图扩展：把高分节点的一跳邻居并入候选 ----------
  // 依据：课程要求三张地图共享节点与关系，跨图跳转依赖关系边；
  // 纯文本检索会漏掉语义相关但用词不同的邻居节点。
  if (graphExpand && out.length) {
    const d = getDb();
    const seeds = out.filter((h) => h.kind === 'node').slice(0, 4);
    const have = new Set(out.map((h) => h.kind + ':' + h.id));
    const extra = [];
    for (const s of seeds) {
      const rels = d.prepare('SELECT * FROM relations WHERE source_node_id=? OR target_node_id=?').all(s.id, s.id).map(parseRel);
      for (const r of rels) {
        const otherId = r.source_node_id === s.id ? r.target_node_id : r.source_node_id;
        const other = C.byId.get(otherId);
        if (!other) continue;
        if (mapTypes && !mapTypes.includes(other.map_type)) continue;
        if (have.has('node:' + otherId)) continue;
        const relDoc = C.docs.find((x) => x.kind === 'relation' && x.id === r.id);
        // 与重构前完全一致：用「全部扩展词」（未过滤）与种子系数 0.32。
        // 实测：换成过滤词/0.3 后邻居排序漂移，EV-13 的 D-A-RAG 被挤出 top5（召回 69.1%->65.5%）。
        const relScore = relDoc ? bm25Rel(relDoc, expanded, C) : 0;
        const base = s.score * 0.32 + relScore * 0.5;
        if (base <= 0) continue;
        have.add('node:' + otherId);
        extra.push({ kind: 'node', id: other.id, title: other.title, map_type: other.map_type, node_type: other.node_type,
          evidence_status: other.evidence_status, snippet: other.summary, score: Math.round(base * 10) / 10,
          coverage: Math.round((s.coverage || 0) * 0.6 * 100) / 100,
          why: ['graph_neighbor_of:' + s.id + '(' + r.relation_type + ')'], via_relation: r.relation_type });
      }
    }
    if (extra.length) out = out.concat(extra).sort((a, b) => b.score - a.score).slice(0, limit);
  }

  const fin = applyRelevanceFloor(out, res.lexical_overlap);
  return { ...res, hits: fin.hits, total: fin.hits.length, irrelevant: fin.irrelevant };
}

/**
 * 关系文档的辅助打分（图扩展用）。
 * 语义与重构前保持一致：对「描述 + 关系类型」整串文本做词频加权打分
 * （次线性词频 + 长度权重 + IDF），而非 BM25 的 tf 饱和形式。
 * 实测教训：换成 BM25 tf 饱和后，图扩展邻居排序漂移，14 题平均召回率从 69.1% 掉到 65.5%。
 * 注意：必须用查询词而非种子节点标题——初版误用标题扩展，导致图扩展与查询无关。
 */
function bm25Rel(relDoc, useTerms, C) {
  const text = ((relDoc.row.description || '') + ' ' + (relDoc.row.relation_type || '')).toLowerCase();
  if (!text || !useTerms.length) return 0;
  let s = 0;
  for (const t of useTerms) {
    if (!t) continue;
    let idx = text.indexOf(t);
    let count = 0;
    while (idx !== -1 && count < 12) { count++; idx = text.indexOf(t, idx + t.length); }
    if (count === 0) continue;
    const w = C.idf.get(t) || 0;
    if (w <= 0) continue;
    const lb = t.length >= 3 ? 1.6 : t.length === 2 ? 1.1 : 0.35;
    s += 1 * (1 + Math.log(count)) * lb * w;
  }
  return s;
}

/**
 * 为 AI 上下文准备资料片段。
 * 关键设计一：按类型分别取 top-K，而非从混合榜过滤（关系标题拼接会挤占节点名额）。
 * 关键设计二：置信度以「查询覆盖度 + 节点命中质量」为主，而不是只看最高分。
 */
export function buildContext(query, { topK = 5 } = {}) {
  const d = getDb();
  const wide = search(query, { limit: 60, graphExpand: true });
  // 与本站无关的查询：不注入任何上下文，交由越界闸门/无证据路径处理
  const nodeHits = wide.irrelevant ? [] : wide.hits.filter((h) => h.kind === 'node').slice(0, topK);
  const relHits = wide.irrelevant ? [] : wide.hits.filter((h) => h.kind === 'relation').slice(0, 4);
  const srcHits = wide.irrelevant ? [] : wide.hits.filter((h) => h.kind === 'source').slice(0, 4);

  const chunks = [];
  for (const h of nodeHits) {
    const n = getNode(h.id);
    if (!n) continue;
    const srcTitles = (n.source_ids || []).map((sid) => {
      const s = d.prepare('SELECT id,title,url,accessed_at,published_at FROM sources WHERE id=?').get(sid);
      return s ? `[${s.id}] ${s.title}（访问日期 ${s.accessed_at}）` : `[${sid}]`;
    });
    chunks.push({
      node_id: n.id, title: n.title, map_type: n.map_type, node_type: n.node_type,
      summary: n.summary, details: (n.details || []).slice(0, 6),
      evidence_status: n.evidence_status, last_checked: n.last_checked, sources: srcTitles,
      match_coverage: h.coverage ?? 0
    });
  }

  const relChunks = relHits.map((h) => {
    const rr = parseRel(d.prepare('SELECT * FROM relations WHERE id=?').get(h.id));
    if (!rr) return null;
    return { relation_id: rr.id, from: rr.source_node_id, to: rr.target_node_id, type: rr.relation_type,
      coverage: rr.coverage, description: rr.description, evidence_status: rr.evidence_status,
      reasoning_chain: rr.reasoning_chain };
  }).filter(Boolean);

  const srcChunks = srcHits.map((h) => {
    const ss = parseSrc(d.prepare('SELECT * FROM sources WHERE id=?').get(h.id));
    if (!ss) return null;
    return { source_id: ss.id, title: ss.title, url: ss.url, publisher: ss.publisher,
      published_at: ss.published_at, accessed_at: ss.accessed_at, source_type: ss.source_type,
      supports: (ss.supports || []).slice(0, 4) };
  }).filter(Boolean);

  // ---- 置信度：覆盖度主导，分数辅助 ----
  const topCoverage = nodeHits.length ? Math.max(...nodeHits.map((h) => h.coverage || 0)) : 0;
  const avgCoverage = nodeHits.length ? nodeHits.reduce((a, h) => a + (h.coverage || 0), 0) / nodeHits.length : 0;
  const scoreSignal = Math.min(1, (nodeHits.length ? nodeHits[0].score : 0) / 60);
  // 硬门槛：若查询词与语料几乎没有词汇重叠，置信度直接压到接近 0（无证据即拒答的第一道闸门）
  const overlap = wide.lexical_overlap ?? 0;
  const lexicalGate = overlap >= 0.5 ? 1 : overlap >= 0.25 ? 0.55 : overlap >= 0.1 ? 0.25 : 0.05;
  const confidence = Math.round(Math.max(0, Math.min(1,
    (topCoverage * 0.55 + avgCoverage * 0.25 + scoreSignal * 0.20) * lexicalGate)) * 100) / 100;

  return {
    query,
    total_hits: wide.total,
    synonym_hits: wide.synonymHits,
    irrelevant: !!wide.irrelevant,
    query_terms: wide.query_terms || 0,
    node_ids: chunks.map((c) => c.node_id),
    chunks, relations: relChunks, sources: srcChunks,
    confidence,
    top_coverage: topCoverage,
    in_corpus_terms: wide.in_corpus_terms || 0,
    lexical_overlap: overlap,
    top_score: nodeHits.length ? nodeHits[0].score : 0
  };
}

export { tokenize, expandQuery };