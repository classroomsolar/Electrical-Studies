/*
 * Operating studies, Batch 01. Balanced positive-sequence AC *screening*;
 * does not implement IEC 60909, IEEE 1584 incident energy, or device coordination.
 * Pure calculation library. No web/network/storage side-effects.
 */
const sqrt3=Math.sqrt(3);
const finite=(x)=>typeof x==='number'&&Number.isFinite(x);
const fail=(message)=>{throw new Error('Operating study: '+message)};
export const STUDY_LIMITS=Object.freeze({maxBuses:40,maxBranches:200,maxIterations:45,tolerance:1e-9});
const complex=(re=0,im=0)=>({re,im});
const add=(a,b)=>complex(a.re+b.re,a.im+b.im);
const sub=(a,b)=>complex(a.re-b.re,a.im-b.im);
const multiply=(a,b)=>complex(a.re*b.re-a.im*b.im,a.re*b.im+a.im*b.re);
const conjugate=a=>complex(a.re,-a.im);
const divide=(a,b)=>{const scale=Math.max(Math.abs(b.re),Math.abs(b.im));if(scale===0||!Number.isFinite(scale))fail('zero/invalid branch impedance');const x=b.re/scale,y=b.im/scale,d=x*x+y*y;return complex(((a.re/scale)*x+(a.im/scale)*y)/d,((a.im/scale)*x-(a.re/scale)*y)/d)};
const abs=a=>Math.hypot(a.re,a.im);
function realSolve(A,b){const n=b.length,m=A.map((row,i)=>[...row,b[i]]);
 for(let k=0;k<n;k++){let v=k;for(let r=k+1;r<n;r++)if(Math.abs(m[r][k])>Math.abs(m[v][k]))v=r;
 if(Math.abs(m[v][k])<1e-12||!Number.isFinite(m[v][k]))fail('singular Newton Jacobian; check islands and system assumptions');
 [m[k],m[v]]=[m[v],m[k]];for(let i=k+1;i<n;i++){let ratio=m[i][k]/m[k][k];for(let j=k;j<=n;j++)m[i][j]-=ratio*m[k][j];}}
 const x=Array(n).fill(0);for(let i=n-1;i>=0;i--){let d=m[i][n];for(let j=i+1;j<n;j++)d-=m[i][j]*x[j];x[i]=d/m[i][i];}if(x.some(v=>!Number.isFinite(v)))fail('non-finite Newton step');return x;
}
function validatePowerNetwork(net,limits=STUDY_LIMITS){if(!net||!Array.isArray(net.buses)||!Array.isArray(net.branches))fail('network buses and branches required');
 if(!finite(net.baseMVA)||net.baseMVA<=0||net.baseMVA>1e6)fail('positive base MVA required');
 if(net.buses.length<2||net.buses.length>limits.maxBuses)fail(limits===STUDY_LIMITS?'supported bus count 2–40':'supported bus count 2–'+limits.maxBuses);
 if(net.branches.length===0||net.branches.length>limits.maxBranches)fail(limits===STUDY_LIMITS?'supported branch count 1–200':'supported branch count 1–'+limits.maxBranches);
 const ids=new Set();for(const b of net.buses){if(!b||typeof b.id!=='string'||!b.id||ids.has(b.id))fail('duplicate/missing bus identity');ids.add(b.id);
 if(!['SLACK','PQ','PV'].includes(b.type))fail(b.id+': unsupported bus type');
 if(b.type!=='SLACK'&&(!finite(b.pMW)||Math.abs(b.pMW)>1e6))fail(b.id+': actual net real-power injection required (generation positive)');
 if(b.type==='PQ'&&(!finite(b.qMvar)||Math.abs(b.qMvar)>1e6))fail(b.id+': actual net reactive-power injection required (generation positive)');
 if((b.type==='PV'||b.type==='SLACK')&&(!finite(b.vSetPu)||b.vSetPu<0.5||b.vSetPu>1.5))fail(b.id+': fixed voltage setpoint required');
 if(b.type==='PV'&&(b.qMinMvar!=null||b.qMaxMvar!=null)&&(!finite(b.qMinMvar)||!finite(b.qMaxMvar)||b.qMinMvar>b.qMaxMvar))fail(b.id+': both finite minimum and maximum reactive limits required');}
 if(net.buses.filter(b=>b.type==='SLACK').length!==1)fail('exactly one documented slack/reference bus required');
 for(const branch of net.branches){if(!ids.has(branch.from)||!ids.has(branch.to)||branch.from===branch.to)fail('branch with invalid terminals');if(branch.tap!=null&&(!finite(branch.tap)||branch.tap<0.85||branch.tap>1.15))fail('transformer off-nominal tap ratio must be 0.85–1.15');if(!finite(branch.rPu)||!finite(branch.xPu)||Math.hypot(branch.rPu,branch.xPu)<1e-8||Math.hypot(branch.rPu,branch.xPu)>10000)fail('documented nonzero R/X per-unit impedance required');}
 const adjacency=new Map(net.buses.map(b=>[b.id,[]]));for(const e of net.branches){adjacency.get(e.from).push(e.to);adjacency.get(e.to).push(e.from)}
 const found=new Set([net.buses.find(b=>b.type==='SLACK').id]),todo=[...found];for(let i=0;i<todo.length;i++)for(const next of adjacency.get(todo[i]))if(!found.has(next)){found.add(next);todo.push(next)}
 if(found.size!==ids.size)fail('disconnected island; every active bus must have a path to reference source');
}
function solveBalancedPowerFlowCore(net){if(isLargePowerNetwork(net))return solveSparsePowerFlowCore(net);validatePowerNetwork(net);
 const n=net.buses.length,base=net.baseMVA,at=new Map(net.buses.map((b,i)=>[b.id,i]));const Y=Array.from({length:n},()=>Array.from({length:n},()=>complex()));
 for(const e of net.branches){const i=at.get(e.from),j=at.get(e.to),y=divide(complex(1),complex(e.rPu,e.xPu)),t=e.tap??1;Y[i][i]=add(Y[i][i],divide(y,complex(t*t)));Y[j][j]=add(Y[j][j],y);Y[i][j]=sub(Y[i][j],divide(y,complex(t)));Y[j][i]=sub(Y[j][i],divide(y,complex(t)))}
 const slack=net.buses.findIndex(b=>b.type==='SLACK'),others=net.buses.map((b,i)=>b.type!=='SLACK'?i:null).filter(i=>i!==null),pq=others.filter(i=>net.buses[i].type==='PQ');
 const angN=others.length,m=angN+pq.length,angles=Array(n).fill(0),vm=net.buses.map(b=>b.type==='SLACK'||b.type==='PV'?b.vSetPu:1);
 const init=[...others.map(i=>angles[i]),...pq.map(i=>vm[i])];
 const mapState=state=>{const phi=[...angles],mag=[...vm];others.forEach((i,k)=>phi[i]=state[k]);pq.forEach((i,k)=>mag[i]=state[angN+k]);if(mag.some(x=>!finite(x)||x<=0.05||x>3))return null;return {mag,phi,V:mag.map((v,i)=>complex(v*Math.cos(phi[i]),v*Math.sin(phi[i])))};};
 const evaluate=state=>{const mapped=mapState(state);if(!mapped)return null;const {V}=mapped;
 const powers=V.map((v,i)=>multiply(v,conjugate(Y[i].reduce((total,y,j)=>add(total,multiply(y,V[j])),complex()))));
 const errors=[...others.map(i=>net.buses[i].pMW/base-powers[i].re),...pq.map(i=>net.buses[i].qMvar/base-powers[i].im)];
 return {...mapped,powers,errors,norm:Math.max(...errors.map(Math.abs),0)};};
 let x=init,solution=evaluate(x),iterations=0;if(!solution)fail('invalid initial voltage');
 for(;iterations<STUDY_LIMITS.maxIterations&&solution.norm>STUDY_LIMITS.tolerance;iterations++){
   const J=Array.from({length:m},()=>Array(m).fill(0));const h=1e-6;
   for(let k=0;k<m;k++){const high=[...x],low=[...x];high[k]+=h;low[k]-=h;const pos=evaluate(high),neg=evaluate(low);if(!pos||!neg)fail('invalid voltage/Jacobian perturbation');for(let j=0;j<m;j++)J[j][k]=-(pos.errors[j]-neg.errors[j])/(2*h);}
   const step=realSolve(J,solution.errors);let next=null,nextState=null;
   for(let scale=1;scale>=1/2048;scale/=2){const tryState=x.map((v,k)=>v+scale*step[k]);const candidate=evaluate(tryState);if(candidate&&candidate.norm<solution.norm){next=candidate;nextState=tryState;break;}}
   if(!next)fail('Newton power flow did not converge; check loads, voltage bases and impedances');
   x=nextState;solution=next;
 }
 if(solution.norm>STUDY_LIMITS.tolerance)fail('Newton power flow did not reach the specified mismatch tolerance');
 return finishPowerFlow(net,at,base,solution,iterations);
}
function finishPowerFlow(net,at,base,solution,iterations){
 const buses=net.buses.map((b,i)=>({id:b.id,type:b.type,voltagePu:solution.mag[i],angleDegrees:solution.phi[i]*180/Math.PI,pMW:solution.powers[i].re*base,qMvar:solution.powers[i].im*base}));
 const branches=net.branches.map(e=>{const i=at.get(e.from),j=at.get(e.to),y=divide(complex(1),complex(e.rPu,e.xPu)),t=e.tap??1,current=multiply(y,sub(divide(solution.V[i],complex(t)),solution.V[j])),fromI=divide(current,complex(t));const from=multiply(solution.V[i],conjugate(fromI)),to=multiply(solution.V[j],conjugate(complex(-current.re,-current.im)));
 return {id:e.id??null,from:e.from,to:e.to,currentPu:abs(current),fromCurrentPu:abs(fromI),tap:t,fromMW:from.re*base,fromMvar:from.im*base,toMW:to.re*base,toMvar:to.im*base,lossMW:(from.re+to.re)*base,lossMvar:(from.im+to.im)*base};});
 const totalLossMW=branches.reduce((sum,r)=>sum+r.lossMW,0),sumBusP=buses.reduce((sum,r)=>sum+r.pMW,0);
 for(const [i,b] of net.buses.entries())if(b.type==='PV'&&b.qMinMvar!=null&&b.qMaxMvar!=null){const computed=buses[i].qMvar;if(computed<b.qMinMvar-1e-6||computed>b.qMaxMvar+1e-6)fail(b.id+': computed PV reactive dispatch '+computed.toFixed(5)+' Mvar exceeds documented Q limits; reactive-power-limited bus switching not yet modeled');}
 if(!Number.isFinite(totalLossMW)||Math.abs(sumBusP-totalLossMW)>base*3e-7)fail('network real-power balance did not close');
 return {status:'BALANCED_AC_SCREENING',converged:true,iterations,mismatchPu:solution.norm,baseMVA:base,buses,branches,totalLossMW,totalLossMvar:branches.reduce((sum,r)=>sum+r.lossMvar,0),source:'Steady-state balanced Ybus Newton-Raphson; constant P/Q; no voltage-dependent loads, device control, automatic tap changing, shunts or Q limits; fixed off-nominal transformer taps included'};
}
/**
 * Optional finite active-set PV Q-limit preview. The legacy/default mode stays
 * fail-closed. In 'clamp', voltage-controlled buses outside both documented net
 * reactive limits are converted to constant-Q (PQ) at the violated bound; the
 * network is then re-solved until no remaining PV violates its bounds.
 *
 * A release is intentionally NOT attempted in this bounded screening method;
 * this is not a generator capability curve, remote voltage control or plant
 * controller simulation. Report every limit action and resulting bus voltage.
 */
