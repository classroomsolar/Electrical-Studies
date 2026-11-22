# REMAINING WORK — Fault Current Studio (Electrical-Studies)

**This is the only .md file for this calculator.** It holds everything specific to Fault Current Studio: what is left and how (section 1), the current state, decisions, issues, requirements, database map, progress and history. State: after **Batch 3 (15 Nov 2026)**, repository commit `4cdfc9a` (19 Nov 2026). Updated 22 Nov 2026.

- Common rules, the development process, testing rules, report/output presentation and tools are in **Master Prompt V5.0** and are not repeated here.
- All 37 .md files of the repository (including the earlier version of this file) are copied word for word in the **Appendix (A1–A24)** at the end, so nothing is lost when those files are deleted. Sections 1–13 are the working record; the appendix is reference only.

**Reading order in every new session:** §1 Remaining work → §3 Decisions → §5 Requirements → §4 Issues.

## Contents
1. Remaining work (delivery rule, "do this first", owner actions, batch plan, open issues, requirement summary, regression suite, ANSI C37 gap list)
2. Project at a glance
3. Decisions (D-01 … D-10)
4. Issues (I-01 … I-16)
5. Requirements (R326–R357, D01–D17, scope items)
6. Database map
7. Progress and changelog (Batch 1–3)
8. Release history in short (V27 → V33)
9. Older backlog items and where they now sit
10. Repository layout, project files, running the tests
11. Design system in short
12. Third-party notices
13. Points to check (inconsistencies and missing references)

**Appendix A1–A24:** all other .md files of the repository, word for word (release reports V28–V33, audits, test results, database import, backlog, V29 parts 1/2/4, START_HERE, README, prior hand-off, design system, research survey and method register, all QA guides, the original record files).

---

## 1. Remaining work

*(State after Batch 3, 15 Nov 2026. Governing documents: Master Prompt V5.0 and `Fault_Current_Studio_prompt.md` — see §13 for where they are now.)*

### 1.0 How every batch is delivered (D-10)
1. Work one batch. Small, reversible changes. Nothing deleted; out-of-scope items are hidden.
2. Run the regression suite (§1.6) plus the batch's own tests.
3. Update this file (`REMAINING_WORK.md`): remaining work, requirements, issues, progress, changelog.
4. Deliver one ZIP (full `Electrical-Studies` folder, no `.git`) named `Fault_Current_Studio_Batch_NN_YYYY-MM-DD.zip`.
5. Live deploy only for code that passed tests, with checksum read-back. Database v13: owner approved on 15 Nov (D-08); upload is blocked (§1.1).

### 1.1 Do this first (before Batch 4) — new database on the live website
**State on 15 Nov:**
- GitHub `classroomsolar/engineering-master-database`: latest workbook `Engineering_Master_Database_Audited.xlsx`, SHA-256 `dcef1fb4…` (v13), commit `d5156de` (private material removed).
- Calculator package (`SITE/database/`): built from that same file. 50 sheets the calculator needs, 78 files, 4.9 MB, no voltage limit, no duplicate picker copies. Browser-tested (`QA/B03_FAULT_AUDIT/db_picker_browser.py` 6/6).
- **Note (22 Nov):** the `engineering-master-database` repository was re-created on 19 Nov (commit `5476f8a`); that workbook and commit `d5156de` are no longer in it. The package `SITE/database/` was already built from the v13 file, so the upload below does not need it.
- **Live website: still the OLD import** (19 Oct 2026, workbook SHA `cab11d…`, 93 sheets, 135 files). The new database never reached the website.
- The owner approved putting it live (15 Nov). The blocker is only the upload: the 78 database files are compressed binary files, and nothing in the AI's workspace can send them to Wix (sandbox shell blocked by the network allowlist; the Wix runtime cannot fetch GitHub or Wix Media; the Wix upload tool cannot read sandbox files; files too large to pass inline). Code files are not affected; they go live as text patches.

**Owner chooses one route:**
1. **Allow the network (recommended):** claude.ai → Settings → Capabilities → allowed domains: add `wixapis.com` and `wix.com` (more Wix hosts may be needed; an error will name them). Then the AI runs `npx @wix/cli login`, the owner opens the link and approves once, and the AI uploads.
2. **From the owner's PC:** the AI gives `FCS_database_v13_live.zip` (database folder + `database-reference-tables.mjs` + `public-bundle-v21.js`) and a small script. The owner runs `npx @wix/cli login` and the script. The script downloads the current live site, replaces only those files, removes the old database files, and uploads the merged site. (Older route, still in the repo: `DEPLOY/deploy_database_to_wix.py`; it checks the live site first and verifies every file after upload.)

**What the upload must do (either route):**
- Replace `database/` with the package `SITE/database/` (78 files) and delete the live database files that are not in it (old picker copies, the 46 sheets not needed).
- Replace `database-reference-tables.mjs` and `public-bundle-v21.js` (the live bundle differs from the package only in the database module).
- Keep every other live file.

**Check after upload:** live database view shows 50 sheets with the manifest row counts (CABLES 13,223; PV MODULES 39,400; IBR 5,603; HV BREAKERS 3,305 …); no failed request; picker loads `master-*` files only; worked example still 16.706 kA; owner's draft unchanged. Then record it in this file and in `RELEASE_STATE.json` (`database_v13_live: true`).

### 1.2 Other owner actions
- Upload each batch ZIP to GitHub (`classroomsolar/Electrical-Studies`). GitHub stays the home (D-01); the AI does not push. **Batch 3 package: uploaded** (commit `4cdfc9a`, 19 Nov 2026).
- Choose the database upload route (§1.1).
- Still missing (from the V29 backlog): the ~100 calculator spreadsheets from earlier chats and any project PDFs/images; `ENGINEERING_DATA/Original_Audited_Master_Database.xlsx`; the private v51 site; Batch 10–14 archives; the six Cable Thermal Studio reference workbooks; the NEC books (were in Dropbox, not reachable) — attach or upload them if they are needed.

### 1.3 Batch plan
| Batch | Content | Requirement / issue IDs | How |
|---|---|---|---|
| 1 ✅ | Phase 0 inventory: requirement map, database map, records | all | Done 15 Nov. See §7 |
| 2 ✅ | Housekeeping: BESS dispatch / sizing hidden, Sitka font, database keep list, Cloud Vault label, storage guards | D-04, D-07, D-09, I-04, I-05, I-07, I-09 | Done 15 Nov, live. Left over: PV modules stored twice (I-09), old font files on the live site (I-13) — both fixed in Batch 3 |
| 3 ✅ | Engineering audit 1 — fault engines | R326–R334, I-01, D05, D06 | Done 15 Nov, live. `REPORTS/B03_FAULT_AUDIT.md`: pandapower cross-check (Ik'' 231 buses, 0 fail); **peak was up to 23 % low in meshed networks → IEC 60909-0 method C added**; I-01 fixed (test generator); I-09 picker copies removed; I-13 unused live files deleted; I-10 / I-11 accepted (owner: phone and very big SLD low priority). Left over: zero-sequence path rules → Batch 4; ANSI C37 gap list and non-meshed partial peaks (I-15) → Batch 10 |
| 4 | Engineering audit 2 — protection, arc flash, load flow, harmonics (+ zero-sequence path rules from Batch 3) | R327–R329, R335–R357 | Zero-sequence: grounding and vector-group blocking cases vs an independent phase-domain model; curve equations vs IEEE C37.112 / IEC 60255-151 closed forms (independent script); arc flash vs published cases; load flow vs an independent Python Newton–Raphson; IEEE 519 checks |
| 5 | Software, data, integration, UI and security audit + audit report; fix all critical / high | Section 72, I-03, I-06, I-12 | Module-by-module review (logic, numerical stability, innerHTML escaping, memory at 2,000 buses, dead code); axe-core + keyboard pass; data units / duplicates; write `REPORTS/AUDIT_REPORT.md`; fix and add regression tests |
| 6 | Research | Section 11 | Research register and benchmark matrix in `SOURCE_REGISTER.md`; count only sources actually read; public documentation only (start from the earlier `REPORTS/research/calculator_survey.md` — 100 tools, Top-25 features — and `REPORTS/research/method_reference_register.md`) |
| 7 | Protection completion | R335–R337, R340–R342, D08, D17 (50/51/50G/51G) | Spec first (inputs, units, standard clause); multi-device selectivity, grading margin, coordination gap, curves clipped at available fault, transformer damage curve (IEEE C57.109) and inrush point, recloser–fuse; golden tests from closed-form equations |
| 8 | New protection functions | R338, R339 | Directional 67/67N and differential 87T/87B assessments; tests from textbook / manufacturer application examples |
| 9 | Interconnection protection | R353–R357, D16 | IEEE 1547-2018 categories for ride-through and grid support (Q(V), P(f)); 27/59/81, ROCOF; 32 reverse power; stand-alone zero / limited export check (I-08) |
| 10 | Duty and scenarios | R330, R331, R333, R334, I-15 | ANSI C37 items from the gap list in §1.7; IEC 60909 partial-peak sum for non-meshed multi-source networks; network-wide IEC 60909 max/min (cmax/cmin, KT); ANSI C37 momentary / interrupting; IEC Ib, Ith; inverter time response from datasheet data |
| 11 | Load flow and power quality | R346, R348, R350, D07, D14 | Unbalanced 3-phase 4-wire load flow (check against OpenDSS, free); inverter P–Q capability; harmonic frequency sweep and resonance scan |
| 12 | Platform | D02, D04, I-12 | Scenario manager; input hash, engine version, database revision on every result; typed contracts and STALE; reports with method, edition, versions |
| 13 | Final audit | all | Repeat batches 3–5 audits; 200-case challenge campaign (report the real count); end-to-end tests for P1–P5 |
| 14 | Final fixes and release | all | Fix findings; live-URL tests; complete MASTER_SPECIFICATION, DATA_DICTIONARY, SOURCE_REGISTER, TEST_MATRIX; release after owner approval |
| Later | Moves to shared services | conductor sizing, IEC 60287, network model / SLD, atlas | Only with identical-result regression tests |
| Low | D-05 items | I-10, I-11 (accepted) | Only if a real project needs it |

### 1.4 Open issues and where they get fixed
| Issue | What | Batch |
|---|---|---|
| I-03 | One-line SVG symbols: accessible name vs visible text; nested focusable groups | 5 |
| I-06 | "Open this study in browser" depends on the old private cloud | 5 |
| I-08 | Export limit (R357) only inside the hidden BESS dispatch study; needs a stand-alone check | 9 |
| I-12 | Results do not carry input hash, engine version, database revision; no STALE | 12 |
| I-15 | IEC 60909 partial-peak sum for non-meshed multi-source networks | 10 |
| New database on live | see §1.1 | before 4 |
| Accepted (no work) | I-10 phone click, I-11 very big SLD speed, I-14 Sitka is Windows-only, I-16 pandapower merges sources on one bus | — |
| Fixed | I-01, I-02, I-04, I-05, I-07, I-09, I-13 | — |

### 1.5 Requirement status summary (details in §5)
- SOFTWARE TESTED (independent or published checks exist): R326–R329, R332, R343, R344, R346, R347.
- PARTIALLY IMPLEMENTED: R330, R331, R333–R337, R340–R342, R348, R350, R355, R357.
- IMPLEMENTED — NOT VERIFIED: R345, R349, R351, R352.
- NOT IMPLEMENTED: R338, R339, R353, R354, R356.
- ENGINEERING VALIDATED: none yet.

### 1.6 Regression suite (run after every batch)
- `QA/V29_QA_SCRIPTS`: `run_engine.mjs` + `compare.py` (numpy oracle), `seq_test.py`, `dc_test.py`, `physics.mjs`, `env_test.mjs`
- `QA/V31_SCALE`: `cmp.mjs`, `dc_cmp.mjs`, `builder_test.mjs`, `compact_test.mjs`
- `QA/V32_LOADFLOW/*` · `QA/V32_REPORT` (2 suites) · `QA/V32_ARCFLASH/oneline_equivalence.mjs`
- `QA/V33_SOURCES/many_sources_cmp.mjs`, `watchdog_test.mjs` · `QA/V33_AUDIT/*` · `QA/V33_OPERATING_TABLE`, `QA/V33_EQUIPMENT_TABLE`, `QA/V33_INVERTER_DATA`
- `QA/B03_FAULT_AUDIT/pandapower_crosscheck.py` (needs `pip install pandapower`)
- Browser: `QA/B03_FAULT_AUDIT/db_picker_browser.py`, `QA/B02_HOUSEKEEPING/b02_browser.py`, `QA/V33_VERIFY/a1_verify.py`, `QA/V33_SECURITY/*`, `QA/V33_UX/ux_widths.py`
- After any UI change also: `QA/V30_UI_AUDIT/audit.py` at 5 widths. After any bundle patch: `QA/V29_QA_SCRIPTS/run_bundle.mjs` must equal `run_engine.mjs` (see `QA/V33_BUNDLE/README.md`: 7 modules are hand-edited and need `patch_segment.mjs`).

**Latest regression numbers (Batch 3):** oracle 936/0, sequence 1,200/0, DC 525/0, physics 14/14, envelope 19/19, sparse 637/0, DC sparse, load flow (3 suites), reports (2 suites + identity: only the new "Peak factor method" row differs), arc flash 5,201/0, many sources 4.8 M / 0, DC lean 219,581 / 0, watchdog 6/6, V33 audits 95/95, operating table 40/40, equipment table 13/13, inverter 6/6, builder 15/15, compact 0 fails; bundle = source 8,860 values. Browser: Batch 2 checks 14/14, database view 6/6, XSS 26/26, CSV formula pass, axe at 5 widths (only the known I-03 items).

### 1.7 ANSI / IEEE C37 gap list (for Batch 10; nothing implemented yet)
From the Batch 3 fault audit:
- Separate R and X networks for X/R (IEEE C37.010 / C37.5 method), not the complex-network X/R used now.
- First-cycle (momentary) network with the C37.010 machine reactance multipliers; momentary duty vs close-and-latch rating.
- Interrupting network (1.5–4 cycle) with machine multipliers; remote / local (NACD) multiplying factors from the C37.010 curves; contact-parting time per breaker.
- LV breaker duty per IEEE C37.13 (multiplying factor from X/R vs the test X/R of the breaker).
- Fuse duty per their test X/R.
- 30-cycle (time-delay relay) current.
- Each item needs its curve / table data from a lawful, free source before coding (no invented coefficients).
- IEC TR 60909-4 published example: not used (network data not freely available); pandapower was used instead.

## 2. Project at a glance

| Item | Value |
|---|---|
| Product | Fault Current Studio — browser calculator for connected-network fault, arc flash, cable and power-quality studies |
| Live site | https://headless-dlrpfrynayh-classroomsolar-140e.wix-site-host.com/ |
| Wix site (the only one; never create a new one) | metaSiteId `97613ac8-1f7d-4ecf-8fa4-2d589c387775` |
| Code home | GitHub `classroomsolar/Electrical-Studies` (D-01). The AI delivers one ZIP per batch; the owner uploads it. |
| Master database | GitHub `classroomsolar/engineering-master-database` → `02_Engineering_Master_Database/Engineering_Master_Database_Audited.xlsx`, v13, SHA-256 `dcef1fb4a8b00edbfb5e420dc4e76e6f4a8975cd0599e2f3c7902c4ee44f9f52`, commit `d5156de` (private material removed) |
| Code on live site | V33 + Batch 2 + Batch 3 (live 15 Nov 2026, every file read back by checksum) |
| Database on live site | **Old import** (19 Oct 2026, workbook SHA `cab11d…`, 93 sheets, 135 files). v13 is approved (D-08, 15 Nov) but **not uploaded** — see §1.1 |
| Package `SITE/` | 273 site files at V33 (`RELEASE_STATE.json`, `QA/V33_SHA256_Manifest.json`); database package after Batch 3: 50 sheets, 4.9 MB |
| Code edition | NEC 2023 and the standards it references (D-02); MV studies up to 35 kV class (D-03) |
| Fonts | Sitka Text / Sitka Heading by name, Georgia / serif fallback, system monospace (D-09). No font files shipped |
| Worked example (must not change) | 3,400 A at 12 kV · 32,725.858 A at 208 V transformer secondary · 16,706.173 A at main panel (shown as 16.706 kA) |
| Engineering status | Screening calculations. No requirement is ENGINEERING VALIDATED yet. No IEEE/IEC certification is claimed |
| Tools policy | Free tools only (pandapower, OpenDSS, Python, numpy) — D-06 |

## 3. Decisions

| ID | Date | Decision | Reason / note |
|---|---|---|---|
| D-01 | 2026-11-15 | GitHub is the home of the code. Until access is set up, the AI delivers one ZIP per batch and the owner uploads it. | Owner. Replaces the older "no GitHub" rule. |
| D-02 | 2026-11-15 | Code edition: NEC 2023 and the standards it references. | Owner (Master Prompt Appendix F item 1). |
| D-03 | 2026-11-15 | MV upper limit stays at the 35 kV class for the studies. The database is **not** filtered by voltage (owner, 15 Nov: "database me 35 kV ki limitation mat laga"). | Owner (Appendix F item 6). |
| D-04 | 2026-11-15 | Generator and BESS stay as equipment and sources in the network model and in all studies (fault, load flow, protection, arc flash, duty). Generator sizing and BESS sizing, charging, discharging and dispatch studies are out of scope and are hidden, not deleted. | Owner: they affect whole-system results. **Conflict:** Master Prompt V5.0 Section 16 excludes generators as sources. The owner's current instruction has precedence (Master Prompt "Precedence" rule 1). Do not remove generator or BESS code. |
| D-05 | 2026-11-15 | Phone layout and edit speed on very large one-lines (about 2,000 buses) are low priority. | Owner: phone users can zoom; large one-lines are not the normal case. |
| D-06 | 2026-11-15 | No paid tools or licences. Independent checks use free tools (pandapower, OpenDSS, Python). | Owner: the calculator is free. |
| D-07 | 2026-11-15 | Take from the master database only the tables this calculator needs (see §6). Motors stay. | Owner. |
| D-08 | 2026-11-14 | Database v13 goes live only after the owner approves. **Approved 15 Nov 2026** (upload still blocked, §1.1). | Owner (repeated). |
| D-09 | 2026-11-15 | Font: Sitka, referenced by name only (Windows system font, not bundled). AI chose Sitka Heading for headings and Sitka Text for body text, with Georgia / serif fallback. | Owner: "koi sa bhi". Sitka Text reads better at small sizes. |
| D-10 | 2026-11-15 | Work goes in batches. After every batch: one ZIP with all files and the remaining-work list stating what is left and how to do it. | Owner (limited data). |

**Calculator-specific rules carried over (still apply):** do not restart or overwrite working features, formulas, dropdowns, saved-study formats or reports; add new studies as add-on modules; deploy only to the original Wix site, upload only checksum-verified files and read every changed file back after upload; never create a new Wix site. (The general rules — never invent data, cite sources, honest status — are in Master Prompt V5.0.)

## 4. Issues

Severity: Critical / High / Medium / Low. Status: OPEN / FIXED / ACCEPTED.

| ID | Severity | Area | Issue | Evidence | Next step | Status |
|---|---|---|---|---|---|---|
| I-01 | Medium | Test cases | 21 of 25 `parallel_tap` oracle cases were refused ("bus voltages must match their assigned transformer winding voltages"). Cause: `gen.py` put the tap into the nameplate voltage; the engine rule (nameplate = bus voltage, tap in `tapPercent`) is right. | `REPORTS/B03_FAULT_AUDIT.md` F-05 | Batch 3: `gen.py` writes `tapPercent`; oracle 936 / 0, nothing refused | FIXED |
| I-02 | High | Privacy | The public database repo contained a private personal project. | Repo listing | Owner removed it on GitHub (15 Nov); the AI deleted its local copy | FIXED |
| I-03 | Medium | Accessibility | One-line SVG symbols: accessible name does not contain visible text (WCAG 2.5.3); focusable groups nested (4.1.2). | `QA/V33_UX/results/ux_widths.json` | Fix in audit-fix batch (Batch 5) | OPEN |
| I-04 | Medium | Accessibility | Cloud Vault `#fcs-original-backup` file input has no label. | same | Label added (Batch 2); axe `label` finding gone at all 5 widths | FIXED (live) |
| I-05 | Low | Robustness | `localStorage.setItem` without try/catch in several modules. | `REPORTS/V33_Audit_Report.md` | Batch 2: the two places where a full storage could hide a result or a new Cloud Vault recovery code are guarded; the others are inside try/catch blocks that show the error | FIXED (live) |
| I-06 | Medium | Function | "Open this study in browser" depends on the old private cloud. | V33 backlog D3 | Make it work or hide with a message (Batch 5) | OPEN |
| I-07 | Medium | Scope | BESS dispatch and BESS size/cost sensitivity visible (D-04). | `operations-v27*.mjs` | Hidden in Batch 2 (tabs hidden, saved / imported BESS scenarios refused with a scope note; code kept); `QA/B02_HOUSEKEEPING/b02_browser.py` 14/14; live checked | FIXED (live) |
| I-08 | Medium | Scope | R357 export limit exists only inside the BESS dispatch study that is hidden. | `operations-v27.mjs` | Build a stand-alone export check (R357), Batch 9 | OPEN |
| I-09 | Low | Data | `pv_modules` (and 12 other sheets + `cable-picker`) stored twice. 47 unneeded tables. | §6 | Batch 2: 46 tables removed. Batch 3: the 14 picker copies removed (the picker reads `master-*`); `QA/B03_FAULT_AUDIT/db_picker_browser.py` 6/6 (package only, D-08) | FIXED (package) |
| I-10 | Low | UI (D-05) | Phone emulation, Operating studies, 1,970 buses: mouse click on fill-zero button times out with `operating-table-ui-v33.mjs`; tap works. | `QA/V33_VERIFY` | Owner (15 Nov): phone users zoom; phone layout not needed. Tap works | ACCEPTED |
| I-11 | Low | Speed (D-05) | Add equipment about 5 s and Z-tolerance envelope about 6 s on 1,970-bus one-line. | `QA/V33_PERF` | Owner (15 Nov): slow only matters on very big one-lines; small systems are fast. Revisit in Batch 13 if a real project is slow | ACCEPTED (watch) |
| I-12 | Medium | Traceability | Results do not carry input hash, engine version or database revision; no STALE tracking. | Code search | Platform batch (Batch 12) | OPEN |
| I-13 | Low | Housekeeping | Old font files and other unused files on the live site. | Live file list | Owner said delete everything unused: 16 files deleted from live (fonts, `legacy-app.mjs`, old CSS, notice text); all views checked, no HTTP error | FIXED (live) |
| I-14 | Low | UI | Sitka is a Windows font. On Mac / Linux / Android the page falls back to Georgia / serif. | Browser check | Accept (D-09) or choose a cross-platform stack | ACCEPTED |
| I-15 | Medium | Engineering (R334) | Non-meshed networks with several sources: IEC 60909-0 §4.3.1.1 sums partial peaks per branch; the engine uses one κ from the total X/R (meshed networks now use method C). | `REPORTS/B03_FAULT_AUDIT.md` F-04 | Batch 10 | OPEN |
| I-16 | Info | Engineering (R334) | Several sources on one bus: pandapower peak up to 4.2 % above the engine because pandapower merges them into one grid; the engine keeps them separate (follows the drawing). | `REPORTS/B03_FAULT_AUDIT.md` F-03 | None | ACCEPTED |

## 5. Requirements (Master Prompt V5.0, Group 14)

Batch 1 (Phase 0, read-only), 15 Nov 2026, with Batch 3 updates. Evidence = files in `SITE/` and tests in `QA/` that were inspected or **run on 15 Nov 2026** (marked ▶). Older test counts that were not rerun are marked "historical".

Status uses Master Prompt Section 57: NOT IMPLEMENTED · PARTIALLY IMPLEMENTED · IMPLEMENTED — NOT VERIFIED · SOFTWARE TESTED · ENGINEERING VALIDATED · DEPLOYED. "DEPLOYED" means the code is on the live Wix site; it says nothing about validation. No requirement is ENGINEERING VALIDATED yet: published-case checks exist for some (noted), but the engineering review of Section 72 has not been done.

P1–P5 applicability (proposed, owner to confirm): R = REQUIRED, C = CONDITIONAL (condition given), NA = NOT APPLICABLE.

### 5.1 Tests run on 15 Nov 2026 (▶, Batch 1)
| Test | Kind | Result |
|---|---|---|
| `QA/V29_QA_SCRIPTS/oracle.py` + `compare.py` (numpy nodal-admittance oracle written separately from the JS engine) | Independent | 873 bus comparisons of total current, X/R and 798 peak values, 0 mismatches at 1e-6. 21 of 220 cases rejected by the engine input check (I-01). **After Batch 3: 936 totals / 861 peaks, 0 mismatches, 0 refused** |
| `QA/V29_QA_SCRIPTS/seq_test.py` (phase-domain oracle, not symmetrical components) | Independent | 400 cases, 1,200 phase comparisons, 0 mismatches |
| `QA/V29_QA_SCRIPTS/dc_test.py` | Independent | 525 DC bus comparisons, 0 mismatches |
| `QA/V29_QA_SCRIPTS/physics.mjs` | Analytic | 14 / 14 |
| `QA/V29_QA_SCRIPTS/env_test.mjs` (transformer %Z envelope, V28 reference values) | Regression | 19 / 19 |
| `QA/V31_SCALE/cmp.mjs` (sparse vs dense, 637 cases) | Same-engine comparison | 0 bad, worst 1.3e-12 |
| `QA/V33_SOURCES/many_sources_cmp.mjs` | V33 vs V32 engine | 4,818,941 values, 0 differences |
| `QA/V32_LOADFLOW/*` (sparse vs dense 400, switch merge, plant) | Same-engine comparison | All pass |
| `QA/V33_AUDIT/ieee1584_published.mjs` | Published (Eaton ESW2020-45, IEEE 1584 Annex D) | 21 / 21 |
| `QA/V33_AUDIT/iec60909_published.mjs` | Published (Schneider EIG G71, EasyPower slides, IEC 60909-0 eq. 55) | 28 / 28 |
| `QA/V33_AUDIT/tables_published.mjs` | Published tables (IEEE 519-2014, NEC 2023) | 46 / 46 |
| `QA/V32_ARCFLASH/oneline_equivalence.mjs`, `QA/V32_REPORT/*` (2 suites), `QA/V31_SCALE/builder_test.mjs`, `compact_test.mjs`, `dc_cmp.mjs` | Software | All pass |
| `QA/V33_VERIFY/a1_verify.py` (browser, desktop + phone) | Software | 122 pass, 3 fail, 2 not tested |
| `QA/V33_SECURITY/*` | Software | Pass |
| `QA/B03_FAULT_AUDIT/pandapower_crosscheck.py` (Batch 3) | Independent (free IEC 60909 code) | Ik'' 231 buses / 49 cases, 0 fail, worst 1.0·10⁻⁷ |

### 5.2 Group 14 requirements
| ID | Requirement | Code (file → function) | Tests / evidence | Status | P1 P2 P3 P4 P5 | Gap |
|---|---|---|---|---|---|---|
| R326 | Three-phase short circuit | `network-engine.mjs` → `calculateProject`, `calculateBus`, `sparseFactor`; `multi-source-fault-network.mjs`, `multi-voltage-fault-network.mjs` | ▶ numpy oracle 936/0; ▶ physics 14/14; ▶ published radial cases 28/28; ▶ pandapower IEC 60909 231 buses, worst 1.0·10⁻⁷ (Batch 3) | SOFTWARE TESTED, DEPLOYED | R R R R R | IEC TR 60909-4 example data not available free; pandapower used |
| R327 | SLG fault | `connected-sequences.mjs` → `calculateConnectedProject`; `multibus-sequence-fault-network.mjs`; `sequence-fault-screen.mjs` | ▶ phase-domain oracle 1,200/0 (reduced networks); browser 2,000-bus SLG pass (historical V32) | SOFTWARE TESTED, DEPLOYED | R R R R R | No published example; zero-sequence path rules (Section 35) to audit (Batch 4) |
| R328 | LL fault | same as R327 | ▶ phase-domain oracle | SOFTWARE TESTED, DEPLOYED | R R R R R | As R327 |
| R329 | LLG (DLG) fault | `dlg-fault.mjs` → `calculateDlg`; `connected-sequences.mjs` | ▶ phase-domain oracle | SOFTWARE TESTED, DEPLOYED | R R R R R | As R327 |
| R330 | Maximum-fault scenario | `iec60909-transformer-scenarios.mjs` → `transformerNameplateFaultEnvelope` (c-factors, KT, radial only); `fault-envelope-v29.mjs` → `transformerToleranceEnvelope` (±7.5 % %Z); `fault-scenario-envelope.mjs` (user-defined cases); `fault-bus-sweep.mjs` | ▶ env_test 19/19 (±7.5 % %Z envelope); ▶ kappa / radial published checks | PARTIALLY IMPLEMENTED, DEPLOYED | R R R R R | No network-wide IEC 60909 maximum (cmax on every bus, KT on every transformer) |
| R331 | Minimum-fault scenario | as R330 (cmin in radial envelope; user scenarios) | Historical | PARTIALLY IMPLEMENTED, DEPLOYED | R R R R R | No network-wide minimum (cmin, minimum source, conductor temperature) |
| R332 | Utility-source contribution | `network-engine.mjs` source contributions (`kind:'utility'`) | ▶ oracle (per-source totals) | SOFTWARE TESTED, DEPLOYED | R R R R R | Source data rules (Section 35: never invent utility data) to audit in UI |
| R333 | Inverter-source contribution | `network-engine.mjs` (`model:'current'`, grouped unknown-angle sources → SCREENING BOUND); `plant-builder.mjs` equipment table `fault_A`, `angle_deg` | ▶ `QA/V33_INVERTER_DATA` 6/6; ▶ many-sources 4.8 M values | PARTIALLY IMPLEMENTED, DEPLOYED | R R R R R | Time-dependent response (duration, decay), datasheet record fields |
| R334 | Equipment short-circuit duty | `network-engine.mjs` → `deviceDuty`; `iec60909-peak-network.mjs` → `peakMakingNetworkScreen` (κ method C); `asymmetrical-waveform-duty.mjs`; `time-varying-current-duty.mjs`; `fault-envelope-v29.mjs` → `nec11024Label` | ▶ κ published 28/28 (part); ▶ IEC 60909-0 method C κ for meshed networks (Batch 3): oracle 861 peaks / 0, pandapower 213 buses within 5·10⁻⁷ | PARTIALLY IMPLEMENTED, DEPLOYED | R R R R R | Non-meshed multi-source partial peaks (I-15); ANSI C37 momentary / interrupting multiplying factors; IEC Ib and Ith |
| R335 | TCC plotting and coordination | `clearing-time-v29.mjs` (IEC 60255-151, IEEE C37.112, manufacturer points, LSI); `manufacturer-tcc.mjs`; `protection-study.mjs` (two devices); `protection-full-range.mjs`; `tcc-library-v29.mjs`; `protection-workspace.mjs` → `nominalTccSvg` | Historical 1,799 OCPD checks (not rerun) | PARTIALLY IMPLEMENTED, DEPLOYED | R R R R C (P5: only where more than one device in series) | Multi-device selectivity, grading margin, coordination gap, curve clipped at available fault |
| R336 | Overcurrent protection assessment | as R335 | Historical | PARTIALLY IMPLEMENTED, DEPLOYED | R R R R R | Automatic pickup / setting checks against load and fault |
| R337 | Ground-fault protection assessment | SLG results only (R327); no 50G/51G device check found | — | PARTIALLY IMPLEMENTED | R R R R C (P5: GFP where code requires) | 50G/51G/51N pickup, sensitivity at minimum SLG |
| R338 | Directional protection | none found | — | NOT IMPLEMENTED | R R C C NA | Whole function (67/67N) |
| R339 | Differential protection | none found | — | NOT IMPLEMENTED | R R C C NA | Whole function (87T/87B) |
| R340 | Transformer protection coordination | devices + curves (R335); no transformer damage or inrush curve found | — | PARTIALLY IMPLEMENTED | R R R R NA | Damage curve (IEEE C57.109), inrush point, primary/secondary coordination |
| R341 | Feeder protection coordination | `protection-study.mjs` → `compareProtectionPair` | Historical | PARTIALLY IMPLEMENTED | R R R R NA | Multi-device feeder chains |
| R342 | Recloser–fuse coordination | recloser devices in one-line / arc-flash picker; no coordination logic found | — | PARTIALLY IMPLEMENTED | C C C C NA (C: where a utility recloser is in the study) | Fast/slow curve vs fuse-saving / fuse-blowing check |
| R343 | Arc-flash incident energy | `ieee1584-2018.mjs` → `ieee1584Calculate`; `arcflash-network-v29.mjs` → `networkArcFlashStudy` | ▶ published 21/21; ▶ one-line equivalence; historical 105,120 IEEE cases | SOFTWARE TESTED, DEPLOYED | R R R R C (P5: where labels are required) | Section 72 engineering review |
| R344 | Arc-flash boundary | same | ▶ published 21/21 | SOFTWARE TESTED, DEPLOYED | R R R R C | As R343 |
| R345 | Arc-flash clearing time | `clearing-time-v29.mjs` → `arcFlashClearingTimes` (from device model only) | ▶ a1 browser (typed clearing times: not tested on 2,000-bus plant) | IMPLEMENTED — NOT VERIFIED, DEPLOYED | R R R R C | Independent check of curve evaluation |
| R346 | Load flow | `operating-studies.mjs` → `solveSparsePowerFlow`, `solveBalancedPowerFlow`; `contingency-power-flow.mjs` (N-1); `operations-v27.mjs` → `evaluateAcTimeSeries` | ▶ sparse vs dense 400; ▶ switch merge; historical 300-network π oracle | SOFTWARE TESTED (balanced), DEPLOYED | R R R R R | Unbalanced (per-phase, 4-wire) load flow |
| R347 | Voltage profile | from R346 results | ▶ via R346 | SOFTWARE TESTED, DEPLOYED | R R R R R | Limits per jurisdiction (ANSI C84.1) as a check |
| R348 | Reactive power | PV-bus Q limits in `operating-studies.mjs` | ▶ via R346 | PARTIALLY IMPLEMENTED, DEPLOYED | R R R R C | Q capability of inverters (P–Q curve), plant Q requirement at POI |
| R349 | Power factor | `power-quality-v29.mjs` → `pfCorrection` | — | IMPLEMENTED — NOT VERIFIED, DEPLOYED | R R R R C | Independent test |
| R350 | Harmonic assessment | `harmonic-network.mjs` → `solveHarmonicNetwork`; `power-quality-v29.mjs` → `ieee519Check`, `currentLimitRow` | ▶ IEEE 519 tables 46/46 | PARTIALLY IMPLEMENTED, DEPLOYED | R R R R C | Frequency sweep, resonance scan |
| R351 | Voltage rise | load flow; `power-quality-v29.mjs` (rise check) | — | IMPLEMENTED — NOT VERIFIED, DEPLOYED | R R R R R | Independent test |
| R352 | Voltage drop | load flow; `cable-sizing-v29.mjs` → `sizeConductor` | Historical 1,500 conductor cases | IMPLEMENTED — NOT VERIFIED, DEPLOYED | R R R R R | Rerun and independent test |
| R353 | Grid-support capability | none found | — | NOT IMPLEMENTED | R R R R R | Q(V), P(f), PF modes (IEEE 1547-2018) |
| R354 | Ride-through requirement | none found | — | NOT IMPLEMENTED | R R R R R | Voltage / frequency ride-through categories (IEEE 1547-2018) |
| R355 | Reverse-power flow | branch flow direction from load flow only | ▶ via R346 | PARTIALLY IMPLEMENTED | R R R R R | 32 relay assessment, minimum-load case |
| R356 | Loss-of-mains protection | none found | — | NOT IMPLEMENTED | R R R R R | 27/59/81O/81U, ROCOF, vector shift |
| R357 | Zero-export control and protection | export limit only inside the BESS dispatch study (`operations-v27.mjs`), which is hidden (D-04) | — | PARTIALLY IMPLEMENTED | C C C C C (C: zero- or limited-export interconnection) | Stand-alone export-limit and 32 protection check; must not depend on the hidden BESS study |

### 5.3 Requirements from earlier documents (D01–D17)
| ID | Requirement | Status | Evidence / gap |
|---|---|---|---|
| D01 | 2,000-bus performance, C1–C6 | PARTIALLY IMPLEMENTED | C1, C3, C4, C6 done in V33; C2 and C5 about 5–6 s (low priority, D-05) |
| D02 | Inputs workspace, SLD page, dashboard, database, studies, history, reports | PARTIALLY IMPLEMENTED | `studio-workspace.mjs`, `one-line-editor.mjs`, `project-history.mjs`, reports; no scenario manager |
| D03 | SLD editor features | IMPLEMENTED — NOT VERIFIED | `one-line-editor.mjs`; browser suites pass; accessibility findings open |
| D04 | PDF / XLSX / CSV / JSON reports match screen | SOFTWARE TESTED | ▶ `QA/V32_REPORT` parity suites; no input hash / engine version on results yet |
| D05 | All fault types, IEC 60909 and separate ANSI/IEEE | PARTIALLY IMPLEMENTED | See R326–R334; ANSI C37 duty missing (gap list in §1.7) |
| D06 | 65 kA vs 56 kA defect; transformer LV current base | SOFTWARE TESTED | ▶ `env_test.mjs` reproduces 3,400 / 32,725.858 / 16,706.173 A (19/19); ▶ 25 zero-impedance-link oracle cases (the 65/56 kA class) in `cases.json` pass |
| D07 | Load flow: balanced, unbalanced, PQ/PV/slack, taps, losses, N-1, time series, DC | PARTIALLY IMPLEMENTED | Unbalanced missing; DC load flow not found |
| D08 | Protection: OEM curves, CT/PT, OC, ground, directional, differential, voltage, frequency, grading, damage | PARTIALLY IMPLEMENTED | See R335–R342, R356 |
| D09 | IEEE 1584-2018, clearing time from real curves, labels, no invented PPE | SOFTWARE TESTED | See R343–R345 |
| D10 | Harmonics THD/TDD, IEEE 519 PCC, resonance, heating | PARTIALLY IMPLEMENTED | See R350; filter design excluded |
| D11 | Live verification | PARTIALLY IMPLEMENTED | Desktop live checks done in V33; phone low priority |
| D12 | Authentic-source audit | PARTIALLY IMPLEMENTED | 95 published values (V33_AUDIT); rest in Step 1 |
| D13 | Code audit, UI audit | PARTIALLY IMPLEMENTED | Automated parts only (V33 audit report); Batch 2 rerun: 2 axe rule types left (one-line SVG) |
| D14 | Unbalanced load flow; table connection editing; inverter fault data | PARTIALLY IMPLEMENTED | Connection editing and fault data done (V33); unbalanced missing |
| D15 | Short circuit, protection, CT/PT, relay logic, arc flash | PARTIALLY IMPLEMENTED | CT/PT models not found in the engine (CT saturation, ratio) |
| D16 | PPC/EMS: export/import, ramp, Q(V), P(f) | NOT IMPLEMENTED | Same as R353 |
| D17 | Device functions 50/51/50G/51G/67/87/27/59/59N/32/46/47/49/81/86 | PARTIALLY IMPLEMENTED | 50/51 only (curves); others missing |

### 5.4 Scope items (owner decision D-04)
| Item | Where | Decision |
|---|---|---|
| Generator as source and equipment | `network-model.mjs`, `network-engine.mjs`, `connected-sequences.mjs`, `one-line-editor.mjs`, `database/generators` | Keep |
| BESS as equipment / inverter source | IBR sources, `database/master-batteries` | Keep |
| BESS dispatch (peak shaving, self-consumption, charge / discharge) | `operations-v27.mjs` → `evaluateBessDispatch`; UI `operations-v27-ui.mjs` | Hidden (Batch 2, live) |
| BESS size / cost sensitivity (includes tariffs and net cost) | `operations-v27.mjs` → `compareBessSizeCases` | Hidden (Batch 2, live) |
| Time-series AC load flow | `operations-v27.mjs` → `evaluateAcTimeSeries` | Keep (R346) |

## 6. Database map — what Fault Current Studio takes from the master database

Batch 1, 15 Nov 2026, updated Batch 3. Source: `classroomsolar/engineering-master-database` → `02_Engineering_Master_Database/Engineering_Master_Database_Audited.xlsx`, library master v13, SHA-256 `dcef1fb4a8b00edbfb5e420dc4e76e6f4a8975cd0599e2f3c7902c4ee44f9f52` (checksum verified 15 Nov 2026). Full v13 import history and sheet row counts were in `REPORTS/V29d_Database_v13_Import.md`.

At Batch 1 the package folder `SITE/database/` held the prepared v13 import: 111 files, 96 of 117 sheets (only the 21 `CEC_*` sheets left out). Owner decision D-07: take only what this calculator needs.

**How the site reads them:** equipment pickers are listed in `database/manifest.json` (`network-app.mjs` loads it; `public-catalog-loader.mjs` serves the gzip `.json.txt` files). `master-*` files are read by the master library browser (`master-database.mjs`, `manufacturer-library.mjs`) and a few calculators (cable sizing). Since Batch 3 the pickers also read the `master-*` file of their sheet.

### 6.1 Keep list (Batch 1: 65 files, 7.6 MB gzip)
Rows marked † are the picker copies that **Batch 3 removed** (I-09); the picker now reads the matching `master-*` file.

| File | Used for |
|---|---|
| † `cable-picker.json.txt` | cable picker |
| † `cable_impedance_defaults.json.txt` | cable R/X defaults |
| † `cables.json.txt` | cable picker (records) |
| † `disconnects.json.txt` | disconnect picker |
| † `fuses.json.txt` | fuse picker |
| † `generators.json.txt` | generator picker (D-04 keep) |
| † `hv_breakers.json.txt` | MV breaker picker (note: no voltage filter, D-03) |
| † `ibr.json.txt` | inverter / BESS inverter picker |
| † `lv_breakers.json.txt` | LV breaker picker |
| `manifest.json.txt` | picker index |
| `master-ampacity_ambient_factors.json.txt` | reference table: ampacity ambient factors |
| `master-ampacity_ccc_factors.json.txt` | reference table: ampacity ccc factors |
| `master-ampacity_parameters.json.txt` | reference table: ampacity parameters |
| `master-ampacity_routes.json.txt` | reference table: ampacity routes |
| `master-batteries.json.txt` | reference table: batteries (equipment ratings only, D-04) |
| `master-breaker_lugs.json.txt` | reference table: breaker lugs |
| `master-cable_fault_current_reference.json.txt` | reference table: cable fault current reference |
| `master-cable_impedance_defaults.json.txt` | reference table: cable impedance defaults |
| `master-cable_sc_k_factors.json.txt` | reference table: cable sc k factors |
| `master-cable_types.json.txt` | reference table: cable types |
| `master-cables.json.txt` | reference table: cables |
| `master-conductor_materials.json.txt` | reference table: conductor materials |
| `master-conductor_properties.json.txt` | reference table: conductor properties |
| `master-conductor_sizes.json.txt` | reference table: conductor sizes |
| `master-csd_devices.json.txt` | reference table: csd devices |
| `master-data_issues.json.txt` | reference table: data issues (provenance shown with records) |
| `master-database_table_index.json.txt` | reference table: database table index (provenance shown with records) |
| `master-disconnects.json.txt` | reference table: disconnects |
| `master-egc_size_by_ocpd.json.txt` | reference table: egc size by ocpd |
| `master-egc_size_thresholds.json.txt` | reference table: egc size thresholds |
| `master-electronic_controllers.json.txt` | reference table: electronic controllers |
| `master-fuses.json.txt` | reference table: fuses |
| `master-generators.json.txt` | reference table: generators |
| `master-harmonics.json.txt` | reference table: harmonics |
| `master-hv_breakers.json.txt` | reference table: hv breakers (kept whole — owner: no voltage limit on data) |
| `master-hv_breakers_extended.json.txt` | reference table: hv breakers extended (kept whole — owner: no voltage limit on data) |
| `master-ibr.json.txt` | reference table: ibr |
| `master-instrument_transformers.json.txt` | reference table: instrument transformers |
| `master-insulation_classes.json.txt` | reference table: insulation classes |
| `master-lv_breakers.json.txt` | reference table: lv breakers |
| `master-model_requirements.json.txt` | reference table: model requirements (provenance shown with records) |
| `master-motor_characteristics.json.txt` | reference table: motor characteristics |
| `master-motor_locked_rotor_codes.json.txt` | reference table: motor locked rotor codes |
| `master-motor_models.json.txt` | reference table: motor models |
| `master-motors_nameplate.json.txt` | reference table: motors nameplate |
| `master-nec_ampacity_2023.json.txt` | reference table: nec ampacity 2023 |
| `master-neutral_grounding_resistors.json.txt` | reference table: neutral grounding resistors |
| `master-overload_heaters.json.txt` | reference table: overload heaters |
| `master-protection_curves.json.txt` | reference table: protection curves |
| `master-pv_modules.json.txt` | reference table: pv modules |
| `master-pv_optimizers.json.txt` | reference table: pv optimizers |
| `master-reclosers.json.txt` | reference table: reclosers |
| `master-relays.json.txt` | reference table: relays |
| `master-source_register.json.txt` | reference table: source register (provenance shown with records) |
| `master-surge_arresters.json.txt` | reference table: surge arresters |
| `master-switchgear.json.txt` | reference table: switchgear |
| `master-terminations.json.txt` | reference table: terminations |
| `master-transformers.json.txt` | reference table: transformers |
| `master-transmission_conductors.json.txt` | overhead line conductors (also used for MV lines; owner: no voltage limit on data) |
| `master-trip_devices.json.txt` | reference table: trip devices |
| † `motors_nameplate.json.txt` | motor picker (owner: keep) |
| † `pv_modules.json.txt` | PV module picker (DC arrays) |
| † `reclosers.json.txt` | recloser picker |
| † `switchgear.json.txt` | switchgear picker |
| † `transformers.json.txt` | transformer picker |

### 6.2 Drop list (46 files, 2.3 MB gzip)
| File | Reason |
|---|---|
| `master-audit_readme.json.txt` | workbook notes |
| `master-battery_performance.json.txt` | BESS charge/discharge curves (study out of scope, D-04) |
| `master-box_fill.json.txt` | Vault calculator |
| `master-cable_cleat_size_map.json.txt` | Cable_Tray calculator |
| `master-cable_cleat_sizes.json.txt` | Cable_Tray calculator |
| `master-cable_cleats.json.txt` | Cable_Tray calculator |
| `master-cable_normalization.json.txt` | import helper, duplicate of cables |
| `master-cable_planning_defaults.json.txt` | planning defaults for other calculators |
| `master-cable_tray_equipment.json.txt` | Cable_Tray calculator |
| `master-cable_trays.json.txt` | Cable_Tray calculator |
| `master-calculator_key_audit.json.txt` | audit log |
| `master-change_log.json.txt` | workbook audit log |
| `master-conduit_fire_protection.json.txt` | Cable_Tray calculator |
| `master-conduits.json.txt` | Cable_Tray calculator |
| `master-enclosures.json.txt` | Vault calculator |
| `master-equipment_record_history.json.txt` | audit log |
| `master-field_audit.json.txt` | audit log |
| `master-fire_protection.json.txt` | not electrical design scope |
| `master-ground_electrodes.json.txt` | Grounding calculator |
| `master-interruption_cost.json.txt` | cost data (financial, excluded) |
| `master-legacy_nec_reference.json.txt` | older NEC reference (D-02) |
| `master-nec_ampacity_2020.json.txt` | NEC 2023 chosen (D-02) |
| `master-nec_channel_tray_fill.json.txt` | Cable_Tray calculator |
| `master-nec_tray_fill.json.txt` | Cable_Tray calculator |
| `master-numeric_benchmarks.json.txt` | workbook test values |
| `master-optimizer_review.json.txt` | audit log |
| `master-paper_audit.json.txt` | audit log |
| `master-parts_catalog.json.txt` | accessories for other calculators |
| `master-plugin_log.json.txt` | audit log |
| `master-pv_unit_review.json.txt` | audit of PV records (duplicate of pv_modules) |
| `master-railway_loads.json.txt` | not PV scope |
| `master-record_reconciliation.json.txt` | audit log |
| `master-rectifiers.json.txt` | not PV scope |
| `master-reliability.json.txt` | reliability indices (not Group 14) |
| `master-reliability_extended.json.txt` | as above |
| `master-request_audit.json.txt` | audit log |
| `master-research_guidance.json.txt` | notes |
| `master-sheet_map.json.txt` | workbook map |
| `master-tray_accessory_rules.json.txt` | Cable_Tray |
| `master-tray_barrier_cover_codes.json.txt` | Cable_Tray |
| `master-tray_egc_area_thresholds.json.txt` | Cable_Tray |
| `master-tray_egc_metal_area.json.txt` | Cable_Tray |
| `master-tray_engineering_defaults.json.txt` | Cable_Tray |
| `master-tray_expansion_rules.json.txt` | Cable_Tray |
| `master-tray_grounding_accessories.json.txt` | Cable_Tray |
| `master-tray_width_codes.json.txt` | Cable_Tray |

### 6.3 What was done to the import
- **Batch 2:** drop list applied with `QA/B02_HOUSEKEEPING/db_whitelist.py` (reproducible): 65 files, 7.7 MB; 50 of 117 sheets served. No record filtering inside tables (owner, 15 Nov: no 35 kV limit on data; a 38 kV filter on MV breakers was tried and removed again). Master library shows "50 of 117 sheets". Package only.
- **Batch 3 (I-09):** the picker copies (`cables`, `cable_impedance_defaults`, `transformers`, `ibr`, `generators`, `hv_breakers`, `lv_breakers`, `switchgear`, `motors_nameplate`, `fuses`, `reclosers`, `disconnects`, `pv_modules`, `cable-picker`) were removed (3.3 MB): the picker and the master library both read the `master-*` file of the same sheet. They were never downloaded anyway. Package database after Batch 3: 52 manifest entries, 4.9 MB, 50 sheets, every row count equal to the manifest (`db_picker_browser.py` 6/6).
- Every record keeps its source citation and the database revision (Master Prompt Section 44).
- Approved for live on 15 Nov (D-08); upload is blocked (§1.1).
- Reminder from V29d: LV breakers, most fuses, relays, trip devices and overload heaters are "catalog metadata" records without ratings or curves. **No time-current curves are in the database**; clearing times come from the relay-curve / manufacturer-curve dropdowns. Missing values are never filled in.

## 7. Progress and changelog

### Batch 3 — Engineering audit 1: fault engines (15 Nov 2026) ✅ live
**Progress**
- Owner requests first: private data — local clone of the database repo deleted; no voltage limit on database data (filter removed, transmission conductors kept); 16 unused files deleted from the live site (old fonts, `legacy-app.mjs`, old CSS, notice text), all views checked.
- pandapower (free IEC 60909 code) on the same networks: Ik'' 231 buses / 49 cases, 0 fail, worst 1.0·10⁻⁷.
- **Defect found and fixed:** peak current in meshed multi-source networks was up to 23 % low (single X/R). IEC 60909-0 method C now used for meshed networks (dense + sparse solvers); UI and report name the method. Independent numpy oracle (own method C) 936 totals / 861 peaks, 0 mismatches.
- I-01 fixed (the test generator, not the engine, was wrong). I-09 fixed in the package (14 duplicate picker files, 3.3 MB, removed; database view 50 sheets, counts equal). I-10, I-11 accepted per owner. New I-15 (non-meshed partial peaks, Batch 10), I-16 (info).
- Regression: see §1.6 "Latest regression numbers".
- Live: 10 files patched, 10 / 10 read back identical; checked in Chrome: new engine and worker load, owner's draft unchanged (2,390 characters). Database on live unchanged (D-08).
- Not done in this batch: zero-sequence path rules (→ Batch 4), ANSI C37 duty (gap list written, → Batch 10), IEC TR 60909-4 example (data not freely available).

**Changelog**
- `network-engine.mjs` (+ bundle): IEC 60909-0 method C peak factor for meshed networks (`methodCRatio`, `methodCNet`, `peakXR`); result field `peakMethod`.
- `network-app.mjs` (+ bundle): peak card and result details name the method; database loader always reads the `master-*` sheet file.
- `report-data.mjs` (+ bundle): report row "Peak factor method".
- Version strings `20261115-b3`: `index.html`, `network-worker.mjs`, `network-calculation.mjs` (+ bundle), `arcflash-network-ui-v29.mjs`, `fault-envelope-ui-v29.mjs`, `power-quality-ui-v29.mjs`.
- `SITE/database/` (package only): 14 duplicate picker files removed, manifest points at `master-*` files.
- Live only: 16 unused files deleted (Batch 3 housekeeping).
- `QA/V29_QA_SCRIPTS/oracle.py`: independent method C; `gen.py`: taps in `tapPercent` (I-01); `cases.json`, `js.json`, `bundle.json` regenerated.
- `QA/B02_HOUSEKEEPING/db_whitelist.py`: also drops picker copies.
- New: `QA/B03_FAULT_AUDIT/` (`pandapower_crosscheck.py`, `db_picker_browser.py`, results), `REPORTS/B03_FAULT_AUDIT.md`.

### Batch 2 — Housekeeping (15 Nov 2026) ✅ live
**Progress**
- BESS dispatch and BESS size/cost sensitivity hidden (D-04). Time-series AC load flow stays and is the default. Saved or imported BESS scenarios are refused with a scope message; their data and code are kept.
- Font: Sitka Text (body) and Sitka Heading (headings) by name, Georgia/serif fallback, system monospace for code (D-09). The live site no longer requests Google Fonts or any font file.
- Cloud Vault file input labelled (I-04). Full browser storage no longer hides an arc-flash result or a new Cloud Vault recovery code (I-05).
- Database import reduced to the keep list (package only, D-08): 111 → 65 files, 9.9 → 7.7 MB. (A 38 kV filter on MV breakers was tried and removed again on the owner's instruction: no voltage limit on data.) Master library shows "50 of 117 sheets".
- Bundled font files removed from the package (not referenced any more).
- Tests: full regression suite (numpy oracle 873/0, sequence 1,200/0, DC 525/0, physics 14/14, envelope 19/19, sparse 637/0, load flow, reports, arc flash, V33 audits 95/95, operating table 40/40, equipment table 13/13, inverter 6/6); browser: Batch 2 checks 14/14, XSS 26/26, operating table, equipment table, Build plant pass; axe at 5 widths: `label` finding gone, no sideways scroll.
- Live: 12 files published, 12 / 12 read back identical (bundle without the database module). Live page checked in Chrome: Sitka fonts, lab hidden parts, 16.706 kA, owner's draft unchanged.

**Changelog**
- `operations-v27-ui.mjs`: BESS dispatch and size/cost modes hidden; default mode time-series AC load flow; scope note; saved/imported BESS scenarios refused.
- `fcs-theme-v30.css`, `public-style-v21.css`, `network-style.css`, `studio-v26.css`, `studio-workspace.css`, `operations-v27.css`: Sitka font stacks; Inter / JetBrains Mono `@font-face` and Google Fonts `@import` removed; system monospace.
- `cloud-vault-ui.mjs` (+ bundle): label for the backup file input; recovery-code storage guarded.
- `arcflash-network-ui-v29.mjs`: saving inputs guarded.
- `master-database.mjs` (+ bundle): shows "N of 117 sheets" when the import is reduced.
- `index.html`: version strings `20261115-b2`.
- `SITE/database/`: reduced to the keep list (package only).
- `SITE/fonts/` removed from the package; `THIRD_PARTY_NOTICES.md` updated.
- New tests: `QA/B02_HOUSEKEEPING/b02_browser.py`, `db_whitelist.py` (+ results).

### Batch 1 — Phase 0 inventory (15 Nov 2026) ✅
**Progress**
- Read Master Prompt V5.0 (all 1,912 lines), `Fault_Current_Studio_prompt.md`, the calculator index, and the master database repository (v13 checksum verified).
- Requirements: R326–R357 and D01–D17 mapped to files, functions and tests, with status and proposed P1–P5 applicability (§5).
- Database map: 111 prepared database files classified: keep 64 (7.6 MB), drop 47 (2.3 MB), with reasons (§6; the final tables list 65 / 46).
- Decisions D-01 … D-10, issues I-01 … I-12, remaining-work batch plan 2–14.
- Tests rerun: numpy oracle (873 comparisons, 0 mismatches; 21 cases rejected → I-01), phase-domain sequence oracle (1,200 / 0), DC oracle (525 / 0), physics 14/14, transformer envelope 19/19; plus the V33 regression suite earlier the same day.
- No site code changed; nothing deployed in this batch.

**Changelog**
- Added records: `REQUIREMENTS.md`, `DATABASE_MAP.md`, `DECISIONS.md`, `ISSUES.md`, `PROGRESS.md`, `REMAINING_WORK.md`, `CHANGELOG.md` (now merged into this file).
- `REPORTS/V34_REMAINING_TASKS.md` now points to `REMAINING_WORK.md` .
- `NEW_CHAT_PROMPT_V34.txt`: read `REMAINING_WORK.md` first (this file).
- No change to `SITE/`.

### Before Batch 1
- V33 (14–15 Nov 2026): see §8.

## 8. Release history in short (V27 → V33)

Live file counts are as recorded at the time.

| Release | Date | Live? | Main content |
|---|---|---|---|
| V27 | before Oct 2026 | Live (234 files, revision `7833f765…`) | PV/BESS operations work; last confirmed live release before V29 |
| V28 | 26 Oct 2026 | Never deployed (236 files) | Bounded conductor adiabatic I²t screen (`conductor-duty-v28.mjs`); V20/V27 16-mode export QA: 128 PDF/XLSX downloads, 19,848 data checks; 1,200 transformer + 1,500 conductor independent cases |
| V29 | 7 Nov 2026 | Live (239 files) | 17 database files moved back into `SITE/database/`; plausibility warnings; SLD Delete-button fix; transformer %Z tolerance envelope + NEC 110.24 label; IEEE 1584-2018 arc flash in the browser (verified against 105,120 official IEEE cases; external server removed) |
| V29b | 7 Nov 2026 | Live | Off-nominal transformer tap (fault studies); Arc flash · all buses with NFPA 70E 130.5(H) label fields; combined conductor sizing (NEC 310.16 + VD + short circuit) |
| V29d | 8 Nov 2026 | Live (code); database v13 not live | Clearing time from relay / manufacturer curve dropdowns; IEEE 519 PCC check; PF correction + resonance; user R/X in conductor sizing; master database v13 import |
| V29e | 8 Nov 2026 | Live | Tap in load flow; one-line devices linked to arc-flash picker; relay tolerance bands; LV breaker LSI model; NEC 240.4 OCPD + 250.122 EGC; published TCC plot-point library (ERMCO) |
| V30 | 8 Nov 2026 | Live (256 files) | Stitch dark theme (`fcs-theme-v30.css`, `shell-v30.mjs`), layout clean-up; automatic layout audit at 5 widths = 0 findings; no calculation change |
| V31 | 8 Nov 2026 | Live (260 files) | Sparse AC fault solver (1,970 buses ≈ 3 s); factored DC array solver (3,924 buses ≈ 3 s); large one-lines (visible-area drawing, overview, Find); Build plant; Equipment table CSV; Projects on your computer (`.fcs.json` folder); atlas without reference names |
| V32 | 8 Nov 2026 | Live (263 files) | Report contents chooser; large Excel/PDF reports; sparse SLG/LL/DLG and split-phase; sparse load flow with switch merge + fill-zero; fast arc flash at every bus + bracket option; tree auto-arrange; equipment add/delete; DC arrays + attach in Build plant |
| V33 | 14–15 Nov 2026 | Live (265 of 273 files) | Plants with many inverters (1,900 buses / 1,681 inverters → 24.368 kA at POI); time limit grows with size; lighter results/report pages; XSS + CSV-formula checks; undo/redo cache; DC lean results; operating-studies bus table; faster arc-flash picker; connection editing with preview; reference-data notice; audit against 95 published values |
| Batch 2 | 15 Nov 2026 | Live | §7 |
| Batch 3 | 15 Nov 2026 | Live | §7 |

**Live checks that were never possible from the AI sandbox (still worth a manual pass):** phone width on the live site, equipment-table upload on live, arc flash with typed clearing times on a large plant, Wix HTTP 429 / startup issue and the Chromium 11th-download timeout (both from V28, not retested).

## 9. Older backlog items and where they now sit

The V29–V33 backlogs (V29 backlog, V33 "Not done", V32 "Still open", V31 "Honest limits") were checked against the batch plan. Items already fixed are not repeated. What is still open:

| Older item | Source | Now covered by |
|---|---|---|
| Full audit from zero to finish | V29 backlog P0 | Batches 3–5, 13 |
| V33 list B2: line-by-line code review; `innerHTML` static audit | V33 audit, V33 security README | Batch 5 |
| V33 list B3: accessibility (one-line SVG names, nested focus) | V33 audit | I-03, Batch 5 |
| V33 list B4: cross-check with free tools (pandapower, OpenDSS) | V33 audit | pandapower done (Batch 3); OpenDSS → Batch 11 |
| IEC TR 60909-4, IEEE 399/551, ANSI C37, IEC 61660 / IEEE 946, IEC 60287 published cases; published multi-bus case | V33 audit, rest of list B1 | Batch 6 (research), Batch 10 (ANSI C37) |
| OEM TCC data for LV breakers and fuses (most only as graphs) | V29 backlog P0 | Batch 7 |
| Relay coordination / selectivity between devices in series; scenario comparison | V29 backlog P1 | Batch 7 (selectivity), Batch 12 (scenario manager) |
| IEC 60909-0 full max/min with all correction factors | V29 Part 4 | Batch 10 |
| Unbalanced load flow (D1 / V32-03) | V31–V33 | Batch 11 |
| "Open this study in browser" (D3) | V32, V33 | I-06, Batch 5 |
| Atlas items (D5 / V31-06: IEC 60909 full, ANSI C37, selectivity, IEC 60287 duct banks / IEC 60853, pulling and cleat forces, N-1 and unbalanced load flow, hosting capacity, frequency sweeps, IEEE 80, IEC 61660, dispatch, PV yield, microgrid dynamics, CIM, provenance/traceability) | V31–V33 | Partly Batches 7–12; rest "Later" |
| Very large reports (PDF > 2,000 pages; phone "All fault locations" memory) | V33 | Accepted as limits (Excel works); revisit in Batch 13 |
| C2 add one item ≈ 5 s, C5 envelope ≈ 6 s on 2,000 buses | V33 | I-11 (accepted, D-05) |
| Three V32 comparison scripts need missing V31 reference files | V33 | Batch 5 (restore or rewrite) |
| Off-nominal tap in split-phase study; automatic tap changing (OLTC) in load flow | V29 backlog P1 | Batch 11 |
| Conductor sizing: raceway fill, 240.21 taps, Art. 430 motor circuits; built-in R/X for 14–10 AWG and 3 AWG (needs NEC Ch. 9 Table 9, licensed) | V29 backlog P1 | Later (needs licensed NEC copy) |
| Motor contribution quick estimate (≈ 4 × FLA), labelled as estimate | V29 backlog P1 | Later |
| IEEE 80 grounding; IEC 60853 cyclic cable; dynamic motor starting; stability; reliability Monte Carlo; CAD/BIM export | V29 backlog P1/P2 | Later |
| Read the NEC books and re-verify NEC tables | V29 backlog P0 | Needs owner to share the files (§1.2) |
| Light theme / printed reports in the new look; drop-down wrap in Safari/Firefox | V29 backlog P1/P2 | Later (low) |
| Restore QA evidence to the folders named in `TRANSFER_MANIFEST_SHA256.json` (cosmetic) | V29 backlog P1 | Later (low) |
| Live Wix HTTP 429 / startup; Chromium 11th-download timeout | V28, V29 | Batch 14 live-URL tests |
| Site-served fonts (rest of D6) | V33 | Superseded by D-09 (Sitka by name, no font files) |
| Database v13 publication (E1) | all releases | §1.1 |

## 10. Repository layout, project files, running the tests

### 10.1 Repository layout
Upload the folders exactly as they are in the release ZIP.

| Folder / file | What it holds |
|---|---|
| `SITE/` | The website. Every file the Wix site serves (index.html, modules, styles, `database/`). This folder is what gets deployed. No build step: served as static files. |
| `QA/` | Test suites and recorded results. Each suite folder has its own README with the commands. `QA/V33_SHA256_Manifest.json` lists the SHA-256 of every file in `SITE/` (V33). |
| `REPORTS/` | Release reports, test results, backlog and research notes . |
| `REQUIREMENTS/` | Requirements and the Stitch design-system sources . |
| `DEPLOY/` | Database deployment script (`deploy_database_to_wix.py`). |
| `Spreadsheets/` | Master equipment workbook and reference spreadsheets (99 workbooks). |
| `COMPARISON/` | Feature-comparison references (2 workbooks). |
| `RELEASE_STATE.json` | Machine-readable release state. |
| `NEW_CHAT_PROMPT_V34.txt`, `MASTER_CONTINUATION_PROMPT.txt` | Prompts for a new chat (text files, not merged here). |
| `TRANSFER_MANIFEST_SHA256.json`, `VERIFY_TRANSFER.py` | V28 transfer manifest and checker (expects the original outer ZIP, which is not in the repo). |

All files are below GitHub's 25 MB browser-upload limit. The largest is `QA/V29_QA_SCRIPTS/ieee1584/ieee_1584_spreadsheet_results.csv` at 22.8 MB.

### 10.2 Your project files
Projects are **not** stored in this repository or on the website. They live on your computer.
1. Open the website in Chrome or Edge on a computer.
2. Go to **Saved studies & backups → Projects on your computer**.
3. Click **Connect project folder** and choose a folder, for example `Documents/Electrical projects`.
4. Use **Save project to folder**.

Each project becomes a `name.fcs.json` file in that folder. Open a file from the list to continue working on it; every change saves back to the same file. You can copy, back up, rename or delete these files like any other file. If you also want them in a repository, use a separate private repository.

### 10.3 Running the tests locally
1. Install Node 22+ and Python 3 (with numpy; pandapower for the Batch 3 cross-check).
2. Install Playwright and Chrome for the browser tests.
3. From `QA/V29_QA_SCRIPTS/` run `node run_engine.mjs cases.json js.json && python3 compare.py`, then the other suites listed in that folder's README.
4. From `QA/V31_SCALE/`, the `QA/V32_*/` and the `QA/V33_*/` folders run the plant-scale suites.
5. Bundle patching needs TypeScript 6.0.3 (`QA/V33_BUNDLE/README.md`).

## 11. Design system in short
Source: `REQUIREMENTS/stitch_electrical_studies_design_system/` (full `DESIGN.md` in that folder). Applied in V30 as a dark engineering workbench (`fcs-theme-v30.css`, `shell-v30.mjs`, loaded last). Only the look was taken; no mock-up data.
- Surfaces: obsidian / slate (`#090D13`, `#0D1117`, `#141C28`, `#1C2635`, `#243144`), 1 px strokes `#303E52`, 2–4 px corners, no soft shadows.
- Colour has meaning only: cyan actions (`#0284C7`, primary buttons darkened to `#0369a1` for 4.5:1 contrast); duty pass `#10B981` (<80 %), warn `#F59E0B` (80–100 %), fail `#EF4444` (>100 %); voltage classes LV green, MV cyan, HV violet; selected fault bus amber.
- Fonts in DESIGN.md: Inter + JetBrains Mono. **Overridden by D-09:** Sitka Text / Sitka Heading by name, system monospace.
- Tabular numbers, units never separated from values, dense 28 px table rows.
- Screen only: print, PDF and XLSX keep their own light layout. After any UI change, rerun `QA/V30_UI_AUDIT/audit.py` and keep it at 0 findings.

## 12. Third-party notices

### arcflash-calc (IEEE 1584-2018 method)
`SITE/ieee1584-2018.mjs` is a JavaScript port of https://github.com/LiaungYip/arcflash. Its test data (`QA/V29_QA_SCRIPTS/ieee1584/ieee_1584_spreadsheet_results.csv`) comes from the same project.

MIT License

Copyright (c) 2022 Li-aung Yip - https://www.penwatch.net

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

### Fonts
Since Batch 2 (15 Nov 2026) the site uses the Windows system fonts Sitka Text / Sitka Heading by name only, with Georgia / serif and system monospace fallbacks. No font file is shipped in the package. (Earlier releases used Inter and JetBrains Mono — V30, live — and DM Sans / Space Grotesk — V33, package only — all under the SIL Open Font License; those files are removed.)

## 13. Points to check (inconsistencies and missing references)
These come from the original files and the repositories. They are listed here, not silently corrected.

1. **Database package size after Batch 3.** `REMAINING_WORK.md` says "50 sheets, 78 files, 4.9 MB"; `DATABASE_MAP.md` says "52 entries, 4.9 MB". Both agree on 50 sheets and 4.9 MB. The "78 files" may count the sheet files of large sheets that are split into parts; check `SITE/database/` before the upload.
2. **Keep / drop counts in Batch 1.** `PROGRESS.md` says keep 64 / drop 47; the tables in `DATABASE_MAP.md` list 65 / 46 (Batch 2 confirms 65).
3. **`hv_breakers` picker note** in `DATABASE_MAP.md` said "filter to 35 kV class". This was superseded by D-03 (no voltage limit on data); the picker copy itself was removed in Batch 3.
4. **V33 site file count.** `START_HERE.md` says 275 files in the package; the V33 release report and `RELEASE_STATE.json` say 273. Batch 2 removed `SITE/fonts/` afterwards, so the current count is lower than both; check against the manifest before the next deploy.
5. **Oracle numbers.** Older text says 873 / 798 peaks (before Batch 3); current is 936 totals / 861 peaks (after the I-01 generator fix).
6. **Fonts.** DESIGN.md, the V30 report and the V33 report describe Inter / JetBrains Mono / DM Sans / Space Grotesk; D-09 (Sitka by name) is the current rule.
7. **"Do not use GitHub"** (V29 Part 1, rule 15) is superseded by D-01 (GitHub is the home of the code).
8. **D-04 vs Master Prompt V5.0 Section 16** (generators as sources): the owner's instruction has precedence; recorded in D-04.
9. **START_HERE.md** still opens with the old V28 ChatGPT cross-account transfer steps. They are historical; the current state is §2 and §1.
10. **Governing documents.** `Fault_Current_Studio_prompt.md` is not in any classroomsolar repository now (the `engineering-master-database` repo was re-created on 19 Nov). Master Prompt V5.0 exists as `00_MASTER_PROMPT_V5.0.txt` in the other five calculator repos, but not in `Electrical-Studies`. Add both here if they are still needed.
11. **Main branch history.** `Electrical-Studies` starts at commit `4cdfc9a` ("Initial clean", 19 Nov). Older reports deleted later stay recoverable from this commit.

---

# APPENDIX — all other .md files of the repository (word for word)

The documents below are copied word for word from the repository. Only heading levels were moved down so they fit inside this file.


---

## A1. Batch 3 fault audit


*Source file: `REPORTS/B03_FAULT_AUDIT.md`*

### Batch 3 — Engineering audit 1: fault engines (15 Nov 2026)

Scope: R326–R334, I-01, D05, D06. Free tools only (pandapower 3.5.6, numpy). No paid software, no licensed material.

#### Findings

| # | Requirement | Finding | Source / evidence | Severity | Fix | Test |
|---|---|---|---|---|---|---|
| F-01 | R334 (peak duty) | The engine took κ from the single X/R seen at the fault bus. In meshed networks with several sources this gave a peak up to **23 % low** compared with IEC 60909-0 method C (equivalent-frequency method). Radial networks were correct. | `QA/B03_FAULT_AUDIT/pandapower_crosscheck.py` (pandapower method C, 231 buses) before the fix; IEC 60909-0:2016 §4.3.1.2 c) | **High** (non-conservative peak / making duty) | Method C added to `network-engine.mjs` (dense and sparse solvers): Y is built again with every reactance × fc/f (fc = 20 Hz at 50 Hz, 24 Hz at 60 Hz, else 0.4 f); R/X = (Rc/Xc)·(fc/f); κ = 1.02 + 0.98·e^(−3R/X). Used only for meshed components (branches ≥ buses). Results carry `peakMethod: 'IEC 60909-0 method C'`; UI and report show the method. | numpy oracle (independent method C) 936 totals / 861 peaks, 0 mismatches; pandapower one source per bus 213 buses within 5·10⁻⁷; sparse = dense 637 cases 0 bad; bundle = source 8,860 values 0 diff |
| F-02 | R326 | Initial symmetrical current Ik'' agrees with pandapower IEC 60909 on every comparable bus. | pandapower 231 buses / 49 cases, worst 1.03·10⁻⁷ | — | none | as above |
| F-03 | R334 | Where **several sources sit on one bus**, pandapower's peak differs from the engine by up to 4.2 %. pandapower sums the source admittances of a bus into one external grid; the engine keeps each source separate. The engine follows the network as drawn; no change. | `results/pandapower_crosscheck.json` → `peak_split.several_sources_on_one_bus` (18 buses) | Info | none | recorded |
| F-04 | R334 | Non-meshed networks with several sources: IEC 60909-0 §4.3.1.1 sums partial peak currents of each branch (i_p = Σ κ_i·√2·I''_k,i). The engine uses one κ from the total X/R. Not yet implemented. | IEC 60909-0:2016 §4.3.1.1 | Medium | Batch 10 (I-15) | — |
| F-05 | I-01 | 21 of 25 `parallel_tap` oracle cases were refused. Cause: the case generator wrote the tap into the transformer nameplate voltage (v1 × tap). The engine's input rule is: nameplate = bus voltage, tap in `tapPercent`. The engine rule is right; the generator was wrong. | `QA/V29_QA_SCRIPTS/gen.py` | Medium (test gap) | `gen.py` writes `tapPercent`; random sequence unchanged (only those 21 cases change) | oracle now 936 comparisons (was 873), 0 refused, 0 mismatches |
| F-06 | R327–R329 | SLG / LL / DLG phase-domain oracle still 1,200 / 0. Zero-sequence path rules (Section 35: grounding, vector group blocking) were **not** re-audited in this batch. | `seq_test.py` | — | moved to Batch 4 | — |
| F-07 | R330, R331 | Maximum / minimum network-wide IEC 60909 scenarios (cmax / cmin, KT on every transformer) still radial-only. | REQUIREMENTS.md | Medium | Batch 10 (unchanged) | — |
| F-08 | D05 | ANSI / IEEE C37 duty is missing. Gap list below. | — | Medium | Batch 10 | — |

#### ANSI / IEEE C37 gap list (for Batch 10; nothing implemented yet)
- Separate R and X networks for X/R (IEEE C37.010 / C37.5 method), not the complex-network X/R used now.
- First-cycle (momentary) network with the C37.010 machine reactance multipliers; momentary duty vs close-and-latch rating.
- Interrupting network (1.5–4 cycle) with machine multipliers; remote / local (NACD) multiplying factors from the C37.010 curves; contact-parting time per breaker.
- LV breaker duty per IEEE C37.13 (multiplying factor from X/R vs the test X/R of the breaker).
- Fuse duty per their test X/R.
- 30-cycle (time-delay relay) current.
- Each item needs its curve / table data from a lawful, free source before coding (no invented coefficients).

#### IEC TR 60909-4 published example
Not used: the example network data was not available from a free, lawful source in this batch. pandapower (whose IEC 60909 code is itself tested against IEC TR 60909-4 by its authors) was used instead. Recorded as open in REQUIREMENTS R326.

#### Other work in this batch
- I-09: the 13 picker copies of database sheets (plus `cable-picker`) were never downloaded — the equipment picker reads the `master-*` sheet files. Removed from the package database (3.3 MB); manifest points at the master files; the loader no longer has a path to a picker copy. Browser test `QA/B03_FAULT_AUDIT/db_picker_browser.py`: 50 sheets, every row count equal to the manifest, no failed request, only `master-*` files requested. Live database unchanged (D-08).
- I-13: unused live files deleted (16, including the old font files). All views checked locally: no HTTP error, no page error.
- Private data: the local clone of the database repository was deleted.


---

## A2. V33 audit report


*Source file: `REPORTS/V33_Audit_Report.md`*

### V33 audit report (list B) — 15 November 2026

This is a screening audit. It is not a full engineering acceptance. Every check below has a script that can be run again.

#### B1 — calculators against published numbers
Expected values were typed into the test scripts from the public sources named in each script. They were not read from the site.

| Script | Source of the expected values | Result |
|---|---|---|
| `QA/V33_AUDIT/ieee1584_published.mjs` | IEEE 1584-2018 worked results published by Eaton (ESW2020-45: 480 V, 50 kA, gap 32 mm, 24 in, 20×20 in box, 2000 ms; VCB, VCBB, HCB) and IEEE 1584-2018 Annex D (4.16 kV / 15 kA and 0.48 kV / 45 kA cases) | 21 / 21 match (arcing current, incident energy, arc-flash boundary) |
| `QA/V33_AUDIT/iec60909_published.mjs` | Schneider Electric Electrical Installation Guide Fig. G71 (630 kVA, c·Un = 1.05 × 400 V, printed to 1 kA); EasyPower IEC 60909 slides (400 kVA and 1600 kVA examples, c = 1); IEC 60909-0 eq. (55) for κ | 28 / 28 match |
| `QA/V33_AUDIT/tables_published.mjs` | IEEE 519-2014 Tables 1, 2, 3; NEC 2023 Tables 250.122, 240.6(A), 240.4(D) | 46 / 46 match |

Notes:
- The EIG case also checks that the program adds R and X separately (|Z| 11.8 / 13.0 / 13.8 mΩ) and that IEC 60909 method C gives the same κ as the radial formula on a single path.
- The 0.48 kV Annex D enclosure depth (254 mm) is inferred from the published result; the other inputs are as printed.
- Not checked against published cases (no free worked example found, or the calculator does not exist): IEC TR 60909-4 multi-source example, IEEE 399/551 examples, ANSI C37 multiplying factors, IEC 61660 / IEEE 946 DC examples, IEC 60287 / 60853 cable ratings, IEEE 80 grounding (the site has no IEEE 80 calculator), manufacturer TCC curve points.
- The main network engine was not compared with a published multi-bus case in this round. It is still covered by the 220 oracle networks and the V32-vs-V33 comparison (4.8 million values, 0 differences).

#### B2 — code audit (automatic part)
| Check | Finding |
|---|---|
| `eval(` / `new Function(` | Only `engine.mjs` has a method named `eval` — it evaluates the formula AST; no JavaScript is run from text. No `new Function`. |
| Text typed by a user shown as page code | 74 fields, 26 browser checks pass (`QA/V33_SECURITY/xss_browser.py`). |
| CSV / Excel formula injection | Pass (`QA/V33_SECURITY/csv_formula.py`). |
| `localStorage.setItem` without try/catch | Several modules. A full browser storage (quota) throws and the action stops with a console error. Low risk; listed in the backlog. |
| Cloud Vault recovery key | Kept in browser storage by design and shown to the user. Low risk; listed. |
| Line-by-line review of every module | **Not done.** |

#### B3 — layout and accessibility at 360 / 768 / 1280 / 1440 / 1920 px
`QA/V33_UX/ux_widths.py` (axe-core 4, WCAG 2.0/2.1/2.2 A and AA rules) on the main studio and 14 tools, at five widths. Results: `QA/V33_UX/results/ux_widths.json`.

| Finding | Where | Severity |
|---|---|---|
| No sideways page scroll and no element cut off at the right edge | All views, all widths | Pass |
| `label-content-name-mismatch` — the one-line diagram symbols (transformer, cable) have an accessible name that does not contain their visible text | One-line diagram SVG, every view that shows it | Serious (WCAG 2.5.3). Open. |
| `nested-interactive` — focusable SVG groups inside a focusable diagram | One-line diagram SVG | Serious (WCAG 4.1.2). Open. |
| `label` — the "original backup" file input has no label | Cloud Vault | Critical (WCAG 4.1.2 / 1.3.1). Open, one-line fix. |
| 89 visible targets smaller than 24 × 24 px per width (axe accepts them by spacing) | Small icon buttons and table controls | Check by hand (WCAG 2.5.8) |

Nielsen heuristics and a manual screen-reader pass: **not done**.

#### B4 — comparison with other tools
Paid tools (ETAP, SKM, EasyPower) are not used: the calculator is free and must be checked with free means. Comparison with free, open tools (pandapower IEC 60909 short circuit, OpenDSS load flow) on the same networks is **not done yet**. The IEEE 1584 Annex D values above are published results printed in the standard.

#### Found while testing (not in list B)
- 390-px phone emulation, 1,970-bus plant, Operating studies: a **mouse** click on "Enter 0 MW / 0 Mvar at the blank buses" does not complete within 8 s when the new bus-table button (`operating-table-ui-v33.mjs`) is on the page. A **tap** on the same button works, a desktop mouse click works, and the same click works without the new script. Real phones tap, so users are probably not affected, but the cause is not found. This is the third failure in `QA/V33_VERIFY/a1_verify.py` (now 122 pass, 3 fail, 2 not tested; before the C4 change: 124 pass, 2 fail).


---

## A3. V33 release report


*Source file: `REPORTS/V33_Release_Report.md`*

### V33 release report — 14–15 November 2026

**Status: V33 code is live on the original Wix site (first publish 14 Nov 2026; fifth and last publish 15 Nov 2026). Every published file was read back from the site and its checksum compared with the package.**
Not live: the site-served DM Sans / Space Grotesk fonts (2 stylesheets + 7 font files), `favicon.ico` (the Wix host serves its own), and database v13 (as before).

#### Summary
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

#### What changed
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

#### Tests
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

#### Measured times
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

#### Not done
1. **Fonts on the live site** (rest of D6): font files are binary; the tools of this round could not upload them. The package has them.
2. **C2** add one item: still about 5 s on the 1,970-bus plant (a new state is always a full calculation). **C5**: no change of its own.
3. **B2** line-by-line code audit, **B4** comparison with other tools, Nielsen review, screen-reader pass. **B3** findings open: one-line SVG names and nested focus, Cloud Vault file input label.
4. **D1** unbalanced (per-phase) load flow, **D3** "Open this study in browser", **D5** atlas items: not started.
5. **Phone emulation, Operating studies, 1,970 buses**: mouse click on the fill-zero button times out while the new bus-table script is on the page; tap works. Cause not found.
6. **PDF for a 1,900-bus / 1,681-source plant**: no file (over 2,000 pages). Excel works.
7. **Report page, phone width, 1,970-bus plant, "All fault locations"**: can run the tab out of memory on a 7 GB machine (V32 too).
8. Three V32 comparison scripts cannot run from the package (their V31 reference files are missing).
9. **Database v13** is not live (E1, owner decision).

#### How the bundle was patched
`public-bundle-v21.js` modules are the TypeScript CommonJS transpile of the `.mjs` sources. V33 proved this by test and patched three modules with the tools in `QA/V33_BUNDLE/`.


---

## A4. V32 release report


*Source file: `REPORTS/V32_Release_Report.md`*

### V32 release report

Date: 8 November 2026 · Parent: V31 · Wix site `97613ac8-1f7d-4ecf-8fa4-2d589c387775` (same site, no new site created)

#### State
- Package: 265 website files (V31: 262). 30 existing files changed, 3 new files, none deleted.
- Live: V32 code deployed to the original site (263 live files). Every file was checked against its SHA-256 after upload. `public-bundle-v21.js` was patched one module at a time, and every module that V32 does not change (including the database-reference-tables module) was checked unchanged after the write.
- **Database v13 is still not live**, as instructed. It stays in `SITE/database/` and `DEPLOY/` for the owner to publish.
- Full engineering acceptance is **not** claimed. These are screening calculations to be checked by a qualified engineer.

#### What V32 adds
| Area | Change |
|---|---|
| Report contents | New **Report contents** panel on the Report page. You tick which sections go into the printed, PDF and Excel report (study basis, single-line, bus levels, source contributions, branch currents, rating checks, cable screens, PV data, inputs, QA, method). Source and branch tables can cover all fault locations or only the selected fault bus. Calculated operating and engineering studies, and study-tool results from this session, can be added. The choice is remembered per project on this device. The default report is byte-identical to V31. |
| Large reports | Long sheets continue on numbered sheets (99,999 rows each). Big Excel files are deflate-compressed. PDF allows about 2,000 pages and names the largest sections when it is still too long. A 2,000-bus Excel report now downloads. |
| Fault studies at plant size | Connected-sequence (SLG, LL, DLG) and split-phase solvers use a sparse LU and keep a compact result per bus, with full detail for the selected bus. Each branch keeps its worst-case current, so duty and cable checks see the same maxima. 2,000 buses: about 2–5 s (connected) and 6–9 s (split-phase). The results equal the dense solver on every bus tested. |
| Load flow at plant size | Sparse Newton solver above 40 buses / 200 branches, using the same model and convergence test. Closed switches and breakers join their buses into one node, and switch through-flow comes from the bus balance. The 1,970-bus plant solves in about 0.2 s. A button enters 0 MW / 0 Mvar at every blank bus. N-1 accepts up to 20,000 buses. |
| Arc flash | **Arc flash · all buses**: protective-device lookup for each bus is rebuilt (about 5 s, previously 147 s on 1,970 buses). It gives identical results. A new option brackets screening-bound fault currents. The **Engineering studies** arc-flash card now calculates IEEE 1584-2018 incident energy with the Studio's own engine and one documented clearing time. |
| One-line | Auto-arrange for more than 40 buses uses a tidy tree, and same-voltage feeders continue on the same row. |
| Equipment table and Build plant | The table can add and delete equipment. Build plant can attach a block to an existing bus and generates DC arrays (strings, fuses, combiners, inverter inputs) from the user's own data. |
| Smaller fixes | Status pill text, Z2 help text, a note when the max/min scenario equals base, faster result lookup and number formatting, and the browser-address option hidden where it cannot work. |

#### Tests (all pass)
| Folder | What it checks |
|---|---|
| `QA/V32_REPORT/` | Report chooser logic, default report identical to V31, study-report parity, browser toggling (<0.4 s), tool registration, performance |
| `QA/V32_SEQUENCE/` | Sparse vs dense, connected and split-phase, up to 2,000 buses; all fault modes |
| `QA/V32_LOADFLOW/` | Sparse vs dense Newton, switch merging (KCL), 1,970-bus plant, browser |
| `QA/V32_ARCFLASH/` | New device lookup equal to V31 reference on every bus |
| `QA/V32_TABLE/` | Table add/delete, builder attach and DC arrays, browser |
| `QA/V32_LAYOUT/` | Tree arrange screenshots; layout audit at 4 widths clean |

Manifest: `QA/V32_SHA256_Manifest.json`.

#### Still open (honest)
- Capability-atlas items marked "not built yet" (IEC 60909 certification, cable pulling, hosting capacity, grounding grid touch/step, storage dispatch, microgrid dynamics, CAD/BIM/CIM import).
- On 2,000-bus projects, undo/redo and adding one item still take about 6–8 s, because the whole project is recalculated.
- Operating-study data entry is about 2 s per field on large projects. The fill-zero button and CSV entry are the practical route.
- Unbalanced (per-phase) load flow is not built.
- The transformer Z-tolerance envelope takes about 9–14 s on 70 transformers.
- "Open this study in browser" needs the private cloud, so it is hidden where it cannot work.
- Database v13 is not live (owner decision).


---

## A5. V31 release report


*Source file: `REPORTS/V31_Release_Report.md`*

### Fault Current Studio — V31 release report (8 Nov 2026)

V31 is a step towards plant-scale use. It is **not** a claim that the Studio is complete or certified.

#### 1. What changed

##### Calculation at plant scale
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

##### One-line at plant scale (`one-line-editor.mjs`, `shell-v30.mjs`, `network-app.mjs`)
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

##### Building and editing large plants
- **Build plant** (Single line toolbar) creates a PV or BESS plant one-line from block data:
  - It covers the POI, an optional main breaker, the collector, feeders with breakers, a fuse and transformer per block, inverters with AC breakers, and LV cables.
  - Every impedance and fault value comes from the user's entries. Empty fields are rejected.
  - Protective-device ratings start blank, so the duty check reports INPUT REQUIRED until they are filled in.
- **Equipment table:**
  - Download every bus, connection, source and device as CSV, edit it in a spreadsheet, and upload it to update the project in one step.
  - Rows match by id. Blank cells keep the stored value. Units are in the headings.
  - Text that a spreadsheet would run as a formula is neutralised.

##### Projects on the user's computer (`project-folder.mjs`)
- **Saved studies & backups → Projects on your computer.** Connect a folder, and each project becomes a `.fcs.json` file in it:
  - Open, save, save under a new name, or delete a file.
  - The open project saves back to its file automatically.
  - After a reload, the folder and the link to the open file are restored. The browser asks again for permission when needed.
  - Nothing is uploaded.
- **Browser support.** This works in Chrome and Edge on a computer. Other browsers keep Export / Import project JSON.

##### Capability atlas
- **No reference names on screen.** Reference product names and their links are no longer shown. They are kept in the source for internal comparison only.
  - The few other product names in visible text were reworded: a method note naming a product, and a disclaimer naming optimiser products.
- **Statuses match what is built and tested.** Arc flash and DC short circuit are verified in stated scope. The labels are now **Verified in stated scope / Partly built / Not built yet**.

#### 2. Test evidence
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

#### 3. Deployment
- **Deployed to the original Wix site** (`97613ac8-…`), 260 files.
- **Every changed file was checked before upload:**
  - Each patch was applied to the live copy only after the live file was confirmed to be the expected V30 version.
  - The result had to match the local SHA-256 before the upload went ahead.
- **Read-back after upload:**
  - All 16 changed module files match by SHA-256 over HTTPS.
  - The live bundle carries the 5 changed module blocks with matching checksums, plus the new project-folder block.
  - `index.html` carries the V31 tags.
- **Database v13 is still not live, as instructed.** The live bundle keeps its earlier database tables block. That block is the only difference between the live bundle and `SITE/public-bundle-v21.js` in this package.

#### 4. Honest limits (not done in V31)
- **Unbalanced studies.** Connected-sequence studies (SLG/LL/DLG with explicit sequence networks) and split-phase studies still use their dense solvers. They have not been scaled to 2,000 buses.
- **Arc flash at every bus** still searches device paths per bus. With 2,000 buses all included it will be slow; this was not measured in V31.
- **Auto-arrange** (the Arrange button) lays out by BFS level. On a 2,000-bus project not built by Build plant, it gives very wide rows. Build plant positions are structured.
- **Equipment table** updates existing items only. It does not create or delete items or change connections.
- **Project folder** needs Chrome or Edge on a computer.
- **Plant builder** covers one block design repeated across the plant. Mixed block designs need Add-to-project runs or table edits.
- **Atlas gaps** remain as listed in the atlas: IEC 60909 full, ANSI C37, selectivity, duct banks and IEC 60853, pulling and cleat forces, N-1 and unbalanced load flow, hosting capacity, frequency sweeps, IEEE 80, IEC 61660, dispatch, PV yield, microgrid dynamics, CIM exchange, provenance and traceability.


---

## A6. V29 release report (V29, V29b, V29d, V29e, V30)


*Source file: `REPORTS/V29_Release_Report.md`*

### Fault Current Studio V29: release report

**Status: V29d. Code DEPLOYED on 8 Nov 2026 to the original Wix site (metaSiteId 97613ac8-1f7d-4ecf-8fa4-2d589c387775), live revision d597e1d346bbee1486a69c2c0b53cbc29d40f36e (246 files). The master-database v13 update is in this package but not yet live (see V29d section). Not a complete IEC/IEEE-certified platform.**

Date: 7 November 2026. Parent: V28 (236 files, never deployed) and live V27 (234 files, revision 7833f765…). V29 has 239 website files.

#### What changed

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

#### Engineering finding from testing

Lowering transformer %Z does **not** always raise the fault current at every bus. When an LV generator or motor is present, a stiffer transformer diverts some of its current towards the utility, and phasors with different X/R can add to a slightly smaller total (up to 0.04 % lower in the random networks tested). The V29 envelope therefore solves every ± combination (up to 8 transformers, 256 solutions) and reports the true extreme per bus with the governing combination. A dense check of 8,446 intermediate points found no value outside the reported envelope.

#### Tests run (all offline)

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

#### IEEE 1584-2018 arc-flash engine: verification

- All 398 coefficients compared with the reference library's tables: 0 differences.
- IEEE 1584-2018 Annex D.1 (4.16 kV): 22 of 22 intermediate and final values match to the printed precision. Annex D.2 (480 V): 28.793 kA, 11.585 J/cm², 1,029 mm (full) and 25.244 kA, 53.156 J/cm², 2,669 mm (reduced), all as printed.
- 105,120 official IEEE 1584-2018 calculator spreadsheet cases (the 38,880 cases with enclosure width under 4 × gap are invalid by the standard and skipped): worst difference 0.0002 %.
- Python reference library on 6,000 random official cases: worst difference 3e-15.
- 52 challenge tests: energy linear in time, falls with distance, arc-flash boundary returns exactly 1.2 cal/cm², every range limit accepted or rejected correctly, 5,000 random cases finite and positive. Step across the 600 V model boundary: 0.05 % (built into the standard's two models).
- Browser, desktop and mobile: Annex D.2 example, TCC-curve option, invalid input message; no request to the external server.

#### Deployment (7 Nov 2026)

- Live site before: V27, 234 files, revision 7833f76548763c45152264ef08be50519d8ed752. This matched the handoff, so nothing had been changed on the live site since.
- Reconciliation: 229 live files had the same size as local. Every one of the 5 that differed was an intended change. 5 files were new. No live file was missing locally.
- The 4 patched live files were first verified byte-for-byte (length + checksum) against V28. Patches were applied on Wix, all 10 resulting files were checksum-verified against the local V29 files, and only then published in one patch.
- Live after: 239 files, revision a269917c6717417399f3191c7c0a354d2bcb1aff. 9 of 10 changed files are byte-identical to local. `index.html` differs only by the `wix-site-script` tag that Wix adds to every uploaded site.
- HTTP check of the live URL: 13 key files return 200 with the expected V29 lengths.
- **Not done:** a real click-through of the live site in a browser. The sandbox cannot reach the live host. Please open the site and try: Arc flash · IEEE 1584 → Compute; Fault label & Z tolerance → Calculate envelope.
- Rollback: the exact V27 `index.html` was replaced on the live site and is not in this package. The safe rollback is to the offline-validated V28 set: upload the V28 copies of the 5 changed files (reverse `V29_changes_to_existing_files.patch`) and delete `fault-envelope-v29.mjs`, `fault-envelope-ui-v29.mjs` and `ieee1584-2018.mjs`.

#### Not done / still open

- Live Wix HTTP 429 / startup and the Chromium 11th-download timeout were not retested (no live site access in this session).
- Transformer off-nominal taps are still rejected in fault studies (P1; design notes in the backlog).
- Full IEEE 1584-2018 arc flash, OEM TCC bands, full ANSI/IEC duty, unbalanced load flow, IEEE 80 grounding and IEC 60853 remain open (see backlog).
- The 186 QA evidence files sit one folder higher than `TRANSFER_MANIFEST_SHA256.json` says; content is identical. Left in place.

#### Rollback

Restore the four changed files from V28 (or reverse `V29_changes_to_existing_files.patch`), delete the two `fault-envelope*-v29.mjs` files, and keep the 17 database files in `SITE/database/`, which is their correct V28 location.


#### V29b update (7 Nov 2026, second deploy)

Three backlog items done. Nothing removed; all earlier tests rerun.

| Item | Files | What it does | Limits |
|---|---|---|---|
| Off-nominal transformer tap | `network-engine.mjs`, `connected-sequences.mjs`, `network-app.mjs`, `network-model.mjs`, `report-data.mjs`, `operating-studies.mjs`, `split-phase-network.mjs`, bundle | New field "Off-nominal primary tap (%)", ±10 %. Turns ratio becomes (v1·(1+tap/100)/v2)/(Vi/Vj) in positive, negative and zero sequence. Impedance stays on the nameplate base. Info note shown when used. | Load flow and split-phase studies refuse a non-zero tap with a clear message (not modelled there yet). |
| Arc flash at every bus | `arcflash-network-v29.mjs`, `arcflash-network-ui-v29.mjs` (new) | Button "Arc flash · all buses". Takes the 3-phase bolted current of each bus from the open Studio network, IEEE 1584-2018 Table 8/10 typical equipment values (editable), shows full and reduced arcing current, then needs both clearing times per bus. Labels with NFPA 70E 130.5(H) fields, print, PDF/XLSX/JSON. | Clearing times are never assumed: a bus without them shows "CLEARING TIMES REQUIRED". No PPE category. 208 V–15 kV only. |
| Combined conductor sizing | `cable-sizing-v29.mjs`, `cable-sizing-ui-v29.mjs` (new) | Button "Conductor sizing". Checks every size 14 AWG–2000 kcmil: NEC 310.16 ampacity × ambient × bundling, limited by termination rating (110.14(C)), ×1.25 continuous; voltage drop with R/X; adiabatic short-circuit I²t ≤ (kS)². Picks smallest size passing all, and says which check governs. | NEC values are from the site database and flagged "not re-verified" (165/165 matched published values). R/X only 8 AWG–750 kcmil; sizes without R/X are skipped and named. OCPD, raceway fill, harmonics not checked. |
| Fault label & Z tolerance launcher | `fault-envelope-ui-v29.mjs` | Moved into the "More engineering tools" menu like the other tools. | — |

Deployment: the 10 live files were checked (length + checksum) against the first V29 deploy, patched inside Wix, checked again against local, and published once. Read-back: 14/14 files identical (index.html after removing the Wix site-script tag). Live HTTP: 7 key files 200 with the expected lengths. A real browser click-through on the live URL was not possible from here.

Rollback to the first V29 deploy: apply the reverse of the V29b hunks (see `V29_changes_to_existing_files.patch`, which now covers V28 → V29b) and delete the 4 new files.


#### V29d update (8 Nov 2026)

| Item | Files | What it does | Limits |
|---|---|---|---|
| Clearing time from dropdowns | `clearing-time-v29.mjs` (new), `arcflash-network-v29.mjs`, `arcflash-network-ui-v29.mjs` | Per bus, pick the protective device: IEC relay curve (SI, VI, EI, LTI — IEC 60255-151), IEEE relay curve (MI, VI, EI — IEEE C37.112-2018), definite time / instantaneous, or a fuse/breaker curve typed from the datasheet. Breaker time from the rated interrupting cycles (2/3/5/8) or ms. The clearing time is calculated at the IEEE 1584 full and reduced arcing currents and fed into the arc-flash result. Over 2 s is flagged; limiting to 2 s is a user tick box. | Relay/breaker tolerance, CT saturation and zone interlocking not modelled. The database has no TCC curves, so no device curve is picked automatically. |
| Conductor sizing | `cable-sizing-ui-v29.mjs` | Short-circuit clearing time can come from an IEC/IEEE relay curve; user can enter R/X from the cable data sheet for any size (fills the 14–10 AWG and 3 AWG gap). | — |
| IEEE 519 PCC check | `power-quality-v29.mjs`, `power-quality-ui-v29.mjs` (new) | Button "Harmonics & PF correction". Isc/IL row, individual harmonic and TDD limits (Tables 2/3), voltage limits (Table 1), 2022 even-harmonic rule (2014 selectable). Isc can be taken from a Studio bus. | Above 161 kV not covered; a snapshot is a screening check, not a week of measurements. |
| PF correction + resonance | same | Required kvar, PF with bank, parallel resonance order √(Ssc/Qc) for the bank and every step, voltage rise, warning near listed harmonics. | Single-bus approximation. |
| Master database v13 | `database/*`, `database-reference-tables.mjs`, bundle | See `V29d_Database_v13_Import.md`. | **Not yet live** — run `DEPLOY/deploy_database_to_wix.py`. |

Deployment: 4 live files checked by length + checksum against V29b, patched inside Wix, checked against local, published once; 3 new files checked the same way. Read-back 7/7 identical; HTTP 200 with expected lengths for 8 files.

Not done: Stitch theme and NEC books (Dropbox links could not be opened from here, and the files were not in Google Drive); off-nominal tap in load flow.


#### V29e update (8 Nov 2026) — Step 4

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


#### V30 update (8 Nov 2026) — Stitch theme and layout clean-up

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


---

## A7. V29 test results (rows 1–67)


*Source file: `REPORTS/V29_TEST_RESULTS.md`*

### V29 test results

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

#### Example values (worked example, V29 dialog)

| Bus | Minimum (Z +7.5 %) | Nameplate | Maximum (Z −7.5 %) |
|---|---|---|---|
| Utility / POI, 12 kV | 3.40 kA | 3.40 kA | 3.40 kA |
| 208 V transformer secondary | 30.80 kA | 32.73 kA | 34.91 kA (+6.67 %) |
| Main panel, 208 V | 16.26 kA | 16.71 kA | 17.17 kA (+2.79 %) |

#### V29e (8 Nov 2026)

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

#### V30 (8 Nov 2026) — Stitch theme and layout

| # | Suite | Scenarios | Comparisons | Result |
|---|---|---|---|---|
| 53 | Layout audit, V29e site (same detector, 1440 + 390 px, 8 pages + 16 dialogs + 10 calculated states) | 68 states | every visible element | 1,004 text-contrast findings below WCAG AA; 169 layout findings: 76 controls/text under floating buttons, 25 words wider than their box, 23 sideways-scrolling boxes, 15 squeezed labels/buttons, 12 text cut by parent, 8 one-line labels past their box, 6 placeholders and 4 drop-downs cut |
| 54 | Layout audit, V30 site, 1440 / 1280 / 1024 / 768 / 390 px | 170 states | every visible element | **0 findings** (also no light surface left in the dark theme) |
| 55 | Browser regression suites (rows 13, 14, 22, 26, 28, 31, 35–40) on V30 vs V29e | 10 suites, desktop + mobile | full captured output | Same numbers and behaviour; differences only in captured page text (uppercase table headers, card layout of wide tables on phones) and one fewer floating button (I²t launcher now in the tools list). Double-click on a one-line symbol opens its data on desktop and phone. |
| 56 | V30 deploy: index.html base/patched check, read-back of 4 text files, SHA-256 of 4 fonts on the live URL | 9 files | — | **All identical** (one font block mistranscribed in transit, corrected and re-verified) |

#### V31 (8 Nov 2026) — plant scale, project folder, plant builder

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


---

## A8. V29d database v13 import


*Source file: `REPORTS/V29d_Database_v13_Import.md`*

### V29d: engineering master database v13 import

Source: github.com/classroomsolar/engineering-master-database, `02_Engineering_Master_Database/Engineering_Master_Database_Audited.xlsx` (Library master version 13, SHA-256 dcef1fb4a8b00edbfb5e420dc4e76e6f4a8975cd0599e2f3c7902c4ee44f9f52). Read only; nothing was written to that repository.

Previous calculator import: 19 Oct 2026, 93 sheets, workbook SHA-256 cab11d2c….

#### Method
- Every sheet read with cached cell values (formulas not recalculated), written as gzip JSON in the same schema the site already reads (`database/master-*.json.txt`).
- Equipment pickers rebuilt with the same selection rules as before. The rules were first checked on the old data: they reproduce all 13 old picker files exactly, record for record.
- 21 `CEC_*` sheets (listing memberships, archives, provenance ledgers) left out: in v13 they are provenance, not a separate catalogue, and PV_MODULES / IBR already carry those records. Leaving them out keeps the site at 12.5 MiB (Wix limit 20 MiB).
- Saved studies are not affected: each applied record keeps its own snapshot of the values used.
- Embedded table `groundingResistors` (neutral-grounding resistors) updated from 4 to 88 records, in `database-reference-tables.mjs` and in the bundle.

#### Equipment pickers (records offered / total in sheet)

| Sheet | Before | After |
|---|---|---|
| CABLES | 10,390 / 10,621 | 10,883 / 13,223 |
| CABLE_IMPEDANCE_DEFAULTS | 9 / 9 | 9 / 9 |
| TRANSFORMERS | 367 / 367 | 1,201 / 1,201 |
| IBR | 445 / 445 | 5,603 / 5,603 |
| GENERATORS | 3 / 3 | 17 / 17 |
| HV_BREAKERS | 3,232 / 3,241 | 3,296 / 3,305 |
| LV_BREAKERS | 18 / 50,524 | 18 / 50,524 |
| SWITCHGEAR | 15 / 15 | 114 / 114 |
| MOTORS_NAMEPLATE | 410 / 410 | 1,162 / 1,162 |
| FUSES | 3 / 21,823 | 451 / 22,271 |
| RECLOSERS | 2 / 3,247 | 22 / 3,267 |
| DISCONNECTS | 20 / 20 | 186 / 186 |
| PV_MODULES | 25,882 / 25,882 | 39,400 / 39,400 |

Records with complete fault-study data (directly usable without extra input): transformers 11 → 11 (the 834 new transformer records lack %Z), IBR 19 → 61, generators 3 → 10, switchgear 8 → 16, fuses 3 → 7, reclosers 2 → 22. The rest are offered as references; missing values are never filled in.

LV breakers, most fuses, relays, trip devices and overload heaters stay limited: in v13 they are "ETAP-protected; catalog metadata decoded" records without ratings or curves. **No time-current curves are in the database**, so clearing times come from the relay-curve / manufacturer-curve dropdowns added in V29d.

#### All sheets (rows before → after)

| Sheet | Before | v13 |
|---|---|---|
| CABLES | 10621 | 13223 |
| CABLE_TYPES | 797 | 797 |
| TRANSMISSION_CONDUCTORS | 1610 | 1610 |
| PV_MODULES | 25882 | 39400 |
| BATTERIES | 281 | 865 |
| BATTERY_PERFORMANCE | 10532 | 10532 |
| TRANSFORMERS | 367 | 1201 |
| MOTORS_NAMEPLATE | 410 | 1162 |
| MOTOR_CHARACTERISTICS | 2040 | 2040 |
| MOTOR_MODELS | 186 | 186 |
| HV_BREAKERS | 3241 | 3305 |
| HV_BREAKERS_EXTENDED | 3476 | 3476 |
| LV_BREAKERS | 50524 | 50524 |
| FUSES | 21823 | 22271 |
| RELAYS | 8900 | 8914 |
| RECLOSERS | 3247 | 3267 |
| TRIP_DEVICES | 17889 | 17889 |
| OVERLOAD_HEATERS | 5776 | 5776 |
| ELECTRONIC_CONTROLLERS | 1118 | 1709 |
| CSD_DEVICES | 2575 | 2575 |
| RELIABILITY | 98 | 98 |
| RELIABILITY_EXTENDED | 141 | 141 |
| FIRE_PROTECTION | 25 | 25 |
| CONDUIT_FIRE_PROTECTION | 7 | 7 |
| HARMONICS | 445 | 445 |
| RECTIFIERS | 4 | 379 |
| INTERRUPTION_COST | 30 | 30 |
| RAILWAY_LOADS | 7 | 7 |
| IBR | 445 | 5603 |
| SWITCHGEAR | 15 | 114 |
| INSTRUMENT_TRANSFORMERS | 44 | 546 |
| DISCONNECTS | 20 | 186 |
| CONDUCTOR_MATERIALS | 2 | 2 |
| CONDUCTOR_SIZES | 30 | 30 |
| CABLE_SC_K_FACTORS | 8 | 8 |
| INSULATION_CLASSES | 5 | 5 |
| GROUND_ELECTRODES | 41 | 109 |
| NEUTRAL_GROUNDING_RESISTORS | 4 | 88 |
| SURGE_ARRESTERS | 47 | 103 |
| CABLE_TRAYS | 39 | 95 |
| CABLE_CLEATS | 54 | 152 |
| BOX_FILL | 7 | 7 |
| CONDUITS | 24 | 24 |
| ENCLOSURES | 15 | 156 |
| PROTECTION_CURVES | 5 | 5 |
| SOURCE_REGISTER | 835 | 2313 |
| TERMINATIONS | 25 | 1000 |
| AMPACITY_ROUTES | 28 | 28 |
| AMPACITY_AMBIENT_FACTORS | 15 | 15 |
| AMPACITY_CCC_FACTORS | 7 | 7 |
| AMPACITY_PARAMETERS | 14 | 14 |
| NEC_AMPACITY_2020 | 1524 | 1524 |
| NEC_AMPACITY_2023 | 1524 | 1524 |
| GENERATORS | 3 | 17 |
| MOTOR_LOCKED_ROTOR_CODES | 19 | 19 |
| CABLE_FAULT_CURRENT_REFERENCE | 21 | 21 |
| CABLE_TRAY_EQUIPMENT | 59 | 124 |
| TRAY_EXPANSION_RULES | 13 | 13 |
| CABLE_CLEAT_SIZES | 123 | 123 |
| CABLE_CLEAT_SIZE_MAP | 722 | 722 |
| TRAY_ACCESSORY_RULES | 53 | 53 |
| CABLE_PLANNING_DEFAULTS | 10 | 10 |
| NEC_TRAY_FILL | 24 | 24 |
| NEC_CHANNEL_TRAY_FILL | 6 | 6 |
| TRAY_ENGINEERING_DEFAULTS | 5 | 5 |
| CABLE_IMPEDANCE_DEFAULTS | 9 | 9 |
| TRAY_EGC_METAL_AREA | 9 | 9 |
| EGC_SIZE_BY_OCPD | 21 | 21 |
| EGC_SIZE_THRESHOLDS | 21 | 21 |
| TRAY_EGC_AREA_THRESHOLDS | 10 | 10 |
| TRAY_WIDTH_CODES | 7 | 7 |
| TRAY_BARRIER_COVER_CODES | 4 | 4 |
| TRAY_GROUNDING_ACCESSORIES | 14 | 14 |
| PARTS_CATALOG | 744 | 744 |
| BREAKER_LUGS | 412 | 412 |
| PV_OPTIMIZERS | 36 | 48 |
| CONDUCTOR_PROPERTIES | 25 | 25 |
| LEGACY_NEC_REFERENCE | 2189 | 2189 |
| SHEET_MAP | 93 | 117 |
| FIELD_AUDIT | 1108 | 1643 |
| DATA_ISSUES | 3483 | 3593 |
| RESEARCH_GUIDANCE | 24 | 24 |
| MODEL_REQUIREMENTS | 63 | 63 |
| PV_UNIT_REVIEW | 25882 | 39400 |
| PLUGIN_LOG | 29 | 42 |
| CHANGE_LOG | 12393 | 23641 |
| AUDIT_README | 27 | 51 |
| OPTIMIZER_REVIEW | 36 | 36 |
| DATABASE_TABLE_INDEX | 78 | 116 |
| PAPER_AUDIT | 106 | 106 |
| CALCULATOR_KEY_AUDIT | 78 | 78 |
| CABLE_NORMALIZATION | 10621 | 10621 |
| NUMERIC_BENCHMARKS | 5 | 5 |
| REQUEST_AUDIT | new | 18 |
| EQUIPMENT_RECORD_HISTORY | new | 33 |
| RECORD_RECONCILIATION | new | 110 |

#### Status on the live site
The files are in this package (`SITE/database/`) and tested in Chrome (all 96 sheets and 13 pickers load through the site's own validators, 0 errors). They are **not yet on the live site**: ~10 MB of compressed files could not be sent through the Wix connection available to the assistant. Run `DEPLOY/deploy_database_to_wix.py` (instructions inside; it checks the live site first and verifies every file after upload).


---

## A9. V29 issues and backlog (updated to V33)


*Source file: `REPORTS/V29_ISSUES_AND_BACKLOG.md`*

### V29 issues and backlog

#### Fixed in V29
| ID | Issue | Evidence |
|---|---|---|
| V29-01 | 17 database files outside `SITE/database/` in the repository (404 on `database/manifest.json.txt`) | Browser network log; hashes now match V28 manifest |
| V29-02 | SLD Delete button for sources/devices drawn at `translate(NaN 20)` | Browser DOM check before/after |
| V29-03 | Implausible inputs accepted without any warning (1e300 A, 200 % Z, X/R 1e12, X/R 0) | Adversarial suite |
| V29-04 | No transformer impedance-tolerance envelope or NEC 110.24 label | Competitor review (Bussmann FC2) |
| V29-05 | Arc-flash dialog depended on an external server outside the owner's control; inputs left the browser | Local IEEE 1584-2018 engine, 105,120 official cases |

#### Done in V33 (13–14 Nov 2026) — code is live
- **Plants with many inverter sources now calculate.** A 1,900-bus plant with 1,681 inverters failed on the live V32 site at the 30 s limit. V33 on the live site: 24.368 kA at POI. 4.8 million values compared with the V32 engine, 0 differences. (`QA/V33_SOURCES/`)
- **Time limit grows with project size** (30 s normal, about 2 minutes for the largest plants, at most 3 minutes).
- **Engine speed.** 1,970-bus / 71-source plant: 3.3 s → 1.9 s. 1,900 × 1,681: 83 s → 4.5 s (Node).
- **Results and report pages on such a plant.** Step-by-step tables for the 40 largest contributions, with a note. Choosing another bus: 21 s → 4–5 s. Report page: 16 s → 6.5–8 s.
- **Report says why source rows are limited** on such a plant.
- **Security check (part of B2).** Script-like text in 74 fields cannot run; CSV and Excel exports cannot carry live formulas. (`QA/V33_SECURITY/`)
- **Deployed and read back.** 18 of 18 changed text files and the bundle identical to the package. V32 feature list repeated on the live site at desktop width. (`QA/V33_LIVE_CHECK/`)
- **All eight V32 feature groups checked on a local copy, desktop and phone width (A1/A2):** 124 pass, 2 fail (one event, also on V32, item 5 below), 2 not tested. (`QA/V33_VERIFY/`)
- **Fonts and icon served from the site (D6)** — in the package only, see item 1 below.

#### Open after V33 (ranked, updated 15 Nov 2026)
1. **Fonts on the live site (rest of D6).** Upload `fonts/*`, `public-style-v21.css`, `network-style.css` with a binary-capable tool.
2. **B3 accessibility findings**: one-line SVG symbols — accessible name must contain the visible text (WCAG 2.5.3) and no focusable group inside a focusable diagram (4.1.2); Cloud Vault `#fcs-original-backup` needs a label.
3. **Low priority (owner, 15 Nov): phone layout.** Phone users can zoom. Known: phone emulation, Operating studies, 1,970 buses — mouse click on "Enter 0 MW / 0 Mvar…" times out with `operating-table-ui-v33.mjs`; tap works.
4. **Low priority (owner, 15 Nov): C2** add one item takes about 5 s only on very large one-lines (about 2,000 buses); normal projects are fast.
5. **D1** unbalanced load flow; **D3** "Open this study in browser"; **D5** atlas items.
6. **B1 rest**: IEC TR 60909-4 multi-source example, IEEE 399/551, ANSI C37, IEC 61660 / IEEE 946, IEC 60287, TCC curve points; a published multi-bus case for the main engine.
7. **B2** line-by-line review; wrap `localStorage.setItem` in try/catch.
8. **B4** independent cross-check with free open tools (pandapower IEC 60909, OpenDSS) on the same networks. No paid tool is needed or used.
9. Very large reports (PDF over 2,000 pages; phone-width "All fault locations" memory).
10. Three V32 comparison scripts need V31 reference files.
11. Database v13 publication (owner decision, E1).

Done in V33 (14–15 Nov): plant-scale solver and watchdog, C1 result cache, C3 DC lean results, C4 operating bus table, C6 row redraw, D2 connection editing with preview, D4 verified, E2 notice, B1 95 published values, B3 five-width audit.

#### Done in V32
- V31-01 done: sparse connected-sequence and split-phase solvers with compact results (2,000 buses in seconds; equal to dense).
- V31-02 done: arc flash at every bus uses a bridge-based device lookup (147 s → about 5 s), plus an option to bracket screening-bound currents.
- V31-03 done: tree auto-arrange above 40 buses.
- V31-04 partly done: the Equipment table adds and deletes items (connections are still edited on the one-line).
- V31-05 done: Build plant attaches blocks to existing buses and generates DC arrays.
- New: Report contents chooser (sections, scope, extra studies); large Excel/PDF reports; sparse load flow with closed-switch bus merging; IEEE 1584 calculation in the Engineering studies arc-flash card.

#### Open after V32
| ID | Item | Priority |
|---|---|---|
| V32-01 | Undo/redo and add-item are about 6–8 s on 2,000-bus projects (full recalculation); make them incremental | P1 |
| V32-02 | Operating-study per-field entry is about 2 s on large projects; add bulk entry or CSV for loads | P1 |
| V32-03 | Unbalanced (per-phase) load flow | P2 |
| V32-04 | Z-tolerance envelope is 9–14 s on 70 transformers | P2 |
| V32-05 | Atlas items not built (see V31-06) | per atlas |
| V32-06 | Database v13 publication (owner decision) | owner |

#### Done in V31
- Sparse AC fault solver and compact plant-scale results (full detail for the selected bus); factored DC array solver.
- Large one-line: visible-area drawing, zoomed-out overview, Find; geometry cache and grid label placement; V30 label-background layout stall removed.
- Build plant (PV/BESS block generator, user data only) and Equipment table (CSV download/edit/upload).
- Projects on your computer (folder of `.fcs.json` files, autosave, reconnect after reload).
- Capability atlas: reference names removed from the page; statuses updated; product names removed from two other visible texts.
- Database picker in the inspector themed (light panel left over from V30).

#### Open after V31 (next rounds)
| ID | Item | Priority |
|---|---|---|
| V31-01 | Scale connected-sequence (SLG/LL/DLG) and split-phase solvers to plant size | P1 |
| V31-02 | Arc flash at every bus on 2,000-bus projects: device search per bus is quadratic; index it | P1 |
| V31-03 | Auto-arrange for large projects not built with Build plant (tree layout, collapsible blocks) | P1 |
| V31-04 | Equipment table: create / delete items and edit connections; validation preview before applying | P2 |
| V31-05 | Build plant: several block types per project; DC side (strings, combiners, fuses) generated together with the AC side | P2 |
| V31-06 | Atlas gaps (IEC 60909 full, ANSI C37, selectivity, IEC 60287 duct banks / IEC 60853, pulling and cleat forces, N-1 and unbalanced load flow, hosting capacity, frequency sweeps, IEEE 80, IEC 61660, dispatch, PV yield, microgrid dynamics, CIM, provenance/traceability) | per atlas |

#### Done in V30
- Stitch theme (dark engineering workbench), self-hosted Inter + JetBrains Mono.
- Layout clean-up: no floating buttons over content, palette labels no longer cut, one-line labels sized to text, wide tables shown as cards when they cannot fit, long drop-down options wrap. Automatic layout audit at 5 widths: 0 findings.

#### Done in V29e
- Fixed off-nominal transformer tap in load flow.
- One-line breakers / fuses / reclosers linked automatically to the per-bus arc-flash device picker.
- Relay tolerance bands; LV breaker electronic trip (LSI) model.
- Conductor sizing: NEC 240.4 OCPD check and 250.122 EGC.
- Published TCC plot-point library (ERMCO 9F54DFC) and 2-column manufacturer curve entry.

#### Done in V29d
- Clearing time from relay curve / definite time / manufacturer curve dropdowns, used by per-bus arc flash and conductor sizing.
- IEEE 519 PCC check; PF correction with resonance check.
- User R/X in conductor sizing.
- Engineering master database v13 imported (not yet live: run DEPLOY/deploy_database_to_wix.py).

#### Done in V29b
- Off-nominal transformer tap in fault studies (all sequences, form, report, bundle) with oracle tests.
- Arc flash at every bus with NFPA 70E 130.5(H) label content (clearing times required, never assumed).
- Combined conductor sizing (ampacity + voltage drop + short-circuit).

#### Cleared by test (no change needed)
| ID | Item | Evidence |
|---|---|---|
| H-01 | Historic 65 kA vs 56 kA on buses with no impedance between them | Equal to 1e-6 at 10, 65 and 100 kA |
| H-02 | Transformer LV current copied from primary | 3,400 A primary → 32,726 A at 208 V; infinite-bus checks exact |
| H-03 | Double-click properties, Ctrl+Z / Ctrl+Y, Esc | Browser test, desktop and mobile |

#### Open, ranked
| Priority | Item | Notes |
|---|---|---|
| P0 | Full audit of everything, from zero to finish | Owner asked for it after Step 4 |
| P0 | Live click-through of the deployed V30 site (desktop and mobile) | Deployed and HTTP-verified; real-browser check must be done from a network that can reach the site |
| P0 | OEM TCC data for LV breakers and fuses | Tolerance bands, LSI model and a numeric plot-point library are in (V29e); most OEM curves are graphs only and must be typed from datasheets. Add more numeric sources as found |
| P0 | Wix HTTP 429 / startup, Chromium 11th-download timeout | Not reproducible offline |
| P1 | Off-nominal tap in the split-phase study; automatic tap changing in load flow | Fixed tap in load flow done in V29e |
| P1 | Conductor sizing: raceway fill, 240.21 taps, Art. 430 motor circuits; built-in R/X for 14–10 AWG and 3 AWG | User R/X entry added in V29d; built-in values need NEC Chapter 9 Table 9 (licensed copy) |
| P0 | Upload master database v13 to the live site (owner will decide when) | Run DEPLOY/deploy_database_to_wix.py (needs Wix CLI login on the owner's computer) |
| P0 | Read the NEC books | Files are in Dropbox; not reachable from here. Upload to Google Drive or GitHub, or connect Dropbox |
| P1 | Optional: light theme switch; printed reports in the new look | V30 theme is dark, screen only; print/PDF/XLSX keep their existing light layout |
| P2 | Drop-down text wrapping in Safari/Firefox | Uses Chromium's customizable select; other browsers show the normal native list (long names may be cut in the closed box on phones) |
| P1 | Scenario comparison; relay coordination (selectivity) check between devices in series | Not built |
| P1 | Motor contribution quick estimate (≈4 × FLA), labelled as estimate | Point-to-point practice |
| P1 | pandapower IEC 60909 cross-check | Independent published engine |
| P1 | Unbalanced load flow; IEEE 80 grounding; IEC 60853 cyclic cable | Large methods |
| P1 | Restore QA evidence to the folders named in `TRANSFER_MANIFEST_SHA256.json` | Content identical; cosmetic |
| P2 | Dynamic motor starting, stability, reliability Monte Carlo, CAD/BIM export | Long term |

#### Missing resources (need the owner)
- Calculator spreadsheets from earlier chats (about 100) and any project PDFs/images: not in the repository.
- `ENGINEERING_DATA/Original_Audited_Master_Database.xlsx`, the private v51 site, Batch 10–14 archives and the six Cable Thermal Studio reference workbooks.


---

## A10. V29 Part 1 — inputs, files and studies


*Source file: `REPORTS/V29_PART1_Inputs_Files_Studies.md`*

### Fault Current Studio: inputs, files and studies (Part 1)

Prepared 7 November 2026 from the files in the `classroomsolar/Electrical-Studies` repository. Everything below was read from those files. Earlier ChatGPT chats, PDFs and images that are not in the repository could not be seen and are not listed as if they were.

---

#### A. All written inputs (instructions)

Sources: `Prompt.docx` (P), `MASTER_CONTINUATION_PROMPT.docx/.txt` (M), `REQUIREMENTS/PRIOR_MASTER_HANDOFF_2026-10-25.md` (H), `REQUIREMENTS/V28_ORIGINAL_NEW_CHAT_PROMPT.md` (V), `START_HERE.md` (S), `RELEASE_STATE.json` (R), and the requests made in this chat (C).

##### A1. Project rules
1. Continue the existing Fault Current Studio. Do not restart, rebuild, discard or overwrite completed work. (P, M, H, V)
2. Do not create a new Wix website. Deploy only to the original Wix site. (P, M, S)
3. Continue from V28 (236 website files). V27 (234 files) was the last confirmed live release. (P, M, R)
4. Keep every existing feature, formula, dropdown, saved-study key, project JSON format, Cloud Vault and report engine. (M, V, C)
5. Do real development and testing, not just lists of unfinished work. (P, M, H)
6. Do not claim 100 % completion until every requirement and acceptance test passes. (P, M, H, V)
7. Do not claim full IEC/IEEE/OEM compliance or recovered private studies without evidence. (M, H, V)
8. Keep Fault Current Studio separate from Cable Thermal Studio and the other calculators in the 22-calculator portfolio. Share code only through versioned interfaces. (M, H)
9. Keep the public V21/V27/V28 branch, the private v51 site and the Batch 14 engineering branch separate. Compare before merging; never merge because numbers look alike. (M, H)
10. Do not recommend Formula Genius or Coursera, or another paid AI tool. (M, H)
11. Do not distribute restricted standards text or licensed fonts. No hard-coded passwords. (M, H)
12. Ask the user only when an authorization or private resource is truly needed. Otherwise continue. (M, H)
13. Upload only a complete, tested site file set. Never upload partial Wix files. (M, V)
14. Keep the work owner-controlled and recoverable (Git/CI preferred), not dependent on one ChatGPT account. (M, H)
15. Make the changes, save them in the same files and location, and send the updated files in this chat. Do not use GitHub. (C)

##### A2. User experience
16. Browser-based, responsive (desktop, tablet, mobile). No account or installation needed for public calculations. (M, H)
17. A central Inputs workspace and a separate Single-Line Diagram page, a results dashboard, an equipment database, a study workspace, project history, print and reports. (M, H)
18. On the SLD: add, remove and connect unlimited equipment (utility, generator, motor, PV, IBR, BESS, buses, cables, transformers, protective devices, relays, fuses, switchgear, panels, grounding). (M, H)
19. On the SLD: valid terminals, From/To, duplicate, rename, delete, multi-source meshed connections, voltage changes, phase systems, zoom/pan/fit. (M, H)
20. Keyboard: Esc cancels, Ctrl+Z undo, Ctrl+Y redo, focus-safe shortcuts; double-click opens equipment properties. (M, H)
21. No dead buttons and no silent failures. (M, H)
22. Projects: create, edit, clone, rename, delete, version, local save and autosave, reopen, recover, JSON import/export, scenario saves, consent before deletion, optional encrypted Cloud Vault, owner-authorized backup/restore. (M, H)
23. Reports in PDF, XLSX, CSV and JSON with assumptions, inputs, units, source contributions, scope, warnings, equipment duty and provenance. Downloads and print must match the screen. (M, H)

##### A3. Engineering methods (agreed scope)
24. **Short circuit and duty:** radial and meshed networks, per-unit, Thevenin, symmetrical components, 3-phase, SLG, LL, DLG, single/split-phase and DC where physics allows, transformer ratios and vector groups, max/min sources, generator/motor/IBR/PV/BESS contributions, source-by-source currents, X/R, peak, making, breaking, interrupting, short-time duty, IEC 60909 and separate ANSI/IEEE methods. (M, H)
25. Reproduce and fix the historic 65 kA (utility) vs 56 kA (adjacent bus, no impedance) case and the transformer LV current-base defect. Fix causes, not numbers. (M, H)
26. **Load flow and power quality:** balanced and unbalanced, PQ/PV/slack, taps, phase shift, losses, voltage drop/rise, reactive limits, branch and protection limits, N-1, time series, DC networks. (M, H)
27. **Protection:** OEM breaker, fuse, recloser and relay curves, CT/PT and saturation, overcurrent, ground, directional, differential, voltage, frequency, grading, let-through, damage curves. Never label a generic curve as OEM. (M, H)
28. **Arc flash:** IEEE 1584 (correct edition), eligibility checks, electrode/enclosure/gap/working distance, arcing current variation, clearing times from real curves, incident energy, boundary, labels. No invented PPE or compliance claims. (M, H)
29. **Cable thermal:** IEC 60287 full model, AC resistance, sheath/bonding, soil/duct/tray/air, mutual heating, cyclic/emergency/transient, adiabatic I²t. Keep the V28 k-method. Keep NEC/Neher-McGrath separate from IEC. (M, H)
30. **Harmonics:** spectra, THD/TDD with correct PCC Isc/IL, IEEE 519, harmonic load flow, resonance, filters, heating, inverter harmonics. (M, H)
31. **Grounding:** neutral topology, NGR, zig-zag, earth faults, soil resistivity, grid design, GPR, touch/step/transfer potential, rods and conductors. (M, H)
32. **PV/BESS/IBR/DC/microgrid:** string and inverter limits, inverter fault envelopes, P-Q/PF/Volt-VAR, SOC and battery limits, DC protection, import/export, islanding, dispatch, load shedding. Keep the V27 PV/BESS operations work. (M, H)
33. **Motors, dynamics, reliability:** motor starting and torque, voltage sag, transient and frequency response, N-1, islanding, SAIFI/SAIDI/CAIDI/ASAI, loss and economic studies. (M, H)
34. Each method states validity limits, units, sources, assumptions, references, uncertainty and provenance, and is checked against independent engines and published examples. (M, H)

##### A4. Equipment database
35. Keep the site database paths, stable equipment IDs, 93+ sheet provenance, curated vs non-curated split, ratings, units and standard editions, duplicate detection, reversible merges and source logs. (M, H)
36. Do not fabricate missing zero-sequence R/X, curves, k-factors, inverter fault data, temperature limits, interrupting ratings or SCCR. (M, H)
37. The audited master workbook is a reference, not a replacement for the live 135-path site catalogue. (M)

##### A5. Testing and records
38. Re-run the 16 advanced modes on desktop and mobile with PDF/XLSX exports, plus all V27/V28 workflows. (M)
39. Investigate separately: Wix HTTP 429 and asset-loading errors, and the Chromium 11th-download timeout. (M, V)
40. Test reproducibility, regressions, file integrity, input validation, keyboard/touch, accessibility, corrupt storage, save/reopen/clone, backup/restore, encryption, network failures and performance. (M, H)
41. Keep `RELEASE_STATE`, `PROGRESS`, `ISSUES`, `DECISIONS`, `TEST_RESULTS`, `DATABASE_PROVENANCE`, `RELEASE_GATE`, architecture and references, with P0/P1/P2 priorities. (M, H)

##### A6. Requests made in this chat (C)
42. Verify everything three times and correct memory.
43. List all inputs, check the list three times, and send a corrected list with nothing missing.
44. List all PDFs and images, check three times, and match them with the written inputs.
45. Keep it plain and simple. Do not leave anything out.
46. List all studies possible with this information.
47. Say whether this is the best calculator, compare it with other calculators (online and downloadable), and adopt their best features.
48. Look for many calculators, research papers, field experience, books and codes, and adopt the good parts without breaking current work.
49. Challenge the calculator with many logical input scenarios (200 iterations requested), learn from failures and fix them.

---

#### B. Key fixed values in the inputs

| Item | Value |
|---|---|
| Public website | https://headless-dlrpfrynayh-classroomsolar-140e.wix-site-host.com/ |
| Wix metaSiteId | 97613ac8-1f7d-4ecf-8fa4-2d589c387775 |
| Last confirmed live release | V27, 234 files, revision 7833f76548763c45152264ef08be50519d8ed752 |
| Latest saved release before this work | V28, 236 files, offline validated, not deployed (26 Oct 2026) |
| V28 site source SHA-256 | b662c1525f722cc58454601ef1879b0f8098d9f7d05f5d576995ccdaae4782b6 |
| Database paths in site | 135 |
| Private original site (not in repo) | https://jay-fault-current-studio.thesocialjay3.chatgpt.site, project appgprj_6ac209d855f08191ab639aea69332785, source v51, commit 3087b32a551f3a8cdfe07bdf4a49541e7e6963dc |
| Historic database figures | 40,796 curated records; 81,124 non-curated indexed records; 93 sheets compared; 284,014 differing cells |
| Historic defect to clear | ≈65 kA at utility vs ≈56 kA at the adjacent bus with no impedance between |
| Reference fault values (worked example) | 3,400 A at 12 kV; 32,725.858 A at 208 V transformer secondary; 16,706.173 A at the main panel |
| Recorded V28 QA | 128 V20/V27 PDF/XLSX downloads, 19,848 data checks; 1,200 transformer cases (24,000 comparisons); 1,500 conductor cases (9,000 comparisons); 43 invalid inputs rejected; 18 V28 downloads |
| Known open issues | Wix HTTP 429 and asset loading; Chromium 11th-download timeout; live browser acceptance; private cloud studies |

##### B2. Historical facts named in the inputs (from earlier branches, not re-tested here)
- Public v21: about 139.7 MB recovery archive and 6.56 MB website source; 74 bundled browser modules; 226 (228 in one variant) earlier public file paths; 10 page loads and 16 advanced UI calculations recorded.
- Batch 14 archive: 75,298,957 bytes, built on Batch 13's 527 entries; Batch 14 delta 36,074 bytes; Batch 10 archive 75,171,457 bytes.
- Batch 10 checks: 145 latest checks, 41 operating, 42 nominal protection, 10 PV Q-limit, 51 other screenings, 14 N-1, 24 deep fault-audit tests over 240 fault cases and 7,200 terminal phasors, 11/11 source-preservation checks, 43 Python thermal tests; 1,009 preview samples of non-curated records.
- Batch 11: 38 tests. Batch 12: 19 restore tests and 8 CI checks. Batch 13: 26 OEM-curve tests and 48 modules in a DOM smoke. Batch 14: 19 engine/storage/report checks and 26 HTTP tests (45 new), 12 dependency-free suites.
- V20 handoff manifest: 232 entries verified. V28 transfer: 205 QA files.

---

#### C. All PDFs, images and other files in the repository

There are **no drawings, site photos or project PDFs** in the repository. All PDFs and images are test outputs created by earlier QA runs. If you shared drawings or photos in earlier chats, please attach them here so they can be added.

| Type | Count | Where | What they are |
|---|---|---|---|
| PDF | 86 | `QA/browser_V20` (32), `QA/browser_V27` (32), `QA/browser_v28` (6), `QA/exports` (16) | Browser-downloaded reports from the 16 advanced modes (desktop and mobile) and the V28 conductor I²t tool |
| PNG image | 3 | `QA/browser_V20/mobile_modal.png`, `QA/browser_V27/mobile_modal.png`, `QA/browser_v28/mobile_conductor_modal.png` | Mobile screenshots from QA |
| Word | 2 | `Prompt.docx`, `MASTER_CONTINUATION_PROMPT.docx` | Your instructions (the Word prompt matches the .txt copy word-for-word apart from its title block) |
| Excel | 187 | `Spreadsheets` (99), `COMPARISON` (2), `QA` (86) | 99 equipment/reference database workbooks; 2 competitor benchmark workbooks; 86 QA report exports |
| Website files | 236 | `SITE` | V28 website, now V29 (see release report) |
| Markdown / text / JSON / Python | 4 / 138 / 24 / 6 | root, `REQUIREMENTS`, `REPORTS`, `QA` | Prompts, release report, manifests, QA scripts and results |

The 16 advanced modes tested in the QA PDFs: fault, multisource, multivoltage, transformer60909, sequence, multisequence, multienvelope, contingency, peakscreen, faultsweep, thermal, resistance, buried, protectionrange, phasorduty, acdcwave.

The 99 database workbooks: CABLES, CABLE_TRAYS, CABLE_TYPES, CALCULATOR_KEY_AUDIT, CEC_ASSEMBLY_RELATIONS, CEC_BATTERIES, CEC_BATTERY_ARCHIVE, CEC_BATTERY_INVERTERS, CEC_ENERGY_STORAGE, CEC_FIELD_MAP, CEC_FILE_RECONCILIATION, CEC_IMPORT_INDEX, CEC_INVERTER_ARCHIVE, CEC_LEGACY_PCS, CEC_LISTING_LINKS, CEC_METERS, CEC_MODEL_GROUPS, CEC_PMRS, CEC_PMRS_HISTORICAL, CEC_POWER_CONTROL, CEC_PV_ACTIVE, CEC_PV_ARCHIVE, CEC_SOLAR_INVERTERS, CEC_SOURCE_NOTES, CEC_V2G, CHANGE_LOG, CONDUCTOR_MATERIALS, CONDUCTOR_PROPERTIES, CONDUCTOR_SIZES, CONDUITS, CONDUIT_FIRE_PROTECTION, CSD_DEVICES, DATABASE_TABLE_INDEX, DATA_ISSUES, DISCONNECTS, EGC_SIZE_BY_OCPD, EGC_SIZE_THRESHOLDS, ELECTRONIC_CONTROLLERS, ENCLOSURES, EQUIPMENT_RECORD_HISTORY, FIELD_AUDIT, FIRE_PROTECTION, FUSES, GENERATORS, GROUND_ELECTRODES, HARMONICS, HV_BREAKERS, HV_BREAKERS_EXTENDED, IBR, INSTRUMENT_TRANSFORMERS, INSULATION_CLASSES, INTERRUPTION_COST, LEGACY_NEC_REFERENCE, LV_BREAKERS, MODEL_REQUIREMENTS, MOTORS_NAMEPLATE, MOTOR_CHARACTERISTICS, MOTOR_LOCKED_ROTOR_CODES, MOTOR_MODELS, NEC_AMPACITY_2020, NEC_AMPACITY_2023, NEC_CHANNEL_TRAY_FILL, NEC_TRAY_FILL, NEUTRAL_GROUNDING_RESISTORS, NUMERIC_BENCHMARKS, OPTIMIZER_REVIEW, OVERLOAD_HEATERS, PAPER_AUDIT, PARTS_CATALOG, PLUGIN_LOG, PROTECTION_CURVES, PV_MODULES, PV_OPTIMIZERS, PV_UNIT_REVIEW, RAILWAY_LOADS, RECLOSERS, RECORD_RECONCILIATION, RECTIFIERS, RELAYS, RELIABILITY, RELIABILITY_EXTENDED, REQUEST_AUDIT, RESEARCH_GUIDANCE, SHEET_MAP, SOURCE_REGISTER, SURGE_ARRESTERS, SWITCHGEAR, TERMINATIONS, TRANSFORMERS, TRANSMISSION_CONDUCTORS, TRAY_ACCESSORY_RULES, TRAY_BARRIER_COVER_CODES, TRAY_EGC_AREA_THRESHOLDS, TRAY_EGC_METAL_AREA, TRAY_ENGINEERING_DEFAULTS, TRAY_EXPANSION_RULES, TRAY_GROUNDING_ACCESSORIES, TRAY_WIDTH_CODES, TRIP_DEVICES.

##### Files named in the inputs but not in the repository
- `SITE/Fault_Current_Studio_V28_Complete_Website_236_FILES.zip`: not present, but all 236 extracted website files are present and were hash-checked.
- `ENGINEERING_DATA/Original_Audited_Master_Database.xlsx`: not present. The 99 workbooks in `Spreadsheets/` appear to be its sheets saved separately; this has not been proven cell by cell.
- Older archives and reports mentioned as history. None are in this repository: `Fault_Current_Studio_Public_v21_Cumulative_Recovery(3).zip`, `Fault_Current_Studio_Public_v21_Live_Website_Source(3).zip`, `Fault_Current_Studio_Public_v21_Release_Report.md`, `Fault_Current_Studio_Public_v21_Browser_Acceptance_Supplement.json`, `Fault_Current_Studio_Batch14_Standalone_Fix_2026-10-25.zip`, `Fault_Studio_Batch14_Report_2026-10-25.md`, `Fault_Current_Studio_Batch14_Only_Changes_2026-10-25.zip`, `Fault_Current_Studio_Batch13_Consolidated_2026-10-25.zip`, `Fault_Studio_Batch13_Open_Items_2026-10-25.csv`, `Fault_Current_Studio_Batch10_Consolidated_2026-10-25.zip`, `Fault_Studio_Batch10_Report_2026-10-25.md`, `Fault_Studio_Batch10_Open_Items_2026-10-25.csv`, `Fault_Current_Studio_Latest_Files_2026-10-24.zip` (original v51), `Engineering_Master_Database_v10_Audited.xlsx`, `MASTER_DEVELOPMENT_INSTRUCTION.md`, `README_BATCH10_FIRST.md`, `README_FINAL_FIRST.md`, `OPEN_ITEMS_BATCH10.csv`, `OPEN_ITEMS_BATCH13.csv`, and the earlier package names `README_START_HERE.md`, `Release_Report.md`, `V28_Complete_Website_236_FILES.zip`.
- Also not in the repository: the private v51 site source, private cloud studies and the six Cable Thermal Studio reference workbooks.
- Present in the repository: `MASTER_CONTINUATION_PROMPT.txt`, `REPORTS/V28_Release_Report.md`, `QA/V28_QA_Evidence.json`, `VERIFY_TRANSFER.py` (it expects the original outer ZIP, which is not in the repository, so it cannot run as written).
- Record files the inputs ask to keep (`REQUIREMENTS.md`, `ARCHITECTURE.md`, `PROGRESS.md`, `ISSUES.md`, `DECISIONS.md`, `TEST_RESULTS.md`, `DATABASE_PROVENANCE.md`, `RELEASE_GATE.md`): none existed in the repository. V29 adds `REPORTS/V29_ISSUES_AND_BACKLOG.md` and `REPORTS/V29_TEST_RESULTS.md` as a start.

---

#### D. How the lists were checked (three passes)

| Pass | What was checked | Result |
|---|---|---|
| 1 | Read every requirement file end to end and wrote list A. The Word prompt and the .txt prompt were compared word by word. | Identical apart from the Word title block |
| 2 | Every URL, ID, file name and number in the requirement files was extracted by script and checked against this document. | First run found 33 file names and 12 historical numbers missing from the draft; they were added (sections B2 and C). Second run: none missing |
| 3 | The file lists were rebuilt from the disk and from `TRANSFER_MANIFEST_SHA256.json` and `QA/V28_SHA256_Manifest.json` using SHA-256. | 216 of 218 transfer files are present and byte-identical (186 sit one folder higher than the manifest says). The 2 missing files are listed above. All 236 website files match the V28 manifest. **17 database files had been uploaded to the wrong folder; they were moved back (see the V29 release report).** |

**Match between the written inputs and the files:** the QA PDFs, images and Excel exports are the evidence for items 23 and 38. The 99 database workbooks are the reference data for items 35 to 37. No file contradicts a written input. One written input, the transfer manifest location of the QA results, does not match the repository folders; content is identical.

---

#### E. Studies that can be done with this information

**Working in the current calculator (bounded methods, entered data):**
1. Three-phase short circuit, radial and meshed, multiple sources, multiple voltage levels
2. SLG, LL and DLG faults with entered sequence impedances (single bus and multi-bus)
3. Single-phase / split-phase faults (bounded)
4. DC resistive pole-to-pole fault currents (bounded)
5. Source-by-source fault contributions and branch currents
6. X/R, peak current (IEC κ), asymmetrical duty screening
7. Equipment duty check: SCCR, interrupting rating, peak rating, voltage rating
8. IEC 60909 transformer correction (K_T) envelope
9. Maximum/minimum fault scenario envelopes and bus fault sweeps
10. Time-varying generator/motor contribution and DC-offset waveform duty
11. Conductor adiabatic I²t short-circuit withstand (V28)
12. **Transformer impedance-tolerance fault envelope and NEC 110.24 label (new in V29)**
13. Balanced AC load flow (Newton-Raphson), PV-bus reactive limits, voltage drop/rise, losses
14. N-1 branch-outage contingency screening
15. AC time-series load flow and PV + BESS hourly dispatch, import/export, SOC, cost and battery size comparison (V27)
16. IEC 60287 cable rating: AC resistance, direct-buried single core, core thermal equation
17. Protection coordination margin with entered or documented curves (IEC inverse-time arithmetic, range checks)
18. IEEE 1584-2018 arc flash: arcing current, incident energy and boundary at full and reduced arcing current (V29: computed in the browser, verified against 105,120 official IEEE cases)
19. Harmonic THD/TDD arithmetic and a harmonic network equivalent
20. Ground potential rise arithmetic
21. Motor-starting static voltage dip
22. Reliability indices SAIFI, SAIDI, CAIDI, ASAI
23. Equipment selection from the database: cables, breakers, fuses, transformers, PV modules, inverters, batteries, relays, reclosers, switchgear, NGRs, surge arresters, trays, conduits
24. NEC ampacity (2020/2023), EGC sizing, tray and conduit fill from the reference tables
24a. **Arc flash at every bus with label content (new in V29b)**: bolted current from the network, typical IEEE 1584 equipment values, user clearing times
24b. **Combined conductor sizing (new in V29b)**: NEC 310.16 ampacity with ambient, bundling and termination limits, voltage drop, short-circuit withstand
24c. **Transformer off-nominal tap in fault studies (new in V29b)**
24d. **Protective-device clearing time from relay / manufacturer curves (new in V29d)**
24e. **IEEE 519 PCC harmonic check and PF correction with resonance check (new in V29d)**
24f. **Transformer tap in load flow; one-line breakers/fuses linked to the arc-flash device picker; relay tolerance bands; LV breaker LSI trip model; NEC 240.4 OCPD and 250.122 EGC in conductor sizing; published TCC plot-point library (new in V29e)**

**Possible with this data, but not yet built or not complete:**
25. Arc-flash device picked automatically from the SLD protective devices (today chosen per bus in the arc-flash table)
26. Full ANSI C37 breaker duty and full IEC 60909 max/min with all correction factors
27. IEC 61660 DC fault current with time decay
28. Unbalanced three-phase load flow; automatic tap control; off-nominal tap in load flow
29. OEM time-current coordination with tolerance bands, CT saturation, sequence of operation
30. IEEE 80 grounding grid touch/step design and soil models
31. IEC 60853 cyclic/emergency cable rating; Neher-McGrath; duct banks
32. Harmonic frequency scans (network-wide)
33. Dynamic motor acceleration; transient and small-signal stability
34. Battery degradation and tariff-optimised dispatch


---

## A11. V29 Part 2 — calculator comparison


*Source file: `REPORTS/V29_PART2_Calculator_Comparison.md`*

### Is this the best calculator? Comparison with other tools (Part 2)

Prepared 7 November 2026. Plain answer first, then the evidence.

#### Plain answer

**No. Fault Current Studio V29 is not the best or most complete calculator available.** It is a strong, transparent, free, browser-based fault-current tool with a connected single-line model, but professional suites still do more:

- **ETAP, EasyPower, SKM PowerTools, DIgSILENT PowerFactory, Siemens PSS SINCAL, NEPLAN, CYME, ERACS and IPSA** all have full IEEE 1584-2018 arc flash, OEM protective-device libraries with tolerance bands, full ANSI C37 / IEC 60909 duty, unbalanced load flow, transient stability and harmonics. Studio has only bounded versions of these, or none.
- **Siemens SIMARIS design** (free) sizes cables and protection from real Siemens products and shows selectivity with tolerance bands.
- **Eaton Bussmann FC2** (free app) is quicker for simple point-to-point checks and prints NEC 110.24 labels. Studio did not have this label until V29.

**Where Studio is already better than most free calculators:**
- It solves real meshed, multi-source, multi-voltage networks. Most free online calculators use the point-to-point method, which suits only simple radial systems.
- It shows source-by-source contributions, X/R and peak current, and rejects bad inputs instead of guessing.
- It works offline in the browser and exports PDF, Excel and JSON with full inputs and warnings.
- Its numbers match an independent solver exactly (see the V29 test results).

The "about 100 spreadsheets" made in earlier chats are not in this repository. The repository has 99 equipment and reference database workbooks, which Studio uses as data. A spreadsheet-by-spreadsheet comparison needs those calculator files to be attached.

#### Update (later on 7 Nov 2026)

A research bot then verified **100 tools** (about 75 distinct products when vendor modules are counted once), each with a source URL, plus a 12-family method and standards register. See `research/calculator_survey.md` (with a ranked Top 25 features list) and `research/method_reference_register.md`. From that list, #1 (NEC 110.24 label) and #3 (arc flash at full and reduced arcing current) are now in the live calculator.

#### Tools reviewed (first pass)

The earlier benchmark workbooks in `COMPARISON/` already cover 16 tools and 114 features; their status was rechecked against the current source code. This work added the tools marked **new**. In total, 30 tools were reviewed. The 100-calculator and 100-research-paper targets were not reached in this pass: this report lists only tools whose published features were actually checked, rather than padding the list.

| # | Tool | Type | What it does better than Studio today | Adopt into Studio? |
|---|---|---|---|---|
| 1 | ETAP | Commercial suite | Complete AC/DC short circuit, arc flash, protection, dynamics | Method targets (P0/P1) |
| 2 | EasyPower (Bentley) | Commercial suite | Interactive TCC editing, arc flash, motor starting | TCC workflow, arc-flash labels |
| 3 | SKM PowerTools | Commercial suite | Duty, coordination and arc flash with OEM data | OEM provenance pattern |
| 4 | DIgSILENT PowerFactory | Commercial suite | Unbalanced flow, IBR models, EMT, IEC 60909 detail | IEC 60909 correction factors |
| 5 | Siemens PSS SINCAL (**new**) | Commercial | Full unbalanced model for HV/MV/LV | Unbalanced load flow (P1) |
| 6 | Siemens PSS/E (**new**) | Commercial | Transmission flow, dynamics, contingency | Out of scope |
| 7 | NEPLAN (**new**) | Commercial | Cloud network analysis, OPF, reliability | Reliability methods (P2) |
| 8 | Eaton CYME | Commercial | Distribution time series, hosting capacity | Hosting capacity (P1) |
| 9 | Eaton CYMCAP | Commercial | IEC 60287/60853 cable rating | Cable thermal (P0/P1) |
| 10 | ERACS (**new**) | Commercial | Load flow, faults, harmonics, protection, arc flash | Benchmark only |
| 11 | IPSA (**new**) | Commercial | Unbalanced faults, G5/5 harmonics, DC networks | Benchmark only |
| 12 | PowerWorld (**new**) | Commercial | Transmission visualisation | Out of scope |
| 13 | Siemens SIMARIS design (**new**) | Free download | Product-based cable/protection sizing, selectivity | Auto-sizing rules (P1) |
| 14 | Siemens SIMARIS curves (**new**) | Free download | Tolerance bands, let-through and cut-off curves | TCC tolerance bands (P0) |
| 15 | Schneider Ecodial | Free/commercial | LV design with Schneider equipment | Sizing guardrails (P1) |
| 16 | Eaton Bussmann FC2 | Free app/web | Point-to-point, NEC 110.24 labels, fuse sizing | **Adopted in V29: label + %Z tolerance** |
| 17 | ETAP online arc-flash demo (**new**) | Free web | Shows effect of changes on incident energy | Arc-flash engine (P0) |
| 18 | EasyPower arc-flash resource (**new**) | Free web | IEEE 1584-2018 guidance | Arc-flash engine (P0) |
| 19 | ARCAD Arc Flash Analytic (**new**) | Commercial | IEEE 1584-2018, five electrode configurations, labels | Arc-flash engine (P0) |
| 20 | Maplesoft IEEE 1584-2018 app (**new**) | Commercial | Worked arcing-current and boundary steps | Test reference |
| 21 | VIOX IEEE 1584-2018 web calculator (**new**) | Free web | Normal and reduced arcing-current cases | Reduced-arc check (P0) |
| 22 | Voltflow short-circuit calculator (**new**) | Free web | Point-to-point, quick panel screening | Already exceeded |
| 23 | ToolGrit transformer fault calculator (**new**) | Free web | Clear infinite-bus explanation | Already exceeded |
| 24 | ReversePCB short-circuit calculator (**new**) | Free web | Point-to-point (radial only) | Already exceeded |
| 25 | pandapower | Open source | IEC 60909 short circuit, load flow, validated models | Independent test oracle (P1) |
| 26 | EPRI OpenDSS | Open source | Unbalanced time series, harmonics | Test oracle (P1) |
| 27 | GridCal (**new**) | Open source | Power flow, time series, short circuit with a GUI | Test oracle |
| 28 | NREL SAM / REopt | Free | PV yield, BESS dispatch optimisation | Dispatch economics (P1) |
| 29 | HOMER Pro / PVsyst | Commercial | Microgrid and PV yield | Out of scope |
| 30 | Cableizer / XGSLab | Commercial | Cable mechanics; grounding grids | IEEE 80 grounding (P1) |

#### What was adopted in V29

1. **Transformer impedance-tolerance envelope.** IEEE C57.12.00 allows tested impedance within ±7.5 % of nameplate, and the Bussmann point-to-point method multiplies %Z by 0.9 for a worst case. Studio now re-solves the whole network with every ± combination and reports the minimum, nameplate and maximum current at every bus. Testing showed that a lower %Z does **not** always raise every bus current when generators or motors are present, so Studio searches all combinations instead of assuming. Simple calculators assume.
2. **NEC 110.24 available fault current label.** Printable label with maximum available fault current, date of calculation, voltage, X/R and basis, plus PDF, Excel and JSON reports.
3. **Input plausibility warnings,** like the "data check" step in commercial tools. Values that are almost always unit mistakes now get a warning: fault current over 300 kA, transformer %Z outside 0.5–25 %, X/R over 100–150, cable resistance above #18 AWG, length over 100 km, bus voltage over 800 kV, generator reactance outside the typical range. Results are unchanged; the user is warned.

#### Highest-value items still to adopt (ranked)

| Priority | Item | Seen in | Why it matters |
|---|---|---|---|
| P0 | Full IEEE 1584-2018 arcing current, incident energy and boundary (five electrode configurations, enclosure correction, reduced-arc case) | ETAP, EasyPower, SKM, ARCAD, VIOX | Most-requested missing study. IEEE publishes official calculator files on IEEE DataPort, which can serve as the test reference. |
| P0 | OEM time-current curves with tolerance bands | SIMARIS curves, SKM, EasyPower | Needed for real clearing times and for arc flash |
| P1 | Transformer off-nominal tap in fault studies (currently rejected by design) | All suites | Real transformers have ±2.5 %/±5 % taps that change maximum/minimum fault levels |
| P1 | Motor contribution shortcut (about 4 × FLA) for quick studies | FC2, point-to-point practice | Fast entry when motor data is unknown; must stay labelled as an estimate |
| P1 | pandapower IEC 60909 cross-check of the full engine | pandapower | Independent, published validation |
| P1 | Unbalanced load flow, IEEE 80 grounding, IEC 60853 cable | PSS SINCAL, XGSLab, CYMCAP | Large engineering gaps |

#### Sources

- [Wikipedia: Power engineering software](https://en.wikipedia.org/wiki/Power_engineering_software)
- [Eaton Bussmann FC2 brochure](https://www.eaton.com/content/dam/eaton/products/electrical-circuit-protection/fuses/fault-current-calculator/bus-ele-pp-10106-fc2-mobile-app.pdf)
- [EC&M: FC2 app (NEC 110.24 labels)](https://www.ecmweb.com/product-sourcing-supply/article/20904549/available-fault-current-app)
- [Siemens SIMARIS planning tools](https://www.siemens.com/en-us/products/simaris/)
- [SIMARIS planning tools introduction (PDF)](https://assets.new.siemens.com/siemens/assets/api/uuid:b8b0b4b7-e9f5-4548-81d0-a7bbc3816fe4/simaris-planning-tools-introduction.pdf)
- [IEEE 1584-2018 listing (mentions IEEE DataPort calculators)](https://standards.nimonik.com/products/ieee/ieee-1584/)
- [VIOX IEEE 1584-2018 calculator](https://tools.viox.com/arc-flash-incident-energy-calculator/)
- [ARCAD arc-flash software](https://www.electricityforum.com/iep/buyers-guide/arcad-inc)
- [Maplesoft IEEE 1584-2018 application](https://de.maplesoft.com/applications/Detail.aspx?id=154713)
- [ETAP arc-flash calculator](https://etap.com/arc-flash-calculator2)
- [Voltflow short-circuit calculator](https://www.voltflow.net/short-circuit-calculator)
- [ToolGrit transformer fault-current calculator](https://www.toolgrit.com/tools/xfmr-fault-current-calc)
- [ReversePCB short-circuit calculator](https://reversepcb.com/short-circuit-current-calculator)
- [Point-to-point method lecture notes (Bussmann method, 0.9 × %Z)](https://feng.stafpu.bu.edu.eg/Electrical%20Engineering/2904/crs-10562/Files/mohamed%20abd%20elwahab%20ali_Lecture%2007.%20Short%20Circuit%20Calculations.pdf)
- [pandapower paper (IEEE Trans. Power Systems)](https://arxiv.org/abs/1709.06743)
- [PS-Wiki vendor list](https://ps-wiki.github.io/wiki/vendors)
- [ETAP vs DIgSILENT vs PowerWorld comparison](https://industrialmonitordirect.com/blogs/knowledgebase/power-system-simulation-software-comparison-etap-vs-digsilent-vs-powerworld)


---

## A12. V29 Part 4 — plan, limits, bots and prompt


*Source file: `REPORTS/V29_PART4_Plan_Limits_Bots_and_Prompt.md`*

### Part 4: making Fault Current Studio do what the advanced tools do

Prepared 7 November 2026. Plain and honest.

#### 1. Are your conditions acceptable?

| Your condition | Answer |
|---|---|
| Keep all progress | **Yes.** Every change is additive or a small patch, checked by running the old tests again (0 values changed in V29). |
| Make it do everything the advanced apps do | **Yes as the direction, no as a single job.** ETAP, SKM and EasyPower each took decades and large teams. We can add their study families one at a time, each with independent tests. Some, such as EMT switching transients and full dynamic stability, are research-scale projects. |
| Research online first | **Yes, done in part.** 100 tools surveyed and a 12-family method register built, each with source URLs (`REPORTS/research/`). |
| Read the NEC and books in your "library" | **Not possible from here.** Your library is in your ChatGPT account. I cannot open it. Attach the PDFs in this chat (or a new one) and I can read them page by page. A full NEC (about 900 pages) takes several sessions. NEC text is copyrighted: the calculator can use its methods and cite its sections, but must not republish its text or full tables on a public site. |
| "Read everything, each and everything" | **I will only say I read something if I actually read it,** and each report lists exactly which pages were read. |
| Results backed by complete logic and sources | **Yes.** Every method cites its standard and is checked against an independent implementation or a published example before release. |
| "No chance of error" | **No one can promise this.** What we can promise is error control: independent second calculations, published reference cases, adversarial tests, and a written audit trail. Remaining risk is always written down. |
| Use plugins / install more | **Yes.** The Wix connector is now in use (deployed V29). Useful next: a Google Drive connector, if your books are there. |
| Use bots | **Yes.** Two research bots ran in this session. The bot team below is the plan for the full build. |
| Work in a new chat, site opens there too | **Yes.** The public Wix site and the public repository can be opened from any chat. In a new chat: attach the latest ZIP (or point to the public repository), and connect Wix if you want deployment. The private ChatGPT site (`…chatgpt.site`) can never be opened from here. |

#### 2. My limitations (honest list)

1. I cannot see your ChatGPT chats, ChatGPT library, or the private ChatGPT site.
2. Without a GitHub account with write access, I cannot save to the repository. I send ZIPs instead, and deploy to Wix through the connector.
3. My sandbox cannot open the live Wix site in a browser. I can check every live file over HTTP and byte-by-byte, but a real click-through of the live site must be done by you (or in a session whose network allows the site).
4. Paid standards (IEEE, IEC, NFPA) are not freely readable. Where a method needs the standard's tables, we need your licensed copy or an openly licensed implementation verified against the standard's published examples (as done for IEEE 1584-2018).
5. Very long tasks are split into stages. Each stage ends with tested, deployable files, so nothing is lost between sessions.

#### 3. How to make it happen: the bot team

Each bot gets one job, a written brief, and must return sources plus test evidence. No bot's work is accepted until another bot has checked it.

| Bot | Job | Must deliver |
|---|---|---|
| 1. Research bot | Survey tools, manuals, help centres; collect features | Table with source URL per row |
| 2. Standards and methods bot | Find the governing standard edition, papers, worked examples, test oracles | Method register with URLs and licence notes |
| 3. Library reader bot | Read your attached books/NEC page by page, extract method rules (not copyrighted text) | Page-referenced notes |
| 4. Builder bot (one per study) | Implement one study as an add-on module plus UI | Code, inputs/outputs spec, limits |
| 5. Independent oracle bot | Write a second calculation in Python **without seeing the builder's code** | Oracle code and comparison results |
| 6. Adversarial tester bot | Try to break the study with 200+ logical scenarios and bad inputs | Failure list, fixed list |
| 7. Regression bot | Re-run every earlier test so nothing old breaks | Pass/fail table vs previous version |
| 8. Auditor bot | Check every citation exists and supports the claim; re-run a sample of tests | Audit report, list of unsupported claims |
| 9. Release bot | Build manifest, checksums, ZIP, deploy to the same Wix site, verify live | Release report, rollback steps |

#### 4. Order of work (highest value first)

| Stage | Study / feature | Reference to test against |
|---|---|---|
| Done in V29 | NEC 110.24 label, %Z tolerance envelope, plausibility warnings, IEEE 1584-2018 arc flash in the browser, SLD fixes | Annex D.1/D.2, 105,120 official IEEE spreadsheet cases |
| Done in V29b | Arc flash at every bus with labels; transformer off-nominal tap in fault engines; combined conductor sizing | Oracle with taps; IEEE 1584 engine; hand checks + 3,000 random sizing cases |
| Done in V29e | Tap in load flow; one-line device link to arc flash; relay tolerance bands; LSI trip model; OCPD + EGC check; TCC plot-point library | π-equivalent oracle 300 networks; 1,799 OCPD checks; 103 LSI; 11 tolerance; 9 + browser one-line |
| Done in V30 | Stitch theme, docked tools, palette/inspector/label/table layout fixes | Layout audit 5 widths × 34 states = 0 findings; 10 browser suites unchanged |
| Next 2 | TCC: tolerance bands, let-through, curve clipping, coordination gap check, auto evaluation | Manufacturer published curves; IEEE C37.112 / IEC 60255-151 equations |
| Next 3 | Off-nominal tap in load flow; clearing times taken from TCC data into the per-bus arc flash | Independent oracle; pandapower |
| Next 4 | Conductor sizing: fill R/X gaps (14–10 AWG, 3 AWG), OCPD check, IEC 60364-5-52 methods | NEC Ch. 9 Table 9 from your licensed copy, IEC 60364-5-52 |
| Next 5 | IEEE 519 PCC compliance, PF correction with resonance check | IEEE 519-2022, IEEE test systems |
| Next 6 | IEC 60909-0:2026 full maximum/minimum with all correction factors | IEC 60909-4 examples, pandapower |
| Later | Generator step loading, motor starting over time, IEEE 80 grounding with soil model, IEEE 485 battery sizing, BESS resilience sizing, reliability indices, unbalanced load flow, DC arc flash (several methods), scenario manager | See `REPORTS/research/method_reference_register.md` |

#### 5. Prompt to use in a new chat

Copy everything in the box. Attach the latest ZIP (`Fault_Current_Studio_V30_Complete.zip`) and any books or PDFs you want read.

```
I have attached the complete latest Fault Current Studio package (V30). Extract it and read, in this order: START_HERE.md, REPORTS/V29_Release_Report.md, REPORTS/V29_ISSUES_AND_BACKLOG.md, REPORTS/V29_PART4_Plan_Limits_Bots_and_Prompt.md, MASTER_CONTINUATION_PROMPT.txt, REQUIREMENTS/PRIOR_MASTER_HANDOFF_2026-10-25.md, REPORTS/research/calculator_survey.md and REPORTS/research/method_reference_register.md.

Rules:
1. Do not restart, remove or overwrite working features, formulas, dropdowns, saved-study formats or reports. Add new studies as add-on modules, as V27-V29 did. After every change, re-run QA/V29_QA_SCRIPTS (including ieee1584/) and show that no earlier value changed.
2. Website: the original Wix site only (metaSiteId 97613ac8-1f7d-4ecf-8fa4-2d589c387775). Before any upload, read the live file inventory and revision and compare with the package. Upload only checksum-verified files; never a partial or broken set. After upload, verify every changed file on the live site. Never create a new Wix site.
3. Already done (V29b–V29e): per-bus arc flash with labels and device clearing-time dropdowns, transformer off-nominal tap in fault studies and load flow, combined conductor sizing with NEC 240.4 OCPD and 250.122 EGC, IEEE 519 PCC check, PF correction with resonance, one-line devices linked to the arc-flash picker, relay tolerance bands, LSI trip model, TCC plot-point library, master database v13 import (not live until the owner decides; DEPLOY/deploy_database_to_wix.py). Stitch theme applied in V30 (keep `fcs-theme-v30.css` + `shell-v30.mjs` loaded last; rerun `QA/V30_UI_AUDIT/audit.py` after any UI change and keep it at 0 findings). Next work, in order: (a) the full audit from zero to finish the owner asked for; (b) read the NEC books and re-verify the NEC tables; (d) IEC 60909-0:2026 full max/min; (e) relay coordination check. Use the bot team in Part 4 if sub-agents are available: builder, independent oracle that never sees the builder's code, adversarial tester (200+ logical scenarios), regression, auditor, release.
4. Read every attached book or PDF page by page and report exactly which pages were read. Use code books for methods and section references only; do not copy copyrighted text or full tables into the public site.
5. Every method must cite its standard edition and a source URL, state its limits, and match an independent calculation or published example before release. Never invent coefficients, manufacturer data or test results.
6. Be honest: say plainly what was not done, what could not be accessed, and what remains. Do not claim 100 % completion.
7. Reply in Hinglish (simple Hindi-English mix). Deliver all updated files as one ZIP with the same folder structure.
```

#### 6. Missing from your attachment

Your attached text ends with "These are some of the examples of what the calculator should contain…" but no list followed it. Please paste that list. Until then, the ranked list in `REPORTS/research/calculator_survey.md` (Top 25 features) is used as the target.


---

## A13. V28 release report


*Source file: `REPORTS/V28_Release_Report.md`*

### Fault Current Studio V28 — bounded conductor I²t screen and comprehensive V20/V27 export QA

**Status: validated offline cumulative candidate; NOT deployed to public Wix; NOT a fully accepted engineering platform.**

#### Preserved project and source

This is an incremental continuation of V27, itself descended from V20. The complete original V27 234-file website was retained: **233 files byte-for-byte unchanged, one file (`index.html`) changed only to load a new independent module, two new files added, zero files removed**. The new complete website has **236 files**. The entire V27 cumulative recovery ZIP is embedded without modification, preserving the previous V26→V20→V19→older historical chain. No existing browser-local saved-study keys, project schema, Cloud Vault, reports, OEM catalogue or original private owner data were altered. The V28 site source and full cumulative package have SHA-256 manifests.

#### New functional study (V28)

`conductor-duty-v28.mjs` implements a bounded **single-conductor adiabatic short-circuit I²t thermal screening**: `I²t <= (k S)²`, using explicitly entered conductor cross-sectional area S in mm², user-qualified k in A√s/mm², conductor material and temperature limits, and independent traceable sources. Three current-input methods: (1) constant RMS and clearing time, (2) exact I² integral for a documented *piecewise-linear RMS* current trace, and (3) externally documented I²t. The output includes raw/adjusted thermal stress, permissible adiabatic stress, minimum area for the entered case, maximum constant RMS for entered duration, and pass/fail against the **entered assumptions**. No manufacturer k values are auto-selected. The user-entered margin is ≥1. No parallel conductor sharing, protective device clearing curve, dynamic waveform/DC offset or non-adiabatic correction is inferred.

`conductor-duty-ui-v28.mjs` adds a responsive accessible modal, illustrative input, calculations, JSON/PDF/XLSX reports and a **separate isolated browser-local input-case archive** with merge-only import, save and reopen. Existing advanced 16 modes and their saved-case format are untouched.

#### V20 priority: resolved local 32-export isolation

- Opened and SHA-256 verified **all 232 entries** in the original V20 handoff manifest; archive CRC passed.
- Reproduced the exact **11th automatic-download timeout** in Chromium after five modes × PDF/XLSX, with no JS page errors and a successful report-generation status. The `multisequence` PDF succeeds in a fresh context. This is consistent with **browser per-origin automatic multiple-download gating**, not a proven malformed PDF or calculation failure. The hosted HTTP 429 from the previous handoff remains a separate issue; it was **not reproduced or cleared** in a live remote Chromium session.
- Isolated download contexts to batches of **four modes (eight downloads)**, with **no requests to Wix**. Verified all **16 modes × PDF/XLSX × desktop/mobile** for both original **V20 and V27**: **128 actual browser downloads** total, all parsed as valid PDF or XLSX.
- Independently checked **19,848 input/output data paths across 128 documents** (9,924 unique path checks in PDFs and 9,924 in Excel), including source labels, numeric values, status, warning text, exact row counts, and workbook sheets. All passed. V20 and V27 both pass; V27's improved report engine remains unchanged in V28.

#### V28 engineering and UI QA

- **1,200** deterministic transformer nameplate scenarios, **24,000** numeric comparisons of the original V20/V27 transformer function against independently coded Python complex arithmetic, **zero mismatches**. **16** invalid transformer inputs rejected.
- **1,500** deterministic conductor-duty scenarios across three methods, **9,000** independent Python-vs-JavaScript numeric comparisons, **zero mismatches**. **27** invalid inputs rejected.
- **18** V28 browser downloads (three methods × PDF/XLSX/JSON × desktop/mobile), with PDF text and Excel sheet contents checked. Browser save/reopen/recalculation and unchanged legacy project/studies storage sentinel checks passed.
- **236** complete website files, **all** JS/MJS syntax checks passed, no deleted prior files. Source and archive hash/CRC verification passed.

#### Verified primary manufacturer/software source context

- DIgSILENT PowerFactory knowledge base explicitly gives the IEC 60909-0:2016 transformer correction factor `Kt = 0.95*cmax/(1+0.6*xt)` and explains its application to both maximum and minimum fault calculations: https://faq.digsilent.de/en/faq-reader-powerfactory/why-are-the-results-of-short-citcuit-calculation-depending-on-max-voltage-tolerance.html
- Schneider Electric Conext solution guide TP20180605 documents transformer impedance calculation using nameplate quantities and voltage factors: https://solar.se.com/au/wp-content/uploads/sites/3/2021/11/TP20180605_Conext-CL125-Solution-Guide-IEC-975-0797-01-01_Rev-A_ENG.pdf
- Schneider Electric's technical cable/protection guide distinguishes conductor permissible I²t stress from protective-device let-through stress: https://iportal.se.com/Contents/docs/SQD-M9F11325_CATALOGUE.PDF
- Nexans published cable product data shows conductor material, section and maximum fault temperature are **product-specific**, underscoring why V28 requires a documented k coefficient instead of assuming one: https://latrivenetacavi.nexans.com/en/products/industrial-and-logistics/industrial-Eca-class/NPE-SUN-H138532/product~180029101~.html

These sources establish method context, **not** full standards conformity or a verified coefficient for any project cable.

#### Outstanding gates (do not mark complete)

1. Public Wix browser hydration, JS/CSS HTTP 200 status and intermittent HTTP 429 recovery **not independently verified**. The Wix site is published, but an external live browser test could not run (remote browser wallet unavailable); a static extractor returned the initial loading placeholder, which is not evidence of a permanently broken app. **Do not deploy V28 without a complete 236-file Wix upload and a post-deploy browser check.**
2. Full IEC 60909/60287/60949, IEEE 1584 and ANSI/NEC engineering conformity, OEM protective coordination, arc flash, complete cable thermal/dynamic/BESS and commercial feature parity remain **unverified or incomplete**.
3. Original private ChatGPT Site cloud studies require **owner-authorized export**. They are not contained in public source or cumulative ZIP and have not been fabricated.
4. Site production security, backup/restore, source provenance and release acceptance remain separate signoff gates. All new methods are labelled bounded engineering screens.

#### Reproduction

Run `QA/SCRIPTS/browser_32_ui.py` against the extracted V20 and V27 historical source trees, `QA/SCRIPTS/validate_128_reports.py` against the archived downloads, `QA/SCRIPTS/conductor_reference.py`, `QA/SCRIPTS/transformer_reference.py`, and `QA/SCRIPTS/browser_v28.py` against the extracted V28 site. Original scripts include their own explicit paths for the working environment and can be adapted to any local directory. No production Wix requests are necessary for these tests.


---

## A14. START_HERE hand-off notes (historical)


*Source file: `START_HERE.md`*

**Start with `REMAINING_WORK.md` (what is left and how), then `DECISIONS.md`, `REQUIREMENTS.md`, `ISSUES.md`.**

### Fault Current Studio — Current V28 Only (Complete Hand-off)

This is the SMALL, CORRECTED cross-account transfer. It contains **all 236 latest V28 website files** as a full deployable ZIP; the complete **205 current V28 QA script/result artifacts**; latest V28 release report and source SHA-256 manifest; previous requirements and new consolidated full Word/TXT handoff prompt; the original audited master equipment workbook and 2 latest feature-matrix references. It contains NO redundant older source/recovery ZIPs.

#### Start
1. Upload this one ZIP to the new ChatGPT account.
2. Tell the assistant: **Read MASTER_CONTINUATION_PROMPT.docx and follow it completely, while preserving the original Wix site**.
3. Or copy/paste the exact text from MASTER_CONTINUATION_PROMPT.txt.
4. Run VERIFY_TRANSFER.py (Python 3) to verify the 236 website source entries and outer package hashes.
5. Do not create a replacement Wix site or erase anything existing.

#### Release reality
- Latest SAVED working release: **V28**, 236 site files, offline QA recorded; NOT deployed as of the handoff.
- Last authenticated LIVE Wix release: **V27**, 234 site files; may have changed after handoff.
- Current user-visible public URL: https://headless-dlrpfrynayh-classroomsolar-140e.wix-site-host.com/
- Original Wix ID: 97613ac8-1f7d-4ecf-8fa4-2d589c387775
- Private cloud owner studies and private v51/Batch14 branch sources are **not** part of this public-source transfer; obtain only with owner authorization.
- Full applicable IEEE/IEC certification and live site acceptance are **NOT** completed.

#### Important accuracy
The master XLSX and historical feature matrices are references, not a newer replacement of live in-site manufacturer data. QA under QA/RECORDED_V28_QA_FILES/ is the actual V28 release test evidence (including comparison data for V20 and V27), not earlier full source releases. The previous 22MB handoff included an incorrect instruction to open an omitted 206MB history archive; this corrected handoff does NOT require that omitted archive. Current source is self-contained.

#### V29 update (7 November 2026)
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
- **V33 (14 Nov 2026, latest, code LIVE)** adds:
  - **Plants with many inverters.** A 1,900-bus plant with 1,681 string inverters now calculates (live: 24.368 kA at POI). On V32 it stopped at the 30 s limit.
  - **A time limit that grows with project size**, and a faster engine.
  - **Lighter results and report pages** on such plants, with a note where less is drawn.
  - **Security check**: user text cannot run as page code.
  - **Fonts served from the site** — in the package only; not live yet.
  - **15 Nov additions (live):** faster undo / redo (results of the last 4 states kept), lighter DC array results, Operating studies bus table (CSV), faster arc-flash picker, connection editing in the Equipment table with a preview, reference-data notice on the database pages, an audit against published values (`REPORTS/V33_Audit_Report.md`).

  V33 has 275 site files in the package; 265 are live. Database v13 is still **not** live. Read `REPORTS/V33_Release_Report.md`. Tests: `QA/V33_*/`. Manifest: `QA/V33_SHA256_Manifest.json`. Next-chat prompt: `NEW_CHAT_PROMPT_V34.txt`.


---

## A15. README (repository front page)


*Source file: `README.md`*

### Electrical-Studies — Fault Current Studio

This is the source, tests and reports for the Fault Current Studio website (connected-network fault, arc flash, cable and power-quality studies).

Live site: https://headless-dlrpfrynayh-classroomsolar-140e.wix-site-host.com/

#### Repository layout

Upload the folders exactly as they are in the release ZIP.

| Folder / file | What it holds |
|---|---|
| `SITE/` | The website. Every file the Wix site serves (index.html, modules, styles, fonts, `database/`). This folder is what gets deployed. |
| `QA/` | Test suites and their recorded results. Start with the `QA/V33_*/` and `QA/V32_*/` folders, `QA/V31_SCALE/README.md`, `QA/V29_QA_SCRIPTS/README.md` and `QA/V30_UI_AUDIT/README.md`. `QA/V33_SHA256_Manifest.json` lists the SHA-256 of every file in `SITE/`. |
| `REPORTS/` | Release reports, test results, backlog and research notes. Read `REPORTS/V33_Release_Report.md` first, then `REPORTS/V32_Release_Report.md`. |
| `REQUIREMENTS/` | Requirements and the Stitch design-system sources. |
| `DEPLOY/` | Database deployment script (database v13 is **not** live yet; it goes live only when you decide). |
| `Spreadsheets/` | Master equipment workbook and reference spreadsheets. |
| `COMPARISON/` | Feature-comparison references. |
| `START_HERE.md` | Release history and hand-off notes. |
| `THIRD_PARTY_NOTICES.md` | Licences of included third-party material (fonts, reference data). |
| `RELEASE_STATE.json` | Machine-readable release state. |

All files are below GitHub's 25 MB browser-upload limit. The largest is `QA/V29_QA_SCRIPTS/ieee1584/ieee_1584_spreadsheet_results.csv` at 22.8 MB.

#### Your project files

Projects are **not** stored in this repository or on the website. They live on your computer.

1. Open the website in Chrome or Edge on a computer.
2. Go to **Saved studies & backups → Projects on your computer**.
3. Click **Connect project folder** and choose a folder, for example `Documents/Electrical projects`.
4. Use **Save project to folder**.

Each project becomes a `name.fcs.json` file in that folder. Open a file from the list to continue working on it; every change saves back to the same file. You can copy, back up, rename or delete these files like any other file. If you also want them in a repository, use a separate private repository.

#### Running the tests locally

1. Install Node 22+ and Python 3.
2. Install Playwright and Chrome for the browser tests.
3. From `QA/V29_QA_SCRIPTS/` run:
   - `node run_engine.mjs cases.json js.json && python3 compare.py`
   - the other suites listed in that folder's README.
4. From `QA/V31_SCALE/`, the `QA/V32_*/` and the `QA/V33_*/` folders run the plant-scale suites.

The website itself needs no build step. `SITE/` is served as static files.


---

## A16. Prior master hand-off, 25 Oct 2026


*Source file: `REQUIREMENTS/PRIOR_MASTER_HANDOFF_2026-10-25.md`*

### MASTER HANDOFF PROMPT — FAULT CURRENT STUDIO
#### For a NEW ChatGPT conversation — 25 October 2026

You are taking over an EXISTING software-engineering project, not starting a calculator from scratch. Your assignment is to **recover, reconcile, finish, independently verify, and responsibly release Fault Current Studio**, a professional browser-based electrical power-system engineering calculator and study platform. Work as a senior power-systems engineer, electrical-engineering software architect, developer, QA engineer, database auditor, and project manager. Use ChatGPT Work/Codex, connected tools and relevant engineering research resources where genuinely available. My responsibility is to provide decisions or missing proprietary inputs when genuinely necessary, not to manage your implementation or debug the program.

**This is an execution assignment.** First inspect the files I upload and the Library, establish the actual status from code and evidence, prioritize, then perform the next achievable substantive development tasks. Do not stop at a roadmap, repeat questions already answered in source documents, or tell me the work is complete before testing proves it. Maintain cumulative source, documented progress, and reproducible archives at each major milestone.

#### 1. Initial source packages — two IMPORTANT, distinct branches

Look in my ChatGPT Library folder `/Calculators/`. I will attach these files, or you should read them from Library if your environment supports it.

**A. Latest publicly hosted website branch: Public v21**
- `Fault_Current_Studio_Public_v21_Cumulative_Recovery(3).zip` — newest visible complete recovery archive for the deployed public branch, approximately 139.7 MB.
- `Fault_Current_Studio_Public_v21_Live_Website_Source(3).zip` — corresponding public website files, approximately 6.56 MB.
- `Fault_Current_Studio_Public_v21_Release_Report.md` — most recent available hosting/bundling report.
- `Fault_Current_Studio_Public_v21_Browser_Acceptance_Supplement.json` — supplementary, bounded browser acceptance evidence.
- Public v21 URL: `https://headless-dlrpfrynayh-classroomsolar-140e.wix-site-host.com`.
- Its last reported hosting update bundled 74 browser modules, reduced excessive asset requests/HTTP 429 startup failures, retained 226 previous public file paths (228 in this variant), and recorded 10 successful distinct page loads and 16 advanced method UI calculations. There is also evidence of limited PDF/XLSX downloads, local-browser saved-case persistence, and mobile viewport smoke. **These are bounded claims from the archived reports, not independent proof of full engineering certification, security, or all workflows.** The final repeated-download stress issue was not conclusively resolved. A separate earlier v21 report describes another hosting-retry implementation; do not conflate variants—inspect exact source/archive hashes and pick the correct latest version.

**B. Latest cumulative original v51-source engineering development branch: Batch 14**
- `Fault_Current_Studio_Batch14_Standalone_Fix_2026-10-25.zip` — **75,298,957 bytes**, latest available complete, standalone cumulative engineering source archive; starts with Batch 13's 527 preserved entries and extends them with a local Node 22+ portable runtime. This retains original v51 and historical Batches 01–13, evidence, v10 reference database and thermal companion.
- `Fault_Studio_Batch14_Report_2026-10-25.md` — precise scope, test results and current limitations.
- `Fault_Current_Studio_Batch14_Only_Changes_2026-10-25.zip` — 36,074-byte delta, **not** a standalone replacement.
- `Fault_Current_Studio_Batch13_Consolidated_2026-10-25.zip` and `Fault_Studio_Batch13_Open_Items_2026-10-25.csv` — optional immediate-parent comparison and current engineering backlogs.
- `Fault_Current_Studio_Batch10_Consolidated_2026-10-25.zip` — earlier 75,171,457-byte historical checkpoint and base for Batches 11–14; **do not start from Batch 10 if Batch 14 is accessible**.
- `Fault_Studio_Batch10_Report_2026-10-25.md` and `Fault_Studio_Batch10_Open_Items_2026-10-25.csv` — historical audit/remaining items, retained within cumulative history.
- Original supplied exact v51 source archive: `Fault_Current_Studio_Latest_Files_2026-10-24.zip`, original source commit `3087b32a551f3a8cdfe07bdf4a49541e7e6963dc`. This historical source is retained through the cumulative engineering branch; retain the original as a comparison backup where available.
- The private original project is `Fault Current Studio`, source version 51, project ID `appgprj_6ac209d855f08191ab639aea69332785`, at `https://jay-fault-current-studio.thesocialjay3.chatgpt.site`.
- **Batch 14 is a local, undeployed engineering candidate with an additional localhost-only launcher**, not proof that the private ChatGPT Site or the Wix public site contains its features.

**CRITICAL SOURCE RULE:** Public v21, private Site source v51, and engineering Batch 14 are NOT interchangeable version numbers. The latter branches may have diverged. Do a path-by-path, module-by-module, method-by-method, schema-by-schema and hash-based comparison first. Preserve the functioning v21 hosted UI and the exact v51 fault engine. Identify changes that can be safely integrated, and retain both recoverable baselines. Never blindly deploy the Batch 14 archive over Public v21, or overwrite the original private Site, or replace a connected meshed fault solver with an older radial implementation. Record any conflicts and resolve them with tests.

#### 2. Actual product expected

Deliver a reliable, polished, shareable, browser-based engineering application, with a clear public-access pathway and privacy controls for saved projects. No mandatory local installation or account merely to run ordinary public calculations. Saved projects should support local-first persistence and optional secure account-based sync/Cloud Vault, without exposing the owner's private case data. Long-term source hosting, domain, backups and account portability must not depend exclusively on this ChatGPT conversation.

The central application must be a genuine electrical network calculation platform comparable in **study families, usefulness and workflow** to ETAP, SKM Power*Tools, and EasyPower, but with original implementation and no unlicensed copying. It must be scientifically and code defensible: adequate input checks, assumptions, limitations, standard editions, verified methods, citations, numerical accuracy, and audit-ready exports. Achieve this incrementally and truthfully, not by presenting approximate screening widgets as complete studies.

Maintain this Fault Current Studio as the master/independent application. Other planned calculators, especially Cable Thermal Studio, remain distinct source projects until an explicitly designed integration is complete. Shared data contracts/modules are acceptable; do not destroy or silently merge the separate applications.

#### 3. Nonnegotiable UI and project behavior

- A centralized, coherent **Inputs** workspace and a **separate Single-Line Diagram (SLD) page**, not an embedded SLD inside Inputs. A usable dashboard/engineering results workspace, Database, reports, studies, and history.
- Dynamic equipment creation/deletion, no artificial fixed quantity/slot limits. Drag/drop, reliable electrical endpoints and From/To, editable buses and extensions, transformer connections, branches and meshes, zoom/pan/fit, selection, repositioning, duplication, rename, delete, connection cancellation, undo/redo. `Ctrl+Z`, `Ctrl+Y`, `Esc` and equipment **double-click -> properties** must genuinely work with focus-safe behavior. Verify all visible buttons and tabs actually do something.
- Preserve existing v51 connected multivoltage, meshed/single-source/multisource solver, positive/negative/zero-sequence treatment where implemented, bus/source contributions, transformer voltage reflection, protective device comparisons, diagram rendering, manual R/X and X/R overrides, case serialization, archive/import/export, cloud study APIs and reports.
- Equipment libraries and project-specific properties: utility, synchronous generators, induction motors/generators, PV inverters, battery inverters/BESS, transformers, cables, buses, switchboards/panels/switchgear, fuses, LV/HV breakers, relays, disconnects, etc. Distinguish true impedance models from simple pass-through devices or nameplate/duty-only equipment. Respect AC/DC distinctions, inverter behavior, voltage bases, grounding and phase systems.
- Saved projects and scenarios: create, rename, clone, revision history, recover, backup, local-first access, optional private sync, autosave/reopen, undo-aware updates, stable identifiers, export/import, secure isolation between users. DO NOT alter private studies without owner-authorized backup + test restore.
- PDF, XLSX, CSV, JSON exports where applicable: real downloads, correct units, fully populated engineering results, assumptions, source contribution, SLD, equipment ratings, provenance, warnings and print-friendly/native print. Verify files open and data agree with the UI and numerical engine.
- Responsive PC/tablet/mobile where feasible, accessible error messages, no endless loading screens, secure access control and failure recovery. Maintain public availability without disclosing private project data or introducing hardcoded passwords.

#### 4. Required engineering study families — COMPLETE methods, not just placeholder UI

Treat this as the target feature inventory; verify the correct applicable standard edition and jurisdiction from official sources before implementing any safety method.

1. **Short-circuit / equipment duty:** 3-phase, appropriate 3-phase-ground, SLG, LL, LLG and split/single-phase faults, maximum/minimum conditions, IEC 60909 and separate ANSI/IEEE methodology where applicable, per-unit and impedance network construction, sequence grounding, voltage level change, multiple source contributions, X/R, initial symmetrical/asymmetrical/peak/making/breaking/short-time/interrupting duties, time-dependent generator/motor/IBR behavior, AC/DC distinctions, protective equipment ratings and coordination.
2. **Power flow / power quality:** balanced and unbalanced load-flow, radial/meshed, PQ/PV/slack, tap changes, transformer phase shift, real and reactive power, sources, loads and distributed generation, losses, power factor, voltage drop/rise, branch limits and current, reactive capability/dispatch, contingency security and N-1 with thermal and voltage limits; distinct DC load flow where supported.
3. **Protection / coordination / TCC:** actual OEM breaker/fuse/relay curves and tolerances, CT/PT and saturation, time-overcurrent and instantaneous, ground/directional/differential/voltage/frequency/anti-islanding where appropriate, real pickup/time dial, sequence of operation, short-time and breaker clearing time, grading margin across fault levels, selectivity and motor/transformer/cable damage. No substituted generic curve labelled as a device manufacturer's curve.
4. **Arc flash:** input eligibility, correct scoped IEEE 1584 methodology where applicable, enclosure/electrode geometry, gap, working distance, arcing current alternatives and clearing time obtained from real protection characteristics, incident energy/boundary and traceable labels; segregate out-of-scope single-phase/DC/HV methods. No unverified PPE or compliance declarations.
5. **Cable thermal / ampacity:** preserve and integrate the separate Cable Thermal Studio and its original six authoritative reference workbooks where accessible; conductor/sheath/screen/insulation geometry, bonding, soil/ductbank/tray/free air, mutual heating, temperature limits, continuous/cyclic/emergency/transient and fault heating, IEC/NEC/Neher–McGrath assumptions separately identified and benchmarked.
6. **Harmonics / power quality:** per-order current/voltage spectra, THD vs TDD, PCC and I_L/I_SC definition, harmonic flow, resonance/filter interaction, transformer/neutral/cable heating, inverter emissions and applicable IEEE 519 compliance checks, unbalance/flicker/sags as appropriate.
7. **Grounding/earthing:** sequence impedance, grounded and ungrounded configurations, NGR/zigzag/grounding transformers, grid/soil resistivity, GPR, touch/step and transferred potential, rod/ground-grid design with relevant standards, conductor sizing and clearing times.
8. **DC / BESS / PV:** DC network faults, source and cable R/L/C where needed, DC protective duty, PV module/string/inverter operating limits and IBR faults, battery chemistry/SOC/limits/charge/discharge and runtime based on actual characterized data, inverter P-Q/PF/volt-var constraints, microgrids and grid-connected/islanded cases.
9. **Motors and operational/dynamic studies:** motor starting/acceleration with motor/load torque curves, feeder voltage dip, protective limits, switching, transient/dynamic stability, frequency/voltage response, load shedding, black start and documented limits.
10. **Reliability, contingencies and optimization:** SAIFI/SAIDI/CAIDI/ASAI with proper population/time bases, network N-1, islanding, overload/voltage outcomes, scenario comparison, capacity/efficiency, transformer and cable derating, studies of credible contingencies.

Do not treat the mere availability of a study tab, generic screening equation, or cached preview as successful implementation of the above complete engineering methods. Clearly label unsupported features and require sufficient real electrical inputs before calculating.

#### 5. Original priority defects — must be reproduced or conclusively cleared

A historical case showed **approximately 65 kA at a utility connection and 56 kA at the immediately connected downstream point despite no modeled impedance between them**. Verify using the actual model, ensuring equivalent voltage, fault definitions, effective connections and no hidden impedance. Fix the engineering cause, not with arbitrary value copying; add regression tests for electrically coincident buses, series/parallel networks, transformer bases, equal-voltage links, and all fault types. Also verify reported transformer LV fault values use correct voltage reflection: a primary current is not numerically the same current at 208 V. An existing UI concern: **double-click did not reliably open equipment properties**; prove this works with real browser interactions. Verify PDF/XLSX/print, undo/redo/Esc, equipment deletion/duplicate, cable endpoints, and autosave. Do not assume a prior assistant already resolved them just because a test suite passed.

#### 6. Master engineering database — audit, qualify, do not blindly merge

The master workbook evolved from a curated active v7 catalogue to separately retained **v10**. The prior ZIP contains `Engineering_Master_Database_v10_Audited.xlsx`. Reported forensic facts:
- 93 worksheets compared; 31 sheets changed, 62 unchanged at worksheet XML level.
- 284,014 differing populated/formula **cell coordinates**, NOT 284,014 products.
- Existing active quick catalogue contains **40,796** curated records matched exactly by stable identity to v10 in the local Batch 09 audit.
- Batch 10 (preserved within Batch 14) separately indexed **81,124** *non-curated* records across 13 catalogue category groups, with original row indices, sha hashes, 1,009 preview samples and the entire v10 workbook; the review UI is **read-only** and the records are **not calculation-approved**. Non-curated does not necessarily mean brand new v10 equipment.
- OEM source traceability, engineering ratings/units, model uniqueness and applicability cannot be inferred solely from record count, type, name, or workbook presence.

Requirements: preserve all meaningful rows, sheet/row/field provenance, source URLs/docs and versions; inspect source and manufacturer documents; detect true duplicates without merging distinct ratings/variants; normalize units; apply equipment-method-specific eligibility gates, never fabricate missing R/X, zero sequence, time-current curves, inverter contributions, transformer vectors, ampacity or interrupting ratings. Stage reversible versioned selections, regression-test old studies and preserve stable IDs; do not automatically replace the active v51 database. Review the California Energy Commission equipment lists and other authoritative OEM sources as appropriate, but keep their certification/performance scopes explicit.

#### 7. What the engineering Batches 01–14 actually contain

These are **available prototypes/screens/research assets**, not proof that the new comprehensive study families are finished:

- Batch 01: balanced AC PQ/PV/slack load-flow foundation, loss and branch results; harmonic metrics, generic TCC and arc-flash readiness screens.
- Batch 02: nominal two-device IEC-style TCC, CT ratio/instantaneous/clearing estimates and PV Q-limit guard.
- Batch 03: v7/v10 worksheet-difference forensic audit and controlled early study additions.
- Batch 04: IEEE 1584 input/readiness screening, **no full incident-energy calculator**.
- Batch 05: bridge from solved operating branch RMS current to separately preserved Python thermal engine; it is **not** integrated live thermal parity.
- Batch 06: partial harmonic THD/TDD, one-point harmonic response and unbalanced/fault screening, not a standards-complete network analysis.
- Batch 07: simple ground potential rise, equivalent-resistance DC current, ideal battery Ah runtime and static motor-start voltage divider, not full grounding/DC/BESS/dynamic analysis.
- Batch 08: reliability metric arithmetic and topology-only branch outage screening.
- Batch 09: bounded balanced AC **power-constrained N-1 branch-outage** solver with voltage and ampacity checking; 14 checks; not yet fully wired into the advanced UI.
- Batch 10: controlled read-only v10-shadow catalogue with complete non-curated ID index and previews; 145 focused checks; new fail-closed release gate and proposed GitHub CI; not deployed.
- Batch 11: opt-in operating load-flow PV-to-PQ generator reactive limit clamp (original reject mode retained); simulated-API cloud backup with SHA-256 revision completeness checks, **not** a real owner's cloud backup; 38 focused tests.
- Batch 12: controlled simulated-only, isolated staging restoration of complete cloud revision histories, safety gating and reproducible CI font provenance from a legally licensed open-source OS package; 19 restore tests and 8 CI checks; no real owner's backup/restore or successful hosted production build.
- Batch 13: input/document-backed manufacturer TCC **envelope preview**, bounded log interpolation with no extrapolation and worst-case coordination margin; stricter continuity checks for backed-up revisions; 26 OEM-curve focused tests. A controlled injected-Chromium DOM smoke loaded 48 real Studio JS modules and successfully exercised forms/navigation/download without normal page navigation; this is **not** deployed browser, server, mobile or private cloud acceptance.
- Batch 14: additive **localhost-only** portable Node 22+ server (`studio_source/portable/`, Windows/Mac/Linux launchers) using existing Studio browser ESM modules, Node built-in experimental SQLite, authenticated local study saving/history, CSRF-protected writes, local PDF/XLSX exports, and a separate local-only DB. **19 direct engine/storage/report checks and 26 authenticated HTTP tests passed (45 new)**; 12 selected dependency-free suites also passed. Reference fault outputs were 3,400 A at 12 kV, 32,725.858 A at 208 V transformer secondary, 16,706.173 A downstream. Windows launcher was not executed on real Windows. Portable PDF diagram is simplified and not identical to hosted PDF. This portable runtime must NEVER be publicly exposed, port-forwarded or treated as a production cloud server. The original hosted Worker build and owner cloud studies remain separate and untested.

Batch 10 reported passing local subsets: 145 latest checks; 41 operating; 42 nominal protection; 10 PV Q-limit; 51 other study screenings; 14 N-1; 24 original deep fault-audit tests covering 240 fault cases and 7,200 terminal phasors; 11/11 critical original source preservation checks; 43 isolated Python thermal tests. These are scoped test results only. Earlier selected regression coverage was partial. **NO passing original hosted Worker production build, real owner-authenticated cloud restore, full browser/mobile/print acceptance on the original private site, or complete standards certification has been established for this engineering branch through Batch 14.** The added release gate correctly FAILS until dependencies, licensed fonts, production build, native/browser printing, cloud study recovery and full QA are proven.

Public v21 has separately reported live browser and startup resilience evidence, but it does **not** imply that Batch 14 engineering modules were integrated into Public v21. Reconcile precisely.

#### 8. Concrete remaining work and required execution order

Maintain a real master backlog with **P0/P1/P2 priority**, named owner/tool, dependencies, files touched, applicable standard/version, benchmark, actual test result, and closure evidence. At minimum implement the following, moving in dependency order while working on parallel independent tasks when one is blocked:

**Phase 0 — Recover/reconcile/lock down:** inventory uploaded ZIPs, confirm SHA256/CRC; determine exact V21 public, V51 original private, Batch14 candidate baselines and any newer source; audit changes, tag and back up source, databases and user studies separately. Establish a private owner-controlled Git repository with history/commits, immutable baseline, reproducible lockfile/dependency graph, legal licensed report assets, working `npm ci`, build, and CI; document what cannot be accessed. No production mutation before verified backup/rollback.

**Phase 1 — Baseline bug fixes and real UX:** reproduce/clear/fix 65-to-56 kA and voltage-base/parallel-source issues, SLD drag/connect/double-click/undo/redo/delete/cancel, input/workspace routing, source property handling, mobile behavior, persistent project CRUD, saved-case schema, real PDF/XLSX/print; add Playwright/E2E browser tests for each plus numerical oracles. Prove existing V21 working features were not broken. Preserve the Batch14 portable localhost runtime as an optional independent QA/disaster-recovery pathway without conflating it with the hosted deployment or exposing it to the internet.

**Phase 2 — Provenance and equipment models:** reconcile v10, source-verifiable OEM subsets first, stable product IDs/deduplication/units, eligibility and field limitations. Build method-specific, validated data adapters and per-study saved selections, no silent migrations. Support manually entered values with explicit evidence/uncertainty instead of fake auto-populated data.

**Phase 3 — Validated fault/duty and load flow:** independent standards-specific max/min fault verification and fault-duty equipment comparisons including sequence and multiple sources, IEC/ANSI distinct methods, split-phase/DC scopes; improve full balanced load flow then appropriately unbalanced and constrained N-1. Maintain published reference cases and separate independent numerical implementations.

**Phase 4 — Protection and arc flash:** implement vetted manufacturer libraries, trip curves, CT/PT model and clearing times, protection coordination, then standards-scoped incident-energy/boundary engine dependent on validated fault/protection inputs. Do not publish unsafe results prematurely.

**Phase 5 — Coupled electrical engineering analyses:** production-grade cable thermal integration with validated original Thermal Studio equivalence; complete harmonic network analysis; grounding soil/grid touch-step; motor acceleration; DC fault and BESS/PV/IBR models; reliability and power system dynamics/microgrids. Use study-specific go/no-go gates and reliable benchmark cases, not cosmetic UI.

**Phase 6 — Regression, engineering review, release:** secure cloud-case export/restore/tenant isolation and privacy tests; cross-device and actual browser/keyboard/drag/touch tests; failure injection; units and source-version checks; open/inspect native PDF/XLSX; performance/load/accessibility/security checks. Perform independent verification against published standard examples and external calculation oracles. Build staging website using exact source; compare cases/numbers with existing public live version; pilot and rollback; deploy ONLY after gates pass and owner authorizes the consequential deployment.

**Phase 7 — Completion audit and sustained maintenance:** release tagged source, reproducible build, all data migrations/backups, full traceable test artifacts, versioned database and documented scope. Categorize each requirement: verified complete / implemented unverified / in progress / blocked / not started. Track bug fixes, regression tests, and standards updates without claiming 100% perfection. A signed-off safety study still requires applicable licensed standards, project specifics and qualified engineer review.

#### 9. Explicit known blockers requiring resolution, not concealment

1. Full private Site source/current Git history, runtime bindings, production secrets, font license and owner-controlled CI/build context may differ from uploaded archives. An exported ZIP is not a backup of owner-authenticated cloud studies.
2. Missing pinned npm packages blocked the original hosted npm build even after Batch14 added a package-free **alternative localhost** runtime. The new CI design proposes acquiring a legally licensed open-source font; this is not a proven full CI build. Never redistribute restricted fonts or report a package-free portable launch as proof of the original Worker production build.
3. Authenticated original cloud saved studies, real restore, schema migration, and private-site/browser printing have not been accepted through Batch14. Batch14 local SQLite and PDF/XLSX are distinct local workflows.
4. Browser/admin restrictions prevented normal navigation to local engineering-development pages. Batch13 injected DOM smoke and Batch14 localhost HTTP checks are valuable, but neither is a normal fully authenticated cloud/browser-mobile-print acceptance test. Public v21 browser results do not automatically validate Batch14.
5. Full OEM-vetted catalog (81,124 non-curated records held out), real protective curves/clearance, applicable standards coefficients, full physical models and independent cross-software acceptance are not finished.
6. Thermal project original current private source and all six reference workbooks may require authorized access; the archived Python companion is not proof of production parity.
7. Published Public v21 and Batch14 have different change histories. Merge conflicts, compatibility and saved case behavior must be demonstrated before any live merge.
8. Project-scope design may require genuine research/licensed documents; never claim their full text has been read without access.

#### 10. Method and reporting contract for all further work

- On first pass, **read archived `studio_source/MASTER_DEVELOPMENT_INSTRUCTION.md`**, `Fault_Studio_Batch14_Report_2026-10-25.md`, `README_BATCH10_FIRST.md`, `batch13/OPEN_ITEMS_BATCH13.csv` (where present), `batch10/OPEN_ITEMS_BATCH10.csv`, `README_FINAL_FIRST.md`, Public v21 latest release report and QA, previous continuation prompts, manifests, and original test scripts. Confirm that archive hashes and source protection actually match.
- Extract requirements **without silently dropping anything**; keep a requirements-to-code-to-test traceability matrix and a source/evidence ledger. Do not require me to re-state what is already in the uploaded files. Highlight real contradictions or unknown inputs concisely.
- Maintain alongside source: `REQUIREMENTS.md`, `ARCHITECTURE.md`, `PROGRESS.md`, `ISSUES.md`, `DECISIONS.md`, `TEST_RESULTS.md`, `DATABASE_PROVENANCE.md`, `RELEASE_GATE.md`, plus a ranked remaining-work tracker. Keep claims aligned with code and reproducible test output.
- Follow: inspect → research standards/OEM → specify methods + inputs → implement → independent numerical benchmark → unit/integration/browser tests → fix and retest → document → archive. Run meaningful smoke and regression after every change.
- Use appropriate connected tools and coding environments when authorized. Do not claim a plugin/agent, browser test, GitHub action, site deployment or external research ran unless you can provide its actual output. Do not use Formula Genius or Coursera; do not recommend switching to another paid AI platform.
- Respect current file access, owner authorization, private data and licensing. Do not reveal credentials or personal study information, assume deployment permission, or silently overwrite any live source/data.
- After each milestone provide: actual files changed; exact tests executed/passed/failed/blocked; numerical comparisons; retained critical source hashes; source/archive ZIP download; independently reproducible commit and rollback; update of complete remaining backlog; highest-priority task actually accomplished.
- For version continuity, produce BOTH one cumulative independently recoverable archive and a smaller patch/diff, with complete hashing/manifest and no private/license-restricted binaries. Cumulative means no loss of prior working code, tests, reports, studies or database history.
- When you genuinely need my help, give one compact blocker explaining the *exact* missing access, private study export, manufacturer data, engineering decision, or authorization, and continue other executable work. No circular questions or repeated "the project is incomplete" without meaningful implementation.

#### 11. Required first response and immediate action in the NEW chat

**Do not answer only with a plan.**

1. Inventory the uploaded archives and locate the latest Public v21 and Batch14 source. Identify precisely which application is actually deployed versus locally developed, and why the Batch14 localhost server is not a hosted release. Check manifests and key model/source preservation against original v51.
2. Provide a succinct **single reconciled status table**: capability, exact baseline location, evidence, tested status, remaining blocker.
3. Produce a prioritized, dependency-aware **full remaining-work checklist** and the next immediate implementation target. It must include all original mandatory UX bugs, source/database provenance, saves, build, QA, and engineering methods above.
4. Start work immediately on the highest-priority achievable item, modify actual source, run relevant independent tests, report exact outcomes and deliver an updated artifact. If privileged site/account operations are blocked, do not pretend to complete them; proceed with meaningful source-level work and specify the exact permission needed.
5. Never mark the project finished, mathematically certified, database 100% verified or live deployed unless the corresponding full evidence exists.

My objective: **one genuinely working, comprehensive, auditable, continually recoverable electrical engineering website, not a series of half-finished calculators, inflated claims, incomplete QA reports, or repeated handoff proposals.**


---

## A17. V28 original new-chat prompt


*Source file: `REQUIREMENTS/V28_ORIGINAL_NEW_CHAT_PROMPT.md`*

### Continue Fault Current Studio from V28 (do not restart)

Read `README_START_HERE.md`, `RELEASE/RELEASE_STATE.json`, `RELEASE/Release_Report.md`, `RELEASE/V28_SHA256_Manifest.json` and the full 236-file `RELEASE/V28_Complete_Website_236_FILES.zip` before changing code. The unmodified V27 cumulative ZIP in `HISTORY/` recursively preserves all previous releases, including the original PUBLIC V20 and V19 handoff chain. The original public Wix URL and metaSiteId are in `RELEASE/RELEASE_STATE.json`. Never upload partial Wix files; upload the entire validated site, and only after live browser acceptance is possible. Preserve all old saved-study keys, original project JSON formats, Cloud Vault and report engines. V28 adds a bounded conductor adiabatic I²t method and separate UI. V20/V27 advanced 16-mode export QA was independently rerun: 128 desktop/mobile PDF/XLSX documents validated with full field content. An unbatched Chromium session reproducibly stops issuing download events after ten downloads; four-mode context batches pass. Do not conflate this with previously observed hosted 429. Production live browser acceptance is NOT complete. Do not claim full IEC/IEEE/OEM compliance or recovered private original studies; owner-authenticated export is still required. Continue engineering feature implementation with reproducible Python-vs-JS reference tests, primary manufacturer sources, mobile browser QA, complete SHA-256 manifest and cumulative Library ZIP. Only notify when the entire requested scope is demonstrably accepted.


---

## A18. Stitch design system (DESIGN.md)


*Source file: `REQUIREMENTS/stitch_electrical_studies_design_system/fault_current_studio/DESIGN.md`*

```yaml
name: Fault Current Studio
colors:
  surface: '#031427'
  surface-dim: '#031427'
  surface-bright: '#2a3a4f'
  surface-container-lowest: '#000f21'
  surface-container-low: '#0b1c30'
  surface-container: '#141c28'
  surface-container-high: '#1b2b3f'
  surface-container-highest: '#26364a'
  on-surface: '#d3e4fe'
  on-surface-variant: '#bfc7d2'
  inverse-surface: '#d3e4fe'
  inverse-on-surface: '#213145'
  outline: '#89929b'
  outline-variant: '#3f4850'
  surface-tint: '#93ccff'
  primary: '#93ccff'
  on-primary: '#003351'
  primary-container: '#3198dc'
  on-primary-container: '#002c47'
  inverse-primary: '#006398'
  secondary: '#7bd0ff'
  on-secondary: '#00354a'
  secondary-container: '#00a6e0'
  on-secondary-container: '#00374d'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#ca8100'
  on-tertiary-container: '#3e2400'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#cce5ff'
  primary-fixed-dim: '#93ccff'
  on-primary-fixed: '#001d31'
  on-primary-fixed-variant: '#004b73'
  secondary-fixed: '#c4e7ff'
  secondary-fixed-dim: '#7bd0ff'
  on-secondary-fixed: '#001e2c'
  on-secondary-fixed-variant: '#004c69'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#031427'
  on-background: '#d3e4fe'
  surface-variant: '#26364a'
  surface-obsidian: '#090d13'
  surface-workspace: '#0d1117'
  surface-elevated: '#1c2635'
  surface-active: '#243144'
  stroke-structural: '#303e52'
  stroke-subtle: '#212c3b'
  text-primary: '#e6edf3'
  text-muted: '#8b949e'
  text-disabled: '#475569'
  duty-pass: '#10b981'
  duty-pass-container: '#022c22'
  duty-warn: '#f59e0b'
  duty-warn-container: '#422006'
  duty-fail: '#ef4444'
  duty-fail-container: '#4c0519'
  voltage-lv: '#10b981'
  voltage-mv: '#0284c7'
  voltage-hv: '#a855f7'
  arc-hazard: '#f97316'
  grid-line: '#1e293b'
  grid-axis: '#334155'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  title-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: '0'
  body-base:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: '0'
  body-bold:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: '0'
  data-mono-lg:
    fontFamily: JetBrains Mono
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.02em
  data-mono-base:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: '0'
  data-mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
    letterSpacing: '0'
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.75rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
```

#### Brand & Style

##### Vision & Identity
This design system establishes an industrial-grade engineering analytical studio and computational workbench constructed strictly for electrical power systems specialists, substation engineers, and protection coordination consultants. Inspired by physical instrumentation hardware (oscilloscopes, power analyzers, secondary injection relay test sets) and high-performance desktop CAE tools (ETAP, SKM Power*Tools, EasyPower), the visual posture eliminates frivolous ornamentation in favor of rigorous precision, deterministic mathematical clarity, and extreme data density.

##### Design Movement: High-Contrast Technical Brutalism / Industrial Ergonomics
The styling draws from technical computing consoles and high-contrast instrumentation:
- **Foundational Grounds:** Deep obsidian and slate surfaces engineered to prevent ocular fatigue during prolonged study sessions.
- **Structural Precision:** Hairline 1px structural framing, crisp 2px to 4px component corners, and visible mechanical divisions evoking rack-mounted hardware.
- **Strict Functional Semiotics:** Hue is never decorative. Color carries absolute regulatory and engineering meaning across ANSI/IEEE and IEC standards (equipment duty pass/warn/fail boundaries, voltage classes, and single-line energized states).
- **Mathematical Legibility:** Strict pairing of structural sans-serif navigation with monospace tabular telemetry, guaranteeing decimal alignment across vast matrix comparisons.

#### Colors

##### Palette Philosophy
The palette operates with strict chromatic discipline on a dark base canvas:
- **Canvas Base (`#090D13` / `#0D1117`):** Non-emissive slate and obsidian backdrops that anchor complex single-line diagrams (SLD) and time-current characteristic (TCC) log-log grids without luminance bleed.
- **Electric Cyan Primary (`#0284C7`) & Interactive Secondary (`#38BDF8`):** Applied exclusively to calculation triggers, active selection reticles, energized nodes, and primary action controls.
- **Engineering Amber Tertiary (`#F59E0B`):** Reserved for calculation solver statuses, phase curves, transformer tap selectors, and moderate duty warnings (80%–100%).

##### Regulatory Functional Semiotics
Color application adheres to physical equipment duty and power engineering conventions:
- **Red / Crimson (`#EF4444` / Container `#4C0519`):** Breaker duty exceedances (>100% interrupting capacity), fault points, component violations, and trip curves. Never used for aesthetic accents.
- **Amber / Gold (`#F59E0B` / Container `#422006`):** Marginal equipment rating warnings (80%–100%), DC decrement deratings, and coordination overlaps.
- **Emerald / Green (`#10B981` / Container `#022C22`):** Adequate equipment ratings (<80%), stable solver convergence, and ground-fault coordination validity.
- **Voltage Classes (SLD):** Low Voltage (<1 kV, 480V/208V) rendered in `#10B981`; Medium Voltage (1 kV–35 kV, 4.16kV/13.8kV) in `#0284C7`; High Voltage (>35 kV, 69kV/115kV/230kV) in `#A855F7`.

#### Typography

##### Dual Font Strategy
- **Primary Interface (Inter):** Handles application routing, tree navigation, dialog titles, standards documentation, and procedural parameter labels. Clean, low-distortion grotesk characteristics maintain legibility across dense dashboard configurations.
- **Technical Monospace (JetBrains Mono):** Drives all computational metrics, numerical readouts, matrix coordinates, equipment tags (e.g., `52-SWG-01`), impedance equations ($R + jX$), and uppercase status chips.

##### Numerical Tabular Alignment & Unit Syntax
- All numerical data presentations must enforce `font-variant-numeric: tabular-nums` to guarantee vertical decimal point alignment across high-order electrical tables.
- Units of measure (`kA`, `MVA`, `kV`, `pu`, `Ω`, `cycles`) must never be detached from scalar values: render with a non-breaking space followed by the unit in `#8B949E` (Secondary Metric Slate).
- Line heights remain constrained (1.2 to 1.4) to maximize vertical information density on typical workstation displays without content clipping.

#### Layout & Spacing

##### Engineering Workbench Architecture
The layout uses a multi-pane docked CAD architecture calibrated for multi-monitor and high-resolution displays:
- **Master Header Toolbar (44px fixed height):** Houses global system status, active study selection (e.g., 3-Phase Bolted, L-G, Arc Flash), standard toggles (IEEE C37 / ANSI vs. IEC 60909), and export actions.
- **Left Navigation & Network Tree Dock (260px fixed width):** Tree view of project substations, buses, feeders, synchronous machines, and utility sources.
- **Central Canvas Workspace (Fluid flex-1):** Houses either the vector-based Single-Line Diagram (SLD) canvas or the tabular impedance calculation matrix.
- **Right Property & Duty Inspector (320px fixed width):** Parameter inputs and instantaneous duty evaluation readouts for the selected element.
- **Bottom Telemetry & Log Drawer (collapsible, 200px default):** Solver convergence iterations, symmetrical component matrices ($I_0, I_1, I_2$), and system trace logs.

##### Density and Rhythmic Scaling
- **Grid Increment:** Strict 4px base step (`0.25rem`). Element internal padding relies on `space-xs` (4px) and `space-sm` (8px).
- **Separation Technique:** Dividers rely on 1px hairline structural strokes (`#303E52`) rather than large negative whitespace areas, preserving data packing efficiency.
- **Responsive Adaptations:**
  - *Desktop (≥1440px):* Full 3-pane workbench dock active simultaneously.
  - *Tablet / Small Desktop (1024px–1439px):* Left and right docks collapse into 44px vertical icon strips, expandable via overlay or hotkey (`Ctrl+B`, `Ctrl+I`).
  - *Mobile (<1024px):* Single active pane with horizontal bottom-tab navigation switching between SLD schematic, Bus Table, and Inspector views.

#### Elevation & Depth

##### Tonal Stratification & Hairlines
The visual hierarchy avoids soft drop shadows, which introduce perceptual blurring in dense technical drawings. Instead, depth is established via strict tonal layer steps and structural strokes:
- **Layer 0 (Canvas Base `#090D13`):** Underlying viewport ground, CAD grid workspace, and dark schematic canvas.
- **Layer 1 (Sub-surface `#0D1117`):** Master workbench frame, toolbar backgrounds, dock panels, and table striping.
- **Layer 2 (Containers `#141C28`):** Calculation result cards, modal dialogues, parameter blocks, and floating inspector heads.
- **Layer 3 (Elevated Instrument `#1C2635`):** Active row highlights, button resting states, card headers, and input suffixes.
- **Layer 4 (Interactive Focus `#243144`):** Drag targets, hovered components, and active dropdown options.

##### Outlines and Laser Focus Borders
All cards, inputs, and docks feature a 1px solid hairline border using `#303E52` (Structural Stroke) or `#212C3B` (Subtle Stroke). Focused elements and active selections replace the neutral stroke with a 1px solid Electric Cyan highlight (`#38BDF8`) with an optional low-radius glow (`box-shadow: 0 0 8px rgba(2, 132, 199, 0.35)`).

#### Shapes

##### Mechanical Precision Geometry
The shape language uses minimal corner radii (roundedness `1`, base 2px to 4px) reflecting precision physical testing equipment, chassis enclosures, and calibrated meters:
- **Base Components (Inputs, Buttons, Cards):** `4px` (`0.25rem`) corner radius.
- **Micro Badges and Table Indicators:** `2px` corner radius.
- **Status Pills (Pass/Marginal/Fail):** Either `2px` or full pill (`9999px`) strictly for standard compliance chips.
- **Single-Line Diagram Nodes & Breakers:** Razor-sharp (`0px`) ANSI/IEEE electrical symbol drafting standards.

#### Components

##### Buttons
- **Primary Solve Action:** 32px height, background `#0284C7`, text `#FFFFFF`, font Inter 13px Semi-Bold, radius 4px, padding 0 14px. Hover: `#0369A1` with subtle glow `0 0 10px rgba(2, 132, 199, 0.4)`. Active: `#075985`.
- **Secondary Engineering Tool:** 32px height, background `#1C2635`, border 1px solid `#303E52`, text `#E6EDF3`. Hover: background `#243144`, border `#38BDF8`.
- **Danger / Clear Fault Action:** 32px height, background `#4C0519`, border 1px solid `#EF4444`, text `#FECDD3`. Hover: background `#EF4444`, text `#FFFFFF`.
- **Ghost Utility Button:** Borderless, background transparent, text `#8B949E`. Hover: background `#1C2635`, text `#E6EDF3`.

##### Calculation Result Cards
- Constructed with `#141C28` background, 1px `#303E52` border, and 4px radius.
- Includes a 36px header in `#0F1620` with a 1px bottom border in `#212C3B`, featuring the component title on the left and the equipment duty status badge on the right.
- Content zone organizes results into tabular 3-column metric grids featuring large hero readouts (`data-mono-lg`, 18px `#E6EDF3`) paired with uppercase category caps (`label-caps`, 10px `#8B949E`).

##### Equipment Duty Badges (Chips)
- Compact status indicator (height 20px, padding 2px 6px, font `JetBrains Mono` 10px Bold, uppercase, tracking `0.08em`):
  - **Pass / Adequate (<80%):** Background `#022C22`, border 1px solid `#10B981`, text `#A7F3D0` (e.g., `DUTY: 64.2% PASS`).
  - **Warn / Marginal (80%–100%):** Background `#422006`, border 1px solid `#F59E0B`, text `#FEF08A` (e.g., `DUTY: 91.8% WARN`).
  - **Fail / Overstressed (>100%):** Background `#4C0519`, border 1px solid `#EF4444`, text `#FECDD3` (e.g., `DUTY: 114.3% FAIL`).

##### Input Fields & Parameter Forms
- **Field Styling:** Height 30px, background `#090D13`, border 1px solid `#303E52`, text `#E6EDF3`, font `JetBrains Mono` 12px Medium, padding 4px 8px, radius 4px.
- **Integrated Unit Suffix:** Fixed right-side badge container in `#1C2635` displaying the metric symbol (`kA`, `MVA`, `kV`, `%Z`, `X/R`) in `#8B949E`.
- **Validation State:** Red hairline border (`#EF4444`) with immediate inline warning readout below the input.

##### Checkboxes & Radio Buttons
- 16x16px square (checkbox) or circular (radio), background `#090D13`, border 1px solid `#303E52`, radius 2px.
- Checked state: background `#0284C7`, border `#0284C7`, white glyph.

##### Data Tables & Calculation Matrices
- Dense matrix layout with 28px header height (`#0F1620`, uppercase 10px monospace text in `#8B949E`).
- Row height: 28px, alternating striping with `#0D1117` and `#111722`. Hairline dividers in 1px `#212C3B`.
- Sticky column 0 for Bus/Node ID. Monospace values right-aligned with fixed tabular spacing.

##### Single-Line Diagram (SLD) Graphic Elements
- **Orthogonal Grid:** Background `#06090E` with 16px grid pitch dots in `#1E293B`.
- **Bus Bars:** Solid 4px wide geometric vectors color-coded by voltage class (LV: `#10B981`, MV: `#0284C7`, HV: `#A855F7`).
- **Fault Nodes:** Pulsing crimson target glyph (`#EF4444`) with coordinates rendered in `data-mono-sm`.


---

## A19. Calculator survey (100 tools, Top-25 features)


*Source file: `REPORTS/research/calculator_survey.md`*

### Electrical-engineering calculator survey (Fault Current Studio)

Compiled 2026-11-07. Every row is backed by a page fetched or found in this session (URL in last column). Feature text is paraphrased from those pages.

| # | Tool | Vendor | Type | Study areas | Features worth adopting | Source URL |
|---|---|---|---|---|---|---|
| 1 | ArcSafety (AC Arc Flash) | ETAP | Commercial | Arc flash (IEEE 1584-2018, NFPA 70E, CSA Z462, DGUV-I 203-077, NESC) | Automatic labels for incoming/load breakers, starters and load terminals; labels editable in Word; electrical work permits and data sheets; time-varying fault clearing with short-circuit current decay; incident-energy area plotted on TCCs; Result Analyzer comparing scenarios with one-line filter; worst-case datablocks; mitigation modelling (ZSIP, maintenance mode); capacitor hazard (NFPA 70E Art. 360); ATPV-violation alerts | https://www.etap.com/product/arc-flash |
| 2 | PowerTools for Windows (DAPPER, CAPTOR, A_Fault, Arc Flash, TMS, HI_WAVE, I*SIM, DC) | SKM Systems Analysis | Commercial | Short circuit (ANSI C37, IEC 60909, IEC 61363 marine); load flow; TCC; arc flash; cable ampacity; motor starting; harmonics; transient stability; reliability; DC (battery sizing, DC load flow, DC short circuit); BS 7671 sizing | Equipment Evaluation (device ratings vs short-circuit duty); Auto Coordination and Evaluation flags; panel schedules; IEEE 1584-2018 with 5 electrode configurations and enclosure sizes auto-defaulted by equipment type; arc flash computed at average and minimum arcing current with configurable tolerance and higher energy reported; Ralph Lee fallback outside 1584 range; user-defined PPE table and clothing library | https://skm.com/Product.html ; https://skm.com/arcflash-using-ieee1584-2018.html |
| 3 | EasyPower (ArcFlash Pro / Professional / Advanced) | EasyPower (Bentley) | Commercial | Short circuit; arc flash (to 800 kV); protective coordination; power flow; harmonics and filter design (IEEE 519, IEEE 2800); DC short circuit, DC arc flash, DC power flow | Tiered bundles sized by bus count; arc flash label printing; IEEE 519 and IEEE 2800 harmonic compliance reports; DC analysis included without extra modules; NFPA/NEC/ANSI/IEC/CSA support | https://easypower.com/products/arc-flash-solutions ; https://www.easypower.com/resources/article/dc-system-analysis-in-easypower |
| 4 | PSS SINCAL | Siemens | Commercial | Load flow; protection and arc flash; DER/EV interconnection and hosting capacity; RMS and EMT dynamics; time-series; multi-utility (gas, water, heat) | Hosting-capacity and grid-code compliance checks for DER/EV connection requests; multi-core parallel analyses; GIS and SCADA integration; Excel and CIM import/export; multi-user master database | https://siemens.com/us/en/products/energy/energy-automation-and-smart-grid/pss-software/pss-sincal.html |
| 5 | PowerFactory | DIgSILENT | Commercial | Load flow; short circuit; contingency; protection; arc flash; cable analysis; harmonics/power quality; reliability; OPF; state estimation; RMS/EMT; motor starting; probabilistic analysis | Project versioning with compare-and-merge; master/derived models; scripting automation; quasi-dynamic (time-series) simulation; connection request assessment; GIS/SCADA/EMS interfaces | https://www.digsilent.de/en/products.html |
| 6 | NEPLAN Electricity | NEPLAN AG | Commercial (desktop, intranet or cloud) | Load flow and contingency; short circuit; motor starting; arc flash; cable sizing; harmonics; flicker; voltage sags; reliability; overcurrent and distance protection; dynamics | Load-flow time simulation; optimal capacitor placement; phase swapping/balancing; economic cable sizing; protection data management system; fault finding; cloud deployment; networks above 500,000 busbars | https://neplan.ch/?p=814 |
| 7 | CYMTCC (Protective Device Coordination) | Eaton (CYME) | Commercial | Protective device coordination; optional arc flash | 15,000+ device library from 100+ manufacturers with online updates; curve dragging and device-pair separation-time measurement; automatic relay time-dial selection to a target time; Delta-Y L-L and L-G through-fault curve shifts; benchmarks (cable damage, transformer withstand, inrush, motor starting); export to PDF/DWG/DXF/SVG; custom title block and logo | https://www.eaton.com/content/dam/eaton/products/utility-and-grid-solutions/distributed-energy-resources-software-applications/cyme-protective-device-coordination-br917033en.pdf |
| 8 | PowerWorld Simulator | PowerWorld Corporation | Commercial | Load flow; contingency analysis | Batch contingencies that auto-restore the base case; results viewed by contingency or by impacted facility; auto-generated contingencies; conditional remedial action schemes; side-by-side comparison of two result sets (e.g., seasons, before/after a change) | https://www.powerworld.com/products/simulator/base-features/contingency-analysis |
| 9 | pandapower | Fraunhofer IEE / University of Kassel | Open-source (BSD, Python) | Power flow; OPF; short circuit (IEC 60909); state estimation; topology analysis | Element models defined by nameplate data and converted internally; pandas tables for inputs and results; ideal switch modelling; standard-type libraries; 66 predefined test networks; MATPOWER/PYPOWER import-export | https://arxiv.org/pdf/1709.06743v2 |
| 10 | OpenDSS | EPRI | Open-source | Distribution power flow; fault study; harmonic flow; dynamics; load parameter variation; geomagnetically induced current | Dedicated FaultStudy solution mode; harmonic flow mode; GIC analysis | https://opendss.epri.com/ |
| 11 | VeraGrid (successor to GridCal) | SanPen / open-source community | Open-source (Python, GUI, API) | Power flow incl. 3-phase unbalanced; unbalanced short circuit; OPF; contingency; PTDF/LODF; RMS and EMT; state estimation; investments | Unbalanced short circuit with sequence voltages/currents; continuation power flow; stochastic power flow; time-series contingencies; imports PSS/e, CGMES, Matpower; inputs never overwritten by results (reproducibility) | https://github.com/SanPen/GridCal |
| 12 | PyPSA | PyPSA developers | Open-source (MIT, Python) | Power flow (Newton-Raphson and linear); linear OPF; security-constrained OPF; capacity expansion incl. storage; sector coupling | Least-cost generation/storage/transmission expansion; N-1 security-constrained OPF; free HiGHS solver by default; built-in statistics and plotting | https://github.com/PyPSA/PyPSA |
| 13 | MATPOWER | MATPOWER project (PSERC) | Open-source (MATLAB/Octave) | Power flow; continuation power flow; OPF; unit commitment | Runs in free Octave; extensible OPF formulation; simple, modifiable code aimed at education | https://www.mathworks.com/matlabcentral/fileexchange/72085-matpower |
| 14 | DOC / DOCWin | ABB | Free download | Single-line diagram; load current and voltage drop; short circuit (max and min); LV/MV cable sizing; device selection; coordination; switchboard configuration | Automatic device selection that the user can restrict or override; verification of cable protection; max and min fault current at every node; export to DWG/DXF/RTF | https://new.abb.com/low-voltage/solutions/selectivity/tools-support/doc ; https://www.voltimum.co.uk/news/free-software-electrical-installation |
| 15 | ABB Slide Rules | ABB | Free mobile (iOS) | LV cable sizing / ampacity | Base sizing vs derated sizing for ambient temperature and grouping; emailed report of all selections | https://www.voltimum.co.uk/news/abb/abb-slide-rules-app |
| 16 | CYME Low Voltage Cable Sizing module | Eaton (CYME) | Commercial module | LV cable sizing (IEC 60364-5-52 or NEC) | Combined ampacity, voltage drop and short-circuit withstand (IEC) checks with an optimal-cable recommendation; soil resistivity, temperature and grouping inputs; load taken from load-flow results | https://www.eaton.com/us/en-us/products/utility-grid-solutions/software-modules/low-voltage-cable-sizing-module.html |
| 17 | Ecodial Advance Calculation | Schneider Electric | Free download | LV network calculation; discrimination; cascading; device selection | Switchgear operating modes (multi-source, load shedding, seasonal) with de-energised sections highlighted on the SLD; tripping-curve discrimination display; printable calculation reports | https://electrical-engineering-portal.com/download-center/electrical-software/ecodial |
| 18 | Southwire Voltage Drop Calculator | Southwire | Free mobile | Voltage drop; wire size | Solve either wire size for a voltage-drop limit or voltage drop for a given run | https://www.southwire.com/apps |
| 19 | Southwire Conduit Fill Calculator | Southwire | Free mobile | Conduit fill | Conduit size, fill percentage and jam probability | https://www.southwire.com/apps |
| 20 | Southwire SIMpull 600V Calculator | Southwire | Free mobile | Conduit fill; pulling tension; sidewall pressure; voltage drop; ground sizing | Pulling tension and sidewall pressure with jam probability, combined with voltage drop and ground sizing in one tool | https://www.southwire.com/apps |
| 21 | FC2 Available Fault Current Calculator | Eaton (Bussmann) | Free mobile/web (paid Pro tier) | Short circuit (point-to-point, 1-ph and 3-ph) | Generates NEC 110.24 maximum available fault current label; one-line diagram review; emailed PDF results; multiple calculations combined in one email (Pro); motor contribution (Pro) | https://www.eaton.com/content/dam/eaton/products/electrical-circuit-protection/fuses/fault-current-calculator/bus-ele-pp-10106-fc2-mobile-app.pdf ; https://www.eaton.com/us/en-us/products/electrical-circuit-protection/fuses/sccr-made-easy.html |
| 22 | EasyPower Arc Flash Calculator | EasyPower | Free web | Arc flash (IEEE 1584-2002 or 2018) | Edition selector (2002/2018); equipment type and enclosure H/W/D inputs; outputs both average and minimum arcing current plus boundary and incident energy; explicit not-for-PPE disclaimer | https://www.easypower.com/resources/arc-flash-calculator |
| 23 | ETAP Arc Flash Calculator | ETAP | Free web | Arc flash (IEEE 1584) | Pre-filled realistic example inputs (42 kA, 0.33 s, 24 in, 0.48 kV); shows how system changes affect incident energy and PPE | https://etap.com/arc-flash-calculator2 |
| 24 | ElectroDroid Pro | Iero | Mobile (Android, paid) | Voltage drop; ampacity and wire-gauge references; battery life; general electronics | Large offline reference tables (wire gauges, ampacity, resistivity) bundled with calculators | https://mytechdecisions.com/facility/must-have-apps-for-electrical-reference-and-calculations-on-your-ios-or-and/slideshow/20 |
| 25 | VIOX Tools (148 calculators) | VIOX Electric | Free web | Arc flash IEEE 1584-2018; short circuit; breaker selectivity/cascading; breaker and fuse sizing; assembly SCCR; IDMT relay timing; stationary battery sizing; solar, EV, lighting, surge/lightning | Arc flash runs normal and reduced-arcing-current scenarios; explicit screening-only scope; assembly SCCR calculator; IDMT trip-time calculator; battery screen integrates duty-cycle Ah with temperature/aging/margin factors and says plainly it is not the IEEE 485 Kt method | https://tools.viox.com/arc-flash-incident-energy-calculator/ ; https://tools.viox.com/stationary-battery-sizing-calculator/ |
| 26 | ArcSafety DC Arc Flash | ETAP | Commercial | DC arc flash (NFPA 70E 2024 Annex D.5) | Max Power, Stokes-Oppenlander, Paukert, DGUV-I 203-077 and incident-energy-subtraction methods; compares methods and reports the most conservative; covers battery banks and PV plants; worst-case datablocks | https://etap.com/de/product/dc-arc-flash-software |
| 27 | Power Suite (GenSize) | Cummins | Free web | Generator set sizing | User voltage-dip input for motor loads; conservative defaults to prevent undersizing; red/yellow flags on problem parameters; links to spec sheets and BIM; online collaboration | https://www.csemag.com/articles/comparing-generator-sizing-software/ |
| 28 | SpecSizer | Caterpillar | Free web | Generator set sizing | Drag-and-drop load profile; per-step transient performance report; sizing reports with drawings; direct BIM model download; file sharing with experts | https://www.cat.com/specsizer ; https://www.csemag.com/articles/comparing-generator-sizing-software/ |
| 29 | Power Design Pro | Generac | Free web | Generator/ATS sizing; transient analysis; harmonic distortion (THVD); load shedding | Concurrent, non-concurrent and cyclic start sequences; voltage and frequency dip limits per project and per sequence; THVD criterion; harmonic spectrum models for VFD/UPS/chillers; load-shedding scheme builder; specification text generation; real-time collaboration | https://www.generac.com/business/resources/power-design-pro/ |
| 30 | QuickSize | Kohler (Rehlko) | Free web | Generator set sizing | Step loading with loads movable between steps; failing engines listed with the reason; custom Word specification output | https://www.csemag.com/articles/comparing-generator-sizing-software/ |
| 31 | PVsyst | PVsyst SA | Desktop (Windows; licensing per vendor, SourceForge listing calls it free) | PV yield simulation; shading; losses; grid-tied, off-grid and pumping | Built-in weather and module/inverter libraries; shading and loss analysis; reports comparing design options | https://sourceforge.net/app/pvsyst/ |
| 32 | Sunny Design | SMA | Free web (paid PRO tier) | PV string sizing; on-grid, off-grid and hybrid with battery | Checks string voltage against MPPT window at extreme temperatures; DC/AC ratio clipping check; MPPT input balance across orientations; load-profile and tariff analysis (PRO) | https://www.heavengreenenergy.com/blog/sunny-design-review |
| 33 | System Advisor Model (SAM) | NREL | Free desktop | PV; battery storage (Li-ion, lead acid, flow); wind; CSP; financial models | Behind-the-meter, PPA and third-party-ownership financial models; front- or behind-the-meter battery modelling | https://sam.nrel.gov |
| 34 | HelioScope | Aurora Solar | Commercial web | PV layout and electrical design | Single-line diagram export to DXF; voltage drop displayed for any conductor size while designing; 8760-hour production CSV export; detailed loss table; design cloning for alternatives | https://help-center.helioscope.com/hc/en-us/articles/4419983425683-Things-You-May-Have-Missed |
| 35 | Solar.configurator | Fronius | Free web | PV string and inverter sizing; battery compatibility | Shows all valid designs per inverter type; multi-MPPT configurations; minimal inputs; responsive on phone/tablet; PDF report; yield forecast | https://www.fronius.com/en-au/australia/solar-energy/installers-partners/products-solutions/monitoring-digital-tools/solar-configurator-pv-system-configuration |
| 36 | HOMER Pro | UL Solutions (HOMER Energy) | Commercial | Hybrid microgrid sizing (PV, wind, battery, diesel, grid) | Year-long simulation at 1-min to 1-h steps; enumerates and ranks all configurations; sensitivity analysis; kinetic battery model with temperature and degradation; multi-year degradation and load growth | https://homerenergy.com/products/pro |
| 37 | XGSLab (Grounding, EMF, Lightning) | Bentley Systems | Commercial | Grounding (IEEE 80, IEC, EN); EMF and AC interference; lightning shielding | Fault current split workflows; multi-layer, multi-zonal and seasonal soil models from Wenner/Schlumberger data; rolling sphere and Eriksson methods; DXF/DWG import; automated reports | https://www.bentley.com/products/xgslab |
| 38 | CDEGS | Safe Engineering Services (SES) | Commercial | Grounding (low frequency and frequency domain); soil resistivity; fault current distribution; EMI; cathodic protection | RESAP soil interpretation; SPLITS and FCDIST fault current distribution; TRALIN line/cable constants; DXF exchange with AutoCAD | https://sestech.in/cdegs.html |
| 39 | DEHNrisk | DEHN | Cloud subscription | Lightning risk assessment (IEC 62305-2 Ed. 3) | Browser-based with concurrent users; national variants (IEC, EN, BS, DIN, CSN); guided workflow replacing spreadsheets; links to 3D drawings from DEHNplan | https://dehn-international.com/en/dehnrisk |
| 40 | Ground Grid Systems | ETAP | Commercial | Grounding (IEEE 80/81/665, EN 50522) | Automatic two-layer soil model from Wenner data; FEM for irregular grids; colour 3D touch/step and surface-potential plots; safety-vs-cost optimisation of rods and conductors; selectable body weight | https://etap.com/es/product/ground-grid-systems-software |
| 41 | DIALux evo | DIAL | Free desktop | Lighting design; daylight; lighting energy | EN 12464-1:2021 support; 8,760-hour daylight-controlled energy calc with LENI; UGR via CIE 117 tabular method | https://dialux.com/en-GB/dialux/whats-new-in-dialux-evo-11 |
| 42 | AGi32 | Lighting Analysts | Commercial | Interior/exterior/roadway lighting; daylight | IES/CIBSE/EULUMDAT import; direct-only vs full radiosity modes; roadway luminance per ANSI/IES RP-8-18; DWG import/export | https://docs.agi32.com/AGi32/Content/AGi32 Overview and Interface/AG32_Overview-Introduction.htm |
| 43 | ReluxDesktop | Relux Informatik | Free | Lighting; daylight; sensors; emergency lighting | Dedicated emergency-lighting tools; bidirectional Revit link; IFC/gbXML/DWG exchange; metric or imperial units; 25 languages | https://relux.com/en/relux-desktop.html |
| 44 | Harmonics Estimator Tool | Mitsubishi Electric US | Free download | Harmonics from VFDs (IEEE 519) | Pre-installation harmonic estimate and drive selection to stay within IEEE 519 | https://us.mitsubishielectric.com/fa/en/resources/planning-tools/assets/harmonics-estimator-tool/ |
| 45 | MTE Harmonic Calculator | MTE Corporation | Free web | Harmonics (IEEE 519-2014 TDD at PCC) | PCC on primary or secondary of utility transformer; optional generator; per-drive proposed mitigation; initial vs proposed TDD against limit; kVA reduction and annual savings; printable report | https://mtecorp.com/test-for-harmonic-calculator/ |
| 46 | Ugly's Electrical References | Jones & Bartlett Learning | Mobile (paid) | Voltage drop; ampacity; motor data; power factor correction; conduit fill; full-load and locked-rotor current | NEC change explainer; offline use; PPE and safety guidance alongside calculators | https://apps.apple.com/us/app/id1134770838 |
| 47 | Electrical Calc Elite | Calculated Industries | Mobile (paid) | Wire sizing (NEC 310.16/310.17); voltage drop; conduit sizing; motors (NEC 430); grounding (NEC 250.122/250.66) | Selectable NEC edition; ambient and conductor-count derating; displays the NEC table reference with each result; parallel conductor sizing | https://apps.apple.com/app/id510284903 |
| 48 | NoOutage Voltage Drop Calculator | NoOutage.com | Free web | Voltage drop (DC, 1-ph, 3-ph) | Uses NEC Chapter 9 Tables 8 and 9 with conduit type and conductor temperature; parallel runs | https://www.nooutage.com/vdrop.htm |
| 49 | NEC Residential Load Calculator | VoltageLab | Free web | Dwelling service load (NEC 220 standard method) | Applies larger of A/C or heating; EV charging input; load breakdown by category; minimum service amps | https://www.voltagelab.com/?p=10615 |
| 50 | SurgePV free tools | SurgePV | Free web | Conduit fill (NEC Ch. 9); PV AC circuit sizing (NEC 690); busbar 120% rule; battery sizing | Three conduit-fill modes (check, minimum size, maximum count); PV quick-fill from string count; EGC sized from breaker; jam-risk and derating flags | https://www.surgepv.com/tools/solar-conduit-fill-calculator |
| 51 | elec calc | Trace Software International | Commercial | LV/HV short circuit; voltage drop; harmonics; power balance; cable sizing; device selection | Multi-manufacturer catalogue of 100,000+ devices; national standard variants (BS, NF C15-100, VDE, REBT, NEN etc.); operating scenarios (normal, load shedding, maintenance); design notes output in another language | https://www.trace-software.com/en/our-solutions/electrical-installations-calculation-software/ |
| 52 | ProDesign | Amtech | Commercial | BS 7671 electrical design calculations | Tiered functionality levels; integration with test-and-inspection software | https://www.bsee.co.uk/the-complete-solution-for-electrical-design/ |
| 53 | CYMCAP | Eaton (CYME) | Commercial | Cable ampacity (Neher-McGrath, IEC 60287, IEC 60853, IEC 60949) | Transient ratings (time-to-temperature, ampacity-for-time); IEC 60853 cyclic load profiles; duct bank optimiser for best circuit placement; tunnels, troughs and cable crossings (IEC 60287-3-3) | https://www.cyme.com/software/cymcap/ |
| 54 | SIMARIS design | Siemens | Free | LV/MV network dimensioning; short circuit | Dimensioning to VDE/IEC with real catalogue products; minimal input from MV down to socket outlets | https://www.siemens.com/en-gb/products/simaris/ |
| 55 | SIMARIS curves | Siemens | Free | Protective device characteristic curves | Tolerance bands on device curves; cut-off current and let-through energy curves | https://www.siemens.com/en-gb/products/simaris/ |
| 56 | Cable Thermal Analysis (Underground Raceway) | ETAP | Commercial | Cable ampacity and temperature (Neher-McGrath, IEC 60287), transient | Drag cables from the one-line into raceway layouts; flags for critical/marginal temperatures; multi-scenario transient plot overlay; optimisation of new cables in existing raceways; EMF evaluation | https://etap.com/product/cable-thermal-software |
| 57 | Cable Fill Calculator (Submittal Builder) | Legrand | Free web | Cable tray fill (NEC 392.22) | Fill rules by tray type and cable category; cable library with OD and weight | https://submittalbuilder.legrand.us/loadtable/ |
| 58 | Eland Cables Cable Calculator | Eland Cables | Free web | Cable sizing (BS 7671, IEC 60364-5-52) | Returns not-suitable when nothing fits; lists matching cables | https://www.elandcables.com/cable-calculator |
| 59 | myCableEngineering | myElectrical | Cloud (web) | LV/MV cable sizing to 33 kV (BS 7671, ERA 69-30, IEC 60502); sequence impedance; voltage drop (CLC/TR 50480) | Team collaboration and project management; reports; works on phone/tablet/desktop | https://myelectrical.com/tools/three |
| 60 | myElectrical tools | myElectrical | Free web | Power factor correction; arc flash; IDMT tripping time; motor starting time; CPC sizing; duct sizing; 3-phase calcs | Motor starting time calculator; IDMT relay timing; circuit protective conductor sizing | https://myelectrical.com/tools/three |
| 61 | Cable Sizing (IEC 60364) | ETAP | Commercial | Cable sizing and shock protection (IEC 60364) | Integrated shock-protection check; alerts when sizes are inadequate; linked to load flow, short circuit and coordination; many raceway types incl. direct burial | https://etap.com/product/iec-60364-standard |
| 62 | IEEE 519 Limit Finder | Foretec Electric India | Mobile (Android) | Harmonic limits (IEEE 519-2022) | Estimates Isc at PCC and looks up TDD limit from Isc/IL ratio; PDF report | https://play.google.com/store/apps/details?id=com.foretec.tdd |
| 63 | Harmonic Analysis | ETAP | Commercial | Harmonic load flow; frequency scan; filter design | THD/IHD/TDD/TRD evaluation; transformer K-factor with derating alerts; TIF and I*T; cable sizing from harmonic load flow; parallel resonance identification | https://etap.com/product/harmonic-analysis-software |
| 64 | Harmonics (Spectrum) | EasyPower | Commercial | Harmonics (IEEE 519); power factor correction; resonance | Drag-and-drop filters; toggling filters on/off to locate problems; PFC with resonance screening; non-integer and triplen harmonics | https://www.easypower.com/products/features/spectrum |
| 65 | Star (Overcurrent Protection and Selectivity) | ETAP | Commercial | Protective device coordination | Animated sequence-of-operation playback; rule-based auto-evaluation; time-difference calculator and minimum-time-difference finder | https://etap.com/product/overcurrent-protection-selectivity |
| 66 | Protection and Coordination (PowerProtector) | EasyPower | Commercial | Protective device coordination | Auto clipping of curves at available fault current to show true trip times; short-circuit and arc flash results linked on the TCC one-line; differential and multifunction relays; large verified device library | https://www.easypower.com/products/features/powerprotector/features |
| 67 | EVI-Pro Lite | NREL | Free web | EV charging load and infrastructure planning | Hourly EV load profile stacked by charger type; sensitivity to home-charging access; charger count estimates | https://www.nrel.gov/news/program/2020/how-might-electric-vehicles-affect-electric-loads.html |
| 68 | Electrical Load Calculator | FSG | Free web | Add-a-load and panel capacity (NEC 210.19/210.20, 625.42) | Remaining panel capacity mode; continuous vs non-continuous flag per load; states it is not an NEC 220 calculation | https://fsg.com/resources/electrical-load-calculator |
| 69 | VoltFlow calculators | VoltFlow | Free web | Conduit fill; cable tray fill; voltage drop; ampacity; derating; ground wire; EV charging | Returns the smallest trade size that passes plus fill percentage | https://www.voltflow.net/conduit-fill-calculator |
| 70 | Mike Holt's Electrical Toolbox | Mike Holt Enterprises | Mobile | Conductor sizing with voltage drop; circuit protection; raceway sizing; grounding conductors; transformers; dwelling service load | Dwelling-unit service load calculation and sizing | https://apps.apple.com/us/app/id1406630647 |
| 71 | enSights Storage Calculator | enSights | Web | BESS sizing and financials | Value stacking (self-consumption, demand charges, arbitrage, voltage support); degradation by DoD, round-trip efficiency and cycles; co-sizes PV and battery for IRR | https://prnewswire.com/news-releases/ensights-launches-storage-calculator-at-re-to-accelerate-battery-deployment-302232119.html |
| 72 | Peak Shaving and Load Shifting Tools | Fraunhofer IISB | Research tools / service | BESS and thermal storage dimensioning; peak shaving | Optimisation-based sizing from measured load profiles; payback evaluation; smoothed-profile simulation | https://www.iisb.fraunhofer.de/content/dam/iisb2014/en/Documents/Research-Areas/intelligent-energy-systems/Load-Shifting-and-Peak-Shaving-Tools_1V03_WWW.pdf |
| 73 | PSS/E | Siemens | Commercial | Transmission load flow; contingency; fault; dynamics; PV/QV | Python API (2,000+ functions); up to 200,000 buses; node-breaker modelling | https://www.siemens.com/en-gb/products/pss-software/psse |
| 74 | pvlib python | pvlib community | Open-source (Python) | PV performance modelling | ModelChain workflow; benchmarked, interoperable PV models | https://pvlib-python.readthedocs.io/en/latest/user_guide/getting_started/package_overview.html |
| 75 | PowerModels.jl | LANL ANSI | Open-source (Julia) | Power flow; OPF; optimal transmission switching; expansion planning | Same problem solvable with many formulations (AC, DC, LPAC, SOC, QC, SDP, IV) | https://github.com/lanl-ansi/PowerModels.jl |
| 76 | Starting Motor Voltage Drop Excel Calculator | Engineers Edge / Electrical Engineering Portal (premium download) | Spreadsheet (paid membership) | Motor starting voltage drop at transformer primary/secondary | Two modes: NEC 430-150/151(B) table data or nameplate data; autotransformer reduced-voltage starter tap setting | https://www.engineersedge.com/excel_calculators/Electrical_Electronics_Excel_Calculators/starting_motor_voltage_drop_excel_calculator_13960.htm ; https://electrical-engineering-portal.com/download-center/electrical-software/motor-voltage-drop |
| 77 | PSCAD | Manitoba Hydro International | Commercial | Electromagnetic transients | Drag-and-drop circuit building; libraries for HVDC, renewables, transformers, lines | https://us.fitgap.com/products/pscad |
| 78 | CYME Reliability Assessment (CYMDIST) | Eaton (CYME) | Commercial | Distribution reliability (SAIFI, SAIDI, CAIDI, MAIFI, ASAI, ENS) | Predictive model calibrated to historical outages; one-line colour-coded by any index; fuse-saving vs fuse-clearing reclosing; restoration via pre-contingency load flow; graphical comparison of two studies | https://cyme.com/software/cymdistram |
| 79 | Synergi Electric (Reliability module) | DNV | Commercial | Distribution load flow; reliability; protection; cable ampacity | Worst-performing feeder study; root-cause analysis; economic impact; thematic mapping; reliability uses same switching model as load flow | https://www.dnv.com/software/services/synergi-electric/modules-cable-reliability.html |
| 80 | WindMil | Milsoft Utility Solutions | Commercial | Distribution load flow and voltage drop; reliability; short circuit; coordination; arc flash (IEEE 1584-2008, NESC); motor starting | LightTable TCC tool; soft-start motor options; line charging current; MultiSpeak integration with CIS/SCADA/AMI | https://www.milsoft.com/wp-content/uploads/2023/02/2022-Brochure-EA_V3.pdf |
| 81 | Paladin DesignBase | Power Analytics (now via EasyPower; being retired) | Commercial (retiring) | 42 design/simulation tools; arc flash (IEEE 1584-2018) | Data Structure Analyzer checking drawings against database; automatic connectivity and voltage-inconsistency error checking; component hyperlinks | https://easypower.com/products/paladin-designbase |
| 82 | StrikeRisk v6.0 | ABB (Furse) | Commercial | Lightning risk assessment (IEC/EN 62305-2) | Multiple risk cases per project from templates; zoning of structures; multiple connected services and remote structures | https://www.voltimum.co.uk/news/furse/new-strikerisk-v60-risk-management |
| 83 | Aurora Solar | Aurora Solar | Commercial web | PV design; string sizing | Automatic string sizer with multi-MPPT logic and NEC checks (per third-party review) | https://www.heavengreenenergy.com/blog/solar-string-sizing-software |
| 84 | Transformer kVA Calculator | Maddox Transformer | Free web | Transformer sizing (1-ph and 3-ph) | Enter any two of V, A, kVA; recommends dividing minimum by 0.8 for headroom | https://www.maddox.com/resources/kva-calculator |
| 85 | CMEQ calculators | CMEQ (Quebec master electricians) | Free web (member access) | Dwelling service; short-circuit capacity at points in a circuit; voltage drop | Clear code-edition notice telling users which code version results follow | https://www.cmeq.org/english/calculators/ |
| 86 | Ampwright: Electrician Calc | Ampwright | Free mobile (Android) | Voltage drop; cable size; motor FLC; transformer short-circuit current; power factor correction | Shows the formula behind every result; IEC or NEC defaults; saved named results with notes; offline; no account | https://play.google.com/store/apps/details?id=com.ampwright.app |
| 87 | Firgelli engineering calculators | Firgelli Automations | Free web | Short circuit; NEC 250 grounding conductor; electrode resistance; motor inrush; cable sizing and voltage drop; PFC; battery runtime | Wide coverage of field calculations on one site | https://www.firgelliauto.com/blogs/engineering-calculators/tagged/electrical |
| 88 | PVWatts | NREL | Free web | PV energy production | NSRDB solar resource data; default DC/AC ratio 1.2 with overrides | https://pvwatts.nrel.gov/version_6.php |
| 89 | GridLAB-D | PNNL | Open-source | 3-phase unbalanced distribution time-series; DER, storage, EV chargers | Agent-based time-series simulation; end-use load models (HVAC, water heaters, ZIP) | https://gridlab-d.readthedocs.io/en/docs/docs/2.0%20-%20New%20Users/Tutorial/2.2.1%20-%20Overview/ |
| 90 | PV*SOL premium | Valentin Software | Commercial | PV 3D design; shading; battery, EV and heat-pump integration | Bankable yield reports; storage/EV/heat-pump integration | https://valentin-software.com/wp-content/uploads/Press_Release_ValentinSoftware_Intersolar_Europe_2026.pdf |
| 91 | ANDES | CURENT (open-source) | Open-source (Python) | Power flow; transient stability; eigenvalue; continuation power flow; state estimation | Symbolic models auto-generate code and LaTeX documentation; PSS/E RAW/DYR and MATPOWER import; verified against PSS/E and TSAT | https://pypi.org/project/andes |
| 92 | REopt Lite | NREL | Free web | PV and battery sizing; resilience | Sizes PV+BESS to carry critical loads through a specified outage; includes existing diesel generator; savings vs resilience shown side by side | https://www.renewableenergyworld.com/energy-storage/how-could-solarstorage-benefit-your-community-find-out-for-free/ |
| 93 | OSCAR SCCR Compliance Application | Eaton | Web (30-day trial) | Industrial control panel SCCR (UL 508A) | Panel SCCR determination per UL 508A | https://www.eaton.com/us/en-us/products/electrical-circuit-protection/fuses/sccr-made-easy.html |
| 94 | Short-Circuit Current Calculator | ReversePCB | Free web | Short circuit (point-to-point, radial) | Clearly lists what is not modelled (motor contribution, unbalanced faults, IEC 60909); worked example | https://reversepcb.com/short-circuit-current-calculator |
| 95 | OpenSolar | OpenSolar | Free web | PV design and proposals | Single-line diagram generation; automatic BOM; on-demand permitting | https://www.opensolar.com/features |
| 96 | Battery Sizing | ETAP | Commercial | Stationary battery sizing (IEEE 485, 946, 308) | IEEE 485-format report; duty cycle built from loads; discharge simulation verification; temperature/aging/initial-capacity/margin factors; random load placed at lowest terminal voltage | https://etap.com/de/product/battery-sizing-software |
| 97 | ELEK free calculators | ELEK Software | Free web | Touch/step voltage (IEEE 80); cable sizing (AS3008, BS7671); voltage drop; arc flash; fault loop impedance; earth grid; lightning; relay tripping | 50/70 kg body weight and surface-layer inputs for IEEE 80 limits | https://elek.com/resources/free-electrical-calculators/touch-step-voltage-calculator/ |
| 98 | GroundCalc | Open-source (MATLAB toolbox) | Open-source (educational) | Grounding grid analysis in two-layer soil; IEEE 80 limits | DXF/CSV import of grid geometry; GPR, touch and step distributions; selectable fault injection and return points | https://science.ecosyste.ms/projects/8341 |
| 99 | Motor Acceleration / Motor Starting | ETAP | Commercial | Motor starting (dynamic and static) | Worst-case starting impact search; VFD, soft starter and other starter models; voltage flicker; unlimited event sequences; time plots; Python scripting and Excel reports | https://etap.com/product/motor-acceleration-software |
| 100 | Hagercad | Hager | Commercial (Basic/Expert/Premium) | Installation design and documentation up to 4000 A | Quotations by enclosure, list or location; materials list across projects; project sync (no calculation features stated on page) | https://hager.com/uk/digital-tools/hagercad |

#### Top 25 features to adopt, ranked

Ranking: how much the feature helps Fault Current Studio's users, how often it shows up across the surveyed tools, and how practical it is to build in a browser. The numbers in brackets are rows in the table above.

1. **NEC 110.24 available-fault-current label plus a PDF of the one-line**, generated from the short-circuit result [21 FC2; also referenced on 93's Eaton SCCR page].
2. **Automatic arc flash labels, with work permits and data sheets**, editable templates and worst-case results per bus [1 ETAP ArcSafety, 3 EasyPower, 26 ETAP DC].
3. **Arc flash at both average and reduced/minimum arcing current**, with the worse case reported and a configurable tolerance [2 SKM, 22 EasyPower calculator, 25 VIOX].
4. **IEEE 1584-2018 enclosure/electrode inputs that default from equipment type** (VCB/VCBB/HCB/VOA/HOA, enclosure H/W/D), so the user can override [2 SKM, 22, 23, 81 DesignBase].
5. **Incident energy and short-circuit results drawn on the TCC**, with curves clipped at the available fault current [1 ETAP (energy area on TCC), 66 EasyPower auto clipping, 7 CYMTCC fault-level checks].
6. **Tolerance bands and let-through (cut-off, I²t) curves on the TCC** [55 SIMARIS curves].
7. **Coordination aids**: drag curves, measure the time gap between two devices, auto-pick a relay time dial for a target time, apply Delta-Y through-fault shifts [7 CYMTCC, 65 ETAP Star, 66 EasyPower].
8. **Automatic rule-based checks**: equipment duty vs fault current, plus coordination auto-evaluation with violations flagged [2 SKM Equipment Evaluation/Auto Coordination, 65 ETAP Star Auto-Evaluation, 81 DesignBase error checking].
9. **Scenario manager with side-by-side result comparison** (before/after, seasons, operating modes) [1 ETAP Result Analyzer, 8 PowerWorld, 17 Ecodial operating modes, 51 elec calc, 64 EasyPower, 78 CYME, 99 ETAP].
10. **DC arc flash with several methods** (Maximum Power, Stokes-Oppenlander, Paukert, DGUV) that reports the most conservative result [26 ETAP DC; DC arc flash also in 3 EasyPower and 2 SKM].
11. **One cable-sizing solver that checks ampacity, voltage drop and short-circuit withstand together** and recommends the smallest cable that passes [16 CYME LV, 14 ABB DOC, 61 ETAP IEC 60364, 51 elec calc, 47 Electrical Calc Elite].
12. **Show the code table or formula next to every result** (e.g., the NEC 310.16 row used) [47 Electrical Calc Elite, 86 Ampwright].
13. **Conduit/tray fill in three modes** (check fill, find minimum size, find maximum count), with jam probability, pulling tension and sidewall pressure [19, 20 Southwire, 50 SurgePV, 57 Legrand, 69 VoltFlow].
14. **IEEE 519 compliance at a user-chosen PCC**: TDD limit looked up from Isc/IL, then before/after mitigation with a printable report [45 MTE, 62 IEEE 519 Limit Finder, 63 ETAP, 64 EasyPower, 3 EasyPower Advanced].
15. **Power factor correction with a harmonic-resonance screen** (parallel resonance warning when capacitors are added) [64 EasyPower, 63 ETAP].
16. **Transient and cyclic cable ampacity**: time-to-temperature, IEC 60853 load profiles, duct-bank placement optimiser [53 CYMCAP, 56 ETAP Cable Thermal].
17. **Generator sizing with load steps**: concurrent/non-concurrent/cyclic sequences, voltage and frequency dip limits per step, THVD criterion, failing units listed with the reason [29 Generac PDP, 30 Kohler, 27 Cummins, 28 Cat].
18. **Motor starting**: search for the worst-case start, model several starter types (DOL, soft start, VFD, autotransformer tap), plot voltage over time [99 ETAP, 2 SKM TMS, 80 WindMil, 76 Excel calculator].
19. **Grounding**: automatic two-layer soil model from Wenner readings, IEEE 80 limits with 50/70 kg body weight and surface layer, colour touch/step contour plots [40 ETAP, 37 XGSLab, 38 CDEGS, 97 ELEK, 98 GroundCalc].
20. **PV string sizing**: check string voltage against the MPPT window at site temperature extremes, check DC/AC clipping, list every valid string layout [32 Sunny Design, 35 Fronius, 34 HelioScope, 83 Aurora].
21. **BESS sizing for resilience**: hours of critical load to carry through an outage, credit for an existing generator, savings vs resilience shown side by side, degradation modelled [92 REopt Lite, 71 enSights, 36 HOMER Pro, 72 Fraunhofer].
22. **Stationary battery sizing in IEEE 485 format**: duty cycle built from loads, temperature/aging/margin factors, discharge check [96 ETAP, 2 SKM DC, 25 VIOX screen, which openly says it does not use the IEEE 485 Kt method].
23. **Reliability indices (SAIFI/SAIDI/CAIDI/ENS)**, with the one-line coloured by index and two studies compared [78 CYME, 79 Synergi, 80 WindMil, 2 SKM].
24. **EV and load-calc helpers**: NEC 220 dwelling standard method, NEC 625 125% charger rule, panel spare-capacity check, hourly EV load profiles [49 VoltageLab, 68 FSG, 67 EVI-Pro Lite, 70 Mike Holt Toolbox].
25. **Interoperability and honest scope**: import/export of PSS/E, MATPOWER, CGMES and DXF, plus clear screening-only notes and lists of what the model leaves out [9 pandapower, 11 VeraGrid, 91 ANDES, 37 XGSLab, 98 GroundCalc; disclaimers in 22, 25, 68, 94].

#### Verification notes

- **Tools verified: 100.** Each row was confirmed in this session by fetching a page that describes the tool, or (rows 27 and 30) by a fetched third-party comparison article. No tool was added from memory alone.
- **Rows that use a third-party page instead of the vendor's own:** 24 ElectroDroid (mytechdecisions), 27 Cummins GenSize and 30 Kohler QuickSize (CSE magazine comparison), 31 PVsyst (SourceForge listing, which calls PVsyst free; treat licensing as unverified), 32 Sunny Design and 83 Aurora (Heaven Green Energy reviews), 77 PSCAD (FitGap), 92 REopt Lite (Renewable Energy World), 15 ABB Slide Rules and 14 DOCWin (Voltimum), 17 Ecodial (Electrical Engineering Portal), 52 ProDesign (BSEE article, few details).
- **Some products appear as several rows.** Vendors sell these as separate modules or apps: ETAP (rows 1, 23, 26, 40, 56, 61, 63, 65, 96, 99), EasyPower (3, 22, 64, 66), Eaton/CYME (7, 16, 53, 78, plus 21 and 93 for Bussmann/Eaton), Southwire (18, 19, 20), Siemens SIMARIS (54, 55). Counting one row per product family gives fewer distinct entries, about 75.
- **Page-level caveats:** row 2's SKM IEEE 1584-2018 page says nothing about labels or multi-time-step arc flash, so neither is claimed. Row 26's ETAP DC page does not mention labels. Row 59's page gives the impedance standard as IEC 60609, which looks like a typo, so the row says only "sequence impedance". Row 81 DesignBase is being retired. Row 85 CMEQ tools still follow the 2018 Quebec code. Row 100 Hagercad's page lists no calculation features.
- **Searches or fetches that failed, so those tools are not in the table:**
  - Littelfuse arc flash calculator (littelfuse.com/arccalc): the page returned no content.
  - EFCOG Best Practice 194 DC arc flash spreadsheet: the URL was too long for the fetch proxy.
  - Maplesoft IEEE 1584-2018 arc flash application: the URL resolved to a generic landing page.
  - Reliability Coach arc flash calculator: the site showed an offline notice.
  - Eaton xSpider: the support page listed no features.
  - ZHAW BESS sizing tool: the page had metadata only.
  - DEHNsupport Toolbox: the page did not describe it (DEHNrisk was verified instead).
  - EasyPower DC arc flash article: no method details (EasyPower DC capability is cited from its DC system analysis article instead).
  - Battery Design DC arc flash article: describes a manual method, not a tool.
- **Fetches that failed but were recovered through another page:** energy.gov REopt article (client error), Kohler/Rehlko press release (redirect), Siemens Xcelerator SIMARIS page (redirect), Schneider se.com Ecodial pages (no feature text), ETAP Ground Grid Korean page (404, Spanish page used), Eaton CYMCAP page (server error, cyme.com used).
- **Topics with thin coverage:** dedicated lighting-calc web tools, transformer sizing beyond simple kVA calculators, and free reliability tools (all the reliability tools found are commercial distribution packages).


---

## A20. Method reference register


*Source file: `REPORTS/research/method_reference_register.md`*

### Fault Current Studio -- Method Reference Register

Compiled: 2026-11-07 (research session; web search + fetch).
Purpose: an auditable list of the sources each study module must be built on and validated against.

#### Ground rules for using this register

- Every row was **located in this session** at the URL given. Nothing was added from memory.
- **Verification level** (last column tag):
  - `[V]` = metadata (authors/year/DOI/edition) confirmed by fetching the URL or a bibliographic record.
  - `[L]` = located as a search-result listing only (title + URL seen, page not fetched); confirm before citing in code comments.
- "Use" column key: **METHOD** = equations/procedure to implement; **ORACLE** = numbers to unit-test against; **DATA** = parameter tables/defaults; **CONTEXT** = background/justification only.
- Most governing standards are paywalled. Publisher URLs below are catalogue pages, not the text. See the last section for what must be bought.
- Status flags matter: several "classic" Color Books are now **Inactive-Reserved** at IEEE. The calculator may still cite them, but must label them as legacy.

---

#### 1. Short circuit (IEC 60909; ANSI/IEEE C37.010 / C37.13 / IEEE 551)

##### 1.1 Governing standards

| Type | Title | Publisher | Year/Edition & status | URL | Use in calculator |
|---|---|---|---|---|---|
| Standard | IEC 60909-0 Short-circuit currents in three-phase a.c. systems -- Part 0: Calculation of currents | IEC | **Ed. 3.0, published 2026-07-23**, stability date 2029. Ed. 2.0 (2016) shows withdrawal date 2026-07-23. `[V]` | https://webstore.iec.ch/en/publication/68454 | METHOD: primary IEC engine (c-factor, K-corrections, Ik'', ip, Ib, Ik, Ith). **Action:** the developer must check the 2026 change list against 2016 before coding; the catalogue page gave no change summary. |
| Standard (superseded) | IEC 60909-0:2016 (Ed. 2.0) | IEC | 2016-01-28; page says a newer version exists. Added wind units and full-size-converter units. `[V]` | https://webstore.iec.ch/publication/24100 | METHOD (legacy mode): keep as a selectable edition for projects contracted to 2016. |
| Technical Report | IEC TR 60909-4:2021 Examples for the calculation of short-circuit currents | IEC | Ed. 2.0, 2021-06-24. LV example, MV with async motors, power-station auxiliaries, a new example for clause 6.8 of 60909-0:2016, a wind example, and a Clause 9 HV **test network with results for checking digital programs**. `[V]` | https://webstore.iec.ch/publication/66482 | **ORACLE (primary)**: encode every Clause 5-9 example as a regression test. Preview PDF: https://www.vde-verlag.de/iec-normen/preview-pdf/info_iectr60909-4{ed2.0}en.pdf `[L]` |
| Standard | IEEE C37.010-2016 Application Guide for AC High-Voltage Circuit Breakers > 1000 Vac Rated on a Symmetrical Current Basis | IEEE | 2016, **Active**. Covers system short-circuit calculation and X/R compensation curves. `[V]` | https://standards.ieee.org/ieee/C37.010/5807 | METHOD: ANSI E/X method, multiplying factors (remote/local, 5-cycle etc.) for MV breaker duty. |
| Standard | IEEE C37.13 Low-Voltage AC Power Circuit Breakers Used in Enclosures | IEEE | C37.13-2015 located (ANSI webstore); a **C37.13-2024** edition appears on reseller listings. `[L]` | https://webstore.ansi.org/standards/ieee/ieeec37132015 ; 2024 listing: https://eshop.normservis.sk/norma/ieee-c37-13-2024-20.12.2024.html | METHOD/DATA: LV PCB test X/R and duty multiplying factors. Confirm which edition before coding the derating table. |
| Recommended practice (legacy) | IEEE 551-2006 Calculating AC Short-Circuit Currents in Industrial and Commercial Power Systems (Violet Book) | IEEE | 2006; **Inactive-Reserved since 2021-03-25**. `[V]` | https://standards.ieee.org/standard/551-2006.html | METHOD (reference): detailed ANSI derivations; cite as legacy. |
| Recommended practice | IEEE 3002.3-2018 Conducting Short-Circuit Studies and Analysis of Industrial and Commercial Power Systems | IEEE | 2018 `[L]` | https://ieeexplore.ieee.org/document/8672198 | METHOD: current IEEE study-procedure document that replaces the Color Book content. |

##### 1.2 Papers / technical papers

| Type | Title | Authors | Year | URL / DOI | Use |
|---|---|---|---|---|---|
| IEEE Trans. IA | Comparison of ANSI and IEC 909 short-circuit current calculation procedures | G. Knight, H. Sieling | 1993, vol. 29 no. 3, pp. 625-630 | DOI 10.1109/28.222435 ; record https://manuscript.isc.ac/Inventory/49/920048.htm `[V]` | CONTEXT/ORACLE: shows where the two engines differ; use to explain ANSI-vs-IEC deltas in reports. |
| Preprint (arXiv) | Vectorized Calculation of Short Circuit Currents Considering Distributed Generation -- An Open Source Implementation of IEC 60909 | L. Thurner, M. Braun | arXiv 1802.01502 | https://arxiv.org/abs/1802.01502 `[V]` | METHOD: matrix (Zbus) formulation of IEC 60909 with DG; says it was validated against commercial software. |
| IEEE Trans. PWRS | pandapower -- An Open-Source Python Tool for Convenient Modeling, Analysis, and Optimization of Electric Power Systems | L. Thurner, A. Scheidler, F. Schäfer, J.-H. Menke, J. Dollichon, F. Meier, S. Meinecke, M. Braun | 2018, vol. 33, p. 6510 | DOI 10.1109/TPWRS.2018.2829021 ; preprint https://arxiv.org/abs/1709.06743 `[V]` | ORACLE: cross-check engine (pandapower implements IEC 60909-0:2016 ikss/ip/ith). |
| Book | Short Circuits in Power Systems: A Practical Guide to IEC 60909 | I. Kasikci | Wiley, 2002 | https://www.eyrolles.com/Loisirs/Livre/short-circuits-in-power-systems-9783527304820 `[V]` | ORACLE: worked IEC examples (pre-2016 edition; check c-factors). |

##### 1.3 Worked examples / benchmarks (test oracles)

| Type | Title | Source | URL | Use |
|---|---|---|---|---|
| Benchmark | IEC TR 60909-4:2021 Clause 9 test network (380/110/30/10 kV) with published results | IEC | https://webstore.iec.ch/publication/66482 | ORACLE (licensed). |
| Benchmark | IEEE PES Test Feeder "Short Circuit Test Cases" (2011) for the 13/34/37/123-node feeders; plus the "DG Protection Test Case" with a substation MVA correction | IEEE PES Distribution Test Feeder WG | https://cmte.ieee.org/pes-testfeeders/resources `[V]` | ORACLE: unbalanced fault results (free). |
| Software docs | pandapower short-circuit documentation (ikss, ip, ith; cites IEC 60909-0:2016; ip/ith only for far-from-generator faults) | pandapower | https://pandapower.readthedocs.io/en/latest/shortcircuit/currents.html `[V]` | ORACLE: open-source cross-check. |
| Tutorial notebook | pandapower short circuit with renewables (v2.7.0) | pandapower | https://nbviewer.jupyter.org/github/e2nIEE/pandapower/blob/v2.7.0/tutorials/shortcircuit_renewables.ipynb `[L]` | ORACLE for converter-fed contributions. |
| Training slides | Short Circuit Calculation: IEC 60909 (ABB technical sharing session) -- 500 MVA/20 kV + 400 kVA example (~14.1 kA / 13.6 kA at 400 V); 750 MVA/22 kV + 1600 kVA (37.168 kA single, 74.336 kA parallel) | L. Ng (ABB), June 2021, hosted on easypower.com | https://www.easypower.com/files/Short_Circuit_Currents_According_to_IEC_60909.pdf `[V]` | ORACLE (simple hand checks; not 60909-4). |

##### 1.4 Manufacturer application guides

| Title | Publisher | Year | URL | Use |
|---|---|---|---|---|
| Cahier Technique 158: Calculation of short-circuit currents | Schneider Electric | v1.0, 2005-09-01 `[V]` | https://se.com/us/en/download/document/ECT158 (alt copy: https://sti.eduscol.education.fr/sites/eduscol.education.fr.sti/files/ressources/techniques/3357/3357-ect158.pdf) | METHOD/ORACLE: IEC-style impedance method with examples. |
| Selecting Protective Devices (SPD) Electrical Protection Handbook, 2018 ed. (based on 2017 NEC); Section 4.1 Fault current calculations | Eaton Bussmann | 2018 `[V]` | https://www.eaton.com/content/dam/eaton/products/electrical-circuit-protection/fuses/technical-literature/bus-ele-br-3002-spd-2017.pdf | METHOD: point-to-point LV method (ANSI/NEC practice). |
| FC2 Available Fault Current Calculator brochure (point-to-point; no formulas in doc) | Eaton Bussmann | Oct 2024 `[V]` | https://www.eaton.com/content/dam/eaton/products/electrical-circuit-protection/fuses/fault-current-calculator/bus-ele-pp-10106-fc2-mobile-app.pdf | ORACLE: run FC2 app on identical cases for cross-check. |

**Family 1 count:** 7 standards, 4 papers/books, 5 oracles, 3 manufacturer guides.

---

#### 2. Load flow (Newton-Raphson; unbalanced / OpenDSS)

##### 2.1 Governing standards

| Type | Title | Publisher | Year/Status | URL | Use |
|---|---|---|---|---|---|
| Recommended practice | IEEE 3002.2-2018 Conducting Load-Flow Studies and Analysis of Industrial and Commercial Power Systems | IEEE | 2018 `[L]` | https://ieeexplore.ieee.org/document/8529292 | METHOD: study scope, modelling conventions, acceptance criteria. |

(There is no single "load-flow standard"; the algorithms come from the literature below.)

##### 2.2 Papers

| Type | Title | Authors | Year | URL / DOI | Use |
|---|---|---|---|---|---|
| IEEE Trans. PAS | Power Flow Solution by Newton's Method | W. F. Tinney, C. E. Hart | 1967 | DOI 10.1109/TPAS.1967.291823 ; https://manuscript.isc.ac/Inventory/49/1031173.htm `[V]` | METHOD: NR polar formulation with sparse ordering. |
| IEEE Trans. PAS | Fast Decoupled Load Flow | B. Stott, O. Alsac | 1974 | DOI 10.1109/TPAS.1974.293985 ; https://manuscript.isc.ac/Inventory/49/1052511.htm `[V]` | METHOD: FDLF fallback / initializer. |
| IEEE Trans. PWRS | Radial Distribution Test Feeders | W. H. Kersting | 1991, vol. 6 no. 3, pp. 975-985 | DOI 10.1109/59.119237 ; https://manuscript.isc.ac/Inventory/49/1175778.htm `[V]` | ORACLE: original feeder definitions & results. |
| IEEE Trans. PWRS | Analytic Considerations and Design Basis for the IEEE Distribution Test Feeders | K. P. Schneider, B. Mather, B. Pal, C. Ten, G. J. Shirek, H. Zhu, J. C. Fuller, et al. | 2018, vol. 33 no. 3, pp. 3181-3188 | DOI 10.1109/TPWRS.2017.2760011 ; https://www.pnnl.gov/publications/analytic-considerations-and-design-basis-ieee-distribution-test-feeders ; open copy https://www.osti.gov/pages/servlets/purl/1432185 `[V]` | CONTEXT/ORACLE: which feeder tests which feature (regulators, unbalance, etc.). |
| IEEE PES GM | An open source platform for collaborating on smart grid research (OpenDSS) | R. C. Dugan, T. E. McDermott | 2011 | DOI 10.1109/PES.2011.6039829 ; https://manuscript.isc.ac/Inventory/49/1637190.htm `[V]` | METHOD/ORACLE: OpenDSS reference for unbalanced multiphase solution. |
| IEEE Trans. PWRS | MATPOWER: Steady-State Operations, Planning, and Analysis Tools for Power Systems Research and Education | R. D. Zimmerman, C. E. Murillo-Sánchez, R. J. Thomas | 2011, vol. 26 no. 1, pp. 12-19 | DOI 10.1109/TPWRS.2010.2051168 ; https://manuscript.isc.ac/Inventory/49/1521510.htm `[V]` | ORACLE: balanced NR reference cases. |
| Journal (EPSR) / arXiv | PowerModelsDistribution.jl: An Open-Source Framework for Exploring Distribution Power Flow Formulations | D. M. Fobes, S. Claeys, F. Geth, C. Coffrin | 2020 | DOI 10.1016/j.epsr.2020.106664 ; https://arxiv.org/abs/2004.10081 `[V]` | ORACLE: AC power flow results validated against OpenDSS on IEEE 13/34/123 and LVTestCase. |
| IEEE Trans. PWRS | pandapower (see 1.2) | Thurner et al. | 2018 | DOI 10.1109/TPWRS.2018.2829021 | ORACLE: balanced and 3-phase power flow cross-check. |

##### 2.3 Benchmarks / oracles

| Title | Source | URL | Use |
|---|---|---|---|
| IEEE PES Distribution Test Feeders: 4-bus (expect <0.05% error), 4-wire delta, YYD, 13, 34, 37, 123-bus (with 2010/2014 corrections), 8500-node, NEV, 342-node LVNT, European LV feeder | IEEE PES DTF WG | https://cmte.ieee.org/pes-testfeeders/resources `[V]` | ORACLE (primary, free). Apply the published corrections. |
| Comprehensive Test Feeder (with WindMil/CYME solutions, 2014) | IEEE PES | https://cmte.ieee.org/pes-testfeeders/comprehensive-test-feeder `[L]` | ORACLE. |
| OpenDSS (EPRI) -- BSD licence; last update 2026-09-05 | EPRI / SourceForge | https://sourceforge.net/projects/electricdss `[V]` | ORACLE: run the same feeders in OpenDSS for every release. |
| EPRI OpenDSS CIM interoperability test report (product 1023218, 2011) | EPRI | https://restservice.epri.com/publicdownload/000000000001023218/0/Product `[V]` | DATA/CONTEXT: CIM import/export if the tool supports CIM. |

##### 2.4 Manufacturer guides
None specific to load-flow algorithms were found. That is normal: vendors publish software manuals, not method papers.

**Family 2 count:** 1 standard, 8 papers, 4 oracles, 0 manufacturer guides.

---

#### 3. Protection coordination (IEEE 242 / C37.112; IEC 60255-151)

##### 3.1 Governing standards

| Type | Title | Publisher | Year/Status | URL | Use |
|---|---|---|---|---|---|
| Standard | IEEE C37.112-2018 Standard for Inverse-Time Characteristics Equations for Overcurrent Relays | IEEE | 2018 (pub. 2019-02-05), **Active**. Includes the integral equation for varying current and reset characteristics. `[V]` | https://standards.ieee.org/ieee/C37.112/7036 | METHOD: MI/VI/EI (U1-U5 style) constants, tolerances, integral time-to-trip, reset. |
| Standard | IEC 60255-151:2009 Measuring relays and protection equipment -- Functional requirements for over/under current protection | IEC | Ed. 1.0, 2009-08-28, stability date 2028 `[V]` | https://webstore.iec.ch/publication/1166 | METHOD: IEC SI/VI/EI/LTI curve constants, accuracy classes, reset. |
| Recommended practice (legacy) | IEEE 242-2001 Protection and Coordination of Industrial and Commercial Power Systems (Buff Book) | IEEE | 2001; IEEE lists it as **Inactive-Reserved** `[L]` | https://standards.ieee.org/ieee/242/426 | METHOD (reference): coordination time intervals, device-damage curves; cite as legacy. |

##### 3.2 Papers

| Type | Title | Authors | Year | URL / DOI | Use |
|---|---|---|---|---|---|
| IEEE Trans. PWRD | IEEE standard inverse-time characteristic equations for overcurrent relays | G. Benmouyal, M. Meisinger, J. Burnworth, W. A. Elmore, K. Freirich, P. A. Kotos, P. R. Leblanc, P. J. Lerley, J. E. McConnell, J. Mizener, J. Pinto de Sá, R. Ramaswami, M. S. Sachdev, W. M. Strang, J. E. Waldron, S. Watansiriroch | 1999, vol. 14 no. 3, pp. 868-872 | DOI 10.1109/61.772326 ; https://manuscript.isc.ac/Inventory/49/1524654.htm `[V]` | METHOD: background and derivation of the C37.112 equations. |

Only one peer-reviewed paper for this family was verified this session. More (e.g. IEEE IAS coordination tutorials) should be added.

##### 3.3 Oracles
- Analytic: the C37.112 and IEC 60255-151 equations are closed-form. Unit tests = tabulated time at M = 2, 5, 10, 20 computed from the published constants (licensed text needed for the constants and tolerances).
- No free benchmark coordination case with published TCC results was located.

##### 3.4 Manufacturer guides

| Title | Publisher | URL | Use |
|---|---|---|---|
| Selective coordination application paper IA01200002E (MCCBs) | Eaton | https://www.eaton.com/content/dam/eaton/products/electrical-circuit-protection/molded-case-circuit-breakers/selective-coordination-application-paper-ia01200002e.pdf `[L]` | METHOD/DATA: breaker-breaker selectivity, instantaneous-region limits. |
| Selective coordination brochure (Bussmann Quik-Spec gear) | Eaton Bussmann | https://www.eaton.com/content/dam/eaton/products/electrical-circuit-protection/fuses/bussmann-series-quik-spec-electrical-gear/bus-ele-br-10382-selective-coordination.pdf `[L]` | DATA: fuse ratio selectivity. |
| How to read time-current curves | Eaton Bussmann | https://www.eaton.com/content/dam/eaton/products/electrical-circuit-protection/fuses/solution-center/bus-ele-tech-lib-time-current-curves-how-to-read.pdf `[L]` | CONTEXT/UI: TCC plotting conventions. |
| Circuit breakers unlatching time | Eaton Bussmann | https://www.eaton.com/content/dam/eaton/products/electrical-circuit-protection/fuses/solution-center/bus-ele-tech-lib-circuit-breakers-unlatching-time.pdf `[L]` | METHOD: why TCC overlap in the instantaneous region is not proof of selectivity. |
| SPD Handbook 2018, Section 4.2 Selective coordination (2:1 Low-Peak ratio, Sec. 3.1.5.5) | Eaton Bussmann | (URL in 1.4) `[V]` | DATA: fuse selectivity ratio tables. |
| Evaluating selective coordination between current-limiting fuses and circuit breakers (Tech Topic TT-SC1) | Mersen | https://ep-cn.mersen.com/sites/mersen_cn/files/2018-11/TT-SC1-Evaluating-Selective-Coordination-Current-Limiting-Fuses-Circuit-Breakers-Tech-Topic.pdf `[L]` | METHOD: fuse-breaker selectivity. |

**Family 3 count:** 3 standards, 1 paper, 0 free numeric oracles (analytic only), 6 manufacturer guides. **Thin on peer-reviewed papers.** SEL application guides were not located (searches returned only third-party copies).

---

#### 4. Arc flash (IEEE 1584-2018; NFPA 70E; DC methods)

##### 4.1 Governing standards

| Type | Title | Publisher | Year/Status | URL | Use |
|---|---|---|---|---|---|
| Guide | IEEE 1584-2018 Guide for Performing Arc-Flash Hazard Calculations | IEEE | Board approved 2018-09-27, published 2018-11-30, **Active**. An errata file is posted. Revision project P1584 is open (208 V-15 kV). `[V]` | https://standards.ieee.org/ieee/1584/5802 | METHOD: Iarc / E / AFB model, 5 electrode configurations (VCB, VCBB, HCB, VOA, HOA), enclosure-size correction, reduced-arc-current variation. **Apply the errata.** |
| Standard | NFPA 70E Standard for Electrical Safety in the Workplace | NFPA | **2027 edition** listed (ANSI webstore); 2024 edition also current in many jurisdictions `[V]` | https://webstore.ansi.org/standards/nfpa/nfpa70e2027 | METHOD/DATA: PPE categories, arc-flash boundary use, labelling content, Annex D DC methods. Let the user pick the edition. |

##### 4.2 Papers (AC and DC)

| Type | Title | Authors | Year | URL / DOI | Use |
|---|---|---|---|---|---|
| IEEE Trans. IA | Arc Flash Calculations for Exposures to DC Systems | D. R. Doan | 2010, vol. 46 no. 6, pp. 2299-2302 | DOI 10.1109/TIA.2010.2070480 ; https://search.isc.ac/inventory/49/1304911.htm `[V]` | METHOD: DC maximum-power method (conservative). |
| IEEE Trans. IA | DC-Arc Models and Incident-Energy Calculations | R. F. Ammerman, T. Gammon, P. K. Sen, J. P. Nelson | 2010, vol. 46 no. 5, pp. 1810-1819 | DOI 10.1109/TIA.2010.2057497 ; https://manuscript.isc.ac/Inventory/49/1533598.htm `[V]` | METHOD: iterative DC arc-resistance / incident-energy model. |
| IEEE Trans. IA | Arc Flash Calculations for a 1.3-MW Photovoltaic System | D. R. Doan, R. M. Derer | 2015 | DOI 10.1109/TIA.2014.2347236 ; https://manuscript.isc.ac/Inventory/49/27627.htm `[V]` | ORACLE/CONTEXT: PV application example. |
| IEEE Trans. IA | Arc-Flash Hazard Calculations in LV and MV DC Systems -- Part I: Short-Circuit Calculations | J. C. Das | 2014, vol. 50 no. 3 | DOI 10.1109/TIA.2013.2288416 ; https://manuscript.isc.ac/Inventory/49/1754955.htm `[V]` | METHOD: DC source fault currents feeding the DC arc model. |
| IEEE Trans. IA | Arc-Flash Hazard Calculations in LV and MV DC Systems -- Part II: Analysis | J. C. Das | 2014, vol. 50 no. 3 | DOI 10.1109/TIA.2013.2288423 ; https://manuscript.isc.ac/Inventory/49/88307.htm `[V]` | METHOD/ORACLE: comparison of DC methods. |
| IEEE ESW 2021 (NREL preprint) | Methods for Evaluating DC Arc Incident Energy in PV Systems (ESW2021-05) | W. Sekulic, A. Marroquin, P. McNutt | 2021, NREL/CP-5K00-78331 | https://docs.nrel.gov/docs/fy21osti/78331.pdf `[V]` | METHOD: prefers **Stokes & Oppenlander** arc-resistance model plus Wilkins energy-transfer equations. Says the NFPA 70E maximum-power method is too simple for PV. |
| NREL conf./journal | Evaluating the Incident Energy of Arcs in Photovoltaic DC Systems: Comparison Between Calculated and Experimental Data | NREL (author names not shown on record) | Conference NREL/PR-5K00-73213; journal version IEEE Trans. IA, 2020 (OSTI 1605708) | https://www.osti.gov/biblio/1502109 ; https://www.osti.gov/biblio/1605708 `[V]` (authors not confirmed) | ORACLE: measured vs calculated DC incident energy. |

**Stokes & Oppenlander ("Electric arcs in open air", J. Phys. D, 1991):** the primary paper was **NOT located** this session (several searches). It is cited through the NREL ESW2021 paper above. Get the primary text (IOP, paywalled) before coding the arc V-I equation.

##### 4.3 Oracles / datasets

| Title | Source | URL | Use |
|---|---|---|---|
| IEEE 1584-2018 Annex D.1 / D.2 worked examples | IEEE (licensed) | https://standards.ieee.org/ieee/1584/5802 | ORACLE (primary). |
| Arc Flash IE and Iarc Calculators (two .xlsm, v2.6.6, 2019-08-29; BSD-3; DOI 10.21227/8gch-a963). The page says it is **not part of IEEE 1584-2018**. Users report the reduced-arcing-current workbook gives higher IE and AFB than Annex D.1 for MV/HV. | IEEE SA via IEEE DataPort | https://ieee-dataport.org/open-access/arc-flash-ie-and-iarc-calculators `[V]` | ORACLE (secondary). Use the standard (non-"_M") workbook; treat the "_M" workbook as suspect. |
| `arcflash` Python library (MIT). Unit tests reproduce Annex D1/D2 exactly; 144,000 cases from the IEEE spreadsheets match within 0.1%; flags errors in the _M spreadsheet. | L. Yip (GitHub) | https://github.com/LiaungYip/arcflash `[V]` | ORACLE: reuse the test-vector approach and the generated cases (check licence fit: MIT). |
| Arc Flash Phenomena test data ("Processed Data.zip", 2.83 GB; DOI 10.21227/nmsx-qd89) | IEEE SA & NFPA via IEEE DataPort (**subscription**) | https://ieee-dataport.org/open-access/arc-flash-phenomena `[V]` | DATA: raw lab tests behind the 1584-2018 model. Use for model-error envelopes. |
| Comparison of IEEE 1584-2018 predictions with tests on real-world equipment | IEEE DataPort | https://ieee-dataport.org/open-access/comparison-ieee-1584-2018-predictions-tests-real-world-equipment `[L]` | ORACLE/CONTEXT. |

##### 4.4 Manufacturer guides

| Title | Publisher | Year | URL | Use |
|---|---|---|---|---|
| Arc flash analysis: complying with IEEE Std 1584-2018 (PA027048EN) | Eaton | July 2019 `[V]` | https://www.eaton.com/content/dam/eaton/services/eess/eess-documents/eaton-ieee-1584-2018-changes-pa027048en.pdf | CONTEXT: 1,800+ tests vs ~300; removal of the 240 V/125 kVA exclusion; enclosure dimensions. |
| IEEE 1584-2018 at a glance (MZ027023EN) | Eaton | `[L]` | https://www.eaton.com/content/dam/eaton/services/eess/eess-documents/ieee1584-2018-at-a-glance-mz027023en.pdf | CONTEXT/UI. |
| SPD Handbook 2018, Section 4.3 Arc flash | Eaton Bussmann | 2018 `[V]` | (URL in 1.4) | DATA: current-limiting fuse arc-flash behaviour. |

**Family 4 count:** 2 standards, 7 papers (+1 key primary paper not located), 5 oracles/datasets, 3 manufacturer guides.

---

#### 5. Cable ampacity (IEC 60287; IEC 60853; Neher-McGrath; NEC 310)

##### 5.1 Governing standards

| Type | Title | Publisher | Year/Status | URL | Use |
|---|---|---|---|---|---|
| Standard | IEC 60287-1-1:2023 Electric cables -- Calculation of the current rating -- Part 1-1: Current rating equations (100 % load factor) and calculation of losses -- General | IEC | Ed. 3.0, 2023-05-22, stability 2030 `[V]` | https://webstore.iec.ch/publication/68118 | METHOD: conductor AC resistance, dielectric, sheath and armour losses, steady-state rating equation. |
| Standard | IEC 60287-2-1 (thermal resistance) | IEC | Referenced by CIGRE TB 880. Edition not fetched this session. | (not fetched) | METHOD: T1-T4 thermal resistances, mutual heating. **Edition still to verify.** |
| Standard | IEC 60853-2:1989 Calculation of the cyclic and emergency current rating of cables -- Part 2 (cables >18/30(36) kV; emergency ratings all voltages) + AMD1:2008 | IEC | 1989 + Amd 1 2008 `[V]` | https://webstore.iec.ch/publication/3711 ; AMD1: https://webstore.iec.ch/publication/3710 | METHOD: cyclic factor M, emergency (transient) ratings. Part 1 (<=18/30 kV) not fetched. |
| Code | NFPA 70 National Electrical Code, 2026 edition -- Art. 310 tables; Informative Annex B (Neher-McGrath-based engineering ampacity) | NFPA | 2026 `[V]` (listing) | https://webstore.ansi.org/standards/nfpa/NFPA702026 ; https://shop.iccsafe.org/nfpa-70r-national-electrical-coder-necr-2026-edition.html | DATA: 310.16 etc. tables, adjustment/correction factors. METHOD: Annex B / 310.14(B) engineering supervision path. |
| Standard (legacy) | IEEE 835-1994 Standard Power Cable Ampacity Tables | IEEE | 1994; IEEE lists as **Inactive-Reserved** `[L]` | https://standards.ieee.org/standard/835-1994.html | ORACLE/DATA: large table set computed with Neher-McGrath. |

##### 5.2 Papers / books

| Type | Title | Authors | Year | URL / DOI | Use |
|---|---|---|---|---|---|
| AIEE Trans. PAS Part III | The calculation of the temperature rise and load capability of cable systems | J. H. Neher, M. H. McGrath | 1957, vol. 76 no. 3, pp. 752-764 | DOI 10.1109/AIEEPAS.1957.4499653 ; https://manuscript.isc.ac/Inventory/49/1157268.htm `[V]` | METHOD: N-M equations (basis of NEC Annex B and IEEE 835). |
| Book | Rating of Electric Power Cables: Ampacity Computations for Transmission, Distribution, and Industrial Applications | G. J. Anders | IEEE Press (ISBN 9780780311770) | https://bookwire.bowker.com/book/USA/Rating-of-Electric-Power-Cables-9780780311770-Anders-George-J-47265147 `[L]` | METHOD: authoritative textbook bridging IEC 60287 and N-M. |
| Book | Rating of Electric Power Cables in Unfavorable Thermal Environment | G. J. Anders | Wiley (ISBN 978-0-471-67909-7) | https://www.wiley-vch.de/de/fachgebiete/ingenieurwesen/rating-of-electric-power-cables-in-unfavorable-thermal-environment-978-0-471-67909-7 `[L]` | METHOD: trays, risers, tunnels, crossings. |
| CIGRE TB | TB 880 Power cable rating examples for calculation tool verification (WG B1.56; convenor F. de Wild). 11 case studies: 10-400 kV AC and 320 kV HVDC; XLPE/SCFF/pipe-type; land/submarine; trefoil/flat; buried/duct/trough/air; bonding variants. | CIGRE | Electra 324, Oct 2022 | https://electra.cigre.org/324-october-2022/technical-brochures/power-cable-rating-examples-for-calculation-tool-verification ; purchase: https://e-cigre.org/publication/880-power-cable-rating-examples-for-calculation-tool-verification `[V]` | **ORACLE (primary)** for the IEC 60287 engine. |

##### 5.3 Oracles

| Title | Source | URL | Use |
|---|---|---|---|
| CIGRE TB 880 Jupyter notebooks (GPL-2.0): Case 0-1 + single-point bonding + eddy-current variants; Case 0-2 trefoil in HDPE ducts; Case 0-5 unfilled trough | F. Mendoza (GitHub) | https://github.com/frdmendoza/cbl_CIGRE_TB880 `[V]` | ORACLE: step-by-step intermediate values. GPL: use for comparison only; do not copy code into a non-GPL product. |
| NEC Table 310.16 etc. | NFPA (licensed) | see 5.1 | ORACLE for the NEC-table path. |
| IEEE 835-1994 tables | IEEE (licensed) | see 5.1 | ORACLE for the N-M path. |

##### 5.4 Manufacturer guides

| Title | Publisher | Year | URL | Use |
|---|---|---|---|---|
| Engineering Data for Copper and Aluminum Conductor Electrical Cables (EHB) -- Sec. 6 ampacity tables 6-1..6-25 (duct, direct burial, air, conduit); Sec. 3 reactance; Sec. 4 short-circuit withstand tables | Okonite | 2025 ed. `[V]` | https://www.okonite.com/media/catalog/product/files/EHB_2025.pdf | DATA + ORACLE: vendor-computed ampacities; conductor/shield I²t withstand. |

**Family 5 count:** 5 standards, 4 papers/books/brochures, 3 oracles, 1 manufacturer guide.

---

#### 6. Harmonics (IEEE 519-2022)

##### 6.1 Governing standards

| Type | Title | Publisher | Year/Status | URL | Use |
|---|---|---|---|---|---|
| Standard | IEEE 519-2022 Standard for Harmonic Control in Electric Power Systems | IEEE | Board approved 2022-05-13, published 2022-08-05; **Active**; supersedes 519-2014. An active PAR for revision exists. `[V]` | https://standards.ieee.org/ieee/519/10677/ ; PAR: https://standards.ieee.org/ieee/519/11811/ `[L]` | METHOD/DATA: voltage THD limits and current TDD limits vs Isc/IL at the PCC (tables are in the licensed text; the catalogue page does not show them). |
| Recommended practice | IEEE 3002.8-2018 Conducting Harmonic Studies and Analysis of Industrial and Commercial Power Systems | IEEE | 2018 `[L]` | https://reference.globalspec.com/ref/13068621/3002-8-2018 | METHOD: frequency scan, harmonic load flow, filter design procedure. |

##### 6.2 Papers

| Type | Title | Authors | Year | URL / DOI | Use |
|---|---|---|---|---|---|
| IEEE Trans. PWRD | Test systems for harmonics modeling and simulation | R. Burch, G.-K. Chang, M. Grady, E. Gunther, M. Halpin, Y. Liu, M. Marz, T. Ortmeyer, V. Rajagopalan, S. Ranade, P. Ribeiro, T. Sim, W. Xu | 1999, vol. 14 no. 2 | DOI 10.1109/61.754106 ; https://manuscript.isc.ac/Inventory/49/1490693.htm `[V]` | ORACLE: defines 4 test systems with results. |
| IEEE Trans. PWRD | Modeling and simulation of the propagation of harmonics in electric power networks. I. Concepts, models, and simulation techniques | IEEE Task Force (authors not shown on record) | 1996, vol. 11 no. 1, pp. 452-465 | DOI 10.1109/61.484130 ; https://manuscript.isc.ac/Inventory/49/754862.htm `[V]` | METHOD: component harmonic models (lines, transformers, loads). |
| IEEE (Xplore doc 8320382) | A Benchmark Test System to Evaluate Methods of Harmonic Contribution Determination | incl. D. Mueller (EnerNex); full author list not confirmed | 2019 (per EnerNex page) | https://www.enernex.com/ieee-publications/a-benchmark-test-system-to-evaluate-methods-of-harmonic-contribution-determination/ ; https://ieeexplore.ieee.org/document/8320382 `[V]`/`[L]` | ORACLE: harmonic-responsibility benchmark. |

##### 6.3 Oracles

| Title | Source | URL | Use |
|---|---|---|---|
| IEEE Harmonics Modeling & Simulation TF downloads: Test System 1 (14-bus balanced transmission, case1.zip + **Aug 2024 corrections PDF**), TS2 (13-bus unbalanced distribution), TS3 (13-bus balanced industrial), TS4 (10-node unbalanced commercial), BM_TS_HC-3 (2019 benchmark), Example.zip (ATP/Matlab guide) | IEEE PES Harmonics WG | https://sagroups.ieee.org/harmonicswg/harmonics-modeling-and-simulation-task-force `[V]` ; corrections: https://sagroups.ieee.org/harmonicswg/wp-content/uploads/sites/445/2024/08/Corrections.pdf `[L]` | **ORACLE (primary, free).** |
| Harmonic Benchmark Test System (MATLAB File Exchange) | MathWorks community | https://au.mathworks.com/matlabcentral/fileexchange/158736-harmonic-benchmark-test-system `[L]` | ORACLE (secondary). |

##### 6.4 Manufacturer guides

| Title | Publisher | Year | URL | Use |
|---|---|---|---|---|
| Cahier Technique 152: Harmonic disturbances in networks, and their treatment | Schneider Electric | v1.0, 1999-12-01 `[V]` | https://www.se.com/us/en/download/document/ECT152/ | METHOD: resonance, filter basics. |
| Cahier Technique 199: Power quality | Schneider Electric | `[L]` | https://www.se.com/au/en/download/document/ECT199 | CONTEXT. |
| Technical Application Papers No. 8: Power factor correction and harmonic filtering in electrical plants | ABB | year not stated `[V]` | https://library.e.abb.com/public/4704e67320c08992c1257870002e4700/1SDC007107G0202.pdf | METHOD: capacitor bank + detuned filter sizing. |
| VFD harmonics solutions (BR04007002E) | Eaton | `[L]` | https://www.eaton.com/content/dam/eaton/products/industrialcontrols-drives-automation-sensors/variable-frequency-drives/vfd-harmonics-solutions-br04007002e.pdf | DATA: typical drive current spectra (6/12/18-pulse, AFE). |

**Family 6 count:** 2 standards, 3 papers, 2 oracle sets, 4 manufacturer guides.

---

#### 7. Grounding (IEEE 80-2013; IEEE 142)

##### 7.1 Governing standards

| Type | Title | Publisher | Year/Status | URL | Use |
|---|---|---|---|---|---|
| Guide | IEEE 80-2013 Guide for Safety in AC Substation Grounding (+ Cor 1-2015 merged in: Clauses 11, 17, Annexes C, H) | IEEE | Published 2015-05-15; **Inactive-Reserved since 2024-03-21**. No replacement named. `[V]` | https://standards.ieee.org/findstds/standard/80-2013.html | METHOD: tolerable touch/step (Dalziel, Cs), Rg (Sverak), Km/Ks/Ki, Sf/Df/IG, Annex B examples. Use the **corrigendum-corrected** text. |
| Revision project | P80 Guide for Safety in AC Substation Grounding (PAR approved 2025-09-10) | IEEE | Active PAR `[V]` | https://standards.ieee.org/ieee/80/12145/ | Watch item: equations may change in the next edition. |
| Guide | IEEE 81-2012 Guide for Measuring Earth Resistivity, Ground Impedance, and Earth Surface Potentials | IEEE | 2012; IEEE page title shows Inactive-Reserved `[L]` | https://standards.ieee.org/ieee/81/4889 | METHOD/DATA: Wenner/Schlumberger data reduction to 2-layer soil. |
| Recommended practice (legacy) | IEEE 142-2007 Grounding of Industrial and Commercial Power Systems (Green Book) | IEEE | 2007; **Inactive-Reserved** `[L]` | https://standards.ieee.org/findstds/standard/142-2007.html | METHOD (reference): system grounding, equipment grounding. |
| Recommended practice | IEEE 3003.1-2019 System Grounding of Industrial and Commercial Power Systems | IEEE | 2019 `[L]` | https://standards.ieee.org/ieee/3003.1/4438 | METHOD: current replacement for Green Book system-grounding content. |

##### 7.2 Papers

| Type | Title | Authors | Year | URL / DOI | Use |
|---|---|---|---|---|---|
| IEEE Power Eng. Review | Simplified equations for mesh and step voltages in an AC substation | B. Thapar, V. Gerez, A. Balakrishnan, D. A. Blank | 1991, vol. 11 no. 4 | DOI 10.1109/MPER.1991.88844 ; https://manuscript.isc.ac/Inventory/49/1414801.htm `[V]` | METHOD: basis of the IEEE 80 Km/Ks/Kh/Ki equations. |
| IEEE Trans. PAS | Optimum design of substation grounding in a two layer earth structure: Part II -- Comparison between theoretical and experimental results | F. Dawalibi, D. Mukhedkar | 1975, vol. 94 no. 2, pp. 262-266 | DOI 10.1109/T-PAS.1975.31850 ; https://manuscript.isc.ac/Inventory/49/847619.htm `[V]` | ORACLE: 2-layer soil model vs measurement. Part I (analytical) record: https://publications.polymtl.ca/62878/ `[L]` |
| Tutorial slides | IEEE Std 80 Grounding Guide overview (design steps, Dalziel limits for 50/70 kg, C-factor, Km/Ks, Sf). **No worked example.** | D. L. Garrett for R. Keil (IEEE Substations Committee WG D7), 2011-05-19 | 2011 | https://ewh.ieee.org/cmte/substations/scm0/Chicago%20Meeting/Conference%20PDFs/tutorial%20handouts/Colloquium/Grounding%20Guide%2080%20-%20Garrett.pdf `[V]` | CONTEXT: design-step checklist for the UI. Based on IEEE 80-2000. |

##### 7.3 Oracles
- IEEE 80-2013 Annex B example grid designs (licensed). This is the main oracle; no free copy is available.
- No free numerical grounding benchmark was located.

##### 7.4 Manufacturer guides

| Title | Publisher | Year | URL | Use |
|---|---|---|---|---|
| Cahier Technique 172: System earthings in LV | Schneider Electric | v1.0, 2004-12-01 `[V]` | https://www.se.com/uk/en/download/document/ECT172/ | METHOD (IEC TN/TT/IT): fault loop and touch voltage. |
| Cahier Technique 173: Earthing systems worldwide and evolutions | Schneider Electric | `[L]` | https://www.se.com/au/en/download/document/ECT173 | CONTEXT. |

**Family 7 count:** 5 standards/projects, 3 papers/tutorials, 0 free oracles, 2 manufacturer guides. **Weak on free oracles.**

---

#### 8. PV / BESS / IBR fault contribution (IEEE 2800; IEEE 1547-2018; NREL/EPRI)

##### 8.1 Governing standards

| Type | Title | Publisher | Year/Status | URL | Use |
|---|---|---|---|---|---|
| Standard | IEEE 2800-2022 Interconnection and Interoperability of Inverter-Based Resources Interconnecting with Associated Transmission Electric Power Systems | IEEE | Approved 2022-02-09, published 2022-04-22; **Active** `[V]` | https://standards.ieee.org/ieee/7003/10453/ (resolves to the IEEE 2800-2022 page) | METHOD: IBR fault-current requirements (positive- and negative-sequence injection, response time) used to build IBR short-circuit models. |
| Recommended practice | IEEE 2800.2 Test and Verification Procedures for IBRs Interconnecting with Bulk Power Systems | IEEE | WG page says the draft went to ballot in May 2025; reseller lists **IEEE 2800.2-2026 (2026-06-30)** `[L]` | https://sagroups.ieee.org/2800-2 ; https://eshop.normservis.sk/norma/ieee-2800-2-2026-30.6.2026.html | ORACLE/CONTEXT: model-verification procedures. Confirm publication. |
| Standard | IEEE 1547-2018 Interconnection and Interoperability of DER with Associated EPS Interfaces (+ Amendment 1547a-2020; revision P1547 active) | IEEE | Published 2018-04-06; **Active** `[V]` | https://standards.ieee.org/ieee/C2/5915/ (resolves to the 1547-2018 page) ; 1547a: https://standards.ieee.org/ieee/1547a/7696/ `[L]` | METHOD: ride-through and trip categories that bound how long a DER feeds a fault. |
| Standard | IEEE 1547.1-2020 Conformance Test Procedures | IEEE | 2020 `[L]` | https://sagroups.ieee.org/scc21/standards/standards-1547-1 | CONTEXT. |
| Standard | IEC 60909-0 (2016 sec. on full-size converters; 2026 ed.) | IEC | see 1.1 | see 1.1 | METHOD: converter = positive-sequence current source (k·IrG), no DC component. |

##### 8.2 Papers / technical reports

| Type | Title | Authors / Org | Year | URL | Use |
|---|---|---|---|---|---|
| NREL TP | Understanding Fault Characteristics of Inverter-Based Distributed Energy Resources (NREL/TP-550-46698). Findings: rule of thumb ~2x rated; tests 2-5x rated for 1-4.25 ms; 1 MW LVRT ~1.2x for ~7 cycles. | J. Keller, B. Kroposki | Jan 2010 | https://www.nrel.gov/docs/fy10osti/46698.pdf `[V]` | DATA: default IBR fault multipliers and durations. |
| NREL TP | A Comprehensive Study of the Impact of IBR Modeling and Control on Protection Relay Elements (NREL/TP-5D00-94430). GFL/GFM; current-limiter design and negative-sequence behaviour (IEEE 2800 compliance) drive relay outcomes. | J. Wang, P. H. Pinheiro, S. Chakraborty, B. Johnson, R. G. Bainy, A. Hoke | 2025 | https://www.osti.gov/servlets/purl/3011876 `[V]` | METHOD/CONTEXT: which IBR model features the SC engine must expose. |
| EPRI report | Short-Circuit Modeling and Protection System Performance Analysis for Systems with High Levels of IBRs (product 3002028606) | EPRI | Dec 2023 | https://restservice.epri.com/publicdownload/000000003002028606/0/Product `[V]` | METHOD: GFL/GFM short-circuit model forms for phasor tools. |
| DOE/EPRI report | Adaptive Protection and Validated Models to Enable Deployment of High Penetrations of Solar PV (PV-MOD), DE-EE0009019 | EPRI (authors not shown) | (year not stated) | https://www.osti.gov/biblio/2477678 ; DOI 10.2172/2477678 `[V]` | DATA/ORACLE: generic validated PV models. |
| DOE SETO report | Utilities Perspective on Protection Challenges with High IBR Penetration (PG&E-led team incl. Sandia, ETAP, Quanta) | project team | ~2023+ | https://www.osti.gov/servlets/purl/2458239 `[V]` | CONTEXT: 9 field fault events; modelling gaps. |
| IEEE PES TR | Protection Challenges and Practices for Interconnecting IBRs to Utility Transmission Systems (TR-81, PSRC WG C32) | IEEE PES PSRC | 2020-07-20 (paid for non-members) | https://resourcecenter.ieee-pes.org/publications/technical-reports/pes_tp_tr81_psrc_wgc32_071520 `[V]` | METHOD/CONTEXT. |
| Slides | Fault current contribution from DG -- summary of IEC 60909-0:2016 converter treatment. Notes that 60909 ignores converter dynamics. | T. I. Reigstad, SINTEF Energi | 2016 | https://www.ntnu.edu/documents/1263763591/1269572391/SINTEF+Reigstad+Fault+current+contribution+from+DG.pdf/261b6be5-95ed-4318-a5a6-3f09703653aa `[V]` | CONTEXT. |

##### 8.3 Oracles
- IEEE PES "DG Protection Test Case" (2011) -- https://cmte.ieee.org/pes-testfeeders/resources `[V]`.
- pandapower renewables short-circuit tutorial (see 1.3).
- No free, published IBR fault-current benchmark with numeric results was located. **Gap.**

##### 8.4 Manufacturer guides
- None located this session. Inverter fault data is normally in each vendor's datasheet or OEM fault-current letter; the tool needs a per-device data field.

**Family 8 count:** 5 standards, 7 reports/papers, 2 oracles, 0 manufacturer guides.

---

#### 9. DC short circuit (IEC 61660)

##### 9.1 Governing standards

| Type | Title | Publisher | Year/Status | URL | Use |
|---|---|---|---|---|---|
| Standard | IEC 61660-1:1997 Short-circuit currents in d.c. auxiliary installations in power plants and substations -- Part 1: Calculation of short-circuit currents (sources: rectifiers, stationary lead-acid batteries, smoothing capacitors, DC motors; corrigenda 1999 & 2000 included) | IEC | Ed. 1.0, 1997-06-17, stability 2028 `[V]` | https://webstore.iec.ch/publication/5700 ; COR1 https://webstore.iec.ch/publication/5702 ; COR2 https://webstore.iec.ch/publication/5701 | METHOD: standard approximation function (ip, tp, Ik, tau1, tau2) per source and superposition. **Lithium batteries and active converters are outside scope.** |
| Recommended practice | IEEE 946-2020 DC auxiliary power systems for generating stations | IEEE | 2020, Active; revision PAR active `[L]` | https://standards.ieee.org/standard/946-2020/ | METHOD/DATA: battery short-circuit estimation in the IEEE context. |

##### 9.2 Papers

| Type | Title | Authors | Year | URL / DOI | Use |
|---|---|---|---|---|---|
| IEEE Trans. IA | A General Methodology for Short-circuit Calculations in Hybrid AC/DC Microgrids | S. Favuzza, M. Mitolo, S. Moradi, R. Musca, G. Zizzo | 2023, vol. 59 no. 3, pp. 2742-2749 | DOI 10.1109/TIA.2023.3234232 ; post-print https://iris.unipa.it/retrieve/27a53cb3-12e4-45ed-91a9-27c113a971d1/POST_PRINT.pdf `[V]` | METHOD built on IEC 61660 equations. **ORACLE:** 4 case studies; underground-station microgrid 22.13 kA vs 21.77 kA in Neplan (1.6%). |
| IEEE PES GM | Estimation of short circuit currents in mesh DC networks | X. Feng, Q. Lin, Z. Wang | 2014 | DOI 10.1109/PESGM.2014.6939074 ; https://manuscript.isc.ac/Inventory/49/135010.htm `[V]` | METHOD: meshed DC networks (beyond 61660's radial focus). |
| IEEE Trans. IA | Das, Arc-flash in LV/MV DC -- Part I: Short-circuit calculations (see 4.2) | J. C. Das | 2014 | DOI 10.1109/TIA.2013.2288416 | METHOD: battery/rectifier/motor DC fault currents. |

##### 9.3 Oracles
- Favuzza et al. 2023 case studies (post-print, free).
- IEC 61660-2 / IEC TR 61660-3 (examples) were **not located** this session.

##### 9.4 Manufacturer guides

| Title | Publisher | URL | Use |
|---|---|---|---|
| Protection Devices for Direct Current Applications -- Technical Application Paper (9AKK108470A9606 rev B). Discusses IEC 61660-1 scope limits; PV string/array Isc per IEC 62548. | ABB | https://library.e.abb.com/public/5cd83dcb95a74dcdb571be5f256e1af8/9AKK108470A9606_en_B_Protection%20Devices%20for%20Direct%20Current%20Applications%20-%20Technical%20Application%20Paper.pdf `[V]` | METHOD/DATA: PV and battery DC fault estimation, breaker selection. |

**Family 9 count:** 2 standards (+2 corrigenda), 3 papers, 1 oracle, 1 manufacturer guide. **Thin.** BESS-specific (Li-ion) DC fault methods have no IEC standard; use vendor battery Isc/R data.

---

#### 10. Motor starting and voltage dip (IEEE 399 / 3002.7)

##### 10.1 Governing standards

| Type | Title | Publisher | Year/Status | URL | Use |
|---|---|---|---|---|---|
| Recommended practice | IEEE 3002.7-2018 Conducting Motor-Starting Studies and Analysis of Industrial and Commercial Power Systems | IEEE | 2018, **Active** `[L]` | https://standards.ieee.org/ieee/3002.7/4435 | METHOD: static (locked-rotor impedance), dynamic (speed-torque), transient methods; acceptance criteria. |
| Recommended practice (legacy) | IEEE 399-1997 Power Systems Analysis (Brown Book) | IEEE | **Inactive-Reserved** `[L]` | https://standards.ieee.org/ieee/399/613 | METHOD (legacy). |

##### 10.2 Papers

| Type | Title | Authors | Year | URL / DOI | Use |
|---|---|---|---|---|---|
| IEEE IAS PCIC 2026 | Comprehensive Analysis of Induction Motor Starting in Islanded Systems Using IEEE Std 3002.7-2018 Methods (12,500 hp BOG compressor, islanded LNG) | B. Darnell; M. Jagtap, A. R. Khatib, D. Sharma (SEL) | 2026 | https://selinc.com/api/download/141966/?lang=en-us `[V]` | METHOD + ORACLE: static vs dynamic vs transient comparison on one case. SEL-hosted (also counts as manufacturer paper). |
| IEEE Trans. IA | Evaluating the Effects of Motor Starting on Industrial and Commercial Power Systems | A. J. Williams Jr., M. S. Griffith | 1978 | DOI 10.1109/TIA.1978.4503541 ; https://manuscript.isc.ac/Inventory/49/1190913.htm `[V]` | METHOD: classic voltage-dip procedure. |
| IEEE Trans. IGA | Service to Induction Motors | A. W. Cain | 1971 | DOI 10.1109/TIGA.1971.4181306 ; https://manuscript.isc.ac/Inventory/49/836054.htm `[V]` | CONTEXT. |
| IEEE IAS Annual Meeting | A simple methodology for estimating the effect of voltage sags produced by induction motor starting cycles on sensitive equipment | J. C. Gomez, M. M. Morcos | 2001 | DOI 10.1109/IAS.2001.955648 ; https://manuscript.isc.ac/Inventory/49/1617401.htm `[V]` | METHOD: sag-vs-equipment-tolerance check. |

##### 10.3 Oracles
- The SEL PCIC 2026 case study (parameters in the paper).
- No free benchmark dataset was located. IEEE 3002.7 examples are licensed.
- Flicker (IEEE 1453-2022 listing: https://store.sfs.fi/fi/ieee-1453-2022 `[L]`) is relevant if repeated starts must be checked.

##### 10.4 Manufacturer guides

| Title | Publisher | URL | Use |
|---|---|---|---|
| Cahier Technique 207: Electric motors... and how to improve their control and protection (French copy located) | Schneider Electric | https://sti.eduscol.education.fr/sites/eduscol.education.fr.sti/files/ressources/techniques/690/690-ct207-moteurs-elec.pdf `[L]` | METHOD: starting methods (DOL, star-delta, soft starter) current/torque ratios. |
| Cahier Technique 211: The protection of LV motors | Schneider Electric | https://www.se.com/lt/lt/download/document/ECT211/ `[L]` | DATA. |

**Family 10 count:** 2 standards (+1 flicker reference), 4 papers, 1 oracle, 2 manufacturer guides (+SEL paper).

---

#### 11. Reliability (IEEE 493 Gold Book; IEEE 1366)

##### 11.1 Governing standards

| Type | Title | Publisher | Year/Status | URL | Use |
|---|---|---|---|---|---|
| Recommended practice | IEEE 493-2007 Design of Reliable Industrial and Commercial Power Systems (Gold Book) | IEEE | 2007; revision **P493 Active PAR (2023-11-08)** `[V]` | https://ieeexplore.ieee.org/document/4264700 `[L]` ; PAR https://standards.ieee.org/ieee/493/11449/ `[V]` | METHOD + DATA: minimal cut-set / network reduction; equipment failure-rate and repair-time tables. |
| Guide | IEEE 1366-2022 Guide for Electric Power Distribution Reliability Indices | IEEE | Published 2022-11-22; **Active**; supersedes 1366-2012 `[V]` | https://standards.ieee.org/standard/1366-2022.html | METHOD: SAIFI, SAIDI, CAIDI, MAIFI, etc.; major-event-day (2.5-beta) method. |
| Recommended practice | IEEE 3006.5-2014 Use of Probability Methods for Conducting a Reliability Analysis of Industrial and Commercial Power Systems | IEEE | 2014, **Active** `[L]` | https://standards.ieee.org/ieee/3006.5/5448 | METHOD: replacement for Gold Book probability methods. |

##### 11.2 Papers

| Type | Title | Authors | Year | URL / DOI | Use |
|---|---|---|---|---|---|
| IEEE Trans. PWRS | A reliability test system for educational purposes -- basic distribution system data and results (RBTS distribution) | R. N. Allan, R. Billinton, I. Sjarief, L. Goel, K. S. So | 1991, vol. 6 no. 2, pp. 813-820 | DOI 10.1109/59.76730 ; https://search.isc.ac/inventory/49/1514963.htm `[V]` | **ORACLE:** feeder load-point and system indices. |
| IEEE Trans. PWRS | A reliability test system for educational purposes -- basic results | R. Billinton, S. Kumar, N. Chowdhury, K. Chu, L. Goel, E. Khan, P. Kos, G. Nourbakhsh, J. Oteng-Adjei | 1990, vol. 5 no. 1, pp. 319-325 | DOI 10.1109/59.49123 ; https://manuscript.isc.ac/Inventory/49/840880.htm `[V]` | ORACLE (generation/composite). |
| IEEE Trans. PWRS | The IEEE Reliability Test System-1996 | P. Wong, P. Albrecht, R. Allan, R. Billinton, et al. (C. Grigg chaired) | 1999, vol. 14 no. 3, pp. 1010-1020 | DOI 10.1109/59.780914 ; https://manuscript.isc.ac/Inventory/49/1536410.htm ; PDF https://home.engineering.iastate.edu/jdm/ee553/IEEE-RTS1996.pdf `[L]` | DATA/ORACLE: incl. breaker reliability data table. |
| IEEE Trans. IA | Report on Reliability Survey of Industrial Plants, Part I: Reliability of Electrical Equipment | IEEE committee (authors not shown) | 1974, pp. 213-235 | DOI 10.1109/TIA.1974.349139 ; https://manuscript.isc.ac/inventory/49/790875.htm `[V]` | DATA: origin of the Gold Book failure-rate tables. |

##### 11.3 Oracles

| Title | Source | URL | Use |
|---|---|---|---|
| IEEE RTS-1979 and RTS-1996 data (15 tables incl. generator & breaker reliability) | UW Power Systems Test Case Archive | https://www2.ee.washington.edu/research/pstca/rts/pg_tcarts.htm `[V]` | ORACLE/DATA. |
| RBTS distribution results (Allan et al. 1991) | paper | above | ORACLE for the SAIFI/SAIDI engine. |

##### 11.4 Manufacturer guides
None located. Reliability data are IEEE survey-based, not vendor-based.

**Family 11 count:** 3 standards, 4 papers, 2 oracles, 0 manufacturer guides.

---

#### 12. Voltage drop and NEC load calculations

##### 12.1 Governing standards / codes

| Type | Title | Publisher | Year/Status | URL | Use |
|---|---|---|---|---|---|
| Code | NFPA 70 National Electrical Code 2026 -- Art. 220 (load calculations), 210.19/215.2 informational notes (3%/5% voltage-drop guidance), Chapter 9 Tables 8 & 9 (conductor R and effective Z), Informative Annex D (calculation examples) | NFPA | 2026 `[V]` listing | https://webstore.ansi.org/standards/nfpa/NFPA702026 | METHOD + DATA + ORACLE (Annex D examples; licensed; content not checked this session). |
| Standard | IEC 60364-5-52:2009 Selection and erection of electrical equipment -- Wiring systems (voltage-drop Annex G; consolidated version exists) | IEC | Ed. 3.0 2009; consolidated pub. 103734 `[L]` | https://webstore.iec.ch/publication/1878 ; consolidated https://webstore.iec.ch/en/publication/103734 | METHOD/DATA for IEC projects (b-factor, rho, lambda reactance). |
| Recommended practice (legacy) | IEEE 141-1993 (Red Book) -- voltage-drop approximation formula | IEEE | 1993, legacy `[L]` | https://standards.nimonik.com/products/ieee/ieee-141/ | METHOD: Vd ≈ I(R cosφ + X sinφ) and exact-form correction. |

##### 12.2 Papers / articles
Peer-reviewed literature here is minimal (these are textbook methods). Located:

| Type | Title | Author | Year | URL | Use |
|---|---|---|---|---|---|
| Trade journal (IAEI) | Voltage Drop Calculations -- K-factor method on Ch. 9 Table 8 (K = 12.9 Cu, 21.2 Al at 75 °C; ×1.732 for 3-ph). Worked examples: 3% on 240 V; 440 V/180 A/620 ft Al RHW, 500 kcmil drops 13.4 V in steel conduit (so 600 kcmil, 12.3 V) vs 11.9 V in nonmagnetic. | IAEI (excerpt of *Ferm's Formulas and Calculations*, 2014) | 2019-10-15 | https://iaeimagazine.org/electrical-fundamentals/voltage-drop-calculations/ `[V]` | ORACLE: simple numeric tests for the Table 8 and Table 9 paths. |
| Course notes | Voltage drop tables / content (PDHonline E426) | PDHonline | n/a | https://pdhonline.com/courses/e426/e426content.pdf `[L]` | ORACLE (secondary). |

##### 12.3 Oracles
- IAEI worked examples (free).
- NEC Informative Annex D examples (licensed). **Must be bought to validate Art. 220 dwelling/commercial calcs.**

##### 12.4 Manufacturer guides

| Title | Publisher | URL | Use |
|---|---|---|---|
| Okonite EHB 2025, Sec. 3 Voltage Regulation (reactance Table 3-1) | Okonite | https://www.okonite.com/media/catalog/product/files/EHB_2025.pdf `[V]` | DATA: X per conductor size/spacing for the exact voltage-drop formula. |
| Eaton Bussmann electrical plan review (NEC compliance, available fault current & SCCR) | Eaton | https://www.eaton.com/content/dam/eaton/products/electrical-circuit-protection/fuses/technical-literature/bus-ele-an-3015-electrical-plan-review.pdf `[L]` | CONTEXT: NEC 110.9/110.10 checks linked to the load-calc report. |

**Family 12 count:** 3 standards/codes, 2 articles, 1 free oracle (+Annex D licensed), 2 manufacturer guides. **Thin on authoritative free sources.**

---

#### Summary counts (located this session)

| # | Family | Standards | Papers/reports | Oracles/benchmarks | Manufacturer guides |
|---|---|---|---|---|---|
| 1 | Short circuit | 7 | 4 | 5 | 3 |
| 2 | Load flow | 1 | 8 | 4 | 0 |
| 3 | Protection coordination | 3 | 1 | 0 (analytic) | 6 |
| 4 | Arc flash (AC + DC) | 2 | 7 | 5 | 3 |
| 5 | Cable ampacity | 5 | 4 | 3 | 1 |
| 6 | Harmonics | 2 | 3 | 2 | 4 |
| 7 | Grounding | 5 | 3 | 0 free | 2 |
| 8 | PV/BESS/IBR | 5 | 7 | 2 | 0 |
| 9 | DC short circuit | 2 | 3 | 1 | 1 |
| 10 | Motor starting | 2 | 4 | 1 | 2 |
| 11 | Reliability | 3 | 4 | 2 | 0 |
| 12 | Voltage drop / NEC | 3 | 2 | 1 | 2 |

---

#### Gaps and what needs licensed access

##### A. Standard texts that must be bought (needed for equations, constants and official examples)
1. **IEC 60909-0:2026 (Ed. 3.0)** and **IEC TR 60909-4:2021**. The 2016 edition was withdrawn on 2026-07-23. The engine must target 2026, keep 2016 as a legacy option, and get the 2026 change list from the full text.
2. **IEEE C37.010-2016**, **IEEE C37.13 (2015 vs 2024 edition to confirm)**, **IEEE 3002.3-2018**. IEEE 551-2006 is Inactive-Reserved (optional, legacy).
3. **IEEE C37.112-2018** and **IEC 60255-151:2009** (curve constants and tolerances).
4. **IEEE 1584-2018 + errata** (Annex D examples are the primary arc-flash oracle). **NFPA 70E-2027** (and 2024 for legacy jurisdictions).
5. **IEC 60287-1-1:2023, IEC 60287-2-1 (edition to verify), IEC 60853-1/-2**. **CIGRE TB 880** (e-cigre, paid). **NFPA 70-2026**. IEEE 835-1994 (legacy tables).
6. **IEEE 519-2022** (limit tables), **IEEE 3002.8-2018**.
7. **IEEE 80-2013 (with Cor 1-2015)**: Inactive-Reserved since 2024, with P80 revision under way (PAR 2025). Re-check before release. **IEEE 81-2012**, **IEEE 3003.1-2019**.
8. **IEEE 2800-2022**, **IEEE 2800.2 (publication to confirm)**, **IEEE 1547-2018/1547a-2020**, **IEEE PES TR-81** (paid for non-members).
9. **IEC 61660-1:1997 + COR1/COR2**. IEC 61660-2 and IEC TR 61660-3 were not located. IEEE 946-2020.
10. **IEEE 3002.7-2018**, IEEE 1453-2022 (flicker).
11. **IEEE 493-2007** (failure-rate tables; P493 revision active), **IEEE 1366-2022**, **IEEE 3006.5-2014**.
12. **IEC 60364-5-52** (Annex G).

##### B. Paywalled papers (DOIs verified; full text needs IEEE Xplore / IOP access)
All IEEE Transactions papers listed above, except those with an open copy (Schneider et al. 2018 on OSTI; Favuzza et al. 2023 post-print; NREL and EPRI reports; arXiv preprints).

##### C. Sources searched for but NOT located (do not cite until found)
- **Stokes & Oppenlander (1991) "Electric arcs in open air"**, the primary J. Phys. D paper. Only seen cited through NREL ESW2021-05.
- **Paukert DC arc model**: not searched separately and not found in the NREL paper.
- SEL application guides on TOC curve equations (only third-party copies surfaced).
- A free numeric **IBR fault-current benchmark** with published results.
- A free **IEEE 80 grounding-grid benchmark** (Annex B is licensed).
- **IEC 61660-2 / TR 61660-3** example documents.
- **Li-ion BESS DC short-circuit method** from a standards body (none exists in IEC 61660-1 scope; ABB TAP confirms the scope limit).
- Siemens application guides (only third-party copies on Scribd surfaced; not cited).
- Peer-reviewed validation papers for NEC voltage-drop or Art. 220 load-calc methods (none expected; these are code methods).

##### D. Licence cautions for oracles
- IEEE DataPort arc-flash calculators: BSD-3, but the page says they are **not part of IEEE 1584-2018**, and the "_M" workbook has reported discrepancies vs Annex D.1.
- `LiaungYip/arcflash`: MIT (safe to reuse test vectors with attribution).
- `frdmendoza/cbl_CIGRE_TB880`: **GPL-2.0**. Compare results only; do not copy code into a closed product.
- OpenDSS: BSD. pandapower: open source (licence not checked this session; verify before bundling).
- IEEE Arc Flash Phenomena dataset: IEEE DataPort subscription required.

##### E. Status changes the developer must handle in the UI
- IEC 60909-0: 2016 replaced by 2026 (Ed. 3.0).
- IEEE 551-2006, 242-2001, 399-1997, 142-2007, 80-2013, 835-1994 and (per listing) 81-2012 are **Inactive-Reserved**. Label them "legacy reference" and point to the IEEE 3000-series (3002.x, 3003.1, 3006.5) where one exists.
- NFPA 70E: 2027 edition now listed. NFPA 70: 2026 edition.
- Active revision projects to watch: P1584, P80, P493, P1547, IEEE 519 PAR.


---

## A21. QA guides: V29 scripts, V30 UI audit, V31 scale


*Source file: `QA/V29_QA_SCRIPTS/README.md`*

### V29 QA scripts

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


*Source file: `QA/V30_UI_AUDIT/README.md`*

### V30 layout audit

`audit.py SITE PORT OUTDIR [only,these,views]` serves the site, opens every page (single line, results, operating, engineering studies, print report, saved studies, master database, capability atlas) and every tool dialog/panel, presses the dialog's calculate button where there is one, and runs `audit.js` in the page. Set `VPS=1440,1280,1024,768,390` for the widths (default 1440 and 390). Output: `OUTDIR/issues.json`, a screenshot per state, and a summary on stdout. Needs Python 3, Playwright and Google Chrome.

`audit.js` flags: text below WCAG AA contrast (4.5:1, 3:1 for large text); text clipped by its own box or a clipping parent; ellipsis; drop-down and placeholder text that does not fit; words squeezed onto 3+ lines in buttons, labels, headers and badges; a word wider than its box; controls or text covered by fixed elements; white/light surfaces left in the dark theme; content off the right edge; boxes that scroll sideways; one-line labels running past their background.

Other helpers: `shot.py` (full-page screenshots), `dlgshot.py` (open a dialog, run it, scroll to a target), `probe.py` (run a JS expression in the page), `collect.py` (inventory of element backgrounds/colours used to build the theme).

`results/`: final run (5 widths, 0 findings), the same detector on the V29e site for comparison, and sample screenshots before/after.


*Source file: `QA/V31_SCALE/README.md`*

### V31 plant-scale QA

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


---

## A22. QA guides: V33 bundle, V33 live check, V33 security


*Source file: `QA/V33_BUNDLE/README.md`*

### V33 — how `public-bundle-v21.js` is patched

`SITE/public-bundle-v21.js` holds 78 modules. Each one is the TypeScript CommonJS transpile of the `.mjs` file of the same name.
V33 found this by test: `rebuild.mjs` transpiles every `.mjs` and compares it with the bundle. 52 modules match byte for byte,
19 more differ only by one line break at the end, and 7 were edited by hand in earlier releases
(`public-entry`, `public-catalog-loader`, `database-reference-tables`, `ieee1584-2018`, `arcflash-study-ui`, `network-app`, `network-calculation`).

Needs: Node 22 and TypeScript 6.0.3 (`/opt/npm-tools/node_modules/typescript` here; change the path in `rebuild.mjs` if yours differs).

| Command | What it does |
|---|---|
| `node rebuild.mjs ../../SITE` | Lists how many bundled modules equal the transpile of their source, and where the others differ. |
| `node patch_bundle.mjs <old SITE> ../../SITE network-engine.mjs report-data.mjs` | Replaces the named modules inside the bundle with the transpile of the new source. It first proves that the old bundled module equals the transpile of the old source, and stops if it does not. |

After patching, `QA/V29_QA_SCRIPTS/run_bundle.mjs` must give the same numbers as `run_engine.mjs` (V33: 220 networks, 4,680 values, 0 differences).
For the hand-edited modules, patch by hand.

`node patch_segment.mjs <old source> <new source> ../../SITE/public-bundle-v21.js` patches a hand-edited module (V33 used it for
`network-app.mjs`): it transpiles the old and new source, finds the changed lines and replaces exactly those lines in the bundle.


*Source file: `QA/V33_LIVE_CHECK/README.md`*

### V33 — check of the live V32 site in a real browser (13 Nov 2026)

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

### After the V33 deploy (14 Nov 2026)

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


*Source file: `QA/V33_SECURITY/README.md`*

### V33 — security checks in a browser (part of list B2)

Needs Python 3, Playwright and Chrome. Test project: `QA/V31_SCALE/results/plant80.json`.

| Command | What it checks | Result (14 Nov 2026) |
|---|---|---|
| `python3 xss_browser.py ../../SITE 9441` | 74 free-text fields (project name, notes, every bus, cable, source and device name) are set to text that would create an `<img onerror>` or a `<script>` if it reached the page unescaped. Then: all 8 views, 12 tool dialogs, the property panel, the report page, Excel and PDF export. | 26 / 26. The text is shown as text everywhere. No script ran, no element was created, no page error. The project still calculates. |
| `python3 csv_formula.py ../../SITE 9443` | Bus names that start with `=`, `+`, `-`, `@`. Equipment-table CSV and Excel report. | Pass. CSV cells are written with a leading `'`. The Excel report has 0 formula cells. |

Not checked: text inside imported IDs, the database pages with a modified database file, and cloud-vault file names.
A line-by-line read of every `innerHTML` use (static audit) was not done.


---

## A23. QA guides: V33 sources, V33 verify


*Source file: `QA/V33_SOURCES/README.md`*

### V33 — plants with many inverter sources

Earlier plant-scale tests used a plant with 1,970 buses but only 71 sources. A string-inverter plant made by **Build plant**
(7 feeders × 10 blocks × 24 inverters) has 1,900 buses and **1,681 sources**. V32 could not calculate it: the calculation
needed 45–83 s and several GB of memory, so the page stopped it at its 30 s limit ("Calculation did not complete").
This was seen on the live site (see `QA/V33_LIVE_CHECK/`).

Needs: Node 22; for the browser script Python 3 + Playwright + Chrome.

| Command | What it checks | Result (13–14 Nov 2026) |
|---|---|---|
| `node --max-old-space-size=7000 many_sources_cmp.mjs` | V33 engine against the V32 engine (kept in `v32-reference/`) on 11 built plants: unknown, known and mixed inverter angles, LV cables, no inverter breakers, a meshed plant, fault impedance. Every bus: status, total, conventional part, inverter bound, peak, asymmetrical, X/R, Zth, source-type totals, every stored branch row, protective-device duty, and three buses recalculated in full. | 4,818,941 values, 0 differences. Worst relative difference 2.2e-10 (tolerance 1e-9; currents below 1e-9 of the bus fault current count as zero). |
| `python3 browser_many_sources.py ../../SITE 9401` | Browser: Build plant 7 × 10 × 24 with a blank inverter angle, calculation, another fault bus, report page, Excel, Arc flash at every bus, PDF, page errors, requests to other hosts. | 14 / 14. Times in `results/browser_many_sources.json`. |

Measured on the 1,900-bus / 1,681-source plant (Node 22, this test machine, 2 cores):

| | V32 | V33 |
|---|---|---|
| Calculation, inverter angle blank | 83 s, 6.2 GB | 4.5 s, 0.44 GB |
| Calculation, inverter angle entered | 45 s, result too large to pass to the page | 3.6 s, 0.35 GB |
| Browser: Build plant to result | failed (30 s limit) | 8.8 s (owner's computer, live site: about 25 s) |
| Browser: choose another fault bus | — | 4.9 s |
| Browser: open the report page | — | 8.1 s |
| Browser: Excel report | — | 24.4 s (1.8 MB) |
| Browser: PDF report | — | No file: the page says the report would exceed 2,000 pages and names the largest sections (21 s). |
| Browser: Arc flash at every bus, Run | — | 9.5 s (1,900 rows) |

What changed in `network-engine.mjs` (plant-scale solver only):
1. When buses × sources is above 200,000, the buses that are not selected keep their totals but not one row per source
   (`detailScope: "totals"`, `sourceCount`). The totals are summed over every source exactly as before. The selected bus is
   still calculated in full, and any other bus is calculated in full when it is chosen.
2. In a radial part of the network, the protective devices between the sources and the fault are found by one walk from the
   fault bus instead of one path per source. The result is the same list.
3. Inverters with an unknown angle whose solved columns are equal (for example the 24 inverters of one block) are summed once
   per group. A source joins a group only if its columns equal the group's first member within 1e-12 of the column size; the
   few places where they differ are summed one by one.
4. Branches that carry no part of the fault path (fault-path current below 1e-14 of the largest branch current) reuse one stored
   sum of the unknown-angle sources instead of summing them again for every fault location.

`node watchdog_test.mjs` checks the time limit of `network-calculation.mjs`: 30 s for normal projects, 30 s + 0.03 ms per bus × source
above 200,000 (about 2 minutes for 1,900 × 1,681), never more than 3 minutes. Result: 6 / 6.


*Source file: `QA/V33_VERIFY/README.md`*

### V33 — check of the V32 feature list in a browser (lists A1 and A2 of the V33 prompt)

Runs on a local copy of `SITE/` at desktop 1440 × 900 and phone 390 × 844. Needs Python 3, Playwright and Chrome.

    python3 a1_verify.py ../../SITE 9310                     # everything (about 25 minutes)
    python3 a1_verify.py ../../SITE 9310 --only a,h --vp mobile   # some items, one screen size

Items: a report chooser + PDF + Excel + print · b SLG/LL/DLG and split-phase at 2,000 buses · c operating studies (sparse load flow,
fill-zero, closed switch) · d Arc flash at every bus · e engineering-studies arc-flash card · f equipment table · g Build plant
(AC, DC array, attach) · h auto-arrange · perf undo/redo/add on the 1,970-bus plant. Every item also records page and console errors.

Result on the final V33 files, 14 Nov 2026 (`results/a1_verify.json`): **124 passed, 2 failed, 2 not tested**.
Both failures are one event: at phone width, on the 1,970-bus plant, the report page with "All fault locations" chosen ran the browser tab out of memory
during or after the Excel download (test machine: 7 GB, 2 cores). It happened in 3 of 4 repeats on V33 and in 2 of 2 repeats on the untouched V32 files, so it is not new in V33.
An earlier full run on V33 (before the last engine speed-up) passed all 126.
Not tested: "typed clearing times give incident energy" in Arc flash at every bus on the 1,970-bus plant (both screen sizes) —
the test plant has no bus inside the IEEE 1584 range with typed clearing times.

Notes:
- Run it alone on a machine with more than 7 GB if you can.
- "Arc flash dialog opens 8 s" is the script's own 8 s wait before a fallback click, not the dialog's opening time.
- The layout audit at five widths (list B3) was not run in this round.


---

## A24. Original record files (as they were before this merge)


*Sections 1–12 above already contain all of this, updated. Kept here only so nothing is lost word for word.*


*Source file: `REMAINING_WORK.md`*

### REMAINING WORK — Fault Current Studio

Updated after **Batch 3** (15 Nov 2026). Read this file first in every new session, then `DECISIONS.md`, `REQUIREMENTS.md`, `ISSUES.md`.
Governing documents: Master Prompt V5.0 and `Fault_Current_Studio_prompt.md` (both in `classroomsolar/engineering-master-database`).

#### How every batch is delivered (D-10)
1. Work one batch. Small, reversible changes. Nothing deleted; out-of-scope items are hidden.
2. Run the regression suite (list at the end) plus the batch's own tests.
3. Update `REQUIREMENTS.md`, `ISSUES.md`, `PROGRESS.md`, `CHANGELOG.md` and this file.
4. Deliver one ZIP (full `Electrical-Studies` folder, no `.git`) named `Fault_Current_Studio_Batch_NN_YYYY-MM-DD.zip`.
5. Live deploy only for code that passed tests, with checksum read-back. Database v13: owner approved on 15 Nov (D-08), upload is blocked (see below).

#### Do this first (before Batch 4) — new database on the live website
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

#### Other owner actions
- Upload this ZIP to GitHub (`classroomsolar/Electrical-Studies`). GitHub stays the home (D-01); the AI does not push.

#### Batch plan
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

#### Open issues and where they get fixed (from ISSUES.md)
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

#### Regression suite (run after every batch)
`QA/V29_QA_SCRIPTS`: `run_engine.mjs` + `compare.py` (numpy oracle), `seq_test.py`, `dc_test.py`, `physics.mjs`, `env_test.mjs` · `QA/V31_SCALE`: `cmp.mjs`, `dc_cmp.mjs`, `builder_test.mjs`, `compact_test.mjs` · `QA/V32_LOADFLOW/*` · `QA/V32_REPORT` (2 suites) · `QA/V32_ARCFLASH/oneline_equivalence.mjs` · `QA/V33_SOURCES/many_sources_cmp.mjs`, `watchdog_test.mjs` · `QA/V33_AUDIT/*` · `QA/V33_OPERATING_TABLE`, `QA/V33_EQUIPMENT_TABLE`, `QA/V33_INVERTER_DATA` · `QA/B03_FAULT_AUDIT/pandapower_crosscheck.py` (needs `pip install pandapower`) · browser: `QA/B03_FAULT_AUDIT/db_picker_browser.py`, `QA/B02_HOUSEKEEPING/b02_browser.py`, `QA/V33_VERIFY/a1_verify.py`, `QA/V33_SECURITY/*`, `QA/V33_UX/ux_widths.py`.

#### Requirement status summary (from REQUIREMENTS.md)
- SOFTWARE TESTED (independent or published checks exist): R326–R329, R332, R343, R344, R346, R347.
- PARTIALLY IMPLEMENTED: R330, R331, R333–R337, R340–R342, R348, R350, R355, R357.
- IMPLEMENTED — NOT VERIFIED: R345, R349, R351, R352.
- NOT IMPLEMENTED: R338, R339, R353, R354, R356.
- ENGINEERING VALIDATED: none yet.


*Source file: `DECISIONS.md`*

### DECISIONS — Fault Current Studio

| ID | Date | Decision | Reason / note |
|---|---|---|---|
| D-01 | 2026-11-15 | GitHub is the home of the code. Until access is set up, the AI delivers one ZIP per batch and the owner uploads it. | Owner. Replaces the older "no GitHub" rule. |
| D-02 | 2026-11-15 | Code edition: NEC 2023 and the standards it references. | Owner (Master Prompt Appendix F item 1). |
| D-03 | 2026-11-15 | MV upper limit stays at the 35 kV class for the studies. The database is **not** filtered by voltage (owner, 15 Nov: "database me 35 kV ki limitation mat laga"). | Owner (Appendix F item 6). |
| D-04 | 2026-11-15 | Generator and BESS stay as equipment and sources in the network model and in all studies (fault, load flow, protection, arc flash, duty). Generator sizing and BESS sizing, charging, discharging and dispatch studies are out of scope and are hidden, not deleted. | Owner: they affect whole-system results. **Conflict:** Master Prompt V5.0 Section 16 excludes generators as sources. The owner's current instruction has precedence (Master Prompt "Precedence" rule 1). Do not remove generator or BESS code. |
| D-05 | 2026-11-15 | Phone layout and edit speed on very large one-lines (about 2,000 buses) are low priority. | Owner: phone users can zoom; large one-lines are not the normal case. |
| D-06 | 2026-11-15 | No paid tools or licences. Independent checks use free tools (pandapower, OpenDSS, Python). | Owner: the calculator is free. |
| D-07 | 2026-11-15 | Take from the master database only the tables this calculator needs (see DATABASE_MAP.md). Motors stay. | Owner. |
| D-08 | 2026-11-14 | Database v13 goes live only after the owner approves. | Owner (repeated). |
| D-09 | 2026-11-15 | Font: Sitka, referenced by name only (Windows system font, not bundled). AI chose Sitka Heading for headings and Sitka Text for body text, with Georgia / serif fallback. | Owner: "koi sa bhi". Sitka Text reads better at small sizes. |
| D-10 | 2026-11-15 | Work goes in batches. After every batch: one ZIP with all files and `REMAINING_WORK.md` stating what is left and how to do it. | Owner (limited data). |


*Source file: `ISSUES.md`*

### ISSUES — Fault Current Studio

Severity: Critical / High / Medium / Low. Status: OPEN / FIXED / ACCEPTED.

| ID | Severity | Area | Issue | Evidence | Next step | Status |
|---|---|---|---|---|---|---|
| I-01 | Medium | Test cases | 21 of 25 `parallel_tap` oracle cases were refused ("bus voltages must match their assigned transformer winding voltages"). Cause: `gen.py` put the tap into the nameplate voltage; the engine rule (nameplate = bus voltage, tap in `tapPercent`) is right. | `REPORTS/B03_FAULT_AUDIT.md` F-05 | Batch 3: `gen.py` writes `tapPercent`; oracle 936 / 0, nothing refused | FIXED |
| I-02 | High | Privacy | The public database repo contained a private personal project. | Repo listing | Owner removed it on GitHub (15 Nov); the AI deleted its local copy | FIXED |
| I-03 | Medium | Accessibility | One-line SVG symbols: accessible name does not contain visible text (WCAG 2.5.3); focusable groups nested (4.1.2). | `QA/V33_UX/results/ux_widths.json` | Fix in audit-fix batch | OPEN |
| I-04 | Medium | Accessibility | Cloud Vault `#fcs-original-backup` file input has no label. | same | Label added (Batch 2); axe `label` finding gone at all 5 widths | FIXED (live) |
| I-05 | Low | Robustness | `localStorage.setItem` without try/catch in several modules. | `REPORTS/V33_Audit_Report.md` | Batch 2: the two places where a full storage could hide a result or a new Cloud Vault recovery code are guarded; the others are inside try/catch blocks that show the error | FIXED (live) |
| I-06 | Medium | Function | "Open this study in browser" depends on the old private cloud. | V33 backlog D3 | Make it work or hide with a message | OPEN |
| I-07 | Medium | Scope | BESS dispatch and BESS size/cost sensitivity visible (D-04). | `operations-v27*.mjs` | Hidden in Batch 2 (tabs hidden, saved / imported BESS scenarios refused with a scope note; code kept); `QA/B02_HOUSEKEEPING/b02_browser.py` 14/14; live checked | FIXED (live) |
| I-08 | Medium | Scope | R357 export limit exists only inside the BESS dispatch study that will be hidden. | `operations-v27.mjs` | Build a stand-alone export check (R357) | OPEN |
| I-09 | Low | Data | `pv_modules` (and 12 other sheets + `cable-picker`) stored twice. 47 unneeded tables. | DATABASE_MAP.md | Batch 2: 46 tables removed. Batch 3: the 14 picker copies removed (the picker reads `master-*`); `QA/B03_FAULT_AUDIT/db_picker_browser.py` 6/6 (package only, D-08) | FIXED (package) |
| I-10 | Low | UI (D-05) | Phone emulation, Operating studies, 1,970 buses: mouse click on fill-zero button times out with `operating-table-ui-v33.mjs`; tap works. | `QA/V33_VERIFY` | Owner (15 Nov): phone users zoom; phone layout not needed. Tap works | ACCEPTED |
| I-11 | Low | Speed (D-05) | Add equipment about 5 s and Z-tolerance envelope about 6 s on 1,970-bus one-line. | `QA/V33_PERF` | Owner (15 Nov): slow only matters on very big one-lines; small systems are fast. Revisit in Batch 13 if a real project is slow | ACCEPTED (watch) |
| I-12 | Medium | Traceability | Results do not carry input hash, engine version or database revision; no STALE tracking. | Code search | Platform batch | OPEN |
| I-13 | Low | Housekeeping | Old font files and other unused files on the live site. | Live file list | Owner said delete everything unused: 16 files deleted from live (fonts, `legacy-app.mjs`, old CSS, notice text); all views checked, no HTTP error | FIXED (live) |
| I-15 | Medium | Engineering (R334) | Non-meshed networks with several sources: IEC 60909-0 §4.3.1.1 sums partial peaks per branch; the engine uses one κ from the total X/R (meshed networks now use method C). | `REPORTS/B03_FAULT_AUDIT.md` F-04 | Batch 10 | OPEN |
| I-16 | Info | Engineering (R334) | Several sources on one bus: pandapower peak up to 4.2 % above the engine because pandapower merges them into one grid; the engine keeps them separate (follows the drawing). | F-03 | None | ACCEPTED |
| I-14 | Low | UI | Sitka is a Windows font. On Mac / Linux / Android the page falls back to Georgia / serif. | Browser check | Accept (D-09) or choose a cross-platform stack | ACCEPTED |


*Source file: `REQUIREMENTS.md`*

### REQUIREMENTS — Fault Current Studio (Master Prompt V5.0, Group 14)

Batch 1 (Phase 0, read-only), 15 Nov 2026. Evidence = files in `SITE/` and tests in `QA/` that were inspected or **run on 15 Nov 2026** (marked ▶). Older test counts that were not rerun are marked "historical".

Status uses Master Prompt Section 57: NOT IMPLEMENTED · PARTIALLY IMPLEMENTED · IMPLEMENTED — NOT VERIFIED · SOFTWARE TESTED · ENGINEERING VALIDATED · DEPLOYED. "DEPLOYED" here means the code is on the live Wix site; it says nothing about validation. No requirement is ENGINEERING VALIDATED yet: published-case checks exist for some (noted), but the engineering review of Section 72 has not been done.

P1–P5 applicability (proposed, owner to confirm): R = REQUIRED, C = CONDITIONAL (condition given), NA = NOT APPLICABLE.

#### Tests run on 15 Nov 2026 (▶)
| Test | Kind | Result |
|---|---|---|
| `QA/V29_QA_SCRIPTS/oracle.py` + `compare.py` (numpy nodal-admittance oracle written separately from the JS engine) | Independent | 873 bus comparisons of total current, X/R and 798 peak values, 0 mismatches at 1e-6. 21 of 220 cases rejected by the engine input check (see ISSUES I-01) |
| `QA/V29_QA_SCRIPTS/seq_test.py` (phase-domain oracle, not symmetrical components) | Independent | 400 cases, 1,200 phase comparisons, 0 mismatches |
| `QA/V29_QA_SCRIPTS/dc_test.py` | Independent | 525 DC bus comparisons, 0 mismatches |
| `QA/V29_QA_SCRIPTS/physics.mjs` | Analytic | 14 / 14 |
| `QA/V29_QA_SCRIPTS/env_test.mjs` (transformer %Z envelope, V28 reference values) | Regression | 19 / 19 |
| `QA/V31_SCALE/cmp.mjs` (sparse vs dense, 637 cases) | Same-engine comparison | 0 bad, worst 1.3e-12 |
| `QA/V33_SOURCES/many_sources_cmp.mjs` | V33 vs V32 engine | 4,818,941 values, 0 differences |
| `QA/V32_LOADFLOW/*` (sparse vs dense 400, switch merge, plant) | Same-engine comparison | All pass |
| `QA/V33_AUDIT/ieee1584_published.mjs` | Published (Eaton ESW2020-45, IEEE 1584 Annex D) | 21 / 21 |
| `QA/V33_AUDIT/iec60909_published.mjs` | Published (Schneider EIG G71, EasyPower slides, IEC 60909-0 eq. 55) | 28 / 28 |
| `QA/V33_AUDIT/tables_published.mjs` | Published tables (IEEE 519-2014, NEC 2023) | 46 / 46 |
| `QA/V32_ARCFLASH/oneline_equivalence.mjs`, `QA/V32_REPORT/*` (2 suites), `QA/V31_SCALE/builder_test.mjs`, `compact_test.mjs`, `dc_cmp.mjs` | Software | All pass |
| `QA/V33_VERIFY/a1_verify.py` (browser, desktop + phone) | Software | 122 pass, 3 fail, 2 not tested |
| `QA/V33_SECURITY/*` | Software | Pass |

#### Group 14 requirements
| ID | Requirement | Code (file → function) | Tests / evidence | Status | P1 P2 P3 P4 P5 | Gap |
|---|---|---|---|---|---|---|
| R326 | Three-phase short circuit | `network-engine.mjs` → `calculateProject`, `calculateBus`, `sparseFactor`; `multi-source-fault-network.mjs`, `multi-voltage-fault-network.mjs` | ▶ numpy oracle 936/0; ▶ physics 14/14; ▶ published radial cases 28/28; ▶ pandapower IEC 60909 231 buses, worst 1.0·10⁻⁷ (Batch 3) | SOFTWARE TESTED, DEPLOYED | R R R R R | IEC TR 60909-4 example data not available free; pandapower used |
| R327 | SLG fault | `connected-sequences.mjs` → `calculateConnectedProject`; `multibus-sequence-fault-network.mjs`; `sequence-fault-screen.mjs` | ▶ phase-domain oracle 1,200/0 (reduced networks); browser 2,000-bus SLG pass (historical V32) | SOFTWARE TESTED, DEPLOYED | R R R R R | No published example; zero-sequence path rules (Section 35) to audit |
| R328 | LL fault | same as R327 | ▶ phase-domain oracle | SOFTWARE TESTED, DEPLOYED | R R R R R | As R327 |
| R329 | LLG (DLG) fault | `dlg-fault.mjs` → `calculateDlg`; `connected-sequences.mjs` | ▶ phase-domain oracle | SOFTWARE TESTED, DEPLOYED | R R R R R | As R327 |
| R330 | Maximum-fault scenario | `iec60909-transformer-scenarios.mjs` → `transformerNameplateFaultEnvelope` (c-factors, KT, radial only); `fault-envelope-v29.mjs` → `transformerToleranceEnvelope` (±7.5 % %Z); `fault-scenario-envelope.mjs` (user-defined cases); `fault-bus-sweep.mjs` | ▶ env_test 19/19 (±7.5 % %Z envelope); ▶ kappa / radial published checks | PARTIALLY IMPLEMENTED, DEPLOYED | R R R R R | No network-wide IEC 60909 maximum (cmax on every bus, KT on every transformer) |
| R331 | Minimum-fault scenario | as R330 (cmin in radial envelope; user scenarios) | Historical | PARTIALLY IMPLEMENTED, DEPLOYED | R R R R R | No network-wide minimum (cmin, minimum source, conductor temperature) |
| R332 | Utility-source contribution | `network-engine.mjs` source contributions (`kind:'utility'`) | ▶ oracle (per-source totals) | SOFTWARE TESTED, DEPLOYED | R R R R R | Source data rules (Section 35: never invent utility data) to audit in UI |
| R333 | Inverter-source contribution | `network-engine.mjs` (`model:'current'`, grouped unknown-angle sources → SCREENING BOUND); `plant-builder.mjs` equipment table `fault_A`, `angle_deg` | ▶ `QA/V33_INVERTER_DATA` 6/6; ▶ many-sources 4.8 M values | PARTIALLY IMPLEMENTED, DEPLOYED | R R R R R | Time-dependent response (duration, decay), datasheet record fields |
| R334 | Equipment short-circuit duty | `network-engine.mjs` → `deviceDuty`; `iec60909-peak-network.mjs` → `peakMakingNetworkScreen` (κ method C); `asymmetrical-waveform-duty.mjs`; `time-varying-current-duty.mjs`; `fault-envelope-v29.mjs` → `nec11024Label` | ▶ κ published 28/28 (part); ▶ IEC 60909-0 method C κ for meshed networks (Batch 3): oracle 861 peaks / 0, pandapower 213 buses within 5·10⁻⁷ | PARTIALLY IMPLEMENTED, DEPLOYED | R R R R R | Non-meshed multi-source partial peaks (I-15); ANSI C37 momentary / interrupting multiplying factors; IEC Ib and Ith |
| R335 | TCC plotting and coordination | `clearing-time-v29.mjs` (IEC 60255-151, IEEE C37.112, manufacturer points, LSI); `manufacturer-tcc.mjs`; `protection-study.mjs` (two devices); `protection-full-range.mjs`; `tcc-library-v29.mjs`; `protection-workspace.mjs` → `nominalTccSvg` | Historical 1,799 OCPD checks (not rerun) | PARTIALLY IMPLEMENTED, DEPLOYED | R R R R C (P5: only where more than one device in series) | Multi-device selectivity, grading margin, coordination gap, curve clipped at available fault |
| R336 | Overcurrent protection assessment | as R335 | Historical | PARTIALLY IMPLEMENTED, DEPLOYED | R R R R R | Automatic pickup / setting checks against load and fault |
| R337 | Ground-fault protection assessment | SLG results only (R327); no 50G/51G device check found | — | PARTIALLY IMPLEMENTED | R R R R C (P5: GFP where code requires) | 50G/51G/51N pickup, sensitivity at minimum SLG |
| R338 | Directional protection | none found | — | NOT IMPLEMENTED | R R C C NA | Whole function (67/67N) |
| R339 | Differential protection | none found | — | NOT IMPLEMENTED | R R C C NA | Whole function (87T/87B) |
| R340 | Transformer protection coordination | devices + curves (R335); no transformer damage or inrush curve found | — | PARTIALLY IMPLEMENTED | R R R R NA | Damage curve (IEEE C57.109), inrush point, primary/secondary coordination |
| R341 | Feeder protection coordination | `protection-study.mjs` → `compareProtectionPair` | Historical | PARTIALLY IMPLEMENTED | R R R R NA | Multi-device feeder chains |
| R342 | Recloser–fuse coordination | recloser devices in one-line / arc-flash picker; no coordination logic found | — | PARTIALLY IMPLEMENTED | C C C C NA (C: where a utility recloser is in the study) | Fast/slow curve vs fuse-saving / fuse-blowing check |
| R343 | Arc-flash incident energy | `ieee1584-2018.mjs` → `ieee1584Calculate`; `arcflash-network-v29.mjs` → `networkArcFlashStudy` | ▶ published 21/21; ▶ one-line equivalence; historical 105,120 IEEE cases | SOFTWARE TESTED, DEPLOYED | R R R R C (P5: where labels are required) | Section 72 engineering review |
| R344 | Arc-flash boundary | same | ▶ published 21/21 | SOFTWARE TESTED, DEPLOYED | R R R R C | As R343 |
| R345 | Arc-flash clearing time | `clearing-time-v29.mjs` → `arcFlashClearingTimes` (from device model only) | ▶ a1 browser (typed clearing times: not tested on 2,000-bus plant) | IMPLEMENTED — NOT VERIFIED, DEPLOYED | R R R R C | Independent check of curve evaluation |
| R346 | Load flow | `operating-studies.mjs` → `solveSparsePowerFlow`, `solveBalancedPowerFlow`; `contingency-power-flow.mjs` (N-1); `operations-v27.mjs` → `evaluateAcTimeSeries` | ▶ sparse vs dense 400; ▶ switch merge; historical 300-network π oracle | SOFTWARE TESTED (balanced), DEPLOYED | R R R R R | Unbalanced (per-phase, 4-wire) load flow |
| R347 | Voltage profile | from R346 results | ▶ via R346 | SOFTWARE TESTED, DEPLOYED | R R R R R | Limits per jurisdiction (ANSI C84.1) as a check |
| R348 | Reactive power | PV-bus Q limits in `operating-studies.mjs` | ▶ via R346 | PARTIALLY IMPLEMENTED, DEPLOYED | R R R R C | Q capability of inverters (P–Q curve), plant Q requirement at POI |
| R349 | Power factor | `power-quality-v29.mjs` → `pfCorrection` | — | IMPLEMENTED — NOT VERIFIED, DEPLOYED | R R R R C | Independent test |
| R350 | Harmonic assessment | `harmonic-network.mjs` → `solveHarmonicNetwork`; `power-quality-v29.mjs` → `ieee519Check`, `currentLimitRow` | ▶ IEEE 519 tables 46/46 | PARTIALLY IMPLEMENTED, DEPLOYED | R R R R C | Frequency sweep, resonance scan |
| R351 | Voltage rise | load flow; `power-quality-v29.mjs` (rise check) | — | IMPLEMENTED — NOT VERIFIED, DEPLOYED | R R R R R | Independent test |
| R352 | Voltage drop | load flow; `cable-sizing-v29.mjs` → `sizeConductor` | Historical 1,500 conductor cases | IMPLEMENTED — NOT VERIFIED, DEPLOYED | R R R R R | Rerun and independent test |
| R353 | Grid-support capability | none found | — | NOT IMPLEMENTED | R R R R R | Q(V), P(f), PF modes (IEEE 1547-2018) |
| R354 | Ride-through requirement | none found | — | NOT IMPLEMENTED | R R R R R | Voltage / frequency ride-through categories (IEEE 1547-2018) |
| R355 | Reverse-power flow | branch flow direction from load flow only | ▶ via R346 | PARTIALLY IMPLEMENTED | R R R R R | 32 relay assessment, minimum-load case |
| R356 | Loss-of-mains protection | none found | — | NOT IMPLEMENTED | R R R R R | 27/59/81O/81U, ROCOF, vector shift |
| R357 | Zero-export control and protection | export limit only inside the BESS dispatch study (`operations-v27.mjs`), which is to be hidden (D-04) | — | PARTIALLY IMPLEMENTED | C C C C C (C: zero- or limited-export interconnection) | Stand-alone export-limit and 32 protection check; must not depend on the hidden BESS study |

#### Requirements from earlier documents (D01–D17)
| ID | Requirement | Status | Evidence / gap |
|---|---|---|---|
| D01 | 2,000-bus performance, C1–C6 | PARTIALLY IMPLEMENTED | C1, C3, C4, C6 done in V33; C2 and C5 about 5–6 s (low priority, D-05) |
| D02 | Inputs workspace, SLD page, dashboard, database, studies, history, reports | PARTIALLY IMPLEMENTED | `studio-workspace.mjs`, `one-line-editor.mjs`, `project-history.mjs`, reports; no scenario manager |
| D03 | SLD editor features | IMPLEMENTED — NOT VERIFIED | `one-line-editor.mjs`; browser suites pass; accessibility findings open |
| D04 | PDF / XLSX / CSV / JSON reports match screen | SOFTWARE TESTED | ▶ `QA/V32_REPORT` parity suites; no input hash / engine version on results yet |
| D05 | All fault types, IEC 60909 and separate ANSI/IEEE | PARTIALLY IMPLEMENTED | See R326–R334; ANSI C37 duty missing |
| D06 | 65 kA vs 56 kA defect; transformer LV current base | SOFTWARE TESTED | ▶ `env_test.mjs` reproduces 3,400 / 32,725.858 / 16,706.173 A (19/19); ▶ 25 zero-impedance-link oracle cases (the 65/56 kA class) in `cases.json` pass |
| D07 | Load flow: balanced, unbalanced, PQ/PV/slack, taps, losses, N-1, time series, DC | PARTIALLY IMPLEMENTED | Unbalanced missing; DC load flow not found |
| D08 | Protection: OEM curves, CT/PT, OC, ground, directional, differential, voltage, frequency, grading, damage | PARTIALLY IMPLEMENTED | See R335–R342, R356 |
| D09 | IEEE 1584-2018, clearing time from real curves, labels, no invented PPE | SOFTWARE TESTED | See R343–R345 |
| D10 | Harmonics THD/TDD, IEEE 519 PCC, resonance, heating | PARTIALLY IMPLEMENTED | See R350; filter design excluded |
| D11 | Live verification | PARTIALLY IMPLEMENTED | Desktop live checks done in V33; phone low priority |
| D12 | Authentic-source audit | PARTIALLY IMPLEMENTED | 95 published values (V33_AUDIT); rest in Step 1 |
| D13 | Code audit, UI audit | PARTIALLY IMPLEMENTED | Automated parts only (V33_Audit_Report.md); Batch 2 rerun: 2 axe rule types left (one-line SVG) |
| D14 | Unbalanced load flow; table connection editing; inverter fault data | PARTIALLY IMPLEMENTED | Connection editing and fault data done (V33); unbalanced missing |
| D15 | Short circuit, protection, CT/PT, relay logic, arc flash | PARTIALLY IMPLEMENTED | CT/PT models not found in the engine (CT saturation, ratio) |
| D16 | PPC/EMS: export/import, ramp, Q(V), P(f) | NOT IMPLEMENTED | Same as R353 |
| D17 | Device functions 50/51/50G/51G/67/87/27/59/59N/32/46/47/49/81/86 | PARTIALLY IMPLEMENTED | 50/51 only (curves); others missing |

#### Scope items (owner decision D-04)
| Item | Where | Decision |
|---|---|---|
| Generator as source and equipment | `network-model.mjs`, `network-engine.mjs`, `connected-sequences.mjs`, `one-line-editor.mjs`, `database/generators` | Keep |
| BESS as equipment / inverter source | IBR sources, `database/master-batteries` | Keep |
| BESS dispatch (peak shaving, self-consumption, charge / discharge) | `operations-v27.mjs` → `evaluateBessDispatch`; UI `operations-v27-ui.mjs` | Hidden (Batch 2, live) |
| BESS size / cost sensitivity (includes tariffs and net cost) | `operations-v27.mjs` → `compareBessSizeCases` | Hidden (Batch 2, live) |
| Time-series AC load flow | `operations-v27.mjs` → `evaluateAcTimeSeries` | Keep (R346) |


*Source file: `DATABASE_MAP.md`*

### DATABASE_MAP — what Fault Current Studio takes from the master database

Batch 1, 15 Nov 2026. Source: `classroomsolar/engineering-master-database` → `02_Engineering_Master_Database/Engineering_Master_Database_Audited.xlsx`, library master v13, SHA-256 `dcef1fb4a8b00edbfb5e420dc4e76e6f4a8975cd0599e2f3c7902c4ee44f9f52` (checksum verified 15 Nov 2026).

The package folder `SITE/database/` holds the prepared v13 import (not live, D-08): 111 files. It took 96 of 117 sheets; only the 21 `CEC_*` sheets were left out. Owner decision D-07: take only what this calculator needs.

How the site reads them: equipment pickers are listed in `database/manifest.json` (`network-app.mjs` loads it; `public-catalog-loader.mjs` serves the gzip `.json.txt` files). `master-*` files are read by the master library browser (`master-database.mjs`, `manufacturer-library.mjs`) and a few calculators (cable sizing).

#### Keep — 65 files, 7.6 MB (gzip)

| File | Used for |
|---|---|
| `cable-picker.json.txt` | cable picker |
| `cable_impedance_defaults.json.txt` | cable R/X defaults |
| `cables.json.txt` | cable picker (records) |
| `disconnects.json.txt` | disconnect picker |
| `fuses.json.txt` | fuse picker |
| `generators.json.txt` | generator picker (D-04 keep) |
| `hv_breakers.json.txt` | MV breaker picker (filter to 35 kV class) |
| `ibr.json.txt` | inverter / BESS inverter picker |
| `lv_breakers.json.txt` | LV breaker picker |
| `manifest.json.txt` | picker index |
| `master-ampacity_ambient_factors.json.txt` | reference table: ampacity ambient factors |
| `master-ampacity_ccc_factors.json.txt` | reference table: ampacity ccc factors |
| `master-ampacity_parameters.json.txt` | reference table: ampacity parameters |
| `master-ampacity_routes.json.txt` | reference table: ampacity routes |
| `master-batteries.json.txt` | reference table: batteries (equipment ratings only, D-04) |
| `master-breaker_lugs.json.txt` | reference table: breaker lugs |
| `master-cable_fault_current_reference.json.txt` | reference table: cable fault current reference |
| `master-cable_impedance_defaults.json.txt` | reference table: cable impedance defaults |
| `master-cable_sc_k_factors.json.txt` | reference table: cable sc k factors |
| `master-cable_types.json.txt` | reference table: cable types |
| `master-cables.json.txt` | reference table: cables |
| `master-conductor_materials.json.txt` | reference table: conductor materials |
| `master-conductor_properties.json.txt` | reference table: conductor properties |
| `master-conductor_sizes.json.txt` | reference table: conductor sizes |
| `master-csd_devices.json.txt` | reference table: csd devices |
| `master-data_issues.json.txt` | reference table: data issues (provenance shown with records) |
| `master-database_table_index.json.txt` | reference table: database table index (provenance shown with records) |
| `master-disconnects.json.txt` | reference table: disconnects |
| `master-egc_size_by_ocpd.json.txt` | reference table: egc size by ocpd |
| `master-egc_size_thresholds.json.txt` | reference table: egc size thresholds |
| `master-electronic_controllers.json.txt` | reference table: electronic controllers |
| `master-fuses.json.txt` | reference table: fuses |
| `master-generators.json.txt` | reference table: generators |
| `master-harmonics.json.txt` | reference table: harmonics |
| `master-hv_breakers.json.txt` | reference table: hv breakers (kept whole — owner: no voltage limit on data) |
| `master-hv_breakers_extended.json.txt` | reference table: hv breakers extended (kept whole — owner: no voltage limit on data) |
| `master-ibr.json.txt` | reference table: ibr |
| `master-instrument_transformers.json.txt` | reference table: instrument transformers |
| `master-insulation_classes.json.txt` | reference table: insulation classes |
| `master-lv_breakers.json.txt` | reference table: lv breakers |
| `master-model_requirements.json.txt` | reference table: model requirements (provenance shown with records) |
| `master-motor_characteristics.json.txt` | reference table: motor characteristics |
| `master-motor_locked_rotor_codes.json.txt` | reference table: motor locked rotor codes |
| `master-motor_models.json.txt` | reference table: motor models |
| `master-motors_nameplate.json.txt` | reference table: motors nameplate |
| `master-nec_ampacity_2023.json.txt` | reference table: nec ampacity 2023 |
| `master-neutral_grounding_resistors.json.txt` | reference table: neutral grounding resistors |
| `master-overload_heaters.json.txt` | reference table: overload heaters |
| `master-protection_curves.json.txt` | reference table: protection curves |
| `master-pv_modules.json.txt` | reference table: pv modules |
| `master-pv_optimizers.json.txt` | reference table: pv optimizers |
| `master-reclosers.json.txt` | reference table: reclosers |
| `master-relays.json.txt` | reference table: relays |
| `master-source_register.json.txt` | reference table: source register (provenance shown with records) |
| `master-surge_arresters.json.txt` | reference table: surge arresters |
| `master-switchgear.json.txt` | reference table: switchgear |
| `master-terminations.json.txt` | reference table: terminations |
| `master-transformers.json.txt` | reference table: transformers |
| `master-transmission_conductors.json.txt` | overhead line conductors (also used for MV lines; owner: no voltage limit on data) |
| `master-trip_devices.json.txt` | reference table: trip devices |
| `motors_nameplate.json.txt` | motor picker (owner: keep) |
| `pv_modules.json.txt` | PV module picker (DC arrays) |
| `reclosers.json.txt` | recloser picker |
| `switchgear.json.txt` | switchgear picker |
| `transformers.json.txt` | transformer picker |

#### Drop — 46 files, 2.3 MB (gzip)

| File | Reason |
|---|---|
| `master-audit_readme.json.txt` | workbook notes |
| `master-battery_performance.json.txt` | BESS charge/discharge curves (study out of scope, D-04) |
| `master-box_fill.json.txt` | Vault calculator |
| `master-cable_cleat_size_map.json.txt` | Cable_Tray calculator |
| `master-cable_cleat_sizes.json.txt` | Cable_Tray calculator |
| `master-cable_cleats.json.txt` | Cable_Tray calculator |
| `master-cable_normalization.json.txt` | import helper, duplicate of cables |
| `master-cable_planning_defaults.json.txt` | planning defaults for other calculators |
| `master-cable_tray_equipment.json.txt` | Cable_Tray calculator |
| `master-cable_trays.json.txt` | Cable_Tray calculator |
| `master-calculator_key_audit.json.txt` | audit log |
| `master-change_log.json.txt` | workbook audit log |
| `master-conduit_fire_protection.json.txt` | Cable_Tray calculator |
| `master-conduits.json.txt` | Cable_Tray calculator |
| `master-enclosures.json.txt` | Vault calculator |
| `master-equipment_record_history.json.txt` | audit log |
| `master-field_audit.json.txt` | audit log |
| `master-fire_protection.json.txt` | not electrical design scope |
| `master-ground_electrodes.json.txt` | Grounding calculator |
| `master-interruption_cost.json.txt` | cost data (financial, excluded) |
| `master-legacy_nec_reference.json.txt` | older NEC reference (D-02) |
| `master-nec_ampacity_2020.json.txt` | NEC 2023 chosen (D-02) |
| `master-nec_channel_tray_fill.json.txt` | Cable_Tray calculator |
| `master-nec_tray_fill.json.txt` | Cable_Tray calculator |
| `master-numeric_benchmarks.json.txt` | workbook test values |
| `master-optimizer_review.json.txt` | audit log |
| `master-paper_audit.json.txt` | audit log |
| `master-parts_catalog.json.txt` | accessories for other calculators |
| `master-plugin_log.json.txt` | audit log |
| `master-pv_unit_review.json.txt` | audit of PV records (duplicate of pv_modules) |
| `master-railway_loads.json.txt` | not PV scope |
| `master-record_reconciliation.json.txt` | audit log |
| `master-rectifiers.json.txt` | not PV scope |
| `master-reliability.json.txt` | reliability indices (not Group 14) |
| `master-reliability_extended.json.txt` | as above |
| `master-request_audit.json.txt` | audit log |
| `master-research_guidance.json.txt` | notes |
| `master-sheet_map.json.txt` | workbook map |
| `master-tray_accessory_rules.json.txt` | Cable_Tray |
| `master-tray_barrier_cover_codes.json.txt` | Cable_Tray |
| `master-tray_egc_area_thresholds.json.txt` | Cable_Tray |
| `master-tray_egc_metal_area.json.txt` | Cable_Tray |
| `master-tray_engineering_defaults.json.txt` | Cable_Tray |
| `master-tray_expansion_rules.json.txt` | Cable_Tray |
| `master-tray_grounding_accessories.json.txt` | Cable_Tray |
| `master-tray_width_codes.json.txt` | Cable_Tray |

#### Done in Batch 2
- Drop list applied with `QA/B02_HOUSEKEEPING/db_whitelist.py` (reproducible): 65 files, 7.7 MB; 50 of 117 sheets served. No record filtering inside tables (owner, 15 Nov: no 35 kV limit on data). Package only — not live (D-08).

#### Still to fix in the import
- Batch 3 (I-09): the picker copies (`cables`, `cable_impedance_defaults`, `transformers`, `ibr`, `generators`, `hv_breakers`, `lv_breakers`, `switchgear`, `motors_nameplate`, `fuses`, `reclosers`, `disconnects`, `pv_modules`, `cable-picker`) are removed: the picker and the master library both read the `master-*` file of the same sheet. The rows in the table above marked "picker" now point to their `master-*` file. Package database: 52 entries, 4.9 MB.
- Every record keeps its source citation and the database revision (Master Prompt Section 44).
- Nothing goes live before the owner approves (D-08).


*Source file: `PROGRESS.md`*

### PROGRESS — Fault Current Studio

#### Batch 3 — Engineering audit 1: fault engines (15 Nov 2026) ✅ (live)
- Owner requests first: private data — local clone of the database repo deleted; no voltage limit on database data (filter removed, transmission conductors kept); 16 unused files deleted from the live site (old fonts, `legacy-app.mjs`, old CSS, notice text), all views checked.
- pandapower (free IEC 60909 code) on the same networks: Ik'' 231 buses / 49 cases, 0 fail, worst 1.0·10⁻⁷.
- **Defect found and fixed:** peak current in meshed multi-source networks was up to 23 % low (single X/R). IEC 60909-0 method C now used for meshed networks (dense + sparse solvers); UI and report name the method. Independent numpy oracle (own method C) 936 totals / 861 peaks, 0 mismatches.
- I-01 fixed (the test generator, not the engine, was wrong). I-09 fixed in the package (14 duplicate picker files, 3.3 MB, removed; database view 50 sheets, counts equal). I-10, I-11 accepted per owner. New I-15 (non-meshed partial peaks, Batch 10), I-16 (info).
- Regression: oracle 936/0, sequence 1,200/0, DC 525/0, physics 14/14, envelope 19/19, sparse 637/0, DC sparse, load flow (3 suites), reports (2 suites + identity: only the new "Peak factor method" row differs), arc flash 5,201/0, many sources 4.8 M / 0, DC lean 219,581 / 0, watchdog 6/6, V33 audits 95/95, operating table 40/40, equipment table 13/13, inverter 6/6, builder 15/15, compact 0 fails; bundle = source 8,860 values. Browser: Batch 2 checks 14/14, database view 6/6, XSS 26/26, CSV formula pass, axe at 5 widths (only the known I-03 items).
- Live: 10 files patched, 10 / 10 read back identical; checked in Chrome: new engine and worker load, owner's draft unchanged (2,390 characters). Database on live unchanged (D-08).
- Not done in this batch: zero-sequence path rules (→ Batch 4), ANSI C37 duty (gap list written, → Batch 10), IEC TR 60909-4 example (data not freely available).

#### Batch 2 — Housekeeping (15 Nov 2026) ✅ (live)
- BESS dispatch and BESS size/cost sensitivity hidden (D-04). Time-series AC load flow stays and is the default. Saved or imported BESS scenarios are refused with a scope message; their data and code are kept.
- Font: Sitka Text (body) and Sitka Heading (headings) by name, Georgia/serif fallback, system monospace for code (D-09). The live site no longer requests Google Fonts or any font file.
- Cloud Vault file input labelled (I-04). Full browser storage no longer hides an arc-flash result or a new Cloud Vault recovery code (I-05).
- Database import reduced to the keep list (package only, D-08): 111 → 65 files, 9.9 → 7.7 MB. (A 38 kV filter on MV breakers was tried and removed again on the owner's instruction: no voltage limit on data.) Master library shows "50 of 117 sheets".
- Bundled font files removed from the package (not referenced any more).
- Tests: full regression suite (numpy oracle 873/0, sequence 1,200/0, DC 525/0, physics 14/14, envelope 19/19, sparse 637/0, load flow, reports, arc flash, V33 audits 95/95, operating table 40/40, equipment table 13/13, inverter 6/6); browser: Batch 2 checks 14/14, XSS 26/26, operating table, equipment table, Build plant pass; axe at 5 widths: `label` finding gone, no sideways scroll.
- Live: 12 files published, 12 / 12 read back identical (bundle without the database module). Live page checked in Chrome: Sitka fonts, lab hidden parts, 16.706 kA, owner's draft unchanged.

#### Batch 1 — Phase 0 inventory (15 Nov 2026) ✅
- Read Master Prompt V5.0 (all 1,912 lines), `Fault_Current_Studio_prompt.md`, the calculator index, and the master database repository (v13 checksum verified).
- `REQUIREMENTS.md`: R326–R357 and D01–D17 mapped to files, functions and tests, with status and proposed P1–P5 applicability.
- `DATABASE_MAP.md`: 111 prepared database files classified: keep 64 (7.6 MB), drop 47 (2.3 MB), with reasons.
- `DECISIONS.md` (D-01 … D-10), `ISSUES.md` (I-01 … I-12), `REMAINING_WORK.md` (batch plan 2–14).
- Tests rerun: numpy oracle (873 comparisons, 0 mismatches; 21 cases rejected → I-01), phase-domain sequence oracle (1,200 / 0), DC oracle (525 / 0), physics 14/14, transformer envelope 19/19; plus the V33 regression suite earlier the same day.
- No site code changed; nothing deployed in this batch.

#### Before Batch 1
- V33 (14–15 Nov 2026): see `REPORTS/V33_Release_Report.md` and `REPORTS/V33_Audit_Report.md`.


*Source file: `CHANGELOG.md`*

### CHANGELOG — Fault Current Studio

#### Batch 3 — 2026-11-15 (live)
- `network-engine.mjs` (+ bundle): IEC 60909-0 method C peak factor for meshed networks (`methodCRatio`, `methodCNet`, `peakXR`); result field `peakMethod`.
- `network-app.mjs` (+ bundle): peak card and result details name the method; database loader always reads the `master-*` sheet file.
- `report-data.mjs` (+ bundle): report row "Peak factor method".
- Version strings `20261115-b3`: `index.html`, `network-worker.mjs`, `network-calculation.mjs` (+ bundle), `arcflash-network-ui-v29.mjs`, `fault-envelope-ui-v29.mjs`, `power-quality-ui-v29.mjs`.
- `SITE/database/` (package only): 14 duplicate picker files removed, manifest points at `master-*` files.
- Live only: 16 unused files deleted (Batch 3 housekeeping).
- `QA/V29_QA_SCRIPTS/oracle.py`: independent method C; `gen.py`: taps in `tapPercent` (I-01); `cases.json`, `js.json`, `bundle.json` regenerated.
- `QA/B02_HOUSEKEEPING/db_whitelist.py`: also drops picker copies.
- New: `QA/B03_FAULT_AUDIT/` (`pandapower_crosscheck.py`, `db_picker_browser.py`, results), `REPORTS/B03_FAULT_AUDIT.md`.

#### Batch 2 — 2026-11-15 (live)
- `operations-v27-ui.mjs`: BESS dispatch and size/cost modes hidden; default mode time-series AC load flow; scope note; saved/imported BESS scenarios refused.
- `fcs-theme-v30.css`, `public-style-v21.css`, `network-style.css`, `studio-v26.css`, `studio-workspace.css`, `operations-v27.css`: Sitka font stacks; Inter / JetBrains Mono `@font-face` and Google Fonts `@import` removed; system monospace.
- `cloud-vault-ui.mjs` (+ bundle): label for the backup file input; recovery-code storage guarded.
- `arcflash-network-ui-v29.mjs`: saving inputs guarded.
- `master-database.mjs` (+ bundle): shows "N of 117 sheets" when the import is reduced.
- `index.html`: version strings `20261115-b2`.
- `SITE/database/`: reduced to the keep list (package only).
- `SITE/fonts/` removed from the package; `THIRD_PARTY_NOTICES.md` updated.
- New tests: `QA/B02_HOUSEKEEPING/b02_browser.py`, `db_whitelist.py` (+ results).

#### Batch 1 — 2026-11-15
- Added records: `REQUIREMENTS.md`, `DATABASE_MAP.md`, `DECISIONS.md`, `ISSUES.md`, `PROGRESS.md`, `REMAINING_WORK.md`, `CHANGELOG.md`.
- `REPORTS/V34_REMAINING_TASKS.md` now points to `REMAINING_WORK.md`.
- `NEW_CHAT_PROMPT_V34.txt`: read `REMAINING_WORK.md` first.
- No change to `SITE/`.

#### V33 — 2026-11-14 / 15
- See `REPORTS/V33_Release_Report.md`.


*Source file: `THIRD_PARTY_NOTICES.md`*

### Third-party notices

#### arcflash-calc (IEEE 1584-2018 method)
`SITE/ieee1584-2018.mjs` is a JavaScript port of https://github.com/LiaungYip/arcflash.
Its test data (`QA/V29_QA_SCRIPTS/ieee1584/ieee_1584_spreadsheet_results.csv`) comes from the same project.

MIT License

Copyright (c) 2022 Li-aung Yip - https://www.penwatch.net

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

#### Fonts
Since Batch 2 (15 Nov 2026) the site uses the Windows system fonts Sitka Text / Sitka Heading by name only, with Georgia / serif and system monospace fallbacks. No font file is shipped in the package.


*Source file: `REPORTS/V34_REMAINING_TASKS.md`*

### Moved

The task list now lives in `REMAINING_WORK.md` at the top of the package (updated after every batch). Owner decisions are in `DECISIONS.md`.
