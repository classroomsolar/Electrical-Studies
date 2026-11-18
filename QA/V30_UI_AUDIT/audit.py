import sys,asyncio,subprocess,time,os,json,collections
from playwright.async_api import async_playwright
SITE=sys.argv[1];PORT=int(sys.argv[2]);OUT=sys.argv[3];os.makedirs(OUT,exist_ok=True)
ONLY=sys.argv[4].split(',') if len(sys.argv)>4 else None
JS=open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'audit.js')).read()
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'-d',SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
NAV=['network','results','operating','advanced','report','projects','database','atlas']
DLG={'tools-menu':"document.querySelector('#v26-tools-pop').open=true",
 'arc1584':"document.getElementById('fcs-ieee-arc-open').click()",'methods':"document.getElementById('fcs-method-open').click()",
 'harmonic':"document.getElementById('fcs-harmonic-open').click()",'cloud':"document.getElementById('fcs-cloud-open').click()",
 'ops-lab':"document.querySelector('[data-v27-launch]').click()",'envelope':"document.getElementById('fcs-v29-launch').click()",
 'arcflash-all':"document.getElementById('fcs-v29af-open').click()",'cable':"document.getElementById('fcs-v29cs-open').click()",
 'pq':"document.getElementById('fcs-v29pq-open').click()",'i2t':"document.getElementById('fcs-v28-launch').click()",
 'guide':"document.getElementById('v26-help-button').click()",'command':"document.querySelector('.atlas-command-trigger').click()",
 'study-setup':"[...document.querySelectorAll('main button')].find(b=>b.textContent.trim()==='Study setup').click()",
 'add-equip':"[...document.querySelectorAll('main button')].find(b=>b.textContent.includes('Add equipment')).click()",
 'data-popup':"document.querySelector('[data-edit-equipment]').click()",
 'plant-builder':"document.querySelector('[data-plant-builder]').click()",'equipment-table':"document.querySelector('[data-equipment-table]').click()"}
SCOPE={'arc1584':'#fcs-ieee-arc-overlay','methods':'#fcs-method-screen','harmonic':'#fcs-harmonic-overlay','cloud':'#fcs-cloud-dialog','ops-lab':'#v27-operations','envelope':'#fcs-v29-overlay','arcflash-all':'#fcs-v29af-ov','cable':'#fcs-v29cs-ov','pq':'#fcs-v29pq-ov','i2t':'#fcs-v28-overlay','guide':'#v26-help-panel','command':'#fcs-command-dialog','study-setup':'aside.drawing-inspector','add-equip':'aside.drawing-inspector','data-popup':'.equipment-data-dialog','tools-menu':'#v26-tools-pop','plant-builder':'#v31-plant-builder','equipment-table':'#v31-equipment-table'}
async def main():
  res={};total=collections.Counter()
  async with async_playwright() as p:
    b=await p.chromium.launch(channel='chrome')
    VPS=[('desktop',{'width':1440,'height':900}),('mobile',{'width':390,'height':844})]
    if os.environ.get('VPS'):VPS=[(f'w{w}',{'width':int(w),'height':900}) for w in os.environ['VPS'].split(',')]
    for vpn,vp in VPS:
      ctx=await b.new_context(viewport=vp);pg=await ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
      await pg.goto(f'http://localhost:{PORT}/');await pg.wait_for_timeout(3500)
      jobs=[('nav',n) for n in NAV]+[('dlg',k) for k in DLG]
      for kind,name in jobs:
        if ONLY and name not in ONLY:continue
        if kind=='nav':
          await pg.evaluate(f"location.hash='#{name}'");await pg.wait_for_timeout(1300)
        else:
          await pg.goto(f'http://localhost:{PORT}/#network');await pg.reload();await pg.wait_for_timeout(2500)
          try:await pg.evaluate(DLG[name])
          except Exception as e:res[f'{vpn}/{name}']=[{'type':'open-failed','el':str(e)[:100]}];continue
          await pg.wait_for_timeout(1500)
        await pg.evaluate(f"window.__auditScope={json.dumps(SCOPE.get(name))}")
        iss=await pg.evaluate(JS)
        res[f'{vpn}/{name}']=iss;total.update(i['type'] for i in iss)
        await pg.screenshot(path=f'{OUT}/{vpn}_{name}.png',full_page=(kind=='nav'))
        if kind=='dlg' and SCOPE.get(name) and name not in ('tools-menu','study-setup','add-equip','command','guide'):
          ran=await pg.evaluate(f"""(()=>{{const r=document.querySelector({json.dumps(SCOPE.get(name))});if(!r)return null;const b=[...r.querySelectorAll('button')].find(b=>!b.disabled&&b.offsetParent&&/^(calculate|check|run|size|compute|solve|calculate study|check limits|calculate all|example|load example|use example)/i.test(b.textContent.trim()));if(!b)return null;b.click();return b.textContent.trim()}})()""")
          if ran:
            await pg.wait_for_timeout(2000)
            iss=await pg.evaluate(JS);res[f'{vpn}/{name}+run']=iss;total.update(i['type'] for i in iss)
            await pg.screenshot(path=f'{OUT}/{vpn}_{name}_run.png')
      res[f'{vpn}/pageerrors']=errs;await ctx.close()
    await b.close()
  json.dump(res,open(f'{OUT}/issues.json','w'),indent=1)
  for k,v in res.items():
    if isinstance(v,list):print(k,len(v),dict(collections.Counter(i['type'] if isinstance(i,dict) else 'err' for i in v)))
  print('TOTAL',dict(total))
asyncio.run(main());srv.terminate()
