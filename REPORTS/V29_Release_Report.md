# Fault Current Studio V29: release report

**Status: V29d. Code DEPLOYED on 8 Nov 2026 to the original Wix site (metaSiteId 97613ac8-1f7d-4ecf-8fa4-2d589c387775), live revision d597e1d346bbee1486a69c2c0b53cbc29d40f36e (246 files). The master-database v13 update is in this package but not yet live (see V29d section). Not a complete IEC/IEEE-certified platform.**

Date: 7 November 2026. Parent: V28 (236 files, never deployed) and live V27 (234 files, revision 7833f765…). V29 has 239 website files.

## What changed

| File | Change | Why |
|---|---|---|
| `SITE/database/*` (17 files) | Moved back from `SITE/` into `SITE/database/`. Content unchanged. | The GitHub upload had placed them in the wrong folder, so `database/manifest.json.txt` returned 404 and the equipment database did not load in the repository copy. All 17 now match the V28 SHA-256 manifest at the correct path. |
| `network-engine.mjs` and the same code inside `public-bundle-v21.js` | Added non-blocking **plausibility warnings** | Unit mistakes (for example 1e300 A, 200 % impedance, Ω/m entered as Ω/km) were accepted silently. Calculated values are not changed. |
| `one-line-editor.mjs` and the same code inside `public-bundle-v21.js` | Fixed the **SLD Delete button position** for sources and devices | A selected utility, generator, motor, PV or device drew its Delete button at `translate(NaN 20)`, so it appeared at the top-left of the drawing instead of beside the item, with a console error. Buses were unaffected. |
| `public-bundle-v21.js` | Exposes the bundled engine read-only as `globalThis.__fcsBundleRequire` | Lets add-on modules reuse the live engine without loading extra files (Wix HTTP 429 history). |
| `fault-envelope-v29.mjs` (new) | Transformer impedance-tolerance fault envelope + NEC 110.24 label data | Feature adopted from the Bussmann point-to-point method and IEEE C57.12.00 ±7.5 % tolerance. |
| `fault-envelope-ui-v29.mjs` (new) | "Fault label & Z tolerance" button and dialog: min / nameplate / max per bus, printable label, PDF / Excel / JSON | Same safe add-on pattern as V27/V28. Reads the open project read-only. |
| `index.html` | One extra `<script type="module">` line for V29 | Loads the add-on |
| `ieee1584-2018.mjs` (new) | IEEE 1584-2018 arcing current, incident energy and arc-flash boundary computed in the browser (JavaScript port of the MIT-licensed `arcflash-calc` library) | The existing arc-flash dialog sent study inputs to an external server (`fault-studio-ieee1584-api.vercel.app`) that is not in your source and not under your control. Now nothing leaves the browser. |
| `arcflash-study-ui.mjs` and the same code inside `public-bundle-v21.js` | Calls the local engine instead of the external server; footnote updated | Same inputs and same result format as before |

All other 232 website files are byte-for-byte identical to V28 (231 after the arc-flash change). No saved-study keys, project format, Cloud Vault, reports or database records were changed. `REPORTS/V29_changes_to_existing_files.patch` shows every changed line. `QA/V29_SHA256_Manifest.json` lists all 239 files with SHA-256.

## Engineering finding from testing

Lowering transformer %Z does **not** always raise the fault current at every bus. When an LV generator or motor is present, a stiffer transformer diverts some of its current towards the utility, and phasors with different X/R can add to a slightly smaller total (up to 0.04 % lower in the random networks tested). The V29 envelope therefore solves every ± combination (up to 8 transformers, 256 solutions) and reports the true extreme per bus with the governing combination. A dense check of 8,446 intermediate points found no value outside the reported envelope.

## Tests run (all offline)

