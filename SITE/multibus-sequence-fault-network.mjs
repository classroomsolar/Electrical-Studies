/**
 * Bounded multi-source, one-voltage-level three-sequence fault-network solution.
 * User-entered R+jX positive/negative/zero impedances and fixed positive-sequence
 * Thevenin EMFs only. AG, BC, BCG, ABC with optional metallic fault R+jX.
 * Independent network nodal solutions for each sequence and classical fault
 * interconnection at the faulted bus. Not full IEC 60909 or equipment duty.
 */
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const fail=m=>{throw Error('Multi-bus sequence study: '+m)};
const num=(o,k,lo,hi)=>{let x=o?.[k];if(!finite(x)||x<lo||x>hi)fail('Document finite '+k+' ('+lo+'..'+hi+')');return x};
const id=(x,k)=>{if(typeof x!=='string'||x.length>72||!x||!/^[A-Za-z0-9_-]+$/.test(x))fail('Invalid '+k);return x};
const z=(o,k)=>{if(o==='blocked')return null;if(!o||typeof o!=='object'||Array.isArray(o))fail(k+' sequence impedance required or blocked');let r=num(o,'rOhm',0,1e7),x=num(o,'xOhm',0,1e7);if(Math.hypot(r,x)<1e-8)fail(k+' impedance too small');return [r,x]};
const plus=(a,b)=>[a[0]+b[0],a[1]+b[1]],minus=(a,b)=>[a[0]-b[0],a[1]-b[1]],times=(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]],neg=a=>[-a[0],-a[1]],mag=a=>Math.hypot(a[0],a[1]);
const divide=(a,b)=>{let d=b[0]*b[0]+b[1]*b[1];if(d<1e-24)fail('Singular Thevenin/fault connection');return [(a[0]*b[0]+a[1]*b[1])/d,(a[1]*b[0]-a[0]*b[1])/d]};
const ONE=[1,0],ZERO=[0,0],A=[-.5,Math.sqrt(3)/2],A2=[-.5,-Math.sqrt(3)/2];
const cv=a=>({real:a[0],imag:a[1],magnitude:mag(a),angleDegrees:Math.atan2(a[1],a[0])*180/Math.PI});
const fillN=n=>Array.from({length:n},()=>[0,0]);
function solve(Y,j){const n=j.length;const M=Y.map((r,i)=>[...r.map(v=>[...v]),[...j[i]]]);
 let mn=Infinity,mx=0;
 for(let c=0;c<n;c++){
  let best=c,v=mag(M[c][c]);for(let r=c+1;r<n;r++){let m=mag(M[r][c]);if(m>v){v=m;best=r}}
  if(v<1e-13)fail('Singular or ungrounded sequence network; documented return path is needed');
  if(c!==best)[M[c],M[best]]=[M[best],M[c]];
  mn=Math.min(mn,v);mx=Math.max(mx,v);
  for(let r=c+1;r<n;r++){let f=divide(M[r][c],M[c][c]);for(let k=c+1;k<=n;k++)M[r][k]=minus(M[r][k],times(f,M[c][k]));M[r][c]=ZERO}
 }
 if(mx/Math.max(mn,1e-300)>1e12)fail('Ill-conditioned sequence network');
 let x=fillN(n);for(let i=n-1;i>=0;i--){let s=[...M[i][n]];for(let c=i+1;c<n;c++)s=minus(s,times(M[i][c],x[c]));x[i]=divide(s,M[i][i]);if(!x[i].every(Number.isFinite))fail('Unstable voltage');}
 let e=0,scale=1;for(let i=0;i<n;i++){let lhs=ZERO;for(let k=0;k<n;k++)lhs=plus(lhs,times(Y[i][k],x[k]));e=Math.max(e,mag(minus(lhs,j[i])));scale=Math.max(scale,mag(j[i]),mag(lhs))}if(e/scale>1e-8)fail('KCL residual exceeds 1e-8');
 return {x,residual:e/scale};
}
function makeMatrix(N){return Array.from({length:N},()=>fillN(N))}
function stamp(Y,i,j,seq){if(seq===null)return;let a=divide(ONE,seq);Y[i][i]=plus(Y[i][i],a);Y[j][j]=plus(Y[j][j],a);Y[i][j]=minus(Y[i][j],a);Y[j][i]=minus(Y[j][i],a)}
function network(N,branches,sources,seq){let Y=makeMatrix(N),j=fillN(N);
 for(let b of branches)stamp(Y,b.a,b.b,b.z[seq]);
 for(let s of sources){let imp=s.z[seq];if(imp===null)continue;let y=divide(ONE,imp);Y[s.a][s.a]=plus(Y[s.a][s.a],y);if(seq===1)j[s.a]=plus(j[s.a],times(s.E,y))}
 return {Y,j};
}
function phases(i0,i1,i2){return [plus(plus(i0,i1),i2),plus(plus(i0,times(A2,i1)),times(A,i2)),plus(plus(i0,times(A,i1)),times(A2,i2))]}
export const MULTIBUS_SEQUENCE_SCOPE='One voltage base, explicitly entered positive/negative/zero-sequence branch and source impedances, independent fixed positive-sequence source EMFs; four metallic fault configurations. No IEC 60909 corrections, transformer vector shifts, time-dependent generator/IBR currents or making/breaking duties.';
export function multiBusSequenceFault(c){
 if(!c||typeof c!=='object'||Array.isArray(c))fail('Documented case object required');
 const voltage=num(c,'nominalLLV',1,550000),factor=num(c,'voltageFactor',.5,1.5),freq=num(c,'frequencyHz',45,65);const type=c.faultType;
 if(!['3PH','AG','BC','BCG'].includes(type))fail('faultType must be 3PH, AG, BC or BCG');
 const bus=c.buses,ed=c.branches,ss=c.sources;
 if(!Array.isArray(bus)||bus.length<1||bus.length>18||!Array.isArray(ed)||ed.length>100||!Array.isArray(ss)||ss.length<1||ss.length>30)fail('1..18 buses, up to 100 branches and 1..30 sources');
 let ids=bus.map(x=>id(x,'bus'));if(new Set(ids).size!==ids.length)fail('Duplicate bus');let ix=new Map(ids.map((x,i)=>[x,i]));let fi=ix.get(id(c.faultBus,'fault bus'));if(fi===undefined)fail('Fault bus does not exist');
 let used=new Set(),get=x=>{let name=id(x,'bus reference');if(!ix.has(name))fail('Unknown referenced bus '+name);return ix.get(name)};
 const readZ=e=>[z(e.positiveSequence,'Positive'),z(e.negativeSequence,'Negative'),z(e.zeroSequence,'Zero')];
 let branches=ed.map(e=>{let k=id(e?.id,'branch ID');if(used.has(k))fail('Duplicate equipment ID');used.add(k);let a=get(e.from),b=get(e.to);if(a===b)fail('Self branch');let zs=readZ(e);if(!zs[1]||!zs[0])fail('Branches must document Z1 and Z2');return {id:k,a,b,z:[zs[2],zs[0],zs[1]]}});
 let sources=ss.map(s=>{let k=id(s?.id,'source ID');if(used.has(k))fail('Duplicate equipment ID');used.add(k);let a=get(s.bus),zs=readZ(s);if(!zs[0]||!zs[1])fail('Sources require positive and negative return-path impedances');let ang=num(s,'angleDeg',-180,180),scale=num(s,'emScale',.1,1.5),amp=voltage*factor*scale/Math.sqrt(3);let E=[amp*Math.cos(ang*Math.PI/180),amp*Math.sin(ang*Math.PI/180)];return {id:k,a,z:[zs[2],zs[0],zs[1]],E}});
 // Full positive/negative-sequence topology must connect fault bus to all buses.
 let adj=Array.from({length:bus.length},()=>[]);for(let e of branches){adj[e.a].push(e.b);adj[e.b].push(e.a)}let visited=new Set([fi]),queue=[fi];while(queue.length){let x=queue.pop();for(let y of adj[x])if(!visited.has(y)){visited.add(y);queue.push(y)}}if(visited.size!==bus.length)fail('Disconnected bus island');
 let faults={rOhm:0,xOhm:0};if(Object.hasOwn(c,'faultImpedance')){if(!c.faultImpedance||typeof c.faultImpedance!=='object'||Array.isArray(c.faultImpedance))fail('Documented fault impedance object required');faults={rOhm:num(c.faultImpedance,'rOhm',0,1e7),xOhm:num(c.faultImpedance,'xOhm',0,1e7)};if(faults.rOhm||faults.xOhm)if(Math.hypot(faults.rOhm,faults.xOhm)<1e-8)fail('Fault impedance below stable numeric range')}
 let Zf=[faults.rOhm,faults.xOhm],networks=[0,1,2].map(s=>network(ids.length,branches,sources,s));let pre=solve(networks[1].Y,networks[1].j),s1=solve(networks[1].Y,ids.map((_,i)=>i===fi?ONE:ZERO));
 const th=[null,s1.x[fi],null],col=[null,s1.x,null],residuals=[0,Math.max(pre.residual,s1.residual),0];
 if(type!=='3PH'){
  let s2=solve(networks[2].Y,ids.map((_,i)=>i===fi?ONE:ZERO));th[2]=s2.x[fi];col[2]=s2.x;residuals[2]=s2.residual;
 }
 if(type==='AG'||type==='BCG'){
  let s0=solve(networks[0].Y,ids.map((_,i)=>i===fi?ONE:ZERO));th[0]=s0.x[fi];col[0]=s0.x;residuals[0]=s0.residual;
 }
 let E=pre.x[fi],I0=ZERO,I1,I2=ZERO,Z3=times([3,0],Zf);
 if(type==='3PH')I1=divide(E,plus(th[1],Zf));
 else if(type==='AG'){I1=divide(E,plus(plus(th[0],th[1]),plus(th[2],Z3)));I0=I1;I2=I1}
 else if(type==='BC'){I1=divide(E,plus(plus(th[1],th[2]),Zf));I2=neg(I1)}
 else {let z0=plus(th[0],Z3),sum=plus(th[2],z0);let share=divide(times(th[2],z0),sum);I1=divide(E,plus(th[1],share));I2=neg(times(I1,divide(z0,sum)));I0=neg(times(I1,divide(th[2],sum)))}
 let seqFault=[I0,I1,I2];let V=[0,1,2].map(k=>ids.map((_,i)=>k===1?[...pre.x[i]]:ZERO));
 for(let k=0;k<3;k++)if(col[k])for(let i=0;i<ids.length;i++)V[k][i]=minus(V[k][i],times(col[k][i],seqFault[k]));
 const branchOut=branches.map(e=>{let zseq=e.z.map((z,k)=>z===null?ZERO:divide(minus(V[k][e.a],V[k][e.b]),z));return {id:e.id,from:ids[e.a],to:ids[e.b],phaseCurrentsA:phases(...zseq).map(cv),sequenceCurrentsA:zseq.map(cv)}});
 const sourceOut=sources.map(s=>{let zseq=s.z.map((z,k)=>z===null?ZERO:divide(minus(k===1?s.E:ZERO,V[k][s.a]),z));return {id:s.id,bus:ids[s.a],phaseCurrentsA:phases(...zseq).map(cv),sequenceCurrentsA:zseq.map(cv)}});
 // Because no shunt elements are admitted, the complete sum of Norton source
 // phase currents must equal the fault (sequence-wise) within a tight tolerance.
 const totals=sourceOut[0].sequenceCurrentsA.map(()=>ZERO);for(let x of sourceOut)for(let k=0;k<3;k++)totals[k]=plus(totals[k],[x.sequenceCurrentsA[k].real,x.sequenceCurrentsA[k].imag]);
 let err=0;for(let k=0;k<3;k++)err=Math.max(err,mag(minus(totals[k],seqFault[k]))/Math.max(1,mag(seqFault[k])));
 if(err>1e-8)fail('Network source-current conservation residual too high');
 let phFault=phases(...seqFault);if(phFault.some(x=>mag(x)>1e9))fail('Fault phase current above bounded numeric model');
 let busVoltages=ids.map((bus,i)=>({bus,phaseVoltagesV:phases(V[0][i],V[1][i],V[2][i]).map(cv),sequenceVoltagesV:[V[0][i],V[1][i],V[2][i]].map(cv)}));
 return {status:'BOUNDED_MULTI_BUS_SEQUENCE_FAULT',scope:MULTIBUS_SEQUENCE_SCOPE,faultType:type,nominalLLV:voltage,voltageFactor:factor,frequencyHz:freq,faultBus:c.faultBus,faultImpedanceOhm:faults,sequenceTheveninOhm:th.map(x=>x?cv(x):null),prefaultPositiveFaultBusV:cv(E),sequenceFaultCurrentA:seqFault.map(cv),phaseFaultCurrentA:phFault.map(cv),groundResidualA:3*mag(I0),maximumPhaseRmsA:Math.max(...phFault.map(mag)),sourceContributions:sourceOut,branchCurrents:branchOut,busVoltages,kclRelativeResidual:err,nodalRelativeResidual:Math.max(...residuals),limitations:['Explicit positive/negative/zero-sequence equivalent impedances; no transformer winding shift or zero-sequence grounding topology inference','Multiple documented fixed positive-sequence Thevenin EMFs, one voltage level only','No motor/IBR dynamic or generator subtransient decrement; no short-circuit peak, making/breaking duty','No IEC 60909 voltage correction by equipment type, maximum/minimum operating envelope or breaker rating','No harmonic, nonlinear electric arc, fault resistance estimation or conductor thermal qualification']};
}
