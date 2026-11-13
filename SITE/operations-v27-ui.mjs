/** Fault Current Studio V27 — independent user-visible time-series analysis workbench.
 * No writes to network draft, history, databases, or Cloud Vault.
 */
import {evaluateBessDispatch,evaluateAcTimeSeries,compareBessSizeCases,operatingCaseFromStudio} from './operations-v27.mjs?v=20261108-v32';
import {pdfBlob,workbookBlob} from './public-report-engine.mjs?v=20261108-v32';
const __fcsReportStudy=(key,label,get)=>{try{(globalThis.__fcsReportStudies??=new Map()).set(key,{label,projectId:globalThis.__fcsStudio?.projectId?.()??null,at:Date.now(),get});globalThis.dispatchEvent?.(new Event('fcs-report-studies'))}catch{}};
const KEY='fault-studio-operations-v27-cases';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const finite=(s,label)=>{if(String(s).trim()==='')throw Error(label+' is required');const n=Number(s);if(!Number.isFinite(n))throw Error(label+' must be numeric');return n};
const id=()=>`${Date.now()}-${Math.floor(Math.random()*1e8)}`;
const exampleBess=()=>Array.from({length:24},(_,hour)=>({time:`Day 1 ${String(hour).padStart(2,'0')}:00`,hours:1,loadKW:hour>=17&&hour<=22?175:100,pvKW:hour>=7&&hour<=17?Math.round(220*Math.max(0,Math.sin((hour-6)*Math.PI/12))):0,importPricePerKWh:hour>=16&&hour<=21?.3:.12,exportPricePerKWh:.035}));
const exampleAc=()=>Array.from({length:24},(_,hour)=>({time:`Day 1 ${String(hour).padStart(2,'0')}:00`,hours:1,loadMultiplier:hour>=17&&hour<=21?1.45:hour>=0&&hour<=5?.65:1,generationMultiplier:hour>=7&&hour<=17?Math.max(0,Math.sin((hour-6)*Math.PI/12)):0}));
const exampleNet={baseMVA:10,buses:[{id:'GRID',type:'SLACK',vSetPu:1},{id:'LOAD',type:'PQ',pMW:-1,qMvar:-0.3}],branches:[{id:'FEEDER',from:'GRID',to:'LOAD',rPu:0.012,xPu:0.035}]};
const csvHeads={bess:['time','hours','loadKW','pvKW','importPricePerKWh','exportPricePerKWh'],ac:['time','hours','loadMultiplier','generationMultiplier'],sweep:['time','hours','loadKW','pvKW','importPricePerKWh','exportPricePerKWh']};
const normalizeText=(arr,mode)=>[csvHeads[mode].join(','),...arr.map(r=>csvHeads[mode].map(k=>String(r[k]??'')).join(','))].join('\n');
function parseCsv(source,mode){
 const header=csvHeads[mode];const lines=String(source).replace(/^\uFEFF/,'').trim().split(/\r?\n/);
 if(lines.length<2||lines.length>8785)throw Error('CSV requires header and 1–8784 interval rows');
 const actual=lines[0].split(',').map(x=>x.trim());
 if(actual.join('|')!==header.join('|'))throw Error('CSV header must be: '+header.join(','));
 return lines.slice(1).map((line,i)=>{
  if(line.includes('"')||line.includes("\t"))throw Error('CSV quoted and tab fields are not supported; use JSON for complex labels');
  const cols=line.split(',');if(cols.length!==header.length)throw Error('CSV line '+(i+2)+' must have '+header.length+' values');
  const record={};header.forEach((key,j)=>{record[key]=key==='time'?cols[j].trim():finite(cols[j],`Line ${i+2}, ${key}`)});
  return record;
 });
}
function makeReport(mode,input,result){
 const summary=Object.entries(result.summary||{}).map(([k,v])=>[k,typeof v==='object'?JSON.stringify(v):v]);
 const intervalColumns=mode==='sweep'?['capacityKWh','powerKW','supplyFullyServed','annualUnservedKWh','annualNetGridCost','capitalCost','discountedLifecycleCost','finalSocPercent']:mode==='bess'?['time','hours','loadKW','pvAvailableKW','chargeKW','dischargeKW','gridImportKW','gridExportKW','unservedKW','pvCurtailedKW','endSocPercent','estimatedNetCost','energyBalanceResidualKW']:
 ['time','hours','status','loadMultiplier','generationMultiplier','lowestVoltagePu','highestVoltagePu','lossMW','lossMWh','violatingBusIds','overloadedBranchIds','reason'];
 const inputSummary=Object.entries(input).filter(([k])=>k!=='intervals'&&k!=='network').map(([k,v])=>[k,typeof v==='object'?JSON.stringify(v):v]);
 return {sheets:[
  {name:'Summary',headers:['Metric','Value'],rows:[['Analysis type',mode==='bess'?'PV-BESS dispatch':mode==='sweep'?'BESS sizing sensitivity':'AC time series'],['Status',result.status],['Method',result.method],...summary]},
  {name:'Study inputs',headers:['Input','Value'],rows:inputSummary},
  {name:'Bus results',headers:intervalColumns,rows:result.intervals.map(r=>intervalColumns.map(k=>Array.isArray(r[k])?r[k].join(', '):r[k]??''))},
  {name:'Assumptions & QA',headers:['Type','Description'],rows:[...result.assumptions.map(t=>['Scope',t]),['Network','AC study uses the existing validated bounded balanced solver'],['Data provenance','User supplied inputs or explicitly loaded local Studio draft'],['Verification','This engineering preview is not certified IEC/IEEE or investment-grade optimisation']]}
 ]};
}
const download=(blob,name)=>{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),20000)};
const pretty=(v)=>JSON.stringify(v,null,2);
function launch(){if(document.getElementById('v27-operations'))return;
 let mode='bess',results=null,latest=null,host=null,origin=null;
 const overlay=document.createElement('div');overlay.id='v27-operations';overlay.hidden=true;
 overlay.innerHTML=`<div class="v27-backdrop" data-v27="close"></div><section class="v27-panel" role="dialog" aria-modal="true" aria-labelledby="v27-heading">
  <header class="v27-head"><div><p>ENGINEERING WORKSPACE / V27</p><h2 id="v27-heading">Operations &amp; BESS Study Lab</h2><span>Documented, interval-by-interval calculations with evidence and exports</span></div><button type="button" data-v27="close" aria-label="Close operations lab">×</button></header>
  <div class="v27-body"><nav class="v27-tabs" aria-label="Study type"><button type="button" data-v27-mode="bess" aria-pressed="true">PV + battery dispatch</button><button type="button" data-v27-mode="ac" aria-pressed="false">Time-series AC load flow</button><button type="button" data-v27-mode="sweep" aria-pressed="false">BESS size/cost sensitivity</button></nav>
   <div id="v27-intro" class="v27-intro"></div>
   <div class="v27-grid"><form id="v27-form" autocomplete="off"><div class="v27-form" id="v27-fields"></div>
     <label class="v27-wide">Interval profile (CSV) <textarea id="v27-csv" rows="9" spellcheck="false" aria-label="Interval input CSV"></textarea></label>
     <div class="v27-form-actions"><button type="button" data-v27="example">Reset to illustrative example</button><button type="submit" class="v27-primary">Calculate study</button></div>
   </form>
   <section id="v27-output" aria-live="polite" aria-label="Calculation results"><div class="v27-placeholder">Run a study to view interval results, energy balance, scope and downloadable evidence.</div></section></div>
   <section class="v27-saved"><div><h3>Saved operations scenarios</h3><p>Separate from the original network studies and Cloud Vault. Only explicit Save writes data.</p></div><div id="v27-case-actions"><button type="button" data-v27="save">Save current scenario</button><button type="button" data-v27="list">View saved scenarios</button><button type="button" data-v27="json">Download scenario JSON</button><button type="button" data-v27="import">Import scenario JSON</button><input type="file" accept=".json,application/json" id="v27-import" hidden></div><div id="v27-saved-list"></div></section>
  </div></section>`;
 document.body.append(overlay);
 const $=s=>overlay.querySelector(s);
 function currentInputs(){
  const values=Object.fromEntries([...$('#v27-fields').querySelectorAll('[data-v27-field]')].map(el=>[el.dataset.v27Field,el.value]));
  const intervals=parseCsv($('#v27-csv').value,mode);
  if(mode==='sweep'){const inputs={intervals,mode:values.mode,...Object.fromEntries(Object.entries(values).filter(([k])=>!['mode','capacityCandidatesKWh','powerCandidatesKW'].includes(k)).map(([k,v])=>[k,finite(v,k)]))};for(const key of ['capacityCandidatesKWh','powerCandidatesKW']){inputs[key]=values[key].split(',').map(x=>finite(x,key));}return inputs}
  if(mode==='bess')return {intervals,mode:values.mode,...Object.fromEntries(Object.entries(values).filter(([k])=>k!=='mode').map(([k,v])=>[k,finite(v,k)]))};
  let network;
  try{network=JSON.parse($('#v27-network').value)}catch{throw Error('Network JSON is not valid')}
  let rated={},voltages={};
  try{rated=JSON.parse($('#v27-ratings').value||'{}');voltages=JSON.parse($('#v27-voltages').value||'{}')}catch{throw Error('Network rating and voltage dictionaries must be valid JSON objects')}
  return {intervals,network,branchCurrentLimitsA:rated,nominalBusVoltageV:voltages,planningMinPu:finite(values.planningMinPu,'Minimum pu'),planningMaxPu:finite(values.planningMaxPu,'Maximum pu')};
 }
 const initialValues={sweep:{minimumSocPercent:10,maximumSocPercent:90,initialSocPercent:50,chargeEfficiency:.96,dischargeEfficiency:.94,exportLimitKW:50,importLimitKW:300,importTargetKW:65,mode:'self-consumption',capacityCandidatesKWh:'100,300,500,800',powerCandidatesKW:'50,100,200',batteryCostPerKWh:220,inverterCostPerKW:95,profileRepetitionsPerYear:365,analysisYears:12,discountRate:.07},bess:{capacityKWh:500,powerKW:200,minimumSocPercent:10,maximumSocPercent:90,initialSocPercent:50,chargeEfficiency:.96,dischargeEfficiency:.94,exportLimitKW:50,importLimitKW:300,importTargetKW:65,mode:'self-consumption'},ac:{planningMinPu:.95,planningMaxPu:1.05}};
 function textField(label,key,val,step='any'){return `<label>${escape(label)}<input data-v27-field="${escape(key)}" type="number" step="${step}" value="${escape(val)}" required></label>`}
 function form(modeChoice,inputs=null){mode=modeChoice;latest=null;results=null;
  overlay.querySelectorAll('[data-v27-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v27Mode===mode)));
  const v=inputs||initialValues[mode];
  $('#v27-intro').innerHTML=mode==='sweep'?'<strong>Sizing sensitivity, not an optimiser.</strong> Compare up to 144 explicit capacity/inverter combinations under the exact same PV/load schedule and finance assumptions. All results report unmet load.':mode==='bess'?'<strong>Energy and cost screening.</strong> Transparent PV-surplus charging, constrained discharging, grid caps, SOC and unmet demand; not an economic optimiser or interconnection guarantee.':
  '<strong>Network operations screening.</strong> Reruns the existing balanced Newton–Raphson solver for each profile interval. Requires a valid network, voltage bases, and documented branch limits for rating checks.';
  $('#v27-fields').innerHTML=mode==='sweep'?`${textField('Min SOC · %','minimumSocPercent',v.minimumSocPercent)}${textField('Max SOC · %','maximumSocPercent',v.maximumSocPercent)}${textField('Starting SOC · %','initialSocPercent',v.initialSocPercent)}${textField('Charging efficiency','chargeEfficiency',v.chargeEfficiency)}${textField('Discharging efficiency','dischargeEfficiency',v.dischargeEfficiency)}${textField('Export limit · kW','exportLimitKW',v.exportLimitKW)}${textField('Import limit · kW','importLimitKW',v.importLimitKW)}${textField('Peak shaving target · kW','importTargetKW',v.importTargetKW)}<label>Battery capacities · kWh (comma separated)<input data-v27-field="capacityCandidatesKWh" type="text" value="${escape(v.capacityCandidatesKWh)}" required></label><label>Inverter ratings · kW (comma separated)<input data-v27-field="powerCandidatesKW" type="text" value="${escape(v.powerCandidatesKW)}" required></label>${textField('Battery capex per kWh','batteryCostPerKWh',v.batteryCostPerKWh)}${textField('Inverter capex per kW','inverterCostPerKW',v.inverterCostPerKW)}${textField('Repeat profile per year','profileRepetitionsPerYear',v.profileRepetitionsPerYear)}${textField('Analysis years','analysisYears',v.analysisYears)}${textField('Real annual discount rate · fraction','discountRate',v.discountRate)}<label>Dispatch strategy<select data-v27-field="mode"><option value="self-consumption">PV self-consumption</option><option value="peak-shave">Peak shaving target</option></select></label>`:mode==='bess'?`${textField('Battery usable nameplate capacity · kWh','capacityKWh',v.capacityKWh)}${textField('Battery inverter AC power · kW','powerKW',v.powerKW)}${textField('Min SOC · %','minimumSocPercent',v.minimumSocPercent)}${textField('Max SOC · %','maximumSocPercent',v.maximumSocPercent)}${textField('Starting SOC · %','initialSocPercent',v.initialSocPercent)}${textField('Charging efficiency · fraction','chargeEfficiency',v.chargeEfficiency)}${textField('Discharging efficiency · fraction','dischargeEfficiency',v.dischargeEfficiency)}${textField('Allowed export · kW','exportLimitKW',v.exportLimitKW)}${textField('Allowed import · kW','importLimitKW',v.importLimitKW)}${textField('Peak shaving grid target · kW','importTargetKW',v.importTargetKW)}<label>Dispatch strategy<select data-v27-field="mode"><option value="self-consumption">PV self-consumption</option><option value="peak-shave">Peak shaving target</option></select></label>`:
  `${textField('Planning voltage minimum · pu','planningMinPu',v.planningMinPu)}${textField('Planning voltage maximum · pu','planningMaxPu',v.planningMaxPu)}<label class="v27-wide">Balanced network (JSON)<textarea id="v27-network" rows="9" spellcheck="false"></textarea></label><label class="v27-wide">Actual bus voltage bases V (JSON map)<textarea id="v27-voltages" rows="3" spellcheck="false"></textarea></label><label class="v27-wide">Optional documented branch current limits A (JSON map)<textarea id="v27-ratings" rows="3" spellcheck="false"></textarea></label><button type="button" data-v27="active" class="v27-wide">Read current Studio project (no changes)</button>`;
  if(mode!=='ac')$('[data-v27-field="mode"]').value=v.mode;
  else{$('#v27-network').value=pretty(v.network||exampleNet);$('#v27-ratings').value=pretty(v.branchCurrentLimitsA||{});$('#v27-voltages').value=pretty(v.nominalBusVoltageV||{GRID:480,LOAD:480});}
  $('#v27-csv').value=normalizeText(v.intervals||(mode==='ac'?exampleAc():exampleBess()),mode);
  $('#v27-output').innerHTML='<div class="v27-placeholder">Calculation inputs updated. Run the study to produce fresh results.</div>';
 }
 function format(n){return Number.isFinite(n)?Number(n).toLocaleString(undefined,{maximumFractionDigits:4}):'—'}
 function render(result){
  const s=result.summary;
  const metrics=mode==='sweep'?[['Candidates',s.candidateCount],['Fully served',s.feasibleCount],['Best capacity · kWh',s.bestCapacityKWh],['Best inverter · kW',s.bestPowerKW],['Best discounted cost',s.bestDiscountedLifecycleCost],['Baseline annual grid cost',s.baselineAnnualGridCost]]:mode==='bess'?[['Grid import · kWh',s.gridImportKWh],['Grid export · kWh',s.gridExportKWh],['PV curtailed · kWh',s.pvCurtailedKWh],['Unserved load · kWh',s.unservedKWh],['Battery final SOC · %',s.finalSocPercent],['Net estimated cost',s.netGridCost]]:
   [['Solved intervals',s.solvedIntervals],['Failed intervals',s.failedIntervals],['Min voltage · pu',s.minimumVoltagePu],['Max voltage · pu',s.maximumVoltagePu],['Network losses · MWh',s.lossMWh],['Voltage / thermal flags',s.voltageFlagCount+s.branchOverloadFlagCount]];
  const labels=mode==='sweep'?['Battery · kWh','Inverter · kW','Served','Annual shortfall','Annual grid cost','Initial capex','Discounted cost']:mode==='bess'?['Time','Load (kW)','PV (kW)','Battery charge','Battery discharge','Grid import','Export','SOC (%)','Unserved']:
   ['Time','Solve','Min V (pu)','Max V (pu)','Loss (MW)','Voltage flags','Branch flags'];
  const fields=mode==='sweep'?['capacityKWh','powerKW','supplyFullyServed','annualUnservedKWh','annualNetGridCost','capitalCost','discountedLifecycleCost']:mode==='bess'?['time','loadKW','pvAvailableKW','chargeKW','dischargeKW','gridImportKW','gridExportKW','endSocPercent','unservedKW']:
   ['time','status','lowestVoltagePu','highestVoltagePu','lossMW','violatingBusIds','overloadedBranchIds'];
  const tds=r=>fields.map(k=>`<td>${escape(Array.isArray(r[k])?r[k].join(', '):typeof r[k]==='number'?format(r[k]):r[k]??'—')}</td>`).join('');
  const warning=(mode==='sweep'&&!s.feasibleCount)||(mode==='bess'&&s.hasSupplyShortfall)||(mode==='ac'&&s.failedIntervals);
  $('#v27-output').innerHTML=`<div class="v27-results-head"><span>CALCULATED · ${escape(result.status)}</span><h3>Operating profile results</h3><p>${escape(result.method)}</p></div>
   ${warning?'<div class="v27-warning">Warning: some load was not served or one or more interval calculations failed. This scenario is not fully feasible.</div>':''}
   <div class="v27-metrics">${metrics.map(([l,v])=>`<div><span>${escape(l)}</span><strong>${format(v)}</strong></div>`).join('')}</div>
   <div class="v27-scroll"><table><thead><tr>${labels.map(x=>`<th>${escape(x)}</th>`).join('')}</tr></thead><tbody>${result.intervals.slice(0,48).map(r=>`<tr>${tds(r)}</tr>`).join('')}</tbody></table></div><p class="v27-small">Showing ${Math.min(48,result.intervals.length)} of ${result.intervals.length} intervals; exports include every result. This is a bounded planning screen, not engineering approval.</p>
   <div class="v27-actions"><button type="button" data-v27="pdf">Download PDF</button><button type="button" data-v27="xlsx">Download Excel</button><button type="button" data-v27="json">Download full JSON</button></div>
   <details><summary>Read all assumptions and limitations</summary><ul>${result.assumptions.map(a=>`<li>${escape(a)}</li>`).join('')}</ul></details>`;
 }
 function showError(err){$('#v27-output').innerHTML=`<div role="alert" class="v27-warning"><strong>Cannot complete the study.</strong> ${escape(err?.message||err)} No calculation or stored case was modified.</div>`}
 function preservedCases(){const raw=localStorage.getItem(KEY);if(raw===null)return [];let cases;try{cases=JSON.parse(raw)}catch{throw Error('Saved-case storage is damaged. It has NOT been overwritten; export the original value before saving again.')};if(!Array.isArray(cases)||cases.length>60||cases.some(c=>!c||typeof c.id!=='string'||!c.input||!['bess','ac','sweep'].includes(c.mode)))throw Error('Saved-case format is invalid. The original value has been preserved.');return cases}
 function showSaved(){try{const cases=preservedCases();$('#v27-saved-list').innerHTML=cases.length?`<div class="v27-saved-rows">${cases.map(c=>`<div><b>${escape(c.name||'Saved scenario')}</b><small>${escape(c.mode)} · ${escape(c.created||'')}</small><button type="button" data-v27-open="${escape(c.id)}">Open (recalculate)</button></div>`).join('')}</div>`:'<p>No saved scenarios. Saving never changes existing network projects.</p>'}catch(error){$('#v27-saved-list').textContent=error.message}}
 function downloadJSON(){if(!latest)throw Error('Run the calculation before exporting');download(new Blob([pretty({format:'fcs-operations-v27',mode,input:latest,result:results,created:new Date().toISOString()})],{type:'application/json'}),'fcs-operations-v27.json')}
 overlay.addEventListener('submit',e=>{if(e.target.id!=='v27-form')return;e.preventDefault();try{latest=currentInputs();results=mode==='bess'?evaluateBessDispatch(latest):mode==='sweep'?compareBessSizeCases(latest):evaluateAcTimeSeries(latest);render(results);{const m=mode,i=latest,r=results;__fcsReportStudy('ops-'+m,m==='bess'?'BESS dispatch (time series)':m==='sweep'?'BESS size comparison':'AC time-series load flow',()=>makeReport(m,i,r));}}catch(error){results=null;latest=null;showError(error)}});
 overlay.addEventListener('click',async e=>{
  const selected=e.target.closest?.('[data-v27-mode]');if(selected){form(selected.dataset.v27Mode);return}
  const openCase=e.target.closest?.('[data-v27-open]');if(openCase){try{const saved=preservedCases().find(x=>x.id===openCase.dataset.v27Open);if(!saved)throw Error('Saved scenario not found');form(saved.mode,saved.input);$('#v27-saved-list').textContent='Scenario reopened for recalculation. Source data unchanged.';}catch(err){showError(err)}return}
  const action=e.target.closest?.('[data-v27]')?.dataset?.v27;if(!action)return;
  if(action==='close'){overlay.hidden=true;origin?.focus?.();return}
  try{
   if(action==='example')form(mode);
   if(action==='active'){
    const raw=localStorage.getItem('fault-network-draft-v2');if(!raw)throw Error('No local Studio project draft found. Save/enter a network in the main Studio first.');
    const adapted=operatingCaseFromStudio(JSON.parse(raw));$('#v27-network').value=pretty(adapted.network);$('#v27-voltages').value=pretty(adapted.nominalBusVoltageV);$('#v27-ratings').value='{}';results=null;latest=null;$('#v27-output').textContent='Loaded '+adapted.projectName+' into the operations editor. Enter documented branch ratings and recalculate.';
   }
   if(action==='pdf'||action==='xlsx'){
    if(!results||!latest)throw Error('Run the calculation before exporting');const report=makeReport(mode,latest,results);const blob=action==='pdf'?pdfBlob(report):workbookBlob(report);
    download(blob,'fcs-operations-'+mode+'.'+(action==='pdf'?'pdf':'xlsx'));
   }
   if(action==='json')downloadJSON();
   if(action==='import')$('#v27-import').click();
   if(action==='list')showSaved();
   if(action==='save'){
    const input=currentInputs();const output=mode==='bess'?evaluateBessDispatch(input):mode==='sweep'?compareBessSizeCases(input):evaluateAcTimeSeries(input);
    if(pretty(input).length>1_000_000)throw Error('Scenario too large to save locally; export JSON instead');
    const name=prompt('Scenario label (max 80 characters):',mode==='bess'?'PV-BESS case':'AC load-flow profile');if(name===null)return;
    if(name.length>80||!name.trim())throw Error('Enter a short case label');const prev=preservedCases();if(prev.length>=60)throw Error('60 saved scenarios is the limit. Export a backup before adding more.');
    const next=[{id:id(),mode,input,name:name.trim(),created:new Date().toISOString()},...prev];localStorage.setItem(KEY,pretty(next));latest=input;results=output;render(results);showSaved();
   }
  }catch(error){showError(error)}
 });
 $('#v27-import').addEventListener('change',async e=>{
  const file=e.target.files?.[0];e.target.value='';if(!file)return;
  try{if(file.size>1_000_000)throw Error('Import exceeds 1 MB');const v=JSON.parse(await file.text());if(v.format!=='fcs-operations-v27'||!['bess','ac','sweep'].includes(v.mode)||!v.input||typeof v.input!=='object')throw Error('Expected a V27 operations scenario JSON');
    // Validate numerical calculations before permitting use; ignore untrusted saved results.
    if(v.mode==='bess')evaluateBessDispatch(v.input);else if(v.mode==='sweep')compareBessSizeCases(v.input);else evaluateAcTimeSeries(v.input);
    form(v.mode,v.input);$('#v27-saved-list').textContent='Scenario imported for recalculation. Original saved cases are unchanged.';
  }catch(error){showError(error)}
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden){overlay.hidden=true;origin?.focus?.();}});
 function open(el){origin=el;overlay.hidden=false;overlay.querySelector('[data-v27="close"]')?.focus({preventScroll:true});}
 function mountButton(){
   const holder=document.querySelector('#v26-launcher-holder');
   if(holder&&!holder.querySelector('[data-v27-launch]')){const b=document.createElement('button');b.type='button';b.dataset.v27Launch='';b.className='v27-launch';b.textContent='Operations & BESS study lab';b.addEventListener('click',()=>open(b));holder.append(b)}
   const hero=document.querySelector('.v26-hero-buttons');
   if(hero&&!hero.querySelector('[data-v27-launch]')){const b=document.createElement('button');b.type='button';b.dataset.v27Launch='';b.className='v26-button v26-button-secondary';b.textContent='Operations study lab ↗';b.addEventListener('click',()=>open(b));hero.append(b)}
 }
 const observe=new MutationObserver(()=>{mountButton()});observe.observe(document.body,{childList:true,subtree:true});mountButton();form('bess');
}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',launch,{once:true});else launch()}
