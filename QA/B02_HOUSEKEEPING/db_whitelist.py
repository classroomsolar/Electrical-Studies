"""Batch 2 (D-07, D-03): reduce the prepared v13 import in SITE/database to the tables Fault Current Studio needs.
- deletes the files on the drop list (DATABASE_MAP.md), removes them from manifest.workbookSheets
- no record filtering inside tables (owner: no 35 kV limit on data)
Usage: python3 db_whitelist.py SITE/database   (idempotent; prints a summary)"""
import gzip,json,os,sys
D=sys.argv[1];here=os.path.dirname(os.path.abspath(__file__))
plan=json.load(open(os.path.join(here,'db_keep_drop.json')))
rd=lambda f:json.loads(gzip.open(os.path.join(D,f)).read())
def wr(f,obj):
  raw=json.dumps(obj,ensure_ascii=False,separators=(',',':')).encode()
  with gzip.GzipFile(os.path.join(D,f),'wb',mtime=0) as g:g.write(raw)
  return len(raw)
man=rd('manifest.json.txt');rep={'deleted':[],'removedSheets':[]}
dropfiles=set(plan['drop'])
for sheet,meta in list(man['workbookSheets'].items()):
  f=os.path.basename(meta['file'])+'.txt'
  if f in dropfiles:del man['workbookSheets'][sheet];rep['removedSheets'].append(sheet)
for f in sorted(dropfiles):
  p=os.path.join(D,f)
  if os.path.exists(p):os.remove(p);rep['deleted'].append(f)
# Owner (15 Nov 2026): no voltage limit on database records. The MV breaker table is kept whole.
man['scopeBatch2']=('Only the tables Fault Current Studio needs (DATABASE_MAP.md, decision D-07). The complete v13 workbook stays in classroomsolar/engineering-master-database.')
man['workbook']['sheetsServed']=len(man['workbookSheets'])
# Batch 3 (I-09): the equipment picker reads the master-* sheet files; drop the picker copies (same rows)
rep['pickerCopiesRemoved']=[]
for sheet,meta in man['sheets'].items():
  if sheet in man['workbookSheets']:
    f=os.path.basename(meta['file'])+'.txt';p=os.path.join(D,f)
    if not os.path.basename(meta['file']).startswith('master-') and os.path.exists(p):os.remove(p);rep['pickerCopiesRemoved'].append(f)
    meta.update(pickerCount=meta.get('pickerCount',meta['count']),file=man['workbookSheets'][sheet]['file'],bytes=man['workbookSheets'][sheet]['bytes'],count=man['workbookSheets'][sheet]['count'])
if man.get('cablePicker'):
  p=os.path.join(D,os.path.basename(man.pop('cablePicker')['file'])+'.txt')
  if os.path.exists(p):os.remove(p);rep['pickerCopiesRemoved'].append(os.path.basename(p))
wr('manifest.json.txt',man)
rep['sheetsServed']=len(man['workbookSheets']);rep['filesNow']=len([f for f in os.listdir(D) if f.endswith('.json.txt')])
rep['bytesNow']=sum(os.path.getsize(os.path.join(D,f)) for f in os.listdir(D) if f.endswith('.json.txt'))
json.dump(rep,open(os.path.join(here,'results','db_whitelist.json'),'w'),indent=1)
print({k:(v if not isinstance(v,list) else len(v)) for k,v in rep.items()})
