/*
 * Fault Current Studio, candidate Batches 03B–08.
 * Pure, bounded engineering screening calculators. No manufacturer settings,
 * arc-flash incident energy, cable ampacity certification, or protection
 * approval is represented by these functions. No mutation of fault engine.
 */
import { compareProtectionPair } from './protection-study.mjs?v=20261024-batch02';
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const stop=x=>{throw Error('Advanced study input: '+x)};
function v(name,x,{min=0,max=1e12,allowZero=false}={}){if(!finite(x)||x<min||x>max||!allowZero&&x===0)stop(name+' must be a finite documented value in the allowed range');return x;}
function nonneg(name,x,max=1e12){return v(name,x,{min:0,max,allowZero:true})}
export const SCREEN_METHODS=Object.freeze({
 protection:'Nominal two-device IEC inverse curves and independently specified fault-through-CT currents; not certified selectivity',
 arc:'IEEE 1584-2018 data/applicability intake only; NO incident energy calculated',
 thermal:'Single-conductor, fixed-Rac lumped steady-state heat resistance I²R screen; not IEC 60287 current rating',
 harmonic:'RMS harmonic TDD arithmetic and independently supplied Thevenin-harmonic impedance; not IEEE 519 compliance',
 dc:'Resistive initial DC loop equivalent; not time-dependent battery or circuit-breaker DC duty',
 grounding:'GPR equals grid current times documented grid resistance; not touch/step permissible voltage study',
 motor:'Balanced locked-rotor Thevenin voltage divider; not accelerating motor-start time simulation',
 reliability:'Service interruption count arithmetic and topology-only N-1 connectivity; not a reliability prediction'
});
export function protectionCases({downstream,upstream,requiredMarginS,cases}){
 if(!Array.isArray(cases)||!cases.length||cases.length>200)stop('1–200 independent fault-current cases required');
 const rows=cases.map((r,i)=>{if(!r||typeof r!=='object')stop('missing current case');let result=compareProtectionPair({downstream,upstream,requiredMarginS,downstreamPrimaryA:v('downstream fault CT current',r.downstreamPrimaryA),upstreamPrimaryA:v('upstream fault CT current',r.upstreamPrimaryA)});return {caseId:String(r.caseId??i+1).slice(0,100),...result}});
 return {status:rows.every(r=>r.status==='NOMINAL_MARGIN_MET')?'ALL_NOMINAL_MARGINS_MET':'SOME_CASES_NOT_COORDINATED_OR_NOT_OPERATING',rows,method:SCREEN_METHODS.protection};
}
export function arcFlashIntake(x){
 if(!x||typeof x!=='object')stop('arc-flash case required');
 const voltageV=x.voltageV,phase=x.phaseModel,missing=[];
 if(phase!=='three-phase-ac')return {status:'OUTSIDE_IEEE_1584_SCOPE',incidentEnergyCalCm2:null,boundaryMm:null,missing:['Three-phase AC equipment only'],method:SCREEN_METHODS.arc};
 if(!finite(voltageV)||voltageV<208||voltageV>15000)return {status:'OUTSIDE_IEEE_1584_SCOPE',incidentEnergyCalCm2:null,boundaryMm:null,missing:['Documented 208–15000 V nominal voltage'],method:SCREEN_METHODS.arc};
 for(const [k,label] of Object.entries({boltedFaultKA:'Bolted fault current (kA)',workingDistanceMm:'Working distance (mm)',electrodeGapMm:'Actual electrode gap (mm)',enclosureHeightMm:'Enclosure height (mm)',enclosureWidthMm:'Enclosure width (mm)',enclosureDepthMm:'Enclosure depth (mm)',clearingTimeS:'Valid clearing time at actual arcing current (s)'}))if(!finite(x[k])||x[k]<=0)missing.push(label);
 if(!['VCB','VCBB','HCB','VOA','HOA'].includes(x.electrodeConfiguration))missing.push('Actual IEEE 1584 electrode configuration');
 return {status:missing.length?'DATA_INCOMPLETE':'DATA_READY_NO_APPROVED_ENGINE',missing,incidentEnergyCalCm2:null,boundaryMm:null,method:SCREEN_METHODS.arc};
}
export function thermalResistanceScreen(x){
 const I=v('actual load current A',x.loadCurrentA,{min:0,allowZero:true}),runs=v('number of actual equal parallel runs',x.runs,{min:1,max:10000});if(!Number.isSafeInteger(runs))stop('parallel runs must be an integer');
 const r=v('AC resistance ohm/metre at stated conductor temperature',x.racOhmPerM),R=v('documented effective external/internal thermal resistance K·m/W',x.thermalResistanceKmPerW),ambient=v('ambient °C',x.ambientC,{min:-90,max:250,allowZero:true}),limit=v('allowable conductor °C',x.limitC,{min:-90,max:350,allowZero:true});
 if(limit<=ambient)stop('conductor limit must exceed ambient');
 const each=I/runs,lossWPerM=each*each*r,estimatedConductorC=ambient+lossWPerM*R,maximumPerRunA=Math.sqrt((limit-ambient)/(r*R));
 return {status:estimatedConductorC<=limit+1e-9?'BELOW_SIMPLE_THERMAL_BOUND':'EXCEEDS_SIMPLE_THERMAL_BOUND',currentEachA:each,lossWPerM,estimatedConductorC,maximumTotalA:maximumPerRunA*runs,method:SCREEN_METHODS.thermal};
}
export function harmonicTDD(x){
 let IL=v('PCC maximum-demand fundamental current I_L (A)',x.demandCurrentA),items=x.harmonics;
 if(!Array.isArray(items)||items.length<1||items.length>100)stop('1–100 documented harmonic current orders required');
 let seen=new Set(),sum=0;for(const a of items){if(!a||!Number.isSafeInteger(a.order)||a.order<2||a.order>10000||seen.has(a.order))stop('invalid or duplicate harmonic order');seen.add(a.order);let I=nonneg('harmonic RMS current',a.currentA);sum+=I*I;}
 const totalHarmonicA=Math.sqrt(sum);return {status:'PCC_TDD_ARITHMETIC_ONLY',totalHarmonicA,tddPercent:100*totalHarmonicA/IL,method:SCREEN_METHODS.harmonic};
}
export function harmonicSingleBusVoltage(x){
 const fundamentalV=v('fundamental voltage RMS',x.fundamentalV),entries=x.harmonics;
 if(!Array.isArray(entries)||!entries.length||entries.length>100)stop('1–100 documented harmonic equivalents required');
 let seen=new Set(),square=0;const rows=[];
 for(const h of entries){if(!Number.isSafeInteger(h.order)||h.order<2||h.order>10000||seen.has(h.order))stop('duplicate/invalid harmonic order');seen.add(h.order);const current=nonneg('harmonic RMS current',h.currentA),R=nonneg('harmonic Thevenin resistance ohm',h.rOhm),X=nonneg('harmonic Thevenin reactance magnitude ohm',Math.abs(h.xOhm));if(!finite(h.xOhm))stop('harmonic reactance required');const vh=current*Math.hypot(R,X);square+=vh*vh;rows.push({order:h.order,voltageRmsV:vh});}
 return {status:'SINGLE_BUS_HARMONIC_EQUIVALENT_ONLY',voltageThdPercent:100*Math.sqrt(square)/fundamentalV,orders:rows,method:SCREEN_METHODS.harmonic};
}
export function dcLoopFault(x){const V=v('DC voltage',x.voltageV),r=v('documented source internal resistance',x.sourceResistanceOhm,{allowZero:true}),c=v('combined outgoing+return conductor resistance',x.conductorLoopOhm,{allowZero:true}),z=v('additional loop resistance',x.otherLoopOhm??0,{allowZero:true});if(r+c+z<=0)stop('total DC loop resistance cannot be zero');const A=V/(r+c+z);return {status:'RESISTIVE_DC_INITIAL_SCREENING',initialCurrentA:A,totalLoopResistanceOhm:r+c+z,sourcePowerW:A*A*r,method:SCREEN_METHODS.dc};}
export function idealBatteryRuntime(x){const Ah=v('nameplate Ah',x.nameplateAh),A=v('constant DC load A',x.constantLoadA),usable=v('explicit usable fraction (0 to 1)',x.usableFraction,{min:0,max:1});return {status:'IDEAL_AH_ARITHMETIC_ONLY',hours:Ah*usable/A,method:'Constant current idealised Ah arithmetic; no Peukert/temperature/aging/voltage cutoff/manufacturer discharge curve'};}
export function groundPotentialRise(x){const I=nonneg('documented ground-grid current A',x.gridCurrentA),R=v('measured/calculated grid resistance ohm',x.gridResistanceOhm);return {status:'GPR_ARITHMETIC_ONLY',volts:I*R,method:SCREEN_METHODS.grounding};}
export function motorStartDivider(x){const V=v('three-phase supply L-L voltage V',x.voltageLL),sr=nonneg('positive sequence source R ohm',x.sourceROhm),sx=nonneg('positive sequence source X ohm',x.sourceXOhm),mr=nonneg('documented locked rotor motor R ohm',x.motorLockedROhm),mx=nonneg('documented locked rotor motor X ohm',x.motorLockedXOhm);if(Math.hypot(mr,mx)===0||Math.hypot(sr+mr,sx+mx)===0)stop('locked-rotor impedance and total series impedance required');const A=V/Math.sqrt(3)/Math.hypot(sr+mr,sx+mx),motorPhaseV=A*Math.hypot(mr,mx),motorLLV=Math.sqrt(3)*motorPhaseV;return {status:'LOCKED_ROTOR_STATIC_SCREENING',startCurrentA:A,motorVoltageLLV:motorLLV,voltageDipPercent:100*(1-motorLLV/V),method:SCREEN_METHODS.motor};}
export function reliabilityIndices(x){const N=v('customers served',x.customersServed,{min:1,max:1e12}),yearHours=x.yearHours??8760;v('hours in observation year',yearHours,{min:1,max:8784});if(!Number.isSafeInteger(N))stop('customers served count must be integer');if(!Array.isArray(x.interruptions)||x.interruptions.length>50000)stop('interruptions array missing or over limit');let events=0,customerHours=0;for(const event of x.interruptions){if(!event)stop('invalid interruption event');const customers=nonneg('interrupted customer count',event.affectedCustomers,N),hours=nonneg('duration hours',event.durationHours,yearHours);if(!Number.isSafeInteger(customers))stop('affected customer count must be integer');events+=customers;customerHours+=customers*hours;}if(customerHours>N*yearHours+1e-9)stop('customer-hours exceed the maximum observation window; verify overlapping events and denominators');const SAIFI=events/N,SAIDI=customerHours/N;return {status:'OBSERVED_RELIABILITY_INDICES_ONLY',SAIFI,SAIDIhours:SAIDI,CAIDIhours:events?customerHours/events:null,ASAI:1-SAIDI/yearHours,method:SCREEN_METHODS.reliability};}
export function nMinusOneConnectivity({busIds,edges,sourceIds,loadIds}){
 if(!Array.isArray(busIds)||!Array.isArray(edges)||!Array.isArray(sourceIds)||!Array.isArray(loadIds)||!busIds.length||busIds.length>5000||edges.length>10000)stop('bounded, nonempty explicit N-1 network required');
 const all=new Set(busIds);if(all.size!==busIds.length||busIds.some(v=>typeof v!=='string'||v.length>160))stop('valid unique bus identities required');
 if(!sourceIds.length||!loadIds.length||[...sourceIds,...loadIds].some(v=>!all.has(v)))stop('explicit source and load bus identities required');
 const ids=new Set();for(const e of edges)if(!e||typeof e.id!=='string'||ids.has(e.id)||!all.has(e.from)||!all.has(e.to)||e.from===e.to)stop('duplicate/invalid branch identity or endpoints');else ids.add(e.id);
 const service=off=>{const adj=new Map(busIds.map(v=>[v,[]]));for(const e of edges)if(e.enabled!==false&&e.id!==off){adj.get(e.from).push(e.to);adj.get(e.to).push(e.from);}const seen=new Set(sourceIds),queue=[...sourceIds];for(let i=0;i<queue.length;i++)for(const node of adj.get(queue[i]))if(!seen.has(node)){seen.add(node);queue.push(node);}return loadIds.filter(id=>!seen.has(id));};
 const initiallyUnserved=service(null);const outages=edges.filter(e=>e.enabled!==false).map(e=>({outagedBranchId:e.id,newlyUnservedLoadIds:service(e.id).filter(id=>!initiallyUnserved.includes(id))}));return {status:initiallyUnserved.length?'BASELINE_LOADS_ALREADY_UNSERVED':outages.some(e=>e.newlyUnservedLoadIds.length)?'N_MINUS_ONE_TOPOLOGY_FAILURE':'N_MINUS_ONE_TOPOLOGY_PASSES',initiallyUnservedLoadIds:initiallyUnserved,outages,method:SCREEN_METHODS.reliability};
}
