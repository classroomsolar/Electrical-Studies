# Batch 3 — Engineering audit 1: fault engines (15 Nov 2026)

Scope: R326–R334, I-01, D05, D06. Free tools only (pandapower 3.5.6, numpy). No paid software, no licensed material.

## Findings

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

## ANSI / IEEE C37 gap list (for Batch 10; nothing implemented yet)
- Separate R and X networks for X/R (IEEE C37.010 / C37.5 method), not the complex-network X/R used now.
- First-cycle (momentary) network with the C37.010 machine reactance multipliers; momentary duty vs close-and-latch rating.
- Interrupting network (1.5–4 cycle) with machine multipliers; remote / local (NACD) multiplying factors from the C37.010 curves; contact-parting time per breaker.
- LV breaker duty per IEEE C37.13 (multiplying factor from X/R vs the test X/R of the breaker).
- Fuse duty per their test X/R.
- 30-cycle (time-delay relay) current.
- Each item needs its curve / table data from a lawful, free source before coding (no invented coefficients).

## IEC TR 60909-4 published example
Not used: the example network data was not available from a free, lawful source in this batch. pandapower (whose IEC 60909 code is itself tested against IEC TR 60909-4 by its authors) was used instead. Recorded as open in REQUIREMENTS R326.

## Other work in this batch
- I-09: the 13 picker copies of database sheets (plus `cable-picker`) were never downloaded — the equipment picker reads the `master-*` sheet files. Removed from the package database (3.3 MB); manifest points at the master files; the loader no longer has a path to a picker copy. Browser test `QA/B03_FAULT_AUDIT/db_picker_browser.py`: 50 sheets, every row count equal to the manifest, no failed request, only `master-*` files requested. Live database unchanged (D-08).
- I-13: unused live files deleted (16, including the old font files). All views checked locally: no HTTP error, no page error.
- Private data: the local clone of the database repository was deleted.
