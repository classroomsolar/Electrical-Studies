# Build master-*.json (schema 1) for every v13 sheet from cached values; measure gz sizes.
import gzip,json,openpyxl,datetime,re,os,sys
OUT='/home/claude/dbsync/out/'; os.makedirs(OUT,exist_ok=True)
p='/home/claude/emd/repo/02_Engineering_Master_Database/Engineering_Master_Database_Audited.xlsx'
wb=openpyxl.load_workbook(p,read_only=True,data_only=True)
def norm(v):
    if isinstance(v,float):
        if v!=v or v in (float('inf'),float('-inf')): return None
        if v.is_integer(): return int(v)
    if isinstance(v,(datetime.datetime,datetime.date,datetime.time)): return v.isoformat()
    if isinstance(v,str) and v.startswith('#') and v.endswith(('!','?','A')) and v.upper() in ('#N/A','#VALUE!','#REF!','#DIV/0!','#NAME?','#NUM!','#NULL!'): return None
    return v
summary={}
for s in wb.worksheets:
    rows=s.iter_rows(values_only=True)
    hdr=list(next(rows,[]) or [])
    while hdr and hdr[-1] is None: hdr.pop()
    hdr=[str(h) if h is not None else f'Column {i+1}' for i,h in enumerate(hdr)]
    # dedupe header names
    seen={};cols=[]
    for h in hdr:
        k=h; n=2
        while k in seen or k in ('_row','__proto__','prototype','constructor'): k=f'{h} ({n})'; n+=1
        seen[k]=1; cols.append(k)
    recs=[]
    for i,r in enumerate(rows,start=2):
        vals=[norm(c) for c in list(r)[:len(cols)]]
        vals+= [None]*(len(cols)-len(vals))
        if all(v is None for v in vals): continue
        recs.append([i]+vals)
    d={'schema':1,'sheet':s.title,'workbook':'Engineering_Master_Database_Audited.xlsx','columns':['_row']+cols,'originalColumns':['_row']+cols,'records':recs}
    raw=json.dumps(d,ensure_ascii=False,separators=(',',':')).encode()
    gz=gzip.compress(raw,9,mtime=0)
    fn='master-'+re.sub(r'[^a-z0-9_-]','_',s.title.lower())+'.json'
    open(OUT+fn+'.txt','wb').write(gz)
    summary[s.title]={'count':len(recs),'file':'database/'+fn,'bytes':len(raw),'gz':len(gz),'columns':cols}
    print(s.title,len(recs),len(gz),flush=True)
json.dump(summary,open('/home/claude/dbsync/summary.json','w'))
print('TOTAL gz',sum(v['gz'] for v in summary.values()))
