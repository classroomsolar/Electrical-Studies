import asyncio, subprocess, time, json, os, sys
from playwright.async_api import async_playwright
SITE=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../../../SITE'); PORT=sys.argv[1] if len(sys.argv)>1 else '8901'
srv=subprocess.Popen(['python3','-m','http.server',PORT,'-d',SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
SETUP="""()=>{const R=globalThis.__fcsBundleRequire;const M=R('network-model.mjs'),W=R('studio-workspace.mjs');const p=M.exampleProject();
 const sec=p.buses.find(b=>/secondary/i.test(b.name));const br=W.placeEquipment(p,'breaker',{x:100,y:100},sec.id);p.buses.find(b=>b.id===br.bus).voltage=208;br.name='Main breaker';
 localStorage.setItem('fault-network-draft-v2',JSON.stringify(p));return {bus:br.bus,dev:br.id}}"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); R={}
        for name,vp in [('desktop',{'width':1440,'height':900}),('mobile',{'width':390,'height':844})]:
            ctx=await b.new_context(viewport=vp,has_touch=name=='mobile'); pg=await ctx.new_page(); errs=[]
            pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('dialog',lambda d:errs.append('dialog '+d.message))
            await pg.goto(f'http://localhost:{PORT}/index.html',wait_until='networkidle'); await pg.wait_for_timeout(2500)
            ids=await pg.evaluate(SETUP); await pg.reload(wait_until='networkidle'); await pg.wait_for_timeout(2500)
            await pg.evaluate("document.getElementById('fcs-v29af-open').click()"); await pg.click('[data-af=run]'); await pg.wait_for_timeout(800)
            sel=f'[data-dev-type="{ids["bus"]}"]'; r={}
            r['default_option']=await pg.evaluate(f"(()=>{{const s=document.querySelector('{sel}');return s.options[s.selectedIndex].text}})()")
            r['status_before']=await pg.evaluate(f"document.querySelector('#v29af-table tr[data-bus=\"{ids['bus']}\"]').lastElementChild.innerText")
            await pg.click(f'[data-dev-edit="{ids["bus"]}"]'); await pg.wait_for_timeout(200)
            r['dialog_title']=await pg.inner_text('#v29af-dev-title')
            await pg.select_option('#v29af-dev [data-dv-kind]','ieee'); await pg.wait_for_timeout(100)
            await pg.select_option('#v29af-dev [data-dv=curve]','VI'); await pg.fill('#v29af-dev [data-dv=pickupA]','1500'); await pg.fill('#v29af-dev [data-dv=dial]','0.5'); await pg.fill('#v29af-dev [data-dv=instPickupA]','12000')
            await pg.fill('#v29af-dev [data-dv=tolPickupPercent]','5'); await pg.fill('#v29af-dev [data-dv=tolTimePercent]','5'); await pg.fill('#v29af-dev [data-dv=tolTimeMs]','30')
            await pg.select_option('#v29af-dev [data-dv=breakerCycles]','3')
            await pg.click('#v29af-dev [data-dv-act=test]'); r['preview']=await pg.inner_text('#v29af-dev [data-dv-preview]')
            await pg.click('#v29af-dev [data-dv-act=save]'); await pg.click('[data-af=run]'); await pg.wait_for_timeout(800)
            row=f'#v29af-table tr[data-bus="{ids["bus"]}"]'
            r['row_after']=await pg.evaluate(f"[...document.querySelector('{row}').children].slice(6).map(c=>c.innerText.replace(/\\n/g,' | '))")
            await pg.reload(wait_until='networkidle'); await pg.wait_for_timeout(2500)
            await pg.evaluate("document.getElementById('fcs-v29af-open').click()"); await pg.click('[data-af=run]'); await pg.wait_for_timeout(800)
            r['after_reload']=await pg.evaluate(f"document.querySelector('{row}').lastElementChild.innerText.split('\\n')[0]")
            await pg.screenshot(path=f'/tmp/ol_{name}.png'); r['errors']=errs; R[name]=r; await ctx.close()
        print(json.dumps(R,indent=1)); await b.close()
asyncio.run(main()); srv.terminate()
