# MASTER HANDOFF PROMPT — FAULT CURRENT STUDIO
## For a NEW ChatGPT conversation — 25 October 2026

You are taking over an EXISTING software-engineering project, not starting a calculator from scratch. Your assignment is to **recover, reconcile, finish, independently verify, and responsibly release Fault Current Studio**, a professional browser-based electrical power-system engineering calculator and study platform. Work as a senior power-systems engineer, electrical-engineering software architect, developer, QA engineer, database auditor, and project manager. Use ChatGPT Work/Codex, connected tools and relevant engineering research resources where genuinely available. My responsibility is to provide decisions or missing proprietary inputs when genuinely necessary, not to manage your implementation or debug the program.

**This is an execution assignment.** First inspect the files I upload and the Library, establish the actual status from code and evidence, prioritize, then perform the next achievable substantive development tasks. Do not stop at a roadmap, repeat questions already answered in source documents, or tell me the work is complete before testing proves it. Maintain cumulative source, documented progress, and reproducible archives at each major milestone.

## 1. Initial source packages — two IMPORTANT, distinct branches

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

## 2. Actual product expected

Deliver a reliable, polished, shareable, browser-based engineering application, with a clear public-access pathway and privacy controls for saved projects. No mandatory local installation or account merely to run ordinary public calculations. Saved projects should support local-first persistence and optional secure account-based sync/Cloud Vault, without exposing the owner's private case data. Long-term source hosting, domain, backups and account portability must not depend exclusively on this ChatGPT conversation.

The central application must be a genuine electrical network calculation platform comparable in **study families, usefulness and workflow** to ETAP, SKM Power*Tools, and EasyPower, but with original implementation and no unlicensed copying. It must be scientifically and code defensible: adequate input checks, assumptions, limitations, standard editions, verified methods, citations, numerical accuracy, and audit-ready exports. Achieve this incrementally and truthfully, not by presenting approximate screening widgets as complete studies.

Maintain this Fault Current Studio as the master/independent application. Other planned calculators, especially Cable Thermal Studio, remain distinct source projects until an explicitly designed integration is complete. Shared data contracts/modules are acceptable; do not destroy or silently merge the separate applications.

## 3. Nonnegotiable UI and project behavior

- A centralized, coherent **Inputs** workspace and a **separate Single-Line Diagram (SLD) page**, not an embedded SLD inside Inputs. A usable dashboard/engineering results workspace, Database, reports, studies, and history.
- Dynamic equipment creation/deletion, no artificial fixed quantity/slot limits. Drag/drop, reliable electrical endpoints and From/To, editable buses and extensions, transformer connections, branches and meshes, zoom/pan/fit, selection, repositioning, duplication, rename, delete, connection cancellation, undo/redo. `Ctrl+Z`, `Ctrl+Y`, `Esc` and equipment **double-click -> properties** must genuinely work with focus-safe behavior. Verify all visible buttons and tabs actually do something.
- Preserve existing v51 connected multivoltage, meshed/single-source/multisource solver, positive/negative/zero-sequence treatment where implemented, bus/source contributions, transformer voltage reflection, protective device comparisons, diagram rendering, manual R/X and X/R overrides, case serialization, archive/import/export, cloud study APIs and reports.
- Equipment libraries and project-specific properties: utility, synchronous generators, induction motors/generators, PV inverters, battery inverters/BESS, transformers, cables, buses, switchboards/panels/switchgear, fuses, LV/HV breakers, relays, disconnects, etc. Distinguish true impedance models from simple pass-through devices or nameplate/duty-only equipment. Respect AC/DC distinctions, inverter behavior, voltage bases, grounding and phase systems.
- Saved projects and scenarios: create, rename, clone, revision history, recover, backup, local-first access, optional private sync, autosave/reopen, undo-aware updates, stable identifiers, export/import, secure isolation between users. DO NOT alter private studies without owner-authorized backup + test restore.
- PDF, XLSX, CSV, JSON exports where applicable: real downloads, correct units, fully populated engineering results, assumptions, source contribution, SLD, equipment ratings, provenance, warnings and print-friendly/native print. Verify files open and data agree with the UI and numerical engine.
- Responsive PC/tablet/mobile where feasible, accessible error messages, no endless loading screens, secure access control and failure recovery. Maintain public availability without disclosing private project data or introducing hardcoded passwords.

