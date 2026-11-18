# Phase-domain oracle for reduced sequence faults (independent of symmetrical-component formulas).
import numpy as np, json, random, subprocess, math
R=random.Random(7)
a=np.exp(2j*np.pi/3); A=np.array([[1,1,1],[1,a*a,a],[1,a,a*a]])
def phase_fault(V,c,Z1,Z2,Z0,Zf,typ):
    Zs=A@np.diag([Z0,Z1,Z2])@np.linalg.inv(A)  # Thevenin phase impedance matrix
    E=c*V/math.sqrt(3)*np.array([1,a*a,a])
    G=1e9  # bolted connection conductance (S) for ideal ties
    # nodes: a,b,c (fault side), n = fault neutral node
    Yt=np.zeros((4,4),complex)
    def tie(i,j,y):
        Yt[i,i]+=y; 
        if j is not None: Yt[j,j]+=y; Yt[i,j]-=y; Yt[j,i]-=y
    yf=G if Zf==0 else 1/Zf
    if typ=='3PH': [tie(k,3,yf) for k in range(3)]; tie(3,None,G)
    elif typ=='AG': tie(0,None,yf)
    elif typ=='BC': tie(1,2,yf)
    elif typ=='BCG': tie(1,2,G); tie(1,3,G); tie(3,None,yf)
    # Source: V_bus = E - Zs I  =>  Norton: I_inj = Ys E, admittance Ys
    Yt[3,3]+=1e-9
    Ys=np.linalg.inv(Zs); Ytot=Yt.copy(); Ytot[:3,:3]+=Ys
    J=np.zeros(4,complex); J[:3]=Ys@E
    Vn=np.linalg.solve(Ytot,J); I=Ys@(E-Vn[:3])  # current out of source into fault
    return np.abs(I)
cases=[]
for k in range(400):
    z=lambda lo,hi:{'rOhm':R.uniform(0,hi)*R.random(),'xOhm':R.uniform(lo,hi)}
    x={'nominalLLV':R.choice([208,480,600,4160,13800,34500]),'voltageFactor':R.choice([1,1.05,1.1,0.95]),'faultType':R.choice(['3PH','AG','BC','BCG']),
       'positiveSequence':z(.001,2),'negativeSequence':z(.001,2),'zeroSequence':z(.0005,5)}
    if R.random()<.4: x['faultImpedance']={'rOhm':R.uniform(0.001,1),'xOhm':R.uniform(0,.5)}
    cases.append(x)
json.dump(cases,open('seq_cases.json','w'))
js=f"""import fs from 'node:fs';import {{reducedSequenceFault}} from '../../SITE/sequence-fault-screen.mjs';
const c=JSON.parse(fs.readFileSync('seq_cases.json'));console.log(JSON.stringify(c.map(x=>{{try{{return reducedSequenceFault(x)}}catch(e){{return {{error:e.message}}}}}})))"""
open('seq_run.mjs','w').write(js)
out=json.loads(subprocess.check_output(['node','seq_run.mjs']))
bad=0;n=0;err=0
for x,o in zip(cases,out):
    if 'error' in o: err+=1; print('ERR',o['error']); continue
    cz=lambda d:complex(d['rOhm'],d['xOhm'])
    zf=cz(x['faultImpedance']) if 'faultImpedance' in x else 0
    ref=phase_fault(x['nominalLLV'],x['voltageFactor'],cz(x['positiveSequence']),cz(x['negativeSequence']),cz(x['zeroSequence']),zf,x['faultType'])
    got=[o['phaseA'][p]['rmsA'] for p in 'abc']
    for g,r in zip(got,ref):
        n+=1
        # 0.01 A floor: the oracle models bolted ties as 1e9 S conductances
        if abs(g-r)>1e-5*max(r,1)+1e-2: bad+=1; print(x['faultType'],g,r)
print('cases',len(cases),'phase comparisons',n,'mismatches',bad,'errors',err)
