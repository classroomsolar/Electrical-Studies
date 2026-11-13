// V32 builder: (1) add feeders of a second block type to the open project's collector bus; (2) DC array builder.
import {buildPlant,buildDcArray,validateDcSpec,estimateDcCounts,estimateCounts} from '../../SITE/plant-builder.mjs';
import {emptyProject,normalizeProject} from '../../SITE/network-model.mjs';
import {calculateProject} from '../../SITE/network-engine.mjs';
import {arrangeNetwork} from '../../SITE/network-diagram.mjs';
let fail=0;const ok=(c,m)=>{if(!c){fail++;console.log('FAIL',m)}else console.log('ok',m)};
const A={poiVoltageKV:34.5,utilityFaultKA:20,utilityXR:15,feeders:3,blocksPerFeeder:4,mvCableLengthM:300,mvCableROhmKm:0.16,mvCableXOhmKm:0.12,mvCableRuns:1,txKVA:3000,txZPercent:6,txXR:8,lvVoltageV:690,invPerBlock:4,invKVA:800,invFaultA:800,invAngleDeg:-30,lvCableLengthM:0,mainBreaker:true,feederBreakers:true,blockFuses:true,inverterBreakers:true,bess:false};
const p=emptyProject();const a=buildPlant(A);Object.assign(p,{buses:a.buses,branches:a.branches,sources:a.sources,devices:a.devices,selectedBus:a.buses[0].id});
const mv=p.buses.find(b=>b.name==='MV collector');
const B={...A,feeders:2,blocksPerFeeder:3,txKVA:2500,invPerBlock:2,invKVA:1250,invFaultA:1300,bess:true,utilityFaultKA:null,utilityXR:null,mainBreaker:false};
const b=buildPlant(B,{prefix:'BESS',attachTo:{bus:mv,x:5000,y:mv.position.y}});
ok(!b.sources.some(s=>s.kind==='utility')&&!b.buses.some(x=>/POI/.test(x.name)),'attached group has no POI or utility');
ok(b.branches.some(e=>e.from===mv.id),'attached feeders start at the existing collector bus');
p.buses.push(...b.buses);p.branches.push(...b.branches);p.sources.push(...b.sources);p.devices.push(...b.devices);
const q=normalizeProject(p),r=calculateProject(q);const poi=r.results.find(x=>x.busName==='POI');
ok(r.issues.filter(i=>i.severity==='error').length===0,'combined plant has no input errors');
ok(r.results.filter(x=>x.status==='CALCULATED').length===q.buses.length,'every bus calculated ('+q.buses.length+' buses, '+q.sources.length+' sources)');
ok(q.sources.filter(s=>s.kind==='bess').length===12&&q.sources.filter(s=>s.kind==='pv').length===48,'both block types present');
let err='';try{buildPlant({...B,poiVoltageKV:13.8},{attachTo:{bus:mv,x:0,y:0}})}catch(e){err=e.message}ok(/34.5 kV/.test(err),'voltage mismatch refused: '+err);
// DC array
const D={dcVoltageV:1500,dcInverters:2,combinersPerInverter:6,stringsPerCombiner:24,stringVocV:1450,stringSourceOhm:40,stringCableLengthM:80,stringCableROhmKm:4.6,combinerCableLengthM:150,combinerCableROhmKm:0.13,combinerCableRuns:2,stringFuses:true,combinerSwitches:true};
ok(validateDcSpec(D).length===0,'DC spec valid');ok(validateDcSpec({...D,stringSourceOhm:0}).length===1,'zero source resistance refused');
const dc=buildDcArray(D),c=estimateDcCounts(D);ok(dc.buses.length===c.buses&&dc.devices.length===c.devices,'DC counts match estimate ('+c.buses+' buses)');
const pd=emptyProject();pd.settings.faultType='dc';pd.settings.faultR=0;pd.settings.faultX=0;Object.assign(pd,{buses:dc.buses,branches:dc.branches,sources:dc.sources,devices:dc.devices,selectedBus:dc.buses[0].id});
const pos=arrangeNetwork(pd);for(const x of pd.buses)x.position=pos.get(x.id)||x.position;
const qd=normalizeProject(pd);const t=Date.now(),rd=calculateProject(qd);
ok(rd.issues.filter(i=>i.severity==='error').length===0,'DC array has no input errors: '+rd.issues.filter(i=>i.severity==='error').slice(0,2).map(i=>i.message).join(' | '));
const invBus=rd.results.find(x=>x.busName==='INV1 DC input');ok(invBus&&invBus.status==='CALCULATED'&&invBus.totalA>0,'inverter DC input fault '+(invBus?.totalA/1000).toFixed(2)+' kA in '+(Date.now()-t)+' ms');
// hand check: 144 strings to INV1 through 6 combiner cables; fault at inverter input, string+cable resistance each path
const Rs=40+2*0.08*4.6,Rc=2*0.15*0.13/2;// matched pair: 2 x one-way length; combiner cable 2 runs
const Icb=24*1450/Rs,Iexp=6*(24*1450/(Rs+24*Rc));// each combiner: 24 parallel strings (1450/Rs each) through Rc
const Iexact=6*1450/(Rs/24+Rc);ok(Math.abs(invBus.totalA-Iexact)/Iexact<1e-9,'hand check INV1 input: '+invBus.totalA.toFixed(3)+' A vs '+Iexact.toFixed(3)+' A');
console.log(fail?'FAILURES '+fail:'ALL PASS');process.exit(fail?1:0);
