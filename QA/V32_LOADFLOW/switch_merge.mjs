// V32: closed switches (ideal links) in the load flow. A network with a breaker must equal the same network with the two buses drawn as one.
import {operatingNetworkFromStudio,solveBalancedPowerFlow} from '../../SITE/operating-studies.mjs';
let fail=0;const ok=(c,m)=>{if(!c){fail++;console.log('FAIL',m)}else console.log('ok',m)};
const bus=(id,v)=>({id,name:id.toUpperCase(),voltage:v,kind:'bus'});
const cable=(id,f,t,len)=>({id,name:id,kind:'cable',from:f,to:t,rPerM:0.0002,xPerM:0.0001,length:len,runs:1});
const tx={id:'t1',name:'TX',kind:'transformer',from:'mv',to:'lv',power:2e6,zPercent:6,xr:8,v1:11000,v2:400};
const withLink={settings:{faultType:'3phase'},buses:[bus('mv',11000),bus('lv',400),bus('lv2',400),bus('ld',400)],branches:[tx,{id:'k1',name:'Breaker',kind:'link',from:'lv',to:'lv2',deviceId:'d1'},cable('c1','lv2','ld',50)],devices:[{id:'d1',name:'Breaker',enabled:true}],
 operatingStudy:{baseMVA:10,slackBusId:'mv',buses:{lv:{type:'PQ',pMW:-0.2,qMvar:-0.05},lv2:{type:'PQ',pMW:-0.1,qMvar:0},ld:{type:'PQ',pMW:-0.5,qMvar:-0.2}}}};
const merged={settings:{faultType:'3phase'},buses:[bus('mv',11000),bus('lv',400),bus('ld',400)],branches:[tx,cable('c1','lv','ld',50)],devices:[],operatingStudy:{baseMVA:10,slackBusId:'mv',buses:{lv:{type:'PQ',pMW:-0.3,qMvar:-0.05},ld:{type:'PQ',pMW:-0.5,qMvar:-0.2}}}};
const a=solveBalancedPowerFlow(operatingNetworkFromStudio(withLink)),b=solveBalancedPowerFlow(operatingNetworkFromStudio(merged));
const A=new Map(a.buses.map(x=>[x.id,x])),B=new Map(b.buses.map(x=>[x.id,x]));
ok(Math.abs(A.get('ld').voltagePu-B.get('ld').voltagePu)<1e-12&&Math.abs(A.get('lv2').voltagePu-B.get('lv').voltagePu)<1e-12,'voltages equal the merged drawing');
const k=a.branches.find(e=>e.id==='k1'),c=b.branches.find(e=>e.id==='c1');
ok(Math.abs(k.fromMW-(c.fromMW+0.1))<1e-9,'breaker carries cable flow + lv2 load: '+k.fromMW.toFixed(6));
ok(Math.abs(A.get('lv').pMW+0.2)<1e-9&&Math.abs(A.get('lv2').pMW+0.1)<1e-9,'member bus injections reported as entered');
ok(a.branches.length===3&&a.buses.length===4,'all items reported');
// open breaker -> island
withLink.devices[0].enabled=false;let err='';try{solveBalancedPowerFlow(operatingNetworkFromStudio(withLink))}catch(e){err=e.message}ok(/disconnected island/.test(err),'open breaker islands the load: '+err);
withLink.devices[0].enabled=true;
// blank member entry -> named error
delete withLink.operatingStudy.buses.lv2;err='';try{solveBalancedPowerFlow(operatingNetworkFromStudio(withLink))}catch(e){err=e.message}ok(/LV2: actual net real-power/.test(err),'blank joined bus named: '+err);
withLink.operatingStudy.buses.lv2={type:'PQ',pMW:-0.1,qMvar:0};
// PV joined to slack -> refused
const pv=JSON.parse(JSON.stringify(withLink));pv.branches.push({id:'k2',name:'Tie',kind:'link',from:'ld',to:'ld'});pv.operatingStudy.buses.lv={type:'PV',pMW:0.1,vSetPu:1.0};
pv.branches=pv.branches.filter(e=>e.id!=='k2');pv.buses.push(bus('mv2',11000));pv.branches.push({id:'k3',name:'MV tie',kind:'link',from:'mv',to:'mv2'});pv.operatingStudy.buses.mv2={type:'PV',pMW:0,vSetPu:1};
err='';try{solveBalancedPowerFlow(operatingNetworkFromStudio(pv))}catch(e){err=e.message}ok(/joined to the reference bus/.test(err),'PV tied to slack refused: '+err);
// parallel closed switches -> indeterminate share, still solves
const par=JSON.parse(JSON.stringify(withLink));par.branches.push({id:'k4',name:'Second breaker',kind:'link',from:'lv',to:'lv2'});
const pr=solveBalancedPowerFlow(operatingNetworkFromStudio(par));ok(pr.branches.filter(e=>e.idealLink&&e.currentPu===null).length===1,'loop of switches: one share marked indeterminate');
// cable shorted by switches
const sh=JSON.parse(JSON.stringify(withLink));sh.branches.push(cable('c2','lv','lv2',10));const sr=solveBalancedPowerFlow(operatingNetworkFromStudio(sh));ok(sr.branches.find(e=>e.id==='c2').currentPu===0,'cable bypassed by closed breaker carries no current');
// clamp mode through merge
const cl=JSON.parse(JSON.stringify(withLink));cl.operatingStudy.qLimitMode='clamp';const cr=solveBalancedPowerFlow(operatingNetworkFromStudio(cl));ok(cr.buses.length===4,'clamp mode with switches');
console.log(fail?'FAILURES '+fail:'ALL PASS');process.exit(fail?1:0);
