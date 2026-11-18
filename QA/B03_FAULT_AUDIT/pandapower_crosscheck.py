"""Batch 3 (R326, R332): cross-check of the Fault Current Studio 3-phase engine against pandapower (free, open source,
IEC 60909-0 implementation; https://www.pandapower.org). Independent code base: nothing is shared with the site engine.

Method
- Cases: QA/V29_QA_SCRIPTS/cases.json; only cases that both tools model the same way are used:
  utility sources only (no generator / motor / inverter models), every source voltage equal to its bus voltage,
  nominal transformer ratios (winding voltages equal to bus voltages, no tap), bolted fault (faultR = faultX = 0).
- pandapower: case='max', lv_tol_percent=10 -> c = 1.10 at every bus; transformer correction KT switched off
  (power_station_unit=True) because the engine's base network calculation applies no KT; ext_grid S''kQ chosen so that
  ZQ = c*Un^2/S''kQ equals the engine's source impedance; R/X of the source kept.
- Engine: QA/V29_QA_SCRIPTS/run_engine.mjs output; engine current scaled by 1.10 / voltageFactor of the case
  (both give I = c*Un/(sqrt3*|Zth|) for a passive network with equal source voltages).
Usage: python3 pandapower_crosscheck.py CASES.json ENGINE_RESULTS.json"""
import json,sys,math,os,warnings
warnings.filterwarnings('ignore')
import pandapower as pp, pandapower.shortcircuit as sc
SQ3=math.sqrt(3);C=1.10
cases=json.load(open(sys.argv[1]));js=json.load(open(sys.argv[2]))
def zsrc(s):
    if s.get('method')=='impedance': return complex(s['r'],s['x'])
    V=s['voltage']; mag=V**2/(s['faultMVA']*1e6) if s.get('method')=='mva' else V/(SQ3*s['faultA'])
    xr=s.get('xr'); r=mag/math.hypot(1,xr) if xr else 0; return complex(r, r*xr if xr else mag)
rows=[];skipped={}
for c,r in zip(cases,js):
    st=c['settings'];why=None
    if not r.get('ok'): why='engine rejected'
    elif any(s['kind']!='utility' for s in c['sources'] if s.get('enabled',True)): why='non-utility source'
    elif st.get('faultR') or st.get('faultX'): why='fault impedance'
    bv={b['id']:b['voltage'] for b in c['buses']}
    if not why and any(abs(s['voltage']-bv[s['bus']])>1e-9 for s in c['sources']): why='source voltage differs from bus'
    if not why and any(e['kind']=='transformer' and (e.get('tapPercent') or abs(max(e['v1'],e['v2'])-max(bv[e['from']],bv[e['to']]))>1e-6 or abs(min(e['v1'],e['v2'])-min(bv[e['from']],bv[e['to']]))>1e-6 or e.get('shift')) for e in c['branches'] if e.get('enabled',True)): why='off-nominal or shifted transformer'
    if why: skipped[why]=skipped.get(why,0)+1; continue
    net=pp.create_empty_network(f_hz=st.get('frequency',60))
    B={b['id']:pp.create_bus(net,vn_kv=b['voltage']/1000,name=b['id']) for b in c['buses']}
    for s in c['sources']:
        if s.get('enabled') is False: continue
        z=zsrc(s);Un=s['voltage']/1000
        pp.create_ext_grid(net,B[s['bus']],s_sc_max_mva=C*Un**2/abs(z),rx_max=(z.real/z.imag if z.imag else 0.0),s_sc_min_mva=C*Un**2/abs(z),rx_min=(z.real/z.imag if z.imag else 0.0))
    for e in c['branches']:
        if e.get('enabled') is False: continue
        a,b=B[e['from']],B[e['to']]
        if e['kind']=='cable':
            pp.create_line_from_parameters(net,a,b,length_km=e['length']/1000,r_ohm_per_km=e['rPerM']*1000,x_ohm_per_km=e['xPerM']*1000,c_nf_per_km=0,max_i_ka=10,parallel=e['runs'])
        elif e['kind']=='link':
            pp.create_switch(net,a,b,et='b',closed=True)
        else:
            hv,lv=(a,b) if bv[e['from']]>=bv[e['to']] else (b,a)
            zp=e['zPercent'];xr=e.get('xr');vkr=zp/math.hypot(1,xr) if xr else 0
            pp.create_transformer_from_parameters(net,hv,lv,sn_mva=e['power']/1e6,vn_hv_kv=max(e['v1'],e['v2'])/1000,vn_lv_kv=min(e['v1'],e['v2'])/1000,vk_percent=zp,vkr_percent=vkr,pfe_kw=0,i0_percent=0,shift_degree=0)
    if len(net.trafo): net.trafo['power_station_unit']=True
    try:
        sc.calc_sc(net,fault='3ph',case='max',lv_tol_percent=10,ip=True,kappa_method='C')
    except Exception as ex:
        skipped['pandapower error']=skipped.get('pandapower error',0)+1;continue
    k=C/st.get('voltageFactor',1)
    for x in r['results']:
        if x.get('totalA') in (None,0):continue
        ref=net.res_bus_sc.loc[B[x['busId']],'ikss_ka']*1000
        if not ref or math.isnan(ref):continue
        got=x['totalA']*k
        ipC=net.res_bus_sc.loc[B[x['busId']],'ip_ka']*1000
        pk=(x.get('peakA') or 0)*k
        rows.append({'case':c['name'],'cat':c['_cat'],'bus':x['busId'],'engine_A_at_c1.1':float(got),'pandapower_A':float(ref),'rel':float(abs(got-ref)/ref),
                     'engine_peak_A':float(pk),'pandapower_ip_methodC_A':float(ipC),'peak_ratio':float(pk/ipC) if ipC else None})
worst=max(rows,key=lambda r:r['rel']) if rows else None
pr=[r['peak_ratio'] for r in rows if r['peak_ratio']]
from collections import Counter as _C
def _multi(name):
    c=next(x for x in cases if x['name']==name);k=_C(s['bus'] for s in c['sources'] if s.get('enabled',True));return max(k.values())>1
one=[r['peak_ratio'] for r in rows if r['peak_ratio'] and not _multi(r['case'])];sev=[r['peak_ratio'] for r in rows if r['peak_ratio'] and _multi(r['case'])]
# pandapower method C scales the reactance of the summed source admittance of a bus, not of each source; with several sources of
# different X/R on one bus the two differ. The engine scales every element, as IEC 60909-0 describes (checked by oracle.py).
split={'one_source_per_bus':{'n':len(one),'min':min(one) if one else None,'max':max(one) if one else None},'several_sources_on_one_bus':{'n':len(sev),'min':min(sev) if sev else None,'max':max(sev) if sev else None}}
out={'peak_split':split,'peak_vs_IEC_method_C':{'n':len(pr),'min_ratio':min(pr),'max_ratio':max(pr),'engine_below_by_more_than_1pct':sum(x<0.99 for x in pr),'worst_low':min(rows,key=lambda r:r['peak_ratio'] or 9)} if pr else None,'compared':len(rows),'cases':len({r['case'] for r in rows}),'skipped':skipped,'tolerance':1e-6,'fail':sum(r['rel']>1e-6 for r in rows),'worst':worst}
json.dump({'summary':out,'rows':rows},open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'results','pandapower_crosscheck.json'),'w'),indent=1)
print(json.dumps(out,indent=1))
