"""V33 security check: a name that starts with = + - or @ must not become a live formula when the equipment CSV or the Excel report is opened.
usage: python3 csv_formula.py <SITE dir> <port>"""
import asyncio, subprocess, sys, time, json, os, zipfile, io, re
from playwright.async_api import async_playwright
SITE=sys.argv[1]; PORT=sys.argv[2]; HERE=os.path.dirname(os.path.abspath(__file__))
p=json.load(open(os.path.join(HERE,'../V31_SCALE/results/plant80.json')))
names=['=HYPERLINK("http://example.invalid","x")','+1+1','-2+3','@SUM(1,2)']
for i,n in enumerate(names): p['buses'][i+1]['name']=n
srv=subprocess.Popen(['python3','-m','http.server',PORT,'-d',SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
out={}
async def main():
    async with async_playwright() as pw:
        b=await pw.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--disable-dev-shm-usage'])
        ctx=await b.new_context(viewport={'width':1440,'height':900},accept_downloads=True); pg=await ctx.new_page()
        await pg.goto(f'http://localhost:{PORT}/index.html#network'); await pg.wait_for_timeout(1500)
        await pg.evaluate("s=>localStorage.setItem('fault-network-draft-v2',s)",json.dumps(p)); await pg.reload(); await pg.wait_for_timeout(5000)
        await pg.evaluate("document.querySelector('[data-equipment-table]').click()"); await pg.wait_for_selector('#et-download')
        async with pg.expect_download(timeout=60000) as d: await pg.evaluate("document.querySelector('#et-download').click()")
        csv=open(await (await d.value).path(),encoding='utf-8-sig').read()
        cells=[c for line in csv.split('\n') for c in re.split(r',(?=(?:[^"]*"[^"]*")*[^"]*$)',line)]
        live=[c[:50] for c in cells if c.strip('"')[:1] in '=+@' and c.strip('"')[:1] or (c.strip('"')[:1]=='-' and not re.match(r'^-?[\d.]+(e-?\d+)?$',c.strip('"')))]
        out['csv_cells_that_start_a_formula']=live[:8]; out['csv_how_names_are_written']=[c[:60] for c in cells if 'HYPERLINK' in c or 'SUM(1' in c][:4]
        await pg.keyboard.press('Escape'); await pg.evaluate("location.hash='#report'"); await pg.wait_for_selector('.report-contents',timeout=60000); await pg.wait_for_timeout(1500)
        async with pg.expect_download(timeout=120000) as d: await pg.evaluate("document.querySelector('[data-action=\"xlsx\"]').click()")
        z=zipfile.ZipFile(io.BytesIO(open(await (await d.value).path(),'rb').read())); xml=''.join(z.read(n).decode('utf8','ignore') for n in z.namelist() if n.startswith('xl/worksheets'))
        out['xlsx_formula_cells']=len(re.findall(r'<f[ >]',xml)); out['xlsx_has_name_as_text']=('HYPERLINK' in xml) or ('HYPERLINK' in ''.join(z.read(n).decode('utf8','ignore') for n in z.namelist() if 'sharedStrings' in n))
        await b.close()
try: asyncio.run(main())
finally:
    srv.terminate(); json.dump(out,open(os.path.join(HERE,'results/csv_formula.json'),'w'),indent=1); print(json.dumps(out,indent=1))
    bad=bool(out.get('csv_cells_that_start_a_formula')) or out.get('xlsx_formula_cells',1)>0; print('RESULT','FAIL' if bad else 'PASS'); sys.exit(1 if bad else 0)
