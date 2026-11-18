# V29 test results

All scripts are in `QA/V29_QA_SCRIPTS/` (see its README). Executed 7 November 2026, Node 22.23.4, Python 3.13 + numpy, Google Chrome via Playwright. Offline only; no Wix requests.

| # | Suite | Scenarios | Comparisons | Result |
|---|---|---|---|---|
| 1 | Random networks vs independent numpy Zbus oracle: radial MV→LV (60), meshed multi-source (40), parallel transformers (25), zero-impedance links (25), inverter current sources (25), max/min scenarios, generator stages, fault impedance (25), two-level HV→MV→LV (20) | 220 | 873 currents, 873 X/R, 798 peaks | **All match** (≤1e-6 relative). The 21 parallel-tap cases with off-nominal taps are rejected by design. |
| 2 | Live bundle engine vs source engine | 220 | 3,744 values + all messages | **Identical** |
| 3 | V29 vs original V28 numeric output | 220 | 3,744 values | **0 changed** |
| 4 | Invalid / extreme inputs (negative, zero, NaN, string, 1e300, missing bus, duplicate IDs, bad settings …) | 37 | — | 0 crashes, 0 non-finite or negative outputs; 29 rejected with clear messages; 4 handled correctly (no source → "no active source", isolated bus, tiny source); **4 previously silent cases now warn** |
| 5 | Physics checks | 14 | — | **14/14 pass**: coincident buses equal at 10/65/100 kA (historic 65 vs 56 kA case cleared); infinite-bus LV current = kVA/(√3·V·Z) for 3 transformers; LV current reflects turns ratio; current falls with cable length; 4 runs × 120 m = 1 run × 30 m; parallel transformers double current; c = 1.1 gives +10 %; fault resistance lowers current; sources add; 30° shift leaves 3-phase magnitude unchanged |
| 6 | Sequence faults (3PH, AG, BC, BCG, with/without Zf) vs phase-domain oracle | 400 | 1,200 phase currents | **All match** |
| 7 | DC networks with links, matched-pair and full-loop cables, several sources, fault R | 120 | 525 bus faults | **All match** |
| 8 | V28 recorded transformer batch reproduced | 1,200 | full output objects | **1,200/1,200 identical** |
| 9 | V28 recorded conductor batch reproduced | 1,500 | full output objects | **1,500/1,500 identical** |
| 10 | V29 envelope: infinite-bus formula at 0 / 7.5 / 10 %, no mutation, V28 reference values, ordering, label, 7 invalid inputs | 19 | — | **19/19 pass** |
| 11 | V29 envelope ordering on random networks | 471 buses | — | **0 violations** (first version had 74, see release report) |
| 12 | V29 dense tolerance sweep (41 points per transformer) | 8,446 | — | 0 values outside reported envelope |
| 13 | Browser UI, desktop + mobile: select source, Delete, Ctrl+Z, Ctrl+Y, double-click → properties, Esc | 2 viewports | — | **All pass**. Delete button now at `translate(238 20)`; original V28 drew it at `translate(NaN 20)`. |
| 14 | Browser V29 feature, desktop + mobile: open, calculate, label, PDF/XLSX/JSON/HTML downloads, draft untouched, Esc, V28 tool still opens | 2 viewports | 8 downloads | **All pass**; PDF text and XLSX sheets (Summary, Study inputs, Equipment duty, Assumptions & QA) parsed |
| 15 | Page load: original V28 vs V29 | 2 | requests, errors | 67 → 69 requests (+2 new V29 files); `database/manifest.json.txt` 404 fixed; no new errors |
| 16 | JS syntax of all site scripts | 91 files | — | **All pass** |
| 17 | IEEE 1584-2018 coefficients vs reference library | 398 coefficients | — | **0 differences** |
| 18 | IEEE 1584-2018 Annex D.1 / D.2 | 2 worked examples | 22 + 13 values | **All match** |
| 19 | Official IEEE 1584-2018 spreadsheet results | 105,120 cases | 630,720 values | **Worst 0.0002 %** |
| 20 | JS engine vs Python reference library | 6,000 cases | 36,000 values | Worst 3e-15 |
| 21 | Arc-flash challenge tests (physics, 28 range limits, non-objects, 5,000 random) | 52 checks | — | **52/52 pass** |
| 22 | Arc-flash dialog in browser, desktop + mobile (example, TCC option, invalid input, no external request) | 2 viewports | — | **All pass** |
| 23 | Live Wix deployment: byte check of changed files, HTTP 200 for key assets | 10 + 13 files | — | 9/10 byte-identical (index.html + Wix site-script tag); 13/13 HTTP 200 |
| 24 | Transformer tap: physics (ratio, symmetry, ±10 % limits, sequence engines) + oracle cases with taps | 27 + 120 networks | 993 currents | **All pass / match** |
| 25 | Load flow and split-phase refuse non-zero tap | 2 | — | **Pass** |
| 26 | Tap field in browser (form, save, result) | 1 | — | **Pass**, 32,186.4 A at 2.5 % tap matches oracle |
| 27 | Arc flash at every bus: engine tests (no times → required, labels, DANGER > 40 cal/cm², DC/voltage limits, project not modified) | 17 | — | **17/17 pass** |
| 28 | Arc flash at every bus in browser, desktop + mobile (menu, run, enter times, labels, PDF/XLSX/JSON, reload keeps inputs) | 2 viewports | — | **All pass**, 0 page errors |
| 29 | Conductor sizing: hand checks (3 AWG/1 AWG/6 AWG picks, ambient 0.91, bundling 0.8, VD formula, SC 4/0 at 20 kA 0.5 s, parallel 2×350 kcmil, Al), 10 invalid inputs, missing R/X flag | 22 | — | **All pass** |
| 30 | Conductor sizing: 3,000 random cases — chosen size passes every check and every smaller size fails at least one | 3,000 | 4,026 checks | **All pass** |
| 31 | Conductor sizing in browser, desktop + mobile (menu, default, with SC, PDF/XLSX/JSON, bad input disables export, Esc, reload keeps inputs, other tools still work) | 2 viewports | — | **All pass**, 0 page errors |
| 32 | Full regression after V29b (rows 1–22 rerun: oracle, bundle 220/220 identical, adversarial 37, physics 14, sequence 1,200, DC 525, envelope 19 + 8,446, IEEE 1584 Annex 22, 105,120 official cases, challenge 52, all browser suites) | — | — | **No change from earlier results** |
| 33 | V29b Wix deploy: base check, patched check, read-back, HTTP | 10 + 4 files; 7 HTTP | — | **14/14 identical**, 7/7 HTTP 200 |
| 34 | Clearing-time engine: IEEE MI/VI/EI vs published table (TD 1, M = 2, 5, 10), IEC SI/VI/EI/LTI hand values, TMS linearity, instantaneous / definite time, no-trip, log-log curve, 11 invalid inputs, 2,000 random relays × 9 currents monotonic | 18,034 checks | — | **All pass** |
| 35 | Arc flash with device: device times = clearing-time engine at IEEE 1584 arcing currents, energy = direct engine, no-trip, > 2 s flag, user 2 s limit, incomplete settings | 7 | — | **All pass** (24/24 in suite) |
| 36 | Arc flash device picker in browser, desktop + mobile (choose IEEE VI, settings, check, save, run, invalid pickup, Esc, reload keeps device) | 2 viewports | — | **All pass**, 0 page errors; 50 ms / 478 ms matches Node |
| 37 | IEEE 519 and PF correction engine (table rows, boundaries, Table 3, even-harmonic rules, pass/fail cases, MV voltage limits, generation row, kvar, resonance at 5th, voltage rise, steps, invalid inputs) | 31 | — | **All pass** |
| 38 | Harmonics & PF dialog in browser, desktop + mobile (bus pick-up from Studio, 519 check, PDF/XLSX/JSON, PF with steps, invalid input) | 2 viewports | — | **All pass**, 0 page errors; h = 16.73 and TDD 8.11 % match hand calculation |
| 39 | Conductor sizing with relay curve and with user R/X (browser) | 2 viewports | — | **Pass**; 300 kcmil at 20 kA / 1.101 s matches hand calculation |
| 40 | Master database v13: 13 picker rules reproduce all old picker files exactly; all 96 sheets and 13 pickers load through the site validators in Chrome | 96 + 13 | — | **0 errors** |
| 41 | Full regression after V29d (oracle 873 + tap 993, bundle 936 bus results identical, adversarial 37, physics 14, sequence 1,200, DC 525, envelope 19 + 8,446, IEEE 1584 Annex 22 + challenge 52, tap, all browser suites) | — | — | **No change from earlier results** |
| 42 | V29d Wix deploy (code): base check, patched check, read-back, HTTP | 7 files | — | **7/7 identical**, 8/8 HTTP 200 |

