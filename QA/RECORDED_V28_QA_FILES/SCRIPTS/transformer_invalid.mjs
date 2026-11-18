import fs from 'node:fs';
import assert from 'node:assert/strict';
import {transformerNameplateFaultEnvelope as calc} from '../../V27/iec60909-transformer-scenarios.mjs';
const original=JSON.parse(fs.readFileSync(new URL('./transformer_inputs.json',import.meta.url),'utf8'))[0];
const mutations=[
 ['wrong transformer tap',x=>x.transformer.ratedTapRatio=1.05],
 ['nonphysical transformer losses',x=>x.transformer.ratedLoadLossKW=1e7],
 ['reversed utility envelope',x=>x.utility.minimumEquivalentMVA=x.utility.maximumEquivalentMVA*2],
 ['reversed cable temperature',x=>x.feeder.minimumConductorTemperatureC=x.feeder.maximumConductorTemperatureC-1],
 ['nonfinite rated MVA',x=>x.transformer.ratedMVA=Infinity],
 ['missing transformer provenance',x=>x.transformer.sourceReference=''],
 ['unexpected field',x=>x.transformer.secretInjectedField=1],
 ['wrong voltage order',x=>x.ratedHighVoltageV=x.ratedLowVoltageV],
 ['negative cable length',x=>x.feeder.lengthM=-1],
 ['no utility',x=>delete x.utility],
 ['min voltage factor above max',x=>x.voltageFactors.minimum=1.2],
 ['nonfinite cable resistance',x=>x.feeder.resistanceOhmPerKmAt20C=NaN],
 ['missing temperature',x=>delete x.feeder.minimumConductorTemperatureC],
 ['unreasonable transformer impedance',x=>x.transformer.shortCircuitVoltagePercent=55],
 ['missing transformer nameplate MVA',x=>delete x.transformer.ratedMVA],
 ['invalid utility X/R',x=>x.utility.maximumXOverR=0],
];
const result=[];
for(const [label,mutate] of mutations){const x=structuredClone(original);mutate(x);let message='';try{calc(x)}catch(e){message=e.message};assert.ok(message,label+' was not rejected');result.push({label,error:message});}
fs.writeFileSync(new URL('./transformer_invalid_results.json',import.meta.url),JSON.stringify({cases:result.length,rejected:result.length,results:result},null,2));
console.log('PASS',result.length,'fail-closed transformer invalid inputs');
