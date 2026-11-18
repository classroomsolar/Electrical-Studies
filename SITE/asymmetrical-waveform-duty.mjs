/**
 * Bounded physically explicit prospective fault-current AC+DC waveform duty.
 * Input phasors are externally documented, NOT calculated decrement physics.
 * Source phasors are linearly interpolated as complex RMS phasors, and a separate
 * user-documented DC offset time constant is applied per source. The initial DC
 * component enforces a zero-current pre-fault condition at the selected inception
 * angle, which is an assumption (not suitable for pre-fault loaded current).
 *
 * No IEC 60909-0:2026 formula factor or manufacturer breaker approval is inferred.
 */
import {timeVaryingSymmetricalFaultDuty} from './time-varying-current-duty.mjs';
const fail=s=>{throw Error('Documented AC+DC waveform: '+s)};
const real=(x,k,a,b)=>{if(typeof x!=='number'||!Number.isFinite(x)||x<a||x>b)fail(k+' must be finite in '+a+'..'+b);return x};
const ref=(x,k)=>{if(typeof x!=='string'||!x.trim()||x.trim().length>180)fail(k+' must identify documented source');return x.trim()};
const pi=Math.PI;
const gauss8X=[0.9602898564975363,0.7966664774136267,0.525532409916329,0.1834346424956498];
const gauss8W=[0.1012285362903763,0.2223810344533745,0.3137066458778873,0.362683783378362];
const gauss4X=[0.8611363115940526,0.3399810435848563];
const gauss4W=[0.3478548451374538,0.6521451548625461];
const complexSamples=(s,T)=>{
 if(!Array.isArray(s.samples)||s.samples.length<2||s.samples.length>120)fail(s.id+' requires 2..120 documented phasor samples');
 const pts=s.samples.map((p,i)=>{const t=real(p?.timeS,s.id+' timeS['+i+']',0,T),mag=real(p?.symmetricalRmsA,s.id+' rmsA['+i+']',0,1e8),theta=real(p?.phaseDeg,s.id+' phaseDeg['+i+']',-180,180)*pi/180;return {t,re:mag*Math.cos(theta),im:mag*Math.sin(theta)}});
 if(pts[0].t!==0||pts.at(-1).t!==T)fail(s.id+' samples must cover zero and the total duration exactly');
 for(let j=1;j<pts.length;j++)if(pts[j].t<=pts[j-1].t)fail(s.id+' sample times must strictly increase');
 return pts;
};
function interpolate(points,t){let lo=0,hi=points.length-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(t<points[mid].t)hi=mid;else lo=mid}const a=points[lo],b=points[hi],v=Math.max(0,Math.min(1,(t-a.t)/(b.t-a.t)));return [a.re+(b.re-a.re)*v,a.im+(b.im-a.im)*v]}
function integrate(fn,t0,t1,n){const X=n===8?gauss8X:gauss4X,W=n===8?gauss8W:gauss4W,mid=(t0+t1)/2,h=(t1-t0)/2;let z=0;for(let i=0;i<X.length;i++){let d=X[i]*h;z+=W[i]*(fn(mid-d)**2+fn(mid+d)**2)}return h*z}
function maximumAbsolute(fn,knots,f){
 let p=0,tp=0,iterations=0;
 const evalPeak=t=>{const a=Math.abs(fn(t));if(a>p){p=a;tp=t}return a};
 const refine=(start,end)=>{let a=start,b=end;if(!(b>a))return;const q=(Math.sqrt(5)-1)/2;let x1=b-q*(b-a),x2=a+q*(b-a),f1=evalPeak(x1),f2=evalPeak(x2);
   for(let z=0;z<37;z++){if(f1>f2){b=x2;x2=x1;f2=f1;x1=b-q*(b-a);f1=evalPeak(x1)}else{a=x1;x1=x2;f1=f2;x2=a+q*(b-a);f2=evalPeak(x2)}iterations++}
 };
 for(let j=0;j<knots.length-1;j++){
  const left=knots[j],right=knots[j+1],n=Math.max(2,Math.ceil((right-left)*f*40));let values=[];
  for(let k=0;k<=n;k++){const t=left+(right-left)*k/n;values.push(evalPeak(t))}
  // Include end-bin refinements: a discontinuity in derivative at a phasor
  // sample knot can hide a local maximum near either side of the knot.
  refine(left,left+(right-left)/n);
  refine(right-(right-left)/n,right);
  for(let k=1;k<n;k++)if(values[k]>=values[k-1]&&values[k]>=values[k+1])
   refine(left+(right-left)*(k-1)/n,left+(right-left)*(k+1)/n);
 }
 return {peakA:p,atTimeS:tp,peakRefinements:iterations};
}
export function documentedAsymmetricalWaveformDuty(c){
 if(!c||typeof c!=='object'||Array.isArray(c))fail('case object required');
 const f=real(c.frequencyHz,'frequencyHz',50,60);if(f!==50&&f!==60)fail('nominal frequency must equal 50 or 60 Hz');
 const T=real(c.durationS,'durationS',.0005,5);const alpha=real(c.inceptionAngleDeg,'inceptionAngleDeg',-180,180)*pi/180;
 if(c.initialCurrentCondition!=='ZERO_PRIOR_CURRENT')fail('explicit initialCurrentCondition=ZERO_PRIOR_CURRENT needed (loaded current not modelled)');
 if(!Array.isArray(c.sources)||c.sources.length<1||c.sources.length>24)fail('one to twenty-four documented source current histories required');
 const seen=new Set(),knots=[0,T],inputs=[];
 for(const x of c.sources){const id=ref(x?.id,'source id');if(seen.has(id))fail('duplicate source ID '+id);seen.add(id);const reference=ref(x?.sourceReference,id+' sourceReference'),dcReference=ref(x?.dcTimeConstantReference,id+' dcTimeConstantReference');const tau=real(x?.dcTimeConstantS,id+' dcTimeConstantS',0.0001,5);const pts=complexSamples({...x,id},T);knots.push(...pts.map(z=>z.t));const initial=-(Math.SQRT2)*(pts[0].re*Math.cos(alpha)-pts[0].im*Math.sin(alpha));inputs.push({id,reference,dcReference,tau,points:pts,initial});}
 const uniqueKnots=[...new Set(knots)].sort((a,b)=>a-b);
 const omega=2*pi*f;
 const current=t=>{const phase=omega*t+alpha,ca=Math.cos(phase),sa=Math.sin(phase);let v=0;for(const x of inputs){const z=interpolate(x.points,t);v+=Math.SQRT2*(z[0]*ca-z[1]*sa)+x.initial*Math.exp(-t/x.tau)}return v};
 let eight=0,four=0,subintervals=0;
 for(let k=0;k<uniqueKnots.length-1;k++){
  const left=uniqueKnots[k],right=uniqueKnots[k+1],n=Math.max(1,Math.ceil((right-left)*f*8));
  for(let i=0;i<n;i++){const a=left+(right-left)*i/n,b=left+(right-left)*(i+1)/n;eight+=integrate(current,a,b,8);four+=integrate(current,a,b,4);subintervals++}
 }
 if(!(eight>=0)||!Number.isFinite(eight)||eight>1e23)fail('waveform I²t is out of range');
 const relativeQuadratureDisagreement=Math.abs(eight-four)/Math.max(eight,1e-30);
 if(relativeQuadratureDisagreement>1e-7)fail('waveform quadrature did not converge; model must be independently checked');
 const peak=maximumAbsolute(current,uniqueKnots,f);const initialDC=inputs.reduce((a,x)=>a+x.initial,0);
 const symmetric=timeVaryingSymmetricalFaultDuty({durationS:T,sources:c.sources.map(s=>({id:s.id,sourceReference:s.sourceReference,samples:s.samples}))});
 return {status:'EXPLICIT_DOCUMENTED_AC_DC_WAVEFORM_DUTY',model:'Piecewise-linear complex RMS phasor traces and source-specific exponential decaying DC offset, with documented common fault inception phase and zero pre-fault current',frequencyHz:f,durationS:T,inceptionAngleDeg:c.inceptionAngleDeg,initialCurrentCondition:c.initialCurrentCondition,sourceCount:inputs.length,sourceProvenance:inputs.map(s=>({id:s.id,sourceReference:s.reference,dcTimeConstantReference:s.dcReference,dcTimeConstantS:s.tau,initialDCOffsetA:s.initial})),totalInitialDCOffsetA:initialDC,waveformI2tA2S:eight,equivalentAsymmetricalRmsA:Math.sqrt(eight/T),symmetricalRmsPhasorI2tA2S:symmetric.totalI2tA2S,absolutePeakInstantaneousA:peak.peakA,timeAtAbsolutePeakS:peak.atTimeS,quadratureSubintervals:subintervals,quadratureRelativeDisagreement:relativeQuadratureDisagreement,peakRefinements:peak.peakRefinements,atStartInstantaneousA:current(0),atClearingInstantaneousA:current(T),approved:false,limitations:['Not an IEC 60909-0 equivalent thermal factor or certified making/breaking current: no standard voltage/impedance source correction, breaker contact timing, arc restrike, CT saturation, harmonics, waveform discontinuities or inverter controls','Every symmetrical source phasor history and DC time constant must be independently documented; no generator/motor/IBR physics is inferred','Assumes zero pre-fault current and independent source DC decay from one common fault inception angle; cannot be applied to loaded circuits or arbitrary current-source inverter dynamics without validating those assumptions','Output is a prospective model screening waveform; verify model and protection device suitability before engineering use']};
}
