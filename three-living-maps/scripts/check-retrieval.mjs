// 检索召回率自检：对每道评测题检查「预期节点」是否出现在检索命中中。
// 这不是模型评分，只检验检索层，可离线运行。
import { search, buildContext } from '../server/lib/retrieval.mjs';
import { evalItems } from '../data/seed/evalset.mjs';

let hitAll = 0, hitAny = 0;
const rows = [];
for (const it of evalItems) {
  const ctx = buildContext(it.question, { topK: 5 });
  const got = new Set(ctx.node_ids);
  const found = it.expected_nodes.filter((n) => got.has(n));
  const rate = found.length / it.expected_nodes.length;
  if (rate === 1) hitAll++;
  if (found.length > 0) hitAny++;
  rows.push({ id: it.id, rate: Math.round(rate * 100), found: found.length, total: it.expected_nodes.length,
    missing: it.expected_nodes.filter((n) => !got.has(n)), top: ctx.node_ids.slice(0, 3), conf: Math.round(ctx.confidence * 100) / 100 });
}
for (const r of rows) {
  console.log(`${r.id} 召回 ${r.found}/${r.total} (${r.rate}%) conf=${r.conf} top=[${r.top.join(', ')}]${r.missing.length ? ' 缺: ' + r.missing.join(', ') : ''}`);
}
console.log('---');
console.log('全部预期节点命中:', hitAll + '/' + evalItems.length, '| 至少命中一个:', hitAny + '/' + evalItems.length);
console.log('平均召回率:', (rows.reduce((a, b) => a + b.rate, 0) / rows.length).toFixed(1) + '%');