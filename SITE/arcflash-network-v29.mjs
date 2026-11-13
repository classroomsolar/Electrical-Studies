/**
 * V29 additive study: IEEE 1584-2018 arc flash at every bus of the open Studio network.
 *
 * - Bolted three-phase fault current per bus comes from the existing Studio engine
 *   (a copy of the project is solved with faultType 3phase and zero fault impedance).
 * - Arc-flash method is ieee1584-2018.mjs (verified against Annex D and 105,120 official cases).
 * - Typical gaps, enclosure sizes and working distances are IEEE 1584-2018 Tables 8 and 10
 *   (as tabulated in the MIT-licensed arcflash-calc project). They are defaults only.
 * - Clearing times are NEVER assumed: each bus needs documented full- and reduced-current
 *   clearing times from the protective-device study, or it is reported as "CLEARING TIMES REQUIRED".
 * - Pure function: the caller's project is never modified.
 */
import {ieee1584Calculate} from './ieee1584-2018.mjs';
import {arcFlashClearingTimes,describeDevice} from './clearing-time-v29.mjs?v=20261108-v29e';
export const AF_NETWORK_V29={id:'ieee1584-network-arcflash-v29',version:'29.0.0'};

// IEEE 1584-2018 Table 8 (typical gaps) and Table 10 (typical enclosure size, working distance)
export const EQUIPMENT_CLASSES={
 '15kV Switchgear':{gapMM:152,heightMM:1143,widthMM:762,depthMM:762,workingDistanceMM:914.4},
 '15kV MCC':{gapMM:152,heightMM:914.4,widthMM:914.4,depthMM:914.4,workingDistanceMM:914.4},
 '5kV Switchgear':{gapMM:104,heightMM:914.4,widthMM:914.4,depthMM:914.4,workingDistanceMM:914.4},
 '5kV Switchgear (2)':{gapMM:104,heightMM:1143,widthMM:762,depthMM:762,workingDistanceMM:914.4},
 '5kV MCC':{gapMM:104,heightMM:660.4,widthMM:660.4,depthMM:660.4,workingDistanceMM:914.4},
 'LV Switchgear':{gapMM:32,heightMM:508,widthMM:508,depthMM:508,workingDistanceMM:609.6},
 'LV MCC (Shallow)':{gapMM:25,heightMM:355.6,widthMM:304.8,depthMM:100,workingDistanceMM:457.2},
 'LV Panelboard (Shallow)':{gapMM:25,heightMM:355.6,widthMM:304.8,depthMM:100,workingDistanceMM:457.2},
 'LV MCC':{gapMM:25,heightMM:355.6,widthMM:304.8,depthMM:250,workingDistanceMM:457.2},
 'LV Panelboard':{gapMM:25,heightMM:355.6,widthMM:304.8,depthMM:250,workingDistanceMM:457.2},
 'Cable Junction Box (Shallow)':{gapMM:13,heightMM:355.6,widthMM:304.8,depthMM:100,workingDistanceMM:457.2},
 'Cable Junction Box':{gapMM:13,heightMM:355.6,widthMM:304.8,depthMM:250,workingDistanceMM:457.2}
};
/**
 * Protective devices drawn on the one-line (breaker, fuse, recloser) that interrupt the fault at a bus.
 * A device qualifies when opening its internal link cuts the bus off from at least one enabled source.
 * The nearest device that cuts off every source is preferred; otherwise the one carrying the largest share.
 * Share of the bolted fault current through the device comes from the Studio branch flows.
 */
