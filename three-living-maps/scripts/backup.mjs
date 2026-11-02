// 备份：把 SQLite 库文件（含 WAL 合并）+ 导出快照复制到 data/backups/<时间戳>/。
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { getDb, DB_PATH } from '../server/lib/db.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const dir = path.join(ROOT, 'data', 'backups', stamp);
fs.mkdirSync(dir, { recursive: true });

// 1) 用 SQLite 官方 backup API 生成一致性快照（WAL 模式下直接复制文件可能不一致）
const d = getDb();
d.exec(`VACUUM INTO '${path.join(dir, 'maps-backup.sqlite').replace(/'/g, "''")}'`);

// 2) 同时导出 JSON/CSV（人类可读，可直接导入其他平台）
try {
  execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'export-data.mjs')], { stdio: 'inherit' });
  const exp = path.join(ROOT, 'data', 'export');
  if (fs.existsSync(exp)) {
    fs.cpSync(exp, path.join(dir, 'export'), { recursive: true });
  }
} catch (e) {
  console.warn('[backup] 导出步骤失败（快照仍已完成）:', e.message);
}

// 3) 写入清单
const size = fs.statSync(path.join(dir, 'maps-backup.sqlite')).size;
fs.writeFileSync(path.join(dir, 'MANIFEST.json'), JSON.stringify({
  created_at: new Date().toISOString(),
  source_db: DB_PATH,
  sqlite_snapshot: 'maps-backup.sqlite',
  sqlite_bytes: size,
  export_dir: 'export/',
  restore_command: `npm run restore -- ${path.join('data', 'backups', stamp)}`
}, null, 2), 'utf8');

// 4) 只保留最近 10 份备份
const base = path.join(ROOT, 'data', 'backups');
const olds = fs.readdirSync(base).filter((x) => /^\d{4}-\d{2}-\d{2}T/.test(x)).sort().reverse().slice(10);
for (const o of olds) fs.rmSync(path.join(base, o), { recursive: true, force: true });

console.log(`[backup] 完成 -> ${dir}`);
console.log(`[backup] SQLite 快照 ${(size / 1024).toFixed(1)} KB + JSON/CSV 导出`);
console.log(`[backup] 恢复：npm run restore -- data/backups/${stamp}`);