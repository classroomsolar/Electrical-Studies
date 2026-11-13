import asyncio, subprocess, time, json, sys
from playwright.async_api import async_playwright
SITE,PORT,PROJ=sys.argv[1],sys.argv[2],sys.argv[3]
srv=subprocess.Popen(['python3','-m','http.server',PORT,'-d',SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
proj=open(PROJ).read()
LT="""()=>{window.__lt=[];new PerformanceObserver(l=>{for(const e of l.getEntries())window.__lt.push(Math.round(e.duration))}).observe({type:'longtask',buffered:false})}"""
async def settle(pg,ms=1500):
    await pg.evaluate("()=>{window.__lt=[]}");
    await pg.wait_for_timeout(ms); return await pg.evaluate("()=>window.__lt")
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        pg=await b.new_page(viewport={'width':1440,'height':900}); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto(f'http://localhost:{PORT}/index.html',wait_until='networkidle'); await pg.wait_for_timeout(1000)
        await pg.evaluate("p=>{localStorage.setItem('fault-network-draft-v2',p)}",proj)
        await pg.reload(wait_until='commit'); await pg.wait_for_selector('#fault-bus',timeout=60000); await pg.wait_for_timeout(8000); await pg.evaluate(LT)
        R={}
        T="""async(sel)=>{const raf=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const t=performance.now();SEL;await raf();return Math.round(performance.now()-t)}"""
        async def act(js): return await pg.evaluate(T.replace('SEL',js),None)
        R['change_fault_bus_ms']=await act("const s=document.getElementById('fault-bus');s.selectedIndex=40;s.dispatchEvent(new Event('change',{bubbles:true}))")
        await pg.wait_for_timeout(500)
        R['click_bus_ms']=await act("document.querySelectorAll('#one-line [data-select]')[30].dispatchEvent(new MouseEvent('click',{bubbles:true}))")
        await pg.wait_for_timeout(500)
        R['view_results_ms']=await act("[...document.querySelectorAll('button,a')].find(b=>/Results/.test(b.textContent))?.click()")
        await pg.wait_for_timeout(2000)
        R['results_dom']=await pg.evaluate("()=>document.querySelectorAll('*').length")
        R['back_single_line_ms']=await act("[...document.querySelectorAll('button,a')].find(b=>/^\\s*Single line/.test(b.textContent))?.click()")
        await pg.screenshot(path='./results/inter.png')
        R['errors']=errs[:3]
        print(json.dumps(R)); await b.close()
asyncio.run(main()); srv.terminate()
