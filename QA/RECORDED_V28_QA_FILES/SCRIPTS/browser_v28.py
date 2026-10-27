from pathlib import Path
from playwright.sync_api import sync_playwright
from pypdf import PdfReader
from openpyxl import load_workbook
import re,json,hashlib
BASE=Path('/mnt/data/fault_studio_work/V28/site');OUT=Path('/mnt/data/fault_studio_work/V28/QA/browser_v28');OUT.mkdir(exist_ok=True)
pattern=re.compile(r'(?m)^\s*import\s+(?:.*?\s+from\s+)?[\'\"](\.[^\'\"]+)[\'\"]')
seen=set();order=[]
def visit(name):
 if name in seen:return
 seen.add(name);src=(BASE/name).read_text();deps={raw:(Path(name).parent/raw.split('?')[0]).as_posix() for raw in pattern.findall(src)}
 for dep in deps.values():visit(dep)
 order.append({'name':name,'src':src,'deps':deps})
visit('conductor-duty-ui-v28.mjs')
loader='''modules=>{const urls={};for(const m of modules){let code=m.src;for(const [raw,rel] of Object.entries(m.deps))code=code.replaceAll("'"+raw+"'","'"+urls[rel]+"'").replaceAll('"'+raw+'"','"'+urls[rel]+'"');urls[m.name]=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));}return urls['conductor-duty-ui-v28.mjs']}'''
methods=['constant-rms','linear-rms-trace','documented-i2t'];results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for viewport,size in [('desktop',{'width':1440,'height':900}),('mobile',{'width':390,'height':844})]:
  for method in methods:
   ctx=browser.new_context(viewport=size,accept_downloads=True);page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content('<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="app">Original Studio preserved</div></body></html>')
   page.evaluate("""()=>{const a=new Map([['fault-network-draft-v2','UNTOUCHED-LEGACY-SENTINEL'],['fault-network-studies-v2','UNTOUCHED-STUDIES-SENTINEL']]);Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>a.has(k)?a.get(k):null,setItem:(k,v)=>a.set(k,String(v)),removeItem:k=>a.delete(k)}})}""")
   entry=page.evaluate(loader,order);page.evaluate('async u=>await import(u)',entry)
   assert page.locator('#fcs-v28-launch').is_visible()
   page.locator('#fcs-v28-launch').click()
   assert page.locator('#fcs-v28-panel').is_visible()
   x=json.loads(page.locator('#fcs-v28-input').input_value());x['method']=method
   if method=='linear-rms-trace':x['fault'].pop('rmsA');x['fault']['samples']=[{'timeS':0,'rmsA':10000},{'timeS':.1,'rmsA':8000},{'timeS':.2,'rmsA':4000}]
   if method=='documented-i2t':x['fault'].pop('rmsA');x['fault']['documentedI2tA2s']=15000000
   page.locator('#fcs-v28-input').fill(json.dumps(x))
   page.locator('[data-v28="calculate"]').click()
   assert 'Calculated bounded conductor' in page.locator('#fcs-v28-status').inner_text()
   out=json.loads(page.locator('#fcs-v28-result').inner_text());assert out['method']==method
   for fmt in ['pdf','xlsx','json']:
    with page.expect_download(timeout=12000) as dl:page.locator('[data-v28="'+fmt+'"]').click()
    path=OUT/f'{viewport}_{method}.{fmt}';dl.value.save_as(str(path))
    if fmt=='pdf':
     pdf=PdfReader(path);s='\n'.join(p.extract_text() for p in pdf.pages);assert 'conductor-duty-v28' in s and 'adiabaticCapacityA2s' in s
    if fmt=='xlsx':
     wb=load_workbook(path,read_only=True,data_only=True);assert 'Equipment duty' in wb.sheetnames
     keys=[a[0] for a in list(wb['Equipment duty'].values)[1:]];assert 'adiabaticCapacityA2s' in keys and 'withinEnteredAdiabaticCapacity' in keys
    if fmt=='json':assert json.loads(path.read_text())['outputs']['method']==method
    results.append({'viewport':viewport,'method':method,'format':fmt,'size':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
   page.locator('#fcs-v28-name').fill('QA '+method)
   page.locator('[data-v28="save"]').click();assert 'saved separately' in page.locator('#fcs-v28-status').inner_text()
   assert page.evaluate("localStorage.getItem('fault-network-draft-v2')")=='UNTOUCHED-LEGACY-SENTINEL'
   assert page.evaluate("localStorage.getItem('fault-network-studies-v2')")=='UNTOUCHED-STUDIES-SENTINEL'
   page.locator('[data-v28="open"]').click();assert 'recalculate before reporting' in page.locator('#fcs-v28-result').inner_text()
   page.locator('[data-v28="pdf"]').click();assert 'Recalculate a valid' in page.locator('#fcs-v28-status').inner_text()
   if viewport=='mobile' and method=='constant-rms':page.screenshot(path=str(OUT/'mobile_conductor_modal.png'))
   assert not errors,errors
   ctx.close()
 browser.close()
(OUT/'results.json').write_text(json.dumps({'status':'PASS','modules':len(order),'downloads':len(results),'cases':results},indent=2))
print('PASS',len(results),'V28 Chromium browser PDF/XLSX/JSON exports and storage checks, desktop+mobile')
