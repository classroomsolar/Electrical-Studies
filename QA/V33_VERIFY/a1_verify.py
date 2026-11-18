# V33 functional verification (A1) of Fault Current Studio at desktop 1440x900 and mobile 390x844.
# Usage: python3 a1_verify.py [SITE_DIR] [PORT] [--only a,b,c,d,e,f,g,h,perf] [--vp desktop,mobile]
# Writes results/a1_verify.json (merged with earlier partial runs) and screenshots in results/.
# Nothing in SITE/ is modified. Every check records pass / fail / not_tested, a time and evidence.
import asyncio, subprocess, time, json, sys, os, io, re, zipfile, traceback
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
QA = os.path.dirname(HERE)
_a = sys.argv[1:]
args = [a for i, a in enumerate(_a) if not a.startswith('--') and not (i and _a[i - 1].startswith('--'))]
SITE = args[0] if args else os.path.join(os.path.dirname(QA), 'SITE')
PORT = args[1] if len(args) > 1 else '9310'
def opt(name, default):
    for i, a in enumerate(sys.argv):
        if a == '--' + name and i + 1 < len(sys.argv): return sys.argv[i + 1].split(',')
    return default
ONLY = opt('only', ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'perf'])
VPS = opt('vp', ['desktop', 'mobile'])
OUT = os.path.join(HERE, 'results'); os.makedirs(OUT, exist_ok=True)
PLANT = open(os.path.join(QA, 'V31_SCALE/results/plant2000.json')).read()
PLANT80 = open(os.path.join(QA, 'V31_SCALE/results/plant80.json')).read()
SEQ = open(os.path.join(QA, 'V32_SEQUENCE/results/seq2000.json')).read()
SPLIT = open(os.path.join(QA, 'V32_SEQUENCE/results/split2000.json')).read()
BASE = f'http://localhost:{PORT}/index.html'
BIG = 180000
VIEWPORTS = {'desktop': dict(viewport={'width': 1440, 'height': 900}),
             'mobile': dict(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, device_scale_factor=2)}
READY = "()=>/\\d (kA|A)$/.test(document.querySelector('.metrics .metric strong')?.textContent||'')&&/CALCULATED|SCREENING BOUND/.test(document.querySelector('.metrics .metric')?.textContent||'')"
DRAFT = "()=>{const p=JSON.parse(localStorage.getItem('fault-network-draft-v2'));return {buses:p.buses.length,branches:p.branches.length,devices:p.devices.length,sources:p.sources.length,pvArrays:(p.pvArrays||[]).length,faultType:p.settings.faultType,name:p.name}}"
KNOWN = ('fonts.googleapis.com', 'favicon.ico')

RESULTS = []   # rows: item, viewport, status, time_s, evidence
def rec(item, vp, ok, t=None, evidence=''):
    status = ok if isinstance(ok, str) else ('pass' if ok else 'fail')
    row = {'item': item, 'viewport': vp, 'status': status, 'time_s': None if t is None else round(t, 2), 'evidence': str(evidence)[:600]}
    RESULTS.append(row); print(f"[{status.upper():10}] {vp:7} {item} {'' if t is None else str(round(t,2))+' s'} :: {row['evidence'][:200]}", flush=True)

class Session:
    """One browser context + page with error capture."""
    def __init__(self, browser, vp): self.browser, self.vp, self.errors = browser, vp, []
    async def __aenter__(self):
        self.ctx = await self.browser.new_context(accept_downloads=True, **VIEWPORTS[self.vp]); self.pg = await self.ctx.new_page()
        self.pg.set_default_timeout(60000)
        self.pg.on('pageerror', lambda e: self.errors.append('pageerror: ' + str(e)[:300]))
        self.pg.on('console', lambda m: self.errors.append(f'console.{m.type}: ' + m.text[:300]) if m.type in ('error', 'warning') else None)
        self.pg.on('requestfailed', lambda r: self.errors.append('requestfailed: ' + r.url[:200]))
        self.pg.on('response', lambda r: self.errors.append(f'http{r.status}: ' + r.url[:200]) if r.status >= 400 else None)
        await self.pg.add_init_script("window.__printCalls=0;window.print=()=>{window.__printCalls++}")
        return self
    async def __aexit__(self, *a): await self.ctx.close()
    def new_errors(self):
        """Errors that are not the two known offline ones (Google Fonts, favicon)."""
        out = [e for e in self.errors if not any(k in e for k in KNOWN) and not ('Failed to load resource' in e and '404' in e)]
        return out
    async def load(self, project=None, hash_='network'):
        pg = self.pg
        await pg.goto(BASE + '#' + hash_); await pg.wait_for_timeout(1500)
        if project is not None:
            await pg.evaluate("s=>localStorage.setItem('fault-network-draft-v2',s)", project)
            await pg.reload()
        t = time.time(); await pg.wait_for_function(READY, timeout=BIG); return time.time() - t
    async def click(self, sel, timeout=8000):
        """Real click; if the control is not clickable (hidden/covered) fall back to a DOM click and say so."""
        try:
            await self.pg.click(sel, timeout=timeout); return 'click'
        except Exception as e:
            n = await self.pg.evaluate("s=>{const e=document.querySelector(s);if(!e)return 0;e.click();return 1}", sel)
            if not n: raise
            return 'dom-click (real click failed: ' + str(e).split('\n')[0][:120] + ')'
    async def shot(self, name, full=False):
        try: await self.pg.screenshot(path=os.path.join(OUT, name), full_page=full)
        except Exception as e: print('screenshot failed', name, e)

async def download(pg, sel, timeout=BIG):
    async with pg.expect_download(timeout=timeout) as dl: await pg.click(sel)
    d = await dl.value; return open(await d.path(), 'rb').read(), d.suggested_filename
def xlsx_info(data):
    z = zipfile.ZipFile(io.BytesIO(data)); wb = z.read('xl/workbook.xml').decode()
    return re.findall(r'<sheet name="([^"]*)"', wb), z.testzip()

