/**
 * Fault Current Studio public v10: two bounded arithmetic components.
 * Explicitly NOT a complete IEC 60909 / IEC 60287 / IEEE 1584 engine.
 * Nothing from this file changes the existing Studio fault engine or saved studies.
 */
const ok=(x)=>typeof x==='number'&&Number.isFinite(x);
const fail=(s)=>{throw Error(s)};
function val(o,key,lo,hi,zero=false){
 const x=o?.[key];if(!ok(x)||x<lo||x>hi||(!zero&&x===0))fail('Document a finite '+key+' within '+lo+'…'+hi);return x;
}
const sq=x=>x*x;
export const IEC_60909_RADIAL_SCOPE='IEC 60909-0:2026 single equivalent-voltage-source, symmetrical initial three-phase current and radial equivalent-R/X peak screening; not a full IEC 60909 calculation. No distributed source, inverter, generator/motor decrement, meshed network, corrections, min/max case selection, fault impedance or interrupting duty certification.';
/** Only one radial source and explicitly provided reduced positive-sequence impedances.
 * `voltageFactor` must be obtained by user for relevant voltage/tolerance case;
 * it is NOT inferred from nominal voltage. Impedances are referred to the
 * actual fault voltage base, including any transformer ratio correction.
 */
export function radialSourceFault(x){
 if(!x||Array.isArray(x)||typeof x!=='object')fail('Provide the documented radial fault case');
 const V=val(x,'nominalLLV',1,550000),c=val(x,'voltageFactor',0.5,1.5),f=val(x,'frequencyHz',45,65);
 if(!Array.isArray(x.seriesImpedances)||!x.seriesImpedances.length||x.seriesImpedances.length>60)fail('Enter 1–60 actual radial source and branch impedances');
 const seen=new Set();let R=0,X=0;
 for(const e of x.seriesImpedances){
  if(!e||typeof e.id!=='string'||!e.id||e.id.length>100||seen.has(e.id))fail('Every impedance requires a unique ID');seen.add(e.id);
  const r=val(e,'rOhm',0,1e8,true),z=val(e,'xOhm',0,1e8,true);
  if(r===0&&z===0)fail(e.id+': zero impedance needs documented nonzero source');R+=r;X+=z;
 }
 if(X<=0)fail('Positive total reactance required for the radial IEC-style peak factor');
 const totalZ=Math.hypot(R,X);if(totalZ<=0||!Number.isFinite(totalZ))fail('Invalid net equivalent impedance');
 const initialSymmetricalA=c*V/(Math.sqrt(3)*totalZ);
 if(initialSymmetricalA>1e9)fail('Computed current outside numerical bounds; check actual impedances');
 const rx=R/X,kappa=1.02+0.98*Math.exp(-3*rx),peakA=kappa*Math.SQRT2*initialSymmetricalA;
 const cases=x.dcTimesS===undefined?[0.01,0.02,0.05]:x.dcTimesS;
 if(!Array.isArray(cases)||cases.length>30||cases.some(v=>!ok(v)||v<0||v>10))fail('Enter 0–30 nonnegative DC-component times up to 10 seconds');
 return {status:'BOUNDED_SINGLE_RADIAL_SOURCE_SCREEN',method:IEC_60909_RADIAL_SCOPE,nominalLLV:V,voltageFactor:c,frequencyHz:f,
  totalROhm:R,totalXOhm:X,impedanceMagnitudeOhm:totalZ,rxRatio:rx,initialSymmetricalA,
  initialSymmetricalKA:initialSymmetricalA/1000,kappa,peakA,peakKA:peakA/1000,
  initialShortCircuitMVA:Math.sqrt(3)*V*initialSymmetricalA/1e6,
  decayingDC:cases.map(seconds=>({seconds,dcOffsetMagnitudeA:Math.SQRT2*initialSymmetricalA*Math.exp(-2*Math.PI*f*seconds*rx)})),
  missingForFullStandard:['IEC 60909 source and equipment factors','full positive, negative and zero sequence network','voltage-factor choice','all DER and motor contributions','near-generator breaking-time decrement','breaker making and breaking duty','meshed peak factors','fault location/case validation']};
}
export const IEC_60287_THERMAL_SCOPE='IEC 60287-1-1 steady-state AC core rating equation using explicitly precomputed Rac, T1…T4, dielectric Wd and lambda loss factors. NOT a complete IEC 60287 design: no self-calculated thermal environment, thermal resistivity, AC skin/proximity, sheath circulating losses, trefoil grouping, solar drying, soil moisture, cable construction corrections or 60853 cyclic rating.';
/** Thermal resistances in K.m/W, Rac in ohm/m at highest conductor temp;
 * per-conductor dielectric loss W/m; n equally loaded cores IN SAME cable.
 * Each loss factor lambda1, lambda2 relative to all conductor I^2R losses.
 */
export function thermalSteadyCore(x){
 if(!x||Array.isArray(x)||typeof x!=='object')fail('Provide the documented thermal case');
 const ambient=val(x,'ambientC',-90,250,true),limit=val(x,'conductorLimitC',-50,350,true);
 if(limit<=ambient)fail('Maximum conductor temperature must exceed ambient');
 const R=val(x,'racOhmPerM',1e-12,100),n=val(x,'loadedConductors',1,6);
 if(!Number.isSafeInteger(n))fail('loadedConductors must be an integer');
 const t1=val(x,'t1KmPerW',0,1e5,true),t2=val(x,'t2KmPerW',0,1e5,true),t3=val(x,'t3KmPerW',0,1e5,true),t4=val(x,'t4KmPerW',0,1e5,true);
 const wd=val(x,'dielectricLossWPerM',0,1e5,true),lam1=val(x,'sheathLossFactor',0,1e5,true),lam2=val(x,'armourLossFactor',0,1e5,true);
 const delta=limit-ambient;
 const dielectricThermalCoeff=0.5*t1+n*(t2+t3+t4);
 const copperThermalCoeff=R*t1+n*R*(1+lam1)*t2+n*R*(1+lam1+lam2)*(t3+t4);
 if(copperThermalCoeff<=0)fail('Thermal conduction path is undefined');
 const dielectricTemperatureRise=wd*dielectricThermalCoeff,remaining=delta-dielectricTemperatureRise;
 if(remaining<=0)fail('Dielectric losses consume the full temperature allowance; no positive ampacity');
 const ratedCurrentA=Math.sqrt(remaining/copperThermalCoeff);
 const load=Object.hasOwn(x,'loadCurrentA')?val(x,'loadCurrentA',0,1e8,true):null;
 const predictedTempAtFixedR=load===null?null:ambient+dielectricTemperatureRise+sq(load)*copperThermalCoeff;
 return {status:'BOUNDED_IEC_60287_CORE_EQUATION',method:IEC_60287_THERMAL_SCOPE,ratedCurrentA,
  continuousPerConductorA:ratedCurrentA,conductorTemperatureRiseAllowanceC:delta,
  dielectricTemperatureRiseC:dielectricTemperatureRise,conductorHeatingCoefficient:copperThermalCoeff,
  enteredLoadCurrentA:load,approxConductorCAtFixedRatedR:predictedTempAtFixedR,
  loadingPercent:load===null?null:100*load/ratedCurrentA,
  withinEnteredCoreRating:load===null?null:load<=ratedCurrentA,
  missingForFullStandard:['Temperature-adjusted AC resistance including skin/proximity','IEC 60287-2 installation thermal resistances','Metal sheath and armour loss factors','Parallel cable/grouping and mutual heating','Solar radiation and soil moisture','Manufacturer cable temperature/dielectric loss parameters','Validated operating power-flow current']};
}
