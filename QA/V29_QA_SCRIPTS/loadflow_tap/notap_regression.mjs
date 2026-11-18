import * as N from '../../../SITE/operating-studies.mjs';
import fs from 'fs';
const O=await import('/tmp/v29b/Electrical-Studies/SITE/operating-studies.mjs');
const cases=JSON.parse(fs.readFileSync('cases.json','utf8'));let same=0,diff=0;
for(const c of cases){const net=JSON.parse(JSON.stringify(c.net));net.branches.forEach(b=>delete b.tap);let a,b;try{a=O.solveBalancedPowerFlow(net)}catch(e){a={err:e.message}}try{b=N.solveBalancedPowerFlow(net)}catch(e){b={err:e.message}}
 const strip=r=>r.err?r:{...r,source:'',branches:r.branches.map(({fromCurrentPu,tap,...x})=>x)};JSON.stringify(strip(a))===JSON.stringify(strip(b))?same++:diff++}
console.log('tap-free networks: identical',same,'different',diff);
