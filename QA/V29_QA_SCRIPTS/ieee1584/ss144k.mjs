import fs from 'node:fs';import {ieee1584Calculate} from '../../../SITE/ieee1584-2018.mjs';
const lines=fs.readFileSync('ieee_1584_spreadsheet_results.csv','utf8').trim().split('\n');const H=lines[0].split(',');
let n=0,skipped=0,rejected=0,worst=0,over01=0,over1=0;const out=[];const bucket={};
for(const l of lines.slice(1)){const v=l.split(',');const r=Object.fromEntries(H.map((h,i)=>[h,h==='EC'?v[i]:Number(v[i])]));
 if(r.width<4*r.G){skipped++;continue}
 let c;try{c=ieee1584Calculate({voltageKV:r.V_oc,boltedFaultKA:r.I_bf,electrodeConfiguration:r.EC,gapMM:r.G,workingDistanceMM:r.D,enclosureHeightMM:r.height,enclosureWidthMM:r.width,enclosureDepthMM:r.depth,clearingFullMS:r.T,clearingReducedMS:r.T})}catch(e){rejected++;bucket[e.message.slice(0,60)]=(bucket[e.message.slice(0,60)]||0)+1;continue}
 const got=[c.cases[0].arcingCurrentKA,c.cases[0].incidentEnergyJPerCm2,c.cases[0].arcFlashBoundaryMM,c.cases[1].arcingCurrentKA,c.cases[1].incidentEnergyJPerCm2,c.cases[1].arcFlashBoundaryMM];
 const ref=[r.I_arc_max,r.E_joules_max,r.AFB_max,r.I_arc_min,r.E_joules_min,r.AFB_min];
 let m=0;got.forEach((g,i)=>{m=Math.max(m,Math.abs(g/ref[i]-1))});n++;worst=Math.max(worst,m);if(m>1e-3)over01++;if(m>1e-2)over1++;
 out.push([r.V_oc,r.EC,r.I_bf,r.G,r.D,r.height,r.width,r.depth,r.T,...got]);}
fs.writeFileSync('/tmp/js144k.json',JSON.stringify(out));
console.log({compared:n,skippedWidthLt4G:skipped,rejected,bucket,worstRelDiff:worst,casesOver0p1pct:over01,casesOver1pct:over1});
