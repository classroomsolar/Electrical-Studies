// V33 (C4): bus table CSV for operating studies. Round trip, matching, validation messages, formula safety, and the load flow
// solved from uploaded values equals the load flow solved from the same values typed one by one.
import fs from 'node:fs';
const S=new URL('../../SITE/',import.meta.url).href;
const {operatingCsv,applyOperatingCsv,parseCsv,OPERATING_COLUMNS}=await import(S+'operating-table-v33.mjs');
const {calculateOperatingPreview}=await import(S+'operating-workspace.mjs');
const {normalizeProject}=await import(S+'network-model.mjs');
let pass=0,fail=0;const ok=(n,c,i='')=>{c?pass++:fail++;if(!c)console.log('FAIL',n,i)};
const load=f=>normalizeProject(JSON.parse(fs.readFileSync(new URL(f,import.meta.url))));
// 1. 1,970-bus plant: download, fill, upload
const p=load('../V31_SCALE/results/plant2000.json');const poi=p.buses[0];p.operatingStudy={baseMVA:100,slackBusId:poi.id,buses:{},screening:{}};
let csv=operatingCsv(p),rows=parseCsv(csv).rows;
ok('heading',rows[0].join()===OPERATING_COLUMNS.join());ok('one row per bus',rows.length===p.buses.length+1,rows.length);ok('slack row',rows[1][3]==='SLACK');
const pv=new Set(p.sources.filter(s=>s.kind==='pv').map(s=>s.bus));
const filled=rows.map((r,i)=>i===0?r:r[3]==='SLACK'?r:[r[0],r[1],r[2],'PQ',pv.has(r[0])?'0.8':'0',pv.has(r[0])?'-0.05':'0','','','']);
const text=filled.map(r=>r.map(c=>/[",\n]/.test(c)?'"'+c.replaceAll('"','""')+'"':c).join(',')).join('\r\n');
const t0=performance.now();const res=applyOperatingCsv(p,text);const ms=performance.now()-t0;
ok('all rows matched',res.matched===p.buses.length,res.matched);ok('no errors',res.errors.length===0,res.errors.slice(0,3));ok('values changed',res.changes===2*(p.buses.length-1),res.changes);
ok('fast',ms<2000,ms);
// same values typed one by one
const q=load('../V31_SCALE/results/plant2000.json');q.operatingStudy={baseMVA:100,slackBusId:q.buses[0].id,buses:{},screening:{}};
for(const b of q.buses){if(b.id===q.buses[0].id)continue;q.operatingStudy.buses[b.id]={pMW:pv.has(b.id)?0.8:0,qMvar:pv.has(b.id)?-0.05:0}}
ok('stored data equals typed data',JSON.stringify(Object.fromEntries(Object.entries(p.operatingStudy.buses).filter(([k])=>k!==poi.id)))===JSON.stringify(q.operatingStudy.buses));
const a=calculateOperatingPreview(p),b=calculateOperatingPreview(q);const fa=a.loadFlow||a.flow||a,fb=b.loadFlow||b.flow||b;
ok('load flow result identical',JSON.stringify(fa)===JSON.stringify(fb));
const sa=JSON.stringify(fa);ok('load flow produced a solution',/converged|iterations/i.test(sa),sa.slice(0,200));
// 2. round trip: download after upload gives the uploaded values back
const again=parseCsv(operatingCsv(p)).rows;const anyPv=again.find(r=>pv.has(r[0]));ok('round trip P',anyPv[4]==='0.8',anyPv);ok('round trip Q',anyPv[5]==='-0.05',anyPv);
const r2=applyOperatingCsv(p,operatingCsv(p));ok('re-upload changes nothing',r2.changes===0&&r2.cleared===0&&r2.errors.length===0,JSON.stringify(r2).slice(0,200));
// 3. small project: messages
const s=load('../V31_SCALE/results/plant80.json');s.operatingStudy={baseMVA:100,slackBusId:s.buses[0].id,buses:{},screening:{}};
const B=s.buses,H=OPERATING_COLUMNS.join(',')+'\n';
let r=applyOperatingCsv(s,H+`${B[1].id},,,PQ,abc,1,,,\n`);ok('text in number cell',r.errors.length===1&&/Row 2: net_P_MW "abc" is not a number/.test(r.errors[0]),r.errors);ok('other cell of that row still stored',s.operatingStudy.buses[B[1].id].qMvar===1);
r=applyOperatingCsv(s,H+`nope,,,PQ,1,1,,,\n`);ok('unknown bus',/Row 2: no bus with bus_id "nope"/.test(r.errors[0]),r.errors);
r=applyOperatingCsv(s,H+`${B[2].id},,,XY,1,1,,,\n`);ok('bad control',/control "XY" is not PQ or PV/.test(r.errors[0]),r.errors);ok('bad control row not stored',s.operatingStudy.buses[B[2].id]?.pMW==null);
r=applyOperatingCsv(s,H+`${B[2].id},,,PV,1,,1.7,,\n`);ok('setpoint range',/voltage_setpoint_pu 1.7 must be from 0.5 to 1.5/.test(r.errors[0]),r.errors);ok('PV stored',s.operatingStudy.buses[B[2].id].type==='PV'&&s.operatingStudy.buses[B[2].id].pMW===1);
r=applyOperatingCsv(s,H+`${B[2].id},,,PV,,,1.02,5,-5\n`);ok('Q limits order reported',/pv_Q_min_Mvar \(5\) is above pv_Q_max_Mvar \(-5\)/.test(r.errors[0]),r.errors);
r=applyOperatingCsv(s,H+`${B[0].id},,,PQ,1,1,,,\n`);ok('slack protected',/is the slack bus/.test(r.errors[0]),r.errors);ok('slack got no P',s.operatingStudy.buses[B[0].id]?.pMW==null);
r=applyOperatingCsv(s,H+`${B[3].id},,,SLACK,,,,,\n`);ok('SLACK on other bus refused',/is not the slack bus/.test(r.errors[0]),r.errors);
r=applyOperatingCsv(s,H+`${B[1].id},,,PQ,2,,,,\n${B[1].id},,,PQ,3,,,,\n`);ok('duplicate row',/appears twice/.test(r.errors[0])&&s.operatingStudy.buses[B[1].id].pMW===2,r.errors);
r=applyOperatingCsv(s,H+`${B[1].id},,,,clear,,,,\n`);ok('clear empties',r.cleared===1&&s.operatingStudy.buses[B[1].id].pMW===null,JSON.stringify(r));
r=applyOperatingCsv(s,H+`${B[1].id},,,,,,,,\n`);ok('blank leaves unchanged',r.changes===0&&s.operatingStudy.buses[B[1].id].qMvar===1);
r=applyOperatingCsv(s,H+`,${B[4].name},,PQ,4,0,,,\n`);ok('match by unique name',r.matched===1&&s.operatingStudy.buses[B[4].id].pMW===4,JSON.stringify(r).slice(0,200));
const d=structuredClone(s);d.buses[5].name=d.buses[6].name;r=applyOperatingCsv(d,H+`,${d.buses[5].name},,PQ,4,0,,,\n`);ok('ambiguous name refused',/more than one bus is named/.test(r.errors[0]),r.errors);
r=applyOperatingCsv(s,H+`${B[1].id},,,PQ,1e7,,,,\n`);ok('magnitude limit',/outside ±1,000,000/.test(r.errors[0]),r.errors);
r=applyOperatingCsv(s,'bus_id;net_P_MW;net_Q_Mvar\n'+`${B[1].id};1,5;-0,25\n`);ok('semicolon file with decimal comma',s.operatingStudy.buses[B[1].id].pMW===1.5&&s.operatingStudy.buses[B[1].id].qMvar===-0.25,JSON.stringify(r));
r=applyOperatingCsv(s,'bus_id,net_P_MW,comment\n'+`${B[1].id},2,hello\n`);ok('extra column reported, row used',r.unknownColumns.join()==='comment'&&s.operatingStudy.buses[B[1].id].pMW===2);
try{applyOperatingCsv(s,'foo,bar\n1,2\n');ok('missing key column refused',false)}catch(e){ok('missing key column refused',/bus_id or bus_name/.test(e.message),e.message)}
try{applyOperatingCsv(s,'');ok('empty file refused',false)}catch(e){ok('empty file refused',/empty/.test(e.message))}
try{applyOperatingCsv(s,H+`"${B[1].id},,,PQ,1\n`);ok('unclosed quote refused',false)}catch(e){ok('unclosed quote refused',/quoted cell/.test(e.message),e.message)}
// 4. formula safety and awkward names
const f=structuredClone(s);f.buses[1].name='=HYPERLINK("http://example.invalid","x")';f.buses[2].name='A, "quoted"\nname';f.buses[3].name='-5 feeder';
const out=operatingCsv(f),pr=parseCsv(out).rows;ok('formula name neutralised',pr[2][1].startsWith("'="),pr[2][1]);ok('comma/quote/newline name survives',pr[3][1]==='A, "quoted"\nname',pr[3][1]);ok('minus name neutralised',pr[4][1]==="'-5 feeder",pr[4][1]);
ok('negative number not altered',parseCsv(operatingCsv(p)).rows.find(x=>pv.has(x[0]))[5]==='-0.05');
r=applyOperatingCsv(f,'bus_name,net_P_MW,net_Q_Mvar\n'+`"'=HYPERLINK(""http://example.invalid"",""x"")",7,0\n`);ok('neutralised name still matches on upload',f.operatingStudy.buses[f.buses[1].id].pMW===7,JSON.stringify(r).slice(0,300));
console.log({pass,fail,apply_1970_rows_ms:Math.round(ms)});process.exit(fail?1:0);
