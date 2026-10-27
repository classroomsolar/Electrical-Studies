import assert from 'node:assert/strict';import fs from 'node:fs';
import {screenConductorThermalDuty as calc} from '../site/conductor-duty-v28.mjs';
const good={method:'constant-rms',studyReference:'Independent validation case',conductor:{areaMm2:120,kASqrtSPerMm2:100,kSourceReference:'Synthetic k coefficient, not manufacturer verified',material:'copper',initialTempC:90,maximumFaultTempC:250},fault:{sourceReference:'Synthetic 10 kA clearing current reference',clearingTimeS:.2,rmsA:10000},marginFactor:1.1};
const bad=[
 ['negative conductor area',x=>x.conductor.areaMm2=-1],['zero conductor area',x=>x.conductor.areaMm2=0],['missing k source',x=>x.conductor.kSourceReference=''],['wrong k',x=>x.conductor.kASqrtSPerMm2=0],['infinite k',x=>x.conductor.kASqrtSPerMm2=Infinity],['unknown material',x=>x.conductor.material='steel'],['reversed temperature',x=>x.conductor.maximumFaultTempC=90],['zero duration',x=>x.fault.clearingTimeS=0],['negative current',x=>x.fault.rmsA=-1],['no fault source',x=>x.fault.sourceReference=''],['margin below one',x=>x.marginFactor=.9],['unknown method',x=>x.method='magic'],['unexpected root field',x=>x.oemRating=50000],['unexpected conductor field',x=>x.conductor.unknown=1],['unexpected fault field',x=>x.fault.rmsPeak=100],['NaN current',x=>x.fault.rmsA=NaN],['infinite duration',x=>x.fault.clearingTimeS=Infinity],['no study reference',x=>x.studyReference=''],
 ['trace empty',x=>{x.method='linear-rms-trace';delete x.fault.rmsA;x.fault.samples=[]}],
 ['trace duplicate time',x=>{x.method='linear-rms-trace';delete x.fault.rmsA;x.fault.samples=[{timeS:0,rmsA:100},{timeS:0,rmsA:100}]}],
 ['trace no t0',x=>{x.method='linear-rms-trace';delete x.fault.rmsA;x.fault.samples=[{timeS:.1,rmsA:100},{timeS:.2,rmsA:100}]}],
 ['trace missing clearing end',x=>{x.method='linear-rms-trace';delete x.fault.rmsA;x.fault.samples=[{timeS:0,rmsA:100},{timeS:.1,rmsA:100}]}],
 ['trace negative sample',x=>{x.method='linear-rms-trace';delete x.fault.rmsA;x.fault.samples=[{timeS:0,rmsA:100},{timeS:.2,rmsA:-1}]}],
 ['trace extra sample field',x=>{x.method='linear-rms-trace';delete x.fault.rmsA;x.fault.samples=[{timeS:0,rmsA:100,peakA:200},{timeS:.2,rmsA:100}]}],
 ['I2t missing',x=>{x.method='documented-i2t';delete x.fault.rmsA}],
 ['I2t negative',x=>{x.method='documented-i2t';delete x.fault.rmsA;x.fault.documentedI2tA2s=-1}],
 ['I2t conflicting RMS',x=>{x.method='documented-i2t';x.fault.documentedI2tA2s=1e5}]
];
const result=[];for(const [label,mutate] of bad){let x=structuredClone(good);mutate(x);let msg='';try{calc(x)}catch(e){msg=e.message};assert.ok(msg,label+' not rejected');result.push({label,error:msg})}
fs.writeFileSync(new URL('./conductor_invalid_results.json',import.meta.url),JSON.stringify({rejected:result.length,cases:result},null,2));console.log('PASS',result.length,'invalid conductor duty cases rejected');
