import {isExtendedStudy,usesConnectedSequences,calculateExtendedProject,validateExtendedProject,prepareSplitPhaseProject} from './analysis-models.mjs?v=20261108-v32';
import {isSplitPhaseFault,calculateSplitPhaseBusDetail} from './split-phase-network.mjs?v=20261108-v32';
import {calculateConnectedBusDetail} from './connected-sequences.mjs?v=20261108-v32';
// Balanced network screening, on a common MVA base and each bus's nominal voltage base.
import {combineBranchFlows} from './network-flow.mjs?v=20261022-pv-final';
import {isBranchEnabled} from './network-model.mjs?v=20261022-pv-final';
import {cableVoltageMessage} from './network-voltage.mjs?v=20261022-pv-final';
import {calculateDlg} from './dlg-fault.mjs?v=20261022-pv-final';
import {calculateDcBusDetail} from './dc-network.mjs?v=20261108-v32';
import {isSinglePhase,hasBranchCurrents,cableLoopFactor,singlePhaseIssues,singlePhaseSourceImpedance,singlePhaseScope} from './single-phase.mjs?v=20261022-pv-final';
const finiteComplex=z=>Number.isFinite(z?.r)&&Number.isFinite(z?.i);
export const C=(r=0,i=0)=>({r,i}),add=(a,b)=>C(a.r+b.r,a.i+b.i),sub=(a,b)=>C(a.r-b.r,a.i-b.i),mul=(a,b)=>C(a.r*b.r-a.i*b.i,a.r*b.i+a.i*b.r),scale=(a,k)=>C(a.r*k,a.i*k),conj=a=>C(a.r,-a.i),abs=a=>Math.hypot(a.r,a.i),div=(a,b)=>{if(!finiteComplex(a)||!finiteComplex(b))throw Error('Calculation exceeds numerical range. Check input values and units.');const m=Math.max(Math.abs(b.r),Math.abs(b.i));if(m===0)throw Error('Zero impedance / singular system');const br=b.r/m,bi=b.i/m,d=br*br+bi*bi,result=C(((a.r/m)*br+(a.i/m)*bi)/d,((a.i/m)*br-(a.r/m)*bi)/d);if(!finiteComplex(result))throw Error('Calculation exceeds numerical range. Check input values and units.');return result},polar=(v,d)=>C(v*Math.cos(d*Math.PI/180),v*Math.sin(d*Math.PI/180));
export const powerVA=x=>Number(x.power||0),baseZ=(volts,mva=1)=>volts*volts/(mva*1e6),baseI=(volts,mva=1)=>mva*1e6/(Math.sqrt(3)*volts);
export function zFromMagnitude(mag,xr){if(xr===null||xr===undefined||xr==='')return C(0,mag);const ratio=Number(xr),r=mag/Math.hypot(1,ratio);return C(r,r*ratio)}
// Partial-pivot complex LU: reuse one factorization for all source injections.
export function factorComplex(matrix){
 const n=matrix.length,lu=matrix.map(row=>row.map(z=>C(z.r,z.i))),permutation=Array.from({length:n},(_,i)=>i);
 if(matrix.some(row=>row.length!==n||row.some(z=>!finiteComplex(z))))throw Error('Calculation exceeds numerical range. Check input values and units.');
 for(let k=0;k<n;k++){
  let pivot=k;for(let i=k+1;i<n;i++)if(abs(lu[i][k])>abs(lu[pivot][k]))pivot=i;
  if(abs(lu[pivot][k])<1e-12)throw Error('Disconnected or floating network — no solvable path to the fault');
  [lu[k],lu[pivot]]=[lu[pivot],lu[k]];[permutation[k],permutation[pivot]]=[permutation[pivot],permutation[k]];
  for(let i=k+1;i<n;i++){lu[i][k]=div(lu[i][k],lu[k][k]);for(let j=k+1;j<n;j++)lu[i][j]=sub(lu[i][j],mul(lu[i][k],lu[k][j]));}
 }
 return {lu,permutation};
}
export function solveFactored({lu,permutation},rhs){
 const n=rhs.length,y=new Array(n),x=new Array(n);
 for(let i=0;i<n;i++){let v=rhs[permutation[i]];for(let j=0;j<i;j++)v=sub(v,mul(lu[i][j],y[j]));y[i]=v;}
 for(let i=n-1;i>=0;i--){let v=y[i];for(let j=i+1;j<n;j++)v=sub(v,mul(lu[i][j],x[j]));x[i]=div(v,lu[i][i]);}
 return x;
}
export const solveComplex=(matrix,rhs)=>solveFactored(factorComplex(matrix),rhs);
const networkBaseI=(net,volts)=>net.singlePhase?net.base*1e6/volts:baseI(volts,net.base);
const number=(v)=>v!==null&&v!==''&&v!==undefined&&Number.isFinite(Number(v));
function flagIssues(p){
 const issues=[],error=(id,message)=>issues.push({id,message,severity:'error'});
 for(const entry of p.inputErrors||[])error(entry.id,entry.message);
 for(const x of [...p.sources,...p.branches,...p.devices])for(const key of ['enabled','maxInclude','minInclude','allowIdeal','allowOneToOne','frequencyOverride'])if(x[key]!==undefined&&typeof x[key]!=='boolean')error(x.id,x.name+': '+key+' must be true or false.');
 for(const key of ['auto','assumeZ2'])if(p.settings[key]!==undefined&&typeof p.settings[key]!=='boolean')error('settings',key+' must be true or false.');
 for(const s of p.sources){
  for(const key of ['maxStrength','minStrength'])if(s[key]!==undefined&&s[key]!==null&&s[key]!==''&&(typeof s[key]!=='number'||!Number.isFinite(s[key])||s[key]<0))error(s.id,s.name+': scenario strength multipliers must be nonnegative finite numeric values.');
  if(s.model!==undefined&&!['voltage','current'].includes(s.model))error(s.id,s.name+': choose a valid source model.');
  if(s.method!==undefined&&!['ka','mva','impedance'].includes(s.method))error(s.id,s.name+': choose a valid source data method.');
 }
 for(const e of p.branches)if(e.kind==='link'&&e.deviceId){const d=p.devices.find(x=>x.id===e.deviceId);if(!d||d.linkId!==e.id||d.bus!==e.to)error(e.id,e.name+': internal connection must match its equipment and connection bus.')}
 for(const d of p.devices)if(d.linkId&&!p.branches.some(e=>e.id===d.linkId&&e.kind==='link'&&e.deviceId===d.id&&e.to===d.bus))error(d.id,d.name+': internal connection is missing or inconsistent.');
 return issues;
}
export function validateProject(p){if(isExtendedStudy(p))return validateExtendedProject(p);const issues=[...flagIssues(p),...singlePhaseIssues(p)],warn=(id,message,severity='error')=>issues.push({id,message,severity}),ids=new Set();for(const list of [p.buses,p.sources,p.branches,p.devices])for(const x of list){if(ids.has(x.id))warn(x.id,'Duplicate internal ID; import a valid project.');ids.add(x.id)}for(const x of [...p.buses,...p.sources,...p.branches,...p.devices]){for(const key of ['voltage','v1','v2','power','faultA','faultMVA','xr','angle','r','x','xdpp','xdp','xd','multiplier','duration','peakA','zPercent','shift','tapPercent','neutralR','neutralX','length','runs','rPerM','xPerM','r0PerM','x0PerM','ratedVoltage','interruptA','sccrA','frequency'])if(x[key]!==null&&x[key]!==undefined&&x[key]!==''&&(typeof x[key]!=='number'||!Number.isFinite(x[key])))warn(x.id,x.name+': '+key+' must be a finite numeric value.');for(const key of ['interruptA','sccrA','peakA','ratedVoltage','neutralR','neutralX','r0PerM','x0PerM'])if(number(x[key])&&x[key]<0)warn(x.id,x.name+': '+key+' cannot be negative.')}for(const [key,options] of Object.entries({faultType:['3phase','ll','slg','dlg','single-ll'],scenario:['base','maximum','minimum'],generatorStage:['initial','transient','steady']}))if(!options.includes(p.settings[key]))warn('settings','Choose a valid '+key+'.');for(const key of ['frequency','baseMVA','voltageFactor','time','faultR','faultX'])if(typeof p.settings[key]!=='number'||!Number.isFinite(p.settings[key]))warn('settings',key+' must be a finite numeric value.');for(const b of p.buses)for(const [key,value] of Object.entries(b.sequence||{}))if(['r0','x0','r2','x2'].includes(key)&&value!==null&&value!==undefined&&value!==''&&(typeof value!=='number'||!Number.isFinite(value)||value<0))warn(b.id,b.name+': equivalent '+key.toUpperCase()+' must be a nonnegative finite number.');const buses=new Map(p.buses.map(b=>[b.id,b]));const usedBuses=new Set([...p.sources.filter(s=>enabledInCase(s,p)&&strength(s,p)>0).map(s=>s.bus),...p.branches.filter(e=>isBranchEnabled(e,p)).flatMap(e=>[e.from,e.to]),...p.devices.filter(d=>d.enabled!==false).map(d=>d.bus)]);for(const b of p.buses)if(!(b.voltage>0))warn(b.id,usedBuses.has(b.id)?b.name+': enter a nominal bus voltage greater than zero.':b.name+': unused connection point; set its voltage before connecting equipment.',usedBuses.has(b.id)?'error':'info');if(!(p.settings.frequency>0))warn('settings','Enter a positive frequency.');if(!(p.settings.voltageFactor>0))warn('settings','Prefault voltage factor must be positive.');if(!(number(p.settings.time)&&p.settings.time>=0))warn('settings','Study time must be nonnegative.');if(!(number(p.settings.faultR)&&number(p.settings.faultX)&&p.settings.faultR>=0&&p.settings.faultX>=0))warn('settings','Fault R and X must be nonnegative finite values.');if(!(p.settings.baseMVA>0))warn('settings','Enter a positive calculation base MVA.');for(const s of p.sources){if(!enabledInCase(s,p)||strength(s,p)===0)continue;const bus=buses.get(s.bus);if(!bus){warn(s.id,s.name+': choose a connected bus.');continue}if(!(s.voltage>0))warn(s.id,s.name+': enter source rated / data voltage.');else if(bus.voltage>0&&Math.abs(s.voltage-bus.voltage)>1e-3)warn(s.id,s.name+': source voltage differs from its connected bus. Add a transformer between voltage levels.');for(const key of ['maxStrength','minStrength'])if(s[key]!==undefined&&s[key]!==null&&s[key]!==''&&(!number(s[key])||s[key]<0))warn(s.id,s.name+': scenario strength multipliers must be nonnegative.');if(number(s.duration)&&s.duration<0)warn(s.id,s.name+': duration cannot be negative.');if(s.xr!==null&&s.xr!==''&&s.xr!==undefined&&(!number(s.xr)||s.xr<0))warn(s.id,s.name+': X/R must be nonnegative, or left unknown.');if(s.frequency&&s.frequency!==p.settings.frequency)warn(s.id,s.name+': database frequency differs from the study. Verify and override source properties.');if(['pv','bess'].includes(s.kind)||s.model==='current'){if(!(s.faultA>0)&&!(s.power>0&&s.multiplier>0))warn(s.id,s.name+': enter manufacturer RMS fault current, or rated power and a documented multiplier.');if(!number(s.angle))warn(s.id,s.name+': current phase angle is unknown. Total is a magnitude-sum screening bound, not an exact phasor total.','warning');warn(s.id,s.name+': ideal current-limited Norton model. Network current division and voltage ratio are included; series impedance alone does not reduce a regulated current. Manufacturer voltage-compliance / control behavior is required for a physical prediction.','warning');if(!number(s.duration))warn(s.id,s.name+': contribution duration is unknown; assumed present at the selected study time.','warning')}else if(s.kind==='generator'&&s.method!=='impedance'){const xd=p.settings.generatorStage==='transient'?s.xdp:p.settings.generatorStage==='steady'?s.xd:s.xdpp;if(!(s.power>0&&xd>0))warn(s.id,s.name+': enter rated power and the reactance for the selected generator stage.');if(number(s.xr)&&!(s.xr>0))warn(s.id,s.name+': generator reactance requires X/R greater than zero, or leave X/R unknown.')}else if(s.method==='mva'){if(!(s.faultMVA>0))warn(s.id,s.name+': enter available short-circuit MVA.')}else if(s.method==='impedance'){if(!(number(s.r)&&number(s.x)&&s.r>=0&&s.x>=0&&Math.hypot(s.r,s.x)>0))warn(s.id,s.name+': enter nonzero source resistance/reactance in ohms.')}else if(!(s.faultA>0))warn(s.id,s.name+': enter available RMS fault current.');if(!['pv','bess'].includes(s.kind)&&s.model!=='current'&&s.method!=='impedance'&&(s.xr===null||s.xr===undefined||s.xr===''))warn(s.id,s.name+': X/R unknown — source is treated as purely reactive using the supplied impedance magnitude. Peak and asymmetrical duty are unavailable.','warning')}
for(const e of p.branches){if(!isBranchEnabled(e,p))continue;const a=buses.get(e.from),b=buses.get(e.to);if(!a||!b){warn(e.id,e.name+': connection missing. Select From and To buses, or delete this connection.');continue}if(a.id===b.id&&e.kind!=='link')warn(e.id,e.name+': From and To must be different buses.');if(e.kind==='transformer'){if(!(e.v1>0&&e.v2>0&&e.power>0))warn(e.id,e.name+': enter both winding voltages and rated kVA/MVA.');if(!(e.zPercent>0)&&!(e.zPercent===0&&e.allowIdeal))warn(e.id,e.name+': impedance must be positive; select intentional ideal transformer to use 0%.');if(e.tapPercent!==null&&e.tapPercent!==undefined&&e.tapPercent!==''&&!(Math.abs(e.tapPercent)<=10))warn(e.id,e.name+': off-nominal tap must be between -10 % and +10 % of nameplate primary voltage.');else if(e.tapPercent)warn(e.id,e.name+': off-nominal primary tap '+e.tapPercent+' % applied to the turns ratio (impedance kept on the nameplate base).','info');if(Math.abs(a.voltage-e.v1)>1e-3||Math.abs(b.voltage-e.v2)>1e-3)warn(e.id,e.name+': bus voltages must match their assigned transformer winding voltages.');if(e.v1===e.v2&&!e.allowOneToOne)warn(e.id,e.name+': equal winding voltages require intentional 1:1 selection.');if(e.xr!==null&&e.xr!==undefined&&e.xr!==''&&(!number(e.xr)||e.xr<0))warn(e.id,e.name+': X/R must be nonnegative.');if(e.xr===null||e.xr===undefined||e.xr==='')warn(e.id,e.name+': transformer X/R unknown — purely reactive impedance screening; peak/asymmetrical unavailable.','warning');if(!number(e.shift))warn(e.id,e.name+': vector-group phase shift not supplied; aligned phases assumed for balanced screening.','warning');if(e.allowIdeal&&e.zPercent===0)warn(e.id,e.name+': ideal transformer modeled with 1e-10 pu numerical impedance on a fixed 1 MVA reference.','warning');if(e.frequency&&e.frequency!==p.settings.frequency)warn(e.id,e.name+': database frequency differs from the study.')}else{if(Math.abs(a.voltage-b.voltage)>1e-3)warn(e.id,e.name+': a cable / switch connection cannot change voltage; insert a transformer.');if(e.kind==='cable'){if(!(number(e.length)&&e.length>=0&&number(e.rPerM)&&e.rPerM>=0&&number(e.xPerM)&&e.xPerM>=0&&e.runs>=1&&Number.isInteger(e.runs)))warn(e.id,e.name+': enter nonnegative length and R/X per length, and an integer count of parallel runs.');if(e.length>0&&e.rPerM===0&&e.xPerM===0&&!e.allowIdeal)warn(e.id,e.name+': R and X cannot both be zero unless intentionally ideal.');const cableVoltageIssue=cableVoltageMessage(p,e);if(cableVoltageIssue)warn(e.id,cableVoltageIssue);if(e.frequency&&e.frequency!==p.settings.frequency&&!e.frequencyOverride)warn(e.id,e.name+': cable data is at '+e.frequency+' Hz, study is '+p.settings.frequency+' Hz. Select matching data or override R/X and acknowledge it.');if(e.inferredMaterial)warn(e.id,e.name+': database material is inferred; verify the exact cable.','warning')}}}
for(const d of p.devices)if(d.enabled!==false&&!buses.has(d.bus))warn(d.id,d.name+': select its connection bus.');/*V29 plausibility data check: warnings only, never changes a calculated value.*/(()=>{const pw=(id,m)=>warn(id,'Plausibility check: '+m,'warning'),fin=x=>typeof x==='number'&&Number.isFinite(x),on=x=>x.enabled!==false;
for(const s of p.sources){if(!on(s))continue;const V=fin(s.voltage)&&s.voltage>0?s.voltage:null;
 if(s.method==='ka'&&fin(s.faultA)&&s.faultA>0&&!['pv','bess'].includes(s.kind)&&s.model!=='current'){if(s.faultA>300e3)pw(s.id,s.name+': available fault current '+(s.faultA/1e3).toPrecision(4)+' kA exceeds 300 kA. Verify A versus kA units and the utility letter.');else if(V&&Math.sqrt(3)*V*s.faultA>1e11)pw(s.id,s.name+': implied short-circuit level exceeds 100,000 MVA. Verify units.');}
 if(s.method==='mva'&&fin(s.faultMVA)&&s.faultMVA>1e5)pw(s.id,s.name+': short-circuit level exceeds 100,000 MVA. Verify MVA versus kVA units.');
 if(fin(s.xr)&&s.method!=='impedance'&&!['pv','bess'].includes(s.kind)&&s.model!=='current'){if(s.xr>150)pw(s.id,s.name+': X/R above 150 is outside typical published source data; peak duty becomes very sensitive.');else if(s.xr===0)pw(s.id,s.name+': X/R = 0 models a purely resistive source, which is not physical for utility, generator or motor contributions.');}
 if(s.kind==='generator'&&s.method!=='impedance'){const st=p.settings.generatorStage,xd=st==='transient'?s.xdp:st==='steady'?s.xd:s.xdpp,lo=st==='steady'?.3:.03,hi=st==='steady'?4:st==='transient'?1:.6;if(fin(xd)&&xd>0&&(xd<lo||xd>hi))pw(s.id,s.name+': per-unit reactance '+xd+' is outside the typical '+lo+'–'+hi+' pu range for this stage. Enter per-unit on the machine rating, not percent.');}}
for(const e of p.branches){if(!isBranchEnabled(e,p))continue;
 if(e.kind==='transformer'){if(fin(e.zPercent)&&e.zPercent>0&&(e.zPercent<.5||e.zPercent>25))pw(e.id,e.name+': impedance '+e.zPercent+'% is outside the typical 0.5–25% range. Enter percent, not per-unit.');if(fin(e.xr)&&e.xr>100)pw(e.id,e.name+': X/R above 100 is outside typical transformer data.');if(fin(e.power)&&e.power>2e9)pw(e.id,e.name+': rating exceeds 2,000 MVA. Verify VA/kVA/MVA units.');}
 if(e.kind==='cable'){if(fin(e.length)&&e.length>1e5)pw(e.id,e.name+': length exceeds 100 km. Verify m/ft units.');if(fin(e.rPerM)&&e.rPerM>.05)pw(e.id,e.name+': resistance '+(e.rPerM*1e3).toPrecision(4)+' Ω/km is higher than #18 AWG copper. Verify Ω/km versus Ω/m units.');if(fin(e.xPerM)&&e.xPerM>.002)pw(e.id,e.name+': reactance '+(e.xPerM*1e3).toPrecision(4)+' Ω/km exceeds typical cable and overhead-line data. Verify units.');if(fin(e.length)&&e.length>0&&e.rPerM===0&&e.xPerM===0)pw(e.id,e.name+': cable with length but zero R and X is treated as an ideal connection.');}}
for(const b of p.buses)if(fin(b.voltage)&&b.voltage>8e5)pw(b.id,b.name+': nominal voltage above 800 kV. Verify V versus kV units.');})();return issues}
function sourceImpedance(s,settings){if(settings.faultType==='single-ll')return singlePhaseSourceImpedance(s,zFromMagnitude);const voltage=s.voltage;if(s.method==='impedance')return C(s.r,s.x);if(s.kind==='generator'){const xd=settings.generatorStage==='transient'?s.xdp:settings.generatorStage==='steady'?s.xd:s.xdpp,x=voltage**2/s.power*xd;return C(number(s.xr)?x/s.xr:0,x)}const mag=s.method==='mva'?voltage**2/(s.faultMVA*1e6):voltage/(Math.sqrt(3)*s.faultA);return zFromMagnitude(mag,s.xr)}
function enabledInCase(s,p){return s.enabled!==false&&(p.settings.scenario!=='maximum'||s.maxInclude!==false)&&(p.settings.scenario!=='minimum'||s.minInclude!==false)}
function strength(s,p){const value=p.settings.scenario==='maximum'?s.maxStrength:p.settings.scenario==='minimum'?s.minStrength:1;return value===null||value===undefined||value===''?1:value}
export function buildNetwork(p,options={}){if(isExtendedStudy(p)){const calculation=calculateExtendedProject(p);return {...calculation.net,issues:calculation.issues,extensionResults:calculation.results};}const issues=validateProject(p),errors=issues.filter(x=>x.severity==='error');if(errors.length)return {issues,errors};const base=p.settings.baseMVA||1,singlePhase=isSinglePhase(p),buses=p.buses,sparse=options.sparse??(buses.length>SPARSE_MIN_BUSES||buses.length*Math.max(1,p.branches.length)*Math.max(1,p.sources.length)>COMPACT_WORK),at=new Map(buses.map((b,i)=>[b.id,i])),Y=sparse?buses.map(()=>new Map()):buses.map(()=>buses.map(()=>C())),adj=buses.map(()=>[]),branches=[];const yget=sparse?(i,j)=>Y[i].get(j)??C():(i,j)=>Y[i][j],yset=sparse?(i,j,v)=>{Y[i].set(j,v)}:(i,j,v)=>{Y[i][j]=v};const stamp=(i,j,y,tap=C(1))=>{const tc=conj(tap);yset(i,i,add(yget(i,i),scale(y,1/(abs(tap)**2))));yset(i,j,sub(yget(i,j),div(y,tc)));yset(j,i,sub(yget(j,i),div(y,tap)));yset(j,j,add(yget(j,j),y))};
for(const e of p.branches){if(!isBranchEnabled(e,p))continue;const i=at.get(e.from),j=at.get(e.to);if(e.kind==='link'&&i===j)continue;let ohms,tap=C(1);if(e.kind==='transformer'){ohms=zFromMagnitude(e.v2**2/e.power*(e.zPercent/100),e.xr);tap=polar((e.v1*(1+(e.tapPercent||0)/100)/e.v2)/(buses[i].voltage/buses[j].voltage),e.shift||0)}else ohms=e.kind==='cable'?C(e.rPerM*e.length/e.runs*(singlePhase?cableLoopFactor(e):1),e.xPerM*e.length/e.runs*(singlePhase?cableLoopFactor(e):1)):C();let zpu=scale(ohms,1/baseZ(buses[j].voltage,base));const numericalZpu=1e-10*base;if(abs(zpu)<numericalZpu)zpu=C(numericalZpu);const y=div(C(1),zpu);stamp(i,j,y,tap);adj[i].push(j);adj[j].push(i);branches.push({...e,i,j,ohms,zpu,tap,y})}
const sources=[];for(const s of p.sources){if(!enabledInCase(s,p))continue;const i=at.get(s.bus),factor=strength(s,p);if(!(factor>0))continue;const current=['pv','bess'].includes(s.kind)||s.model==='current';if(current){const expired=number(s.duration)&&p.settings.time>s.duration;const amps=expired?0:(s.faultA>0?s.faultA:s.power/(Math.sqrt(3)*s.voltage)*s.multiplier)*factor;const injection=polar(amps/baseI(buses[i].voltage,base),number(s.angle)?s.angle:-90);sources.push({...s,i,current:true,injection,amps,expired,strengthFactor:factor,unknownAngle:!number(s.angle),impedance:null})}else{const impedance=scale(sourceImpedance(s,p.settings),1/factor),zpu=scale(impedance,1/baseZ(buses[i].voltage,base)),y=div(C(1),zpu);yset(i,i,add(yget(i,i),y));const emf=polar(p.settings.voltageFactor||1,s.angle??0);sources.push({...s,i,current:false,injection:mul(y,emf),impedance,zpu,y,emf})}}
return {issues,errors:[],base,buses,at,Y,adj,branches,sources,...(singlePhase?{singlePhase:true}:{}),...(sparse?{sparse:true}:{})}}
function component(net,index){const set=new Set([index]),queue=[index];for(let n=0;n<queue.length;n++)for(const j of net.adj[queue[n]])if(!set.has(j)){set.add(j);queue.push(j)}return [...set].sort((a,b)=>a-b)}
function prepareComponent(net,comp){
 net.prepared??=new Map();const key=comp.join(',');if(net.prepared.has(key))return net.prepared.get(key);
 if(!net.sources.some(s=>!s.current&&comp.includes(s.i))){net.prepared.set(key,null);return null;}
 const matrix=comp.map(i=>comp.map(j=>net.Y[i][j])),factored=factorComplex(matrix);
 const zColumns=comp.map((_,j)=>solveFactored(factored,comp.map((_,i)=>C(i===j?1:0))));
 const prefault=new Map(net.sources.filter(s=>comp.includes(s.i)).map(src=>[src.id,solveFactored(factored,comp.map(i=>i===src.i?src.injection:C()))]));
 const data={zColumns,prefault};net.prepared.set(key,data);return data;
}
function faultResponse(net,f,src,comp){const zf=C(net.project?.settings.faultR||0,net.project?.settings.faultX||0),faultZpu=scale(zf,1/baseZ(net.buses[f].voltage,net.base));const prepared=prepareComponent(net,comp);if(prepared){const localF=comp.indexOf(f),prefault=prepared.prefault.get(src.id),column=prepared.zColumns[localF],ipu=div(prefault[localF],add(column[localF],faultZpu)),voltages=net.buses.map(()=>C());comp.forEach((i,k)=>voltages[i]=sub(prefault[k],mul(column[k],ipu)));return {ipu,voltages}}const bolted=abs(faultZpu)<1e-14,unknown=comp.filter(i=>!bolted||i!==f),M=unknown.map(i=>unknown.map(j=>net.Y[i][j])),J=unknown.map(i=>i===src.i?src.injection:C());if(!bolted){const k=unknown.indexOf(f);M[k][k]=add(M[k][k],div(C(1),faultZpu))}const solution=solveComplex(M,J),voltages=net.buses.map(()=>C());unknown.forEach((i,k)=>voltages[i]=solution[k]);let ipu;if(bolted){ipu=src.i===f?src.injection:C();for(const i of unknown)ipu=sub(ipu,mul(net.Y[f][i],voltages[i]))}else ipu=div(voltages[f],faultZpu);return {ipu,voltages}}
function thevenin(net,f,comp){const prepared=prepareComponent(net,comp);if(prepared){const k=comp.indexOf(f);return scale(prepared.zColumns[k][k],baseZ(net.buses[f].voltage,net.base))}if(!net.sources.some(s=>!s.current&&comp.includes(s.i)))return null;const M=comp.map(i=>comp.map(j=>net.Y[i][j])),J=comp.map(i=>C(i===f?1:0));try{return scale(solveComplex(M,J)[comp.indexOf(f)],baseZ(net.buses[f].voltage,net.base))}catch{return null}}
function pathTo(net,from,to){const queue=[from],prev=new Map([[from,null]]);for(let k=0;k<queue.length;k++){if(queue[k]===to)break;for(const e of net.branches){let j=e.i===queue[k]?e.j:e.j===queue[k]?e.i:null;if(j!==null&&!prev.has(j)){prev.set(j,{parent:queue[k],e});queue.push(j)}}}if(!prev.has(to))return [];const out=[];for(let cur=to;cur!==from;){const v=prev.get(cur);out.push(v.e);cur=v.parent}return out.reverse()}
export function calculateBus(net,p,busId){if(net.extensionResults)return net.extensionResults.find(r=>r.busId===busId)||{busId,status:"MISSING BUS",totalA:null};if(net.errors?.length){const b=p.buses.find(b=>b.id===busId);return {busId,busName:b?.name,voltage:b?.voltage,status:'INPUT REQUIRED',issues:net.issues,totalA:null}}net.project=p;const f=net.at.get(busId);if(f===undefined)return {busId,status:'MISSING BUS',totalA:null};if(net.sparse)return calculateScaled(net,p,{only:busId}).results[f];const comp=component(net,f),sources=net.sources.filter(s=>comp.includes(s.i)),bus=net.buses[f];if(!sources.length)return {busId,busName:bus.name,voltage:bus.voltage,status:'DISCONNECTED / NO ACTIVE SOURCE',totalA:null,issues:net.issues};let total=C(),conventional=C(),derKnown=C(),derBound=0,details=[];try{for(const src of sources){const response=faultResponse(net,f,src,comp),amps=scale(response.ipu,networkBaseI(net,bus.voltage));total=add(total,amps);if(src.current){if(src.unknownAngle)derBound+=abs(amps);else derKnown=add(derKnown,amps)}else conventional=add(conventional,amps);const paths=pathTo(net,src.i,f),loops=net.branches.filter(e=>comp.includes(e.i)).length>=comp.length;const busPhaseScale=src.voltage/bus.voltage;const pathSeriesZ=paths.reduce((sum,e)=>add(sum,scale(e.ohms,(bus.voltage/net.buses[e.j].voltage)**2)),src.impedance?scale(src.impedance,busPhaseScale**-2):C());const branchFlows=net.branches.filter(e=>comp.includes(e.i)).map(e=>{
 const drop=sub(div(response.voltages[e.i],e.tap),response.voltages[e.j]);
 const fromPhasor=scale(mul(div(e.y,conj(e.tap)),drop),networkBaseI(net,net.buses[e.i].voltage));
 const toPhasor=scale(mul(e.y,drop),-networkBaseI(net,net.buses[e.j].voltage));
 return {id:e.id,name:e.name,kind:e.kind,from:e.from,to:e.to,amps:abs(fromPhasor),toAmps:abs(toPhasor),fromPhasor,toPhasor};
});details.push({sourceId:src.id,name:src.name,kind:src.kind,current:src.current,expired:src.expired,unknownAngle:src.unknownAngle,amps:abs(amps),phasor:amps,sourceImpedance:src.impedance,pathSeriesZ,sourceImpedanceAtFault:src.impedance?scale(src.impedance,busPhaseScale**-2):null,terminalA:src.current?src.amps:abs(src.injection)*networkBaseI(net,src.voltage),path:paths.map(e=>({id:e.id,name:e.name,kind:e.kind,from:e.from,to:e.to,ohms:e.ohms,atVoltage:net.buses[e.j].voltage})),meshed:loops,branchFlows,terminalVoltagePu:abs(response.voltages[src.i])})}
let totalA=abs(add(conventional,derKnown))+derBound,bound=derBound>0;const zth=thevenin(net,f,comp),xrKnown=sources.filter(s=>!s.current).every(s=>s.method==='impedance'||number(s.xr))&&net.branches.filter(e=>comp.includes(e.i)&&e.kind==='transformer').every(e=>number(e.xr));const zDuty=zth?add(zth,C(p.settings.faultR||0,p.settings.faultX||0)):null;const xr=zDuty&&zDuty.r>=0?(zDuty.r===0?Infinity:zDuty.i/zDuty.r):null;let peak=null,asym=null;if(xrKnown&&zth&&xr!==null){const convPeak=Math.sqrt(2)*(1.02+.98*(xr===Infinity?1:Math.exp(-3/Math.max(xr,1e-8))))*abs(conventional);const currentDetails=details.filter(d=>d.current&&!d.expired),allPeak=currentDetails.every(d=>net.sources.find(s=>s.id===d.sourceId).peakA>0);if(allPeak)peak=convPeak+currentDetails.reduce((sum,d)=>{const s=net.sources.find(s=>s.id===d.sourceId);return sum+s.peakA*s.strengthFactor*(s.amps>0?d.amps/s.amps:0)},0);if(!currentDetails.length){const tau=xr/(2*Math.PI*p.settings.frequency);asym=Math.hypot(totalA,Math.sqrt(2)*abs(conventional)*(xr===0?0:xr===Infinity?1:Math.exp(-p.settings.time/Math.max(tau,1e-12))))}}
if(!sources.some(s=>!s.current)){
 const active=details.filter(d=>d.current&&!d.expired&&d.amps>0);
 if(active.every(d=>net.sources.find(s=>s.id===d.sourceId).peakA>0))
  peak=active.reduce((sum,d)=>{const s=net.sources.find(s=>s.id===d.sourceId);return sum+s.peakA*s.strengthFactor*(s.amps>0?d.amps/s.amps:0)},0);
}
let faultNote=null,sequence=null,dlgResult=null;if(!hasBranchCurrents(p)){if(details.some(d=>d.current&&!d.expired)){totalA=null;faultNote='Unbalanced inverter fault data is missing. Supply manufacturer positive/negative/zero-sequence control behavior.'}else if(!zth){totalA=null;faultNote='No conventional Thevenin sequence model is available.'}else{const seq=bus.sequence||{},z2=number(seq.r2)&&seq.r2>=0&&number(seq.x2)&&seq.x2>=0&&abs(C(seq.r2,seq.x2))>0?C(seq.r2,seq.x2):((p.settings.faultType==='dlg'?p.settings.assumeZ2===true:p.settings.assumeZ2)?zth:null),zf=C(p.settings.faultR||0,p.settings.faultX||0),vth=mul(conventional,add(zth,zf));sequence={z1:zth,z2,z0:null,faultZ:zf,referenceVoltage:vth};if(!z2){totalA=null;faultNote='Enter equivalent negative-sequence R2 and X2 at this bus, or explicitly select Z2 = Z1 screening.'}else if(p.settings.faultType==='ll')totalA=abs(div(scale(vth,Math.sqrt(3)),add(add(zth,z2),zf)));else if(number(seq.r0)&&seq.r0>=0&&number(seq.x0)&&seq.x0>=0&&abs(C(seq.r0,seq.x0))>0){sequence.z0=C(seq.r0,seq.x0);if(p.settings.faultType==='dlg'){dlgResult=calculateDlg(sequence);totalA=dlgResult.totalA;}else totalA=abs(div(scale(vth,3),add(add(add(zth,z2),sequence.z0),scale(zf,3))));}else{totalA=null;faultNote=(p.settings.faultType==='dlg'?'DLG':'SLG')+' requires equivalent R0 and X0 at this bus, including transformer grounding paths and neutral impedance. No ground-fault value is invented.'}}peak=null;asym=null;bound=false}
if(isSinglePhase(p)){peak=null;asym=null;faultNote=singlePhaseScope;}
const branchFlows=combineBranchFlows(details);
if(branchFlows.some(e=>!Number.isFinite(e.fromA)||!Number.isFinite(e.toA)||!finiteComplex(e.fromPhasor)||!finiteComplex(e.toPhasor)))throw Error('Branch current exceeds numerical range. Check input values and units.');
if((totalA!==null&&(!Number.isFinite(totalA)||totalA<0))||[peak,asym].some(v=>v!==null&&(!Number.isFinite(v)||v<0))||!finiteComplex(conventional)||details.some(d=>!Number.isFinite(d.amps)||!finiteComplex(d.phasor))||(zth&&!finiteComplex(zth)))throw Error('Calculation exceeds numerical range. Check input values and units.');
return {...(dlgResult||{}),...(isSinglePhase(p)?{phaseModel:'single-phase-ll'}:{}),busId,busName:bus.name,voltage:bus.voltage,status:totalA===null?'DATA REQUIRED':bound?'SCREENING BOUND':'CALCULATED',totalA,conventionalA:hasBranchCurrents(p)?abs(conventional):null,derBound:hasBranchCurrents(p)?derBound:0,details:hasBranchCurrents(p)?details:[],branchFlows:hasBranchCurrents(p)?branchFlows:[],sequence,zth,xr:xrKnown&&hasBranchCurrents(p)?xr:null,peakA:peak,asymA:asym,faultNote,bound,issues:net.issues,groups:hasBranchCurrents(p)?details.reduce((o,d)=>(o[d.kind]=(o[d.kind]||0)+d.amps,o),{}):{}}
}catch(e){return {busId,busName:bus.name,voltage:bus.voltage,status:'NETWORK ERROR',totalA:null,faultNote:e.message,issues:net.issues}}}
export function calculateProject(p){if(isExtendedStudy(p))return calculateExtendedProject(p);const net=buildNetwork(p);if(net.sparse&&!net.errors?.length&&!net.extensionResults)return {issues:net.issues,results:calculateScaled(net,p).results,net};const results=p.buses.map(b=>calculateBus(net,p,b.id));return {issues:net.issues,results,net}}
// Detail for one bus of a large network (compact sweep keeps reduced branch tables for the other buses).
export function calculateBusDetail(p,busId){if(p?.settings?.faultType==='dc')return calculateDcBusDetail(p,busId);if(usesConnectedSequences(p))return calculateConnectedBusDetail(p,busId);if(isSplitPhaseFault(p))return calculateSplitPhaseBusDetail(prepareSplitPhaseProject(p),busId);if(isExtendedStudy(p))return null;const net=buildNetwork(p);return calculateBus(net,p,busId)}
export function deviceDuty(d, result, p, results = []) {
 if(p?.settings?.faultType==='dc')return {status:'REVIEW REQUIRED — DC RATING / INTERRUPTING MODEL',classification:'REVIEW REQUIRED',checks:[],sccrDutyA:null,interruptDutyA:null,interruptBusId:null,basis:'AC equipment ratings are not applied to DC prospective current. Documented DC rating, voltage, polarity and circuit time constant require separate review.'};
 const roundoff=(a,b)=>128*Number.EPSILON*Math.max(1,a,b);
 const exceeds=(current,rating)=>current>rating+roundoff(current,rating);
 const margin=(current,rating)=>Math.abs(rating-current)<=roundoff(current,rating)?0:rating-current;
 const fail = (status, extra={}) => ({status:'FAIL — '+status, classification:'FAIL', ...extra});
 const required = (status, extra={}) => ({status:'INPUT REQUIRED — '+status, classification:'INPUT REQUIRED', ...extra});
 if (!result || !Number.isFinite(result.totalA) || result.totalA < 0 ||
     !Number.isFinite(result.voltage) || result.voltage <= 0 ||
     (result.peakA != null && (!Number.isFinite(result.peakA) || result.peakA < 0))) return required('RESULT');
 if (d.ratedVoltage > 0 && d.ratedVoltage < result.voltage) return fail('VOLTAGE');
 const link = p?.branches?.find(e=>e.id===d.linkId && e.kind==='link');
 const hasConnection = Boolean(link && link.from!==link.to);
 const linked = hasConnection && isBranchEnabled(link,p);
 const openConnection = hasConnection && !linked;
 const candidates = results.length ? results : [result];
 let interruptDutyA = result.totalA, interruptBusId = result.busId, interruptBound = result.bound;
 let branchAvailable = !linked;
 if(openConnection){interruptDutyA=0;interruptBusId=null;interruptBound=false;}
 if (linked && hasBranchCurrents(p)) {
  const flows = linkFlows(candidates,link.id);
  if (flows.length) {
   const worst = flows.reduce((a,b)=>b.e.toA>a.e.toA?b:a);
   interruptDutyA=worst.e.toA;interruptBusId=worst.r.busId;interruptBound=worst.e.bound;
   branchAvailable=true;
  }
 }
 const basis = openConnection ? 'Open connection: no conducting branch current' : linked ? 'Maximum through-connection RMS across calculated bus faults' : 'Available RMS at equipment bus';
 const checks=[];
 if (d.sccrA>0) checks.push({type:'Assembly SCCR',currentA:result.totalA,ratingA:d.sccrA,busId:result.busId});
 if (d.interruptA>0 && branchAvailable) checks.push({type:'Interrupting',currentA:interruptDutyA,ratingA:d.interruptA,busId:interruptBusId});
 const extra={checks,sccrDutyA:result.totalA,interruptDutyA:branchAvailable?interruptDutyA:null,interruptBusId,basis};
 const failed=checks.find(c=>exceeds(c.currentA,c.ratingA));
 if (failed) return fail('RMS DUTY',{...extra,marginA:margin(failed.currentA,failed.ratingA),failedType:failed.type});
 if (d.peakA>0 && Number.isFinite(result.peakA) && exceeds(result.peakA,d.peakA)) return fail('PEAK',extra);
 if ([d.sccrA,d.interruptA,d.peakA,d.ratedVoltage].some(v=>v!==null&&v!==undefined&&v!==''&&(typeof v!=='number'||!Number.isFinite(v)||v<0)))return required('RATING DATA',extra);
 if (!(d.sccrA>0 || d.interruptA>0)) return required('DUTY RATING',extra);
 if (d.interruptA>0 && !branchAvailable) return required('BRANCH FAULT MODEL',extra);
 const marginA=Math.min(...checks.map(c=>margin(c.currentA,c.ratingA)));
 if (!(d.ratedVoltage>0)) return required('VOLTAGE RATING',{...extra,marginA});
 const incompleteSweep=linked && (!results.length || candidates.some(r=>r.status==='NETWORK ERROR'||r.status==='INPUT REQUIRED'||r.status==='DATA REQUIRED'));
 const review=openConnection || result.bound || interruptBound || result.issues?.some(i=>i.severity==='warning') || incompleteSweep;
 if (review) return {status:'REVIEW REQUIRED — RMS WITHIN RATING',classification:'REVIEW REQUIRED',...extra,marginA};
 if (d.peakA>0 && (result.peakA===null || linked)) return {status:'REVIEW REQUIRED — PEAK DATA',classification:'REVIEW REQUIRED',...extra,marginA};
 return {status:'PASS — ENTERED RMS RATING',classification:'PASS',...extra,marginA};
}
// ===================== V31 large-network path =====================
// Same superposition equations as the dense path above: one factorization of the component admittance
// matrix, prefault vectors per source, and one impedance column per faulted bus. The matrix is held
// sparse and factorized with minimum-degree ordering, so cost grows with the number of connections rather
// than with the cube of the bus count. Networks at or below SPARSE_MIN_BUSES keep the dense path unchanged.
export const SPARSE_MIN_BUSES=150,COMPACT_WORK=4e5;
const rangeError=()=>Error('Calculation exceeds numerical range. Check input values and units.');
const flowIndex=new WeakMap();
function linkFlows(results,id){let index=flowIndex.get(results);if(!index){index=new Map();for(const r of results){if(!r||r.totalA===null)continue;for(const e of r.branchFlows||[]){let list=index.get(e.id);if(!list)index.set(e.id,list=[]);list.push({r,e})}}flowIndex.set(results,index)}return index.get(id)||[]}
function cdiv(ar,ai,br,bi){const m=Math.max(Math.abs(br),Math.abs(bi));if(!(m>0))throw Error('Zero impedance / singular system');const r=br/m,i=bi/m,d=r*r+i*i;return [((ar/m)*r+(ai/m)*i)/d,((ai/m)*r-(ar/m)*i)/d]}
// rows: array of Map(localColumn -> complex). Consumed by the factorization.
export function sparseFactor(rows){
 const n=rows.length,elim=new Uint8Array(n),order=new Int32Array(n),Lp=[0],Li=[],Lr=[],Lm=[],Up=[0],Uj=[],Ur=[],Um=[],dr=new Float64Array(n),dm=new Float64Array(n),heap=[];
 for(const row of rows)for(const v of row.values())if(!finiteComplex(v))throw rangeError();
 const less=(a,b)=>a[0]<b[0]||(a[0]===b[0]&&a[1]<b[1]),deg=k=>rows[k].size-(rows[k].has(k)?1:0);
 const push=(d,k)=>{heap.push([d,k]);let c=heap.length-1;while(c>0){const q=(c-1)>>1;if(!less(heap[c],heap[q]))break;[heap[c],heap[q]]=[heap[q],heap[c]];c=q}};
 const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let c=0;for(;;){const l=2*c+1,r=l+1;let s=c;if(l<heap.length&&less(heap[l],heap[s]))s=l;if(r<heap.length&&less(heap[r],heap[s]))s=r;if(s===c)break;[heap[c],heap[s]]=[heap[s],heap[c]];c=s}}return top};
 for(let k=0;k<n;k++)push(deg(k),k);
 let t=0;
 while(t<n){const [d,k]=pop();if(elim[k]||d!==deg(k))continue;
  const row=rows[k],piv=row.get(k)||C();if(abs(piv)<1e-12)throw Error('Disconnected or floating network — no solvable path to the fault');
  const urow=[];for(const [j,v] of row)if(j!==k)urow.push([j,v]);
  for(const [i] of urow){const ri=rows[i],aik=ri.get(k);ri.delete(k);const l=aik?div(aik,piv):C();Li.push(i);Lr.push(l.r);Lm.push(l.i);if(l.r===0&&l.i===0)continue;
   for(const [j,u] of urow){const prod=mul(l,u),cur=ri.get(j);ri.set(j,cur?sub(cur,prod):C(-prod.r,-prod.i))}}
  for(const [j,v] of urow){Uj.push(j);Ur.push(v.r);Um.push(v.i)}
  Lp.push(Li.length);Up.push(Uj.length);dr[k]=piv.r;dm[k]=piv.i;elim[k]=1;order[t++]=k;rows[k]=null;
  for(const [i] of urow)push(deg(i),i);
 }
 return {n,order,Lp:Int32Array.from(Lp),Li:Int32Array.from(Li),Lr:Float64Array.from(Lr),Lm:Float64Array.from(Lm),Up:Int32Array.from(Up),Uj:Int32Array.from(Uj),Ur:Float64Array.from(Ur),Um:Float64Array.from(Um),dr,dm};
}
export function sparseSolve(F,br,bi){
 const {n,order,Lp,Li,Lr,Lm,Up,Uj,Ur,Um,dr,dm}=F,xr=Float64Array.from(br),xi=Float64Array.from(bi);
 for(let t=0;t<n;t++){const k=order[t],ar=xr[k],ai=xi[k];if(ar===0&&ai===0)continue;for(let q=Lp[t];q<Lp[t+1];q++){const i=Li[q],lr=Lr[q],li=Lm[q];xr[i]-=lr*ar-li*ai;xi[i]-=lr*ai+li*ar}}
 for(let t=n-1;t>=0;t--){const k=order[t];let vr=xr[k],vi=xi[k];for(let q=Up[t];q<Up[t+1];q++){const j=Uj[q],ur=Ur[q],ui=Um[q];vr-=ur*xr[j]-ui*xi[j];vi-=ur*xi[j]+ui*xr[j]}const z=cdiv(vr,vi,dr[k],dm[k]);xr[k]=z[0];xi[k]=z[1]}
 for(let k=0;k<n;k++)if(!Number.isFinite(xr[k])||!Number.isFinite(xi[k]))throw rangeError();
 return [xr,xi];
}
function localRows(net,list,loc,extra){return list.map(g=>{const out=new Map();for(const [j,v] of net.Y[g]){const k=loc[j];if(k>=0)out.set(k,C(v.r,v.i))}const e=extra?.get(g);if(e){const k=loc[g];out.set(k,add(out.get(k)||C(),e))}return out})}
function residualCheck(net,list,loc,x,b){let worst=0;for(let a=0;a<list.length;a++){let r=-b[0][a],i=-b[1][a],scaleSum=Math.hypot(b[0][a],b[1][a]);for(const [j,v] of net.Y[list[a]]){const k=loc[j];if(k<0)continue;const pr=v.r*x[0][k]-v.i*x[1][k],pi=v.r*x[1][k]+v.i*x[0][k];r+=pr;i+=pi;scaleSum+=Math.hypot(pr,pi)}if(scaleSum>0)worst=Math.max(worst,Math.hypot(r,i)/scaleSum)}if(!(worst<=1e-9))throw Error('Large-network solver accuracy check failed (relative residual '+worst.toExponential(2)+'). Check for extreme impedance ratios or floating sections.')}
export function calculateScaled(net,p,{only=null,compact:forceCompact}={}){
 net.project=p;
 const n=net.buses.length,branches=net.branches,hbc=hasBranchCurrents(p),selected=only??p.selectedBus;
 const badj=Array.from({length:n},()=>[]);branches.forEach((e,k)=>{badj[e.i].push(k);if(e.j!==e.i)badj[e.j].push(k)});
 const compId=new Int32Array(n).fill(-1),comps=[];
 for(let s=0;s<n;s++){if(compId[s]>=0)continue;const id=comps.length,q=[s];compId[s]=id;for(let h=0;h<q.length;h++)for(const j of net.adj[q[h]])if(compId[j]<0){compId[j]=id;q.push(j)}q.sort((a,b)=>a-b);comps.push({list:q})}
 for(const c of comps){c.sources=[];c.branches=[]}
 for(const s of net.sources)comps[compId[s.i]].sources.push(s);
 branches.forEach((e,k)=>comps[compId[e.i]].branches.push(k));
 const work=n*Math.max(1,branches.length)*Math.max(1,net.sources.length),compact=forceCompact??work>COMPACT_WORK;
 const pathEntry=branches.map(e=>({id:e.id,name:e.name,kind:e.kind,from:e.from,to:e.to,ohms:e.ohms,atVoltage:net.buses[e.j].voltage}));
 const trees=new Map();
 const tree=root=>{let t=trees.get(root);if(t)return t;const parent=new Int32Array(n).fill(-2),via=new Int32Array(n).fill(-1),q=[root];parent[root]=-1;for(let h=0;h<q.length;h++){const u=q[h];for(const k of badj[u]){const e=branches[k],j=e.i===u?e.j:e.i;if(parent[j]===-2){parent[j]=u;via[j]=k;q.push(j)}}}t={parent,via};trees.set(root,t);return t};
 const pathOf=(src,f)=>{const {parent,via}=tree(src.i);if(parent[f]===-2)return [];const out=[];for(let cur=f;cur!==src.i;cur=parent[cur])out.push(via[cur]);return out.reverse()};
 const coef=branches.map(e=>({c:div(e.y,conj(e.tap)),inv:div(C(1),e.tap)}));
 const branchConstants=c=>{if(c.K)return c.K;const mb=c.branches.length,K={mb,cr:new Float64Array(mb),ci:new Float64Array(mb),yr:new Float64Array(mb),yi:new Float64Array(mb),ca:new Float64Array(mb),ya:new Float64Array(mb)};c.branches.forEach((k,q)=>{const e=branches[k],cc=coef[k].c,bi=networkBaseI(net,net.buses[e.i].voltage),bj=networkBaseI(net,net.buses[e.j].voltage);K.cr[q]=cc.r*bi;K.ci[q]=cc.i*bi;K.yr[q]=-e.y.r*bj;K.yi[q]=-e.y.i*bj;K.ca[q]=abs(cc)*bi;K.ya[q]=abs(e.y)*bj});c.K=K;c.env={toVal:new Float64Array(mb),toRow:new Array(mb).fill(null),toF:new Int32Array(mb),maxVal:new Float64Array(mb),maxRow:new Array(mb).fill(null),maxF:new Int32Array(mb)};return K};
 const prepare=c=>{if(c.prep!==undefined)return c.prep;
  try{const loc=new Int32Array(n).fill(-1);c.list.forEach((g,k)=>loc[g]=k);c.loc=loc;
   c.meshed=c.branches.length>=c.list.length;
   c.xrKnown=c.sources.filter(s=>!s.current).every(s=>s.method==='impedance'||number(s.xr))&&c.branches.every(k=>branches[k].kind!=='transformer'||number(branches[k].xr));
   if(!c.sources.some(s=>!s.current)){c.prep=null;return null}
   const F=sparseFactor(localRows(net,c.list,loc)),N=c.list.length,P=new Map();
   for(const s of c.sources){if(P.has(s.id))continue;const b=[new Float64Array(N),new Float64Array(N)];b[0][loc[s.i]]=s.injection.r;b[1][loc[s.i]]=s.injection.i;const x=sparseSolve(F,b[0],b[1]);residualCheck(net,c.list,loc,x,b);P.set(s.id,x)}
   const dP=new Map();for(const s of c.sources){const [pr,pi]=P.get(s.id),d=new Float64Array(2*c.branches.length);c.branches.forEach((k,q)=>{const e=branches[k],a=loc[e.i],b=loc[e.j],v=coef[k].inv;d[2*q]=pr[a]*v.r-pi[a]*v.i-pr[b];d[2*q+1]=pr[a]*v.i+pi[a]*v.r-pi[b]});dP.set(s.id,d)}
   const m2=2*c.branches.length,dPk=new Float64Array(m2);for(const s of c.sources)if(!(s.current&&s.unknownAngle)){const d=dP.get(s.id);for(let q=0;q<m2;q++)dPk[q]+=d[q]}
   const us=c.sources.filter(s=>s.current&&s.unknownAngle),U=us.length,mb=c.branches.length,dPU=new Float64Array(2*U*mb);us.forEach((s,h)=>{const d=dP.get(s.id);for(let q=0;q<mb;q++){dPU[2*(q*U+h)]=d[2*q];dPU[2*(q*U+h)+1]=d[2*q+1]}});
   c.prep={F,P,dP,dPk,dPU};return c.prep}catch(error){c.prep={error};return c.prep}};
 const results=new Array(n);
 const targets=only===null?net.buses.map((_,k)=>k):[net.at.get(only)];
 for(const f of targets){
  const bus=net.buses[f],c=comps[compId[f]],srcs=c.sources;
  if(!srcs.length){results[f]={busId:bus.id,busName:bus.name,voltage:bus.voltage,status:'DISCONNECTED / NO ACTIVE SOURCE',totalA:null,issues:net.issues};continue}
  try{
   const prep=prepare(c);if(prep?.error)throw prep.error;
   const loc=c.loc,N=c.list.length,lf=loc[f],zf=C(p.settings.faultR||0,p.settings.faultX||0),faultZpu=scale(zf,1/baseZ(bus.voltage,net.base)),busI=networkBaseI(net,bus.voltage);
   const per=[];let zth=null,Zf=null;
   if(prep){const b=[new Float64Array(N),new Float64Array(N)];b[0][lf]=1;Zf=sparseSolve(prep.F,b[0],b[1]);zth=scale(C(Zf[0][lf],Zf[1][lf]),baseZ(bus.voltage,net.base));
    for(const s of srcs){const [pr,pi]=prep.P.get(s.id),ipu=div(C(pr[lf],pi[lf]),add(C(Zf[0][lf],Zf[1][lf]),faultZpu)),k=loc[s.i];per.push({s,ipu,vAt:a=>C(pr[a]-(Zf[0][a]*ipu.r-Zf[1][a]*ipu.i),pi[a]-(Zf[0][a]*ipu.i+Zf[1][a]*ipu.r)),term:C(pr[k]-(Zf[0][k]*ipu.r-Zf[1][k]*ipu.i),pi[k]-(Zf[0][k]*ipu.i+Zf[1][k]*ipu.r))})}}
   else{const bolted=abs(faultZpu)<1e-14,unknown=c.list.filter(i=>!bolted||i!==f),uloc=new Int32Array(n).fill(-1);unknown.forEach((g,k)=>uloc[g]=k);
    const extra=bolted?null:new Map([[f,div(C(1),faultZpu)]]),F=sparseFactor(localRows(net,unknown,uloc,extra));
    for(const s of srcs){const b=[new Float64Array(unknown.length),new Float64Array(unknown.length)];if(uloc[s.i]>=0){b[0][uloc[s.i]]=s.injection.r;b[1][uloc[s.i]]=s.injection.i}const x=sparseSolve(F,b[0],b[1]);
     const V=g=>uloc[g]>=0?C(x[0][uloc[g]],x[1][uloc[g]]):C();let ipu;
     if(bolted){ipu=s.i===f?s.injection:C();for(const [j,v] of net.Y[f])if(uloc[j]>=0)ipu=sub(ipu,mul(v,V(j)))}else ipu=div(V(f),faultZpu);
     per.push({s,ipu,vAt:a=>V(c.list[a]),term:V(s.i)})}}
   let total=C(),conventional=C(),derKnown=C(),derBound=0;const details=[];
   const full=!compact||f===net.at.get(selected);
   for(const {s,ipu,vAt,term} of per){const amps=scale(ipu,busI);total=add(total,amps);if(s.current){if(s.unknownAngle)derBound+=abs(amps);else derKnown=add(derKnown,amps)}else conventional=add(conventional,amps);
    const pathIdx=pathOf(s,f),busPhaseScale=s.voltage/bus.voltage;let pathSeriesZ=s.impedance?scale(s.impedance,busPhaseScale**-2):C();for(const k of pathIdx){const e=branches[k];pathSeriesZ=add(pathSeriesZ,scale(e.ohms,(bus.voltage/net.buses[e.j].voltage)**2))}
    let flows=[];if(hbc&&full){const list=compact?pathIdx:c.branches;flows=list.map(k=>{const e=branches[k],vi=vAt(loc[e.i]),vj=vAt(loc[e.j]),drop=sub(div(vi,e.tap),vj),fromPhasor=scale(mul(coef[k].c,drop),networkBaseI(net,net.buses[e.i].voltage)),toPhasor=scale(mul(e.y,drop),-networkBaseI(net,net.buses[e.j].voltage));return {id:e.id,name:e.name,kind:e.kind,from:e.from,to:e.to,amps:abs(fromPhasor),toAmps:abs(toPhasor),fromPhasor,toPhasor}})}
    details.push({sourceId:s.id,name:s.name,kind:s.kind,current:s.current,expired:s.expired,unknownAngle:s.unknownAngle,amps:abs(amps),phasor:amps,sourceImpedance:s.impedance,pathSeriesZ,sourceImpedanceAtFault:s.impedance?scale(s.impedance,busPhaseScale**-2):null,terminalA:s.current?s.amps:abs(s.injection)*networkBaseI(net,s.voltage),path:full?pathIdx.map(k=>pathEntry[k]):[],meshed:c.meshed,branchFlows:flows,terminalVoltagePu:abs(term),_path:pathIdx})}
   let branchFlows=[];
   if(hbc){
    if(!compact)branchFlows=combineBranchFlows(details);
    else{const keep=new Set(full?c.branches:badj[f]);if(!full){const count=new Map(),dist=new Map();let near=Infinity;for(const d of details){const L=d._path.length;d._path.forEach((k,x)=>{if(!branches[k].deviceId)return;count.set(k,(count.get(k)||0)+1);const g=L-1-x;if(!(dist.get(k)<=g))dist.set(k,g);near=Math.min(near,g)})}for(const [k,g] of dist)if(g<=near+2||count.get(k)===details.length)keep.add(k)}
     const dZ=new Float64Array(2*c.branches.length);
     c.branches.forEach((k,q)=>{const e=branches[k],a=loc[e.i],b=loc[e.j],v=coef[k].inv;if(Zf){dZ[2*q]=Zf[0][a]*v.r-Zf[1][a]*v.i-Zf[0][b];dZ[2*q+1]=Zf[0][a]*v.i+Zf[1][a]*v.r-Zf[1][b]}});
     const rows=[],known=per.filter(x=>!(x.s.current&&x.s.unknownAngle)),unknownSrc=per.filter(x=>x.s.current&&x.s.unknownAngle),U=unknownSrc.length,uR=new Float64Array(U),uI=new Float64Array(U);
     let kR=0,kI=0;for(const x of known){kR+=x.ipu.r;kI+=x.ipu.i}unknownSrc.forEach((x,h)=>{uR[h]=x.ipu.r;uI[h]=x.ipu.i});
     const K=prep?.K||branchConstants(c);
     for(let q=0;q<K.mb;q++){const k=c.branches[q],q2=2*q,zr=dZ[q2],zi=dZ[q2+1];let xr=0,xi=0,su=0;
      if(prep){xr=prep.dPk[q2]-(zr*kR-zi*kI);xi=prep.dPk[q2+1]-(zr*kI+zi*kR);const D=prep.dPU,o=2*q*U;for(let h=0;h<U;h++){const ir=uR[h],ii=uI[h],ar=D[o+2*h]-(zr*ir-zi*ii),ai=D[o+2*h+1]-(zr*ii+zi*ir);su+=Math.sqrt(ar*ar+ai*ai)}}
      else{const e=branches[k],dropOf=x=>sub(div(x.vAt(loc[e.i]),e.tap),x.vAt(loc[e.j]));for(const x of known){const d=dropOf(x);xr+=d.r;xi+=d.i}for(const x of unknownSrc)su+=abs(dropOf(x))}
      const fr=K.cr[q]*xr-K.ci[q]*xi,fi=K.cr[q]*xi+K.ci[q]*xr,tr=K.yr[q]*xr-K.yi[q]*xi,ti=K.yr[q]*xi+K.yi[q]*xr,fb=K.ca[q]*su,tb=K.ya[q]*su;
      const fromA=Math.sqrt(fr*fr+fi*fi)+fb,toA=Math.sqrt(tr*tr+ti*ti)+tb;
      if(!Number.isFinite(fromA)||!Number.isFinite(toA))throw Error('Branch current exceeds numerical range. Check input values and units.');
      let row=null;const make=()=>{if(!row){const e=branches[k];row={id:e.id,name:e.name,kind:e.kind,from:e.from,to:e.to,fromPhasor:{r:fr,i:fi},toPhasor:{r:tr,i:ti},fromBoundA:fb,toBoundA:tb,fromA,toA,bound:fb>0||tb>0,_k:k}}return row};
      if(keep.has(k))rows.push(make());
      if(only===null){const E=c.env;const mx=fromA>toA?fromA:toA;if(E.toRow[q]===null||toA>E.toVal[q]){E.toVal[q]=toA;E.toRow[q]=make();E.toF[q]=f}if(E.maxRow[q]===null||mx>E.maxVal[q]){E.maxVal[q]=mx;E.maxRow[q]=make();E.maxF[q]=f}}}
     branchFlows=rows}}
   for(const d of details)delete d._path;
   results[f]=finishScaled(net,p,f,bus,srcs,details,total,conventional,derKnown,derBound,zth,c.xrKnown,branchFlows,{compact,full});
  }catch(e){results[f]={busId:bus.id,busName:bus.name,voltage:bus.voltage,status:'NETWORK ERROR',totalA:null,faultNote:e.message,issues:net.issues}}
 }
 if(compact){
  const extra=new Map();
  for(const c of comps){if(!c.env)continue;const E=c.env;for(let q=0;q<c.branches.length;q++)for(const w of [{f:E.toF[q],row:E.toRow[q]},{f:E.maxF[q],row:E.maxRow[q]}]){if(!w.row)continue;const r=results[w.f];if(!r||r.totalA===null||!Array.isArray(r.branchFlows))continue;if(!r.branchFlows.includes(w.row)){let set=extra.get(w.f);if(!set)extra.set(w.f,set=new Set());set.add(w.row)}}}
  for(const [f,set] of extra){const r=results[f];r.branchFlows=[...r.branchFlows,...set].sort((a,b)=>a._k-b._k)}
  for(const r of results)for(const e of r?.branchFlows||[])delete e._k;
 }else for(const r of results)for(const e of r?.branchFlows||[])delete e._k;
 return {results};
}
function finishScaled(net,p,f,bus,sources,details,total,conventional,derKnown,derBound,zth,xrKnownAll,branchFlows,{compact,full}){
 let totalA=abs(add(conventional,derKnown))+derBound,bound=derBound>0;const xrKnown=xrKnownAll;const zDuty=zth?add(zth,C(p.settings.faultR||0,p.settings.faultX||0)):null;const xr=zDuty&&zDuty.r>=0?(zDuty.r===0?Infinity:zDuty.i/zDuty.r):null;let peak=null,asym=null;
 const srcOf=new Map(net.sources.map(s=>[s.id,s]));
 if(xrKnown&&zth&&xr!==null){const convPeak=Math.sqrt(2)*(1.02+.98*(xr===Infinity?1:Math.exp(-3/Math.max(xr,1e-8))))*abs(conventional);const currentDetails=details.filter(d=>d.current&&!d.expired),allPeak=currentDetails.every(d=>srcOf.get(d.sourceId).peakA>0);if(allPeak)peak=convPeak+currentDetails.reduce((sum,d)=>{const s=srcOf.get(d.sourceId);return sum+s.peakA*s.strengthFactor*(s.amps>0?d.amps/s.amps:0)},0);if(!currentDetails.length){const tau=xr/(2*Math.PI*p.settings.frequency);asym=Math.hypot(totalA,Math.sqrt(2)*abs(conventional)*(xr===0?0:xr===Infinity?1:Math.exp(-p.settings.time/Math.max(tau,1e-12))))}}
 if(!sources.some(s=>!s.current)){const active=details.filter(d=>d.current&&!d.expired&&d.amps>0);if(active.every(d=>srcOf.get(d.sourceId).peakA>0))peak=active.reduce((sum,d)=>{const s=srcOf.get(d.sourceId);return sum+s.peakA*s.strengthFactor*(s.amps>0?d.amps/s.amps:0)},0)}
 let faultNote=null,sequence=null,dlgResult=null;if(!hasBranchCurrents(p)){if(details.some(d=>d.current&&!d.expired)){totalA=null;faultNote='Unbalanced inverter fault data is missing. Supply manufacturer positive/negative/zero-sequence control behavior.'}else if(!zth){totalA=null;faultNote='No conventional Thevenin sequence model is available.'}else{const seq=bus.sequence||{},z2=number(seq.r2)&&seq.r2>=0&&number(seq.x2)&&seq.x2>=0&&abs(C(seq.r2,seq.x2))>0?C(seq.r2,seq.x2):((p.settings.faultType==='dlg'?p.settings.assumeZ2===true:p.settings.assumeZ2)?zth:null),zf=C(p.settings.faultR||0,p.settings.faultX||0),vth=mul(conventional,add(zth,zf));sequence={z1:zth,z2,z0:null,faultZ:zf,referenceVoltage:vth};if(!z2){totalA=null;faultNote='Enter equivalent negative-sequence R2 and X2 at this bus, or explicitly select Z2 = Z1 screening.'}else if(p.settings.faultType==='ll')totalA=abs(div(scale(vth,Math.sqrt(3)),add(add(zth,z2),zf)));else if(number(seq.r0)&&seq.r0>=0&&number(seq.x0)&&seq.x0>=0&&abs(C(seq.r0,seq.x0))>0){sequence.z0=C(seq.r0,seq.x0);if(p.settings.faultType==='dlg'){dlgResult=calculateDlg(sequence);totalA=dlgResult.totalA;}else totalA=abs(div(scale(vth,3),add(add(add(zth,z2),sequence.z0),scale(zf,3))));}else{totalA=null;faultNote=(p.settings.faultType==='dlg'?'DLG':'SLG')+' requires equivalent R0 and X0 at this bus, including transformer grounding paths and neutral impedance. No ground-fault value is invented.'}}peak=null;asym=null;bound=false}
 if(isSinglePhase(p)){peak=null;asym=null;faultNote=singlePhaseScope;}
 if(branchFlows.some(e=>!Number.isFinite(e.fromA)||!Number.isFinite(e.toA)||!finiteComplex(e.fromPhasor)||!finiteComplex(e.toPhasor)))throw Error('Branch current exceeds numerical range. Check input values and units.');
 if((totalA!==null&&(!Number.isFinite(totalA)||totalA<0))||[peak,asym].some(v=>v!==null&&(!Number.isFinite(v)||v<0))||!finiteComplex(conventional)||details.some(d=>!Number.isFinite(d.amps)||!finiteComplex(d.phasor))||(zth&&!finiteComplex(zth)))throw rangeError();
 const hbc=hasBranchCurrents(p);
 return {...(dlgResult||{}),...(isSinglePhase(p)?{phaseModel:'single-phase-ll'}:{}),busId:bus.id,busName:bus.name,voltage:bus.voltage,status:totalA===null?'DATA REQUIRED':bound?'SCREENING BOUND':'CALCULATED',totalA,conventionalA:hbc?abs(conventional):null,derBound:hbc?derBound:0,details:hbc?details:[],branchFlows:hbc?branchFlows:[],sequence,zth,xr:xrKnown&&hbc?xr:null,peakA:peak,asymA:asym,faultNote,bound,issues:net.issues,groups:hbc?details.reduce((o,d)=>(o[d.kind]=(o[d.kind]||0)+d.amps,o),{}):{},solver:'sparse-lu',...(compact?{outputScope:'compact',detailScope:full?'full':'summary'}:{})}
}
