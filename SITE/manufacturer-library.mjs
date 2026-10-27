import {invalidateAnalysisData} from './analysis-data.mjs?v=20261022-pv-final';
import {isSinglePhase} from './single-phase.mjs?v=20261022-pv-final';
import {manufacturerRecords} from './manufacturer-catalog.mjs?v=20261022-pv-final';
export {manufacturerRecords};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const copy=v=>JSON.parse(JSON.stringify(v));
const valueText=v=>v===null?'Not published':typeof v==='boolean'?v?'Yes':'No':typeof v==='object'?JSON.stringify(v):String(v);
const fieldLabels={v1:'Primary line voltage (V)',v2:'Secondary line voltage (V)',voltage:'Source line voltage (V)',power:'Apparent power / reactance base (VA)',zPercent:'Nominal impedance (%)',frequency:'Frequency (Hz)',xdpp:'Subtransient reactance Xd″ (pu)',xdp:'Transient reactance Xd′ (pu)',xd:'Steady-state reactance Xd (pu)',ratedVoltage:'Product voltage rating (V)',continuousA:'Continuous current (A)',sccrA:'Complete assembly SCCR (A)',rPerM:'AC resistance R1 (Ω/m)',xPerM:'Reactance X1 (Ω/m)',temperature:'AC resistance temperature (°C)',sourceAcResistanceOhmPer1000FtAt75C:'AC resistance at 75 °C (Ω/kft)',sourceInductiveReactanceOhmPer1000FtAt60Hz:'Reactance at 60 Hz (Ω/kft)',sourceDcResistanceOhmPer1000FtAt25C:'DC resistance at 25 °C (Ω/kft; reference only)',reactanceBaseVA:'Published reactance base (VA)',reactanceBaseV:'Published reactance base voltage (V)',stcPmaxW:'Module STC DC power (W)',stcVocV:'Module STC open-circuit voltage (V)',stcIscA:'Module STC short-circuit DC current (A)',stcVmpV:'Module STC voltage at maximum power (V)',stcImpA:'Module STC current at maximum power (A)',ratedAcActivePowerW:'AC real power (W; not kVA)',nominalAcVoltageV:'AC line voltage (V)',nominalAcSystem:'Nominal AC line / neutral system',normalTemperatureWetDryC:'Normal wet / dry product temperature (°C)',reactanceInstallationBasis:'Cable routing used for the published X',insulationClassC:'Insulation class (°C)',temperatureRiseC:'Temperature rise (°C)',secondaryLineNeutralV:'Secondary line-to-neutral voltage (V)',instantaneousMagneticHoldA:'Magnetic hold band (A; not clearing time)',instantaneousMagneticTripA:'Magnetic trip band (A; not clearing time)'};
export const manufacturerFieldLabel=key=>fieldLabels[key]||key.replace(/([a-z])([A-Z])/g,'$1 $2');
export const manufacturerRecord=id=>manufacturerRecords.find(r=>r.id===id);
export function manufacturerMatches(item,record){
 if(record.kind==='ibr')return ['pv','bess'].includes(item.kind);
 if(record.kind!==item.kind)return false;
 return item.kind!=='switchgear'||!record.equipmentType||record.equipmentType===(item.equipmentType||'switchgear');
}
export function manufacturerChoices(item,project=null){return manufacturerRecords.filter(r=>manufacturerMatches(item,r)&&(!isSinglePhase(project)||r.kind!=='transformer'||r.referenceOnlyFields.phases===1));}
export function manufacturerOperatingVoltage(project,item){
 const link=project.branches.find(b=>b.id===item.linkId),ids=[item.bus,...(link?[link.from,link.to]:[])].filter(Boolean);
 const buses=ids.map(id=>project.buses.find(b=>b.id===id));
 return buses.length&&buses.every(b=>b?.voltage>0)?Math.max(...buses.map(b=>b.voltage)):null;
}
export function manufacturerDutyRating(record,voltage){
 if(!(voltage>0)||voltage>record.values.ratedVoltage+1e-6)return null;
 return record.ratings.filter(r=>r.system==='AC'&&!r.referenceOnly&&r.voltage+1e-6>=voltage).sort((a,b)=>a.voltage-b.voltage)[0]||null;
}
export function manufacturerAppliedValues(item,record,project=null){
 let reset={};
 if(item.kind==='transformer')reset={xr:null,shift:null,primaryConnection:'Delta',secondaryConnection:'Unknown',grounding:'Unknown',neutralR:null,neutralX:null,allowIdeal:false};
 if(item.kind==='generator')reset={faultA:null,faultMVA:null,r:null,x:null,xr:null,method:'ka',model:'voltage',multiplier:null,duration:null,peakA:null};
 if(item.kind==='cable')reset={...(isSinglePhase(project)||Object.hasOwn(item,'loopImpedanceBasis')?{loopImpedanceBasis:''}:{}),r0PerM:null,x0PerM:null,frequencyOverride:false,allowIdeal:false,insulationType:'PV wire',insulationProductTemp:90,cableCategory:'pv',cableType:'Southwire SPEC 45412 / stock 668048; non-ferrous conduit, one diameter spacing'};
 if(['switchgear','panel','disconnect'].includes(item.kind))reset={interruptA:null,sccrA:null,peakA:null,shortTimeA:null,shortTimeDuration:null,breakingTime:null,withstandTime:null};
 return {...reset,...copy(record.values)};
}
export function applyManufacturerRecord(project,item,recordId){
 const record=manufacturerRecord(recordId);
 if(!record||!manufacturerMatches(item,record))throw Error('Choose a manufacturer record for this equipment type.');
 if(isSinglePhase(project)&&record.kind==='transformer'&&record.referenceOnlyFields.phases!==1)throw Error('Choose an actual single-phase transformer nameplate. This manufacturer record is three-phase.');
 if(record.referenceOnly)throw Error('This is reference-only data; no AC fault model is published in this source.');
 if(record.sourceConflict)throw Error('Manufacturer source conflict: this nominal impedance differs between two Schneider catalogues. Confirm the exact installed nameplate/test result and enter a documented custom value; no catalogue values were applied.');
 const appliedValues=manufacturerAppliedValues(item,record,project);
 invalidateAnalysisData(item);Object.assign(item,appliedValues);item.valueSource='manufacturer';
 if(item.kind==='cable'&&item.thermal){delete item.thermal.areaMM2;delete item.thermal.class;}
 item.units={...item.units,voltage:'V',v1:'V',v2:'V',power:'kVA',ratedVoltage:'V',interruptA:'kA',sccrA:'kA',rPerM:'Ω/kft',xPerM:'Ω/kft'};
 item.db={origin:'manufacturer',id:record.id,sheet:'Manufacturer sources',label:record.title,source:record.sourceUrl,status:record.kind==='transformer'?'Nominal catalogue impedance; verify installed nameplate':'Manufacturer source; verify installed model',notes:record.notes.join(' '),fields:Object.entries(record.values).filter(([,v])=>v!=null).map(([key])=>key),overrides:[],appliedValues:copy(appliedValues),originalValues:{...copy(record.values),...copy(record.referenceOnlyFields)},checkedAt:record.checkedAt,sourcePage:record.page,sourceRevision:record.sourceRevision};
 project.inputErrors=(project.inputErrors||[]).filter(e=>e.id!==item.id||(!Object.hasOwn(appliedValues,e.key)&&e.origin!=='cable-selection'));
 synchronizeManufacturerData(project);
 return record;
}
export function synchronizeManufacturerData(project){
 const errors=(project.inputErrors||[]).filter(e=>e.origin!=='manufacturer-base');
 for(const item of [...project.sources,...project.branches,...project.devices]){
  if(item.db?.origin!=='manufacturer')continue;
  const record=manufacturerRecord(item.db.id);if(!record||!manufacturerMatches(item,record)||record.referenceOnly)continue;
  const overrides=new Set(item.db.overrides||[]);
  if(record.ratings.some(r=>r.system==='AC'&&!r.referenceOnly)){
   const operatingVoltage=manufacturerOperatingVoltage(project,item),rating=manufacturerDutyRating(record,operatingVoltage);
   if(!overrides.has('interruptA')){
    item.interruptA=rating?.interruptA??null;
    item.db.fields=[...new Set([...(item.db.fields||[]).filter(k=>k!=='interruptA'),...(rating?['interruptA']:[])])];
   }
   item.db.dutyBasis={operatingVoltage,ratingVoltage:rating?.voltage??null,interruptA:rating?.interruptA??null,manualOverride:overrides.has('interruptA'),standard:rating?.standard||rating?.basis||'AC manufacturer rating'};
  }
  if(item.kind==='generator'&&item.method!=='impedance'){
   const field=project.settings.generatorStage==='transient'?'xdp':project.settings.generatorStage==='steady'?'xd':'xdpp';
   if(!overrides.has(field)&&(item.power!==record.values.power||item.voltage!==record.values.voltage||item.frequency!==record.values.frequency))errors.push({id:item.id,key:field,origin:'manufacturer-base',message:item.name+': the published '+field+' is on a '+record.values.power/1000+' kVA, '+record.values.voltage+' V, '+record.values.frequency+' Hz base. Restore that base or enter documented reactance converted to the new base.'});
  }
 }
 if(errors.length)project.inputErrors=errors;else delete project.inputErrors;
 return project;
}
function catalogueConflictMarkup(record){
 if(!record.sourceConflict)return '';
 const c=record.sourceConflict;
 return `<p role="alert" style="border-left:4px solid #b65324;background:#fff0e5;padding:9px"><strong>Manufacturer source discrepancy — automatic application blocked.</strong> Schneider Digest lists ${esc(c.digestZPercent)}% impedance; the EXN catalogue lists ${esc(c.otherCatalogZPercent)}%. Verify the installed manufacturer's data before use. <a href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">Review alternate official catalogue</a>.</p>`;
}
export function manufacturerRecordMarkup(record,{compact=false}={}){
 const facts={...record.values,...record.referenceOnlyFields};
 return `<article class="manufacturer-record"><h3>${esc(record.title)}</h3><p>${esc(record.manufacturer)} · ${esc(record.model)}</p>${record.referenceOnly?'<strong class="db-chip">Reference only · no AC fault input</strong>':''}${catalogueConflictMarkup(record)}<p>${esc(record.notes[0])}</p><details ${compact?'':'open'}><summary>Documented values and applicability</summary><dl>${Object.entries(facts).map(([key,value])=>`<dt>${esc(manufacturerFieldLabel(key))}</dt><dd>${esc(valueText(value))}</dd>`).join('')}</dl>${record.ratings.length?`<table><thead><tr><th>System</th><th>Rated voltage</th><th>Interrupting RMS</th></tr></thead><tbody>${record.ratings.map(r=>`<tr><td>${esc(r.system)}${r.referenceOnly?' · reference only':''}</td><td>${r.voltage} V</td><td>${r.interruptA/1000} kA</td></tr>`).join('')}</tbody></table>`:''}<p>${record.notes.map(esc).join(' ')}</p><p><strong>Not published / project-specific:</strong> ${record.missing.map(esc).join(', ')}</p><small>${esc(record.page)} · ${esc(record.sourceRevision)} · Checked ${esc(record.checkedAt)}</small></details><a href="${esc(record.sourceUrl)}" target="_blank" rel="noopener noreferrer">Open manufacturer source ↗</a></article>`;
}
export function manufacturerPickerMarkup(item,{dialog=false,project=null}={}){
 const records=manufacturerChoices(item,project),selected=manufacturerRecord(item.db?.origin==='manufacturer'?item.db.id:'');
 return `<section class="catalog-picker manufacturer-picker"><h4>Manufacturer model</h4>${records.length?`<label class="field" for="manufacturer-model-${esc(item.id)}"><span>Choose documented equipment</span><select id="manufacturer-model-${esc(item.id)}" data-manufacturer-record="${esc(item.id)}"><option value="">Choose a model</option>${records.map(r=>`<option value="${esc(r.id)}" ${selected?.id===r.id?'selected':''} ${r.referenceOnly||r.sourceConflict?'disabled':''}>${esc(r.title)}${r.referenceOnly?' · reference only':r.sourceConflict?' · manufacturer source conflict — review required':''}</option>`).join('')}<option value="__custom__">Custom / user input…</option></select></label><p>Choosing a model replaces its catalogue values. Names, connections and drawing positions are retained.</p>`:'<p>No additional verified manufacturer model for this type yet. The full master-workbook records and manual fields remain available.</p>'}${selected?manufacturerRecordMarkup(selected,{compact:true}):''}<button data-action="open-manufacturer-library">${dialog?'Save and browse manufacturer references':'Browse all manufacturer references'}</button></section>`;
}
export function manufacturerContextMarkup(item){
 const record=manufacturerRecord(item.db?.id);if(!record)return '<p>Manufacturer reference unavailable. Review the entered values and source.</p>';
 const b=item.db.dutyBasis;
 return `<section class="database-context"><h4>Manufacturer data & applicability</h4><p>${esc(record.manufacturer)} · ${esc(record.model)} · Checked ${esc(record.checkedAt)}</p>${catalogueConflictMarkup(record)}${b?`<p>${b.manualOverride?'Interrupting rating manually overridden. ':''}${b.interruptA!=null?'Published AC rating: '+b.interruptA/1000+' kA at '+b.ratingVoltage+' V; connected voltage '+b.operatingVoltage+' V.':'A connected operating voltage within the published AC rating range is required.'}</p>`:''}<p>${esc(record.notes.join(' '))}</p><p><strong>Missing / verify:</strong> ${esc(record.missing.join(', '))}</p><small>${esc(record.page)} · ${esc(record.sourceRevision)}</small><p><a href="${esc(record.sourceUrl)}" target="_blank" rel="noopener noreferrer">Open manufacturer source ↗</a></p></section>`;
}
export function manufacturerLibraryMarkup({search='',type='all'}={}){
 const q=search.trim().toLowerCase(),records=manufacturerRecords.filter(r=>(type==='all'||(r.equipmentType||r.kind)===type)&&(!q||JSON.stringify(r).toLowerCase().includes(q)));
 const types=[...new Set(manufacturerRecords.map(r=>r.equipmentType||r.kind))];
 return `<section class="panel manufacturer-library"><div class="panel-heading"><div><span class="eyebrow">PUBLIC MANUFACTURER SOURCES</span><h2>Manufacturer references</h2><p>${manufacturerRecords.length} checked references · separate from your original master workbook</p></div></div><p>Documented product values include their units, conditions and source links. Missing values stay blank. DC modules and incomplete inverter fault models are reference only.</p><div class="manufacturer-filters"><label class="field" for="manufacturer-search"><span>Search manufacturer / model</span><input id="manufacturer-search" type="search" value="${esc(search)}" placeholder="Schneider, Southwire, STAMFORD…"></label><label class="field" for="manufacturer-type"><span>Equipment type</span><select id="manufacturer-type"><option value="all">All reference types</option>${types.map(t=>`<option value="${esc(t)}" ${type===t?'selected':''}>${esc(t.replaceAll('_',' '))}</option>`).join('')}</select></label></div><p>${records.length} matching references</p><div class="manufacturer-grid">${records.map(r=>manufacturerRecordMarkup(r,{compact:true})).join('')||'<p>No matching records.</p>'}</div></section>`;
}
