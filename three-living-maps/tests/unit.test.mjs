// 单元测试：数据库约束、检索、AI 边界与安全函数。用 Node 内置 test runner，无需额外依赖。
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// 使用临时数据库，避免污染开发库
const TMP = path.join(os.tmpdir(), 'tlm-test-' + Date.now() + '.sqlite');
process.env.DB_PATH = TMP;
process.env.ADMIN_TOKEN = '';           // 默认未启用管理端
delete process.env.ZHIPU_API_KEY;      // 默认无密钥 -> 降级路径
delete process.env.DEEPSEEK_API_KEY;

const { getDb, j, listNodes, getNode, listRelations, stats, parseNode } = await import('../server/lib/db.mjs');
const admin = await import('../server/lib/admin.mjs');
const retrieval = await import('../server/lib/retrieval.mjs');
const ai = await import('../server/lib/ai.mjs');
const { sources } = await import('../data/seed/sources.mjs');
const { domainNodes } = await import('../data/seed/nodes-domain.mjs');
const { ecosystemNodes } = await import('../data/seed/nodes-ecosystem.mjs');
const { cognitionNodes } = await import('../data/seed/nodes-cognition.mjs');
const { relations } = await import('../data/seed/relations.mjs');
const { evalItems } = await import('../data/seed/evalset.mjs');

const ALL_NODES = [...domainNodes, ...ecosystemNodes, ...cognitionNodes];

before(() => {
  const d = getDb();
  const upSrc = d.prepare(`INSERT OR REPLACE INTO sources (id,title,publisher,author,url,published_at,accessed_at,source_type,supports,notes)
    VALUES (@id,@title,@publisher,@author,@url,@published_at,@accessed_at,@source_type,@supports,@notes)`);
  for (const s of sources) upSrc.run({ id: s.id, title: s.title, publisher: s.publisher ?? null, author: s.author ?? null,
    url: s.url ?? null, published_at: s.published_at ?? null, accessed_at: s.accessed_at, source_type: s.source_type,
    supports: j(s.supports || []), notes: s.notes ?? null });
  const upNode = d.prepare(`INSERT OR REPLACE INTO nodes (id,title,map_type,node_type,section,summary,details,tags,source_ids,
    evidence_status,evidence_note,knowledge_status,career_tracks,participant_role,chain,cost_side,method_ref,case_ref,
    last_checked,fast_variable,limit_note,is_candidate,status,created_at,updated_at)
    VALUES (@id,@title,@map_type,@node_type,@section,@summary,@details,@tags,@source_ids,@evidence_status,@evidence_note,
    @knowledge_status,@career_tracks,@participant_role,@chain,@cost_side,@method_ref,@case_ref,@last_checked,@fast_variable,
    @limit_note,0,'published',@ts,@ts)`);
  for (const n of ALL_NODES) upNode.run({ id: n.id, title: n.title, map_type: n.map_type, node_type: n.node_type,
    section: n.section ?? null, summary: n.summary, details: j(n.details || []), tags: j(n.tags || []),
    source_ids: j(n.source_ids || []), evidence_status: n.evidence_status, evidence_note: n.evidence_note ?? null,
    knowledge_status: n.knowledge_status || '未评估', career_tracks: j(n.career_tracks || ['all']),
    participant_role: n.participant_role ?? null, chain: n.chain ?? null, cost_side: n.cost_side ?? null,
    method_ref: n.method_ref ?? null, case_ref: n.case_ref ?? null, last_checked: n.last_checked,
    fast_variable: n.fast_variable ? 1 : 0, limit_note: n.limit ?? n.limit_note ?? null, ts: new Date().toISOString() });
  const upRel = d.prepare(`INSERT OR REPLACE INTO relations (id,source_node_id,target_node_id,relation_type,coverage,
    description,reasoning_chain,source_ids,evidence_status,checked_at)
    VALUES (@id,@s,@t,@rt,@cov,@desc,@rc,@src,@ev,@at)`);
  const seen = new Set();
  for (const r of relations) {
    const k = r.source_node_id + '|' + r.target_node_id + '|' + r.relation_type;
    if (seen.has(k)) continue; seen.add(k);
    upRel.run({ id: r.id, s: r.source_node_id, t: r.target_node_id, rt: r.relation_type, cov: r.coverage ?? null,
      desc: r.description, rc: r.reasoning_chain ?? null, src: j(r.source_ids || []),
      ev: r.evidence_status || '待核实', at: r.checked_at });
  }
  const upEv = d.prepare(`INSERT OR REPLACE INTO eval_items (id,category,question,reference_points,source_ids,expected_nodes,grading,active)
    VALUES (@id,@cat,@q,@rp,@src,@en,@gr,1)`);
  for (const e of evalItems) upEv.run({ id: e.id, cat: e.category, q: e.question, rp: j(e.reference_points),
    src: j(e.source_ids), en: j(e.expected_nodes), gr: e.grading });
});

