# Fault Current Studio: inputs, files and studies (Part 1)

Prepared 7 November 2026 from the files in the `classroomsolar/Electrical-Studies` repository. Everything below was read from those files. Earlier ChatGPT chats, PDFs and images that are not in the repository could not be seen and are not listed as if they were.

---

## A. All written inputs (instructions)

Sources: `Prompt.docx` (P), `MASTER_CONTINUATION_PROMPT.docx/.txt` (M), `REQUIREMENTS/PRIOR_MASTER_HANDOFF_2026-10-25.md` (H), `REQUIREMENTS/V28_ORIGINAL_NEW_CHAT_PROMPT.md` (V), `START_HERE.md` (S), `RELEASE_STATE.json` (R), and the requests made in this chat (C).

### A1. Project rules
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

### A2. User experience
16. Browser-based, responsive (desktop, tablet, mobile). No account or installation needed for public calculations. (M, H)
17. A central Inputs workspace and a separate Single-Line Diagram page, a results dashboard, an equipment database, a study workspace, project history, print and reports. (M, H)
18. On the SLD: add, remove and connect unlimited equipment (utility, generator, motor, PV, IBR, BESS, buses, cables, transformers, protective devices, relays, fuses, switchgear, panels, grounding). (M, H)
19. On the SLD: valid terminals, From/To, duplicate, rename, delete, multi-source meshed connections, voltage changes, phase systems, zoom/pan/fit. (M, H)
20. Keyboard: Esc cancels, Ctrl+Z undo, Ctrl+Y redo, focus-safe shortcuts; double-click opens equipment properties. (M, H)
21. No dead buttons and no silent failures. (M, H)
22. Projects: create, edit, clone, rename, delete, version, local save and autosave, reopen, recover, JSON import/export, scenario saves, consent before deletion, optional encrypted Cloud Vault, owner-authorized backup/restore. (M, H)
23. Reports in PDF, XLSX, CSV and JSON with assumptions, inputs, units, source contributions, scope, warnings, equipment duty and provenance. Downloads and print must match the screen. (M, H)

### A3. Engineering methods (agreed scope)
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

### A4. Equipment database
35. Keep the site database paths, stable equipment IDs, 93+ sheet provenance, curated vs non-curated split, ratings, units and standard editions, duplicate detection, reversible merges and source logs. (M, H)
36. Do not fabricate missing zero-sequence R/X, curves, k-factors, inverter fault data, temperature limits, interrupting ratings or SCCR. (M, H)
37. The audited master workbook is a reference, not a replacement for the live 135-path site catalogue. (M)

### A5. Testing and records
38. Re-run the 16 advanced modes on desktop and mobile with PDF/XLSX exports, plus all V27/V28 workflows. (M)
39. Investigate separately: Wix HTTP 429 and asset-loading errors, and the Chromium 11th-download timeout. (M, V)
40. Test reproducibility, regressions, file integrity, input validation, keyboard/touch, accessibility, corrupt storage, save/reopen/clone, backup/restore, encryption, network failures and performance. (M, H)
41. Keep `RELEASE_STATE`, `PROGRESS`, `ISSUES`, `DECISIONS`, `TEST_RESULTS`, `DATABASE_PROVENANCE`, `RELEASE_GATE`, architecture and references, with P0/P1/P2 priorities. (M, H)

### A6. Requests made in this chat (C)
42. Verify everything three times and correct memory.
43. List all inputs, check the list three times, and send a corrected list with nothing missing.
44. List all PDFs and images, check three times, and match them with the written inputs.
45. Keep it plain and simple. Do not leave anything out.
46. List all studies possible with this information.
47. Say whether this is the best calculator, compare it with other calculators (online and downloadable), and adopt their best features.
48. Look for many calculators, research papers, field experience, books and codes, and adopt the good parts without breaking current work.
49. Challenge the calculator with many logical input scenarios (200 iterations requested), learn from failures and fix them.

---

## B. Key fixed values in the inputs

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

### B2. Historical facts named in the inputs (from earlier branches, not re-tested here)
- Public v21: about 139.7 MB recovery archive and 6.56 MB website source; 74 bundled browser modules; 226 (228 in one variant) earlier public file paths; 10 page loads and 16 advanced UI calculations recorded.
- Batch 14 archive: 75,298,957 bytes, built on Batch 13's 527 entries; Batch 14 delta 36,074 bytes; Batch 10 archive 75,171,457 bytes.
- Batch 10 checks: 145 latest checks, 41 operating, 42 nominal protection, 10 PV Q-limit, 51 other screenings, 14 N-1, 24 deep fault-audit tests over 240 fault cases and 7,200 terminal phasors, 11/11 source-preservation checks, 43 Python thermal tests; 1,009 preview samples of non-curated records.
- Batch 11: 38 tests. Batch 12: 19 restore tests and 8 CI checks. Batch 13: 26 OEM-curve tests and 48 modules in a DOM smoke. Batch 14: 19 engine/storage/report checks and 26 HTTP tests (45 new), 12 dependency-free suites.
- V20 handoff manifest: 232 entries verified. V28 transfer: 205 QA files.

