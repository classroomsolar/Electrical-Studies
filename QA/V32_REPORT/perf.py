import asyncio, subprocess, time, json, sys
from playwright.async_api import async_playwright
SITE,PORT,PLANT=sys.argv[1],sys.argv[2],sys.argv[3]
srv=subprocess.Popen(['python3','-m','http.server',PORT,'-d',SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
plant=open(PLANT).read()
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        ctx=await b.new_context(viewport={'width':1440,'height':900}); pg=await ctx.new_page()
        await pg.goto(f'http://localhost:{PORT}/index.html#network'); await pg.wait_for_timeout(1500)
        await pg.evaluate("s=>{localStorage.setItem('fault-network-draft-v2',s);localStorage.removeItem('fcs-report-contents-v1')}",plant)
        await pg.reload(); await pg.wait_for_function("()=>/kA/.test(document.querySelector('.metrics .metric strong')?.textContent||'')",timeout=120000)
        R={}
        t=time.time(); await pg.evaluate("location.hash='#report'"); await pg.wait_for_selector('.report-contents'); R['open_report']=round(time.time()-t,2)
        R['dom']=await pg.evaluate("document.querySelectorAll('*').length")
        for k in ['diagram','inputs','qa','buses','duty','branches','sources']:
            t=time.time(); await pg.locator(f'[data-report-section="{k}"]').click(); await pg.evaluate("()=>new Promise(r=>requestAnimationFrame(()=>setTimeout(r)))"); R['off_'+k]=round(time.time()-t,2)
        R['dom_min']=await pg.evaluate("document.querySelectorAll('*').length")
        print(json.dumps(R)); await b.close()
asyncio.run(main()); srv.terminate()
