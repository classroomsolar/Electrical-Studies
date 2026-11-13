/**
 * Lossless, safe advanced-study PDF and XLSX export without a web service.
 * Inputs, outputs, units, scope, provenance and warnings are preserved as
 * sheets; the shared public-report-engine supplies established ZIP/PDF writers.
 * Never turn an illustrative or bounded result into an equipment approval.
 */
import {workbookBlob,pdfBlob} from './public-report-engine.mjs?v=20261108-v32';
// Row budget for the flattened (path, value) listing. Large per-bus result lists are written as their own tables
// (one row per bus) instead, so plant-scale studies export; long sheets continue on numbered sheets.
const maxRows=400000,maxDepth=24,TABLE_MIN=50;
function collect(value,prefix='',depth=0,rows=[]){
 if(depth>maxDepth)throw Error('Study report nesting exceeds safe maximum');
 if(rows.length>maxRows)throw Error('Study report exceeds supported row count; export JSON instead');
 if(value===null||typeof value!=='object'){
  if(typeof value==='number'&&!Number.isFinite(value))throw Error('Nonfinite study result cannot be exported');
  if(typeof value==='string'&&value.length>8000)throw Error('Oversized field cannot be safely exported to spreadsheet/PDF');
  rows.push([prefix||'value',value===null?'null':value]);return rows;
 }
 if(Array.isArray(value)){
  if(!value.length)rows.push([prefix||'array','[]']);
  for(let i=0;i<value.length;i++)collect(value[i],`${prefix}[${i}]`,depth+1,rows);
 }else{
  const keys=Object.keys(value);if(!keys.length)rows.push([prefix||'object','{}']);
  for(let k of keys)collect(value[k],prefix?`${prefix}.${k}`:k,depth+1,rows);
 }
 return rows;
}
const warning='ENGINEERING SCREENING ONLY — independently verify actual manufacturer, utility, installation, equipment settings and standards edition before professional use.';
// Arrays of records (e.g. one entry per bus) longer than TABLE_MIN become tables: nested objects are flattened one level
// per column (a.b), deeper values are written as JSON text. Returns [sheets, outputs without those arrays].
function tables(outputs){const sheets=[],rest={};
 for(const [key,value] of Object.entries(outputs)){
  if(Array.isArray(value)&&value.length>TABLE_MIN&&value.every(v=>v&&typeof v==='object'&&!Array.isArray(v))){
   const cols=[],seen=new Set(),add=c=>{if(!seen.has(c)){seen.add(c);cols.push(c)}};
   const flat=v=>{const o={};for(const [k,x] of Object.entries(v)){if(x&&typeof x==='object'&&!Array.isArray(x))for(const [k2,y] of Object.entries(x))o[k+'.'+k2]=y;else o[k]=x}return o};
   const rows=value.map(flat);for(const r of rows)for(const c of Object.keys(r))add(c);
   const cell=x=>x===null||x===undefined?'':typeof x==='object'?JSON.stringify(x).slice(0,8000):typeof x==='number'&&!Number.isFinite(x)?String(x):typeof x==='string'?x.slice(0,8000):x;
   sheets.push({name:('Results · '+key).slice(0,31),headers:cols,rows:rows.map(r=>cols.map(c=>cell(r[c])))});
  }else rest[key]=value;}
 return [sheets,rest];}
export function advancedStudyReport(study){
 if(!study||!study.outputs||!study.inputs||typeof study.method!=='string')throw Error('Run a documented advanced study before exporting');
 if(study.outputs.status===undefined||typeof study.outputs.status!=='string')throw Error('Only successfully calculated studies can be reported');
 const [resultTables,restOutputs]=tables(study.outputs),[inputTables,restInputs]=tables(study.inputs);
 const created=study.createdAt??new Date().toISOString(),outputRows=collect(restOutputs),inputRows=collect(restInputs);
 let risk=[['Release status','BOUNDED METHOD, NOT A STANDARDS/DEVICE APPROVAL'],['Warning',warning],['Study method',study.method],['Timestamp',created]];
 for(const [key,val] of Object.entries(study.outputs))if(['scope','limitations','warnings','assumptions','reference','provenance'].includes(key))collect(val,`outputs.${key}`,0,risk);
 return {sheets:[
  {name:'Summary',headers:['Property','Value'],rows:[['Project','Fault Current Studio advanced study'],['Method',study.method],['Model status',study.outputs.status],['Captured UTC',created],['Warning',warning],['Report data provenance','Entered study inputs, isolated calculated method outputs. No external OEM certification or auto-selected breaker/PPE.']]},
  {name:'Study inputs',headers:['Input path','Entered value'],rows:inputRows},
  {name:'Equipment duty',headers:['Calculated output path','Value'],rows:outputRows},
  {name:'Assumptions & QA',headers:['Evidence / limitation','Value'],rows:risk},
  ...resultTables,...inputTables.map(t=>({...t,name:('Inputs · '+t.name.replace(/^Results · /,'')).slice(0,31)}))
 ],...((resultTables.length||inputTables.length)?{pdfSheets:['Summary','Study inputs','Equipment duty','Assumptions & QA',...resultTables.map(t=>t.name)]}:{})};
}
export function advancedStudyReportBlob(study,format){let report=advancedStudyReport(study);if(format==='pdf')return pdfBlob(report);if(format==='xlsx')return workbookBlob(report);throw Error('Unsupported advanced study report format')}
