import {networkArcFlashStudy,arcFlashLabel,EQUIPMENT_CLASSES} from '../../../SITE/arcflash-network-v29.mjs';
import {ieee1584Calculate} from '../../../SITE/ieee1584-2018.mjs';
import {calculateProject} from '../../../SITE/network-engine.mjs';
import {exampleProject} from '../../../SITE/network-model.mjs';
import fs from 'node:fs';
let p=0,f=0;const ck=(n,ok,d='')=>{ok?p++:f++;console.log((ok?'PASS ':'FAIL ')+n+(d?' — '+d:''))};
const ex=exampleProject();const before=JSON.stringify(ex);const [u,s,m]=ex.buses.map(b=>b.id);
let r=networkArcFlashStudy({project:ex,calculateProject});
ck('no clearing times -> CLEARING TIMES REQUIRED (none invented)',r.rows.every(x=>x.status==='CLEARING TIMES REQUIRED'));
ck('arcing currents still shown to read device curves',r.rows.every(x=>x.arcingCurrentFullKA>0&&x.arcingCurrentReducedKA<x.arcingCurrentFullKA));
ck('bolted current = Studio 3-phase result',Math.abs(r.rows[2].boltedFaultA-16706.17335282207)<1e-6);
ck('default class by voltage',r.rows[0].geometry.equipmentClass==='15kV Switchgear'&&r.rows[1].geometry.equipmentClass==='LV Switchgear');
const inputs={[u]:{equipmentClass:'15kV Switchgear',clearingFullMS:200,clearingReducedMS:250,clearingSource:'test'},[s]:{equipmentClass:'LV Switchgear',clearingFullMS:61.3,clearingReducedMS:319},[m]:{equipmentClass:'LV Panelboard',electrodeConfiguration:'VCBB',clearingFullMS:30,clearingReducedMS:45}};
r=networkArcFlashStudy({project:ex,calculateProject,busInputs:inputs});
ck('all three buses calculated',r.rows.every(x=>x.status==='CALCULATED'),r.rows.map(x=>x.status).join());
// independent check: same numbers as calling the verified engine directly
for(const [i,id] of [u,s,m].entries()){const row=r.rows[i],g=row.geometry,d=ieee1584Calculate({voltageKV:row.voltageV/1000,boltedFaultKA:row.boltedFaultA/1000,electrodeConfiguration:g.electrodeConfiguration,gapMM:g.gapMM,workingDistanceMM:g.workingDistanceMM,enclosureHeightMM:g.enclosureHeightMM,enclosureWidthMM:g.enclosureWidthMM,enclosureDepthMM:g.enclosureDepthMM,clearingFullMS:inputs[id].clearingFullMS,clearingReducedMS:inputs[id].clearingReducedMS});
 ck(`bus ${i} energy = direct engine, governing case max`,Math.abs(row.incidentEnergyCalPerCm2-Math.max(...d.cases.map(c=>c.incidentEnergyCalPerCm2)))<1e-12,row.incidentEnergyCalPerCm2.toFixed(2)+' cal/cm²')}
ck('project not mutated',JSON.stringify(ex)===before);
ck('faultType forced to 3-phase bolted even if project is SLG',(()=>{const q=JSON.parse(before);q.settings.faultType='slg';q.settings.faultR=0.5;const r2=networkArcFlashStudy({project:q,calculateProject,busInputs:inputs});return Math.abs(r2.rows[2].boltedFaultA-16706.17335282207)<1e-6})());
ck('exclude flag honoured',networkArcFlashStudy({project:ex,calculateProject,busInputs:{...inputs,[u]:{include:false}}}).rows[0].status==='EXCLUDED');
const q=JSON.parse(before);q.buses[0].voltage=34500;q.sources[0].voltage=34500;q.branches[0].v1=34500;
ck('34.5 kV bus flagged outside model range',networkArcFlashStudy({project:q,calculateProject,busInputs:inputs}).rows[0].status.startsWith('OUTSIDE'));
ck('bad clearing time -> range error reported, no crash',networkArcFlashStudy({project:ex,calculateProject,busInputs:{...inputs,[m]:{...inputs[m],clearingFullMS:5000}}}).rows[2].status.startsWith('INPUT OUTSIDE'));
ck('DC project rejected',(()=>{try{networkArcFlashStudy({project:{...ex,settings:{...ex.settings,faultType:'dc'}},calculateProject});return false}catch{return true}})());
const lab=arcFlashLabel(r.rows[1],{date:'2026-11-07'});ck('label: WARNING/DANGER by 40 cal threshold, has required NFPA 70E fields',['WARNING','DANGER'].includes(lab.signalWord)&&lab.nominalVoltageV&&lab.arcFlashBoundaryMM>0&&lab.workingDistanceMM>0&&lab.incidentEnergyCalPerCm2>0,lab.signalWord+' '+lab.incidentEnergyCalPerCm2.toFixed(1));
ck('label refuses uncalculated bus',(()=>{try{arcFlashLabel({status:'CLEARING TIMES REQUIRED'},{date:'2026-11-07'});return false}catch{return true}})());
// sweep over the 220 random networks: no crash, every calculated row finite
const cases=JSON.parse(fs.readFileSync('../cases.json'));let n=0,bad=0,calc=0;
for(const c of cases){const bi={};for(const b of c.buses)bi[b.id]={clearingFullMS:50+Math.random()*500,clearingReducedMS:50+Math.random()*900};
 try{const rr=networkArcFlashStudy({project:c,calculateProject,busInputs:bi});for(const row of rr.rows){n++;if(row.status==='CALCULATED'){calc++;if(!(row.incidentEnergyCalPerCm2>0&&Number.isFinite(row.incidentEnergyCalPerCm2)&&row.arcFlashBoundaryMM>0))bad++}}}catch(e){bad++}}
