// 检索核心（框架无关）：BM25 + IDF + passage 级打分 + 同义词扩展 + 相关性下限。
// 由 server/lib/retrieval.mjs 与 worker/src/worker.mjs 共用，避免两套实现漂移。
// 依赖注入：调用方提供 docs（已解析的文档数组）与可选的 idf 缓存。

export const FIELD_WEIGHTS = { title: 6, summary: 3, details: 1.5, tags: 3, section: 0.5 };
export const BM25_K1 = 1.4;
export const BM25_B = 0.75;

// 停用词：避免高频虚词把检索结果拉平。
const STOP = new Set(['的', '了', '是', '在', '和', '与', '及', '或', '也', '都', '就', '要', '会', '能', '有', '什么',
  '怎么', '如何', '哪些', '哪个', '为什么', '请问', '一下', '这个', '那个', '我们', '你', '它', 'the', 'a', 'an',
  'is', 'are', 'of', 'to', 'in', 'and', 'or', 'for', 'what', 'how', 'why', 'which', 'does', 'do', 'can']);

// 同义词/别名词表（本项目维护）。键为归一化词，值为等价说法。
// 注意：对象键必须唯一；扩充时先检查重复（曾因重复键静默覆盖丢失同义词）。
export const SYNONYMS = {
  'rag': ['检索增强生成', '检索增强', 'retrieval augmented generation', '检索式生成'],
  '检索增强生成': ['rag', '检索增强'],
  '幻觉': ['hallucination', 'hallucinate', '编造', '胡说'],
  'hallucination': ['幻觉'],
  '上下文窗口': ['context window', '上下文长度', '窗口长度', 'context length'],
  'context window': ['上下文窗口'],
  'token': ['分词', '词元', '令牌'],
  '分词': ['token', 'tokenize', 'tokenization'],
  '嵌入': ['embedding', '向量', '向量化', '向量检索'],
  'embedding': ['嵌入', '向量表示'],
  '智能体': ['agent', 'agents', '代理', '智能代理'],
  'agent': ['智能体', '代理'],
  '工具调用': ['function calling', '函数调用', 'tool call', 'tool use', '工具使用'],
  'function calling': ['工具调用', '函数调用'],
  '提示': ['prompt', '提示词', '指令', '系统提示', 'prompting'],
  'prompt': ['提示', '提示词'],
  '提示注入': ['prompt injection', '注入攻击', '间接提示注入'],
  '评测': ['评估', 'evaluation', 'eval', 'benchmark', '基准', '测评', '打分'],
  '评估': ['评测', 'evaluation'],
  '培养方案': ['毕业要求', '培养目标', '培养要求', 'curriculum'],
  '微调': ['fine-tune', 'finetune', 'fine tuning', '监督微调', 'sft'],
  '忠实度': ['faithfulness', '可归因性', 'attribution', '溯源'],
  '来源': ['出处', 'source', '引用', 'citation', '证据'],
  '温度': ['temperature', '采样参数', '随机性'],
  '成本': ['价格', '费用', '计费', 'pricing', 'cost', '定价'],
  '价格': ['成本', '费用', '计费'],
  '飞书': ['feishu', 'lark', '多维表格', '妙搭', 'bitable'],
  '智谱': ['zhipu', 'glm', 'bigmodel', 'z.ai'],
  'deepseek': ['深度求索', 'ds'],
  '生态': ['ecosystem', '产业', '参与者', '上下游'],
  '认知': ['cognition', '思维', '方法', '反思'],
  '课程': ['course', '课', '课程关联', '学习路径'],
  '路线': ['pathway', '成长路线', '方向', 'career'],
  '反馈': ['feedback', '纠错', '疑问', '提意见'],
  '更新': ['update', '维护', '复核', '变更记录'],
  // 以下为本轮实测补充：查询用词与语料用词不一致导致召回失败的等价词。
  // 例：用户问「访问权限」，语料写的是「无需逐人申请权限」「公开访问」；
  //     用户问「密钥」，语料写的是「凭据」「API Key」。二者语义等价，属正当同义词而非关键词堆砌。
  '访问权限': ['访问要求', '权限', '公开访问', '无需申请权限', '无需逐人申请权限', '访问条件'],
  '访问要求': ['访问权限', '公开访问', '权限'],
  '权限': ['访问权限', '访问要求', '授权'],
  '密钥': ['api key', 'apikey', '凭据', '令牌', 'token', 'secret', '账号凭据'],
  '凭据': ['密钥', 'api key', '令牌'],
  '公开访问': ['访问权限', '匿名访问', '无需登录'],
  '云端': ['部署', '上线', '托管', '服务器', 'cloud'],
  '部署': ['云端', '上线', '托管', 'deploy'],
  '毕业要求': ['培养要求', '培养方案', '毕业能力', '培养目标', 'curriculum'],
  '成长路线': ['成长方向', '路线', '取向', 'pathway', 'career'],
  '取舍': ['权衡', 'trade-off', 'tradeoff', '选择', '决策', '为什么不'],
  '瓶颈': ['短板', '限制', '约束', 'bottleneck'],
  '降级': ['兜底', 'fallback', '离线', '不可用时'],
  '拒答': ['拒绝回答', '不知道', 'refuse', 'abstain', '不作答', '边界', '越界', '无法回答']
};

