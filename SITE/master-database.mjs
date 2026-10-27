import {mapRecord,recordName,recordId} from './database-map.mjs?v=20261022-pv-final';
import {catalogCategories,recordCompatibility} from './database-selection.mjs?v=20261022-pv-final';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const known=value=>value!==null&&value!==undefined&&value!=='';
const numeric=value=>known(value)&&Number.isFinite(Number(value))?Number(value):null;
export const workbookGroups=['PV DC nameplate reference','Calculation inputs','Fault-study references','Other workbook references'];
export function validateWorkbookMeta(meta){
 if(!meta||!Number.isInteger(meta.count)||meta.count<0||meta.count>250000||!/^database\/master-[a-z0-9_-]+\.json$/.test(meta.file)||!Array.isArray(meta.columns)||meta.columns.some(c=>typeof c!=='string'))throw Error('Unexpected master workbook declaration.');
 return meta;
}
export function decodeWorkbookSheet(data,meta){
 validateWorkbookMeta(meta);
 if(data?.schema!==1||!Array.isArray(data.columns)||data.columns[0]!=='_row'||new Set(data.columns).size!==data.columns.length||data.columns.some(c=>typeof c!=='string'||['__proto__','prototype','constructor'].includes(c))||!Array.isArray(data.records)||data.records.length!==meta.count||JSON.stringify(data.columns.slice(1))!==JSON.stringify(meta.columns))throw Error('Incomplete or unexpected master workbook contents.');
 const ids=new Set(),records=data.records.map(values=>{
  if(!Array.isArray(values)||values.length!==data.columns.length||!Number.isInteger(values[0])||values[0]<2||ids.has(values[0]))throw Error('Invalid workbook row identity.');
  ids.add(values[0]);return Object.fromEntries(data.columns.flatMap((c,i)=>values[i]===null?[]:[[c,values[i]]]));
 });
 return {sheet:data.sheet,workbook:data.workbook,records,fullWorkbook:true};
}
export function recordReadiness(sheet,row){
 const v=mapRecord(sheet,row).values,missing=[],need=(test,label)=>{if(!test)missing.push(label)};
 if(!Object.keys(v).length)return {label:'Reference data',missing:[],direct:false};
 if(sheet==='PV_MODULES')return {label:'PV DC nameplate reference',missing:[],direct:true};
 if(/^DC$/i.test(String(row['AC DC'])))return {label:'DC-only reference',missing:['AC equipment rating'],direct:false};
 if(row.Phases!=null&&numeric(row.Phases)!==3)return {label:'Phase model not supported',missing:['3-phase equipment'],direct:false};
 if(['CABLES','CABLE_IMPEDANCE_DEFAULTS'].includes(sheet)){need(v.rPerM>=0&&v.rPerM!==null,'R1');need(v.xPerM>=0&&v.xPerM!==null,'X1');}
 else if(sheet==='TRANSFORMERS'){for(const key of ['v1','v2','power','zPercent'])need(v[key]>0,{v1:'primary voltage',v2:'secondary voltage',power:'kVA',zPercent:'impedance %'}[key]);}
 else if(sheet==='GENERATORS'){for(const key of ['voltage','power','xdpp'])need(v[key]>0,{voltage:'voltage',power:'kVA',xdpp:'Xd″'}[key]);}
 else if(sheet==='IBR'){need(v.voltage>0,'AC terminal voltage');need(v.faultA>0||v.power>0&&v.multiplier>0,'manufacturer fault current');}
 else if(sheet==='MOTORS_NAMEPLATE'){need(v.voltage>0,'voltage');missing.push('fault-current/impedance selection');}
 else {need(v.ratedVoltage>0,'AC voltage rating');need(v.interruptA>0||v.sccrA>0,'documented fault rating');}
 return {label:missing.length?'Needs '+missing.join(', '):'Fault inputs available',missing,direct:true};
}
export const motorStages={initial:['Xsc 0 5 Cycle (%)','Initial · 0.5 cycle'],early:['Xsc 1 5 To 4 Cycle (%)','Early · 1.5–4 cycles'],steady:['X Steady State (%)','Steady-state record']};
export function motorFaultEquivalent(row,stage){
 const spec=motorStages[stage];if(!spec)throw Error('Choose a motor fault-reactance stage.');
 const v=mapRecord('MOTORS_NAMEPLATE',row).values,xPercent=numeric(row[spec[0]]);
 if(numeric(row.Phases)!==3||!(v.voltage>0&&v.power>0&&v.xr>0)||!(xPercent>0&&xPercent<1000))throw Error('This motor record has no usable 3-phase kVA, stage reactance and X/R. Enter documented motor fault data. Starting current and 9999 placeholders are not used.');
 const x=xPercent/100*v.voltage**2/v.power,r=x/v.xr;
 if(!Number.isFinite(x)||!Number.isFinite(r))throw Error('Motor impedance is outside the supported range.');
 return {values:{...v,method:'impedance',model:'voltage',r,x,faultA:null},stage:spec[1],basis:`${spec[1]}: ${xPercent}% reactance on ${v.power/1000} kVA / ${v.voltage} V, R = X ÷ X/R. This fixed equivalent does not model motor decay or protection disconnection.`};
}
export function sourceFieldsMarkup(row,{heading='Original workbook fields',sheet='',rowNumber=row?._row}={}){
 if(!row)return '';
 return `<section class="workbook-fields"><h3>${esc(heading)}</h3><p>${esc(sheet)} · workbook row ${esc(rowNumber)}</p><dl>${Object.entries(row).filter(([k,v])=>k!=='_row'&&known(v)).map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${typeof v==='string'&&/^https:\/\/[^\s]+$/.test(v)?`<a href="${esc(v)}" target="_blank" rel="noopener noreferrer">${esc(v)}</a>`:esc(v)}</dd></div>`).join('')}</dl><small>Unpopulated workbook cells remain unavailable.</small></section>`;
}
export function workbookRowLabel(row){
 const id=recordId(row),label=recordName(row);
 if(label&&label!==id)return label;
 return Object.entries(row).filter(([k,v])=>k!=='_row'&&known(v)).slice(0,3).map(([,v])=>String(v)).join(' · ')||'Workbook row '+row._row;
}
export function libraryTargets(project,sheet){return [...project.sources,...project.branches,...project.devices,...(project.pvArrays||[])].filter(item=>(catalogCategories[item.kind]||[]).includes(sheet));}
export function masterLibraryMarkup(manifest,state,project){
 if(!manifest?.workbookSheets)return '<section class="panel"><h2>Master database</h2><p>Loading workbook index…</p></section>';
 const metas=Object.entries(manifest.workbookSheets).filter(([,m])=>!state.group||m.usage===state.group),meta=manifest.workbookSheets[state.sheet],terms=state.search.toLowerCase().split(/\s+/).filter(Boolean);
 const filtered=(state.data?.records||[]).filter(row=>!terms.length||terms.every(t=>Object.values(row).join(' ').toLowerCase().includes(t))),page=filtered.slice(state.page*25,(state.page+1)*25),targets=libraryTargets(project,state.sheet),target=targets.find(t=>t.id===state.target);
 return `<section class="panel master-library"><div class="panel-heading"><div><span class="eyebrow">YOUR COMPLETE ENGINEERING WORKBOOK</span><h2>Master database</h2><p>${esc(manifest.workbook.name)} · ${manifest.workbook.sheets} sheets · ${manifest.workbook.records.toLocaleString()} source records</p></div><span class="db-chip">Original values retained</span></div><p class="master-download" role="note">The original master workbook is preserved in the cumulative recovery package. This static public preview serves its verified sheet records, but does not host the full XLSX download.</p><p><a href="v10-review.html" target="_blank" rel="noopener noreferrer">Review audited v10 non-curated records (reference only) ↗</a> · Existing equipment selections are unchanged.</p><p>Choose a sheet, search its records, then inspect the source fields or apply compatible equipment data. Other engineering references stay here without adding inputs to the fault study.</p><div class="master-controls"><label>Show sheets<select id="master-group"><option value="">All workbook sheets</option>${workbookGroups.map(g=>`<option value="${g}" ${state.group===g?'selected':''}>${g}</option>`).join('')}</select></label><label>Workbook sheet<select id="master-sheet">${metas.map(([s,m])=>`<option value="${s}" ${s===state.sheet?'selected':''}>${esc(s.replaceAll('_',' '))} · ${m.count.toLocaleString()}</option>`).join('')}</select></label><label>Search this sheet<input id="master-search" type="search" value="${esc(state.search)}" placeholder="Model, manufacturer, record ID or value"></label>${targets.length?`<label>Apply data to<select id="master-target"><option value="">Choose existing equipment</option>${targets.map(t=>`<option value="${esc(t.id)}" ${t.id===state.target?'selected':''}>${esc(t.name)}</option>`).join('')}</select></label>`:''}</div><div class="master-scope"><strong>${esc(meta?.usage||'Workbook reference')}</strong><p>${esc(meta?.description||'')}</p>${meta?.usage==='Calculation inputs'?'<p>Incomplete models remain selectable. Available fields fill the item; missing fault data stays required. X/R, assembly SCCR and protected manufacturer parameters are never invented.</p>':''}</div>${state.error?`<div class="inline-issue" role="alert">${esc(state.error)} <button data-master-action="retry">Retry</button></div>`:''}<div class="db-count" role="status">${state.loading?'Loading selected sheet…':state.data?filtered.length.toLocaleString()+' matches · page '+(state.page+1):'Select a sheet to load its records.'}</div>${state.inspect?sourceFieldsMarkup(state.inspect,{sheet:state.sheet}):''}<div class="table-scroll"><table><thead><tr><th>Source record</th><th>Use in Studio</th><th>Workbook row</th><th>Action</th></tr></thead><tbody>${page.map(row=>{const readiness=recordReadiness(state.sheet,row),reasons=target?recordCompatibility(state.sheet,row,target,project):[],blocked=!readiness.direct||reasons.length;return `<tr><td><strong>${esc(workbookRowLabel(row))}</strong><small>${esc(mapRecord(state.sheet,row).db.status||'Verification not supplied')}</small></td><td>${esc(readiness.label)}${reasons.length?`<small class="text-warning">${esc(reasons.join('. '))}</small>`:''}</td><td>${row._row}</td><td><button data-master-inspect="${row._row}">View fields</button>${targets.length?`<button data-master-use="${row._row}" class="primary" ${!target||blocked?'disabled':''}>Use with equipment</button>`:''}</td></tr>`}).join('')||'<tr><td colspan="4">'+(state.loading?'Loading records…':state.error?'Records could not be loaded. Retry above.':'No matches. Adjust the search or sheet.')+'</td></tr>'}</tbody></table></div><div class="actions"><button data-master-action="previous" ${state.page===0?'disabled':''}>← Previous</button><button data-master-action="next" ${(state.page+1)*25>=filtered.length?'disabled':''}>Next →</button><button data-master-action="download" ${!state.data?'disabled':''}>Download selected sheet JSON</button></div></section>`;
}