async def step(item, vp, coro):
    """Run one check; an exception is a fail with the error text as evidence."""
    t = time.time()
    try: return await coro
    except Exception as e:
        rec(item, vp, False, time.time() - t, 'EXCEPTION ' + str(e).split('\n')[0][:400]); traceback.print_exc(limit=2)

# ---------------------------------------------------------------- a. report page
async def report_checks(s, vp, tag, big):
    pg = s.pg; I = f'a.report[{tag}]'
    n_before = len(s.errors)
    await pg.evaluate("location.hash='#report'"); t = time.time()
    await pg.wait_for_selector('.report-contents', timeout=BIG); rec(I + ' chooser shown', vp, True, time.time() - t, '.report-contents')
    await pg.wait_for_timeout(1500)
    secs = await pg.evaluate("()=>[...document.querySelectorAll('[data-report-section]')].map(e=>[e.dataset.reportSection,e.checked])")
    rec(I + ' section checkboxes present', vp, len(secs) > 0, None, json.dumps(secs))
    # untick "inputs" -> the inputs panel must leave the report; tick again -> comes back
    if any(k == 'inputs' for k, _ in secs):
        box = pg.locator('[data-report-section="inputs"]')
        if not await box.is_checked(): await box.click(); await pg.wait_for_timeout(800)
        a = await pg.locator('.report-inputs').count(); t = time.time(); await box.click()
        try: await pg.wait_for_function("()=>!document.querySelector('.report-inputs')", timeout=60000); ok = True
        except Exception: ok = False
        dt = time.time() - t; b = await pg.locator('.report-inputs').count()
        await pg.locator('[data-report-section="inputs"]').click(); await pg.wait_for_timeout(1200); c = await pg.locator('.report-inputs').count()
        rec(I + ' section checkbox toggles content', vp, ok and a > 0 and b == 0 and c > 0, dt, f'.report-inputs count ticked={a} unticked={b} re-ticked={c}')
    # scope radios
    scopes = await pg.evaluate("()=>[...document.querySelectorAll('[data-report-scope]')].map(e=>[e.dataset.reportScope,e.checked,e.disabled])")
    rec(I + ' scope radios all/selected present', vp, {x[0] for x in scopes} >= {'all', 'selected'}, None, json.dumps(scopes))
    rows = "()=>document.querySelectorAll('#app .report-page tbody tr, #app table tbody tr').length"
    try:
        await pg.locator('[data-report-scope="selected"]').click(); await pg.wait_for_timeout(1500); r_sel = await pg.evaluate(rows)
        sel_ok = await pg.locator('[data-report-scope="selected"]').is_checked()
        if not big:
            t = time.time(); await pg.locator('[data-report-scope="all"]').click(); await pg.wait_for_timeout(1500); r_all = await pg.evaluate(rows)
            all_ok = await pg.locator('[data-report-scope="all"]').is_checked()
            rec(I + ' scope radio switches all<->selected', vp, sel_ok and all_ok and r_all >= r_sel, None, f'table rows selected={r_sel} all={r_all}')
        else:
            rec(I + ' scope "selected" active', vp, sel_ok, None, f'table rows selected={r_sel}')
    except Exception as e: rec(I + ' scope radio switches', vp, False, None, str(e)[:300])
    # extra studies: list what the page offers, then register one the way tool dialogs do and tick it
    studies = await pg.evaluate("()=>[...document.querySelectorAll('[data-report-study]')].map(e=>[e.dataset.reportStudy,e.checked,e.disabled])")
    await pg.evaluate("""()=>{(globalThis.__fcsReportStudies??=new Map()).set('v33',{label:'V33 test tool study',projectId:globalThis.__fcsStudio.projectId(),at:Date.now(),get:()=>({method:'test',inputs:{a:1},outputs:{status:'OK',value:42}})});dispatchEvent(new Event('fcs-report-studies'))}""")
    await pg.wait_for_timeout(1000)
    n = await pg.locator('[data-report-study="tool:v33"]').count(); printed = 0
    if n:
        await pg.locator('[data-report-study="tool:v33"]').click(); await pg.wait_for_timeout(1200)
        printed = await pg.locator('.report-extra h2', has_text='V33 test tool study').count()
    rec(I + ' extra studies chooser', vp, n == 1 and printed >= 1, None, f'native studies offered={json.dumps(studies)[:300]}; registered tool study box={n}, printed in report={printed}')
    await s.shot(f'a_report_{tag}_{vp}.png')
    # downloads
    try:
        t = time.time(); pdf, name = await download(pg, '[data-action="pdf"]'); dt = time.time() - t
        rec(I + ' PDF download', vp, pdf[:4] == b'%PDF', dt, f'{name} {len(pdf)} bytes, head={pdf[:8]!r}')
    except Exception as e:
        msg = await pg.evaluate("()=>(document.querySelector('#app .notice, #app [role=status], #app [role=alert]')?.innerText||'').slice(0,300)")
        rec(I + ' PDF download', vp, False, time.time() - t, f'no download: {str(e).splitlines()[0][:150]} | page message: {msg}')
    try:
        t = time.time(); x, name = await download(pg, '[data-action="xlsx"]'); dt = time.time() - t; names, bad = xlsx_info(x)
        rec(I + ' Excel download', vp, bad is None and len(names) > 0, dt, f'{name} {len(x)} bytes, sheets={names[:12]}')
    except Exception as e: rec(I + ' Excel download', vp, False, time.time() - t, 'no download: ' + str(e).splitlines()[0][:200])
    try:
        before = await pg.evaluate("window.__printCalls"); ne = len(s.errors); t = time.time()
        how = await s.click('[data-action="print"]'); await pg.wait_for_timeout(2500 if not big else 8000)
        after = await pg.evaluate("window.__printCalls"); errs = [e for e in s.errors[ne:] if e.startswith('pageerror')]
        rec(I + ' print (window.print stubbed)', vp, after > before and not errs, time.time() - t, f'{how}; window.print calls {before}->{after}; pageerrors={errs}')
    except Exception as e: rec(I + ' print', vp, False, None, str(e)[:300])
    ov = await pg.evaluate("()=>[document.documentElement.scrollWidth,innerWidth]")
    rec(I + ' no horizontal page overflow', vp, ov[0] <= ov[1] + 1, None, f'scrollWidth={ov[0]} innerWidth={ov[1]}')
    new = [e for e in s.new_errors() if e in s.errors[n_before:]]
    rec(I + ' no new page/console errors', vp, not new, None, json.dumps(new[:5]))

