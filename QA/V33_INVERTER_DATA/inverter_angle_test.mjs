// V33 (D4): real inverter fault data can be entered for every inverter at once through the Equipment table (angle_deg and fault_A),
// and then the plant's buses are calculated instead of screening bounds. Also checks that a blank angle keeps the bound.
const S=new URL('../../SITE/',import.meta.url).href;
const B=await import(S+'plant-builder.mjs'),M=await import(S+'network-model.mjs'),E=await import(S+'network-engine.mjs');
let pass=0,fail=0;const ok=(n,c,i='')=>{c?pass++:fail++;console.log((c?'ok   ':'FAIL ')+n,i)};
const spec={poiVoltageKV:34.5,utilityFaultKA:20,utilityXR:15,feeders:3,blocksPerFeeder:4,mvCableLengthM:300,mvCableROhmKm:0.16,mvCableXOhmKm:0.12,mvCableRuns:1,txKVA:3000,txZPercent:6,txXR:8,lvVoltageV:690,invPerBlock:6,invKVA:125,invFaultA:130,invAngleDeg:null,lvCableLengthM:0};for(const [k] of B.BUILDER_OPTIONS)spec[k]=true;
const parts=B.buildPlant(spec),p=M.emptyProject();Object.assign(p,{buses:parts.buses,branches:parts.branches,sources:parts.sources,devices:parts.devices});const q=M.normalizeProject(structuredClone(p));
const count=r=>r.results.reduce((o,x)=>(o[x.status]=(o[x.status]||0)+1,o),{});
const before=E.calculateProject(structuredClone(q));const cb=count(before);ok('blank angle: buses are screening bounds',(cb['SCREENING BOUND']||0)>0,JSON.stringify(cb));
// download the table, write datasheet values for every PV row: fault current 135 A at -25 degrees
const rows=B.parseCsv(B.equipmentCsv(q));const head=rows[0],ix=k=>head.findIndex(h=>h===k||h.startsWith(k+' '));const inv=new Set(q.sources.filter(s=>s.model==='current').map(s=>s.id));
const edited=[head,...rows.slice(1).filter(r=>inv.has(r[ix('id')])).map(r=>{const x=Array(head.length).fill('');x[ix('id')]=r[ix('id')];x[ix('fault_A')]='135';x[ix('angle_deg')]='-25';return x})];
const csv=edited.map(r=>r.map(c=>/[",\n]/.test(c)?'"'+c.replaceAll('"','""')+'"':c).join(',')).join('\n');
const res=B.applyEquipmentCsv(q,csv);const pv=q.sources.filter(s=>inv.has(s.id));
ok('every inverter row matched',pv.length>0&&res.matched===pv.length&&res.errors.length===0,JSON.stringify({matched:res.matched,pv:pv.length,errors:res.errors.slice(0,2)}));
ok('angle and current stored',pv.every(s=>s.angle===-25&&s.faultA===135));
const after=E.calculateProject(structuredClone(M.normalizeProject(q)));const ca=count(after);
ok('known angle: no screening bounds left',!(ca['SCREENING BOUND']>0)&&ca['CALCULATED']===q.buses.length,JSON.stringify(ca));
const poiB=before.results[0],poiA=after.results[0];ok('POI: bound before, calculated after',poiB.status==='SCREENING BOUND'&&poiA.status==='CALCULATED',`${(poiB.totalA/1e3).toFixed(3)} kA bound -> ${(poiA.totalA/1e3).toFixed(3)} kA`);
ok('calculated value is not above the bound with the same currents',(()=>{const r=structuredClone(q);r.sources.filter(s=>inv.has(s.id)).forEach(s=>{s.angle=null});const b=E.calculateProject(M.normalizeProject(r));return after.results.every((x,i)=>x.totalA<=b.results[i].totalA*(1+1e-9))})());
console.log({pass,fail});process.exit(fail?1:0);
