# Loads every database file through the site's own gzip fetch shim and validators, in Chrome.
import asyncio, subprocess, time, json, os, sys
from playwright.async_api import async_playwright
SITE=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../../../SITE'); PORT=sys.argv[1] if len(sys.argv)>1 else '8893'
srv=subprocess.Popen(['python3','-m','http.server',PORT,'-d',SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
JS='''async()=>{
 const md=await import('./master-database.mjs?v=20261022-pv-final'); const cl=await import('./cable-library.mjs?v=20261022-pv-final');
 const ds=await import('./database-selection.mjs?v=20261022-pv-final');
 const m=await (await fetch('database/manifest.json',{cache:'no-cache'})).json(); const out={workbook:{},picker:{},errors:[]};
 for(const [s,meta] of Object.entries(m.workbookSheets)){try{const d=await (await fetch(meta.file)).json();const r=md.decodeWorkbookSheet(d,meta);out.workbook[s]=r.records.length}catch(e){out.errors.push(s+': '+e.message)}}
 for(const [s,meta] of Object.entries(m.sheets)){try{const d=await (await fetch(meta.file)).json();if(d.sheet!==s||d.records.length!==meta.count)throw Error('count');
   let mapped=0;for(const row of d.records){try{ds.catalogRecord(s,row);mapped++}catch(e){}}out.picker[s]=[d.records.length,mapped]}catch(e){out.errors.push('picker '+s+': '+e.message)}}
 try{const c=cl.decodeCableLibrary(await (await fetch(m.cablePicker.file)).json());out.cablePicker=c.records.length}catch(e){out.errors.push('cable picker: '+e.message)}
 out.sha=m.workbook.sha256; return out}'''
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=await b.new_page(); errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto(f'http://localhost:{PORT}/index.html',wait_until='networkidle'); await pg.wait_for_timeout(2500)
        r=await pg.evaluate(JS); r['pageErrors']=errs
        print(json.dumps({'sheets':len(r['workbook']),'pickers':r['picker'],'cablePicker':r.get('cablePicker'),'errors':r['errors'],'pageErrors':errs,'sha':r['sha']},indent=1)); await b.close()
asyncio.run(main()); srv.terminate()