async def item_a(browser, vp):
    async with Session(browser, vp) as s:
        await step('a.report[example]', vp, (lambda: s.load())())
        await step('a.report[example]', vp, report_checks(s, vp, 'example', False))
    async with Session(browser, vp) as s:
        async def go():
            t = await s.load(PLANT); rec('a.report[plant2000] project loads', vp, True, t, 'metric ready')
            await report_checks(s, vp, 'plant2000', True)
            # all-buses scope on the large plant
            pg = s.pg; t = time.time(); await pg.locator('[data-report-scope="all"]').click(); await pg.wait_for_timeout(3000)
            try:
                x, name = await download(pg, '[data-action="xlsx"]'); names, bad = xlsx_info(x)
                rec('a.report[plant2000] Excel, scope=all', vp, bad is None and len(names) > 0, time.time() - t, f'{len(x)} bytes, {len(names)} sheets')
            except Exception as e: rec('a.report[plant2000] Excel, scope=all', vp, False, time.time() - t, str(e).splitlines()[0][:200])
            t = time.time()
            try:
                pdf, name = await download(pg, '[data-action="pdf"]', timeout=60000)
                rec('a.report[plant2000] PDF, scope=all', vp, pdf[:4] == b'%PDF', time.time() - t, f'{len(pdf)} bytes')
            except Exception as e:
                txt = await pg.locator('#app').inner_text(); m = re.search(r'[^.\n]*PDF report would exceed[^\n]*', txt)
                rec('a.report[plant2000] PDF, scope=all', vp, 'pass' if m else False, time.time() - t, ('no file; app shows size-limit message: ' + m.group(0)[:300]) if m else 'no download and no message within 60 s')
        await step('a.report[plant2000]', vp, go())

# ---------------------------------------------------------------- b. 2,000-bus unbalanced / split-phase
async def item_b(browser, vp):
    async with Session(browser, vp) as s:
        pg = s.pg
        async def go():
            t = await s.load(SEQ); m = await pg.locator('.metrics .metric').first.inner_text()
            rec('b.seq2000 SLG (as stored) calculates', vp, True, t, m.replace('\n', ' | '))
            for ft in ['ll', 'dlg', 'slg']:
                async def one(ft=ft):
                    how = await s.click_text_button('Study setup'); await pg.wait_for_selector('#field-settings-faultType', state='attached', timeout=60000)
                    t = time.time()
                    try: await pg.select_option('#field-settings-faultType', ft, timeout=8000); sel = 'select_option'
                    except Exception as e:
                        await pg.evaluate("v=>{const e=document.getElementById('field-settings-faultType');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))}", ft); sel = 'dom change event (select not interactable: ' + str(e).splitlines()[0][:100] + ')'
                    await pg.wait_for_function("v=>JSON.parse(localStorage.getItem('fault-network-draft-v2')).settings.faultType===v", arg=ft, timeout=BIG)
                    await pg.wait_for_timeout(400); await pg.wait_for_function(READY, timeout=BIG); dt = time.time() - t
                    m = (await pg.locator('.metrics .metric').first.inner_text()).replace('\n', ' | ')
                    rec(f'b.seq2000 fault type -> {ft.upper()} via Study setup', vp, True, dt, f'{how}; {sel}; metric: {m}')
                await step(f'b.seq2000 fault type -> {ft.upper()} via Study setup', vp, one())
            await s.shot(f'b_seq2000_{vp}.png')
        await step('b.seq2000', vp, go())
        rec('b.seq2000 no new page/console errors', vp, not s.new_errors(), None, json.dumps(s.new_errors()[:5]))
    async with Session(browser, vp) as s:
        async def go():
            t = await s.load(SPLIT); m = await s.pg.locator('.metrics .metric').first.inner_text()
            rec('b.split2000 split-phase calculates', vp, True, t, m.replace('\n', ' | ')); await s.shot(f'b_split2000_{vp}.png')
        await step('b.split2000 split-phase calculates', vp, go())
        rec('b.split2000 no new page/console errors', vp, not s.new_errors(), None, json.dumps(s.new_errors()[:5]))

async def click_text_button(self, text):
    """Click a visible <main> button by its exact text (Study setup, + Add equipment ...)."""
    loc = self.pg.locator('main button', has_text=re.compile('^\\s*' + re.escape(text) + '\\s*$')).first
    try: await loc.click(timeout=8000); return 'click'
    except Exception as e:
        ok = await self.pg.evaluate("t=>{const b=[...document.querySelectorAll('main button')].find(b=>b.textContent.trim()===t);if(!b)return 0;b.click();return 1}", text)
        if not ok: raise
        return 'dom-click (real click failed: ' + str(e).splitlines()[0][:120] + ')'
Session.click_text_button = click_text_button

