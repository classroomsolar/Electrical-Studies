# V33 release report — 14–15 November 2026

**Status: V33 code is live on the original Wix site (first publish 14 Nov 2026; fifth and last publish 15 Nov 2026). Every published file was read back from the site and its checksum compared with the package.**
Not live: the site-served DM Sans / Space Grotesk fonts (2 stylesheets + 7 font files), `favicon.ico` (the Wix host serves its own), and database v13 (as before).

## Summary
- A string-inverter plant made by Build plant (1,900 buses, 1,681 inverters) failed on the live V32 site: "Calculation did not complete" after the 30 s limit. V33 calculates it: about 9 s on the test machine, about 25 s on the owner's computer (which runs JavaScript about 4 times slower). Live result: 24.368 kA at POI.
- The V33 engine gives the same numbers as V32: 4.8 million values compared on 11 plants, 0 differences (worst 2.2e-10). The 220 oracle networks give byte-identical output.
- The live V32 site was checked in a real browser. All 123 comparable code files are identical to the V32 package. The report chooser, PDF and Excel work there.
- The eight V32 feature groups were checked on a local copy at desktop and phone width: 124 passed, 2 failed, 2 not tested. The 2 failures are one event that V32 has too: at phone width the report page of the 1,970-bus plant with "All fault locations" can run the browser tab out of memory on a 7 GB machine.
- Fonts and the icon are served from the site in the package (no request to another host). This part is not live yet: font files are binary and could not be uploaded through the available Wix tools.
- The "Calculation did not complete" limit now grows with project size (30 s for normal projects, about 2 minutes for 1,900 buses × 1,681 sources, never more than 3 minutes).
- Text typed or imported by a user cannot run as page code: 74 fields filled with script-like text, 26 browser checks, all pass. CSV and Excel exports cannot carry live formulas.
- After the deploy the V32 feature list was repeated on the live site at desktop width. All checked items work (`QA/V33_LIVE_CHECK/README.md`).
- Second part of the round (published 15 Nov):
  - **C1 undo / redo**: the results of the last 4 project states are kept, so undo or redo to a state that was already calculated shows its result at once. 1,970-bus plant: undo 4.9 → 1.9–2.1 s, redo 4.5 → 1.6–1.7 s (result on screen).
  - **C3 DC array**: very large DC arrays keep per-source rows for the selected bus only (same rule as AC). 2,404-bus DC array: build + calculate 11.0 → 4.6–4.9 s, recalculate 8.1 → 1.0–1.1 s. All 219,581 compared values equal to V32.
  - **C4 operating studies**: a bus table (CSV) for load and generation of all buses — download, edit in a spreadsheet, upload. 40 / 40 Node and 16 / 16 browser checks.
  - **C6 arc flash at every bus**: changing one bus's device redraws that row only. Picker open 3.4 → 0.8 s, save 3.4 → 1.7 s.
  - **D2 connections in the Equipment table**: from_bus / to_bus / bus can be changed by bus name. An upload that changes connections is shown first (now / after / check) and is applied only after "Apply these changes". Device moves, unknown or duplicate bus names, the same bus at both ends, and cables or links across two voltages are refused. 13 / 13 Node and 9 / 9 browser checks.
  - **D4 inverter fault data**: datasheet fault current and angle can be entered for all inverters at once through the Equipment table; the buses are then calculated instead of screening bounds (6 / 6 checks; no code change needed).
  - **E2 / E3**: the database pages say the data is a historical audited workbook, not a manufacturer (OEM) catalogue. The screening and verification notices are unchanged. **E1: database v13 is still not live.**
  - **B1**: 95 published values checked (IEEE 1584-2018, IEC 60909, IEEE 519, NEC 2023): all match. **B3**: five widths, no sideways scroll; 3 accessibility findings open. See `REPORTS/V33_Audit_Report.md`.
