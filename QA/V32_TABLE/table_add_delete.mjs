// V32: equipment table can add and delete equipment; added items calculate; nothing is invented for blank cells.
import {equipmentCsv,applyEquipmentCsv,parseCsv} from '../../SITE/plant-builder.mjs';
import {exampleProject,normalizeProject} from '../../SITE/network-model.mjs';
import {calculateProject} from '../../SITE/network-engine.mjs';
let fail=0;const ok=(c,m)=>{if(!c){fail++;console.log('FAIL',m)}else console.log('ok',m)};
const p=exampleProject();const csv=equipmentCsv(p),lines=csv.split('\r\n'),head=lines[0].split(','),cols=head.map(h=>h.replace(/\s*\[.*\]$/,''));
ok(cols[0]==='action','action column first');
const row=o=>cols.map(c=>o[c]??'').join(',');
const main=p.buses.find(b=>b.name==='Main panel');
const add=[row({action:'add',type:'bus',name:'New panel',voltage_V:208}),row({action:'add',type:'cable',name:'Feeder to new panel',from_bus:'Main panel',to_bus:'New panel',length_m:25,runs:1,r_ohm_per_km:0.2,x_ohm_per_km:0.08}),
 row({action:'add',type:'device:breaker',name:'New panel main',from_bus:'New panel',interrupt_A:22000,sccr_A:22000,rated_V:240}),
 row({action:'add',type:'source:motor',name:'Motor M1',bus:'New panel'}),
 row({action:'add',type:'cable',name:'Bad cable',from_bus:'Nowhere',to_bus:'New panel'}),row({action:'add',type:'widget',name:'X'}),row({action:'add',type:'bus',name:'No voltage'})];
const r=applyEquipmentCsv(p,[lines[0],...add].join('\r\n'));
ok(r.added===4,'4 rows added: '+JSON.stringify(r));ok(r.errors.length===3&&/no bus named Nowhere/.test(r.errors.join())&&/type must be/.test(r.errors.join())&&/voltage_V/.test(r.errors.join()),'3 refused with reasons: '+r.errors.join(' | '));
const nb=p.buses.find(b=>b.name==='New panel'),cab=p.branches.find(e=>e.name==='Feeder to new panel'),dev=p.devices.find(d=>d.name==='New panel main'),mot=p.sources.find(s=>s.name==='Motor M1');
ok(nb&&cab&&cab.from===main.id&&cab.to===nb.id&&Math.abs(cab.rPerM-0.0002)<1e-15,'cable connected with converted R');
ok(dev&&dev.equipmentType==='breaker'&&p.branches.some(e=>e.id===dev.linkId&&e.from===nb.id)&&p.buses.some(b=>b.id===dev.bus&&b.name==='New panel main load side'),'breaker with its own load-side bus');
ok(mot&&mot.faultA===null&&mot.xr===null,'motor ratings left blank (not invented)');
const q=normalizeProject(p);const calc=calculateProject(q);ok(calc.issues.some(i=>i.id===mot.id&&i.severity==='error'),'motor without data is reported as an input error (blocks the study until entered)');
const q2=normalizeProject(p);q2.sources=q2.sources.filter(s=>s.id!==mot.id);const res=calculateProject(q2).results.find(x=>x.busId===nb.id);
ok(res&&res.totalA>0&&res.status==='CALCULATED','new bus calculates: '+(res?.totalA/1000).toFixed(3)+' kA, status '+res?.status);
// delete
const r2=applyEquipmentCsv(p,[lines[0],row({action:'delete',id:mot.id}),row({action:'delete',id:dev.id}),row({action:'delete',id:'nope'})].join('\r\n'));
ok(r2.deleted===2&&!p.sources.includes(mot)&&!p.devices.includes(dev)&&!p.branches.some(e=>e.id===dev.linkId),'delete source and device (+ its internal link)');ok(r2.errors.length===1,'unknown id reported');
const r3=applyEquipmentCsv(p,[lines[0],row({action:'delete',id:nb.id})].join('\r\n'));ok(r3.deleted===1&&cab.to===null,'deleting a bus leaves the cable disconnected (as the editor does)');
const r4=applyEquipmentCsv(p,[lines[0],row({action:'remove',id:main.id})].join('\r\n'));ok(r4.errors.length===1&&p.buses.includes(main),'unknown action refused');
// round trip keeps edits working
const csv2=equipmentCsv(p);ok(parseCsv(csv2).length===p.buses.length+p.branches.length+p.sources.length+p.devices.length+1,'table lists every item');
console.log(fail?'FAILURES '+fail:'ALL PASS');process.exit(fail?1:0);