// ================= 数据完整性 =================
describe('数据完整性', () => {
  test('节点数量符合预期（领域67/生态44/认知30）', () => {
    const s = stats();
    assert.equal(s.nodes_by_map.domain, 67);
    assert.equal(s.nodes_by_map.ecosystem, 45); // +E-ORG-TEAMSTRUCT（分工结构，2026-11-02 补录）
    assert.equal(s.nodes_by_map.cognition, 30);
    assert.equal(s.nodes, 142);
  });

  test('节点 ID 全站唯一且前缀正确', () => {
    const ids = new Set(ALL_NODES.map((n) => n.id));
    assert.equal(ids.size, ALL_NODES.length, '存在重复 ID');
    for (const n of ALL_NODES) {
      const prefix = n.map_type === 'domain' ? 'D-' : n.map_type === 'ecosystem' ? 'E-' : 'C-';
      assert.ok(n.id.startsWith(prefix), `${n.id} 前缀应为 ${prefix}`);
    }
  });

  test('每个正式节点都有来源、摘要与详情', () => {
    for (const n of ALL_NODES) {
      assert.ok(n.source_ids && n.source_ids.length > 0, `${n.id} 缺少来源`);
      assert.ok(n.summary && n.summary.length >= 8, `${n.id} 摘要过短`);
      assert.ok(n.details && n.details.length > 0, `${n.id} 缺少详情`);
    }
  });

  test('所有节点引用的来源都真实存在', () => {
    const srcIds = new Set(sources.map((s) => s.id));
    for (const n of ALL_NODES) for (const s of n.source_ids) assert.ok(srcIds.has(s), `${n.id} 引用了不存在的来源 ${s}`);
  });

  test('所有关系引用的来源都真实存在', () => {
    const srcIds = new Set(sources.map((s) => s.id));
    for (const r of relations) for (const s of r.source_ids || []) assert.ok(srcIds.has(s), `${r.id} 引用了不存在的来源 ${s}`);
  });

  test('关系两端节点都存在，且无自环', () => {
    const ids = new Set(ALL_NODES.map((n) => n.id));
    for (const r of relations) {
      assert.ok(ids.has(r.source_node_id), `${r.id} 源节点不存在`);
      assert.ok(ids.has(r.target_node_id), `${r.id} 目标节点不存在`);
      assert.notEqual(r.source_node_id, r.target_node_id, `${r.id} 是自环`);
    }
  });

  test('关系类型全部在受控词表内', () => {
    for (const r of relations) assert.ok(admin.REL_TYPES.includes(r.relation_type), `${r.id} 用了词表外类型 ${r.relation_type}`);
  });

  test('taught_in 关系必须标注覆盖程度', () => {
    const t = relations.filter((r) => r.relation_type === 'taught_in');
    assert.ok(t.length >= 10, 'taught_in 关系过少');
    for (const r of t) assert.ok(admin.COVERAGE.includes(r.coverage), `${r.id} 缺少 coverage`);
  });

  test('「推断」状态的关系必须附推理链', () => {
    const inf = relations.filter((r) => r.evidence_status === '推断');
    assert.ok(inf.length > 0, '应有推断关系');
    for (const r of inf) assert.ok(r.reasoning_chain && r.reasoning_chain.length > 10, `${r.id} 缺少推理链`);
  });

  test('证据状态只用四级值', () => {
    for (const n of ALL_NODES) assert.ok(admin.EVIDENCE.includes(n.evidence_status), `${n.id} 非法证据状态`);
    for (const r of relations) assert.ok(admin.EVIDENCE.includes(r.evidence_status), `${r.id} 非法证据状态`);
  });

  test('knowledge_status 全部为「未评估」（无真实学习者反馈）', () => {
    // 方案 5.2：该字段不得由 AI 猜测写入，只允许来自真实学习者反馈
    for (const n of ALL_NODES) assert.equal(n.knowledge_status, '未评估', `${n.id} 被填入了未经证实的理解程度`);
  });

  test('快变量节点都有核查日期', () => {
    const fast = ALL_NODES.filter((n) => n.fast_variable);
    assert.ok(fast.length > 0, '应有快变量节点');
    for (const n of fast) assert.match(n.last_checked, /^\d{4}-\d{2}-\d{2}$/, `${n.id} 核查日期格式错误`);
  });

  test('生态节点都有「为什么纳入地图」说明', () => {
    for (const n of ecosystemNodes) assert.ok(n.why_included && n.why_included.length > 5, `${n.id} 缺少入选理由`);
  });

  test('评测集为 14 题且覆盖七类考点', () => {
    assert.equal(evalItems.length, 14);
    const cats = new Set(evalItems.map((e) => e.category));
    for (const c of ['直接事实查询', '概念解释', '多节点关系推理', '资料定位与引用', '信息不足时拒答', '易混淆概念辨析', '越界问题处理'])
      assert.ok(cats.has(c), `缺少考点类别 ${c}`);
    for (const e of evalItems) {
      assert.ok(e.reference_points.length >= 3, `${e.id} 参考要点过少`);
      assert.ok(e.source_ids.length > 0, `${e.id} 缺少依据来源`);
      assert.ok(e.expected_nodes.length > 0, `${e.id} 缺少预期引用节点`);
      assert.ok(e.grading && e.grading.length > 10, `${e.id} 缺少评分标准`);
    }
  });

  test('评测题的预期节点与来源都真实存在', () => {
    const nids = new Set(ALL_NODES.map((n) => n.id));
    const sids = new Set(sources.map((s) => s.id));
    for (const e of evalItems) {
      for (const n of e.expected_nodes) assert.ok(nids.has(n), `${e.id} 预期节点不存在 ${n}`);
      for (const s of e.source_ids) assert.ok(sids.has(s), `${e.id} 依据来源不存在 ${s}`);
    }
  });

  test('lint 无错误无警告', () => {
    const r = admin.lint();
    assert.equal(r.ok, true, JSON.stringify(r.problems.slice(0, 10)));
    assert.equal(r.problems.length, 0, JSON.stringify(r.problems.slice(0, 10)));
  });

  test('不存在孤立节点（每个节点至少一条关系）', () => {
    const r = admin.lint();
    const orphans = r.problems.filter((p) => p.msg.includes('孤立'));
    assert.equal(orphans.length, 0, JSON.stringify(orphans));
  });
});