- Not done: C2 (add one breaker is still about 5 s), C5 (envelope 6.0–6.8 s, faster than V32's 9–14 s only because of the engine), B2 line-by-line, B4, D1 (unbalanced load flow), D3 ("Open this study in browser"), D5 (atlas items), fonts on the live site. See "Not done".

## What changed
| File | Change | Why |
|---|---|---|
| `network-engine.mjs` (and the same code in `public-bundle-v21.js`) | Plant-scale solver: buses that are not selected keep totals but not one row per source when buses × sources > 200,000; protective devices on a radial network found by one walk from the fault bus; unknown-angle inverters with equal solved columns summed once per group. | 1,900 buses × 1,681 sources took 45–83 s and several GB. Now 3.6–5.5 s and under 0.5 GB. Numbers unchanged. |
| `network-engine.mjs` (and bundle), second change | Branches that carry no part of the fault path (their fault-path current is below 1e-14 of the largest branch current) reuse one stored sum instead of summing every unknown-angle source again for each fault location. | Engine time on the 1,970-bus / 71-source plant: 3.3 s → 1.9 s (Node). 1,900 × 1,681: 5.5 s → 4.5 s. Same numbers (4.8 million values, 0 differences). |
| `network-calculation.mjs` (and bundle) | Time limit = 30 s + 0.03 ms per bus × source above 200,000, at most 3 minutes in total. | The owner's computer needs 18–20 s for the engine alone on the largest plant; 30 s left too little room. |
| `network-app.mjs` (and bundle) | Step-by-step tables on the results and report pages are drawn for the 40 largest contributions, with a note saying so. The contribution table and all totals still list every source. | One bus with 1,681 sources added 275,000 page elements. Choosing a bus took 21 s and the report page could run the tab out of memory. |
| `report-data.mjs` (and bundle) | Adds a scope note to the report when per-source rows are kept for the selected fault bus only. | So the report does not silently list fewer rows. |
| `public-style-v21.css`, `network-style.css`, new `fonts/local-fonts-v33.css` + 4 font files + 2 licence files | DM Sans and Space Grotesk served from the site (SIL Open Font License). | The page asked Google Fonts and failed offline (list D6). |
| `index.html`, new `favicon.ico` | Icon link; version strings. | `favicon.ico` was missing (list D6). |
| `network-app.mjs` (and bundle), 15 Nov | Keeps the results of the last 4 project states, matched by the complete saved project text. | C1: undo / redo to a calculated state no longer recalculates. |
| `dc-network.mjs` (and bundle), 15 Nov | DC arrays with buses × sources > 200,000: per-source rows for the selected bus only; totals, source-type totals and branch currents complete. | C3. |
| new `operating-table-v33.mjs`, `operating-table-ui-v33.mjs` | Operating studies bus table (CSV) download / upload. | C4. |
| `arcflash-network-ui-v29.mjs` | Redraws only the changed rows. | C6. |
| `plant-builder.mjs`, `plant-builder-ui-v31.mjs` | Connection editing with preview. | D2. |
| `master-database.mjs`, `manufacturer-library.mjs` (and bundle) | Reference data notice. | E2. |
| 15 other files | Version string `20261108-v32` → `20261113-v33` only. | So browsers load the new engine. |

273 site files in the package (V32: 265). 8 new, 22 changed, 0 deleted. Live: 263 files. Manifest: `QA/V33_SHA256_Manifest.json`. Line-by-line changes: `REPORTS/V33_changes_since_V32.patch` (bundle not included).

## Tests
| Test | Result |
|---|---|
| Live V32 site in the owner's Chrome (`QA/V33_LIVE_CHECK/`) | 123 / 123 comparable files identical; report chooser, PDF, Excel pass; 1,900-bus / 1,681-source plant **fails** (this is the defect fixed here); 1,623-bus / 401-source plant takes 26 s. |
| `QA/V33_SOURCES/many_sources_cmp.mjs` — V33 engine vs V32 engine, 11 plants | 4,818,941 values, 0 differences, worst 2.2e-10 |
| `QA/V33_SOURCES/browser_many_sources.py` — 1,900 buses, 1,681 sources in the browser | 14 / 14 |
| `QA/V33_SOURCES/watchdog_test.mjs` — time limit by project size | 6 / 6 |
| `QA/V33_SECURITY/xss_browser.py` — script-like text in 74 fields | 26 / 26 |
| `QA/V33_SECURITY/csv_formula.py` — names starting with = + - @ | Pass |
| Live site after deploy, SHA-256 read-back | 18 / 18 text files + bundle identical |
| Live site after deploy, feature list at desktop width | All checked items work; see `QA/V33_LIVE_CHECK/README.md` |
| `QA/V33_VERIFY/a1_verify.py` — V32 feature list, desktop + phone | 124 pass, 2 fail, 2 not tested (the 2 failures also happen on V32; see `QA/V33_VERIFY/README.md`) |
| `QA/V29_QA_SCRIPTS`: 220 oracle networks | Output byte-identical to V32 (repeated after the 15 Nov changes) |
| `QA/V33_SOURCES/dc_lean_cmp.mjs` — DC lean results vs V32 | 219,581 values, 0 differences; the page accepts the result |
| `QA/V33_OPERATING_TABLE` | 40 / 40 Node, 16 / 16 browser (desktop and phone) |
| `QA/V33_EQUIPMENT_TABLE` | 13 / 13 Node, 9 / 9 browser |
| `QA/V33_INVERTER_DATA/inverter_angle_test.mjs` | 6 / 6 |
| `QA/V33_AUDIT` (B1) | IEEE 1584 21 / 21, IEC 60909 28 / 28, tables 46 / 46 |
| `QA/V33_UX/ux_widths.py` (B3) | No sideways scroll at any width; 3 axe findings (see audit report) |
| `QA/V33_PERF/perf_browser.py` | Times below |
| `QA/V33_VERIFY/a1_verify.py`, repeated 15 Nov | 122 pass, 3 fail, 2 not tested. New failure: phone emulation, Operating studies, mouse click on "Enter 0 MW…" times out; a tap works (see audit report). |
| Live site after the 15 Nov publish | 9 of 9 changed files read back identical (bundle: database module excluded); page loads, 16.706 kA on the owner's saved project, owner's draft untouched |
| Bundle engine vs source engine, 220 networks | 4,680 values, 0 differences |
| `QA/V29_QA_SCRIPTS/physics.mjs` | 14 / 14 |
| `QA/V31_SCALE/cmp.mjs` (sparse solver on 637 cases) | 0 bad, worst 1.3e-12 |
| `QA/V31_SCALE/compact_test.mjs`, `scale.mjs 70 24`, `builder_test.mjs`, `dc_cmp.mjs` | Pass (builder 15 / 15) |
| `QA/V32_LOADFLOW` (3 Node suites), `QA/V32_REPORT` (2 of 3 Node suites), `QA/V32_ARCFLASH/oneline_equivalence.mjs` | Pass |
| V32 browser suites: equipment table + Build plant, report, operating studies, SLG and split-phase at 2,000 buses | Pass, no page errors |

Not runnable from the package: `QA/V32_SEQUENCE/seq_scale_cmp.mjs`, `split_scale_cmp.mjs` and `QA/V32_REPORT/default_report_identity.mjs`. They need V31 reference files that are not in the package. The two sequence modules changed only in a version string.

## Measured times
1,900-bus / 1,681-source plant: see the table in `QA/V33_SOURCES/README.md`.

1,970-bus / 71-source test plant, desktop (`QA/V33_PERF/results/`):
| Action | First V33 publish | After 15 Nov |
|---|---|---|
| Undo / redo (result on screen) | 4.9 / 4.5 s | 1.9–2.1 / 1.6–1.7 s |
| Add one breaker | 5.5–6.0 s | 5.0–5.8 s (not improved) |
| Z-tolerance envelope, 70 transformers | 6.75 s | 5.7–6.0 s |
| Arc flash picker open / save | 3.4 / 3.4 s | 0.8 / 1.7 s |
| DC array 2,404 buses: build + calculate / recalculate | 11.0 / 8.1 s | 4.6 / 1.1 s |
| Arc flash at every bus: Run | 5.2 s (6.7 s with bracket) |
| PDF report (selected bus) | 10.9 s, 9.3 MB |
| Excel report | 10.0 s |
| Auto-arrange | 4.1 s, no two buses at the same place |

## Not done
1. **Fonts on the live site** (rest of D6): font files are binary; the tools of this round could not upload them. The package has them.
2. **C2** add one item: still about 5 s on the 1,970-bus plant (a new state is always a full calculation). **C5**: no change of its own.
3. **B2** line-by-line code audit, **B4** comparison with other tools, Nielsen review, screen-reader pass. **B3** findings open: one-line SVG names and nested focus, Cloud Vault file input label.
4. **D1** unbalanced (per-phase) load flow, **D3** "Open this study in browser", **D5** atlas items: not started.
5. **Phone emulation, Operating studies, 1,970 buses**: mouse click on the fill-zero button times out while the new bus-table script is on the page; tap works. Cause not found.
6. **PDF for a 1,900-bus / 1,681-source plant**: no file (over 2,000 pages). Excel works.
7. **Report page, phone width, 1,970-bus plant, "All fault locations"**: can run the tab out of memory on a 7 GB machine (V32 too).
8. Three V32 comparison scripts cannot run from the package (their V31 reference files are missing).
9. **Database v13** is not live (E1, owner decision).

## How the bundle was patched
`public-bundle-v21.js` modules are the TypeScript CommonJS transpile of the `.mjs` sources. V33 proved this by test and patched three modules with the tools in `QA/V33_BUNDLE/`.
