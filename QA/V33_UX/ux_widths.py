"""B3 audit: WCAG 2.2 AA automated checks (axe-core 4, tags wcag2a/2aa/21a/21aa/22aa) and layout checks at
360/768/1280/1440/1920 px on every top-level tab of the studio. Usage: python3 ux_widths.py SITE_DIR PORT AXE_JS"""
import sys,json,subprocess,time,os
from playwright.sync_api import sync_playwright
site,port,axe=sys.argv[1],int(sys.argv[2]),sys.argv[3]
srv=subprocess.Popen([sys.executable,'-m','http.server',str(port),'-d',site],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
AXE=open(axe).read();VIEWS=['Main studio','Arc flash · IEEE 1584','∑ IEC study methods (beta)','∿ Harmonic network (beta)','☁ Cloud Vault','Operations study lab · time-series load flow','Fault label & Z tolerance','Arc flash · all buses','Conductor sizing','Harmonics & PF correction','Conductor I²t duty','✦ Study guide','Study setup','Equipment table','Build plant'];out={'widths':{}}
LAYOUT="""()=>{const W=document.documentElement.clientWidth;const over=document.documentElement.scrollWidth-W;
const vis=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'};
const small=[...document.querySelectorAll('button,a[href],input:not([type=hidden]),select,[role=tab]')].filter(vis).filter(e=>{const r=e.getBoundingClientRect();return (r.width<24||r.height<24)&&!(e.tagName==='A'&&getComputedStyle(e).display==='inline')}).map(e=>(e.id||e.getAttribute('aria-label')||e.textContent||e.name||e.tagName).trim().slice(0,40));
const clipped=[...document.querySelectorAll('body *')].filter(vis).filter(e=>{const r=e.getBoundingClientRect();return r.right>W+2&&!e.closest('[style*=overflow],.table-wrap,.scroll,table,svg,canvas,pre')}).length;
const tiny=[...document.querySelectorAll('body *')].filter(e=>e.childElementCount===0&&e.textContent.trim()&&vis(e)&&parseFloat(getComputedStyle(e).fontSize)<12).length;
return {pageOverflowPx:over,clippedElements:clipped,targetsUnder24px:small.length,targetSamples:[...new Set(small)].slice(0,8),textUnder12px:tiny}}"""
with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--disable-dev-shm-usage'])
  for w in [360,768,1280,1440,1920]:
    pg=b.new_page();pg.close();res={'tabs':[]}
    for name in VIEWS:
      pg=b.new_page(viewport={'width':w,'height':900});pg.goto(f'http://127.0.0.1:{port}/index.html');pg.wait_for_timeout(2500)
      if name!='Main studio':
        ok=pg.evaluate("t=>{const e=[...document.querySelectorAll('aside button,header button,main button')].find(e=>e.textContent.trim()===t);if(!e)return 0;e.click();return 1}",name);pg.wait_for_timeout(1500)
        if not ok:res['tabs'].append({'tab':name,'error':'button not found'});pg.close();continue
      pg.add_script_tag(content=AXE)
      ax=pg.evaluate("async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']},resultTypes:['violations']});return r.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.length,sample:v.nodes.slice(0,2).map(n=>n.target.join(' '))}))}")
      res['tabs'].append({'tab':name,'axe':ax,'layout':pg.evaluate(LAYOUT)});pg.close()
    out['widths'][w]=res;pg.close()
    print(w,[(t['tab'][:14],[(a['id'],a['nodes']) for a in t.get('axe',[])],t.get('layout',{}).get('pageOverflowPx'),t.get('layout',{}).get('targetsUnder24px'),t.get('error')) for t in res['tabs']],flush=True)
  b.close()
srv.terminate()
json.dump(out,open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'results','ux_widths.json'),'w'),indent=1)
