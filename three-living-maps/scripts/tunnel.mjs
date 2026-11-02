// 公开访问隧道：课程要求「云端运行、国内普通网络可访问、无需登录」。
// 提供两种不依赖付费账号的路径，失败时给出明确替代指引。
//   1) localhost.run —— SSH 反向隧道获得公网 https 地址（无需注册）
//   2) serveo.net    —— 同类方案，作为备用
// 注意：隧道地址仅在进程存活期间有效；长期稳定托管见 docs/DEPLOY.md。
import { spawn } from 'node:child_process';

const PORT = Number(process.env.PORT || 8787);
// 转发目标用 127.0.0.1（不用 localhost）：隧道侧对 localhost 的解析可能落到 IPv6 ::1，
// 而本地服务监听 IPv4，会导致 502「no tunnel」。实测 127.0.0.1 可正常转发。
// serveo 放前面：本次实测 localhost.run 能发地址但转发不绑定，serveo 稳定可用。
const HOSTS = [
  { name: 'serveo.net', args: ['-o', 'StrictHostKeyChecking=accept-new', '-o', 'ServerAliveInterval=30', '-o', 'ExitOnForwardFailure=yes', '-R', `80:127.0.0.1:${PORT}`, 'serveo.net'] },
  { name: 'localhost.run', args: ['-o', 'StrictHostKeyChecking=accept-new', '-o', 'ServerAliveInterval=30', '-o', 'ExitOnForwardFailure=yes', '-R', `80:127.0.0.1:${PORT}`, 'nokey@localhost.run'] }
];

function tryHost(h) {
  return new Promise((resolve) => {
    console.log(`[tunnel] 尝试 ${h.name} …（本地服务需在 ${PORT} 端口运行）`);
    const p = spawn('ssh', h.args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let settled = false;
    // 只接受隧道服务分配的域名，排除门户/文档地址（实测教训：
    // 宽松正则会先匹配到 banner 里的 https://admin.localhost.run 与 https://localhost.run/docs/…，
    // 导致脚本上报一个错误的「公开地址」，实际访问 502。）
    const PORTAL = /(admin\.|www\.)?localhost\.run\/?(docs|$)|localhost\.run\/docs/;
    const grab = (buf) => {
      const s = buf.toString();
      for (const m of s.matchAll(/https:\/\/([a-zA-Z0-9.-]+\.(?:lhr\.life|serveo\.net|serveousercontent\.com|localhost\.run))/g)) {
        const url = m[0];
        if (PORTAL.test(url)) continue;
        if (!settled) { settled = true; resolve({ host: h.name, url, proc: p }); return true; }
      }
      return false;
    };
    p.stdout.on('data', (b) => { if (!grab(b)) process.stdout.write(`[${h.name}] ${b}`); });
    p.stderr.on('data', (b) => {
      if (grab(b)) return;
      const s = b.toString();
      if (!/Warning: Permanently added/i.test(s)) process.stderr.write(`[${h.name}] ${s}`);
    });
    p.on('error', (e) => { if (!settled) { settled = true; console.error(`[tunnel] ${h.name} 启动失败: ${e.message}`); resolve(null); } });
    p.on('exit', (code) => { if (!settled) { settled = true; console.error(`[tunnel] ${h.name} 退出 (code=${code})`); resolve(null); } });
    setTimeout(() => { if (!settled) { settled = true; p.kill(); resolve(null); } }, 45000);
  });
}

try {
  const r = await fetch(`http://127.0.0.1:${PORT}/api/health`);
  if (!r.ok) throw new Error('health 非 200');
  console.log(`[tunnel] 本地服务正常（端口 ${PORT}）`);
} catch (e) {
  console.error(`[tunnel] 本地服务未在 ${PORT} 端口运行（${e.message}）。`);
  console.error('[tunnel] 请先在另一个终端执行：npm run build && npm start');
  process.exit(1);
}

for (const h of HOSTS) {
  const r = await tryHost(h);
  if (r) {
    console.log('\n' + '='.repeat(64));
    console.log('  公开访问地址: ' + r.url);
    console.log('  经由: ' + r.host + '（SSH 反向隧道）');
    console.log('  保持本进程运行即可访问；Ctrl+C 关闭。');
    console.log('  注意：临时地址，进程结束后失效。长期托管见 docs/DEPLOY.md。');
    console.log('='.repeat(64) + '\n');
    await new Promise(() => {});
  }
}

console.error('[tunnel] 所有隧道服务均不可用（可能是网络封锁 22 端口出站，或需代理）。');
console.error('[tunnel] 替代方案（均需账号所有者操作）：');
console.error('  1. 云服务器 VPS：systemd + nginx 反代，docs/DEPLOY.md 有完整步骤。');
console.error('  2. 容器平台：仓库含 Dockerfile 与 docker-compose.yml，可部署到任何支持容器的平台。');
console.error('  3. 内网演示：npm start 后用内网地址（不满足「国内普通网络可访问」，仅作退路）。');
process.exit(1);