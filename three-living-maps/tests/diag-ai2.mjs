// 诊断：完全复刻 e2e.mjs 的 AI 段落（含前置页面访问顺序），观察 DOM 变化
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import path from 'node:path';
const require = createRequire(import.meta.url);
const PW = 'C:/Users/BJH/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const { chromium } = require(path.join(PW, 'playwright'));
const ROOT = path.resolve(import.meta.dirname, '..');
const PORT = 8809, BASE = `http://127.0.0.1:${PORT}`;
const exe = path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-win64/chrome-headless-shell.exe');

const proc = spawn(process.execPath, ['server/index.mjs'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' }, stdio: ['ignore','pipe','pipe'] });
proc.stdout.on('data', d => process.stdout.write('[srv] ' + d));
proc.stderr.on('data', d => process.stderr.write('[srv-err] ' + d));
for (let i=0;i<40;i++){ try{ const r=await fetch(BASE+'/api/health'); if(r.ok) break; }catch{} await new Promise(r=>setTimeout(r,400)); }

const b = await chromium.launch({ executablePath: exe, args:['--no-sandbox'] });
const pg = await b.newPage({ viewport:{width:1440,height:900} });
pg.on('requestfailed', r => console.log('[reqfail]', r.url().slice(0,80), r.failure()?.errorText));
pg.on('response', async r => { if (r.url().includes('/api/ai/ask')) console.log('[resp] /api/ai/ask ->', r.status()); });
pg.on('pageerror', e => console.log('[pageerror]', e.message));

// 复刻前置顺序
await pg.goto(BASE+'/admin', { waitUntil:'networkidle' });
console.log('visited /admin');
await pg.goto(BASE+'/assistant', { waitUntil:'networkidle' });
console.log('visited /assistant; ai-q count =', await pg.locator('#ai-q').count());
await pg.locator('#ai-q').fill('什么是幻觉？本项目用了哪些手段降低它？');
console.log('filled. submit buttons =', await pg.locator('button[type="submit"]').count());
await pg.locator('button[type="submit"]').first().click();
console.log('clicked submit; waiting…');
for (let i=0;i<24;i++){
  await new Promise(r=>setTimeout(r,2500));
  const s = await pg.evaluate(() => ({
    busy: !!document.querySelector('[data-testid="ai-busy"]'),
    result: !!document.querySelector('[data-testid="ai-result"]'),
    error: !!document.querySelector('[data-testid="ai-error"]'),
    errText: (document.querySelector('[data-testid="ai-error"]')?.textContent||'').slice(0,120)
  }));
  console.log(`  t=${(i+1)*2.5}s busy=${s.busy} result=${s.result} error=${s.error} ${s.errText}`);
  if (s.result || s.error) break;
}
await b.close(); proc.kill();