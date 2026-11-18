import asyncio, subprocess, time, json, os, sys
from playwright.async_api import async_playwright
SITE=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../../../SITE'); PORT=sys.argv[1] if len(sys.argv)>1 else '8881'
os.makedirs('/tmp/afdl',exist_ok=True)
srv=subprocess.Popen(['python3','-m','http.server',PORT,'-d',SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); R={}
        for name,vp in [('desktop',{'width':1440,'height':900}),('mobile',{'width':390,'height':844})]:
            ctx=await b.new_context(viewport=vp,accept_downloads=True,has_touch=name=='mobile'); pg=await ctx.new_page(); errs=[]
            pg.on('pageerror',lambda e:errs.append(str(e)))
            await pg.goto(f'http://localhost:{PORT}/index.html',wait_until='networkidle'); await pg.wait_for_timeout(3500)
            r={'in_menu':await pg.evaluate("()=>['fcs-v29af-open','fcs-v29-launch','fcs-ieee-arc-open'].map(id=>document.getElementById(id)?.parentElement?.id)")}
            await pg.click('#v26-tools-pop summary'); await pg.wait_for_timeout(300)
            await pg.click('#fcs-v29af-open'); await pg.click('[data-af=run]'); await pg.wait_for_timeout(800)
            r['first']=await pg.inner_text('#v29af-status')
            r['statuses1']=await pg.evaluate("()=>[...document.querySelectorAll('#v29af-table tbody tr td:last-child')].map(t=>t.innerText.split('\\n')[0])")
            rows=await pg.locator('#v29af-table tr[data-bus]').count()
            for i in range(rows):
                tr=pg.locator('#v29af-table tr[data-bus]').nth(i)
                await tr.locator('[data-k=clearingFullMS]').fill(str(50+i*20)); await tr.locator('[data-k=clearingReducedMS]').fill(str(80+i*30)); await tr.locator('[data-k=clearingSource]').fill('test curve')
            await pg.click('[data-af=run]'); await pg.wait_for_timeout(800)
            r['second']=await pg.inner_text('#v29af-status')
            r['results']=await pg.evaluate("()=>[...document.querySelectorAll('#v29af-table tbody tr td:nth-child(9)')].map(t=>t.innerText.replace(/\\n/g,' | '))")
            await pg.click('[data-af=labels]'); await pg.wait_for_timeout(300); r['labels']=await pg.locator('.v29af-label').count()
            for k in ['pdf','xlsx','json']:
                async with pg.expect_download() as d: await pg.click(f'[data-af={k}]')
                dl=await d.value; path=f'/tmp/afdl/{name}_{dl.suggested_filename}'; await dl.save_as(path); r['dl_'+k]=os.path.getsize(path)
            await pg.screenshot(path=f'/tmp/afdl/{name}.png')
            await pg.keyboard.press('Escape')
            await pg.reload(wait_until='networkidle'); await pg.wait_for_timeout(2500)
            await pg.evaluate("document.getElementById('fcs-v29af-open').click()"); await pg.click('[data-af=run]'); await pg.wait_for_timeout(800)
            r['after_reload']=await pg.inner_text('#v29af-status')
            await pg.keyboard.press('Escape'); await pg.evaluate("document.getElementById('fcs-v29-launch').click()"); await pg.click('[data-v29=run]'); await pg.wait_for_timeout(500)
            r['envelope_ok']=await pg.inner_text('#v29-status')
            r['errors']=errs; R[name]=r; await ctx.close()
        print(json.dumps(R,indent=1)); await b.close()
asyncio.run(main()); srv.terminate()
