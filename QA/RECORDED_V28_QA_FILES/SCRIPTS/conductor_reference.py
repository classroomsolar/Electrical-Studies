"""Independent Python reference vs JS bounded adiabatic conductor duty, 1,500 randomized cases."""
import random,math,json,subprocess
from pathlib import Path
D=Path('/mnt/data/fault_studio_work/V28/QA');R=random.Random(20261026)
cases=[]
for n in range(1500):
 mode=['constant-rms','linear-rms-trace','documented-i2t'][n%3]
 area=R.uniform(1,1200);k=R.uniform(40,180);time=R.uniform(.005,3);margin=R.uniform(1,2)
 c={'method':mode,'studyReference':'Independent QA synthetic study reference','conductor':{'areaMm2':area,'kASqrtSPerMm2':k,'kSourceReference':'Synthetic k input for independent mathematical QA only','material':R.choice(['copper','aluminium','other']),'initialTempC':60,'maximumFaultTempC':250},'fault':{'sourceReference':'Synthetic current source for independent mathematical QA only','clearingTimeS':time},'marginFactor':margin}
 if mode=='constant-rms':c['fault']['rmsA']=R.uniform(0,100000)
 elif mode=='documented-i2t':c['fault']['documentedI2tA2s']=R.uniform(0,1e11)
 else:
  N=R.randint(2,12);t=[time*j/(N-1) for j in range(N)];c['fault']['samples']=[{'timeS':ti,'rmsA':R.uniform(0,100000)} for ti in t]
 cases.append(c)
(D/'conductor_inputs.json').write_text(json.dumps(cases))
script=D/'conductor_batch.mjs';script.write_text("""import fs from 'node:fs';import {screenConductorThermalDuty as calc} from '../site/conductor-duty-v28.mjs';
const a=JSON.parse(fs.readFileSync(new URL('./conductor_inputs.json',import.meta.url)));const b=a.map(x=>calc(x));fs.writeFileSync(new URL('./conductor_js_results.json',import.meta.url),JSON.stringify(b));
""")
subprocess.run(['node',str(script)],check=True)
js=json.loads((D/'conductor_js_results.json').read_text());count=0
for x,y in zip(cases,js):
 c=x['conductor'];f=x['fault'];k=c['kASqrtSPerMm2'];area=c['areaMm2'];duration=f['clearingTimeS'];margin=x['marginFactor'];capacity=(k*area)**2
 if x['method']=='constant-rms':i2t=f['rmsA']**2*duration
 elif x['method']=='documented-i2t':i2t=f['documentedI2tA2s']
 else:
  i2t=0
  for p,q in zip(f['samples'],f['samples'][1:]):
   t=q['timeS']-p['timeS'];i0=p['rmsA'];i1=q['rmsA'];i2t+=t*(i0*i0+i0*i1+i1*i1)/3
 ref={'documentedFaultI2tA2s':i2t,'adiabaticCapacityA2s':capacity,'marginAdjustedDemandA2s':i2t*margin,'utilizationPercent':100*i2t*margin/capacity,'minimumAreaMm2ForEnteredDemand':math.sqrt(i2t*margin)/k,'maximumConstantRmsAForClearingTime':math.sqrt(capacity/(margin*duration))}
 for key,val in ref.items():
  count+=1;assert math.isclose(val,y[key],rel_tol=2e-11,abs_tol=2e-8),(x['method'],key,val,y[key])
 assert y['withinEnteredAdiabaticCapacity']==(i2t*margin<=capacity)
assert len(js)==1500
print('PASS 1500 independent Python/JS conductor duty cases',count,'numeric field comparisons')
(D/'conductor_reference_results.json').write_text(json.dumps({'status':'PASS','randomizedCases':len(js),'numericComparisons':count,'methods':['constant-rms','linear-rms-trace','documented-i2t'],'note':'Independent mathematical reference; no OEM k factors, trip curves, or standard conformance validated'},indent=2))
