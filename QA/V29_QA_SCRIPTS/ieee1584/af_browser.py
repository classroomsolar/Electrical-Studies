import asyncio, subprocess, time, json
from playwright.async_api import async_playwright
import os; SITE=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../../../SITE'); PORT='8861'
srv=subprocess.Popen(['python3','-m','http.server',PORT,'-d',SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); R={}
        for name,vp in [('desktop',{'width':1440,'height':900}),('mobile',{'width':390,'height':844})]:
            pg=await b.new_page(viewport=vp); errs=[]; ext=[]
            pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('request',lambda r:('vercel' in r.url or not r.url.startswith(('http://localhost','data:','blob:'))) and ext.append(r.url))
            await pg.goto(f'http://localhost:{PORT}/index.html',wait_until='networkidle'); await pg.wait_for_timeout(2500)
            r0=await pg.evaluate("()=>{const b=document.getElementById('fcs-ieee-arc-open');const cs=getComputedStyle(b);return cs.display+'/'+cs.visibility}"); await pg.evaluate("document.getElementById('fcs-ieee-arc-open').click()"); await pg.click('[data-arc=run]'); await pg.wait_for_timeout(600)
            out=json.loads(await pg.inner_text('#fcs-ieee-arc-output')); st=await pg.inner_text('#fcs-ieee-arc-status')
            r={'launcher_css':r0,'status':st[:90],'cases':[(round(c['arcingCurrentKA'],3),round(c['incidentEnergyJPerCm2'],3),round(c['arcFlashBoundaryMM'])) for c in out['cases']]}
            await pg.click('#fcs-ieee-arc-panel summary'); 
            tcc=json.loads(await pg.input_value('#fcs-ieee-arc-tcc')); tcc['singleRadialPathConfirmed']=True
            await pg.fill('#fcs-ieee-arc-tcc',json.dumps(tcc)); await pg.click('[data-arc=curve]'); await pg.wait_for_timeout(600)
            st2=await pg.inner_text('#fcs-ieee-arc-status'); r['curve_status']=st2[:110]
            try:
                o2=json.loads(await pg.inner_text('#fcs-ieee-arc-output')); r['curve_times_ms']=[c['clearingTimeMS'] for c in o2['cases']]; r['curve_trace']=bool(o2.get('protectionTrace'))
            except Exception as e: r['curve_err']=str(e)
            await pg.fill('#fcs-ieee-arc-input','{"voltageKV":0.1}'); await pg.click('[data-arc=run]'); await pg.wait_for_timeout(300); r['invalid_msg']=(await pg.inner_text('#fcs-ieee-arc-status'))[:100]
            r['external_requests']=ext; r['errors']=errs; R[name]=r
        print(json.dumps(R,indent=1)); await b.close()
asyncio.run(main()); srv.terminate()
