// AI 调用层：多渠道（主 + 备）、超时、重试、限流、用量日志、思考模式兼容。
// 密钥只从服务端环境变量读取；任何错误信息都不会把密钥带出。
import { getDb, j } from './db.mjs';
import { buildSystemPrompt, buildUserPrompt } from './prompt.mjs';

// ---------- 配置 ----------
export function channels() {
  const list = [];
  // 主渠道：智谱 GLM。可用官方端点，也可用任意 OpenAI 兼容网关。
  const zkey = process.env.ZHIPU_API_KEY || process.env.GLM_API_KEY || process.env.LLM_API_KEY || '';
  const zbase = process.env.ZHIPU_BASE_URL || process.env.LLM_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4';
  const zmodel = process.env.ZHIPU_MODEL || process.env.LLM_MODEL || 'glm-4.7-flash';
  if (zkey) list.push({ id: 'zhipu', name: '智谱 GLM', key: zkey, baseUrl: zbase.replace(/\/$/, ''), model: zmodel });
  // 备用渠道：DeepSeek（OpenAI 兼容）。
  const dkey = process.env.DEEPSEEK_API_KEY || '';
  const dbase = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
  const dmodel = process.env.DEEPSEEK_MODEL || 'deepseek-flash';
  if (dkey && dkey !== zkey) list.push({ id: 'deepseek', name: 'DeepSeek', key: dkey, baseUrl: dbase.replace(/\/$/, ''), model: dmodel });
  // 显式备用渠道（可与主渠道不同网关/模型）
  const bkey = process.env.LLM_FALLBACK_API_KEY || '';
  if (bkey) list.push({ id: 'fallback', name: '备用渠道', key: bkey,
    baseUrl: (process.env.LLM_FALLBACK_BASE_URL || zbase).replace(/\/$/, ''),
    model: process.env.LLM_FALLBACK_MODEL || zmodel });
  return list;
}

export function aiStatus() {
  const ch = channels();
  // 安全：不对外暴露 baseUrl。实测发现 /api/ai/status 会把内部网关地址
  // （含内网/中转 IP 与端口）返回给任意公开访问者，属于基础设施信息泄露。
  // 前端只需要「渠道是否可用 + 模型名」用于展示，baseUrl 只在服务端内部使用。
  // 仅当显式设置 AI_EXPOSE_BASE_URL=true（本地调试）时才返回。
  const exposeBase = process.env.AI_EXPOSE_BASE_URL === 'true';
  return {
    enabled: ch.length > 0,
    channels: ch.map((c) => ({ id: c.id, name: c.name, model: c.model, ...(exposeBase ? { baseUrl: c.baseUrl } : {}) })),
    primary: ch[0] ? { id: ch[0].id, model: ch[0].model } : null,
    note: ch.length ? null : '未配置模型 API Key，AI 助手运行在「非生成式检索直出」降级模式（功能可用，但不生成解释性文字）。'
  };
}

// ---------- 限流 ----------
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = Number(process.env.AI_RATE_LIMIT_PER_MIN || 12);
const buckets = new Map(); // key -> number[] of timestamps

export function rateLimit(key, max = RATE_MAX, windowMs = RATE_WINDOW_MS) {
  const now = Date.now();
  const arr = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    buckets.set(key, arr);
    return { ok: false, retryAfterSec: Math.ceil((windowMs - (now - arr[0])) / 1000), count: arr.length, max };
  }
  arr.push(now);
  buckets.set(key, arr);
  return { ok: true, count: arr.length, max };
}

// ---------- 输入校验 ----------
export const MAX_QUESTION_LEN = 500;

export function validateQuestion(q) {
  if (typeof q !== 'string') return { ok: false, code: 'invalid_input', message: '问题必须是字符串。' };
  const s = q.trim();
  if (!s) return { ok: false, code: 'empty', message: '请输入问题。' };
  if (s.length > MAX_QUESTION_LEN) return { ok: false, code: 'too_long', message: '问题过长（上限 ' + MAX_QUESTION_LEN + ' 字），请精简后重试。' };
  // 控制字符过滤（不影响正常中英文与标点）
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(s)) return { ok: false, code: 'invalid_chars', message: '问题包含不可见控制字符，已被拒绝。' };
  return { ok: true, question: s };
}

