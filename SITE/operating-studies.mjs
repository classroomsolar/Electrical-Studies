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
function validatePowerNetwork(net){if(!net||!Array.isArray(net.buses)||!Array.isArray(net.branches))fail('network buses and branches required');
 if(!finite(net.baseMVA)||net.baseMVA<=0||net.baseMVA>1e6)fail('positive base MVA required');
 if(net.buses.length<2||net.buses.length>STUDY_LIMITS.maxBuses)fail('supported bus count 2–40');
 if(net.branches.length===0||net.branches.length>STUDY_LIMITS.maxBranches)fail('supported branch count 1–200');
 const ids=new Set();for(const b of net.buses){if(!b||typeof b.id!=='string'||!b.id||ids.has(b.id))fail('duplicate/missing bus identity');ids.add(b.id);
 if(!['SLACK','PQ','PV'].includes(b.type))fail(b.id+': unsupported bus type');
 if(b.type!=='SLACK'&&(!finite(b.pMW)||Math.abs(b.pMW)>1e6))fail(b.id+': actual net real-power injection required (generation positive)');
 if(b.type==='PQ'&&(!finite(b.qMvar)||Math.abs(b.qMvar)>1e6))fail(b.id+': actual net reactive-power injection required (generation positive)');
 if((b.type==='PV'||b.type==='SLACK')&&(!finite(b.vSetPu)||b.vSetPu<0.5||b.vSetPu>1.5))fail(b.id+': fixed voltage setpoint required');
 if(b.type==='PV'&&(b.qMinMvar!=null||b.qMaxMvar!=null)&&(!finite(b.qMinMvar)||!finite(b.qMaxMvar)||b.qMinMvar>b.qMaxMvar))fail(b.id+': both finite minimum and maximum reactive limits required');}
 if(net.buses.filter(b=>b.type==='SLACK').length!==1)fail('exactly one documented slack/reference bus required');
 for(const branch of net.branches){if(!ids.has(branch.from)||!ids.has(branch.to)||branch.from===branch.to)fail('branch with invalid terminals');if(!finite(branch.rPu)||!finite(branch.xPu)||Math.hypot(branch.rPu,branch.xPu)<1e-8||Math.hypot(branch.rPu,branch.xPu)>10000)fail('documented nonzero R/X per-unit impedance required');}
 const adjacency=new Map(net.buses.map(b=>[b.id,[]]));for(const e of net.branches){adjacency.get(e.from).push(e.to);adjacency.get(e.to).push(e.from)}
 const found=new Set([net.buses.find(b=>b.type==='SLACK').id]),todo=[...found];for(let i=0;i<todo.length;i++)for(const next of adjacency.get(todo[i]))if(!found.has(next)){found.add(next);todo.push(next)}
 if(found.size!==ids.size)fail('disconnected island; every active bus must have a path to reference source');
}
function solveBalancedPowerFlowCore(net){validatePowerNetwork(net);
 const n=net.buses.length,base=net.baseMVA,at=new Map(net.buses.map((b,i)=>[b.id,i]));const Y=Array.from({length:n},()=>Array.from({length:n},()=>complex()));
 for(const e of net.branches){const i=at.get(e.from),j=at.get(e.to),y=divide(complex(1),complex(e.rPu,e.xPu));Y[i][i]=add(Y[i][i],y);Y[j][j]=add(Y[j][j],y);Y[i][j]=sub(Y[i][j],y);Y[j][i]=sub(Y[j][i],y)}
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
 const buses=net.buses.map((b,i)=>({id:b.id,type:b.type,voltagePu:solution.mag[i],angleDegrees:solution.phi[i]*180/Math.PI,pMW:solution.powers[i].re*base,qMvar:solution.powers[i].im*base}));
 const branches=net.branches.map(e=>{const i=at.get(e.from),j=at.get(e.to),y=divide(complex(1),complex(e.rPu,e.xPu)),current=multiply(y,sub(solution.V[i],solution.V[j]));const from=multiply(solution.V[i],conjugate(current)),to=multiply(solution.V[j],conjugate(complex(-current.re,-current.im)));
 return {id:e.id??null,from:e.from,to:e.to,currentPu:abs(current),fromMW:from.re*base,fromMvar:from.im*base,toMW:to.re*base,toMvar:to.im*base,lossMW:(from.re+to.re)*base,lossMvar:(from.im+to.im)*base};});
 const totalLossMW=branches.reduce((sum,r)=>sum+r.lossMW,0),sumBusP=buses.reduce((sum,r)=>sum+r.pMW,0);
 for(const [i,b] of net.buses.entries())if(b.type==='PV'&&b.qMinMvar!=null&&b.qMaxMvar!=null){const computed=buses[i].qMvar;if(computed<b.qMinMvar-1e-6||computed>b.qMaxMvar+1e-6)fail(b.id+': computed PV reactive dispatch '+computed.toFixed(5)+' Mvar exceeds documented Q limits; reactive-power-limited bus switching not yet modeled');}
 if(!Number.isFinite(totalLossMW)||Math.abs(sumBusP-totalLossMW)>base*3e-7)fail('network real-power balance did not close');
 return {status:'BALANCED_AC_SCREENING',converged:true,iterations,mismatchPu:solution.norm,baseMVA:base,buses,branches,totalLossMW,totalLossMvar:branches.reduce((sum,r)=>sum+r.lossMvar,0),source:'Steady-state balanced Ybus Newton-Raphson; constant P/Q; no voltage-dependent loads, device control, taps, shunts or Q limits'};
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
export function solveBalancedPowerFlow(net){
 const mode=net?.qLimitMode??'block';
 if(!['block','clamp'].includes(mode))fail('unknown PV reactive-limit handling mode');
 if(mode==='block')return solveBalancedPowerFlowCore(net);
 // Run the complete existing topology/impedance/input validation first.
 validatePowerNetwork(net);
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
 for(const e of p.branches.filter(e=>e.enabled!==false&&(!e.deviceId||p.devices.find(d=>d.id===e.deviceId)?.enabled!==false))){
   if(!voltage.has(e.from)||!voltage.has(e.to))fail(e.name+': invalid connected endpoints');
   if(e.kind==='link')fail(e.name+': ideal links require an explicit bus merger before operating-study calculation');
   let rPu,xPu;
   if(e.kind==='cable'){
     if(!finite(e.rPerM)||!finite(e.xPerM)||!finite(e.length)||e.length<=0||!Number.isSafeInteger(e.runs)||e.runs<=0)fail(e.name+': actual R/X Ω/m, length m and parallel runs required');
     if(Math.abs(voltage.get(e.from)-voltage.get(e.to))>1e-6*Math.max(voltage.get(e.from),voltage.get(e.to)))fail(e.name+': cable crosses incompatible voltage bases');
     const baseOhm=voltage.get(e.from)**2/(base*1e6);rPu=e.rPerM*e.length/e.runs/baseOhm;xPu=e.xPerM*e.length/e.runs/baseOhm;
   }else if(e.kind==='transformer'){
     if(!finite(e.power)||e.power<=0||!finite(e.zPercent)||e.zPercent<=0||!finite(e.xr)||e.xr<0||!finite(e.v1)||!finite(e.v2))fail(e.name+': rating VA, %Z, X/R and winding voltages required');
     if(Math.abs(voltage.get(e.from)-e.v1)>1e-4*e.v1||Math.abs(voltage.get(e.to)-e.v2)>1e-4*e.v2)fail(e.name+': transformer nominal ratios do not match actual connected voltage bases (tap modeling pending)');
     const z=e.zPercent/100*base*1e6/e.power;rPu=z/Math.hypot(1,e.xr);xPu=rPu*e.xr;
   }else fail(e.name+': unsupported operating-network branch kind');
   branches.push({id:e.id,from:e.from,to:e.to,rPu,xPu});
 }
 return {baseMVA:base,buses,branches,qLimitMode:cfg.qLimitMode??'block'};
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
