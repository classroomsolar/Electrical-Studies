import asyncio, subprocess, time, json, sys, os
from playwright.async_api import async_playwright
SITE,PORT=sys.argv[1],sys.argv[2]
srv=subprocess.Popen(['python3','-m','http.server',PORT,'-d',SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
SPEC={'poiVoltageKV':34.5,'utilityFaultKA':20,'utilityXR':15,'feeders':7,'blocksPerFeeder':10,'mvCableLengthM':300,'mvCableROhmKm':0.16,'mvCableXOhmKm':0.12,'mvCableRuns':1,'txKVA':3000,'txZPercent':6,'txXR':8,'lvVoltageV':690,'invPerBlock':4,'invKVA':800,'invFaultA':800,'lvCableLengthM':40,'lvCableROhmKm':0.3,'lvCableXOhmKm':0.1,'lvCableRuns':2}
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        R={}
        for name,vp in [('desktop',{'width':1440,'height':900}),('mobile',{'width':390,'height':844})]:
            ctx=await b.new_context(viewport=vp,accept_downloads=True); pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
            r={}
            await pg.goto(f'http://localhost:{PORT}/index.html#atlas',wait_until='networkidle'); await pg.wait_for_timeout(2000)
            txt=await pg.locator('#app').inner_text()
            r['atlas_reference_names']=[w for w in ['Reference:','ETAP','SKM','CYMCAP','EasyPower','PVsyst','HOMER','PowerFactory','OpenDSS','Cableizer','XGSLab','REopt','pandapower','CYME','DIgSILENT'] if w in txt]
            r['atlas_cards']=await pg.locator('.atlas-card').count()
            await pg.goto(f'http://localhost:{PORT}/index.html#network'); await pg.wait_for_timeout(2500)
            await pg.click('[data-plant-builder]'); await pg.wait_for_timeout(500)
            r['builder_open']=await pg.locator('#v31-plant-builder[open]').count()==1
            await pg.click('#pb-build'); await pg.wait_for_timeout(300)
            r['empty_errors']=await pg.locator('#pb-errors li').count()
            for k,v in SPEC.items(): await pg.fill(f'#pb-{k}',str(v))
            r['summary']=await pg.locator('#pb-summary').inner_text()
            await pg.screenshot(path=f'./results/builder_{name}.png')
            t=time.time(); await pg.click('#pb-build')
            await pg.wait_for_function("()=>/kA/.test(document.querySelector('.metrics .metric strong')?.textContent||'')&&!document.querySelector('#v31-plant-builder')",timeout=90000)
            r['build_to_result_s']=round(time.time()-t,1)
            r['title']=await pg.locator('main header h1').inner_text(); r['metric']=await pg.locator('.metrics .metric strong').first.inner_text()
            r['buses']=await pg.evaluate("()=>JSON.parse(localStorage.getItem('fault-network-draft-v2')).buses.length")
            # find
            await pg.fill('#diagram-find','F3-B05-INV2 AC breaker'); await pg.press('#diagram-find','Enter'); await pg.wait_for_timeout(1500)
            r['find_status']=await pg.locator('.diagram-find-status').inner_text() if await pg.locator('.diagram-find-status').count() else None
            r['selected_name']=await pg.locator('#diagram-selection-name').inner_text()
            r['svg_nodes']=await pg.evaluate("()=>document.querySelectorAll('#one-line *').length")
            await pg.screenshot(path=f'./results/find_{name}.png')
            # equipment table
            await pg.click('[data-equipment-table]'); await pg.wait_for_timeout(400)
            async with pg.expect_download() as dl: await pg.click('#et-download')
            d=await dl.value; path=f'./results/table_{name}.csv'; await d.save_as(path)
            lines=open(path,encoding='utf-8-sig').read().splitlines(); r['csv_rows']=len(lines)-1
            head=[h.split(' [')[0] for h in lines[0].split(',')]
            rows=[l.split(',') for l in lines[1:]]; cab=next(i for i,rw in enumerate(rows) if rw[head.index('type')]=='cable')
            rows[cab][head.index('length_m')]='777'
            open(path,'w').write(','.join(lines[0].split(','))+'\n'+'\n'.join(','.join(rw) for rw in rows))
            await pg.set_input_files('#et-file',path); await pg.wait_for_timeout(1500)
            r['table_status']=await pg.locator('#et-status').inner_text()
            cid=rows[cab][head.index('id')]
            r['cable_length_after']=await pg.evaluate("id=>JSON.parse(localStorage.getItem('fault-network-draft-v2')).branches.find(e=>e.id===id).length",cid)
            await pg.screenshot(path=f'./results/table_{name}.png')
            r['errors']=errs[:3]; R[name]=r; await ctx.close()
        print(json.dumps(R,indent=1)); await b.close()
asyncio.run(main()); srv.terminate()