---

## C. All PDFs, images and other files in the repository

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

### Files named in the inputs but not in the repository
- `SITE/Fault_Current_Studio_V28_Complete_Website_236_FILES.zip`: not present, but all 236 extracted website files are present and were hash-checked.
- `ENGINEERING_DATA/Original_Audited_Master_Database.xlsx`: not present. The 99 workbooks in `Spreadsheets/` appear to be its sheets saved separately; this has not been proven cell by cell.
- Older archives and reports mentioned as history. None are in this repository: `Fault_Current_Studio_Public_v21_Cumulative_Recovery(3).zip`, `Fault_Current_Studio_Public_v21_Live_Website_Source(3).zip`, `Fault_Current_Studio_Public_v21_Release_Report.md`, `Fault_Current_Studio_Public_v21_Browser_Acceptance_Supplement.json`, `Fault_Current_Studio_Batch14_Standalone_Fix_2026-10-25.zip`, `Fault_Studio_Batch14_Report_2026-10-25.md`, `Fault_Current_Studio_Batch14_Only_Changes_2026-10-25.zip`, `Fault_Current_Studio_Batch13_Consolidated_2026-10-25.zip`, `Fault_Studio_Batch13_Open_Items_2026-10-25.csv`, `Fault_Current_Studio_Batch10_Consolidated_2026-10-25.zip`, `Fault_Studio_Batch10_Report_2026-10-25.md`, `Fault_Studio_Batch10_Open_Items_2026-10-25.csv`, `Fault_Current_Studio_Latest_Files_2026-10-24.zip` (original v51), `Engineering_Master_Database_v10_Audited.xlsx`, `MASTER_DEVELOPMENT_INSTRUCTION.md`, `README_BATCH10_FIRST.md`, `README_FINAL_FIRST.md`, `OPEN_ITEMS_BATCH10.csv`, `OPEN_ITEMS_BATCH13.csv`, and the earlier package names `README_START_HERE.md`, `Release_Report.md`, `V28_Complete_Website_236_FILES.zip`.
- Also not in the repository: the private v51 site source, private cloud studies and the six Cable Thermal Studio reference workbooks.
- Present in the repository: `MASTER_CONTINUATION_PROMPT.txt`, `REPORTS/V28_Release_Report.md`, `QA/V28_QA_Evidence.json`, `VERIFY_TRANSFER.py` (it expects the original outer ZIP, which is not in the repository, so it cannot run as written).
- Record files the inputs ask to keep (`REQUIREMENTS.md`, `ARCHITECTURE.md`, `PROGRESS.md`, `ISSUES.md`, `DECISIONS.md`, `TEST_RESULTS.md`, `DATABASE_PROVENANCE.md`, `RELEASE_GATE.md`): none existed in the repository. V29 adds `REPORTS/V29_ISSUES_AND_BACKLOG.md` and `REPORTS/V29_TEST_RESULTS.md` as a start.

---

## D. How the lists were checked (three passes)

| Pass | What was checked | Result |
|---|---|---|
| 1 | Read every requirement file end to end and wrote list A. The Word prompt and the .txt prompt were compared word by word. | Identical apart from the Word title block |
| 2 | Every URL, ID, file name and number in the requirement files was extracted by script and checked against this document. | First run found 33 file names and 12 historical numbers missing from the draft; they were added (sections B2 and C). Second run: none missing |
| 3 | The file lists were rebuilt from the disk and from `TRANSFER_MANIFEST_SHA256.json` and `QA/V28_SHA256_Manifest.json` using SHA-256. | 216 of 218 transfer files are present and byte-identical (186 sit one folder higher than the manifest says). The 2 missing files are listed above. All 236 website files match the V28 manifest. **17 database files had been uploaded to the wrong folder; they were moved back (see the V29 release report).** |

**Match between the written inputs and the files:** the QA PDFs, images and Excel exports are the evidence for items 23 and 38. The 99 database workbooks are the reference data for items 35 to 37. No file contradicts a written input. One written input, the transfer manifest location of the QA results, does not match the repository folders; content is identical.

---

## E. Studies that can be done with this information

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
