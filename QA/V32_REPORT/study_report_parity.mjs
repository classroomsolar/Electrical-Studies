// V32: tool study reports. Small studies (no record list over 50) give exactly the V31 report; plant-scale record lists
// become one-row-per-item tables and export to PDF and Excel.
import {advancedStudyReport as NEW,advancedStudyReportBlob} from '../../SITE/advanced-study-report.mjs';
import {advancedStudyReport as OLD} from './advanced-study-report.v31-reference.mjs';
let seed=3;const rnd=()=>((seed=(seed*1103515245+12345)%2147483648)/2147483648);let fail=0;
const val=d=>{const r=rnd();if(d>3||r<0.4)return r<0.1?null:r<0.2?'text '+Math.floor(r*100):Math.round(r*1e6)/1e3;if(r<0.7){const o={};for(let i=0;i<1+Math.floor(rnd()*5);i++)o['k'+i]=val(d+1);return o}return Array.from({length:Math.floor(rnd()*8)},()=>val(d+1))};
for(let c=0;c<500;c++){const study={method:'m'+c,createdAt:'2026-11-08T00:00:00Z',inputs:{a:val(0),b:val(1)},outputs:{status:'OK',x:val(0),y:val(0),scope:'s'}};
 if(JSON.stringify(NEW(study))!==JSON.stringify(OLD(study))){fail++;if(fail<3)console.log('DIFF',c)}}
console.log('500 small studies identical, failures',fail);
const big={method:'big',createdAt:'x',inputs:{tol:1},outputs:{status:'OK',buses:Array.from({length:2000},(_,i)=>({busId:'b'+i,busName:'Bus '+i,nominal:{totalA:i*10,status:'CALCULATED'},maximumIncreasePercent:5.1}))}};
const r=NEW(big),t=r.sheets.find(s=>s.name==='Results · buses');if(!(t&&t.rows.length===2000&&t.headers.includes('nominal.totalA')))fail++;
for(const f of ['pdf','xlsx']){try{const b=advancedStudyReportBlob(big,f);console.log(f,b.size)}catch(e){fail++;console.log(f,'ERR',e.message)}}
console.log(fail?'FAILURES '+fail:'ALL PASS');process.exit(fail?1:0);
