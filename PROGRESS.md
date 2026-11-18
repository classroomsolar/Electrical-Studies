# PROGRESS — Fault Current Studio

## Batch 3 — Engineering audit 1: fault engines (15 Nov 2026) ✅ (live)
- Owner requests first: private data — local clone of the database repo deleted; no voltage limit on database data (filter removed, transmission conductors kept); 16 unused files deleted from the live site (old fonts, `legacy-app.mjs`, old CSS, notice text), all views checked.
- pandapower (free IEC 60909 code) on the same networks: Ik'' 231 buses / 49 cases, 0 fail, worst 1.0·10⁻⁷.
- **Defect found and fixed:** peak current in meshed multi-source networks was up to 23 % low (single X/R). IEC 60909-0 method C now used for meshed networks (dense + sparse solvers); UI and report name the method. Independent numpy oracle (own method C) 936 totals / 861 peaks, 0 mismatches.
- I-01 fixed (the test generator, not the engine, was wrong). I-09 fixed in the package (14 duplicate picker files, 3.3 MB, removed; database view 50 sheets, counts equal). I-10, I-11 accepted per owner. New I-15 (non-meshed partial peaks, Batch 10), I-16 (info).
- Regression: oracle 936/0, sequence 1,200/0, DC 525/0, physics 14/14, envelope 19/19, sparse 637/0, DC sparse, load flow (3 suites), reports (2 suites + identity: only the new "Peak factor method" row differs), arc flash 5,201/0, many sources 4.8 M / 0, DC lean 219,581 / 0, watchdog 6/6, V33 audits 95/95, operating table 40/40, equipment table 13/13, inverter 6/6, builder 15/15, compact 0 fails; bundle = source 8,860 values. Browser: Batch 2 checks 14/14, database view 6/6, XSS 26/26, CSV formula pass, axe at 5 widths (only the known I-03 items).
- Live: 10 files patched, 10 / 10 read back identical; checked in Chrome: new engine and worker load, owner's draft unchanged (2,390 characters). Database on live unchanged (D-08).
- Not done in this batch: zero-sequence path rules (→ Batch 4), ANSI C37 duty (gap list written, → Batch 10), IEC TR 60909-4 example (data not freely available).

## Batch 2 — Housekeeping (15 Nov 2026) ✅ (live)
- BESS dispatch and BESS size/cost sensitivity hidden (D-04). Time-series AC load flow stays and is the default. Saved or imported BESS scenarios are refused with a scope message; their data and code are kept.
- Font: Sitka Text (body) and Sitka Heading (headings) by name, Georgia/serif fallback, system monospace for code (D-09). The live site no longer requests Google Fonts or any font file.
- Cloud Vault file input labelled (I-04). Full browser storage no longer hides an arc-flash result or a new Cloud Vault recovery code (I-05).
- Database import reduced to the keep list (package only, D-08): 111 → 65 files, 9.9 → 7.7 MB. (A 38 kV filter on MV breakers was tried and removed again on the owner's instruction: no voltage limit on data.) Master library shows "50 of 117 sheets".
- Bundled font files removed from the package (not referenced any more).
- Tests: full regression suite (numpy oracle 873/0, sequence 1,200/0, DC 525/0, physics 14/14, envelope 19/19, sparse 637/0, load flow, reports, arc flash, V33 audits 95/95, operating table 40/40, equipment table 13/13, inverter 6/6); browser: Batch 2 checks 14/14, XSS 26/26, operating table, equipment table, Build plant pass; axe at 5 widths: `label` finding gone, no sideways scroll.
- Live: 12 files published, 12 / 12 read back identical (bundle without the database module). Live page checked in Chrome: Sitka fonts, lab hidden parts, 16.706 kA, owner's draft unchanged.

## Batch 1 — Phase 0 inventory (15 Nov 2026) ✅
- Read Master Prompt V5.0 (all 1,912 lines), `Fault_Current_Studio_prompt.md`, the calculator index, and the master database repository (v13 checksum verified).
- `REQUIREMENTS.md`: R326–R357 and D01–D17 mapped to files, functions and tests, with status and proposed P1–P5 applicability.
- `DATABASE_MAP.md`: 111 prepared database files classified: keep 64 (7.6 MB), drop 47 (2.3 MB), with reasons.
- `DECISIONS.md` (D-01 … D-10), `ISSUES.md` (I-01 … I-12), `REMAINING_WORK.md` (batch plan 2–14).
- Tests rerun: numpy oracle (873 comparisons, 0 mismatches; 21 cases rejected → I-01), phase-domain sequence oracle (1,200 / 0), DC oracle (525 / 0), physics 14/14, transformer envelope 19/19; plus the V33 regression suite earlier the same day.
- No site code changed; nothing deployed in this batch.

## Before Batch 1
- V33 (14–15 Nov 2026): see `REPORTS/V33_Release_Report.md` and `REPORTS/V33_Audit_Report.md`.
