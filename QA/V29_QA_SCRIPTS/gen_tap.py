import random, json, math, copy
R=random.Random(20261107)
def bus(i,v): return {'id':f'b{i}','name':f'Bus {i}','voltage':v,'sequence':{'r0':None,'x0':None,'r2':None,'x2':None}}
def settings(**k):
    s={'frequency':60,'baseMVA':R.choice([1,10,100]),'scenario':'base','voltageFactor':R.choice([1,1,1.05,1.1]),'generatorStage':'initial','time':0,'faultType':'3phase','assumeZ2':True,'faultR':0,'faultX':0,'auto':True}
    s.update(k); return s
def proj(name,buses,sources,branches,st=None,devices=None):
    return {'format':'fault-current-network','version':2,'id':'p-'+name,'name':name,'buses':buses,'sources':sources,'branches':branches,'devices':devices or [],'pvArrays':[],'settings':st or settings(),'_cat':name.split('#')[0]}
def utility(i,b,v,how=None):
    how=how or R.choice(['ka','mva','impedance'])
    s={'id':f's{i}','kind':'utility','name':f'U{i}','bus':b,'voltage':v,'method':how,'model':'voltage','xr':round(R.uniform(2,30),3),'angle':0,'enabled':True}
    if how=='ka': s['faultA']=R.uniform(2e3,6e4) if v<1000 else R.uniform(1e3,4e4)
    elif how=='mva': s['faultMVA']=R.uniform(50,2000)
    else:
        z=v/(math.sqrt(3)*R.uniform(2e3,4e4)); xr=R.uniform(2,30); r=z/math.hypot(1,xr); s.update(r=r,x=r*xr)
    return s
def gen_src(i,b,v,kind='generator'):
    if kind=='generator':
        return {'id':f's{i}','kind':'generator','name':f'G{i}','bus':b,'voltage':v,'power':R.uniform(1e5,5e6),'xdpp':R.uniform(.08,.25),'xdp':R.uniform(.2,.4),'xd':R.uniform(1,2.5),'xr':R.uniform(5,40),'method':'ka','model':'voltage','angle':0,'enabled':True}
    # motor modelled as voltage source with kA contribution
    return {'id':f's{i}','kind':'motor','name':f'M{i}','bus':b,'voltage':v,'faultA':R.uniform(200,6000),'method':'ka','model':'voltage','xr':R.uniform(3,12),'angle':0,'enabled':True}
def pv(i,b,v,angle=True):
    s={'id':f's{i}','kind':'pv','name':f'PV{i}','bus':b,'voltage':v,'power':R.uniform(5e4,1e6),'multiplier':R.uniform(1.1,1.5),'model':'current','enabled':True}
    if angle: s['angle']=R.uniform(-90,0)
    return s
def xfmr(i,a,b,v1,v2,tap=1.0):
    return {'id':f't{i}','kind':'transformer','name':f'T{i}','from':a,'to':b,'v1':v1*tap,'v2':v2,'power':R.choice([75e3,150e3,300e3,500e3,750e3,1e6,1.5e6,2e6,2.5e6,5e6]),'zPercent':R.uniform(2,8),'xr':R.uniform(3,15),'shift':0,'primaryConnection':'Delta','secondaryConnection':'Wye Grounded','enabled':True}
def cable(i,a,b):
    return {'id':f'c{i}','kind':'cable','name':f'C{i}','from':a,'to':b,'length':R.uniform(1,400),'runs':R.randint(1,6),'rPerM':R.uniform(5e-5,2e-3),'xPerM':R.uniform(5e-5,3e-4),'frequency':60,'enabled':True}
def link(i,a,b): return {'id':f'l{i}','kind':'link','name':f'L{i}','from':a,'to':b,'enabled':True}

cases=[]
MV=[4160,12000,12470,13200,13800,24940,34500]; LV=[208,240,480,600]
for k in range(60):  # radial MV->LV chains with mixed sources
    mv,lv=R.choice(MV),R.choice(LV); nb=R.randint(3,7)
    bs=[bus(0,mv),bus(1,lv)]+[bus(i,lv) for i in range(2,nb)]
    br=[xfmr(0,'b0','b1',mv,lv)]+[cable(i,f'b{i-1}' if R.random()<.6 else f'b{R.randint(1,i-1)}',f'b{i}') for i in range(2,nb)]
    sr=[utility(0,'b0',mv)]
    for j in range(R.randint(0,3)): b=R.randint(1,nb-1); sr.append(gen_src(j+1,f'b{b}',lv,R.choice(['generator','motor'])))
    cases.append(proj(f'radial#{k}',bs,sr,br))
