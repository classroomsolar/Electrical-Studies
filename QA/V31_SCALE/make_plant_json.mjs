// Writes a test plant as a Studio project file for the browser scripts: node make_plant_json.mjs 70 24 results/plant2000.json
import {plant} from './plant.mjs';import fs from 'node:fs';
const p=plant({inverters:+process.argv[2]||70,aux:+process.argv[3]||24});
p.buses.forEach((b,i)=>b.position={x:70+(i%40)*250,y:70+Math.floor(i/40)*150});
fs.writeFileSync(process.argv[4]||'results/plant.json',JSON.stringify(p));console.log(p.buses.length,'buses');
