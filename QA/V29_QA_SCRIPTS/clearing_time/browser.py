import asyncio, subprocess, time, json, os, sys
from playwright.async_api import async_playwright
SITE=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../../../SITE'); PORT=sys.argv[1] if len(sys.argv)>1 else '8894'
srv=subprocess.Popen(['python3','-m','http.server',PORT,'-d',SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); R={}
        for name,vp in [('desktop',{'width':1440,'height':900}),('mobile',{'width':390,'height':844})]:
            ctx=await b.new_context(viewport=vp,has_touch=name=='mobile'); pg=await ctx.new_page(); errs=[]
            pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('dialog',lambda d:errs.append('dialog:'+d.message))
            await pg.goto(f'http://localhost:{PORT}/index.html',wait_until='networkidle'); await pg.wait_for_timeout(3000)
            await pg.evaluate("document.getElementById('fcs-v29af-open').click()"); await pg.click('[data-af=run]'); await pg.wait_for_timeout(800)
            ids=await pg.evaluate("[...document.querySelectorAll('#v29af-table tr[data-bus]')].map(t=>t.dataset.bus)")
            bus=ids[1]
            await pg.select_option(f'[data-dev-type="{bus}"]','ieee'); await pg.wait_for_timeout(200)
            r={'dialog_open':await pg.is_visible('#v29af-dev')}
            await pg.select_option('#v29af-dev [data-dv=curve]','VI')
            await pg.fill('#v29af-dev [data-dv=pickupA]','1500'); await pg.fill('#v29af-dev [data-dv=dial]','0.5'); await pg.fill('#v29af-dev [data-dv=instPickupA]','12000')
            await pg.select_option('#v29af-dev [data-dv=breakerCycles]','3')
            await pg.click('#v29af-dev [data-dv-act=test]'); r['preview']=await pg.inner_text('#v29af-dev [data-dv-preview]')
            await pg.click('#v29af-dev [data-dv-act=save]'); r['dialog_closed']=await pg.is_hidden('#v29af-dev')
            # bus 3: typed times
            tr=pg.locator(f'#v29af-table tr[data-bus="{ids[2]}"]'); await tr.locator('[data-k=clearingFullMS]').fill('60'); await tr.locator('[data-k=clearingReducedMS]').fill('300')
            await pg.click('[data-af=run]'); await pg.wait_for_timeout(800)
            r['status']=await pg.inner_text('#v29af-status')
            r['rows']=await pg.evaluate("[...document.querySelectorAll('#v29af-table tbody tr')].map(t=>[t.children[7].innerText.replace(/\\n/g,' | '),t.lastElementChild.innerText.split('\\n')[0]])")
            # bad settings path
            await pg.click(f'[data-dev-edit="{bus}"]'); await pg.fill('#v29af-dev [data-dv=pickupA]','-5'); await pg.click('#v29af-dev [data-dv-act=save]')
            r['bad_msg']=await pg.inner_text('#v29af-dev [data-dv-preview]'); await pg.keyboard.press('Escape'); r['esc_closes_device']=await pg.is_hidden('#v29af-dev')
            await pg.reload(wait_until='networkidle'); await pg.wait_for_timeout(2500)
            await pg.evaluate("document.getElementById('fcs-v29af-open').click()"); await pg.click('[data-af=run]'); await pg.wait_for_timeout(800)
            r['after_reload_device_kept']=await pg.evaluate(f"document.querySelector('[data-dev-type=\"{bus}\"]').value")
            r['after_reload']=await pg.inner_text('#v29af-status')
            await pg.screenshot(path=f'/tmp/ct_{name}.png')
            r['errors']=errs; R[name]=r; await ctx.close()
        print(json.dumps(R,indent=1)); await b.close()
asyncio.run(main()); srv.terminate()
