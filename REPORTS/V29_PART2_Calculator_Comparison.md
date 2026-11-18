# Is this the best calculator? Comparison with other tools (Part 2)

Prepared 7 November 2026. Plain answer first, then the evidence.

## Plain answer

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

## Update (later on 7 Nov 2026)

A research bot then verified **100 tools** (about 75 distinct products when vendor modules are counted once), each with a source URL, plus a 12-family method and standards register. See `research/calculator_survey.md` (with a ranked Top 25 features list) and `research/method_reference_register.md`. From that list, #1 (NEC 110.24 label) and #3 (arc flash at full and reduced arcing current) are now in the live calculator.

## Tools reviewed (first pass)

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

## What was adopted in V29

1. **Transformer impedance-tolerance envelope.** IEEE C57.12.00 allows tested impedance within ±7.5 % of nameplate, and the Bussmann point-to-point method multiplies %Z by 0.9 for a worst case. Studio now re-solves the whole network with every ± combination and reports the minimum, nameplate and maximum current at every bus. Testing showed that a lower %Z does **not** always raise every bus current when generators or motors are present, so Studio searches all combinations instead of assuming. Simple calculators assume.
2. **NEC 110.24 available fault current label.** Printable label with maximum available fault current, date of calculation, voltage, X/R and basis, plus PDF, Excel and JSON reports.
3. **Input plausibility warnings,** like the "data check" step in commercial tools. Values that are almost always unit mistakes now get a warning: fault current over 300 kA, transformer %Z outside 0.5–25 %, X/R over 100–150, cable resistance above #18 AWG, length over 100 km, bus voltage over 800 kV, generator reactance outside the typical range. Results are unchanged; the user is warned.

## Highest-value items still to adopt (ranked)

| Priority | Item | Seen in | Why it matters |
|---|---|---|---|
| P0 | Full IEEE 1584-2018 arcing current, incident energy and boundary (five electrode configurations, enclosure correction, reduced-arc case) | ETAP, EasyPower, SKM, ARCAD, VIOX | Most-requested missing study. IEEE publishes official calculator files on IEEE DataPort, which can serve as the test reference. |
| P0 | OEM time-current curves with tolerance bands | SIMARIS curves, SKM, EasyPower | Needed for real clearing times and for arc flash |
| P1 | Transformer off-nominal tap in fault studies (currently rejected by design) | All suites | Real transformers have ±2.5 %/±5 % taps that change maximum/minimum fault levels |
| P1 | Motor contribution shortcut (about 4 × FLA) for quick studies | FC2, point-to-point practice | Fast entry when motor data is unknown; must stay labelled as an estimate |
| P1 | pandapower IEC 60909 cross-check of the full engine | pandapower | Independent, published validation |
| P1 | Unbalanced load flow, IEEE 80 grounding, IEC 60853 cable | PSS SINCAL, XGSLab, CYMCAP | Large engineering gaps |

## Sources

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
