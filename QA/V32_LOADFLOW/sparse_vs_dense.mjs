// V32: sparse Newton load flow vs the original dense solver on random meshed/radial networks (2–40 buses).
import {solveBalancedPowerFlow,solveSparsePowerFlow} from '../../SITE/operating-studies.mjs';
let seed=Number(process.env.SEED||7);const rnd=()=>((seed=(seed*1103515245+12345)%2147483648)/2147483648);
let worstV=0,worstA=0,worstF=0,cases=0,bothFail=0,mismatch=0;
for(let c=0;c<400;c++){
 const n=2+Math.floor(rnd()*39),buses=[];for(let i=0;i<n;i++){const t=i===0?'SLACK':rnd()<0.2?'PV':'PQ';buses.push({id:'b'+i,type:t,pMW:t==='SLACK'?undefined:(rnd()-0.6)*2,qMvar:t==='PQ'?(rnd()-0.6)*1:undefined,vSetPu:t==='PQ'?undefined:0.98+rnd()*0.05})}
 const branches=[];for(let i=1;i<n;i++){const j=Math.floor(rnd()*i);branches.push({id:'e'+i,from:'b'+j,to:'b'+i,rPu:0.001+rnd()*0.03,xPu:0.005+rnd()*0.08,...(rnd()<0.2?{tap:0.95+rnd()*0.1}:{})})}
 for(let k=0;k<Math.floor(rnd()*n/3);k++){const a=Math.floor(rnd()*n),b=Math.floor(rnd()*n);if(a!==b)branches.push({id:'m'+k,from:'b'+a,to:'b'+b,rPu:0.002+rnd()*0.03,xPu:0.01+rnd()*0.08})}
 const net={baseMVA:10,buses,branches};let d=null,s=null,de='',se='';
 try{d=solveBalancedPowerFlow(net)}catch(e){de=e.message}try{s=solveSparsePowerFlow(net)}catch(e){se=e.message}
 if(!d&&!s){bothFail++;continue}
 if(!d||!s){mismatch++;console.log('one failed',n,de,'|',se);continue}
 cases++;for(let i=0;i<n;i++){worstV=Math.max(worstV,Math.abs(d.buses[i].voltagePu-s.buses[i].voltagePu));worstA=Math.max(worstA,Math.abs(d.buses[i].angleDegrees-s.buses[i].angleDegrees))}
 for(let k=0;k<branches.length;k++)worstF=Math.max(worstF,Math.abs(d.branches[k].fromMW-s.branches[k].fromMW)/Math.max(1,Math.abs(d.branches[k].fromMW)))
}
console.log(JSON.stringify({solvedBoth:cases,bothFailed:bothFail,onlyOneSolved:mismatch,worstVoltagePu:worstV,worstAngleDeg:worstA,worstFlowRel:worstF}));
process.exit(mismatch||worstV>1e-8||worstA>1e-6||worstF>1e-6?1:0);
