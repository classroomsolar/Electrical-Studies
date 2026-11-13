import {solveBalancedPowerFlow,operatingNetworkFromStudio} from '../../../SITE/operating-studies.mjs';
import fs from 'fs';import vm from 'vm';
const cases=JSON.parse(fs.readFileSync('cases.json','utf8'));let ok=0,bad=0,err=0,worst=0;
// bundle copy
const src=fs.readFileSync('../../../SITE/public-bundle-v21.js','utf8');const ctx={console,globalThis:{},window:{},document:undefined,self:{},localStorage:undefined};
let OS=null;try{const g={};vm.runInNewContext(src.replace("require('public-entry.mjs')","globalThis.__req=require"),Object.assign(ctx,{globalThis:g}));OS=g.__req?g.__req('operating-studies.mjs'):null}catch(e){}
let parity=0,pdiff=0;
for(const c of cases){let r;try{r=solveBalancedPowerFlow(c.net)}catch(e){err++;continue}
 let d=0;r.buses.forEach((b,i)=>{d=Math.max(d,Math.abs(b.voltagePu-c.oracle.vm[i]),Math.abs(b.angleDegrees-c.oracle.ang[i])/100)});worst=Math.max(worst,d);d<2e-6?ok++:bad++;
 if(OS){const q=OS.solveBalancedPowerFlow(c.net);parity++;if(JSON.stringify(q.buses)!==JSON.stringify(r.buses)||JSON.stringify(q.branches)!==JSON.stringify(r.branches))pdiff++}}
console.log({cases:cases.length,match:ok,mismatch:bad,errors:err,worst,bundleParity:parity,bundleDiffs:pdiff});
// physical: +5% primary tap lowers secondary voltage
const mk=t=>({baseMVA:1,buses:[{id:'p',type:'SLACK',vSetPu:1},{id:'s',type:'PQ',pMW:-0.0001,qMvar:0}],branches:[{id:'t',from:'p',to:'s',rPu:0.001,xPu:0.05,tap:t}]});
const v=t=>solveBalancedPowerFlow(mk(t)).buses[1].voltagePu;console.log('no-load secondary pu at tap 1.05 / 0.95:',v(1.05).toFixed(5),v(0.95).toFixed(5),'expected ~',(1/1.05).toFixed(5),(1/0.95).toFixed(5));
// studio path
const studio={settings:{faultType:'3phase'},buses:[{id:'p',name:'P',voltage:12000},{id:'s',name:'S',voltage:480}],branches:[{id:'t',name:'T1',kind:'transformer',from:'p',to:'s',v1:12000,v2:480,power:1e6,zPercent:5.75,xr:6,tapPercent:2.5}],devices:[],operatingStudy:{slackBusId:'p',baseMVA:1,buses:{s:{type:'PQ',pMW:-0.5,qMvar:-0.2}}}};
const net=operatingNetworkFromStudio(studio);console.log('studio tap ->',net.branches[0].tap);const r=solveBalancedPowerFlow(net);console.log('480 V bus pu',r.buses[1].voltagePu.toFixed(5));
let t=false;try{operatingNetworkFromStudio({...studio,branches:[{...studio.branches[0],tapPercent:15}]})}catch{t=true}console.log('rejects 15 %:',t);
