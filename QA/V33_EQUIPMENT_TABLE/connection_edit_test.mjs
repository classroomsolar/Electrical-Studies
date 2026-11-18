// V33 (D2): connection editing in the Equipment table. Preview leaves the project unchanged; applying moves the connection;
// every check gives a row-numbered message; the moved network calculates like the same move made by hand.
const S=new URL('../../SITE/',import.meta.url).href;
const B=await import(S+'plant-builder.mjs'),M=await import(S+'network-model.mjs'),E=await import(S+'network-engine.mjs');
const fs=await import('node:fs');
let pass=0,fail=0;const ok=(n,c,i='')=>{c?pass++:fail++;console.log((c?'ok   ':'FAIL ')+n,i)};
const p=M.normalizeProject(JSON.parse(fs.readFileSync(new URL('../V31_SCALE/results/plant80.json',import.meta.url))));
const rows=B.parseCsv(B.equipmentCsv(p)),head=rows[0],ix=k=>head.findIndex(h=>h===k||h.startsWith(k+' '));
const H=head.map(c=>/[",]/.test(c)?'"'+c+'"':c).join(','),line=o=>{const x=Array(head.length).fill('');for(const [k,v] of Object.entries(o))x[ix(k)]=v;return x.map(c=>/[",\n]/.test(c)?'"'+c.replaceAll('"','""')+'"':c).join(',')};
const bus=id=>p.buses.find(b=>b.id===id);
// pick a cable and another bus of the same voltage that is not its current end
const cab=p.branches.find(e=>e.kind==='cable'&&!e.deviceId);const from=bus(cab.from),to=bus(cab.to);
const other=p.buses.find(b=>b.voltage===to.voltage&&b.id!==to.id&&b.id!==from.id&&p.buses.filter(x=>x.name===b.name).length===1);
const before=JSON.stringify(p);
let pr=B.previewEquipmentCsv(p,H+'\n'+line({id:cab.id,to_bus:other.name}));
ok('preview lists the change',pr.connections.length===1&&pr.connections[0].before===to.name&&pr.connections[0].after===other.name,JSON.stringify(pr.connections));
ok('preview changes nothing',JSON.stringify(p)===before);
const q=structuredClone(p);let r=B.applyEquipmentCsv(q,H+'\n'+line({id:cab.id,to_bus:other.name}));
ok('apply moves the cable',q.branches.find(e=>e.id===cab.id).to===other.id&&r.errors.length===0,JSON.stringify(r).slice(0,200));
const byHand=structuredClone(p);byHand.branches.find(e=>e.id===cab.id).to=other.id;
const a=E.calculateProject(M.normalizeProject(structuredClone(q))),b=E.calculateProject(M.normalizeProject(byHand));
ok('result equals the same move made by hand',JSON.stringify(a.results.map(x=>[x.status,x.totalA]))===JSON.stringify(b.results.map(x=>[x.status,x.totalA])));
// checks
const lv=p.buses.find(b=>b.voltage!==to.voltage&&p.buses.filter(x=>x.name===b.name).length===1);
r=B.previewEquipmentCsv(p,H+'\n'+line({id:cab.id,to_bus:lv.name}));ok('cable across voltages refused',/cannot change voltage, use a transformer/.test(r.errors[0])&&r.connections.length===0,r.errors[0]);
r=B.previewEquipmentCsv(p,H+'\n'+line({id:cab.id,to_bus:'No such bus'}));ok('unknown bus refused',/Row 2: no bus named "No such bus"/.test(r.errors[0]),r.errors[0]);
r=B.previewEquipmentCsv(p,H+'\n'+line({id:cab.id,to_bus:from.name}));ok('same both ends refused',/must differ/.test(r.errors[0]),r.errors[0]);
const dup=structuredClone(p);dup.buses[3].name=dup.buses[4].name;r=B.previewEquipmentCsv(dup,H+'\n'+line({id:cab.id,to_bus:dup.buses[4].name}));ok('ambiguous bus name refused',/more than one bus is named/.test(r.errors[0]),r.errors[0]);
const dev=p.devices[0],link=p.branches.find(e=>e.deviceId===dev.id);
r=B.previewEquipmentCsv(p,H+'\n'+line({id:dev.id,bus:other.name}));ok('device move refused',/protective device is changed in the one-line editor/.test(r.errors[0]),r.errors[0]);
r=B.previewEquipmentCsv(p,H+'\n'+line({id:link.id,to_bus:other.name}));ok('device link move refused',/protective device/.test(r.errors[0]),r.errors[0]);
const src=p.sources.find(s=>s.kind!=='utility');const tgt=p.buses.find(b=>b.voltage===bus(src.bus).voltage&&b.id!==src.bus);
r=B.applyEquipmentCsv(structuredClone(p),H+'\n'+line({id:src.id,bus:tgt.name}));ok('source can move to another bus',r.connections.length===1&&r.errors.length===0,JSON.stringify(r.connections));
r=B.previewEquipmentCsv(p,H+'\n'+line({id:cab.id,to_bus:to.name}));ok('unchanged name is not a change',r.connections.length===0&&r.changes===0);
ok('download/upload round trip changes nothing',(()=>{const x=B.previewEquipmentCsv(p,B.equipmentCsv(p));return x.changes===0&&x.connections.length===0&&x.errors.length===0})());
console.log({pass,fail});process.exit(fail?1:0);
