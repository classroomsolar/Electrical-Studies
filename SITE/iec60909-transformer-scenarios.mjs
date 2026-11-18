/**
 * Bounded radial 3PH IEC 60909-style transformer nameplate and upstream utility
 * maximum/minimum initial symmetrical short-circuit scenario calculator.
 * Transformer KT follows IEC 60909-0:2016 section 6.3.3 as reproduced by
 * Schneider Electric solution guide TP20180605, and DIN EN guidance by DIgSILENT.
 * Not a claim of conformance to every IEC 60909-0:2026 rule. Pure, fail-closed.
 */
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const bad=m=>{throw Error('Nameplate transformer fault envelope: '+m)};
const N=(v,k,lo,hi)=>{let a=v?.[k];if(!finite(a)||a<lo||a>hi)bad('Provide finite '+k+' in '+lo+'..'+hi);return a};
const only=(obj,allowed,label)=>{if(!obj||typeof obj!=='object'||Array.isArray(obj))bad('Document '+label+' object');for(const k of Object.keys(obj))if(!allowed.includes(k))bad(label+' unexpected property '+k)};
const id=(s,k)=>{if(typeof s!=='string'||s.trim().length<4||s.length>350)bad('Document '+k+' as a 4..350 character source/reference');return s.trim()};
const C=(a=0,b=0)=>[a,b],add=(a,b)=>[a[0]+b[0],a[1]+b[1]],mod=a=>Math.hypot(a[0],a[1]);
function currentReport(z,eV){let d=z[0]*z[0]+z[1]*z[1];if(d<=1e-24)bad('Near-zero equivalent source/network impedance');let fac=eV/(Math.sqrt(3)*d),r=fac*z[0],x=-fac*z[1];return {realA:r,imaginaryA:x,magnitudeA:Math.hypot(r,x),angleDegrees:Math.atan2(x,r)*180/Math.PI};}
export const TRANSFORMER_60909_SCREEN_SCOPE='Single utility Thevenin source, one 2-winding transformer at rated reference tap, one LV feeder, radial balanced 3PH initial symmetrical maximum/minimum scenarios. Calculates nameplate transformer R/X, correction KT=0.95*cmax/(1+0.6*xT) and IEC-style voltage-factor current. Source equivalent short-circuit MVA is specifically defined as nominal V²/|Zsource| (does NOT include a voltage factor). Not full IEC 60909-0:2026, not network generator/motor/IBR duty, tap-position rules or breaker interrupting qualification.';
export function transformerNameplateFaultEnvelope(input){
 if(!input||typeof input!=='object'||Array.isArray(input))bad('Complete case object required');
 only(input,['ratedHighVoltageV','ratedLowVoltageV','transformer','utility','voltageFactors','feeder'],'case');
 const hv=N(input,'ratedHighVoltageV',100,765000),lv=N(input,'ratedLowVoltageV',100,35000);
 if(!(hv>lv))bad('High-voltage winding nominal voltage must exceed low voltage');
 const t=input.transformer,u=input.utility,f=input.feeder,cf=input.voltageFactors;
 if(!t||!u||!f||!cf)bad('Transformer, utility, feeder and voltageFactors required');
 only(t,['sourceReference','ratedMVA','shortCircuitVoltagePercent','ratedLoadLossKW','ratedTapRatio'],'transformer');
 only(u,['sourceReference','maximumEquivalentMVA','maximumXOverR','minimumEquivalentMVA','minimumXOverR'],'utility');
 only(f,['sourceReference','lengthM','resistanceOhmPerKmAt20C','reactanceOhmPerKm','alphaPerC','maximumConductorTemperatureC','minimumConductorTemperatureC'],'feeder');
 only(cf,['maximum','minimum'],'voltageFactors');
 const transformerReference=id(t.sourceReference,'transformer OEM nameplate reference'),utilityReference=id(u.sourceReference,'utility short-circuit study reference');
 const ratedMVA=N(t,'ratedMVA',0.001,10000),uk=N(t,'shortCircuitVoltagePercent',0.01,50),pkw=N(t,'ratedLoadLossKW',0,1e7);
 if(!finite(t.ratedTapRatio)||Math.abs(t.ratedTapRatio-1)>1e-10)bad('This radial model is for the documented rated tap (ratedTapRatio=1) only');
 const S=ratedMVA*1e6,Zrated=lv*lv/S,Zmag=uk/100*Zrated,R=pkw*1000*lv*lv/(S*S);
 if(R>=Zmag)bad('Transformer load loss implies nonphysical R ≥ |Z|; check nameplate units');
 const X=Math.sqrt((Zmag-R)*(Zmag+R)),xt=X/Zrated,cmax=N(cf,'maximum',0.90,1.2),cmin=N(cf,'minimum',0.8,1.1);
 if(cmin>cmax)bad('Minimum voltage factor exceeds maximum');
 const KT=0.95*cmax/(1+0.6*xt);if(KT<0.5||KT>1.3)bad('Unphysical correction factor');
 const sourceCases=[{name:'MAXIMUM',shortCircuitMVA:N(u,'maximumEquivalentMVA',0.001,100000),xr:N(u,'maximumXOverR',0.01,10000),cf:cmax,tempKey:'maximumConductorTemperatureC'},
 {name:'MINIMUM',shortCircuitMVA:N(u,'minimumEquivalentMVA',0.001,100000),xr:N(u,'minimumXOverR',0.01,10000),cf:cmin,tempKey:'minimumConductorTemperatureC'}];
 if(sourceCases[1].shortCircuitMVA>sourceCases[0].shortCircuitMVA)bad('Utility minimum-equivalent fault power cannot exceed maximum-equivalent fault power');
 const lengthM=N(f,'lengthM',0,200000),r20=N(f,'resistanceOhmPerKmAt20C',0,1e4),xkm=N(f,'reactanceOhmPerKm',0,1e4),alpha=N(f,'alphaPerC',0,0.01);
 const fref=id(f.sourceReference,'LV feeder cable/route reference');
 const maxT=N(f,'maximumConductorTemperatureC',-50,250),minT=N(f,'minimumConductorTemperatureC',-50,250);
 if(minT<maxT)bad('Minimum fault conductor temperature should not be below maximum fault conductor temperature');
 const Csource=sourceCases.map(e=>{
  let zeq=lv*lv/(e.shortCircuitMVA*1e6),rn=zeq/Math.sqrt(1+e.xr*e.xr),xn=rn*e.xr;
  let temp=e.name==='MAXIMUM'?maxT:minT,rm=r20*lengthM/1000*(1+alpha*(temp-20)),xm=xkm*lengthM/1000;
  if(rm<0)bad('Negative temperature-adjusted cable resistance');
  let zSource=C(rn,xn),zFeeder=C(rm,xm),zTx=C(KT*R,KT*X),zTotal=add(add(zSource,zFeeder),zTx);
  let ik=currentReport(zTotal,e.cf*lv),ratio=zTotal[0]>0?zTotal[1]/zTotal[0]:null;
  let kappa=zTotal[1]>1e-12?1.02+0.98*Math.exp(-3*zTotal[0]/zTotal[1]):1.02;
  let peakMakingScreenA=Math.SQRT2*kappa*ik.magnitudeA;
  return {scenario:e.name,voltageFactor:e.cf,conductorTemperatureC:temp,utilityEquivalentMVA:e.shortCircuitMVA,utilityXOverR:e.xr,sourceEquivalentLVImpedanceOhm:{r:zSource[0],x:zSource[1]},correctedTransformerImpedanceOhm:{r:zTx[0],x:zTx[1]},feederImpedanceOhm:{r:zFeeder[0],x:zFeeder[1]},totalEquivalentImpedanceOhm:{r:zTotal[0],x:zTotal[1]},shortCircuitCurrent:ik,initialSymmetricalKA:ik.magnitudeA/1000,screenPeakA:peakMakingScreenA,screenPeakKA:peakMakingScreenA/1000,networkXOverR:ratio,scope:'Initial symmetrical RMS and single radial passive-system exponential peak screening; no circuit-breaker interrupting or close-and-latch qualification'};
 });
 if(Csource[0].initialSymmetricalKA+1e-8<Csource[1].initialSymmetricalKA)bad('MAXIMUM network produces less current than MINIMUM; source and temperature scenarios conflict');
 return {status:'BOUNDED_IEC60909_RADIAL_TRANSFORMER_ENVELOPE',scope:TRANSFORMER_60909_SCREEN_SCOPE,highVoltageV:hv,lowVoltageV:lv,transformer:{ratedMVA,shortCircuitVoltagePercent:uk,ratedLoadLossKW:pkw,atRatedTapOnly:true,uncorrectedRohm:R,uncorrectedXohm:X,relativeReactancePu:xt,impedanceCorrectionKT:KT},provenance:{transformerReference,utilityReference,feederReference:fref},scenarios:Csource,maxInitialSymmetricalKA:Csource[0].initialSymmetricalKA,minInitialSymmetricalKA:Csource[1].initialSymmetricalKA,reference:'IEC 60909-0:2016 transformer K_T expression reproduced in Schneider Electric TP20180605 (2018); method remains an explicitly bounded screening, NOT full IEC 60909-0:2026 conformity',limitations:['Only radial single utility source and one two-winding transformer; no motor/generator/IBR/source contribution','No LV transformer off-rated tap, load tap changer correction, unbalanced or ground faults','Utility source input short-circuit MVA is a stated equivalent Z definition; it must not already include an IEC voltage factor','LV cable resistance at temperature uses user-entered linear alpha; no skin/proximity derivation or sheath effects','Exponential peak kappa only appropriate to simple passive equivalent R+jX source network','No device protection trip-time, breaking or thermal withstand validation']};
}
