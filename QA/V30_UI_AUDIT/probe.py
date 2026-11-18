import sys,asyncio,subprocess,time
from playwright.async_api import async_playwright
SITE=sys.argv[1];PORT=8936;JS=sys.argv[2]
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'-d',SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(channel='chrome');pg=await b.new_page(viewport={'width':int(sys.argv[3]) if len(sys.argv)>3 else 1440,'height':900})
    await pg.goto(f'http://localhost:{PORT}/'+(sys.argv[4] if len(sys.argv)>4 else ''));await pg.wait_for_timeout(3000)
    print(await pg.evaluate(JS));await b.close()
asyncio.run(main());srv.terminate()