ck(`220 random networks: ${n} bus rows, ${calc} calculated, all finite`,bad===0,bad+' bad');
console.log(`\n${p} passed, ${f} failed`);

// V29c: clearing times from a chosen protective device
import('../../../SITE/clearing-time-v29.mjs').then(CT=>{
 const dev={type:'relay',standard:'IEEE',curve:'VI',pickupA:1500,dial:0.5,instPickupA:12000,instDelayS:0,breakerMode:'cycles',breakerCycles:3,frequencyHz:60};
 const rr=networkArcFlashStudy({project:ex,calculateProject,busInputs:{[s]:{equipmentClass:'LV Switchgear',device:dev}}}).rows[1];
 ck('device-driven row calculated',rr.status==='CALCULATED',rr.status+' '+(rr.note||''));
 const arc=ieee1584Calculate({voltageKV:rr.voltageV/1000,boltedFaultKA:rr.boltedFaultA/1000,electrodeConfiguration:'VCB',gapMM:rr.geometry.gapMM,workingDistanceMM:rr.geometry.workingDistanceMM,enclosureHeightMM:rr.geometry.enclosureHeightMM,enclosureWidthMM:rr.geometry.enclosureWidthMM,enclosureDepthMM:rr.geometry.enclosureDepthMM,clearingFullMS:100,clearingReducedMS:100});
 const tf=CT.clearingTime(dev,arc.cases[0].arcingCurrentKA*1000),tr=CT.clearingTime(dev,arc.cases[1].arcingCurrentKA*1000);
 ck('device times = clearing-time engine at the IEEE 1584 arcing currents',Math.abs(rr.device.full.ms-tf.ms)<1e-9&&Math.abs(rr.device.reduced.ms-tr.ms)<1e-9,tf.ms+' / '+tr.ms+' ms');
 const direct=ieee1584Calculate({voltageKV:rr.voltageV/1000,boltedFaultKA:rr.boltedFaultA/1000,electrodeConfiguration:'VCB',gapMM:rr.geometry.gapMM,workingDistanceMM:rr.geometry.workingDistanceMM,enclosureHeightMM:rr.geometry.enclosureHeightMM,enclosureWidthMM:rr.geometry.enclosureWidthMM,enclosureDepthMM:rr.geometry.enclosureDepthMM,clearingFullMS:tf.ms,clearingReducedMS:tr.ms});
 ck('energy with device times = direct engine',Math.abs(rr.incidentEnergyCalPerCm2-Math.max(...direct.cases.map(c=>c.incidentEnergyCalPerCm2)))<1e-12);
 const nt=networkArcFlashStudy({project:ex,calculateProject,busInputs:{[s]:{device:{...dev,pickupA:1e6,instPickupA:undefined}}}}).rows[1];
 ck('device that does not pick up -> flagged, no energy',nt.status.startsWith('DEVICE DOES NOT CLEAR')&&nt.incidentEnergyCalPerCm2===undefined,nt.status);
 const slow=networkArcFlashStudy({project:ex,calculateProject,busInputs:{[s]:{device:{type:'relay',standard:'IEC',curve:'LTI',pickupA:5000,dial:1,breakerMode:'cycles',breakerCycles:5,frequencyHz:60}}}}).rows[1];
 ck('over 2 s -> flagged unless user limits',slow.status==='CLEARING TIME OVER 2 s',slow.status);
 const cap=networkArcFlashStudy({project:ex,calculateProject,busInputs:{[s]:{device:{type:'relay',standard:'IEC',curve:'LTI',pickupA:5000,dial:1,breakerMode:'cycles',breakerCycles:5,frequencyHz:60,capAt2s:true}}}}).rows[1];
 ck('user 2 s limit applied and recorded',cap.status==='CALCULATED'&&/2 s/.test(cap.clearingSource),cap.clearingSource);
 const inc=networkArcFlashStudy({project:ex,calculateProject,busInputs:{[s]:{device:{type:'relay',standard:'IEEE',curve:'VI',breakerMode:'none'}}}}).rows[1];
 ck('incomplete device settings -> message',inc.status==='DEVICE SETTINGS INCOMPLETE',inc.note);
 console.log(`\n${p} passed, ${f} failed`);
});