# ---------------------------------------------------------------- c. operating studies
async def operating(s, vp, tag, slack_label):
    pg = s.pg; I = f'c.operating[{tag}]'
    t = time.time(); await pg.evaluate("location.hash='#operating'"); await pg.wait_for_selector('#op-base', timeout=BIG); rec(I + ' page opens', vp, True, time.time() - t, '#op-base')
    blocker = (await pg.locator('.operating-blocker').first.inner_text())[:160] if await pg.locator('.operating-blocker').count() else ''
    await pg.fill('#op-base', '100'); await pg.press('#op-base', 'Tab'); await pg.wait_for_timeout(1500)
    opts = await pg.evaluate("()=>[...document.querySelectorAll('#op-slack option')].map(o=>o.textContent.trim()).slice(0,6)")
    await pg.select_option('#op-slack', label=slack_label); await pg.wait_for_timeout(1500)
    btn = await pg.locator('[data-action="operating-fill-zero"]').inner_text()
    t = time.time(); how = await s.click('[data-action="operating-fill-zero"]')
    try:
        await pg.wait_for_selector('.operating-ok', timeout=BIG); dt = time.time() - t
        res = (await pg.locator('.operating-ok').first.inner_text())[:200].replace('\n', ' ')
        rows = await pg.locator('.operating-ok + .operating-table-wrap tbody tr').count()
        rec(I + ' load flow result after base/slack + fill-zero', vp, True, dt, f'button "{btn[:60]}" ({how}); before: "{blocker}"; result: "{res}"; first result table rows={rows}')
    except Exception as e:
        b2 = (await pg.locator('.operating-blocker').first.inner_text())[:300] if await pg.locator('.operating-blocker').count() else ''
        rec(I + ' load flow result after base/slack + fill-zero', vp, False, time.time() - t, f'no .operating-ok; blocker="{b2}"; slack options={opts}')
    await s.shot(f'c_operating_{tag}_{vp}.png')

async def item_c(browser, vp):
    async with Session(browser, vp) as s:
        async def go():
            await s.load(PLANT); await operating(s, vp, 'plant2000', 'POI')
            # put 0.8 MW on one inverter bus so the solution is not the trivial all-zero one
            pg = s.pg; inv = await pg.evaluate("()=>{const p=JSON.parse(localStorage.getItem('fault-network-draft-v2'));return p.sources.find(s=>s.kind==='pv').bus}")
            sel = f'[data-op-bus="{inv}"][data-op-field="pMW"]'
            if await pg.locator(sel).count():
                t = time.time(); await pg.fill(sel, '0.8'); await pg.press(sel, 'Tab'); await pg.wait_for_timeout(400); await pg.wait_for_selector('.operating-ok', timeout=BIG)
                rec('c.operating[plant2000] re-solve after 0.8 MW on one inverter bus', vp, True, time.time() - t, (await pg.locator('.operating-ok').first.inner_text())[:200].replace('\n', ' '))
            else: rec('c.operating[plant2000] re-solve after 0.8 MW on one inverter bus', vp, 'not_tested', None, f'input {sel} not in DOM (bus rows may be paged)')
        await step('c.operating[plant2000]', vp, go())
        rec('c.operating[plant2000] no new page/console errors', vp, not s.new_errors(), None, json.dumps(s.new_errors()[:5]))
    async with Session(browser, vp) as s:
        async def go():
            await s.load(PLANT80); pg = s.pg
            links = await pg.evaluate("()=>{const p=JSON.parse(localStorage.getItem('fault-network-draft-v2'));const dev=new Map(p.devices.map(d=>[d.id,d]));return p.branches.filter(b=>b.kind==='link'&&b.enabled!==false&&dev.get(b.deviceId)?.enabled!==false).length}")
            rec('c.operating[plant80, closed breakers] model has closed switch links between buses', vp, links > 0, None, f'{links} closed link branches (breakers) in QA/V31_SCALE/results/plant80.json')
            await operating(s, vp, 'plant80-switches', 'POI')
        await step('c.operating[plant80-switches]', vp, go())
        rec('c.operating[plant80-switches] no new page/console errors', vp, not s.new_errors(), None, json.dumps(s.new_errors()[:5]))

# ---------------------------------------------------------------- d. arc flash all buses
AF_DONE = "()=>{const e=document.getElementById('v29af-status');return /buses calculated/.test(e.textContent)||e.className==='bad'}"
AF_STAT = "()=>{const c={};document.querySelectorAll('#v29af-table tr[data-bus] td:last-child').forEach(td=>{const k=(td.firstChild?.textContent||'').trim().slice(0,60);c[k]=(c[k]||0)+1});return c}"
async def af_run(s):
    pg = s.pg; await pg.evaluate("document.getElementById('v29af-status').textContent=''")
    t = time.time(); await pg.click('[data-af="run"]'); await pg.wait_for_function(AF_DONE, timeout=BIG); dt = time.time() - t
    return dt, await pg.locator('#v29af-status').inner_text(), await pg.evaluate(AF_STAT)
