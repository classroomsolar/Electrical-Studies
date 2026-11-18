// V33: plant-scale DC solver keeps per-source rows for the selected fault bus only on very large arrays.
// Compares V33 with the V32 DC engine (v32-reference/) on DC arrays built by the Studio's builder: every bus status, total,
// signed current, Zth, source-type totals and every stored branch row; protective-device duty; three buses in full;
// and the page's own check of a worker result (the packet is accepted).
const NEW=new URL('../../SITE/',import.meta.url).href,REF=new URL('./v32-reference/',import.meta.url).href;
const B=await import(NEW+'plant-builder.mjs'),M=await import(NEW+'network-model.mjs'),EN=await import(NEW+'network-engine.mjs'),EO=await import(REF+'network-engine.mjs'),NC=await import(NEW+'network-calculation.mjs');
let pass=0,fail=0,worst=0;const fails=[];
const rel=(a,b)=>a===b?0:(typeof a!=='number'||typeof b!=='number'||!isFinite(a)||!isFinite(b))?Infinity:Math.abs(a-b)/Math.max(Math.abs(a),Math.abs(b),1e-9);
const chk=(w,a,b,scale)=>{let d=rel(a,b);if(d>0&&scale&&typeof a==='number'&&typeof b==='number'&&Math.abs(a-b)<=1e-9*scale)d=0;if(d!==Infinity&&d>worst)worst=d;if(d<=1e-9)pass++;else{fail++;if(fails.length<12)fails.push(w+': '+a+' vs '+b)}};
function dc(o){const D={dcVoltageV:1500,dcInverters:2,combinersPerInverter:6,stringsPerCombiner:24,stringVocV:1450,stringSourceOhm:40,stringCableLengthM:80,stringCableROhmKm:4.6,combinerCableLengthM:150,combinerCableROhmKm:0.13,combinerCableRuns:2,...o};for(const [k] of B.DC_OPTIONS)if(!(k in D))D[k]=true;
 const e=B.validateDcSpec(D);if(e.length)throw Error(e.join(';'));const parts=B.buildDcArray(D),p=M.emptyProject();Object.assign(p,parts.project||{buses:parts.buses,branches:parts.branches,sources:parts.sources,devices:parts.devices});p.settings.faultType='dc';if(parts.settings)Object.assign(p.settings,parts.settings);const q=M.normalizeProject(structuredClone(p));q.selectedBus=q.buses[Math.floor(q.buses.length/3)].id;return q}
async function accepted(p,r){return await new Promise(res=>{class W{constructor(){}postMessage(m){setTimeout(()=>{this.onmessage({data:{revision:m.revision,phase:'started'}});this.onmessage({data:{revision:m.revision,results:r.results,issues:r.issues}})},0)}terminate(){}}
 NC.runCalculation({project:p,revision:7,WorkerClass:W,workerUrl:'x',compute:()=>({results:[],issues:[{severity:'error',message:'fallback'}]}),onResult:d=>res(d.execution==='worker'&&!d.error&&d.results?.length===r.results.length)})})}
async function compare(name,p){
 const t0=performance.now(),o=EO.calculateProject(structuredClone(p)),t1=performance.now(),n=EN.calculateProject(structuredClone(p)),t2=performance.now();let totals=0;
 n.results.forEach((r,k)=>{const q=o.results[k],w=name+' '+r.busName;chk(w+' id',r.busId,q.busId);chk(w+' status',r.status,q.status);for(const key of ['totalA','signedA','conventionalA'])chk(w+' '+key,r[key],q[key]);chk(w+' zth',r.zth?.r,q.zth?.r);
  for(const g of new Set([...Object.keys(r.groups||{}),...Object.keys(q.groups||{})]))chk(w+' group '+g,r.groups?.[g],q.groups?.[g],q.totalA||1);
  const qb=new Map((q.branchFlows||[]).map(e=>[e.id,e]));chk(w+' branch rows',(r.branchFlows||[]).length,(q.branchFlows||[]).length);
  for(const e of r.branchFlows||[]){const x=qb.get(e.id);if(!x){fail++;continue}chk(w+' '+e.name,e.signedA,x.signedA,q.totalA||1)}
  if(r.detailScope==='totals'){totals++;chk(w+' source count',r.sourceCount,q.details.length)}else{chk(w+' rows',r.details.length,q.details.length);r.details.forEach((d,i)=>chk(w+' src',d.amps,q.details[i].amps,q.totalA||1))}});
 for(const d of p.devices.slice(0,400)){const a=EN.deviceDuty(d,null,p,n.results),b=EO.deviceDuty(d,null,p,o.results);chk(name+' duty status '+d.name,a?.status,b?.status);chk(name+' duty A '+d.name,a?.dutyA??a?.duty??null,b?.dutyA??b?.duty??null)}
 for(const id of [p.buses[1].id,p.buses[p.buses.length>>1].id,p.buses.at(-1).id]){const a=EN.calculateBusDetail(structuredClone(p),id),b=EO.calculateBusDetail(structuredClone(p),id);chk(name+' detail total',a.totalA,b.totalA);chk(name+' detail rows',a.details.length,b.details.length);a.details.forEach((x,i)=>chk(name+' detail src',x.amps,b.details[i].amps,b.totalA||1))}
 const ok=await accepted(p,n);ok?pass++:(fail++,fails.push(name+': page rejected the worker result'));
 console.log(name.padEnd(26),'buses',String(p.buses.length).padStart(5),'sources',String(p.sources.length).padStart(5),'totals-only',String(totals).padStart(5),'| V32',((t1-t0)/1000).toFixed(2)+' s','V33',((t2-t1)/1000).toFixed(2)+' s','| result accepted by page',ok);
}
for(const [name,o] of [['small 1x2x6',{dcInverters:1,combinersPerInverter:2,stringsPerCombiner:6}],['2x6x24 (602 buses)',{}],['4x12x24 (2,404 buses)',{dcInverters:4,combinersPerInverter:12}],['fault resistance 2x6x24',{}]]){const p=dc(o);if(name.startsWith('fault'))p.settings.faultR=0.5;await compare(name,p)}
console.log({pass,fail,worst});if(fails.length)console.log(fails.join('\n'));process.exit(fail?1:0);
