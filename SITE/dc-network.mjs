// Pure, additive DC full-loop equivalent. No imports from the AC engine.
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const positive=x=>finite(x)&&x>0;
const real=r=>({r,i:0});
const reference=x=>typeof x.dataReference==='string'&&x.dataReference.trim().length>0;
const included=(x,p)=>x.enabled!==false&&(p.settings.scenario!=='maximum'||x.maxInclude!==false)&&(p.settings.scenario!=='minimum'||x.minInclude!==false);
const conducting=(e,p)=>e.enabled!==false&&(!e.deviceId||p.devices.find(d=>d.id===e.deviceId)?.enabled!==false);
export const isDcStudy=p=>p?.settings?.faultType==='dc';
export const dcScope=()=> 'Resistive steady-state prospective DC pole-to-pole fault current in an explicitly documented full-loop equivalent network. Matched outgoing and return topology is required; shared/asymmetric returns and earth faults require a separate conductor model. Linear voltage sources only. No inductance, capacitor discharge, battery dynamics, converter control, peak, interrupting duty or IEC 61660 compliance is calculated. Source contributions use superposition; actual source terminal currents include circulation between unequal sources.';
function resistance(e){
 if(e.kind==='link')return 0;
 if(e.dcLoopResistanceOhm!==undefined&&e.dcLoopResistanceOhm!==null)return e.dcLoopResistanceOhm;
 return e.rPerM*e.length/e.runs*(e.dcResistanceBasis==='matched-pair'?2:1);
}
export function validateDcProject(p){
 const issues=[],flag=(id,message,severity='error')=>issues.push({id,message,severity});
 if(!record(p)||!record(p.settings)||!['buses','sources','branches','devices'].every(k=>Array.isArray(p[k]))){flag('project','DC project requires a settings object and bus/source/branch/device arrays.');return issues;}
 // Guard raw public inputs before any item property access or topology maps.
 for(const key of ['buses','sources','branches','devices'])if(Array.from(p[key]).some(x=>!record(x)))flag('project','DC '+key+' must contain equipment objects only; null, sparse and primitive entries are invalid.');
 if(p.inputErrors!==undefined&&(!Array.isArray(p.inputErrors)||Array.from(p.inputErrors).some(e=>!record(e)||typeof e.id!=='string'||typeof e.message!=='string')))flag('project','DC edited-field errors must be an array of valid issue objects.');
 if(issues.length)return issues;
 if(!isDcStudy(p))flag('settings','DC calculation requires faultType dc.');
 if(!finite(p.settings.faultR)||p.settings.faultR<0)flag('settings','DC fault resistance must be an explicit nonnegative finite number in ohms.');
 if(p.settings.faultX!==0)flag('settings','DC fault reactance must be 0; transient inductance is outside this model.');
 if(p.settings.scenario!=='base')flag('settings','DC scenario must be base. Enter documented source voltage/resistance for each separate operating case.');
 if(p.settings.voltageFactor!==1)flag('settings','DC voltage factor must be 1; enter the actual documented DC source voltage.');
 for(const e of p.inputErrors||[])flag(e.id,e.message);
 const ids=new Set(),buses=new Map(p.buses.map(b=>[b.id,b]));
 for(const x of [...p.buses,...p.sources,...p.branches,...p.devices]){
  if(typeof x.id!=='string'||!x.id||ids.has(x.id))flag(x.id||'project','Missing or duplicate internal ID.');ids.add(x.id);
  for(const key of ['enabled','maxInclude','minInclude'])if(x[key]!==undefined&&typeof x[key]!=='boolean')flag(x.id,key+' must be true or false.');
 }
 for(const b of p.buses)if(!positive(b.voltage))flag(b.id,'DC bus nominal voltage must be a positive finite number in volts.');
 for(const s of p.sources){if(!included(s,p))continue;
  if(!buses.has(s.bus))flag(s.id,'DC source connection missing.');
  if(s.quantity!==undefined&&s.quantity!==1)flag(s.id,'DC source quantity must be 1; explicitly enter the combined full-loop equivalent or model separate sources.');
  if(!['other','otherSource'].includes(s.kind)||s.model!=='voltage'||s.dcModel!=='resistive-voltage')flag(s.id,'DC source requires Other source, voltage model and explicit resistive-voltage DC model. AC utility/generator/motor/inverter and current-control models are unsupported.');
  if(!positive(s.voltage))flag(s.id,'DC source voltage must be a positive finite number in volts.');
  if(!positive(s.dcResistanceOhm)||!positive(1/s.dcResistanceOhm))flag(s.id,'DC source full-loop resistance must be positive, finite and numerically representable in ohms.');
  if(s.dcResistanceBasis!=='full-loop')flag(s.id,'DC source resistance basis must explicitly be full-loop.');
  if(!reference(s))flag(s.id,'DC source requires a documented data reference for voltage and full-loop resistance.');
 }
 for(const e of p.branches){if(!conducting(e,p))continue;
  const a=buses.get(e.from),b=buses.get(e.to);
  if(!a||!b)flag(e.id,'DC branch connection missing.');
  if(e.kind==='cable'&&e.from===e.to)flag(e.id,'DC cable must connect different buses.');
  if(!['cable','link'].includes(e.kind)){flag(e.id,'DC transformer and other conversion branches are unsupported.');continue;}
  if(a&&b&&Math.abs(a.voltage-b.voltage)>1e-6*Math.max(a.voltage,b.voltage))flag(e.id,'DC cable/link connection cannot change nominal voltage.');
  if(e.kind==='link'){
   if(e.deviceId&&!p.devices.some(d=>d.id===e.deviceId&&d.linkId===e.id&&d.bus===e.to))flag(e.id,'DC internal device connection is missing or inconsistent.');
   flag(e.id,'Exact ideal link: available bus fault current is calculated; ideal-link branch current is unavailable and omitted (no invented resistance).','warning');continue;
  }
  if(!reference(e))flag(e.id,'DC cable requires a documented data reference for its full-loop resistance and return topology.');
  if(e.dcLoopResistanceOhm===undefined||e.dcLoopResistanceOhm===null){
   if(!['full-loop','matched-pair'].includes(e.dcResistanceBasis))flag(e.id,'DC cable resistance basis must be full-loop or documented matched-pair; AC resistance is not automatically DC data.');
   if(!positive(e.rPerM)||!positive(e.length)||!Number.isInteger(e.runs)||e.runs<1)flag(e.id,'DC cable requires positive resistance per meter, positive stored length in meters and integer parallel runs.');
  }
  const r=resistance(e);if(!positive(r)||!positive(1/r))flag(e.id,'DC cable full-loop resistance must be positive, finite and numerically representable in ohms; use a link for an ideal connection.');
 }
 for(const d of p.devices)if(d.enabled!==false){
  if(!['switchgear','disconnect','panel','otherEquipment'].includes(d.kind))flag(d.id,'DC equipment kind is unsupported.');
  if(!buses.has(d.bus))flag(d.id,'DC device connection missing.');
 }
 flag('settings',dcScope(),'warning');
 return issues;
}
export function buildDcNetwork(p){
 const issues=validateDcProject(p),errors=issues.filter(x=>x.severity==='error');
 const net={issues,errors,dc:true,phaseModel:'dc-resistive',buses:Array.isArray(p?.buses)?p.buses.filter(record):[],sources:[],branches:[],at:{},nodeAt:[],adj:[],Y:[]};
 if(errors.length)return net;
 net.at=Object.fromEntries(p.buses.map((b,i)=>[b.id,i]));
 const root=p.buses.map((_,i)=>i),find=i=>{while(root[i]!==i)i=root[i];return i;};
 for(const e of p.branches)if(conducting(e,p)&&e.kind==='link'){const i=find(net.at[e.from]),j=find(net.at[e.to]);root[j]=i;}
 const roots=[...new Set(root.map((_,i)=>find(i)))],rootIndex=new Map(roots.map((r,k)=>[r,k]));net.nodeAt=root.map((_,i)=>rootIndex.get(find(i)));
 // V31: plant-scale DC arrays keep the conductance matrix sparse (rows of Map); small ones keep the dense matrix.
 net.sparseY=roots.length>DC_SPARSE_NODES;net.Y=net.sparseY?roots.map(()=>new Map()):roots.map(()=>roots.map(()=>0));net.adj=roots.map(()=>[]);
 const addY=(a,b,g)=>{if(net.sparseY)net.Y[a].set(b,(net.Y[a].get(b)||0)+g);else net.Y[a][b]+=g};
 for(const e of p.branches){if(!conducting(e,p))continue;const i=net.at[e.from],j=net.at[e.to],a=net.nodeAt[i],b=net.nodeAt[j],r=resistance(e);net.branches.push({...e,i,j,a,b,resistanceOhm:r,ohms:real(r)});
  if(a===b||r===0)continue;const g=1/r;addY(a,a,g);addY(b,b,g);addY(a,b,-g);addY(b,a,-g);net.adj[a].push(b);net.adj[b].push(a);
 }
 for(const s of p.sources){if(!included(s,p))continue;const i=net.at[s.bus],node=net.nodeAt[i],g=1/s.dcResistanceOhm;addY(node,node,g);net.sources.push({...s,i,node,current:false,impedance:real(s.dcResistanceOhm),conductance:g,injection:s.voltage*g});}
 if(net.Y.some(row=>(net.sparseY?[...row.values()]:row).some(x=>!finite(x)))||net.sources.some(s=>!finite(s.injection))) {
  const issue={id:'settings',message:'DC conductance/injection exceeds numerical range. Check resistance and voltage units.',severity:'error'};net.issues.push(issue);net.errors.push(issue);
 }
 return net;
}
// Row-scaled real Gaussian elimination, independent from complex AC factorization.
function solve(matrix,rhs){
 const n=rhs.length;if(n===0)return [];
 const original=matrix.map(r=>r.slice()),originalRhs=rhs.slice();
 const a=matrix.map((row,i)=>{const norm=Math.max(...row.map(Math.abs));if(!positive(norm)||!finite(rhs[i]))throw Error('DC network is singular or exceeds numerical range.');return [...row.map(x=>x/norm),rhs[i]/norm];});
 for(let k=0;k<n;k++){
  let pivot=k;for(let i=k+1;i<n;i++)if(Math.abs(a[i][k])>Math.abs(a[pivot][k]))pivot=i;
  if(!finite(a[pivot][k])||Math.abs(a[pivot][k])<1e-13)throw Error('DC network is singular or ill-conditioned; check extreme resistance ratios.');
  [a[k],a[pivot]]=[a[pivot],a[k]];
  for(let i=k+1;i<n;i++){const m=a[i][k]/a[k][k];for(let j=k+1;j<=n;j++)a[i][j]-=m*a[k][j];a[i][k]=0;}
 }
 const x=new Array(n);for(let i=n-1;i>=0;i--){let v=a[i][n];for(let j=i+1;j<n;j++)v-=a[i][j]*x[j];x[i]=v/a[i][i];if(!finite(x[i]))throw Error('DC calculation exceeds numerical range.');}
 for(let i=0;i<n;i++){let sum=0,scale=Math.abs(originalRhs[i]);for(let j=0;j<n;j++){sum+=original[i][j]*x[j];scale+=Math.abs(original[i][j]*x[j]);}if(!finite(sum)||!finite(scale)||Math.abs(sum-originalRhs[i])>1e-9*Math.max(Number.MIN_VALUE,scale))throw Error('DC solution fails numerical KCL residual check.');}
 return x;
}
const component=(net,f)=>{const ids=[f],seen=new Set(ids);for(let k=0;k<ids.length;k++)for(const n of net.adj[ids[k]])if(!seen.has(n)){seen.add(n);ids.push(n);}return ids;};
function response(net,comp,f,faultR,sources){
 const bolted=faultR===0,unknown=comp.filter(n=>!bolted||n!==f),rhs=unknown.map(n=>sources.reduce((v,s)=>v+(s.node===n?s.injection:0),0)),m=unknown.map(n=>unknown.map(j=>net.Y[n][j]));
 if(!bolted){const at=unknown.indexOf(f);m[at][at]+=1/faultR;}
 if(m.some(r=>r.some(x=>!finite(x))))throw Error('DC fault conductance exceeds numerical range.');
 const v=net.Y.map(()=>0);solve(m,rhs).forEach((x,k)=>v[unknown[k]]=x);
 let amps;if(bolted){amps=sources.filter(s=>s.node===f).reduce((n,s)=>n+s.injection,0);for(const n of comp)if(n!==f)amps-=net.Y[f][n]*v[n];}else amps=v[f]/faultR;
 if(!finite(amps))throw Error('DC fault current exceeds numerical range.');
 return {v,amps};
}
function branchFlows(net,comp,v){return net.branches.filter(e=>e.resistanceOhm>0&&comp.includes(e.a)).map(e=>{const signed=(v[e.a]-v[e.b])/e.resistanceOhm;if(!finite(signed))throw Error('DC branch current exceeds numerical range.');return {id:e.id,name:e.name,kind:e.kind,from:e.from,to:e.to,signedA:signed,amps:Math.abs(signed),toAmps:Math.abs(signed),fromA:Math.abs(signed),toA:Math.abs(signed),fromPhasor:real(signed),toPhasor:real(-signed),fromBoundA:0,toBoundA:0,bound:false};});}
export function calculateDcBus(net,p,busId,options={}){
 const bus=(net.busById??=new Map(net.buses.map(b=>[b.id,b]))).get(busId),base={busId,busName:bus?.name,voltage:bus?.voltage,phaseModel:'dc-resistive',quantity:'Steady-state prospective DC fault current',units:'A',totalA:null,signedA:null,conventionalA:null,derBound:0,peakA:null,asymA:null,xr:null,bound:false,details:[],branchFlows:[],groups:{},zth:null,sequence:null,faultNote:dcScope(),issues:net.issues};
 if(net.errors.length)return {...base,status:'INPUT REQUIRED'};
 if(!bus)return {...base,status:'MISSING BUS'};
 const f=net.nodeAt[net.at[busId]];
 if(net.sparseY||options.factored||componentSize(net,f)>DC_FACTOR_MIN)return factoredDcBus(net,p,f,base,options);
 const comp=component(net,f),sources=net.sources.filter(s=>comp.includes(s.node));
 if(!sources.length)return {...base,status:'DISCONNECTED / NO ACTIVE SOURCE'};
 try {
  const {v,amps}=response(net,comp,f,p.settings.faultR,sources),flows=branchFlows(net,comp,v);
  const details=sources.map(s=>{const one=response(net,comp,f,p.settings.faultR,[s]);return {sourceId:s.id,name:s.name,kind:s.kind,current:false,expired:false,unknownAngle:false,amps:Math.abs(one.amps),signedA:one.amps,phasor:real(one.amps),sourceImpedance:s.impedance,sourceImpedanceAtFault:s.impedance,pathSeriesZ:null,path:[],meshed:net.branches.filter(e=>e.resistanceOhm>0&&comp.includes(e.a)).length>=comp.length,terminalA:Math.abs((s.voltage-v[s.node])/s.dcResistanceOhm),terminalVoltagePu:v[s.node]/s.voltage,branchFlows:branchFlows(net,comp,one.v)};});
  const matrix=comp.map(n=>comp.map(j=>net.Y[n][j])),z=solve(matrix,comp.map(n=>n===f?1:0))[comp.indexOf(f)];if(!positive(z))throw Error('DC Thevenin resistance is outside numerical range.');
  const terminal=sources.map(s=>({sourceId:s.id,signedA:(s.voltage-v[s.node])/s.dcResistanceOhm,amps:Math.abs((s.voltage-v[s.node])/s.dcResistanceOhm)}));
  if(terminal.some(s=>!finite(s.signedA))||details.some(d=>!finite(d.terminalA)||!finite(d.terminalVoltagePu)))throw Error('DC source terminal current exceeds numerical range.');
  // A good normalized matrix residual can hide cancellation in (E - V)/R.
  // Recheck physical terminal KCL against ampere-scale branch/fault currents.
  for(const node of comp){
   const injections=terminal.filter(t=>sources.find(s=>s.id===t.sourceId).node===node).map(t=>t.signedA);
   const exits=flows.flatMap(flow=>{const e=net.branches.find(e=>e.id===flow.id);return e.a===e.b?[]:e.a===node?[flow.signedA]:e.b===node?[-flow.signedA]:[];});
   if(node===f)exits.push(amps);
   const mismatch=injections.reduce((a,b)=>a+b,0)-exits.reduce((a,b)=>a+b,0),scale=[...injections,...exits].reduce((a,b)=>a+Math.abs(b),0);
   // An unloaded leaf can carry only roundoff-level (sub-nA) branch flows.
   // Relative-only KCL tests falsely reject it because both local sums approach zero;
   // include a conservative 1 A reference floor (absolute tolerance 1e-8 A).
   if(!finite(mismatch)||!finite(scale)||Math.abs(mismatch)>1e-8*Math.max(1,scale))throw Error('DC physical source/branch KCL fails numerical precision; check extreme resistance ratios.');
  }
  return {...base,status:'CALCULATED',totalA:Math.abs(amps),signedA:amps,conventionalA:Math.abs(amps),details,branchFlows:flows,zth:real(z),groups:details.reduce((o,d)=>(o[d.kind]=(o[d.kind]||0)+d.amps,o),{}),busVoltagesV:Object.fromEntries(net.buses.filter(b=>comp.includes(net.nodeAt[net.at[b.id]])).map(b=>[b.id,v[net.nodeAt[net.at[b.id]]]])),sourceTerminalCurrents:terminal,idealBranchCurrentsAvailable:!net.branches.some(e=>e.resistanceOhm===0&&comp.includes(e.a))};
 }catch(e){return {...base,status:'NETWORK ERROR',faultNote:e.message+' '+dcScope()};}
}
export function calculateDcProject(p,options={}){const net=buildDcNetwork(p);if(!net.errors.length){const work=net.buses.length*Math.max(1,net.branches.length)*Math.max(1,net.sources.length);net.compact=options.compact??work>DC_COMPACT_WORK;net.selectedBus=p.selectedBus}const results=net.buses.map(b=>calculateDcBus(net,p,b.id,options));if(net.compact)addDcEnvelope(net,results);return {issues:net.issues,results,net};}
// ===================== V31 plant-scale DC path =====================
// Same resistive superposition as above, but each connected array is factorized once (sparse, minimum-degree
// ordering) and every bus fault reuses it: V = P − Z(:,f)·I with I = P(f)/(Z(f,f)+Rf). Components of up to
// DC_FACTOR_MIN nodes keep the original per-fault elimination unchanged.
export const DC_FACTOR_MIN=40,DC_SPARSE_NODES=400,DC_COMPACT_WORK=4e5;
function components(net){if(net.compOf)return net.compOf;const n=net.adj.length,c=new Int32Array(n).fill(-1);let id=0;for(let s=0;s<n;s++){if(c[s]>=0)continue;const q=[s];c[s]=id;for(let h=0;h<q.length;h++)for(const j of net.adj[q[h]])if(c[j]<0){c[j]=id;q.push(j)}id++}net.compOf=c;return c}
function componentSize(net,f){const c=components(net);net.compSize??=(()=>{const m=new Map();for(const x of c)m.set(x,(m.get(x)||0)+1);return m})();return net.compSize.get(c[f])}
const yRow=(net,a)=>net.sparseY?net.Y[a]:new Map(net.Y[a].map((g,j)=>[j,g]).filter(([,g])=>g!==0));
function realFactor(rows){
 const n=rows.length,elim=new Uint8Array(n),order=new Int32Array(n),Lp=[0],Li=[],Lv=[],Up=[0],Uj=[],Uv=[],d=new Float64Array(n),heap=[];
 const scale=rows.map(r=>{let m=0;for(const v of r.values())m=Math.max(m,Math.abs(v));return m});
 const less=(a,b)=>a[0]<b[0]||(a[0]===b[0]&&a[1]<b[1]),deg=k=>rows[k].size-(rows[k].has(k)?1:0);
 const push=(x,k)=>{heap.push([x,k]);let c=heap.length-1;while(c>0){const q=(c-1)>>1;if(!less(heap[c],heap[q]))break;[heap[c],heap[q]]=[heap[q],heap[c]];c=q}};
 const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let c=0;for(;;){const l=2*c+1,r=l+1;let m=c;if(l<heap.length&&less(heap[l],heap[m]))m=l;if(r<heap.length&&less(heap[r],heap[m]))m=r;if(m===c)break;[heap[c],heap[m]]=[heap[m],heap[c]];c=m}}return top};
 for(let k=0;k<n;k++)push(deg(k),k);let t=0;
 while(t<n){const [x,k]=pop();if(elim[k]||x!==deg(k))continue;const row=rows[k],piv=row.get(k)||0;
  if(!finite(piv)||!(Math.abs(piv)>1e-13*Math.max(scale[k],Number.MIN_VALUE)))throw Error('DC network is singular or ill-conditioned; check extreme resistance ratios.');
  const urow=[];for(const [j,v] of row)if(j!==k)urow.push([j,v]);
  for(const [i] of urow){const ri=rows[i],aik=ri.get(k)||0;ri.delete(k);const l=aik/piv;Li.push(i);Lv.push(l);if(l===0)continue;for(const [j,u] of urow)ri.set(j,(ri.get(j)||0)-l*u)}
  for(const [j,v] of urow){Uj.push(j);Uv.push(v)}Lp.push(Li.length);Up.push(Uj.length);d[k]=piv;elim[k]=1;order[t++]=k;rows[k]=null;for(const [i] of urow)push(deg(i),i);
 }
 return {n,order,Lp:Int32Array.from(Lp),Li:Int32Array.from(Li),Lv:Float64Array.from(Lv),Up:Int32Array.from(Up),Uj:Int32Array.from(Uj),Uv:Float64Array.from(Uv),d};
}
function realSolve(F,b){const {n,order,Lp,Li,Lv,Up,Uj,Uv,d}=F,x=Float64Array.from(b);
 for(let t=0;t<n;t++){const k=order[t],a=x[k];if(a===0)continue;for(let q=Lp[t];q<Lp[t+1];q++)x[Li[q]]-=Lv[q]*a}
 for(let t=n-1;t>=0;t--){const k=order[t];let v=x[k];for(let q=Up[t];q<Up[t+1];q++)v-=Uv[q]*x[Uj[q]];x[k]=v/d[k]}
 for(let k=0;k<n;k++)if(!finite(x[k]))throw Error('DC calculation exceeds numerical range.');return x}
