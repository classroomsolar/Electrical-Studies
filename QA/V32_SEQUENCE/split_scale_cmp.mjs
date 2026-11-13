// V32: split-phase engine. Factor-once LU vs the V31 per-bus elimination on small networks (1e-10), compact output vs full on
// mid-size networks (totals, every stored conductor flow, per-connection maxima), and timing at 2,000 buses.
const NEW=await import('../../SITE/split-phase-network.mjs');
const OLD=await import(process.env.OLD||'/tmp/v32/split-phase-network.v31.mjs');
const {analysisExample}=await import('../../SITE/analysis-examples.mjs');
const {prepareSplitPhaseProject}=await import('../../SITE/analysis-models.mjs');
function splitNet(n,ft,seed=5){const e=analysisExample(ft);let s=seed;const rnd=()=>((s=(s*1103515245+12345)%2147483648)/2147483648);
 const p=JSON.parse(JSON.stringify(e));const cab=e.branches[1];p.branches=[e.branches[0]];p.buses=[e.buses[0],e.buses[1]];
 for(let i=0;i<n-2;i++){const j=i===0?'secondary':'p'+Math.floor(rnd()*i);p.buses.push({...e.buses[2],id:'p'+i,name:'Panel '+i,...(rnd()<0.1?{splitBondEnabled:true,splitBondR:0.02,splitBondX:0,dataReference:'QA'}:{})});p.branches.push({...cab,id:'sc'+i,name:'Cable '+i,from:j,to:'p'+i,splitL1R:0.02+rnd()*0.2,splitNR:0.03+rnd()*0.3,splitGR:0.05+rnd()*0.3});}
 for(let k=0;k<n/25;k++){const a=Math.floor(rnd()*(n-2)),b=Math.floor(rnd()*(n-2));if(a!==b)p.branches.push({...cab,id:'tie'+k,name:'Tie '+k,from:'p'+a,to:'p'+b});}
 p.selectedBus='p1';return prepareSplitPhaseProject(p);}
const near=(a,b,t)=>Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b));let fail=0;const chk=(c,m)=>{if(!c){fail++;if(fail<15)console.log('FAIL',m)}};
for(const ft of ['split-l1-n','split-l2-g'])for(const n of [3,8,25,60]){const p=splitNet(n,ft,n+3);const a=NEW.calculateSplitPhaseProject(p).results,b=OLD.calculateSplitPhaseProject(p).results;
 chk(a.filter(r=>r.status==='CALCULATED').length>=n-2,'calculated '+ft+' '+n+' '+a.map(r=>r.status).filter(s=>s!=='CALCULATED').slice(0,2));
 for(let k=0;k<a.length;k++){chk(a[k].status===b[k].status,'status');if(a[k].totalA===null)continue;chk(near(a[k].totalA,b[k].totalA,1e-10),'total '+a[k].totalA+' '+b[k].totalA);
  for(let q=0;q<a[k].conductorFlows.length;q++)for(const c of ['L1','L2','N','G'])chk(near(a[k].conductorFlows[q].conductors[c].fromA,b[k].conductorFlows[q].conductors[c].fromA,1e-9),'conductor')}}
console.log('vs V31 done, failures',fail);
for(const ft of ['split-l1-n','split-l1-g'])for(const n of [80,200]){const p=splitNet(n,ft,n);NEW.setSplitThresholds({denseMax:1e9,compactMinBuses:1e9});const ref=NEW.calculateSplitPhaseProject(p).results;
 NEW.setSplitThresholds({denseMax:20,compactMinBuses:10});const t=Date.now();const got=NEW.calculateSplitPhaseProject(p).results;const ms=Date.now()-t;NEW.setSplitThresholds({});
 const mref=new Map(),mgot=new Map();const upd=(m,r)=>{for(const f of r.conductorFlows||[])for(const c of Object.values(f.conductors))m.set(f.id,Math.max(m.get(f.id)||0,c.fromA))};
 for(let k=0;k<ref.length;k++){const a=ref[k],b=got[k];chk(a.status===b.status,'status');if(a.totalA===null)continue;chk(near(a.totalA,b.totalA,1e-9),'compact total');upd(mref,a);upd(mgot,b);
  const byId=new Map(a.conductorFlows.map(f=>[f.id,f]));for(const f of b.conductorFlows)for(const c of ['L1','L2','N','G'])chk(near(f.conductors[c].fromA,byId.get(f.id).conductors[c].fromA,1e-8),'compact conductor');
  chk(b.detailScope===(b.busId==='p1'?'full':'summary'),'scope '+b.busId+' '+b.detailScope)}
 for(const [id,m] of mref)chk(near(mgot.get(id)||0,m,1e-8),'max kept '+id);
 console.log(ft,n,'compact sparse ms',ms);}
{const p=splitNet(200,'split-l1-n',9);NEW.setSplitThresholds({denseMax:20,compactMinBuses:10});const d=NEW.calculateSplitPhaseBusDetail(p,'p40');NEW.setSplitThresholds({denseMax:1e9,compactMinBuses:1e9});const r=NEW.calculateSplitPhaseProject(p).results.find(x=>x.busId==='p40');NEW.setSplitThresholds({});
 chk(d.detailScope==='full'&&d.conductorFlows.length===r.conductorFlows.length&&near(d.totalA,r.totalA,1e-9),'bus detail on demand');}
for(const n of [2000]){const p=splitNet(n,'split-l1-n',1);const t=Date.now();const r=NEW.calculateSplitPhaseProject(p).results;console.log(n,'buses ms',Date.now()-t,'calculated',r.filter(x=>x.status==='CALCULATED').length);}
console.log(fail?'FAILURES '+fail:'ALL PASS');process.exit(fail?1:0);
