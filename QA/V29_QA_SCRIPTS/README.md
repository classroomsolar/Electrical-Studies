# V29 QA scripts

Run from this folder. Requirements: Node 22+, Python 3 with numpy (and playwright + Chrome for the browser scripts).

| Script | What it checks |
|---|---|
| `python3 gen.py` | Rebuilds the 220 random networks in `cases.json` (fixed seed) |
| `node run_engine.mjs cases.json js.json && python3 compare.py` | Studio engine vs independent numpy oracle (`oracle.py`) |
| `node run_bundle.mjs cases.json bundle.json` | Same cases through the live `public-bundle-v21.js` engine (parity) |
| `python3 adversarial.py && node run_engine.mjs adv.json advjs.json` | 37 invalid / extreme inputs |
| `node physics.mjs` | 14 physics checks incl. the historic 65 kA vs 56 kA case |
| `python3 seq_test.py` | 400 SLG/LL/DLG/3PH cases vs a phase-domain oracle |
| `python3 dc_test.py` | 120 DC networks (525 bus faults) vs a nodal oracle |
| `node env_test.mjs`, `node env_dense.mjs` | V29 tolerance envelope and NEC 110.24 label |
| `python3 ui_test.py ../../SITE 8812` | Browser: select, delete, Ctrl+Z, Ctrl+Y, double-click, Esc (desktop + mobile) |
| `python3 v29_browser.py` | Browser: V29 dialog, label, PDF/XLSX/JSON downloads |
| `cd tap && node tap_physics.mjs` / `python3 tap_ui.py` | V29b transformer tap: physics + browser |
| `node run_engine.mjs cases_tap.json jstap.json && python3 compare.py cases_tap.json jstap.json` | Oracle cases with off-nominal taps |
| `cd arcflash_network && node test.mjs` / `python3 browser.py` | V29b arc flash at every bus: engine + browser |
| `cd cable_sizing && node test.mjs` / `python3 browser.py` | V29b conductor sizing: hand checks, 3,000 random cases, browser |
| `cd ieee1584 && node annex.mjs`, `node af_challenge.mjs`, `node ss144k.mjs` | IEEE 1584-2018 Annex D, challenge tests, 105,120 official cases |
| `cd clearing_time && node test.mjs` / `python3 browser.py` | V29d clearing time from relay / manufacturer curves; device picker in arc flash |
| `cd power_quality && node test.mjs` / `python3 browser.py` | V29d IEEE 519 PCC check and PF correction |
| `cd database_v13 && python3 browser.py` | V29d: every database file loads through the site validators |
| `database_v13/build.py, rules.py, apply.py, diff.py` | Rebuild the database import from the master workbook (edit the paths at the top) |
| `cd loadflow_tap && python3 gen_oracle.py && node compare.mjs`; `node notap_regression.mjs` | V29e load flow with taps vs π-equivalent numpy oracle; no-tap regression |
| `cd cable_sizing && node ocpd_test.mjs` | V29e NEC 240.4 OCPD and 250.122 EGC |
| `cd clearing_time && node tolerance_test.mjs`, `node lsi_test.mjs` | V29e relay tolerance bands and LSI trip model |
| `cd arcflash_network && node oneline_test.mjs` / `python3 oneline_browser.py` | V29e one-line device link to the arc-flash picker |
| `cd ../V30_UI_AUDIT && VPS=1440,1280,1024,768,390 python3 audit.py ../../SITE 8955 out` | V30 layout audit: contrast, clipped/cut text, squeezed words, cut drop-downs/placeholders, overlap by fixed elements, white surfaces, sideways scroll, one-line labels; 8 pages + 16 dialogs + 10 calculated states per width |