**Total scenarios run:** 220 + 37 + 14 + 400 + 120 + 1,200 + 1,500 + 19 + 8,446 dense points, plus 2 × 2 browser sessions.

## Example values (worked example, V29 dialog)

| Bus | Minimum (Z +7.5 %) | Nameplate | Maximum (Z −7.5 %) |
|---|---|---|---|
| Utility / POI, 12 kV | 3.40 kA | 3.40 kA | 3.40 kA |
| 208 V transformer secondary | 30.80 kA | 32.73 kA | 34.91 kA (+6.67 %) |
| Main panel, 208 V | 16.26 kA | 16.71 kA | 17.17 kA (+2.79 %) |

## V29e (8 Nov 2026)

| # | Suite | Scenarios | Comparisons | Result |
|---|---|---|---|---|
| 43 | Load flow with off-nominal taps vs independent π-equivalent numpy Newton–Raphson oracle | 300 random networks | all bus voltages and branch flows | **All match**, worst 1.35e-10 pu; bundle engine 300/300 identical |
| 44 | Load flow without taps: V29e vs V29b | 300 | full outputs | **300 identical** |
| 45 | Tap physics (updated: load flow now accepts a tap; ±10 % limit; split-phase refuses) | 28 | — | **28/28 pass** |
| 46 | OCPD / EGC: 240.6(A) lists, 240.4(B)/(C)/(D), 125 % continuous, multioutlet, 250.122 incl. (B) and (F), invalid inputs, random cases | 1,799 checks | — | **All pass** |
| 47 | Relay tolerance bands (nominal inside band, slow edge used, ms vs % rule, may-not-trip near pickup, limits) | 11 | — | **11/11 pass** |
| 48 | LSI electronic trip (I²t long time, flat short time, instantaneous, zone boundaries, tolerance, invalid inputs, monotonic sweep) | 103 | — | **103/103 pass** |
| 49 | One-line device detection (nearest isolating device, partial-path note, share from flows, disabled devices, no device) | 9 | — | **9/9 pass** |
| 50 | One-line link in browser, desktop + mobile (picker option, shared settings, LSI, library fill, reload keeps settings) | 2 viewports | — | **Pass**, 0 page errors |
| 51 | Full regression after V29e (oracle 873, bundle 936 bus results, physics 14, sequence 1,200, DC 525, envelope 19, IEEE 1584 Annex 22 + challenge 52, clearing time 18,034, arc flash 24, cable sizing 4,048, power quality 31, all browser suites) | — | — | **No change from earlier results** |
| 52 | V29e Wix deploy (code): base check, patched check, read-back, HTTP | 10 files; 6 HTTP | — | **10/10 identical**, 6/6 HTTP 200 with expected lengths |

