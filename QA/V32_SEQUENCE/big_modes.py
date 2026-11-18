# V32 browser: 2,000-bus connected-sequence SLG and split-phase projects calculate in the worker, show results, change fault bus, open report.
import asyncio, subprocess, time, json, sys
from playwright.async_api import async_playwright
SITE,PORT=sys.argv[1],sys.argv[2]
srv=subprocess.Popen(['python3','-m','http.server',PORT,'-d',SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        R={}
        for name in ['seq2000','split2000']:
            ctx=await b.new_context(viewport={'width':1440,'height':900}); pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e))); logs=[]; pg.on('console',lambda m:logs.append(m.text) if m.type in ('error','warning') else None)
            await pg.goto(f'http://localhost:{PORT}/index.html#network'); await pg.wait_for_timeout(1500)
            await pg.evaluate("s=>localStorage.setItem('fault-network-draft-v2',s)",open(f'results/{name}.json').read())
            t=time.time(); await pg.reload()
            try:
                await pg.wait_for_function("()=>/\\d (kA|A)$/.test(document.querySelector('.metrics .metric strong')?.textContent||'')&&/CALCULATED/.test(document.querySelector('.metrics .metric')?.textContent||'')",timeout=180000); r={'first_result_s':round(time.time()-t,1)}
            except Exception as e:
                r={'first_result_s':None,'metric':await pg.locator('.metrics .metric').first.inner_text(),'status':(await pg.locator('#calculation-status').inner_text())[:300]}
            r['metric']=await pg.locator('.metrics .metric strong').first.inner_text()
            r['calc_status']=(await pg.locator('#calculation-status').inner_text())[:200]
            # change fault bus
            opts=await pg.evaluate("()=>[...document.querySelectorAll('#fault-bus option')].map(o=>o.value).filter(Boolean)")
            before=await pg.locator('.metrics .metric strong').first.inner_text(); t=time.time(); await pg.select_option('#fault-bus',opts[1500]); await pg.wait_for_timeout(300)
            await pg.wait_for_function("()=>/\\d (kA|A)$/.test(document.querySelector('.metrics .metric strong')?.textContent||'')&&/CALCULATED/.test(document.querySelector('.metrics .metric')?.textContent||'')",timeout=60000); r['change_bus_s']=round(time.time()-t,1)
            r['metric_after']=await pg.locator('.metrics .metric strong').first.inner_text()
            await pg.evaluate("location.hash='#results'"); await pg.wait_for_timeout(2500)
            txt=await pg.locator('#app').inner_text(); r['results_has_table']='all bus fault levels' in txt.lower()
            await pg.evaluate("location.hash='#report'"); await pg.wait_for_timeout(4000); r['report_chooser']=await pg.locator('.report-contents').count()
            async with pg.expect_download(timeout=180000) as dl: await pg.click('[data-action="xlsx"]')
            d=await dl.value; import os; r['xlsx_MB']=round(os.path.getsize(await d.path())/1e6,2)
            r['errors']=errs[:3]; r['console']=[l[:160] for l in logs[:4]]; R[name]=r; await ctx.close()
        print(json.dumps(R,indent=1)); await b.close()
asyncio.run(main()); srv.terminate()
