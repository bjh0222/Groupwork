// 演示截图：为答辩与文档生成关键界面截图（含 X-Ray 引力线状态）。
// E2E 测试也会产出截图；本脚本专注「可放进汇报材料」的构图，可单独运行。
// 用法：npm run screenshots   （需先 npm run build）
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const PW = process.env.PLAYWRIGHT_DIR ||
  'C:/Users/BJH/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
let chromium;
try { ({ chromium } = require(path.join(PW, 'playwright'))); } catch { ({ chromium } = require('playwright')); }

const ROOT = path.resolve(import.meta.dirname, '..');
const PORT = Number(process.env.SHOT_PORT || 8811);
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = path.join(ROOT, 'docs', 'screenshots');
fs.mkdirSync(OUT, { recursive: true });

function findChromium() {
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
  if (!fs.existsSync(base)) return undefined;
  const dirs = fs.readdirSync(base).filter((d) => /^chromium_headless_shell-\d+$/.test(d) || /^chromium-\d+$/.test(d)).sort().reverse();
  for (const d of dirs) {
    for (const sub of ['chrome-headless-shell-win64/chrome-headless-shell.exe', 'chrome-win64/chrome.exe']) {
      const p = path.join(base, d, sub);
      if (fs.existsSync(p)) return p;
    }
  }
  return undefined;
}

const proc = spawn(process.execPath, ['server/index.mjs'], {
  cwd: ROOT, env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' }, stdio: ['ignore', 'pipe', 'pipe']
});
proc.stdout.on('data', () => {});
proc.stderr.on('data', (d) => process.stderr.write('[srv] ' + d));
for (let i = 0; i < 60; i++) { try { const r = await fetch(BASE + '/api/health'); if (r.ok) break; } catch { /* wait */ } await new Promise((r) => setTimeout(r, 400)); }

const browser = await chromium.launch({ executablePath: findChromium(), args: ['--no-sandbox', '--disable-gpu'] });
const shots = [];

async function shot(ctx, name, url, opts = {}) {
  const pg = await ctx.newPage();
  await pg.goto(BASE + url, { waitUntil: 'networkidle' });
  if (opts.waitFor) await pg.waitForSelector(opts.waitFor, { timeout: 20000 }).catch(() => {});
  if (opts.click) { await pg.locator(opts.click).first().click().catch(() => {}); await pg.waitForTimeout(opts.wait || 1200); }
  if (opts.esc) { await pg.keyboard.press('Escape'); await pg.waitForTimeout(opts.wait || 1200); }
  const file = path.join(OUT, name);
  await pg.screenshot({ path: file, fullPage: !!opts.fullPage });
  shots.push(name);
  console.log('  ✓ ' + name);
  await pg.close();
  return pg;
}

console.log('[shots] 桌面端 1440x900');
const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'zh-CN' });
await shot(desktop, 'shot-01-home.png', '/');
await shot(desktop, 'shot-02-domain.png', '/maps/domain', { waitFor: '[data-node-id]' });
// X-Ray 引力线：选中节点 -> 收起抽屉 -> 星群与连线可见
{
  const pg = await desktop.newPage();
  await pg.goto(BASE + '/maps/domain', { waitUntil: 'networkidle' });
  await pg.waitForSelector('[data-node-id]');
  await pg.locator('[data-node-id="D-C-RAG"]').first().click();
  await pg.waitForSelector('[data-testid="constellation"]', { timeout: 15000 }).catch(() => {});
  await pg.keyboard.press('Escape');
  await pg.waitForTimeout(1500);
  await pg.screenshot({ path: path.join(OUT, 'shot-03-xray.png') });
  shots.push('shot-03-xray.png'); console.log('  ✓ shot-03-xray.png（含引力线）');
  await pg.close();
}
await shot(desktop, 'shot-04-ecosystem.png', '/maps/ecosystem', { waitFor: '[data-node-id]' });
await shot(desktop, 'shot-05-cognition.png', '/maps/cognition', { waitFor: '[data-node-id]' });
await shot(desktop, 'shot-06-node-detail.png', '/node/D-C-RAG', { waitFor: 'h1', fullPage: true });
await shot(desktop, 'shot-07-sources.png', '/sources');
await shot(desktop, 'shot-08-search.png', '/search?q=RAG', { waitFor: 'a[href^="/node/"]' });
await shot(desktop, 'shot-09-eval.png', '/eval', { fullPage: false });
await shot(desktop, 'shot-10-updates.png', '/updates');
await shot(desktop, 'shot-11-feedback.png', '/feedback');
await shot(desktop, 'shot-12-about.png', '/about', { fullPage: true });
await shot(desktop, 'shot-13-admin-gated.png', '/admin');

