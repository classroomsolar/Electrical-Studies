import {calculateProject} from './network-engine.mjs?v=20261022-pv-final';
import {isExtendedStudy,isDcStudy,isSplitPhaseFault,usesConnectedSequences,prepareSplitPhaseProject} from './analysis-models.mjs?v=20261022-pv-final';
import {sequenceToPhase} from './connected-sequences.mjs?v=20261022-pv-final';

import {isSinglePhase,hasBranchCurrents} from './single-phase.mjs?v=20261022-pv-final';
const finiteComplex=z=>Number.isFinite(z?.r)&&Number.isFinite(z?.i);
const nonnegative=v=>Number.isFinite(v)&&v>=0;
const near=(a,b)=>Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(a),Math.abs(b));
function validPhases(r){return ['a','b','c'].every(k=>finiteComplex(r.phaseCurrents?.[k])&&nonnegative(r.phaseRMSA?.[k])&&near(r.phaseRMSA[k],Math.hypot(r.phaseCurrents[k].r,r.phaseCurrents[k].i)));}
const sameComplex=(a,b)=>finiteComplex(a)&&finiteComplex(b)&&near(a.r,b.r)&&near(a.i,b.i);
const magnitude=z=>Math.hypot(z.r,z.i);
const uniqueRecords=(rows,key,check)=>Array.isArray(rows)&&new Set(rows.map(r=>r?.[key])).size===rows.length&&rows.every(check);
function phaseIdentity(phases,rms,seq){
 if(!validPhases({phaseCurrents:phases,phaseRMSA:rms})||!['zero','positive','negative'].every(k=>finiteComplex(seq?.[k])))return false;
 const expected=sequenceToPhase(seq);return ['a','b','c'].every(k=>sameComplex(phases[k],expected[k]));
}
const namedSequences=s=>({zero:s?.i0,positive:s?.i1,negative:s?.i2});
function validConductor(f){return f&&nonnegative(f.fromA)&&nonnegative(f.toA)&&finiteComplex(f.fromPhasor)&&finiteComplex(f.toPhasor)&&near(f.fromA,magnitude(f.fromPhasor))&&near(f.toA,magnitude(f.toPhasor));}
function validExtendedPacket(data,p){
 const branchById=new Map();for(const b of p.branches){let list=branchById.get(b.id);if(!list)branchById.set(b.id,list=[]);list.push(b)}const sameBranch=(e,test=()=>true)=>(branchById.get(e.id)||[]).some(b=>b.from===e.from&&b.to===e.to&&test(b)),sourceIds=new Set(p.sources.map(s=>s.id));
 if(!Array.isArray(data.results)||data.results.length!==p.buses.length||!Array.isArray(data.issues))return false;
 const buses=new Map(p.buses.map(b=>[b.id,b])),seen=new Set(),expectedModel=isDcStudy(p)?'dc-resistive':isSplitPhaseFault(p)?'split-phase-explicit-loop':'connected-sequences';
 const split=isSplitPhaseFault(p),dc=isDcStudy(p),seq=usesConnectedSequences(p),leg=p.settings.faultType.includes('l2')?'L2':'L1';
 const cfg=split?prepareSplitPhaseProject(p).splitPhaseNetwork:null;
 const branch=e=>{
  if(!e||!sameBranch(e))return false;
  if(seq)return ['from','to'].every(side=>phaseIdentity(e[side+'PhaseCurrents'],e[side+'PhaseRMSA'],e[side+'SequenceCurrents'])&&near(e[side+'A'],Math.max(...Object.values(e[side+'PhaseRMSA'])))&&sameComplex(e[side+'Phasor'],e[side+'PhaseCurrents'].a));
  return validConductor(e)&&(!dc||(near(e.fromPhasor.i,0)&&near(e.toPhasor.i,0)&&Number.isFinite(e.signedA)&&near(e.signedA,e.fromPhasor.r)));
 };
 const conductors=rows=>uniqueRecords(rows,'id',e=>e&&sameBranch(e,b=>b.kind!=='transformer')&&e.conductors&&Object.keys(e.conductors).length===4&&['L1','L2','N','G'].every(k=>{const f=e.conductors[k];return validConductor(f)&&typeof f.open==='boolean'&&typeof f.modeled==='boolean'&&f.modeled===(k!==(leg==='L1'?'L2':'L1'))&&near(f.fromPhasor.r,-f.toPhasor.r)&&near(f.fromPhasor.i,-f.toPhasor.i)&&(!(f.open||!f.modeled)||near(f.fromA,0));}));
 const bonds=rows=>uniqueRecords(rows,'id',b=>b&&cfg?.bonds?.some(x=>x.id===b.id&&x.bus===b.bus)&&finiteComplex(b.fromPhasor)&&nonnegative(b.amps)&&near(b.amps,magnitude(b.fromPhasor)));
 const terminals=rows=>uniqueRecords(rows,'sourceId',s=>s&&sourceIds.has(s.sourceId)&&nonnegative(s.amps)&&(dc?Number.isFinite(s.signedA)&&near(s.amps,Math.abs(s.signedA)):seq?phaseIdentity(s.phaseCurrents,s.phaseRMSA,namedSequences(s.sequenceCurrents))&&near(s.amps,Math.max(...Object.values(s.phaseRMSA))):false));
 for(const r of data.results){
  if(!r||!buses.has(r.busId)||seen.has(r.busId)||typeof r.status!=='string'||r.phaseModel!==expectedModel||r.faultType!==p.settings.faultType)return false;seen.add(r.busId);
  if(r.totalA===null)continue;
  if(!['CALCULATED',...(isSplitPhaseFault(p)?['OPEN RETURN PATH','OPEN SUPPLY PATH']:[])].includes(r.status)||!nonnegative(r.totalA)||!Number.isFinite(r.voltage)||r.voltage<=0||r.voltage!==buses.get(r.busId).voltage)return false;
  if(r.peakA!==null||r.asymA!==null||r.xr!==null||(r.zth!==null&&!finiteComplex(r.zth))||!Array.isArray(r.details)||!Array.isArray(r.branchFlows)||!r.branchFlows.every(branch))return false;
  if(r.details.some(d=>!d||!sourceIds.has(d.sourceId)||typeof d.name!=='string'||!nonnegative(d.amps)||!finiteComplex(d.phasor)||!Array.isArray(d.branchFlows)||!d.branchFlows.every(branch)))return false;
  if((dc||seq)&&!terminals(r.sourceTerminalCurrents)||split&&r.sourceTerminalCurrents!==undefined)return false;
  if(r.details.some(d=>seq?(!phaseIdentity(d.phaseCurrents,d.phaseRMSA,namedSequences(d.sequenceCurrents))||!near(d.amps,Math.max(...Object.values(d.phaseRMSA)))||!sameComplex(d.phasor,d.phaseCurrents.a)):(!near(d.amps,magnitude(d.phasor))||dc&&(!Number.isFinite(d.signedA)||!near(d.signedA,d.phasor.r)||!near(d.phasor.i,0)))))return false;
  if(isDcStudy(p)){if(!Number.isFinite(r.signedA)||!near(Math.abs(r.signedA),r.totalA)||r.sequence!==null)return false;}
  if(usesConnectedSequences(p)){
   if(!validPhases(r)||!near(r.totalA,Math.max(...Object.values(r.phaseRMSA)))||!finiteComplex(r.sequence?.z1)||!finiteComplex(r.sequence.referenceVoltage)||!finiteComplex(r.groundPhasor)||!nonnegative(r.groundA)||!near(r.groundA,Math.hypot(r.groundPhasor.r,r.groundPhasor.i)))return false;
   if(['ll','slg','dlg'].includes(p.settings.faultType)&&!finiteComplex(r.sequence.z2))return false;
   if(r.sequence.z0!==null&&!finiteComplex(r.sequence.z0)||!['i0','i1','i2'].every(k=>finiteComplex(r.sequenceCurrents?.[k])))return false;
   if(!near(r.groundPhasor.r,3*r.sequenceCurrents.i0.r)||!near(r.groundPhasor.i,3*r.sequenceCurrents.i0.i))return false;
   if(!phaseIdentity(r.phaseCurrents,r.phaseRMSA,namedSequences(r.sequenceCurrents)))return false;
  }
  if(isSplitPhaseFault(p)&&(!Array.isArray(r.conductorFlows)||r.sequence!==null||r.faultVoltage!==buses.get(r.busId).voltage/2))return false;
  if(split&&(!conductors(r.conductorFlows)||!bonds(r.bondFlows)||!finiteComplex(r.phasor)||!near(r.totalA,magnitude(r.phasor))||r.details.some(d=>!conductors(d.conductorFlows)||!bonds(d.bondFlows))))return false;
 }
 return data.issues.every(i=>i&&typeof i.id==='string'&&typeof i.message==='string'&&['error','warning','info'].includes(i.severity));
}
function validDlgResult(r){
 if(!finiteComplex(r.sequence?.z0)||!finiteComplex(r.groundPhasor)||!nonnegative(r.groundA))return false;
 const near=(a,b)=>Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(a),Math.abs(b));
 for(const phase of ['a','b','c'])if(!finiteComplex(r.phaseCurrents?.[phase])||!nonnegative(r.phaseRMSA?.[phase])||!near(r.phaseRMSA[phase],Math.hypot(r.phaseCurrents[phase].r,r.phaseCurrents[phase].i)))return false;
 if(!['i0','i1','i2'].every(k=>finiteComplex(r.sequenceCurrents?.[k])))return false;
 return near(r.phaseRMSA.a,0)&&near(r.totalA,Math.max(...Object.values(r.phaseRMSA)))&&near(r.groundA,Math.hypot(r.groundPhasor.r,r.groundPhasor.i))&&near(r.groundPhasor.r,r.phaseCurrents.b.r+r.phaseCurrents.c.r)&&near(r.groundPhasor.i,r.phaseCurrents.b.i+r.phaseCurrents.c.i);
}
function validPacket(data,project){
 if(isExtendedStudy(project))return validExtendedPacket(data,project);
 const branchById=new Map();for(const b of project.branches){let list=branchById.get(b.id);if(!list)branchById.set(b.id,list=[]);list.push(b)}const knownBranch=e=>(branchById.get(e.id)||[]).some(b=>b.from===e.from&&b.to===e.to),sourceIds=new Set(project.sources.map(s=>s.id));
 if(!Array.isArray(data.results)||!Array.isArray(data.issues)||data.results.length!==project.buses.length)return false;
 const expected=new Map(project.buses.map(b=>[b.id,b])),seen=new Set();
 for(const r of data.results){
  if(!r||!expected.has(r.busId)||seen.has(r.busId)||typeof r.status!=='string')return false;seen.add(r.busId);
  if(r.totalA!==null){
   if(!['CALCULATED','SCREENING BOUND'].includes(r.status)||!nonnegative(r.totalA)||r.voltage!==expected.get(r.busId).voltage||!Number.isFinite(r.voltage)||r.voltage<=0||!Array.isArray(r.details))return false;
   if([r.peakA,r.asymA].some(v=>v!==null&&!nonnegative(v))||(r.zth!==null&&!finiteComplex(r.zth)))return false;
   if(!Array.isArray(r.branchFlows)||r.branchFlows.some(e=>!e||!nonnegative(e.fromA)||!nonnegative(e.toA)||!nonnegative(e.fromBoundA)||!nonnegative(e.toBoundA)||!finiteComplex(e.fromPhasor)||!finiteComplex(e.toPhasor)||!knownBranch(e)))return false;
   if(r.sequence!=null&&(!finiteComplex(r.sequence.z1)||!finiteComplex(r.sequence.z2)||!finiteComplex(r.sequence.referenceVoltage)||(r.sequence.z0!==null&&!finiteComplex(r.sequence.z0))))return false;
   if(!hasBranchCurrents(project)&&(!r.sequence||r.details.length||r.branchFlows.length||(project.settings.faultType==='slg'&&!finiteComplex(r.sequence.z0))))return false;
   if(isSinglePhase(project)&&(r.phaseModel!=='single-phase-ll'||r.sequence!==null||r.peakA!==null||r.asymA!==null))return false;
   if(project.settings.faultType==='dlg'&&!validDlgResult(r))return false;
   if(r.details.some(d=>!d||!sourceIds.has(d.sourceId)||typeof d.name!=='string'||!nonnegative(d.amps)||!finiteComplex(d.phasor)||!Array.isArray(d.path)||!Array.isArray(d.branchFlows)||d.path.some(e=>!e||typeof e.name!=='string'||!finiteComplex(e.ohms)||!Number.isFinite(e.atVoltage)||e.atVoltage<=0)||d.branchFlows.some(e=>!e||typeof e.name!=='string'||!nonnegative(e.amps)||!nonnegative(e.toAmps)||!finiteComplex(e.fromPhasor)||!finiteComplex(e.toPhasor)||!knownBranch(e))))return false;
  }
 }
 return data.issues.every(i=>i&&typeof i.id==='string'&&typeof i.message==='string'&&['error','warning','info'].includes(i.severity));
}