async def item_d(browser, vp):
    async with Session(browser, vp) as s:
        pg = s.pg
        async def go():
            await s.load(PLANT)
            t = time.time(); how = await s.click('#fcs-v29af-open'); await pg.wait_for_selector('#fcs-v29af-ov:not([hidden])', timeout=BIG)
            rec('d.arcflash-all[plant2000] dialog opens', vp, True, time.time() - t, how)
            dt, st, stat = await af_run(s); rows = await pg.locator('#v29af-table tr[data-bus]').count()
            rec('d.arcflash-all[plant2000] Run/update completes (bracket off)', vp, 'buses calculated' in st and rows > 0, dt, f'status="{st}"; rows={rows}; row statuses={json.dumps(stat)}')
            # bracket option
            await pg.check('#v29af-bracket'); dt, st2, stat2 = await af_run(s)
            rec('d.arcflash-all[plant2000] Run/update with "Bracket bounded currents"', vp, 'buses calculated' in st2 and stat2 != stat, dt, f'status="{st2}"; row statuses={json.dumps(stat2)} (before: {json.dumps(stat)})')
            # choose a bus that is inside the IEEE 1584 range and needs only clearing times
            bus = await pg.evaluate("""()=>{const tr=[...document.querySelectorAll('#v29af-table tr[data-bus]')].find(tr=>!/OUTSIDE|EXCLUDED/.test(tr.lastElementChild.textContent)&&tr.querySelector('[data-k=clearingFullMS]'));return tr&&{id:tr.dataset.bus,text:tr.lastElementChild.innerText.slice(0,120),name:tr.children[1].innerText.replace(/\\n/g,' ')}}""")
            if not bus: rec('d.arcflash-all[plant2000] typed clearing times give incident energy', vp, 'not_tested', None, 'no row with typed clearing-time inputs inside the model range'); return
            row = f'#v29af-table tr[data-bus="{bus["id"]}"]'
            await pg.fill(row + ' [data-k="clearingFullMS"]', '100'); await pg.fill(row + ' [data-k="clearingReducedMS"]', '200'); await pg.fill(row + ' [data-k="clearingSource"]', 'V33 QA typed times')
            dt, st3, stat3 = await af_run(s); cell = await pg.locator(row + ' td').nth(9).inner_text(); last = await pg.locator(row + ' td').last.inner_text()
            rec('d.arcflash-all[plant2000] typed clearing times give incident energy (bracket on)', vp, 'cal/cm' in cell and last.startswith('CALCULATED'), dt, f'bus {bus["name"]}: result cell="{cell}" status="{last[:80]}"; dialog status="{st3}"'.replace('\n', ' '))
            await s.shot(f'd_arcflash_{vp}.png')
            # same bus, bracket off again -> must go back to review
            await pg.uncheck('#v29af-bracket'); dt, st4, stat4 = await af_run(s); last4 = await pg.locator(row + ' td').last.inner_text()
            rec('d.arcflash-all[plant2000] bracket off again changes the same bus back', vp, last4 != last, dt, f'status with bracket="{last[:60]}" without="{last4[:90]}"'.replace('\n', ' '))
            await pg.check('#v29af-bracket')
            # per-bus protective device picker on another bus
            bus2 = await pg.evaluate("""id=>{const tr=[...document.querySelectorAll('#v29af-table tr[data-bus]')].find(tr=>tr.dataset.bus!==id&&!/OUTSIDE|EXCLUDED/.test(tr.lastElementChild.textContent)&&tr.querySelector('select[data-dev-type]'));return tr&&{id:tr.dataset.bus,opts:[...tr.querySelector('select[data-dev-type]').options].map(o=>o.value),name:tr.children[1].innerText.replace(/\\n/g,' ')}}""", bus['id'])
            if not bus2: rec('d.arcflash-all[plant2000] per-bus protective-device picker', vp, 'not_tested', None, 'no select[data-dev-type] found'); return
            sel = f'#v29af-table select[data-dev-type="{bus2["id"]}"]'
            t = time.time(); await pg.select_option(sel, 'ieee'); await pg.wait_for_selector('#v29af-dev:not([hidden]) [data-dv-act="save"]', timeout=BIG); dt = time.time() - t
            rec('d.arcflash-all[plant2000] device picker opens (select "Relay - IEEE curve" on one bus)', vp, True, dt, f'bus {bus2["name"]}; options={bus2["opts"]}; select[data-dev-type] -> #v29af-dev')
            await pg.fill('#v29af-dev [data-dv="pickupA"]', '400'); await pg.fill('#v29af-dev [data-dv="dial"]', '1')
            await pg.fill('#v29af-dev [data-dv="instPickupA"]', '2000'); await pg.fill('#v29af-dev [data-dv="instDelayS"]', '0.02')
            await s.shot(f'd_arcflash_device_{vp}.png')
            t = time.time(); await pg.click('#v29af-dev [data-dv-act="save"]')
            try:
                await pg.wait_for_selector('#v29af-dev', state='hidden', timeout=BIG); dt = time.time() - t
                rec('d.arcflash-all[plant2000] device picker Save', vp, True, dt, 'status: ' + await pg.locator('#v29af-status').inner_text())
            except Exception:
                rec('d.arcflash-all[plant2000] device picker Save', vp, False, time.time() - t, 'dialog stayed open: ' + await pg.locator('#v29af-dev [data-dv-preview]').inner_text()); return
            dt, st5, stat5 = await af_run(s); r2 = f'#v29af-table tr[data-bus="{bus2["id"]}"]'
            cell = await pg.locator(r2 + ' td').nth(9).inner_text(); clr = await pg.locator(r2 + ' td').nth(7).inner_text(); last = await pg.locator(r2 + ' td').last.inner_text()
            rec('d.arcflash-all[plant2000] Run/update after device saved', vp, 'from device' in clr, dt, f'clearing cell="{clr}" result="{cell}" status="{last[:100]}"; dialog status="{st5}"'.replace('\n', ' '))
            # time to re-open the saved device with the Settings… button
            t = time.time(); await pg.click(f'#v29af-table [data-dev-edit="{bus2["id"]}"]'); await pg.wait_for_selector('#v29af-dev:not([hidden]) [data-dv-act="cancel"]'); dt = time.time() - t
            rec('d.arcflash-all[plant2000] device "Settings…" button re-opens picker', vp, True, dt, '[data-dev-edit]'); await pg.click('#v29af-dev [data-dv-act="cancel"]')
            t = time.time(); await pg.click('#fcs-v29af-ov [data-af="close"]'); await pg.wait_for_selector('#fcs-v29af-ov', state='hidden'); rec('d.arcflash-all[plant2000] dialog closes', vp, True, time.time() - t, '[data-af="close"]')
        await step('d.arcflash-all[plant2000]', vp, go())
        rec('d.arcflash-all[plant2000] no new page/console errors', vp, not s.new_errors(), None, json.dumps(s.new_errors()[:5]))