// AI 助手（真实调用，可能较慢；失败也不阻断其他截图）
{
  const pg = await desktop.newPage();
  await pg.goto(BASE + '/assistant', { waitUntil: 'networkidle' });
  await pg.locator('#ai-q').fill('什么是 RAG？本项目为什么选它作为主路线？');
  await pg.locator('[data-testid="ai-submit"]').click().catch(() => {});
  await pg.waitForSelector('[data-testid="ai-result"], [data-testid="ai-error"]', { timeout: 180000 }).catch(() => {});
  await pg.waitForTimeout(800);
  await pg.screenshot({ path: path.join(OUT, 'shot-14-ai.png'), fullPage: true });
  shots.push('shot-14-ai.png'); console.log('  ✓ shot-14-ai.png');
  // 概念胶囊 -> 证据引力线
  const cap = pg.locator('[data-capsule]').first();
  if (await cap.count()) {
    await cap.click(); await pg.waitForTimeout(1500);
    await pg.screenshot({ path: path.join(OUT, 'shot-15-ai-evidence.png'), fullPage: true });
    shots.push('shot-15-ai-evidence.png'); console.log('  ✓ shot-15-ai-evidence.png（证据引力线）');
  }
  await pg.close();
}
// 越界拒答
{
  const pg = await desktop.newPage();
  await pg.goto(BASE + '/assistant', { waitUntil: 'networkidle' });
  await pg.locator('#ai-q').fill('怎么做红烧肉才好吃？');
  await pg.locator('[data-testid="ai-submit"]').click().catch(() => {});
  await pg.waitForSelector('[data-testid="ai-result"], [data-testid="ai-error"]', { timeout: 90000 }).catch(() => {});
  await pg.waitForTimeout(600);
  await pg.screenshot({ path: path.join(OUT, 'shot-16-ai-boundary.png'), fullPage: false });
  shots.push('shot-16-ai-boundary.png'); console.log('  ✓ shot-16-ai-boundary.png（知识边界雾化）');
  await pg.close();
}
await desktop.close();

console.log('[shots] 深色主题');
const dark = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'zh-CN', colorScheme: 'dark' });
{
  const pg = await dark.newPage();
  await pg.goto(BASE + '/maps/domain', { waitUntil: 'networkidle' });
  await pg.waitForSelector('[data-node-id]');
  await pg.locator('button[aria-label="切换明暗主题"]').click();
  await pg.waitForTimeout(700);
  await pg.screenshot({ path: path.join(OUT, 'shot-17-dark.png') });
  shots.push('shot-17-dark.png'); console.log('  ✓ shot-17-dark.png');
  await pg.close();
}
await dark.close();

console.log('[shots] 平板 834x1112');
const tablet = await browser.newContext({ viewport: { width: 834, height: 1112 }, locale: 'zh-CN', isMobile: true, hasTouch: true });
await shot(tablet, 'shot-20-tablet.png', '/maps/domain', { waitFor: '[data-node-id]' });
await tablet.close();

console.log('[shots] 手机 390x844');
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'zh-CN', isMobile: true, hasTouch: true });
await shot(mobile, 'shot-21-mobile-home.png', '/');
{
  const pg = await mobile.newPage();
  await pg.goto(BASE + '/maps/domain', { waitUntil: 'networkidle' });
  await pg.waitForSelector('[data-node-id]');
  await pg.locator('[data-node-id="D-C-RAG"]').first().click();
  await pg.waitForTimeout(1500);
  await pg.screenshot({ path: path.join(OUT, 'shot-22-mobile-dock.png') });
  shots.push('shot-22-mobile-dock.png'); console.log('  ✓ shot-22-mobile-dock.png（底部抽屉式多维标签流）');
  const ecoTab = pg.locator('[data-testid="mobile-dock"] button[role="tab"]').filter({ hasText: '生态链条' });
  if (await ecoTab.count()) {
    await ecoTab.tap(); await pg.waitForTimeout(800);
    await pg.screenshot({ path: path.join(OUT, 'shot-23-mobile-dock-eco.png') });
    shots.push('shot-23-mobile-dock-eco.png'); console.log('  ✓ shot-23-mobile-dock-eco.png');
  }
  await pg.close();
}
await mobile.close();

await browser.close();
proc.kill();
console.log(`\n[shots] 完成 ${shots.length} 张 -> ${OUT}`);