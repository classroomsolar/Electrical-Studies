# V29 issues and backlog

## Fixed in V29
| ID | Issue | Evidence |
|---|---|---|
| V29-01 | 17 database files outside `SITE/database/` in the repository (404 on `database/manifest.json.txt`) | Browser network log; hashes now match V28 manifest |
| V29-02 | SLD Delete button for sources/devices drawn at `translate(NaN 20)` | Browser DOM check before/after |
| V29-03 | Implausible inputs accepted without any warning (1e300 A, 200 % Z, X/R 1e12, X/R 0) | Adversarial suite |
| V29-04 | No transformer impedance-tolerance envelope or NEC 110.24 label | Competitor review (Bussmann FC2) |
| V29-05 | Arc-flash dialog depended on an external server outside the owner's control; inputs left the browser | Local IEEE 1584-2018 engine, 105,120 official cases |

## Done in V32
- V31-01 done: sparse connected-sequence and split-phase solvers with compact results (2,000 buses in seconds; equal to dense).
- V31-02 done: arc flash at every bus uses a bridge-based device lookup (147 s → about 5 s), plus an option to bracket screening-bound currents.
- V31-03 done: tree auto-arrange above 40 buses.
- V31-04 partly done: the Equipment table adds and deletes items (connections are still edited on the one-line).
- V31-05 done: Build plant attaches blocks to existing buses and generates DC arrays.
- New: Report contents chooser (sections, scope, extra studies); large Excel/PDF reports; sparse load flow with closed-switch bus merging; IEEE 1584 calculation in the Engineering studies arc-flash card.

## Open after V32
| ID | Item | Priority |
|---|---|---|
| V32-01 | Undo/redo and add-item are about 6–8 s on 2,000-bus projects (full recalculation); make them incremental | P1 |
| V32-02 | Operating-study per-field entry is about 2 s on large projects; add bulk entry or CSV for loads | P1 |
| V32-03 | Unbalanced (per-phase) load flow | P2 |
| V32-04 | Z-tolerance envelope is 9–14 s on 70 transformers | P2 |
| V32-05 | Atlas items not built (see V31-06) | per atlas |
| V32-06 | Database v13 publication (owner decision) | owner |

## Done in V31
- Sparse AC fault solver and compact plant-scale results (full detail for the selected bus); factored DC array solver.
- Large one-line: visible-area drawing, zoomed-out overview, Find; geometry cache and grid label placement; V30 label-background layout stall removed.
- Build plant (PV/BESS block generator, user data only) and Equipment table (CSV download/edit/upload).
- Projects on your computer (folder of `.fcs.json` files, autosave, reconnect after reload).
- Capability atlas: reference names removed from the page; statuses updated; product names removed from two other visible texts.
- Database picker in the inspector themed (light panel left over from V30).

## Open after V31 (next rounds)
| ID | Item | Priority |
|---|---|---|
| V31-01 | Scale connected-sequence (SLG/LL/DLG) and split-phase solvers to plant size | P1 |
| V31-02 | Arc flash at every bus on 2,000-bus projects: device search per bus is quadratic; index it | P1 |
| V31-03 | Auto-arrange for large projects not built with Build plant (tree layout, collapsible blocks) | P1 |
| V31-04 | Equipment table: create / delete items and edit connections; validation preview before applying | P2 |
| V31-05 | Build plant: several block types per project; DC side (strings, combiners, fuses) generated together with the AC side | P2 |
| V31-06 | Atlas gaps (IEC 60909 full, ANSI C37, selectivity, IEC 60287 duct banks / IEC 60853, pulling and cleat forces, N-1 and unbalanced load flow, hosting capacity, frequency sweeps, IEEE 80, IEC 61660, dispatch, PV yield, microgrid dynamics, CIM, provenance/traceability) | per atlas |

## Done in V30
- Stitch theme (dark engineering workbench), self-hosted Inter + JetBrains Mono.
- Layout clean-up: no floating buttons over content, palette labels no longer cut, one-line labels sized to text, wide tables shown as cards when they cannot fit, long drop-down options wrap. Automatic layout audit at 5 widths: 0 findings.

## Done in V29e
- Fixed off-nominal transformer tap in load flow.
- One-line breakers / fuses / reclosers linked automatically to the per-bus arc-flash device picker.
- Relay tolerance bands; LV breaker electronic trip (LSI) model.
- Conductor sizing: NEC 240.4 OCPD check and 250.122 EGC.
- Published TCC plot-point library (ERMCO 9F54DFC) and 2-column manufacturer curve entry.

## Done in V29d
- Clearing time from relay curve / definite time / manufacturer curve dropdowns, used by per-bus arc flash and conductor sizing.
- IEEE 519 PCC check; PF correction with resonance check.
- User R/X in conductor sizing.
- Engineering master database v13 imported (not yet live: run DEPLOY/deploy_database_to_wix.py).

## Done in V29b
- Off-nominal transformer tap in fault studies (all sequences, form, report, bundle) with oracle tests.
- Arc flash at every bus with NFPA 70E 130.5(H) label content (clearing times required, never assumed).
- Combined conductor sizing (ampacity + voltage drop + short-circuit).

## Cleared by test (no change needed)
| ID | Item | Evidence |
|---|---|---|
| H-01 | Historic 65 kA vs 56 kA on buses with no impedance between them | Equal to 1e-6 at 10, 65 and 100 kA |
| H-02 | Transformer LV current copied from primary | 3,400 A primary → 32,726 A at 208 V; infinite-bus checks exact |
| H-03 | Double-click properties, Ctrl+Z / Ctrl+Y, Esc | Browser test, desktop and mobile |

## Open, ranked
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

## Missing resources (need the owner)
- Calculator spreadsheets from earlier chats (about 100) and any project PDFs/images: not in the repository.
- `ENGINEERING_DATA/Original_Audited_Master_Database.xlsx`, the private v51 site, Batch 10–14 archives and the six Cable Thermal Studio reference workbooks.
