const B=await import(new URL('../../SITE/plant-builder.mjs',import.meta.url).href);const M=await import(new URL('../../SITE/network-model.mjs',import.meta.url).href);const E=await import(new URL('../../SITE/network-engine.mjs',import.meta.url).href);
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL',m)}};
const spec={poiVoltageKV:34.5,utilityFaultKA:20,utilityXR:15,feeders:7,blocksPerFeeder:10,mvCableLengthM:300,mvCableROhmKm:0.16,mvCableXOhmKm:0.12,mvCableRuns:1,txKVA:3000,txZPercent:6,txXR:8,lvVoltageV:690,invPerBlock:1,invKVA:2500,invFaultA:2500,invAngleDeg:null,lvCableLengthM:15,lvCableROhmKm:0.3,lvCableXOhmKm:0.1,lvCableRuns:2,mainBreaker:true,feederBreakers:true,blockFuses:true,inverterBreakers:true};
ok(B.validateSpec(spec).length===0,'valid spec '+B.validateSpec(spec));
ok(B.validateSpec({...spec,txZPercent:null}).some(e=>/impedance/.test(e)),'missing Z rejected');
ok(B.validateSpec({...spec,invFaultA:0}).length>0,'zero fault rejected');
ok(B.validateSpec({...spec,feeders:1.5}).length>0,'non-integer feeders rejected');
const parts=B.buildPlant(spec),est=B.estimateCounts(spec);
ok(parts.buses.length===est.buses,'bus count '+parts.buses.length+' vs '+est.buses);ok(parts.devices.length===est.devices,'devices');ok(parts.sources.length===est.sources,'sources');
const p=M.emptyProject();Object.assign(p,{buses:parts.buses,branches:parts.branches,sources:parts.sources,devices:parts.devices});const q=M.normalizeProject(structuredClone(p));
const r=E.calculateProject(q),errs=r.issues.filter(i=>i.severity==='error');ok(errs.length===0,'no input errors: '+errs.slice(0,3).map(e=>e.message));
ok(r.results.every(x=>x.totalA>0),'all buses calculated');
// POI current = utility 20 kA + inverter contributions (bounded, unknown angle)
const poi=r.results[0];ok(poi.totalA>20000&&poi.totalA<20000+70*2500*690/34500+1,'POI total in bound '+poi.totalA);
// Hand check: inverter terminal bus current >= its own 2500 A
const invBus=r.results.find(x=>/F1-B01-INV1 AC breaker load side/.test(x.busName));ok(invBus.totalA>2500,'inverter bus includes own contribution');
// CSV round trip: export then import unchanged -> 0 changes; edit one cable length
const csv=B.equipmentCsv(q);const back=B.applyEquipmentCsv(structuredClone(q),csv);ok(back.changes===0&&back.errors.length===0,'round trip no changes '+JSON.stringify({c:back.changes,e:back.errors.slice(0,2)}));
const rows=B.parseCsv(csv),h=rows[0].map(x=>x.replace(/\s*\[.*\]$/,'')),cab=rows.findIndex(rw=>rw[h.indexOf('type')]==='cable');rows[cab][h.indexOf('length_m')]='450';rows[cab][h.indexOf('r_ohm_per_km')]='0.2';
const edited=rows.map(rw=>rw.map(c=>/[",]/.test(c)?'"'+c.replaceAll('"','""')+'"':c).join(',')).join('\n');const q2=structuredClone(q);const res=B.applyEquipmentCsv(q2,edited);
const id=rows[cab][h.indexOf('id')],cb=q2.branches.find(e=>e.id===id);ok(res.changes===2&&cb.length===450&&Math.abs(cb.rPerM-2e-4)<1e-18,'edit applied '+JSON.stringify({c:res.changes,l:cb.length,r:cb.rPerM}));
const bad=B.applyEquipmentCsv(structuredClone(q),'id,length_m\nnope,5\n'+id+',abc');ok(bad.errors.length===2,'errors reported');
const inj=B.equipmentCsv({buses:[{id:'x',name:'=HYPERLINK("a")',voltage:1}],branches:[],sources:[],devices:[]});ok(inj.includes("\"'=HYPERLINK(\"\"a\"\")\""),'formula neutralised '+inj.split('\r\n')[1]);
console.log({pass,fail,buses:q.buses.length});
