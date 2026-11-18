import {sizeConductor as S,CABLE_SIZING_DATA as D} from '../../../SITE/cable-sizing-v29.mjs';
let p=0,f=0;const ok=(c,m)=>{c?p++:(f++,console.log('FAIL',m))};
const base={material:'Copper',insulationTempC:75,terminationTempC:75,designCurrentA:100,ambientC:30,currentCarryingConductors:3,parallelSets:1,phases:3,voltageV:480,powerFactor:0.85,lengthFt:0};
let r=S(base);ok(r.recommendedSize==='3 AWG',r.recommendedSize); // 3 AWG 75C =100
r=S({...base,continuous:true});ok(r.recommendedSize==='1 AWG','cont '+r.recommendedSize); //125 -> 1 AWG 130
r=S({...base,insulationTempC:90,ambientC:40});ok(r.factors.ambient.factor===0.91,'amb '+r.factors.ambient.factor);
r=S({...base,currentCarryingConductors:6});ok(r.factors.ccc.factor===0.8,'ccc');
r=S({...base,insulationTempC:90,terminationTempC:60,designCurrentA:50});ok(r.recommendedSize==='6 AWG','term '+r.recommendedSize);// 60C 6AWG=55
// VD hand check
r=S({...base,lengthFt:500,maxVoltageDropPercent:3});const row=r.rows.find(x=>x.size===r.recommendedSize);
const rx=D.rx['Copper|'+row.size];const v=Math.sqrt(3)*100*0.5*(rx[0]*0.85+rx[1]*Math.sqrt(1-0.7225));ok(Math.abs(v-row.voltageDrop.volts)<1e-9&&row.voltageDrop.percent<=3,'vd');
console.log('VD pick',r.recommendedSize,row.voltageDrop.percent.toFixed(2),r.governedBy);
// SC
r=S({...base,faultCurrentA:20000,clearingTimeS:0.5,insulationClass:'EPR/XLPE'});const rr=r.rows.find(x=>x.size===r.recommendedSize);
ok(rr.shortCircuit.currentPerConductorA<=rr.shortCircuit.withstandA,'sc');console.log('SC pick',r.recommendedSize,r.governedBy);
// parallel
r=S({...base,designCurrentA:600,parallelSets:2});ok(r.rows.find(x=>x.size==='2 AWG').status?.includes('1/0'),'par');console.log('par',r.recommendedSize);
// errors
for(const bad of [{designCurrentA:NaN},{material:'Gold'},{insulationTempC:60,terminationTempC:75},{ambientC:200},{insulationTempC:60,ambientC:60},{faultCurrentA:1000},{voltageV:-1},{powerFactor:2}]){let t=false;try{S({...base,...bad})}catch(e){t=true}ok(t,'err '+JSON.stringify(bad))}
r=S({...base,designCurrentA:20000});ok(r.status==='NO SIZE PASSES','huge');
r=S({...base,material:'Aluminum',designCurrentA:100});console.log('Al',r.recommendedSize);ok(r.recommendedSize==='1 AWG','al '+r.recommendedSize);
r=S({...base,lengthFt:100,maxVoltageDropPercent:3});ok(r.recommendedSize==='2 AWG'&&r.skippedForMissingRX[0]==='3 AWG','missing rx flagged');
r=S({...base,lengthFt:100,maxVoltageDropPercent:3,customRX:{size:'3 AWG',rOhmPerKft:0.25,xOhmPerKft:0.05}});ok(r.recommendedSize==='3 AWG','custom rx');
// randomized property test: picked size passes every check; all smaller sizes fail at least one
let seed=7;const rnd=()=>(seed=(seed*1103515245+12345)%2147483648)/2147483648;let props=0;
for(let i=0;i<3000;i++){const ins=['60','75','90'][Math.floor(rnd()*3)];const term=['60','75'].filter(t=>+t<=+ins)[Math.floor(rnd()*(ins==='60'?1:2))];
 const x={necEdition:rnd()<.5?'2020':'2023',material:rnd()<.5?'Copper':'Aluminum',insulationTempC:+ins,terminationTempC:+term,designCurrentA:1+rnd()*1500,continuous:rnd()<.5,ambientC:-10+rnd()*(+ins-15),currentCarryingConductors:1+Math.floor(rnd()*30),parallelSets:1+Math.floor(rnd()*4),phases:rnd()<.5?1:3,voltageV:[120,208,240,480,600][Math.floor(rnd()*5)],powerFactor:.5+rnd()*.5,lengthFt:rnd()*1500,maxVoltageDropPercent:rnd()<.3?null:1+rnd()*5};
 if(rnd()<.5){x.faultCurrentA=1000+rnd()*60000;x.clearingTimeS=.01+rnd()*1;x.insulationClass=['PVC <=300 mm2','EPR/XLPE','Rubber'][Math.floor(rnd()*3)]}
 let q;try{q=S(x)}catch(e){continue}props++;
 const i0=q.rows.findIndex(w=>w.size===q.recommendedSize);
 if(q.recommendedSize){const w=q.rows[i0];ok(w.allowableA>=q.inputs.requiredAmpacityA-1e-9&&w.voltageDropOk!==false&&w.shortCircuitOk!==false,'pick passes '+i);
  ok(q.rows.slice(0,i0).every(w=>w.status||!w.pass),'smaller fail '+i)}else ok(q.rows.every(w=>w.status||!w.pass),'none '+i)}
console.log('property cases',props);
console.log('pass',p,'fail',f);
