import '../three-living-maps/server/lib/env.mjs';
process.chdir('D:/桌面/大作业/three-living-maps');
const {getDb} = await import('../three-living-maps/server/lib/db.mjs');
const d=getDb();
const show=(t)=>console.log(t, JSON.stringify(d.prepare(`SELECT * FROM ${t}`).all().slice(0,12).map(r=>({id:r.id,object_id:r.object_id,change:(r.change||'').slice(0,50),question:(r.question||'').slice(0,40),content:(r.content||'').slice(0,40)})),null,1));
show('update_log'); show('feedback'); show('candidate_content'); show('ai_usage');