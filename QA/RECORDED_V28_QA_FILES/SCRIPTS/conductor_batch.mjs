import fs from 'node:fs';import {screenConductorThermalDuty as calc} from '../site/conductor-duty-v28.mjs';
const a=JSON.parse(fs.readFileSync(new URL('./conductor_inputs.json',import.meta.url)));const b=a.map(x=>calc(x));fs.writeFileSync(new URL('./conductor_js_results.json',import.meta.url),JSON.stringify(b));