## V30 (8 Nov 2026) — Stitch theme and layout

| # | Suite | Scenarios | Comparisons | Result |
|---|---|---|---|---|
| 53 | Layout audit, V29e site (same detector, 1440 + 390 px, 8 pages + 16 dialogs + 10 calculated states) | 68 states | every visible element | 1,004 text-contrast findings below WCAG AA; 169 layout findings: 76 controls/text under floating buttons, 25 words wider than their box, 23 sideways-scrolling boxes, 15 squeezed labels/buttons, 12 text cut by parent, 8 one-line labels past their box, 6 placeholders and 4 drop-downs cut |
| 54 | Layout audit, V30 site, 1440 / 1280 / 1024 / 768 / 390 px | 170 states | every visible element | **0 findings** (also no light surface left in the dark theme) |
| 55 | Browser regression suites (rows 13, 14, 22, 26, 28, 31, 35–40) on V30 vs V29e | 10 suites, desktop + mobile | full captured output | Same numbers and behaviour; differences only in captured page text (uppercase table headers, card layout of wide tables on phones) and one fewer floating button (I²t launcher now in the tools list). Double-click on a one-line symbol opens its data on desktop and phone. |
| 56 | V30 deploy: index.html base/patched check, read-back of 4 text files, SHA-256 of 4 fonts on the live URL | 9 files | — | **All identical** (one font block mistranscribed in transit, corrected and re-verified) |

