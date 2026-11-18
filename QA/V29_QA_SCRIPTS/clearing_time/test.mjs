import {clearingTime,arcFlashClearingTimes,parseCurvePoints} from '../../../SITE/clearing-time-v29.mjs';
let p=0,f=0;const ok=(c,m)=>{c?p++:(f++,console.log('FAIL',m))};const near=(a,b,t=0.006)=>Math.abs(a-b)<=t*Math.max(1,Math.abs(b));
// Published check table (Schneider ADVC3 manual, Appendix E, TD=1): multiples 2,5,10
const tab={MI:[3.80,1.69,1.21],VI:[7.03,1.31,0.69],EI:[9.52,1.30,0.41]};
for(const [c,v] of Object.entries(tab))[2,5,10].forEach((M,i)=>{const r=clearingTime({type:'relay',standard:'IEEE',curve:c,pickupA:100,dial:1,breakerMode:'ms',breakerMs:0.001},100*M);ok(Math.abs(r.relayS-v[i])<=0.006,`IEEE ${c} M${M} ${r.relayS}`)});
// IEC hand values TMS=1, M=10: SI 2.971, VI 1.5, EI 0.808, LTI 13.33
const iec={SI:0.14/(10**0.02-1),VI:1.5,EI:80/99,LTI:120/9};
for(const [c,v] of Object.entries(iec)){const r=clearingTime({type:'relay',standard:'IEC',curve:c,pickupA:200,dial:1,breakerMode:'cycles',breakerCycles:5,frequencyHz:60},2000);ok(near(r.relayS,v,1e-9)&&near(r.seconds,v+5/60,1e-9),'IEC '+c)}
// TMS scales linearly
const a=clearingTime({type:'relay',standard:'IEC',curve:'VI',pickupA:100,dial:0.1,breakerMode:'none'},1000),b=clearingTime({type:'relay',standard:'IEC',curve:'VI',pickupA:100,dial:0.5,breakerMode:'none'},1000);ok(near(b.relayS,5*a.relayS,1e-12),'tms linear');
// instantaneous governs above pickup
let r=clearingTime({type:'relay',standard:'IEEE',curve:'VI',pickupA:600,dial:2,instPickupA:6000,instDelayS:0.05,breakerMode:'cycles',breakerCycles:3,frequencyHz:60},20000);ok(r.governingElement==='50 instantaneous'&&near(r.seconds,0.05+0.05,1e-9),'inst '+r.seconds);
r=clearingTime({type:'relay',standard:'IEEE',curve:'VI',pickupA:600,dial:2,instPickupA:6000,breakerMode:'cycles',breakerCycles:5,frequencyHz:60},5000);ok(r.governingElement==='51 inverse time','below inst');
// definite time
r=clearingTime({type:'relay',dtPickupA:1000,dtDelayS:0.3,breakerMode:'cycles',breakerCycles:5,frequencyHz:50},4000);ok(near(r.seconds,0.4,1e-9),'definite');
// does not trip
r=clearingTime({type:'relay',standard:'IEC',curve:'SI',pickupA:1000,dial:0.2,breakerMode:'cycles',breakerCycles:5,frequencyHz:60},900);ok(r.status==='DOES NOT TRIP'&&r.seconds===null,'no trip');
// curve interpolation (log-log): straight line on log-log gives exact power law t=100/I^2
const csv='10,0.5,1\n100,0.005,0.01\n1000,0.00005,0.0001';
r=clearingTime({type:'curve',model:'Test fuse',csv},31.6227766);ok(near(r.maxCurveS,0.1,1e-6),'loglog '+r.maxCurveS);
r=clearingTime({type:'curve',model:'Test fuse',csv},5000);ok(r.status==='OUTSIDE CURVE RANGE','outside');
// arc flash share
r=arcFlashClearingTimes({type:'relay',standard:'IEEE',curve:'EI',pickupA:1000,dial:1,breakerMode:'cycles',breakerCycles:5,frequencyHz:60,sharePercent:50},20,10);ok(near(r.full.currentA,10000)&&r.reduced.seconds>r.full.seconds,'share/reduced slower');
// manual
r=clearingTime({type:'manual',ms:83},1000);ok(r.seconds===0.083,'manual');
// invalid inputs
for(const d of [null,{type:'x'},{type:'relay',standard:'IEC',curve:'XX',pickupA:1,dial:1,breakerMode:'none'},{type:'relay',standard:'IEC',curve:'SI',pickupA:-1,dial:1,breakerMode:'none'},{type:'relay',standard:'IEC',curve:'SI',pickupA:1,dial:0,breakerMode:'none'},{type:'relay',standard:'IEC',curve:'SI',pickupA:1,dial:1,breakerMode:'cycles',breakerCycles:4,frequencyHz:60},{type:'relay',breakerMode:'none'},{type:'curve',model:'x',csv:'1,2,3'},{type:'curve',model:'x',csv:'10,1,2\n5,0.5,1'},{type:'curve',model:'x',csv:'10,1,2\n20,0.5,3'},{type:'manual',ms:0}]){let t=false;try{clearingTime(d,1000)}catch(e){t=true}ok(t,'reject '+JSON.stringify(d))}
let t=false;try{clearingTime({type:'manual',ms:5},NaN)}catch{t=true}ok(t,'nan current');
// random: monotonic non-increasing time with current for every relay setting
let seed=3;const rnd=()=>(seed=(seed*1103515245+12345)%2147483648)/2147483648;let mono=0;
for(let i=0;i<2000;i++){const std=rnd()<.5?'IEC':'IEEE',curve=std==='IEC'?['SI','VI','EI','LTI'][Math.floor(rnd()*4)]:['MI','VI','EI'][Math.floor(rnd()*3)];
 const d={type:'relay',standard:std,curve,pickupA:50+rnd()*2000,dial:0.05+rnd()*(std==='IEC'?1:10),breakerMode:'cycles',breakerCycles:[2,3,5,8][Math.floor(rnd()*4)],frequencyHz:rnd()<.5?50:60};
 if(rnd()<.5){d.instPickupA=d.pickupA*(4+rnd()*20);d.instDelayS=rnd()*0.1}
 let prev=Infinity;for(const m of [1.2,1.5,2,3,5,8,12,20,40]){const r=clearingTime(d,d.pickupA*m);ok(r.status==='OK'&&r.seconds>0&&r.seconds<=prev+1e-12,'mono');prev=r.seconds;mono++}}
console.log('monotonic checks',mono);console.log('pass',p,'fail',f);
