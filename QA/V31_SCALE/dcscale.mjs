import {dcPlant} from './dcplant.mjs';const D=await import(new URL('../../SITE/dc-network.mjs',import.meta.url).href);
const inv=+process.argv[2]||10,p=dcPlant({inverters:inv});console.log('buses',p.buses.length,'sources',p.sources.length,'branches',p.branches.length);
const t=performance.now();const r=D.calculateDcProject(p);console.log('s',((performance.now()-t)/1000).toFixed(2),[...new Set(r.results.map(x=>x.status))],r.issues.filter(i=>i.severity==='error').slice(0,2).map(i=>i.message));
console.log(r.results.slice(0,3).map(x=>[x.busName,x.totalA]));
