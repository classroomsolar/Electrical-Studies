# V33 — check of the live V32 site in a real browser (13 Nov 2026)

Browser: the owner's desktop Chrome (window 1912 px wide) on `https://headless-dlrpfrynayh-classroomsolar-140e.wix-site-host.com/`.
The saved draft in that browser was backed up first and put back afterwards. Downloads were captured in the page and not saved to disk.

| Check | Result |
|---|---|
| 128 code files fetched from the live site and hashed (SHA-256) against `QA/V32_SHA256_Manifest.json` | 123 identical. 5 differ as expected: `index.html` and `v10-review.html` (Wix adds its script), `public-bundle-v21.js` and `database-reference-tables.mjs` (database v13 not live), `favicon.ico` (not in V32; Wix answers with a page). |
| Page errors while loading and using the pages below | None |
| Report page, example project: contents chooser | Present, 11 section boxes, scope choice. Unticking "inputs" removed that section, ticking put it back. |
| Report page: PDF and Excel | PDF 23,434 bytes (starts `%PDF`), Excel 51,287 bytes (zip). Both in under 0.3 s. |
| Build plant: 7 feeders × 10 blocks × 24 inverters (1,900 buses, 1,681 sources) | **Failed.** "Calculation did not complete. Retry…" after about 37 s, also on Retry. Cause: the 30 s limit; see `QA/V33_SOURCES/`. Fixed in V33 (not yet live). |
| Build plant: 20 × 20 × 1 inverter (1,623 buses, 401 sources) | Calculated, 39.586 kA at POI, but took 26 s. |

Not checked on the live site in this round: SLG/LL/DLG and split-phase at 2,000 buses, operating studies, arc flash at every bus,
engineering-studies card, equipment table, DC array and attach modes, auto-arrange, and the phone-width view.
These were run on a local copy of the same files (`QA/V33_VERIFY/`), which the hash check shows are the files that are live.

---

# After the V33 deploy (14 Nov 2026)

Deploy method: the files were patched in place on the original Wix site (`97613ac8-1f7d-4ecf-8fa4-2d589c387775`) with Wix's file tools.
Each file was read from the site, changed by exact find-and-replace steps, checked against a checksum of the expected V33 file, and only then published.
Three publishes: (1) 19 text files + `favicon.ico`, (2) `public-bundle-v21.js`, (3) the longer time limit and the last engine speed-up (2 files + bundle).
The database module inside the bundle was checked unchanged each time. Live file count: 263.

Read back in the owner's browser (Edge/Chrome 157, 1912 px wide) with SHA-256:

| Check | Result |
|---|---|
| 18 changed text files against `QA/V33_SHA256_Manifest.json` | 18 / 18 identical (after the third publish `network-engine.mjs` and `network-calculation.mjs` were checked again: identical) |
| `public-bundle-v21.js` with the database module cut out | identical to the package |
| `favicon.ico` | **Not served.** The Wix host answers `/favicon.ico` with its own 1,150-byte icon and replaces the page's icon link. No 404, no error. |
| Page errors on all 8 pages | None |

Feature check on the live site, desktop width:

| Check | Result |
|---|---|
| Build plant 7 × 10 × 24, blank inverter angle (1,900 buses, 1,681 sources) | **Calculates: 24.368 kA at POI (screening bound)**, same value as the local run. About 24–27 s on this computer. |
| Same plant: another fault bus, results page | 20.879 kA; note "Step-by-step tables are shown for the 40 largest contributions" shown; 40 tables |
| Same plant: report page, contents chooser, Excel | Chooser with 11 boxes; Excel 1.8 MB (zip) |
| Same plant: PDF | No file. Message: "PDF report would exceed 2000 pages. Largest sections: Study inputs (≥1540 pages) … or download Excel." |
| Same plant: Arc flash at every bus, Run | 1,900 rows listed; 0 calculated because no arc-flash inputs were entered (same as local) |
| 2,000-bus connected-sequence project: SLG, LL, DLG | 1.104 kA, 1.454 kA, 1.599 kA — all "CALCULATED" |
| 2,000-bus split-phase project | 76.19 A, "CALCULATED" |
| Build plant 20 × 25 × 1 (2,023 buses, 501 sources) | 45.289 kA, under 14 s (V32: a smaller 1,623-bus plant took 26 s) |
| Operating studies on that plant: base 100 MVA, slack POI, "Enter 0 MW / 0 Mvar at the 2022 blank buses" | "Converged in 0 iterations · max residual 0 pu" |
| Equipment table CSV | 581,719 bytes, `PV-plant-500-inverters-equipment.csv` |
| Auto-arrange, 2,023 buses | Done; 2,023 distinct bus positions |
| Build plant, attach mode (1 block, 2 inverters) | 2,023 → 2,029 buses; 45.404 kA |
| Build plant, DC array (288 strings) | 602 buses, DC result shown |
| Engineering studies page | Opens; arc-flash card present (inputs not filled on the live site) |

This computer runs the same JavaScript about 4 times slower than the test machine (a 49-million-step loop: 0.5 s here, 0.13 s on the test machine).
The engine alone needs 18–20 s here for the 1,900-bus / 1,681-source plant. This is why the time limit now grows with project size.

Not checked on the live site: phone width (the browser window could not be made narrow), equipment-table upload, Arc flash with typed clearing times, the engineering-studies arc-flash card with inputs.
The owner's saved draft was backed up before and restored after; the browser window size was restored.
