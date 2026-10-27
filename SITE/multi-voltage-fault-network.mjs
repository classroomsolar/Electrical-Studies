/**
 * Opt-in, balanced fundamental-frequency multi-voltage Thevenin network.
 * All per-unit impedances on the explicitly entered three-phase base MVA;
 * line ohms converted on local bus LL voltage base, transformers stamped
 * with explicit off-nominal magnitude/phase tap. NOT full IEC 60909.
 * No omitted physical parameters silently inferred.
 */
const valid = x => typeof x === 'number' && Number.isFinite(x);
const fail = s => {throw Error('Multi-voltage bounded fault: ' + s)};
function number(o,k,lo,hi){const n=o?.[k];if(!valid(n)||n<lo||n>hi)fail('Document finite '+k+' ('+lo+'..'+hi+')');return n}
function name(v,what){if(typeof v!=='string'||!/^[A-Za-z0-9_-]{1,64}$/.test(v))fail('Invalid '+what);return v}
const c=(re=0,im=0)=>[re,im],add=(a,b)=>[a[0]+b[0],a[1]+b[1]], sub=(a,b)=>[a[0]-b[0],a[1]-b[1]];
const mul=(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]], conj=a=>[a[0],-a[1]],mag=z=>Math.hypot(...z);
function div(a,b){const d=b[0]*b[0]+b[1]*b[1];if(d<1e-25)fail('Near-zero impedance or transformer tap');return [(a[0]*b[0]+a[1]*b[1])/d,(a[1]*b[0]-a[0]*b[1])/d]}
const polar=(r,ang)=>[r*Math.cos(ang*Math.PI/180),r*Math.sin(ang*Math.PI/180)];
const out=z=>({real:z[0],imag:z[1],magnitude:mag(z),angleDegrees:Math.atan2(z[1],z[0])*180/Math.PI});
function stamp(A,a,b,y,t){const ti=div(c(1),t),tic=conj(ti);A[a][a]=add(A[a][a],mul(y,mul(ti,tic)));A[a][b]=sub(A[a][b],mul(y,tic));A[b][a]=sub(A[b][a],mul(y,ti));A[b][b]=add(A[b][b],y)}
function solve(A,b){const n=b.length, M=A.map((r,i)=>[...r.map(z=>[...z]),[...b[i]]]);for(let k=0;k<n;k++){let p=k;for(let j=k+1;j<n;j++)if(mag(M[j][k])>mag(M[p][k]))p=j;if(mag(M[p][k])<1e-12)fail('Singular or ill-conditioned admittance matrix');if(p!==k)[M[p],M[k]]=[M[k],M[p]];for(let i=k+1;i<n;i++){const f=div(M[i][k],M[k][k]);for(let j=k+1;j<=n;j++)M[i][j]=sub(M[i][j],mul(f,M[k][j]));M[i][k]=c()}}const v=Array(n);for(let i=n-1;i>=0;i--){let q=[...M[i][n]];for(let j=i+1;j<n;j++)q=sub(q,mul(M[i][j],v[j]));v[i]=div(q,M[i][i]);if(!v[i].every(Number.isFinite))fail('Unstable complex network solution')}let delta=0,norm=1;for(let i=0;i<n;i++){let z=c();for(let j=0;j<n;j++)z=add(z,mul(A[i][j],v[j]));delta=Math.max(delta,mag(sub(z,b[i])));norm=Math.max(norm,mag(b[i]))}if(delta/norm>1e-8)fail('Poor Kirchhoff residual');return {v,residual:delta/norm}}
export const MULTIVOLTAGE_SCOPE='Fundamental-frequency balanced 3PH linear Thevenin sources + documented nominal transformer LL voltage bases, leakage on one 3PH power base and off-nominal tap phase/magnitude. No vector-group zero-sequence, non-linear fault arc, generator/motor/IBR decrement or correction factors, certified maximum/minimum IEC-60909 duty, or breaker approval.';
export function multiVoltageThreePhaseFault(data){
 if(!data||typeof data!=='object'||Array.isArray(data))fail('Document complete input case');
 const baseMVA=number(data,'baseMVA',0.001,1e5), S=baseMVA*1e6, frequencyHz=number(data,'frequencyHz',45,65);
 const buses=data.buses,branches=data.branches,sources=data.sources;
 if(!Array.isArray(buses)||buses.length<2||buses.length>24||!Array.isArray(branches)||branches.length<1||branches.length>90||!Array.isArray(sources)||sources.length<1||sources.length>40)fail('Requires 2..24 buses, 1..90 branches and 1..40 sources');
 const names=[],busV=[];for(const b of buses){names.push(name(b?.id,'bus ID'));busV.push(number(b,'nominalLLV',1,550000))}if(new Set(names).size!==names.length)fail('Duplicate bus identifiers');
 const busIndex=new Map(names.map((s,i)=>[s,i]));const idBus=s=>{let i=busIndex.get(name(s,'equipment bus'));if(i===undefined)fail('Unknown equipment bus '+s);return i};
 const fault=idBus(data.faultBus),n=buses.length,used=new Set(),adj=Array.from({length:n},()=>[]);
 const Y=Array.from({length:n},()=>Array.from({length:n},()=>c())),I=Array.from({length:n},()=>c());
 const edges=branches.map(e=>{
  const id=name(e?.id,'branch ID');if(used.has(id))fail('Duplicate equipment ID '+id);used.add(id);
  const a=idBus(e.from),b=idBus(e.to);if(a===b)fail('Invalid branch self-loop');adj[a].push(b);adj[b].push(a);
  const type=e.kind;if(type!=='line'&&type!=='transformer')fail(id+': specify line or transformer');
  let z,t=c(1);
  if(type==='line'){
   if(Math.abs(busV[a]/busV[b]-1)>1e-5)fail(id+': line endpoints require same rated voltage; use a transformer');
   z=c(number(e,'rOhm',0,1e8),number(e,'xOhm',0,1e8));z=[z[0]*S/busV[a]**2,z[1]*S/busV[a]**2];
  }else{
   if(Math.abs(busV[a]/busV[b]-1)<1e-5)fail(id+': transformer terminals must document different nominal LL bases');
   z=c(number(e,'rPu',0,1e5),number(e,'xPu',0,1e5));
   t=polar(number(e,'tapMagnitude',0.5,1.5),number(e,'phaseShiftDeg',-180,180));
  }
  if(mag(z)<1e-8)fail(id+': documented branch impedance too small');const y=div(c(1),z);stamp(Y,a,b,y,t);return {id,a,b,type,y,t,z};
 });
 let seen=new Set([fault]),queue=[fault];while(queue.length){for(const b of adj[queue.pop()])if(!seen.has(b)){seen.add(b);queue.push(b)}}if(seen.size!==n)fail('Disconnected island; use one connected fault network');
 const src=sources.map(s=>{const id=name(s?.id,'source ID');if(used.has(id))fail('Duplicate equipment ID '+id);used.add(id);const a=idBus(s.bus),z=c(number(s,'rPu',0,1e6),number(s,'xPu',0,1e6));if(mag(z)<1e-8)fail(id+': source impedance too small');const y=div(c(1),z),E=polar(number(s,'emScale',0.1,1.5),number(s,'angleDeg',-180,180));Y[a][a]=add(Y[a][a],y);I[a]=add(I[a],mul(E,y));return {id,a,y,E,z}});
 const Ybase=Y.map(r=>r.map(z=>[...z])),Ibase=I.map(z=>[...z]);let zfault=null;
 if(Object.hasOwn(data,'faultImpedance')){
  const f=data.faultImpedance;if(!f||typeof f!=='object'||Array.isArray(f))fail('faultImpedance requires R and X in ohms at the fault bus');const r=number(f,'rOhm',0,1e8),x=number(f,'xOhm',0,1e8);if(r!==0||x!==0){const k=S/busV[fault]**2;zfault=c(r*k,x*k);if(mag(zfault)<1e-8)fail('Fault impedance below numerical study bound')}
 }
 let V,residual;if(zfault){Y[fault][fault]=add(Y[fault][fault],div(c(1),zfault));let sol=solve(Y,I);V=sol.v;residual=sol.residual}
 else {const keep=Array.from({length:n},(_,i)=>i).filter(i=>i!==fault),A=keep.map(i=>keep.map(j=>Y[i][j])),rhs=keep.map(i=>I[i]);const sol=solve(A,rhs);V=Array.from({length:n},()=>c());keep.forEach((id,k)=>{V[id]=sol.v[k]});residual=sol.residual}
 // Fault sink in per-unit current, converted only on the fault-voltage base.
 let current=Ibase[fault];for(let j=0;j<n;j++)current=sub(current,mul(Ybase[fault][j],V[j]));
 if(!Number.isFinite(mag(current))||mag(current)>1e8)fail('Nonphysical fault-current magnitude');
 const branchCurrents=edges.map(e=>{const from=mul(e.y,mul(conj(div(c(1),e.t)),sub(mul(div(c(1),e.t),V[e.a]),V[e.b])));const to=mul(e.y,sub(V[e.b],mul(div(c(1),e.t),V[e.a])));return {id:e.id,kind:e.type,from:names[e.a],to:names[e.b],fromA:out(mul(from,c(S/(Math.sqrt(3)*busV[e.a])))),toA:out(mul(to,c(S/(Math.sqrt(3)*busV[e.b]))))}});
 const sourceCurrents=src.map(s=>({id:s.id,bus:names[s.a],currentA:out(mul(mul(s.y,sub(s.E,V[s.a])),c(S/(Math.sqrt(3)*busV[s.a]))))}));
 const faultA=out(mul(current,c(S/(Math.sqrt(3)*busV[fault]))));
 const busVoltages=buses.map((b,i)=>({bus:names[i],llV:b.nominalLLV,phaseVoltageV:out(mul(V[i],c(busV[i]/Math.sqrt(3)))),voltagePu:out(V[i])}));
 return {status:'BOUNDED_MULTIVOLTAGE_3PH_NETWORK',scope:MULTIVOLTAGE_SCOPE,baseMVA,frequencyHz,faultBus:names[fault],faultNominalLLV:busV[fault],faultMode:zfault?'FINITE_FAULT_Z':'BOLTED_FAULT',faultCurrentA:faultA,initialSymmetricalKA:faultA.magnitude/1000,initialShortCircuitMVA:Math.sqrt(3)*busV[fault]*faultA.magnitude/1e6,sourceCurrents,branchCurrents,busVoltages,nodalRelativeResidual:residual,assumptions:['All complex impedances linear and at fundamental frequency','Transformer leakage and tap explicitly documented; leakage given on global three-phase S base','Transformer winding group and ground return do not enter balanced 3PH calculations','No fault-duty correction/decrement, CT/reclosing, or manufacturer equipment qualification']}
}
