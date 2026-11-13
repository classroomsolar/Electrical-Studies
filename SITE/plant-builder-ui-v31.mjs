// V31 Build plant + Equipment table dialogs. All changes go through the Studio hook (validation, undo,
// draft save, project-folder autosave and recalculation).
import {BUILDER_FIELDS,BUILDER_OPTIONS,validateSpec,estimateCounts,buildPlant,equipmentCsv,applyEquipmentCsv,DC_FIELDS,DC_OPTIONS,validateDcSpec,estimateDcCounts,buildDcArray} from './plant-builder.mjs?v=20261108-v32';
import {emptyProject} from './network-model.mjs?v=20261022-pv-final';
// The diagram layout comes from the bundled Studio (no second copy of the engine modules is loaded).
const arrangeNetwork=p=>{const req=globalThis.__fcsBundleRequire;if(!req)throw Error('The Studio is still loading. Try again in a moment.');return req('network-diagram.mjs').arrangeNetwork(p)};
const KEY='fcs-plant-builder-v31';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const studio=()=>{const s=globalThis.__fcsStudio;if(!s)throw Error('The Studio is still loading. Try again in a moment.');return s};
function saved(key=KEY){try{return JSON.parse(localStorage.getItem(key)||'{}')||{}}catch{return {}}}
function dialog(id,title,body){
 document.getElementById(id)?.remove();
 const d=document.createElement('dialog');d.id=id;d.className='v31-dialog';d.setAttribute('aria-labelledby',id+'-title');
 d.innerHTML=`<form method="dialog" class="v31-dialog-form"><header><h2 id="${id}-title">${esc(title)}</h2><button type="button" class="v31-close" data-v31-close aria-label="Close">×</button></header><div class="v31-dialog-body">${body}</div></form>`;
 document.body.appendChild(d);d.addEventListener('click',e=>{if(e.target.closest('[data-v31-close]'))d.close()});d.addEventListener('close',()=>d.remove());d.showModal();return d;
}
function readSpec(d,fields=BUILDER_FIELDS,options=BUILDER_OPTIONS){
 const spec={};for(const [k,,unit] of fields){const el=d.querySelector(`[name="${k}"]`);if(!el)continue;const raw=el.value.trim();spec[k]=raw===''?null:Number(raw.replace(/,/g,''));if(unit==='count'&&spec[k]!==null&&!Number.isFinite(spec[k]))spec[k]=NaN}
 for(const [k] of options){const el=d.querySelector(`[name="${k}"]`);if(el)spec[k]=el.checked}return spec;
}
const fieldHtml=(list,last,prefix)=>list.map(([k,label,unit,req])=>`<div class="field" data-field="${k}"><label for="${prefix}-${k}">${esc(label)}${unit&&unit!=='count'?` <span class="v31-unit">${esc(unit)}</span>`:''}${req?'':' <span class="v31-optional">optional</span>'}</label><input id="${prefix}-${k}" name="${k}" inputmode="decimal" autocomplete="off" value="${esc(last[k]??'')}"></div>`).join('');
const optHtml=(list,last,on)=>list.map(([k,label])=>`<label class="v31-check"><input type="checkbox" name="${k}" ${last[k]??on(k)?'checked':''}> ${esc(label)}</label>`).join('');
function openBuilder(){
 const last=saved(),lastDc=saved(KEY+'-dc');let snap=null;try{snap=studio().snapshot()}catch{}
 const collectors=(snap?.settings?.faultType==='dc'?[]:snap?.buses||[]).filter(b=>b.voltage>=1000);
 const d=dialog('v31-plant-builder','Build a plant one-line',`<p class="v31-lead">Enter your plant data. The builder repeats your block for every position and connects everything. Every impedance, source and fault value comes from your entries; protective-device ratings start blank for you to fill in (single item or Equipment table).</p>
  <fieldset class="v31-options"><legend>What to build</legend><label class="v31-check"><input type="radio" name="kind" value="ac" checked> AC collector system (POI, feeders, block transformers, inverters)</label><label class="v31-check"><input type="radio" name="kind" value="dc"> DC array (inverter DC input, combiner boxes, strings) — a separate DC study</label></fieldset>
  <div data-kind="ac"><div class="v31-grid">${fieldHtml(BUILDER_FIELDS,last,'pb')}</div><fieldset class="v31-options"><legend>Protective devices and sources</legend>${optHtml(BUILDER_OPTIONS,last,k=>k!=='bess')}</fieldset>
  <fieldset class="v31-options"><legend>Where to put it</legend><label class="v31-check"><input type="radio" name="mode" value="new" checked> Start a new project with this plant</label><label class="v31-check"><input type="radio" name="mode" value="add"> Add as a separate plant to the open project, below its one-line</label>${collectors.length?`<label class="v31-check"><input type="radio" name="mode" value="attach"> Add these feeders and blocks to an existing bus (another block type on the same collector)</label><div class="field v31-attach"><label for="pb-attach">Collector bus</label><select id="pb-attach" name="attach">${collectors.map(b=>`<option value="${esc(b.id)}" ${b.name==='MV collector'?'selected':''}>${esc(b.name)} · ${esc(b.voltage>=1000?(b.voltage/1000)+' kV':b.voltage+' V')}</option>`).join('')}</select></div>`:''}</fieldset></div>
  <div data-kind="dc" hidden><div class="v31-grid">${fieldHtml(DC_FIELDS,lastDc,'pd')}</div><fieldset class="v31-options"><legend>Protective devices</legend>${optHtml(DC_OPTIONS,lastDc,()=>true)}</fieldset><p class="micro">A DC array opens as a new DC project (DC fault current is a separate study type). Each string is a voltage source with your documented full-loop resistance.</p></div>
  <p class="v31-summary" role="status" id="pb-summary"></p><ul class="v31-errors" id="pb-errors"></ul>
  <footer><button type="button" data-v31-close>Cancel</button><button type="button" class="primary" id="pb-build">Build one-line</button></footer>`);
 const kind=()=>d.querySelector('[name="kind"]:checked').value,mode=()=>d.querySelector('[name="mode"]:checked')?.value||'new';
 const update=()=>{const k=kind();d.querySelectorAll('[data-kind]').forEach(x=>x.hidden=x.dataset.kind!==k);
  if(k==='dc'){const spec=readSpec(d.querySelector('[data-kind="dc"]'),DC_FIELDS,DC_OPTIONS),errors=validateDcSpec(spec),c=estimateDcCounts(spec);d.querySelector('#pb-summary').textContent=errors.length?'':`${c.strings} strings · ${c.combiners} combiner boxes · ${c.buses} buses · ${c.devices} protective devices`;return {spec,errors,kind:k}}
  const attach=mode()==='attach';d.querySelectorAll('[data-field="utilityFaultKA"],[data-field="utilityXR"]').forEach(x=>x.hidden=attach);
  const spec=readSpec(d.querySelector('[data-kind="ac"]')),errors=validateSpec(spec,{attach}),c=estimateCounts(spec);d.querySelector('#pb-summary').textContent=errors.length?'':`${c.blocks} blocks · ${c.inverters} ${spec.bess?'battery inverters':'inverters'} · ${attach?c.buses-(spec.mainBreaker?2:1)-1:c.buses} buses · ${attach?c.devices-(spec.mainBreaker?1:0):c.devices} protective devices · ${attach?c.sources-1:c.sources} sources`;return {spec,errors,kind:k}};
 d.addEventListener('input',update);d.addEventListener('change',update);update();
 d.querySelector('#pb-build').addEventListener('click',()=>{
  const {spec,errors,kind:k}=update(),list=d.querySelector('#pb-errors');list.innerHTML=errors.map(e=>`<li>${esc(e)}</li>`).join('');if(errors.length){list.querySelector('li')&&d.querySelector('.v31-dialog-body').scrollTo({top:list.offsetTop,behavior:'smooth'});return}
  try{localStorage.setItem(k==='dc'?KEY+'-dc':KEY,JSON.stringify(spec))}catch{}
  try{const s=studio();
   if(k==='dc'){const c=estimateDcCounts(spec),p=emptyProject();p.name='DC array · '+c.strings+' strings';p.settings.faultType='dc';p.settings.faultR=0;p.settings.faultX=0;const parts=buildDcArray(spec);Object.assign(p,{buses:parts.buses,branches:parts.branches,sources:parts.sources,devices:parts.devices,selectedBus:parts.buses[0].id});const pos=arrangeNetwork(p);for(const b of p.buses)b.position=pos.get(b.id)||b.position;s.replace(p,'DC array built: '+c.buses+' buses. Fill in fuse and disconnect ratings, then review the results.');d.close();return}
   const m=mode(),c=estimateCounts(spec);
   if(m==='new'){const p=emptyProject();p.name=(spec.bess?'BESS':'PV')+' plant · '+c.inverters+' inverters';const parts=buildPlant(spec);Object.assign(p,{buses:parts.buses,branches:parts.branches,sources:parts.sources,devices:parts.devices,selectedBus:parts.buses[0].id});s.replace(p,'Plant one-line built: '+c.buses+' buses. Fill in protective-device ratings, then review the results.')}
   else if(m==='attach'){const busId=d.querySelector('#pb-attach').value;s.apply(p=>{const bus=p.buses.find(b=>b.id===busId);if(!bus)throw Error('Choose the collector bus');const groups=1+p.sources.filter(x=>['pv','bess'].includes(x.kind)).length,x=Math.max(0,...p.buses.map(b=>(b.position?.x||0)+800)),parts=buildPlant(spec,{prefix:'G'+groups,attachTo:{bus,x,y:bus.position?.y||0}});p.buses.push(...parts.buses);p.branches.push(...parts.branches);p.sources.push(...parts.sources);p.devices.push(...parts.devices)},'Feeders and blocks added to the chosen collector bus.')}
   else s.apply(p=>{const parts=buildPlant(spec,{prefix:'P'+(1+p.sources.filter(x=>x.kind==='utility').length)}),dy=Math.max(0,...p.buses.map(b=>b.position?.y||0))+900;for(const b of parts.buses)b.position.y+=dy;p.buses.push(...parts.buses);p.branches.push(...parts.branches);p.sources.push(...parts.sources);p.devices.push(...parts.devices)},'Plant added to the open project: '+c.buses+' buses.');
   d.close();
  }catch(e){list.innerHTML=`<li>${esc(e.message)}</li>`}
 });
}
function download(name,text){const u=URL.createObjectURL(new Blob(['﻿'+text],{type:'text/csv'}));const a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000)}
function openTable(){
 let p;try{p=studio().snapshot()}catch(e){alert(e.message);return}
 const n=p.buses.length+p.branches.length+p.sources.length+p.devices.length;
 const d=dialog('v31-equipment-table','Equipment table',`<p class="v31-lead">Download every bus, connection, source and protective device of <strong>${esc(p.name)}</strong> (${n} rows) as a CSV table. Edit values in a spreadsheet, then upload the file here to update the project in one step.</p>
  <ul class="v31-notes"><li>Rows are matched by <strong>id</strong>. Do not change ids. Blank cells leave the stored value unchanged.</li><li><strong>Add equipment:</strong> write <em>add</em> in the action column, leave id blank, and fill type (bus, cable, transformer, link, source:utility / pv / bess / generator / motor / other, device:breaker / fuse / recloser / switchgear / disconnect / panel), name and its values. Connect it with bus names in from_bus / to_bus (connections) or bus (sources); a new device without to_bus gets its own load-side bus.</li><li><strong>Delete equipment:</strong> write <em>delete</em> in the action column of its row. Items connected to a deleted bus stay in the project as disconnected, as in the editor.</li><li>Units are in the column headings (m, Ω/km, kVA, A, V). The Studio converts them on upload. Nothing is filled in for you: blank ratings stay blank and are reported as input required.</li></ul>
  <div class="v31-actions"><button type="button" class="primary" id="et-download">Download table (CSV)</button><label class="v31-file"><input type="file" id="et-file" accept=".csv,text/csv"><span>Upload edited table…</span></label></div>
  <p class="v31-summary" role="status" id="et-status"></p><ul class="v31-errors" id="et-errors"></ul><footer><button type="button" data-v31-close>Close</button></footer>`);
 d.querySelector('#et-download').addEventListener('click',()=>{const name=(p.name||'project').replace(/[^a-z0-9_-]+/gi,'-').slice(0,80)+'-equipment.csv';download(name,equipmentCsv(studio().snapshot()))});
 d.querySelector('#et-file').addEventListener('change',async e=>{
  const file=e.target.files[0];if(!file)return;const status=d.querySelector('#et-status'),list=d.querySelector('#et-errors');list.innerHTML='';
  try{if(file.size>20e6)throw Error('The table exceeds 20 MB');const text=await file.text();let result;
   studio().apply(p=>{result=applyEquipmentCsv(p,text)},'');
   status.textContent=`${result.matched} rows matched · ${result.changes} values changed · ${result.added||0} added · ${result.deleted||0} deleted${result.errors.length?` · ${result.errors.length} rows or cells skipped`:''}.`;
   list.innerHTML=result.errors.slice(0,50).map(x=>`<li>${esc(x)}</li>`).join('')+(result.errors.length>50?`<li>…and ${result.errors.length-50} more</li>`:'');
  }catch(err){status.textContent='';list.innerHTML=`<li>${esc(err.message)}</li>`}e.target.value='';
 });
}
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-plant-builder],[data-equipment-table]');if(!b)return;e.preventDefault();e.stopPropagation();if(b.hasAttribute('data-plant-builder'))openBuilder();else openTable()},true);
