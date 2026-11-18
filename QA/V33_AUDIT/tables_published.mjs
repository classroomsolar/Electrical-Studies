// B1 audit: limit/code tables in the calculators vs widely published values
// IEEE 519-2014 Tables 1, 2, 3 (current and voltage limits; 2022 keeps the same odd/TDD values) and
// NEC 2023 Tables 250.122, 240.6(A), 240.4(D). Expected values transcribed independently here, not read from the site.
import {currentLimitRow,harmonicLimit,VOLTAGE_LIMITS} from '../../SITE/power-quality-v29.mjs';
import {EGC_TABLE,STANDARD_OCPD,SMALL_CONDUCTOR_MAX} from '../../SITE/cable-sizing-v29.mjs';
import {writeFileSync} from 'node:fs';
let pass=0,fail=0;const bad=[];const eq=(n,a,b)=>{const ok=JSON.stringify(a)===JSON.stringify(b);ok?pass++:(fail++,bad.push({n,a,b}))};
const T2={10:[[4,2,1.5,.6,.3],5],30:[[7,3.5,2.5,1,.5],8],70:[[10,4.5,4,1.5,.7],12],500:[[12,5.5,5,2,1],15],2000:[[15,7,6,2.5,1.4],20]};
const T3={10:[[2,1,.75,.3,.15],2.5],30:[[3.5,1.75,1.25,.5,.25],4],70:[[5,2.25,2,.75,.35],6],500:[[6,2.75,2.5,1,.5],7.5],2000:[[7.5,3.5,3,1.25,.7],10]};
for(const [kv,T] of [[13.8,T2],[115,T3]])for(const [ratio,[odd,tdd]] of Object.entries(T)){const r=currentLimitRow(kv,+ratio);eq(`519 ${kv}kV Isc/IL=${ratio} odd`,r.odd,odd);eq(`519 ${kv}kV Isc/IL=${ratio} TDD`,r.tdd,tdd)}
eq('519 band edge Isc/IL=20 is the 20–50 row',currentLimitRow(13.8,20).tdd,8);eq('519 band edge 50',currentLimitRow(13.8,50).tdd,12);
eq('519 2014 even h=4 = 25% of odd',harmonicLimit(4,currentLimitRow(13.8,30),'2014'),1.75);
eq('519 Table 1 voltage limits',VOLTAGE_LIMITS.map(v=>[v.individual,v.thd]),[[5,8],[3,5],[1.5,2.5],[1,1.5]]);
const EGC=[[15,'14 AWG','12 AWG'],[20,'12 AWG','10 AWG'],[60,'10 AWG','8 AWG'],[100,'8 AWG','6 AWG'],[200,'6 AWG','4 AWG'],[300,'4 AWG','2 AWG'],[400,'3 AWG','1 AWG'],[500,'2 AWG','1/0 AWG'],[600,'1 AWG','2/0 AWG'],[800,'1/0 AWG','3/0 AWG'],[1000,'2/0 AWG','4/0 AWG'],[1200,'3/0 AWG','250 kcmil'],[1600,'4/0 AWG','350 kcmil'],[2000,'250 kcmil','400 kcmil'],[2500,'350 kcmil','600 kcmil'],[3000,'400 kcmil','600 kcmil'],[4000,'500 kcmil','750 kcmil'],[5000,'700 kcmil','1200 kcmil'],[6000,'800 kcmil','1200 kcmil']];
for(const [a,cu,al] of EGC){const r=EGC_TABLE.find(x=>x[0]===a);eq('250.122 '+a+' A',r&&[r[1],r[2]],[cu,al])}
eq('240.6(A) standard ratings (2020 list)',STANDARD_OCPD['2020'],[15,20,25,30,35,40,45,50,60,70,80,90,100,110,125,150,175,200,225,250,300,350,400,450,500,600,700,800,1000,1200,1600,2000,2500,3000,4000,5000,6000]);
if(STANDARD_OCPD['2023'])eq('240.6(A) 2023 adds 10 A',STANDARD_OCPD['2023'][0],10);
eq('240.4(D) small conductors',SMALL_CONDUCTOR_MAX,{Copper:{'14 AWG':15,'12 AWG':20,'10 AWG':30},Aluminum:{'12 AWG':15,'10 AWG':25}});
writeFileSync(new URL('./results/tables_published.json',import.meta.url),JSON.stringify({pass,fail,bad},null,1));console.log({pass,fail,bad});process.exit(fail?1:0);