# ---------------------------------------------------------------- e. engineering studies arc-flash card
ARC = {'boltedFaultKA': '16.7', 'workingDistanceMm': '457.2', 'electrodeGapMm': '25', 'enclosureHeightMm': '508', 'enclosureWidthMm': '508', 'enclosureDepthMm': '508', 'clearingTimeS': '0.1'}
async def item_e(browser, vp):
    async with Session(browser, vp) as s:
        pg = s.pg
        async def go():
            await s.load(); ctx_ = await pg.evaluate("()=>{const p=JSON.parse(localStorage.getItem('fault-network-draft-v2'));const b=p.buses.find(b=>b.id===p.selectedBus);return {bus:b?.name,voltage:b?.voltage,faultType:p.settings.faultType}}")
            await pg.evaluate("location.hash='#advanced'"); await pg.wait_for_selector('[data-advanced-module="arc"][data-advanced-field="boltedFaultKA"]', timeout=BIG)
            card = "section.operating-card:has([data-advanced-module='arc'])"
            before = (await pg.locator(card + ' [role=status]').first.inner_text())[:200] if await pg.locator(card + ' [role=status]').count() else '(no status)'
            t = time.time()
            for k, v in ARC.items():
                sel = f'[data-advanced-module="arc"][data-advanced-field="{k}"]'; await pg.fill(sel, v); await pg.press(sel, 'Tab'); await pg.wait_for_timeout(250)
            await pg.select_option('select[data-advanced-module="arc"][data-advanced-field="electrodeConfiguration"]', 'VCB'); await pg.wait_for_timeout(1200)
            txt = (await pg.locator(card).inner_text()); m = re.search(r'Incident energy ([\d.,]+) cal/cm²[^\n]*', txt)
            kept = await pg.evaluate("()=>JSON.parse(localStorage.getItem('fault-network-draft-v2')).advancedStudy?.arc")
            rec('e.engineering arc-flash card gives IEEE 1584 incident energy', vp, bool(m), time.time() - t, f'selected bus {ctx_}; before: "{before}"; after: "{m.group(0)[:260] if m else txt[-300:]}"; stored inputs={json.dumps(kept)}'.replace('\n', ' '))
            await pg.locator(card).scroll_into_view_if_needed(); await s.shot(f'e_engineering_arc_{vp}.png')
        await step('e.engineering arc-flash card', vp, go())
        rec('e.engineering no new page/console errors', vp, not s.new_errors(), None, json.dumps(s.new_errors()[:5]))

# ---------------------------------------------------------------- f. equipment table
async def item_f(browser, vp):
    async with Session(browser, vp) as s:
        pg = s.pg
        async def go():
            await s.load(); before = await pg.evaluate(DRAFT)
            t = time.time(); how = await s.click('[data-equipment-table]'); await pg.wait_for_selector('#et-download', timeout=BIG); rec('f.equipment-table dialog opens', vp, True, time.time() - t, how)
            t = time.time(); data, name = await download(pg, '#et-download'); text = data.decode('utf-8-sig').splitlines()
            head = text[0].split(','); cols = [h.split(' [')[0] for h in head]
            rec('f.equipment-table CSV download', vp, len(text) > 1 and 'action' in cols and 'id' in cols, time.time() - t, f'{name}: {len(text)} lines, {len(cols)} columns, first columns={cols[:8]}, types={sorted({l.split(",")[cols.index("type")] for l in text[1:]})}')
            row = lambda o: ','.join(str(o.get(c, '')) for c in cols)
            types = [l.split(',')[cols.index('type')] for l in text[1:]]; ids = [l.split(',')[cols.index('id')] for l in text[1:]]
            # delete a protective device if the project has one (keeps the network connected); otherwise not tested
            victim = next((i for i, t_ in zip(ids, types) if t_.startswith('device') or t_ in ('breaker', 'fuse', 'switchgear', 'recloser', 'disconnect', 'panel')), None)
            volt = await pg.evaluate("()=>JSON.parse(localStorage.getItem('fault-network-draft-v2')).buses.at(-1).voltage")
            new = [text[0], row({'action': 'add', 'type': 'bus', 'name': 'V33 aux panel', 'voltage_V': volt})]
            if victim: new.append(row({'action': 'delete', 'id': victim}))
            path = os.path.join(OUT, f'f_table_upload_{vp}.csv'); open(path, 'w').write('\n'.join(new))
            t = time.time(); await pg.set_input_files('#et-file', path); await pg.wait_for_timeout(2000)
            status = await pg.locator('#et-status').inner_text(); errs = await pg.locator('#et-errors li').all_inner_texts()
            await s.shot(f'f_table_{vp}.png')
            await pg.keyboard.press('Escape'); await pg.wait_for_timeout(800)
            after = await pg.evaluate(DRAFT)
            added = after['buses'] == before['buses'] + 1
            total = lambda d: d['devices'] + d['branches'] + d['sources']
            deleted = bool(victim) and total(after) < total(before)
            rec('f.equipment-table upload: add row', vp, added and not errs, time.time() - t, f'status="{status}" errors={errs} buses {before["buses"]}->{after["buses"]}')
            rec('f.equipment-table upload: delete row', vp, deleted if victim else 'not_tested', None, f'deleted id={victim} (type {types[ids.index(victim)] if victim else None}); devices {before["devices"]}->{after["devices"]}, branches {before["branches"]}->{after["branches"]}' if victim else f'no device row in CSV; types={sorted(set(types))}')
            try: await pg.wait_for_function(READY, timeout=60000); m = await pg.locator('.metrics .metric').first.inner_text()
            except Exception: m = 'NOT READY: ' + await pg.locator('.metrics .metric').first.inner_text()
            rec('f.equipment-table result still shown after upload', vp, not m.startswith('NOT READY'), None, m.replace('\n', ' | '))
        await step('f.equipment-table', vp, go())
        rec('f.equipment-table no new page/console errors', vp, not s.new_errors(), None, json.dumps(s.new_errors()[:5]))