export function tokenize(text) {
  if (!text) return [];
  const lower = String(text).toLowerCase();
  const out = [];
  for (const m of lower.matchAll(/[a-z0-9][a-z0-9._+-]*/g)) {
    const w = m[0];
    if (!STOP.has(w)) out.push(w);
  }
  for (const m of lower.matchAll(/[\u4e00-\u9fa5]+/g)) {
    const s = m[0];
    for (let i = 0; i < s.length; i++) {
      if (!STOP.has(s[i])) out.push(s[i]);
      if (i + 2 <= s.length) out.push(s.slice(i, i + 2));
      if (i + 3 <= s.length) out.push(s.slice(i, i + 3));
    }
    if (s.length >= 2 && !STOP.has(s)) out.push(s);
  }
  return out;
}

export function expandQuery(text) {
  const lower = String(text || '').toLowerCase();
  const terms = new Set(tokenize(text));
  const expanded = new Set(terms);
  const hits = [];
  for (const [key, alts] of Object.entries(SYNONYMS)) {
    const pool = [key, ...alts];
    const matched = pool.filter((w) => lower.includes(w));
    if (matched.length) {
      hits.push(matched[0]);
      for (const w of pool) {
        expanded.add(w);
        for (const t of tokenize(w)) expanded.add(t);
      }
    }
  }
  return { terms: [...terms], expanded: [...expanded], synonymHits: hits };
}

/** 长度感知权重：长词更有区分度；单字权重最低（用于给语料外查询词估算信息量）。 */
export function lengthBoost(t) { return t.length >= 4 ? 2.0 : t.length === 3 ? 1.7 : t.length === 2 ? 1.25 : 0.45; }

/** BM25 单字段打分：词频饱和 + 字段长度归一化（含地板）+ IDF。 */
export function bm25Field(tfMap, docLen, avgLen, terms, weight, idf) {
  if (!tfMap || !docLen) return 0;
  let s = 0;
  for (const t of terms) {
    const tf = tfMap.get ? tfMap.get(t) : tfMap[t];
    if (!tf) continue;
    const w = idf.get ? (idf.get(t) || 0) : (idf[t] || 0);
    if (w <= 0) continue;
    // 文档长度设地板：极短字段（1-2 token）在 BM25 归一化下得分会暴涨，
    // 取 avgLen 的 25% 作为下限，既保留短字段的合理优势，又不让它压过长文本命中。
    const effLen = Math.max(docLen, avgLen * 0.25);
    const norm = tf + BM25_K1 * (1 - BM25_B + BM25_B * (effLen / Math.max(1, avgLen)));
    s += weight * w * (tf * (BM25_K1 + 1)) / Math.max(0.001, norm);
  }
  return s;
}

/** passage-level BM25：长字段按「条」分别打分取最高，避免全文长度稀释单条高相关要点。 */
export function bm25Passages(passages, avgLen, terms, weight, idf) {
  if (!passages || !passages.length) return 0;
  let best = 0;
  for (const text of passages) {
    const toks = tokenize(text);
    if (!toks.length) continue;
    const counts = new Map();
    for (const t of toks) counts.set(t, (counts.get(t) || 0) + 1);
    const s = bm25Field(counts, toks.length, avgLen, terms, weight, idf);
    if (s > best) best = s;
  }
  return best;
}

/**
 * 由文档数组构建语料统计（df -> idf、平均字段长度、passage 平均长度）。
 * @param {Array<{fields:{title,summary,details,tags},passages?:string[]}>} docs
 */