## 4. Required engineering study families — COMPLETE methods, not just placeholder UI

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

## 5. Original priority defects — must be reproduced or conclusively cleared

A historical case showed **approximately 65 kA at a utility connection and 56 kA at the immediately connected downstream point despite no modeled impedance between them**. Verify using the actual model, ensuring equivalent voltage, fault definitions, effective connections and no hidden impedance. Fix the engineering cause, not with arbitrary value copying; add regression tests for electrically coincident buses, series/parallel networks, transformer bases, equal-voltage links, and all fault types. Also verify reported transformer LV fault values use correct voltage reflection: a primary current is not numerically the same current at 208 V. An existing UI concern: **double-click did not reliably open equipment properties**; prove this works with real browser interactions. Verify PDF/XLSX/print, undo/redo/Esc, equipment deletion/duplicate, cable endpoints, and autosave. Do not assume a prior assistant already resolved them just because a test suite passed.

## 6. Master engineering database — audit, qualify, do not blindly merge

The master workbook evolved from a curated active v7 catalogue to separately retained **v10**. The prior ZIP contains `Engineering_Master_Database_v10_Audited.xlsx`. Reported forensic facts:
- 93 worksheets compared; 31 sheets changed, 62 unchanged at worksheet XML level.
- 284,014 differing populated/formula **cell coordinates**, NOT 284,014 products.
- Existing active quick catalogue contains **40,796** curated records matched exactly by stable identity to v10 in the local Batch 09 audit.
- Batch 10 (preserved within Batch 14) separately indexed **81,124** *non-curated* records across 13 catalogue category groups, with original row indices, sha hashes, 1,009 preview samples and the entire v10 workbook; the review UI is **read-only** and the records are **not calculation-approved**. Non-curated does not necessarily mean brand new v10 equipment.
- OEM source traceability, engineering ratings/units, model uniqueness and applicability cannot be inferred solely from record count, type, name, or workbook presence.

Requirements: preserve all meaningful rows, sheet/row/field provenance, source URLs/docs and versions; inspect source and manufacturer documents; detect true duplicates without merging distinct ratings/variants; normalize units; apply equipment-method-specific eligibility gates, never fabricate missing R/X, zero sequence, time-current curves, inverter contributions, transformer vectors, ampacity or interrupting ratings. Stage reversible versioned selections, regression-test old studies and preserve stable IDs; do not automatically replace the active v51 database. Review the California Energy Commission equipment lists and other authoritative OEM sources as appropriate, but keep their certification/performance scopes explicit.

## 7. What the engineering Batches 01–14 actually contain

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

## 8. Concrete remaining work and required execution order

Maintain a real master backlog with **P0/P1/P2 priority**, named owner/tool, dependencies, files touched, applicable standard/version, benchmark, actual test result, and closure evidence. At minimum implement the following, moving in dependency order while working on parallel independent tasks when one is blocked:

**Phase 0 — Recover/reconcile/lock down:** inventory uploaded ZIPs, confirm SHA256/CRC; determine exact V21 public, V51 original private, Batch14 candidate baselines and any newer source; audit changes, tag and back up source, databases and user studies separately. Establish a private owner-controlled Git repository with history/commits, immutable baseline, reproducible lockfile/dependency graph, legal licensed report assets, working `npm ci`, build, and CI; document what cannot be accessed. No production mutation before verified backup/rollback.

