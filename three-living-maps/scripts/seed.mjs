// 数据装载脚本：把 seed 文件写入 SQLite。可重复执行（幂等 upsert）。
import { getDb, j } from '../server/lib/db.mjs';
import { sources } from '../data/seed/sources.mjs';
import { domainNodes } from '../data/seed/nodes-domain.mjs';
import { ecosystemNodes } from '../data/seed/nodes-ecosystem.mjs';
import { cognitionNodes } from '../data/seed/nodes-cognition.mjs';
import { relations } from '../data/seed/relations.mjs';
import { evalItems } from '../data/seed/evalset.mjs';

const nowIso = () => new Date().toISOString();
const today = () => nowIso().slice(0, 10);

function run() {
  const d = getDb();
  const allNodes = [...domainNodes, ...ecosystemNodes, ...cognitionNodes];

  // 1) 来源
  const upSrc = d.prepare(`INSERT INTO sources (id,title,publisher,author,url,published_at,accessed_at,source_type,supports,notes)
    VALUES (@id,@title,@publisher,@author,@url,@published_at,@accessed_at,@source_type,@supports,@notes)
    ON CONFLICT(id) DO UPDATE SET title=@title,publisher=@publisher,author=@author,url=@url,
      published_at=@published_at,accessed_at=@accessed_at,source_type=@source_type,supports=@supports,notes=@notes`);
  for (const s of sources) upSrc.run({
    id: s.id, title: s.title, publisher: s.publisher ?? null, author: s.author ?? null, url: s.url ?? null,
    published_at: s.published_at ?? null, accessed_at: s.accessed_at, source_type: s.source_type,
    supports: j(s.supports || []), notes: s.notes ?? null
  });

  // 2) 节点
  const upNode = d.prepare(`INSERT INTO nodes (id,title,map_type,node_type,section,summary,details,tags,source_ids,
    evidence_status,evidence_note,knowledge_status,career_tracks,participant_role,chain,cost_side,method_ref,case_ref,
    last_checked,fast_variable,limit_note,is_candidate,status,created_at,updated_at)
    VALUES (@id,@title,@map_type,@node_type,@section,@summary,@details,@tags,@source_ids,@evidence_status,@evidence_note,
    @knowledge_status,@career_tracks,@participant_role,@chain,@cost_side,@method_ref,@case_ref,@last_checked,
    @fast_variable,@limit_note,0,'published',@created_at,@updated_at)
    ON CONFLICT(id) DO UPDATE SET title=@title,map_type=@map_type,node_type=@node_type,section=@section,summary=@summary,
    details=@details,tags=@tags,source_ids=@source_ids,evidence_status=@evidence_status,evidence_note=@evidence_note,
    knowledge_status=@knowledge_status,career_tracks=@career_tracks,participant_role=@participant_role,chain=@chain,
    cost_side=@cost_side,method_ref=@method_ref,case_ref=@case_ref,last_checked=@last_checked,fast_variable=@fast_variable,
    limit_note=@limit_note,updated_at=@updated_at`);
  for (const n of allNodes) {
    upNode.run({
      id: n.id, title: n.title, map_type: n.map_type, node_type: n.node_type, section: n.section ?? null,
      summary: n.summary, details: j(n.details || []), tags: j(n.tags || []), source_ids: j(n.source_ids || []),
      evidence_status: n.evidence_status, evidence_note: n.evidence_note ?? null,
      knowledge_status: n.knowledge_status || '未评估', career_tracks: j(n.career_tracks || ['all']),
      participant_role: n.participant_role ?? null, chain: n.chain ?? null, cost_side: n.cost_side ?? null,
      method_ref: n.method_ref ?? null, case_ref: n.case_ref ?? null, last_checked: n.last_checked || today(),
      fast_variable: n.fast_variable ? 1 : 0, limit_note: n.limit ?? n.limit_note ?? null,
      created_at: nowIso(), updated_at: nowIso()
    });
  }

  // 3) 关系
  const upRel = d.prepare(`INSERT INTO relations (id,source_node_id,target_node_id,relation_type,coverage,description,
    reasoning_chain,source_ids,evidence_status,checked_at)
    VALUES (@id,@source_node_id,@target_node_id,@relation_type,@coverage,@description,@reasoning_chain,@source_ids,
    @evidence_status,@checked_at)
    ON CONFLICT(id) DO UPDATE SET source_node_id=@source_node_id,target_node_id=@target_node_id,relation_type=@relation_type,
    coverage=@coverage,description=@description,reasoning_chain=@reasoning_chain,source_ids=@source_ids,
    evidence_status=@evidence_status,checked_at=@checked_at`);
  // 唯一约束 (source,target,type)：同一对节点同类型关系去重
  const seenRel = new Set();
  for (const r of relations) {
    const key = r.source_node_id + '|' + r.target_node_id + '|' + r.relation_type;
    if (seenRel.has(key)) continue;
    seenRel.add(key);
    upRel.run({
      id: r.id, source_node_id: r.source_node_id, target_node_id: r.target_node_id, relation_type: r.relation_type,
      coverage: r.coverage ?? null, description: r.description, reasoning_chain: r.reasoning_chain ?? null,
      source_ids: j(r.source_ids || []), evidence_status: r.evidence_status || '待核实', checked_at: r.checked_at || today()
    });
  }

  // 4) 评测题
  const upEval = d.prepare(`INSERT INTO eval_items (id,category,question,reference_points,source_ids,expected_nodes,grading,active)
    VALUES (@id,@category,@question,@reference_points,@source_ids,@expected_nodes,@grading,1)
    ON CONFLICT(id) DO UPDATE SET category=@category,question=@question,reference_points=@reference_points,
    source_ids=@source_ids,expected_nodes=@expected_nodes,grading=@grading,active=1`);
  for (const e of evalItems) upEval.run({
    id: e.id, category: e.category, question: e.question, reference_points: j(e.reference_points),
    source_ids: j(e.source_ids), expected_nodes: j(e.expected_nodes), grading: e.grading
  });

  // 5) 初始更新记录（仅在空库时写入，避免重复执行产生噪声）
  const cnt = d.prepare('SELECT COUNT(*) c FROM update_log').get().c;
  if (cnt === 0) {
    const ins = d.prepare(`INSERT INTO update_log (date,object_type,object_id,evidence,change,reason,updated_by,source_ids,created_at)
      VALUES (?,?,?,?,?,?,?,?,?)`);
    ins.run(today(), 'system', null, 'S-26', '初始化数据：装载 ' + sources.length + ' 条来源、' + allNodes.length + ' 个节点、' + seenRel.size + ' 条关系、' + evalItems.length + ' 道评测题', '项目首次建库', 'Codex Agent', j(['S-24', 'S-25', 'S-26']), nowIso());
    ins.run(today(), 'node', null, 'S-41', '所有论文的 CCF 会议类别标注为「待核实」', 'CCF 官网返回 WAF 挑战页，未能取得推荐目录正文；按课程要求不凭印象标注', 'Codex Agent', j(['S-41']), nowIso());
    ins.run(today(), 'node', 'D-COURSE-SLOT-01', 'S-25', '课程节点仅提供「类别槽位」，不填具体课名', '培养方案附件不含课程目录，公开渠道未定位到对应学校官方文件', 'Codex Agent', j(['S-25']), nowIso());
  }

  const s = {
    sources: d.prepare('SELECT COUNT(*) c FROM sources').get().c,
    nodes: d.prepare('SELECT COUNT(*) c FROM nodes').get().c,
    relations: d.prepare('SELECT COUNT(*) c FROM relations').get().c,
    eval_items: d.prepare('SELECT COUNT(*) c FROM eval_items').get().c,
    update_log: d.prepare('SELECT COUNT(*) c FROM update_log').get().c
  };
  return s;
}

const summary = run();
console.log('[seed] 完成:', JSON.stringify(summary));