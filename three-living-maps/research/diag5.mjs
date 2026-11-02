import '../three-living-maps/server/lib/env.mjs';
process.chdir('D:/桌面/大作业/three-living-maps');
const {search} = await import('../three-living-maps/server/lib/retrieval.mjs');
const {getDb,parseNode} = await import('../three-living-maps/server/lib/db.mjs');
const q='课程要求网站在访问权限和密钥方面满足哪些条件？依据在哪里？';
const r = search(q, { limit: 30, graphExpand:false });
console.log('rank D-R-LECTURE:', r.hits.findIndex(h=>h.id==='D-R-LECTURE'));
console.log('rank D-COURSE-AIF:', r.hits.findIndex(h=>h.id==='D-COURSE-AIF'));
r.hits.slice(0,8).forEach((h,i)=>console.log(String(i).padStart(2),h.kind.padEnd(8),h.id.padEnd(16),String(h.score).padStart(7),'cov='+h.coverage,'|',(h.why||[]).join(',')));
const d=getDb();
for(const id of ['D-R-LECTURE','D-COURSE-AIF']){
  const n=parseNode(d.prepare('SELECT * FROM nodes WHERE id=?').get(id));
  console.log('\n'+id+' 含「访问权限」?', JSON.stringify(n.details).includes('访问权限'), '| 含「密钥」?', JSON.stringify(n.details).includes('密钥'), '| 含「无需逐人申请权限」?', JSON.stringify(n.details).includes('无需逐人申请权限'));
}