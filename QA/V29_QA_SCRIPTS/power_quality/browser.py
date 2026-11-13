import asyncio, subprocess, time, json, os, sys
from playwright.async_api import async_playwright
SITE=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../../../SITE'); PORT=sys.argv[1] if len(sys.argv)>1 else '8895'
os.makedirs('/tmp/pqdl',exist_ok=True)
srv=subprocess.Popen(['python3','-m','http.server',PORT,'-d',SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); R={}
        for name,vp in [('desktop',{'width':1440,'height':900}),('mobile',{'width':390,'height':844})]:
            ctx=await b.new_context(viewport=vp,accept_downloads=True,has_touch=name=='mobile'); pg=await ctx.new_page(); errs=[]
            pg.on('pageerror',lambda e:errs.append(str(e)))
            await pg.goto(f'http://localhost:{PORT}/index.html',wait_until='networkidle'); await pg.wait_for_timeout(3000)
            r={'in_menu':await pg.evaluate("['fcs-v29pq-open','fcs-v29cs-open','fcs-v29af-open','fcs-v29-launch'].map(id=>document.getElementById(id)?.parentElement?.id)")}
            await pg.evaluate("document.getElementById('fcs-v29pq-open').click()"); await pg.wait_for_timeout(1200)
            r['buses']=await pg.evaluate("[...document.querySelectorAll('#fcs-v29pq-ov [data-k=bus] option')].map(o=>o.textContent)")
            await pg.select_option('#fcs-v29pq-ov [data-k=bus]',index=2); r['picked']=await pg.inner_text('#v29pq-status')
            await pg.fill('#fcs-v29pq-ov [data-k=ilA]','600'); await pg.fill('#fcs-v29pq-ov [data-ih="5"]','40'); await pg.fill('#fcs-v29pq-ov [data-ih="7"]','25'); await pg.fill('#fcs-v29pq-ov [data-ih="11"]','12'); await pg.fill('#fcs-v29pq-ov [data-vh="5"]','2.5')
            await pg.click('[data-pq=run519]'); await pg.wait_for_timeout(300); r['ieee519']=(await pg.inner_text('#v29pq-out'))[:300]
            for k in ['pdf','xlsx','json']:
                async with pg.expect_download() as d: await pg.click(f'[data-pq={k}]')
                dl=await d.value; path=f'/tmp/pqdl/{name}_{dl.suggested_filename}'; await dl.save_as(path); r['dl_'+k]=os.path.getsize(path)
            await pg.click('[data-tab=pf]'); await pg.fill('#fcs-v29pq-ov [data-k=pKW]','100'); await pg.fill('#fcs-v29pq-ov [data-k=steps]','3')
            await pg.click('[data-pq=runpf]'); await pg.wait_for_timeout(300); r['pf']=(await pg.inner_text('#v29pq-out'))[:400]
            await pg.fill('#fcs-v29pq-ov [data-k=pfTarget]','0.5'); await pg.click('[data-pq=runpf]'); r['pf_bad']=await pg.inner_text('#v29pq-status'); r['export_disabled']=await pg.is_disabled('[data-pq=pdf]')
            await pg.screenshot(path=f'/tmp/pq_{name}.png')
            await pg.keyboard.press('Escape'); r['closed']=await pg.evaluate("document.getElementById('fcs-v29pq-ov').hidden")
            r['errors']=errs; R[name]=r; await ctx.close()
        print(json.dumps(R,indent=1)); await b.close()
asyncio.run(main()); srv.terminate()
