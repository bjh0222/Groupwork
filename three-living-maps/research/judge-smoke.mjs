import '../three-living-maps/server/lib/env.mjs';
process.chdir('D:/桌面/大作业/three-living-maps');
const {askRaw} = await import('../three-living-maps/server/lib/ai.mjs');
const t0=Date.now();
const out = await askRaw(['你是评测裁判。判断待评答案是否覆盖每条参考要点的核心信息。','只输出 JSON 数组，元素为 true/false。','',
'【待评答案】RAG 的原始论文发表于 NeurIPS 2020；资料指出其作者机构为 Facebook AI Research。','',
'【参考要点】','1. 原始论文是 Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks','2. 发表于 NeurIPS 2020','3. 作者机构包括 Facebook AI Research、New York University、University College London'].join('\n'), {maxTokens:400, temperature:0});
console.log('judge call:', ((Date.now()-t0)/1000).toFixed(1)+'s');
console.log('result:', out ? JSON.stringify(out.content).slice(0,200) : 'null (no channel)');