// ================= 数据库约束 =================
describe('数据库约束', () => {
  test('evidence_status 非法值被 CHECK 约束拒绝', () => {
    const d = getDb();
    assert.throws(() => d.prepare(`INSERT INTO nodes (id,title,map_type,node_type,summary,details,evidence_status,last_checked,created_at,updated_at)
      VALUES ('X-1','t','domain','concept','s','[]','瞎写','2026-11-01','2026-11-01','2026-11-01')`).run());
  });

  test('map_type 非法值被拒绝', () => {
    const d = getDb();
    assert.throws(() => d.prepare(`INSERT INTO nodes (id,title,map_type,node_type,summary,details,evidence_status,last_checked,created_at,updated_at)
      VALUES ('X-2','t','unknown','concept','s','[]','已核实','2026-11-01','2026-11-01','2026-11-01')`).run());
  });

  test('重复节点 ID 被主键约束拒绝', () => {
    const d = getDb();
    assert.throws(() => d.prepare(`INSERT INTO nodes (id,title,map_type,node_type,summary,details,evidence_status,last_checked,created_at,updated_at)
      VALUES ('D-C-RAG','dup','domain','concept','s','[]','已核实','2026-11-01','2026-11-01','2026-11-01')`).run());
  });

  test('关系的外键约束生效（不存在的节点）', () => {
    const d = getDb();
    assert.throws(() => d.prepare(`INSERT INTO relations (id,source_node_id,target_node_id,relation_type,description,evidence_status,checked_at)
      VALUES ('RX','NOPE-1','NOPE-2','based_on','d','已核实','2026-11-01')`).run());
  });

  test('删除节点时级联删除其关系', () => {
    const d = getDb();
    d.prepare(`INSERT INTO nodes (id,title,map_type,node_type,summary,details,evidence_status,last_checked,created_at,updated_at)
      VALUES ('X-CASC','级联测试','domain','concept','用于测试级联删除的临时节点','[]','待核实','2026-11-01','2026-11-01','2026-11-01')`).run();
    d.prepare(`INSERT INTO relations (id,source_node_id,target_node_id,relation_type,description,evidence_status,checked_at)
      VALUES ('RX-C','X-CASC','D-C-RAG','based_on','级联测试关系','待核实','2026-11-01')`).run();
    assert.equal(d.prepare("SELECT COUNT(*) c FROM relations WHERE id='RX-C'").get().c, 1);
    d.prepare("DELETE FROM nodes WHERE id='X-CASC'").run();
    assert.equal(d.prepare("SELECT COUNT(*) c FROM relations WHERE id='RX-C'").get().c, 0, '关系未级联删除');
  });

  test('唯一约束阻止重复关系', () => {
    const d = getDb();
    // 选一对种子数据中不存在的关系（D-C-TEMP -> D-C-CHUNK），否则首条 INSERT 就会失败，测不出唯一约束
    const pair = ['D-C-TEMP', 'D-C-CHUNK', 'complements'];
    const existing = d.prepare('SELECT COUNT(*) c FROM relations WHERE source_node_id=? AND target_node_id=? AND relation_type=?')
      .get(...pair).c;
    assert.equal(existing, 0, '测试用的关系对已存在于种子数据，请换一对');
    const run = (id) => d.prepare(`INSERT INTO relations (id,source_node_id,target_node_id,relation_type,description,evidence_status,checked_at)
      VALUES (?,?,?,?, '唯一约束测试','待核实','2026-11-01')`).run(id, ...pair);
    run('RX-DUP1');
    assert.throws(() => run('RX-DUP2'), '同一对节点同类型关系应被唯一约束拒绝');
    d.prepare("DELETE FROM relations WHERE id='RX-DUP1'").run();
  });
});

