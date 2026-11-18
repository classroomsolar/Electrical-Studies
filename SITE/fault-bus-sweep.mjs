/** Fault location and fault-type study grid using V14 independently tested 3-sequence solver.
 * NOT an operating-condition maximum/minimum IEC 60909 envelope. Every requested
 * fault must succeed; invalid topology or absent zero return aborts the sweep.
 */
import {multiBusSequenceFault} from './multibus-sequence-fault-network.mjs';
const fail=m=>{throw Error('Fault-location sweep: '+m)};
export function faultBusSweep(c){
 if(!c||typeof c!=='object'||Array.isArray(c))fail('Documented case object required');
 const buses=c.buses;if(!Array.isArray(buses)||buses.length<1||buses.length>18)fail('Document 1..18 buses');
 const loc=c.faultBuses,types=c.faultTypes;
 if(!Array.isArray(loc)||loc.length<1||loc.length>18||!Array.isArray(types)||types.length<1||types.length>4)fail('Explicit faultBuses and faultTypes lists required');
 if(new Set(loc).size!==loc.length||loc.some(x=>typeof x!=='string'||!buses.includes(x)))fail('Fault buses must be unique existing buses');
 if(new Set(types).size!==types.length||types.some(x=>!['3PH','AG','BC','BCG'].includes(x)))fail('Fault types must be unique 3PH, AG, BC, BCG');
 if(loc.length*types.length>72)fail('No more than 72 documented cases');
 const results=[];for(const faultBus of loc)for(const faultType of types){const study=multiBusSequenceFault({...c,faultBus,faultType});results.push({faultBus,faultType,maximumPhaseRmsA:study.maximumPhaseRmsA,groundResidualA:study.groundResidualA,phaseFaultCurrentA:study.phaseFaultCurrentA,sourceContributions:study.sourceContributions.map(x=>({id:x.id,bus:x.bus,phaseCurrentsA:x.phaseCurrentsA})),kclRelativeResidual:study.kclRelativeResidual,nodalRelativeResidual:study.nodalRelativeResidual})}
 const maxima=types.map(faultType=>{const rows=results.filter(x=>x.faultType===faultType);return {faultType,maximum:rows.reduce((a,b)=>b.maximumPhaseRmsA>a.maximumPhaseRmsA?b:a),minimum:rows.reduce((a,b)=>b.maximumPhaseRmsA<a.maximumPhaseRmsA?b:a)}});
 const globalMaximum=results.reduce((a,b)=>b.maximumPhaseRmsA>a.maximumPhaseRmsA?b:a);
 return {status:'BOUNDED_DOCUMENTED_FAULT_LOCATION_SWEEP',scope:'Fault-location and fault-type grid over one explicitly entered fixed source operating condition. NOT automatic IEC 60909 maximum/minimum source conditions, nor breaker duty or protection certification.',nominalLLV:c.nominalLLV,frequencyHz:c.frequencyHz,voltageFactor:c.voltageFactor,locations:loc,types,caseCount:results.length,globalMaximum:{faultBus:globalMaximum.faultBus,faultType:globalMaximum.faultType,maximumPhaseRmsA:globalMaximum.maximumPhaseRmsA},maximaByFaultType:maxima.map(x=>({faultType:x.faultType,maximum:{faultBus:x.maximum.faultBus,currentA:x.maximum.maximumPhaseRmsA},minimum:{faultBus:x.minimum.faultBus,currentA:x.minimum.maximumPhaseRmsA}})),cases:results,limitations:['Only the listed fault locations and types are evaluated','All cases use identical documented network and source operating conditions','No IEC automatic maximum/minimum, voltage correction, transformer vector group, machine transient or breaker duty','Any undefined zero-sequence ground-return path causes entire sweep to fail closed']};
}