// ---------- 单次模型调用 ----------
// 思考型模型单次调用实测 4-40s；超时设 90s，重试次数设 1（共 2 次尝试），
// 避免「多次重试 x 长超时」把请求拖到数分钟（实测曾导致 E2E 等待超时）。
const TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 90000);

async function callOnce(ch, messages, { maxTokens, temperature, signal }) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  if (signal) signal.addEventListener('abort', () => ctrl.abort(), { once: true });
  const t0 = Date.now();
  try {
    const res = await fetch(ch.baseUrl + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + ch.key },
      body: JSON.stringify({ model: ch.model, messages, max_tokens: maxTokens, temperature, stream: false }),
      signal: ctrl.signal
    });
    const text = await res.text();
    if (!res.ok) {
      let msg = 'HTTP ' + res.status;
      try { const ej = JSON.parse(text); msg += ' ' + (ej.error?.message || ej.message || '').slice(0, 200); } catch { msg += ' ' + text.slice(0, 160); }
      const err = new Error(msg); err.status = res.status; err.retryable = res.status === 429 || res.status >= 500;
      throw err;
    }
    const data = JSON.parse(text);
    const choice = data?.choices?.[0] || {};
    const m = choice.message || {};
    const content = (m.content || '').trim();
    const reasoning = (m.reasoning_content || m.reasoning || '').trim();
    const finishReason = choice.finish_reason || null;
    // 重要：绝不用 reasoning_content 顶替 content。
    // 实测教训：思考型渠道会先产生大量 reasoning_tokens，若 max_tokens 不足，
    // 正文额度被思考过程占满 -> content 为空。此时若回退展示思考过程，
    // 用户看到的会是模型的内部推演草稿而非答案（曾真实发生：1400 token 中 1394 为 reasoning）。
    // 正确做法是把它识别为「截断」并如实上报，同时提示提高预算。
    const truncated = finishReason === 'length' || (!content && !!reasoning);
    return {
      content, reasoning, raw_content: m.content || '',
      usage: data.usage || {}, finish_reason: finishReason, truncated,
      latency_ms: Date.now() - t0,
      channel: ch.id, model: ch.model
    };
  } finally { clearTimeout(timer); }
}

