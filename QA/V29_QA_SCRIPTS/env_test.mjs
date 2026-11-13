import {transformerToleranceEnvelope,nec11024Label} from '../../SITE/fault-envelope-v29.mjs';
import {calculateProject} from '../../SITE/network-engine.mjs';
import {exampleProject} from '../../SITE/network-model.mjs';
import fs from 'node:fs';
let pass=0,fail=0;const ck=(n,ok,d='')=>{ok?pass++:fail++;console.log((ok?'PASS ':'FAIL ')+n+(d?' — '+d:''))};
const B=(id,v)=>({id,name:id,voltage:v,sequence:{}});
const inf={buses:[B('p',12000),B('s',600)],sources:[{id:'u',kind:'utility',name:'U',bus:'p',voltage:12000,faultA:1e9,method:'ka',model:'voltage',xr:1000,angle:0,enabled:true}],branches:[{id:'t',kind:'transformer',name:'T',from:'p',to:'s',v1:12000,v2:600,power:1.5e6,zPercent:6,xr:8,shift:0,enabled:true}],devices:[],pvArrays:[],settings:{frequency:60,baseMVA:1,scenario:'base',voltageFactor:1,generatorStage:'initial',time:0,faultType:'3phase',assumeZ2:true,faultR:0,faultX:0,auto:true}};
const before=JSON.stringify(inf);
for(const tol of [0,7.5,10]){const e=transformerToleranceEnvelope({project:inf,tolerancePercent:tol,calculateProject});const s=e.buses.find(b=>b.busId==='s');
 const ideal=1.5e6/(Math.sqrt(3)*600*0.06);ck(`tol ${tol}%: max = nominal/(1-tol) on infinite bus`,Math.abs(s.maximumWithTolerance.totalA-ideal/(1-tol/100))/ideal<1e-3,`${s.maximumWithTolerance.totalA.toFixed(0)} A`);
 ck(`tol ${tol}%: min = nominal/(1+tol)`,Math.abs(s.minimumWithTolerance.totalA-ideal/(1+tol/100))/ideal<1e-3);}
ck('input project is not mutated',JSON.stringify(inf)===before);
const ex=exampleProject();const e=transformerToleranceEnvelope({project:ex,tolerancePercent:7.5,calculateProject});
const nom=e.buses.map(b=>b.nominal.totalA);ck('nominal case reproduces V28 reference (3,400 / 32,725.858 / 16,706.173 A)',Math.abs(nom[0]-3400)<1e-6&&Math.abs(nom[1]-32725.85775961685)<1e-6&&Math.abs(nom[2]-16706.17335282207)<1e-6);
ck('utility bus unaffected by transformer tolerance',Math.abs(e.buses[0].maximumWithTolerance.totalA-3400)<1e-6);
ck('ordering min < nominal < max at LV',e.buses.slice(1).every(b=>b.minimumWithTolerance.totalA<b.nominal.totalA&&b.nominal.totalA<b.maximumWithTolerance.totalA));
const lab=nec11024Label({envelope:e,busId:ex.buses[2].id,equipmentName:'MDP <script>',calculatedBy:'PE',date:'2026-11-07'});
ck('label uses worst-case value and strips markup',lab.availableFaultA===e.buses[2].maximumWithTolerance.totalA&&!lab.equipment.includes('<'),lab.availableFaultText);
for(const [n,f] of [['tol -1',()=>transformerToleranceEnvelope({project:ex,tolerancePercent:-1,calculateProject})],['tol 25',()=>transformerToleranceEnvelope({project:ex,tolerancePercent:25,calculateProject})],['tol NaN',()=>transformerToleranceEnvelope({project:ex,tolerancePercent:NaN,calculateProject})],['no project',()=>transformerToleranceEnvelope({project:null,calculateProject})],['dc project',()=>transformerToleranceEnvelope({project:{...ex,settings:{...ex.settings,faultType:'dc'}},calculateProject})],['bad date',()=>nec11024Label({envelope:e,busId:ex.buses[1].id,date:'07/11/2026'})],['bad bus',()=>nec11024Label({envelope:e,busId:'x',date:'2026-11-07'})]])
 {let threw=false;try{f()}catch{threw=true}ck('rejects '+n,threw)}
// broad sweep over the 220 random networks: envelope ordering must hold at every bus fed through a transformer
const cases=JSON.parse(fs.readFileSync('cases.json'));let n=0,bad=0;
for(const c of cases){let r;try{r=transformerToleranceEnvelope({project:c,tolerancePercent:7.5,calculateProject})}catch{continue}if(r.status!=='CALCULATED')continue;
 for(const b of r.buses){if(b.nominal.totalA==null)continue;n++;if(!(b.minimumWithTolerance.totalA<=b.nominal.totalA*(1+1e-12)&&b.nominal.totalA<=b.maximumWithTolerance.totalA*(1+1e-12)))bad++;if(b.maximumIncreasePercent>100/0.925-100+1e-9)bad++}}
ck(`ordering & bound (≤ +8.11 %) on ${n} random-network buses`,bad===0,`${bad} violations`);
console.log(`\n${pass} passed, ${fail} failed`);
