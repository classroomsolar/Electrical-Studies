/* Balanced single-phase-equivalent HARMONIC PHASOR network at explicitly supplied
 * frequencies. Every per-order source, branch, and grounding path is user supplied.
 * NOT a 3-phase unbalanced OpenDSS equivalent, not IEEE 519 compliance, and no
 * capacitor resonance or load model prediction from fundamental data.
 */
const fail=m=>{throw Error('Harmonic network: '+m)};
const c=(re=0,im=0)=>({re,im});
const sum=(a,b)=>c(a.re+b.re,a.im+b.im),sub=(a,b)=>c(a.re-b.re,a.im-b.im),mul=(a,b)=>c(a.re*b.re-a.im*b.im,a.re*b.im+a.im*b.re),magnitude=a=>Math.hypot(a.re,a.im);
function divide(a,b){const scale=Math.max(Math.abs(b.re),Math.abs(b.im));if(!(scale>0)||!Number.isFinite(scale))fail('zero or invalid impedance');const r=b.re/scale,i=b.im/scale,denom=r*r+i*i;return c((a.re*r+a.im*i)/(scale*denom),(a.im*r-a.re*i)/(scale*denom))}
const good=(v,max=1e10)=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<=max;
function impedance(obj,label){if(!obj||!good(obj.rOhm)||!good(obj.xOhm)||Math.hypot(obj.rOhm,obj.xOhm)<1e-10)fail(label+': a documented nonzero R_h + jX_h in ohms is required');return c(obj.rOhm,obj.xOhm)}
function byOrder(items,order,label){const hits=items.filter(x=>x?.order===order);if(hits.length!==1)fail(label+': exactly one documented impedance is required for harmonic '+order);return impedance(hits[0],label)}
function solveLinear(matrix,vector){const n=vector.length,A=matrix.map((line,i)=>[...line.map(x=>c(x.re,x.im)),c(vector[i].re,vector[i].im)]);
 for(let k=0;k<n;k++){
  let pivot=k;for(let i=k+1;i<n;i++)if(magnitude(A[i][k])>magnitude(A[pivot][k]))pivot=i;
  if(magnitude(A[pivot][k])<1e-12)fail('unreferenced island or singular harmonic admittance; provide finite ground paths for each island');
  [A[k],A[pivot]]=[A[pivot],A[k]];
  for(let i=k+1;i<n;i++){
   const factor=divide(A[i][k],A[k][k]);for(let j=k;j<=n;j++)A[i][j]=sub(A[i][j],mul(factor,A[k][j]));
  }
 }
 const ans=Array.from({length:n},()=>c());for(let i=n-1;i>=0;i--){let rhs=A[i][n];for(let j=i+1;j<n;j++)rhs=sub(rhs,mul(A[i][j],ans[j]));ans[i]=divide(rhs,A[i][i]);}
 if(ans.some(a=>!good(a.re,1e12)||!good(a.im,1e12)))fail('non-finite harmonic solution');return ans;
}
export function solveHarmonicNetwork(model){
 if(!model||!Array.isArray(model.buses)||!Array.isArray(model.branches)||!Array.isArray(model.groundPaths)||!Array.isArray(model.injections)||!Array.isArray(model.orders))fail('explicit buses, branches, ground paths, current injections and orders required');
 const {buses,branches,groundPaths,injections,orders}=model;
 if(buses.length<1||buses.length>20||branches.length>100||groundPaths.length<1||groundPaths.length>100||injections.length>300||orders.length<1||orders.length>32)fail('case exceeds 20 buses, 100 branches, 100 grounding paths, 300 injections or 32 harmonic orders');
 const ids=new Set();for(const b of buses){if(!b||typeof b.id!=='string'||!b.id||ids.has(b.id)||!good(b.fundamentalV)||b.fundamentalV<=0)fail('unique bus IDs and positive documented phase-to-neutral fundamental RMS voltage required');ids.add(b.id)}
 const at=new Map(buses.map((b,i)=>[b.id,i])),unique=new Set();
 for(const order of orders){if(!Number.isSafeInteger(order)||order<2||order>200||unique.has(order))fail('unique documented integer harmonic orders 2–200 required');unique.add(order)}
 const branchIds=new Set();for(const e of branches){if(!e||!e.id||branchIds.has(e.id)||!ids.has(e.from)||!ids.has(e.to)||e.from===e.to||!Array.isArray(e.impedances))fail('branch ID, distinct endpoints and per-order impedances required');branchIds.add(e.id)}
 for(const g of groundPaths)if(!g||!ids.has(g.bus)||!Array.isArray(g.impedances))fail('documented shunt reference bus and impedances required');
 for(const inj of injections)if(!inj||!ids.has(inj.bus)||!unique.has(inj.order)||!good(inj.realA)||!good(inj.imagA))fail('documented per-order complex injection current and bus required');
 const voltages=Object.fromEntries(buses.map(b=>[b.id,[]]));const branchCurrents=[];
 for(const order of orders){
  const n=buses.length,Y=Array.from({length:n},()=>Array.from({length:n},()=>c())),I=Array.from({length:n},()=>c());
  const addY=(i,j,y)=>{Y[i][j]=sum(Y[i][j],y)};
  for(const line of branches){const y=divide(c(1),byOrder(line.impedances,order,'branch '+line.id)),i=at.get(line.from),j=at.get(line.to);addY(i,i,y);addY(j,j,y);addY(i,j,c(-y.re,-y.im));addY(j,i,c(-y.re,-y.im))}
  for(const path of groundPaths){const y=divide(c(1),byOrder(path.impedances,order,'ground path at '+path.bus));addY(at.get(path.bus),at.get(path.bus),y)}
  for(const inj of injections.filter(x=>x.order===order))I[at.get(inj.bus)]=sum(I[at.get(inj.bus)],c(inj.realA,inj.imagA));
  const V=solveLinear(Y,I);
  for(const [idx,b] of buses.entries())voltages[b.id].push({order,realV:V[idx].re,imagV:V[idx].im,rmsV:magnitude(V[idx])});
  for(const line of branches){const iz=divide(sub(V[at.get(line.from)],V[at.get(line.to)]),byOrder(line.impedances,order,'branch '+line.id));branchCurrents.push({id:line.id,order,realA:iz.re,imagA:iz.im,rmsA:magnitude(iz)})}
  // Nodal residual check: YV must reproduce every entered current injection.
  let maxResidual=0;for(let i=0;i<n;i++){let total=c();for(let j=0;j<n;j++)total=sum(total,mul(Y[i][j],V[j]));maxResidual=Math.max(maxResidual,magnitude(sub(total,I[i])))}
  if(maxResidual>Math.max(1e-7,1e-8*Math.max(...I.map(magnitude))))fail('admittance equations did not close');
 }
 const busesOut=buses.map(b=>({id:b.id,fundamentalPhaseV:b.fundamentalV,harmonics:voltages[b.id],voltageThdPercent:100*Math.hypot(...voltages[b.id].map(x=>x.rmsV))/b.fundamentalV}));
 return {status:'BOUNDED_HARMONIC_NETWORK_PHASOR_SCREEN',buses:busesOut,branchCurrents,orders,scope:'Balanced per-phase RMS harmonic phasor nodal admittance solve. User-supplied frequency-dependent R+jX and Norton currents only; no harmonic source estimation, unbalance, frequency-dependent device modeling, resonance validation, harmonic compliance or IEEE 519 limits.'};
}
