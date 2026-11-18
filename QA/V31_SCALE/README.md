# V31 plant-scale QA

Run from this folder with Node 22+ (and Python 3 + Playwright + Chrome for the browser scripts).

| Script | What it checks | V31 result |
|---|---|---|
| `cd ../V29_QA_SCRIPTS && node ../V31_SCALE/cmp.mjs cases.json cases_tap.json adv.json seq_cases.json dc_cases.json` | Sparse solver forced on every existing QA network vs the unchanged dense solver (totals, peak, X/R, Zth, every branch flow, every source contribution, path, path impedance, terminal voltage) | 637 networks, 0 differences, worst 1.3e-12 relative |
| `node compact_test.mjs` | Plant-scale compact results vs the dense engine on 4 plants × 2 selections: totals, contributions, every stored branch flow, equipment duty (status, worst bus, duty current, margin), cable worst-case flow, arc-flash protective device and share | 0 failures at 1e-5 (worst 3.1e-6, from ideal device links) |
| `node scale.mjs 70 24` | 1,970-bus, 71-source, 148-device PV plant: time, memory, statuses | 2.8 s in Node (all buses calculated) |
| `node dc_cmp.mjs` | Factored DC solver vs the original DC elimination on 120 QA networks + 2 plants | 600 bus faults, 0 differences, worst 9.0e-14 |
| `CB=20 ST=24 node dcscale.mjs 4` | 4 central inverters × 20 combiners × 24 strings (3,924 buses, 1,920 string sources) | 3.1 s |
| `node builder_test.mjs` | Plant builder validation, counts, calculation of the built plant, CSV round trip, edit, error rows, formula neutralising | 15 / 15 |
| `node make_plant_json.mjs 70 24 results/plant2000.json` | Writes the 1,970-bus test plant as a project file for the browser scripts | — |
| `python3 big_ui.py ../../SITE 8995 results/plant2000.json` | Browser: open the 1,970-bus project, time to first result, DOM size | 5.6 s to result (was: page hung) |
| `python3 interact.py ../../SITE 8997 results/plant2000.json` | Browser: change fault bus / click a bus / open results | 0.5–0.7 s each (was 2.8 s) |
| `python3 v31_browser.py ../../SITE 9014` | Browser (desktop + mobile): atlas shows no reference names; Build plant (empty-form errors, 780-bus plant built and calculated); Find; Equipment table download → edit → upload | all pass |
| `python3 folder_test.py ../../SITE 9010` | Browser: connect project folder, save, list, open a file from disk, autosave after an edit, reconnect after reload, delete | all pass (Chrome's private file system stands in for the folder picker) |
| `python3 diag_shot.py ../../SITE 9033 results/plant2000.json` | Screenshots of the zoomed-out overview and of Find + Focus | see results/ |

The layout audit (`../V30_UI_AUDIT/audit.py`) now also opens the Build plant and Equipment table dialogs:
0 issues at 1440, 1024, 768 and 390 px for the single line, projects, atlas and both dialogs.
