# V32 browser check: report contents chooser on the example project and a 1,970-bus plant.
import asyncio, subprocess, time, json, sys, zipfile, io
from playwright.async_api import async_playwright
SITE,PORT,PLANT=sys.argv[1],sys.argv[2],sys.argv[3]
srv=subprocess.Popen(['python3','-m','http.server',PORT,'-d',SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
plant=open(PLANT).read()
async def download(pg,action):
    async with pg.expect_download(timeout=180000) as dl:
        await pg.click(f'[data-action="{action}"]')
    d=await dl.value; p=await d.path(); return open(p,'rb').read()
def xlsx_sheets(data):
    z=zipfile.ZipFile(io.BytesIO(data)); wb=z.read('xl/workbook.xml').decode()
    import re; return re.findall(r'<sheet name="([^"]*)"',wb), z.testzip()
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        R={}
        for name,vp in [('desktop',{'width':1440,'height':900}),('mobile',{'width':390,'height':844})]:
            ctx=await b.new_context(viewport=vp,accept_downloads=True); pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
            r={}
            await pg.goto(f'http://localhost:{PORT}/index.html#report',wait_until='networkidle'); await pg.wait_for_timeout(2500)
            r['chooser']=await pg.locator('.report-contents').count()
            r['boxes']=await pg.locator('[data-report-section]').count()
            r['inputs_panel_before']=await pg.locator('.report-inputs').count()
            await pg.locator('[data-report-section="inputs"]').click(); await pg.wait_for_timeout(600)
            r['inputs_panel_after_untick']=await pg.locator('.report-inputs').count()
            await pg.locator('[data-report-section="diagram"]').click(); await pg.wait_for_timeout(600)
            r['diagram_after_untick']=await pg.locator('.report-diagram').count()
            # register a tool study the way the tool panels do
            await pg.evaluate("""()=>{(globalThis.__fcsReportStudies??=new Map()).set('test',{label:'Test tool study',projectId:globalThis.__fcsStudio.projectId(),at:Date.now(),get:()=>({method:'test',inputs:{a:1},outputs:{status:'OK',value:42}})});dispatchEvent(new Event('fcs-report-studies'))}""")
            await pg.wait_for_timeout(600)
            r['tool_box']=await pg.locator('[data-report-study="tool:test"]').count()
            await pg.locator('[data-report-study="tool:test"]').click(); await pg.wait_for_timeout(600)
            r['tool_printed']=await pg.locator('.report-extra h2',has_text='Test tool study').count()
            r['print_hides_chooser']=await pg.evaluate("()=>{const s=[...document.styleSheets].some(x=>{try{return [...x.cssRules].some(rule=>rule.media&&rule.media.mediaText==='print'&&rule.cssText.includes('report-contents'))}catch{return false}});return s}")
            pdf=await download(pg,'pdf'); t=pdf.decode('latin1')
            r['pdf_ok']=t.startswith('%PDF'); r['pdf_has_inputs']='STUDY INPUTS' in t; r['pdf_has_bus']='BUS RESULTS' in t; r['pdf_has_tool']='TEST TOOL STUDY' in t
            x=await download(pg,'xlsx'); names,bad=xlsx_sheets(x); r['xlsx_sheets']=names; r['xlsx_zip_ok']=bad is None
            await pg.reload(); await pg.wait_for_timeout(2500)
            r['remembered_after_reload']=not await pg.locator('[data-report-section="inputs"]').is_checked()
            await pg.click('[data-report-all="all"]'); await pg.wait_for_timeout(500)
            r['all_checked']=await pg.locator('[data-report-section]:checked').count()
            await pg.screenshot(path=f'results/chooser_{name}.png',full_page=False)
            r['overflow_x']=await pg.evaluate("()=>document.documentElement.scrollWidth>innerWidth+1")
            # large plant
            if name=='desktop':
                await pg.evaluate("s=>localStorage.setItem('fault-network-draft-v2',s)",plant)
                t0=time.time(); await pg.reload(); 
                await pg.wait_for_function("()=>/kA/.test(document.querySelector('.metrics .metric strong')?.textContent||'')",timeout=120000)
                r['plant_report_ready_s']=round(time.time()-t0,1)
                r['plant_scope_selected']=await pg.locator('[data-report-scope="selected"]').is_checked()
                t0=time.time(); await pg.locator('[data-report-section="diagram"]').click(); await pg.wait_for_function("()=>!document.querySelector('.report-diagram')",timeout=60000); r['plant_toggle_s']=round(time.time()-t0,1)
                t0=time.time(); x=await download(pg,'xlsx'); r['plant_xlsx_s']=round(time.time()-t0,1); r['plant_xlsx_MB']=round(len(x)/1e6,1); names,bad=xlsx_sheets(x); r['plant_xlsx_sheets']=names; r['plant_xlsx_zip_ok']=bad is None
                t0=time.time(); pdf=await download(pg,'pdf'); r['plant_pdf_s']=round(time.time()-t0,1); r['plant_pdf_MB']=round(len(pdf)/1e6,1)
                await pg.locator('[data-report-scope="all"]').click(); await pg.wait_for_timeout(1500)
                t0=time.time(); x=await download(pg,'xlsx'); r['plant_all_xlsx_s']=round(time.time()-t0,1); r['plant_all_xlsx_MB']=round(len(x)/1e6,1); names,bad=xlsx_sheets(x); r['plant_all_xlsx_sheets']=len(names); r['plant_all_xlsx_zip_ok']=bad is None
                await pg.click('[data-action="pdf"]'); await pg.wait_for_timeout(15000)
                r['plant_all_pdf_message']=(await pg.locator('#app').inner_text()).split('PDF report would exceed')[1][:160] if 'PDF report would exceed' in await pg.locator('#app').inner_text() else None
                await pg.screenshot(path='results/plant_report.png')
            r['errors']=errs[:3]; R[name]=r; await ctx.close()
        print(json.dumps(R,indent=1)); await b.close()
asyncio.run(main()); srv.terminate()
