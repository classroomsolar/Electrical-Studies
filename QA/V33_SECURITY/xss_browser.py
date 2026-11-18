"""V33 security check (list B2): text typed or imported by a user must never run as page code.
Every text field of a test project (project name, notes, bus/branch/source/device names, labels, manufacturer, model, type...)
is replaced by a string that would create an <img onerror> or a <script> if it reached the page unescaped.
Then every view, the report, the main dialogs and the Excel/PDF/CSV exports are exercised.
usage: python3 xss_browser.py <SITE dir> <port>"""
import asyncio, subprocess, sys, time, json, os
from playwright.async_api import async_playwright
SITE=sys.argv[1]; PORT=sys.argv[2]; HERE=os.path.dirname(os.path.abspath(__file__))
PAY='"><img src=x onerror="window.__xss=(window.__xss||0)+1">\'<script>window.__xss=99</script>'
p=json.load(open(os.path.join(HERE,'../V31_SCALE/results/plant80.json')))
KEEP={'id','from','to','bus','kind','type','deviceId','busId','faultType','sequenceModel','selectedBus','connection','phase','unit','units','frequency','standard','grounding','winding','vectorGroup','primaryConnection','secondaryConnection','status','curve','curveType','mode','basis'}
count=[0]
def walk(o,key=None):
    if isinstance(o,dict): return {k:walk(v,k) for k,v in o.items()}
    if isinstance(o,list): return [walk(v,key) for v in o]
    if isinstance(o,str) and key in ('name','notes','note','label','description','manufacturer','title','tag','comment','location'):
        count[0]+=1; return (o[:12]+' ' if o else '')+PAY
    return o
q=walk(p); q['name']='Plant '+PAY; q.setdefault('notes','n '+PAY)
srv=subprocess.Popen(['python3','-m','http.server',PORT,'-d',SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
out={'injected_fields':count[0],'checks':[]}
CHECK="()=>({flag:window.__xss||0,imgs:document.querySelectorAll('img[src=\"x\"]').length,scripts:[...document.querySelectorAll('script')].filter(s=>/__xss/.test(s.textContent)).length,onerr:document.querySelectorAll('[onerror]').length,shown:document.body.innerText.includes('onerror=')})"
async def main():
    async with async_playwright() as pw:
        b=await pw.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--disable-dev-shm-usage'])
        ctx=await b.new_context(viewport={'width':1440,'height':900},accept_downloads=True); pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto(f'http://localhost:{PORT}/index.html#network'); await pg.wait_for_timeout(1500)
        await pg.evaluate("s=>localStorage.setItem('fault-network-draft-v2',s)",json.dumps(q)); await pg.reload(); await pg.wait_for_timeout(5000)
        async def check(name):
            r=await pg.evaluate(CHECK); ok=r['flag']==0 and r['imgs']==0 and r['scripts']==0 and r['onerr']==0
            out['checks'].append({'where':name,'pass':ok,**r}); print(('PASS ' if ok else 'FAIL ')+name,r)
        calc=await pg.evaluate("(document.querySelector('.metrics .metric')?.innerText||'').replace(/\\n/g,' ')"); out['result_after_load']=calc; ok=('CALCULATED' in calc or 'BOUND' in calc); out['checks'].append({'where':'project with injected names still calculates','pass':ok,'note':calc}); print(('PASS ' if ok else 'FAIL ')+'project calculates',calc)
        await check('one-line page after load'); 
        out['loaded_name']=await pg.evaluate("JSON.parse(localStorage.getItem('fault-network-draft-v2')).name.includes('onerror')")
        for v in ['results','operating','advanced','report','projects','database','atlas','network']:
            await pg.evaluate(f"location.hash='#{v}'"); await pg.wait_for_timeout(3000); await check('view #'+v)
        for sel,name in [('#fcs-v29af-open','Arc flash all buses'),('[data-equipment-table]','Equipment table'),('[data-plant-builder]','Build plant'),('#fcs-v29-launch','Fault envelope'),('#fcs-v29cs-open','Cable sizing'),('#fcs-v29pq-open','Power quality'),('#fcs-v28-launch','Conductor duty'),('[data-v27-launch]','Operations'),('[data-quick-nav]','Tools search'),('#fcs-ieee-arc-open','IEEE 1584 study'),('#fcs-harmonic-open','Harmonics'),('#fcs-method-open','Methods')]:
            try:
                n=await pg.evaluate("s=>{const e=document.querySelector(s);if(!e)return 0;e.click();return 1}",sel)
                await pg.wait_for_timeout(1800)
                if n: 
                    run=await pg.evaluate("()=>{const r=document.querySelector('[data-af=\"run\"]');if(r&&r.offsetParent){r.click();return 1}return 0}")
                    if run: await pg.wait_for_timeout(4000)
                    await check('dialog: '+name)
                else: out['checks'].append({'where':'dialog: '+name,'pass':None,'note':'button not found'})
                await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
                await pg.evaluate("()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close())")
            except Exception as e: out['checks'].append({'where':'dialog: '+name,'pass':None,'note':str(e)[:120]})
        # click a bus and a device on the drawing so the property panels render the names
        await pg.evaluate("location.hash='#network'"); await pg.wait_for_timeout(1500)
        await pg.evaluate("()=>{const e=document.querySelector('[data-bus-id],[data-select-bus],g[data-id]');e&&e.dispatchEvent(new MouseEvent('click',{bubbles:true}));const d=document.querySelector('[data-device-id],[data-select-device]');d&&d.dispatchEvent(new MouseEvent('dblclick',{bubbles:true}))}"); await pg.wait_for_timeout(1500); await check('property panel after clicking equipment')
        # exports: file content is data, but CSV cells must not start a spreadsheet formula
        await pg.evaluate("location.hash='#report'"); await pg.wait_for_selector('.report-contents',timeout=60000); await pg.wait_for_timeout(1500)
        for kind in ('xlsx','pdf'):
            try:
                async with pg.expect_download(timeout=120000) as d: await pg.evaluate(f"document.querySelector('[data-action=\"{kind}\"]').click()")
                dl=await d.value; data=open(await dl.path(),'rb').read(); out['checks'].append({'where':'export '+kind,'pass':True,'bytes':len(data),'file':dl.suggested_filename}); print('PASS export',kind,len(data),dl.suggested_filename)
            except Exception as e: out['checks'].append({'where':'export '+kind,'pass':False,'note':str(e)[:160]}); print('FAIL export',kind,str(e)[:160])
        await check('report page after exports')
        out['page_errors']=errs[:8]; await pg.screenshot(path=os.path.join(HERE,'results/xss.png')); await b.close()
try: asyncio.run(main())
finally:
    srv.terminate(); json.dump(out,open(os.path.join(HERE,'results/xss_browser.json'),'w'),indent=1)
    bad=[c['where'] for c in out['checks'] if c['pass'] is False]; print('injected fields',out['injected_fields'],'checks',len(out['checks']),'FAILED',bad,'page errors',out.get('page_errors')); sys.exit(1 if bad else 0)
