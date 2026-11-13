import json, copy, math
base=json.load(open('cases.json'))[0]  # radial case
c0=copy.deepcopy(base)
def mut(name,f):
    c=copy.deepcopy(base); f(c); c['name']=name; c['_cat']='adv'; return c
A=[]
src=lambda c:c['sources'][0]; tx=lambda c:c['branches'][0]; cb=lambda c:c['branches'][1] if len(c['branches'])>1 else None
A+= [mut('neg_fault',lambda c:src(c).update(faultA=-5000,method='ka')),
 mut('zero_fault',lambda c:src(c).update(faultA=0,method='ka')),
 mut('str_fault',lambda c:src(c).update(faultA='5000',method='ka')),
 mut('nan_fault',lambda c:src(c).update(faultA='__NaN__',method='ka')),
 mut('huge_fault',lambda c:src(c).update(faultA=1e300,method='ka')),
 mut('tiny_fault',lambda c:src(c).update(faultA=1e-300,method='ka')),
 mut('neg_xr',lambda c:src(c).update(xr=-3)),
 mut('zero_xr',lambda c:src(c).update(xr=0)),
 mut('huge_xr',lambda c:src(c).update(xr=1e12)),
 mut('neg_z',lambda c:tx(c).update(zPercent=-5)),
 mut('zero_z',lambda c:tx(c).update(zPercent=0)),
 mut('z_200',lambda c:tx(c).update(zPercent=200)),
 mut('zero_kva',lambda c:tx(c).update(power=0)),
 mut('missing_to',lambda c:tx(c).update(to='nope')),
 mut('self_loop',lambda c:tx(c).update(to=tx(c)['from'])),
 mut('neg_len',lambda c:cb(c) and cb(c).update(length=-10)),
 mut('zero_runs',lambda c:cb(c) and cb(c).update(runs=0)),
 mut('frac_runs',lambda c:cb(c) and cb(c).update(runs=1.5)),
 mut('neg_r',lambda c:cb(c) and cb(c).update(rPerM=-1e-4)),
 mut('neg_busv',lambda c:c['buses'][1].update(voltage=-480)),
 mut('zero_busv',lambda c:c['buses'][1].update(voltage=0)),
 mut('no_sources',lambda c:c.update(sources=[])),
 mut('all_disabled',lambda c:[s.update(enabled=False) for s in c['sources']]),
 mut('dup_id',lambda c:c['buses'][1].update(id=c['buses'][0]['id'])),
 mut('base_zero',lambda c:c['settings'].update(baseMVA=0)),
 mut('base_neg',lambda c:c['settings'].update(baseMVA=-10)),
 mut('vf_zero',lambda c:c['settings'].update(voltageFactor=0)),
 mut('vf_neg',lambda c:c['settings'].update(voltageFactor=-1.1)),
 mut('faultR_neg',lambda c:c['settings'].update(faultR=-0.5)),
 mut('src_on_missing_bus',lambda c:src(c).update(bus='ghost')),
 mut('src_voltage_mismatch',lambda c:src(c).update(voltage=src(c)['voltage']*1.5)),
 mut('floating_bus',lambda c:c['buses'].append({'id':'iso','name':'iso','voltage':480,'sequence':{}})),
 mut('enabled_string',lambda c:src(c).update(enabled='yes')),
 mut('strength_neg',lambda c:(src(c).update(maxStrength=-1),c['settings'].update(scenario='maximum'))),
 mut('xr_string',lambda c:src(c).update(xr='abc')),
 mut('shift_string',lambda c:tx(c).update(shift='30')),
 mut('xr_inf_like',lambda c:tx(c).update(xr='__Inf__')),
]
json.dump(A,open('adv.json','w'),allow_nan=True)
print(len(A))