function prepareDc(net,f){
 const c=components(net),id=c[f];net.dcPrepared??=new Map();if(net.dcPrepared.has(id))return net.dcPrepared.get(id);
 let prep;try{
  const list=[];for(let k=0;k<c.length;k++)if(c[k]===id)list.push(k);const loc=new Map(list.map((g,k)=>[g,k]));
  const sources=net.sources.filter(s=>c[s.node]===id);
  if(!sources.length){prep={list,loc,sources};net.dcPrepared.set(id,prep);return prep}
  const rows=list.map(g=>{const m=new Map();for(const [j,v] of yRow(net,g)){const k=loc.get(j);if(k!==undefined)m.set(k,v)}return m});
  const F=realFactor(rows),N=list.length,P=new Float64Array(N),Ps=new Map();
  for(const s of sources){const b=new Float64Array(N);b[loc.get(s.node)]=s.injection;const x=realSolve(F,b);Ps.set(s.id,x);for(let k=0;k<N;k++)P[k]+=x[k]}
  // KCL residual of the factorized solution, scaled like the original elimination check.
  for(const s of sources.slice(0,4)){const x=Ps.get(s.id);for(let a=0;a<N;a++){let sum=0,sc=a===loc.get(s.node)?Math.abs(s.injection):0;for(const [j,v] of yRow(net,list[a])){const k=loc.get(j);if(k===undefined)continue;sum+=v*x[k];sc+=Math.abs(v*x[k])}const rhs=a===loc.get(s.node)?s.injection:0;if(!finite(sum)||Math.abs(sum-rhs)>1e-9*Math.max(Number.MIN_VALUE,sc))throw Error('DC solution fails numerical KCL residual check.')}}
  const branchIdx=[];net.branches.forEach((e,k)=>{if(e.resistanceOhm>0&&c[e.a]===id)branchIdx.push(k)});
  prep={list,loc,sources,F,P,Ps,branchIdx};
 }catch(error){prep={error}}
 net.dcPrepared.set(id,prep);return prep;
}
function factoredDcBus(net,p,f,base,options){
 const prep=prepareDc(net,f);
 if(prep.sources&&!prep.sources.length)return {...base,status:'DISCONNECTED / NO ACTIVE SOURCE'};
 try{
  if(prep.error)throw prep.error;
  const {list,loc,sources,F,P,Ps,branchIdx}=prep,N=list.length,lf=loc.get(f),Rf=p.settings.faultR,bolted=Rf===0;
  const e=new Float64Array(N);e[lf]=1;const Z=realSolve(F,e),z=Z[lf];if(!positive(z))throw Error('DC Thevenin resistance is outside numerical range.');
  const respond=x=>{const I=x[lf]/(z+Rf),v=new Float64Array(N);for(let k=0;k<N;k++)v[k]=x[k]-Z[k]*I;if(bolted)v[lf]=0;if(!finite(I))throw Error('DC fault current exceeds numerical range.');return {I,v}};
  const {I:amps,v}=respond(P);
  const full=!net.compact||net.buses[net.at[net.selectedBus]]&&net.nodeAt[net.at[net.selectedBus]]===f||options.full;
  const flowOf=(k,vv)=>{const b=net.branches[k],signed=(vv[loc.get(b.a)]-vv[loc.get(b.b)])/b.resistanceOhm;if(!finite(signed))throw Error('DC branch current exceeds numerical range.');return {id:b.id,name:b.name,kind:b.kind,from:b.from,to:b.to,signedA:signed,amps:Math.abs(signed),toAmps:Math.abs(signed),fromA:Math.abs(signed),toA:Math.abs(signed),fromPhasor:real(signed),toPhasor:real(-signed),fromBoundA:0,toBoundA:0,bound:false}};
  const all=branchIdx.map(k=>flowOf(k,v));
  const meshed=branchIdx.length>=N;
  const perSourceFlows=full&&sources.length*branchIdx.length<=4e5;
  const details=sources.map(s=>{const x=Ps.get(s.id),node=loc.get(s.node),one=perSourceFlows?respond(x):(()=>{const I=x[lf]/(z+Rf);if(!finite(I))throw Error('DC fault current exceeds numerical range.');return {I}})();return {sourceId:s.id,name:s.name,kind:s.kind,current:false,expired:false,unknownAngle:false,amps:Math.abs(one.I),signedA:one.I,phasor:real(one.I),sourceImpedance:s.impedance,sourceImpedanceAtFault:s.impedance,pathSeriesZ:null,path:[],meshed,terminalA:Math.abs((s.voltage-v[node])/s.dcResistanceOhm),terminalVoltagePu:v[node]/s.voltage,branchFlows:perSourceFlows?branchIdx.map(k=>flowOf(k,one.v)):[]}});
  const terminal=sources.map(s=>({sourceId:s.id,signedA:(s.voltage-v[loc.get(s.node)])/s.dcResistanceOhm,amps:Math.abs((s.voltage-v[loc.get(s.node)])/s.dcResistanceOhm)}));
  if(terminal.some(s=>!finite(s.signedA))||details.some(d=>!finite(d.terminalA)||!finite(d.terminalVoltagePu)))throw Error('DC source terminal current exceeds numerical range.');
  // Physical KCL at every node of the array, with the same tolerance as the per-fault path.
  const inj=new Float64Array(N),out=new Float64Array(N),sc=new Float64Array(N);
  terminal.forEach((t,k)=>{const a=loc.get(sources[k].node);inj[a]+=t.signedA;sc[a]+=Math.abs(t.signedA)});
  all.forEach((fl,q)=>{const b=net.branches[branchIdx[q]],a=loc.get(b.a),c=loc.get(b.b);if(a===c)return;out[a]+=fl.signedA;out[c]-=fl.signedA;sc[a]+=Math.abs(fl.signedA);sc[c]+=Math.abs(fl.signedA)});
  out[lf]+=amps;sc[lf]+=Math.abs(amps);
  for(let k=0;k<N;k++){const mismatch=inj[k]-out[k];if(!finite(mismatch)||!finite(sc[k])||Math.abs(mismatch)>1e-8*Math.max(1,sc[k]))throw Error('DC physical source/branch KCL fails numerical precision; check extreme resistance ratios.')}
  let flows=all;if(!full){const keep=new Set();for(const [q,k] of branchIdx.entries()){const b=net.branches[k];if(b.a===f||b.b===f)keep.add(q)}flows=all.filter((_,q)=>keep.has(q));
   net.dcEnvelope??=new Map();for(const [q,k] of branchIdx.entries()){const fl=all[q],cur=net.dcEnvelope.get(k);if(!cur||fl.toA>cur.flow.toA)net.dcEnvelope.set(k,{busId:base.busId,flow:fl})}}
  else if(net.compact){net.dcEnvelope??=new Map();for(const [q,k] of branchIdx.entries()){const fl=all[q],cur=net.dcEnvelope.get(k);if(!cur||fl.toA>cur.flow.toA)net.dcEnvelope.set(k,{busId:base.busId,flow:fl})}}
  const busVoltagesV=full?Object.fromEntries(net.buses.filter(b=>loc.has(net.nodeAt[net.at[b.id]])).map(b=>[b.id,v[loc.get(net.nodeAt[net.at[b.id]])]])):undefined;
  return {...base,status:'CALCULATED',totalA:Math.abs(amps),signedA:amps,conventionalA:Math.abs(amps),details,branchFlows:flows,zth:real(z),groups:details.reduce((o,d)=>(o[d.kind]=(o[d.kind]||0)+d.amps,o),{}),...(busVoltagesV?{busVoltagesV}:{}),sourceTerminalCurrents:terminal,idealBranchCurrentsAvailable:!net.branches.some(e=>e.resistanceOhm===0&&components(net)[e.a]===components(net)[f]),solver:'factored',...(net.compact?{outputScope:'compact',detailScope:full?'full':'summary'}:{})};
 }catch(e){return {...base,status:'NETWORK ERROR',faultNote:e.message+' '+dcScope()};}
}
// Each branch's worst bus fault is kept in that bus's table, so cable duty screens see the true maximum.
function addDcEnvelope(net,results){if(!net.dcEnvelope)return;const byBus=new Map(results.map(r=>[r.busId,r]));for(const {busId,flow} of net.dcEnvelope.values()){const r=byBus.get(busId);if(r&&Array.isArray(r.branchFlows)&&!r.branchFlows.includes(flow))r.branchFlows.push(flow)}const order=new Map(net.branches.map((b,k)=>[b.id,k]));for(const r of results)if(r.outputScope==='compact')r.branchFlows.sort((a,b)=>order.get(a.id)-order.get(b.id))}
export function calculateDcBusDetail(p,busId){const net=buildDcNetwork(p);return calculateDcBus(net,p,busId,{full:true,factored:true})}
