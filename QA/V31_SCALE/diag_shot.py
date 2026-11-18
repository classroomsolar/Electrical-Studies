import asyncio, subprocess, time, json, sys
from playwright.async_api import async_playwright
SITE,PORT,PROJ=sys.argv[1],sys.argv[2],sys.argv[3]
srv=subprocess.Popen(['python3','-m','http.server',PORT,'-d',SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        pg=await b.new_page(viewport={'width':1440,'height':900}); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto(f'http://localhost:{PORT}/index.html',wait_until='networkidle'); await pg.wait_for_timeout(800)
        await pg.evaluate("p=>{localStorage.setItem('fault-network-draft-v2',p)}",open(PROJ).read()); await pg.reload(wait_until='commit')
        await pg.wait_for_selector('#one-line',timeout=90000); await pg.wait_for_timeout(9000)
        await pg.locator('#one-line').scroll_into_view_if_needed(); await pg.wait_for_timeout(500)
        await pg.screenshot(path='./results/diag_fit.png')
        await pg.fill('#diagram-find','INV12 AC breaker'); await pg.press('#diagram-find','Enter'); await pg.wait_for_timeout(2500)
        await pg.locator('#one-line').scroll_into_view_if_needed(); await pg.wait_for_timeout(500)
        await pg.screenshot(path='./results/diag_focus.png')
        print(errs[:3], await pg.evaluate("()=>document.querySelectorAll('#one-line *').length")); await b.close()
asyncio.run(main()); srv.terminate()
