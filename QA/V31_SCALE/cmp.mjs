import fs from 'node:fs';
const S=new URL('../../SITE/',import.meta.url).href;
const E=await import(S+'network-engine.mjs');
const rev=(k,v)=>v==='__NaN__'?NaN:v==='__Inf__'?Infinity:v;
const files=process.argv.slice(2);let n=0,bad=0,worst=0,statusDiff=0;
const rel=(a,b,fl=1e-9)=>{if(a===b)return 0;if(a==null||b==null)return a==b?0:Infinity;if(!Number.isFinite(a)||!Number.isFinite(b))return Object.is(a,b)?0:Infinity;return Math.abs(a-b)/Math.max(fl,Math.abs(a),Math.abs(b))};
for(const file of files){const cases=JSON.parse(fs.readFileSync(file,'utf8'),rev);
for(const p of cases){if(!p.buses)continue;let dense,sp;
 try{dense=E.calculateProject(structuredClone(p))}catch(e){dense={err:e.message}}
 try{const q=structuredClone(p);const net=E.buildNetwork(q,{sparse:true});
  if(net.extensionResults||net.errors?.length||!net.sparse){sp=E.calculateProject(structuredClone(p))}else sp={issues:net.issues,results:E.calculateScaled(net,q).results};}catch(e){sp={err:e.message}}
 n++;if(dense.err||sp.err){if(dense.err!==sp.err){bad++;console.log('ERR',p.name,dense.err,sp.err)}continue}
 for(let k=0;k<dense.results.length;k++){const a=dense.results[k],b=sp.results[k];
  if(a.status!==b.status){statusDiff++;if(statusDiff<10)console.log('STATUS',file.split('/').pop(),p.name,a.busName,a.status,'|',b.status,a.faultNote,'|',b.faultNote);continue}
  let w=Math.max(rel(a.totalA,b.totalA),rel(a.peakA,b.peakA),rel(a.asymA,b.asymA),rel(a.zth?.r,b.zth?.r,Math.hypot(a.zth?.r||0,a.zth?.i||0)),rel(a.zth?.i,b.zth?.i,Math.hypot(a.zth?.r||0,a.zth?.i||0)),a.xr===Infinity&&b.xr===Infinity?0:rel(a.xr,b.xr));
  const fa=a.branchFlows||[],fb=b.branchFlows||[];if(fa.length!==fb.length){w=Infinity;console.log('FLOWLEN',p.name,fa.length,fb.length)}
  else fa.forEach((x,i)=>{w=Math.max(w,x.id===fb[i].id?0:Infinity,rel(x.fromA,fb[i].fromA,a.totalA||1),rel(x.toA,fb[i].toA,a.totalA||1))});
  const da=a.details||[],db=b.details||[];if(da.length!==db.length)w=Infinity;else da.forEach((x,i)=>{const y=db[i];w=Math.max(w,rel(x.amps,y.amps,a.totalA||1),rel(x.pathSeriesZ?.r,y.pathSeriesZ?.r,1e-6),rel(x.pathSeriesZ?.i,y.pathSeriesZ?.i,1e-6),rel(x.terminalVoltagePu,y.terminalVoltagePu,1),x.path.length===y.path.length&&x.path.every((e,j)=>e.id===y.path[j].id)?0:Infinity,x.branchFlows.length===y.branchFlows.length?0:Infinity)});
  if(w>1e-9){bad++;if(bad<15)console.log('DIFF',file.split('/').pop(),p.name,a.busName,w)}worst=Math.max(worst,w);}
}}
console.log({cases:n,bad,statusDiff,worst});
