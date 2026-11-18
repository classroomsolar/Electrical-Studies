// Report contents chooser: which study results go into the printed, PDF and Excel report.
// The choice only filters and appends report sections. It never changes a calculated value.
export const REPORT_SECTIONS=[
 ['basis','Study basis','Fault type, frequency, scenario and calculation base'],
 ['diagram','Single-line diagram','Drawn system with bus fault levels (printed report)'],
 ['buses','Bus fault levels','RMS, peak, X/R and status at every bus'],
 ['sources','Source contributions','Each source’s current for each fault location'],
 ['branches','Branch currents','Current through each connection for each fault location'],
 ['duty','Equipment rating checks','SCCR and interrupting duty against the entered ratings'],
 ['screens','Cable and short-time screens','Database adiabatic and short-time checks'],
 ['pv','PV array data','Module and string nameplate values'],
 ['inputs','Entered network data','Every entered property, with database sources'],
 ['qa','Assumptions and input review','Warnings, scope notes and QA messages'],
 ['methodology','Method and limits','Calculation method text (printed report)']
];
export const SECTION_KEYS=REPORT_SECTIONS.map(s=>s[0]);
// Per-fault-location tables can hold buses × sources rows. Large projects default to the selected fault bus.
export const LARGE_REPORT_BUSES=150;
const SHEET_SECTION={'Summary':null,'Bus results':'buses','DLG phase currents':'buses','Phase currents':'buses','Conductor currents':'buses','Bond currents':'buses','Source contributions':'sources','Source terminals':'sources','Branch currents':'branches','Branch phases':'branches','Equipment duty':'duty','Database screens':'screens','PV arrays':'pv','Study inputs':'inputs','Workbook references':'inputs','Assumptions & QA':'qa'};
const PER_LOCATION=new Set(['Source contributions','Source terminals','Branch currents','Branch phases']);
export function sectionForSheet(name){return Object.hasOwn(SHEET_SECTION,name)?SHEET_SECTION[name]:'buses';}
const STORE='fcs-report-contents-v1';
function readStore(){try{const raw=globalThis.localStorage?.getItem(STORE);const v=raw?JSON.parse(raw):{};return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}catch{return {};}}
export function defaultReportChoice(project){return {sections:[...SECTION_KEYS],scope:(project?.buses?.length||0)>LARGE_REPORT_BUSES?'selected':'all',studies:[],excluded:[]};}
export function cleanChoice(choice,project){
 const base=defaultReportChoice(project);if(!choice||typeof choice!=='object')return base;
 const sections=Array.isArray(choice.sections)?choice.sections.filter(k=>SECTION_KEYS.includes(k)):base.sections;
 const keyList=v=>Array.isArray(v)?v.filter(k=>typeof k==='string'&&k.length<120).slice(0,200):[];
 return {sections,scope:choice.scope==='selected'||choice.scope==='all'?choice.scope:base.scope,studies:keyList(choice.studies),excluded:keyList(choice.excluded)};
}
export function loadReportChoice(project){return cleanChoice(readStore()[project?.id],project);}
export function saveReportChoice(project,choice){
 if(!project?.id)return;try{const all=readStore();delete all[project.id];all[project.id]=cleanChoice(choice,project);const keys=Object.keys(all);for(const k of keys.slice(0,Math.max(0,keys.length-60)))delete all[k];globalThis.localStorage?.setItem(STORE,JSON.stringify(all));}catch{}
}
// ---------- Extra studies (operating, engineering screens and tool panels) ----------
const MAX_ROWS=20000,MAX_DEPTH=24;
function flatten(value,prefix,rows,part,depth=0){
 if(rows.length>MAX_ROWS)throw Error('Study output is too large for the combined report; use the study’s own export.');
 if(depth>MAX_DEPTH){rows.push([part,prefix,'(nested data not shown)']);return rows;}
 if(value===null||value===undefined||typeof value!=='object'){
  rows.push([part,prefix||'value',value===undefined?'':typeof value==='number'&&!Number.isFinite(value)?String(value):typeof value==='string'?value.slice(0,8000):value]);return rows;
 }
 if(Array.isArray(value)){if(!value.length)rows.push([part,prefix||'list','(empty)']);for(let i=0;i<value.length;i++)flatten(value[i],`${prefix}[${i}]`,rows,part,depth+1);return rows;}
 const keys=Object.keys(value);if(!keys.length)rows.push([part,prefix||'object','(empty)']);
 for(const k of keys)flatten(value[k],prefix?`${prefix}.${k}`:k,rows,part,depth+1);
 return rows;
}
function studySheet(label,study){
 const rows=[['Study','Method',study.method||label],['Study','Captured',study.createdAt||'Current project inputs'],['Study','Scope','Screening result. Independently verify inputs, standards edition and equipment data before professional use.']];
 if(study.inputs!==undefined)flatten(study.inputs,'',rows,'Input');
 flatten(study.outputs,'',rows,'Result');
 return {name:label,headers:['Part','Item','Value'],rows};
}
const ADVANCED_LABELS={protectionCases:'Protection case check',arc:'Arc flash at one location (IEEE 1584)',thermal:'Thermal resistance screen',harmonic:'Harmonic TDD screen',dc:'DC loop fault',battery:'Battery runtime',grounding:'Ground potential rise',motor:'Motor start voltage dip',reliability:'Reliability indices',n1:'N-1 connectivity'};
// Each entry: {key,label,group,ready,reason,sheets():[sheet]}
export function reportStudyEntries(project,{operatingPreview,advancedPreview}={}){
 const out=[];
 if(operatingPreview){let data=null,error='';try{data=operatingPreview(project);}catch(e){error=e?.message||String(e);}
  out.push({key:'operating:loadflow',label:'Load flow (operating study)',group:'Operating studies',ready:!error,reason:error,sheets:()=>[studySheet('Load flow',{method:'Balanced power flow',inputs:project.operatingStudy||{},outputs:data})]});}
 if(advancedPreview){let all={};try{all=advancedPreview(project)||{};}catch(e){all={};}
  for(const [k,r] of Object.entries(all)){const label=ADVANCED_LABELS[k]||k;out.push({key:'advanced:'+k,label,group:'Engineering studies',ready:!!r&&!r.error,reason:r?.error||'',sheets:()=>[studySheet(label,{method:label,inputs:(project.advancedStudy||{})[k==='battery'?'dc':k==='n1'?'reliability':k],outputs:r.data})]});}}
 const reg=globalThis.__fcsReportStudies;
 if(reg instanceof Map)for(const [key,entry] of reg){
  if(!entry||typeof entry.get!=='function')continue;
  if(entry.projectId&&project?.id&&entry.projectId!==project.id)continue;
  let study=null,error='';try{study=entry.get();if(!study)error='Run the study first';}catch(e){error=e?.message||String(e);}
  out.push({key:'tool:'+key,label:entry.label||key,group:'Study tools run this session',ready:!error,reason:error,at:entry.at,sheets:()=>study?.sheets?study.sheets.map(s=>({...s,name:String(entry.label||key).split(' (')[0].slice(0,14).trim()+' · '+s.name})):[studySheet(entry.label||key,study)]});
 }
 return out;
}
// ---------- Applying the choice ----------
function uniqueNames(sheets){const used=new Set();return sheets.map(s=>{let raw=String(s.name).replace(/[\\/?*\[\]:]/g,' ');if(raw.length>31&&raw.indexOf(' (')>0&&raw.indexOf(' (')<=31)raw=raw.slice(0,raw.indexOf(' ('))+raw.slice(raw.indexOf(')',raw.indexOf(' ('))+1);let base=raw.slice(0,31).trim(),name=base,i=2;while(used.has(name.toLowerCase())){const tag=' ('+(i++)+')';name=base.slice(0,31-tag.length)+tag;}used.add(name.toLowerCase());return name===s.name?s:{...s,name};});}
export function applyReportChoice(report,choice,{project,selectedName,studies=[]}={}){
 const c=cleanChoice(choice,project),keep=new Set(c.sections),chosenStudies=new Set(c.studies);
 const sheets=[],pdfSheets=[];
 const included=REPORT_SECTIONS.filter(([k])=>keep.has(k)).map(s=>s[1]);
 for(const sheet of report.sheets){
  if(sheet.name==='Summary'){
   const rows=[...sheet.rows,['Report contents',included.join(', ')||'Summary only'],['Per-location detail',c.scope==='selected'?'Selected fault bus only'+(selectedName?' ('+selectedName+')':''):'All fault locations']];
   sheets.push({...sheet,rows});pdfSheets.push('Summary');continue;
  }
  const key=sectionForSheet(sheet.name);if(!keep.has(key))continue;
  let out=sheet;
  if(c.scope==='selected'&&PER_LOCATION.has(sheet.name))out={...sheet,rows:selectedName?sheet.rows.filter(r=>r[0]===selectedName):[]};
  sheets.push(out);pdfSheets.push(out.name);
 }
 const extra=[];
 for(const s of studies){if(!chosenStudies.has(s.key)||!s.ready)continue;for(const sheet of s.sheets())extra.push(sheet);}
 if(extra.length){sheets[0]?.rows.push(['Additional studies',studies.filter(s=>chosenStudies.has(s.key)&&s.ready).map(s=>s.label).join(', ')]);}
 const named=uniqueNames([...sheets,...extra]);
 return {...report,sheets:named,pdfSheets:named.map(s=>s.name),choice:c};
}
// ---------- Chooser markup (screen only, never printed) ----------
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function reportChoiceMarkup(choice,{project,studies=[],available=new Set(SECTION_KEYS),open=true}={}){
 const c=cleanChoice(choice,project),keep=new Set(c.sections),chosen=new Set(c.studies),large=(project?.buses?.length||0)>LARGE_REPORT_BUSES;
 const box=([k,label,hint])=>{const off=!available.has(k);return `<label class="report-choice${off?' is-off':''}"><input type="checkbox" data-report-section="${k}" ${keep.has(k)&&!off?'checked':''} ${off?'disabled':''}><span><b>${esc(label)}</b><small>${esc(off?'Not part of this study type':hint)}</small></span></label>`;};
 const groups=[...new Set(studies.map(s=>s.group))];
 const studyBox=s=>`<label class="report-choice${s.ready?'':' is-off'}"><input type="checkbox" data-report-study="${esc(s.key)}" ${s.ready&&chosen.has(s.key)?'checked':''} ${s.ready?'':'disabled'}><span><b>${esc(s.label)}</b><small>${esc(s.ready?'Calculated · include its inputs and results':'Not calculated: '+s.reason)}</small></span></label>`;
 return `<details class="panel report-contents no-print" ${open?'open':''}><summary><span class="eyebrow">REPORT CONTENTS</span><strong>Choose what goes in the printed, PDF and Excel report</strong></summary>
<div class="report-choice-actions"><button type="button" data-report-all="all">Select all</button><button type="button" data-report-all="none">Clear all</button><span class="micro">${[...keep].filter(k=>available.has(k)).length} of ${available.size} sections${chosen.size?' · '+chosen.size+' additional '+(chosen.size===1?'study':'studies'):''}</span></div>
<div class="report-choice-grid">${REPORT_SECTIONS.map(box).join('')}</div>
<fieldset class="report-scope"><legend>Source and branch tables</legend><label><input type="radio" name="report-scope" data-report-scope="all" ${c.scope==='all'?'checked':''}> All fault locations</label><label><input type="radio" name="report-scope" data-report-scope="selected" ${c.scope==='selected'?'checked':''}> Selected fault bus only</label>${large?`<small>${project.buses.length} buses: every fault location gives about ${(project.buses.length*Math.max(1,project.sources?.length||1)).toLocaleString('en-US')} source rows. “Selected fault bus only” keeps the report a manageable size.</small>`:''}</fieldset>
${groups.map(g=>{const ready=studies.filter(s=>s.group===g&&s.ready),wait=studies.filter(s=>s.group===g&&!s.ready);return `<h3>${esc(g)}</h3>${ready.length?`<div class="report-choice-grid">${ready.map(studyBox).join('')}</div>`:''}${wait.length?`<p class="micro report-waiting">${ready.length?'Also available once calculated':'Not calculated yet'}: ${wait.map(s=>esc(s.label)).join(', ')}. Run ${wait.length===1?'it':'them'} on the ${g==='Operating studies'?'Operating studies':g==='Engineering studies'?'Engineering studies':'tool'} page, then return here.</p>`:''}`;}).join('')}
<p class="micro">The summary page is always included. Your choice is remembered for this project on this device.</p></details>`;
}
// Simple printable table for an additional study sheet.
export function sheetTableMarkup(sheet,{limit=3000}={}){
 const rows=sheet.rows.slice(0,limit);
 return `<section class="panel report-extra"><h2>${esc(sheet.name)}</h2><div class="table-scroll"><table><thead><tr>${sheet.headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${sheet.rows.length>limit?`<p class="micro">First ${limit.toLocaleString('en-US')} of ${sheet.rows.length.toLocaleString('en-US')} rows shown. Download Excel for every row.</p>`:''}</section>`;
}
