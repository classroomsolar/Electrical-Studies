import {transformerToleranceEnvelope} from '../../SITE/fault-envelope-v29.mjs';
import {calculateProject} from '../../SITE/network-engine.mjs';
import fs from 'node:fs';
const cases=JSON.parse(fs.readFileSync('cases.json')).filter(c=>c.branches.filter(e=>e.kind==='transformer').length===1&&c.sources.length>1);
let worstHi=0,worstLo=0,n=0;
for(const c of cases.slice(0,40)){const env=transformerToleranceEnvelope({project:c,tolerancePercent:7.5,calculateProject});if(env.status!=='CALCULATED')continue;
 for(let k=0;k<=40;k++){const f=0.925+0.15*k/40,p=JSON.parse(JSON.stringify(c));p.branches.find(e=>e.kind==='transformer').zPercent*=f;const r=calculateProject(p);
  for(const x of r.results){const b=env.buses.find(b=>b.busId===x.busId);if(x.totalA==null)continue;n++;worstHi=Math.max(worstHi,(x.totalA/b.maximumWithTolerance.totalA-1)*100);worstLo=Math.max(worstLo,(1-x.totalA/b.minimumWithTolerance.totalA)*100)}}}
console.log(`dense samples ${n}; largest current found above corner max: ${worstHi.toExponential(2)} %; below corner min: ${worstLo.toExponential(2)} %`);
