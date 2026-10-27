import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import vm from 'node:vm';
import {advancedStudyReportBlob,advancedStudyReport} from '../../V27/advanced-study-report.mjs';
import {radialSourceFault,thermalSteadyCore} from '../../V27/engineering-core-methods.mjs';
import {sweepProtectionCoordination} from '../../V27/protection-full-range.mjs';
import {timeVaryingSymmetricalFaultDuty} from '../../V27/time-varying-current-duty.mjs';
import {documentedAsymmetricalWaveformDuty} from '../../V27/asymmetrical-waveform-duty.mjs';
import {transformerNameplateFaultEnvelope} from '../../V27/iec60909-transformer-scenarios.mjs';
import {reducedSequenceFault} from '../../V27/sequence-fault-screen.mjs';
import {conductorACResistanceIEC60287} from '../../V27/iec60287-ac-resistance.mjs';
import {directBuriedSingleCoreRating} from '../../V27/iec60287-buried-cable.mjs';
import {multiSourceThreePhaseFault} from '../../V27/multi-source-fault-network.mjs';
import {multiVoltageThreePhaseFault} from '../../V27/multi-voltage-fault-network.mjs';
import {multiBusSequenceFault} from '../../V27/multibus-sequence-fault-network.mjs';
import {faultScenarioEnvelope} from '../../V27/fault-scenario-envelope.mjs';
import {screenBalancedNMinusOne} from '../../V27/contingency-power-flow.mjs';
import {peakMakingNetworkScreen} from '../../V27/iec60909-peak-network.mjs';
import {faultBusSweep} from '../../V27/fault-bus-sweep.mjs';
const src=readFileSync('/mnt/data/fault_studio_work/V27/engineering-core-ui.mjs','utf8');
const start=src.indexOf('const examples={'),end=src.indexOf('\nfunction install()',start);
if(start<0||end<0)throw Error('Cannot locate UI example fixture');
const examples=vm.runInNewContext(src.slice(start,end)+'\nexamples;');
const modes=['fault','multisource','multivoltage','transformer60909','sequence','multisequence','multienvelope','contingency','peakscreen','faultsweep','thermal','resistance','buried','protectionrange','phasorduty','acdcwave'];
const methods={fault:radialSourceFault,multisource:multiSourceThreePhaseFault,multivoltage:multiVoltageThreePhaseFault,transformer60909:transformerNameplateFaultEnvelope,sequence:reducedSequenceFault,multisequence:multiBusSequenceFault,multienvelope:faultScenarioEnvelope,contingency:screenBalancedNMinusOne,peakscreen:peakMakingNetworkScreen,faultsweep:faultBusSweep,thermal:thermalSteadyCore,resistance:conductorACResistanceIEC60287,buried:directBuriedSingleCoreRating,protectionrange:sweepProtectionCoordination,phasorduty:timeVaryingSymmetricalFaultDuty,acdcwave:documentedAsymmetricalWaveformDuty};
const clone=x=>JSON.parse(JSON.stringify(x));
const makeInput=m=>{
 if(m==='peakscreen')return clone(examples.multisource);
 if(m==='faultsweep'){let x=clone(examples.multisequence);x.faultBuses=['F','A','B'];x.faultTypes=['3PH','AG','BC','BCG'];return x;}
 if(m==='multienvelope'){let hi=clone(examples.multisequence),lo=clone(hi);hi.voltageFactor=1.1;lo.voltageFactor=.95;lo.sources[1].emScale=.87;return {studyBasis:'Illustrative two-case envelope, NOT certified utility maximum/minimum IEC 60909 operating conditions.',scenarios:[{id:'example_high',sourceReference:'illustrative-source-conditions-A',network:hi},{id:'example_low',sourceReference:'illustrative-source-conditions-B',network:lo}]};}
 return clone(examples[m]);
};
const dir='/mnt/data/fault_studio_work/V28/QA/exports';mkdirSync(dir,{recursive:true});
const records=[],cases=[];
for(let mode of modes){
 const input=makeInput(mode);let output=methods[mode](input);
 if(!output.status)throw Error(mode+' has no status');
 const study={method:mode,inputs:input,outputs:output,createdAt:'2026-10-26T00:00:00.000Z'};
 const report=advancedStudyReport(study);
 for(let format of ['pdf','xlsx']){
  const blob=advancedStudyReportBlob(study,format);
  const data=Buffer.from(await blob.arrayBuffer());
  const name=`${mode}.${format}`;
  writeFileSync(join(dir,name),data);
  records.push({mode,format,bytes:data.length,status:output.status,outputPaths:report.sheets[2].rows.length,inputPaths:report.sheets[1].rows.length,sheets:report.sheets.map(s=>s.name)});
 }
 cases.push(study);
 console.log(mode,'OK',output.status,'inputRows',report.sheets[1].rows.length,'outputRows',report.sheets[2].rows.length);
}
writeFileSync(join(dir,'results.json'),JSON.stringify(records,null,2));
writeFileSync(join(dir,'cases.json'),JSON.stringify(cases));
console.log('PASS 32 exports');