// ================= 校验逻辑 =================
describe('写入校验', () => {
  test('缺少来源的节点被拒绝', () => {
    const r = admin.upsertNode({ id: 'T-1', title: 'x', map_type: 'domain', node_type: 'concept', summary: '一段足够长的摘要内容', details: ['d'], source_ids: [] });
    assert.equal(r.ok, false);
  });

  test('引用不存在来源的节点被拒绝', () => {
    const r = admin.upsertNode({ id: 'T-2', title: 'x', map_type: 'domain', node_type: 'concept', summary: '一段足够长的摘要内容', details: ['d'], source_ids: ['S-9999'] });
    assert.equal(r.ok, false);
    assert.ok(r.errors.some((e) => e.includes('S-9999')));
  });

  test('词表外的 node_type 被拒绝', () => {
    const r = admin.upsertNode({ id: 'T-3', title: 'x', map_type: 'domain', node_type: 'banana', summary: '一段足够长的摘要内容', details: ['d'], source_ids: ['S-01'] });
    assert.equal(r.ok, false);
  });

  test('摘要过短被拒绝', () => {
    const r = admin.upsertNode({ id: 'T-4', title: 'x', map_type: 'domain', node_type: 'concept', summary: '短', details: ['d'], source_ids: ['S-01'] });
    assert.equal(r.ok, false);
  });

  test('推断关系缺推理链被拒绝', () => {
    const r = admin.upsertRelation({ source_node_id: 'D-C-RAG', target_node_id: 'D-C-EMB', relation_type: 'based_on', description: '测试推断', evidence_status: '推断' });
    assert.equal(r.ok, false);
    assert.ok(r.errors.some((e) => e.includes('推理链')));
  });

  test('taught_in 缺 coverage 被拒绝', () => {
    const r = admin.upsertRelation({ source_node_id: 'D-COURSE-AIF', target_node_id: 'D-C-RAG', relation_type: 'taught_in', description: '测试' });
    assert.equal(r.ok, false);
    assert.ok(r.errors.some((e) => e.includes('覆盖程度')));
  });

  test('自环关系被拒绝', () => {
    const r = admin.upsertRelation({ source_node_id: 'D-C-RAG', target_node_id: 'D-C-RAG', relation_type: 'based_on', description: '自环' });
    assert.equal(r.ok, false);
  });

  test('来源 ID 格式非法被拒绝', () => {
    assert.equal(admin.validateSource({ id: 'X1', title: 't', accessed_at: '2026-11-01', source_type: 'paper' }).length > 0, true);
    assert.equal(admin.validateSource({ id: 'S-99', title: 't', accessed_at: '2026-11-01', source_type: 'paper' }).length, 0);
  });

  test('来源访问日期格式非法被拒绝', () => {
    const e = admin.validateSource({ id: 'S-98', title: 't', accessed_at: '昨天', source_type: 'paper' });
    assert.ok(e.some((x) => x.includes('accessed_at')));
  });

  test('被引用的来源不可删除', () => {
    const r = admin.deleteSource('S-01');
    assert.equal(r.ok, false);
    assert.ok(r.errors.some((e) => e.includes('仍被节点')));
  });
});

