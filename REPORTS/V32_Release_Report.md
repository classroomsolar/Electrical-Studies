# V32 release report

Date: 8 November 2026 · Parent: V31 · Wix site `97613ac8-1f7d-4ecf-8fa4-2d589c387775` (same site, no new site created)

## State
- Package: 265 website files (V31: 262). 30 existing files changed, 3 new files, none deleted.
- Live: V32 code deployed to the original site (263 live files). Every file was checked against its SHA-256 after upload. `public-bundle-v21.js` was patched one module at a time, and every module that V32 does not change (including the database-reference-tables module) was checked unchanged after the write.
- **Database v13 is still not live**, as instructed. It stays in `SITE/database/` and `DEPLOY/` for the owner to publish.
- Full engineering acceptance is **not** claimed. These are screening calculations to be checked by a qualified engineer.

## What V32 adds
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

## Tests (all pass)
| Folder | What it checks |
|---|---|
| `QA/V32_REPORT/` | Report chooser logic, default report identical to V31, study-report parity, browser toggling (<0.4 s), tool registration, performance |
| `QA/V32_SEQUENCE/` | Sparse vs dense, connected and split-phase, up to 2,000 buses; all fault modes |
| `QA/V32_LOADFLOW/` | Sparse vs dense Newton, switch merging (KCL), 1,970-bus plant, browser |
| `QA/V32_ARCFLASH/` | New device lookup equal to V31 reference on every bus |
| `QA/V32_TABLE/` | Table add/delete, builder attach and DC arrays, browser |
| `QA/V32_LAYOUT/` | Tree arrange screenshots; layout audit at 4 widths clean |

Manifest: `QA/V32_SHA256_Manifest.json`.

## Still open (honest)
- Capability-atlas items marked "not built yet" (IEC 60909 certification, cable pulling, hosting capacity, grounding grid touch/step, storage dispatch, microgrid dynamics, CAD/BIM/CIM import).
- On 2,000-bus projects, undo/redo and adding one item still take about 6–8 s, because the whole project is recalculated.
- Operating-study data entry is about 2 s per field on large projects. The fill-zero button and CSV entry are the practical route.
- Unbalanced (per-phase) load flow is not built.
- The transformer Z-tolerance envelope takes about 9–14 s on 70 transformers.
- "Open this study in browser" needs the private cloud, so it is hidden where it cannot work.
- Database v13 is not live (owner decision).
