// 恢复：从 data/backups/<时间戳> 或任意目录恢复 SQLite 快照。
// 用法：npm run restore -- data/backups/2026-11-01T02-00-00
import fs from 'node:fs';
import path from 'node:path';
import { DB_PATH } from '../server/lib/db.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const arg = process.argv[2];
if (!arg) {
  const base = path.join(ROOT, 'data', 'backups');
  const list = fs.existsSync(base) ? fs.readdirSync(base).filter((x) => /^\d{4}-/.test(x)).sort() : [];
  console.error('[restore] 请指定备份目录。可用备份：');
  for (const l of list) console.error('  ' + path.join('data', 'backups', l));
  if (!list.length) console.error('  （暂无备份，先运行 npm run backup）');
  process.exit(1);
}
const srcDir = path.isAbsolute(arg) ? arg : path.resolve(ROOT, arg);
const snap = path.join(srcDir, 'maps-backup.sqlite');
if (!fs.existsSync(snap)) { console.error('[restore] 找不到快照文件: ' + snap); process.exit(1); }

// 先把当前库另存为 .pre-restore，避免误操作导致不可逆丢失
const pre = DB_PATH + '.pre-restore-' + Date.now();
if (fs.existsSync(DB_PATH)) {
  fs.copyFileSync(DB_PATH, pre);
  for (const ext of ['-wal', '-shm']) if (fs.existsSync(DB_PATH + ext)) fs.rmSync(DB_PATH + ext, { force: true });
  console.log('[restore] 当前库已另存为 ' + path.basename(pre));
}
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
fs.copyFileSync(snap, DB_PATH);
console.log('[restore] 已从 ' + srcDir + ' 恢复到 ' + DB_PATH);
console.log('[restore] 校验：');
const { DatabaseSync } = await import('node:sqlite');
const d = new DatabaseSync(DB_PATH, { readOnly: true });
for (const t of ['nodes', 'relations', 'sources', 'update_log', 'feedback', 'candidate_content', 'eval_items', 'eval_runs']) {
  try { console.log('  ' + t + ': ' + d.prepare(`SELECT COUNT(*) c FROM ${t}`).get().c + ' 行'); }
  catch { console.log('  ' + t + ': 表不存在'); }
}
console.log('[restore] 完成。如需回滚，把 ' + path.basename(pre) + ' 复制回 ' + path.basename(DB_PATH) + ' 即可。');