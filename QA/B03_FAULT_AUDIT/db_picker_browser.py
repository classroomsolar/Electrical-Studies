"""Batch 3 (I-09): after the picker copies were removed, the Database view must still load every equipment category
from the master-* sheet files, show the same row counts, and request no missing file.
Usage: python3 db_picker_browser.py SITE_DIR PORT   (serves x.json from gzip x.json.txt, like the host)"""
import sys,os,json,threading,http.server,functools
from playwright.sync_api import sync_playwright
site,port=os.path.abspath(sys.argv[1]),int(sys.argv[2]);out=os.path.join(os.path.dirname(os.path.abspath(__file__)),'results')
class H(http.server.SimpleHTTPRequestHandler):
  def log_message(self,*a):pass
  def do_GET(self):
    p=self.path.split('?')[0]
    if p.endswith('.json') and os.path.exists(site+p+'.txt'):
      b=open(site+p+'.txt','rb').read();self.send_response(200);self.send_header('Content-Type','application/json');self.send_header('Content-Encoding','gzip');self.send_header('Content-Length',str(len(b)));self.end_headers();self.wfile.write(b);return
    return super().do_GET()
srv=http.server.ThreadingHTTPServer(('127.0.0.1',port),functools.partial(H,directory=site));threading.Thread(target=srv.serve_forever,daemon=True).start()
R=[];ok=lambda n,c,i='':(R.append({'check':n,'pass':bool(c),'info':str(i)[:400]}),print(('PASS ' if c else 'FAIL ')+n,str(i)[:200]))
with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--disable-dev-shm-usage'])
  pg=b.new_page(viewport={'width':1440,'height':900});errs=[];bad=[];reqs=[]
  pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('response',lambda r:(bad.append(r.url) if r.status>=400 else None,reqs.append(r.url) if '/database/' in r.url else None))
  pg.goto(f'http://127.0.0.1:{port}/index.html#database');pg.wait_for_timeout(4000)
  groups=pg.evaluate("()=>[...document.querySelectorAll('#master-group option')].map(o=>o.value)")
  opts=[];counts={}
  for g in groups:
    pg.select_option('#master-group',g);pg.wait_for_timeout(600)
    for s in pg.evaluate("()=>[...document.querySelectorAll('#master-sheet option')].map(o=>o.value)"):
      if s in counts:continue
      pg.select_option('#master-sheet',s);opts.append(s)
      for _ in range(40):
        pg.wait_for_timeout(400)
        t=pg.evaluate("()=>document.querySelector('main')?.innerText||''")
        if 'Loading' not in t and 'loading' not in t:break
      counts[s]=pg.evaluate("()=>{const t=document.querySelector('main')?.innerText||'';const m=t.match(/([\\d,]+)\\s+(?:records|rows|matches)/i);return m?m[0]:''}")
  ok('database view lists sheets in every group',len(opts)>0,len(opts))
  ok('every sheet shows a row count',all(counts.values()),{k:v for k,v in counts.items() if not v})
  import gzip;man=json.loads(gzip.open(os.path.join(site,'database','manifest.json.txt')).read())['workbookSheets']
  want={k:v['count'] for k,v in man.items()};got={k:int(v.split()[0].replace(',','')) for k,v in counts.items() if v}
  ok('shown row count equals the manifest count for every sheet',all(got.get(k)==want[k] for k in want),{k:(got.get(k),want[k]) for k in want if got.get(k)!=want[k]})
  dbfiles=sorted({u.split('/database/')[1].split('?')[0].removesuffix('.txt') for u in reqs})
  ok('no request failed',not bad,bad)
  ok('no page error',not errs,errs)
  ok('only manifest and master-* sheet files are requested',all(f=='manifest.json' or f.startswith('master-') for f in dbfiles),dbfiles)
  pg.screenshot(path=os.path.join(out,'db_picker_1440.png'))
  b.close()
srv.shutdown()
json.dump({'checks':R,'categories':opts,'shown':counts,'files':dbfiles},open(os.path.join(out,'db_picker_browser.json'),'w'),indent=1)
print({'pass':sum(r['pass'] for r in R),'fail':sum(not r['pass'] for r in R)})
