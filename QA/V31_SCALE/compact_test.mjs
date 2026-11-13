// Compact (plant-scale) results vs the dense engine. Tolerance 1e-5 relative: device links are ideal (1e-10 pu), so both solvers carry ~1e-6 conditioning noise.
import {plant} from './plant.mjs';
const S=new URL('../../SITE/',import.meta.url).href;
const E=await import(S+'network-engine.mjs');const A=await import(S+'arcflash-network-v29.mjs');
const rel=(a,b,fl=1e-6)=>{if(a===b)return 0;if(a==null||b==null)return Infinity;return Math.abs(a-b)/Math.max(fl,Math.abs(a),Math.abs(b))};
let worst=0,fails=0;const note=(w,msg)=>{worst=Math.max(worst,w);if(w>(+process.env.TOL||1e-5)){fails++;if(fails<25)console.log('FAIL',msg,w)}};
for(const cfg of [{inverters:6,aux:3},{inverters:12,aux:6,motors:3},{inverters:9,aux:2,unknownAngle:false},{inverters:20,aux:8}]){
 for(const sel of ['b0',null]){
 const p=plant(cfg);if(sel===null)p.selectedBus='b30';
 const dn=E.buildNetwork(structuredClone(p),{sparse:false}),dense=p.buses.map(b=>E.calculateBus(dn,p,b.id));
 const sn=E.buildNetwork(p,{sparse:true}),cmp=E.calculateScaled(sn,p,{compact:true}).results;
 dense.forEach((a,k)=>{const b=cmp[k];if(a.status!==b.status)note(Infinity,'status '+a.busName);
  note(Math.max(rel(a.totalA,b.totalA),rel(a.peakA,b.peakA),rel(a.zth?.r,b.zth?.r),rel(a.zth?.i,b.zth?.i),rel(a.xr,b.xr)),'totals '+a.busName);
  a.details.forEach((d,i)=>{const e=b.details[i];note(Math.max(rel(d.amps,e.amps,a.totalA),rel(d.pathSeriesZ.r,e.pathSeriesZ.r),rel(d.pathSeriesZ.i,e.pathSeriesZ.i),rel(d.terminalVoltagePu,e.terminalVoltagePu,1)),'detail '+a.busName)});
  const m=new Map(a.branchFlows.map(x=>[x.id,x]));
  for(const x of b.branchFlows){const y=m.get(x.id);if(!y){note(Infinity,'extra flow');continue}note(Math.max(rel(x.fromA,y.fromA,a.totalA),rel(x.toA,y.toA,a.totalA),(x.bound===y.bound||Math.max(y.fromA,y.toA)<1e-6*a.totalA)?0:Infinity,rel(x.fromPhasor.r,y.fromPhasor.r,a.totalA),rel(x.toPhasor.i,y.toPhasor.i,a.totalA)),'flow '+x.name+' @'+a.busName)}
  if(b.detailScope==='full'&&b.branchFlows.length!==a.branchFlows.length)note(Infinity,'full flows len');
 });
 for(const d of p.devices){const k=p.buses.findIndex(b=>b.id===d.bus);const x=E.deviceDuty(d,dense[k],p,dense),y=E.deviceDuty(d,cmp[k],p,cmp);
  note(Math.max(x.status===y.status?0:Infinity,x.interruptBusId===y.interruptBusId?0:Infinity,rel(x.interruptDutyA,y.interruptDutyA),rel(x.marginA,y.marginA)),'duty '+d.name+' '+x.status+'|'+y.status+' '+x.interruptBusId+'|'+y.interruptBusId)}
 // cable envelope like database-checks
 for(const c of p.branches.filter(e=>e.kind==='cable')){const mx=rs=>Math.max(...rs.flatMap(r=>(r.branchFlows||[]).filter(f=>f.id===c.id).map(f=>Math.max(f.fromA,f.toA))));note(rel(mx(dense),mx(cmp)),'cable env '+c.id)}
 // arc flash one-line protection
 dense.forEach((a,k)=>{const x=A.oneLineProtection(p,a),y=A.oneLineProtection(p,cmp[k]);if(!x)return;const tie=x.candidates.filter(c=>c.isolatesAll===x.primary?.isolatesAll&&c.hops===x.primary?.hops&&rel(c.sharePercent,x.primary?.sharePercent)<1e-5).length>1;note(Math.max(x.primary?.deviceId===y.primary?.deviceId||tie?0:Infinity,rel(x.primary?.sharePercent,y.primary?.sharePercent)),'arc '+a.busName+' '+x.primary?.name+'|'+y.primary?.name+' '+x.primary?.sharePercent+'|'+y.primary?.sharePercent)});
 console.log(cfg,'buses',p.buses.length,'flows dense',dense.reduce((s,r)=>s+r.branchFlows.length,0),'compact',cmp.reduce((s,r)=>s+r.branchFlows.length,0));
}}
console.log({worst,fails});