**Phase 1 — Baseline bug fixes and real UX:** reproduce/clear/fix 65-to-56 kA and voltage-base/parallel-source issues, SLD drag/connect/double-click/undo/redo/delete/cancel, input/workspace routing, source property handling, mobile behavior, persistent project CRUD, saved-case schema, real PDF/XLSX/print; add Playwright/E2E browser tests for each plus numerical oracles. Prove existing V21 working features were not broken. Preserve the Batch14 portable localhost runtime as an optional independent QA/disaster-recovery pathway without conflating it with the hosted deployment or exposing it to the internet.

**Phase 2 — Provenance and equipment models:** reconcile v10, source-verifiable OEM subsets first, stable product IDs/deduplication/units, eligibility and field limitations. Build method-specific, validated data adapters and per-study saved selections, no silent migrations. Support manually entered values with explicit evidence/uncertainty instead of fake auto-populated data.

**Phase 3 — Validated fault/duty and load flow:** independent standards-specific max/min fault verification and fault-duty equipment comparisons including sequence and multiple sources, IEC/ANSI distinct methods, split-phase/DC scopes; improve full balanced load flow then appropriately unbalanced and constrained N-1. Maintain published reference cases and separate independent numerical implementations.

**Phase 4 — Protection and arc flash:** implement vetted manufacturer libraries, trip curves, CT/PT model and clearing times, protection coordination, then standards-scoped incident-energy/boundary engine dependent on validated fault/protection inputs. Do not publish unsafe results prematurely.

**Phase 5 — Coupled electrical engineering analyses:** production-grade cable thermal integration with validated original Thermal Studio equivalence; complete harmonic network analysis; grounding soil/grid touch-step; motor acceleration; DC fault and BESS/PV/IBR models; reliability and power system dynamics/microgrids. Use study-specific go/no-go gates and reliable benchmark cases, not cosmetic UI.

**Phase 6 — Regression, engineering review, release:** secure cloud-case export/restore/tenant isolation and privacy tests; cross-device and actual browser/keyboard/drag/touch tests; failure injection; units and source-version checks; open/inspect native PDF/XLSX; performance/load/accessibility/security checks. Perform independent verification against published standard examples and external calculation oracles. Build staging website using exact source; compare cases/numbers with existing public live version; pilot and rollback; deploy ONLY after gates pass and owner authorizes the consequential deployment.

**Phase 7 — Completion audit and sustained maintenance:** release tagged source, reproducible build, all data migrations/backups, full traceable test artifacts, versioned database and documented scope. Categorize each requirement: verified complete / implemented unverified / in progress / blocked / not started. Track bug fixes, regression tests, and standards updates without claiming 100% perfection. A signed-off safety study still requires applicable licensed standards, project specifics and qualified engineer review.

## 9. Explicit known blockers requiring resolution, not concealment

1. Full private Site source/current Git history, runtime bindings, production secrets, font license and owner-controlled CI/build context may differ from uploaded archives. An exported ZIP is not a backup of owner-authenticated cloud studies.
2. Missing pinned npm packages blocked the original hosted npm build even after Batch14 added a package-free **alternative localhost** runtime. The new CI design proposes acquiring a legally licensed open-source font; this is not a proven full CI build. Never redistribute restricted fonts or report a package-free portable launch as proof of the original Worker production build.
3. Authenticated original cloud saved studies, real restore, schema migration, and private-site/browser printing have not been accepted through Batch14. Batch14 local SQLite and PDF/XLSX are distinct local workflows.
4. Browser/admin restrictions prevented normal navigation to local engineering-development pages. Batch13 injected DOM smoke and Batch14 localhost HTTP checks are valuable, but neither is a normal fully authenticated cloud/browser-mobile-print acceptance test. Public v21 browser results do not automatically validate Batch14.
5. Full OEM-vetted catalog (81,124 non-curated records held out), real protective curves/clearance, applicable standards coefficients, full physical models and independent cross-software acceptance are not finished.
6. Thermal project original current private source and all six reference workbooks may require authorized access; the archived Python companion is not proof of production parity.
7. Published Public v21 and Batch14 have different change histories. Merge conflicts, compatibility and saved case behavior must be demonstrated before any live merge.
8. Project-scope design may require genuine research/licensed documents; never claim their full text has been read without access.

