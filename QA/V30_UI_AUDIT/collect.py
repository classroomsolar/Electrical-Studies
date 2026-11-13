import sys,asyncio,subprocess,time,os,json
from playwright.async_api import async_playwright
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
SITE=sys.argv[1];PORT=int(sys.argv[2]);OUTF=sys.argv[3]
JS=open(''+__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'collect.js')+'').read()

srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'-d',SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
src=open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'audit.py')).read();ns={};exec(src[src.index('NAV='):src.index('async def main')],ns)
async def main():
  allr={}
  async with async_playwright() as p:
    b=await p.chromium.launch(channel='chrome')
    for vp in [{'width':1440,'height':900},{'width':390,'height':844}]:
      pg=await b.new_page(viewport=vp)
      for n in ns['NAV']:
        await pg.goto(f'http://localhost:{PORT}/#{n}');await pg.reload();await pg.wait_for_timeout(2500)
        for k,v in (await pg.evaluate(JS)).items():allr.setdefault(k,dict(v,views=[]))['views'].append(n)
      for n,code in ns['DLG'].items():
        await pg.goto(f'http://localhost:{PORT}/#network');await pg.reload();await pg.wait_for_timeout(2500)
        try:await pg.evaluate(code)
        except Exception:continue
        await pg.wait_for_timeout(1200)
        for k,v in (await pg.evaluate(JS)).items():allr.setdefault(k,dict(v,views=[]))['views'].append(n)
      await pg.close()
    await b.close()
  json.dump(allr,open(OUTF,'w'),indent=0);print(len(allr))
asyncio.run(main());srv.terminate()