// Large networks (more than 40 buses or 200 branches): same balanced model, same convergence test and
// line search, with an analytic polar Jacobian and a sparse LU (minimum-degree order). Small networks keep
// the original dense solver unchanged.
export const LARGE_STUDY_LIMITS=Object.freeze({maxBuses:20000,maxBranches:60000,maxIterations:STUDY_LIMITS.maxIterations,tolerance:STUDY_LIMITS.tolerance});
function isLargePowerNetwork(net){return !!net&&Array.isArray(net.buses)&&Array.isArray(net.branches)&&(net.buses.length>STUDY_LIMITS.maxBuses||net.branches.length>STUDY_LIMITS.maxBranches);}
function sparseFactor(rows){
 const n=rows.length,elim=new Uint8Array(n),order=new Int32Array(n),Lp=[0],Li=[],Lv=[],Up=[0],Uj=[],Uv=[],d=new Float64Array(n),heap=[];
 const scale=rows.map(r=>{let m=0;for(const v of r.values())m=Math.max(m,Math.abs(v));return m});
 const less=(a,b)=>a[0]<b[0]||(a[0]===b[0]&&a[1]<b[1]),deg=k=>rows[k].size-(rows[k].has(k)?1:0);
 const push=(x,k)=>{heap.push([x,k]);let c=heap.length-1;while(c>0){const q=(c-1)>>1;if(!less(heap[c],heap[q]))break;[heap[c],heap[q]]=[heap[q],heap[c]];c=q}};
 const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let c=0;for(;;){const l=2*c+1,r=l+1;let m=c;if(l<heap.length&&less(heap[l],heap[m]))m=l;if(r<heap.length&&less(heap[r],heap[m]))m=r;if(m===c)break;[heap[c],heap[m]]=[heap[m],heap[c]];c=m}}return top};
 for(let k=0;k<n;k++)push(deg(k),k);let t=0;
 while(t<n){const [x,k]=pop();if(elim[k]||x!==deg(k))continue;const row=rows[k],piv=row.get(k)||0;
  if(!finite(piv)||!(Math.abs(piv)>1e-12*Math.max(scale[k],Number.MIN_VALUE)))fail('singular Newton Jacobian; check islands and system assumptions');
  const urow=[];for(const [j,v] of row)if(j!==k)urow.push([j,v]);
  for(const [i] of urow){const ri=rows[i],aik=ri.get(k)||0;ri.delete(k);const l=aik/piv;Li.push(i);Lv.push(l);if(l===0)continue;for(const [j,u] of urow)ri.set(j,(ri.get(j)||0)-l*u)}
  for(const [j,v] of urow){Uj.push(j);Uv.push(v)}Lp.push(Li.length);Up.push(Uj.length);d[k]=piv;elim[k]=1;order[t++]=k;rows[k]=null;for(const [i] of urow)push(deg(i),i);
 }
 return {n,order,Lp,Li,Lv,Up,Uj,Uv,d};
}
function sparseSolve(F,b){const {n,order,Lp,Li,Lv,Up,Uj,Uv,d}=F,x=Float64Array.from(b);
 for(let t=0;t<n;t++){const k=order[t],a=x[k];if(a===0)continue;for(let q=Lp[t];q<Lp[t+1];q++)x[Li[q]]-=Lv[q]*a}
 for(let t=n-1;t>=0;t--){const k=order[t];let v=x[k];for(let q=Up[t];q<Up[t+1];q++)v-=Uv[q]*x[Uj[q]];x[k]=v/d[k]}
 for(let k=0;k<n;k++)if(!Number.isFinite(x[k]))fail('non-finite Newton step');return x}
