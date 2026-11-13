import asyncio, subprocess, time, json, sys
from playwright.async_api import async_playwright
SITE,PORT=sys.argv[1],sys.argv[2]
srv=subprocess.Popen(['python3','-m','http.server',PORT,'-d',SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
MOCK="window.showDirectoryPicker=async()=>{const root=await navigator.storage.getDirectory();return await root.getDirectoryHandle('My projects',{create:true})};"
async def opfs(pg,js): return await pg.evaluate("async()=>{const root=await (await navigator.storage.getDirectory()).getDirectoryHandle('My projects',{create:true});"+js+"}")
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        ctx=await b.new_context(viewport={'width':1440,'height':900}); await ctx.add_init_script(MOCK)
        pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('dialog',lambda d:asyncio.ensure_future(d.accept()))
        R={}
        await pg.goto(f'http://localhost:{PORT}/index.html#projects',wait_until='networkidle'); await pg.wait_for_timeout(2500)
        R['panel']=await pg.locator('.folder-panel h2').first.inner_text()
        await pg.click('[data-action="folder-connect"]'); await pg.wait_for_timeout(800)
        R['connected_text']=(await pg.locator('.folder-panel p').first.inner_text())[:80]
        await pg.fill('#folder-file-name','Worked example'); await pg.click('[data-action="folder-save"]'); await pg.wait_for_timeout(800)
        R['files_after_save']=await opfs(pg,"const n=[];for await(const [k] of root.entries())n.push(k);return n.sort()")
        # put a second project file directly in the folder
        other=json.loads(open('./results/plant80.json').read()); other['name']='Plant from disk'; other['id']='project-disk-1'
        await opfs(pg,"const fh=await root.getFileHandle('plant.fcs.json',{create:true});const w=await fh.createWritable();await w.write(%s);await w.close();return 1"%json.dumps(json.dumps(other)))
        await pg.click('[data-action="folder-refresh"]'); await pg.wait_for_timeout(600)
        R['rows']=await pg.locator('.folder-panel .saved-row strong').all_inner_texts()
        await pg.click('[data-folder-open="plant.fcs.json"]'); await pg.wait_for_timeout(2500)
        R['title_after_open']=await pg.locator('main header h1').inner_text()
        R['sidebar']=await pg.locator('.sidebar-bottom').inner_text()
        # change fault bus -> autosave
        await pg.select_option('#fault-bus',index=3); await pg.wait_for_timeout(2500)
        saved=json.loads(await opfs(pg,"const f=await (await root.getFileHandle('plant.fcs.json')).getFile();return await f.text()"))
        R['autosaved_selectedBus']=saved.get('selectedBus'); R['ui_selectedBus']=await pg.evaluate("()=>document.getElementById('fault-bus').value")
        # reload: folder and link restored
        print(json.dumps(R,indent=1),flush=True)
        await pg.goto(f'http://localhost:{PORT}/index.html#network',wait_until='load'); await pg.wait_for_timeout(2500)
        R['sidebar_after_reload']=await pg.locator('.sidebar-bottom').inner_text()
        await pg.goto(f'http://localhost:{PORT}/index.html#projects'); await pg.wait_for_timeout(1500)
        R['rows_after_reload']=await pg.locator('.folder-panel .saved-row strong').all_inner_texts()
        await pg.click('[data-folder-delete="worked-example.fcs.json"], [data-folder-delete="Worked example.fcs.json"]'); await pg.wait_for_timeout(800)
        R['files_after_delete']=await opfs(pg,"const n=[];for await(const [k] of root.entries())n.push(k);return n.sort()")
        R['errors']=errs[:3]
        await pg.screenshot(path='./results/folder.png',full_page=False)
        print(json.dumps(R,indent=1)); await b.close()
asyncio.run(main()); srv.terminate()
