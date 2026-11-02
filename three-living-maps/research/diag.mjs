import '../three-living-maps/server/lib/env.mjs';
process.chdir('D:/桌面/大作业/three-living-maps');
const {buildContext} = await import('../three-living-maps/server/lib/retrieval.mjs');
const {ask, aiStatus} = await import('../three-living-maps/server/lib/ai.mjs');
console.log('aiStatus:', JSON.stringify(aiStatus()));
for (const q of ['什么是幻觉？本项目用了哪些手段降低它？','怎么做红烧肉才好吃？']) {
  const ctx = buildContext(q,{topK:5});
  console.log('\n=== Q:', q);
  console.log('  overlap=',ctx.lexical_overlap,'conf=',ctx.confidence,'chunks=',ctx.chunks.length,'node_ids=',ctx.node_ids.join(','));
  const r = await ask(q, ctx);
  console.log('  status=',r.status,'mode=',r.mode,'evidence=',r.evidence,'truncated=',r.truncated);
  console.log('  citations=',JSON.stringify(r.citations));
  console.log('  answer[0..180]=', String(r.answer||r.message||'').slice(0,180).replace(/\n/g,' | '));
}