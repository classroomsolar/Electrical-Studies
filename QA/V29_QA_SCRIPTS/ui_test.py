import asyncio, subprocess, time, json, sys
from playwright.async_api import async_playwright
SITE,PORT=sys.argv[1],sys.argv[2]
srv=subprocess.Popen(['python3','-m','http.server',PORT,'-d',SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); R={}
        for name,vp in [('desktop',{'width':1440,'height':900}),('mobile',{'width':390,'height':844})]:
            pg=await b.new_page(viewport=vp,has_touch=name=='mobile'); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
            await pg.goto(f'http://localhost:{PORT}/index.html',wait_until='networkidle'); await pg.wait_for_timeout(2500)
            nsrc=lambda: pg.evaluate("()=>JSON.parse(localStorage.getItem('fault-network-draft-v2')).sources.length")
            r={}
            src=pg.locator('#one-line [data-select="example-utility"]').first
            r['source_present']=await src.count()>0
            await src.scroll_into_view_if_needed(); await src.click(force=True); await pg.wait_for_timeout(400)
            d=pg.locator('#one-line .diagram-delete').first
            r['delete_transform']=await d.get_attribute('transform') if await d.count() else None
            box=await d.bounding_box() if await d.count() else None
            r['delete_visible_box']=bool(box and box['width']>0)
            before=await nsrc()
            if box: await d.click(force=True); await pg.wait_for_timeout(600)
            r['sources_before_after_delete']=(before,await nsrc())
            await pg.locator('body').click(position={'x':5,'y':5}); await pg.keyboard.press('Control+z'); await pg.wait_for_timeout(600)
            r['after_ctrl_z']=await nsrc()
            await pg.keyboard.press('Control+y'); await pg.wait_for_timeout(600); r['after_ctrl_y']=await nsrc()
            await pg.keyboard.press('Control+z'); await pg.wait_for_timeout(600)
            src=pg.locator('#one-line [data-select="example-utility"]').first
            if await src.count():
                await src.dblclick(force=True); await pg.wait_for_timeout(700)
                dlg=pg.locator('dialog[open], [role=dialog]:visible').first
                r['dblclick_opens_properties']=await dlg.count()>0
                await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
                r['esc_closes']=await pg.locator('dialog[open]').count()==0
            r['page_errors']=errs[:3]; R[name]=r
            await pg.screenshot(path=f'ui_{PORT}_{name}.png')
        print(json.dumps(R,indent=1)); await b.close()
asyncio.run(main()); srv.terminate()