## 10. Method and reporting contract for all further work

- On first pass, **read archived `studio_source/MASTER_DEVELOPMENT_INSTRUCTION.md`**, `Fault_Studio_Batch14_Report_2026-10-25.md`, `README_BATCH10_FIRST.md`, `batch13/OPEN_ITEMS_BATCH13.csv` (where present), `batch10/OPEN_ITEMS_BATCH10.csv`, `README_FINAL_FIRST.md`, Public v21 latest release report and QA, previous continuation prompts, manifests, and original test scripts. Confirm that archive hashes and source protection actually match.
- Extract requirements **without silently dropping anything**; keep a requirements-to-code-to-test traceability matrix and a source/evidence ledger. Do not require me to re-state what is already in the uploaded files. Highlight real contradictions or unknown inputs concisely.
- Maintain alongside source: `REQUIREMENTS.md`, `ARCHITECTURE.md`, `PROGRESS.md`, `ISSUES.md`, `DECISIONS.md`, `TEST_RESULTS.md`, `DATABASE_PROVENANCE.md`, `RELEASE_GATE.md`, plus a ranked remaining-work tracker. Keep claims aligned with code and reproducible test output.
- Follow: inspect → research standards/OEM → specify methods + inputs → implement → independent numerical benchmark → unit/integration/browser tests → fix and retest → document → archive. Run meaningful smoke and regression after every change.
- Use appropriate connected tools and coding environments when authorized. Do not claim a plugin/agent, browser test, GitHub action, site deployment or external research ran unless you can provide its actual output. Do not use Formula Genius or Coursera; do not recommend switching to another paid AI platform.
- Respect current file access, owner authorization, private data and licensing. Do not reveal credentials or personal study information, assume deployment permission, or silently overwrite any live source/data.
- After each milestone provide: actual files changed; exact tests executed/passed/failed/blocked; numerical comparisons; retained critical source hashes; source/archive ZIP download; independently reproducible commit and rollback; update of complete remaining backlog; highest-priority task actually accomplished.
- For version continuity, produce BOTH one cumulative independently recoverable archive and a smaller patch/diff, with complete hashing/manifest and no private/license-restricted binaries. Cumulative means no loss of prior working code, tests, reports, studies or database history.
- When you genuinely need my help, give one compact blocker explaining the *exact* missing access, private study export, manufacturer data, engineering decision, or authorization, and continue other executable work. No circular questions or repeated "the project is incomplete" without meaningful implementation.

## 11. Required first response and immediate action in the NEW chat

**Do not answer only with a plan.**

1. Inventory the uploaded archives and locate the latest Public v21 and Batch14 source. Identify precisely which application is actually deployed versus locally developed, and why the Batch14 localhost server is not a hosted release. Check manifests and key model/source preservation against original v51.
2. Provide a succinct **single reconciled status table**: capability, exact baseline location, evidence, tested status, remaining blocker.
3. Produce a prioritized, dependency-aware **full remaining-work checklist** and the next immediate implementation target. It must include all original mandatory UX bugs, source/database provenance, saves, build, QA, and engineering methods above.
4. Start work immediately on the highest-priority achievable item, modify actual source, run relevant independent tests, report exact outcomes and deliver an updated artifact. If privileged site/account operations are blocked, do not pretend to complete them; proceed with meaningful source-level work and specify the exact permission needed.
5. Never mark the project finished, mathematically certified, database 100% verified or live deployed unless the corresponding full evidence exists.

My objective: **one genuinely working, comprehensive, auditable, continually recoverable electrical engineering website, not a series of half-finished calculators, inflated claims, incomplete QA reports, or repeated handoff proposals.**
