// Writes 2,000-bus connected-sequence (SLG) and split-phase (L1-N) projects for the browser checks.
import fs from 'fs';
const {analysisExample}=await import('../../SITE/analysis-examples.mjs');
const {normalizeProject}=await import('../../SITE/network-model.mjs');
let s=11;const rnd=()=>((s=(s*1103515245+12345)%2147483648)/2147483648);
function seq(n){const e=analysisExample('3phase-ground');const p=JSON.parse(JSON.stringify(e));p.settings.faultType='slg';p.settings.sequenceModel='connected';const cab=p.branches[0];p.buses=[p.buses[0]];p.branches=[];
 for(let i=1;i<n;i++){const j=Math.floor(rnd()*i);p.buses.push({...e.buses[1],id:'b'+i,name:'Bus '+i,position:{x:100+(i%50)*220,y:100+Math.floor(i/50)*160}});p.branches.push({...JSON.parse(JSON.stringify(cab)),id:'c'+i,name:'Cable '+i,from:j===0?'source-bus':'b'+j,to:'b'+i,length:5+rnd()*30});}
 p.name='Connected-sequence 2000-bus QA network';p.selectedBus='b10';return normalizeProject(p);}
function split(n){const e=analysisExample('split-l1-n');const p=JSON.parse(JSON.stringify(e));const cab=e.branches[1];p.branches=[e.branches[0]];p.buses=[e.buses[0],e.buses[1]];
 for(let i=0;i<n-2;i++){const j=i===0?'secondary':'p'+Math.floor(rnd()*i);p.buses.push({...e.buses[2],id:'p'+i,name:'Panel '+i,position:{x:100+(i%50)*220,y:900+Math.floor(i/50)*160}});p.branches.push({...cab,id:'sc'+i,name:'Cable '+i,from:j,to:'p'+i});}
 p.name='Split-phase 2000-bus QA network';p.selectedBus='p10';return normalizeProject(p);}
fs.mkdirSync('results',{recursive:true});fs.writeFileSync('results/seq2000.json',JSON.stringify(seq(2000)));fs.writeFileSync('results/split2000.json',JSON.stringify(split(2000)));console.log('written');
