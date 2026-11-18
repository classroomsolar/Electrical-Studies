"""Source-isolated Chromium test: no public host requests; V20 and V27 complete advanced UI.
Loads actual ES modules as in-memory Blob URLs, preserving dependency structure.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,re,hashlib,time,sys
ROOT=Path('/mnt/data/fault_studio_work')
BASE=ROOT/sys.argv[1]
OUT=ROOT/'V28'/'QA'/('browser_'+sys.argv[1])
OUT.mkdir(parents=True,exist_ok=True)
pattern=re.compile(r'(?m)^\s*import\s+(?:.*?\s+from\s+)?[\'\"](\.[^\'\"]+)[\'\"]')
order=[];seen=set();visiting=set()
def visit(name):
 if name in seen:return
 if name in visiting:raise ValueError('Dependency cycle: '+name)
 visiting.add(name)
 src=(BASE/name).read_text()
 deps={s:(Path(name).parent/Path(s.split('?')[0])).as_posix() for s in pattern.findall(src)}
 for dep in deps.values():visit(dep)
 order.append({'name':name,'src':src,'deps':deps})
 visiting.remove(name);seen.add(name)
visit('engineering-core-ui.mjs')
print('Module dependency graph',len(order),'source files',BASE)

modes=['fault','multisource','multivoltage','transformer60909','sequence','multisequence','multienvelope','contingency','peakscreen','faultsweep','thermal','resistance','buried','protectionrange','phasorduty','acdcwave']
js='''(modules)=>{
  const urls={};
  for(const m of modules){
    let code=m.src;
    for(const [raw,relative] of Object.entries(m.deps)){
      if(!urls[relative])throw Error('Missing dependency '+relative);
      code=code.replaceAll("'"+raw+"'","'"+urls[relative]+"'").replaceAll('"'+raw+'"','"'+urls[relative]+'"');
    }
    urls[m.name]=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));
  }
  window.__fcsModules=urls;
  return urls['engineering-core-ui.mjs'];
}'''
summary=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for label,size in [('desktop',{'width':1440,'height':900}),('mobile',{'width':390,'height':844})]:
  for batch_start in range(0,len(modes),4):
   ctx=browser.new_context(viewport=size,accept_downloads=True)
   page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="app">Original project retained</div></body></html>')
   entry=page.evaluate(js,order)
   page.evaluate('async url=>{await import(url)}',entry)
   page.locator('#fcs-method-open').click()
   assert page.locator('#fcs-method-screen').get_attribute('data-open')=='true'
   if label=='mobile' and batch_start==0:page.screenshot(path=str(OUT/'mobile_modal.png'))
   for mode in modes[batch_start:batch_start+4]:
    page.locator('#fcs-method-mode').select_option(mode)
    page.locator('#fcs-method-panel button[data-method="run"]').click()
    status=page.locator('#fcs-method-status').inner_text()
    assert status.startswith('Bounded study calculated.'),(mode,status)
    output=json.loads(page.locator('#fcs-method-output').inner_text())
    assert output.get('status'),mode
    for fmt in ['pdf','xlsx']:
     with page.expect_download(timeout=12000) as dl:
      page.locator('#fcs-method-panel button[data-method="'+fmt+'"]').click()
     download=dl.value
     path=OUT/f'{label}_{mode}.{fmt}'
     download.save_as(str(path))
     b=path.read_bytes()
     if fmt=='pdf':assert b.startswith(b'%PDF-')
     else:assert b.startswith(b'PK\x03\x04')
     summary.append({'viewport':label,'mode':mode,'format':fmt,'size':len(b),'sha256':hashlib.sha256(b).hexdigest(),'status':output['status'],'filename':download.suggested_filename})
    print(sys.argv[1],label,mode,'PDF/XLSX downloaded')
   assert not errors,errors
   ctx.close()
 browser.close()
(OUT/'browser_results.json').write_text(json.dumps({'siteVersion':sys.argv[1],'modules':len(order),'exports':len(summary),'files':summary},indent=2))
print('PASS',sys.argv[1],len(summary),'UI downloads across desktop and mobile, 4-mode isolated batches')
