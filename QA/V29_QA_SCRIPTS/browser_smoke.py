import asyncio, sys, subprocess, time, json
from playwright.async_api import async_playwright
SITE=sys.argv[1]; PORT=sys.argv[2]
srv=subprocess.Popen(['python3','-m','http.server',PORT,'-d',SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        out={}
        for name,vp in [('desktop',{'width':1440,'height':900}),('mobile',{'width':390,'height':844})]:
            pg=await b.new_page(viewport=vp); errs=[]; bad=[]
            pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m:m.type=='error' and errs.append(m.text))
            pg.on('response',lambda r:r.status>=400 and bad.append((r.status,r.url)))
            await pg.goto(f'http://localhost:{PORT}/index.html',wait_until='networkidle'); await pg.wait_for_timeout(4000)
            txt=await pg.inner_text('body')
            buttons=await pg.locator('button:visible').count()
            await pg.screenshot(path=f'shot_{PORT}_{name}.png')
            out[name]={'errors':errs[:5],'http_errors':bad[:5],'visible_buttons':buttons,'has_32725':'32,725' in txt or '32.73' in txt or '32,726' in txt or '32.7' in txt,'text_len':len(txt)}
        await b.close(); print(json.dumps(out,indent=1))
asyncio.run(main()); srv.terminate()
