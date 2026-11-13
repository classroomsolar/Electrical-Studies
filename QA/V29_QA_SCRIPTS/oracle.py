"""Independent numpy oracle for balanced 3-phase bolted/impedance faults.
Written from first principles (per-unit nodal admittance, Zbus inversion, superposition),
not translated from the JS engine."""
import numpy as np, json, math, random, sys

SQ3=math.sqrt(3)
def zmag(mag,xr):
    if xr is None: return complex(0,mag)
    r=mag/math.hypot(1,xr); return complex(r,r*xr)

def source_ohms(s,settings):
    if s.get('method')=='impedance': return complex(s['r'],s['x'])
    V=s['voltage']
    if s['kind']=='generator':
        st=settings.get('generatorStage','initial')
        xd={'transient':s.get('xdp'),'steady':s.get('xd')}.get(st,s.get('xdpp'))
        x=V**2/s['power']*xd; xr=s.get('xr')
        return complex(x/xr if xr else 0,x)
    mag=V**2/(s['faultMVA']*1e6) if s.get('method')=='mva' else V/(SQ3*s['faultA'])
    return zmag(mag,s.get('xr'))

def solve(p):
    st=p['settings']; base=st.get('baseMVA',1)*1e6
    buses=p['buses']; idx={b['id']:k for k,b in enumerate(buses)}; n=len(buses)
    V=np.array([b['voltage'] for b in buses],float)
    Zb=V**2/base; Ib=base/(SQ3*V)
    Y=np.zeros((n,n),complex); adj=[set() for _ in range(n)]
    for e in p['branches']:
        if e.get('enabled') is False: continue
        i,j=idx[e['from']],idx[e['to']]
        t=1+0j
        if e['kind']=='transformer':
            z=zmag(e['v2']**2/e['power']*e['zPercent']/100,e.get('xr'))
            t=(e['v1']*(1+(e.get('tapPercent') or 0)/100)/e['v2'])/(V[i]/V[j])*np.exp(1j*math.radians(e.get('shift',0) or 0))
        elif e['kind']=='cable':
            z=complex(e['rPerM'],e['xPerM'])*e['length']/e['runs']
        else: z=0j
        zpu=z/Zb[j]
        if abs(zpu)<1e-10*base/1e6: zpu=1e-10*base/1e6+0j
        y=1/zpu
        # ideal transformer t:1 on from side
        Y[i,i]+=y/abs(t)**2; Y[j,j]+=y; Y[i,j]-=y/np.conj(t); Y[j,i]-=y/t
        adj[i].add(j); adj[j].add(i)
    scen=st.get('scenario','base'); vf=st.get('voltageFactor',1)
    vs=[];cs=[]
    for s in p['sources']:
        if s.get('enabled') is False: continue
        if scen=='maximum' and s.get('maxInclude') is False: continue
        if scen=='minimum' and s.get('minInclude') is False: continue
        f={'maximum':s.get('maxStrength'),'minimum':s.get('minStrength')}.get(scen)
        f=1 if f is None else f
        if not f>0: continue
        i=idx[s['bus']]
        if s['kind'] in ('pv','bess') or s.get('model')=='current':
            amps=(s['faultA'] if s.get('faultA') else s['power']/(SQ3*s['voltage'])*s['multiplier'])*f
            ang=s.get('angle'); 
            cs.append((i,amps/Ib[i]*np.exp(1j*math.radians(-90 if ang is None else ang)),ang is None))
        else:
            zpu=source_ohms(s,st)/f/Zb[i]; y=1/zpu; Y[i,i]+=y
            vs.append((i,y*vf*np.exp(1j*math.radians(s.get('angle',0) or 0))))
    out={}
    # connected components
    seen=[-1]*n
    for k in range(n):
        if seen[k]>=0: continue
        q=[k]; seen[k]=k
        for a in q:
            for b in adj[a]:
                if seen[b]<0: seen[b]=k; q.append(b)
    zf_ohm=complex(st.get('faultR',0) or 0,st.get('faultX',0) or 0)
    for f in range(n):
        comp=[k for k in range(n) if seen[k]==seen[f]]
        if not any(i in comp for i,_ in vs): out[buses[f]['id']]=None; continue
        Ysub=Y[np.ix_(comp,comp)]; Z=np.linalg.inv(Ysub); lf=comp.index(f)
        zf=zf_ohm/Zb[f]
        conv=0j; known=0j; bound=0.0
        for i,inj in vs:
            if i not in comp: continue
            Ivec=np.zeros(len(comp),complex); Ivec[comp.index(i)]=inj
            vpre=Z@Ivec; conv+=vpre[lf]/(Z[lf,lf]+zf)*Ib[f]
        for i,inj,unk in cs:
            if i not in comp: continue
            Ivec=np.zeros(len(comp),complex); Ivec[comp.index(i)]=inj
            vpre=Z@Ivec; c=vpre[lf]/(Z[lf,lf]+zf)*Ib[f]
            if unk: bound+=abs(c)
            else: known+=c
        total=abs(conv+known)+bound
        zth=Z[lf,lf]*Zb[f]; zd=zth+zf_ohm
        xr=math.inf if zd.real==0 else zd.imag/zd.real
        peak=None
        if not cs: peak=SQ3*0+math.sqrt(2)*(1.02+0.98*math.exp(-3/max(xr,1e-8)))*abs(conv)
        out[buses[f]['id']]={'totalA':total,'xr':xr,'peakA':peak,'zth':zth}
    return out
