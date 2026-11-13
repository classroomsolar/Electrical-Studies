# Fault Current Studio — Current V28 Only (Complete Hand-off)

This is the SMALL, CORRECTED cross-account transfer. It contains **all 236 latest V28 website files** as a full deployable ZIP; the complete **205 current V28 QA script/result artifacts**; latest V28 release report and source SHA-256 manifest; previous requirements and new consolidated full Word/TXT handoff prompt; the original audited master equipment workbook and 2 latest feature-matrix references. It contains NO redundant older source/recovery ZIPs.

## Start
1. Upload this one ZIP to the new ChatGPT account.
2. Tell the assistant: **Read MASTER_CONTINUATION_PROMPT.docx and follow it completely, while preserving the original Wix site**.
3. Or copy/paste the exact text from MASTER_CONTINUATION_PROMPT.txt.
4. Run VERIFY_TRANSFER.py (Python 3) to verify the 236 website source entries and outer package hashes.
5. Do not create a replacement Wix site or erase anything existing.

## Release reality
- Latest SAVED working release: **V28**, 236 site files, offline QA recorded; NOT deployed as of the handoff.
- Last authenticated LIVE Wix release: **V27**, 234 site files; may have changed after handoff.
- Current user-visible public URL: https://headless-dlrpfrynayh-classroomsolar-140e.wix-site-host.com/
- Original Wix ID: 97613ac8-1f7d-4ecf-8fa4-2d589c387775
- Private cloud owner studies and private v51/Batch14 branch sources are **not** part of this public-source transfer; obtain only with owner authorization.
- Full applicable IEEE/IEC certification and live site acceptance are **NOT** completed.

## Important accuracy
The master XLSX and historical feature matrices are references, not a newer replacement of live in-site manufacturer data. QA under QA/RECORDED_V28_QA_FILES/ is the actual V28 release test evidence (including comparison data for V20 and V27), not earlier full source releases. The previous 22MB handoff included an incorrect instruction to open an omitted 206MB history archive; this corrected handoff does NOT require that omitted archive. Current source is self-contained.

## V29 update (7 November 2026)
- Latest release is **V30**, 258 site files. Code is **live on the original Wix site** (256 files, 8 Nov 2026). The master-database v13 update is in this package but **not yet live**: run `DEPLOY/deploy_database_to_wix.py` (see `REPORTS/V29d_Database_v13_Import.md`). Read `REPORTS/V29_Release_Report.md` first, then `REPORTS/V29_PART4_Plan_Limits_Bots_and_Prompt.md` for the next-chat prompt.
- 17 database files that the GitHub upload had put in `SITE/` are back in `SITE/database/`.
- New: transformer %Z tolerance envelope and NEC 110.24 label ("Fault label & Z tolerance" button). Fixes: SLD Delete-button position, input plausibility warnings. Arc flash (IEEE 1584-2018) now computed in the browser, verified against 105,120 official IEEE cases. Research: `REPORTS/research/`.
- V29b adds: transformer off-nominal tap (fault studies), "Arc flash · all buses" with labels, and "Conductor sizing" (NEC 310.16 ampacity + voltage drop + short-circuit).
- V29d adds: protective-device clearing time from dropdowns (relay curves / manufacturer curve), "Harmonics & PF correction" (IEEE 519 + resonance), user R/X in conductor sizing, master database v13.
- Tests: `QA/V29_QA_SCRIPTS/`; results: `REPORTS/V29_TEST_RESULTS.md`; manifest: `QA/V29_SHA256_Manifest.json`.
- V29e adds (Step 4): transformer tap in load flow, one-line breakers/fuses linked to the arc-flash device picker, relay tolerance bands, LV breaker LSI model, NEC 240.4 OCPD + 250.122 EGC in conductor sizing, published TCC plot-point library. Change set: `REPORTS/V29e_changes_since_V29d.patch`.
- V30 adds: the Stitch dark theme (`fcs-theme-v30.css`, `shell-v30.mjs`, `fonts/`) and a full layout clean-up checked by an automatic audit at 5 screen widths (`QA/V30_UI_AUDIT/`). No calculation code changed. Design source: `REQUIREMENTS/stitch_electrical_studies_design_system/`.
- V31 (8 Nov 2026) adds plant-scale capability:
  - **Solvers.** A sparse AC fault solver (1,970-bus PV plant in about 3 s) and a factored DC array solver (3,924-bus central-inverter array in about 3 s).
  - **Large one-lines.** They stay responsive (visible-area drawing, overview, Find).
  - **Build plant.** Generates a PV/BESS plant one-line from block data.
  - **Equipment table.** CSV download, edit and upload.
  - **Projects on your computer.** A connected folder of `.fcs.json` files with autosave.
  - **Capability atlas.** No reference names on screen, and up-to-date statuses.

  V31 is live (260 files). Database v13 is still **not** live, as instructed. Read `REPORTS/V31_Release_Report.md`. Tests: `QA/V31_SCALE/`. Manifest: `QA/V31_SHA256_Manifest.json`. Repository layout for GitHub upload: `README.md` (root).
- **V32 (8 Nov 2026, latest)** adds:
  - **Report contents.** You choose which studies go into the report.
  - **Large reports.** Excel and PDF reports work for large projects.
  - **Plant-scale solvers.** SLG/LL/DLG and split-phase calculate at plant scale.
  - **Sparse load flow.** Closed switches are merged, and a fill-zero button handles blank buses.
  - **Fast arc flash at every bus.** It also has a bracket option, and the Engineering-studies card now gives an IEEE 1584 result.
  - **Building and editing.** Tree auto-arrange, equipment add/delete, and DC arrays plus attach in Build plant.

  V32 is live (263 files). Database v13 is still **not** live. Read `REPORTS/V32_Release_Report.md`. Tests: `QA/V32_*/`. Manifest: `QA/V32_SHA256_Manifest.json`.
