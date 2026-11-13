# Independent oracle: pi-equivalent of an off-nominal tap (series y/t, shunts y(1-t)/t^2 at i and y(t-1)/t at j), Newton with analytic-free scipy-like root solve.
import json, numpy as np, random
random.seed(11)
def solve(net):
    ids=[b['id'] for b in net['buses']]; n=len(ids); at={b:i for i,b in enumerate(ids)}
    Y=np.zeros((n,n),complex)
    for e in net['branches']:
        i,j=at[e['from']],at[e['to']]; y=1/complex(e['rPu'],e['xPu']); t=e.get('tap',1.0)
        ys=y/t; Y[i,j]-=ys; Y[j,i]-=ys; Y[i,i]+=ys+y*(1-t)/t**2; Y[j,j]+=ys+y*(t-1)/t
    base=net['baseMVA']; bt=[b['type'] for b in net['buses']]
    V=np.array([b.get('vSetPu',1.0) if b['type']!='PQ' else 1.0 for b in net['buses']],complex)
    P=np.array([b.get('pMW',0)/base for b in net['buses']]); Q=np.array([b.get('qMvar',0) or 0 for b in net['buses']])/base
    oth=[i for i in range(n) if bt[i]!='SLACK']; pq=[i for i in range(n) if bt[i]=='PQ']
    def F(x):
        th=np.angle(V).copy(); vm=np.abs(V).copy()
        for k,i in enumerate(oth): th[i]=x[k]
        for k,i in enumerate(pq): vm[i]=x[len(oth)+k]
        Vc=vm*np.exp(1j*th); S=Vc*np.conj(Y@Vc)
        return np.concatenate([S.real[oth]-P[oth],S.imag[pq]-Q[pq]]),Vc
    x=np.concatenate([np.zeros(len(oth)),np.ones(len(pq))])
    for it in range(50):
        f,Vc=F(x)
        if np.max(np.abs(f))<1e-11: break
        J=np.zeros((len(x),len(x)));h=1e-7
        for k in range(len(x)):
            d=np.zeros(len(x));d[k]=h; J[:,k]=(F(x+d)[0]-F(x-d)[0])/(2*h)
        x=x-np.linalg.solve(J,f)
    f,Vc=F(x)
    return {'converged':bool(np.max(np.abs(f))<1e-9),'vm':[float(abs(v)) for v in Vc],'ang':[float(np.degrees(np.angle(v))) for v in Vc]}
cases=[]
for c in range(300):
    n=random.randint(3,8); buses=[{'id':'b0','type':'SLACK','vSetPu':round(random.uniform(0.97,1.05),3)}]
    for k in range(1,n):
        typ='PV' if random.random()<0.15 else 'PQ'
        b={'id':f'b{k}','type':typ,'pMW':round(-random.uniform(0,3),3) if typ=='PQ' else round(random.uniform(0.2,1.5),3)}
        if typ=='PQ': b['qMvar']=round(-random.uniform(0,1.5),3)
        else: b['vSetPu']=round(random.uniform(0.98,1.03),3)
        buses.append(b)
    br=[]
    for k in range(1,n):
        p=random.randint(0,k-1); e={'id':f'e{k}','from':f'b{p}','to':f'b{k}','rPu':round(random.uniform(0.002,0.03),5),'xPu':round(random.uniform(0.01,0.12),5)}
        if random.random()<0.6: e['tap']=round(random.choice([0.95,0.975,1.0,1.025,1.05,random.uniform(0.9,1.1)]),5)
        if random.random()<0.5: e['from'],e['to']=e['to'],e['from']
        br.append(e)
    if n>3 and random.random()<0.5:
        a,b=random.sample(range(n),2); br.append({'id':'loop','from':f'b{a}','to':f'b{b}','rPu':0.01,'xPu':0.08,'tap':1.03})
    net={'baseMVA':10,'buses':buses,'branches':br}
    o=solve(net)
    if o['converged']: cases.append({'net':net,'oracle':o})
json.dump(cases,open('cases.json','w')); print(len(cases))