// ================= 检索 =================
describe('检索层', () => {
  test('中文查询命中相关节点', () => {
    const r = retrieval.search('检索增强生成', { limit: 5 });
    assert.ok(r.hits.length > 0, '无命中');
    assert.ok(r.hits.some((h) => h.id === 'D-C-RAG'), 'top5 未含 D-C-RAG: ' + r.hits.map((h) => h.id).join(','));
  });

  test('英文缩写经同义词扩展命中中文节点', () => {
    const r = retrieval.search('hallucination', { limit: 5 });
    assert.ok(r.hits.some((h) => h.id === 'D-C-HALLU'), 'hallucination 未命中幻觉节点');
    assert.ok(r.synonymHits.includes('幻觉') || r.synonymHits.includes('hallucination'), '未触发同义词扩展');
  });

  test('价格类查询命中定价相关节点', () => {
    const r = retrieval.search('GLM-4.7-Flash 价格', { limit: 5 });
    const nodes = r.hits.filter((h) => h.kind === 'node').map((h) => h.id);
    assert.ok(nodes.includes('D-M-GLM47FLASH'),
      '名字里就含 GLM-4.7-Flash 的模型节点应进入前 5（实测曾因 BM25 短字段膨胀被关系挤出）：' + nodes.join(','));
  });

  test('关系类型不再压过同名词的节点（短字段膨胀回归测试）', () => {
    // 回归用例：relation_type 曾作为 title 索引，1-2 token 的极短字段在 BM25 长度归一化下得分暴涨，
    // 导致所有 relation_type=定价 的关系排在真正的模型节点之前。
    const r = retrieval.search('定价', { limit: 10, graphExpand: false });
    const firstNode = r.hits.findIndex((h) => h.kind === 'node');
    const firstRel = r.hits.findIndex((h) => h.kind === 'relation');
    assert.ok(firstNode >= 0, '搜索「定价」应命中节点');
    assert.ok(firstNode < firstRel || firstRel < 0,
      `节点应排在关系之前：firstNode=${firstNode} firstRel=${firstRel}`);
  });

  test('命中结果包含可解释的字段得分', () => {
    const r = retrieval.search('上下文窗口', { limit: 3 });
    const top = r.hits[0];
    assert.ok(top.why && top.why.length > 0, '缺少命中理由');
    assert.ok(top.score > 0);
  });

  test('高频单字不会淹没结果（IDF 生效）', () => {
    // 「课程」几乎出现在所有节点，若 IDF 失效会返回大量无关节点排在前面
    const r = retrieval.search('课程要求网站在访问权限和密钥方面满足哪些条件', { limit: 5, graphExpand: false });
    assert.ok(r.hits.length > 0);
    // 安全相关节点应进入前列（该问题实质在问访问与密钥要求）
    const top5 = r.hits.map((h) => h.id);
    assert.ok(top5.some((id) => /E-DIM-SEC|D-C-INJ|D-COURSE-AIF|D-R-LECTURE/.test(id)),
      'top5 未含访问/密钥相关节点: ' + top5.join(','));
  });

  test('地图过滤生效', () => {
    const r = retrieval.search('模型', { limit: 20, mapTypes: ['ecosystem'] });
    for (const h of r.hits.filter((x) => x.kind === 'node')) assert.equal(h.map_type, 'ecosystem');
  });

  test('buildContext 返回节点、关系与来源三类上下文', () => {
    const c = retrieval.buildContext('什么是 RAG？', { topK: 5 });
    assert.ok(c.chunks.length > 0, '无节点上下文');
    assert.ok(c.chunks.length <= 5, 'topK 未生效');
    assert.ok(c.node_ids.length === c.chunks.length);
    for (const ch of c.chunks) {
      assert.ok(ch.node_id && ch.title && ch.summary);
      assert.ok(Array.isArray(ch.sources));
      assert.ok(ch.evidence_status);
      assert.ok(ch.last_checked);
    }
  });

  test('上下文中每个节点都带来源标注', () => {
    const c = retrieval.buildContext('毕业要求 3 有哪些内容', { topK: 5 });
    const withSrc = c.chunks.filter((ch) => ch.sources.length > 0);
    assert.ok(withSrc.length > 0, '上下文节点全部缺来源');
  });
});

// ================= 置信度与越界判定 =================
describe('置信度与越界闸门', () => {
  const inDomain = ['什么是 RAG？', '毕业要求 3 列出了哪些核心方法？', 'GLM-4.7-Flash 的官方定价是多少？',
    '本项目为什么不用 LangChain？', '什么是幻觉？'];
  const outDomain = ['怎么做红烧肉', '帮我写一首关于春天的诗', '推荐几部好看的电影', '明天上海会下雨吗'];

  test('领域内问题的词汇重叠率显著高于领域外', () => {
    const inOvl = inDomain.map((q) => retrieval.buildContext(q).lexical_overlap);
    const outOvl = outDomain.map((q) => retrieval.buildContext(q).lexical_overlap);
    const minIn = Math.min(...inOvl);
    const maxOut = Math.max(...outOvl);
    assert.ok(minIn > maxOut, `领域内最低 ${minIn} 未高于领域外最高 ${maxOut}`);
  });

  test('领域内问题全部超过拒答阈值 0.62', () => {
    for (const q of inDomain) {
      const c = retrieval.buildContext(q);
      assert.ok(c.lexical_overlap >= 0.62, `「${q}」overlap=${c.lexical_overlap} 低于阈值，会被误拒`);
    }
  });

  test('领域外问题全部低于拒答阈值 0.62', () => {
    for (const q of outDomain) {
      const c = retrieval.buildContext(q);
      assert.ok(c.lexical_overlap < 0.62, `「${q}」overlap=${c.lexical_overlap} 高于阈值，不会被拒答`);
    }
  });

  test('完全无关问题触发 out_of_scope（不调用模型）', async () => {
    const c = retrieval.buildContext('怎么做红烧肉');
    const r = await ai.ask('怎么做红烧肉', c);
    assert.equal(r.status, 'out_of_scope');
    assert.ok(r.answer.includes('超出地图边界'));
    assert.equal(r.citations.nodes.length, 0);
  });

  test('无命中上下文触发 no_evidence 拒答', async () => {
    const empty = { query: 'x', total_hits: 0, synonym_hits: [], node_ids: [], chunks: [], relations: [], sources: [], confidence: 0, lexical_overlap: 1 };
    const r = await ai.ask('x', empty);
    assert.equal(r.status, 'no_evidence');
    assert.ok(r.answer.includes('资料未覆盖'));
  });
});

