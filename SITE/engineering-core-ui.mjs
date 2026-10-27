import {advancedStudyReportBlob} from './advanced-study-report.mjs';
import {radialSourceFault,thermalSteadyCore} from './engineering-core-methods.mjs';
import {sweepProtectionCoordination} from './protection-full-range.mjs';
import {timeVaryingSymmetricalFaultDuty} from './time-varying-current-duty.mjs';
import {documentedAsymmetricalWaveformDuty} from './asymmetrical-waveform-duty.mjs';
import {transformerNameplateFaultEnvelope} from './iec60909-transformer-scenarios.mjs';
import {reducedSequenceFault} from './sequence-fault-screen.mjs';
import {conductorACResistanceIEC60287} from './iec60287-ac-resistance.mjs';
import {directBuriedSingleCoreRating} from './iec60287-buried-cable.mjs';
import {multiSourceThreePhaseFault} from './multi-source-fault-network.mjs';
import {multiVoltageThreePhaseFault} from './multi-voltage-fault-network.mjs';
import {multiBusSequenceFault} from './multibus-sequence-fault-network.mjs';
import {faultScenarioEnvelope} from './fault-scenario-envelope.mjs';
import {screenBalancedNMinusOne} from './contingency-power-flow.mjs';
import {peakMakingNetworkScreen} from './iec60909-peak-network.mjs';
import {faultBusSweep} from './fault-bus-sweep.mjs';
// Versioned, separate, browser-local input-case library. Never touches existing
// project history, active draft, owner cloud records or Cloud Vault recovery codes.
export const ADVANCED_CASE_KEY='fault-studio-advanced-input-cases-v1';
const allowedAdvancedModes=new Set(['fault','multisource','multivoltage','transformer60909','sequence','multisequence','multienvelope','contingency','peakscreen','faultsweep','thermal','resistance','buried','protectionrange','phasorduty','acdcwave']);
const advancedCaseLimit=100,advancedStorageCharLimit=2800000;
function validatedAdvancedCase(row){
 if(!row||typeof row!=='object'||Array.isArray(row)||row.version!==1||typeof row.id!=='string'||!/^case_[a-zA-Z0-9_-]{6,85}$/.test(row.id)||!allowedAdvancedModes.has(row.method)||typeof row.name!=='string'||!row.name.trim()||row.name.length>120||typeof row.inputJson!=='string'||row.inputJson.length>150000||typeof row.createdAt!=='string'||!Number.isFinite(Date.parse(row.createdAt)))throw Error('Saved method input contains unsupported or damaged records; original browser storage was not changed.');
 let input;try{input=JSON.parse(row.inputJson)}catch{throw Error('Saved method input JSON is damaged; original browser storage was not changed.');}
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Saved method input must be a documented JSON object.');
 return {version:1,id:row.id,name:row.name,method:row.method,inputJson:row.inputJson,createdAt:row.createdAt};
}
export function readAdvancedInputCases(storage){
 let raw;try{raw=storage.getItem(ADVANCED_CASE_KEY)}catch{throw Error('Browser local storage is unavailable. Export JSON inputs manually instead.');}
 if(raw===null||raw==='')return [];
 if(raw.length>advancedStorageCharLimit)throw Error('Saved method library exceeds supported size; existing browser data was not changed.');
 let items;try{items=JSON.parse(raw)}catch{throw Error('Saved method library is unreadable; existing browser data was not overwritten.');}
 if(!Array.isArray(items)||items.length>advancedCaseLimit)throw Error('Saved method library is not a supported list; existing browser data was not overwritten.');
 const output=items.map(validatedAdvancedCase),ids=new Set();for(const row of output){if(ids.has(row.id))throw Error('Duplicate method case ID in local storage; original data retained.');ids.add(row.id);}return output;
}
function writeAdvancedCases(storage,rows){
 if(rows.length>advancedCaseLimit)throw Error('Limit of 100 documented input cases reached. Export the case archive before adding more.');
 const encoded=JSON.stringify(rows);
 if(encoded.length>advancedStorageCharLimit)throw Error('Input-case library storage limit reached; export cases before adding more.');
 try{storage.setItem(ADVANCED_CASE_KEY,encoded)}catch{throw Error('Browser storage write failed. Previously saved cases were not intentionally modified. Download an input archive.');}
 return rows;
}
export function saveAdvancedInputCase(storage,{method,inputJson,name,id,createdAt}={}){
 const current=readAdvancedInputCases(storage);
 if(!allowedAdvancedModes.has(method)||typeof inputJson!=='string'||inputJson.length>150000)throw Error('Unsupported study method or oversized input (150,000-character maximum).');
 const title=String(name??'').trim();if(!title||title.length>120)throw Error('Enter a case name of 1–120 characters.');
 const uid=id??('case_'+(globalThis.crypto?.randomUUID?.()||('c'+Date.now().toString(36)+Math.random().toString(36).slice(2))));
 const row=validatedAdvancedCase({version:1,id:uid,name:title,method,inputJson,createdAt:createdAt??new Date().toISOString()});
 if(current.some(x=>x.id===row.id))throw Error('This saved case ID already exists. No saved case was modified.');
 writeAdvancedCases(storage,[...current,row]);return row;
}
export function advancedInputCaseArchive(storage){return {schema:'fault-studio-advanced-input-cases-v1',exportedAt:new Date().toISOString(),cases:readAdvancedInputCases(storage)};}
export function mergeAdvancedInputArchive(storage,archive){
 const existing=readAdvancedInputCases(storage);
 if(!archive||archive.schema!=='fault-studio-advanced-input-cases-v1'||!Array.isArray(archive.cases)||archive.cases.length>advancedCaseLimit)throw Error('This is not a supported documented input-case archive.');
 const merged=[...existing],ids=new Map(existing.map(row=>[row.id,JSON.stringify(row)]));let added=0;
 for(const item of archive.cases){const row=validatedAdvancedCase(item),fingerprint=JSON.stringify(row);
  if(ids.has(row.id)){if(ids.get(row.id)!==fingerprint)throw Error('An imported case ID conflicts with existing saved content. No changes made.');continue;}
  ids.set(row.id,fingerprint);merged.push(row);added++;
 }
 if(added)writeAdvancedCases(storage,merged);
 return {added,total:merged.length};
}
const examples={
 transformer60909:{ratedHighVoltageV:13800,ratedLowVoltageV:480,transformer:{sourceReference:'ILLUSTRATIVE: replace with actual approved 2500 kVA transformer OEM nameplate and loss test',ratedMVA:2.5,shortCircuitVoltagePercent:5.75,ratedLoadLossKW:18,ratedTapRatio:1},utility:{sourceReference:'ILLUSTRATIVE: replace with max/min POI equivalent utility study and matching X/R',maximumEquivalentMVA:350,maximumXOverR:10,minimumEquivalentMVA:220,minimumXOverR:8},voltageFactors:{maximum:1.1,minimum:0.95},feeder:{sourceReference:'ILLUSTRATIVE LV cable sizing and installation; replace with approved conductor R20/X/route/temperature',lengthM:25,resistanceOhmPerKmAt20C:0.16,reactanceOhmPerKm:0.08,alphaPerC:0.00393,maximumConductorTemperatureC:20,minimumConductorTemperatureC:90}},

 acdcwave:{frequencyHz:60,durationS:0.1,inceptionAngleDeg:40,initialCurrentCondition:'ZERO_PRIOR_CURRENT',sources:[{id:'UTILITY',sourceReference:'ILLUSTRATIVE ONLY: not utility/OEM trace',dcTimeConstantReference:'ILLUSTRATIVE ONLY: not measured equivalent X/R',dcTimeConstantS:0.025,samples:[{timeS:0,symmetricalRmsA:14000,phaseDeg:-30},{timeS:0.05,symmetricalRmsA:10000,phaseDeg:-30},{timeS:0.1,symmetricalRmsA:7000,phaseDeg:-30}]},{id:'GENERATOR',sourceReference:'ILLUSTRATIVE ONLY: not generator decrement or fault model',dcTimeConstantReference:'ILLUSTRATIVE ONLY: not OEM rotor/DC time constant',dcTimeConstantS:0.08,samples:[{timeS:0,symmetricalRmsA:4000,phaseDeg:20},{timeS:0.1,symmetricalRmsA:1500,phaseDeg:20}]}]},

 protectionrange:{requiredMarginS:0.15,downstream:{model:'EXAMPLE_DOWNSTREAM_125A',source:'ILLUSTRATIVE POINTS NOT OEM DATA: replace with publication and actual settings',revision:'illustrative-1',curveCsv:'100,0.65,0.8\n200,0.25,0.3\n400,0.08,0.10\n800,0.03,0.04'},upstream:{model:'EXAMPLE_UPSTREAM_400A',source:'ILLUSTRATIVE POINTS NOT OEM DATA: replace with publication and actual settings',revision:'illustrative-1',curveCsv:'100,1.4,1.7\n200,1.0,1.2\n400,0.7,0.9\n800,0.38,0.50'},faultRanges:[{location:'Illustrative downstream feeder faults',source:'ILLUSTRATIVE electrical fault study, replace with signed fault cases',downstreamMinA:130,downstreamMaxA:700,upstreamPerDownstream:1},{location:'Illustrative two-source scenario',source:'ILLUSTRATIVE current distribution, replace with signed case',downstreamMinA:230,downstreamMaxA:600,upstreamPerDownstream:0.8}]},
 phasorduty:{durationS:0.1,sources:[{id:'UTILITY',sourceReference:'ILLUSTRATIVE FAULT PHASOR TRACE; replace with OEM/network time study',samples:[{timeS:0,symmetricalRmsA:14000,phaseDeg:0},{timeS:0.05,symmetricalRmsA:10000,phaseDeg:0},{timeS:0.1,symmetricalRmsA:6000,phaseDeg:0}]},{id:'GENERATOR',sourceReference:'ILLUSTRATIVE GENERATOR TRACE; replace with OEM decrement and case',samples:[{timeS:0,symmetricalRmsA:4000,phaseDeg:30},{timeS:0.1,symmetricalRmsA:0,phaseDeg:30}]}]},
 buried:{installation:'single-core-homogeneous-direct-burial',conductorDiameterMM:20,insulationLayers:[{innerDiameterMM:20,outerDiameterMM:31,thermalResistivityKmPerW:3.5}],beddingLayers:[{innerDiameterMM:31,outerDiameterMM:34,thermalResistivityKmPerW:4.5}],jacketLayers:[{innerDiameterMM:34,outerDiameterMM:43,thermalResistivityKmPerW:3.5}],burialDepthToAxisMM:900,soilThermalResistivityKmPerW:1.0,ambientSoilC:25,conductorLimitC:90,dielectricLossWPerM:0.05,sheathLossFactor:0.1,armourLossFactor:0,centerOffsetsMM:[-200,0,200],acResistanceAtLimitOhmPerM:0.00013,acResistanceSource:'ILLUSTRATIVE INPUT ONLY: replace with a manufacturer-qualified AC conductor resistance at rated conductor temperature',loadCurrentA:250},
 multivoltage:{baseMVA:10,frequencyHz:60,faultBus:'PANEL',buses:[{id:'UTILITY',nominalLLV:13800},{id:'SECONDARY',nominalLLV:480},{id:'PANEL',nominalLLV:480}],branches:[{id:'TX_1',kind:'transformer',from:'UTILITY',to:'SECONDARY',rPu:0.012,xPu:0.055,tapMagnitude:1.025,phaseShiftDeg:0},{id:'FEEDER',kind:'line',from:'SECONDARY',to:'PANEL',rOhm:0.0012,xOhm:0.003}],sources:[{id:'GRID',bus:'UTILITY',rPu:0.008,xPu:0.042,emScale:1.1,angleDeg:0},{id:'GENERATOR',bus:'SECONDARY',rPu:0.05,xPu:0.19,emScale:1.04,angleDeg:0}]},
 contingency:{
  network:{
   baseMVA:10,
   buses:[{id:'S',type:'SLACK',vSetPu:1},{id:'A',type:'PQ',pMW:-2,qMvar:-0.7},{id:'B',type:'PQ',pMW:-1.5,qMvar:-0.5}],
   branches:[{id:'SA',from:'S',to:'A',rPu:.01,xPu:.08},{id:'AB',from:'A',to:'B',rPu:.015,xPu:.09},{id:'SB',from:'S',to:'B',rPu:.012,xPu:.1}]
  },
  nominalBusVoltageV:{S:13800,A:13800,B:13800},
  busVoltageLimitsPu:{S:{min:.9,max:1.1},A:{min:.9,max:1.1},B:{min:.9,max:1.1}},
  branchCurrentLimitsA:{SA:300,AB:300,SB:300},
  maxCases:200
 },
 multisequence:{nominalLLV:13800,voltageFactor:1.10,frequencyHz:60,faultType:'AG',faultBus:'F',buses:['F','A','B'],branches:[{id:'line-A',from:'A',to:'F',positiveSequence:{rOhm:0.06,xOhm:0.12},negativeSequence:{rOhm:0.07,xOhm:0.14},zeroSequence:{rOhm:0.23,xOhm:0.44}},{id:'line-B',from:'B',to:'F',positiveSequence:{rOhm:0.04,xOhm:0.13},negativeSequence:{rOhm:0.05,xOhm:0.16},zeroSequence:{rOhm:0.22,xOhm:0.48}}],sources:[{id:'grid-A',bus:'A',positiveSequence:{rOhm:0.08,xOhm:0.42},negativeSequence:{rOhm:0.09,xOhm:0.46},zeroSequence:{rOhm:0.31,xOhm:1.2},angleDeg:0,emScale:1},{id:'source-B',bus:'B',positiveSequence:{rOhm:0.11,xOhm:0.60},negativeSequence:{rOhm:0.13,xOhm:0.67},zeroSequence:{rOhm:0.33,xOhm:1.34},angleDeg:0,emScale:1}]},
 multienvelope:null,
 peakscreen:null,
 faultsweep:null,
 multisource:{nominalLLV:13800,voltageFactor:1.10,frequencyHz:60,faultBus:'F',buses:['F','A','B'],branches:[{id:'feeder-A',from:'A',to:'F',rOhm:0.06,xOhm:0.12},{id:'feeder-B',from:'B',to:'F',rOhm:0.04,xOhm:0.13}],sources:[{id:'utility-1',bus:'A',rOhm:0.08,xOhm:0.42,angleDeg:0,emScale:1},{id:'generator-2',bus:'B',rOhm:0.11,xOhm:0.6,angleDeg:0,emScale:1}]},
 resistance:{r20OhmPerM:0.0001,alpha20PerC:0.004,operatingConductorC:90,frequencyHz:60,skinFactorKS:0.8,proximityFactorKP:0.8,conductorDiameterMM:25,axisSpacingMM:40,geometry:'three-core'},
 sequence:{nominalLLV:13800,voltageFactor:1.10,faultType:'AG',positiveSequence:{rOhm:0.12,xOhm:0.94},negativeSequence:{rOhm:0.14,xOhm:0.98},zeroSequence:{rOhm:0.33,xOhm:1.45}},
 fault:{nominalLLV:13800,voltageFactor:1.10,frequencyHz:60,seriesImpedances:[{id:'utility-positive-Z',rOhm:0.12,xOhm:0.94},{id:'feeder-at-fault-voltage-base',rOhm:0.08,xOhm:0.21}],dcTimesS:[0,0.01,0.03,0.05]},
 thermal:{ambientC:40,conductorLimitC:90,racOhmPerM:0.00013,loadedConductors:3,t1KmPerW:0.23,t2KmPerW:0.08,t3KmPerW:0.06,t4KmPerW:0.76,dielectricLossWPerM:0.08,sheathLossFactor:0.17,armourLossFactor:0,loadCurrentA:225}
};
function install(){
 if(document.getElementById('fcs-method-open'))return;
 const css=document.createElement('style');css.textContent=`#fcs-method-open{position:fixed;bottom:226px;right:17px;z-index:3900;border-radius:25px;background:#254050;color:white;border:2px solid #71abb3;font:600 13px system-ui;padding:11px 15px;cursor:pointer}#fcs-method-screen{position:fixed;inset:0;z-index:4020;display:none;align-items:center;justify-content:center;background:#091a27dd;padding:10px;font:14px system-ui}#fcs-method-screen[data-open=true]{display:flex}#fcs-method-panel{max-height:95vh;overflow-y:auto;width:min(790px,100%);box-sizing:border-box;border-radius:15px;background:#f8fafb;color:#12293d;padding:22px;box-shadow:0 8px 50px #07141caa}#fcs-method-panel button{padding:9px 12px;margin:6px 5px 6px 0;background:#1b546f;color:white;border:0;border-radius:7px;cursor:pointer;font:600 13px system-ui}#fcs-method-panel textarea{font:12px ui-monospace,monospace;box-sizing:border-box;width:100%;min-height:230px;border:1px solid #acc1ca;padding:10px;border-radius:7px}#fcs-method-panel pre{white-space:pre-wrap;word-break:break-word;background:#e9f0f3;padding:12px;max-height:250px;overflow:auto;font:12px ui-monospace,monospace}#fcs-method-panel .caution{background:#ffede1;border-left:4px solid #c07f39;padding:10px;font-size:13px}`;document.head.append(css);
 const open=document.createElement('button');open.id='fcs-method-open';open.type='button';open.textContent='∑ IEC study methods (beta)';document.body.append(open);
 const o=document.createElement('div');o.id='fcs-method-screen';o.innerHTML=`<section role="dialog" aria-modal="true" aria-label="IEC study methods" id="fcs-method-panel"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h2 style="font:700 21px system-ui;margin:0">IEC calculation methods (bounded beta)</h2><button data-method="close">Close</button></div><p class="caution">Explicit documented inputs only. The radial 60909 screen is <strong>single-source</strong>; the multi-source option solves documented three-phase bolted faults or <strong>optional linear R+jX fault impedance</strong> networks; the <strong>multi-voltage</strong> option solves a separately entered three-phase transformer-tap and source network using an explicit system MVA base (no vector-group or non-three-phase model); the <strong>N−1 screening</strong> option enumerates documented single-branch outages at a fixed balanced operating dispatch and enforces entered thermal/voltage limits (not automatic redispatch or dynamic stability); the multi-bus sequence option separately solves <strong>3PH / AG / BC / BCG</strong> using documented Z1/Z2/Z0 and source EMFs (add <code>"faultImpedance":{"rOhm":0.02,"xOhm":0.04}</code> to its input) without full IEC duty factors; the peak screen reduces a <strong>single-voltage-level passive network</strong> at nominal and equivalent frequency for a bolted 3φ fault; the location sweep enumerates <strong>only entered buses/types</strong>; 60287 evaluates an <strong>entered steady-state core equation</strong>; a separate homogeneous-direct-burial option derives radial thermal resistance and equal-load flat-row soil coupling from verified geometry and thermophysical inputs. The separate nameplate transformer 60909-style radial case derives physical R/X from test losses, applies the documented 2016 transformer KT expression, and computes max/min initial RMS and bounded peak with explicit source equivalent MVA, X/R and cable temperature; not complete IEC 60909-0:2026 conformity. The new TCC method checks entire entered current ranges (not just selected points) with source-labelled manufacturer envelopes and no extrapolation or manufacturer approval. Documented time-domain phasor I²t integrates externally supplied symmetrical source-current histories only (no DC offset or device-duty certification). A separately documented AC+DC waveform study integrates explicitly supplied piecewise phasors and source-specific DC time constants with a specified fault inception angle and ZERO_PRIOR_CURRENT pre-fault assumption; it does not derive machine decrement or IEC 60909 equivalent thermal duty. Neither represents all requirements for a complete approved IEC or construction study; no breaker, PPE or ampacity label is generated.</p><label for="fcs-method-mode"><b>Select method</b></label><select id="fcs-method-mode"><option value="fault">Single-source 3φ fault and peak screening</option><option value="multisource">Multi-source 3φ network with optional fault Z (beta)</option><option value="multivoltage">Multi-voltage 3φ transformer and sources (beta)</option><option value="transformer60909">IEC 60909 nameplate transformer max/min 3φ fault screen</option><option value="sequence">Reduced-sequence unsymmetrical faults</option><option value="multisequence">Multi-bus 3-sequence faults (3PH / AG / BC / BCG beta)</option><option value="multienvelope">User-defined multi-bus min/max fault envelope (beta)</option><option value="contingency">Balanced AC N−1 branch-outage screening (beta)</option><option value="peakscreen">3φ network peak-making Method C screen (beta)</option><option value="faultsweep">Multi-bus fault location/type sweep (beta)</option><option value="thermal">IEC 60287 steady-state cable core equation</option><option value="resistance">IEC 60287 AC conductor resistance</option><option value="buried">IEC 60287 single-core direct burial geometry + grouping</option><option value="protectionrange">OEM-entered TCC full fault-range coordination (beta)</option><option value="phasorduty">Documented source phasor I²t duty (beta)</option><option value="acdcwave">Documented AC+DC waveform and I²t (beta)</option></select><p><label for="fcs-method-input"><b>Documented calculation inputs (JSON)</b></label></p><textarea id="fcs-method-input" spellcheck="false"></textarea><div><button data-method="run">Calculate documented case</button><button data-method="example">Restore illustrative inputs</button><button data-method="finite">Try finite 3φ fault impedance</button><button data-method="export">Export result JSON</button><button data-method="xlsx">Export Excel study report</button><button data-method="pdf">Export PDF study report</button></div><div class="fcs-advanced-cases" style="margin-top:12px;border-top:1px solid #b5c6d1;padding-top:10px"><strong>Documented input cases — browser-local, separate from project backups</strong><div style="display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin-top:8px"><input id="fcs-method-save-name" maxlength="120" aria-label="Case name" placeholder="Case name for saving inputs" style="flex:1 1 210px;padding:7px;max-width:100%"><button data-method="savecase">Save inputs locally</button></div><div style="display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin-top:7px"><select id="fcs-method-saved" aria-label="Previously saved method inputs" style="min-width:180px;max-width:100%;flex:1 1 200px"></select><button data-method="loadcase">Reopen inputs</button></div><div style="margin-top:7px"><button data-method="exportcases">Download input-case archive</button><button data-method="importcases">Import input-case archive (merge only)</button><input type="file" id="fcs-method-import-file" accept=".json,application/json" hidden></div><small>Reopened cases must be recalculated before PDF/Excel reporting. Import never deletes or overwrites project, draft, Cloud Vault or existing case records.</small></div><p role="status" id="fcs-method-status"></p><pre id="fcs-method-output">No calculation yet.</pre></section>`;document.body.append(o);
 const sel=o.querySelector('#fcs-method-mode'),input=o.querySelector('#fcs-method-input'),status=o.querySelector('#fcs-method-status'),result=o.querySelector('#fcs-method-output');let last=null;
 const saved=o.querySelector('#fcs-method-saved'),nameField=o.querySelector('#fcs-method-save-name'),importFile=o.querySelector('#fcs-method-import-file');
 const notice=(message,failed=false)=>{status.textContent=message;status.style.color=failed?'#b22020':'#1b693c'};
 function refreshAdvancedCases(selected){
  saved.replaceChildren();let list;
  try{list=readAdvancedInputCases(localStorage)}catch(e){saved.add(new Option('Saved case list unavailable',''));notice(e.message,true);return;}
  saved.add(new Option(list.length?'Select one of '+list.length+' saved cases':'No saved cases',''));
  for(const row of [...list].reverse())saved.add(new Option(row.name+' · '+row.method+' · '+row.createdAt.slice(0,10),row.id));
  if(selected&&list.some(x=>x.id===selected))saved.value=selected;
 }
 importFile.onchange=async()=>{
  const file=importFile.files?.[0];if(!file)return;
  try{if(file.size>3000000||file.size<20)throw Error('Input-case archive must be a nonempty JSON file up to 3 MB.');
   const archive=JSON.parse(await file.text()),merged=mergeAdvancedInputArchive(localStorage,archive);refreshAdvancedCases();notice('Archive verified. Added '+merged.added+' input cases; '+merged.total+' total. Existing cases and active calculation were not overwritten.');}
  catch(e){notice('Input-case import blocked: '+e.message,true);}finally{importFile.value='';}
 };
 refreshAdvancedCases();

 function restore(){if(sel.value==='peakscreen')input.value=JSON.stringify(examples.multisource,null,2);else if(sel.value==='faultsweep'){const x=structuredClone(examples.multisequence);x.faultBuses=['F','A','B'];x.faultTypes=['3PH','AG','BC','BCG'];input.value=JSON.stringify(x,null,2)}else if(sel.value==='multienvelope'){const x=structuredClone(examples.multisequence),hi=structuredClone(x),lo=structuredClone(x);hi.voltageFactor=1.1;lo.voltageFactor=.95;lo.sources[1].emScale=.87;input.value=JSON.stringify({studyBasis:'Illustrative two-case envelope, NOT certified utility maximum/minimum IEC 60909 operating conditions.',scenarios:[{id:'example_high',sourceReference:'illustrative-source-conditions-A',network:hi},{id:'example_low',sourceReference:'illustrative-source-conditions-B',network:lo}]},null,2)}else input.value=JSON.stringify(examples[sel.value],null,2);last=null;result.textContent='Illustrative inputs only; substitute reviewed equipment values.';status.textContent=''}restore();sel.onchange=restore;
 const close=()=>o.dataset.open='false';open.onclick=()=>o.dataset.open='true';o.onclick=e=>{if(e.target===o)close()};document.addEventListener('keydown',e=>{if(e.key==='Escape'&&o.dataset.open==='true')close()});
 o.addEventListener('click',e=>{const btn=e.target.closest('button[data-method]');if(!btn)return;const action=btn.dataset.method;
  if(action==='close')return close();if(action==='example')return restore();if(action==='finite'){if(sel.value!=='multisource'){status.textContent='Select Multi-source 3φ network before loading the finite-fault example.';return}const demo=structuredClone(examples.multisource);demo.faultImpedance={rOhm:0.04,xOhm:0.07};input.value=JSON.stringify(demo,null,2);last=null;result.textContent='Illustrative finite-impedance fault inputs. Replace with documented installation values.';status.textContent='Explicit 3φ fault impedance loaded, in ohms at the listed voltage level.';return}
  if(action==='savecase'){
   try{const title=nameField.value.trim()||(sel.options[sel.selectedIndex]?.textContent||sel.value)+' · '+new Date().toISOString().slice(0,16);const savedCase=saveAdvancedInputCase(localStorage,{method:sel.value,inputJson:input.value,name:title});refreshAdvancedCases(savedCase.id);notice('Documented input case saved locally. Calculated results are not treated as certified or permanently current.');}
   catch(e){notice('Cannot save input case: '+e.message,true);}return;
  }
  if(action==='loadcase'){
   try{const row=readAdvancedInputCases(localStorage).find(x=>x.id===saved.value);if(!row)throw Error('Choose an existing saved input case.');
    sel.value=row.method;input.value=row.inputJson;nameField.value=row.name;last=null;result.textContent='Saved documented inputs reopened. Recalculate before any PDF/Excel export.';notice('Reopened '+row.name+' without changing active project or Cloud Vault. Recalculate to produce a new result.');}
   catch(e){notice('Cannot reopen input case: '+e.message,true);}return;
  }
  if(action==='exportcases'){
   try{const archive=advancedInputCaseArchive(localStorage);if(!archive.cases.length)throw Error('No saved input cases to export.');
    const blob=new Blob([JSON.stringify(archive,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='fault-studio-documented-input-cases-v1.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);notice('Input-case archive prepared; confirm your browser saved the JSON file.');}
   catch(e){notice('Archive export blocked: '+e.message,true);}return;
  }
  if(action==='importcases'){importFile.click();return;}
  if(action==='run'){try{if(input.value.length>150000)throw Error('Input is oversized');const data=JSON.parse(input.value);const out=sel.value==='transformer60909'?transformerNameplateFaultEnvelope(data):sel.value==='protectionrange'?sweepProtectionCoordination(data):sel.value==='acdcwave'?documentedAsymmetricalWaveformDuty(data):sel.value==='phasorduty'?timeVaryingSymmetricalFaultDuty(data):sel.value==='fault'?radialSourceFault(data):sel.value==='multisource'?multiSourceThreePhaseFault(data):sel.value==='multivoltage'?multiVoltageThreePhaseFault(data):sel.value==='multisequence'?multiBusSequenceFault(data):sel.value==='multienvelope'?faultScenarioEnvelope(data):sel.value==='contingency'?screenBalancedNMinusOne(data):sel.value==='peakscreen'?peakMakingNetworkScreen(data):sel.value==='faultsweep'?faultBusSweep(data):sel.value==='sequence'?reducedSequenceFault(data):sel.value==='resistance'?conductorACResistanceIEC60287(data):sel.value==='buried'?directBuriedSingleCoreRating(data):thermalSteadyCore(data);last={method:sel.value,inputs:data,outputs:out,createdAt:new Date().toISOString()};result.textContent=JSON.stringify(out,null,2);status.textContent='Bounded study calculated. This is not standards-compliance or equipment-duty certification.';status.style.color='#1b693c'}catch(err){last=null;result.textContent='NO RESULT';status.textContent='Calculation blocked: '+err.message;status.style.color='#b22020'}return;}
  if(action==='xlsx'||action==='pdf'){
    if(!last){status.textContent='Run a valid calculation before exporting a report.';status.style.color='#b22020';return;}
    try{const blob=advancedStudyReportBlob(last,action);const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='fault-studio-'+last.method+'-documented-study.'+action;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);status.textContent='Documented '+action.toUpperCase()+' report prepared and download requested. Confirm it was saved by your browser.';status.style.color='#1b693c';}
    catch(err){status.textContent='Report export blocked: '+err.message;status.style.color='#b22020';}
    return;
  }
  if(action==='export'){if(!last){status.textContent='Run a valid calculation before export.';return}const href=URL.createObjectURL(new Blob([JSON.stringify(last,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=href;a.download='fault-studio-iec-'+sel.value+'-bounded-beta.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),2000);status.textContent='Calculation and entered parameters downloaded.';}
 });
}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install()}
