/*
 * Fault Current Studio — Batch 02: explicit two-device IEC inverse-time coordination SCREEN.
 * Device current at each CT is user-entered independently. Nothing in the SLD
 * implicitly supplies a relay current. No manufacturer tolerance, CT saturation,
 * fuse band, or permitted settings are inferred. Never a commissioning study.
 */
import {iecInverseTime,IEC_INVERSE_CURVES} from './operating-studies.mjs?v=20261024-batch01';
const valid=x=>typeof x==='number'&&Number.isFinite(x);
const issue=message=>{throw new Error('Protection screening: '+message)};
export const MAX_TCC_POINTS=160;
export const PROTECTION_NUMBER_FIELDS=Object.freeze(['ctPrimaryA','ctSecondaryA','pickupSecondaryA','tms','breakerTimeS','instantPickupSecondaryA','instantDelayS']);
export const PROTECTION_TOP_FIELDS=Object.freeze(['downstreamPrimaryA','upstreamPrimaryA','requiredMarginS']);
export function validateProtectionSettings(input){
 if(input===undefined||input===null)return;
 if(!input||typeof input!=='object'||Array.isArray(input))issue('invalid protection settings object');
 for(const [key,value] of Object.entries(input)){
  if(PROTECTION_TOP_FIELDS.includes(key)){if(value!==null&&(!valid(value)||value<0||value>1e9))issue(key+': invalid numerical value');continue;}
  if(!['downstream','upstream'].includes(key))issue('unknown protection setting '+key);
  if(value===null)continue;
  if(typeof value!=='object'||Array.isArray(value))issue(key+': invalid device settings');
  for(const [k,v] of Object.entries(value)){
   if(k==='curve'){if(v!==''&&!Object.hasOwn(IEC_INVERSE_CURVES,v))issue(key+': unknown curve');continue;}
   if(['manufacturerModel','manufacturerSource','manufacturerRevision','manufacturerCurveCsv'].includes(k)){if(typeof v!=='string'||v.length>(k==='manufacturerCurveCsv'?12000:1000))issue(key+': invalid manufacturer curve field '+k);continue;}
   if(!PROTECTION_NUMBER_FIELDS.includes(k)||v!==null&&(!valid(v)||v<0||v>1e9))issue(key+': invalid '+k);
  }
 }
}
function deviceSettings(data,name){
 if(!data||typeof data!=='object')issue(name+': device data is required');
 if(!Object.hasOwn(IEC_INVERSE_CURVES,data.curve))issue(name+': select IEC nominal curve');
 for(const key of ['ctPrimaryA','ctSecondaryA','pickupSecondaryA','tms','breakerTimeS'])if(!valid(data[key])||(key==='breakerTimeS'?data[key]<0:data[key]<=0))issue(name+': documented '+key+' required');
 // Validation of current transformer output rating is intentionally generic;
 // this does NOT evaluate CT saturation, protection class, thermal ratio or wiring.
 if(data.ctPrimaryA/data.ctSecondaryA>1e7)issue(name+': CT ratio beyond screening range');
 const one=data.instantPickupSecondaryA,other=data.instantDelayS;
 if((one==null)!==(other==null))issue(name+': instantaneous pickup and delay must be specified together');
 if(one!=null&&(!valid(one)||one<=0||!valid(other)||other<0))issue(name+': invalid instantaneous settings');
 return data;
}
export function nominalDeviceTrip(device,primaryCurrentA,label='device'){
 const d=deviceSettings(device,label);
 if(!valid(primaryCurrentA)||primaryCurrentA<0)issue(label+': measured primary current must be nonnegative');
 const ctRatio=d.ctPrimaryA/d.ctSecondaryA,secondaryCurrentA=primaryCurrentA/ctRatio;
 const idmt=iecInverseTime({curve:d.curve,pickupA:d.pickupSecondaryA,currentA:secondaryCurrentA,tms:d.tms});
 const isInstant=d.instantPickupSecondaryA!=null&&secondaryCurrentA>=d.instantPickupSecondaryA;
 const instantS=isInstant?d.instantDelayS:null;
 const nominalRelayS= idmt.seconds==null?instantS:instantS==null?idmt.seconds:Math.min(instantS,idmt.seconds);
 const stage=nominalRelayS==null?'NOT_PICKED_UP':(instantS!=null&&instantS<= (idmt.seconds??Infinity))?'INSTANTANEOUS_STAGE':'INVERSE_STAGE';
 return {label,stage,ctRatio,secondaryCurrentA,primaryCurrentA,pickupMultiple:secondaryCurrentA/d.pickupSecondaryA,relayOperateS:nominalRelayS,breakerTimeS:d.breakerTimeS,clearingTimeS:nominalRelayS==null?null:nominalRelayS+d.breakerTimeS,model:'Nominal IEC inverse/instantaneous idealized arithmetic. Not physical CT accuracy, trip relay, circuit breaker, or coordination certification.'};
}
export function compareProtectionPair(config){
 validateProtectionSettings(config);
 if(!config)issue('downstream and upstream settings required');
 if(!valid(config.downstreamPrimaryA)||config.downstreamPrimaryA<=0||!valid(config.upstreamPrimaryA)||config.upstreamPrimaryA<=0)issue('enter separate actual primary current at both CTs');
 if(!valid(config.requiredMarginS)||config.requiredMarginS<0||config.requiredMarginS>60)issue('enter a documented project coordination margin (seconds)');
 const downstream=nominalDeviceTrip(config.downstream,config.downstreamPrimaryA,'downstream');
 const upstream=nominalDeviceTrip(config.upstream,config.upstreamPrimaryA,'upstream');
 const marginS=downstream.clearingTimeS===null||upstream.clearingTimeS===null?null:upstream.clearingTimeS-downstream.clearingTimeS;
 const status=downstream.clearingTimeS===null?'DOWNSTREAM_NO_TRIP':upstream.clearingTimeS===null?'UPSTREAM_NO_TRIP_MODELLED':marginS>=config.requiredMarginS?'NOMINAL_MARGIN_MET':'NOMINAL_MARGIN_NOT_MET';
 return {status,downstream,upstream,marginS,requiredMarginS:config.requiredMarginS,actualCurrentsIndependentlyEntered:true,scope:'Two explicitly entered CT primary currents. Nominal IEC curves and ideal instantaneous stage + entered breaker opening times only. Manufacturer tolerances, reset, pickup tolerance, CT saturation, fault-location current distribution, breaker trip-unit curves and arc-flash incident energy NOT evaluated.'};
}
export function generateNominalTCC(device,{startMultiple=1.05,endMultiple=30,points=60}={}){
 deviceSettings(device,'TCC');
 if(!valid(startMultiple)||startMultiple<=1||!valid(endMultiple)||endMultiple<=startMultiple||endMultiple>200||!Number.isInteger(points)||points<2||points>MAX_TCC_POINTS)issue('invalid TCC sampling range');
 const pickupPrimaryA=device.pickupSecondaryA*device.ctPrimaryA/device.ctSecondaryA;
 return Array.from({length:points},(_,i)=>{
   const multiple=startMultiple*Math.pow(endMultiple/startMultiple,i/(points-1)),primaryCurrentA=multiple*pickupPrimaryA;
   const trip=nominalDeviceTrip(device,primaryCurrentA,'TCC');
   return {multiple,primaryCurrentA,relayOperateS:trip.relayOperateS,clearingTimeS:trip.clearingTimeS,stage:trip.stage};
 });
}
export function nominalTccCsv(config){const comparison=compareProtectionPair(config);
 const a=generateNominalTCC(config.downstream),b=generateNominalTCC(config.upstream);
 const cells=[['WARNING','SCREENING ONLY. No manufacturer tolerances, CT saturation or real fault-current distribution.'],['Comparison',comparison.status],['Nominal coordination margin (s)',comparison.marginS??'UNDEFINED'],[],['Point','Downstream primary A','Downstream relay s','Downstream clear s','Downstream stage','Upstream primary A','Upstream relay s','Upstream clear s','Upstream stage']];
 for(let i=0;i<a.length;i++)cells.push([i+1,a[i].primaryCurrentA,a[i].relayOperateS??'',a[i].clearingTimeS??'',a[i].stage,b[i].primaryCurrentA,b[i].relayOperateS??'',b[i].clearingTimeS??'',b[i].stage]);
 return cells;
}
