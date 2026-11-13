/** V29 incremental UI. Reads the current Studio draft read-only; never writes Studio project, draft, study or cloud keys. */
import {transformerToleranceEnvelope,nec11024Label,ENVELOPE_V29} from './fault-envelope-v29.mjs';
import {advancedStudyReportBlob} from './advanced-study-report.mjs?v=20261108-v32';
const __fcsReportStudy=(key,label,get)=>{try{(globalThis.__fcsReportStudies??=new Map()).set(key,{label,projectId:globalThis.__fcsStudio?.projectId?.()??null,at:Date.now(),get});globalThis.dispatchEvent?.(new Event('fcs-report-studies'))}catch{}};
const DRAFT='fault-network-draft-v2';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ka=a=>Number.isFinite(a)?(a/1000).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})+' kA':'—';
const volts=v=>Number.isFinite(v)?(v>=1000?(v/1000).toLocaleString('en-US',{maximumFractionDigits:3})+' kV':v+' V'):'—';
let state={envelope:null,project:null,label:null};

async function engine(){
 const req=globalThis.__fcsBundleRequire;
 if(typeof req==='function')return req('network-engine.mjs').calculateProject;
 return (await import('./network-engine.mjs?v=20261108-v31')).calculateProject; // local/offline fallback
}
function readDraft(){
 const raw=localStorage.getItem(DRAFT);if(!raw)throw Error('No Studio project is open yet. Build or open a network first.');
 if(raw.length>5e6)throw Error('Studio draft is too large to analyse here.');
 let p;try{p=JSON.parse(raw)}catch{throw Error('Studio draft could not be read; it has not been changed.')}
 if(p?.format!=='fault-current-network')throw Error('Open a Studio network project first.');return p;
}
function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)}
function labelHtml(l){return `<div class="v29-label" role="img" aria-label="${esc(l.title)} ${esc(l.availableFaultText)}"><div class="v29-label-head">⚠ ${esc(l.title)}</div><div class="v29-label-body"><div class="v29-big">${esc(l.availableFaultText)}</div><table><tr><th>Equipment</th><td>${esc(l.equipment)}</td></tr><tr><th>Nominal voltage</th><td>${esc(volts(l.voltage))}</td></tr><tr><th>X/R at fault</th><td>${esc(typeof l.xr==='number'?l.xr.toFixed(2):l.xr??'—')}</td></tr><tr><th>Basis</th><td>${esc(l.basis)}</td></tr><tr><th>Date of calculation</th><td>${esc(l.dateOfCalculation)}</td></tr>${l.calculatedBy?`<tr><th>Calculated by</th><td>${esc(l.calculatedBy)}</td></tr>`:''}</table><p>${esc(l.reference)}</p></div></div>`}
const labelCss=`.v29-label{width:min(520px,100%);border:3px solid #111;font:14px Arial,Helvetica,sans-serif;color:#111;background:#fff;box-sizing:border-box}.v29-label-head{background:#ffcc00;font-weight:800;font-size:18px;padding:10px 12px;border-bottom:3px solid #111;text-align:center}.v29-label-body{padding:12px}.v29-big{font-size:34px;font-weight:800;text-align:center;margin:4px 0 10px}.v29-label table{width:100%;border-collapse:collapse}.v29-label th{text-align:left;width:42%;padding:3px 6px 3px 0;vertical-align:top}.v29-label td{padding:3px 0}.v29-label p{font-size:11px;margin:10px 0 0}`;

