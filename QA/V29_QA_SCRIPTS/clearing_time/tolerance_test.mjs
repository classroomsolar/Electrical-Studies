import {clearingTime,arcFlashClearingTimes} from '../../../SITE/clearing-time-v29.mjs';
let p=0,f=0;const ok=(c,m)=>{c?p++:(f++,console.log('FAIL',m))};const near=(a,b)=>Math.abs(a-b)<1e-9;
const si=M=>0.14/(M**0.02-1);
const d={type:'relay',standard:'IEC',curve:'SI',pickupA:100,dial:0.1,breakerMode:'cycles',breakerCycles:5,frequencyHz:60};
let r=clearingTime(d,1000);ok(near(r.seconds,0.1*si(10)+5/60)&&!r.band,'nominal');
r=clearingTime({...d,tolPickupPercent:5,tolTimePercent:5,tolTimeMs:30},1000);
const slowRelay=0.1*si(1000/105),fastRelay=0.1*si(1000/95);
ok(near(r.band.slowS,slowRelay+Math.max(slowRelay*0.05,0.03)+5/60),'slow edge '+r.band.slowS);
ok(near(r.band.fastS,fastRelay-Math.max(fastRelay*0.05,0.03)+5/60),'fast edge');ok(near(r.seconds,r.band.slowS)&&r.band.fastS<r.nominalS&&r.nominalS<r.seconds,'ordering');
// percent dominates when time large
r=clearingTime({...d,dial:1,tolTimePercent:5,tolTimeMs:30},150);const t=si(1.5);ok(near(r.band.slowS-5/60,t*1.05),'percent dominates');
// near pickup: nominal trips but slow edge does not
r=clearingTime({...d,tolPickupPercent:5},103);ok(r.status==='MAY NOT TRIP (TOLERANCE)','may not trip');
// instantaneous with pickup tolerance: 6000 A inst, I=6200 -> slow edge needs >6300 -> falls back to inverse
r=clearingTime({...d,instPickupA:6000,tolPickupPercent:5,tolTimeMs:20},6200);ok(r.band.slowElement==='51 inverse time'&&r.nominalS<0.2,'inst lost at slow edge');
// arc flash wrapper passes band through
r=arcFlashClearingTimes({...d,tolTimePercent:7.5},10,5);ok(r.full.band&&r.reduced.seconds>r.full.seconds,'arc flash band');
for(const bad of [{tolPickupPercent:30},{tolTimePercent:-1},{tolTimeMs:500}]){let th=false;try{clearingTime({...d,...bad},1000)}catch{th=true}ok(th,'reject '+JSON.stringify(bad))}
console.log('pass',p,'fail',f);