# ---------------------------------------------------------------- g. build plant
A = {'poiVoltageKV': 34.5, 'utilityFaultKA': 20, 'utilityXR': 15, 'feeders': 3, 'blocksPerFeeder': 4, 'mvCableLengthM': 300, 'mvCableROhmKm': 0.16, 'mvCableXOhmKm': 0.12, 'mvCableRuns': 1, 'txKVA': 3000, 'txZPercent': 6, 'txXR': 8, 'lvVoltageV': 690, 'invPerBlock': 4, 'invKVA': 800, 'invFaultA': 800, 'invAngleDeg': -30, 'lvCableLengthM': 0}
D = {'dcVoltageV': 1500, 'dcInverters': 2, 'combinersPerInverter': 6, 'stringsPerCombiner': 24, 'stringVocV': 1450, 'stringSourceOhm': 40, 'stringCableLengthM': 80, 'stringCableROhmKm': 4.6, 'combinerCableLengthM': 150, 'combinerCableROhmKm': 0.13, 'combinerCableRuns': 2}
async def item_g(browser, vp):
    async with Session(browser, vp) as s:
        pg = s.pg
        async def build(label, prep, expect):
            async def go():
                before = await pg.evaluate(DRAFT)
                how = await s.click('[data-plant-builder]'); await pg.wait_for_selector('#pb-build', timeout=BIG); await pg.wait_for_timeout(400)
                await prep(); summary = (await pg.locator('#pb-summary').inner_text())[:200].replace('\n', ' ')
                await s.shot(f'g_builder_{label}_{vp}.png')
                t = time.time(); await pg.click('#pb-build'); await pg.wait_for_timeout(800)
                errs = await pg.locator('#pb-errors').inner_text() if await pg.locator('#pb-errors').count() else ''
                await pg.wait_for_function(READY, timeout=BIG); dt = time.time() - t; after = await pg.evaluate(DRAFT)
                m = (await pg.locator('.metrics .metric').first.inner_text()).replace('\n', ' | ')
                rec(f'g.build-plant {label}', vp, expect(before, after), dt, f'{how}; summary="{summary}"; builder errors="{errs[:120]}"; draft {before} -> {after}; metric {m}')
            await step(f'g.build-plant {label}', vp, go())
        await step('g.build-plant', vp, (lambda: s.load())())
        async def ac():
            modes = await pg.evaluate("()=>[...document.querySelectorAll('#v31-plant-builder [name=mode]')].map(e=>[e.value,e.checked])")
            if await pg.locator('[name="mode"][value="new"]').count(): await pg.check('[name="mode"][value="new"]')
            for k, v in A.items(): await pg.fill(f'#pb-{k}', str(v))
        await build('AC plant (mode=new)', ac, lambda b, a: a['buses'] > 40 and a['sources'] >= 13)
        async def attach():
            await pg.check('[name="mode"][value="attach"]')
            await pg.fill('#pb-feeders', '2'); await pg.fill('#pb-blocksPerFeeder', '3'); await pg.fill('#pb-invPerBlock', '2'); await pg.fill('#pb-invKVA', '1250'); await pg.fill('#pb-invFaultA', '1300')
        await build('attach to bus (mode=attach)', attach, lambda b, a: a['buses'] > b['buses'] and a['sources'] > b['sources'])
        async def dc():
            await pg.check('[name="kind"][value="dc"]')
            for k, v in D.items(): await pg.fill(f'#pd-{k}', str(v))
        await build('DC array (kind=dc)', dc, lambda b, a: a['faultType'] == 'dc' or a['buses'] != b['buses'])
        await s.shot(f'g_after_dc_{vp}.png')
        rec('g.build-plant no new page/console errors', vp, not s.new_errors(), None, json.dumps(s.new_errors()[:5]))

# ---------------------------------------------------------------- h. tree auto-arrange
OVERLAP = """()=>{const p=JSON.parse(localStorage.getItem('fault-network-draft-v2'));const H=p.settings.faultType==='dlg'?104:80;
 const r=p.buses.map(b=>({id:b.id,name:b.name,x:b.position?.x,y:b.position?.y,w:Number.isFinite(b.diagramWidth)?Math.max(60,Math.min(10000,b.diagramWidth)):180}));
 const bad=r.filter(b=>!Number.isFinite(b.x)||!Number.isFinite(b.y)).length;const cell=400,grid=new Map();let pairs=0;const ex=[];const same=new Map();let dup=0;
 for(const b of r){const k=b.x+','+b.y;if(same.has(k))dup++;else same.set(k,b)}
 r.forEach((b,i)=>{for(let gx=Math.floor(b.x/cell);gx<=Math.floor((b.x+b.w)/cell);gx++)for(let gy=Math.floor(b.y/cell);gy<=Math.floor((b.y+H)/cell);gy++){const k=gx+','+gy;(grid.get(k)||grid.set(k,[]).get(k)).push(i)}});
 const seen=new Set();for(const list of grid.values())for(let a=0;a<list.length;a++)for(let c=a+1;c<list.length;c++){const i=list[a],j=list[c],k=i+'-'+j;if(seen.has(k))continue;seen.add(k);const A=r[i],B=r[j];
  if(A.x<B.x+B.w&&A.x+A.w>B.x&&A.y<B.y+H&&A.y+H>B.y){pairs++;if(ex.length<5)ex.push([A.name,A.x,A.y,B.name,B.x,B.y])}}
 const xs=r.map(b=>b.x),ys=r.map(b=>b.y);return {buses:r.length,nonFinite:bad,samePosition:dup,overlappingPairs:pairs,examples:ex,extent:[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)],symbol:[180,H]}}"""
async def item_h(browser, vp):
    async with Session(browser, vp) as s:
        pg = s.pg
        async def go():
            await s.load(PLANT); before = await pg.evaluate(OVERLAP)
            pos0 = await pg.evaluate("()=>JSON.stringify(JSON.parse(localStorage.getItem('fault-network-draft-v2')).buses.map(b=>b.position))")
            t = time.time(); how = await s.click('[data-action="layout"]')
            # The test plant is already in tree layout, so Arrange may leave every position unchanged: wait for the click to settle instead.
            await pg.wait_for_timeout(3000); t_draft = time.time() - t
            await pg.wait_for_timeout(300); await pg.wait_for_function(READY, timeout=BIG); dt = time.time() - t
            after = await pg.evaluate(OVERLAP)
            rec('h.arrange[plant2000, 1,970 buses] completes', vp, True, dt, f'{how}; settled after {round(t_draft,2)} s (positions changed: {pos0 != await pg.evaluate("()=>JSON.stringify(JSON.parse(localStorage.getItem('fault-network-draft-v2')).buses.map(b=>b.position))")}), result shown again after {round(dt,2)} s')
            rec('h.arrange[plant2000] no two bus symbols overlap', vp, after['overlappingPairs'] == 0 and after['samePosition'] == 0 and after['nonFinite'] == 0, None, f'after: {json.dumps(after)}; before arrange: overlappingPairs={before["overlappingPairs"]}, samePosition={before["samePosition"]}')
            try: await s.click('[data-action="diagram-fit"]', timeout=4000); await pg.wait_for_timeout(1500)
            except Exception: pass
            await s.shot(f'h_arrange_plant2000_{vp}.png')
        await step('h.arrange[plant2000]', vp, go())
        rec('h.arrange[plant2000] no new page/console errors', vp, not s.new_errors(), None, json.dumps(s.new_errors()[:5]))

