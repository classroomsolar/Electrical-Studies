import asyncio, subprocess, time, json, zipfile, io, os
from playwright.async_api import async_playwright
SITE=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../../SITE'); PORT='8821'; os.makedirs('v29dl',exist_ok=True)
srv=subprocess.Popen(['python3','-m','http.server',PORT,'-d',SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); R={}
        for name,vp in [('desktop',{'width':1440,'height':900}),('mobile',{'width':390,'height':844})]:
            ctx=await b.new_context(viewport=vp,accept_downloads=True,has_touch=name=='mobile'); pg=await ctx.new_page(); errs=[]
            pg.on('pageerror',lambda e:errs.append(str(e))); reqs=[]; pg.on('request',lambda r:reqs.append(r.url))
            await pg.goto(f'http://localhost:{PORT}/index.html',wait_until='networkidle'); await pg.wait_for_timeout(2500)
            r={'hook_exposed':await pg.evaluate("typeof globalThis.__fcsBundleRequire==='function'")}
            draft_before=await pg.evaluate("localStorage.getItem('fault-network-draft-v2')")
            await pg.evaluate("document.getElementById('fcs-v29-launch').click()"); r['dialog_open']=await pg.is_visible('#fcs-v29-panel')
            await pg.click('[data-v29=run]'); await pg.wait_for_timeout(800)
            r['status']=await pg.inner_text('#v29-status'); r['table']=await pg.inner_text('#v29-results')
            await pg.select_option('#v29-bus',index=2); await pg.fill('#v29-equip','MDP-1'); await pg.click('[data-v29=label]'); await pg.wait_for_timeout(300)
            r['label']=await pg.inner_text('#v29-label-out')
            for kind in ['pdf','xlsx','json','svg']:
                async with pg.expect_download() as d: await pg.click(f'[data-v29={kind}]')
                dl=await d.value; path=f'v29dl/{name}_{dl.suggested_filename}'; await dl.save_as(path); r['dl_'+kind]=os.path.getsize(path)
            r['draft_unchanged']=draft_before==await pg.evaluate("localStorage.getItem('fault-network-draft-v2')")
            await pg.keyboard.press('Escape'); r['esc_closes']=not await pg.is_visible('#fcs-v29-panel')
            await pg.evaluate("document.getElementById('fcs-v28-launch').click()"); r['v28_still_opens']=await pg.is_visible('#fcs-v28-panel')
            r['new_requests_for_engine']=[u for u in reqs if 'network-engine' in u]
            r['page_errors']=errs; R[name]=r; await pg.screenshot(path=f'v29_{name}.png')
            await pg.keyboard.press('Escape'); await pg.evaluate("document.getElementById('fcs-v29-launch').click()"); await pg.click('[data-v29=run]'); await pg.wait_for_timeout(500); await pg.screenshot(path=f'v29_{name}_open.png',full_page=False)
            await ctx.close()
        await b.close(); print(json.dumps(R,indent=1))
asyncio.run(main()); srv.terminate()
