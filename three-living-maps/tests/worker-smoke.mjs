// Worker 公网冒烟测试：用真实浏览器（经代理出口，绕过本地 DNS 污染）验证托管版前端+后端。
import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(import.meta.url);
const PW = 'C:/Users/BJH/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const { chromium } = require(path.join(PW, 'playwright'));

const BASE = process.env.WORKER_URL || 'https://three-living-maps.three-living-maps.workers.dev';
const PROXY = process.env.SMOKE_PROXY || 'http://127.0.0.1:7890';
const exe = path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-win64/chrome-headless-shell.exe');

let pass = 0, fail = 0;
const check = (name, ok, detail = '') => { ok ? pass++ : fail++; console.log((ok ? '✓ ' : '✗ ') + name + (detail ? ' — ' + detail : '')); };

const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox', '--disable-gpu'], proxy: { server: PROXY } });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'zh-CN' });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });

await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 60000 });
check('Worker 首页加载', await page.locator('h1').first().isVisible());
check('首页标题正确', (await page.title()).includes('三张活地图'));

await page.goto(BASE + '/maps/domain', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForSelector('[data-node-id]', { timeout: 30000 });
const n = await page.locator('[data-node-id]').count();
check('Worker 领域地图渲染节点', n >= 60, n + ' 个');

// 节点点击 -> 抽屉 + 星群
await page.locator('[data-node-id="D-C-RAG"]').first().click();
await page.waitForSelector('[data-testid="constellation"]', { timeout: 20000 });
check('Worker 星群面板出现', await page.locator('[data-testid="constellation"]').count() === 1);
await page.keyboard.press('Escape');
await page.waitForTimeout(800);
check('Worker X-Ray 覆盖层画出', await page.locator('[data-testid="xray-overlay"]').count() === 1);

// 深链接刷新
await page.goto(BASE + '/node/D-C-CTX', { waitUntil: 'networkidle', timeout: 60000 });
check('Worker 节点深链接', (await page.locator('h1').first().textContent() || '').includes('上下文窗口'));
await page.reload({ waitUntil: 'networkidle' });
check('Worker 深链接刷新不丢路由', (await page.locator('h1').first().textContent() || '').includes('上下文窗口'));

// 来源库
await page.goto(BASE + '/sources', { waitUntil: 'networkidle', timeout: 60000 });
check('Worker 来源库渲染', await page.locator('li.card').count() >= 40);

// 搜索
await page.goto(BASE + '/search?q=' + encodeURIComponent('培养方案'), { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(800);
check('Worker 搜索可用', (await page.locator('body').textContent() || '').includes('命中'));

// AI 助手（Worker 渠道；生成或降级均可，越界必须拒答）
await page.goto(BASE + '/assistant', { waitUntil: 'networkidle', timeout: 60000 });
await page.locator('#ai-q').fill('什么是幻觉？本项目用了哪些手段降低它？');
await page.locator('[data-testid="ai-submit"]').click();
await page.waitForSelector('[data-testid="ai-result"], [data-testid="ai-error"]', { timeout: 200000 });
const aiText = await page.locator('[data-testid="ai-assistant"]').textContent();
check('Worker AI 返回结果', (aiText || '').includes('证据状态：'));
check('Worker AI 附证据状态', (aiText || '').includes('证据状态'));

await page.goto(BASE + '/assistant', { waitUntil: 'networkidle', timeout: 60000 });
await page.locator('#ai-q').fill('怎么做红烧肉才好吃？');
await page.locator('[data-testid="ai-submit"]').click();
await page.waitForSelector('[data-testid="ai-result"], [data-testid="ai-error"]', { timeout: 120000 });
const oos = await page.locator('[data-testid="ai-assistant"]').textContent();
check('Worker 越界拒答', (oos || '').includes('超出地图边界') || await page.locator('[data-testid="boundary-fog"]').count() === 1);

// 反馈提交（真实写入 D1）
await page.goto(BASE + '/feedback', { waitUntil: 'networkidle', timeout: 60000 });
await page.locator('#fb-q').fill('【Worker 冒烟】浏览器端反馈提交通道验证。');
await page.locator('[data-testid="fb-submit"]').click();
await page.waitForTimeout(2500);
check('Worker 反馈提交成功', await page.locator('[role="status"]').filter({ hasText: /感谢反馈/ }).count() >= 1);

// 管理端门控
await page.goto(BASE + '/admin', { waitUntil: 'networkidle', timeout: 60000 });
check('Worker 管理端未启用时门控', (await page.locator('body').textContent() || '').includes('管理端未启用'));

// 移动端
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'zh-CN', isMobile: true, hasTouch: true });
const mp = await mctx.newPage();
await mp.goto(BASE + '/maps/domain', { waitUntil: 'networkidle', timeout: 60000 });
await mp.waitForSelector('[data-node-id]', { timeout: 30000 });
check('Worker 移动端地图渲染', await mp.locator('[data-node-id]').count() > 10);
check('Worker 移动端无横向溢出', await mp.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
await mp.locator('[data-node-id="D-C-RAG"]').first().click();
await mp.waitForTimeout(1500);
check('Worker 移动端底部抽屉', await mp.locator('[data-testid="mobile-dock"]').count() === 1);
await mctx.close();

check('Worker 无 JS 控制台错误', errs.length === 0, errs.slice(0, 2).join(' | '));

await browser.close();
console.log('\nWorker 冒烟：通过 ' + pass + ' / 失败 ' + fail + ' / 共 ' + (pass + fail));
process.exit(fail ? 1 : 0);