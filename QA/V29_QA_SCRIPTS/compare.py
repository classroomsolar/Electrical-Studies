import json, math, collections, sys
from oracle import solve
cases=json.load(open(sys.argv[1] if len(sys.argv)>1 else 'cases.json')); js=json.load(open(sys.argv[2] if len(sys.argv)>2 else 'js.json'))
stats=collections.Counter(); fails=[]
def rel(a,b): return abs(a-b)/max(abs(b),1e-9)
for c,r in zip(cases,js):
    cat=c['_cat']
    if not r['ok']: fails.append((c['name'],'CRASH',r['error'][:200])); continue
    if any(i.startswith('error') for i in r['issues']): fails.append((c['name'],'REJECTED',r['issues'][:3])); continue
    o=solve(c)
    for x in r['results']:
        ref=o[x['busId']]
        if ref is None:
            stats['nosource']+=1; continue
        stats['cmp']+=1
        if x['totalA'] is None: fails.append((c['name'],x['busId'],'null total',x['status'],x['faultNote'])); continue
        if rel(x['totalA'],ref['totalA'])>1e-6: fails.append((c['name'],x['busId'],'totalA',x['totalA'],ref['totalA']))
        if x['xr'] is not None:
            jx=math.inf if x['xr']=='inf' else x['xr']
            if not (jx==ref['xr'] or rel(jx,ref['xr'])<1e-6): fails.append((c['name'],x['busId'],'xr',jx,ref['xr']))
            stats['xr']+=1
        if ref['peakA'] is not None and x['peakA'] is not None:
            stats['peak']+=1
            if rel(x['peakA'],ref['peakA'])>1e-6: fails.append((c['name'],x['busId'],'peak',x['peakA'],ref['peakA']))
print(dict(stats)); print('fails',len(fails))
for f in fails[:40]: print(f)
