import {manufacturerRecords} from './manufacturer-catalog.mjs?v=20261022-pv-final';
export const SINGLE_PHASE_FAULT='single-ll';
export const isSinglePhase=p=>p?.settings?.faultType===SINGLE_PHASE_FAULT;
export const hasBranchCurrents=p=>['3phase','3phase-ground','dc','split-l1-n','split-l2-n','split-l1-g','split-l2-g'].includes(p?.settings?.faultType)||isSinglePhase(p)||p?.settings?.sequenceModel==='connected'&&['ll','slg','dlg'].includes(p?.settings?.faultType);
export const cableLoopFactor=e=>e.loopImpedanceBasis==='matched-conductors'?2:1;
export const singlePhaseScope='Single/split-phase full-winding L1–L2 loop only. Bus voltages are full winding voltages; neutral, half-winding, ground faults and machine/inverter controls are not calculated.';
export function singlePhaseInputLabel(p,item,field){
 if(!isSinglePhase(p))return null;
 const retained={primaryConnection:'primary winding',secondaryConnection:'secondary winding',grounding:'grounding',neutralR:'neutral resistance',neutralX:'neutral reactance'};
 if(item.kind==='transformer'&&retained[field])return 'Retained '+retained[field]+' (not used in L1–L2 mode)';
 if(field==='faultA')return item.singlePhaseBasis==='documented-loop'?'Entered two-wire RMS fault current':item.singlePhaseBasis==='threephase-ll'?'Entered three-phase utility RMS fault current':'Entered RMS fault current (utility basis required)';
 if(item.kind==='cable'&&['rPerM','xPerM'].includes(field))return (item.loopImpedanceBasis==='documented-loop'?'Complete cable loop ':'Cable per-conductor ')+(field==='rPerM'?'resistance':'reactance');
 if(['utility','other','otherSource'].includes(item.kind)&&['r','x'].includes(field))return 'Source complete-loop '+(field==='r'?'resistance':'reactance');
 if(field==='faultMVA')return 'Entered single-phase short-circuit power';
 return null;
}
const active=(s,p)=>s.enabled!==false&&(p.settings.scenario!=='maximum'||s.maxInclude!==false)&&(p.settings.scenario!=='minimum'||s.minInclude!==false)&&((p.settings.scenario==='maximum'?s.maxStrength:p.settings.scenario==='minimum'?s.minStrength:1)!==0);
export function singlePhaseIssues(p){
 const issues=[],add=(id,message,severity='error')=>issues.push({id,message,severity}),single=isSinglePhase(p);
 for(const s of p.sources){
  if(!active(s,p))continue;
  if(!single){if(s.singlePhaseBasis==='documented-loop')add(s.id,s.name+': two-wire source data cannot be used as three-phase data. Select Single/split-phase L1–L2 or supply documented three-phase source data.');continue;}
  if(!['utility','other','otherSource'].includes(s.kind)||s.model==='current'){add(s.id,s.name+': single-phase mode currently requires a documented utility/voltage-source loop. Machine and inverter fault controls are not modeled.');continue;}
  if(!['documented-loop','threephase-ll'].includes(s.singlePhaseBasis))add(s.id,s.name+': choose the utility input basis. Phase-to-neutral supply requires documented loop current or R/X; three-phase kA alone is insufficient.');
  if(s.singlePhaseBasis==='threephase-ll'&&(s.method!=='ka'||p.settings.assumeZ2!==true))add(s.id,s.name+': the three-phase utility conversion requires kA data, a primary supplied across two utility phases, and explicit Z2 = Z1 screening.');
 }
 for(const e of p.branches){
  if(e.enabled===false||e.deviceId&&p.devices.find(d=>d.id===e.deviceId)?.enabled===false)continue;
  if(e.kind==='transformer'){
   if(single){if(e.phaseRating!=='single')add(e.id,e.name+': select the single-phase nameplate basis and enter full winding voltage and full kVA.');const phases=e.db?.originalValues?.Phases??e.db?.originalValues?.phases??(e.db?.origin==='manufacturer'?manufacturerRecords.find(r=>r.id===e.db.id)?.referenceOnlyFields?.phases:undefined);if(phases!=null&&Number(phases)!==1)add(e.id,e.name+': the selected workbook transformer is not single-phase. Select an actual single-phase record or use documented nameplate data.');}
   else if(e.phaseRating==='single')add(e.id,e.name+': a single-phase transformer cannot be used in the three-phase sequence model. Choose Single/split-phase L1–L2.');
  }
  if(e.kind==='cable'){
   if(single&&e.length>0){if(!['documented-loop','matched-conductors'].includes(e.loopImpedanceBasis))add(e.id,e.name+': choose documented complete loop R/X or the explicit two-conductor R/X screen.');else if(e.loopImpedanceBasis==='matched-conductors')add(e.id,e.name+': outgoing and return conductor R/X are each included. This equal-conductor screen needs actual loop geometry and cable data review.','warning');}
   else if(!single&&e.loopImpedanceBasis==='documented-loop')add(e.id,e.name+': complete two-wire loop R/X cannot be used as three-phase per-conductor R1/X1.');
  }
 }
 if(single)add('settings',singlePhaseScope,'warning');
 return issues;
}
export function singlePhaseSourceImpedance(s,zFromMagnitude){
 if(s.method==='impedance')return {r:s.r,i:s.x};
 const magnitude=s.singlePhaseBasis==='threephase-ll'?2*s.voltage/(Math.sqrt(3)*s.faultA):s.method==='mva'?s.voltage**2/(s.faultMVA*1e6):s.voltage/s.faultA;
 return zFromMagnitude(magnitude,s.xr);
}
