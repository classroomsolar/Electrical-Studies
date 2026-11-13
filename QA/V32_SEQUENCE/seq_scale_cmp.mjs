// V32: connected-sequence engine. (1) Small networks: new code == V31 code exactly. (2) Sparse LU + compact output forced on
// mid-size networks == dense full calculation (totals, sequence currents, Thevenin Z, every stored branch flow, branch maxima).
import fs from 'fs';
const NEW=await import('../../SITE/connected-sequences.mjs');
const OLD=await import(process.env.OLD||'/tmp/v32/connected-sequences.v31.mjs');
const {analysisExample}=await import('../../SITE/analysis-examples.mjs');
function seqNet(n,ft,seed=3,tx=false){const e=analysisExample('3phase-ground');let s=seed;const rnd=()=>((s=(s*1103515245+12345)%2147483648)/2147483648);
 const p=JSON.parse(JSON.stringify(e));p.settings.faultType=ft;p.settings.sequenceModel='connected';const cab=p.branches[0];p.buses=[p.buses[0]];p.branches=[];
 for(let i=1;i<n;i++){const j=Math.floor(rnd()*i);p.buses.push({...e.buses[1],id:'b'+i,name:'Bus '+i,position:{x:100+i,y:100}});p.branches.push({...JSON.parse(JSON.stringify(cab)),id:'c'+i,name:'Cable '+i,from:j===0?'source-bus':'b'+j,to:'b'+i,length:5+rnd()*30});}
 for(let k=0;k<n/15;k++){const a=1+Math.floor(rnd()*(n-1)),b=1+Math.floor(rnd()*(n-1));if(a!==b)p.branches.push({...JSON.parse(JSON.stringify(cab)),id:'m'+k,name:'Tie '+k,from:'b'+a,to:'b'+b,length:20});}
 // a second source and an ideal link
 if(n>8){p.sources.push({...JSON.parse(JSON.stringify(p.sources[0])),id:'src2',name:'Second source',bus:'b5',r:0.02,x:0.08});p.branches.push({id:'lk1',name:'Breaker link',kind:'link',from:'b3',to:'b7',deviceId:'dev1'});p.devices=[{id:'dev1',name:'Breaker',kind:'switchgear',bus:'b7',linkId:'lk1',enabled:true,interruptA:50000,sccrA:50000,ratedVoltage:400}];}
 p.selectedBus='b2';return p;}
const near=(a,b,t)=>Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b));
let fail=0,worst=0;const chk=(c,m)=>{if(!c){fail++;if(fail<15)console.log('FAIL',m)}};
// (1) identity on small networks
for(const ft of ['3phase-ground','slg','ll','dlg'])for(const n of [2,6,15,40]){const p=seqNet(n,ft,n*7+1);chk(NEW.calculateConnectedProject(p).results.every(r=>r.status==='CALCULATED'),'calculated '+ft+' '+n);const a=JSON.stringify(NEW.calculateConnectedProject(p).results),b=JSON.stringify(OLD.calculateConnectedProject(p).results);chk(a===b,'identical '+ft+' n='+n)}
console.log('identity done',fail);
// (2) sparse + compact vs dense full
const cmpC=(x,y,m)=>{if(!x&&!y)return;const d=Math.hypot(x.r-y.r,x.i-y.i)/Math.max(1,Math.hypot(y.r,y.i));worst=Math.max(worst,d);chk(d<1e-8,m+' '+d)};
for(const ft of ['3phase-ground','slg','ll','dlg'])for(const n of [60,120]){const p=seqNet(n,ft,n+11);
 NEW.setConnectedThresholds({denseMaxSize:1e9,compactMinBuses:1e9});const ref=NEW.calculateConnectedProject(p).results;
 NEW.setConnectedThresholds({denseMaxSize:10,compactMinBuses:10});const t=Date.now();const got=NEW.calculateConnectedProject(p).results;const ms=Date.now()-t;
 NEW.setConnectedThresholds({});
 const maxFlow=new Map();for(const r of ref)for(const f of r.branchFlows){const m=maxFlow.get(f.id)||0;maxFlow.set(f.id,Math.max(m,f.fromA,f.toA))}
 const gotMax=new Map();for(const r of got)for(const f of r.branchFlows){const m=gotMax.get(f.id)||0;gotMax.set(f.id,Math.max(m,f.fromA,f.toA))}
 for(let k=0;k<ref.length;k++){const a=ref[k],b=got[k];chk(a.status===b.status,'status');if(a.totalA===null){chk(b.totalA===null,'null');continue}
  chk(near(a.totalA,b.totalA,1e-8),ft+' total '+a.totalA+' '+b.totalA);for(const q of ['i0','i1','i2'])cmpC(b.sequenceCurrents[q],a.sequenceCurrents[q],'seq '+q);cmpC(b.zth,a.zth,'zth');
  const byId=new Map(a.branchFlows.map(f=>[f.id,f]));for(const f of b.branchFlows){const g=byId.get(f.id);chk(!!g,'flow exists');if(g){chk(near(f.fromA,g.fromA,1e-7)&&near(f.toA,g.toA,1e-7),'flow '+f.id)}}
  chk(b.details.length===a.details.length&&b.details.every((d,i)=>near(d.amps,a.details[i].amps,1e-8)),'details amps');
  const sel=b.busId==='b2';chk(sel?b.detailScope==='full'&&b.branchFlows.length===a.branchFlows.length:b.detailScope==='summary','scope');
  for(const t of b.sourceTerminalCurrents){const u=a.sourceTerminalCurrents.find(x=>x.sourceId===t.sourceId);chk(near(t.amps,u.amps,1e-7),'terminal')}}
 for(const [id,m] of maxFlow)chk(near(gotMax.get(id)||0,m,1e-7),'branch maximum kept '+id);
 console.log(ft,n,'compact sparse ms',ms);
}
// (3) bus detail on demand
{const p=seqNet(120,'slg',5);NEW.setConnectedThresholds({denseMaxSize:10,compactMinBuses:10});const d=NEW.calculateConnectedBusDetail(p,'b40');NEW.setConnectedThresholds({denseMaxSize:1e9,compactMinBuses:1e9});const r=NEW.calculateConnectedProject(p).results.find(x=>x.busId==='b40');NEW.setConnectedThresholds({});
 chk(d.detailScope==='full'&&d.branchFlows.length===r.branchFlows.length&&near(d.totalA,r.totalA,1e-8)&&d.details[0].branchFlows.length===r.details[0].branchFlows.length,'bus detail on demand');}
console.log(JSON.stringify({worstComplexRel:worst}));console.log(fail?'FAILURES '+fail:'ALL PASS');process.exit(fail?1:0);