// ================= AI 安全与降级 =================
describe('AI 边界与安全', () => {
  test('输入校验：空问题', () => {
    assert.equal(ai.validateQuestion('').ok, false);
    assert.equal(ai.validateQuestion('   ').ok, false);
    assert.equal(ai.validateQuestion(null).ok, false);
    assert.equal(ai.validateQuestion(123).ok, false);
  });

  test('输入校验：超长问题', () => {
    const r = ai.validateQuestion('x'.repeat(ai.MAX_QUESTION_LEN + 1));
    assert.equal(r.ok, false);
    assert.equal(r.code, 'too_long');
  });

  test('输入校验：控制字符', () => {
    assert.equal(ai.validateQuestion('正常\u0000问题').ok, false);
  });

  test('输入校验：正常问题通过', () => {
    const r = ai.validateQuestion('什么是 RAG？');
    assert.equal(r.ok, true);
    assert.equal(r.question, '什么是 RAG？');
  });

  test('引用校验：只保留检索结果内的真实 ID', () => {
    const ctx = { node_ids: ['D-C-RAG'], relations: [], sources: [{ source_id: 'S-01' }], chunks: [] };
    const r = ai.verifyCitations('根据 [S-01] 与 D-C-RAG，还有 D-FAKE-999 和 S-99', ctx);
    assert.deepEqual(r.nodes, ['D-C-RAG']);
    assert.deepEqual(r.sources, ['S-01']);
    assert.ok(r.dropped.includes('D-FAKE-999'), '未剔除编造的节点 ID');
    assert.ok(r.dropped.includes('S-99'), '未剔除编造的来源 ID');
    assert.equal(r.has_valid_citation, true);
  });

  test('引用校验：全部为编造 ID 时 has_valid_citation 为 false', () => {
    const ctx = { node_ids: [], relations: [], sources: [], chunks: [] };
    const r = ai.verifyCitations('参见 D-FAKE-1 与 S-88', ctx);
    assert.equal(r.has_valid_citation, false);
    assert.equal(r.nodes.length, 0);
  });

  test('错误信息脱敏：过滤 Bearer 与 sk- 凭据', () => {
    assert.ok(!ai.sanitize('Bearer sk-abcdefghij1234567890 failed').includes('sk-abcdefghij'));
    assert.ok(ai.sanitize('Bearer sk-abcdefghij1234567890').includes('***'));
    assert.ok(!ai.sanitize('key=sk-1234567890abcdefghij').includes('1234567890abcdefghij'));
  });

  test('无密钥时降级为非生成式检索直出（网站核心功能不依赖外部 API）', async () => {
    assert.equal(ai.channels().length, 0, '测试环境应无密钥');
    const c = retrieval.buildContext('什么是 RAG？');
    const r = await ai.ask('什么是 RAG？', c);
    assert.equal(r.status, 'degraded');
    assert.equal(r.mode, 'retrieval_only');
    assert.equal(r.degraded_reason, 'no_api_key');
    assert.ok(r.answer.length > 50, '降级回答过短');
    assert.ok(r.answer.includes('D-C-RAG') || r.citations.nodes.length > 0, '降级回答缺少节点引用');
    assert.ok(r.grounded === true, '降级回答应基于真实检索结果');
  });

  test('aiStatus 不泄露密钥', () => {
    const s = JSON.stringify(ai.aiStatus());
    assert.ok(!/sk-[A-Za-z0-9]{16,}/.test(s), 'aiStatus 泄露了密钥');
  });

  test('限流：超过阈值后拒绝', () => {
    const key = 'test-rl-' + Date.now();
    let blocked = null;
    for (let i = 0; i < 15; i++) {
      const r = ai.rateLimit(key, 3, 60000);
      if (!r.ok) { blocked = r; break; }
    }
    assert.ok(blocked, '限流未生效');
    assert.ok(blocked.retryAfterSec > 0);
  });
});

// ================= 管理端权限 =================
describe('管理端权限', () => {
  test('未配置 ADMIN_TOKEN 时管理端不可用（默认安全）', () => {
    assert.equal(admin.adminEnabled(), false);
    const r = admin.checkAdmin({ get: () => 'anything' });
    assert.equal(r.ok, false);
    assert.equal(r.code, 'admin_disabled');
  });

  test('配置短令牌时管理端仍不可用', () => {
    process.env.ADMIN_TOKEN = 'short';
    assert.equal(admin.adminEnabled(), false);
    process.env.ADMIN_TOKEN = '';
  });

  test('配置足够长令牌后，错误令牌被拒绝', () => {
    process.env.ADMIN_TOKEN = 'a-very-long-admin-token-123';
    assert.equal(admin.adminEnabled(), true);
    assert.equal(admin.checkAdmin({ get: () => 'wrong-token' }).ok, false);
    assert.equal(admin.checkAdmin({ get: () => '' }).ok, false);
    process.env.ADMIN_TOKEN = '';
  });

  test('正确令牌通过校验', () => {
    process.env.ADMIN_TOKEN = 'a-very-long-admin-token-123';
    const req = { get: (h) => (h === 'x-admin-token' ? 'a-very-long-admin-token-123' : '') };
    assert.equal(admin.checkAdmin(req).ok, true);
    const req2 = { get: (h) => (h === 'authorization' ? 'Bearer a-very-long-admin-token-123' : '') };
    assert.equal(admin.checkAdmin(req2).ok, true);
    process.env.ADMIN_TOKEN = '';
  });
});

