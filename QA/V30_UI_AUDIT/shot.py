import sys,asyncio,subprocess,time,os
from playwright.async_api import async_playwright
SITE=sys.argv[1];PORT=int(sys.argv[2]);OUT=sys.argv[3]
os.makedirs(OUT,exist_ok=True)
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'-d',SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(channel='chrome')
    for name,vp in [('desktop',{'width':1440,'height':900}),('mobile',{'width':390,'height':844})]:
      pg=await b.new_page(viewport=vp)
      errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
      await pg.goto(f'http://localhost:{PORT}/');await pg.wait_for_timeout(3500)
      await pg.screenshot(path=f'{OUT}/main_{name}.png',full_page=True)
      h=await pg.evaluate('document.documentElement.scrollHeight')
      btns=await pg.evaluate("[...document.querySelectorAll('button,summary,a')].filter(e=>e.offsetParent).map(e=>e.textContent.trim().replace(/\\s+/g,' ').slice(0,50)).filter(Boolean)")
      print(name,'height',h,'errors',errs);print(btns)
    await b.close()
asyncio.run(main());srv.terminate()
