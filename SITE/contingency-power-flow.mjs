/* Batch 09: bounded, read-only, balanced AC N-1 contingency screening.
 * Does NOT certify equipment ratings or replace an unbalanced/time-domain study.
 * All rating limits must be explicitly documented on the corresponding network IDs.
 */
import {solveBalancedPowerFlow,operatingNetworkFromStudio} from './operating-studies.mjs';
const check=(x,what)=>{if(typeof x!=='number'||!Number.isFinite(x)||x<=0)throw Error('N-1: valid '+what+' required');return x};
const integer=(x,what)=>{if(!Number.isSafeInteger(x))throw Error('N-1: '+what+' must be integer');return x};
export function screenBalancedNMinusOne({network,nominalBusVoltageV,busVoltageLimitsPu,branchCurrentLimitsA,maxCases=200}){
 if(!network||!Array.isArray(network.branches)||!Array.isArray(network.buses))throw Error('N-1: valid operating network required');
 // Above 40 buses / 200 branches the sparse load flow is used; each outage then keeps only its violations to bound memory.
 const large=network.branches.length>200||network.buses.length>40;
 if(network.branches.length>60000||network.buses.length>20000)throw Error('N-1: supported network limit exceeded (20,000 buses / 60,000 branches)');
 if(integer(maxCases,'maxCases')<1||maxCases>(large?5000:200))throw Error(large?'N-1: maxCases must be 1–5000':'N-1: maxCases must be 1–200');
 if(network.branches.some(e=>typeof e.id!=='string'||!e.id))throw Error('N-1: each branch requires a stable unique ID');
 const branchIds=network.branches.map(e=>e.id),busIds=network.buses.map(b=>b.id);
 if(new Set(branchIds).size!==branchIds.length)throw Error('N-1: branch IDs must be unique');
 if(!nominalBusVoltageV||!busVoltageLimitsPu||!branchCurrentLimitsA||typeof nominalBusVoltageV!=='object'||typeof busVoltageLimitsPu!=='object'||typeof branchCurrentLimitsA!=='object')throw Error('N-1: explicit voltage bases, bus bounds and all branch ratings required');
 const expectedBus=new Set(busIds),expectedBranch=new Set(branchIds);
 const ensureKeys=(actual,expected,name)=>{for(const key of Object.keys(actual))if(!expected.has(key))throw Error('N-1: unknown '+name+' ID '+key)};
 ensureKeys(nominalBusVoltageV,expectedBus,'voltage');ensureKeys(busVoltageLimitsPu,expectedBus,'bus');ensureKeys(branchCurrentLimitsA,expectedBranch,'branch');
 for(const id of busIds){check(nominalBusVoltageV[id],'nominal voltage for '+id);const b=busVoltageLimitsPu[id];if(!b||!Number.isFinite(b.min)||!Number.isFinite(b.max)||b.min<=0||b.max<=b.min||b.max>2.0)throw Error('N-1: documented bus voltage bounds required for '+id);}
 for(const id of branchIds)check(branchCurrentLimitsA[id],'branch current rating for '+id);
 check(network.baseMVA,'base MVA');
 const byId=new Map(network.buses.map(b=>[b.id,b]));
 const evaluate=solved=>{
  const violations=[];
  for(const b of solved.buses){const {min,max}=busVoltageLimitsPu[b.id];if(b.voltagePu<min-1e-9||b.voltagePu>max+1e-9)violations.push({type:'VOLTAGE',id:b.id,calculated:b.voltagePu,min,max,unit:'pu'});}
  for(const e of solved.branches){const ampBase=(network.baseMVA*1e6)/(Math.sqrt(3)*nominalBusVoltageV[e.from]);const actualA=e.currentPu*ampBase,limitA=branchCurrentLimitsA[e.id];if(actualA>limitA*(1+1e-9))violations.push({type:'BRANCH_OVERLOAD',id:e.id,calculated:actualA,limit:limitA,unit:'A'});}
  return violations;
 };
 const run=(outage)=>{
  const subset=outage?{...network,branches:network.branches.filter(e=>e.id!==outage)}:network;
  try{const results=solveBalancedPowerFlow(subset),violations=evaluate(results);
    return {outagedBranchId:outage??null,status:violations.length?'SCREEN_VIOLATION':'SCREEN_WITHIN_SUPPLIED_LIMITS',violations,buses:large&&outage?null:results.buses,branches:large&&outage?null:results.branches,iterations:results.iterations,mismatchPu:results.mismatchPu};
  }catch(error){return {outagedBranchId:outage??null,status:'NOT_SOLVED_REVIEW_REQUIRED',reason:String(error.message).slice(0,500),violations:null,buses:null,branches:null};}
 };
 const base=run(null);
 if(base.status==='NOT_SOLVED_REVIEW_REQUIRED')return {status:'BASE_CASE_NOT_SOLVED',base,contingencies:[],method:'Balanced fixed PQ/PV/slack N-1 screen; convergence and supplied limits only, no switching, transient or unbalanced duty'};
 if(base.status==='SCREEN_VIOLATION')return {status:'BASE_CASE_LIMITS_EXCEEDED',base,contingencies:[],method:'Base case already outside supplied limits; no N-1 pass claim'};
 const contingencies=branchIds.slice(0,maxCases).map(id=>run(id));
 const incomplete=branchIds.length>maxCases,pass=!incomplete&&contingencies.every(x=>x.status==='SCREEN_WITHIN_SUPPLIED_LIMITS');
 return {status:pass?'ALL_ENUMERATED_BRANCH_OUTAGES_WITHIN_SUPPLIED_LIMITS':'N_MINUS_ONE_REVIEW_REQUIRED',base,contingencies,incompleteEnumeration:incomplete,method:'Balanced AC Newton-Raphson, every enumerated single branch outage; explicit voltage/current limits; not IEEE/IEC equipment compliance or dynamic stability'};
}

/** Connects to the authoritative Studio operating model and its bus voltage bases.
 * External callers provide ONLY documented limits; they cannot override nominal
 * bus voltage bases used to convert per-unit current into actual RMS amperes.
 */
export function screenStudioBalancedNMinusOne(project,{busVoltageLimitsPu,branchCurrentLimitsA,maxCases=200}={}){
 if(!project||!Array.isArray(project.buses))throw Error('N-1: Studio project with documented buses required');
 const network=operatingNetworkFromStudio(project);
 const nominalBusVoltageV=Object.fromEntries(project.buses.map(b=>[b.id,b.voltage]));
 return screenBalancedNMinusOne({network,nominalBusVoltageV,busVoltageLimitsPu,branchCurrentLimitsA,maxCases});
}
