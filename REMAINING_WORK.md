# REMAINING WORK — Fault Current Studio

Updated after **Batch 3** (15 Nov 2026). Read this file first in every new session, then `DECISIONS.md`, `REQUIREMENTS.md`, `ISSUES.md`.
Governing documents: Master Prompt V5.0 and `Fault_Current_Studio_prompt.md` (both in `classroomsolar/engineering-master-database`).

## How every batch is delivered (D-10)
1. Work one batch. Small, reversible changes. Nothing deleted; out-of-scope items are hidden.
2. Run the regression suite (list at the end) plus the batch's own tests.
3. Update `REQUIREMENTS.md`, `ISSUES.md`, `PROGRESS.md`, `CHANGELOG.md` and this file.
4. Deliver one ZIP (full `Electrical-Studies` folder, no `.git`) named `Fault_Current_Studio_Batch_NN_YYYY-MM-DD.zip`.
5. Live deploy only for code that passed tests, with checksum read-back. Database v13: owner approved on 15 Nov (D-08), upload is blocked (see below).

## Do this first (before Batch 4) — new database on the live website
**State on 15 Nov:**
- GitHub `classroomsolar/engineering-master-database`: latest workbook `Engineering_Master_Database_Audited.xlsx`, SHA-256 `dcef1fb4…` (v13), commit `d5156de` (private material removed).
- Calculator package (this ZIP, `SITE/database/`): built from that same file. 50 sheets the calculator needs, 78 files, 4.9 MB, no voltage limit, no duplicate picker copies. Browser-tested (`QA/B03_FAULT_AUDIT/db_picker_browser.py` 6/6).
- **Live website: still the OLD import** (19 Oct 2026, workbook SHA `cab11d…`, 93 sheets, 135 files). The new database never reached the website.
- The owner approved putting it live (15 Nov). The blocker is only the upload: the 78 database files are compressed binary files, and nothing in the AI's workspace can send them to Wix (sandbox shell blocked by the network allowlist; the Wix runtime cannot fetch GitHub or Wix Media; the Wix upload tool cannot read sandbox files; files too large to pass inline). Code files are not affected; they go live as text patches.

**Owner chooses one route:**
1. **Allow the network (recommended):** claude.ai → Settings → Capabilities → allowed domains: add `wixapis.com` and `wix.com` (more Wix hosts may be needed; an error will name them). Then the AI runs `npx @wix/cli login`, the owner opens the link and approves once, and the AI uploads.
2. **From the owner's PC:** the AI gives `FCS_database_v13_live.zip` (database folder + `database-reference-tables.mjs` + `public-bundle-v21.js`) and a small script. The owner runs `npx @wix/cli login` and the script. The script downloads the current live site, replaces only those files, removes the old database files, and uploads the merged site.

**What the upload must do (either route):**
- Replace `database/` with the package `SITE/database/` (78 files) and delete the live database files that are not in it (old picker copies, the 46 sheets not needed).
- Replace `database-reference-tables.mjs` and `public-bundle-v21.js` (the live bundle differs from the package only in the database module).
- Keep every other live file.

**Check after upload:** live database view shows 50 sheets with the manifest row counts (CABLES 13,223; PV MODULES 39,400; IBR 5,603; HV BREAKERS 3,305 …); no failed request; picker loads `master-*` files only; worked example still 16.706 kA; owner's draft unchanged. Then record it in PROGRESS / CHANGELOG / RELEASE_STATE (`database_v13_live: true`).

## Other owner actions
- Upload this ZIP to GitHub (`classroomsolar/Electrical-Studies`). GitHub stays the home (D-01); the AI does not push.

