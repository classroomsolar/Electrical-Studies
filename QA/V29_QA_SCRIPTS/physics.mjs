import {calculateProject} from '../../SITE/network-engine.mjs';
const B=(id,v)=>({id,name:id,voltage:v,sequence:{}}),S=(o={})=>({frequency:60,baseMVA:1,scenario:'base',voltageFactor:1,generatorStage:'initial',time:0,faultType:'3phase',assumeZ2:true,faultR:0,faultX:0,auto:true,...o});
const U=(bus,v,kA,xr=10)=>({id:'u-'+bus,kind:'utility',name:'U',bus,voltage:v,faultA:kA*1e3,method:'ka',model:'voltage',xr,angle:0,enabled:true});
const T=(id,f,t,v1,v2,kva,z,xr=8)=>({id,kind:'transformer',name:id,from:f,to:t,v1,v2,power:kva*1e3,zPercent:z,xr,shift:0,enabled:true});
const Cb=(id,f,t,L,runs=1,r=1.6e-4,x=1e-4)=>({id,kind:'cable',name:id,from:f,to:t,length:L,runs,rPerM:r,xPerM:x,enabled:true});
const Lk=(id,f,t)=>({id,kind:'link',name:id,from:f,to:t,enabled:true});
const run=(buses,sources,branches,st)=>{const r=calculateProject({buses,sources,branches,devices:[],pvArrays:[],settings:S(st)});if(r.issues.some(i=>i.severity==='error'))throw Error(JSON.stringify(r.issues));return Object.fromEntries(r.results.map(x=>[x.busId,x.totalA]))};
let pass=0,fail=0;const check=(name,ok,detail)=>{ok?pass++:fail++;console.log((ok?'PASS ':'FAIL ')+name+(detail?' — '+detail:''))};
// 1. historic 65 kA vs 56 kA: utility bus and a bus tied by zero-impedance link must be equal
for(const kA of [10,65,100]){const r=run([B('a',480),B('b',480),B('c',480)],[U('a',480,kA)],[Lk('l1','a','b'),Lk('l2','b','c')]);check(`coincident buses equal at ${kA} kA`,Math.abs(r.a-r.b)/r.a<1e-6&&Math.abs(r.a-r.c)/r.a<1e-6,`${r.a.toFixed(1)} / ${r.b.toFixed(1)} / ${r.c.toFixed(1)} A`)}
// 2. transformer LV current from near-infinite utility -> S/(sqrt3 V z)
for(const [kva,v2,z] of [[750,208,5.3],[2500,480,5.75],[1500,600,6]]){const r=run([B('p',12000),B('s',v2)],[U('p',12000,1e6,1e3)],[T('t','p','s',12000,v2,kva,z)]);const ideal=kva*1e3/(Math.sqrt(3)*v2*z/100);check(`infinite-bus LV current ${kva} kVA ${v2} V`,Math.abs(r.s-ideal)/ideal<2e-3,`${r.s.toFixed(0)} A vs ${ideal.toFixed(0)} A`)}
// 3. LV value is not equal to primary current (voltage reflection)
{const r=run([B('p',12000),B('s',208)],[U('p',12000,3.4,8)],[T('t','p','s',12000,208,750,5.3)]);check('LV fault current reflected by turns ratio, not copied from primary',r.s>5*r.p,`primary ${r.p.toFixed(0)} A, secondary ${r.s.toFixed(0)} A`)}
// 4. monotonic: longer cable -> lower current
{let prev=Infinity,ok=true;for(const L of [1,5,20,50,100,300,1000]){const r=run([B('a',480),B('b',480)],[U('a',480,50)],[Cb('c','a','b',L)]);if(!(r.b<prev))ok=false;prev=r.b}check('fault current falls monotonically with cable length',ok)}
// 5. N parallel runs equal 1 run of 1/N length
{const a=run([B('a',480),B('b',480)],[U('a',480,50)],[Cb('c','a','b',120,4)]),b=run([B('a',480),B('b',480)],[U('a',480,50)],[Cb('c','a','b',30,1)]);check('4 parallel runs × 120 m = 1 run × 30 m',Math.abs(a.b-b.b)/b.b<1e-9)}
// 6. two identical parallel transformers on infinite bus double LV current
{const one=run([B('p',13800),B('s',480)],[U('p',13800,1e6,1e3)],[T('t1','p','s',13800,480,1000,5.75)]),two=run([B('p',13800),B('s',480)],[U('p',13800,1e6,1e3)],[T('t1','p','s',13800,480,1000,5.75),T('t2','p','s',13800,480,1000,5.75)]);check('two parallel transformers double LV current',Math.abs(two.s/one.s-2)<3e-3,(two.s/one.s).toFixed(4)+'×')}
// 7. fault impedance reduces current; voltage factor 1.1 raises by exactly 10 %
{const a=run([B('a',480)],[U('a',480,30)],[]),b=run([B('a',480)],[U('a',480,30)],[],{voltageFactor:1.1}),c=run([B('a',480)],[U('a',480,30)],[],{faultR:.01});check('c = 1.1 raises current by 10 %',Math.abs(b.a/a.a-1.1)<1e-12);check('arcing/fault resistance lowers current',c.a<a.a)}
// 8. superposition: two utilities in parallel on one bus = sum (same X/R)
{const r=run([B('a',480)],[U('a',480,20),{...U('a',480,30),id:'u2'}],[]);check('two same-X/R sources add arithmetically',Math.abs(r.a-50000)<1e-6,r.a.toFixed(3)+' A')}
// 9. delta-wye 30° shift does not change balanced 3-phase magnitude
{const a=run([B('p',12000),B('s',480)],[U('p',12000,5)],[T('t','p','s',12000,480,1000,5.75)]),b=run([B('p',12000),B('s',480)],[U('p',12000,5)],[{...T('t','p','s',12000,480,1000,5.75),shift:30}]);check('30° vector shift leaves 3-phase magnitude unchanged',Math.abs(a.s-b.s)/a.s<1e-12)}
console.log(`\n${pass} passed, ${fail} failed`);
