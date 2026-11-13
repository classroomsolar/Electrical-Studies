/** V29c incremental UI: IEEE 519 PCC harmonic check and power-factor correction with resonance check. Reads the Studio draft read-only. */
import {ieee519Check,pfCorrection,POWER_QUALITY_V29} from './power-quality-v29.mjs';
import {advancedStudyReportBlob} from './advanced-study-report.mjs?v=20261108-v32';
const __fcsReportStudy=(key,label,get)=>{try{(globalThis.__fcsReportStudies??=new Map()).set(key,{label,projectId:globalThis.__fcsStudio?.projectId?.()??null,at:Date.now(),get});globalThis.dispatchEvent?.(new Event('fcs-report-studies'))}catch{}};
const KEY='fault-studio-power-quality-v29',DRAFT='fault-network-draft-v2';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=(x,d=2)=>Number.isFinite(x)?x.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const ok=v=>v?'<span class="ok">OK</span>':'<span class="bad">EXCEEDS</span>';
function dockLauncher(btn){const tryDock=()=>{const h=document.getElementById('v26-launcher-holder');if(h&&btn.parentElement!==h){h.append(btn);btn.style.position='static';btn.style.margin='4px';return true}return !!h};if(tryDock())return;let tries=0;const t=setInterval(()=>{if(tryDock()||++tries>40)clearInterval(t)},250)}
function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)}
async function engine(){const req=globalThis.__fcsBundleRequire;if(typeof req==='function')return req('network-engine.mjs').calculateProject;return (await import('./network-engine.mjs?v=20261108-v31')).calculateProject}
async function studioBuses(){const raw=localStorage.getItem(DRAFT);if(!raw)return [];let p;try{p=JSON.parse(raw)}catch{return []}if(p?.format!=='fault-current-network'||p.settings?.faultType==='dc')return [];
 const q=JSON.parse(JSON.stringify(p));q.settings={...q.settings,faultType:'3phase',faultR:0,faultX:0};const out=(await engine())(q);
 return (out.results||[]).filter(r=>Number.isFinite(r.totalA)&&r.totalA>0).map(r=>{const b=p.buses.find(x=>x.id===r.busId);return {id:r.busId,name:b?.name||r.busId,kV:(b?.voltage||0)/1000,iscA:r.totalA,mva:Math.sqrt(3)*(b?.voltage||0)*r.totalA/1e6}})}
