/**
 * V29 additive study: transformer impedance-tolerance fault envelope and
 * NEC 110.24 available-fault-current label data.
 *
 * Pure function. It never edits the caller's project: every case runs on a
 * deep copy, and the only change is each enabled transformer's nameplate %Z
 * multiplied by (1 - tol) for the maximum case and (1 + tol) for the minimum
 * case. The network solution itself is the caller-supplied, already-validated
 * Studio engine (calculateProject), so no second fault method is introduced.
 *
 * Basis: ANSI/IEEE C57.12.00 permits a two-winding transformer's tested
 * impedance to differ from nameplate by +/-7.5 %; Bussmann point-to-point
 * practice multiplies %Z by 0.9 (10 %) for a worst case. The user selects
 * the tolerance; nothing is auto-certified.
 */
export const ENVELOPE_V29={id:'transformer-z-tolerance-envelope-v29',version:'29.0.0'};
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const fail=m=>{throw Error('Fault envelope: '+m)};
const clone=x=>JSON.parse(JSON.stringify(x));

export function validateEnvelopeInput({project,tolerancePercent}){
 if(!project||typeof project!=='object'||!Array.isArray(project.buses)||!Array.isArray(project.branches)||!Array.isArray(project.sources))fail('a Studio network project with buses, sources and branches is required.');
 if(project.settings?.faultType==='dc')fail('DC projects are outside this AC transformer-impedance method.');
 if(!finite(tolerancePercent)||tolerancePercent<0||tolerancePercent>20)fail('impedance tolerance must be a number from 0 to 20 %.');
 if(!project.buses.length)fail('add at least one bus.');
}

function withFactors(project,factors){
 const p=clone(project);let k=0;
 for(const e of p.branches)if(e.kind==='transformer'&&e.enabled!==false&&finite(e.zPercent)&&e.zPercent>0)e.zPercent*=factors[k++];
 return p;
}
// Every +/- combination for up to 8 transformers (256 solutions); uniform -/+ beyond that.
const MAX_CORNER_TRANSFORMERS=8;
function corners(n,tol){
 if(n===0)return [[]];
 if(n>MAX_CORNER_TRANSFORMERS)return [Array(n).fill(1-tol),Array(n).fill(1+tol)];
 return Array.from({length:2**n},(_,m)=>Array.from({length:n},(_,i)=>m>>i&1?1+tol:1-tol));
}
const summary=r=>({status:r?.status??'MISSING',totalA:finite(r?.totalA)?r.totalA:null,xr:finite(r?.xr)?r.xr:r?.xr===Infinity?'infinite':null,peakA:finite(r?.peakA)?r.peakA:null});

