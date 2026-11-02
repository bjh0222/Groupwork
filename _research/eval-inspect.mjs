import fs from 'node:fs';
const r = JSON.parse(fs.readFileSync('D:/桌面/大作业/three-living-maps/data/eval-results.json','utf8'));
console.log('run_at', r.run_at, '| passed', r.passed+'/'+r.total, '| scores', JSON.stringify(r.scores));
for (const it of r.items.filter(x=>['EV-14','EV-02','EV-09'].includes(x.id))) {
  console.log('\n===== '+it.id+' ['+it.category+'] status='+it.status+' mode='+it.mode+' pass='+it.pass);
  console.log('Q: '+it.question);
  console.log('points: '+it.points_detail.map(p=>(p.hit?'✓':'✗')+' '+p.point.slice(0,60)).join('\n         '));
  console.log('--- answer ---');
  console.log((it.answer_preview||'(null)').slice(0,700));
}