const H=[2,3,4,5,6,7,9,11,13,15,17,19,23,25,29,31,35,37];
function mount(){
 if(document.getElementById('fcs-v29pq-open'))return;
 const css=document.createElement('style');css.textContent=`#fcs-v29pq-open{background:#3b2f6b;color:#fff;border:1px solid #b9aef0;border-radius:28px;padding:11px 16px;font:600 13px system-ui;cursor:pointer;position:fixed;left:16px;bottom:218px;z-index:3800}#fcs-v29pq-ov[hidden]{display:none!important}#fcs-v29pq-ov{position:fixed;inset:0;z-index:4800;display:flex;align-items:center;justify-content:center;background:#061928dc;padding:8px;font:14px system-ui}#fcs-v29pq-panel{width:min(1100px,100%);max-height:95dvh;overflow:auto;box-sizing:border-box;background:#fbfaf9;color:#14283a;border-radius:16px;padding:clamp(12px,2.5vw,24px)}#fcs-v29pq-panel h2{font:700 21px system-ui;margin:0 0 8px}#fcs-v29pq-panel h3{font:700 16px system-ui;margin:14px 0 6px}#fcs-v29pq-panel button{background:#3b2f6b;color:#fff;border:0;border-radius:7px;padding:9px 12px;margin:4px 4px 4px 0;cursor:pointer}#fcs-v29pq-panel button:disabled{opacity:.45}#fcs-v29pq-panel .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px 14px}#fcs-v29pq-panel label{display:flex;flex-direction:column;font-size:12px;gap:3px}#fcs-v29pq-panel label.ck{flex-direction:row;align-items:center}#fcs-v29pq-panel input,#fcs-v29pq-panel select{padding:6px;border:1px solid #9aa7b2;border-radius:5px;font:14px system-ui}#fcs-v29pq-panel .hgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:6px}#fcs-v29pq-panel .hgrid input{width:100%;box-sizing:border-box}#fcs-v29pq-panel table{border-collapse:collapse;font-size:12.5px}#fcs-v29pq-panel th,#fcs-v29pq-panel td{border-bottom:1px solid #d8dde2;padding:4px 8px;text-align:right}#fcs-v29pq-panel .ok{color:#17663d;font-weight:700}#fcs-v29pq-panel .bad{color:#a3122a;font-weight:700}#fcs-v29pq-panel .warn{background:#efeafc;border-left:4px solid #6b5bc2;padding:8px 10px;font-size:13px}#fcs-v29pq-panel .tabs button{background:#e6e1f7;color:#3b2f6b}#fcs-v29pq-panel .tabs button[aria-selected=true]{background:#3b2f6b;color:#fff}`;document.head.append(css);
 const btn=document.createElement('button');btn.id='fcs-v29pq-open';btn.type='button';btn.textContent='Harmonics & PF correction';btn.setAttribute('aria-haspopup','dialog');document.body.append(btn);dockLauncher(btn);
 const ov=document.createElement('div');ov.id='fcs-v29pq-ov';ov.hidden=true;
 const num=(k,l,v='')=>`<label>${esc(l)}<input type="number" step="any" data-k="${k}" value="${esc(v)}"></label>`;
 ov.innerHTML=`<section id="fcs-v29pq-panel" role="dialog" aria-modal="true" aria-labelledby="fcs-v29pq-title"><div style="display:flex;justify-content:space-between;align-items:center"><h2 id="fcs-v29pq-title">Harmonics at the PCC (IEEE 519) and power-factor correction</h2><button type="button" data-pq="close">Close</button></div>
 <div class="tabs" role="tablist"><button type="button" role="tab" aria-selected="true" data-tab="h">IEEE 519 check</button><button type="button" role="tab" aria-selected="false" data-tab="pf">PF correction &amp; resonance</button></div>
 <label style="max-width:520px">Take voltage and short-circuit current from a Studio bus (optional)<select data-k="bus"><option value="">— type values below —</option></select></label>
 <div data-pane="h"><p class="warn">Limits from IEEE Std 519-2022 (voltage Table 1, current Tables 2 and 3; 2014 even-harmonic rule selectable). Enter harmonic currents either in amperes or in % of IL, from a measurement or a harmonic study. Systems above 161 kV are not covered.</p>
  <div class="grid">${num('pccVoltageKV','PCC voltage, kV (line-line)','0.48')}${num('iscA','Maximum short-circuit current at PCC, A')}${num('ilA','Maximum demand load current IL, A')}
  <label>Edition<select data-k="edition"><option value="2022">IEEE 519-2022</option><option value="2014">IEEE 519-2014</option></select></label>
  <label>Harmonic current entered as<select data-k="unit"><option value="amps">Amperes</option><option value="percent">% of IL</option></select></label>
  <label class="ck"><input type="checkbox" data-k="includesGeneration"> PCC includes generation / inverters</label></div>
  <h3>Harmonic currents</h3><div class="hgrid">${H.map(h=>`<label>h = ${h}<input type="number" step="any" min="0" data-ih="${h}"></label>`).join('')}</div>
  <h3>Harmonic voltages, % of fundamental (optional)</h3><div class="hgrid">${H.map(h=>`<label>h = ${h}<input type="number" step="any" min="0" data-vh="${h}"></label>`).join('')}</div>
  <div><button type="button" data-pq="run519">Check limits</button></div></div>
 <div data-pane="pf" hidden><p class="warn">Required kvar Qc = P·(tan φ1 − tan φ2). The bank and the source form a parallel resonance at about h = √(Ssc/Qc). A resonance near a harmonic that the loads produce can amplify it — check every switched step.</p>
  <div class="grid">${num('pKW','Real power, kW')}${num('pfExisting','Existing power factor','0.8')}${num('pfTarget','Target power factor','0.95')}${num('kvarInstalled','Bank size, kvar (blank = required)')}${num('steps','Number of equal steps','1')}${num('pfVoltageKV','Bus voltage, kV','0.48')}${num('scMVA','Short-circuit MVA at the bank bus')}
  <label>Frequency<select data-k="frequencyHz"><option>60</option><option>50</option></select></label>
  <label>Harmonics present (comma list)<input data-k="harmonics" value="5,7,11,13"></label>${num('marginPercent','Resonance margin, ±%','10')}</div>
  <div><button type="button" data-pq="runpf">Calculate</button></div></div>
 <div><button type="button" data-pq="pdf" disabled>PDF</button><button type="button" data-pq="xlsx" disabled>Excel</button><button type="button" data-pq="json" disabled>JSON</button></div>
 <p role="status" id="v29pq-status" aria-live="polite"></p><div id="v29pq-out" style="overflow:auto"></div>
 <p style="font-size:12px;color:#5b5446">${esc(POWER_QUALITY_V29.id)} v${esc(POWER_QUALITY_V29.version)}</p></section>`;
 document.body.append(ov);
 const $=s=>ov.querySelector(s),$$=s=>[...ov.querySelectorAll(s)],status=(m,b)=>{const e=$('#v29pq-status');e.textContent=m;e.className=b?'bad':''};
 let last=null,buses=[],lastFocus=null;
 try{const sv=JSON.parse(localStorage.getItem(KEY)||'{}');for(const [k,v] of Object.entries(sv||{})){const el=ov.querySelector(`[data-k="${k}"]`);if(el&&k!=='bus'){if(el.type==='checkbox')el.checked=!!v;else el.value=v}}}catch{}
 const save=()=>{const o={};$$('[data-k]').forEach(e=>{o[e.dataset.k]=e.type==='checkbox'?e.checked:e.value});try{localStorage.setItem(KEY,JSON.stringify(o))}catch{}};
 const v=k=>{const e=$(`[data-k="${k}"]`);return e.value.trim()===''?undefined:Number(e.value)};
 const open=async()=>{lastFocus=document.activeElement;ov.hidden=false;$('[data-pq=close]').focus();try{buses=await studioBuses();$('[data-k=bus]').innerHTML='<option value="">— type values below —</option>'+buses.map(b=>`<option value="${esc(b.id)}">${esc(b.name)} · ${n(b.kV,3)} kV · ${n(b.iscA/1000,2)} kA</option>`).join('')}catch{}};
 const close=()=>{ov.hidden=true;lastFocus?.focus?.()};
 btn.addEventListener('click',open);ov.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();close()}});ov.addEventListener('click',e=>{if(e.target===ov)close()});
 ov.addEventListener('change',e=>{if(e.target.dataset.k==='bus'){const b=buses.find(x=>x.id===e.target.value);if(b){$('[data-k=pccVoltageKV]').value=+b.kV.toFixed(4);$('[data-k=iscA]').value=Math.round(b.iscA);$('[data-k=pfVoltageKV]').value=+b.kV.toFixed(4);$('[data-k=scMVA]').value=+b.mva.toFixed(3);status('Values taken from '+b.name+' (3-phase bolted fault, current scenario).')}}});
 const render519=r=>`<h3>Result: <span class="${r.status==='WITHIN LIMITS'?'ok':'bad'}">${esc(r.status)}</span></h3><p>${esc(r.edition)} · ${esc(r.currentTable)} · Isc/IL = ${n(r.iscOverIl,1)} · TDD ${n(r.tddPercent)} % (limit ${n(r.tddLimit,1)} %) ${ok(r.tddOk)}</p>
  <table><thead><tr><th>h</th><th>Current, A</th><th>% of IL</th><th>Limit %</th><th></th></tr></thead><tbody>${r.currentRows.map(x=>`<tr><td>${x.h}</td><td>${n(x.amps)}</td><td>${n(x.percentOfIL)}</td><td>${n(x.limitPercent)}</td><td>${ok(x.ok)}</td></tr>`).join('')}</tbody></table>
  ${r.voltageRows.length?`<p>Voltage (${esc(r.voltageBand)}): THD ${n(r.thdPercent)} % (limit ${n(r.voltageThdLimit,1)} %), individual limit ${n(r.voltageIndividualLimit,1)} % ${ok(r.voltageOk)}</p><table><thead><tr><th>h</th><th>%</th><th>Limit %</th><th></th></tr></thead><tbody>${r.voltageRows.map(x=>`<tr><td>${x.h}</td><td>${n(x.percent)}</td><td>${n(x.limitPercent,1)}</td><td>${ok(x.ok)}</td></tr>`).join('')}</tbody></table>`:''}
  ${r.notes.map(t=>`<p class="warn">${esc(t)}</p>`).join('')}<ul style="font-size:12px">${r.limitations.map(l=>`<li>${esc(l)}</li>`).join('')}</ul>`;
 const renderPf=r=>`<h3>Result: <span class="${/RISK/.test(r.status)?'bad':'ok'}">${esc(r.status)}</span></h3><p>Required ${n(r.requiredKvar,1)} kvar · bank ${n(r.bankKvar,1)} kvar · power factor with bank ${n(r.pfWithBank,3)}${r.leading?' leading':''}</p>
  ${r.resonance?`<p>Parallel resonance order h ≈ ${n(r.resonance.order)} · voltage rise ≈ ${n(r.voltageRisePercent)} %</p>`:''}
  ${r.steps?`<table><thead><tr><th>Step kvar</th><th>Resonance order</th><th>Near harmonic</th></tr></thead><tbody>${r.steps.map(s=>`<tr><td>${n(s.kvar,1)}</td><td>${n(s.order)}</td><td>${s.near.length?`<span class="bad">${s.near.join(', ')}</span>`:'<span class="ok">none</span>'}</td></tr>`).join('')}</tbody></table>`:''}
  ${(r.notes||[]).map(t=>`<p class="warn">${esc(t)}</p>`).join('')}<ul style="font-size:12px">${(r.limitations||[]).map(l=>`<li>${esc(l)}</li>`).join('')}</ul>`;
 ov.addEventListener('click',e=>{const tab=e.target.dataset?.tab;if(tab){$$('[data-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===tab)));$$('[data-pane]').forEach(p=>p.hidden=p.dataset.pane!==tab);return}
  const act=e.target.dataset?.pq;if(!act)return;
  try{
   if(act==='close'){close();return}
   if(act==='run519'){const cur={},vol={};$$('[data-ih]').forEach(i=>{if(i.value.trim()!=='')cur[i.dataset.ih]=Number(i.value)});$$('[data-vh]').forEach(i=>{if(i.value.trim()!=='')vol[i.dataset.vh]=Number(i.value)});
    if(!Object.keys(cur).length)throw Error('Enter at least one harmonic current.');
    const x={pccVoltageKV:v('pccVoltageKV'),iscA:v('iscA'),ilA:v('ilA'),edition:$('[data-k=edition]').value,includesGeneration:$('[data-k=includesGeneration]').checked,voltagesPercent:vol};
    if($('[data-k=unit]').value==='percent')x.currentPercent=cur;else x.currents=cur;
    last={kind:'ieee519',inputs:x,result:ieee519Check(x)};$('#v29pq-out').innerHTML=render519(last.result)}
   if(act==='runpf'){const x={pKW:v('pKW'),pfExisting:v('pfExisting'),pfTarget:v('pfTarget'),kvarInstalled:v('kvarInstalled'),steps:v('steps'),voltageKV:v('pfVoltageKV'),scMVA:v('scMVA'),frequencyHz:Number($('[data-k=frequencyHz]').value),marginPercent:v('marginPercent'),harmonics:$('[data-k=harmonics]').value.split(/[,\s]+/).filter(Boolean).map(Number)};
    last={kind:'pf',inputs:x,result:pfCorrection(x)};$('#v29pq-out').innerHTML=renderPf(last.result)}
   if(act==='run519'||act==='runpf'){{const s={method:POWER_QUALITY_V29.id+'-'+last.kind,createdAt:new Date().toISOString(),inputs:last.inputs,outputs:JSON.parse(JSON.stringify(last.result))};__fcsReportStudy('pq-'+last.kind,last.kind==='ieee519'?'IEEE 519 harmonic limits check':'Power-factor correction and resonance',()=>s);}save();['pdf','xlsx','json'].forEach(a=>$(`[data-pq=${a}]`).disabled=false);status('Calculated.');return}
   if(!last)return;const stamp=new Date().toISOString().slice(0,10),rep={method:POWER_QUALITY_V29.id+'-'+last.kind,createdAt:new Date().toISOString(),inputs:last.inputs,outputs:JSON.parse(JSON.stringify(last.result))};
   if(act==='json'){download(new Blob([JSON.stringify(rep,null,2)],{type:'application/json'}),`power-quality-${last.kind}-${stamp}.json`);status('JSON downloaded.');return}
   download(advancedStudyReportBlob(rep,act),`power-quality-${last.kind}-${stamp}.${act}`);status(act.toUpperCase()+' downloaded.');
  }catch(err){status(err.message||String(err),true);if(act==='run519'||act==='runpf'){last=null;$('#v29pq-out').textContent='';['pdf','xlsx','json'].forEach(a=>$(`[data-pq=${a}]`).disabled=true)}}
 });
}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount()}
