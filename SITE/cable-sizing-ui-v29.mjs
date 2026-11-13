/** V29 incremental UI: combined conductor sizing (NEC 310.16 ampacity + voltage drop + adiabatic short-circuit). Stand-alone; does not change the Studio project. */
import {sizeConductor,CABLE_SIZING_V29,CABLE_SIZING_DATA,SIZES} from './cable-sizing-v29.mjs?v=20261108-v29e';
import {advancedStudyReportBlob} from './advanced-study-report.mjs?v=20261108-v32';
import {clearingTime,IEC_CURVES,IEEE_CURVES} from './clearing-time-v29.mjs?v=20261108-v29e';
const __fcsReportStudy=(key,label,get)=>{try{(globalThis.__fcsReportStudies??=new Map()).set(key,{label,projectId:globalThis.__fcsStudio?.projectId?.()??null,at:Date.now(),get});globalThis.dispatchEvent?.(new Event('fcs-report-studies'))}catch{}};
const CURVE_OPTS=['',...Object.keys(IEC_CURVES).map(k=>'IEC '+k),...Object.keys(IEEE_CURVES).map(k=>'IEEE '+k)];
const KEY='fault-studio-cable-sizing-v29';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=(x,d=1)=>Number.isFinite(x)?x.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const yn=v=>v===null||v===undefined?'—':v?'<span class="ok">OK</span>':'<span class="bad">FAIL</span>';
function dockLauncher(btn){const tryDock=()=>{const h=document.getElementById('v26-launcher-holder');if(h&&btn.parentElement!==h){h.append(btn);btn.style.position='static';btn.style.margin='4px';return true}return !!h};if(tryDock())return;let tries=0;const t=setInterval(()=>{if(tryDock()||++tries>40)clearInterval(t)},250)}
function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)}
const FIELDS=[
 ['necEdition','NEC edition','select',['2023','2020'],'2023'],
 ['material','Conductor','select',['Copper','Aluminum'],'Copper'],
 ['insulationTempC','Insulation rating (°C)','select',['75','90','60'],'75'],
 ['terminationTempC','Termination rating (°C, NEC 110.14(C))','select',['75','60','90'],'75'],
 ['designCurrentA','Load current (A)','number',null,'100'],
 ['continuous','Continuous load (×1.25)','check',null,false],
 ['ambientC','Ambient (°C)','number',null,'30'],
 ['currentCarryingConductors','Current-carrying conductors in raceway','number',null,'3'],
 ['parallelSets','Parallel sets','number',null,'1'],
 ['phases','System','select',['3','1'],'3'],
 ['voltageV','Voltage, line-line or 1-phase (V)','number',null,'480'],
 ['powerFactor','Power factor','number',null,'0.85'],
 ['lengthFt','One-way length (ft)','number',null,'100'],
 ['ocpdMode','Overcurrent device (NEC 240.4)','select',['auto','given','none'],'auto'],
 ['ocpdA','OCPD rating, A (if given)','number',null,''],
 ['multioutletReceptacles','Multioutlet branch circuit with receptacles (no 240.4(B) round-up)','check',null,false],
 ['maxVoltageDropPercent','Max voltage drop (%) — blank to skip','number',null,'3'],
 ['faultCurrentA','Fault current at load end (A) — blank to skip','number',null,''],
 ['clearingTimeS','Clearing time (s) — type it, or pick the relay below','number',null,''],
 ['rxSize','Your cable data sheet: size (optional)','select',['',...SIZES],''],
 ['rxR','… its R, Ω/1000 ft (75 °C)','number',null,''],
 ['rxX','… its X, Ω/1000 ft','number',null,''],
 ['tccCurve','Upstream relay curve (fills clearing time)','select',CURVE_OPTS,''],
 ['tccPickupA','Relay pickup, primary A','number',null,''],
 ['tccDial','Relay TMS / time dial','number',null,''],
 ['tccInstA','Instantaneous pickup, primary A (optional)','number',null,''],
 ['tccBreakerCycles','Breaker rated interrupting time (cycles)','select',['5','3','2','8'],'5'],
 ['tccFrequency','Frequency (Hz)','select',['60','50'],'60'],
 ['insulationClass','Insulation class for k','select',['','PVC <=300 mm2','PVC >300 mm2','EPR/XLPE','Rubber'],''],
];
function mount(){
 if(document.getElementById('fcs-v29cs-open'))return;
 const css=document.createElement('style');css.textContent=`#fcs-v29cs-open{background:#1d4e3a;color:#fff;border:1px solid #9fd3b8;border-radius:28px;padding:11px 16px;font:600 13px system-ui;cursor:pointer;position:fixed;left:16px;bottom:170px;z-index:3800}#fcs-v29cs-ov[hidden]{display:none!important}#fcs-v29cs-ov{position:fixed;inset:0;z-index:4800;display:flex;align-items:center;justify-content:center;background:#061928dc;padding:8px;font:14px system-ui}#fcs-v29cs-panel{width:min(1180px,100%);max-height:95dvh;overflow:auto;box-sizing:border-box;background:#fbfaf9;color:#14283a;border-radius:16px;padding:clamp(12px,2.5vw,24px)}#fcs-v29cs-panel h2{font:700 21px system-ui;margin:0 0 8px}#fcs-v29cs-panel button{background:#1d4e3a;color:#fff;border:0;border-radius:7px;padding:9px 12px;margin:4px 4px 4px 0;cursor:pointer}#fcs-v29cs-panel button:disabled{opacity:.45}#fcs-v29cs-panel .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:8px 14px}#fcs-v29cs-panel label{display:flex;flex-direction:column;font-size:12px;gap:3px}#fcs-v29cs-panel label.ck{flex-direction:row;align-items:center}#fcs-v29cs-panel input,#fcs-v29cs-panel select{padding:6px;border:1px solid #9aa7b2;border-radius:5px;font:14px system-ui}#fcs-v29cs-panel table{border-collapse:collapse;font-size:12.5px;width:100%}#fcs-v29cs-panel th,#fcs-v29cs-panel td{border-bottom:1px solid #d8dde2;padding:4px 6px;text-align:right;white-space:nowrap}#fcs-v29cs-panel th:first-child,#fcs-v29cs-panel td:first-child{text-align:left}#fcs-v29cs-panel tr.pick{background:#e2f4ea;font-weight:700}#fcs-v29cs-panel .ok{color:#17663d}#fcs-v29cs-panel .bad{color:#a3122a;font-weight:700}#fcs-v29cs-panel .warn{background:#fff6dc;border-left:4px solid #d39b00;padding:8px 10px;font-size:13px}#v29cs-result{font-size:18px;font-weight:700;margin:10px 0}`;
 document.head.append(css);
 const btn=document.createElement('button');btn.id='fcs-v29cs-open';btn.type='button';btn.textContent='Conductor sizing';btn.setAttribute('aria-haspopup','dialog');document.body.append(btn);dockLauncher(btn);
 const ov=document.createElement('div');ov.id='fcs-v29cs-ov';ov.hidden=true;
 const OPT_LABEL={auto:'Pick next standard rating',given:'I have a rating',none:'Do not check'};
 const fieldHtml=([k,l,t,opts,d])=>t==='select'?`<label>${esc(l)}<select data-k="${k}">${opts.map(o=>`<option value="${esc(o)}">${esc(k==='ocpdMode'?OPT_LABEL[o]:(o||'— none —'))}</option>`).join('')}</select></label>`:t==='check'?`<label class="ck"><input type="checkbox" data-k="${k}"> ${esc(l)}</label>`:`<label>${esc(l)}<input type="number" step="any" data-k="${k}" value="${esc(d)}"></label>`;
 ov.innerHTML=`<section id="fcs-v29cs-panel" role="dialog" aria-modal="true" aria-labelledby="fcs-v29cs-title"><div style="display:flex;justify-content:space-between;align-items:center"><h2 id="fcs-v29cs-title">Conductor sizing — ampacity, voltage drop, short-circuit</h2><button type="button" data-cs="close">Close</button></div>
 <p class="warn">Checks every size from 14 AWG to 2000 kcmil and picks the smallest that passes all selected checks. Ampacity uses NEC Table 310.16 (30 °C base) with 310.15(B)(1)(1) ambient and 310.15(C)(1) bundling factors, limited by the termination rating. <strong>Table values are from this site's database and are marked "not re-verified"; confirm against your licensed NEC.</strong> Voltage drop uses typical 75 °C R and X (8 AWG–750 kcmil); your cable data sheet governs. Short-circuit check needs a clearing time from the real protective device — none is assumed. OCPD (NEC 240.4) and EGC (250.122) are checked; raceway fill is not.</p>
 <div class="grid">${FIELDS.map(fieldHtml).join('')}</div>
 <div><button type="button" data-cs="run">Size conductor</button><button type="button" data-cs="pdf" disabled>PDF</button><button type="button" data-cs="xlsx" disabled>Excel</button><button type="button" data-cs="json" disabled>JSON</button></div>
 <p role="status" id="v29cs-status" aria-live="polite"></p><div id="v29cs-result"></div><div id="v29cs-table" style="overflow:auto"></div>
 <p style="font-size:12px;color:#5b5446">${esc(CABLE_SIZING_V29.id)} v${esc(CABLE_SIZING_V29.version)}</p></section>`;
 document.body.append(ov);
 const $=s=>ov.querySelector(s),status=(m,bad)=>{const e=$('#v29cs-status');e.textContent=m;e.className=bad?'bad':''};
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'{}');for(const [k,v] of Object.entries(saved||{})){const el=$(`[data-k="${k}"]`);if(!el)continue;if(el.type==='checkbox')el.checked=!!v;else el.value=String(v)}}catch{}
 for(const [k,,t,,d] of FIELDS){const el=$(`[data-k="${k}"]`);if(t==='select'&&!el.value)el.value=d}
 let last=null,lastFocus=null;
 const open=()=>{lastFocus=document.activeElement;ov.hidden=false;$('[data-cs=run]').focus()};const close=()=>{ov.hidden=true;lastFocus?.focus?.()};
 btn.addEventListener('click',open);ov.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();close()}});ov.addEventListener('click',e=>{if(e.target===ov)close()});
 const collect=()=>{const raw={},x={};for(const [k,,t] of FIELDS){const el=$(`[data-k="${k}"]`);raw[k]=t==='check'?el.checked:el.value;
  if(t==='check')x[k]=el.checked;else if(t==='number')x[k]=el.value.trim()===''?undefined:Number(el.value);else x[k]=el.value}
  let tcc=null;if(x.tccCurve&&!Number.isFinite(x.clearingTimeS)){const [std,curve]=x.tccCurve.split(' ');if(!Number.isFinite(x.faultCurrentA))throw Error('Enter the fault current to use the relay curve.');const r=clearingTime({type:'relay',standard:std,curve,pickupA:x.tccPickupA,dial:x.tccDial,instPickupA:Number.isFinite(x.tccInstA)?x.tccInstA:undefined,breakerMode:'cycles',breakerCycles:Number(x.tccBreakerCycles),frequencyHz:Number(x.tccFrequency)},x.faultCurrentA);if(r.status!=='OK')throw Error('Relay: '+r.status+' — '+r.text);x.clearingTimeS=r.seconds;tcc=r}
  if(x.rxSize||Number.isFinite(x.rxR)||Number.isFinite(x.rxX)){if(!x.rxSize||!(x.rxR>0)||!(x.rxX>=0))throw Error('For your own cable R/X, choose the size and enter both R and X (Ω/1000 ft).');x.customRX={size:x.rxSize,rOhmPerKft:x.rxR,xOhmPerKft:x.rxX}}
  for(const k of ['rxSize','rxR','rxX'])delete x[k];
  for(const k of ['tccCurve','tccPickupA','tccDial','tccInstA','tccBreakerCycles','tccFrequency'])delete x[k];x.__tcc=tcc;
  if(x.ocpdMode!=='given')delete x.ocpdA;
  x.phases=Number(x.phases);if(x.maxVoltageDropPercent===undefined)x.maxVoltageDropPercent=null;if(!x.insulationClass)delete x.insulationClass;
  try{localStorage.setItem(KEY,JSON.stringify(raw))}catch{}return x};
 const render=r=>{
  $('#v29cs-result').innerHTML=r.recommendedSize?`<span class="ok">Recommended: ${r.recommendedSets>1?r.recommendedSets+' × ':''}${esc(r.recommendedSize)} ${esc(r.inputs.material)}</span> <span style="font-weight:400;font-size:13px">(${esc(r.governedBy)}; required ampacity ${n(r.inputs.requiredAmpacityA)} A; ambient factor ${r.factors.ambient.factor}, bundling factor ${r.factors.ccc.factor}${r.clearingTimeFromRelay?`; clearing time ${n(r.clearingTimeFromRelay.ms,0)} ms from ${esc(r.clearingTimeFromRelay.text)}`:''})</span>${r.ocpd?`<div style="font-size:13px;font-weight:400">OCPD ${r.ocpd.ratingA} A${r.ocpd.mode==='auto'?' (next standard rating, NEC 240.6(A))':''}${r.ocpd.belowLoad?' <span class="bad">below the load</span>':''}${r.egc?` · EGC ${esc(r.egc.increasedFor25122B?r.egc.increasedFor25122B.size:r.egc.size)} ${esc(r.inputs.material)} (NEC 250.122${r.egc.increasedFor25122B?'(B), increased with the conductors':''})${r.egc.parallelNote?' — '+esc(r.egc.parallelNote):''}`:''}</div>`:''}${r.skippedForMissingRX.length?`<div class="bad" style="font-size:13px">Smaller size(s) ${esc(r.skippedForMissingRX.join(', '))} pass ampacity but have no R/X data, so voltage drop could not be checked — check them with your cable data sheet.</div>`:''}`:`<span class="bad">No size in the table passes all checks — add parallel sets or change the inputs.</span>`;
  const hasVd=r.inputs.maxVoltageDropPercent!==null,hasSc=!!r.inputs.shortCircuit;
  $('#v29cs-table').innerHTML=`<table><thead><tr><th>Size</th><th>310.16 at ${r.inputs.insulationTempC} °C (A)</th><th>Termination ${r.inputs.terminationTempC} °C (A)</th><th>Allowable (A)</th><th>Ampacity</th>${hasVd?'<th>R / X (Ω/kft)</th><th>VD (%)</th><th>VD</th>':''}${hasSc?'<th>Withstand per conductor (kA)</th><th>Short-circuit</th>':''}${r.ocpd?'<th>OCPD rule</th><th>OCPD</th>':''}<th>Note</th></tr></thead><tbody>${r.rows.map(w=>w.status?`<tr><td>${esc(w.size)}</td><td colspan="${4+(hasVd?3:0)+(hasSc?2:0)+(r.ocpd?2:0)}" style="text-align:left">${esc(w.status)}</td><td></td></tr>`:`<tr class="${w.size===r.recommendedSize?'pick':''}"><td>${esc(w.size)}</td><td>${w.tableAmpacityA}</td><td>${w.terminationAmpacityA}</td><td>${n(w.allowableA)}</td><td>${yn(w.ampacityOk)}</td>${hasVd?`<td>${w.voltageDrop?n(w.voltageDrop.rOhmPerKft,4)+' / '+n(w.voltageDrop.xOhmPerKft,4):'—'}</td><td>${w.voltageDrop?n(w.voltageDrop.percent,2):'—'}</td><td>${yn(w.voltageDropOk)}</td>`:''}${hasSc?`<td>${n(w.shortCircuit.withstandA/1000,2)}</td><td>${yn(w.shortCircuitOk)}</td>`:''}${r.ocpd?`<td style="text-align:left;white-space:normal">${esc(w.ocpd.rule)}${w.ocpd.reasons.length?'; '+esc(w.ocpd.reasons.join('; ')):''}</td><td>${yn(w.ocpdOk)}</td>`:''}<td style="text-align:left">${esc(w.notes.join(' '))}</td></tr>`).join('')}</tbody></table><p style="font-size:12px">${esc(r.dataStatus)}</p><ul style="font-size:12px">${r.limitations.map(l=>`<li>${esc(l)}</li>`).join('')}</ul>`;
 };
 const report=()=>({method:CABLE_SIZING_V29.id,createdAt:new Date().toISOString(),inputs:last.inputs,outputs:JSON.parse(JSON.stringify(last))});
 ov.addEventListener('click',e=>{const act=e.target?.dataset?.cs;if(!act)return;
  try{
   if(act==='close'){close();return}
   if(act==='run'){const inx=collect(),tcc=inx.__tcc;delete inx.__tcc;last=sizeConductor(inx);if(tcc)last.clearingTimeFromRelay={ms:tcc.ms,text:tcc.text,source:tcc.curveSource};render(last);{const s=report();__fcsReportStudy('cable-sizing','Conductor sizing (ampacity, voltage drop, short circuit)',()=>s);}['pdf','xlsx','json'].forEach(a=>$(`[data-cs=${a}]`).disabled=false);status(last.status==='SIZE FOUND'?'Sizing complete.':'No passing size.',last.status!=='SIZE FOUND');return}
   if(!last)return;const stamp=new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
   if(act==='pdf'||act==='xlsx'){download(advancedStudyReportBlob(report(),act),`conductor-sizing-${stamp}.${act}`);status(act.toUpperCase()+' downloaded.');return}
   if(act==='json'){download(new Blob([JSON.stringify(report(),null,2)],{type:'application/json'}),`conductor-sizing-${stamp}.json`);status('JSON downloaded.')}
  }catch(err){status(err.message||String(err),true);if(act==='run'){last=null;$('#v29cs-result').textContent='';$('#v29cs-table').textContent='';['pdf','xlsx','json'].forEach(a=>$(`[data-cs=${a}]`).disabled=true)}}
 });
}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount()}
export {CABLE_SIZING_DATA};
