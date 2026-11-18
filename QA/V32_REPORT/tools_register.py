# V32: running each study tool makes it selectable in Report contents, and it prints / exports.
import asyncio, subprocess, time, json, sys
from playwright.async_api import async_playwright
SITE,PORT=sys.argv[1],sys.argv[2]
srv=subprocess.Popen(['python3','-m','http.server',PORT,'-d',SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
OPEN={'ops-lab':"document.querySelector('[data-v27-launch]').click()",'envelope':"document.getElementById('fcs-v29-launch').click()",'arcflash-all':"document.getElementById('fcs-v29af-open').click()",'cable':"document.getElementById('fcs-v29cs-open').click()",'pq':"document.getElementById('fcs-v29pq-open').click()",'i2t':"document.getElementById('fcs-v28-launch').click()",'methods':"document.getElementById('fcs-method-open').click()"}
SCOPE={'methods':'#fcs-method-screen','ops-lab':'#v27-operations','envelope':'#fcs-v29-overlay','arcflash-all':'#fcs-v29af-ov','cable':'#fcs-v29cs-ov','pq':'#fcs-v29pq-ov','i2t':'#fcs-v28-overlay'}
RUN="""(sel)=>{const r=document.querySelector(sel);if(!r)return null;const b=[...r.querySelectorAll('button')].find(b=>!b.disabled&&b.offsetParent&&/^(calculate|check|run|size|compute|solve|calculate study|check limits|calculate all|example|load example|use example)/i.test(b.textContent.trim()));if(!b)return null;b.click();return b.textContent.trim()}"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        ctx=await b.new_context(viewport={'width':1440,'height':900},accept_downloads=True); pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto(f'http://localhost:{PORT}/index.html#network'); await pg.wait_for_timeout(3000)
        R={}
        for k,js in OPEN.items():
            await pg.evaluate(js); await pg.wait_for_timeout(1200)
            ran=await pg.evaluate(RUN,SCOPE[k]); await pg.wait_for_timeout(2500)
            if k=='ops-lab' and ran is None:
                ran=await pg.evaluate("()=>{const f=document.querySelector('#v27-form');if(!f)return null;f.requestSubmit();return 'submit'}"); await pg.wait_for_timeout(2500)
            R[k]={'ran':ran,'registered':await pg.evaluate("()=>[...(globalThis.__fcsReportStudies||new Map()).keys()]")}
            await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
            await pg.evaluate("()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());document.querySelectorAll('[aria-label=Close],.close,[data-close]').forEach(x=>{if(x.offsetParent)try{x.click()}catch{}})}"); await pg.wait_for_timeout(300)
        await pg.evaluate("location.hash='#report'"); await pg.wait_for_timeout(1500)
        R['report_tool_boxes']=await pg.evaluate("()=>[...document.querySelectorAll('[data-report-study^=\"tool:\"]')].map(x=>x.dataset.reportStudy)")
        for key in R['report_tool_boxes']:
            await pg.locator(f'[data-report-study="{key}"]').click(); await pg.wait_for_timeout(700)
        R['printed_extra_sections']=await pg.locator('.report-extra').count()
        async with pg.expect_download(timeout=120000) as dl: await pg.click('[data-action="xlsx"]')
        d=await dl.value; import zipfile,re; z=zipfile.ZipFile(await d.path()); R['xlsx_sheets']=re.findall(r'<sheet name="([^"]*)"',z.read('xl/workbook.xml').decode())
        R['errors']=errs[:5]
        print(json.dumps(R,indent=1)); await b.close()
asyncio.run(main()); srv.terminate()
