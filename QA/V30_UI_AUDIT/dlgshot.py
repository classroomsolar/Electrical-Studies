import sys,asyncio,subprocess,time
from playwright.async_api import async_playwright
SITE,PORT,OPEN,RUN,TARGET,OUT,W=sys.argv[1],int(sys.argv[2]),sys.argv[3],sys.argv[4],sys.argv[5],sys.argv[6],int(sys.argv[7])
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'-d',SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(channel='chrome');pg=await b.new_page(viewport={'width':W,'height':900})
    await pg.goto(f'http://localhost:{PORT}/');await pg.wait_for_timeout(3000)
    await pg.evaluate(OPEN);await pg.wait_for_timeout(1200)
    if RUN!='-':await pg.evaluate(RUN);await pg.wait_for_timeout(1800)
    if TARGET!='-':await pg.evaluate(f"document.querySelector({TARGET!r}).scrollIntoView({{block:'start'}})");await pg.wait_for_timeout(500)
    await pg.screenshot(path=OUT);await b.close()
asyncio.run(main());srv.terminate()
