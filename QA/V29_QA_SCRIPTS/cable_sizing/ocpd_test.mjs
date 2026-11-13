import {sizeConductor as S,STANDARD_OCPD,EGC_TABLE} from '../../../SITE/cable-sizing-v29.mjs';
let p=0,f=0;const ok=(c,m)=>{c?p++:(f++,console.log('FAIL',m))};
const B={material:'Copper',insulationTempC:75,terminationTempC:75,designCurrentA:100,ambientC:30,currentCarryingConductors:3,parallelSets:1,phases:3,voltageV:480,powerFactor:0.85,lengthFt:0};
let r=S({...B,ocpdMode:'auto'});ok(r.ocpd.ratingA===100&&r.recommendedSize==='3 AWG'&&r.egc.size==='8 AWG','100 A auto '+r.recommendedSize+' '+r.egc?.size);
r=S({...B,designCurrentA:105,ocpdMode:'auto'});ok(r.ocpd.ratingA===110&&r.recommendedSize==='2 AWG','105 A -> 110 A OCPD, 2 AWG '+r.recommendedSize);
r=S({...B,ocpdMode:'given',ocpdA:125});ok(r.recommendedSize==='2 AWG'&&/240.4\(B\)/.test(r.rows.find(x=>x.size==='2 AWG').ocpd.rule),'240.4(B) 2 AWG on 125 A '+r.recommendedSize);
r=S({...B,ocpdMode:'given',ocpdA:125,multioutletReceptacles:true});ok(r.recommendedSize==='1 AWG','multioutlet -> 1 AWG '+r.recommendedSize);
r=S({...B,insulationTempC:90,designCurrentA:24,ocpdMode:'auto'});ok(r.ocpd.ratingA===25&&r.recommendedSize==='10 AWG'&&r.rows.find(x=>x.size==='12 AWG').ocpd.reasons.some(t=>t.includes('240.4(D)')),'240.4(D) 12 AWG on 25 A '+r.recommendedSize);
r=S({...B,designCurrentA:900,parallelSets:3,ocpdMode:'given',ocpdA:1000});ok(r.recommendedSize==='400 kcmil','240.4(C) 3x400 '+r.recommendedSize);ok(/250.122\(F\)/.test(r.egc.parallelNote)&&r.egc.size==='2/0 AWG','egc 1000 A cu 2/0');
r=S({...B,continuous:true,ocpdMode:'given',ocpdA:110});ok(r.status==='NO SIZE PASSES'||r.rows.every(x=>x.status||x.ocpd.reasons.some(t=>t.includes('below'))),'OCPD below 125 % load flagged');
r=S({...B,continuous:true,ocpdMode:'auto'});ok(r.ocpd.ratingA===125&&r.recommendedSize==='1 AWG','continuous 125 A -> 1 AWG '+r.recommendedSize);
r=S({...B,necEdition:'2023',designCurrentA:8,ocpdMode:'auto'});ok(r.ocpd.ratingA===10,'2023 has 10 A');r=S({...B,necEdition:'2020',designCurrentA:8,ocpdMode:'auto'});ok(r.ocpd.ratingA===15,'2020 starts at 15 A');
// 250.122(B): upsized for VD -> proportional EGC
r=S({...B,lengthFt:900,maxVoltageDropPercent:2,ocpdMode:'auto'});const inc=r.egc.increasedFor25122B;ok(inc&&inc.minimumUngroundedSize==='3 AWG'&&r.recommendedSize!=='3 AWG','250.122(B) '+JSON.stringify(inc)+' '+r.recommendedSize);
ok(EGC_TABLE.length===21&&STANDARD_OCPD['2023'].length===38,'tables');
// Al small conductor
r=S({...B,material:'Aluminum',designCurrentA:24,insulationTempC:90,ocpdMode:'auto'});ok(r.rows.find(x=>x.size==='10 AWG').ocpdOk===true&&r.recommendedSize==='10 AWG','Al 10 AWG 25 A ok '+r.recommendedSize);
// random: if ocpd given and size passes -> ampacity >= ocpd or 240.4(B) next std
let seed=5;const rnd=()=>(seed=(seed*1103515245+12345)%2147483648)/2147483648;let n=0;
for(let i=0;i<2000;i++){const I=1+rnd()*700,sets=1+Math.floor(rnd()*3);let q;try{q=S({...B,designCurrentA:I,parallelSets:sets,continuous:rnd()<.5,ocpdMode:'auto',currentCarryingConductors:1+Math.floor(rnd()*9)})}catch{continue}
 if(!q.recommendedSize)continue;n++;const w=q.rows.find(x=>x.size===q.recommendedSize),O=q.ocpd.ratingA;
 ok(O>=q.inputs.requiredAmpacityA-1e-9&&(w.allowableA>=O-1e-9||(O<=800&&STANDARD_OCPD['2023'].find(s=>s>=w.allowableA)===O)),'rand '+i)}
console.log('random',n,'pass',p,'fail',f);
