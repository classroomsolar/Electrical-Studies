# REQUIREMENTS — Fault Current Studio (Master Prompt V5.0, Group 14)

Batch 1 (Phase 0, read-only), 15 Nov 2026. Evidence = files in `SITE/` and tests in `QA/` that were inspected or **run on 15 Nov 2026** (marked ▶). Older test counts that were not rerun are marked "historical".

Status uses Master Prompt Section 57: NOT IMPLEMENTED · PARTIALLY IMPLEMENTED · IMPLEMENTED — NOT VERIFIED · SOFTWARE TESTED · ENGINEERING VALIDATED · DEPLOYED. "DEPLOYED" here means the code is on the live Wix site; it says nothing about validation. No requirement is ENGINEERING VALIDATED yet: published-case checks exist for some (noted), but the engineering review of Section 72 has not been done.

P1–P5 applicability (proposed, owner to confirm): R = REQUIRED, C = CONDITIONAL (condition given), NA = NOT APPLICABLE.

## Tests run on 15 Nov 2026 (▶)
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

## Group 14 requirements
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

## Requirements from earlier documents (D01–D17)
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

## Scope items (owner decision D-04)
| Item | Where | Decision |
|---|---|---|
| Generator as source and equipment | `network-model.mjs`, `network-engine.mjs`, `connected-sequences.mjs`, `one-line-editor.mjs`, `database/generators` | Keep |
| BESS as equipment / inverter source | IBR sources, `database/master-batteries` | Keep |
| BESS dispatch (peak shaving, self-consumption, charge / discharge) | `operations-v27.mjs` → `evaluateBessDispatch`; UI `operations-v27-ui.mjs` | Hidden (Batch 2, live) |
| BESS size / cost sensitivity (includes tariffs and net cost) | `operations-v27.mjs` → `compareBessSizeCases` | Hidden (Batch 2, live) |
| Time-series AC load flow | `operations-v27.mjs` → `evaluateAcTimeSeries` | Keep (R346) |
