# 数据字典（DATA-DICTIONARY）

> 本项目数据库为 SQLite（Node 内置 `node:sqlite`），schema 定义在 `server/lib/db.mjs`。
> 九张表；JSON 列以 TEXT 存储，读取时解析为数组/对象。日期一律 `YYYY-MM-DD`，时间戳为 ISO 8601。

## 受控词表（全站统一）

**证据状态 `evidence_status`（四级，CHECK 约束强制）**
| 值 | 含义 | 附加要求 |
|---|---|---|
| 已核实 | 一手来源直接支持该结论，且信息与当前状态相符 | 需有 source_ids |
| 部分核实 | 只有部分结论获支持，或来源有时间/范围限制 | 建议 evidence_note 说明 |
| 推断 | 基于已知事实的推理 | 关系若为推断**必须**附 reasoning_chain（写入校验强制） |
| 待核实 | 尚未找到足够可靠证据 | 建议 evidence_note 说明缺口 |

**理解程度 `knowledge_status`（CHECK 约束强制）**：`未评估` / `已初步理解` / `已经尝试` / `待深入学习`
> 该字段**不得由 AI 猜测写入**，只允许来自真实学习者反馈或经授权的人工记录。种子数据全部为「未评估」（单元测试断言）。

**关系类型 `relation_type`（受控词表，写入校验 + lint 双重检查）**
- 技术关系：`solves` `based_on` `implemented_by` `requires_knowledge` `alternative_to` `complements` `evaluated_by` `提出` `采用` `依赖` `改进` `质疑`
- 经济/组织关系：`taught_in` `enables_practice` `资助` `付费` `提供` `定价` `合作` `竞争` `孵化` `开源`
- 认知关系（本项目扩充，语义与上表一致）：`分析` `修正认识` `支撑习惯` `记录于`

**课程覆盖程度 `coverage`（`taught_in` 关系必填）**：`前置基础` / `核心覆盖` / `部分涉及` / `实践应用` / `自主拓展`

**节点类型 `node_type`（受控词表）**：task, problem, concept, approach, tool, model, resource, requirement, ability, course, pathway, participant, org, company, lab, community, conference, paper, dataset, user, cost, method, habit, case, revision, principle, benchmark

**节点 ID 前缀约定**：`D-` 领域地图 / `E-` 生态地图 / `C-` 认知地图（全站唯一）

**来源类型 `source_type`（CHECK 约束）**：paper, official_doc, pricing, curriculum, project_doc, community, benchmark, tool_doc

---

## 表：nodes（节点，141 行）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | TEXT | PK | 全站唯一，D-/E-/C- 前缀 |
| title | TEXT | NOT NULL | 节点标题（≤200 字） |
| map_type | TEXT | NOT NULL, CHECK | domain / ecosystem / cognition |
| node_type | TEXT | NOT NULL | 见受控词表 |
| section | TEXT | | 领域 A-F；生态 A/B/C（由 chain 派生）；认知 1-6 |
| summary | TEXT | NOT NULL | 一句话摘要（≥8 字） |
| details | TEXT(JSON[]) | | 详细说明，逐条数组；检索按 passage 级打分 |
| tags | TEXT(JSON[]) | | 标签 |
| source_ids | TEXT(JSON[]) | NOT NULL | 引用的来源 ID；正式节点须非空或有 evidence_note |
| evidence_status | TEXT | NOT NULL, CHECK | 四级证据状态 |
| evidence_note | TEXT | | 证据说明（部分核实/待核实/推断建议填写） |
| knowledge_status | TEXT | NOT NULL, CHECK | 理解程度，默认「未评估」 |
| career_tracks | TEXT(JSON[]) | | 成长罗盘归属：scientist/engineer/designer/all |
| participant_role | TEXT | | 生态节点：参与者角色 |
| chain | TEXT | | 生态节点：main_a / side_b / dim_c |
| cost_side | TEXT | | 成本节点：成本承担方 |
| method_ref | TEXT | | 认知节点：对应方法 |
| case_ref | TEXT | | 认知节点：关联案例 |
| last_checked | TEXT | NOT NULL | 核查日期（快变量必填） |
| fast_variable | INTEGER | 0/1 | 是否快变量（价格/版本/功能等） |
| limit_note | TEXT | | 边界与未解决问题 |
| is_candidate | INTEGER | 0/1 | 是否候选内容（候选不进正式地图） |
| status | TEXT | CHECK | published / draft / archived |
| created_at / updated_at | TEXT | NOT NULL | ISO 时间戳 |

**派生字段（读取时计算，不入库）**：`stale`（快变量且 last_checked 超过 28 天为 true）

---

## 表：relations（关系，233 行）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | TEXT | PK | 默认 `R-NNN` |
| source_node_id | TEXT | FK→nodes, NOT NULL | 起点节点 |
| target_node_id | TEXT | FK→nodes, NOT NULL | 终点节点（不允许自环） |
| relation_type | TEXT | NOT NULL | 受控词表 |
| coverage | TEXT | CHECK | 覆盖程度（taught_in 必填） |
| description | TEXT | NOT NULL | 关系描述（≥4 字） |
| reasoning_chain | TEXT | | 推理链（推断关系必填） |
| source_ids | TEXT(JSON[]) | | 依据来源 |
| evidence_status | TEXT | NOT NULL, CHECK | 四级证据状态 |
| checked_at | TEXT | NOT NULL | 核查日期 |