# ---------------------------------------------------------------- perf: undo / redo / add breaker (desktop only)
async def item_perf(browser, vp):
    if vp != 'desktop': return
    async with Session(browser, vp) as s:
        pg = s.pg
        name = "()=>JSON.parse(localStorage.getItem('fault-network-draft-v2')).name"
        async def timed(action_sel, cond, arg):
            t = time.time(); how = await s.click(action_sel); await pg.wait_for_function(cond, arg=arg, timeout=BIG); t1 = time.time() - t
            await pg.wait_for_timeout(300); await pg.wait_for_function(READY, timeout=BIG); return t1, time.time() - t, how
        async def go():
            await s.load(PLANT)
            # small edit: rename the project in Study setup
            await s.click_text_button('Study setup'); await pg.wait_for_selector('#field-project-name'); old = await pg.evaluate(name)
            t = time.time(); await pg.fill('#field-project-name', old + ' V33'); await pg.press('#field-project-name', 'Tab')
            await pg.wait_for_function("n=>JSON.parse(localStorage.getItem('fault-network-draft-v2')).name===n", arg=old + ' V33', timeout=BIG); t_edit = time.time() - t
            await pg.wait_for_timeout(1500); await pg.wait_for_function(READY, timeout=BIG)
            rec('perf[plant2000] small edit (rename project) saved', vp, True, t_edit, '#field-project-name')
            eq = "n=>JSON.parse(localStorage.getItem('fault-network-draft-v2')).name===n"
            a, b_, how = await timed('[data-action="undo"]', eq, old); rec('perf[plant2000] Undo after rename', vp, True, b_, f'{how}; draft reverted after {round(a,2)} s; result shown again after {round(b_,2)} s')
            a, b_, how = await timed('[data-action="redo"]', eq, old + ' V33'); rec('perf[plant2000] Redo after rename', vp, True, b_, f'{how}; draft re-applied after {round(a,2)} s; result shown again after {round(b_,2)} s')
            # + Add equipment -> Circuit breaker
            before = await pg.evaluate(DRAFT); await pg.keyboard.press('Escape')
            t = time.time(); how = await s.click('[data-action="add-menu"]'); await pg.wait_for_selector('[data-add="breaker"]', timeout=BIG); t_menu = time.time() - t
            dev = "n=>JSON.parse(localStorage.getItem('fault-network-draft-v2')).devices.length===n"
            a, b_, how2 = await timed('[data-add="breaker"]', dev, before['devices'] + 1); after = await pg.evaluate(DRAFT)
            rec('perf[plant2000] "+ Add equipment" menu opens', vp, True, t_menu, how)
            rec('perf[plant2000] add one breaker', vp, after['devices'] == before['devices'] + 1, b_, f'{how2}; breaker in draft after {round(a,2)} s; result shown again after {round(b_,2)} s; draft {before} -> {after}')
            a, b_, how = await timed('[data-action="undo"]', dev, before['devices']); rec('perf[plant2000] Undo after adding breaker', vp, True, b_, f'{how}; draft reverted after {round(a,2)} s; result shown again after {round(b_,2)} s')
            a, b_, how = await timed('[data-action="redo"]', dev, before['devices'] + 1); rec('perf[plant2000] Redo after adding breaker', vp, True, b_, f'{how}; draft re-applied after {round(a,2)} s; result shown again after {round(b_,2)} s')
        await step('perf[plant2000] undo/redo/add breaker', vp, go())
        rec('perf[plant2000] no new page/console errors', vp, not s.new_errors(), None, json.dumps(s.new_errors()[:5]))

ITEMS = {'a': item_a, 'b': item_b, 'c': item_c, 'd': item_d, 'e': item_e, 'f': item_f, 'g': item_g, 'h': item_h, 'perf': item_perf}
async def main():
    srv = subprocess.Popen(['python3', '-m', 'http.server', PORT, '-d', SITE], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
            for vp in VPS:
                for key in ONLY:
                    t = time.time()
                    try: await ITEMS[key](b, vp)
                    except Exception as e: rec(f'{key}. (whole item)', vp, False, time.time() - t, 'EXCEPTION ' + str(e)[:400])
            await b.close()
    finally: srv.terminate()
    path = os.path.join(OUT, 'a1_verify.json'); old = []
    if os.path.exists(path) and (ONLY != list(ITEMS) or VPS != ['desktop', 'mobile']):
        # partial run: keep rows of items/viewports that were not re-run
        prefix = lambda r: r['item'].split('.')[0].split('[')[0]
        old = [r for r in json.load(open(path))['results'] if not (prefix(r) in ONLY and r['viewport'] in VPS)]
    rows = old + RESULTS
    json.dump({'site': SITE, 'generated': time.strftime('%Y-%m-%d %H:%M:%S'), 'summary': {k: sum(1 for r in rows if r['status'] == k) for k in ('pass', 'fail', 'not_tested')}, 'results': rows}, open(path, 'w'), indent=1)
    print('\nSUMMARY', {k: sum(1 for r in RESULTS if r['status'] == k) for k in ('pass', 'fail', 'not_tested')}, '->', path)
asyncio.run(main())
