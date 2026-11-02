// 数据导出：全库导出为 JSON + 每表 CSV，供迁移到飞书多维表格或其他平台（避免锁定）。
import fs from 'node:fs';
import path from 'node:path';
import { getDb } from '../server/lib/db.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'data', 'export');
fs.mkdirSync(OUT, { recursive: true });

const d = getDb();
const TABLES = ['nodes', 'relations', 'sources', 'update_log', 'feedback', 'candidate_content', 'eval_items', 'eval_runs', 'ai_usage'];

function toCsv(rows) {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  const esc = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
}

const all = {};
for (const t of TABLES) {
  const rows = d.prepare(`SELECT * FROM ${t}`).all();
  all[t] = rows;
  fs.writeFileSync(path.join(OUT, t + '.json'), JSON.stringify(rows, null, 2), 'utf8');
  fs.writeFileSync(path.join(OUT, t + '.csv'), '\ufeff' + toCsv(rows), 'utf8'); // BOM 便于 Excel 打开
}
fs.writeFileSync(path.join(OUT, 'full-export.json'), JSON.stringify({
  exported_at: new Date().toISOString(),
  counts: Object.fromEntries(Object.entries(all).map(([k, v]) => [k, v.length])),
  data: all
}, null, 2), 'utf8');

console.log('[export] 已导出到 data/export/：');
for (const [t, rows] of Object.entries(all)) console.log(`  ${t}: ${rows.length} 行 (.json + .csv)`);
console.log('[export] full-export.json 为整库快照，可直接用于迁移或归档。');