## V31 (8 Nov 2026) — plant scale, project folder, plant builder

| # | Suite | Scenarios | Comparisons | Result |
|---|---|---|---|---|
| 57 | Sparse AC solver forced on every existing QA network vs dense solver (`QA/V31_SCALE/cmp.mjs`) | 637 networks | totals, peak, asym, X/R, Zth, every branch flow, every contribution, path, path Z, terminal voltage | **0 differences**, worst 1.3e-12 relative |
| 58 | Compact plant results vs dense engine (`compact_test.mjs`) | 4 plants × 2 selected buses (52–250 buses) | totals, contributions, stored flows, equipment duty (status, worst bus, duty, margin), cable worst case, arc-flash device and share | **0 failures** at 1e-5; worst 3.1e-6 (ideal device links); device choice identical except exact ties |
| 59 | 1,970-bus / 71-source / 148-device PV plant (`scale.mjs`) | 1 | — | 2.8 s, all buses calculated (dense V30 path: not feasible) |
| 60 | Factored DC vs original DC elimination (`dc_cmp.mjs`) | 122 networks, 600 bus faults | totals, signed currents, Zth, flows, contributions, terminal currents | **0 differences**, worst 9e-14 |
| 61 | DC central-inverter array, 3,924 buses / 1,920 strings (`dcscale.mjs`) | 1 | — | 3.1 s (V30: ~25 s already at 10 × 48 strings) |
| 62 | Plant builder + equipment table (`builder_test.mjs`) | 15 checks | — | **15/15** |
| 63 | Browser, 1,970-bus project (`big_ui.py`, `interact.py`) | desktop | — | First result 5.6 s (V30: page hung > 60 s); bus select / fault-bus change 0.5–0.7 s (2.8 s before the diagram changes) |
| 64 | Browser: atlas, Build plant, Find, Equipment table (`v31_browser.py`) | desktop + mobile | — | No reference names on the atlas; empty-form rejected (17 errors); 780-bus plant built and calculated in ~4 s; Find selects and focuses; CSV edit applied; 0 page errors |
| 65 | Browser: project folder (`folder_test.py`) | connect, save, list, open from disk, autosave, reload, delete | — | **All pass** |
| 66 | Full regression after V31 (rows 1–56 suites) + layout audit incl. 2 new dialogs at 1440/1024/768/390 px | — | — | Engine and bundle output **byte-identical** to V30 on oracle/adv/tap cases; all other suites unchanged; audit **0 findings** |
| 67 | V31 deploy: 16 module files (SHA-256 before upload and over HTTPS after), bundle (5 module blocks + new block, checksums), index.html | 18 files | — | **All identical** |
