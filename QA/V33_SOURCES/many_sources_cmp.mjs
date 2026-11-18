// V33: plant-scale solver with many inverter sources (string-inverter plants).
// Compares the V33 engine with a reference engine (default: the V32 engine kept in ./v32-reference/) on plants built by the
// Studio's own plant builder. Every bus: status, total, conventional part, inverter bound, peak, asymmetrical, X/R, Zth,
// source-type totals and every stored branch row (both ends, phasors and bounds). Per-source rows are compared where both keep them;
// where V33 keeps totals only, the number of sources is compared and the selected bus is compared in full.
// usage: node many_sources_cmp.mjs [referenceSiteDir]
import fs from 'node:fs';
const NEW=new URL('../../SITE/',import.meta.url).href,REF=process.argv[2]?new URL(process.argv[2].replace(/\/?$/,'/'),'file://'+process.cwd()+'/').href:new URL('./v32-reference/',import.meta.url).href;
const B=await import(NEW+'plant-builder.mjs'),M=await import(NEW+'network-model.mjs'),EN=await import(NEW+'network-engine.mjs'),EO=await import(REF+'network-engine.mjs');
const TOL=1e-9;let pass=0,fail=0,worst=0;const fails=[];
const rel=(a,b)=>{if(a===b)return 0;if(a==null||b==null)return Infinity;if(!Number.isFinite(a)||!Number.isFinite(b))return Infinity;return Math.abs(a-b)/Math.max(Math.abs(a),Math.abs(b),1e-9)};
const chk=(what,a,b)=>{const d=typeof a==='number'||typeof b==='number'?rel(a,b):(a===b?0:Infinity);if(d>worst&&d!==Infinity)worst=d;if(d<=TOL)pass++;else{fail++;if(fails.length<12)fails.push(what+': '+a+' vs '+b)}};
// Currents are also accepted when they differ by less than 1e-9 of the bus fault current (numerical zero).
const chkA=(what,a,b,scale)=>{if(typeof a==='number'&&typeof b==='number'&&Math.abs(a-b)<=1e-9*scale){pass++;return}chk(what,a,b)};
const cz=(what,a,b)=>{if(a==null&&b==null){pass++;return}chk(what+'.r',a?.r,b?.r);chk(what+'.i',a?.i,b?.i)};
function base(o={}){const spec={poiVoltageKV:34.5,utilityFaultKA:20,utilityXR:15,feeders:3,blocksPerFeeder:4,mvCableLengthM:300,mvCableROhmKm:0.16,mvCableXOhmKm:0.12,mvCableRuns:1,txKVA:3000,txZPercent:6,txXR:8,lvVoltageV:690,invPerBlock:24,invKVA:125,invFaultA:130,invAngleDeg:null,lvCableLengthM:0,mainBreaker:true,feederBreakers:true,blockFuses:true,inverterBreakers:true,...o};
 const e=B.validateSpec(spec);if(e.length)throw Error(e.join('; '));const parts=B.buildPlant(spec),p=M.emptyProject();Object.assign(p,{buses:parts.buses,branches:parts.branches,sources:parts.sources,devices:parts.devices});return M.normalizeProject(structuredClone(p))}
