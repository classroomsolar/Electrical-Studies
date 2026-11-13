import {clearingTime} from '../../../SITE/clearing-time-v29.mjs';
import {TCC_CURVES,curveCsv} from '../../../SITE/tcc-library-v29.mjs';
let p=0,f=0;const ok=(c,m)=>{c?p++:(f++,console.log('FAIL',m))};const near=(a,b)=>Math.abs(a-b)<1e-9;
const d={type:'lsi',inA:800,irMult:1,ltDelayS:10,sdMult:4,sdDelayS:0.3,iiMult:10,instClearMs:50};
ok(near(clearingTime(d,2400).seconds,40),'LT I2t');ok(near(clearingTime(d,4000).seconds,0.3),'ST flat');ok(near(clearingTime(d,20000).seconds,0.05),'INST');
ok(clearingTime(d,700).status==='DOES NOT TRIP','below Ir');
ok(near(clearingTime({...d,clearAddMs:30},4000).seconds,0.33),'ST + extra');ok(near(clearingTime({...d,clearAddMs:30},20000).seconds,0.05),'INST not shifted');
let r=clearingTime({...d,tolPickupPercent:10,tolTimePercent:10},8500);ok(r.band&&near(r.seconds,0.33)&&r.band.slowElement==='short time','inst lost at +10 % pickup -> ST +10 %');
r=clearingTime({...d,sdMult:undefined,sdDelayS:undefined},4000);ok(near(r.seconds,10*(4800/4000)**2),'no ST -> LT');
for(const bad of [{inA:0},{sdMult:4,sdDelayS:undefined},{iiMult:10,instClearMs:undefined},{instClearMs:500},{clearAddMs:900}]){let t=false;try{clearingTime({...d,...bad},3000)}catch{t=true}ok(t,'reject '+JSON.stringify(bad))}
// library: every curve monotonic and evaluates at its own points exactly
for(const c of TCC_CURVES){for(const [a,t] of c.points){const q=clearingTime({type:'curve',model:'lib '+c.id,csv:curveCsv(c.id)},a);ok(q.status==='OK'&&Math.abs(q.seconds-t)<1e-9,c.id+' '+a)}}
console.log('pass',p,'fail',f);
