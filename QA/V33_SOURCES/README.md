# V33 — plants with many inverter sources

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
