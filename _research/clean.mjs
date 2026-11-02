import '../three-living-maps/server/lib/env.mjs';
process.chdir('D:/桌面/大作业/three-living-maps');
const {getDb} = await import('../three-living-maps/server/lib/db.mjs');
const d=getDb();
const before=d.prepare("SELECT COUNT(*) c FROM nodes").get().c;
// 清理诊断脚本误写入的测试节点
const junk=d.prepare("SELECT id,title FROM nodes WHERE id LIKE 'Z-TEST%' OR id LIKE 'T-UPD%' OR id LIKE 'X-%'").all();
console.log('待清理:', JSON.stringify(junk));
d.prepare("DELETE FROM relations WHERE source_node_id LIKE 'Z-TEST%' OR target_node_id LIKE 'Z-TEST%' OR source_node_id LIKE 'T-UPD%' OR target_node_id LIKE 'T-UPD%'").run();
d.prepare("DELETE FROM nodes WHERE id LIKE 'Z-TEST%' OR id LIKE 'T-UPD%' OR id LIKE 'X-%'").run();
const after=d.prepare("SELECT COUNT(*) c FROM nodes").get().c;
console.log('nodes:', before, '->', after);
// 重新 seed 确保干净