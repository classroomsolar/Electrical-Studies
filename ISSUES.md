# ISSUES — Fault Current Studio

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
