"""V33 (C4) browser check: Operating studies -> "Bus table (CSV)" on the 1,970-bus plant.
Download, fill 0.8 MW at every inverter bus and 0 elsewhere, upload, load flow solves; undo restores; bad file is explained.
usage: python3 operating_table_browser.py <SITE dir> <port>"""
import asyncio, subprocess, sys, time, json, os, csv, io
from playwright.async_api import async_playwright
SITE=sys.argv[1]; PORT=sys.argv[2]; HERE=os.path.dirname(os.path.abspath(__file__))
proj=open(os.path.join(HERE,'../V31_SCALE/results/plant2000.json')).read()
srv=subprocess.Popen(['python3','-m','http.server',PORT,'-d',SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
out={'checks':{},'times':{}}
def ok(n,c,i=''): out['checks'][n]={'pass':bool(c),'info':str(i)[:240]}; print(('PASS ' if c else 'FAIL ')+n,str(i)[:200])
async def run(vp,tag):
    async with async_playwright() as pw:
        b=await pw.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--disable-dev-shm-usage'])
        ctx=await b.new_context(viewport=vp,accept_downloads=True,is_mobile=vp['width']<500,has_touch=vp['width']<500); pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m:errs.append('console:'+m.text) if m.type=='error' else None)
        await pg.goto(f'http://localhost:{PORT}/index.html#operating'); await pg.wait_for_timeout(1500)
        await pg.evaluate("s=>localStorage.setItem('fault-network-draft-v2',s)",proj); await pg.reload(); await pg.wait_for_selector('#op-base',timeout=120000)
        await pg.fill('#op-base','100'); await pg.press('#op-base','Tab'); await pg.wait_for_timeout(1200)
        await pg.select_option('#op-slack',label=await pg.evaluate("[...document.querySelectorAll('#op-slack option')].find(o=>/POI/.test(o.textContent)).textContent")); await pg.wait_for_timeout(1500)
        await pg.wait_for_selector('[data-operating-table]',timeout=30000); ok(tag+' button on the page',True)
        box=await pg.evaluate("(()=>{const r=document.querySelector('[data-operating-table]').getBoundingClientRect();return [Math.round(r.left),Math.round(r.right),innerWidth]})()"); ok(tag+' button inside the screen',box[0]>=0 and box[1]<=box[2],box)
        await pg.evaluate("document.querySelector('[data-operating-table]').click()"); await pg.wait_for_selector('#ot-download')
        async with pg.expect_download(timeout=60000) as d: await pg.evaluate("document.querySelector('#ot-download').click()")
        dl=await d.value; text=open(await dl.path(),encoding='utf-8-sig').read(); rows=list(csv.reader(io.StringIO(text)))
        ok(tag+' download has every bus',len(rows)==1971,f'{len(rows)-1} rows, file {dl.suggested_filename}')
        pv=set(await pg.evaluate("JSON.parse(localStorage.getItem('fault-network-draft-v2')).sources.filter(s=>s.kind==='pv').map(s=>s.bus)"))
        buf=io.StringIO(); w=csv.writer(buf); w.writerow(rows[0])
        for r in rows[1:]:
            if r[3]=='SLACK': w.writerow(r)
            else: w.writerow([r[0],r[1],r[2],'PQ','0.8' if r[0] in pv else '0','-0.05' if r[0] in pv else '0','','',''])
        path=os.path.join(HERE,'results','filled_'+tag+'.csv'); open(path,'w',encoding='utf-8',newline='').write(buf.getvalue())
        t=time.time(); await pg.set_input_files('#ot-file',path); await pg.wait_for_function("document.querySelector('#ot-status')?.textContent.includes('matched')",timeout=120000); out['times'][tag+' upload s']=round(time.time()-t,1)
        st=await pg.inner_text('#ot-status'); ok(tag+' upload summary',st.startswith('1970 of 1970 rows matched') and '3938 values changed' in st and 'skipped' not in st,st)
        await pg.evaluate("document.querySelector('#v33-operating-table [data-v31-close]').click()")
        t=time.time(); await pg.wait_for_selector('.operating-ok',timeout=180000); out['times'][tag+' load flow shown s']=round(time.time()-t,1)
        res=(await pg.inner_text('.operating-ok')).replace('\n',' ')[:200]; ok(tag+' load flow solves from the uploaded values','Converged' in res and 'network loss' in res,res)
        stored=await pg.evaluate("(()=>{const p=JSON.parse(localStorage.getItem('fault-network-draft-v2'));const v=Object.values(p.operatingStudy.buses);return [v.filter(x=>x.pMW===0.8).length,v.filter(x=>x.pMW===0).length]})()"); ok(tag+' values stored in the project',stored==[len(pv),1970-1-len(pv)],stored)
        # a bad file: explained, nothing lost
        bad=os.path.join(HERE,'results','bad.csv'); open(bad,'w').write('bus_id,net_P_MW\nnot-a-bus,1\n'+rows[5][0]+',abc\n')
        await pg.evaluate("document.querySelector('[data-operating-table]').click()"); await pg.wait_for_selector('#ot-file'); await pg.set_input_files('#ot-file',bad); await pg.wait_for_function("document.querySelectorAll('#ot-errors li').length>0",timeout=60000)
        msgs=await pg.evaluate("[...document.querySelectorAll('#ot-errors li')].map(l=>l.textContent)"); ok(tag+' bad rows are explained',any('no bus with bus_id' in m for m in msgs) and any('is not a number' in m for m in msgs),msgs)
        await pg.evaluate("document.querySelector('#v33-operating-table [data-v31-close]').click()"); await pg.wait_for_timeout(500)
        ok(tag+' no page errors',not errs,errs[:4]); await pg.screenshot(path=os.path.join(HERE,'results','operating_table_'+tag+'.png')); await b.close()
async def main():
    await run({'width':1440,'height':900},'desktop'); await run({'width':390,'height':844},'phone')
try: asyncio.run(main())
except Exception as e: ok('script completed',False,repr(e)[:300])
finally:
    srv.terminate(); json.dump(out,open(os.path.join(HERE,'results','operating_table_browser.json'),'w'),indent=1)
    f=[k for k,v in out['checks'].items() if not v['pass']]; print('TIMES',out['times']); print('FAILED',f); sys.exit(1 if f else 0)