function meshed(p){const lv=p.buses.filter(b=>/LV$/.test(b.name)&&b.voltage===690);const a=lv[0],b=lv[lv.length-1];p.branches.push({...structuredClone(p.branches.find(e=>e.kind==='cable')),id:'tie-1',name:'LV tie',from:a.id,to:b.id,length:120});return M.normalizeProject(p)}
function mixed(p){p.sources.filter(s=>s.kind==='pv').forEach((s,i)=>{if(i%5===0){s.angle=-20;s.angleDeg=-20}});return p}
function compare(name,p){
 const t0=performance.now(),o=EO.calculateProject(structuredClone(p)),t1=performance.now(),n=EN.calculateProject(structuredClone(p)),t2=performance.now();
 const errs=n.issues.filter(i=>i.severity==='error');chk(name+' issues',errs.length,o.issues.filter(i=>i.severity==='error').length);
 let totals=0;
 n.results.forEach((r,k)=>{const q=o.results[k],w=name+' '+r.busName;
  chk(w+' id',r.busId,q.busId);chk(w+' status',r.status,q.status);
  for(const key of ['totalA','conventionalA','derBound','peakA','asymA','xr'])chk(w+' '+key,r[key],q[key]);
  cz(w+' zth',r.zth,q.zth);
  for(const g of new Set([...Object.keys(r.groups||{}),...Object.keys(q.groups||{})]))chk(w+' group '+g,r.groups[g],q.groups[g]);
  const qb=new Map((q.branchFlows||[]).map(e=>[e.id,e]));chk(w+' branch rows',(r.branchFlows||[]).length,(q.branchFlows||[]).length);
  for(const e of r.branchFlows||[]){const x=qb.get(e.id);if(!x){fail++;if(fails.length<12)fails.push(w+' missing branch '+e.name);continue}for(const key of ['fromA','toA','fromBoundA','toBoundA'])chkA(w+' '+e.name+' '+key,e[key],x[key],q.totalA||1);for(const [key,part] of [['fromPhasor','r'],['fromPhasor','i'],['toPhasor','r'],['toPhasor','i']])chkA(w+' '+e.name+' '+key+'.'+part,e[key]?.[part],x[key]?.[part],q.totalA||1);chk(w+' '+e.name+' bound',!!e.bound||Math.max(x.fromBoundA,x.toBoundA)<=1e-9*(q.totalA||1),!!x.bound||Math.max(e.fromBoundA,e.toBoundA)<=1e-9*(q.totalA||1))}
  if(r.detailScope==='totals'){totals++;chk(w+' source count',r.sourceCount,q.details.length);chk(w+' no rows kept',r.details.length,0)}
  else{chk(w+' detail rows',r.details.length,q.details.length);r.details.forEach((d,i)=>{const y=q.details[i];chk(w+' src '+d.name,d.sourceId,y.sourceId);chk(w+' src amps '+d.name,d.amps,y.amps);cz(w+' src phasor',d.phasor,y.phasor);chk(w+' src path',d.path.length,y.path.length)})}});
 // duty of every protective device from the stored rows
 for(const d of p.devices){const a=EN.deviceDuty(d,null,p,n.results),b=EO.deviceDuty(d,null,p,o.results);chk(name+' duty '+d.name+' status',a?.status,b?.status);chk(name+' duty '+d.name+' A',a?.dutyA??a?.duty??null,b?.dutyA??b?.duty??null)}
 // any bus on demand, in full
 for(const id of [p.buses[0].id,p.buses[p.buses.length>>1].id,p.buses.at(-1).id]){const a=EN.calculateBusDetail(structuredClone(p),id),b=EO.calculateBusDetail(structuredClone(p),id);chk(name+' detail total',a.totalA,b.totalA);chk(name+' detail rows',a.details.length,b.details.length);a.details.forEach((d,i)=>chk(name+' detail amps',d.amps,b.details[i].amps));chk(name+' detail branches',a.branchFlows.length,b.branchFlows.length);a.branchFlows.forEach((e,i)=>{chkA(name+' detail branch from',e.fromA,b.branchFlows[i].fromA,b.totalA||1);chkA(name+' detail branch to',e.toA,b.branchFlows[i].toA,b.totalA||1)})}
 console.log(name.padEnd(34),'buses',String(p.buses.length).padStart(5),'sources',String(p.sources.length).padStart(5),'totals-only buses',String(totals).padStart(5),'| V32',((t1-t0)/1000).toFixed(1)+' s','V33',((t2-t1)/1000).toFixed(1)+' s');
}
const cases=[
 ['small (not compact)',()=>base({feeders:1,blocksPerFeeder:2,invPerBlock:4})],
 ['compact, few sources',()=>base({feeders:4,blocksPerFeeder:5,invPerBlock:2})],
 ['unknown angle 3x4x24',()=>base()],
 ['unknown angle 5x6x12',()=>base({feeders:5,blocksPerFeeder:6,invPerBlock:12})],
 ['known angle 5x6x12',()=>base({feeders:5,blocksPerFeeder:6,invPerBlock:12,invAngleDeg:-30})],
 ['mixed angles 5x6x12',()=>mixed(base({feeders:5,blocksPerFeeder:6,invPerBlock:12}))],
 ['LV cables 4x5x10',()=>base({feeders:4,blocksPerFeeder:5,invPerBlock:10,lvCableLengthM:25,lvCableROhmKm:0.3,lvCableXOhmKm:0.1,lvCableRuns:1})],
 ['no inverter breakers 4x5x16',()=>base({feeders:4,blocksPerFeeder:5,invPerBlock:16,inverterBreakers:false})],
 ['meshed (LV tie) 4x5x12',()=>meshed(base({feeders:4,blocksPerFeeder:5,invPerBlock:12}))],
 ['fault impedance 4x5x12',()=>{const p=base({feeders:4,blocksPerFeeder:5,invPerBlock:12});p.settings.faultR=0.002;p.settings.faultX=0.001;return p}],
 ['unknown angle 7x10x8',()=>base({feeders:7,blocksPerFeeder:10,invPerBlock:8})],
];
const only=process.env.CASE;
for(const [name,make] of cases){if(only&&!name.includes(only))continue;compare(name,make())}
console.log({pass,fail,worstRelative:worst,tolerance:TOL});if(fails.length)console.log(fails.join('\n'));process.exit(fail?1:0);
