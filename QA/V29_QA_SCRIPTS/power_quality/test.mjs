import {ieee519Check,pfCorrection,harmonicLimit,currentLimitRow} from '../../../SITE/power-quality-v29.mjs';
let p=0,f=0;const ok=(c,m)=>{c?p++:(f++,console.log('FAIL',m))};const near=(a,b,t=1e-9)=>Math.abs(a-b)<=t*Math.max(1,Math.abs(b));
// Table 2 rows by Isc/IL (IEEE 519-2014/2022, verified against IEEE IAS Atlanta slides)
const exp=[[10,[4,2,1.5,0.6,0.3],5],[30,[7,3.5,2.5,1,0.5],8],[70,[10,4.5,4,1.5,0.7],12],[500,[12,5.5,5,2,1],15],[2000,[15,7,6,2.5,1.4],20]];
for(const [r,o,t] of exp){const row=currentLimitRow(0.48,r);ok(JSON.stringify(row.odd)===JSON.stringify(o)&&row.tdd===t,'T2 '+r)}
ok(currentLimitRow(0.48,20).tdd===8,'boundary 20 -> 20<50 row');
ok(currentLimitRow(115,10).tdd===2.5&&currentLimitRow(115,60).odd[0]===5,'T3');
// even harmonics
const row=currentLimitRow(0.48,30);
ok(harmonicLimit(5,row)===7&&harmonicLimit(2,row,'2022')===3.5&&harmonicLimit(4,row,'2022')===3.5&&harmonicLimit(6,row,'2022')===3.5,'2022 even <=6 50%');
ok(harmonicLimit(8,row,'2022')===7&&harmonicLimit(12,row,'2022')===3.5,'2022 even >6 same as odd');
ok(harmonicLimit(2,row,'2014')===1.75&&harmonicLimit(12,row,'2014')===0.875,'2014 even 25%');
// worked check: 480 V, Isc 30 kA, IL 1000 A -> ratio 30 -> row 20-50. currents 5th 60 A(6%), 7th 40 A(4%), 11th 30 A(3%)
let r=ieee519Check({pccVoltageKV:0.48,iscA:30000,ilA:1000,currents:{5:60,7:40,11:30},voltagesPercent:{5:3,7:2}});
ok(r.iscOverIl===30&&near(r.tddPercent,Math.sqrt(36+16+9))&&r.tddOk&&r.currentOk,'pass case tdd '+r.tddPercent);
ok(near(r.thdPercent,Math.sqrt(13))&&r.voltageOk&&r.voltageIndividualLimit===5&&r.voltageThdLimit===8,'voltage');
r=ieee519Check({pccVoltageKV:0.48,iscA:30000,ilA:1000,currents:{5:75,7:40,11:40}});ok(!r.currentOk&&r.currentRows.find(x=>x.h===5).ok===false&&r.currentRows.find(x=>x.h===11).ok===false,'fail case');
r=ieee519Check({pccVoltageKV:13.8,iscA:5000,ilA:400,currentPercent:{5:4,7:3},voltagesPercent:{5:3.5}});ok(r.voltageIndividualLimit===3&&!r.voltageOk,'MV voltage limits');
r=ieee519Check({pccVoltageKV:0.48,iscA:30000,ilA:1000,edition:'2014',includesGeneration:true,currents:{5:60}});ok(r.tddLimit===5&&r.currentRows[0].limitPercent===4&&!r.currentOk,'2014 generation row');
for(const bad of [{},{pccVoltageKV:0.48,iscA:100,ilA:200},{pccVoltageKV:230,iscA:1e4,ilA:10},{pccVoltageKV:0.48,iscA:1e4,ilA:10,currents:{1:5}},{pccVoltageKV:0.48,iscA:1e4,ilA:10,currents:{5:-1}}]){let t=false;try{ieee519Check(bad)}catch{t=true}ok(t,'reject '+JSON.stringify(bad))}
// PF correction: 1000 kW from 0.8 to 0.95: Q = 1000*(0.75-0.328684)=421.32 kvar
r=pfCorrection({pKW:1000,pfExisting:0.8,pfTarget:0.95,voltageKV:0.48,scMVA:25});
ok(near(r.requiredKvar,1000*(0.75-Math.sqrt(1-0.9025)/0.95)),'kvar '+r.requiredKvar);ok(near(r.pfWithBank,0.95),'pf after');
ok(near(r.resonance.order,Math.sqrt(25000/r.requiredKvar)),'h '+r.resonance.order);// 7.70 -> near 7 (10%)? |7.70-7|/7=0.1 -> exactly boundary check
r=pfCorrection({pKW:1000,pfExisting:0.8,pfTarget:0.95,voltageKV:0.48,scMVA:10.5,kvarInstalled:420});ok(near(r.resonance.order,5)&&r.status==='RESONANCE RISK'&&r.resonance.nearHarmonics.includes(5),'resonance at 5th');
ok(near(r.voltageRisePercent,4),'voltage rise');
r=pfCorrection({pKW:1000,pfExisting:0.8,pfTarget:0.95,voltageKV:0.48,scMVA:40,kvarInstalled:400,steps:4});ok(r.steps.length===4&&near(r.steps[0].order,Math.sqrt(40000/100)),'steps');ok(r.status==='RESONANCE RISK AT A STEP'||r.status==='RESONANCE RISK'||r.status.startsWith('NO'),'step status '+r.status);
r=pfCorrection({pKW:1000,pfExisting:0.95,pfTarget:0.95,voltageKV:0.48,scMVA:40});ok(r.status==='NO CORRECTION NEEDED','no correction');
for(const bad of [{pKW:1000,pfExisting:0.9,pfTarget:0.8,voltageKV:0.48,scMVA:10},{pKW:1000,pfExisting:0.8,pfTarget:0.95,voltageKV:0.48,scMVA:0},{pKW:1000,pfExisting:0.8,pfTarget:0.95,voltageKV:0.48,scMVA:10,harmonics:[1.5]}]){let t=false;try{pfCorrection(bad)}catch{t=true}ok(t,'pf reject')}
console.log('pass',p,'fail',f);
