import {sparseFactorC} from './sparse-complex-lu.mjs?v=20261108-v32';
// Opt-in documented center-tapped one-leg fault loop. Existing sequence/L-L modes are untouched.
export const SPLIT_PHASE_FAULTS=Object.freeze(['split-l1-n','split-l2-n','split-l1-g','split-l2-g']);
export const isSplitPhaseFault=p=>SPLIT_PHASE_FAULTS.includes(p?.settings?.faultType);
export const splitPhaseScope='Documented center-tapped single-source, single-leg fault loop; independent conductor impedances with explicit neutral/ground bonds. No full-winding impedance estimate, implicit ground return, mutual coupling, load flow, multiple sources, peak or asymmetrical duty.';
const C=(r=0,i=0)=>({r,i}),add=(a,b)=>C(a.r+b.r,a.i+b.i),sub=(a,b)=>C(a.r-b.r,a.i-b.i),scale=(a,k)=>C(a.r*k,a.i*k),mul=(a,b)=>C(a.r*b.r-a.i*b.i,a.r*b.i+a.i*b.r),abs=a=>Math.hypot(a.r,a.i);
const div=(a,b)=>{const m=Math.max(Math.abs(b.r),Math.abs(b.i));if(!(m>0)||!Number.isFinite(m))throw Error('Invalid or singular explicit loop impedance');const r=b.r/m,i=b.i/m,d=r*r+i*i;const v=C(((a.r/m)*r+(a.i/m)*i)/d,((a.i/m)*r-(a.r/m)*i)/d);if(!Number.isFinite(v.r)||!Number.isFinite(v.i))throw Error('Explicit loop calculation exceeds numerical range');return v;};
const finite=x=>typeof x==='number'&&Number.isFinite(x),positive=x=>finite(x)&&x>0,doc=x=>typeof x==='string'&&x.trim().length>0;
const record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
// Validate raw public envelopes before any domain graph reads. Never coerce malformed
// collections or truthy string flags into an apparently calculable project.
function envelopeIssues(p){
 const issues=[],error=message=>issues.push({id:'settings',severity:'error',message});
 if(!record(p)){error('The split-phase project must be an object.');return issues;}
 if(!record(p.settings))error('Project settings must be an object.');
 for(const collection of ['buses','sources','branches','devices']){
  const entries=p[collection];
  if(!Array.isArray(entries)){error(collection+' must be an array of project objects.');continue;}
  for(const entry of entries){
   if(!record(entry)||!doc(entry.id)){error(collection+' entries must be objects with nonempty string IDs.');continue;}
   for(const flag of ['enabled','maxInclude','minInclude'])if(entry[flag]!==undefined&&typeof entry[flag]!=='boolean')error(collection+': '+flag+' must be boolean.');
  }
 }
 if(p.inputErrors!==undefined){
  if(!Array.isArray(p.inputErrors))error('inputErrors must be an array of issue objects.');
  else for(const issue of p.inputErrors)if(!record(issue)||!doc(issue.id)||!doc(issue.message))error('inputErrors entries require nonempty string IDs and messages.');
 }
 return issues;
}
const impedance=x=>x&&finite(x.r)&&finite(x.x)&&x.r>=0&&x.x>=0&&Math.hypot(x.r,x.x)>0&&doc(x.document);
const activeBranch=(p,e)=>e.enabled!==false&&(!e.deviceId||p.devices?.find(d=>d.id===e.deviceId)?.enabled!==false);
const node=(id,k)=>JSON.stringify([id,k]);
const z=x=>C(x.r,x.x);
export function splitPhaseIssues(p){
 if(!isSplitPhaseFault(p))return [];
 const malformed=envelopeIssues(p);if(malformed.length)return malformed;
 const issues=[],error=(id,message)=>issues.push({id,message,severity:'error'}),cfg=p.splitPhaseNetwork,s=p.settings;
 for(const issue of p.inputErrors||[])error(issue.id,issue.message);
 if(!cfg||typeof cfg!=='object'){error('settings','Enter the documented split-phase source and conductor configuration.');return issues;}
 if(!['base'].includes(s.scenario))error('settings','Split-phase documented loops currently require the base scenario; enter each documented source condition as a separate study.');
 if(!positive(s.frequency)||cfg.frequency!==s.frequency)error('settings','Documented impedance frequency must match the positive study frequency.');
 if(!positive(s.voltageFactor))error('settings','Enter a finite positive prefault voltage factor.');
 if(!finite(s.faultR)||!finite(s.faultX)||s.faultR<0||s.faultX<0)error('settings','Fault R/X must be explicit nonnegative finite ohms.');
 if(cfg.impedanceModel!=='documented-uncoupled'||!doc(cfg.document))error('settings','Document the uncoupled conductor circuit model and its applicability; mutually coupled systems require a separate impedance-matrix study.');
 const buses=Array.isArray(p.buses)?p.buses:[],branches=Array.isArray(p.branches)?p.branches:[],sources=Array.isArray(p.sources)?p.sources:[],ids=cfg.busIds;
 if(!Array.isArray(ids)||!ids.length||new Set(ids).size!==ids.length||ids.some(id=>!buses.some(b=>b.id===id)))error('settings','Choose unique existing downstream split-phase buses.');
 const set=new Set(Array.isArray(ids)?ids:[]);
 if(!set.has(cfg.busId)||!positive(cfg.fullVoltage))error('settings','Enter a valid center-tap source bus and positive full-winding voltage.');
 for(const b of buses.filter(b=>set.has(b.id)))if(!positive(b.voltage)||Math.abs(b.voltage-cfg.fullVoltage)>1e-6)error(b.id,'Split-phase bus voltage must equal the documented full-winding voltage.');
 const transformer=branches.find(e=>e.id===cfg.transformerId);if(transformer&&transformer.tapPercent)error(cfg.transformerId,'Off-nominal transformer tap is not modelled in the split-phase method; set the tap to 0 %.');
 if(!transformer||transformer.kind!=='transformer'||transformer.phaseRating!=='single'||transformer.to!==cfg.busId||set.has(transformer.from)||!activeBranch(p,transformer)||!positive(transformer.v1)||transformer.v2!==cfg.fullVoltage)error(cfg.transformerId||'settings','Select the enabled single-phase source transformer, oriented from its primary bus to the center-tapped secondary.');
 if(cfg.halfWinding?.basis!=='documented-half-winding-ohms'||!impedance(cfg.halfWinding?.L1)||!impedance(cfg.halfWinding?.L2))error(cfg.transformerId||'settings','Actual documented L1-N and L2-N transformer half-winding equivalent R/X in secondary ohms are required. Full-winding percent Z is insufficient.');
 if(cfg.upstream?.basis!=='documented-primary-loop'||!positive(cfg.upstream?.voltage)||!impedance(cfg.upstream))error(cfg.sourceId||'settings','Document the complete primary supply loop R/X and its terminal voltage. Three-phase per-phase impedance is not a complete loop.');
 const source=sources.find(x=>x.id===cfg.sourceId),activeSources=sources.filter(x=>x.enabled!==false);
 if(!source||source.enabled===false||activeSources.length!==1||source.bus!==transformer?.from||!['utility','other','otherSource'].includes(source.kind)||source.model!==undefined&&source.model!=='voltage')error(cfg.sourceId||'settings','Exactly one active documented utility/voltage source is required at the source transformer primary; other source contributions are unsupported.');
 if(transformer&&positive(cfg.upstream?.voltage)&&(transformer.v1!==cfg.upstream.voltage||buses.find(b=>b.id===transformer.from)?.voltage!==cfg.upstream.voltage))error(cfg.transformerId,'Primary supply loop voltage must match the transformer primary and primary bus.');
 const allIds=[...buses,...branches,...sources,...(p.devices||[])].map(x=>x.id);if(new Set(allIds).size!==allIds.length)error('settings','Duplicate project IDs prevent an unambiguous conductor network.');
 for(const x of [...branches,...sources,...(p.devices||[])])if(x.enabled!==undefined&&typeof x.enabled!=='boolean')error(x.id,'Enabled flags must be boolean.');
 for(const e of branches){
  if(e.id===cfg.transformerId||!activeBranch(p,e))continue;
  if(!set.has(e.from)||!set.has(e.to)){error(e.id,'Every other enabled branch must lie entirely inside the explicit split-phase bus scope; additional transformer/primary networks are unsupported.');continue;}
  if(!['cable','link','impedance'].includes(e.kind)){error(e.id,'Only explicit passive conductor branches are supported downstream of the source transformer.');continue;}
  if(e.from===e.to)error(e.id,'Conductor branch endpoints must differ.');
  for(const k of ['L1','L2','N','G']){const c=e.splitPhase?.conductors?.[k];if(!c||c.open!==undefined&&typeof c.open!=='boolean'||c.open!==true&&!impedance(c))error(e.id,`${k}: enter documented total-conductor R/X in ohms, or explicitly mark the conductor open. Zero/unknown return impedance is not assumed.`);}
  if(e.deviceId&&!p.devices?.some(d=>d.id===e.deviceId))error(e.id,'The controlling device must exist.');
 }
 if(!Array.isArray(cfg.bonds))error('settings','Declare the N-G bonds array explicitly; an empty array means no bond.');
 const bondIds=new Set();for(const b of Array.isArray(cfg.bonds)?cfg.bonds:[]){if(!b||typeof b!=='object'){error('settings','Every declared bond must be a documented bond object.');continue;}if(!doc(b.id)||bondIds.has(b.id)||allIds.includes(b.id)||!set.has(b.bus)||!impedance(b))error(b.id||'settings','Every N-G bond needs a unique ID, scoped bus, documented nonzero R/X; no ideal grounding is assumed.');bondIds.add(b.id);}
 issues.push({id:'settings',severity:'warning',message:splitPhaseScope});return issues;
}
// Partial-pivot complex Gaussian solve, scaled to reject numerically unresolved circuits.
function solve(matrix,rhs){
 const a=matrix.map((row,i)=>[...row.map(v=>C(v.r,v.i)),C(rhs[i].r,rhs[i].i)]),n=a.length;
 const magnitude=Math.max(0,...matrix.flat().map(abs));
 for(let k=0;k<n;k++){let pivot=k;for(let i=k+1;i<n;i++)if(abs(a[i][k])>abs(a[pivot][k]))pivot=i;if(abs(a[pivot][k])<=magnitude*1e-13)throw Error('Explicit circuit is singular or numerically ill-conditioned; review impedance scale and connectivity');[a[pivot],a[k]]=[a[k],a[pivot]];for(let i=k+1;i<n;i++){const f=div(a[i][k],a[k][k]);for(let j=k+1;j<=n;j++)a[i][j]=sub(a[i][j],mul(f,a[k][j]));a[i][k]=C();}}
 const x=Array.from({length:n},()=>C());for(let i=n-1;i>=0;i--){let v=a[i][n];for(let j=i+1;j<n;j++)v=sub(v,mul(a[i][j],x[j]));x[i]=div(v,a[i][i]);}return x;
}
// The admittance matrix does not depend on the faulted bus: factor it once. Dense LU with the same partial pivoting and
// singularity test as solve() up to SPLIT_DENSE_MAX nodes; a sparse LU above that.
export let SPLIT_DENSE_MAX=600,SPLIT_COMPACT_MIN_BUSES=150;
export function setSplitThresholds({denseMax=600,compactMinBuses=150}={}){SPLIT_DENSE_MAX=denseMax;SPLIT_COMPACT_MIN_BUSES=compactMinBuses}
function factorY(matrix){
 const n=matrix.length;let magnitude=0;for(const row of matrix)for(const v of row.values())magnitude=Math.max(magnitude,abs(v));
 const message='Explicit circuit is singular or numerically ill-conditioned; review impedance scale and connectivity';
 if(matrix[0] instanceof Map){const rows=matrix.map(row=>{const m=new Map();for(const [j,v] of row)m.set(j,[v.r,v.i]);return m});const solveT=sparseFactorC(rows,{tiny:magnitude*1e-13,message});const f=rhs=>{const [xr,xi]=solveT(rhs);return Array.from({length:n},(_,k)=>C(xr[k],xi[k]))};f.typed=(r,i)=>solveT([r,i],true);return f}
 const a=matrix.map(row=>row.map(v=>C(v.r,v.i))),perm=Array.from({length:n},(_,i)=>i);
 for(let k=0;k<n;k++){let pivot=k;for(let i=k+1;i<n;i++)if(abs(a[i][k])>abs(a[pivot][k]))pivot=i;if(abs(a[pivot][k])<=magnitude*1e-13)throw Error(message);[a[pivot],a[k]]=[a[k],a[pivot]];[perm[pivot],perm[k]]=[perm[k],perm[pivot]];for(let i=k+1;i<n;i++){const f=div(a[i][k],a[k][k]);a[i][k]=f;for(let j=k+1;j<n;j++)a[i][j]=sub(a[i][j],mul(f,a[k][j]));}}
 return rhs=>{const y=new Array(n);for(let i=0;i<n;i++){let v=C(rhs[perm[i]].r,rhs[perm[i]].i);for(let j=0;j<i;j++)v=sub(v,mul(a[i][j],y[j]));y[i]=v}const x=new Array(n);for(let i=n-1;i>=0;i--){let v=y[i];for(let j=i+1;j<n;j++)v=sub(v,mul(a[i][j],x[j]));x[i]=div(v,a[i][i])}return x};
}
function network(p,issues){
 const c=p.splitPhaseNetwork,leg=p.settings.faultType.includes('l2')?'L2':'L1',ret=p.settings.faultType.endsWith('-g')?'G':'N',reference=node(c.busId,'N'),sourceHot=node(c.busId,leg);
 const sourceImpedance=add(z(c.halfWinding[leg]),scale(z(c.upstream),(c.fullVoltage/2/c.upstream.voltage)**2));
 const emf=C((leg==='L1'?1:-1)*c.fullVoltage/2*p.settings.voltageFactor),edges=[{id:'__source',a:sourceHot,b:reference,ohms:sourceImpedance,source:true}];
 const branches=p.branches.filter(e=>e.id!==c.transformerId&&activeBranch(p,e));
 for(const e of branches)for(const k of [leg,'N','G']){const conductor=e.splitPhase.conductors[k];if(!conductor.open)edges.push({id:e.id,conductor:k,a:node(e.from,k),b:node(e.to,k),ohms:z(conductor)});}
 for(const b of c.bonds)edges.push({id:b.id,bond:true,bus:b.bus,a:node(b.bus,'N'),b:node(b.bus,'G'),ohms:z(b)});
 const reached=new Set([reference]),queue=[reference];for(let i=0;i<queue.length;i++)for(const e of edges){const next=e.a===queue[i]?e.b:e.b===queue[i]?e.a:null;if(next&&!reached.has(next)){reached.add(next);queue.push(next);}}
 const nodes=[...reached].filter(id=>id!==reference),at=new Map(nodes.map((id,i)=>[id,i])),sparseY=nodes.length>SPLIT_DENSE_MAX,Y=sparseY?nodes.map(()=>new Map()):nodes.map(()=>nodes.map(()=>C())),J=nodes.map(()=>C());
 const inject=(rhs,id,value)=>{if(at.has(id))rhs[at.get(id)]=add(rhs[at.get(id)],value);};
 // Large networks keep Y as one Map per row (same additions in the same order).
 const get=(i,j)=>sparseY?(Y[i].get(j)||C()):Y[i][j],put=(i,j,v)=>{if(sparseY)Y[i].set(j,v);else Y[i][j]=v};
 for(const e of edges){if(!reached.has(e.a)||!reached.has(e.b))continue;const y=div(C(1),e.ohms),i=at.get(e.a),j=at.get(e.b);if(i!==undefined)put(i,i,add(get(i,i),y));if(j!==undefined)put(j,j,add(get(j,j),y));if(i!==undefined&&j!==undefined){put(i,j,sub(get(i,j),y));put(j,i,sub(get(j,i),y));}if(e.source){inject(J,e.a,mul(y,emf));inject(J,e.b,scale(mul(y,emf),-1));}}
 const luSolve=factorY(Y),prefault=luSolve(J),voltage=(values,id)=>id===reference?C():at.has(id)?values[at.get(id)]:null;
 const edgeOf=new Map();for(const e of edges)if(e.conductor)edgeOf.set(e.id+'\u0000'+e.conductor,e);
 return {issues,errors:[],project:p,splitPhase:true,singlePhase:false,phaseModel:'split-phase-explicit-loop',buses:p.buses,sources:[{id:c.sourceId,kind:p.sources.find(x=>x.id===c.sourceId).kind}],branches,edges,leg,ret,reference,sourceHot,sourceImpedance,emf,reached,nodes,at,Y,prefault,inject,voltage,luSolve,edgeOf,meshed:edges.filter(e=>reached.has(e.a)&&reached.has(e.b)).length>=reached.size};
}
// A solvable matrix alone does not establish usable physical precision. Very
// small conductor drops can lose digits when reconstructed from node voltages.
function verifyBalance(net,values,hot,ret,current,closed,faultZ){
 // Node index per edge end (reference = -1), built once per network.
 if(!net.edgeIdx){net.edgeIdx=net.edges.map(e=>net.reached.has(e.a)&&net.reached.has(e.b)?[e.a===net.reference?-1:net.at.get(e.a),e.b===net.reference?-1:net.at.get(e.b)]:null);}
 const N=net.nodes.length,rr=new Float64Array(N+1),ri=new Float64Array(N+1),mag=new Float64Array(N+1),slot=k=>k<0?N:k;
 const accumulate=(k,amps)=>{const q=slot(k);rr[q]+=amps.r;ri[q]+=amps.i;mag[q]+=abs(amps);};
 const V=k=>k<0?C():values[k];
 net.edges.forEach((e,q)=>{const ends=net.edgeIdx[q];if(!ends)return;
  const drop=sub(V(ends[0]),V(ends[1])),amps=div(e.source?sub(drop,net.emf):drop,e.ohms);
  accumulate(ends[0],amps);accumulate(ends[1],scale(amps,-1));
 });
 if(closed){
  const h=hot===net.reference?-1:net.at.get(hot),t=ret===net.reference?-1:net.at.get(ret);
  accumulate(h,current);accumulate(t,scale(current,-1));
  const drop=sub(V(h),V(t)),required=mul(faultZ,current);
  if(abs(sub(drop,required))>1e-8*Math.max(1,abs(drop),abs(required)))throw Error('Fault voltage residual exceeds numerical precision; review impedance scale.');
 }
 for(let q=0;q<=N;q++)if(Math.hypot(rr[q],ri[q])>1e-8*Math.max(1,mag[q]))throw Error('Conductor KCL residual exceeds numerical precision; review impedance scale.');
}
function response(p,net,bus,issues,options={}){
 const c=p.splitPhaseNetwork,common={busId:bus.id,busName:bus.name,voltage:bus.voltage,faultVoltage:c.fullVoltage/2,phaseModel:'split-phase-explicit-loop',peakA:null,asymA:null,sequence:null,bound:false,derBound:0,xr:null,issues,faultNote:splitPhaseScope};
 if(!c.busIds.includes(bus.id))return {...common,status:'OUTSIDE SPLIT-PHASE MODEL',totalA:null,details:[],branchFlows:[]};
 const hot=node(bus.id,net.leg),ret=node(bus.id,net.ret),closed=net.reached.has(hot)&&net.reached.has(ret);
 if(options.compact&&!options.full&&net.luSolve.typed)return compactResponse(p,net,bus,issues,options,common,hot,ret,closed);
 let current=C(),unit=net.nodes.map(()=>C()),zth=null;
 if(closed){const J=net.nodes.map(()=>C());net.inject(J,hot,C(1));net.inject(J,ret,C(-1));unit=net.luSolve(J);zth=sub(net.voltage(unit,hot),net.voltage(unit,ret));const vth=sub(net.voltage(net.prefault,hot),net.voltage(net.prefault,ret));current=div(vth,add(zth,C(p.settings.faultR,p.settings.faultX)));}
 const values=net.prefault.map((v,i)=>sub(v,mul(unit[i],current)));
 verifyBalance(net,values,hot,ret,current,closed,C(p.settings.faultR,p.settings.faultX));
 const compact=!!options.compact&&!options.full,shown=compact?new Set([bus.id,...(options.keepBuses||[])]):null;
 const nodeVoltages=Object.fromEntries((compact?c.busIds.filter(id=>shown.has(id)):c.busIds).map(id=>[id,Object.fromEntries(['L1','L2','N','G'].map(k=>[k,net.voltage(values,node(id,k))]))]));
 const flow=e=>{const va=net.voltage(values,e.a),vb=net.voltage(values,e.b);return va&&vb?div(sub(va,vb),e.ohms):C();};
 if(options.maxima){const mx=options.maxima;net.branches.forEach((e,q)=>{let m=0;for(const k of ['L1','L2','N','G']){const edge=net.edgeOf.get(e.id+'\u0000'+k);if(edge)m=Math.max(m,abs(flow(edge)))}mx[q]=m})}
 const keep=compact?new Set(options.keepBranches||[]):null;
 const conductorFlows=net.branches.filter(e=>!compact||e.from===bus.id||e.to===bus.id||keep.has(e.id)).map(e=>({id:e.id,name:e.name,kind:e.kind,from:e.from,to:e.to,conductors:Object.fromEntries(['L1','L2','N','G'].map(k=>{const edge=net.edgeOf.get(e.id+'\u0000'+k),fromPhasor=edge?flow(edge):C();return [k,{fromPhasor,toPhasor:scale(fromPhasor,-1),fromA:abs(fromPhasor),toA:abs(fromPhasor),open:e.splitPhase.conductors[k].open===true,modeled:k!== (net.leg==='L1'?'L2':'L1')}];}))}));
 const branchFlows=conductorFlows.map(e=>({...e,...e.conductors[net.leg]}));
 const t=p.branches.find(e=>e.id===c.transformerId),primary=scale(current,(net.leg==='L1'?1:-1)*c.fullVoltage/2/c.upstream.voltage);
 branchFlows.push({id:t.id,name:t.name,kind:t.kind,from:t.from,to:t.to,fromA:abs(primary),toA:abs(current),fromPhasor:primary,toPhasor:scale(current,-1),voltageBasis:'primary loop / secondary half-winding',conductor:net.leg});
 const bondFlows=net.edges.filter(e=>e.bond&&(!compact||shown.has(e.bus))).map(e=>({id:e.id,bus:e.bus,fromPhasor:flow(e),amps:abs(flow(e)),direction:'N-to-G'}));
 const totalA=abs(current),details=[{sourceId:c.sourceId,name:p.sources.find(s=>s.id===c.sourceId).name||'Documented source',kind:p.sources.find(s=>s.id===c.sourceId).kind,current:false,amps:totalA,phasor:current,sourceImpedance:net.sourceImpedance,sourceImpedanceAtFault:net.sourceImpedance,branchFlows,conductorFlows,bondFlows,unknownAngle:false,expired:false,path:[],meshed:net.meshed}];
 if(!Number.isFinite(totalA)||values.some(v=>!Number.isFinite(v.r)||!Number.isFinite(v.i)))throw Error('Explicit circuit exceeds numerical range');
 return {...common,status:closed?'CALCULATED':net.reached.has(hot)?'OPEN RETURN PATH':'OPEN SUPPLY PATH',totalA,conventionalA:totalA,phasor:current,zth,sourceImpedance:net.sourceImpedance,nodeVoltages,branchFlows,conductorFlows,bondFlows,details,groups:{[details[0].kind]:totalA},...(options.compact?{outputScope:'compact',detailScope:compact?'summary':'full'}:{})};
}
// Summary bus of a large network: the same equations in typed arrays (no per-node objects); same precision checks.
function compactResponse(p,net,bus,issues,options,common,hot,ret,closed){
 const c=p.splitPhaseNetwork,N=net.nodes.length,idx=id=>id===net.reference?-1:net.at.get(id),h=idx(hot),t=idx(ret);
 let current=C(),zth=null,ur=new Float64Array(N),ui=new Float64Array(N);
 if(closed){const r=new Float64Array(N),i=new Float64Array(N);if(h>=0)r[h]+=1;if(t>=0)r[t]-=1;[ur,ui]=net.luSolve.typed(r,i);const U=k=>k<0?C():C(ur[k],ui[k]);zth=sub(U(h),U(t));const vth=sub(net.voltage(net.prefault,hot),net.voltage(net.prefault,ret));current=div(vth,add(zth,C(p.settings.faultR,p.settings.faultX)));}
 const vr=new Float64Array(N),vi=new Float64Array(N);for(let k=0;k<N;k++){const v=net.prefault[k],mr=ur[k]*current.r-ui[k]*current.i,mi=ur[k]*current.i+ui[k]*current.r;vr[k]=v.r-mr;vi[k]=v.i-mi;if(!Number.isFinite(vr[k])||!Number.isFinite(vi[k]))throw Error('Explicit circuit exceeds numerical range')}
 const values={length:N},V=k=>k<0?C():C(vr[k],vi[k]);
 verifyBalanceTyped(net,vr,vi,h,t,current,closed,C(p.settings.faultR,p.settings.faultX));
 const vAt=id=>id===net.reference?C():net.at.has(id)?V(net.at.get(id)):null;
 const flow=e=>{const va=vAt(e.a),vb=vAt(e.b);return va&&vb?div(sub(va,vb),e.ohms):C();};
 if(options.maxima){const mx=options.maxima;
  if(!net.branchEdges){const pos=new Map(net.edges.map((e,q)=>[e,q]));net.branchEdges=net.branches.map(e=>['L1','L2','N','G'].map(k=>net.edgeOf.get(e.id+'\u0000'+k)).filter(Boolean).map(x=>pos.get(x)));}
  if(!net.edgeIdx)net.edgeIdx=net.edges.map(e=>net.reached.has(e.a)&&net.reached.has(e.b)?[e.a===net.reference?-1:net.at.get(e.a),e.b===net.reference?-1:net.at.get(e.b)]:null);
  for(let q=0;q<net.branches.length;q++){let m=0;for(const k of net.branchEdges[q]){const ends=net.edgeIdx[k];if(!ends)continue;const e=net.edges[k],a=ends[0],b=ends[1],dr=(a<0?0:vr[a])-(b<0?0:vr[b]),di=(a<0?0:vi[a])-(b<0?0:vi[b]);m=Math.max(m,Math.hypot(dr,di)/Math.hypot(e.ohms.r,e.ohms.i))}mx[q]=m}}
 const keep=new Set(options.keepBranches||[]),shown=new Set([bus.id]);
 const nodeVoltages=Object.fromEntries(c.busIds.filter(id=>shown.has(id)).map(id=>[id,Object.fromEntries(['L1','L2','N','G'].map(k=>[k,vAt(node(id,k))]))]));
 const conductorFlows=net.branches.filter(e=>e.from===bus.id||e.to===bus.id||keep.has(e.id)).map(e=>({id:e.id,name:e.name,kind:e.kind,from:e.from,to:e.to,conductors:Object.fromEntries(['L1','L2','N','G'].map(k=>{const edge=net.edgeOf.get(e.id+'\u0000'+k),fromPhasor=edge?flow(edge):C();return [k,{fromPhasor,toPhasor:scale(fromPhasor,-1),fromA:abs(fromPhasor),toA:abs(fromPhasor),open:e.splitPhase.conductors[k].open===true,modeled:k!== (net.leg==='L1'?'L2':'L1')}];}))}));
 const branchFlows=conductorFlows.map(e=>({...e,...e.conductors[net.leg]}));
 const tr=p.branches.find(e=>e.id===c.transformerId),primary=scale(current,(net.leg==='L1'?1:-1)*c.fullVoltage/2/c.upstream.voltage);
 branchFlows.push({id:tr.id,name:tr.name,kind:tr.kind,from:tr.from,to:tr.to,fromA:abs(primary),toA:abs(current),fromPhasor:primary,toPhasor:scale(current,-1),voltageBasis:'primary loop / secondary half-winding',conductor:net.leg});
 const bondFlows=net.edges.filter(e=>e.bond&&shown.has(e.bus)).map(e=>({id:e.id,bus:e.bus,fromPhasor:flow(e),amps:abs(flow(e)),direction:'N-to-G'}));
 const totalA=abs(current),src=p.sources.find(s=>s.id===c.sourceId),details=[{sourceId:c.sourceId,name:src.name||'Documented source',kind:src.kind,current:false,amps:totalA,phasor:current,sourceImpedance:net.sourceImpedance,sourceImpedanceAtFault:net.sourceImpedance,branchFlows,conductorFlows,bondFlows,unknownAngle:false,expired:false,path:[],meshed:net.meshed}];
 if(!Number.isFinite(totalA))throw Error('Explicit circuit exceeds numerical range');
 return {...common,status:closed?'CALCULATED':net.reached.has(hot)?'OPEN RETURN PATH':'OPEN SUPPLY PATH',totalA,conventionalA:totalA,phasor:current,zth,sourceImpedance:net.sourceImpedance,nodeVoltages,branchFlows,conductorFlows,bondFlows,details,groups:{[details[0].kind]:totalA},outputScope:'compact',detailScope:'summary'};
}
function verifyBalanceTyped(net,vr,vi,h,t,current,closed,faultZ){
 if(!net.edgeIdx)net.edgeIdx=net.edges.map(e=>net.reached.has(e.a)&&net.reached.has(e.b)?[e.a===net.reference?-1:net.at.get(e.a),e.b===net.reference?-1:net.at.get(e.b)]:null);
 const N=vr.length,rr=new Float64Array(N+1),ri=new Float64Array(N+1),mag=new Float64Array(N+1),emf=net.emf;
 for(let q=0;q<net.edges.length;q++){const ends=net.edgeIdx[q];if(!ends)continue;const e=net.edges[q],a=ends[0],b=ends[1];
  let dr=(a<0?0:vr[a])-(b<0?0:vr[b]),di=(a<0?0:vi[a])-(b<0?0:vi[b]);if(e.source){dr-=emf.r;di-=emf.i}
  const m=Math.max(Math.abs(e.ohms.r),Math.abs(e.ohms.i));if(!(m>0)||!Number.isFinite(m))throw Error('Invalid or singular explicit loop impedance');const zr=e.ohms.r/m,zi=e.ohms.i/m,d=zr*zr+zi*zi,ar=((dr/m)*zr+(di/m)*zi)/d,ai=((di/m)*zr-(dr/m)*zi)/d,am=Math.hypot(ar,ai);
  const qa=a<0?N:a,qb=b<0?N:b;rr[qa]+=ar;ri[qa]+=ai;mag[qa]+=am;rr[qb]-=ar;ri[qb]-=ai;mag[qb]+=am;}
 if(closed){const qa=h<0?N:h,qb=t<0?N:t,cm=abs(current);rr[qa]+=current.r;ri[qa]+=current.i;mag[qa]+=cm;rr[qb]-=current.r;ri[qb]-=current.i;mag[qb]+=cm;
  const drop=C((h<0?0:vr[h])-(t<0?0:vr[t]),(h<0?0:vi[h])-(t<0?0:vi[t])),required=mul(faultZ,current);
  if(abs(sub(drop,required))>1e-8*Math.max(1,abs(drop),abs(required)))throw Error('Fault voltage residual exceeds numerical precision; review impedance scale.');}
 for(let q=0;q<=N;q++)if(Math.hypot(rr[q],ri[q])>1e-8*Math.max(1,mag[q]))throw Error('Conductor KCL residual exceeds numerical precision; review impedance scale.');
}
// Compact output for large split-phase networks: each bus keeps its own connections; every connection's largest conductor
// current is added back at the bus that produces it (two passes), so conductor duty sees the same maxima.
function compactSplit(p,net,issues){
 const B=net.branches.length,best=new Float64Array(B).fill(-1),bestBus=new Int32Array(B).fill(-1),mx=new Float64Array(B);
 const results=p.buses.map((b,f)=>{mx.fill(0);let r;try{r=response(p,net,b,issues,{compact:true,full:b.id===p.selectedBus,maxima:mx})}catch(e){throw e}
  if(r.totalA!==null)for(let q=0;q<B;q++)if(mx[q]>best[q]){best[q]=mx[q];bestBus[q]=f}return r});
 const need=new Map();for(let q=0;q<B;q++){const f=bestBus[q];if(f<0)continue;if(!need.has(f))need.set(f,[]);need.get(f).push(net.branches[q].id)}
 for(const [f,ids] of need){if(results[f].detailScope==='full')continue;results[f]=response(p,net,p.buses[f],issues,{compact:true,keepBranches:ids})}
 return results;
}
// Full detail for one bus of a compact split-phase project.
export function calculateSplitPhaseBusDetail(p,busId){const issues=splitPhaseIssues(p);if(issues.some(i=>i.severity==='error'))return null;const net=network(p,issues),bus=p.buses.find(b=>b.id===busId);return bus?{...response(p,net,bus,issues,{compact:true,full:true}),faultType:p.settings.faultType}:null;}
export function calculateSplitPhaseProject(p){
 const issues=isSplitPhaseFault(p)?splitPhaseIssues(p):[{id:'settings',severity:'error',message:'Select an explicit split-phase L1/L2-neutral/ground fault mode.'}],errors=issues.filter(i=>i.severity==='error');
 const safeBuses=Array.isArray(p?.buses)?p.buses.filter(b=>record(b)&&doc(b.id)):[];
 const failed=(status,note)=>({issues,net:{issues,errors,splitPhase:true,buses:safeBuses,sources:[],branches:[]},results:safeBuses.map(b=>({busId:b.id,busName:b.name,voltage:b.voltage,phaseModel:'split-phase-explicit-loop',status,totalA:null,conventionalA:null,peakA:null,asymA:null,sequence:null,details:[],branchFlows:[],issues,faultNote:note}))});
 if(errors.length)return failed('INPUT REQUIRED',errors.map(e=>e.message).join(' '));
 try{const net=network(p,issues);return {issues,net,results:p.buses.length>SPLIT_COMPACT_MIN_BUSES?compactSplit(p,net,issues):p.buses.map(b=>response(p,net,b,issues))};}catch(e){const issue={id:'settings',severity:'error',message:e.message};issues.push(issue);errors.push(issue);return failed('NETWORK ERROR',e.message);}
}