function solveSparsePowerFlowCore(net){validatePowerNetwork(net,LARGE_STUDY_LIMITS);
 const n=net.buses.length,base=net.baseMVA,at=new Map(net.buses.map((b,i)=>[b.id,i]));
 // Sparse Y = G + jB as one Map per row: column -> [g, b].
 const Y=Array.from({length:n},()=>new Map()),addY=(i,j,c)=>{const e=Y[i].get(j);if(e){e[0]+=c.re;e[1]+=c.im}else Y[i].set(j,[c.re,c.im])};
 for(const e of net.branches){const i=at.get(e.from),j=at.get(e.to),y=divide(complex(1),complex(e.rPu,e.xPu)),t=e.tap??1;addY(i,i,divide(y,complex(t*t)));addY(j,j,y);const m=divide(y,complex(t));addY(i,j,complex(-m.re,-m.im));addY(j,i,complex(-m.re,-m.im));}
 const slack=net.buses.findIndex(b=>b.type==='SLACK'),others=net.buses.map((b,i)=>b.type!=='SLACK'?i:null).filter(i=>i!==null),pq=others.filter(i=>net.buses[i].type==='PQ');
 const angN=others.length,m=angN+pq.length,angles=new Float64Array(n),vm=Float64Array.from(net.buses.map(b=>b.type==='SLACK'||b.type==='PV'?b.vSetPu:1));
 const thetaVar=new Int32Array(n).fill(-1),vVar=new Int32Array(n).fill(-1);others.forEach((i,k)=>thetaVar[i]=k);pq.forEach((i,k)=>vVar[i]=angN+k);
 const pSpec=others.map(i=>net.buses[i].pMW/base),qSpec=pq.map(i=>net.buses[i].qMvar/base);
 const mapState=state=>{const phi=Float64Array.from(angles),mag=Float64Array.from(vm);for(let k=0;k<angN;k++)phi[others[k]]=state[k];for(let k=0;k<pq.length;k++)mag[pq[k]]=state[angN+k];for(let i=0;i<n;i++){const x=mag[i];if(!finite(x)||x<=0.05||x>3)return null}return {mag,phi}};
 const evaluate=state=>{const mapped=mapState(state);if(!mapped)return null;const {mag,phi}=mapped,P=new Float64Array(n),Q=new Float64Array(n);
  for(let i=0;i<n;i++){let p=0,q=0;for(const [j,[g,bb]] of Y[i]){const a=phi[i]-phi[j],c=Math.cos(a),s=Math.sin(a);p+=mag[j]*(g*c+bb*s);q+=mag[j]*(g*s-bb*c)}P[i]=mag[i]*p;Q[i]=mag[i]*q}
  const errors=new Float64Array(m);let norm=0;for(let k=0;k<angN;k++){errors[k]=pSpec[k]-P[others[k]];norm=Math.max(norm,Math.abs(errors[k]))}for(let k=0;k<pq.length;k++){errors[angN+k]=qSpec[k]-Q[pq[k]];norm=Math.max(norm,Math.abs(errors[angN+k]))}
  if(!Number.isFinite(norm))return null;return {mag,phi,P,Q,errors,norm}};
 const jacobian=sol=>{const {mag:V,phi,P,Q}=sol,rows=Array.from({length:m},()=>new Map());
  for(let i=0;i<n;i++){const ti=thetaVar[i],vi=vVar[i];if(ti<0&&vi<0)continue;const [gii,bii]=Y[i].get(i)||[0,0];
   for(const [j,[g,bb]] of Y[i]){const tj=thetaVar[j],vj=vVar[j];
    if(j===i){
     if(ti>=0){rows[ti].set(ti,-Q[i]-bii*V[i]*V[i]);if(vi>=0)rows[ti].set(vi,P[i]/V[i]+gii*V[i]);}
     if(vi>=0){rows[vi].set(vi,Q[i]/V[i]-bii*V[i]);if(ti>=0)rows[vi].set(ti,P[i]-gii*V[i]*V[i]);}
     continue;}
    const a=phi[i]-phi[j],c=Math.cos(a),s=Math.sin(a),gs=g*s-bb*c,gc=g*c+bb*s;
    if(ti>=0){if(tj>=0)rows[ti].set(tj,V[i]*V[j]*gs);if(vj>=0)rows[ti].set(vj,V[i]*gc);}
    if(vi>=0){if(tj>=0)rows[vi].set(tj,-V[i]*V[j]*gc);if(vj>=0)rows[vi].set(vj,V[i]*gs);}
   }}
  // Keep the pattern structurally symmetric for the symmetric-pattern elimination.
  for(let r=0;r<m;r++)for(const c of [...rows[r].keys()])if(!rows[c].has(r))rows[c].set(r,0);
  return rows};
 let x=new Float64Array(m);for(let k=0;k<angN;k++)x[k]=angles[others[k]];for(let k=0;k<pq.length;k++)x[angN+k]=vm[pq[k]];
 let solution=evaluate(x),iterations=0;if(!solution)fail('invalid initial voltage');
 for(;iterations<LARGE_STUDY_LIMITS.maxIterations&&solution.norm>LARGE_STUDY_LIMITS.tolerance;iterations++){
  const step=sparseSolve(sparseFactor(jacobian(solution)),solution.errors);let next=null,nextState=null;
  for(let scale=1;scale>=1/2048;scale/=2){const tryState=x.map((v,k)=>v+scale*step[k]);const candidate=evaluate(tryState);if(candidate&&candidate.norm<solution.norm){next=candidate;nextState=tryState;break;}}
  if(!next)fail('Newton power flow did not converge; check loads, voltage bases and impedances');
  x=nextState;solution=next;
 }
 if(solution.norm>LARGE_STUDY_LIMITS.tolerance)fail('Newton power flow did not reach the specified mismatch tolerance');
 const mag=[...solution.mag],phi=[...solution.phi],V=mag.map((v,i)=>complex(v*Math.cos(phi[i]),v*Math.sin(phi[i]))),powers=mag.map((_,i)=>complex(solution.P[i],solution.Q[i]));
 const out=finishPowerFlow(net,at,base,{mag,phi,V,powers,norm:solution.norm},iterations);
 return {...out,solver:'sparse-newton'};
}
export function solveBalancedPowerFlow(net){
 const merge=net?.merge;if(merge){const res=solveBalancedPowerFlowUnmerged(net);return expandMergedResult(res,merge);}
 return solveBalancedPowerFlowUnmerged(net);
}
function solveBalancedPowerFlowUnmerged(net){
 const mode=net?.qLimitMode??'block';
 if(!['block','clamp'].includes(mode))fail('unknown PV reactive-limit handling mode');
 if(mode==='block')return solveBalancedPowerFlowCore(net);
 // Run the complete existing topology/impedance/input validation first.
 validatePowerNetwork(net,isLargePowerNetwork(net)?LARGE_STUDY_LIMITS:STUDY_LIMITS);
 const working={...net,buses:net.buses.map(b=>({...b})),qLimitMode:'block'};
 const originallyLimited=new Map(net.buses.filter(b=>b.type==='PV'&&b.qMinMvar!=null&&b.qMaxMvar!=null).map(b=>[b.id,b]));
 const switched=[];
 for(let pass=0;pass<=originallyLimited.size;pass++){
   // The bounded solution is recomputed with all remaining PV controls active.
   const calculation=solveBalancedPowerFlowCore({...working,buses:working.buses.map(b=>b.type==='PV'?{...b,qMinMvar:null,qMaxMvar:null}:b)});
   const byId=new Map(calculation.buses.map(b=>[b.id,b]));
   const violations=[];
   for(const b of working.buses){
     if(b.type!=='PV'||!originallyLimited.has(b.id))continue;
     const reactive=byId.get(b.id).qMvar;
     const eps=Math.max(1e-8,Math.abs(b.qMaxMvar-b.qMinMvar)*1e-8);
     if(reactive>b.qMaxMvar+eps)violations.push({id:b.id,limit:'MAX',value:b.qMaxMvar,unlimitedQ:reactive,requestedV:b.vSetPu});
     else if(reactive<b.qMinMvar-eps)violations.push({id:b.id,limit:'MIN',value:b.qMinMvar,unlimitedQ:reactive,requestedV:b.vSetPu});
   }
   if(!violations.length){
     const actions=switched.map(a=>({...a,resultingVoltagePu:byId.get(a.id).voltagePu,resultingReactiveMvar:byId.get(a.id).qMvar}));
     return {...calculation,status:actions.length?'BALANCED_AC_Q_LIMIT_SCREENING':'BALANCED_AC_SCREENING',qLimitMode:'clamp',qLimitActions:actions,reactiveLimitCoverage:net.buses.filter(b=>b.type==='PV').every(b=>originallyLimited.has(b.id))?'ALL_REMAINING_PV_LIMITS_DOCUMENTED':'SOME_PV_LIMITS_UNSPECIFIED',source:calculation.source+'; bounded opt-in PV-to-PQ net reactive-limit active set (no reverse release, tap or controller model)'};
   }
   if(!violations.length||pass===originallyLimited.size)fail('PV reactive active set failed to settle');
   for(const v of violations){
     const index=working.buses.findIndex(b=>b.id===v.id);
     working.buses[index]={...working.buses[index],type:'PQ',qMvar:v.value,qMinMvar:null,qMaxMvar:null};
     switched.push(v);
   }
 }
 fail('PV reactive active-set iteration limit reached');
}
export function validateOperatingSettings(cfg,busIds){if(cfg==null)return;
 if(typeof cfg!=='object'||Array.isArray(cfg))fail('invalid saved operating-study settings');
 if(cfg.qLimitMode!=null&&!['block','clamp'].includes(cfg.qLimitMode))fail('invalid saved PV Q-limit switching mode');
 if(cfg.baseMVA!=null&&(!finite(cfg.baseMVA)||cfg.baseMVA<=0||cfg.baseMVA>1e6))fail('invalid saved MVA base');
 if(cfg.slackBusId!=null&&cfg.slackBusId!==''&&!busIds.has(cfg.slackBusId))fail('invalid reference bus identity');
 if(cfg.buses!=null){if(typeof cfg.buses!=='object'||Array.isArray(cfg.buses))fail('invalid saved load/generation entries');for(const [id,entry] of Object.entries(cfg.buses)){if(!busIds.has(id)||!entry||typeof entry!=='object'||Array.isArray(entry))fail('orphan operating-study bus entry');if(entry.type!=null&&!['PQ','PV'].includes(entry.type))fail('invalid saved bus control mode');for(const key of ['pMW','qMvar','vSetPu','qMinMvar','qMaxMvar'])if(entry[key]!=null&&(!finite(entry[key])||Math.abs(entry[key])>1e6))fail('non-finite operating-study bus parameter');
 if((entry.qMinMvar!=null||entry.qMaxMvar!=null)&&(entry.qMinMvar==null||entry.qMaxMvar==null||entry.qMinMvar>entry.qMaxMvar))fail('PV Q limits must be supplied together and ordered');}}
 if(cfg.screening!=null){if(typeof cfg.screening!=='object'||Array.isArray(cfg.screening))fail('invalid saved screening data');for(const [k,v] of Object.entries(cfg.screening)){if(k==='curve'){if(!['normal','very','extreme','long',''].includes(v))fail('invalid relay curve');}else if(!['pickupA','tms','testA','fundamentalA','harmonic3A','harmonic5A','harmonic7A'].includes(k)||v!=null&&(!finite(v)||Math.abs(v)>1e9))fail('invalid screening field');}}
}
export function operatingNetworkFromStudio(p){const cfg=p.operatingStudy||{};
 if(!['3phase','3phase-ground'].includes(p.settings?.faultType))fail('balanced AC operating study requires a three-phase network; current fault study mode is not supported');
 const bIds=new Set((p.buses||[]).map(b=>b.id));validateOperatingSettings(cfg,bIds);
 if(!cfg.slackBusId)fail('choose the actual reference/slack bus');
 const base=cfg.baseMVA;if(!finite(base)||base<=0)fail('specify the operating-study base MVA');
 const buses=p.buses.map(b=>{if(!finite(b.voltage)||b.voltage<=0)fail(b.name+': nominal bus voltage (V) required');const data=cfg.buses?.[b.id]||{},type=b.id===cfg.slackBusId?'SLACK':data.type||'PQ';
 return {id:b.id,type,pMW:data.pMW,qMvar:data.qMvar,vSetPu:type==='SLACK'?(data.vSetPu??1):type==='PV'?data.vSetPu:null,qMinMvar:type==='PV'?data.qMinMvar:null,qMaxMvar:type==='PV'?data.qMaxMvar:null};});
 const voltage=new Map(p.buses.map(b=>[b.id,b.voltage]));const branches=[];
 const deviceOpen=new Set((p.devices||[]).filter(d=>d.enabled===false).map(d=>d.id));
 const active=p.branches.filter(e=>e.enabled!==false&&(!e.deviceId||!deviceOpen.has(e.deviceId)));
 // Closed switches / breakers (ideal links) join their buses into one electrical node.
 const merge=mergeLinkedBuses(p,buses,active.filter(e=>e.kind==='link'),voltage);
 const rep=merge?id=>merge.rep.get(id):id=>id;
 for(const e of active){
   if(!voltage.has(e.from)||!voltage.has(e.to))fail(e.name+': invalid connected endpoints');
   if(e.kind==='link')continue;
   if(merge&&rep(e.from)===rep(e.to)){merge.shorted.push(e);continue;}
   let rPu,xPu,tap=1;
   if(e.kind==='cable'){
     if(!finite(e.rPerM)||!finite(e.xPerM)||!finite(e.length)||e.length<=0||!Number.isSafeInteger(e.runs)||e.runs<=0)fail(e.name+': actual R/X Ω/m, length m and parallel runs required');
     if(Math.abs(voltage.get(e.from)-voltage.get(e.to))>1e-6*Math.max(voltage.get(e.from),voltage.get(e.to)))fail(e.name+': cable crosses incompatible voltage bases');
     const baseOhm=voltage.get(e.from)**2/(base*1e6);rPu=e.rPerM*e.length/e.runs/baseOhm;xPu=e.xPerM*e.length/e.runs/baseOhm;
   }else if(e.kind==='transformer'){
     if(!finite(e.power)||e.power<=0||!finite(e.zPercent)||e.zPercent<=0||!finite(e.xr)||e.xr<0||!finite(e.v1)||!finite(e.v2))fail(e.name+': rating VA, %Z, X/R and winding voltages required');
     if(Math.abs(voltage.get(e.from)-e.v1)>1e-4*e.v1||Math.abs(voltage.get(e.to)-e.v2)>1e-4*e.v2)fail(e.name+': transformer nominal ratios do not match actual connected voltage bases (tap modeling pending)');if(e.tapPercent!=null&&e.tapPercent!==''&&(!finite(e.tapPercent)||Math.abs(e.tapPercent)>10))fail(e.name+': off-nominal tap must be between -10 % and +10 %');tap=1+(e.tapPercent||0)/100;
     const z=e.zPercent/100*base*1e6/e.power;rPu=z/Math.hypot(1,e.xr);xPu=rPu*e.xr;
   }else fail(e.name+': unsupported operating-network branch kind');
   branches.push(tap!==1?{id:e.id,from:rep(e.from),to:rep(e.to),rPu,xPu,tap}:{id:e.id,from:rep(e.from),to:rep(e.to),rPu,xPu});
 }
 const net={baseMVA:base,buses:merge?merge.buses:buses,branches,qLimitMode:cfg.qLimitMode??'block'};
 if(merge)Object.defineProperty(net,'merge',{value:{...merge,active,original:buses,names:new Map(p.buses.map(b=>[b.id,b.name]))},enumerable:false});
 return net;
}
function mergeLinkedBuses(p,buses,links,voltage){
 if(!links.length)return null;
 const parent=new Map(buses.map(b=>[b.id,b.id])),find=x=>{while(parent.get(x)!==x){parent.set(x,parent.get(parent.get(x)));x=parent.get(x)}return x};
 const name=id=>p.buses.find(b=>b.id===id)?.name||id;
 for(const e of links){if(!voltage.has(e.from)||!voltage.has(e.to))fail(e.name+': invalid connected endpoints');
  const a=voltage.get(e.from),b=voltage.get(e.to);if(Math.abs(a-b)>1e-6*Math.max(a,b))fail(e.name+': closed switch joins buses with different nominal voltages');
  const ra=find(e.from),rb=find(e.to);if(ra!==rb)parent.set(ra,rb);}
 const groups=new Map();for(const b of buses){const r=find(b.id);if(!groups.has(r))groups.set(r,[]);groups.get(r).push(b);}
 const repOf=new Map(),out=[],merged=[];
 for(const b of buses){const members=groups.get(find(b.id));if(members[0]!==b)continue;
  if(members.length===1){repOf.set(b.id,b.id);out.push(b);continue;}
  const slack=members.find(x=>x.type==='SLACK'),pv=members.filter(x=>x.type==='PV');
  if(slack&&pv.length)fail(name(pv[0].id)+': a voltage-controlled (PV) bus is joined to the reference bus by closed switches; set it to PQ or open the switch');
  if(pv.length>1){if(pv.some(x=>!finite(x.vSetPu)||Math.abs(x.vSetPu-pv[0].vSetPu)>1e-9))fail(pv.map(x=>name(x.id)).join(', ')+': PV buses joined by closed switches need the same voltage setpoint');if(pv.filter(x=>x.qMinMvar!=null||x.qMaxMvar!=null).length>1)fail(pv.map(x=>name(x.id)).join(', ')+': only one PV bus in a switch-joined group may carry reactive limits');}
  const r=slack||pv[0]||members[0];
  for(const x of members){if(x===r||x.type==='PV')continue;
   if(!finite(x.pMW))fail(name(x.id)+': actual net real-power injection required (generation positive); enter 0 for a bus with no load or generation');
   if(!finite(x.qMvar))fail(name(x.id)+': actual net reactive-power injection required (generation positive); enter 0 for a bus with no load or generation');}
  const others=members.filter(x=>x!==r),sumP=others.reduce((t,x)=>t+(finite(x.pMW)?x.pMW:0),0),sumQ=others.filter(x=>x.type!=='PV').reduce((t,x)=>t+x.qMvar,0);
  const m={...r};
  if(r.type!=='SLACK')m.pMW=finite(r.pMW)?r.pMW+sumP:r.pMW;
  if(r.type==='PQ')m.qMvar=finite(r.qMvar)?r.qMvar+sumQ:r.qMvar;
  if(r.type==='PV'){const lim=pv.find(x=>x.qMinMvar!=null||x.qMaxMvar!=null);if(lim&&finite(lim.qMinMvar)&&finite(lim.qMaxMvar)){m.qMinMvar=lim.qMinMvar+sumQ;m.qMaxMvar=lim.qMaxMvar+sumQ;}}
  for(const x of members)repOf.set(x.id,r.id);out.push(m);merged.push({rep:r.id,members:members.map(x=>x.id)});
 }
 return {rep:repOf,buses:out,groups:merged,links,shorted:[]};
}
// Restore every original bus and connection in the result; closed-switch through-flows follow from KCL on the switch tree.
function expandMergedResult(res,merge){
 const base=res.baseMVA,byBus=new Map(res.buses.map(b=>[b.id,b])),byBranch=new Map(res.branches.map(b=>[b.id,b])),orig=new Map(merge.original.map(b=>[b.id,b]));
 const buses=merge.original.map(b=>{const r=byBus.get(merge.rep.get(b.id));if(b.id===r.id)return r;return {id:b.id,type:b.type,voltagePu:r.voltagePu,angleDegrees:r.angleDegrees,pMW:b.type==='PV'?b.pMW:b.pMW,qMvar:b.type==='PV'?0:b.qMvar,joinedTo:r.id}});
 const busOut=new Map(buses.map(b=>[b.id,b]));
 for(const g of merge.groups){const r=busOut.get(g.rep),others=g.members.filter(x=>x!==g.rep).map(x=>busOut.get(x));r.pMW-=others.reduce((t,x)=>t+x.pMW,0);r.qMvar-=others.reduce((t,x)=>t+x.qMvar,0);r.joinedBuses=g.members.filter(x=>x!==g.rep);}
 const out=new Map(merge.original.map(b=>[b.id,[0,0]]));
 const branches=[];
 for(const e of merge.active){
  if(e.kind==='link'){branches.push(null);continue;}
  if(merge.shorted.includes(e)){const z={id:e.id,from:e.from,to:e.to,currentPu:0,fromCurrentPu:0,tap:1,fromMW:0,fromMvar:0,toMW:0,toMvar:0,lossMW:0,lossMvar:0,note:'Both ends are joined by closed switches; no current'};branches.push(z);continue;}
  const r=byBranch.get(e.id);if(!r){branches.push(null);continue;}const x={...r,from:e.from,to:e.to};branches.push(x);
  const a=out.get(e.from),b=out.get(e.to);a[0]+=x.fromMW;a[1]+=x.fromMvar;b[0]+=x.toMW;b[1]+=x.toMvar;
 }
 // Switch tree per group, rooted at the representative bus.
 const flows=new Map();
 for(const g of merge.groups){const inGroup=new Set(g.members),adj=new Map(g.members.map(m=>[m,[]]));
  for(const e of merge.links)if(inGroup.has(e.from)){adj.get(e.from).push([e,e.to]);adj.get(e.to).push([e,e.from]);}
  const seen=new Set([g.rep]),orderList=[g.rep],parentEdge=new Map(),tree=new Set();
  for(let i=0;i<orderList.length;i++){const u=orderList[i];for(const [e,v] of adj.get(u))if(!seen.has(v)){seen.add(v);orderList.push(v);parentEdge.set(v,[e,u]);tree.add(e);}}
  const sub=new Map(g.members.map(m=>{const o=out.get(m),bb=busOut.get(m);return [m,[o[0]-bb.pMW,o[1]-bb.qMvar]]}));
  for(let i=orderList.length-1;i>0;i--){const v=orderList[i],[e,u]=parentEdge.get(v),sv=sub.get(v),su=sub.get(u);su[0]+=sv[0];su[1]+=sv[1];
   // sv = power flowing from u into v through e.
   const fromIsU=e.from===u,fp=fromIsU?sv[0]:-sv[0],fq=fromIsU?sv[1]:-sv[1],vm=busOut.get(v).voltagePu,cur=Math.hypot(sv[0],sv[1])/base/vm;
   flows.set(e.id,{id:e.id,from:e.from,to:e.to,idealLink:true,currentPu:cur,fromCurrentPu:cur,tap:1,fromMW:fp,fromMvar:fq,toMW:-fp,toMvar:-fq,lossMW:0,lossMvar:0});}
  for(const [e] of [...adj.values()].flat())if(!tree.has(e)&&!flows.has(e.id))flows.set(e.id,{id:e.id,from:e.from,to:e.to,idealLink:true,currentPu:null,fromCurrentPu:null,tap:1,fromMW:null,fromMvar:null,toMW:null,toMvar:null,lossMW:0,lossMvar:0,note:'Closed switches in a loop share current in a way an ideal-switch model cannot determine'});
 }
 merge.active.forEach((e,k)=>{if(e.kind==='link')branches[k]=flows.get(e.id)||{id:e.id,from:e.from,to:e.to,idealLink:true,currentPu:0,fromCurrentPu:0,tap:1,fromMW:0,fromMvar:0,toMW:0,toMvar:0,lossMW:0,lossMvar:0}});
 return {...res,buses,branches:branches.filter(Boolean),switchGroups:merge.groups.map(g=>({representative:g.rep,buses:g.members})),switchModel:'Closed switches and breakers join their buses into one node (ideal, zero impedance). Switch through-flow is found from the bus balance on each switch tree.'};
}
export const IEC_INVERSE_CURVES=Object.freeze({normal:{alpha:0.02,beta:0.14},very:{alpha:1,beta:13.5},extreme:{alpha:2,beta:80},long:{alpha:1,beta:120}});
export function iecInverseTime({curve,pickupA,currentA,tms}){
 const c=IEC_INVERSE_CURVES[curve];if(!c)fail('unsupported IEC inverse-time curve');if(!finite(pickupA)||pickupA<=0||!finite(currentA)||currentA<0||!finite(tms)||tms<=0)fail('pickup/current/TMS must be documented positive values');
 if(currentA<=pickupA)return {status:'NOT_PICKED_UP',seconds:null,multiple:currentA/pickupA};const m=currentA/pickupA,seconds=tms*c.beta/Math.expm1(c.alpha*Math.log(m));
 if(!Number.isFinite(seconds)||seconds<=0)fail('IEC inverse curve outside numerical range');return {status:'NOMINAL_CURVE_ONLY',seconds,multiple:m,method:'IEC 60255-151 family mathematical curve; excludes definite/instantaneous element, CT saturation, relay tolerances and breaker opening time'};
}
export function harmonicTHD(fundamental,values){if(!finite(fundamental)||fundamental<=0)fail('positive measured fundamental RMS is required');if(!Array.isArray(values)||values.some(v=>!finite(v)||v<0))fail('harmonic RMS magnitudes must be finite and nonnegative');const percent=100*Math.hypot(...values)/fundamental;if(!Number.isFinite(percent))fail('THD overflow');return {thdPercent:percent,scope:'RMS component arithmetic only; not PCC TDD, IEEE 519 compliance or network harmonic flow'};}
export function arcFlashEligibility({voltageV,phaseModel='three-phase-ac'}){if(!finite(voltageV)||voltageV<=0)return {eligible:false,reason:'Actual equipment nominal voltage required'};
 if(phaseModel!=='three-phase-ac')return {eligible:false,reason:'IEEE 1584-2018 equations do not apply to DC or single-phase AC'};
 if(voltageV<208||voltageV>15000)return {eligible:false,reason:'Outside IEEE 1584-2018 nominal 208–15000 V applicability'};
 return {eligible:true,reason:'Nominal voltage and phase scope only. IEEE 1584 electrode arrangement, enclosure geometry, bolted and arcing fault-current ranges, working distance and device clearing times are still mandatory. No incident energy computed.'};
}
// Sparse solver on any network size (used automatically above 40 buses / 200 branches; exported for QA comparison).
export function solveSparsePowerFlow(net){return solveSparsePowerFlowCore(net);}
