/**
 * Multi-source 3-phase short-circuit phasor analysis (explicit Thevenin sources).
 * Core current-law solution of a passive, bolted, balanced, single-voltage-level
 * network. This is NOT a complete IEC 60909-0:2026 study: source correction
 * factors, generators, IBR/motor transient decrement, breaking current,
 * asymmetrical making duty, transformer correction and zero-sequence network
 * must be addressed separately. No guessing of any equipment impedances.
 */
const finite = n => typeof n === 'number' && Number.isFinite(n);
const bad = msg => { throw new Error('Multi-source fault study: ' + msg) };
const requireNum=(x,k,min,max)=>{const v=x?.[k];if(!finite(v)||v<min||v>max)bad('Document finite '+k+' ('+min+'..'+max+')');return v};
const validId=(v,s)=>{if(typeof v!=='string'||!v.trim()||v.length>72||!/^[A-Za-z0-9_-]+$/.test(v))bad('Invalid '+s+' ID');return v};
const C=(r=0,i=0)=>[r,i], add=(a,b)=>[a[0]+b[0],a[1]+b[1]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1]],mul=(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]],div=(a,b)=>{const n=b[0]**2+b[1]**2;if(n<1e-22)bad('Zero/singular branch or source impedance');return [(a[0]*b[0]+a[1]*b[1])/n,(a[1]*b[0]-a[0]*b[1])/n]},abs=z=>Math.hypot(...z);
function impedance(item,label){const r=requireNum(item,'rOhm',0,1e7),x=requireNum(item,'xOhm',0,1e7);if(r===0&&x===0)bad('Nonzero impedance required for '+label);if(Math.hypot(r,x)<1e-8)bad('Impedance too small for bounded numerical model: '+label);return C(r,x)}
function solveComplex(A,b){const n=b.length;let work=A.map((row,i)=>[...row.map(z=>[...z]),[...b[i]]]);
 for(let k=0;k<n;k++){
  let pivot=k,pv=abs(work[k][k]);for(let i=k+1;i<n;i++){const v=abs(work[i][k]);if(v>pv){pv=v;pivot=i}}
  if(pv<1e-13)bad('Singular or isolated source-network admittance');
  if(pivot!==k)[work[k],work[pivot]]=[work[pivot],work[k]];
  for(let i=k+1;i<n;i++){const alpha=div(work[i][k],work[k][k]);for(let j=k+1;j<=n;j++)work[i][j]=sub(work[i][j],mul(alpha,work[k][j]));work[i][k]=C();}
 }
 const x=Array(n);for(let i=n-1;i>=0;i--){let v=[...work[i][n]];for(let j=i+1;j<n;j++)v=sub(v,mul(work[i][j],x[j]));x[i]=div(v,work[i][i]);if(!x[i].every(Number.isFinite))bad('Unstable voltage solution')}
 let norm=0,res=0;for(let i=0;i<n;i++){let lhs=C();for(let j=0;j<n;j++)lhs=add(lhs,mul(A[i][j],x[j]));res=Math.max(res,abs(sub(lhs,b[i])));norm=Math.max(norm,abs(lhs),abs(b[i]))}
 if(res>1e-7*Math.max(1,norm))bad('Kirchhoff residual exceeds 1e-7; ill-conditioned network');return {x,relativeResidual:res/Math.max(1,norm)};
}
const phasor = z => ({real:z[0],imag:z[1],magnitude:abs(z),angleDegrees:Math.atan2(z[1],z[0])*180/Math.PI});
export const MULTI_SOURCE_3PH_SCOPE='Balanced three-phase bolted or explicitly specified finite R+jX fault impedance, from fundamental-frequency independent Thevenin voltage sources at one voltage level. Direct nodal current law. Not complete IEC 60909:2026 or breaker duty study.';
export function multiSourceThreePhaseFault(c){
 if(!c||typeof c!=='object'||Array.isArray(c))bad('A documented network case object is required');
 const v=requireNum(c,'nominalLLV',1,550000),cf=requireNum(c,'voltageFactor',0.5,1.5),f=requireNum(c,'frequencyHz',45,65);
 const bs=c.buses,edges=c.branches,sources=c.sources;
 if(!Array.isArray(bs)||bs.length<1||bs.length>24||!Array.isArray(edges)||edges.length>120||!Array.isArray(sources)||sources.length<1||sources.length>40)bad('Use 1..24 buses, 0..120 branches and 1..40 Thevenin sources');
 const busIds=bs.map(id=>validId(id,'bus'));if(new Set(busIds).size!==busIds.length)bad('Duplicate bus identifiers');
 const faultBus=validId(c.faultBus,'fault bus'),faultIndex=busIds.indexOf(faultBus);if(faultIndex<0)bad('Fault bus must be a documented bus');
 const ids=new Set(),index=new Map(busIds.map((id,i)=>[id,i]));
 const getIndex=(x,k)=>{let b=validId(x[k],k);if(!index.has(b))bad('Unknown bus '+b);return index.get(b)};
 const verifiedEdges=edges.map(e=>{let id=validId(e?.id,'branch');if(ids.has(id))bad('Duplicate equipment id');ids.add(id);let a=getIndex(e,'from'),b=getIndex(e,'to');if(a===b)bad('Self-loop is not an admissible branch');return {...e,id,a,b,z:impedance(e,id)}});
 const verifiedSources=sources.map(s=>{let id=validId(s?.id,'source');if(ids.has(id))bad('Duplicate equipment id');ids.add(id);let a=getIndex(s,'bus');const angle=requireNum(s,'angleDeg',-180,180),relative=requireNum(s,'emScale',0.1,1.5);return {...s,id,a,z:impedance(s,id),angle,relative};});
 // Source-free islands cannot be meaningfully assessed; reject even if zero-current.
 const graph=Array.from({length:bs.length},()=>[]);for(const e of verifiedEdges){graph[e.a].push(e.b);graph[e.b].push(e.a)}
 const visited=new Set([faultIndex]),stack=[faultIndex];while(stack.length){for(const n of graph[stack.pop()])if(!visited.has(n)){visited.add(n);stack.push(n)}}if(visited.size!==bs.length)bad('Disconnected bus island; provide one connected network containing fault bus');
// Omission or an explicit exactly-zero impedance retains the legacy bolted-fault result.
// Finite 3-phase fault impedance is a positive-sequence shunt at the selected fault bus.
// No inferred grounding or negative-/zero-sequence impedances are assumed.
let zFault=null;
if(Object.hasOwn(c,'faultImpedance')) {
 if(!c.faultImpedance||typeof c.faultImpedance!=='object'||Array.isArray(c.faultImpedance))bad('Fault impedance must contain documented rOhm and xOhm');
 const r=requireNum(c.faultImpedance,'rOhm',0,1e7),x=requireNum(c.faultImpedance,'xOhm',0,1e7);
 if(r!==0||x!==0){if(Math.hypot(r,x)<1e-8)bad('Fault impedance too small for bounded numerical model');zFault=C(r,x)}
}
const idx=new Map(),unknown=busIds.filter((_,i)=>i!==faultIndex);for(let i=0;i<unknown.length;i++)idx.set(index.get(unknown[i]),i);

let volt,calcSrc,nodalRelativeResidual;
if(!zFault){
 const N=unknown.length,Y=Array.from({length:N},()=>Array.from({length:N},()=>C())),inject=Array.from({length:N},()=>C());
 const stamp=(a,b,z)=>{const y=div(C(1),z);if(a!==faultIndex)Y[idx.get(a)][idx.get(a)]=add(Y[idx.get(a)][idx.get(a)],y);if(b!==faultIndex)Y[idx.get(b)][idx.get(b)]=add(Y[idx.get(b)][idx.get(b)],y);if(a!==faultIndex&&b!==faultIndex){Y[idx.get(a)][idx.get(b)]=sub(Y[idx.get(a)][idx.get(b)],y);Y[idx.get(b)][idx.get(a)]=sub(Y[idx.get(b)][idx.get(a)],y)}};
 for(const e of verifiedEdges)stamp(e.a,e.b,e.z);
 const emBase=cf*v/Math.sqrt(3);
 calcSrc=verifiedSources.map(s=>{const theta=s.angle*Math.PI/180,E=mul(C(emBase*s.relative),C(Math.cos(theta),Math.sin(theta))),y=div(C(1),s.z);if(s.a!==faultIndex){let k=idx.get(s.a);Y[k][k]=add(Y[k][k],y);inject[k]=add(inject[k],mul(E,y))}return {...s,E};});
 const solved=N?solveComplex(Y,inject):{x:[],relativeResidual:0};volt=Array.from({length:bs.length},()=>C());for(const [a,k] of idx)volt[a]=solved.x[k];nodalRelativeResidual=solved.relativeResidual;
}else{
 const N=busIds.length,Y=Array.from({length:N},()=>Array.from({length:N},()=>C())),inject=Array.from({length:N},()=>C());
 // Kirchhoff: (Y_network + Y_Thevenin + 1/Z_fault at fault bus) V = I_Norton.
 // Unlike the bolted case, voltage at the fault bus is not constrained to zero.
 for(const e of verifiedEdges){const y=div(C(1),e.z);
  Y[e.a][e.a]=add(Y[e.a][e.a],y);Y[e.b][e.b]=add(Y[e.b][e.b],y);
  Y[e.a][e.b]=sub(Y[e.a][e.b],y);Y[e.b][e.a]=sub(Y[e.b][e.a],y);
 }
 const emBase=cf*v/Math.sqrt(3);
 calcSrc=verifiedSources.map(s=>{const theta=s.angle*Math.PI/180,E=mul(C(emBase*s.relative),C(Math.cos(theta),Math.sin(theta))),y=div(C(1),s.z);Y[s.a][s.a]=add(Y[s.a][s.a],y);inject[s.a]=add(inject[s.a],mul(E,y));return {...s,E}});
 Y[faultIndex][faultIndex]=add(Y[faultIndex][faultIndex],div(C(1),zFault));
 const solved=solveComplex(Y,inject);volt=solved.x;nodalRelativeResidual=solved.relativeResidual;
}
 const branchCurrents=verifiedEdges.map(e=>{let I=div(sub(volt[e.a],volt[e.b]),e.z);return {id:e.id,from:busIds[e.a],to:busIds[e.b],currentA:phasor(I)}});
 const sourceCurrents=calcSrc.map(s=>{let I=div(sub(s.E,volt[s.a]),s.z);return {id:s.id,bus:busIds[s.a],emfPhaseV:phasor(s.E),currentA:phasor(I)}});
let faultCurrent=C();
if(zFault){faultCurrent=div(volt[faultIndex],zFault)}else{
for(const e of verifiedEdges){if(e.a===faultIndex)faultCurrent=add(faultCurrent,div(sub(volt[e.b],volt[e.a]),e.z));else if(e.b===faultIndex)faultCurrent=add(faultCurrent,div(sub(volt[e.a],volt[e.b]),e.z));}
 for(const s of calcSrc)if(s.a===faultIndex)faultCurrent=add(faultCurrent,div(s.E,s.z));
}
if(abs(faultCurrent)>1e9)bad('Numerical current exceeds 1 GA; check source/fault impedances');
 const sumSources=sourceCurrents.reduce((z,s)=>add(z,C(s.currentA.real,s.currentA.imag)),C());const conservation=abs(sub(sumSources,faultCurrent))/Math.max(1,abs(faultCurrent));if(conservation>1e-8)bad('Source/fault conservation check failed');
 const voltages=busIds.map((bus,i)=>({bus,phaseVoltageV:phasor(volt[i])}));
 return {status:'BOUNDED_MULTI_SOURCE_3PH_PHASOR',method:MULTI_SOURCE_3PH_SCOPE,nominalLLV:v,voltageFactor:cf,frequencyHz:f,faultBus,phaseFaultCurrentA:phasor(faultCurrent),initialSymmetricalKA:abs(faultCurrent)/1000,initialShortCircuitMVA:Math.sqrt(3)*v*abs(faultCurrent)/1e6,sourceContributions:sourceCurrents,branchCurrents,busVoltages:voltages,faultMode:zFault?'FINITE_THREE_PHASE_IMPEDANCE':'BOLTED_THREE_PHASE',faultImpedanceOhm:zFault?{rOhm:zFault[0],xOhm:zFault[1]}:{rOhm:0,xOhm:0},faultBusVoltageV:phasor(volt[faultIndex]),nodalRelativeResidual,kclRelativeResidual:conservation,limits:['One nominal voltage level: transformer turns ratio and vector group NOT modelled','Sources are independent fixed Thevenin EMFs with entered actual positive-sequence Z','No generator or inverter decrement, motor fault contributions unless represented by documented source impedances','No making peak, DC decrement or breaking duty calculated','Only balanced 3-phase metallic faults with optional linear R+jX fault impedance; no nonlinear arcs or negative-/zero-sequence faults','No automatic IEC equipment correction factors, utility maximum/minimum source envelope or source impedance qualification']};
}
