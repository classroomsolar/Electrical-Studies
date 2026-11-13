# Fault Current Studio — V31 release report (8 Nov 2026)

V31 is a step towards plant-scale use. It is **not** a claim that the Studio is complete or certified.

## 1. What changed

### Calculation at plant scale
- **AC fault engine (`network-engine.mjs`).** Networks above 150 buses, or with many sources, now use a sparse solver:
  - It uses the same superposition equations as before: one factorization per connected part, one prefault vector per source, and one impedance column per faulted bus.
  - It factorizes with minimum-degree ordering.
  - It checks the residual of every prefault solution and stops with a message if accuracy is lost.
  - Networks at or below 150 buses keep the original dense solver. Their results are bit-identical to V30 on all existing QA suites.
- **Compact results for very large studies.** For very large studies, every bus keeps its total, contributions, peak, X/R and Thevenin impedance. Its branch table is reduced to three groups:
  - the connections at the faulted bus;
  - the nearest protective devices;
  - every branch's worst-case fault.

  This reduction keeps exactly what the equipment-duty, cable-duty and arc-flash device checks use. When you select a bus, it is recalculated in full on your device, and the results page says so.
- **DC arrays (`dc-network.mjs`).** Arrays with more than 40 nodes are factorized once per array instead of once per fault and per string. A central-inverter array with 1,920 strings and 3,924 buses calculates in about 3 s. It previously took minutes, and about 25 s already at 10 inverters × 48 strings.
- **Equipment duty lookup and worker packet check** now use indexed lookups. They no longer scan every branch for every bus.

### One-line at plant scale (`one-line-editor.mjs`, `shell-v30.mjs`, `network-app.mjs`)
- **Faster geometry.** Diagram geometry is cached while placement is unchanged. Label placement uses a spatial grid and gives the identical layout, 15× faster.
- **Large one-lines (more than 400 items):**
  - Only the visible part is drawn.
  - When zoomed far out, the one-line shows lines and symbols only, and a note explains how to read labels.
  - Exports and reports still draw everything.
- **Find.** A **Find bus or equipment** box selects a match and zooms to it. Enter shows the next match.
- **Label backgrounds.** The V30 label backgrounds are measured first and written after. This removes a layout stall that froze the page for over a minute on a 2,000-bus one-line.
- **Measured on a 1,970-bus plant:**

  | Measure | Before | V31 |
  |---|---|---|
  | Page open to first result | Hung for more than a minute | 5.6 s |
  | Selecting a bus or changing the fault bus | 2.8 s | 0.5–0.7 s |

### Building and editing large plants
- **Build plant** (Single line toolbar) creates a PV or BESS plant one-line from block data:
  - It covers the POI, an optional main breaker, the collector, feeders with breakers, a fuse and transformer per block, inverters with AC breakers, and LV cables.
  - Every impedance and fault value comes from the user's entries. Empty fields are rejected.
  - Protective-device ratings start blank, so the duty check reports INPUT REQUIRED until they are filled in.
- **Equipment table:**
  - Download every bus, connection, source and device as CSV, edit it in a spreadsheet, and upload it to update the project in one step.
  - Rows match by id. Blank cells keep the stored value. Units are in the headings.
  - Text that a spreadsheet would run as a formula is neutralised.

### Projects on the user's computer (`project-folder.mjs`)
- **Saved studies & backups → Projects on your computer.** Connect a folder, and each project becomes a `.fcs.json` file in it:
  - Open, save, save under a new name, or delete a file.
  - The open project saves back to its file automatically.
  - After a reload, the folder and the link to the open file are restored. The browser asks again for permission when needed.
  - Nothing is uploaded.
- **Browser support.** This works in Chrome and Edge on a computer. Other browsers keep Export / Import project JSON.

### Capability atlas
- **No reference names on screen.** Reference product names and their links are no longer shown. They are kept in the source for internal comparison only.
  - The few other product names in visible text were reworded: a method note naming a product, and a disclaimer naming optimiser products.
- **Statuses match what is built and tested.** Arc flash and DC short circuit are verified in stated scope. The labels are now **Verified in stated scope / Partly built / Not built yet**.

## 2. Test evidence
- **Full results:** `QA/V31_SCALE/README.md` and rows 57–66 of `REPORTS/V29_TEST_RESULTS.md`.
- **Unchanged V30 behaviour** (V29 suites, bit-identical engine and bundle output):
  - oracle and bundle parity;
  - physics, sequence, DC, envelope;
  - arc flash, cable sizing, clearing time, power quality;
  - load flow with taps, IEEE 1584 Annex D and challenge cases;
  - all browser suites.
- **Solver comparisons:**

  | Comparison | Cases | Worst difference |
  |---|---|---|
  | Sparse vs dense AC, forced on all existing QA networks | 637 networks | 1.3e-12 relative |
  | Compact plant results vs dense engine (contributions, flows, duty, cable duty, arc-flash device) | 4 plants × 2 selections | 3.1e-6 relative, explained by ideal device links; device choices identical except exact ties |
  | Factored vs original DC elimination | 600 bus faults | 9e-14 relative |

- **Layout audit:** 0 findings, including the two new dialogs.

## 3. Deployment
- **Deployed to the original Wix site** (`97613ac8-…`), 260 files.
- **Every changed file was checked before upload:**
  - Each patch was applied to the live copy only after the live file was confirmed to be the expected V30 version.
  - The result had to match the local SHA-256 before the upload went ahead.
- **Read-back after upload:**
  - All 16 changed module files match by SHA-256 over HTTPS.
  - The live bundle carries the 5 changed module blocks with matching checksums, plus the new project-folder block.
  - `index.html` carries the V31 tags.
- **Database v13 is still not live, as instructed.** The live bundle keeps its earlier database tables block. That block is the only difference between the live bundle and `SITE/public-bundle-v21.js` in this package.

## 4. Honest limits (not done in V31)
- **Unbalanced studies.** Connected-sequence studies (SLG/LL/DLG with explicit sequence networks) and split-phase studies still use their dense solvers. They have not been scaled to 2,000 buses.
- **Arc flash at every bus** still searches device paths per bus. With 2,000 buses all included it will be slow; this was not measured in V31.
- **Auto-arrange** (the Arrange button) lays out by BFS level. On a 2,000-bus project not built by Build plant, it gives very wide rows. Build plant positions are structured.
- **Equipment table** updates existing items only. It does not create or delete items or change connections.
- **Project folder** needs Chrome or Edge on a computer.
- **Plant builder** covers one block design repeated across the plant. Mixed block designs need Add-to-project runs or table edits.
- **Atlas gaps** remain as listed in the atlas: IEC 60909 full, ANSI C37, selectivity, duct banks and IEC 60853, pulling and cleat forces, N-1 and unbalanced load flow, hosting capacity, frequency sweeps, IEEE 80, IEC 61660, dispatch, PV yield, microgrid dynamics, CIM exchange, provenance and traceability.
