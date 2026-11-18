/**
 * Bounded initial 3PH short-circuit peak-current screening, equivalent-frequency
 * Method C network reduction. Explicit positive-sequence passive impedances only.
 * IEC 60909-0:2026 is broader: voltage and equipment correction factors,
 * generator/motor/IBR contribution, detailed impedance frequency response,
 * breaking/thermal duty, transformer taps/vector groups and approval omitted.
 *
 * Input is compatible with the V13 multi-source three-phase study but requires
 * coincident source EMFs (angleDeg=0, emScale=1) and bolted fault. The IEC-style
 * equivalent voltage source is c*Un/sqrt(3) at the fault point; passive sources
 * are shorted for driving-point Z. This is NOT an OEM device-duty certification.
 */
const finite = x => typeof x === 'number' && Number.isFinite(x);
const fail = x => { throw Error('Peak-current network screen: '+x) };
const req = (o,k,lo,hi) => {const v=o?.[k];if(!finite(v)||v<lo||v>hi)fail('Document finite '+k+' within '+lo+'..'+hi);return v};
const id = (v,desc) => {if(typeof v!=='string'||!v||v.length>72||!/^[A-Za-z0-9_-]+$/.test(v))fail('Invalid '+desc);return v};
const cadd=(a,b)=>[a[0]+b[0],a[1]+b[1]],csub=(a,b)=>[a[0]-b[0],a[1]-b[1]],cmul=(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]],cabs=z=>Math.hypot(z[0],z[1]);
const cdiv=(a,b)=>{let den=b[0]**2+b[1]**2;if(den<1e-24)fail('Singular impedance in network');return [(a[0]*b[0]+a[1]*b[1])/den,(a[1]*b[0]-a[0]*b[1])/den]};
function solve(Y,b){const n=b.length,M=Y.map((r,i)=>[...r.map(z=>[...z]),[...b[i]]]);
 for(let k=0;k<n;k++){
  let best=k,v=cabs(M[k][k]);for(let j=k+1;j<n;j++){let w=cabs(M[j][k]);if(w>v){v=w;best=j}}
  if(v<1e-13)fail('Singular or poorly connected network');if(best!==k)[M[k],M[best]]=[M[best],M[k]];
  for(let i=k+1;i<n;i++){let f=cdiv(M[i][k],M[k][k]);for(let j=k+1;j<=n;j++)M[i][j]=csub(M[i][j],cmul(f,M[k][j]));M[i][k]=[0,0]}
 }
 const x=Array(n);for(let i=n-1;i>=0;i--){let v=M[i][n];for(let j=i+1;j<n;j++)v=csub(v,cmul(M[i][j],x[j]));x[i]=cdiv(v,M[i][i]);if(!x[i].every(finite))fail('Non-finite Thevenin impedance')}
 let err=0,scale=1;for(let i=0;i<n;i++){let lhs=[0,0];for(let j=0;j<n;j++)lhs=cadd(lhs,cmul(Y[i][j],x[j]));err=Math.max(err,cabs(csub(lhs,b[i])));scale=Math.max(scale,cabs(lhs),cabs(b[i]))}
 if(err/scale>1e-8)fail('Nodal residual above 1e-8');return {x,residual:err/scale};
}
function drivingPoint(N,branches,sources,at,freqScale){const Y=Array.from({length:N},()=>Array.from({length:N},()=>[0,0]));
 const adm=z=>cdiv([1,0],[z[0],z[1]*freqScale]);
 for(const e of branches){const y=adm(e.z),a=e.a,b=e.b;Y[a][a]=cadd(Y[a][a],y);Y[b][b]=cadd(Y[b][b],y);Y[a][b]=csub(Y[a][b],y);Y[b][a]=csub(Y[b][a],y)}
 for(const s of sources){Y[s.a][s.a]=cadd(Y[s.a][s.a],adm(s.z))}
 const inj=Array.from({length:N},(_,i)=>i===at?[1,0]:[0,0]);const solution=solve(Y,inj);
 return {z:solution.x[at],residual:solution.residual};
}
export const PEAK_METHOD_C_SCOPE='Bounded IEC 60909 equivalent-frequency Method C screen: one voltage level, documented passive positive-sequence network, identical source EMFs, 3PH bolted fault. Not a full IEC 60909-0:2026 calculation or breaker-making-duty certification.';
export function peakMakingNetworkScreen(c){
 if(!c||typeof c!=='object'||Array.isArray(c))fail('Documented network case required');
 const voltage=req(c,'nominalLLV',1,550000),factor=req(c,'voltageFactor',.5,1.5),f=req(c,'frequencyHz',50,60);
 if(f!==50&&f!==60)fail('Only nominal 50 Hz or 60 Hz equivalent-frequency cases are supported');
 if(Object.hasOwn(c,'faultImpedance')){const z=c.faultImpedance;if(!z||typeof z!=='object'||Array.isArray(z)||req(z,'rOhm',0,1e7)!==0||req(z,'xOhm',0,1e7)!==0)fail('Only bolted 3PH faults: remove nonzero faultImpedance')}
 if(!Array.isArray(c.buses)||c.buses.length<1||c.buses.length>24||!Array.isArray(c.branches)||c.branches.length>120||!Array.isArray(c.sources)||c.sources.length<1||c.sources.length>40)fail('1..24 buses, 0..120 branches and 1..40 documented sources required');
 const buses=c.buses.map(v=>id(v,'bus ID'));if(new Set(buses).size!==buses.length)fail('Duplicate bus ID');const ids=new Map(buses.map((v,i)=>[v,i]));const fault=ids.get(id(c.faultBus,'fault bus'));if(fault===undefined)fail('Fault bus missing');
 const used=new Set();const get=v=>{const i=ids.get(id(v,'bus reference'));if(i===undefined)fail('Unknown bus reference '+v);return i};
 const imp=(v,name)=>{const r=req(v,'rOhm',0,1e7),x=req(v,'xOhm',0,1e7);if(Math.hypot(r,x)<1e-8)fail('Invalid/near-zero impedance for '+name);return [r,x]};
 const unique=v=>{let x=id(v,'equipment ID');if(used.has(x))fail('Duplicate equipment ID');used.add(x);return x};
 const branches=c.branches.map(e=>{const name=unique(e?.id),a=get(e.from),b=get(e.to);if(a===b)fail('Self branch');return {name,a,b,z:imp(e,name)}});
 const sources=c.sources.map(s=>{const name=unique(s?.id),a=get(s.bus),z=imp(s,name);if(req(s,'angleDeg',-180,180)!==0||req(s,'emScale',.1,1.5)!==1)fail('Coincident source EMFs only: '+name+' requires angleDeg=0 and emScale=1');return {name,a,z}});
 const graph=Array.from({length:buses.length},()=>[]);for(const e of branches){graph[e.a].push(e.b);graph[e.b].push(e.a)}let seen=new Set([fault]),todo=[fault];while(todo.length){for(let j of graph[todo.pop()])if(!seen.has(j)){seen.add(j);todo.push(j)}}if(seen.size!==buses.length)fail('Disconnected branch island');
 const nominal=drivingPoint(buses.length,branches,sources,fault,1),fc=f*.4,equiv=drivingPoint(buses.length,branches,sources,fault,.4);
 const [R,X]=nominal.z,[Rc,Xc]=equiv.z;
 if(R < -1e-9||X<=1e-12||Rc < -1e-9||Xc<=1e-12)fail('Equivalent driving-point impedance must have positive inductive reactance');
 const ratioNom=Math.max(0,R)/X,ratioC=Math.max(0,Rc)/Xc*(fc/f);
 const kappa=1.02+.98*Math.exp(-3*ratioC),I=factor*voltage/(Math.sqrt(3)*Math.hypot(R,X)),peak=kappa*Math.SQRT2*I;
 if(!finite(I)||I>1e9||!finite(peak)||peak>3e9)fail('Current exceeds bounded model');
 const output={status:'BOUNDED_METHOD_C_PEAK_SCREEN',scope:PEAK_METHOD_C_SCOPE,faultType:'3PH_BOLTED',faultBus:c.faultBus,nominalLLV:voltage,voltageFactor:factor,frequencyHz:f,equivalentFrequencyHz:fc,drivingPointNominalOhm:{rOhm:R,xOhm:X,magnitudeOhm:Math.hypot(R,X)},drivingPointEquivalentFrequencyOhm:{rOhm:Rc,xOhm:Xc,magnitudeOhm:Math.hypot(Rc,Xc)},nominalRX:ratioNom,methodCRX:ratioC,kappaMethodC:kappa,initialSymmetricalA:I,initialSymmetricalKA:I/1000,peakMakingScreenA:peak,peakMakingScreenKA:peak/1000,nodalRelativeResidual:Math.max(nominal.residual,equiv.residual),limitations:['Positive-sequence passive equivalent impedances, one nominal voltage level and coincident source EMFs only','IEC equipment impedance correction factors and automatic c selection are NOT implemented','Reactances assumed linearly proportional to frequency and resistances constant between f and 0.4f','No transformer vector groups/taps, generator decrement, converter or motor dynamic contributions','Not a validated IEC 60909 breaker-making or interrupting duty calculation; no label or device approval']};
 return output;
}