export function transformerToleranceEnvelope({project,tolerancePercent=7.5,calculateProject}){
 if(typeof calculateProject!=='function')fail('Studio engine is not available.');
 validateEnvelopeInput({project,tolerancePercent});
 const tol=tolerancePercent/100,transformers=project.branches.filter(e=>e.kind==='transformer'&&e.enabled!==false&&finite(e.zPercent)&&e.zPercent>0);
 const run=p=>{const out=calculateProject(p);return {issues:(out.issues||[]).map(i=>({severity:i.severity,message:i.message})),byBus:new Map((out.results||[]).map(r=>[r.busId,r]))}};
 const nominal=run(clone(project)),cases=corners(transformers.length,tol).map(f=>({factors:f,res:run(withFactors(project,f))}));
 const errors=nominal.issues.filter(i=>i.severity==='error');
 const label=f=>f.length?transformers.map((t,i)=>`${t.name||t.id}: ${f[i]<1?'-':'+'}${tolerancePercent} %`).join('; '):'nameplate';
 const buses=project.buses.map(b=>{
  const n=summary(nominal.byBus.get(b.id));let hi={...n,governingCase:'nameplate'},lo={...n,governingCase:'nameplate'};
  for(const c of cases){const r=summary(c.res.byBus.get(b.id));if(r.totalA===null)continue;
   if(hi.totalA===null||r.totalA>hi.totalA)hi={...r,governingCase:label(c.factors)};
   if(lo.totalA===null||r.totalA<lo.totalA)lo={...r,governingCase:label(c.factors)};}
  const increase=n.totalA&&hi.totalA?(hi.totalA/n.totalA-1)*100:null,decrease=n.totalA&&lo.totalA?(1-lo.totalA/n.totalA)*100:null;
  return {busId:b.id,busName:b.name,voltageV:b.voltage,nominal:n,maximumWithTolerance:hi,minimumWithTolerance:lo,maximumIncreasePercent:increase,minimumDecreasePercent:decrease};
 });
 for(const b of buses)for(const k of ['nominal','maximumWithTolerance','minimumWithTolerance']){const v=b[k].totalA;if(v!==null&&(!finite(v)||v<0))fail('nonfinite engine result.')}
 const searched=transformers.length>MAX_CORNER_TRANSFORMERS?'uniform -/+ tolerance on all transformers (more than '+MAX_CORNER_TRANSFORMERS+' transformers)':`all ${cases.length} +/- tolerance combinations`;
 return {
  status:errors.length?'INPUT REQUIRED':transformers.length?'CALCULATED':'CALCULATED — NO TRANSFORMER IN MODEL',
  method:ENVELOPE_V29.id,version:ENVELOPE_V29.version,tolerancePercent,transformerCount:transformers.length,
  searchedCases:searched,
  scope:'Selected-fault results from the existing Studio network engine, repeated with each enabled transformer nameplate %Z scaled by (1 - tolerance) or (1 + tolerance); X/R is kept. Per bus, the largest and smallest results over the nameplate case and the searched combinations are reported with the governing combination. Lower %Z does not always raise every bus current: with generator or motor contributions, a stiffer transformer can divert their current, so the extremes are searched rather than assumed.',
  limitations:['Applies one common tolerance magnitude; tested impedance from a certified test report supersedes this envelope.','Extremes are searched at tolerance corners only; with mixed sources a true extreme can occasionally lie between corners (difference is typically well below the tolerance effect).','Does not change utility maximum/minimum strength settings; use Study setup scenarios for source variation.','Not an ANSI C37 or IEC 60909 equipment-duty certification and not a PPE or arc-flash determination.'],
  reference:['IEEE C57.12.00: two-winding transformer impedance tolerance of +/-7.5 % of nameplate (user-selectable here).','Eaton Bussmann point-to-point method: multiply transformer %Z by 0.9 for a worst-case available fault current.','NFPA 70 (NEC) 110.24(A): field-marked maximum available fault current with the date the calculation was performed.'],
  issues:nominal.issues,buses
 };
}

const ka=a=>finite(a)?(a/1000).toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})+' kA':'—';
export function nec11024Label({envelope,busId,basis='maximumWithTolerance',equipmentName='',calculatedBy='',date}){
 if(!envelope?.buses)fail('calculate the envelope first.');
 const b=envelope.buses.find(x=>x.busId===busId);if(!b)fail('select a calculated bus.');
 if(!['nominal','maximumWithTolerance'].includes(basis))fail('label basis must be nominal or maximum-with-tolerance.');
 const v=b[basis].totalA;if(!finite(v)||v<=0)fail('the selected bus has no calculated available fault current.');
 if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))fail('enter the calculation date as YYYY-MM-DD.');
 const clean=s=>String(s||'').replace(/[<>&"]/g,'').slice(0,120);
 return {title:'MAXIMUM AVAILABLE FAULT CURRENT',equipment:clean(equipmentName)||clean(b.busName),voltage:b.voltageV,availableFaultA:v,availableFaultText:ka(v),xr:b[basis].xr,
  basis:basis==='nominal'?'Nameplate transformer impedance':`Transformer impedance reduced by ${envelope.tolerancePercent} % (worst case)`,
  dateOfCalculation:date,calculatedBy:clean(calculatedBy),reference:'NEC 110.24(A) field marking. Re-calculate and re-mark when modifications change the available fault current (NEC 110.24(B)).'};
}
