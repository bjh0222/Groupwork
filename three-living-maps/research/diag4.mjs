import '../three-living-maps/server/lib/env.mjs';
process.chdir('D:/桌面/大作业/three-living-maps');
const {search} = await import('../three-living-maps/server/lib/retrieval.mjs');
for (const q of ['GLM-4.7-Flash 价格','定价']) {
  console.log('\n===== '+q);
  const r = search(q, { limit: 12, graphExpand:false });
  r.hits.forEach((h,i)=>console.log(String(i).padStart(2), h.kind.padEnd(9), h.id.padEnd(18), String(h.score).padStart(7), '|', (h.why||[]).join(',')));
}