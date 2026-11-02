// 聚焦诊断：观察 AI 助手两种路径的真实 DOM 文本
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const PW = 'C:/Users/BJH/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const { chromium } = require(path.join(PW, 'playwright'));
const ROOT = path.resolve(import.meta.dirname, '..');
const PORT = 8801, BASE = `http://127.0.0.1:${PORT}`;
const exe = path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-win64/chrome-headless-shell.exe');

const proc = spawn(process.execPath, ['server/index.mjs'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' }, stdio: ['ignore','pipe','pipe'] });
proc.stdout.on('data', d => process.stdout.write('[srv] ' + d));
proc.stderr.on('data', d => process.stderr.write('[srv-err] ' + d));
for (let i=0;i<60;i++){ try{ const r=await fetch(BASE+'/api/health'); if(r.ok) break; }catch{} await new Promise(r=>setTimeout(r,500)); }
const st = await (await fetch(BASE+'/api/ai/status')).json();
console.log('AI status:', JSON.stringify(st));

const b = await chromium.launch({ executablePath: exe, args:['--no-sandbox'] });
const pg = await b.newPage();
pg.on('pageerror', e=>console.log('[pageerror]', e.message));
pg.on('console', m=>{ if(m.type()==='error') console.log('[console-error]', m.text()); });

for (const q of ['什么是幻觉？本项目用了哪些手段降低它？','怎么做红烧肉才好吃？']) {
  await pg.goto(BASE+'/assistant', { waitUntil:'networkidle' });
  await pg.locator('#ai-q').fill(q);
  await pg.locator('button[type="submit"]').first().click();
  console.log('\n===== Q:', q);
  await pg.waitForFunction(() => {
    const t = document.body.innerText || '';
    return t.includes('证据状态：') || t.includes('请求失败') || t.includes('超出地图边界') || t.includes('资料未覆盖');
  }, null, { timeout: 180000 }).catch(e=>console.log('  waitFor TIMEOUT'));
  const info = await pg.evaluate(() => {
    const el = document.querySelector('[data-testid="ai-assistant"]');
    return {
      hasBoundary: !!document.querySelector('[data-testid="boundary-fog"]'),
      hasCapsules: document.querySelectorAll('[data-capsule]').length,
      hasDrawer: !!document.querySelector('[data-testid="evidence-drawer"]'),
      textHasZhengju: (el?.textContent||'').includes('证据状态'),
      statusLine: (document.querySelector('[data-testid="ai-assistant"] .card > div')?.textContent||'').slice(0,160)
    };
  });
  console.log(' ', JSON.stringify(info, null, 1));
}
await b.close(); proc.kill();