for k in range(40):  # meshed same-voltage networks with multiple sources
    v=R.choice(MV+LV); nb=R.randint(3,8); bs=[bus(i,v) for i in range(nb)]
    br=[cable(i,f'b{i-1}',f'b{i}') for i in range(1,nb)]
    for m in range(R.randint(1,4)):
        a,b=R.sample(range(nb),2); br.append(cable(100+m,f'b{a}',f'b{b}'))
    sr=[utility(j,f'b{R.randrange(nb)}',v) for j in range(R.randint(1,3))]+[gen_src(10+j,f'b{R.randrange(nb)}',v) for j in range(R.randint(0,2))]
    cases.append(proj(f'meshed#{k}',bs,sr,br))
for k in range(25):  # parallel transformers & off-nominal taps
    mv,lv=R.choice(MV),R.choice(LV)
    bs=[bus(0,mv),bus(1,lv),bus(2,lv)]
    tap=R.choice([0.95,0.975,1.0,1.025,1.05])
    br=[xfmr(0,'b0','b1',mv,lv,tap),xfmr(1,'b0','b1',mv,lv),cable(2,'b1','b2')]
    cases.append(proj(f'parallel_tap#{k}',bs,[utility(0,'b0',mv)],br))
for k in range(25):  # zero-impedance links (the historic 65 kA vs 56 kA class)
    v=R.choice(MV+LV); bs=[bus(i,v) for i in range(4)]
    br=[link(0,'b0','b1'),link(1,'b1','b2'),cable(2,'b2','b3')]
    sr=[utility(0,'b0',v)]+([gen_src(5,'b2',v)] if R.random()<.5 else [])
    cases.append(proj(f'link#{k}',bs,sr,br))
for k in range(25):  # inverter current sources (known and unknown angles)
    mv,lv=R.choice(MV),R.choice(LV)
    bs=[bus(0,mv),bus(1,lv),bus(2,lv)]
    br=[xfmr(0,'b0','b1',mv,lv),cable(1,'b1','b2')]
    sr=[utility(0,'b0',mv),pv(1,'b2',lv,R.random()<.6),pv(2,'b1',lv,R.random()<.6)]
    cases.append(proj(f'inverter#{k}',bs,sr,br))
for k in range(25):  # scenario max/min strengths, fault impedance, generator stages
    v=R.choice(LV); bs=[bus(i,v) for i in range(3)]
    br=[cable(0,'b0','b1'),cable(1,'b1','b2')]
    u=utility(0,'b0',v); u['maxStrength']=R.uniform(1,1.3); u['minStrength']=R.uniform(.5,1)
    g=gen_src(1,'b2',v); g['minInclude']=False
    st=settings(scenario=R.choice(['maximum','minimum','base']),generatorStage=R.choice(['initial','transient','steady']),faultR=R.choice([0,0,.001,.01]),faultX=R.choice([0,.002]))
    cases.append(proj(f'scenario#{k}',bs,[u,g],br,st))
# two-level transformation MV->MV->LV with cable between
for k in range(20):
    hv,mv,lv=R.choice([69000,115000]),R.choice(MV),R.choice(LV)
    bs=[bus(0,hv),bus(1,mv),bus(2,mv),bus(3,lv)]
    br=[xfmr(0,'b0','b1',hv,mv),cable(1,'b1','b2'),xfmr(2,'b2','b3',mv,lv)]
    sr=[utility(0,'b0',hv,'mva'),gen_src(1,'b3',lv,'motor')]
    cases.append(proj(f'twolevel#{k}',bs,sr,br))
for k in range(40):  # V29b: off-nominal taps (tapPercent), single and parallel, with LV sources
    mv,lv=R.choice(MV),R.choice(LV); bs=[bus(0,mv),bus(1,lv),bus(2,lv)]
    t0=xfmr(0,'b0','b1',mv,lv); t0['tapPercent']=R.choice([-5,-2.5,0,2.5,5,R.uniform(-10,10)])
    br=[t0,cable(2,'b1','b2')]
    if R.random()<.5:
        t1=xfmr(1,'b0','b1',mv,lv); t1['tapPercent']=R.choice([-2.5,0,2.5]); br.append(t1)
    sr=[utility(0,'b0',mv)]+([gen_src(3,'b2',lv)] if R.random()<.5 else [])
    cases.append(proj(f'tap#{k}',bs,sr,br))
json.dump(cases,open('cases_tap.json','w'))
json.dump(cases[:220],open('cases.json','w'))
print(len(cases))
