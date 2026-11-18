"""V33 browser check: D2 connection editing with preview (Equipment table), E2 reference-data notice on the database page.
usage: python3 connection_edit_browser.py <SITE dir> <port>"""
import asyncio, subprocess, sys, time, json, os, csv, io
from playwright.async_api import async_playwright
SITE=sys.argv[1]; PORT=sys.argv[2]; HERE=os.path.dirname(os.path.abspath(__file__))
proj=json.load(open(os.path.join(HERE,'../V31_SCALE/results/plant80.json')))
srv=subprocess.Popen(['python3','-m','http.server',PORT,'-d',SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
out={}
def ok(n,c,i=''): out[n]={'pass':bool(c),'info':str(i)[:240]}; print(('PASS ' if c else 'FAIL ')+n,str(i)[:200])
async def main():
    async with async_playwright() as pw:
        b=await pw.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--disable-dev-shm-usage'])
        pg=await b.new_page(viewport={'width':1440,'height':900}); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto(f'http://localhost:{PORT}/index.html#network'); await pg.wait_for_timeout(1500)
        await pg.evaluate("s=>localStorage.setItem('fault-network-draft-v2',s)",json.dumps(proj)); await pg.reload(); await pg.wait_for_timeout(4000)
        cab=next(e for e in proj['branches'] if e['kind']=='cable' and not e.get('deviceId'))
        names={x['id']:x['name'] for x in proj['buses']}; volt={x['id']:x['voltage'] for x in proj['buses']}
        other=next(x for x in proj['buses'] if x['voltage']==volt[cab['to']] and x['id'] not in (cab['to'],cab['from']))
        async def table(): 
            await pg.evaluate("document.querySelector('[data-equipment-table]').click()"); await pg.wait_for_selector('#et-file',state='attached')
            async with pg.expect_download() as d: await pg.evaluate("document.querySelector('#et-download').click()")
            return list(csv.reader(io.StringIO(open(await (await d.value).path(),encoding='utf-8-sig').read())))
        rows=await table(); head=rows[0]; ix={h.split(' [')[0]:i for i,h in enumerate(head)}
        row=['']*len(head); row[ix['id']]=cab['id']; row[ix['to_bus']]=other['name']
        path=os.path.join(HERE,'results','move.csv'); w=csv.writer(open(path,'w',newline='',encoding='utf-8')); w.writerow(head); w.writerow(row); del w
        to=lambda: pg.evaluate("id=>JSON.parse(localStorage.getItem('fault-network-draft-v2')).branches.find(e=>e.id===id).to",cab['id'])
        await pg.set_input_files('#et-file',path); await pg.wait_for_selector('#et-preview',timeout=30000)
        st=await pg.inner_text('#et-status'); prev=await pg.inner_text('#et-preview')
        ok('preview shown before applying','Preview — nothing changed yet' in st and other['name'] in prev and names[cab['to']] in prev,st)
        ok('nothing changed by the preview',await to()==cab['to'])
        await pg.click('#et-cancel'); await pg.wait_for_timeout(500); ok('cancel keeps the project',await to()==cab['to'] and 'cancelled' in await pg.inner_text('#et-status'))
        await pg.set_input_files('#et-file',path); await pg.wait_for_selector('#et-apply'); await pg.click('#et-apply'); await pg.wait_for_timeout(1500)
        ok('apply moves the connection',await to()==other['id'],await pg.inner_text('#et-status'))
        await pg.evaluate("document.querySelector('#v31-equipment-table [data-v31-close]')?.click()"); await pg.wait_for_timeout(500)
        await pg.evaluate("document.querySelector('[data-action=\"undo\"]').click()"); await pg.wait_for_timeout(1500); ok('undo restores the connection',await to()==cab['to'])
        # a wrong move is explained and nothing is shown to apply
        lv=next(x for x in proj['buses'] if x['voltage']!=volt[cab['to']])
        row[ix['to_bus']]=lv['name']; w=csv.writer(open(path,'w',newline='',encoding='utf-8')); w.writerow(head); w.writerow(row); del w
        await table(); await pg.set_input_files('#et-file',path); await pg.wait_for_timeout(1500)
        msg=await pg.evaluate("[...document.querySelectorAll('#et-errors li')].map(l=>l.textContent)"); ok('cable across voltages explained',any('use a transformer' in m for m in msg),msg); ok('nothing applied',await to()==cab['to'])
        await pg.evaluate("document.querySelector('#v31-equipment-table [data-v31-close]')?.click()")
        # E2 notice
        await pg.evaluate("location.hash='#database'"); await pg.wait_for_timeout(3000)
        n=await pg.evaluate("[...document.querySelectorAll('[data-reference-notice]')].map(e=>e.textContent)"); ok('reference-data notice on the database page',any('historical audited workbook' in t for t in n),n[:1])
        ok('no page errors',not errs,errs[:3]); await pg.screenshot(path=os.path.join(HERE,'results','database_notice.png')); await b.close()
try: asyncio.run(main())
except Exception as e: ok('script completed',False,repr(e)[:300])
finally:
    srv.terminate(); json.dump(out,open(os.path.join(HERE,'results','connection_edit_browser.json'),'w'),indent=1)
    f=[k for k,v in out.items() if not v['pass']]; print('FAILED',f); sys.exit(1 if f else 0)
