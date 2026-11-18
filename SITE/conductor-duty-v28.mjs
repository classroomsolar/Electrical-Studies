/**
 * V28: source-documented adiabatic conductor short-circuit I²t screening.
 * Pure functions, no inferred manufacturer k, temperature coefficient, trip
 * curve, parallel current sharing, DC offset, non-adiabatic correction, or
 * standards compliance claim. All currents are per one physical conductor.
 *
 * Engineering identity: I²t <= (k S)², where S is conductor area (mm²) and
 * k is a documented material/temperature/insulation coefficient (A sqrt(s)/mm²).
 * An RMS envelope linear in time has exact integral over [t0,t1]:
 * Δt (I0² + I0 I1 + I1²) / 3.
 * Manufacturer reference: Schneider Electric M9F technical guide describes
 * thermal stress in A²s and permissible conductor stress by construction.
 * The k value MUST be supplied and verified for the exact conductor and
 * starting/final temperature; it is not derived by this bounded method.
 */
const fail=message=>{throw Error('Conductor thermal-duty screen: '+message)};
const num=(obj,key,lo,hi)=>{const x=obj?.[key];if(typeof x!=='number'||!Number.isFinite(x)||x<lo||x>hi)fail(key+' must be finite within '+lo+'..'+hi);return x};
const ref=(obj,key)=>{const s=obj?.[key];if(typeof s!=='string'||s.trim().length<12||s.length>350)fail('Document '+key+' as a traceable source reference (12–350 characters)');return s.trim()};
const keys=(obj,allowed,label)=>{if(!obj||typeof obj!=='object'||Array.isArray(obj))fail('Document '+label+' object');for(const key of Object.keys(obj))if(!allowed.includes(key))fail(label+' unexpected field '+key)};
const limits={base:['method','conductor','fault','marginFactor','studyReference'],conductor:['areaMm2','kASqrtSPerMm2','kSourceReference','material','initialTempC','maximumFaultTempC'],fault:['sourceReference','clearingTimeS','rmsA','samples','documentedI2tA2s'],sample:['timeS','rmsA']};
export const CONDUCTOR_DUTY_V28_SCOPE='One documented conductor, one fault interval, user-qualified adiabatic k-factor, exact integral of entered piecewise-linear RMS current trace or entered protective let-through I²t. This is a bounded thermal stress screen, NOT an IEC 60949 full calculation, NEC/IEC cable rating, protective coordination, or OEM equipment approval.';
export function screenConductorThermalDuty(x){
 keys(x,limits.base,'study');
 const method=x.method;if(!['constant-rms','linear-rms-trace','documented-i2t'].includes(method))fail('method must be constant-rms, linear-rms-trace or documented-i2t');
 const c=x.conductor,f=x.fault;keys(c,limits.conductor,'conductor');keys(f,limits.fault,'fault');
 const area=num(c,'areaMm2',.1,20000),k=num(c,'kASqrtSPerMm2',1,500),kSource=ref(c,'kSourceReference'),source=ref(f,'sourceReference'),studyRef=ref(x,'studyReference');
 if(!['copper','aluminium','other'].includes(c.material))fail('material must be copper, aluminium or other; no default k-factor is inferred');
 const start=num(c,'initialTempC',-60,300),finish=num(c,'maximumFaultTempC',-60,500);if(finish<=start)fail('maximumFaultTempC must exceed initialTempC');
 const margin=num(x,'marginFactor',1,10),duration=num(f,'clearingTimeS',.00001,30);
 let demand,peakEnteredRmsA,sourceKind;
 if(method==='constant-rms'){
  keys(f,['sourceReference','clearingTimeS','rmsA'],'constant fault');
  const current=num(f,'rmsA',0,1e8);demand=current*current*duration;peakEnteredRmsA=current;sourceKind='entered constant RMS';
 }else if(method==='documented-i2t'){
  keys(f,['sourceReference','clearingTimeS','documentedI2tA2s'],'documented I2t fault');
  demand=num(f,'documentedI2tA2s',0,1e18);peakEnteredRmsA=null;sourceKind='externally documented integrated conductor I²t';
 }else{
  keys(f,['sourceReference','clearingTimeS','samples'],'RMS trace fault');
  const samples=f.samples;if(!Array.isArray(samples)||samples.length<2||samples.length>2000)fail('RMS trace requires 2–2000 time samples');
  let previous=null;demand=0;peakEnteredRmsA=0;
  for(const [i,s] of samples.entries()){
   keys(s,limits.sample,'RMS sample '+i);
   const time=num(s,'timeS',0,30),rms=num(s,'rmsA',0,1e8);
   if(i===0&&time!==0)fail('RMS trace must start at t=0');
   if(previous){const dt=time-previous.time;if(dt<=1e-10)fail('RMS trace times must strictly increase');demand+=dt*(previous.rms**2+previous.rms*rms+rms**2)/3;}
   previous={time,rms};peakEnteredRmsA=Math.max(peakEnteredRmsA,rms);
  }
  if(Math.abs(previous.time-duration)>1e-9*Math.max(1,duration))fail('Last RMS sample must match the documented clearingTimeS');
  sourceKind='piecewise-linear documented RMS current envelope';
 }
 const capacity=(k*area)**2;if(!Number.isFinite(demand)||!Number.isFinite(capacity))fail('Numeric overflow; reduce inputs');
 const checked=demand*margin,util=checked/capacity;
 return {status:'BOUNDED_DOCUMENTED_ADIABATIC_CONDUCTOR_I2T_SCREEN',scope:CONDUCTOR_DUTY_V28_SCOPE,method,conductorMaterial:c.material,conductorAreaMm2:area,initialConductorTempC:start,maximumFaultConductorTempC:finish,enteredKASqrtSPerMm2:k,kSourceReference:kSource,faultSourceReference:source,studyReference:studyRef,clearingTimeS:duration,sourceKind,enteredPeakRmsA:peakEnteredRmsA,documentedFaultI2tA2s:demand,adiabaticCapacityA2s:capacity,marginFactor:margin,marginAdjustedDemandA2s:checked,utilizationPercent:100*util,minimumAreaMm2ForEnteredDemand:Math.sqrt(checked)/k,maximumConstantRmsAForClearingTime:Math.sqrt(capacity/(margin*duration)),withinEnteredAdiabaticCapacity:checked<=capacity,limitations:['One physical conductor only; multiple parallel runs need independently verified fault current distribution','Entered k is NOT derived or verified: material, insulation, initial and maximum temperatures and relevant standard edition must be confirmed by a qualified engineer','Current RMS trace is assumed piecewise-linear between samples; waveform/DC offset/limiting effects are NOT inferred','Documented I²t must be for the same physical conductor and entire clearing interval; device trip time and let-through are NOT calculated','Adiabatic only: no non-adiabatic corrections, adjacent heating, cable joints/terminations or sheath/armour stress','Passing this screen is not cable sizing, installation compliance, or protective-device approval']};
}