function mount(){
 if(document.querySelector('#fcs-v29-launch'))return;
 const css=document.createElement('style');css.textContent=`#fcs-v29-launch{position:fixed;left:16px;bottom:70px;z-index:3800;background:#6b3f15;color:#fff;border:1px solid #f0c48c;border-radius:28px;padding:11px 16px;font:600 13px system-ui;box-shadow:0 3px 12px #13283a77;cursor:pointer}#fcs-v29-overlay[hidden]{display:none!important}#fcs-v29-overlay{position:fixed;inset:0;z-index:4800;display:flex;align-items:center;justify-content:center;background:#061928dc;padding:10px;font:14px system-ui}#fcs-v29-panel{width:min(900px,100%);max-height:94dvh;overflow:auto;box-sizing:border-box;background:#fbfaf7;color:#102c3e;border-radius:16px;padding:clamp(13px,3vw,26px);box-shadow:0 10px 50px #0008}#fcs-v29-panel h2{font:700 21px system-ui;margin:0 0 10px}#fcs-v29-panel button{background:#7a4a1a;color:#fff;border:0;border-radius:7px;padding:9px 12px;margin:4px 4px 4px 0;cursor:pointer}#fcs-v29-panel button:disabled{opacity:.45;cursor:not-allowed}#fcs-v29-panel button:focus-visible,#fcs-v29-launch:focus-visible{outline:3px solid #2f8fff}#fcs-v29-panel .v29-warning{padding:10px;background:#fff0d7;border-left:4px solid #c88b26}#fcs-v29-panel .v29-row{display:flex;gap:8px;flex-wrap:wrap;align-items:end}#fcs-v29-panel label{display:flex;flex-direction:column;gap:3px;font-weight:600;font-size:12px;flex:1 1 170px}#fcs-v29-panel input,#fcs-v29-panel select{padding:9px;font:14px system-ui;border:1px solid #b9a98f;border-radius:6px}#fcs-v29-panel .v29-table{overflow:auto}#fcs-v29-panel table.v29-res{border-collapse:collapse;width:100%;font-size:13px}#fcs-v29-panel table.v29-res th,#fcs-v29-panel table.v29-res td{border-bottom:1px solid #e3dccf;padding:6px;text-align:right;white-space:nowrap}#fcs-v29-panel table.v29-res th:first-child,#fcs-v29-panel table.v29-res td:first-child{text-align:left}#fcs-v29-panel [role=status]{min-height:22px;font-weight:600}#fcs-v29-panel .v29-err{color:#a01818}${labelCss}`;document.head.append(css);
 const btn=document.createElement('button');btn.id='fcs-v29-launch';btn.type='button';btn.textContent='Fault label & Z tolerance';btn.setAttribute('aria-haspopup','dialog');document.body.append(btn);
 {const dock=()=>{const h=document.getElementById('v26-launcher-holder');if(h&&btn.parentElement!==h){h.append(btn);btn.style.position='static';btn.style.margin='4px'}return !!h};if(!dock()){let k=0;const t=setInterval(()=>{if(dock()||++k>40)clearInterval(t)},250)}}
 const today=new Date().toISOString().slice(0,10);
 const ov=document.createElement('div');ov.id='fcs-v29-overlay';ov.hidden=true;ov.innerHTML=`<section id="fcs-v29-panel" role="dialog" aria-modal="true" aria-labelledby="fcs-v29-title"><div class="v29-row" style="justify-content:space-between;align-items:center"><h2 id="fcs-v29-title">Transformer impedance tolerance & NEC 110.24 label</h2><button type="button" data-v29="close">Close</button></div>
 <p class="v29-warning">Uses the network currently open in the Studio, unchanged. Each transformer %Z is varied by ± the tolerance you enter and every combination is solved with the same Studio fault engine. A certified transformer test report overrides this envelope. Labels are field-marking aids, not PPE or arc-flash labels.</p>
 <div class="v29-row"><label>Transformer %Z tolerance (%)<input id="v29-tol" type="number" min="0" max="20" step="0.5" value="7.5" inputmode="decimal"></label><button type="button" data-v29="run">Calculate envelope</button></div>
 <p role="status" id="v29-status" aria-live="polite"></p><div class="v29-table" id="v29-results"></div>
 <h3 style="margin:18px 0 6px">NEC 110.24 available fault current label</h3>
 <div class="v29-row"><label>Bus / equipment location<select id="v29-bus" disabled></select></label><label>Label value<select id="v29-basis"><option value="maximumWithTolerance">Worst case with tolerance</option><option value="nominal">Nameplate impedance</option></select></label></div>
 <div class="v29-row"><label>Equipment name (optional)<input id="v29-equip" maxlength="80" placeholder="e.g. MSB-1 Main switchboard"></label><label>Date of calculation<input id="v29-date" type="date" value="${today}"></label><label>Calculated by (optional)<input id="v29-by" maxlength="80"></label></div>
 <div class="v29-row"><button type="button" data-v29="label" disabled>Preview label</button><button type="button" data-v29="print" disabled>Print label</button><button type="button" data-v29="svg" disabled>Download label (HTML)</button></div><div id="v29-label-out" style="margin-top:10px"></div>
 <h3 style="margin:18px 0 6px">Report</h3><div class="v29-row"><button type="button" data-v29="pdf" disabled>Download PDF</button><button type="button" data-v29="xlsx" disabled>Download Excel</button><button type="button" data-v29="json" disabled>Download JSON</button></div>
 <p style="font-size:12px;color:#5b5446">${esc(ENVELOPE_V29.id)} v${esc(ENVELOPE_V29.version)} · Basis: IEEE C57.12.00 ±7.5 % two-winding impedance tolerance (user-selectable); Bussmann point-to-point worst case uses 0.9 × %Z (10 %); NEC 110.24(A) field marking with date of calculation.</p></section>`;
 document.body.append(ov);
 const $=s=>ov.querySelector(s),status=(m,err)=>{const e=$('#v29-status');e.textContent=m;e.className=err?'v29-err':''};
 const setEnabled=(sel,on)=>ov.querySelectorAll(sel).forEach(b=>b.disabled=!on);
 let lastFocus=null;
 const open=()=>{lastFocus=document.activeElement;ov.hidden=false;$('#v29-tol').focus()};
 const close=()=>{ov.hidden=true;lastFocus?.focus?.()};
 btn.addEventListener('click',open);
 ov.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();close()}});
 ov.addEventListener('click',e=>{if(e.target===ov)close()});
 const study=()=>({method:ENVELOPE_V29.id,createdAt:new Date().toISOString(),inputs:{projectName:state.project?.name,tolerancePercent:state.envelope.tolerancePercent,buses:state.project.buses.length,transformers:state.envelope.transformerCount,faultType:state.project.settings?.faultType,scenario:state.project.settings?.scenario},outputs:{...state.envelope,...(state.label?{nec11024Label:state.label}:{})}});
 const makeLabel=()=>{state.label=nec11024Label({envelope:state.envelope,busId:$('#v29-bus').value,basis:$('#v29-basis').value,equipmentName:$('#v29-equip').value,calculatedBy:$('#v29-by').value,date:$('#v29-date').value});$('#v29-label-out').innerHTML=labelHtml(state.label);return state.label};
 ov.addEventListener('click',async e=>{const act=e.target.closest('[data-v29]')?.dataset.v29;if(!act)return;
  try{
   if(act==='close')return close();
   if(act==='run'){
    status('Calculating…');setEnabled('[data-v29=label],[data-v29=print],[data-v29=svg],[data-v29=pdf],[data-v29=xlsx],[data-v29=json]',false);
    const calc=await engine();state.project=readDraft();state.label=null;$('#v29-label-out').innerHTML='';
    state.envelope=transformerToleranceEnvelope({project:state.project,tolerancePercent:Number($('#v29-tol').value),calculateProject:calc});{let s=null;try{s=JSON.parse(JSON.stringify(study()));}catch{}if(s)__fcsReportStudy('fault-envelope','Transformer impedance tolerance fault envelope',()=>s);}
    const env=state.envelope,rows=env.buses.map(b=>`<tr><td>${esc(b.busName)}</td><td>${esc(volts(b.voltageV))}</td><td>${ka(b.minimumWithTolerance.totalA)}</td><td><strong>${ka(b.nominal.totalA)}</strong></td><td>${ka(b.maximumWithTolerance.totalA)}</td><td>${b.maximumIncreasePercent==null?'—':'+'+b.maximumIncreasePercent.toFixed(2)+' %'}</td></tr>`).join('');
    $('#v29-results').innerHTML=`<table class="v29-res"><caption style="text-align:left;padding:4px 0">${esc(env.status)} · ${esc(env.transformerCount)} transformer(s) · ${esc(env.searchedCases)}</caption><thead><tr><th scope="col">Bus</th><th scope="col">Voltage</th><th scope="col">Minimum</th><th scope="col">Nameplate</th><th scope="col">Maximum</th><th scope="col">Increase</th></tr></thead><tbody>${rows}</tbody></table>${env.issues.filter(i=>i.severity==='error').map(i=>`<p class="v29-err">${esc(i.message)}</p>`).join('')}`;
    const sel=$('#v29-bus');sel.innerHTML=env.buses.filter(b=>Number.isFinite(b.nominal.totalA)).map(b=>`<option value="${esc(b.busId)}">${esc(b.busName)} · ${esc(volts(b.voltageV))}</option>`).join('');sel.disabled=!sel.options.length;
    setEnabled('[data-v29=label],[data-v29=print],[data-v29=svg]',sel.options.length>0);setEnabled('[data-v29=pdf],[data-v29=xlsx],[data-v29=json]',true);
    status(env.status==='INPUT REQUIRED'?'The Studio project has input errors; fix them in the Studio first.':'Envelope calculated from the open Studio project.',env.status==='INPUT REQUIRED');return;
   }
   if(!state.envelope)throw Error('Calculate the envelope first.');
   if(act==='label'){makeLabel();status('Label preview ready.');return}
   if(act==='print'){const l=makeLabel(),f=document.createElement('iframe');f.style.cssText='position:fixed;width:0;height:0;border:0;right:0;bottom:0';f.setAttribute('aria-hidden','true');f.srcdoc=`<!doctype html><html><head><meta charset="utf-8"><title>NEC 110.24 label</title><style>${labelCss}body{margin:12mm}</style></head><body>${labelHtml(l)}</body></html>`;document.body.append(f);f.onload=()=>{f.contentWindow.focus();f.contentWindow.print();setTimeout(()=>f.remove(),60000)};status('Print dialog opened.');return}
   if(act==='svg'){const l=makeLabel();download(new Blob([`<!doctype html><html><head><meta charset="utf-8"><title>NEC 110.24 label</title><style>${labelCss}</style></head><body>${labelHtml(l)}</body></html>`],{type:'text/html'}),'NEC-110.24-label.html');status('Label downloaded.');return}
   const stamp=new Date().toISOString().slice(0,10);
   if(act==='json'){download(new Blob([JSON.stringify(study(),null,2)],{type:'application/json'}),`fault-envelope-v29-${stamp}.json`);status('JSON downloaded.');return}
   if(act==='pdf'||act==='xlsx'){download(advancedStudyReportBlob(study(),act),`fault-envelope-v29-${stamp}.${act}`);status(act.toUpperCase()+' downloaded.');return}
  }catch(err){status(err.message||String(err),true)}
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
