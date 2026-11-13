# V32: "Arrange" on the 1,970-bus plant: time, overview screenshots (tree layout).
import asyncio, subprocess, time, json, sys
from playwright.async_api import async_playwright
SITE,PORT,PLANT,OUT=sys.argv[1],sys.argv[2],sys.argv[3],sys.argv[4]
srv=subprocess.Popen(['python3','-m','http.server',PORT,'-d',SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        ctx=await b.new_context(viewport={'width':1440,'height':900}); pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto(f'http://localhost:{PORT}/index.html#network'); await pg.wait_for_timeout(1500)
        await pg.evaluate("s=>localStorage.setItem('fault-network-draft-v2',s)",open(PLANT).read()); await pg.reload()
        await pg.wait_for_function("()=>/kA/.test(document.querySelector('.metrics .metric strong')?.textContent||'')",timeout=120000)
        t=time.time(); await pg.click('[data-action="layout"]'); await pg.wait_for_timeout(500)
        await pg.wait_for_function("()=>/kA/.test(document.querySelector('.metrics .metric strong')?.textContent||'')",timeout=120000); r={'arrange_s':round(time.time()-t,1)}
        fit=pg.locator('[data-action="zoom-fit"], [data-zoom="fit"], [data-action="fit"]')
        if await fit.count(): await fit.first.click(); await pg.wait_for_timeout(1500)
        el=pg.locator('#one-line'); await el.screenshot(path=OUT+'_overview.png')
        r['errors']=errs[:3]; print(json.dumps(r)); await b.close()
asyncio.run(main()); srv.terminate()
