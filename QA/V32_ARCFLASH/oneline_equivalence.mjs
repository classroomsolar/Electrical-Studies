// V32: the bridge-based one-line protective-device search gives exactly the V31 result (remove-and-search) on random
// meshed/radial networks and on the 1,970-bus plant; plus timing.
import fs from 'fs';
import {oneLineProtection} from '../../SITE/arcflash-network-v29.mjs';
const OLD=new Function(fs.readFileSync(new URL('./oneline_v31_reference.js',import.meta.url),'utf8').replace('export function oneLineProtection','return function')+'')();
let seed=5;const rnd=()=>((seed=(seed*1103515245+12345)%2147483648)/2147483648);let fail=0,checks=0;
for(let c=0;c<300;c++){const n=3+Math.floor(rnd()*30),p={buses:[],branches:[],devices:[],sources:[]};for(let i=0;i<n;i++)p.buses.push({id:'b'+i});
 for(let i=1;i<n;i++){const j=Math.floor(rnd()*i);if(rnd()<0.45){const d={id:'d'+i,kind:'switchgear',equipmentType:['breaker','fuse','recloser'][i%3],name:'D'+i,enabled:rnd()>0.1,linkId:'l'+i};p.devices.push(d);p.branches.push({id:'l'+i,kind:'link',from:'b'+j,to:'b'+i,deviceId:d.id,enabled:true})}else p.branches.push({id:'c'+i,kind:'cable',from:'b'+j,to:'b'+i,enabled:rnd()>0.05})}
 for(let k=0;k<Math.floor(rnd()*n/4);k++){const a=Math.floor(rnd()*n),b=Math.floor(rnd()*n);if(a!==b)p.branches.push({id:'m'+k,kind:'cable',from:'b'+a,to:'b'+b,enabled:true})}
 if(rnd()<0.2){const i=1+Math.floor(rnd()*(n-1));p.branches.push({id:'par',kind:'cable',from:p.branches[0].from,to:p.branches[0].to,enabled:true})}
 for(let k=0;k<1+Math.floor(rnd()*3);k++)p.sources.push({id:'s'+k,bus:'b'+Math.floor(rnd()*n),enabled:rnd()>0.1});
 for(const b of p.buses){const r={busId:b.id,totalA:1000,branchFlows:p.branches.map(e=>({id:e.id,fromA:rnd()*1000,toA:rnd()*1000}))};const a=JSON.stringify(oneLineProtection(p,r)),o=JSON.stringify(OLD(p,r));checks++;if(a!==o){fail++;if(fail<4)console.log('DIFF',c,b.id,a.slice(0,200),'\n     ',o.slice(0,200))}}}
console.log('random networks: checks',checks,'differences',fail);
const plant=JSON.parse(fs.readFileSync('../V31_SCALE/results/plant2000.json','utf8'));let t=Date.now(),diffs=0;
const sample=plant.buses.filter((_,i)=>i%25===0);for(const b of sample){const r={busId:b.id,totalA:1000,branchFlows:[]};if(JSON.stringify(oneLineProtection(plant,r))!==JSON.stringify(OLD(plant,r)))diffs++}
console.log('plant sample buses',sample.length,'differences',diffs);
t=Date.now();for(const b of plant.buses)oneLineProtection(plant,{busId:b.id,totalA:1000,branchFlows:[]});console.log('all 1,970 buses (new) ms',Date.now()-t);
fail+=diffs;console.log(fail?'FAILURES '+fail:'ALL PASS');process.exit(fail?1:0);