// Topology of the live one-line, built once per project object: bridges (Tarjan, iterative), DFS entry/exit times and
// source-bus counts per subtree. A device link cuts sources from a bus only if it is a bridge; which side the bus is on
// follows from the DFS times. Same result as removing each device link and searching again, without the repeated searches.
const topologyCache=new WeakMap();
function lineTopology(project){
 if(topologyCache.has(project))return topologyCache.get(project);
 const devById=new Map((project.devices||[]).map(d=>[d.id,d]));
 const live=(project.branches||[]).filter(e=>e.enabled!==false&&(!e.deviceId||devById.get(e.deviceId)?.enabled!==false)&&e.from&&e.to);
 const adj=new Map();for(const e of live){(adj.get(e.from)||adj.set(e.from,[]).get(e.from)).push([e.to,e.id]);(adj.get(e.to)||adj.set(e.to,[]).get(e.to)).push([e.from,e.id])}
 const srcBuses=new Set((project.sources||[]).filter(x=>x.enabled!==false&&x.bus).map(x=>x.bus));
 const tin=new Map(),tout=new Map(),low=new Map(),comp=new Map(),srcSub=new Map(),bridgeChild=new Map(),compSrc=[];let time=0;
 for(const root of adj.keys()){if(tin.has(root))continue;const cid=compSrc.length;compSrc.push(0);
  const stack=[[root,null,0]];tin.set(root,time);low.set(root,time);time++;comp.set(root,cid);srcSub.set(root,srcBuses.has(root)?1:0);
  while(stack.length){const top=stack[stack.length-1],[u,viaEdge,k]=top,list=adj.get(u)||[];
   if(k<list.length){top[2]++;const [v,eid]=list[k];if(eid===viaEdge)continue;
    if(!tin.has(v)){tin.set(v,time);low.set(v,time);time++;comp.set(v,cid);srcSub.set(v,srcBuses.has(v)?1:0);stack.push([v,eid,0])}
    else low.set(u,Math.min(low.get(u),tin.get(v)));}
   else{stack.pop();tout.set(u,time);if(stack.length){const p=stack[stack.length-1][0];low.set(p,Math.min(low.get(p),low.get(u)));srcSub.set(p,srcSub.get(p)+srcSub.get(u));if(low.get(u)>tin.get(p))bridgeChild.set(viaEdge,u)}}}
  compSrc[cid]=srcSub.get(root);}
 const devs=(project.devices||[]).filter(d=>d.kind==='switchgear'&&['breaker','fuse','recloser'].includes(d.equipmentType)&&d.enabled!==false&&d.linkId);
 const liveById=new Map(live.map(e=>[e.id,e]));
 const t={adj,srcBuses,tin,tout,comp,srcSub,bridgeChild,compSrc,devs,liveById};topologyCache.set(project,t);return t;
}
export function oneLineProtection(project,result){
 const bus=result?.busId;if(!bus)return null;
 const T=lineTopology(project);
 const reachable=T.comp.has(bus)?T.compSrc[T.comp.get(bus)]:(T.srcBuses.has(bus)?1:0);if(!reachable)return {status:'NO SOURCE',candidates:[]};
 // hop distances from the faulted bus
 const d0=new Map([[bus,0]]),q=[bus];for(let i=0;i<q.length;i++)for(const [n] of T.adj.get(q[i])||[])if(!d0.has(n)){d0.set(n,d0.get(q[i])+1);q.push(n)}
 const flows=new Map((result.branchFlows||[]).map(f=>[f.id,Math.max(Math.abs(f.fromA||0),Math.abs(f.toA||0))]));
 const cands=[];
 for(const d of T.devs){const link=T.liveById.get(d.linkId);if(!link)continue;const child=T.bridgeChild.get(link.id);if(child===undefined||!T.comp.has(bus)||T.comp.get(child)!==T.comp.get(bus))continue;
  const inSub=T.tin.get(child)<=T.tin.get(bus)&&T.tin.get(bus)<T.tout.get(child),remaining=inSub?T.srcSub.get(child):reachable-T.srcSub.get(child);if(remaining===reachable)continue;
  const hops=Math.min(d0.get(link.from)??1e9,d0.get(link.to)??1e9),share=result.totalA>0&&flows.has(link.id)?Math.min(100,100*flows.get(link.id)/result.totalA):null;
  cands.push({deviceId:d.id,name:d.name,equipmentType:d.equipmentType,hops,isolatesAll:remaining===0,sharePercent:share})}
 cands.sort((a,b)=>(b.isolatesAll-a.isolatesAll)||(a.hops-b.hops)||((b.sharePercent??0)-(a.sharePercent??0)));
 return {status:cands.length?'FOUND':'NO PROTECTIVE DEVICE ON THE ONE-LINE',primary:cands[0]||null,candidates:cands};
}
export function defaultClassForVoltage(v){return v>5000?'15kV Switchgear':v>600?'5kV Switchgear':'LV Switchgear'}

const fin=x=>typeof x==='number'&&Number.isFinite(x);
const clone=x=>JSON.parse(JSON.stringify(x));
const fail=m=>{throw Error('Network arc flash: '+m)};

