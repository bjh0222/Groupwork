// 诊断：完全按 e2e.mjs 的方式拉起服务，检查密钥是否加载、AI 是否响应
import { spawn } from 'node:child_process';
import path from 'node:path';
const ROOT = path.resolve(import.meta.dirname, '..');
const PORT = 8807, BASE = `http://127.0.0.1:${PORT}`;
const p = spawn(process.execPath, ['server/index.mjs'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' }, stdio: ['ignore','pipe','pipe'] });
p.stdout.on('data', d => process.stdout.write('[srv] ' + d));
p.stderr.on('data', d => process.stderr.write('[srv-err] ' + d));
for (let i=0;i<40;i++){ try{ const r=await fetch(BASE+'/api/health'); if(r.ok) break; }catch{} await new Promise(r=>setTimeout(r,400)); }
const st = await (await fetch(BASE+'/api/ai/status')).json();
console.log('aiStatus.enabled =', st.enabled, '| channels =', JSON.stringify(st.channels?.map(c=>c.id+':'+c.model)));
const t0 = Date.now();
try {
  const r = await fetch(BASE+'/api/ai/ask', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({question:'什么是幻觉？本项目用了哪些手段降低它？'}) });
  const j = await r.json();
  console.log('ask ->', (Date.now()-t0)+'ms', 'http', r.status, 'status=', j.status, 'mode=', j.mode, 'err=', j.error_message || '-');
  console.log('answer len=', (j.answer||'').length, 'citations=', JSON.stringify(j.citations));
} catch(e){ console.log('ask FAILED after', (Date.now()-t0)+'ms', e.message); }
p.kill();