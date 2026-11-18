"""V33 speed measurements on the 1,970-bus / 71-source plant (list C): C5 transformer Z-tolerance envelope,
C6 arc-flash device editor open + save, C3 DC array recalculation, and C1/C2 undo / redo / add breaker.
usage: python3 perf_browser.py <SITE dir> <port> [label]"""
import asyncio, subprocess, sys, time, json, os
from playwright.async_api import async_playwright
SITE=sys.argv[1]; PORT=sys.argv[2]; LABEL=sys.argv[3] if len(sys.argv)>3 else 'run'; HERE=os.path.dirname(os.path.abspath(__file__))
proj=open(os.path.join(HERE,'../V31_SCALE/results/plant2000.json')).read()
srv=subprocess.Popen(['python3','-m','http.server',PORT,'-d',SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
READY="()=>{const m=document.querySelector('.metrics .metric');return m&&/\\d (kA|A)$/.test(m.querySelector('strong')?.textContent||'')&&/CALCULATED|SCREENING BOUND/.test(m.textContent)&&!/Updating/.test(m.textContent)}"
T={};E=[]
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--disable-dev-shm-usage'])
        ctx=await b.new_context(viewport={'width':1440,'height':900}); pg=await ctx.new_page(); pg.on('pageerror',lambda e:E.append(str(e)))
        await pg.goto(f'http://localhost:{PORT}/index.html#network'); await pg.wait_for_timeout(1500)
        await pg.evaluate("j=>localStorage.setItem('fault-network-draft-v2',j)",proj); await pg.reload(); await pg.wait_for_function(READY,timeout=120000); await pg.wait_for_timeout(1500)
        T['transformers']=await pg.evaluate("JSON.parse(localStorage.getItem('fault-network-draft-v2')).branches.filter(b=>b.kind==='transformer').length")
        # C1 / C2
        await pg.evaluate("document.querySelector('[data-action=\"add-menu\"]').click()"); await pg.wait_for_selector('[data-add="breaker"]',state='attached')
        for name,js in [('C2 add breaker',"document.querySelector('[data-add=\"breaker\"]').click()"),('C1 undo',"document.querySelector('[data-action=\"undo\"]').click()"),('C1 redo',"document.querySelector('[data-action=\"redo\"]').click()")]:
            t=time.time(); await pg.evaluate(js); await pg.evaluate("new Promise(r=>requestAnimationFrame(()=>setTimeout(r,0)))"); free=time.time()-t
            await pg.wait_for_timeout(300); await pg.wait_for_function(READY,timeout=120000); T[name+' page free s']=round(free,2); T[name+' result s']=round(time.time()-t,2); await pg.wait_for_timeout(800)
        # C5 envelope
        t=time.time(); await pg.evaluate("document.querySelector('#fcs-v29-launch').click()"); await pg.wait_for_selector('#fcs-v29-panel',state='visible'); T['C5 envelope open s']=round(time.time()-t,2)
        t=time.time(); await pg.evaluate("document.querySelector('[data-v29=\"run\"]').click()")
        await pg.wait_for_function("()=>/combination|envelope|transformer|bus/i.test(document.querySelector('#v29-status')?.textContent||'')&&!/Calculating|Solving|…/.test(document.querySelector('#v29-status')?.textContent||'')&&document.querySelector('#v29-results')?.textContent.length>50",timeout=300000)
        T['C5 envelope run s']=round(time.time()-t,2); T['C5 status']=(await pg.inner_text('#v29-status'))[:160]
        await pg.evaluate("document.querySelector('[data-v29=\"close\"]').click()"); await pg.wait_for_timeout(500)
        # C6 arc flash device editor
        t=time.time(); await pg.evaluate("document.querySelector('#fcs-v29af-open').click()"); await pg.wait_for_selector('#fcs-v29af-panel',state='visible'); T['C6 dialog open s']=round(time.time()-t,2)
        t=time.time(); await pg.evaluate("document.querySelector('[data-af=\"run\"]').click()"); await pg.wait_for_function("document.querySelectorAll('#v29af-table tr[data-bus]').length>100",timeout=180000); await pg.wait_for_timeout(300); T['C6 run s']=round(time.time()-t,2)
        sel=await pg.evaluate("(()=>{const s=document.querySelector('select[data-dev-type]');return s?[s.dataset.devType,[...s.options].map(o=>o.value)]:null})()")
        T['C6 device types']=sel[1] if sel else None
        t=time.time()
        await pg.evaluate("(()=>{const s=document.querySelector('select[data-dev-type]');s.value=[...s.options].find(o=>o.value==='ieee'||o.value==='iec').value;s.dispatchEvent(new Event('change',{bubbles:true}))})()")
        await pg.wait_for_selector('#v29af-dev:not([hidden]) [data-dv-act="save"]',timeout=60000); T['C6 picker open s']=round(time.time()-t,2)
        await pg.evaluate("(()=>{const d=document.querySelector('#v29af-dev');const set=(k,v)=>{const e=d.querySelector(`[data-dv=\"${k}\"]`);if(e){e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}))}};set('pickupA',400);set('dial',0.2)})()")
        t=time.time(); await pg.evaluate("document.querySelector('#v29af-dev [data-dv-act=\"save\"]').click()"); await pg.wait_for_function("document.querySelector('#v29af-dev').hidden",timeout=120000); await pg.evaluate("new Promise(r=>requestAnimationFrame(()=>setTimeout(r,0)))"); T['C6 picker save s']=round(time.time()-t,2)
        T['C6 saved text']=(await pg.evaluate("[...document.querySelectorAll('#v29af-table small')].map(s=>s.textContent).find(t=>/400|pickup/i.test(t))||''"))[:120]
        await pg.evaluate("document.querySelector('[data-af=\"close\"]').click()"); await pg.wait_for_timeout(500)
        # C3 DC array: build 288 strings, then edit one value and time the recalculation
        await pg.evaluate("document.querySelector('[data-plant-builder]').click()"); await pg.wait_for_selector('#pb-build'); await pg.evaluate("document.querySelector('[name=kind][value=dc]').click()"); await pg.wait_for_timeout(400)
        D={'dcVoltageV':1500,'dcInverters':4,'combinersPerInverter':12,'stringsPerCombiner':24,'stringVocV':1450,'stringSourceOhm':40,'stringCableLengthM':80,'stringCableROhmKm':4.6,'combinerCableLengthM':150,'combinerCableROhmKm':0.13,'combinerCableRuns':2}
        for k,v in D.items(): await pg.fill('#pd-'+k,str(v))
        T['C3 dc summary']=await pg.inner_text('#pb-summary')
        t=time.time(); await pg.evaluate("document.querySelector('#pb-build').click()")
        await pg.wait_for_function("()=>{try{return JSON.parse(localStorage.getItem('fault-network-draft-v2')).settings.faultType==='dc'}catch{return false}}",timeout=60000); await pg.wait_for_timeout(300); await pg.wait_for_function("()=>/\\d (kA|A)/.test(document.querySelector('.metrics .metric')?.textContent||'')&&!/Updating/.test(document.querySelector('.metrics .metric')?.textContent||'')",timeout=120000)
        T['C3 dc build+calc s']=round(time.time()-t,2); T['C3 dc buses']=await pg.evaluate("JSON.parse(localStorage.getItem('fault-network-draft-v2')).buses.length")
        t=time.time(); await pg.evaluate("document.querySelector('[data-action=\"calculate\"]').click()"); await pg.wait_for_timeout(300); await pg.wait_for_function("()=>/\\d (kA|A)/.test(document.querySelector('.metrics .metric')?.textContent||'')&&!/Updating/.test(document.querySelector('.metrics .metric')?.textContent||'')",timeout=120000); T['C3 dc recalculate s']=round(time.time()-t,2)
        T['page errors']=E[:4]; await b.close()
try: asyncio.run(main())
except Exception as e: T['error']=repr(e)[:300]
finally:
    srv.terminate(); json.dump(T,open(os.path.join(HERE,'results',f'perf_{LABEL}.json'),'w'),indent=1); print(json.dumps(T,indent=1))