// The study stays on the visitor's device in both execution paths.
// A denied/failed worker must never leave a valid study stuck at "Calculating".
export function runCalculation({project,revision,onResult,WorkerClass=globalThis.Worker,
 workerUrl=new URL('./network-worker.mjs?v=20261108-v32',import.meta.url),startupTimeoutMs=4000,resultTimeoutMs=30000,
 setTimer=setTimeout,clearTimer=clearTimeout,compute=calculateProject}){
 let closed=false,worker=null,watchdog=null,started=false;
 const cleanup=()=>{if(watchdog!==null){clearTimer(watchdog);watchdog=null}worker?.terminate();worker=null};
 const finish=data=>{if(closed)return;closed=true;cleanup();onResult({...data,revision})};
 const inline=()=>{if(closed)return;cleanup();try{const result=compute(project);finish({results:result.results,issues:result.issues,execution:'local'})}catch(error){finish({error:error.message||'Calculation failed',execution:'local'})}};
 if(typeof WorkerClass!=='function')inline();
 else try{
  worker=new WorkerClass(workerUrl,{type:'module'});
  worker.onmessage=event=>{
   if(closed||event.data?.revision!==revision)return;
   if(event.data.phase==='started'){if(started)return;started=true;if(watchdog!==null)clearTimer(watchdog);watchdog=setTimer(()=>finish({error:'Calculation did not complete. Retry, or download this study for troubleshooting.',execution:'worker'}),resultTimeoutMs);return}
   if(event.data.error){if(typeof event.data.error!=='string'){inline();return}finish({error:event.data.error,execution:'worker'});return}
   try{if(!validPacket(event.data,project)){inline();return}}catch{inline();return}
   finish({results:event.data.results,issues:event.data.issues,execution:'worker'});
  };
  worker.onerror=event=>{event.preventDefault?.();inline()};
  worker.onmessageerror=()=>inline();
  watchdog=setTimer(inline,startupTimeoutMs);
  worker.postMessage({project,revision});
 }catch{inline()}
 return ()=>{closed=true;cleanup()};
}