export function buildCorpusStats(docs) {
  const N = docs.length;
  const df = new Map();
  const lenSum = { title: 0, summary: 0, details: 0, tags: 0 };
  for (const doc of docs) {
    const all = new Set();
    for (const f of ['title', 'summary', 'details', 'tags']) {
      const text = doc.fields[f] || '';
      lenSum[f] += text.length;
      for (const t of tokenize(text)) all.add(t);
    }
    for (const t of all) df.set(t, (df.get(t) || 0) + 1);
  }
  const idf = new Map();
  for (const [t, c] of df) {
    const ratio = c / N;
    idf.set(t, Math.max(0.05, Math.log(1 + N / (1 + c)) * (ratio > 0.6 ? 0.3 : ratio > 0.3 ? 0.65 : 1)));
  }
  const avgLen = {};
  for (const f of ['title', 'summary', 'details', 'tags']) avgLen[f] = N ? lenSum[f] / N / 2 : 8;
  let pCount = 0, pTokSum = 0;
  for (const doc of docs) for (const t of (doc.passages || [])) { pCount++; pTokSum += tokenize(t).length; }
  const avgPassageLen = pCount ? Math.max(8, pTokSum / pCount) : 40;
  return { idf, avgLen, avgPassageLen, N };
}

/**
 * 核心检索：对 docs 打分并排序。
 * @param {string} query
 * @param {Array} docs 元素需含 kind/id/row/display_title/fields/passages
 * @param {{idf:Map,avgLen:object,avgPassageLen:number}} stats buildCorpusStats 的产物
 * @param {{limit?:number, mapTypes?:string[]}} opts
 */
