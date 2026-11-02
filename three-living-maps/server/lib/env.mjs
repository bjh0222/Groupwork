// 极简 .env 加载（零依赖）。导入即生效——这是必须的：
// ESM 中所有 import 先于普通语句求值，若改成「导入后再调用 loadEnv()」，
// ai.mjs 等模块的模块级常量（如 AI_RATE_LIMIT_PER_MIN）会在环境变量就绪前读取，拿到默认值。
// 因此本模块在顶层直接执行加载，并要求它作为入口的第一个 import。
import fs from 'node:fs';
import path from 'node:path';

export function loadEnv(cwd = process.cwd()) {
  const loaded = [];
  for (const f of ['.env', '.env.local']) {
    const fp = path.resolve(cwd, f);
    if (!fs.existsSync(fp)) continue;
    let n = 0;
    for (const line of fs.readFileSync(fp, 'utf8').split(/\r?\n/)) {
      const s = line.trim();
      if (!s || s.startsWith('#')) continue;
      const eq = s.indexOf('=');
      if (eq < 0) continue;
      const k = s.slice(0, eq).trim();
      let v = s.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      // 不覆盖已显式设置的变量：容器/平台注入的配置优先
      if (process.env[k] === undefined || process.env[k] === '') { process.env[k] = v; n++; }
    }
    loaded.push(f + '(' + n + ')');
  }
  return loaded;
}

export const envLoaded = loadEnv();
