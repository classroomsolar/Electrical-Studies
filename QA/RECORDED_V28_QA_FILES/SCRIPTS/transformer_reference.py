"""Independent Python complex-arithmetic check of the bounded V20/V27 transformer model.
Reference: DIgSILENT FAQ (IEC 60909-0:2016 §6.3.3) Kt=0.95*cmax/(1+0.6*xt).
This verifies arithmetic only, not full IEC 60909 certification.
"""
import random,json,math,cmath,subprocess,statistics
from pathlib import Path
R=random.Random(609092026)
D=Path('/mnt/data/fault_studio_work/V28/QA')
cases=[]
for i in range(1200):
 s=R.uniform(.5,20);lv=R.choice([208,400,480,600,690,2400,4160,6900,11000,13800]);hv=lv*R.uniform(1.5,12)
 uk=R.uniform(3,10);pkw=R.uniform(.04,.30)*uk/100*s*1000
 umax=R.uniform(200,1500);umin=umax*R.uniform(.30,.85)
 xrh=R.uniform(8,25);xrl=R.uniform(7,20)
 tmax=R.uniform(-5,40);tmin=R.uniform(max(tmax,40),110)
 cases.append(dict(ratedHighVoltageV=hv,ratedLowVoltageV=lv,transformer=dict(sourceReference='Independent QA example OEM reference',ratedMVA=s,shortCircuitVoltagePercent=uk,ratedLoadLossKW=pkw,ratedTapRatio=1),utility=dict(sourceReference='Independent QA utility reference',maximumEquivalentMVA=umax,maximumXOverR=xrh,minimumEquivalentMVA=umin,minimumXOverR=xrl),voltageFactors=dict(maximum=R.uniform(1.05,1.1),minimum=R.uniform(.9,.95)),feeder=dict(sourceReference='Independent QA feeder reference',lengthM=R.uniform(0,100),resistanceOhmPerKmAt20C=R.uniform(.05,.45),reactanceOhmPerKm=R.uniform(.05,.20),alphaPerC=R.uniform(.0035,.0042),maximumConductorTemperatureC=tmax,minimumConductorTemperatureC=tmin)))
(D/'transformer_inputs.json').write_text(json.dumps(cases))
script=D/'transformer_batch.mjs'
script.write_text("""import fs from 'node:fs';import {transformerNameplateFaultEnvelope as calc} from '../../V27/iec60909-transformer-scenarios.mjs';
const cases=JSON.parse(fs.readFileSync(new URL('./transformer_inputs.json',import.meta.url),'utf8'));
let output=cases.map((x,i)=>{try{return {ok:true,out:calc(x)}}catch(e){return {ok:false,error:e.message}}});
fs.writeFileSync(new URL('./transformer_js_results.json',import.meta.url),JSON.stringify(output));
""")
subprocess.run(['node',str(script)],check=True)
js=json.loads((D/'transformer_js_results.json').read_text())
fail=[];errors=[];counts=0
for i,(x,j) in enumerate(zip(cases,js)):
 if not j['ok']:
  fail.append((i,j['error']));continue
 out=j['out'];s=x['transformer']['ratedMVA']*1e6;v=x['ratedLowVoltageV'];t=x['transformer'];f=x['feeder'];u=x['utility'];cf=x['voltageFactors']
 Zbase=v*v/s;zmag=Zbase*t['shortCircuitVoltagePercent']/100;r=t['ratedLoadLossKW']*1000*v*v/s**2;react=math.sqrt(zmag*zmag-r*r);xt=react/Zbase;kt=.95*cf['maximum']/(1+.6*xt)
 refs=[(out['transformer']['uncorrectedRohm'],r),(out['transformer']['uncorrectedXohm'],react),(out['transformer']['relativeReactancePu'],xt),(out['transformer']['impedanceCorrectionKT'],kt)]
 for k,(a,b) in enumerate(refs):
  counts+=1
  if not math.isclose(a,b,rel_tol=1e-11,abs_tol=1e-11):errors.append((i,'transformer_'+str(k),a,b))
 for name in ['MAXIMUM','MINIMUM']:
  c=cf['maximum'] if name=='MAXIMUM' else cf['minimum'];smva=u['maximumEquivalentMVA'] if name=='MAXIMUM' else u['minimumEquivalentMVA'];xr=u['maximumXOverR'] if name=='MAXIMUM' else u['minimumXOverR'];temp=f['maximumConductorTemperatureC'] if name=='MAXIMUM' else f['minimumConductorTemperatureC']
  zsrc=(v*v/(smva*1e6))*complex(1,xr)/math.sqrt(1+xr*xr)
  zfeed=complex(f['resistanceOhmPerKmAt20C']*f['lengthM']/1000*(1+f['alphaPerC']*(temp-20)),f['reactanceOhmPerKm']*f['lengthM']/1000)
  ztot=zsrc+kt*complex(r,react)+zfeed
  ik=c*v/(math.sqrt(3)*abs(ztot));peak=math.sqrt(2)*(1.02+.98*math.exp(-3*ztot.real/ztot.imag))*ik
  row=next(z for z in out['scenarios'] if z['scenario']==name)
  refs=[(row['initialSymmetricalKA'],ik/1000),(row['screenPeakKA'],peak/1000),(row['sourceEquivalentLVImpedanceOhm']['r'],zsrc.real),(row['sourceEquivalentLVImpedanceOhm']['x'],zsrc.imag),(row['totalEquivalentImpedanceOhm']['r'],ztot.real),(row['totalEquivalentImpedanceOhm']['x'],ztot.imag),(row['shortCircuitCurrent']['realA'],(c*v/math.sqrt(3)/ztot).real),(row['shortCircuitCurrent']['imaginaryA'],(c*v/math.sqrt(3)/ztot).imag)]
  for k,(a,b) in enumerate(refs):
   counts+=1
   if not math.isclose(a,b,rel_tol=1e-11,abs_tol=1e-11):errors.append((i,name+'_'+str(k),a,b))
print('Transformer cases',len(cases),'accepted',len(cases)-len(fail),'failclosed',len(fail),'numeric fields',counts,'mismatches',len(errors))
assert not errors,errors[:5]
assert len(cases)-len(fail)>1100,fail[:5]
(D/'transformer_reference_results.json').write_text(json.dumps({'totalCases':len(cases),'accepted':len(cases)-len(fail),'failClosed':len(fail),'numericComparisons':counts,'mismatches':len(errors),'rejectedExamples':fail[:8],'source':'https://faq.digsilent.de/en/faq-reader-powerfactory/why-are-the-results-of-short-citcuit-calculation-depending-on-max-voltage-tolerance.html','limitations':'Independent algebraic check of bounded radial nameplate scenario only; no full IEC 60909-0 conformance'},indent=2))
