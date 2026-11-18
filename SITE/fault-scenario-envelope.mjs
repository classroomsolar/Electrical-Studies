/** Case-defined fault envelope; runs all explicitly documented operating scenarios.
 * Does not infer maximum/minimum IEC 60909 correction factors or machine models.
 */
import {multiBusSequenceFault} from './multibus-sequence-fault-network.mjs';
const deny = m=>{throw Error('Fault scenario envelope: '+m)};
export function faultScenarioEnvelope(request){
 if(!request||typeof request!=='object'||Array.isArray(request))deny('Documented scenario envelope object required');
 const s=request.scenarios;
 if(!Array.isArray(s)||s.length<2||s.length>12)deny('Provide 2..12 documented operating scenarios');
 if(typeof request.studyBasis!=='string'||request.studyBasis.trim().length<15||request.studyBasis.length>1500)deny('A documented scenario-basis narrative is required');
 const results=[],ids=new Set();let match=null;
 for(const sc of s){
  if(!sc||typeof sc!=='object'||Array.isArray(sc))deny('Scenario entry must be an object');
  const id=sc.id;if(typeof id!=='string'||!/^[A-Za-z0-9_-]{1,40}$/.test(id)||ids.has(id))deny('Unique scenario ID required');ids.add(id);
  if(typeof sc.sourceReference!=='string'||sc.sourceReference.trim().length<5||sc.sourceReference.length>300)deny('Document source reference for scenario '+id);
  const x=multiBusSequenceFault(sc.network);
  const key=[x.nominalLLV,x.frequencyHz,x.faultType,x.faultBus].join(':');
  if(match===null)match=key;else if(key!==match)deny('Scenarios must share fault bus, fault type, voltage base and frequency');
  results.push({id,sourceReference:sc.sourceReference,maximumPhaseRmsA:x.maximumPhaseRmsA,groundResidualA:x.groundResidualA,faultType:x.faultType,networkResult:x});
 }
 const hi=results.reduce((a,b)=>b.maximumPhaseRmsA>a.maximumPhaseRmsA?b:a);
 const lo=results.reduce((a,b)=>b.maximumPhaseRmsA<a.maximumPhaseRmsA?b:a);
 return {status:'DOCUMENTED_SCENARIO_ENVELOPE_SCREEN',studyBasis:request.studyBasis,scenarioCount:results.length,maximumScenarioId:hi.id,minimumScenarioId:lo.id,maximumPhaseRmsA:hi.maximumPhaseRmsA,minimumPhaseRmsA:lo.maximumPhaseRmsA,ratioHighToLow:lo.maximumPhaseRmsA>1?hi.maximumPhaseRmsA/lo.maximumPhaseRmsA:null,scenarios:results,limits:['These are extrema of the entered cases ONLY. No automatic utility maximum/minimum correction regimes or operating-state enumeration.','No time-dependence or IBR/motor model; no breaker-making/breaking duty','All scenario impedances, source EMF angles, grounding paths and statuses must be documented; individual studies contain source contributions and KCL checks']};
}
