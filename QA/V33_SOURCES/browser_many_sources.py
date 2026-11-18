"""V33 browser check: a string-inverter plant with ~1,900 buses and ~1,680 inverter sources, built with Build plant.
usage: python3 browser_many_sources.py <SITE dir> <port> [angle]   (angle blank = unknown inverter angle)
Checks: calculation finishes inside the 30 s watchdog, a chosen bus lists every source, report page + PDF + Excel,
Arc flash all buses, undo, zero page errors, zero requests to other hosts."""
import asyncio, subprocess, sys, time, json, zipfile, io
from playwright.async_api import async_playwright
SITE=sys.argv[1]; PORT=sys.argv[2]; ANGLE=sys.argv[3] if len(sys.argv)>3 else ''
srv=subprocess.Popen(['python3','-m','http.server',PORT,'-d',SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
out={'checks':{}, 'times':{}}
def ok(name,cond,info=''): out['checks'][name]={'pass':bool(cond),'info':str(info)[:300]}; print(('PASS ' if cond else 'FAIL ')+name, str(info)[:200])
READY="()=>{const m=document.querySelector('.metrics .metric');return m&&/\\d (kA|A)$/.test(m.querySelector('strong')?.textContent||'')&&/CALCULATED|SCREENING BOUND/.test(m.textContent)}"
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--disable-dev-shm-usage'])
        ctx=await b.new_context(viewport={'width':1440,'height':900},accept_downloads=True); pg=await ctx.new_page()
        errs=[]; ext=[]
        pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m:errs.append('console:'+m.text) if m.type=='error' else None)
        pg.on('request',lambda r:ext.append(r.url) if not r.url.startswith(f'http://localhost:{PORT}/') and not r.url.startswith(('data:','blob:')) else None)
        pg.on('response',lambda r:errs.append(f'http {r.status} {r.url}') if r.status>=400 else None)
        await pg.goto(f'http://localhost:{PORT}/index.html#network'); await pg.wait_for_function(READY,timeout=60000)
        fam=await pg.evaluate("document.fonts.ready.then(()=>[...new Set([...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family.replace(/\"/g,'')))].join(','))"); ok('fonts served locally','DM Sans' in fam or 'Inter' in fam,fam)
        await pg.click('[data-plant-builder]'); await pg.wait_for_selector('#pb-build')
        vals={'poiVoltageKV':34.5,'utilityFaultKA':20,'utilityXR':15,'feeders':7,'blocksPerFeeder':10,'mvCableLengthM':300,'mvCableROhmKm':0.16,'mvCableXOhmKm':0.12,'mvCableRuns':1,'txKVA':3000,'txZPercent':6,'txXR':8,'lvVoltageV':690,'invPerBlock':24,'invKVA':125,'invFaultA':130,'invAngleDeg':ANGLE,'lvCableLengthM':0}
        for k,v in vals.items(): await pg.fill('#pb-'+k,str(v))
        await pg.wait_for_timeout(600); summary=await pg.inner_text('#pb-summary'); print(summary, '| errors:', await pg.inner_text('#pb-errors'))
        t=time.time(); await pg.click('#pb-build')
        done=False
        for _ in range(180):
            await pg.wait_for_timeout(500)
            try: st=await pg.evaluate("(()=>{let n=0;try{n=JSON.parse(localStorage.getItem('fault-network-draft-v2')).buses.length}catch{};return n+'|'+(document.querySelector('#calculation-status')?.innerText||'')+'|'+(document.querySelector('.metrics .metric')?.innerText||'')})()")
            except Exception: continue
            if int(st.split('|')[0])>1000 and ('BOUND' in st or 'CALCULATED' in st) and 'Updating' not in st and 'CALCULATING' not in st: done=True; break
            if 'did not complete' in st: break
        out['times']['build+calculate s']=round(time.time()-t,1)
        status=await pg.inner_text('#calculation-status') if await pg.query_selector('#calculation-status') else ''
        ok('plant calculates',done,f"{out['times']['build+calculate s']} s; {status[:120]}")
        ok('inside 30 s watchdog',done and out['times']['build+calculate s']<30,out['times']['build+calculate s'])
        cnt=await pg.evaluate("(()=>{const p=JSON.parse(localStorage.getItem('fault-network-draft-v2'));return {buses:p.buses.length,sources:p.sources.length}})()"); out['plant']=cnt
        ok('plant size',cnt['buses']>=1800 and cnt['sources']>=1600,cnt)
        # choose a deep bus on the results page -> per-source rows are produced for it
        await pg.evaluate("location.hash='#results'"); await pg.wait_for_timeout(1500)
        t=time.time(); await pg.select_option('#fault-bus',index=900); await pg.wait_for_function(READY,timeout=120000); await pg.wait_for_timeout(800)
        out['times']['select another bus s']=round(time.time()-t,1)
        nsrc=await pg.evaluate("Math.max(0,...[...document.querySelectorAll('table')].map(t=>t.tBodies[0]?.rows.length||0))"); ok('results page for another fault bus renders',nsrc>=1681,str(nsrc)+' rows in the largest table; '+f"{out['times']['select another bus s']} s")
        # report
        t=time.time(); await pg.evaluate("location.hash='#report'"); await pg.wait_for_selector('.report-contents',timeout=120000); out['times']['open report s']=round(time.time()-t,1)
        scope=await pg.evaluate("[...document.querySelectorAll('[data-report-scope]')].map(x=>x.value+':'+x.checked).join(',')")
        ok('report opens',True,f"{out['times']['open report s']} s scope {scope}")
        for kind,magic in (('xlsx',b'PK'),):
            t=time.time(); got=[]; pg.once('download',lambda d:got.append(d))
            await pg.evaluate(f"document.querySelector('[data-action=\"{kind}\"]').click()")
            msg=''
            for _ in range(480):
                await pg.wait_for_timeout(500)
                if got: break
                try: msg=await pg.evaluate("(document.body.innerText.match(/[^\\n]*(too long|would exceed)[^\\n]*/i)||[''])[0]")
                except Exception: msg=''
                if msg: break
            out['times'][kind+' s']=round(time.time()-t,1)
            if got:
                data=open(await got[0].path(),'rb').read(); ok(kind+' downloads',data[:len(magic)]==magic,f"{len(data)} bytes {out['times'][kind+' s']} s")
                if kind=='xlsx':
                    z=zipfile.ZipFile(io.BytesIO(data)); text=''.join(z.read(n).decode('utf8','ignore') for n in z.namelist() if n.endswith('.xml'))
                    ok('report states why source rows are limited','Per-source contribution rows are listed for the selected fault bus only' in text)
            else: ok(kind+' downloads or explains why not',bool(msg),msg or 'no download and no message in 240 s')
        # arc flash all buses
        await pg.evaluate("location.hash='#network'"); await pg.wait_for_timeout(800)
        t=time.time(); await pg.evaluate("document.querySelector('#fcs-v29af-open').click()"); await pg.wait_for_selector('#fcs-v29af-panel',state='visible'); out['times']['arc flash open s']=round(time.time()-t,1)
        t=time.time(); await pg.evaluate("document.querySelector('[data-af=\"run\"]').click()")
        try: await pg.wait_for_function("()=>document.querySelectorAll('#fcs-v29af-panel table tbody tr').length>100",timeout=180000); af=True
        except Exception: af=False
        out['times']['arc flash run s']=round(time.time()-t,1); rows=await pg.evaluate("document.querySelectorAll('#fcs-v29af-panel table tbody tr').length")
        ok('arc flash all buses runs',af,f"{rows} rows {out['times']['arc flash run s']} s")
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(500)
        ok('no page errors',not errs,errs[:5]); ok('no requests to other hosts',not ext,ext[:5])
        await pg.screenshot(path='results/many_sources.png')
        # PDF last: on this plant the report is longer than the 2,000-page PDF limit, so the page must say so.
        await pg.evaluate("location.hash='#report'"); await pg.wait_for_selector('.report-contents',timeout=180000); await pg.wait_for_timeout(3000)
        for kind,magic in (('pdf',b'%PDF'),):
            t=time.time(); got=[]; pg.once('download',lambda d:got.append(d))
            await pg.evaluate(f"document.querySelector('[data-action=\"{kind}\"]').click()")
            msg=''
            for _ in range(480):
                await pg.wait_for_timeout(500)
                if got: break
                try: msg=await pg.evaluate("(document.body.innerText.match(/[^\\n]*(too long|would exceed)[^\\n]*/i)||[''])[0]")
                except Exception: msg=''
                if msg: break
            out['times'][kind+' s']=round(time.time()-t,1)
            if got:
                data=open(await got[0].path(),'rb').read(); ok(kind+' downloads',data[:len(magic)]==magic,f"{len(data)} bytes {out['times'][kind+' s']} s")
                if kind=='xlsx':
                    z=zipfile.ZipFile(io.BytesIO(data)); text=''.join(z.read(n).decode('utf8','ignore') for n in z.namelist() if n.endswith('.xml'))
                    ok('report states why source rows are limited','Per-source contribution rows are listed for the selected fault bus only' in text)
            else: ok(kind+' downloads or explains why not',bool(msg),msg or 'no download and no message in 240 s')

        await b.close()
import os; os.makedirs('results',exist_ok=True)
try: asyncio.run(main())
except Exception as e: ok('script completed',False,repr(e)[:280])
finally:
    srv.terminate(); json.dump(out,open('results/browser_many_sources%s.json'%('_known' if ANGLE else ''),'w'),indent=1)
    f=[k for k,v in out['checks'].items() if not v['pass']]; print('TIMES',out['times']); print('FAILED',f); sys.exit(1 if f else 0)
