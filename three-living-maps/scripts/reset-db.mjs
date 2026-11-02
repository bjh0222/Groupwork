// 重置数据库：删除现有 SQLite 库并重新装载种子数据。
// 用途：测试污染后恢复干净的交付数据；或修改 seed 文件后重建。
// 注意：会丢失所有通过管理端做的修改与真实反馈，请先 npm run backup。
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const DB = process.env.DB_PATH || path.join(ROOT, 'data', 'maps.sqlite');

if (process.argv.includes('--force') === false && fs.existsSync(DB)) {
  const backupDir = path.join(ROOT, 'data', 'backups', 'pre-reset-' + Date.now());
  fs.mkdirSync(backupDir, { recursive: true });
  fs.copyFileSync(DB, path.join(backupDir, 'maps-backup.sqlite'));
  console.log('[reset] 已自动备份原库到 ' + path.relative(ROOT, backupDir));
}

for (const f of [DB, DB + '-wal', DB + '-shm']) {
  if (fs.existsSync(f)) { fs.rmSync(f, { force: true }); console.log('[reset] 删除 ' + path.basename(f)); }
}

execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'seed.mjs')], { stdio: 'inherit' });
console.log('[reset] 完成：数据库已恢复为干净的种子状态。');