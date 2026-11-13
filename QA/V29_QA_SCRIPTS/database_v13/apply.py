import gzip,json,os,sys,hashlib,shutil
sys.path.insert(0,'/home/claude/dbsync'); from rules import rule
D='/home/claude/Electrical-Studies/SITE/database/'; O='/home/claude/dbsync/out/'
L=lambda p:json.loads(gzip.decompress(open(p,'rb').read()))
W=lambda p,obj:open(p,'wb').write(gzip.compress(json.dumps(obj,ensure_ascii=False,separators=(',',':')).encode(),9,mtime=0))
m=L(D+'manifest.json.txt'); summ=json.load(open('/home/claude/dbsync/summary.json'))
XLSX='/home/claude/emd/repo/02_Engineering_Master_Database/Engineering_Master_Database_Audited.xlsx'
sha=hashlib.sha256(open(XLSX,'rb').read()).hexdigest()
keep=[s for s in summ if not s.startswith('CEC_')]
excluded=[s for s in summ if s.startswith('CEC_')]
ws={}
for s in keep:
    meta=summ[s]; fn=meta['file'].split('/')[-1]+'.txt'
    shutil.copyfile(O+fn,D+fn)
    old=m['workbookSheets'].get(s,{})
    ws[s]={'count':meta['count'],'file':meta['file'],'bytes':meta['bytes'],'columns':meta['columns'],
           'usage':old.get('usage','Other workbook references'),
           'description':old.get('description',{'REQUEST_AUDIT':'Audit log of database change requests (v13).','EQUIPMENT_RECORD_HISTORY':'Per-record correction history (v13).','RECORD_RECONCILIATION':'Record reconciliation ledger (v13).'}.get(s,'Workbook reference (v13).'))}
m['workbookSheets']=ws
# picker files
for sheet,meta in m['sheets'].items():
    full=L(O+summ[sheet]['file'].split('/')[-1]+'.txt'); cols=full['columns']
    recs=[{c:v for c,v in zip(cols,r) if v is not None} for r in full['records']]
    sub=[r for r in recs if rule(sheet,r)]
    obj={'sheet':sheet,'workbook':'Engineering_Master_Database_Audited.xlsx','records':sub}
    W(D+meta['file'].split('/')[-1]+'.txt',obj)
    meta.update(count=len(sub),originalCount=len(recs),bytes=len(json.dumps(obj,ensure_ascii=False,separators=(',',':')).encode()))
    if sheet=='CABLES':
        cp=L(D+'cable-picker.json.txt'); pc=cp['columns']
        byrow={r[0]:dict(zip(cols,r)) for r in full['records']}
        cp['records']=[[byrow[r['_row']].get(c) for c in pc] for r in sub]
        W(D+'cable-picker.json.txt',cp)
        m['cablePicker'].update(count=len(sub),bytes=len(json.dumps(cp,ensure_ascii=False,separators=(',',':')).encode()))
m['imported']='2026-11-07'
m['workbook'].update(sha256=sha,sheets=len(summ),records=sum(summ[s]['count'] for s in summ),version='Library master version 13',source='github.com/classroomsolar/engineering-master-database 02_Engineering_Master_Database/Engineering_Master_Database_Audited.xlsx')
m['excludedSheets']={'sheets':excluded,'reason':'CEC listing memberships, archives and provenance ledgers. In master v13 CEC membership is attached provenance, not a separate catalogue; PV_MODULES and IBR already carry the equipment records. Kept out to stay inside the 20 MiB hosting limit.'}
m['previousImport']={'imported':'2026-10-19','sha256':'cab11d2c31d5a5873817837aad1356c93a45143e4bacae3ec879e20db465af13','sheets':93}
W(D+'manifest.json.txt',m)
print({k:(v['count'],v['originalCount']) for k,v in m['sheets'].items()})
# reference tables module
tabs={'conductorSizes':'CONDUCTOR_SIZES','thermalFactors':'CABLE_SC_K_FACTORS','insulationClasses':'INSULATION_CLASSES','conductorMaterials':'CONDUCTOR_MATERIALS','groundingResistors':'NEUTRAL_GROUNDING_RESISTORS'}
out={}
for k,s in tabs.items():
    full=L(O+summ[s]['file'].split('/')[-1]+'.txt');cols=full['columns']
    out[k]=[{c:v for c,v in zip(cols,r) if v is not None} for r in full['records']]
json.dump(out,open('/home/claude/dbsync/reftables.json','w'),ensure_ascii=False)
print({k:len(v) for k,v in out.items()})
