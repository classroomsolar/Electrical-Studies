import asyncio, subprocess, time, json, sys
from playwright.async_api import async_playwright
SITE,PORT,PROJ=sys.argv[1],sys.argv[2],sys.argv[3]
srv=subprocess.Popen(['python3','-m','http.server',PORT,'-d',SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
proj=open(PROJ).read()
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        pg=await b.new_page(viewport={'width':1440,'height':900}); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        logs=[];pg.on('console',lambda m:logs.append(m.text[:200]))
        await pg.goto(f'http://localhost:{PORT}/index.html',wait_until='networkidle'); await pg.wait_for_timeout(1500)
        await pg.evaluate("p=>{localStorage.setItem('fault-network-draft-v2',p)}",proj)
        t=time.time(); await pg.reload(wait_until='load')
        done=None
        for i in range(240):
            await pg.wait_for_timeout(500)
            st=await pg.evaluate("()=>{const m=document.querySelector('.metrics .metric strong');return m?m.textContent:''}")
            if st and st!='…' and i>2: done=time.time()-t; break
        r={'first_metric_s':done,'metric':st}
        r['svg_nodes']=await pg.evaluate("()=>document.querySelectorAll('#one-line *').length")
        r['dom_nodes']=await pg.evaluate("()=>document.querySelectorAll('*').length")
        r['heapMB']=await pg.evaluate("()=>performance.memory?Math.round(performance.memory.usedJSHeapSize/1e6):null")
        t=time.time(); await pg.mouse.click(700,450); await pg.wait_for_timeout(100); r['click_ms']=round((time.time()-t)*1000)
        r['errors']=errs[:3]; r['logs']=[l for l in logs if 'rror' in l][:5]
        await pg.screenshot(path=f'./results/big_{PORT}.png')
        print(json.dumps(r,indent=1)); await b.close()
asyncio.run(main()); srv.terminate()
