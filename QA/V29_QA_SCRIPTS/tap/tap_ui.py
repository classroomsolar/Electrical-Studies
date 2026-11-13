import asyncio, subprocess, time, json, os
from playwright.async_api import async_playwright
SITE=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../../../SITE')
srv=subprocess.Popen(['python3','-m','http.server','8891','-d',SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=await b.new_page(viewport={'width':1440,'height':900}); errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto('http://localhost:8891/index.html',wait_until='networkidle'); await pg.wait_for_timeout(2500)
        before=await pg.evaluate("()=>JSON.parse(localStorage.getItem('fault-network-draft-v2'))")
        await pg.locator('#one-line [data-select="example-transformer"]').first.dblclick(force=True); await pg.wait_for_timeout(700)
        f=pg.locator('[data-key=tapPercent]').first; r={'field_present':await f.count()>0}
        if r['field_present']:
            await f.fill('2.5'); await f.press('Tab'); await pg.wait_for_timeout(400)
            r['dialog_buttons']=await pg.evaluate("()=>[...document.querySelectorAll('.equipment-data-backdrop button')].map(b=>b.innerText.trim()+'|'+(b.dataset.action||''))")
            btn=pg.locator('.equipment-data-backdrop button:has-text("Apply"), .equipment-data-backdrop button:has-text("Save"), .equipment-data-backdrop button:has-text("Done")').first
            if await btn.count(): await btn.click()
            await pg.wait_for_timeout(1500)
            after=await pg.evaluate("()=>JSON.parse(localStorage.getItem('fault-network-draft-v2'))")
            r['saved_tap']=[e.get('tapPercent') for e in after['branches'] if e['kind']=='transformer']
            r['page_text_has_kA']=(await pg.inner_text('body')).count('kA')>0
        r['errors']=errs; print(json.dumps(r)); await pg.screenshot(path='/tmp/tap_ui.png'); await b.close()
asyncio.run(main()); srv.terminate()