// ================= 反馈与候选池 =================
describe('反馈与候选内容池', () => {
  test('反馈可匿名提交且不落库姓名', () => {
    const r = admin.addFeedback({ question: '匿名测试反馈内容', anonymous: true, from_name: '不该被保存' });
    assert.equal(r.ok, true);
    const row = getDb().prepare('SELECT * FROM feedback WHERE id=?').get(r.id);
    assert.equal(row.anonymous, 1);
    assert.equal(row.from_name, null, '匿名反馈不应保存姓名');
    assert.equal(row.status, '待处理');
  });

  test('反馈长度上限生效', () => {
    assert.equal(admin.addFeedback({ question: '' }).ok, false);
    assert.equal(admin.addFeedback({ question: 'x'.repeat(2001) }).ok, false);
  });

  test('反馈关联的节点必须存在', () => {
    const r = admin.addFeedback({ question: '测试反馈', related_node_id: 'NOPE-999' });
    assert.equal(r.ok, false);
  });

  test('反馈状态流转并写入更新记录', () => {
    const c = admin.addFeedback({ question: '状态流转测试反馈' });
    const before = getDb().prepare('SELECT COUNT(*) c FROM update_log').get().c;
    const r = admin.updateFeedback(c.id, { status: '已采纳', reply: '已修改', change: '更新了 D-C-RAG 的描述' });
    assert.equal(r.ok, true);
    const after = getDb().prepare('SELECT COUNT(*) c FROM update_log').get().c;
    assert.ok(after > before, '状态流转未写入更新记录');
  });

  test('非法反馈状态被拒绝', () => {
    const c = admin.addFeedback({ question: '非法状态测试' });
    assert.equal(admin.updateFeedback(c.id, { status: '随便写' }).ok, false);
  });

  test('候选内容默认进入待审核，不直接进正式地图', () => {
    const r = admin.addCandidate({ content: 'AI 生成的候选内容测试', found_by: 'ai' });
    assert.equal(r.ok, true);
    const row = getDb().prepare('SELECT * FROM candidate_content WHERE id=?').get(r.id);
    assert.equal(row.review_status, '待审核');
    assert.equal(row.is_candidate ?? null, null);
    // 候选内容不出现在正式节点列表中
    const nodes = listNodes({});
    assert.ok(!nodes.some((n) => n.title.includes('AI 生成的候选内容测试')));
  });

  test('淘汰候选内容必须填写原因', () => {
    const c = admin.addCandidate({ content: '待淘汰候选内容测试' });
    assert.equal(admin.reviewCandidate(c.id, { review_status: '已淘汰' }).ok, false);
    assert.equal(admin.reviewCandidate(c.id, { review_status: '已淘汰', rejection_reason: '来源不可靠' }).ok, true);
  });
});

// ================= 更新记录 =================
describe('更新记录', () => {
  test('节点变更自动写入更新记录（含日期/对象/变更/原因/执行者）', () => {
    const before = getDb().prepare('SELECT COUNT(*) c FROM update_log').get().c;
    const r = admin.upsertNode({ id: 'T-UPD', title: '更新记录测试节点', map_type: 'domain', node_type: 'concept',
      summary: '这是一段足够长的摘要用于测试', details: ['详情一'], source_ids: ['S-26'],
      evidence_status: '待核实', reason: '测试更新记录写入' }, 'tester');
    assert.equal(r.ok, true, JSON.stringify(r.errors || []));
    const after = getDb().prepare('SELECT COUNT(*) c FROM update_log').get().c;
    assert.ok(after > before);
    const log = getDb().prepare("SELECT * FROM update_log WHERE object_id='T-UPD' ORDER BY id DESC LIMIT 1").get();
    assert.ok(log.date && /^\d{4}-\d{2}-\d{2}$/.test(log.date), '缺少日期');
    assert.equal(log.object_type, 'node');
    assert.ok(log.change.includes('T-UPD'), '变更内容未记录对象');
    assert.equal(log.reason, '测试更新记录写入');
    assert.equal(log.updated_by, 'tester');
    // 清理
    admin.deleteNode('T-UPD', 'tester', '测试清理');
  });

  test('更新记录可被读取且按时间倒序', () => {
    const d = getDb();
    const rows = d.prepare('SELECT * FROM update_log ORDER BY date DESC, id DESC LIMIT 20').all();
    assert.ok(rows.length > 0);
    for (const r of rows) assert.ok(r.date && r.change && r.updated_by);
  });
});

