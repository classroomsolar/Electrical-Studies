# V32 browser: Operating studies page on the 1,970-bus plant: fill blank buses, choose slack/base, load flow result, CSV export.
import asyncio, subprocess, time, json, sys
from playwright.async_api import async_playwright
SITE,PORT,PLANT=sys.argv[1],sys.argv[2],sys.argv[3]
srv=subprocess.Popen(['python3','-m','http.server',PORT,'-d',SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
plant=open(PLANT).read()
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        ctx=await b.new_context(viewport={'width':1440,'height':900},accept_downloads=True); pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto(f'http://localhost:{PORT}/index.html#network'); await pg.wait_for_timeout(1500)
        await pg.evaluate("s=>localStorage.setItem('fault-network-draft-v2',s)",plant); await pg.reload()
        await pg.wait_for_function("()=>/kA/.test(document.querySelector('.metrics .metric strong')?.textContent||'')",timeout=120000)
        R={}
        t=time.time(); await pg.evaluate("location.hash='#operating'"); await pg.wait_for_selector('#op-base',timeout=60000); R['open_s']=round(time.time()-t,2)
        R['blocked_msg']=(await pg.locator('.operating-blocker').first.inner_text())[:140]
        await pg.fill('#op-base','100'); await pg.press('#op-base','Tab'); await pg.wait_for_timeout(1500)
        await pg.select_option('#op-slack',label='POI'); await pg.wait_for_timeout(1500)
        R['fill_button']=await pg.locator('[data-action="operating-fill-zero"]').inner_text()
        t=time.time(); await pg.click('[data-action="operating-fill-zero"]'); await pg.wait_for_selector('.operating-ok',timeout=60000); R['fill_to_result_s']=round(time.time()-t,2)
        R['result']=(await pg.locator('.operating-ok').first.inner_text())[:160]
        R['result_rows']=await pg.locator('.operating-ok + .operating-table-wrap tbody tr').count()
        # set one inverter bus to generate 0.8 MW
        inv=await pg.evaluate("()=>{const p=JSON.parse(localStorage.getItem('fault-network-draft-v2'));return p.sources.find(s=>s.kind==='pv').bus}")
        t=time.time(); await pg.fill(f'[data-op-bus="{inv}"][data-op-field="pMW"]','0.8'); await pg.press(f'[data-op-bus="{inv}"][data-op-field="pMW"]','Tab'); await pg.wait_for_timeout(300)
        await pg.wait_for_selector('.operating-ok',timeout=60000); R['edit_to_result_s']=round(time.time()-t,2)
        R['result_after_edit']=(await pg.locator('.operating-ok').first.inner_text())[:160]
        async with pg.expect_download() as dl: await pg.click('[data-action="operating-csv"]')
        d=await dl.value; txt=open(await d.path(),encoding='utf-8').read(); R['csv_lines']=len(txt.splitlines())
        R['dom']=await pg.evaluate("document.querySelectorAll('*').length")
        await pg.screenshot(path='results_operating.png')
        R['errors']=errs[:3]; print(json.dumps(R,indent=1)); await b.close()
asyncio.run(main()); srv.terminate()