See `REPORTS/V29_TEST_RESULTS.md` for numbers. Short version:
- 873 bus results in 220 random networks match an independent numpy solver exactly (current, X/R, peak).
- The live bundle engine and the source engine give identical results in all 220 networks (3,744 values).
- 0 calculated values changed compared with original V28.
- 14 physics checks pass, including the historic 65 kA vs 56 kA case (now equal) and transformer LV current reflection.
- 400 SLG/LL/DLG/3PH sequence cases match a phase-domain solver (1,200 phase currents).
- 120 DC networks (525 bus faults) match a nodal solver.
- V28 recorded batches reproduced: 1,200/1,200 transformer and 1,500/1,500 conductor outputs identical.
- 37 invalid or extreme inputs: 0 crashes, 0 non-finite outputs, 4 new plausibility warnings.
- Browser (desktop 1440×900 and mobile 390×844): select, Delete, Ctrl+Z, Ctrl+Y, double-click properties, Esc all work; V29 dialog, label, PDF/XLSX/JSON downloads verified and parsed; V28 tool still opens; no page errors; Studio draft unchanged by V29.

## IEEE 1584-2018 arc-flash engine: verification

- All 398 coefficients compared with the reference library's tables: 0 differences.
- IEEE 1584-2018 Annex D.1 (4.16 kV): 22 of 22 intermediate and final values match to the printed precision. Annex D.2 (480 V): 28.793 kA, 11.585 J/cm², 1,029 mm (full) and 25.244 kA, 53.156 J/cm², 2,669 mm (reduced), all as printed.
- 105,120 official IEEE 1584-2018 calculator spreadsheet cases (the 38,880 cases with enclosure width under 4 × gap are invalid by the standard and skipped): worst difference 0.0002 %.
- Python reference library on 6,000 random official cases: worst difference 3e-15.
- 52 challenge tests: energy linear in time, falls with distance, arc-flash boundary returns exactly 1.2 cal/cm², every range limit accepted or rejected correctly, 5,000 random cases finite and positive. Step across the 600 V model boundary: 0.05 % (built into the standard's two models).
- Browser, desktop and mobile: Annex D.2 example, TCC-curve option, invalid input message; no request to the external server.

## Deployment (7 Nov 2026)

- Live site before: V27, 234 files, revision 7833f76548763c45152264ef08be50519d8ed752. This matched the handoff, so nothing had been changed on the live site since.
- Reconciliation: 229 live files had the same size as local. Every one of the 5 that differed was an intended change. 5 files were new. No live file was missing locally.
- The 4 patched live files were first verified byte-for-byte (length + checksum) against V28. Patches were applied on Wix, all 10 resulting files were checksum-verified against the local V29 files, and only then published in one patch.
- Live after: 239 files, revision a269917c6717417399f3191c7c0a354d2bcb1aff. 9 of 10 changed files are byte-identical to local. `index.html` differs only by the `wix-site-script` tag that Wix adds to every uploaded site.
- HTTP check of the live URL: 13 key files return 200 with the expected V29 lengths.
- **Not done:** a real click-through of the live site in a browser. The sandbox cannot reach the live host. Please open the site and try: Arc flash · IEEE 1584 → Compute; Fault label & Z tolerance → Calculate envelope.
- Rollback: the exact V27 `index.html` was replaced on the live site and is not in this package. The safe rollback is to the offline-validated V28 set: upload the V28 copies of the 5 changed files (reverse `V29_changes_to_existing_files.patch`) and delete `fault-envelope-v29.mjs`, `fault-envelope-ui-v29.mjs` and `ieee1584-2018.mjs`.

## Not done / still open

- Live Wix HTTP 429 / startup and the Chromium 11th-download timeout were not retested (no live site access in this session).
- Transformer off-nominal taps are still rejected in fault studies (P1; design notes in the backlog).
- Full IEEE 1584-2018 arc flash, OEM TCC bands, full ANSI/IEC duty, unbalanced load flow, IEEE 80 grounding and IEC 60853 remain open (see backlog).
- The 186 QA evidence files sit one folder higher than `TRANSFER_MANIFEST_SHA256.json` says; content is identical. Left in place.

## Rollback

Restore the four changed files from V28 (or reverse `V29_changes_to_existing_files.patch`), delete the two `fault-envelope*-v29.mjs` files, and keep the 17 database files in `SITE/database/`, which is their correct V28 location.


## V29b update (7 Nov 2026, second deploy)

Three backlog items done. Nothing removed; all earlier tests rerun.

| Item | Files | What it does | Limits |
|---|---|---|---|
| Off-nominal transformer tap | `network-engine.mjs`, `connected-sequences.mjs`, `network-app.mjs`, `network-model.mjs`, `report-data.mjs`, `operating-studies.mjs`, `split-phase-network.mjs`, bundle | New field "Off-nominal primary tap (%)", ±10 %. Turns ratio becomes (v1·(1+tap/100)/v2)/(Vi/Vj) in positive, negative and zero sequence. Impedance stays on the nameplate base. Info note shown when used. | Load flow and split-phase studies refuse a non-zero tap with a clear message (not modelled there yet). |
| Arc flash at every bus | `arcflash-network-v29.mjs`, `arcflash-network-ui-v29.mjs` (new) | Button "Arc flash · all buses". Takes the 3-phase bolted current of each bus from the open Studio network, IEEE 1584-2018 Table 8/10 typical equipment values (editable), shows full and reduced arcing current, then needs both clearing times per bus. Labels with NFPA 70E 130.5(H) fields, print, PDF/XLSX/JSON. | Clearing times are never assumed: a bus without them shows "CLEARING TIMES REQUIRED". No PPE category. 208 V–15 kV only. |
| Combined conductor sizing | `cable-sizing-v29.mjs`, `cable-sizing-ui-v29.mjs` (new) | Button "Conductor sizing". Checks every size 14 AWG–2000 kcmil: NEC 310.16 ampacity × ambient × bundling, limited by termination rating (110.14(C)), ×1.25 continuous; voltage drop with R/X; adiabatic short-circuit I²t ≤ (kS)². Picks smallest size passing all, and says which check governs. | NEC values are from the site database and flagged "not re-verified" (165/165 matched published values). R/X only 8 AWG–750 kcmil; sizes without R/X are skipped and named. OCPD, raceway fill, harmonics not checked. |
| Fault label & Z tolerance launcher | `fault-envelope-ui-v29.mjs` | Moved into the "More engineering tools" menu like the other tools. | — |

Deployment: the 10 live files were checked (length + checksum) against the first V29 deploy, patched inside Wix, checked again against local, and published once. Read-back: 14/14 files identical (index.html after removing the Wix site-script tag). Live HTTP: 7 key files 200 with the expected lengths. A real browser click-through on the live URL was not possible from here.

Rollback to the first V29 deploy: apply the reverse of the V29b hunks (see `V29_changes_to_existing_files.patch`, which now covers V28 → V29b) and delete the 4 new files.


## V29d update (8 Nov 2026)

| Item | Files | What it does | Limits |
|---|---|---|---|
| Clearing time from dropdowns | `clearing-time-v29.mjs` (new), `arcflash-network-v29.mjs`, `arcflash-network-ui-v29.mjs` | Per bus, pick the protective device: IEC relay curve (SI, VI, EI, LTI — IEC 60255-151), IEEE relay curve (MI, VI, EI — IEEE C37.112-2018), definite time / instantaneous, or a fuse/breaker curve typed from the datasheet. Breaker time from the rated interrupting cycles (2/3/5/8) or ms. The clearing time is calculated at the IEEE 1584 full and reduced arcing currents and fed into the arc-flash result. Over 2 s is flagged; limiting to 2 s is a user tick box. | Relay/breaker tolerance, CT saturation and zone interlocking not modelled. The database has no TCC curves, so no device curve is picked automatically. |
| Conductor sizing | `cable-sizing-ui-v29.mjs` | Short-circuit clearing time can come from an IEC/IEEE relay curve; user can enter R/X from the cable data sheet for any size (fills the 14–10 AWG and 3 AWG gap). | — |
| IEEE 519 PCC check | `power-quality-v29.mjs`, `power-quality-ui-v29.mjs` (new) | Button "Harmonics & PF correction". Isc/IL row, individual harmonic and TDD limits (Tables 2/3), voltage limits (Table 1), 2022 even-harmonic rule (2014 selectable). Isc can be taken from a Studio bus. | Above 161 kV not covered; a snapshot is a screening check, not a week of measurements. |
| PF correction + resonance | same | Required kvar, PF with bank, parallel resonance order √(Ssc/Qc) for the bank and every step, voltage rise, warning near listed harmonics. | Single-bus approximation. |
| Master database v13 | `database/*`, `database-reference-tables.mjs`, bundle | See `V29d_Database_v13_Import.md`. | **Not yet live** — run `DEPLOY/deploy_database_to_wix.py`. |

Deployment: 4 live files checked by length + checksum against V29b, patched inside Wix, checked against local, published once; 3 new files checked the same way. Read-back 7/7 identical; HTTP 200 with expected lengths for 8 files.

Not done: Stitch theme and NEC books (Dropbox links could not be opened from here, and the files were not in Google Drive); off-nominal tap in load flow.


## V29e update (8 Nov 2026) — Step 4

| Item | Files | What it does | Limits |
|---|---|---|---|
| Transformer tap in load flow | `operating-studies.mjs`, `network-app.mjs`, bundle | The fixed off-nominal tap (±10 %) set on a transformer is now used by the Newton–Raphson load flow, stamped the same way as in the fault engine (Yii += y/t², Yjj += y, Yij = Yji −= y/t). Branch flows report the current on both sides. | Automatic tap changing (OLTC control), phase-shifting taps, shunts and Q limits are not modelled. Split-phase study still asks for 0 %. |
| One-line devices → arc-flash device picker | `arcflash-network-v29.mjs`, `arcflash-network-ui-v29.mjs` | For each bus the study finds the breaker / fuse / recloser drawn on the one-line whose opening cuts the bus off from its sources (nearest device that cuts off every source first). The bus row offers "One-line: <device> (x % of fault)". Its settings are entered once and used for every bus it protects; the share of fault current comes from the fault study flows. If the device does not cut off every source, the result says so and asks for the other devices. | The device's settings still have to be typed (the one-line holds no TCC data). Looped networks with several devices in series are ranked, not coordinated. |
| Relay tolerance bands | `clearing-time-v29.mjs`, arc-flash UI | Pickup ±% (0–20), operate time ±% (0–30) or ±ms (0–200), whichever is larger. The slow edge of the band is used for arc flash; nominal and band are shown. Near pickup, a relay that may not operate at the upper edge is flagged "MAY NOT TRIP (TOLERANCE)". | Values come from the relay manual; none are assumed. CT saturation and breaker opening-time spread not modelled. |
| LV breaker electronic trip (LSI) | `clearing-time-v29.mjs`, arc-flash UI | Long time Ir with delay at 6 × Ir (I²t), short time Isd / tsd (flat), instantaneous Ii with the manufacturer's total clearing time; same tolerance fields. | I²t-ON short-time ramp and ZSI not modelled. Instantaneous clearing time must be typed from the datasheet. |
| OCPD check | `cable-sizing-v29.mjs`, `cable-sizing-ui-v29.mjs` | Pick next standard rating (240.6(A); 10 A added for 2023) or type one. Checks 210.20(A)/215.3 (125 % continuous), 240.4(D) small-conductor limits, 240.4(B) next-higher-rating rule (≤ 800 A, not for multioutlet receptacle circuits), 240.4(C) above 800 A. Shows the NEC 250.122 EGC size from the site master database (record IDs kept), increased per 250.122(B) when conductors are upsized, and the 250.122(F) parallel note. | Tap rules (240.21), motor circuits (Art. 430) and adjustable-trip breakers (240.6(C)) not covered. NEC values flagged "not re-verified" until checked against the licensed NEC. |
| Published TCC plot points | `tcc-library-v29.mjs` (new), arc-flash UI | Manufacturer curve input accepts 2 columns (current, maximum clearing s) as well as 3. A picker fills the curve from published numeric plot points; first source: ERMCO 9F54DFC dual element fuse, 9 ratings (C030–C140), source URL and date kept. | Most LV breaker and fuse curves are only published as graphs and cannot be read reliably by a bot; those must be typed from the datasheet or modelled with the LSI settings. |

Deployment: 9 live files checked (length + FNV-1a checksum) against V29d, patched inside Wix, checked against local, 1 new file checked the same way, published once. Read-back 10/10 identical; HTTP 200 with expected lengths for 6 key files. The deployed bundle keeps the live grounding-resistor table: database v13 is still **not live** (owner's decision).

Rollback to V29d: reverse `REPORTS/V29e_changes_since_V29d.patch` and delete `tcc-library-v29.mjs`.

Still open: database v13 go-live (owner), Stitch theme and NEC books (Dropbox not reachable from here), full audit from zero (owner asked for it later), live click-through from a real browser.


## V30 update (8 Nov 2026) — Stitch theme and layout clean-up

Source: `stitch_electrical_studies_design_system` (DESIGN.md + 4 screens) from the owner's repository, copied to `REQUIREMENTS/stitch_electrical_studies_design_system/`. Only the look was taken (colours, fonts, borders, cards, badges); none of the mock-up data (names, numbers, studies) was copied.

| Item | Files | What changed |
|---|---|---|
| Theme | `fcs-theme-v30.css` (new) | Dark engineering workbench from DESIGN.md: obsidian/slate surfaces, 1 px strokes, 4–8 px corners, cyan actions, pass/warn/fail colours, Inter for text, JetBrains Mono for numbers and labels. Screen only: printouts and PDF/XLSX exports keep their own light styling. Primary buttons use #0369a1 instead of #0284c7 so white text meets 4.5:1 contrast. |
| Fonts | `fonts/` (new, 4 files, 50 KB) | Inter and JetBrains Mono (SIL OFL 1.1), self-hosted, subset to the characters this site uses, weights 400–700. No outside requests. Licence texts in `fonts/` and `THIRD_PARTY_NOTICES.md`. |
| Shell | `shell-v30.mjs` (new), `index.html` | Every floating launcher ("More engineering tools", "Conductor I²t duty", "Study guide") is docked in the sidebar; nothing floats over the page. Sidebar runs full height. Equipment palette moved to a full-width row above the drawing (labels no longer cut). Inspector widened to 340–380 px. One-line labels get a background sized to their text (the click target is untouched). Bus bars coloured by voltage class (LV green, MV cyan, HV violet; selected fault bus amber). A table that cannot fit its panel is shown as one card per row instead of having columns cut off. |
| Dialogs | theme only | All tool dialogs restyled; wide tables (arc flash per bus, conductor sizing) fit on desktop; long option names in drop-downs wrap (Chromium 135+; other browsers show the normal native list). |

No calculation file changed: every engine, bundle and tool module is byte-identical to V29e.

Checks: an automatic layout audit (`QA/V30_UI_AUDIT/`) visits 8 pages, 16 dialogs/panels and 10 calculated dialog states at 1440, 1280, 1024, 768 and 390 px and flags text below WCAG contrast, text cut by its box or parent, words squeezed onto 3+ lines, drop-down or placeholder text cut, controls hidden under fixed elements, white surfaces left in the dark theme, sideways scrolling and one-line labels running past their box. Final result: **0 findings** (see `QA/V30_UI_AUDIT/results/`). All 10 browser regression suites rerun against V29e: same numbers and behaviour; differences are only text case/layout in captured page text (uppercase table headers, card layout on phones) and one fewer floating button (I²t is now in the tools list).

Deployment: `index.html` patched in place (4 anchored edits, checked before and after by length + FNV-1a), 4 text files and 4 font files added; text files read back identical; fonts checked by SHA-256 on the live URL (one font block was corrected after a transcription error and re-verified). Live files: 256. Database v13 is still **not live**.

Rollback to V29e: reverse `REPORTS/V30_changes_since_V29e.patch` (index.html) and delete `fcs-theme-v30.css`, `shell-v30.mjs` and `fonts/`.
