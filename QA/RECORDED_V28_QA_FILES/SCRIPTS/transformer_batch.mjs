import fs from 'node:fs';import {transformerNameplateFaultEnvelope as calc} from '../../V27/iec60909-transformer-scenarios.mjs';
const cases=JSON.parse(fs.readFileSync(new URL('./transformer_inputs.json',import.meta.url),'utf8'));
let output=cases.map((x,i)=>{try{return {ok:true,out:calc(x)}}catch(e){return {ok:false,error:e.message}}});
fs.writeFileSync(new URL('./transformer_js_results.json',import.meta.url),JSON.stringify(output));
