import json, random, subprocess, numpy as np
R=random.Random(99); cases=[]
for k in range(120):
    V=R.choice([24,48,125,250,600,1000,1500]); nb=R.randint(2,7)
    buses=[{'id':f'b{i}','name':f'B{i}','voltage':V} for i in range(nb)]
    br=[]
    for i in range(1,nb):
        j=R.randrange(i)
        if R.random()<.2: br.append({'id':f'l{i}','kind':'link','name':'L','from':f'b{j}','to':f'b{i}','enabled':True})
        else: br.append({'id':f'c{i}','kind':'cable','name':'C','from':f'b{j}','to':f'b{i}','rPerM':R.uniform(1e-4,5e-3),'length':R.uniform(1,200),'runs':R.randint(1,4),'dcResistanceBasis':R.choice(['full-loop','matched-pair']),'dataReference':'test','enabled':True})
    for m in range(R.randint(0,2)):
        a,b=R.sample(range(nb),2); br.append({'id':f'm{m}','kind':'cable','name':'C','from':f'b{a}','to':f'b{b}','dcLoopResistanceOhm':R.uniform(.001,.5),'dataReference':'t','enabled':True})
    src=[{'id':f's{j}','kind':'other','name':'Batt','bus':f'b{R.randrange(nb)}','model':'voltage','dcModel':'resistive-voltage','voltage':V*R.uniform(.95,1.05),'dcResistanceOhm':R.uniform(.001,.2),'dcResistanceBasis':'full-loop','dataReference':'t','enabled':True} for j in range(R.randint(1,3))]
    cases.append({'buses':buses,'sources':src,'branches':br,'devices':[],'settings':{'faultType':'dc','faultR':R.choice([0,0,.01,.1]),'faultX':0,'scenario':'base','voltageFactor':1,'frequency':60,'baseMVA':1}})
json.dump(cases,open('dc_cases.json','w'))
open('dc_run.mjs','w').write("""import fs from 'node:fs';import {calculateDcProject} from '../../SITE/dc-network.mjs';
const c=JSON.parse(fs.readFileSync('dc_cases.json'));console.log(JSON.stringify(c.map(p=>{try{const r=calculateDcProject(p);return {errs:r.issues.filter(i=>i.severity==='error').map(i=>i.message),res:r.results.map(x=>({id:x.busId,a:x.totalA,st:x.status}))}}catch(e){return {crash:e.message}}})))""")
out=json.loads(subprocess.check_output(['node','dc_run.mjs']))
n=bad=0
for p,o in zip(cases,out):
    if 'crash' in o or o['errs']: print('ERR',o); continue
    # independent oracle: links merge nodes (union-find), nodal conductance
    ids=[b['id'] for b in p['buses']]; par={i:i for i in ids}
    def f(x):
        while par[x]!=x: x=par[x]
        return x
    for e in p['branches']:
        if e['kind']=='link': par[f(e['to'])]=f(e['from'])
    nodes=sorted({f(i) for i in ids}); ix={k:i for i,k in enumerate(nodes)}; G=np.zeros((len(nodes),)*2); J=np.zeros(len(nodes))
    for e in p['branches']:
        if e['kind']=='link': continue
        r=e.get('dcLoopResistanceOhm') or e['rPerM']*e['length']/e['runs']*(2 if e.get('dcResistanceBasis')=='matched-pair' else 1)
        a,b=ix[f(e['from'])],ix[f(e['to'])]
        if a==b: continue
        G[a,a]+=1/r;G[b,b]+=1/r;G[a,b]-=1/r;G[b,a]-=1/r
    for s in p['sources']:
        a=ix[f(s['bus'])]; G[a,a]+=1/s['dcResistanceOhm']; J[a]+=s['voltage']/s['dcResistanceOhm']
    Z=np.linalg.inv(G); V=Z@J
    for r in o['res']:
        k=ix[f(r['id'])]; ref=V[k]/(Z[k,k]+p['settings']['faultR']); n+=1
        if r['a'] is None or abs(r['a']-ref)>1e-7*ref: bad+=1; print(r,ref)
print('DC bus comparisons',n,'mismatches',bad)