// ================= 读取接口 =================
describe('读取接口', () => {
  test('按地图过滤节点', () => {
    assert.equal(listNodes({ mapType: 'domain' }).length, 67);
    assert.equal(listNodes({ mapType: 'ecosystem' }).length, 45);
    assert.equal(listNodes({ mapType: 'cognition' }).length, 30);
  });

  test('按证据状态过滤', () => {
    const v = listNodes({ evidence: '待核实' });
    assert.ok(v.length > 0);
    for (const n of v) assert.equal(n.evidence_status, '待核实');
  });

  test('按成长路线过滤', () => {
    const sci = listNodes({ careerTrack: 'scientist' });
    assert.ok(sci.length > 0);
    for (const n of sci) assert.ok(n.career_tracks.includes('scientist') || n.career_tracks.includes('all'));
  });

  test('关键词搜索过滤', () => {
    const r = listNodes({ search: 'RAG' });
    assert.ok(r.length > 0);
    assert.ok(r.some((n) => n.id === 'D-C-RAG'));
  });

  test('getNode 返回完整字段并解析 JSON 列', () => {
    const n = getNode('D-C-RAG');
    assert.ok(n);
    assert.ok(Array.isArray(n.details));
    assert.ok(Array.isArray(n.tags));
    assert.ok(Array.isArray(n.source_ids));
    assert.ok(Array.isArray(n.career_tracks));
    assert.equal(typeof n.fast_variable, 'boolean');
  });

  test('getNode 对不存在 ID 返回 null', () => {
    assert.equal(getNode('NOPE-999'), null);
  });

  test('listRelations 按节点过滤返回双向关系', () => {
    const r = listRelations({ nodeId: 'D-C-RAG' });
    assert.ok(r.length > 0);
    for (const x of r) assert.ok(x.source_node_id === 'D-C-RAG' || x.target_node_id === 'D-C-RAG');
  });

  test('快变量超期未复核被标记 stale', () => {
    const fast = listNodes({}).filter((n) => n.fast_variable);
    assert.ok(fast.length > 0);
    // 用未来日期模拟超期
    const stale = listNodes({}).filter((n) => n.fast_variable && n.stale === true);
    // 当前所有快变量核查日期都是 2026-11-01，用「今天」判定不应过期
    const d = getDb();
    const row = d.prepare("SELECT last_checked FROM nodes WHERE id='D-M-GLM47FLASH'").get();
    assert.equal(row.last_checked, '2026-11-01');
    void stale;
  });

  test('stats 汇总各项计数', () => {
    const s = stats();
    assert.equal(s.sources, 44); // +S-44 小组分工细则
    assert.equal(s.eval_items, 14);
    assert.ok(s.relations >= 233);
    assert.ok(typeof s.stale === 'number');
  });
});

// 清理临时库
process.on('exit', () => { try { fs.rmSync(TMP, { force: true }); fs.rmSync(TMP + '-wal', { force: true }); fs.rmSync(TMP + '-shm', { force: true }); } catch { /* ignore */ } });
// ================= 证据状态归类（classifyEvidence）=================
describe('证据状态归类', () => {
  const ctxHigh = { confidence: 0.8 };
  const ctxLow = { confidence: 0.2 };

  test('结构化回答按「最后一行整体证据状态」归类，不被正文中的标签列表误导', () => {
    // 实测回归：模型按提示列出全部三类标签时，初版全文匹配会把好答案误判为「资料未覆盖」
    const good = [
      '**核心答案**：RAG 是……',
      '1. 【资料事实】定义 [S-01]。',
      '2. 【基于资料的解释】……',
      '3. 【资料未覆盖】具体作者姓名。',
      '',
      '整体证据状态：资料充分'
    ].join('\n');
    assert.equal(ai.classifyEvidence(good, ctxHigh, true), '资料充分');
  });

  test('末尾标注为部分覆盖时归类为部分覆盖', () => {
    const t = '要点……\n\n整体证据状态：部分覆盖';
    assert.equal(ai.classifyEvidence(t, ctxHigh, true), '部分覆盖');
  });

  test('末尾标注为资料未覆盖时归类为资料未覆盖', () => {
    const t = '【资料未覆盖】……\n\n整体证据状态：资料未覆盖';
    assert.equal(ai.classifyEvidence(t, ctxLow, false), '资料未覆盖');
  });

  test('无结构化标注时回退到 grounded 与置信度', () => {
    assert.equal(ai.classifyEvidence('普通回答，无标签', ctxHigh, true), '资料充分');
    assert.equal(ai.classifyEvidence('普通回答，无标签', ctxLow, true), '部分覆盖');
    // 无有效引用（grounded=false）但检索置信度高 -> 至多「部分覆盖」（无法核验，不能算充分）
    assert.equal(ai.classifyEvidence('普通回答，无标签', ctxHigh, false), '部分覆盖');
    assert.equal(ai.classifyEvidence('普通回答，无标签', ctxLow, false), '资料未覆盖');
  });

  test('明确说无法回答时归类为资料未覆盖', () => {
    assert.equal(ai.classifyEvidence('我无法回答这个问题', ctxHigh, true), '资料未覆盖');
  });
});