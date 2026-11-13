import {calculateProject} from '../../../SITE/network-engine.mjs';
import {calculateConnectedProject} from '../../../SITE/connected-sequences.mjs';
import * as OS from '../../../SITE/operating-studies.mjs';const buildOperatingNetwork=null;
let p=0,f=0;const ck=(n,ok,d='')=>{ok?p++:f++;console.log((ok?'PASS ':'FAIL ')+n+(d?' — '+d:''))};
const mk=(tap,ft='3phase',extra={})=>({buses:[{id:'p',name:'P',voltage:12000,sequence:{}},{id:'s',name:'S',voltage:480,sequence:{}}],
 sources:[{id:'u',kind:'utility',name:'U',bus:'p',voltage:12000,faultA:1e8,method:'ka',model:'voltage',xr:1000,angle:0,enabled:true,sequence:{zeroPath:'blocked'}}],
 branches:[{id:'t',kind:'transformer',name:'T',from:'p',to:'s',v1:12000,v2:480,power:1.5e6,zPercent:5.75,xr:7,shift:30,tapPercent:tap,primaryConnection:'Delta',secondaryConnection:'Grounded wye',enabled:true,sequence:{zeroMode:'to-ground',r0:0.0012,x0:0.0085,toNeutralR:0,toNeutralX:0}}],
 devices:[],pvArrays:[],settings:{frequency:60,baseMVA:1,scenario:'base',voltageFactor:1,generatorStage:'initial',time:0,faultType:ft,assumeZ2:true,faultR:0,faultX:0,auto:true,sequenceModel:'connected',connectedAssumeZ2:true,...extra}});
const I=(r,id='s')=>r.results.find(x=>x.busId===id).totalA;
for(const t of [-5,-2.5,2.5,5,7.5,-10,10]){
 const a=I(calculateProject(mk(0))),b=I(calculateProject(mk(t)));ck(`3-phase engine, tap ${t}%: I ratio = 1/(1+tap)`,Math.abs(b/a*(1+t/100)-1)<2e-4,(b/a).toFixed(6));
 const c0=calculateConnectedProject(mk(0,'slg')),c1=calculateConnectedProject(mk(t,'slg'));
 const s0=I(c0),s1=I(c1);ck(`connected SLG, tap ${t}%: I ratio = 1/(1+tap)`,Number.isFinite(s0)&&Math.abs(s1/s0*(1+t/100)-1)<2e-4,`${s0?.toFixed?.(0)} → ${s1?.toFixed?.(0)} A`);
 const k0=calculateConnectedProject(mk(0,'3phase')),k1=calculateConnectedProject(mk(t,'3phase'));ck(`connected 3-phase agrees with network engine at tap ${t}%`,Math.abs(I(k1)/I(calculateProject(mk(t)))-1)<1e-6);
}
// zero-tap must reproduce the old results exactly (field absent vs 0)
const noField=mk(0);delete noField.branches[0].tapPercent;ck('tap absent == tap 0 (bit-identical)',I(calculateProject(noField))===I(calculateProject(mk(0))));
// validation
const v=t=>calculateProject(mk(t)).issues.filter(i=>i.severity==='error').map(i=>i.message);
ck('tap 10.5% rejected',v(10.5).some(m=>m.includes('-10 %')));ck('tap "abc" rejected',v('abc').length>0);ck('tap NaN-like string rejected (connected)',calculateConnectedProject(mk('2','slg')).issues.some(i=>i.severity==='error'));
ck('info note when tap applied (network engine)',calculateProject((q=>{delete q.settings.sequenceModel;return q})(mk(2.5))).issues.some(i=>i.severity==='info'&&i.message.includes('2.5 %')));
// HV-bus current: tap does not change the 12 kV fault (source-side, infinite)
ck('primary bus current unaffected',Math.abs(I(calculateProject(mk(5)),'p')/I(calculateProject(mk(0)),'p')-1)<1e-9);
// V29e: load flow now models a fixed off-nominal tap (see ../loadflow_tap for the oracle test)
{const withOp=q=>{q.operatingStudy={slackBusId:'p',baseMVA:1,buses:{s:{type:'PQ',pMW:0.5,qMvar:0.1}}};return q};let net0,net1,err='';
 try{net0=OS.operatingNetworkFromStudio(withOp(mk(0)));net1=OS.operatingNetworkFromStudio(withOp(mk(2.5)))}catch(e){err=e.message}
 const good=net0&&net1&&net0.branches[0].tap===undefined&&Math.abs(net1.branches[0].tap-1.025)<1e-12;
 console.log((good?'PASS':'FAIL')+' load flow takes the tap: ratio '+(net1?.branches[0].tap)+' '+err)}
