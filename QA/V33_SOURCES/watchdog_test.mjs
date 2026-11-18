// V33: the "Calculation did not complete" limit grows with buses x sources. Fake worker and timers; no browser needed.
const {runCalculation}=await import(new URL('../../SITE/network-calculation.mjs',import.meta.url).href);
let pass=0,fail=0;const ok=(n,c,i='')=>{c?pass++:fail++;console.log((c?'ok   ':'FAIL ')+n,i)};
function limitFor(buses,sources,base){
 const timers=[];let result=null;
 class W{constructor(){setTimeout(()=>this.onmessage({data:{phase:'started',revision:1}}),0)}postMessage(){}terminate(){}}
 const project={buses:Array.from({length:buses},(_,i)=>({id:'b'+i})),sources:Array.from({length:sources},(_,i)=>({id:'s'+i}))};
 const opts={project,revision:1,onResult:r=>{result=r},WorkerClass:W,workerUrl:'x',setTimer:(f,ms)=>{timers.push({f,ms});return timers.length},clearTimer:()=>{},compute:()=>({results:[],issues:[]})};
 if(base!==undefined)opts.resultTimeoutMs=base;
 runCalculation(opts);
 return new Promise(r=>setTimeout(()=>{const t=timers.at(-1);t.f();r({ms:t.ms,result})},20));
}
let x=await limitFor(3,1);ok('small project keeps 30 s',x.ms===30000,x.ms);
x=await limitFor(1970,71);ok('1,970 buses x 71 sources keeps 30 s',x.ms===30000,x.ms);
x=await limitFor(1900,1681);ok('1,900 x 1,681 gets about 2 minutes',x.ms===30000+Math.round(1900*1681*0.03),x.ms);
ok('message when the limit is reached',/did not complete/.test(x.result?.error||''),x.result?.error);
x=await limitFor(4000,4000);ok('never more than 3 minutes',x.ms===180000,x.ms);
x=await limitFor(1900,1681,1000);ok('a caller-given limit is still the base',x.ms===1000+Math.round(1900*1681*0.03),x.ms);
console.log({pass,fail});process.exit(fail?1:0);