export function searchCore(query, docs, stats, { limit = 8, mapTypes = null, applyFloor = true } = {}) {
  const { expanded, synonymHits } = expandQuery(query);
  if (!expanded.length) return { query, hits: [], synonymHits, total: 0, degraded: true };
  const { idf, avgLen, avgPassageLen } = stats;

  // 只用「有区分度」的词参与打分：IDF 极低的高频词不参与，避免噪声
  const useful = expanded.filter((t) => (idf.get(t) || 0) > 0.15);
  const useTerms = useful.length ? useful : expanded;

  // 实体型词元：长度 >= 4 且形如标识符（含字母+数字/点/连字符），如 glm-4.7-flash。
  // 这类词在标题中逐字出现是极强的相关性信号。
  const ENTITY_TERMS = expanded.filter((t) =>
    t.length >= 4 && /^[a-z0-9][a-z0-9._:+-]*$/.test(t) && /[a-z]/.test(t) && /[0-9._-]/.test(t));

  // ---- 查询信息量：分母必须基于「全部查询词」，而不是已过滤的在库词 ----
  // 实测教训（两轮）：分母只统计在库词时，越界查询「如何烤蛋糕」覆盖度算成 1.0，
  // 置信度虚高到 0.82，拒答机制形同虚设。不在库的词按长度加权只计入分母。
  const UNSEEN_BASE = 1.15;
  let QUERY_MASS = 0, CORPUS_MASS = 0, inCorpusTerms = 0, unseenTerms = 0;
  for (const t of expanded) {
    const w = idf.get(t) || 0;
    if (w > 0.02) { QUERY_MASS += w; CORPUS_MASS += w; inCorpusTerms++; }
    else { QUERY_MASS += UNSEEN_BASE * lengthBoost(t); unseenTerms++; }
  }

  const hits = [];
  const q = String(query).toLowerCase().trim();

  for (const doc of docs) {
    const row = doc.row;
    if (doc.kind === 'node' && mapTypes && !mapTypes.includes(row.map_type)) continue;
    let score = 0;
    const why = [];
    for (const [f, w] of [['title', FIELD_WEIGHTS.title], ['summary', FIELD_WEIGHTS.summary],
      ['details', FIELD_WEIGHTS.details], ['tags', FIELD_WEIGHTS.tags]]) {
      // details 用 passage-level 最高分，避免长文本稀释其中高度相关的一条
      const s = f === 'details' && doc.passages && doc.passages.length
        ? bm25Passages(doc.passages, avgPassageLen, useTerms, w, idf)
        : bm25Field(doc.tf ? doc.tf[f] : null, doc.len ? doc.len[f] : 0, avgLen[f], useTerms, w, idf);
      if (s > 0) { score += s; why.push(f + ':' + s.toFixed(1)); }
    }
    // ---- 精确实体匹配加成 ----
    if (doc.kind === 'node') {
      const title = doc.display_title.toLowerCase();
      if (q.length >= 2 && title.includes(q)) { score += 14; why.push('title_exact'); }
      for (const t of ENTITY_TERMS) {
        if (title.includes(t)) { score += 16; why.push('title_entity:' + t); break; }
      }
    }
    if (score <= 0) continue;

    // 查询覆盖度（IDF 加权）：命中的查询词按稀有度加权求和 / 查询总信息量。
    const matchedTerms = useTerms.filter((t) => doc.allTokens ? doc.allTokens.has(t) : false);
    let matchedMass = 0;
    for (const t of matchedTerms) matchedMass += (idf.get(t) || 0);
    const coverage = QUERY_MASS > 0 ? matchedMass / QUERY_MASS : 0;

    const base = { id: row.id, score: Math.round(score * 10) / 10, why, coverage: Math.round(coverage * 100) / 100,
      matched_terms: matchedTerms.slice(0, 8) };
    if (doc.kind === 'node') {
      hits.push({ ...base, kind: 'node', title: row.title, map_type: row.map_type, node_type: row.node_type,
        evidence_status: row.evidence_status, snippet: row.summary });
    } else if (doc.kind === 'relation') {
      hits.push({ ...base, kind: 'relation', title: doc.display_title, map_type: null, node_type: 'relation',
        evidence_status: row.evidence_status, snippet: row.description,
        source_node_id: row.source_node_id, target_node_id: row.target_node_id });
    } else {
      hits.push({ ...base, kind: 'source', title: row.title, map_type: null, node_type: 'source',
        evidence_status: null, snippet: (row.supports || [])[0] || row.notes || '', url: row.url, accessed_at: row.accessed_at });
    }
  }

  hits.sort((a, b) => b.score - a.score);
  const out = hits.slice(0, limit);

  const lexicalOverlap = QUERY_MASS > 0 ? Math.round((CORPUS_MASS / QUERY_MASS) * 100) / 100 : 0;

  // 默认在返回前应用相关性下限；Node wrapper 传 applyFloor:false 以便在图扩展之后再应用
  // （原始实现顺序：先排序取 top-limit -> 图扩展 -> 再过滤。顺序不同会导致邻居排序漂移，
  //  实测使 14 题平均召回率从 69.1% 掉到 65.5%）。
  if (applyFloor === false) {
    return { query, hits: out, total: out.length, synonymHits, degraded: false,
      irrelevant: lexicalOverlap < 0.6, lexical_overlap: lexicalOverlap,
      query_terms: useTerms.length, in_corpus_terms: inCorpusTerms, unseen_terms: unseenTerms,
      query_mass: Math.round(QUERY_MASS * 100) / 100 };
  }
  const fin = applyRelevanceFloor(out, lexicalOverlap);
  return { query, hits: fin.hits, total: fin.hits.length, synonymHits, degraded: false,
    irrelevant: fin.irrelevant, lexical_overlap: lexicalOverlap,
    query_terms: useTerms.length, in_corpus_terms: inCorpusTerms, unseen_terms: unseenTerms,
    query_mass: Math.round(QUERY_MASS * 100) / 100 };
}
/**
 * 为原始文档预计算 tf / len / allTokens（检索打分的输入）。
 * @param {Array} rawDocs 元素：{kind,id,row,display_title,fields:{title,summary,details,tags},passages?}
 */
export function prepareDocs(rawDocs) {
  for (const doc of rawDocs) {
    doc.tf = {}; doc.len = {};
    const all = new Set();
    for (const f of ['title', 'summary', 'details', 'tags']) {
      const text = doc.fields[f] || '';
      const toks = tokenize(text);
      const counts = new Map();
      for (const t of toks) counts.set(t, (counts.get(t) || 0) + 1);
      doc.tf[f] = counts;
      doc.len[f] = toks.length;
      for (const t of counts.keys()) all.add(t);
    }
    doc.allTokens = all;
  }
  return rawDocs;
}
/**
 * 相关性下限（实测教训）：中文 n-gram 会产生大量单字/双字碎片，只要语料里出现就得分，
 * 噪声会淹没空状态；越界查询也会得到一堆「碰巧共享常见词」的命中。
 * 阈值必须与 AI 的越界拒答阈值一致，否则「搜索说有结果、AI 说越界」自相矛盾。
 */
export function applyRelevanceFloor(hits, lexicalOverlap, { overlapFloor = 0.6, coverageFloor = 0.12 } = {}) {
  const irrelevant = lexicalOverlap < overlapFloor;
  const filtered = irrelevant ? [] : hits.filter((h) => (h.coverage ?? 0) >= coverageFloor || h.kind === 'source');
  return { hits: filtered, irrelevant };
}