/** busInputs: { [busId]: {include, equipmentClass, electrodeConfiguration, gapMM?, workingDistanceMM?, heightMM?, widthMM?, depthMM?, clearingFullMS, clearingReducedMS, clearingSource} } */
// boundMode 'bracket': where the fault result is a SCREENING BOUND (inverter fault-current angle unknown), the true bolted
// current lies between max(0, total - 2 x unknown-angle inverter current) and the total. Incident energy is evaluated at both
// ends (each with its own clearing time from the device curve) and the higher energy is reported, marked as bracketed.
export function networkArcFlashStudy({project,calculateProject,busInputs={},oneLineDevices={},boundMode='review'}){
 if(typeof calculateProject!=='function')fail('Studio engine is not available.');
 if(!project||!Array.isArray(project.buses)||!project.buses.length)fail('open a Studio network with at least one bus.');
 if(project.settings?.faultType==='dc')fail('DC networks are outside IEEE 1584-2018.');
 const p=clone(project);p.settings={...p.settings,faultType:'3phase',faultR:0,faultX:0};
 const out=calculateProject(p),byBus=new Map((out.results||[]).map(r=>[r.busId,r]));
 const errors=(out.issues||[]).filter(i=>i.severity==='error');
 const rows=project.buses.map(b=>{
  let inp=busInputs[b.id]||{};const r=byBus.get(b.id),base={busId:b.id,busName:b.name,voltageV:b.voltage};
  if(inp.include===false)return {...base,status:'EXCLUDED'};
  if(!fin(b.voltage)||b.voltage<208||b.voltage>15000)return {...base,status:'OUTSIDE IEEE 1584-2018 VOLTAGE RANGE',note:'Model covers 208 V to 15 kV three-phase AC.'};
  if(!r||!fin(r.totalA)||r.totalA<=0)return {...base,status:'NO BOLTED FAULT CURRENT',note:r?.status||'Bus not solved'};
  const bracket=r.status==='SCREENING BOUND'&&boundMode==='bracket'&&fin(r.derBound)&&r.derBound>0;
  if(r.status!=='CALCULATED'&&!bracket)return {...base,boltedFaultA:r.totalA,status:'REVIEW: FAULT RESULT IS '+r.status,note:r.status==='SCREENING BOUND'?'Inverter fault-current angles are unknown, so the bus current is a bound. Enter the manufacturer angle, or tick “bracket bounded currents” to evaluate both ends of the bound.':'Resolve the fault study (for example unknown inverter angles) before arc-flash use.'};
  const cls=EQUIPMENT_CLASSES[inp.equipmentClass]?inp.equipmentClass:defaultClassForVoltage(b.voltage),d=EQUIPMENT_CLASSES[cls];
  const pick=(k,def)=>fin(inp[k])?inp[k]:def;
  const geometry={equipmentClass:cls,electrodeConfiguration:inp.electrodeConfiguration||'VCB',gapMM:pick('gapMM',d.gapMM),workingDistanceMM:pick('workingDistanceMM',d.workingDistanceMM),enclosureHeightMM:pick('heightMM',d.heightMM),enclosureWidthMM:pick('widthMM',d.widthMM),enclosureDepthMM:pick('depthMM',d.depthMM)};
  const ol=oneLineProtection(project,r);
  const withCurrentBase=boltedA=>({...base,boltedFaultA:boltedA,xr:fin(r.xr)?r.xr:null,geometry,oneLine:ol?{status:ol.status,primary:ol.primary,candidates:(ol.candidates||[]).slice(0,5)}:null});
  const useLinked=inp.deviceSource==='sld'||(inp.deviceSource==null&&!inp.device&&!(fin(inp.clearingFullMS)&&fin(inp.clearingReducedMS)));
  if(useLinked&&ol?.primary&&oneLineDevices[ol.primary.deviceId]){
   const set=oneLineDevices[ol.primary.deviceId];inp={...inp,device:{...set,sharePercent:fin(set.sharePercent)?set.sharePercent:(fin(ol.primary.sharePercent)?Math.max(1,Math.round(ol.primary.sharePercent*10)/10):100)},linkedDevice:ol.primary};
  }
  const evalAt=(boltedA,inp)=>{const withCurrent=withCurrentBase(boltedA);
  const ieeeIn=(full,red)=>({voltageKV:b.voltage/1000,boltedFaultKA:boltedA/1000,electrodeConfiguration:geometry.electrodeConfiguration,gapMM:geometry.gapMM,workingDistanceMM:geometry.workingDistanceMM,enclosureHeightMM:geometry.enclosureHeightMM,enclosureWidthMM:geometry.enclosureWidthMM,enclosureDepthMM:geometry.enclosureDepthMM,clearingFullMS:full,clearingReducedMS:red});
  let fullMS=inp.clearingFullMS,redMS=inp.clearingReducedMS,device=null,source=String(inp.clearingSource||'').slice(0,200);
  if(inp.device&&inp.device.type&&inp.device.type!=='manual'){
   let arc;try{arc=ieee1584Calculate(ieeeIn(100,100))}catch(e){return {...withCurrent,status:'INPUT OUTSIDE IEEE 1584-2018 RANGE',note:e.message}}
   const fullKA=arc.cases[0].arcingCurrentKA,redKA=arc.cases[1].arcingCurrentKA;
   try{device=arcFlashClearingTimes(inp.device,fullKA,redKA)}catch(e){return {...withCurrent,arcingCurrentFullKA:fullKA,arcingCurrentReducedKA:redKA,status:'DEVICE SETTINGS INCOMPLETE',note:e.message}}
   const bad=[device.full,device.reduced].find(x=>x.status!=='OK');
   if(bad)return {...withCurrent,arcingCurrentFullKA:fullKA,arcingCurrentReducedKA:redKA,device:{description:describeDevice(inp.device),full:device.full,reduced:device.reduced},status:'DEVICE DOES NOT CLEAR: '+bad.status,note:bad.text+'. Check the device settings, or choose the device that actually clears this fault.'};
   fullMS=device.full.ms;redMS=device.reduced.ms;
   const over=Math.max(fullMS,redMS)>2000;
   if(over&&inp.device.capAt2s!==true)return {...withCurrent,arcingCurrentFullKA:fullKA,arcingCurrentReducedKA:redKA,device:{description:describeDevice(inp.device),full:device.full,reduced:device.reduced},status:'CLEARING TIME OVER 2 s',note:`Device clears in ${Math.round(Math.max(fullMS,redMS))} ms. Improve protection, or tick "limit to 2 s" only if a person could move away within 2 s (IEEE 1584-2018 guidance).`};
   if(over){fullMS=Math.min(fullMS,2000);redMS=Math.min(redMS,2000)}
   source=(inp.linkedDevice?`${inp.linkedDevice.name} (one-line, ${inp.device.sharePercent} % of fault current) — `:'')+describeDevice(inp.device)+(over?' (arc duration limited to 2 s by user choice)':'');
  }
  if(!fin(fullMS)||!fin(redMS))return {...withCurrent,status:'CLEARING TIMES REQUIRED',note:'Choose the protective device and its settings, or type documented total clearing times at the full and reduced arcing currents.'};
  try{
   const a=ieee1584Calculate(ieeeIn(fullMS,redMS));
   const g=a.cases.find(c=>c.case===a.governingCase);
   const partial=inp.linkedDevice&&!inp.linkedDevice.isolatesAll?`${inp.linkedDevice.name} interrupts only ${inp.device.sharePercent} % of the fault current; other sources keep feeding the arc until their own devices open. Check those devices, or type the clearing time of the slowest one.`:null;
   return {...withCurrent,status:'CALCULATED',note:partial||undefined,clearingSource:source,device:device?{description:describeDevice(inp.device),full:device.full,reduced:device.reduced,sharePercent:device.sharePercent,linkedDevice:inp.linkedDevice||null}:null,cases:a.cases.map(c=>({case:c.case,arcingCurrentKA:c.arcingCurrentKA,clearingTimeMS:c.clearingTimeMS,incidentEnergyCalPerCm2:c.incidentEnergyCalPerCm2,arcFlashBoundaryMM:c.arcFlashBoundaryMM})),governingCase:a.governingCase,incidentEnergyCalPerCm2:g.incidentEnergyCalPerCm2,arcFlashBoundaryMM:Math.max(...a.cases.map(c=>c.arcFlashBoundaryMM)),enclosure:a.enclosure,warnings:a.warnings};
  }catch(e){
   // still report arcing currents so the user can read clearing times from the curve
   return {...withCurrent,status:'INPUT OUTSIDE IEEE 1584-2018 RANGE',note:e.message};
  }
  };
  if(!bracket)return evalAt(r.totalA,inp);
  const high=r.totalA,low=Math.max(0,r.totalA-2*r.derBound);
  if(!(low>0))return {...withCurrentBase(high),status:'REVIEW: FAULT RESULT IS SCREENING BOUND',note:'The unknown-angle inverter current can cancel the rest of the fault current at this bus (lower bound 0 A). Enter the manufacturer fault-current angle.',bracket:{lowA:low,highA:high}};
  const hi=evalAt(high,inp),lo=evalAt(low,inp);
  if(hi.status!=='CALCULATED'||lo.status!=='CALCULATED'){const bad=hi.status!=='CALCULATED'?hi:lo;return {...bad,note:(bad.note?bad.note+' ':'')+'(Bracketed bound: '+Math.round(low)+'–'+Math.round(high)+' A; both ends must calculate.)',bracket:{lowA:low,highA:high}}}
  const g=lo.incidentEnergyCalPerCm2>hi.incidentEnergyCalPerCm2?lo:hi;
  return {...g,arcFlashBoundaryMM:Math.max(lo.arcFlashBoundaryMM,hi.arcFlashBoundaryMM),bracket:{lowA:low,highA:high,governing:g===lo?'low':'high',lowEnergy:lo.incidentEnergyCalPerCm2,highEnergy:hi.incidentEnergyCalPerCm2},note:[g.note,`Inverter angle unknown: bolted current bracketed ${Math.round(low)}–${Math.round(high)} A; the ${g===lo?'lower':'upper'} end gives the higher incident energy and is reported. Enter the manufacturer angle to remove the bracket.`].filter(Boolean).join(' ')};
 });
 // Arcing currents (needed to read clearing times from device curves) for rows without times yet
 for(const row of rows)if(row.status==='CLEARING TIMES REQUIRED'){
  try{const a=ieee1584Calculate({voltageKV:row.voltageV/1000,boltedFaultKA:row.boltedFaultA/1000,electrodeConfiguration:row.geometry.electrodeConfiguration,gapMM:row.geometry.gapMM,workingDistanceMM:row.geometry.workingDistanceMM,enclosureHeightMM:row.geometry.enclosureHeightMM,enclosureWidthMM:row.geometry.enclosureWidthMM,enclosureDepthMM:row.geometry.enclosureDepthMM,clearingFullMS:100,clearingReducedMS:100});
   row.arcingCurrentFullKA=a.cases[0].arcingCurrentKA;row.arcingCurrentReducedKA=a.cases[1].arcingCurrentKA;}catch(e){row.note+=' '+e.message}
 }
 return {status:errors.length?'INPUT REQUIRED':'CALCULATED',method:AF_NETWORK_V29.id,version:AF_NETWORK_V29.version,scenario:project.settings?.scenario||'base',voltageFactor:project.settings?.voltageFactor??1,
  scope:'IEEE 1584-2018 incident energy and arc-flash boundary at each bus, using the Studio three-phase bolted fault current for the selected operating scenario and documented clearing times. Equipment-class values are IEEE 1584-2018 typical defaults and must be confirmed in the field.',
  limitations:['Clearing times are user inputs; they must come from the protective device that clears a fault at that bus, at both the full and reduced arcing currents.','Run both maximum and minimum operating scenarios; lower fault current can give longer clearing and higher energy.','Bolted current includes the Studio prefault voltage factor c; IEEE 1584 expects the bolted fault current at the system voltage, so use c = 1 unless your basis says otherwise.','Not valid for single-phase, DC or above 15 kV. No PPE category is assigned.'],
  reference:['IEEE Std 1584-2018, equations 1-25 and Tables 1-10.','NFPA 70E 130.5(H): label to show nominal voltage, arc-flash boundary and at least one of incident energy with working distance, PPE category, minimum arc rating or site-specific PPE.'],
  issues:out.issues||[],rows};
}

export function arcFlashLabel(row,{date,preparedBy=''}={}){
 if(row?.status!=='CALCULATED')fail('calculate this bus first.');
 if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))fail('enter the study date as YYYY-MM-DD.');
 const E=row.incidentEnergyCalPerCm2,clean=s=>String(s||'').replace(/[<>&"]/g,'').slice(0,120);
 return {signalWord:E>40?'DANGER':'WARNING',
  signalNote:E>40?'Incident energy above 40 cal/cm²: commonly marked DANGER (industry practice).':'',
  title:'ARC FLASH AND SHOCK HAZARD',equipment:clean(row.busName),nominalVoltageV:row.voltageV,
  incidentEnergyCalPerCm2:E,workingDistanceMM:row.geometry.workingDistanceMM,arcFlashBoundaryMM:row.arcFlashBoundaryMM,
  boltedFaultKA:row.boltedFaultA/1000,governingCase:row.governingCase,equipmentClass:row.geometry.equipmentClass,electrodeConfiguration:row.geometry.electrodeConfiguration,
  studyDate:date,preparedBy:clean(preparedBy),basis:'IEEE 1584-2018; clearing times: '+(row.clearingSource||'entered by user'),
  note:'Verify before work. Re-study when the system or protective settings change.'};
}
