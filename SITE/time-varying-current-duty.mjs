/** Fundamental-frequency symmetrical AC rms phasor duty from measured/documented time traces.
 * Not the IEC 60909 equivalent thermal breaking duty, not an asymmetrical offset
 * waveform or a generator/IBR response model. Input is *supplied time histories*.
 */
const fail=s=>{throw Error('Time-varying duty: '+s)};
const val=(x,n,lo,hi)=>{if(typeof x!=='number'||!Number.isFinite(x)||x<lo||x>hi)fail('document '+n+' in '+lo+'..'+hi);return x};
const id=(x,n)=>{if(typeof x!=='string'||x.length<2||x.length>120||!x.trim())fail(n+' required');return x.trim()};
const plus=(a,b)=>[a[0]+b[0],a[1]+b[1]];
const lerp=(a,b,p)=>[a[0]+(b[0]-a[0])*p,a[1]+(b[1]-a[1])*p];
const abs2=v=>v[0]*v[0]+v[1]*v[1];
export function timeVaryingSymmetricalFaultDuty(c){
 if(!c||typeof c!=='object'||Array.isArray(c))fail('case object required');
 const tEnd=val(c.durationS,'durationS',.0001,300);
 if(!Array.isArray(c.sources)||c.sources.length<1||c.sources.length>40)fail('1..40 documented source phasor traces required');
 let knots=[0,tEnd],seen=new Set(),parsed=[];
 for(const s of c.sources){const name=id(s?.id,'source ID');if(seen.has(name))fail('duplicate source ID');seen.add(name);
  const reference=id(s?.sourceReference,'OEM/measurement reference');
  if(!Array.isArray(s?.samples)||s.samples.length<2||s.samples.length>120)fail(name+' needs 2..120 documented samples');
  const pts=s.samples.map(p=>{const t=val(p?.timeS,name+' timeS',0,tEnd),current=val(p?.symmetricalRmsA,name+' symmetricalRmsA',0,1e8),deg=val(p?.phaseDeg,name+' phaseDeg',-180,180)*Math.PI/180;return {t,z:[current*Math.cos(deg),current*Math.sin(deg)]};});
  if(pts[0].t!==0||pts.at(-1).t!==tEnd)fail(name+' must explicitly cover time=0 and durationS (no extrapolation)');
  for(let j=1;j<pts.length;j++)if(pts[j].t<=pts[j-1].t)fail(name+' sample times must strictly increase');
  parsed.push({name,reference,points:pts});knots.push(...pts.map(x=>x.t));
 }
 knots=[...new Set(knots)].sort((a,b)=>a-b);
 const at=(obj,t)=>{const a=obj.points;let i=1;while(i<a.length-1&&a[i].t<t)i++;const l=a[i-1],h=a[i];return lerp(l.z,h.z,(t-l.t)/(h.t-l.t));};
 let i2t=0,peakSym=0,tPeak=0,perSource={};for(const s of parsed)perSource[s.name]=0;
 for(let i=0;i<knots.length-1;i++){
  const t0=knots[i],t1=knots[i+1],dt=t1-t0;let a=[0,0],b=[0,0];
  for(const s of parsed){const v0=at(s,t0),v1=at(s,t1);a=plus(a,v0);b=plus(b,v1);
   perSource[s.name]+=dt*(abs2(v0)+v0[0]*v1[0]+v0[1]*v1[1]+abs2(v1))/3;}
  // Piecewise complex current interpolation: exact quadratic integral of |I(t)|^2.
  const power0=abs2(a),power1=abs2(b);
  i2t+=dt*(power0+(a[0]*b[0]+a[1]*b[1])+power1)/3;
  if(Math.sqrt(power0)>peakSym){peakSym=Math.sqrt(power0);tPeak=t0}
  if(Math.sqrt(power1)>peakSym){peakSym=Math.sqrt(power1);tPeak=t1}
 }
 const ieq=Math.sqrt(i2t/tEnd);
 if(!Number.isFinite(ieq)||!Number.isFinite(i2t)||i2t>1e22)fail('calculation overflow');
 return {status:'DOCUMENTED_SYMMETRICAL_PHASOR_THERMAL_DUTY',durationS:tEnd,sourceCount:parsed.length,sourceReferences:parsed.map(s=>({id:s.name,reference:s.reference})),totalI2tA2S:i2t,equivalentSymmetricalRmsA:ieq,maximumInstantaneousSymmetricalRmsA:peakSym,timeAtMaximumS:tPeak,individualSourceI2tA2S:perSource,intervalCount:knots.length-1,approved:false,method:'Exact |sum complex RMS phasors|² integral under explicitly assumed linear complex-phasor interpolation between provided time-stamped points',limitations:['Fundamental-frequency symmetrical RMS phasor only: no asymmetrical DC offset, high harmonics, CT/relay response or waveform integration','Phasor time traces are externally supplied and must be appropriate to the same fault case and network','Time values in traces must include all switching/discontinuities or separate sequences; interpolation is NOT a generator/IBR physics model','Not equivalent IEC 60909/ANSI short-time duty, peak making or breaking-capacity certification']};
}