**唯一约束**：`(source_node_id, target_node_id, relation_type)` —— 同一对节点同类型关系不重复。
**级联**：删除节点时 `ON DELETE CASCADE` 删除其关系。

---

## 表：sources（来源，43 行）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | TEXT | PK | 格式 `S-NN` |
| title | TEXT | NOT NULL | 来源标题 |
| publisher | TEXT | | 发布机构 |
| author | TEXT | | 作者 |
| url | TEXT | | 原始 URL（http(s):// 或 file:///） |
| published_at | TEXT | | 发布日期（可得时） |
| accessed_at | TEXT | NOT NULL | 访问日期 |
| source_type | TEXT | NOT NULL, CHECK | 见受控词表 |
| supports | TEXT(JSON[]) | NOT NULL | 支持的具体结论（逐条） |
| notes | TEXT | | 备注与证据限制（含抓取失败记录） |

---

## 表：update_log（更新记录）

| 字段 | 说明 |
|---|---|
| id | 自增 PK |
| date | 更新日期 |
| object_type | node / relation / source / eval / feedback / candidate / system |
| object_id | 对象 ID |
| evidence | 依据 |
| change | 变更内容（NOT NULL） |
| reason | 原因 |
| updated_by | 执行者（不自动编造成员姓名，只记录执行主体） |
| source_ids | 关联来源（JSON[]） |
| created_at | ISO 时间戳 |

> 节点/关系/来源的增删改、反馈状态流转、候选审核均**自动**写入本表，因此反映真实修改而非事后补写。

---

## 表：feedback（反馈）

| 字段 | 说明 |
|---|---|
| id | 自增 PK |
| date / created_at | 提交日期 / 时间戳（created_at NOT NULL） |
| from_name | 署名（匿名时为 NULL） |
| anonymous | 1=匿名（默认），匿名时 from_name 强制为 NULL |
| question | 疑问/纠错/建议内容（NOT NULL，≤2000 字） |
| verify / change / reason | 核实方式 / 实际改动 / 原因 |
| status | 待处理 / 已采纳 / 已回复 / 未采纳 / 转候选 |
| related_node_id | 关联节点（可空，若填则须存在） |
| reply | 管理员回复（公开展示） |

---

## 表：candidate_content（候选内容池）

| 字段 | 说明 |
|---|---|
| id | 自增 PK |
| content | 候选内容（NOT NULL，≤4000 字） |
| source_hint | 来源线索 |
| found_by | 发现方式（visitor / ai / auto） |
| found_at | 发现时间（NOT NULL） |
| review_status | 待审核 / 已通过 / 已淘汰 |
| reviewed_by / reviewed_at | 审核者 / 时间 |
| rejection_reason | 淘汰原因（淘汰时必填） |
| target_map | 建议归入的地图 |

> AI 生成与外部推荐内容先进此池，经来源检查与逻辑检查后才进正式地图。

---

## 表：eval_items（评测题，14 行）

| 字段 | 说明 |
|---|---|
| id | `EV-NN` |
| category | 七类考点之一 |
| question | 问题 |
| reference_points | 参考答案要点（JSON[]） |
| source_ids | 依据来源（JSON[]） |
| expected_nodes | 预期引用节点（JSON[]） |
| grading | 评分标准 |
| active | 1=启用 |

## 表：eval_runs（评测运行记录）

| 字段 | 说明 |
|---|---|
| id / run_at | 自增 PK / 运行时间 |
| model / channel / node_version | 运行环境 |
| total / passed | 题数 / 通过数 |
| scores | 各维度得分（JSON） |
| items | 逐题结果（JSON，含 verdict/judge_used/耗时/tokens） |
| totals | 汇总（耗时、token、各状态计数） |
| notes | 说明与局限性 |

## 表：ai_usage（AI 调用日志）

| 字段 | 说明 |
|---|---|
| ts / channel / model | 时间 / 渠道 / 模型 |
| prompt_tokens / completion_tokens | token 用量 |
| latency_ms | 耗时 |
| status | ok / degraded / no_evidence / out_of_scope / truncated / error / judge_ok / judge_error |
| question_hash | 问题的 FNV 哈希（**不存原文**，保护隐私） |
| error | 脱敏后的错误信息 |
| cost_note | 成本备注 |

---

## 完整性约束汇总

- **外键**：relations 两端 → nodes；feedback.related_node_id → nodes（写入校验）。
- **CHECK**：map_type / evidence_status / knowledge_status / source_type / object_type / status。
- **唯一**：nodes.id、relations.id、`(source,target,type)`、sources.id、eval_items.id。
- **写入校验**（`server/lib/admin.mjs`）：正式节点须有来源、taught_in 须有 coverage、推断须有推理链、relation_type 须在词表内、来源 ID 格式、被引用来源不可删除。
- **一致性检查**（`npm run lint:data`）：孤立节点、悬空引用、缺失来源、词表越界、超期未复核。当前状态：**0 error / 0 warning**。