## Batch plan
| Batch | Content | Requirement / issue IDs | How |
|---|---|---|---|
| 1 ✅ | Phase 0 inventory: requirement map, database map, records | all | Done 15 Nov. See PROGRESS.md |
| 2 ✅ | Housekeeping: BESS dispatch / sizing hidden, Sitka font, database keep list, Cloud Vault label, storage guards | D-04, D-07, D-09, I-04, I-05, I-07, I-09 | Done 15 Nov, live. Left over: PV modules stored twice (I-09), old font files on the live site (I-13, needs owner OK) |
| 3 ✅ | Engineering audit 1 — fault engines | R326–R334, I-01, D05, D06 | Done 15 Nov, live. `REPORTS/B03_FAULT_AUDIT.md`: pandapower cross-check (Ik'' 231 buses, 0 fail); **peak was up to 23 % low in meshed networks → IEC 60909-0 method C added**; I-01 fixed (test generator); I-09 picker copies removed; I-13 unused live files deleted; I-10 / I-11 accepted (owner: phone and very big SLD low priority). Left over: zero-sequence path rules → Batch 4; ANSI C37 gap list and non-meshed partial peaks (I-15) → Batch 10 |
| 4 | Engineering audit 2 — protection, arc flash, load flow, harmonics (+ zero-sequence path rules from Batch 3) | R327–R329, R335–R357 | Zero-sequence: grounding and vector-group blocking cases vs an independent phase-domain model; Curve equations vs IEEE C37.112 / IEC 60255-151 closed forms (independent script); arc flash vs published cases; load flow vs an independent Python Newton–Raphson; IEEE 519 checks |
| 5 | Software, data, integration, UI and security audit + audit report; fix all critical / high | Section 72, I-03, I-06, I-12 | Module-by-module review (logic, numerical stability, innerHTML escaping, memory at 2,000 buses, dead code); axe-core + keyboard pass; data units / duplicates; write `REPORTS/AUDIT_REPORT.md`; fix and add regression tests |
| 6 | Research | Section 11 | Research register and benchmark matrix in `SOURCE_REGISTER.md`; count only sources actually read; public documentation only |
| 7 | Protection completion | R335–R337, R340–R342, D08, D17 (50/51/50G/51G) | Spec first (inputs, units, standard clause); multi-device selectivity, grading margin, coordination gap, curves clipped at available fault, transformer damage curve (IEEE C57.109) and inrush point, recloser–fuse; golden tests from closed-form equations |
| 8 | New protection functions | R338, R339 | Directional 67/67N and differential 87T/87B assessments; tests from textbook / manufacturer application examples |
| 9 | Interconnection protection | R353–R357, D16 | IEEE 1547-2018 categories for ride-through and grid support (Q(V), P(f)); 27/59/81, ROCOF; 32 reverse power; stand-alone zero / limited export check (I-08) |
| 10 | Duty and scenarios | R330, R331, R333, R334, I-15 | ANSI C37 items from the gap list in `REPORTS/B03_FAULT_AUDIT.md`; IEC 60909 partial-peak sum for non-meshed multi-source networks; Network-wide IEC 60909 max/min (cmax/cmin, KT); ANSI C37 momentary / interrupting; IEC Ib, Ith; inverter time response from datasheet data |
| 11 | Load flow and power quality | R346, R348, R350, D07, D14 | Unbalanced 3-phase 4-wire load flow (check against OpenDSS, free); inverter P–Q capability; harmonic frequency sweep and resonance scan |
| 12 | Platform | D02, D04, I-12 | Scenario manager; input hash, engine version, database revision on every result; typed contracts and STALE; reports with method, edition, versions |
| 13 | Final audit | all | Repeat batches 3–5 audits; 200-case challenge campaign (report the real count); end-to-end tests for P1–P5 |
| 14 | Final fixes and release | all | Fix findings; live-URL tests; complete MASTER_SPECIFICATION, DATA_DICTIONARY, SOURCE_REGISTER, TEST_MATRIX; release after owner approval |
| Later | Moves to shared services | conductor sizing, IEC 60287, network model / SLD, atlas | Only with identical-result regression tests |
| Low | D-05 items | I-10, I-11 (accepted) | Only if a real project needs it |

## Open issues and where they get fixed (from ISSUES.md)
| Issue | What | Batch |
|---|---|---|
| I-03 | One-line SVG symbols: accessible name vs visible text; nested focusable groups | 5 |
| I-06 | "Open this study in browser" depends on the old private cloud | 5 |
| I-08 | Export limit (R357) only inside the hidden BESS dispatch study; needs a stand-alone check | 9 |
| I-12 | Results do not carry input hash, engine version, database revision; no STALE | 12 |
| I-15 | IEC 60909 partial-peak sum for non-meshed multi-source networks | 10 |
| New database on live | see "Do this first" | before 4 |
| Accepted (no work) | I-10 phone click, I-11 very big SLD speed, I-14 Sitka is Windows-only, I-16 pandapower merges sources on one bus | — |
| Fixed | I-01, I-02, I-04, I-05, I-07, I-09, I-13 | — |

## Regression suite (run after every batch)
`QA/V29_QA_SCRIPTS`: `run_engine.mjs` + `compare.py` (numpy oracle), `seq_test.py`, `dc_test.py`, `physics.mjs`, `env_test.mjs` · `QA/V31_SCALE`: `cmp.mjs`, `dc_cmp.mjs`, `builder_test.mjs`, `compact_test.mjs` · `QA/V32_LOADFLOW/*` · `QA/V32_REPORT` (2 suites) · `QA/V32_ARCFLASH/oneline_equivalence.mjs` · `QA/V33_SOURCES/many_sources_cmp.mjs`, `watchdog_test.mjs` · `QA/V33_AUDIT/*` · `QA/V33_OPERATING_TABLE`, `QA/V33_EQUIPMENT_TABLE`, `QA/V33_INVERTER_DATA` · `QA/B03_FAULT_AUDIT/pandapower_crosscheck.py` (needs `pip install pandapower`) · browser: `QA/B03_FAULT_AUDIT/db_picker_browser.py`, `QA/B02_HOUSEKEEPING/b02_browser.py`, `QA/V33_VERIFY/a1_verify.py`, `QA/V33_SECURITY/*`, `QA/V33_UX/ux_widths.py`.

## Requirement status summary (from REQUIREMENTS.md)
- SOFTWARE TESTED (independent or published checks exist): R326–R329, R332, R343, R344, R346, R347.
- PARTIALLY IMPLEMENTED: R330, R331, R333–R337, R340–R342, R348, R350, R355, R357.
- IMPLEMENTED — NOT VERIFIED: R345, R349, R351, R352.
- NOT IMPLEMENTED: R338, R339, R353, R354, R356.
- ENGINEERING VALIDATED: none yet.
