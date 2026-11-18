import asyncio, subprocess, time, json, os, sys
from playwright.async_api import async_playwright
SITE=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../../../SITE'); PORT=sys.argv[1] if len(sys.argv)>1 else '8883'
os.makedirs('/tmp/csdl',exist_ok=True)
srv=subprocess.Popen(['python3','-m','http.server',PORT,'-d',SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); R={}
        for name,vp in [('desktop',{'width':1440,'height':900}),('mobile',{'width':390,'height':844})]:
            ctx=await b.new_context(viewport=vp,accept_downloads=True,has_touch=name=='mobile'); pg=await ctx.new_page(); errs=[]
            pg.on('pageerror',lambda e:errs.append(str(e)))
            await pg.goto(f'http://localhost:{PORT}/index.html',wait_until='networkidle'); await pg.wait_for_timeout(3500)
            r={'in_menu':await pg.evaluate("()=>['fcs-v29cs-open','fcs-v29af-open','fcs-v29-launch'].map(id=>document.getElementById(id)?.parentElement?.id)")}
            await pg.click('#v26-tools-pop summary'); await pg.wait_for_timeout(300)
            await pg.click('#fcs-v29cs-open'); await pg.click('[data-cs=run]'); await pg.wait_for_timeout(300)
            r['default']=await pg.inner_text('#v29cs-result')
            await pg.fill('[data-k=faultCurrentA]','20000'); await pg.fill('[data-k=clearingTimeS]','0.5'); await pg.select_option('[data-k=insulationClass]','EPR/XLPE')
            await pg.click('[data-cs=run]'); await pg.wait_for_timeout(300); r['with_sc']=await pg.inner_text('#v29cs-result')
            await pg.fill('[data-k=clearingTimeS]',''); await pg.select_option('[data-k=tccCurve]','IEEE VI'); await pg.fill('[data-k=tccPickupA]','600'); await pg.fill('[data-k=tccDial]','2'); await pg.click('[data-cs=run]'); await pg.wait_for_timeout(300); r['with_relay']=await pg.inner_text('#v29cs-result')
            await pg.select_option('[data-k=tccCurve]',''); await pg.fill('[data-k=clearingTimeS]','0.5')
            await pg.fill('[data-k=faultCurrentA]',''); await pg.fill('[data-k=clearingTimeS]',''); await pg.select_option('[data-k=insulationClass]','')
            await pg.select_option('[data-k=rxSize]','3 AWG'); await pg.fill('[data-k=rxR]','0.25'); await pg.fill('[data-k=rxX]','0.05'); await pg.click('[data-cs=run]'); await pg.wait_for_timeout(300); r['with_custom_rx']=await pg.inner_text('#v29cs-result')
            await pg.select_option('[data-k=rxSize]',''); await pg.fill('[data-k=rxR]',''); await pg.fill('[data-k=rxX]',''); await pg.fill('[data-k=faultCurrentA]','20000'); await pg.fill('[data-k=clearingTimeS]','0.5'); await pg.select_option('[data-k=insulationClass]','EPR/XLPE')
            for k in ['pdf','xlsx','json']:
                async with pg.expect_download() as d: await pg.click(f'[data-cs={k}]')
                dl=await d.value; path=f'/tmp/csdl/{name}_{dl.suggested_filename}'; await dl.save_as(path); r['dl_'+k]=os.path.getsize(path)
            await pg.fill('[data-k=designCurrentA]',''); await pg.click('[data-cs=run]'); await pg.wait_for_timeout(200)
            r['bad_input']=await pg.inner_text('#v29cs-status'); r['pdf_disabled_after_bad']=await pg.is_disabled('[data-cs=pdf]')
            await pg.fill('[data-k=designCurrentA]','100')
            await pg.click('[data-cs=run]'); await pg.screenshot(path=f'/tmp/csdl/{name}.png')
            await pg.keyboard.press('Escape'); r['closed']=await pg.evaluate("document.getElementById('fcs-v29cs-ov').hidden")
            await pg.reload(wait_until='networkidle'); await pg.wait_for_timeout(2500)
            r['persist_fault']=await pg.evaluate("document.querySelector('#fcs-v29cs-ov [data-k=faultCurrentA]').value")
            await pg.evaluate("document.getElementById('fcs-v29af-open').click()"); await pg.click('[data-af=run]'); await pg.wait_for_timeout(800)
            r['arcflash_still']=await pg.inner_text('#v29af-status')
            r['errors']=errs; R[name]=r; await ctx.close()
        print(json.dumps(R,indent=1)); await b.close()
asyncio.run(main()); srv.terminate()
