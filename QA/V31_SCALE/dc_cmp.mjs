import fs from 'node:fs';const D=await import(new URL('../../SITE/dc-network.mjs',import.meta.url).href);
import {dcPlant} from './dcplant.mjs';
const rev=(k,v)=>v==='__NaN__'?NaN:v==='__Inf__'?Infinity:v;
const cases=JSON.parse(fs.readFileSync(new URL('../V29_QA_SCRIPTS/',import.meta.url).pathname+'dc_cases.json','utf8'),rev).filter(p=>p.buses);
for(const inv of [2,3])cases.push(dcPlant({inverters:inv}));
const rel=(a,b,fl)=>a===b?0:(a==null||b==null)?Infinity:Math.abs(a-b)/Math.max(fl,Math.abs(a),Math.abs(b));
let worst=0,bad=0,st=0,n=0;
for(const p of cases){const A=D.calculateDcProject(structuredClone(p)),B=D.calculateDcProject(structuredClone(p),{factored:true});
 A.results.forEach((a,k)=>{const b=B.results[k];n++;if(a.status!==b.status){st++;if(st<5)console.log('STATUS',a.status,'|',b.status,a.faultNote?.slice(0,80),'|',b.faultNote?.slice(0,80));return}if(a.totalA==null)return;
  const F=Math.max(1,a.totalA);let w=Math.max(rel(a.totalA,b.totalA,F),rel(a.signedA,b.signedA,F),rel(a.zth.r,b.zth.r,1e-9));
  if(a.branchFlows.length!==b.branchFlows.length)w=Infinity;else a.branchFlows.forEach((x,i)=>{w=Math.max(w,x.id===b.branchFlows[i].id?0:Infinity,rel(x.signedA,b.branchFlows[i].signedA,F))});
  a.details.forEach((x,i)=>{const y=b.details[i];const ws=[rel(x.signedA,y.signedA,F),rel(x.terminalA,y.terminalA,F),rel(x.terminalVoltagePu,y.terminalVoltagePu,1),x.branchFlows.length===y.branchFlows.length?0:Infinity];if(Math.max(...ws)>1e-9&&bad<3)console.log('detail',ws,x.terminalA,y.terminalA,x.terminalVoltagePu,y.terminalVoltagePu);w=Math.max(w,...ws)});
  a.sourceTerminalCurrents.forEach((x,i)=>{w=Math.max(w,rel(x.signedA,b.sourceTerminalCurrents[i].signedA,F))});
  if(w>1e-9){bad++;if(bad<5)console.log('DIFF',p.name,a.busName,w)}worst=Math.max(worst,w)})}
console.log({cases:cases.length,buses:n,bad,statusDiff:st,worst});
