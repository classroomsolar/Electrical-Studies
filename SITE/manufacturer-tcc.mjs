/**
 * Document-backed TCC envelope SCREEN. No library of invented relay/device curves.
 * Digitized values MUST represent total clearing time including breakers, at the
 * device PRIMARY current. Evaluate only strictly within provided continuous segments.
 * Log-log interpolation is a plotting approximation, not OEM certification.
 */
const bad=s=>{throw Error('Manufacturer TCC: '+s)};
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const dec=s=>{if(typeof s!=='string'||!s.trim()||s.length>12000)bad('provide bounded documented numeric curve CSV');const txt=s.trim();if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(txt))bad('non-numeric curve value');const value=Number(txt);if(!Number.isFinite(value))bad('non-numeric curve value');return value};
export function parseManufacturerCurve({model,source,revision,curveCsv}={}){
 if(typeof model!=='string'||model.trim().length<3||model.length>160)bad('exact protective device model required');
 if(typeof source!=='string'||source.trim().length<8||source.length>1000)bad('datasheet/approved study identifier required');
 if(typeof revision!=='string'||!revision.trim()||revision.length>100)bad('manufacturer source revision/date required');
 if(typeof curveCsv!=='string'||!curveCsv.trim()||curveCsv.length>12000)bad('documented clearing-time curve rows required');
 const raw=curveCsv.trim().split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
 if(raw.length<2||raw.length>160)bad('2 to 160 documented curve points required');
 const points=raw.map((line,i)=>{
  const cells=line.split(',');if(cells.length!==3)bad('row '+(i+1)+' must contain primary current A, minimum total clearing s, maximum total clearing s');
  const [primaryA,minS,maxS]=cells.map(dec);
  if(primaryA<=0||minS<=0||maxS<=0||minS>maxS||primaryA>1e9||maxS>1e6)bad('invalid positive current/time bounds at row '+(i+1));
  return {primaryA,minS,maxS};
 });
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i];
  if(b.primaryA<=a.primaryA)bad('strictly increasing source primary current required');
  if(b.minS>a.minS*(1+1e-10)||b.maxS>a.maxS*(1+1e-10))bad('each source envelope must be non-increasing over this single continuous segment');
 }
 return {model:model.trim(),source:source.trim(),revision:revision.trim(),points,scope:'User-entered total clearing time envelope. Not verified against the underlying manufacturer publication.'};
}
export function evaluateManufacturerCurve(curve,primaryA){
 if(!curve?.points||!Array.isArray(curve.points)||!finite(primaryA)||primaryA<=0)bad('finite positive device primary current and parsed curve required');
 const a=curve.points;
 if(primaryA<a[0].primaryA||primaryA>a.at(-1).primaryA)return {status:'OUTSIDE_PUBLISHED_RANGE',primaryA,minS:null,maxS:null};
 let i=1;while(i<a.length-1&&primaryA>a[i].primaryA)i++;
 const lo=a[i-1],hi=a[i];
 const x=Math.log(primaryA/lo.primaryA)/Math.log(hi.primaryA/lo.primaryA);
 const at=key=>lo[key]*Math.exp(x*Math.log(hi[key]/lo[key]));
 const minS=at('minS'),maxS=at('maxS');
 if(!finite(minS)||!finite(maxS)||minS<=0||maxS<minS)bad('interpolation failed');
 return {status:'WITHIN_ENTERED_SOURCE_POINTS',primaryA,minS,maxS,interpolation:'log-current/log-total-clearing-time; endpoints preserved; no extrapolation'};
}
export function reviewManufacturerCoordination({downstream,upstream,downstreamPrimaryA,upstreamPrimaryA,requiredMarginS}={}){
 if(!finite(requiredMarginS)||requiredMarginS<0||requiredMarginS>60)bad('documented nonnegative required time margin in seconds required');
 const d=evaluateManufacturerCurve(parseManufacturerCurve(downstream),downstreamPrimaryA),
       u=evaluateManufacturerCurve(parseManufacturerCurve(upstream),upstreamPrimaryA);
 if(d.status!=='WITHIN_ENTERED_SOURCE_POINTS'||u.status!=='WITHIN_ENTERED_SOURCE_POINTS')
  return {status:'NOT_EVALUATED_OUT_OF_CURVE_RANGE',downstream:d,upstream:u,worstCaseMarginS:null,requiredMarginS};
 // Use fastest upstream vs slowest downstream. A nominal/mean margin can hide overlap.
 const worstCaseMarginS=u.minS-d.maxS;
 return {status:worstCaseMarginS>=requiredMarginS?'ENTERED_ENVELOPE_MARGIN_MET':'ENTERED_ENVELOPE_MARGIN_NOT_MET',downstream:d,upstream:u,worstCaseMarginS,requiredMarginS,scope:'User-digitized document-backed total-clearing envelopes only. No fault path modelling, no CT saturation, no accuracy qualification or OEM approval. Do not use to approve settings.'};
}
export function manufacturerEnvelopeInputsFromProtection(cfg={}){
 const mapped=d=>({model:d?.manufacturerModel,source:d?.manufacturerSource,revision:d?.manufacturerRevision,curveCsv:d?.manufacturerCurveCsv});
 return {downstream:mapped(cfg.downstream),upstream:mapped(cfg.upstream),downstreamPrimaryA:cfg.downstreamPrimaryA,upstreamPrimaryA:cfg.upstreamPrimaryA,requiredMarginS:cfg.requiredMarginS};
}
/** CSV rows: the caller must CSV-escape cells and defend against spreadsheet injection. */
export function manufacturerTccCsv(cfg){
 const c=manufacturerEnvelopeInputsFromProtection(cfg),result=reviewManufacturerCoordination(c);
 const a=parseManufacturerCurve(c.downstream),b=parseManufacturerCurve(c.upstream);
 const out=[['WARNING','USER-ENTERED SOURCE VALUES ONLY. NOT VERIFIED AGAINST OEM FILES; NOT COMMISSIONING APPROVAL.'],['Method','Log-log interpolation of documented MIN/MAX TOTAL CLEARING time in seconds, NO EXTRAPOLATION'],['Worst case comparison','Upstream minimum clearing - downstream maximum clearing'],['Status',result.status],['Worst-case margin s',result.worstCaseMarginS??'OUT OF RANGE'],['Required project margin s',result.requiredMarginS]];
 for(const [side,curve,test] of [['Downstream',a,result.downstream],['Upstream',b,result.upstream]]){
  out.push([],['Device',side],['Model',curve.model],['Publication',curve.source],['Revision',curve.revision],['Evaluated primary current A',test.primaryA],['Evaluated min total clearing s',test.minS??'OUT OF RANGE'],['Evaluated max total clearing s',test.maxS??'OUT OF RANGE'],[],['Original primary current A','Minimum total clearing s','Maximum total clearing s']);
  for(const point of curve.points)out.push([point.primaryA,point.minS,point.maxS]);
 }
 return out;
}
