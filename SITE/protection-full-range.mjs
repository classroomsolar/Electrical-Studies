/** Fault Current Studio V18: exact extrema for user-supplied continuous monotonic log-log TCC envelopes.
 * This is a mathematical check of entered/source-labelled *total clearing time* curves only.
 * It never infers OEM selective-coordination approval or tests instantaneous/current-limiting zones.
 */
import {parseManufacturerCurve,evaluateManufacturerCurve} from './manufacturer-tcc.mjs';
const fail=s=>{throw Error('Full-range protection: '+s)};
const num=(v,n,lo,hi)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<lo||v>hi)fail(`document finite ${n} (${lo}..${hi})`);return v};
const id=(s,n)=>{if(typeof s!=='string'||s.length<3||s.length>200||!s.trim())fail(n+' must identify source and location');return s.trim()};
function strictKnots(d,u,q,a,b){
 const set=[a,b];for(const x of d.points){if(x.primaryA>a&&x.primaryA<b)set.push(x.primaryA)}
 for(const x of u.points){let v=x.primaryA/q;if(v>a&&v<b)set.push(v)}
 return [...new Set(set)].sort((x,y)=>x-y);
}
function evaluatePair(d,u,q,x){const dv=evaluateManufacturerCurve(d,x),uv=evaluateManufacturerCurve(u,q*x);
 if(dv.status!=='WITHIN_ENTERED_SOURCE_POINTS'||uv.status!=='WITHIN_ENTERED_SOURCE_POINTS')fail('internal curve out of range');
 return {downstreamPrimaryA:x,upstreamPrimaryA:x*q,downstreamMaximumClearingS:dv.maxS,upstreamMinimumClearingS:uv.minS,marginS:uv.minS-dv.maxS};}
export function sweepProtectionCoordination(c){
 if(!c||typeof c!=='object'||Array.isArray(c))fail('input object required');
 const d=parseManufacturerCurve(c.downstream),u=parseManufacturerCurve(c.upstream);
 const requiredMarginS=num(c.requiredMarginS,'requiredMarginS',0,60);
 if(!Array.isArray(c.faultRanges)||c.faultRanges.length<1||c.faultRanges.length>80)fail('1..80 documented fault-location ranges required');
 const ranges=[],seen=new Set();let worst=null;let candidateCount=0;
 for(const r of c.faultRanges){
  const name=id(r?.location,'fault location');if(seen.has(name))fail('duplicate fault location '+name);seen.add(name);
  const source=id(r?.source,'fault current source reference');
  const a=num(r?.downstreamMinA,'downstreamMinA',.00001,1e9),b=num(r?.downstreamMaxA,'downstreamMaxA',a,1e9);
  const q=num(r?.upstreamPerDownstream,'upstreamPerDownstream',.000001,1e6);
  if(a<d.points[0].primaryA||b>d.points.at(-1).primaryA||q*a<u.points[0].primaryA||q*b>u.points.at(-1).primaryA){
   return {status:'NOT_EVALUATED_OUT_OF_DOCUMENTED_CURVE_RANGE',location:name,source,requiredMarginS,worstCaseMarginS:null,approved:false,scope:'Cannot extrapolate manufacturer total clearing time envelopes to any listed fault range'};
  }
  const knots=strictKnots(d,u,q,a,b),candidates=[];
  for(let j=0;j<knots.length;j++){
   const x0=knots[j];candidates.push(x0);
   if(j===knots.length-1)break;
   const x1=knots[j+1];if(x1<=x0*(1+1e-13))continue;
   const l=evaluatePair(d,u,q,x0),h=evaluatePair(d,u,q,x1),L=Math.log(x1/x0);
   const p=Math.log(h.upstreamMinimumClearingS/l.upstreamMinimumClearingS)/L;
   const z=Math.log(h.downstreamMaximumClearingS/l.downstreamMaximumClearingS)/L;
   // The only possible interior stationary point of u_min(q*x)-d_max(x)
   // for two power-law segments, obtained by setting d/dlog(x) to zero.
   if(Math.abs(p-z)>1e-12&&p*z>0){
    const ratio=(z*l.downstreamMaximumClearingS)/(p*l.upstreamMinimumClearingS);
    if(ratio>0&&Number.isFinite(ratio)){
     const t=Math.log(ratio)/(p-z);
     if(Number.isFinite(t)&&t>1e-12&&t<L-1e-12)candidates.push(x0*Math.exp(t));
    }
   }
  }
  let m=null;for(const x of candidates){const z=evaluatePair(d,u,q,x);candidateCount++;if(m===null||z.marginS<m.marginS)m=z;}
  const row={location:name,source,downstreamRangeA:{minimum:a,maximum:b},upstreamPerDownstream:q,worstCase:m,candidateCount:candidates.length};
  ranges.push(row);if(!worst||m.marginS<worst.worstCase.marginS)worst=row;
 }
 const diff=worst.worstCase.marginS-requiredMarginS;
 return {status:diff>=1e-10?'ENTERED_ENVELOPE_MARGIN_MET_ALL_LOCATIONS':'ENTERED_ENVELOPE_MARGIN_NOT_MET',worstCaseMarginS:worst.worstCase.marginS,requiredMarginS,worstLocation:worst.location,worstFaultPrimaryA:{downstream:worst.worstCase.downstreamPrimaryA,upstream:worst.worstCase.upstreamPrimaryA},scenarios:ranges,candidateCount,downstream:{model:d.model,source:d.source,revision:d.revision},upstream:{model:u.model,source:u.source,revision:u.revision},approved:false,method:'Exact minimum of manufacturer ENTERED monotone log-log time envelope on continuous source-current interval via knots and analytic stationary points',limitations:['User-digitised OEM source points are not independently authenticated here','Instantaneous and energy-limiting selectivity must use official manufacturer tables/testing where applicable','Upstream-to-downstream current ratio is a documented constant per entered location range; verify all independent sources and CTs','No CT transient saturation, reset, zone selectivity, protective settings verification, or OEM approval']};
}
