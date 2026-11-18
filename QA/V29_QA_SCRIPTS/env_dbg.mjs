import {transformerToleranceEnvelope} from '../../SITE/fault-envelope-v29.mjs';
import {calculateProject} from '../../SITE/network-engine.mjs';
import fs from 'node:fs';
const cases=JSON.parse(fs.readFileSync('cases.json'));let shown=0;const cats={};
for(const c of cases){let r;try{r=transformerToleranceEnvelope({project:c,tolerancePercent:7.5,calculateProject})}catch{continue}if(r.status!=='CALCULATED')continue;
 for(const b of r.buses){if(b.nominal.totalA==null)continue;const ord=b.minimumWithTolerance.totalA<=b.nominal.totalA*(1+1e-12)&&b.nominal.totalA<=b.maximumWithTolerance.totalA*(1+1e-12);const bd=b.maximumIncreasePercent<=100/0.925-100+1e-9;
 if(!ord||!bd){cats[c._cat+(ord?'':' order')+(bd?'':' bound')]=(cats[c._cat+(ord?'':' order')+(bd?'':' bound')]||0)+1;if(shown++<4)console.log(c.name,b.busName,b.nominal.totalA.toFixed(1),b.maximumWithTolerance.totalA.toFixed(1),b.minimumWithTolerance.totalA.toFixed(1),b.maximumIncreasePercent)}}}
console.log(cats);