async function callWithRetry(ch, messages, opts) {
  const attempts = Number(process.env.AI_RETRIES || 1) + 1;
  let lastErr = null;
  for (let i = 0; i < attempts; i++) {
    try { return await callOnce(ch, messages, opts); }
    catch (e) {
      lastErr = e;
      const retryable = e.name === 'AbortError' || e.retryable === true || /fetch failed|ECONNRESET|ETIMEDOUT/i.test(String(e.message));
      if (!retryable || i === attempts - 1) break;
      // 指数退避 + 抖动。实测（2026-11-01）：兼容网关在并发或短时高频下会立即返回 503，
      // 固定 800ms 线性退避不足以避开限流窗口，故改为 1.2s * 2^i 并加随机抖动。
      const base = Number(process.env.AI_RETRY_BASE_MS || 1200);
      const wait = Math.min(20000, base * Math.pow(2, i)) + Math.round(Math.random() * 600);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr || new Error('模型调用失败');
}

function logUsage(row) {
  try {
    getDb().prepare(`INSERT INTO ai_usage (ts, channel, model, prompt_tokens, completion_tokens, latency_ms, status, question_hash, error, cost_note)
      VALUES (?,?,?,?,?,?,?,?,?,?)`).run(
      new Date().toISOString(), row.channel || null, row.model || null,
      row.prompt_tokens || 0, row.completion_tokens || 0, row.latency_ms || 0,
      row.status, row.question_hash || null, row.error || null, row.cost_note || null);
  } catch { /* 用量日志失败不应影响主流程 */ }
}

// ---------- 引用校验：只保留真实出现在检索结果中的节点 ID ----------
export function verifyCitations(answerText, ctx) {
  const allowedNodes = new Set(ctx.node_ids || []);
  for (const r of ctx.relations || []) { allowedNodes.add(r.from); allowedNodes.add(r.to); }
  const allowedSources = new Set((ctx.sources || []).map((s) => s.source_id));
  for (const c of ctx.chunks || []) for (const s of c.sources || []) {
    const m = s.match(/\[(S-\d+)\]/); if (m) allowedSources.add(m[1]);
  }
  const text = String(answerText || '');
  const foundNodes = [...new Set([...text.matchAll(/\b([DEC]-[A-Za-z0-9._-]{2,})\b/g)].map((m) => m[1]))];
  const foundSources = [...new Set([...text.matchAll(/\b(S-\d{2})\b/g)].map((m) => m[1]))];
  const validNodes = foundNodes.filter((id) => allowedNodes.has(id));
  const invalidNodes = foundNodes.filter((id) => !allowedNodes.has(id));
  const validSources = foundSources.filter((id) => allowedSources.has(id));
  const invalidSources = foundSources.filter((id) => !allowedSources.has(id));
  return {
    nodes: validNodes, sources: validSources,
    dropped: [...invalidNodes, ...invalidSources],
    has_valid_citation: validNodes.length > 0 || validSources.length > 0
  };
}

// ---------- 越界拒答：知识边界雾化 ----------
export function outOfScopeAnswer(ctx, overlap) {
  const answer = [
    '【超出地图边界】这个问题与当前课程资料的词汇重叠很低（约 ' + Math.round((overlap || 0) * 100) + '%），',
    '本站的三张地图只覆盖「大语言模型应用开发与评估」及其课程资料，无法为它提供有依据的回答。',
    '',
    '为避免编造，这里不给出推测性答案。你可以：',
    '· 把问题改问到本领域范围内（例如 RAG、提示设计、模型评测、培养方案毕业要求、成长路线等）；',
    '· 在「反馈与更新」提交你的问题，若确属地图应覆盖的内容，我们会核实后补入；',
    '· 直接浏览三张地图，从相邻概念继续探索。',
    '',
    '整体证据状态：资料未覆盖（越界）。'
  ].join('\n');
  return { mode: 'out_of_scope', answer, citations: { nodes: [], sources: [] },
    evidence: '资料未覆盖', grounded: false, out_of_scope: true };
}

// ---------- 非生成式降级：直接用检索结果组织答案 ----------
export function retrievalOnlyAnswer(ctx) {
  const lines = [];
  const chunks = ctx.chunks || [];
  if (!chunks.length) {
    return {
      mode: 'retrieval_only',
      answer: '【资料未覆盖】本次检索没有命中课程资料中的任何节点或来源，因此无法回答这个问题。\n\n缺口说明：当前语料仅包含《人工智能前沿与创新》课程讲义整理稿与 2026 级人工智能专业培养方案的「培养目标 / 毕业要求」部分，不含课程目录、学分表等。\n\n下一步：可在「反馈与更新」提交你的问题，我们会核实后补入地图；也可以直接浏览三张地图查找相邻概念。',
      citations: { nodes: [], sources: [] },
      evidence: '资料未覆盖',
      grounded: false
    };
  }
  lines.push('【资料事实】（当前为非生成式检索模式，以下为地图中直接命中的内容，未经模型改写）');
  for (const c of chunks.slice(0, 4)) {
    lines.push('· ' + c.title + '（' + c.node_id + '，证据:' + c.evidence_status + '，核查:' + c.last_checked + '）');
    lines.push('  ' + c.summary);
    const first = (c.details || [])[0];
    if (first) lines.push('  - ' + first);
  }
  if ((ctx.relations || []).length) {
    lines.push('');
    lines.push('【相关关系】');
    for (const r of ctx.relations.slice(0, 3)) lines.push('· ' + r.from + ' —' + r.type + '→ ' + r.to + '：' + r.description);
  }
  if ((ctx.sources || []).length) {
    lines.push('');
    lines.push('【来源】');
    for (const s of ctx.sources.slice(0, 3)) lines.push('· [' + s.source_id + '] ' + s.title + '（访问 ' + s.accessed_at + '）');
  }
  lines.push('');
  lines.push('整体证据状态：' + (ctx.confidence >= 0.45 ? '资料充分' : ctx.confidence > 0 ? '部分覆盖' : '资料未覆盖'));
  return {
    mode: 'retrieval_only',
    answer: lines.join('\n'),
    citations: { nodes: chunks.slice(0, 4).map((c) => c.node_id), sources: (ctx.sources || []).slice(0, 3).map((s) => s.source_id) },
    evidence: ctx.confidence >= 0.45 ? '资料充分' : ctx.confidence > 0 ? '部分覆盖' : '资料未覆盖',
    grounded: true
  };
}

/**
 * 主入口：地图约束的概念查询与解释。
 * @param {string} question
 * @param {object} ctx buildContext() 的结果
 * @param {object} opts {clientKey, maxTokens, temperature, signal}
 */
export async function ask(question, ctx, opts = {}) {
  // 默认 3200：思考型渠道会先消耗 reasoning_tokens，再产生正文。
  // 实测（2026-11-01，glm-4.7-flash 经兼容网关）：max_tokens=1400 时 reasoning 占用 1394，正文为空；
  // max_tokens=800 的短问答中 reasoning 占 588、正文正常返回。故需为思考过程预留足够额度。
  const maxTokens = Math.min(Number(opts.maxTokens || process.env.AI_MAX_TOKENS || 3200),
    Number(process.env.AI_MAX_TOKENS_CAP || 4000));
  const temperature = Number(opts.temperature ?? process.env.AI_TEMPERATURE ?? 0.2);
  const chs = channels();

  // 顺序很重要：先判「与全站无关」（越界），再判「相关但资料不足」（无证据）。
  // 若颠倒，越界查询会因上下文为空而落到 no_evidence 分支，前端会显示
  // 「课程资料未覆盖」而不是「超出地图边界」，语义不准确（实测触发过该问题）。
  const overlapFirst = ctx.lexical_overlap ?? 1;
  const scopeThresholdFirst = Number(process.env.AI_SCOPE_OVERLAP || 0.62);
  if (ctx.irrelevant || overlapFirst < scopeThresholdFirst) {
    const r = outOfScopeAnswer(ctx, overlapFirst);
    logUsage({ status: 'out_of_scope', latency_ms: 0, question_hash: hash(question) });
    return { ...r, status: 'out_of_scope', channel: null, model: null, usage: null, latency_ms: 0,
      lexical_overlap: overlapFirst, confidence: ctx.confidence ?? 0 };
  }

  // 无命中 -> 直接走拒答，不消耗模型调用
  if (!ctx.chunks.length && !ctx.relations.length && !ctx.sources.length) {
    const r = retrievalOnlyAnswer(ctx);
    logUsage({ status: 'no_evidence', latency_ms: 0, question_hash: hash(question) });
    return { ...r, status: 'no_evidence', channel: null, model: null, usage: null, latency_ms: 0 };
  }

  // ---- 越界闸门（scope gate）----
  // lexical_overlap = 查询信息量中语料能回应的比例。实测：领域内问题 >= 0.73，领域外问题 <= 0.59，
  // 中间有明显间隔。低于阈值说明问题与课程资料几乎无词汇重叠（如天气、菜谱、币价），
  // 直接走「知识边界雾化」拒答，不调用模型——既省成本，也避免模型用通用知识强行作答。
  // 注意：课程范围内但资料未覆盖的问题（如具体课名）overlap 仍然较高（>=0.73），
  // 不会被此闸门拦截，而是交由模型基于「缺口节点」做内容层拒答（说明缺什么、去哪补）。
  // 二道防线：低重叠 + 低置信度的组合（阈值可通过环境变量单独收紧）
  const overlap = ctx.lexical_overlap ?? 1;
  const scopeThreshold = Number(process.env.AI_SCOPE_OVERLAP || 0.62);
  const confThreshold = Number(process.env.AI_SCOPE_CONF || 0.35);
  if (overlap < scopeThreshold && (ctx.confidence ?? 0) < confThreshold + 0.15) {
    const r = outOfScopeAnswer(ctx, overlap);
    logUsage({ status: 'out_of_scope', latency_ms: 0, question_hash: hash(question) });
    return { ...r, status: 'out_of_scope', channel: null, model: null, usage: null, latency_ms: 0,
      lexical_overlap: overlap, confidence: ctx.confidence ?? 0 };
  }

  // 无密钥 -> 非生成式降级（网站核心功能不依赖外部 API）
  if (!chs.length) {
    const r = retrievalOnlyAnswer(ctx);
    logUsage({ status: 'degraded_no_key', latency_ms: 0, question_hash: hash(question) });
    return { ...r, status: 'degraded', channel: null, model: null, usage: null, latency_ms: 0,
      degraded_reason: 'no_api_key' };
  }

  const messages = [
    { role: 'system', content: buildSystemPrompt() },
    { role: 'user', content: buildUserPrompt(ctx) }
  ];

  let lastError = null;
  for (const ch of chs) {
    try {
      let out = await callWithRetry(ch, messages, { maxTokens, temperature, signal: opts.signal });
      // 截断（思考过程占满额度）-> 提高预算重试一次
      // 截断（思考占满额度）时提高预算重试一次，但设硬上限：
      // 过大的 max_tokens 会让思考型模型长时间推理，实测 8000 会拖到数分钟。
      const BUDGET_CAP = Number(process.env.AI_MAX_TOKENS_CAP || 4000);
      if (out.truncated && !out.content && maxTokens < BUDGET_CAP) {
        const bumped = Math.min(BUDGET_CAP, Math.round(maxTokens * 1.6));
        try { out = await callWithRetry(ch, messages, { maxTokens: bumped, temperature, signal: opts.signal }); }
        catch { /* 保留首次结果，走下面的截断分支 */ }
      }
      if (!out.content) {
        // 仍无正文：如实上报截断，不伪造答案
        logUsage({ channel: ch.id, model: ch.model, prompt_tokens: out.usage?.prompt_tokens || 0,
          completion_tokens: out.usage?.completion_tokens || 0, latency_ms: out.latency_ms,
          status: 'truncated', question_hash: hash(question), error: 'finish_reason=' + out.finish_reason });
        return {
          mode: 'generative', status: 'truncated', channel: ch.id, model: ch.model,
          answer: null, citations: { nodes: [], sources: [] }, grounded: false,
          evidence: '资料未覆盖', usage: out.usage || null, latency_ms: out.latency_ms,
          truncated: true, finish_reason: out.finish_reason,
          message: '模型返回了思考过程但未产出正文（输出额度被思考过程占满，finish_reason=' + (out.finish_reason || 'unknown') + '）。已如实上报，未展示思考草稿。可提高 AI_MAX_TOKENS 后重试。'
        };
      }
      const cit = verifyCitations(out.content, ctx);
      logUsage({ channel: ch.id, model: ch.model, prompt_tokens: out.usage?.prompt_tokens || 0,
        completion_tokens: out.usage?.completion_tokens || 0, latency_ms: out.latency_ms,
        status: 'ok', question_hash: hash(question) });
      const grounded = cit.has_valid_citation;
      return {
        mode: 'generative', status: 'ok', channel: ch.id, model: ch.model,
        answer: out.content, reasoning: out.reasoning || null,
        citations: { nodes: cit.nodes, sources: cit.sources },
        dropped_citations: cit.dropped,
        grounded,
        evidence: classifyEvidence(out.content, ctx, grounded),
        usage: out.usage || null, latency_ms: out.latency_ms,
        warning: cit.dropped.length ? '回答中出现 ' + cit.dropped.length + ' 个不在检索结果内的引用，已剔除（防止编造来源）。' : null
      };
    } catch (e) {
      lastError = e;
      logUsage({ channel: ch.id, model: ch.model, latency_ms: 0, status: 'error',
        question_hash: hash(question), error: String(e.message || e).slice(0, 300) });
      // 尝试下一个渠道
    }
  }

  // 所有渠道失败 -> 降级为非生成式检索直出，保证核心可用
  const r = retrievalOnlyAnswer(ctx);
  return { ...r, status: 'degraded', channel: null, model: null, usage: null, latency_ms: 0,
    degraded_reason: 'all_channels_failed',
    error_message: sanitize(String(lastError?.message || lastError || '模型不可用')) };
}

export function classifyEvidence(text, ctx, grounded) {
  const t = String(text || '');
  // 取「最后一行」的整体证据状态标注。
  // 实测教训：模型按提示要求会列出全部三类标签（【资料事实】/【基于资料的解释】/【资料未覆盖】），
  // 初版用 /资料未覆盖/ 全文匹配，导致一个引用充分的好答案被误判为「资料未覆盖」。
  const marks = t.match(/(?:整体)?证据状态[：:]\s*\**\s*(资料充分|部分覆盖|资料未覆盖)/g);
  if (marks && marks.length) {
    const last = marks[marks.length - 1].match(/(资料充分|部分覆盖|资料未覆盖)/);
    if (last) return last[1];
  }
  if (/无法回答|未提及|没有相关资料/.test(t)) return '资料未覆盖';
  if (!grounded) return ctx.confidence >= 0.45 ? '部分覆盖' : '资料未覆盖';
  return ctx.confidence >= 0.45 ? '资料充分' : '部分覆盖';
}

function hash(s) {
  let h = 2166136261;
  for (const ch of String(s || '')) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16);
}

/** 防止错误信息泄露密钥或内部地址细节。 */
export function sanitize(msg) {
  return String(msg || '')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer ***')
    .replace(/sk-[A-Za-z0-9._-]+/g, '***')
    .replace(/(api[_-]?key["']?\s*[:=]\s*)["']?[A-Za-z0-9._-]+/gi, '$1***')
    .slice(0, 240);
}
/**
 * 裸模型调用：供评测裁判等内部用途使用。
 * 与 ask() 的区别：不注入地图上下文、不做引用校验、不做越界闸门；
 * 仍复用渠道列表、超时、重试与用量日志。无可用渠道时返回 null（调用方自行降级）。
 */
export async function askRaw(prompt, opts = {}) {
  const chs = channels();
  if (!chs.length) return null;
  const maxTokens = Math.min(Number(opts.maxTokens || 800), 4000);
  const temperature = Number(opts.temperature ?? 0);
  const messages = [
    { role: 'system', content: '你是一个严格的评测裁判。只按要求输出，不添加解释。' },
    { role: 'user', content: prompt }
  ];
  for (const ch of chs) {
    try {
      const out = await callWithRetry(ch, messages, { maxTokens, temperature, signal: opts.signal });
      if (out.content) {
        logUsage({ channel: ch.id, model: ch.model, prompt_tokens: out.usage?.prompt_tokens || 0,
          completion_tokens: out.usage?.completion_tokens || 0, latency_ms: out.latency_ms,
          status: 'judge_ok', question_hash: hash('judge') });
        return { content: out.content, model: ch.model, channel: ch.id, latency_ms: out.latency_ms };
      }
      // 思考型渠道可能耗尽额度：裁判场景下提高预算重试一次
      if (out.truncated && maxTokens < 2000) {
        const retry = await callWithRetry(ch, messages, { maxTokens: 2000, temperature, signal: opts.signal });
        if (retry.content) {
          logUsage({ channel: ch.id, model: ch.model, prompt_tokens: retry.usage?.prompt_tokens || 0,
            completion_tokens: retry.usage?.completion_tokens || 0, latency_ms: retry.latency_ms,
            status: 'judge_ok', question_hash: hash('judge') });
          return { content: retry.content, model: ch.model, channel: ch.id, latency_ms: retry.latency_ms };
        }
      }
    } catch (e) {
      logUsage({ channel: ch.id, model: ch.model, latency_ms: 0, status: 'judge_error',
        question_hash: hash('judge'), error: String(e.message || e).slice(0, 200) });
    }
  }
  return null;
}
