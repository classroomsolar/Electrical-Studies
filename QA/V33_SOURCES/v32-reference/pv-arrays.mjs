// PV nameplate references are deliberately outside the electrical source model.
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const positive=v=>typeof v==='number'&&Number.isFinite(v)&&v>0;
const count=v=>Number.isSafeInteger(v)&&v>0;
const product=(...values)=>values.every(positive)&&Number.isFinite(values.reduce((a,b)=>a*b,1))?values.reduce((a,b)=>a*b,1):null;
export const pvArrayScope='Identical-module nameplate reference only. These totals are not a DC fault solution or inverter AC fault contribution. Temperature, irradiance, mismatch, wiring losses and protection are not modeled.';
export const pvArrayFields=[
 ['moduleManufacturer','Module manufacturer','', 'text'],['moduleModel','Module model','', 'text'],
 ['modulePmpW','Module nameplate Pmp','W'],['moduleVocV','Module open-circuit Voc','V DC'],['moduleVmpV','Module maximum-power Vmp','V DC'],
 ['moduleIscA','Module nameplate short-circuit Isc','A DC'],['moduleImpA','Module maximum-power Imp','A DC'],
 ['moduleMaxV','Module maximum system voltage','V DC'],['moduleFuseA','Module maximum series fuse rating','A'],
 ['moduleVocTempCoeff','Voc temperature coefficient (reference)','%/°C'],['moduleIscTempCoeff','Isc temperature coefficient (reference)','%/°C'],['modulePmpTempCoeff','Pmp temperature coefficient (reference)','%/°C']
];
export const pvNumericKeys=pvArrayFields.filter(f=>f[3]!=='text').map(f=>f[0]);
export const pvTextKeys=['moduleManufacturer','moduleModel'];
export const pvEditableKeys=[...pvNumericKeys,...pvTextKeys,'modulesPerString','parallelStrings','inverterId'];
export function validatePvField(key,value){
 if(['modulesPerString','parallelStrings'].includes(key)&&!count(value))throw Error('Enter a positive whole number.');
 if(pvNumericKeys.includes(key)&&value!=null&&(!Number.isFinite(value)||(!key.endsWith('TempCoeff')&&value<=0)))throw Error('Enter a positive finite nameplate value, or leave it unknown.');
}
export function pvArraySummary(a){
 const series=count(a.modulesPerString)?a.modulesPerString:null,parallel=count(a.parallelStrings)?a.parallelStrings:null;
 const moduleCount=series&&parallel&&Number.isSafeInteger(series*parallel)?series*parallel:null;
 return {moduleCount,powerW:product(moduleCount,a.modulePmpW),vocV:product(series,a.moduleVocV),vmpV:product(series,a.moduleVmpV),iscA:product(parallel,a.moduleIscA),impA:product(parallel,a.moduleImpA)};
}
export function pvArrayIssues(a,p){
 const issues=[],issue=(key,message,severity='error')=>issues.push({id:a.id,key,message:a.name+': '+message,severity});
 for(const [key,label] of [['modulesPerString','modules per string'],['parallelStrings','parallel strings']])if(!count(a[key]))issue(key,'enter a positive whole number of '+label+'.');
 for(const key of pvNumericKeys)if(a[key]!=null&&(typeof a[key]!=='number'||!Number.isFinite(a[key])||(!key.endsWith('TempCoeff')&&a[key]<=0)))issue(key,pvArrayFields.find(f=>f[0]===key)[1]+' must be a '+(key.endsWith('TempCoeff')?'finite':'positive finite')+' number.');
 if(a.inverterId&&!p.sources.some(s=>s.id===a.inverterId&&s.kind==='pv'))issue('inverterId','choose an existing PV inverter or leave the association empty.');
 const s=pvArraySummary(a);
 if(count(a.modulesPerString)&&count(a.parallelStrings)&&!s.moduleCount)issue('modulesPerString','total module count exceeds the supported integer range.');
 if(s.vocV>0&&positive(a.moduleMaxV)&&s.vocV>a.moduleMaxV)issue('moduleVocV','series Voc exceeds the module maximum system voltage at the supplied reference conditions.','warning');
 if(positive(a.moduleVmpV)&&positive(a.moduleVocV)&&a.moduleVmpV>=a.moduleVocV)issue('moduleVmpV','Vmp should be below Voc at the same reference conditions.','warning');
 if(positive(a.moduleImpA)&&positive(a.moduleIscA)&&a.moduleImpA>a.moduleIscA)issue('moduleImpA','Imp exceeds Isc; confirm the reference conditions.','warning');
 return issues;
}
export function pvReferenceIssues(p){
 const rows=[...(p.pvInputErrors||[]).map(e=>({...e,severity:'error'})),...(p.pvArrays||[]).flatMap(a=>pvArrayIssues(a,p))];
 const unique=new Map();for(const e of rows){const key=e.id+':'+e.key;if(!unique.has(key))unique.set(key,e);}return [...unique.values()];
}
const display=(v,unit='')=>v==null?'Not supplied':Number(v).toLocaleString('en-US',{maximumFractionDigits:4})+(unit?' '+unit:'');
export function pvArraySummaryMarkup(a){const s=pvArraySummary(a);return `<section class="pv-array-summary" aria-label="PV array nameplate totals"><h4>Array nameplate totals</h4><dl>${[['Modules',s.moduleCount,''],['Total Pmp',s.powerW,'W DC'],['Series Voc',s.vocV,'V DC'],['Series Vmp',s.vmpV,'V DC'],['Parallel nameplate Isc',s.iscA,'A DC'],['Parallel Imp',s.impA,'A DC']].map(([l,v,u])=>`<div><dt>${l}</dt><dd>${esc(display(v,u))}</dd></div>`).join('')}</dl><p>${pvArrayScope}</p></section>`;}
export function pvArrayForm(a,p,input){
 const association=input(a,'inverterId','Associated PV inverter',{options:[['','None / standalone reference'],...p.sources.filter(s=>s.kind==='pv').map(s=>[s.id,s.name])],help:'The dashed line records the DC-array association. Enter AC fault-current data on the inverter itself.'});
 return `<p class="model-note">${pvArrayScope}</p>`+association+input(a,'modulesPerString','Modules in series per string',{required:true})+input(a,'parallelStrings','Strings in parallel',{required:true})+`<div id="pv-array-summary">${pvArraySummaryMarkup(a)}</div><h4>Module reference values</h4>`+pvArrayFields.map(([key,label,unit,type])=>input(a,key,label+(unit?' ('+unit+')':''),{type:type||'number',help:key==='moduleIscA'?'Module DC nameplate Isc at its stated reference conditions; never used as an inverter AC fault current.':key==='moduleMaxV'?'A product voltage limit. Reference Voc alone does not establish a cold-temperature design limit.':''})).join('')+input(a,'dataReference','Module datasheet / reference conditions',{type:'text',help:'Record the document and conditions when entering custom values.'});
}
export function pvArrayReportRows(p){return (p.pvArrays||[]).map(a=>{const s=pvArraySummary(a);return [a.name,a.moduleManufacturer||'Not supplied',a.moduleModel||'Not supplied',a.modulesPerString,a.parallelStrings,s.moduleCount,s.powerW,s.vocV,s.vmpV,s.iscA,s.impA,p.sources.find(x=>x.id===a.inverterId&&x.kind==='pv')?.name||'None',pvArrayScope];});}
