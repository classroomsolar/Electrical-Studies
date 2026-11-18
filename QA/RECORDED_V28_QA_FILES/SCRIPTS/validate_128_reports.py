from pathlib import Path
from pypdf import PdfReader
from openpyxl import load_workbook
import json,math,hashlib,zipfile
root=Path('/mnt/data/fault_studio_work/V28/QA')
cases=json.loads((root/'exports/cases.json').read_text())
def flat(v,p=''):
 if not isinstance(v,(dict,list)):
  return [(p or 'value','null' if v is None else v)]
 if isinstance(v,list):
  if not v:return [(p or 'array','[]')]
  return [z for i,x in enumerate(v) for z in flat(x,f'{p}[{i}]')]
 if not v:return [(p or 'object','{}')]
 return [z for k,x in v.items() for z in flat(x,f'{p}.{k}' if p else k)]
def equal(a,b):
 if isinstance(a,(float,int)) and not isinstance(a,bool):return isinstance(b,(float,int)) and not isinstance(b,bool) and math.isclose(a,b,rel_tol=1e-11,abs_tol=1e-11)
 if isinstance(a,bool):return b is a or b==str(a).lower()
 return str(a)==str(b)
results=[]
for version in ['V20','V27']:
 for viewport in ['desktop','mobile']:
  for case in cases:
   mode=case['method'];expected_in=flat(case['inputs']);expected_out=flat(case['outputs']);d=root/f'browser_{version}'
   x=d/f'{viewport}_{mode}.xlsx';p=d/f'{viewport}_{mode}.pdf'
   with zipfile.ZipFile(x) as z:assert z.testzip() is None,(version,mode,'ZIP CRC')
   w=load_workbook(x,read_only=True,data_only=True)
   assert w.sheetnames==['Summary','Study inputs','Equipment duty','Assumptions & QA']
   i=list(w['Study inputs'].values)[1:];o=list(w['Equipment duty'].values)[1:]
   assert len(i)==len(expected_in),(version,mode,'input rows',len(i),len(expected_in))
   assert len(o)==len(expected_out),(version,mode,'output rows',len(o),len(expected_out))
   for got,expect in zip(i,expected_in):assert got[0]==expect[0] and equal(expect[1],got[1]),(version,mode,'input mismatch',got,expect)
   for got,expect in zip(o,expected_out):assert got[0]==expect[0] and equal(expect[1],got[1]),(version,mode,'output mismatch',got,expect)
   doc=PdfReader(p,strict=True);pdf='\n'.join(q.extract_text() for q in doc.pages)
   assert len(doc.pages)>=1 and 'ENGINEERING REVIEW REQUIRED' in pdf
   assert f'Method: {mode}' in pdf and 'ENGINEERING SCREENING ONLY' in pdf
   assert f'Model status: {case["outputs"]["status"]}' in pdf
   assert pdf.count('Input path: ')==len(expected_in),(version,mode,'PDF input row count',pdf.count('Input path: '),len(expected_in))
   assert pdf.count('Calculated output path: ')==len(expected_out),(version,mode,'PDF output row count',pdf.count('Calculated output path: '),len(expected_out))
   results.append({'version':version,'viewport':viewport,'mode':mode,'pdfPages':len(doc.pages),'pdfInputPaths':len(expected_in),'pdfOutputPaths':len(expected_out),'xlsxInputRows':len(i),'xlsxOutputRows':len(o),'sha256pdf':hashlib.sha256(p.read_bytes()).hexdigest(),'sha256xlsx':hashlib.sha256(x.read_bytes()).hexdigest()})
print('PASS',len(results),'PDF/XLSX pairs =',len(results)*2,'documents; full input/output field checks',sum(x['pdfInputPaths']+x['pdfOutputPaths'] for x in results)*2)
(root/'report_validation.json').write_text(json.dumps({'status':'PASS','pairs':len(results),'documents':len(results)*2,'rowsVerified':sum(x['pdfInputPaths']+x['pdfOutputPaths'] for x in results),'cases':results},indent=2))
