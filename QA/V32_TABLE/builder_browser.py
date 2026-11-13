# V32 browser: Build plant -> AC plant, then a second block type on the same collector, then a DC array; Equipment table add + delete.
import asyncio, subprocess, time, json, sys, os
from playwright.async_api import async_playwright
SITE,PORT=sys.argv[1],sys.argv[2]
srv=subprocess.Popen(['python3','-m','http.server',PORT,'-d',SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
A={'poiVoltageKV':34.5,'utilityFaultKA':20,'utilityXR':15,'feeders':3,'blocksPerFeeder':4,'mvCableLengthM':300,'mvCableROhmKm':0.16,'mvCableXOhmKm':0.12,'mvCableRuns':1,'txKVA':3000,'txZPercent':6,'txXR':8,'lvVoltageV':690,'invPerBlock':4,'invKVA':800,'invFaultA':800,'invAngleDeg':-30,'lvCableLengthM':0}
D={'dcVoltageV':1500,'dcInverters':2,'combinersPerInverter':6,'stringsPerCombiner':24,'stringVocV':1450,'stringSourceOhm':40,'stringCableLengthM':80,'stringCableROhmKm':4.6,'combinerCableLengthM':150,'combinerCableROhmKm':0.13,'combinerCableRuns':2}
METRIC="()=>/\\d (kA|A)$/.test(document.querySelector('.metrics .metric strong')?.textContent||'')&&!/Updating/.test(document.querySelector('.metrics .metric')?.textContent||'')"
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        ctx=await b.new_context(viewport={'width':1440,'height':900},accept_downloads=True); pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto(f'http://localhost:{PORT}/index.html#network'); await pg.wait_for_timeout(3000); R={}
        cnt=lambda: pg.evaluate("()=>{const p=JSON.parse(localStorage.getItem('fault-network-draft-v2'));return {buses:p.buses.length,sources:p.sources.length,ft:p.settings.faultType,pv:p.sources.filter(s=>s.kind==='pv').length,bess:p.sources.filter(s=>s.kind==='bess').length}}")
        await pg.click('[data-plant-builder]'); await pg.wait_for_timeout(500)
        for k,v in A.items(): await pg.fill(f'#pb-{k}',str(v))
        await pg.click('#pb-build'); await pg.wait_for_function(METRIC,timeout=60000); R['ac']=await cnt()
        await pg.click('[data-plant-builder]'); await pg.wait_for_timeout(500)
        await pg.check('[name="mode"][value="attach"]'); R['utility_hidden_in_attach']=await pg.locator('[data-field="utilityFaultKA"]').is_hidden()
        await pg.fill('#pb-feeders','2'); await pg.fill('#pb-blocksPerFeeder','3'); await pg.fill('#pb-invPerBlock','2'); await pg.fill('#pb-invKVA','1250'); await pg.fill('#pb-invFaultA','1300'); await pg.check('[name="bess"]')
        R['attach_summary']=await pg.locator('#pb-summary').inner_text()
        await pg.screenshot(path='results_builder_attach.png')
        await pg.click('#pb-build'); await pg.wait_for_timeout(800); await pg.wait_for_function(METRIC,timeout=60000); R['after_attach']=await cnt(); R['metric']=await pg.locator('.metrics .metric strong').first.inner_text()
        # equipment table: add a bus + cable, delete one inverter source
        await pg.click('[data-equipment-table]'); await pg.wait_for_timeout(400)
        async with pg.expect_download() as dl: await pg.click('#et-download')
        d=await dl.value; text=open(await d.path(),encoding='utf-8-sig').read().splitlines(); head=text[0].split(','); cols=[h.split(' [')[0] for h in head]
        def row(o): return ','.join(str(o.get(c,'')) for c in cols)
        inv=next(l for l in text[1:] if ',source:bess,' in l).split(',')[cols.index('id')]
        new=[text[0],row({'action':'add','type':'bus','name':'Aux panel','voltage_V':690}),row({'action':'add','type':'cable','name':'Aux feeder','from_bus':'F1-B01 LV','to_bus':'Aux panel','length_m':20,'runs':1,'r_ohm_per_km':0.3,'x_ohm_per_km':0.1}),row({'action':'delete','id':inv})]
        open('edited.csv','w').write('\n'.join(new)); await pg.set_input_files('#et-file','edited.csv'); await pg.wait_for_timeout(1500)
        R['table_status']=await pg.locator('#et-status').inner_text(); R['table_errors']=await pg.locator('#et-errors li').all_inner_texts()
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300); await pg.wait_for_function(METRIC,timeout=60000); R['after_table']=await cnt()
        # DC array
        await pg.click('[data-plant-builder]'); await pg.wait_for_timeout(500); await pg.check('[name="kind"][value="dc"]')
        for k,v in D.items(): await pg.fill(f'#pd-{k}',str(v))
        R['dc_summary']=await pg.locator('#pb-summary').inner_text(); await pg.screenshot(path='results_builder_dc.png')
        await pg.click('#pb-build'); await pg.wait_for_timeout(800); await pg.wait_for_function(METRIC,timeout=60000); R['dc']=await cnt(); R['dc_metric']=await pg.locator('.metrics .metric strong').first.inner_text()
        await pg.screenshot(path='results_dc_oneline.png')
        R['errors']=errs[:3]; print(json.dumps(R,indent=1)); await b.close()
asyncio.run(main()); srv.terminate()
