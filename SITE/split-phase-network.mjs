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
 const transformer=branches.find(e=>e.id===cfg.transformerId);
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
function network(p,issues){
 const c=p.splitPhaseNetwork,leg=p.settings.faultType.includes('l2')?'L2':'L1',ret=p.settings.faultType.endsWith('-g')?'G':'N',reference=node(c.busId,'N'),sourceHot=node(c.busId,leg);
 const sourceImpedance=add(z(c.halfWinding[leg]),scale(z(c.upstream),(c.fullVoltage/2/c.upstream.voltage)**2));
 const emf=C((leg==='L1'?1:-1)*c.fullVoltage/2*p.settings.voltageFactor),edges=[{id:'__source',a:sourceHot,b:reference,ohms:sourceImpedance,source:true}];
 const branches=p.branches.filter(e=>e.id!==c.transformerId&&activeBranch(p,e));
 for(const e of branches)for(const k of [leg,'N','G']){const conductor=e.splitPhase.conductors[k];if(!conductor.open)edges.push({id:e.id,conductor:k,a:node(e.from,k),b:node(e.to,k),ohms:z(conductor)});}
 for(const b of c.bonds)edges.push({id:b.id,bond:true,bus:b.bus,a:node(b.bus,'N'),b:node(b.bus,'G'),ohms:z(b)});
 const reached=new Set([reference]),queue=[reference];for(let i=0;i<queue.length;i++)for(const e of edges){const next=e.a===queue[i]?e.b:e.b===queue[i]?e.a:null;if(next&&!reached.has(next)){reached.add(next);queue.push(next);}}
 const nodes=[...reached].filter(id=>id!==reference),at=new Map(nodes.map((id,i)=>[id,i])),Y=nodes.map(()=>nodes.map(()=>C())),J=nodes.map(()=>C());
 const inject=(rhs,id,value)=>{if(at.has(id))rhs[at.get(id)]=add(rhs[at.get(id)],value);};
 for(const e of edges){if(!reached.has(e.a)||!reached.has(e.b))continue;const y=div(C(1),e.ohms),i=at.get(e.a),j=at.get(e.b);if(i!==undefined)Y[i][i]=add(Y[i][i],y);if(j!==undefined)Y[j][j]=add(Y[j][j],y);if(i!==undefined&&j!==undefined){Y[i][j]=sub(Y[i][j],y);Y[j][i]=sub(Y[j][i],y);}if(e.source){inject(J,e.a,mul(y,emf));inject(J,e.b,scale(mul(y,emf),-1));}}
 const prefault=solve(Y,J),voltage=(values,id)=>id===reference?C():at.has(id)?values[at.get(id)]:null;
 return {issues,errors:[],project:p,splitPhase:true,singlePhase:false,phaseModel:'split-phase-explicit-loop',buses:p.buses,sources:[{id:c.sourceId,kind:p.sources.find(x=>x.id===c.sourceId).kind}],branches,edges,leg,ret,reference,sourceHot,sourceImpedance,emf,reached,nodes,at,Y,prefault,inject,voltage};
}
// A solvable matrix alone does not establish usable physical precision. Very
// small conductor drops can lose digits when reconstructed from node voltages.
function verifyBalance(net,values,hot,ret,current,closed,faultZ){
 const residual=new Map([...net.reached].map(id=>[id,C()])),magnitude=new Map([...net.reached].map(id=>[id,0]));
 const accumulate=(id,amps)=>{if(!residual.has(id))return;residual.set(id,add(residual.get(id),amps));magnitude.set(id,magnitude.get(id)+abs(amps));};
 for(const e of net.edges){
  if(!net.reached.has(e.a)||!net.reached.has(e.b))continue;
  const drop=sub(net.voltage(values,e.a),net.voltage(values,e.b)),amps=div(e.source?sub(drop,net.emf):drop,e.ohms);
  accumulate(e.a,amps);accumulate(e.b,scale(amps,-1));
 }
 if(closed){
  accumulate(hot,current);accumulate(ret,scale(current,-1));
  const drop=sub(net.voltage(values,hot),net.voltage(values,ret)),required=mul(faultZ,current);
  if(abs(sub(drop,required))>1e-8*Math.max(1,abs(drop),abs(required)))throw Error('Fault voltage residual exceeds numerical precision; review impedance scale.');
 }
 for(const [id,amps] of residual)if(abs(amps)>1e-8*Math.max(1,magnitude.get(id)))throw Error('Conductor KCL residual exceeds numerical precision; review impedance scale.');
}
function response(p,net,bus,issues){
 const c=p.splitPhaseNetwork,common={busId:bus.id,busName:bus.name,voltage:bus.voltage,faultVoltage:c.fullVoltage/2,phaseModel:'split-phase-explicit-loop',peakA:null,asymA:null,sequence:null,bound:false,derBound:0,xr:null,issues,faultNote:splitPhaseScope};
 if(!c.busIds.includes(bus.id))return {...common,status:'OUTSIDE SPLIT-PHASE MODEL',totalA:null,details:[],branchFlows:[]};
 const hot=node(bus.id,net.leg),ret=node(bus.id,net.ret),closed=net.reached.has(hot)&&net.reached.has(ret);let current=C(),unit=net.nodes.map(()=>C()),zth=null;
 if(closed){const J=net.nodes.map(()=>C());net.inject(J,hot,C(1));net.inject(J,ret,C(-1));unit=solve(net.Y,J);zth=sub(net.voltage(unit,hot),net.voltage(unit,ret));const vth=sub(net.voltage(net.prefault,hot),net.voltage(net.prefault,ret));current=div(vth,add(zth,C(p.settings.faultR,p.settings.faultX)));}
 const values=net.prefault.map((v,i)=>sub(v,mul(unit[i],current)));
 verifyBalance(net,values,hot,ret,current,closed,C(p.settings.faultR,p.settings.faultX));
 const nodeVoltages=Object.fromEntries(c.busIds.map(id=>[id,Object.fromEntries(['L1','L2','N','G'].map(k=>[k,net.voltage(values,node(id,k))]))]));
 const flow=e=>{const va=net.voltage(values,e.a),vb=net.voltage(values,e.b);return va&&vb?div(sub(va,vb),e.ohms):C();};
 const conductorFlows=net.branches.map(e=>({id:e.id,name:e.name,kind:e.kind,from:e.from,to:e.to,conductors:Object.fromEntries(['L1','L2','N','G'].map(k=>{const edge=net.edges.find(x=>x.id===e.id&&x.conductor===k),fromPhasor=edge?flow(edge):C();return [k,{fromPhasor,toPhasor:scale(fromPhasor,-1),fromA:abs(fromPhasor),toA:abs(fromPhasor),open:e.splitPhase.conductors[k].open===true,modeled:k!== (net.leg==='L1'?'L2':'L1')}];}))}));
 const branchFlows=conductorFlows.map(e=>({...e,...e.conductors[net.leg]}));
 const t=p.branches.find(e=>e.id===c.transformerId),primary=scale(current,(net.leg==='L1'?1:-1)*c.fullVoltage/2/c.upstream.voltage);
 branchFlows.push({id:t.id,name:t.name,kind:t.kind,from:t.from,to:t.to,fromA:abs(primary),toA:abs(current),fromPhasor:primary,toPhasor:scale(current,-1),voltageBasis:'primary loop / secondary half-winding',conductor:net.leg});
 const bondFlows=net.edges.filter(e=>e.bond).map(e=>({id:e.id,bus:e.bus,fromPhasor:flow(e),amps:abs(flow(e)),direction:'N-to-G'}));
 const totalA=abs(current),details=[{sourceId:c.sourceId,name:p.sources.find(s=>s.id===c.sourceId).name||'Documented source',kind:p.sources.find(s=>s.id===c.sourceId).kind,current:false,amps:totalA,phasor:current,sourceImpedance:net.sourceImpedance,sourceImpedanceAtFault:net.sourceImpedance,branchFlows,conductorFlows,bondFlows,unknownAngle:false,expired:false,path:[],meshed:net.edges.filter(e=>net.reached.has(e.a)&&net.reached.has(e.b)).length>=net.reached.size}];
 if(!Number.isFinite(totalA)||values.some(v=>!Number.isFinite(v.r)||!Number.isFinite(v.i)))throw Error('Explicit circuit exceeds numerical range');
 return {...common,status:closed?'CALCULATED':net.reached.has(hot)?'OPEN RETURN PATH':'OPEN SUPPLY PATH',totalA,conventionalA:totalA,phasor:current,zth,sourceImpedance:net.sourceImpedance,nodeVoltages,branchFlows,conductorFlows,bondFlows,details,groups:{[details[0].kind]:totalA}};
}
export function calculateSplitPhaseProject(p){
 const issues=isSplitPhaseFault(p)?splitPhaseIssues(p):[{id:'settings',severity:'error',message:'Select an explicit split-phase L1/L2-neutral/ground fault mode.'}],errors=issues.filter(i=>i.severity==='error');
 const safeBuses=Array.isArray(p?.buses)?p.buses.filter(b=>record(b)&&doc(b.id)):[];
 const failed=(status,note)=>({issues,net:{issues,errors,splitPhase:true,buses:safeBuses,sources:[],branches:[]},results:safeBuses.map(b=>({busId:b.id,busName:b.name,voltage:b.voltage,phaseModel:'split-phase-explicit-loop',status,totalA:null,conventionalA:null,peakA:null,asymA:null,sequence:null,details:[],branchFlows:[],issues,faultNote:note}))});
 if(errors.length)return failed('INPUT REQUIRED',errors.map(e=>e.message).join(' '));
 try{const net=network(p,issues);return {issues,net,results:p.buses.map(b=>response(p,net,b,issues))};}catch(e){const issue={id:'settings',severity:'error',message:e.message};issues.push(issue);errors.push(issue);return failed('NETWORK ERROR',e.message);}
}
