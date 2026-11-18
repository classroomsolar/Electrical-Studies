// V32: report contents chooser: sections, per-location scope, extra studies, unique sheet names, persistence, markup.
import fs from 'fs';
const {browserReport}=await import('../../SITE/public-report-engine.mjs');
const {reportData}=await import('../../SITE/report-data.mjs');
const RC=await import('../../SITE/report-contents.mjs');
const {exampleProject}=await import('../../SITE/network-model.mjs');
const {calculateOperatingPreview}=await import('../../SITE/operating-workspace.mjs');
const {advancedPreview}=await import('../../SITE/advanced-workspace.mjs');
let fail=0;const ok=(c,m)=>{if(!c){fail++;console.log('FAIL',m)}else console.log('ok',m)};
const p=exampleProject();
// registry with a fake tool study + one with sheets
globalThis.__fcsReportStudies=new Map([['x',{label:'Conductor sizing (ampacity, voltage drop, short circuit)',get:()=>({method:'m',inputs:{a:1,b:[1,2]},outputs:{status:'OK',v:{w:3}}})}],['ops-bess',{label:'BESS dispatch (time series)',get:()=>({sheets:[{name:'Summary',headers:['a','b'],rows:[[1,2]]},{name:'Hourly',headers:['a'],rows:[[1]]}]})}],['bad',{label:'Broken',get:()=>{throw Error('Run the study first')}}],['other',{label:'Other project',projectId:'zzz',get:()=>({outputs:{}})}]]);
const studies=RC.reportStudyEntries(p,{operatingPreview:calculateOperatingPreview,advancedPreview});
console.log(studies.map(s=>s.key+':'+(s.ready?'ready':'off ('+s.reason.slice(0,40)+')')).join('\n'));
ok(!studies.some(s=>s.key==='tool:other'),'other-project study hidden');
ok(studies.find(s=>s.key==='tool:bad')?.ready===false,'broken study shown not ready');
const full=reportData(p);
const sel=(sections,scope='all',st=[])=>RC.applyReportChoice(full,{sections,scope,studies:st},{project:full.project,selectedName:full.results.find(r=>r.busId===full.project.selectedBus)?.busName,studies});
let r=sel(['buses']);ok(r.sheets.map(s=>s.name).join()==='Summary,Bus results','only buses: '+r.sheets.map(s=>s.name));
r=sel([]);ok(r.sheets.length===1&&r.sheets[0].rows.some(x=>x[0]==='Report contents'&&x[1]==='Summary only'),'summary only');
r=sel(RC.SECTION_KEYS,'selected');const src=r.sheets.find(s=>s.name==='Source contributions');const selName=full.results.find(q=>q.busId===full.project.selectedBus).busName;
ok(src.rows.length>0&&src.rows.every(x=>x[0]===selName),'selected scope filters sources ('+src.rows.length+' of '+full.sheets.find(s=>s.name==='Source contributions').rows.length+')');
r=sel(['buses'],'all',['tool:x','tool:ops-bess','tool:bad','advanced:arc']);
console.log(r.sheets.map(s=>s.name));
ok(r.sheets.length===2+1+2+1,'studies appended');ok(new Set(r.sheets.map(s=>s.name.toLowerCase())).size===r.sheets.length,'unique names');ok(r.sheets.every(s=>s.name.length<=31),'names<=31');
// values unchanged
const a=full.sheets.find(s=>s.name==='Bus results'),b=r.sheets.find(s=>s.name==='Bus results');ok(JSON.stringify(a)===JSON.stringify(b),'bus results values untouched');
for(const f of ['pdf','xlsx']){const blob=await browserReport(p,f,{choice:{sections:['buses','duty'],scope:'all',studies:['tool:x']},studies});ok(blob.size>500,f+' with choice '+blob.size);
 if(f==='pdf'){const t=Buffer.from(await blob.arrayBuffer()).toString('latin1');ok(t.includes('BUS RESULTS')&&t.includes('EQUIPMENT DUTY')&&!t.includes('STUDY INPUTS')&&t.includes('CONDUCTOR SIZING'),'pdf has chosen sections only');}}
// localStorage persistence
const store={};globalThis.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v}};
RC.saveReportChoice(p,{sections:['qa'],scope:'selected',studies:['tool:x']});ok(JSON.stringify(RC.loadReportChoice(p))===JSON.stringify({sections:['qa'],scope:'selected',studies:['tool:x'],excluded:[]}),'choice persists');
ok(RC.loadReportChoice({id:'new',buses:new Array(200)}).scope==='selected','large default selected');ok(RC.loadReportChoice({id:'n2',buses:[1]}).scope==='all','small default all');
const html=RC.reportChoiceMarkup(RC.loadReportChoice(p),{project:p,studies});ok(html.includes('data-report-section="qa" checked')&&!html.includes('data-report-section="buses" checked'),'markup reflects choice');
console.log(fail?'FAILURES '+fail:'ALL PASS');process.exit(fail?1:0);
