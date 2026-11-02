// 数据一致性校验：孤立节点、悬空引用、缺失来源、超期未复核、词表越界。
import { lint } from '../server/lib/admin.mjs';
import { stats } from '../server/lib/db.mjs';
const res = lint();
console.log('[lint:data] 统计:', JSON.stringify(stats(), null, 1));
console.log('[lint:data] 通过:', res.ok, '| 计数:', JSON.stringify(res.counts));
const errs = res.problems.filter(p => p.level === 'error');
const warns = res.problems.filter(p => p.level === 'warn');
console.log('[lint:data] error:', errs.length, '| warn:', warns.length);
if (errs.length) { console.log('--- ERRORS ---'); errs.slice(0, 40).forEach(e => console.log('  [' + e.where + '] ' + e.msg)); }
if (warns.length) { console.log('--- WARNINGS (前 30) ---'); warns.slice(0, 30).forEach(w => console.log('  [' + w.where + '] ' + w.msg)); }
process.exit(res.ok ? 0 : 1);