// V32: load flow on the 1,970-bus plant (148 closed breakers merged, sparse Newton) with KCL and power-balance checks.
import fs from 'fs';
import {calculateOperatingPreview} from '../../SITE/operating-workspace.mjs';
const p=JSON.parse(fs.readFileSync(process.argv[2]||'../V31_SCALE/results/plant2000.json','utf8'));
const inv=new Set(p.sources.filter(s=>s.kind==='pv').map(s=>s.bus));
p.operatingStudy={baseMVA:100,slackBusId:p.sources.find(s=>s.kind==='utility').bus,qLimitMode:'block',buses:Object.fromEntries(p.buses.map(b=>[b.id,{type:'PQ',pMW:inv.has(b.id)?0.75:0,qMvar:inv.has(b.id)?0.05:0}])),screening:{}};
let t=Date.now(),r;try{r=calculateOperatingPreview(p)}catch(e){console.log('FAILED',e.message);process.exit(1)}
const ms=Date.now()-t;let fail=0;const ok=(c,m)=>{if(!c){fail++;console.log('FAIL',m)}};
ok(r.buses.length===p.buses.length,'every bus reported');ok(r.branches.length===p.branches.length,'every connection reported');
const gen=r.buses.filter(b=>b.type!=='SLACK').reduce((t,b)=>t+b.pMW,0),slack=r.buses.find(b=>b.type==='SLACK');
ok(Math.abs(gen+slack.pMW-r.totalLossMW)<1e-6,'power balance '+(gen+slack.pMW-r.totalLossMW));
// KCL at every bus with branch and switch flows.
const out=new Map(p.buses.map(b=>[b.id,[0,0]]));for(const e of r.branches){if(e.fromMW==null)continue;out.get(e.from)[0]+=e.fromMW;out.get(e.from)[1]+=e.fromMvar;out.get(e.to)[0]+=e.toMW;out.get(e.to)[1]+=e.toMvar;}
let worst=0;for(const b of r.buses){const o=out.get(b.id);worst=Math.max(worst,Math.abs(o[0]-b.pMW),Math.abs(o[1]-b.qMvar));}
ok(worst<1e-6,'KCL worst '+worst);
const links=r.branches.filter(e=>e.idealLink);ok(links.length===148&&links.every(e=>Number.isFinite(e.currentPu)),'switch currents');
const vmin=Math.min(...r.buses.map(b=>b.voltagePu)),vmax=Math.max(...r.buses.map(b=>b.voltagePu));
console.log(JSON.stringify({ms,iterations:r.iterations,solver:r.solver,mismatchPu:r.mismatchPu,lossMW:r.totalLossMW,slackMW:slack.pMW,vmin,vmax,worstKCL:worst,switchGroups:r.switchGroups.length}));
console.log(fail?'FAILURES '+fail:'ALL PASS');process.exit(fail?1:0);
