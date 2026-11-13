import {ieee1584Calculate as calc} from '../../../SITE/ieee1584-2018.mjs';
let p=0,f=0;const ck=(n,ok,d='')=>{ok?p++:f++;if(!ok||process.env.V)console.log((ok?'PASS ':'FAIL ')+n+(d?' — '+d:''))};
const base={voltageKV:0.48,boltedFaultKA:30,electrodeConfiguration:'VCB',gapMM:32,workingDistanceMM:457.2,enclosureHeightMM:508,enclosureWidthMM:508,enclosureDepthMM:508,clearingFullMS:100,clearingReducedMS:150};
const E=(o,i=0)=>calc({...base,...o}).cases[i].incidentEnergyJPerCm2;
// physics
ck('E linear in clearing time',Math.abs(E({clearingFullMS:200})/E({})-2)<1e-12);
ck('E falls with working distance',E({workingDistanceMM:900})<E({workingDistanceMM:600})&&E({workingDistanceMM:600})<E({}));
for(const ec of ['VCB','VCBB','HCB','VOA','HOA']){const r=calc({...base,electrodeConfiguration:ec});ck(ec+' reduced arc current < full',r.cases[1].arcingCurrentKA<r.cases[0].arcingCurrentKA);ck(ec+' arc current < bolted',r.cases[0].arcingCurrentKA<base.boltedFaultKA);ck(ec+' AFB: E(AFB)=1.2 cal/cm²',Math.abs(calc({...base,electrodeConfiguration:ec,workingDistanceMM:r.cases[0].arcFlashBoundaryMM}).cases[0].incidentEnergyCalPerCm2-1.2)<1e-9)}
ck('open-air CF = 1',calc({...base,electrodeConfiguration:'HOA'}).enclosure.CF===1);
ck('shallow box detected',calc({...base,voltageKV:0.208,enclosureHeightMM:355.6,enclosureWidthMM:304.8,enclosureDepthMM:100,gapMM:25}).enclosure.type==='Shallow');
// continuity across 600 V model boundary (LV vs HV formulas) — report jump
const lo=calc({...base,voltageKV:0.6}),hi=calc({...base,voltageKV:0.601,gapMM:32});
const jump=Math.abs(hi.cases[0].incidentEnergyJPerCm2/lo.cases[0].incidentEnergyJPerCm2-1);console.log('600 V/601 V model step in E:',(jump*100).toFixed(2)+' % (inherent to IEEE 1584-2018 two-model structure; documented)');
// range edges accepted / rejected
const ok=o=>{try{calc({...base,...o});return true}catch{return false}};
for(const [n,o,exp] of [['0.208 kV',{voltageKV:0.208},true],['0.207 kV',{voltageKV:0.207},false],['15 kV',{voltageKV:15,gapMM:152,boltedFaultKA:20,enclosureWidthMM:762,enclosureHeightMM:1143,workingDistanceMM:914.4},true],['15.01 kV',{voltageKV:15.01,gapMM:152,boltedFaultKA:20},false],['LV 106 kA',{boltedFaultKA:106},true],['LV 107 kA',{boltedFaultKA:107},false],['LV 0.5 kA',{boltedFaultKA:0.5},true],['LV 0.49 kA',{boltedFaultKA:0.49},false],['HV 65 kA',{voltageKV:4.16,gapMM:104,boltedFaultKA:65,enclosureWidthMM:762},true],['HV 66 kA',{voltageKV:4.16,gapMM:104,boltedFaultKA:66,enclosureWidthMM:762},false],['LV gap 6.35',{gapMM:6.35},true],['LV gap 6.3',{gapMM:6.3},false],['LV gap 76.2',{gapMM:76.2},true],['LV gap 80',{gapMM:80},false],['HV gap 19',{voltageKV:4.16,gapMM:19},false],['D 305',{workingDistanceMM:305},true],['D 304',{workingDistanceMM:304},false],['width < 4G',{gapMM:76,enclosureWidthMM:300},false],['T 1 ms',{clearingFullMS:1},true],['T 0.5 ms',{clearingFullMS:0.5},false],['T 2000',{clearingReducedMS:2000},true],['T 2001',{clearingReducedMS:2001},false],['EC lowercase',{electrodeConfiguration:'vcb'},false],['string kA',{boltedFaultKA:'30'},false],['NaN',{gapMM:NaN},false],['Infinity',{workingDistanceMM:Infinity},false],['negative depth',{enclosureDepthMM:-1},false],['huge box',{enclosureHeightMM:20000},false]])ck('range: '+n,ok(o)===exp);
for(const bad of [null,[],'x',42])ck('reject non-object '+JSON.stringify(bad),(()=>{try{calc(bad);return false}catch{return true}})());
// random sweep: every accepted case must give finite positive outputs and reduced arc < full
let n=0,badc=0;const R=(a,b)=>a+Math.random()*(b-a);
for(let k=0;k<5000;k++){const lv=Math.random()<.5,ec=['VCB','VCBB','HCB','VOA','HOA'][k%5];const x={voltageKV:lv?R(0.208,0.6):R(0.601,15),boltedFaultKA:lv?R(0.5,106):R(0.2,65),electrodeConfiguration:ec,gapMM:lv?R(6.35,76.2):R(19.05,254),workingDistanceMM:R(305,3000),enclosureHeightMM:R(200,2000),enclosureWidthMM:0,enclosureDepthMM:R(80,1500),clearingFullMS:R(1,2000),clearingReducedMS:R(1,2000)};x.enclosureWidthMM=R(4*x.gapMM,2000);
 try{const r=calc(x);n++;if(!r.cases.every(c=>c.incidentEnergyJPerCm2>0&&c.arcFlashBoundaryMM>0&&Number.isFinite(c.incidentEnergyJPerCm2))||!(r.cases[1].arcingCurrentKA<r.cases[0].arcingCurrentKA))badc++}catch(e){}}
ck(`random sweep ${n} accepted cases: finite, positive, reduced<full`,badc===0,badc+' bad');
console.log(`${p} passed, ${f} failed`);
