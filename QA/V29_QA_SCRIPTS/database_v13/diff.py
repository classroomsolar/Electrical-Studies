import gzip,json,os,sys,openpyxl,math,datetime
D='/home/claude/Electrical-Studies/SITE/database/'
m=json.loads(gzip.decompress(open(D+'manifest.json.txt','rb').read()))
ws=m['workbookSheets']
p='/home/claude/emd/repo/02_Engineering_Master_Database/Engineering_Master_Database_Audited.xlsx'
wb=openpyxl.load_workbook(p,read_only=True,data_only=False)
def norm(v):
    if isinstance(v,float) and v.is_integer(): return int(v)
    if isinstance(v,(datetime.datetime,datetime.date)): return v.isoformat()
    return v
out={}
for s in wb.worksheets:
    rows=list(s.iter_rows(values_only=True))
    while rows and all(c is None for c in rows[-1]): rows.pop()
    hdr=list(rows[0]) if rows else []
    while hdr and hdr[-1] is None: hdr.pop()
    body=[[norm(c) for c in r[:len(hdr)]] for r in rows[1:] if any(c is not None for c in r)]
    info={'v13rows':len(body),'v13cols':len(hdr)}
    if s.title in ws:
        f=ws[s.title]['file'].split('/')[-1]+'.txt'
        d=json.loads(gzip.decompress(open(D+f,'rb').read()))
        cols=d['originalColumns'][1:]
        recs=[[norm(c) for c in r[1:]] for r in d['records']]
        info.update(calcRows=len(recs),sameHeader=cols==hdr)
        if cols==hdr:
            a=set(json.dumps(r,default=str) for r in recs); b=set(json.dumps(r,default=str) for r in body)
            info.update(onlyCalc=len(a-b),onlyV13=len(b-a))
        else:
            info.update(calcCols=cols[:8],v13Cols=hdr[:8])
    else: info['new']=True
    out[s.title]=info
    print(s.title,info,flush=True)
json.dump(out,open('/home/claude/dbsync/diff.json','w'),indent=1)
