# Fault Current Studio -- Method Reference Register

Compiled: 2026-11-07 (research session; web search + fetch).
Purpose: an auditable list of the sources each study module must be built on and validated against.

## Ground rules for using this register

- Every row was **located in this session** at the URL given. Nothing was added from memory.
- **Verification level** (last column tag):
  - `[V]` = metadata (authors/year/DOI/edition) confirmed by fetching the URL or a bibliographic record.
  - `[L]` = located as a search-result listing only (title + URL seen, page not fetched); confirm before citing in code comments.
- "Use" column key: **METHOD** = equations/procedure to implement; **ORACLE** = numbers to unit-test against; **DATA** = parameter tables/defaults; **CONTEXT** = background/justification only.
- Most governing standards are paywalled. Publisher URLs below are catalogue pages, not the text. See the last section for what must be bought.
- Status flags matter: several "classic" Color Books are now **Inactive-Reserved** at IEEE. The calculator may still cite them, but must label them as legacy.

---

## 1. Short circuit (IEC 60909; ANSI/IEEE C37.010 / C37.13 / IEEE 551)

### 1.1 Governing standards

| Type | Title | Publisher | Year/Edition & status | URL | Use in calculator |
|---|---|---|---|---|---|
| Standard | IEC 60909-0 Short-circuit currents in three-phase a.c. systems -- Part 0: Calculation of currents | IEC | **Ed. 3.0, published 2026-07-23**, stability date 2029. Ed. 2.0 (2016) shows withdrawal date 2026-07-23. `[V]` | https://webstore.iec.ch/en/publication/68454 | METHOD: primary IEC engine (c-factor, K-corrections, Ik'', ip, Ib, Ik, Ith). **Action:** the developer must check the 2026 change list against 2016 before coding; the catalogue page gave no change summary. |
| Standard (superseded) | IEC 60909-0:2016 (Ed. 2.0) | IEC | 2016-01-28; page says a newer version exists. Added wind units and full-size-converter units. `[V]` | https://webstore.iec.ch/publication/24100 | METHOD (legacy mode): keep as a selectable edition for projects contracted to 2016. |
| Technical Report | IEC TR 60909-4:2021 Examples for the calculation of short-circuit currents | IEC | Ed. 2.0, 2021-06-24. LV example, MV with async motors, power-station auxiliaries, a new example for clause 6.8 of 60909-0:2016, a wind example, and a Clause 9 HV **test network with results for checking digital programs**. `[V]` | https://webstore.iec.ch/publication/66482 | **ORACLE (primary)**: encode every Clause 5-9 example as a regression test. Preview PDF: https://www.vde-verlag.de/iec-normen/preview-pdf/info_iectr60909-4{ed2.0}en.pdf `[L]` |
| Standard | IEEE C37.010-2016 Application Guide for AC High-Voltage Circuit Breakers > 1000 Vac Rated on a Symmetrical Current Basis | IEEE | 2016, **Active**. Covers system short-circuit calculation and X/R compensation curves. `[V]` | https://standards.ieee.org/ieee/C37.010/5807 | METHOD: ANSI E/X method, multiplying factors (remote/local, 5-cycle etc.) for MV breaker duty. |
| Standard | IEEE C37.13 Low-Voltage AC Power Circuit Breakers Used in Enclosures | IEEE | C37.13-2015 located (ANSI webstore); a **C37.13-2024** edition appears on reseller listings. `[L]` | https://webstore.ansi.org/standards/ieee/ieeec37132015 ; 2024 listing: https://eshop.normservis.sk/norma/ieee-c37-13-2024-20.12.2024.html | METHOD/DATA: LV PCB test X/R and duty multiplying factors. Confirm which edition before coding the derating table. |
| Recommended practice (legacy) | IEEE 551-2006 Calculating AC Short-Circuit Currents in Industrial and Commercial Power Systems (Violet Book) | IEEE | 2006; **Inactive-Reserved since 2021-03-25**. `[V]` | https://standards.ieee.org/standard/551-2006.html | METHOD (reference): detailed ANSI derivations; cite as legacy. |
| Recommended practice | IEEE 3002.3-2018 Conducting Short-Circuit Studies and Analysis of Industrial and Commercial Power Systems | IEEE | 2018 `[L]` | https://ieeexplore.ieee.org/document/8672198 | METHOD: current IEEE study-procedure document that replaces the Color Book content. |

### 1.2 Papers / technical papers

| Type | Title | Authors | Year | URL / DOI | Use |
|---|---|---|---|---|---|
| IEEE Trans. IA | Comparison of ANSI and IEC 909 short-circuit current calculation procedures | G. Knight, H. Sieling | 1993, vol. 29 no. 3, pp. 625-630 | DOI 10.1109/28.222435 ; record https://manuscript.isc.ac/Inventory/49/920048.htm `[V]` | CONTEXT/ORACLE: shows where the two engines differ; use to explain ANSI-vs-IEC deltas in reports. |
| Preprint (arXiv) | Vectorized Calculation of Short Circuit Currents Considering Distributed Generation -- An Open Source Implementation of IEC 60909 | L. Thurner, M. Braun | arXiv 1802.01502 | https://arxiv.org/abs/1802.01502 `[V]` | METHOD: matrix (Zbus) formulation of IEC 60909 with DG; says it was validated against commercial software. |
| IEEE Trans. PWRS | pandapower -- An Open-Source Python Tool for Convenient Modeling, Analysis, and Optimization of Electric Power Systems | L. Thurner, A. Scheidler, F. Schäfer, J.-H. Menke, J. Dollichon, F. Meier, S. Meinecke, M. Braun | 2018, vol. 33, p. 6510 | DOI 10.1109/TPWRS.2018.2829021 ; preprint https://arxiv.org/abs/1709.06743 `[V]` | ORACLE: cross-check engine (pandapower implements IEC 60909-0:2016 ikss/ip/ith). |
| Book | Short Circuits in Power Systems: A Practical Guide to IEC 60909 | I. Kasikci | Wiley, 2002 | https://www.eyrolles.com/Loisirs/Livre/short-circuits-in-power-systems-9783527304820 `[V]` | ORACLE: worked IEC examples (pre-2016 edition; check c-factors). |

### 1.3 Worked examples / benchmarks (test oracles)

| Type | Title | Source | URL | Use |
|---|---|---|---|---|
| Benchmark | IEC TR 60909-4:2021 Clause 9 test network (380/110/30/10 kV) with published results | IEC | https://webstore.iec.ch/publication/66482 | ORACLE (licensed). |
| Benchmark | IEEE PES Test Feeder "Short Circuit Test Cases" (2011) for the 13/34/37/123-node feeders; plus the "DG Protection Test Case" with a substation MVA correction | IEEE PES Distribution Test Feeder WG | https://cmte.ieee.org/pes-testfeeders/resources `[V]` | ORACLE: unbalanced fault results (free). |
| Software docs | pandapower short-circuit documentation (ikss, ip, ith; cites IEC 60909-0:2016; ip/ith only for far-from-generator faults) | pandapower | https://pandapower.readthedocs.io/en/latest/shortcircuit/currents.html `[V]` | ORACLE: open-source cross-check. |
| Tutorial notebook | pandapower short circuit with renewables (v2.7.0) | pandapower | https://nbviewer.jupyter.org/github/e2nIEE/pandapower/blob/v2.7.0/tutorials/shortcircuit_renewables.ipynb `[L]` | ORACLE for converter-fed contributions. |
| Training slides | Short Circuit Calculation: IEC 60909 (ABB technical sharing session) -- 500 MVA/20 kV + 400 kVA example (~14.1 kA / 13.6 kA at 400 V); 750 MVA/22 kV + 1600 kVA (37.168 kA single, 74.336 kA parallel) | L. Ng (ABB), June 2021, hosted on easypower.com | https://www.easypower.com/files/Short_Circuit_Currents_According_to_IEC_60909.pdf `[V]` | ORACLE (simple hand checks; not 60909-4). |

### 1.4 Manufacturer application guides

| Title | Publisher | Year | URL | Use |
|---|---|---|---|---|
| Cahier Technique 158: Calculation of short-circuit currents | Schneider Electric | v1.0, 2005-09-01 `[V]` | https://se.com/us/en/download/document/ECT158 (alt copy: https://sti.eduscol.education.fr/sites/eduscol.education.fr.sti/files/ressources/techniques/3357/3357-ect158.pdf) | METHOD/ORACLE: IEC-style impedance method with examples. |
| Selecting Protective Devices (SPD) Electrical Protection Handbook, 2018 ed. (based on 2017 NEC); Section 4.1 Fault current calculations | Eaton Bussmann | 2018 `[V]` | https://www.eaton.com/content/dam/eaton/products/electrical-circuit-protection/fuses/technical-literature/bus-ele-br-3002-spd-2017.pdf | METHOD: point-to-point LV method (ANSI/NEC practice). |
| FC2 Available Fault Current Calculator brochure (point-to-point; no formulas in doc) | Eaton Bussmann | Oct 2024 `[V]` | https://www.eaton.com/content/dam/eaton/products/electrical-circuit-protection/fuses/fault-current-calculator/bus-ele-pp-10106-fc2-mobile-app.pdf | ORACLE: run FC2 app on identical cases for cross-check. |

**Family 1 count:** 7 standards, 4 papers/books, 5 oracles, 3 manufacturer guides.

---

## 2. Load flow (Newton-Raphson; unbalanced / OpenDSS)

### 2.1 Governing standards

| Type | Title | Publisher | Year/Status | URL | Use |
|---|---|---|---|---|---|
| Recommended practice | IEEE 3002.2-2018 Conducting Load-Flow Studies and Analysis of Industrial and Commercial Power Systems | IEEE | 2018 `[L]` | https://ieeexplore.ieee.org/document/8529292 | METHOD: study scope, modelling conventions, acceptance criteria. |

(There is no single "load-flow standard"; the algorithms come from the literature below.)

### 2.2 Papers

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

### 2.3 Benchmarks / oracles

| Title | Source | URL | Use |
|---|---|---|---|
| IEEE PES Distribution Test Feeders: 4-bus (expect <0.05% error), 4-wire delta, YYD, 13, 34, 37, 123-bus (with 2010/2014 corrections), 8500-node, NEV, 342-node LVNT, European LV feeder | IEEE PES DTF WG | https://cmte.ieee.org/pes-testfeeders/resources `[V]` | ORACLE (primary, free). Apply the published corrections. |
| Comprehensive Test Feeder (with WindMil/CYME solutions, 2014) | IEEE PES | https://cmte.ieee.org/pes-testfeeders/comprehensive-test-feeder `[L]` | ORACLE. |
| OpenDSS (EPRI) -- BSD licence; last update 2026-09-05 | EPRI / SourceForge | https://sourceforge.net/projects/electricdss `[V]` | ORACLE: run the same feeders in OpenDSS for every release. |
| EPRI OpenDSS CIM interoperability test report (product 1023218, 2011) | EPRI | https://restservice.epri.com/publicdownload/000000000001023218/0/Product `[V]` | DATA/CONTEXT: CIM import/export if the tool supports CIM. |

### 2.4 Manufacturer guides
None specific to load-flow algorithms were found. That is normal: vendors publish software manuals, not method papers.

**Family 2 count:** 1 standard, 8 papers, 4 oracles, 0 manufacturer guides.

---

## 3. Protection coordination (IEEE 242 / C37.112; IEC 60255-151)

### 3.1 Governing standards

| Type | Title | Publisher | Year/Status | URL | Use |
|---|---|---|---|---|---|
| Standard | IEEE C37.112-2018 Standard for Inverse-Time Characteristics Equations for Overcurrent Relays | IEEE | 2018 (pub. 2019-02-05), **Active**. Includes the integral equation for varying current and reset characteristics. `[V]` | https://standards.ieee.org/ieee/C37.112/7036 | METHOD: MI/VI/EI (U1-U5 style) constants, tolerances, integral time-to-trip, reset. |
| Standard | IEC 60255-151:2009 Measuring relays and protection equipment -- Functional requirements for over/under current protection | IEC | Ed. 1.0, 2009-08-28, stability date 2028 `[V]` | https://webstore.iec.ch/publication/1166 | METHOD: IEC SI/VI/EI/LTI curve constants, accuracy classes, reset. |
| Recommended practice (legacy) | IEEE 242-2001 Protection and Coordination of Industrial and Commercial Power Systems (Buff Book) | IEEE | 2001; IEEE lists it as **Inactive-Reserved** `[L]` | https://standards.ieee.org/ieee/242/426 | METHOD (reference): coordination time intervals, device-damage curves; cite as legacy. |

### 3.2 Papers

| Type | Title | Authors | Year | URL / DOI | Use |
|---|---|---|---|---|---|
| IEEE Trans. PWRD | IEEE standard inverse-time characteristic equations for overcurrent relays | G. Benmouyal, M. Meisinger, J. Burnworth, W. A. Elmore, K. Freirich, P. A. Kotos, P. R. Leblanc, P. J. Lerley, J. E. McConnell, J. Mizener, J. Pinto de Sá, R. Ramaswami, M. S. Sachdev, W. M. Strang, J. E. Waldron, S. Watansiriroch | 1999, vol. 14 no. 3, pp. 868-872 | DOI 10.1109/61.772326 ; https://manuscript.isc.ac/Inventory/49/1524654.htm `[V]` | METHOD: background and derivation of the C37.112 equations. |

Only one peer-reviewed paper for this family was verified this session. More (e.g. IEEE IAS coordination tutorials) should be added.

### 3.3 Oracles
- Analytic: the C37.112 and IEC 60255-151 equations are closed-form. Unit tests = tabulated time at M = 2, 5, 10, 20 computed from the published constants (licensed text needed for the constants and tolerances).
- No free benchmark coordination case with published TCC results was located.

### 3.4 Manufacturer guides

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

## 4. Arc flash (IEEE 1584-2018; NFPA 70E; DC methods)

### 4.1 Governing standards

| Type | Title | Publisher | Year/Status | URL | Use |
|---|---|---|---|---|---|
| Guide | IEEE 1584-2018 Guide for Performing Arc-Flash Hazard Calculations | IEEE | Board approved 2018-09-27, published 2018-11-30, **Active**. An errata file is posted. Revision project P1584 is open (208 V-15 kV). `[V]` | https://standards.ieee.org/ieee/1584/5802 | METHOD: Iarc / E / AFB model, 5 electrode configurations (VCB, VCBB, HCB, VOA, HOA), enclosure-size correction, reduced-arc-current variation. **Apply the errata.** |
| Standard | NFPA 70E Standard for Electrical Safety in the Workplace | NFPA | **2027 edition** listed (ANSI webstore); 2024 edition also current in many jurisdictions `[V]` | https://webstore.ansi.org/standards/nfpa/nfpa70e2027 | METHOD/DATA: PPE categories, arc-flash boundary use, labelling content, Annex D DC methods. Let the user pick the edition. |

### 4.2 Papers (AC and DC)

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

### 4.3 Oracles / datasets

| Title | Source | URL | Use |
|---|---|---|---|
| IEEE 1584-2018 Annex D.1 / D.2 worked examples | IEEE (licensed) | https://standards.ieee.org/ieee/1584/5802 | ORACLE (primary). |
| Arc Flash IE and Iarc Calculators (two .xlsm, v2.6.6, 2019-08-29; BSD-3; DOI 10.21227/8gch-a963). The page says it is **not part of IEEE 1584-2018**. Users report the reduced-arcing-current workbook gives higher IE and AFB than Annex D.1 for MV/HV. | IEEE SA via IEEE DataPort | https://ieee-dataport.org/open-access/arc-flash-ie-and-iarc-calculators `[V]` | ORACLE (secondary). Use the standard (non-"_M") workbook; treat the "_M" workbook as suspect. |
| `arcflash` Python library (MIT). Unit tests reproduce Annex D1/D2 exactly; 144,000 cases from the IEEE spreadsheets match within 0.1%; flags errors in the _M spreadsheet. | L. Yip (GitHub) | https://github.com/LiaungYip/arcflash `[V]` | ORACLE: reuse the test-vector approach and the generated cases (check licence fit: MIT). |
| Arc Flash Phenomena test data ("Processed Data.zip", 2.83 GB; DOI 10.21227/nmsx-qd89) | IEEE SA & NFPA via IEEE DataPort (**subscription**) | https://ieee-dataport.org/open-access/arc-flash-phenomena `[V]` | DATA: raw lab tests behind the 1584-2018 model. Use for model-error envelopes. |
| Comparison of IEEE 1584-2018 predictions with tests on real-world equipment | IEEE DataPort | https://ieee-dataport.org/open-access/comparison-ieee-1584-2018-predictions-tests-real-world-equipment `[L]` | ORACLE/CONTEXT. |

### 4.4 Manufacturer guides

| Title | Publisher | Year | URL | Use |
|---|---|---|---|---|
| Arc flash analysis: complying with IEEE Std 1584-2018 (PA027048EN) | Eaton | July 2019 `[V]` | https://www.eaton.com/content/dam/eaton/services/eess/eess-documents/eaton-ieee-1584-2018-changes-pa027048en.pdf | CONTEXT: 1,800+ tests vs ~300; removal of the 240 V/125 kVA exclusion; enclosure dimensions. |
| IEEE 1584-2018 at a glance (MZ027023EN) | Eaton | `[L]` | https://www.eaton.com/content/dam/eaton/services/eess/eess-documents/ieee1584-2018-at-a-glance-mz027023en.pdf | CONTEXT/UI. |
| SPD Handbook 2018, Section 4.3 Arc flash | Eaton Bussmann | 2018 `[V]` | (URL in 1.4) | DATA: current-limiting fuse arc-flash behaviour. |

**Family 4 count:** 2 standards, 7 papers (+1 key primary paper not located), 5 oracles/datasets, 3 manufacturer guides.

---

## 5. Cable ampacity (IEC 60287; IEC 60853; Neher-McGrath; NEC 310)

### 5.1 Governing standards

| Type | Title | Publisher | Year/Status | URL | Use |
|---|---|---|---|---|---|
| Standard | IEC 60287-1-1:2023 Electric cables -- Calculation of the current rating -- Part 1-1: Current rating equations (100 % load factor) and calculation of losses -- General | IEC | Ed. 3.0, 2023-05-22, stability 2030 `[V]` | https://webstore.iec.ch/publication/68118 | METHOD: conductor AC resistance, dielectric, sheath and armour losses, steady-state rating equation. |
| Standard | IEC 60287-2-1 (thermal resistance) | IEC | Referenced by CIGRE TB 880. Edition not fetched this session. | (not fetched) | METHOD: T1-T4 thermal resistances, mutual heating. **Edition still to verify.** |
| Standard | IEC 60853-2:1989 Calculation of the cyclic and emergency current rating of cables -- Part 2 (cables >18/30(36) kV; emergency ratings all voltages) + AMD1:2008 | IEC | 1989 + Amd 1 2008 `[V]` | https://webstore.iec.ch/publication/3711 ; AMD1: https://webstore.iec.ch/publication/3710 | METHOD: cyclic factor M, emergency (transient) ratings. Part 1 (<=18/30 kV) not fetched. |
| Code | NFPA 70 National Electrical Code, 2026 edition -- Art. 310 tables; Informative Annex B (Neher-McGrath-based engineering ampacity) | NFPA | 2026 `[V]` (listing) | https://webstore.ansi.org/standards/nfpa/NFPA702026 ; https://shop.iccsafe.org/nfpa-70r-national-electrical-coder-necr-2026-edition.html | DATA: 310.16 etc. tables, adjustment/correction factors. METHOD: Annex B / 310.14(B) engineering supervision path. |
| Standard (legacy) | IEEE 835-1994 Standard Power Cable Ampacity Tables | IEEE | 1994; IEEE lists as **Inactive-Reserved** `[L]` | https://standards.ieee.org/standard/835-1994.html | ORACLE/DATA: large table set computed with Neher-McGrath. |

### 5.2 Papers / books

| Type | Title | Authors | Year | URL / DOI | Use |
|---|---|---|---|---|---|
| AIEE Trans. PAS Part III | The calculation of the temperature rise and load capability of cable systems | J. H. Neher, M. H. McGrath | 1957, vol. 76 no. 3, pp. 752-764 | DOI 10.1109/AIEEPAS.1957.4499653 ; https://manuscript.isc.ac/Inventory/49/1157268.htm `[V]` | METHOD: N-M equations (basis of NEC Annex B and IEEE 835). |
| Book | Rating of Electric Power Cables: Ampacity Computations for Transmission, Distribution, and Industrial Applications | G. J. Anders | IEEE Press (ISBN 9780780311770) | https://bookwire.bowker.com/book/USA/Rating-of-Electric-Power-Cables-9780780311770-Anders-George-J-47265147 `[L]` | METHOD: authoritative textbook bridging IEC 60287 and N-M. |
| Book | Rating of Electric Power Cables in Unfavorable Thermal Environment | G. J. Anders | Wiley (ISBN 978-0-471-67909-7) | https://www.wiley-vch.de/de/fachgebiete/ingenieurwesen/rating-of-electric-power-cables-in-unfavorable-thermal-environment-978-0-471-67909-7 `[L]` | METHOD: trays, risers, tunnels, crossings. |
| CIGRE TB | TB 880 Power cable rating examples for calculation tool verification (WG B1.56; convenor F. de Wild). 11 case studies: 10-400 kV AC and 320 kV HVDC; XLPE/SCFF/pipe-type; land/submarine; trefoil/flat; buried/duct/trough/air; bonding variants. | CIGRE | Electra 324, Oct 2022 | https://electra.cigre.org/324-october-2022/technical-brochures/power-cable-rating-examples-for-calculation-tool-verification ; purchase: https://e-cigre.org/publication/880-power-cable-rating-examples-for-calculation-tool-verification `[V]` | **ORACLE (primary)** for the IEC 60287 engine. |

### 5.3 Oracles

| Title | Source | URL | Use |
|---|---|---|---|
| CIGRE TB 880 Jupyter notebooks (GPL-2.0): Case 0-1 + single-point bonding + eddy-current variants; Case 0-2 trefoil in HDPE ducts; Case 0-5 unfilled trough | F. Mendoza (GitHub) | https://github.com/frdmendoza/cbl_CIGRE_TB880 `[V]` | ORACLE: step-by-step intermediate values. GPL: use for comparison only; do not copy code into a non-GPL product. |
| NEC Table 310.16 etc. | NFPA (licensed) | see 5.1 | ORACLE for the NEC-table path. |
| IEEE 835-1994 tables | IEEE (licensed) | see 5.1 | ORACLE for the N-M path. |

### 5.4 Manufacturer guides

| Title | Publisher | Year | URL | Use |
|---|---|---|---|---|
| Engineering Data for Copper and Aluminum Conductor Electrical Cables (EHB) -- Sec. 6 ampacity tables 6-1..6-25 (duct, direct burial, air, conduit); Sec. 3 reactance; Sec. 4 short-circuit withstand tables | Okonite | 2025 ed. `[V]` | https://www.okonite.com/media/catalog/product/files/EHB_2025.pdf | DATA + ORACLE: vendor-computed ampacities; conductor/shield I²t withstand. |

**Family 5 count:** 5 standards, 4 papers/books/brochures, 3 oracles, 1 manufacturer guide.

---

## 6. Harmonics (IEEE 519-2022)

### 6.1 Governing standards

| Type | Title | Publisher | Year/Status | URL | Use |
|---|---|---|---|---|---|
| Standard | IEEE 519-2022 Standard for Harmonic Control in Electric Power Systems | IEEE | Board approved 2022-05-13, published 2022-08-05; **Active**; supersedes 519-2014. An active PAR for revision exists. `[V]` | https://standards.ieee.org/ieee/519/10677/ ; PAR: https://standards.ieee.org/ieee/519/11811/ `[L]` | METHOD/DATA: voltage THD limits and current TDD limits vs Isc/IL at the PCC (tables are in the licensed text; the catalogue page does not show them). |
| Recommended practice | IEEE 3002.8-2018 Conducting Harmonic Studies and Analysis of Industrial and Commercial Power Systems | IEEE | 2018 `[L]` | https://reference.globalspec.com/ref/13068621/3002-8-2018 | METHOD: frequency scan, harmonic load flow, filter design procedure. |

### 6.2 Papers

| Type | Title | Authors | Year | URL / DOI | Use |
|---|---|---|---|---|---|
| IEEE Trans. PWRD | Test systems for harmonics modeling and simulation | R. Burch, G.-K. Chang, M. Grady, E. Gunther, M. Halpin, Y. Liu, M. Marz, T. Ortmeyer, V. Rajagopalan, S. Ranade, P. Ribeiro, T. Sim, W. Xu | 1999, vol. 14 no. 2 | DOI 10.1109/61.754106 ; https://manuscript.isc.ac/Inventory/49/1490693.htm `[V]` | ORACLE: defines 4 test systems with results. |
| IEEE Trans. PWRD | Modeling and simulation of the propagation of harmonics in electric power networks. I. Concepts, models, and simulation techniques | IEEE Task Force (authors not shown on record) | 1996, vol. 11 no. 1, pp. 452-465 | DOI 10.1109/61.484130 ; https://manuscript.isc.ac/Inventory/49/754862.htm `[V]` | METHOD: component harmonic models (lines, transformers, loads). |
| IEEE (Xplore doc 8320382) | A Benchmark Test System to Evaluate Methods of Harmonic Contribution Determination | incl. D. Mueller (EnerNex); full author list not confirmed | 2019 (per EnerNex page) | https://www.enernex.com/ieee-publications/a-benchmark-test-system-to-evaluate-methods-of-harmonic-contribution-determination/ ; https://ieeexplore.ieee.org/document/8320382 `[V]`/`[L]` | ORACLE: harmonic-responsibility benchmark. |

### 6.3 Oracles

| Title | Source | URL | Use |
|---|---|---|---|
| IEEE Harmonics Modeling & Simulation TF downloads: Test System 1 (14-bus balanced transmission, case1.zip + **Aug 2024 corrections PDF**), TS2 (13-bus unbalanced distribution), TS3 (13-bus balanced industrial), TS4 (10-node unbalanced commercial), BM_TS_HC-3 (2019 benchmark), Example.zip (ATP/Matlab guide) | IEEE PES Harmonics WG | https://sagroups.ieee.org/harmonicswg/harmonics-modeling-and-simulation-task-force `[V]` ; corrections: https://sagroups.ieee.org/harmonicswg/wp-content/uploads/sites/445/2024/08/Corrections.pdf `[L]` | **ORACLE (primary, free).** |
| Harmonic Benchmark Test System (MATLAB File Exchange) | MathWorks community | https://au.mathworks.com/matlabcentral/fileexchange/158736-harmonic-benchmark-test-system `[L]` | ORACLE (secondary). |

### 6.4 Manufacturer guides

| Title | Publisher | Year | URL | Use |
|---|---|---|---|---|
| Cahier Technique 152: Harmonic disturbances in networks, and their treatment | Schneider Electric | v1.0, 1999-12-01 `[V]` | https://www.se.com/us/en/download/document/ECT152/ | METHOD: resonance, filter basics. |
| Cahier Technique 199: Power quality | Schneider Electric | `[L]` | https://www.se.com/au/en/download/document/ECT199 | CONTEXT. |
| Technical Application Papers No. 8: Power factor correction and harmonic filtering in electrical plants | ABB | year not stated `[V]` | https://library.e.abb.com/public/4704e67320c08992c1257870002e4700/1SDC007107G0202.pdf | METHOD: capacitor bank + detuned filter sizing. |
| VFD harmonics solutions (BR04007002E) | Eaton | `[L]` | https://www.eaton.com/content/dam/eaton/products/industrialcontrols-drives-automation-sensors/variable-frequency-drives/vfd-harmonics-solutions-br04007002e.pdf | DATA: typical drive current spectra (6/12/18-pulse, AFE). |

**Family 6 count:** 2 standards, 3 papers, 2 oracle sets, 4 manufacturer guides.

---

## 7. Grounding (IEEE 80-2013; IEEE 142)

### 7.1 Governing standards

| Type | Title | Publisher | Year/Status | URL | Use |
|---|---|---|---|---|---|
| Guide | IEEE 80-2013 Guide for Safety in AC Substation Grounding (+ Cor 1-2015 merged in: Clauses 11, 17, Annexes C, H) | IEEE | Published 2015-05-15; **Inactive-Reserved since 2024-03-21**. No replacement named. `[V]` | https://standards.ieee.org/findstds/standard/80-2013.html | METHOD: tolerable touch/step (Dalziel, Cs), Rg (Sverak), Km/Ks/Ki, Sf/Df/IG, Annex B examples. Use the **corrigendum-corrected** text. |
| Revision project | P80 Guide for Safety in AC Substation Grounding (PAR approved 2025-09-10) | IEEE | Active PAR `[V]` | https://standards.ieee.org/ieee/80/12145/ | Watch item: equations may change in the next edition. |
| Guide | IEEE 81-2012 Guide for Measuring Earth Resistivity, Ground Impedance, and Earth Surface Potentials | IEEE | 2012; IEEE page title shows Inactive-Reserved `[L]` | https://standards.ieee.org/ieee/81/4889 | METHOD/DATA: Wenner/Schlumberger data reduction to 2-layer soil. |
| Recommended practice (legacy) | IEEE 142-2007 Grounding of Industrial and Commercial Power Systems (Green Book) | IEEE | 2007; **Inactive-Reserved** `[L]` | https://standards.ieee.org/findstds/standard/142-2007.html | METHOD (reference): system grounding, equipment grounding. |
| Recommended practice | IEEE 3003.1-2019 System Grounding of Industrial and Commercial Power Systems | IEEE | 2019 `[L]` | https://standards.ieee.org/ieee/3003.1/4438 | METHOD: current replacement for Green Book system-grounding content. |

### 7.2 Papers

| Type | Title | Authors | Year | URL / DOI | Use |
|---|---|---|---|---|---|
| IEEE Power Eng. Review | Simplified equations for mesh and step voltages in an AC substation | B. Thapar, V. Gerez, A. Balakrishnan, D. A. Blank | 1991, vol. 11 no. 4 | DOI 10.1109/MPER.1991.88844 ; https://manuscript.isc.ac/Inventory/49/1414801.htm `[V]` | METHOD: basis of the IEEE 80 Km/Ks/Kh/Ki equations. |
| IEEE Trans. PAS | Optimum design of substation grounding in a two layer earth structure: Part II -- Comparison between theoretical and experimental results | F. Dawalibi, D. Mukhedkar | 1975, vol. 94 no. 2, pp. 262-266 | DOI 10.1109/T-PAS.1975.31850 ; https://manuscript.isc.ac/Inventory/49/847619.htm `[V]` | ORACLE: 2-layer soil model vs measurement. Part I (analytical) record: https://publications.polymtl.ca/62878/ `[L]` |
| Tutorial slides | IEEE Std 80 Grounding Guide overview (design steps, Dalziel limits for 50/70 kg, C-factor, Km/Ks, Sf). **No worked example.** | D. L. Garrett for R. Keil (IEEE Substations Committee WG D7), 2011-05-19 | 2011 | https://ewh.ieee.org/cmte/substations/scm0/Chicago%20Meeting/Conference%20PDFs/tutorial%20handouts/Colloquium/Grounding%20Guide%2080%20-%20Garrett.pdf `[V]` | CONTEXT: design-step checklist for the UI. Based on IEEE 80-2000. |

### 7.3 Oracles
- IEEE 80-2013 Annex B example grid designs (licensed). This is the main oracle; no free copy is available.
- No free numerical grounding benchmark was located.

### 7.4 Manufacturer guides

| Title | Publisher | Year | URL | Use |
|---|---|---|---|---|
| Cahier Technique 172: System earthings in LV | Schneider Electric | v1.0, 2004-12-01 `[V]` | https://www.se.com/uk/en/download/document/ECT172/ | METHOD (IEC TN/TT/IT): fault loop and touch voltage. |
| Cahier Technique 173: Earthing systems worldwide and evolutions | Schneider Electric | `[L]` | https://www.se.com/au/en/download/document/ECT173 | CONTEXT. |

**Family 7 count:** 5 standards/projects, 3 papers/tutorials, 0 free oracles, 2 manufacturer guides. **Weak on free oracles.**

---

## 8. PV / BESS / IBR fault contribution (IEEE 2800; IEEE 1547-2018; NREL/EPRI)

### 8.1 Governing standards

| Type | Title | Publisher | Year/Status | URL | Use |
|---|---|---|---|---|---|
| Standard | IEEE 2800-2022 Interconnection and Interoperability of Inverter-Based Resources Interconnecting with Associated Transmission Electric Power Systems | IEEE | Approved 2022-02-09, published 2022-04-22; **Active** `[V]` | https://standards.ieee.org/ieee/7003/10453/ (resolves to the IEEE 2800-2022 page) | METHOD: IBR fault-current requirements (positive- and negative-sequence injection, response time) used to build IBR short-circuit models. |
| Recommended practice | IEEE 2800.2 Test and Verification Procedures for IBRs Interconnecting with Bulk Power Systems | IEEE | WG page says the draft went to ballot in May 2025; reseller lists **IEEE 2800.2-2026 (2026-06-30)** `[L]` | https://sagroups.ieee.org/2800-2 ; https://eshop.normservis.sk/norma/ieee-2800-2-2026-30.6.2026.html | ORACLE/CONTEXT: model-verification procedures. Confirm publication. |
| Standard | IEEE 1547-2018 Interconnection and Interoperability of DER with Associated EPS Interfaces (+ Amendment 1547a-2020; revision P1547 active) | IEEE | Published 2018-04-06; **Active** `[V]` | https://standards.ieee.org/ieee/C2/5915/ (resolves to the 1547-2018 page) ; 1547a: https://standards.ieee.org/ieee/1547a/7696/ `[L]` | METHOD: ride-through and trip categories that bound how long a DER feeds a fault. |
| Standard | IEEE 1547.1-2020 Conformance Test Procedures | IEEE | 2020 `[L]` | https://sagroups.ieee.org/scc21/standards/standards-1547-1 | CONTEXT. |
| Standard | IEC 60909-0 (2016 sec. on full-size converters; 2026 ed.) | IEC | see 1.1 | see 1.1 | METHOD: converter = positive-sequence current source (k·IrG), no DC component. |

### 8.2 Papers / technical reports

| Type | Title | Authors / Org | Year | URL | Use |
|---|---|---|---|---|---|
| NREL TP | Understanding Fault Characteristics of Inverter-Based Distributed Energy Resources (NREL/TP-550-46698). Findings: rule of thumb ~2x rated; tests 2-5x rated for 1-4.25 ms; 1 MW LVRT ~1.2x for ~7 cycles. | J. Keller, B. Kroposki | Jan 2010 | https://www.nrel.gov/docs/fy10osti/46698.pdf `[V]` | DATA: default IBR fault multipliers and durations. |
| NREL TP | A Comprehensive Study of the Impact of IBR Modeling and Control on Protection Relay Elements (NREL/TP-5D00-94430). GFL/GFM; current-limiter design and negative-sequence behaviour (IEEE 2800 compliance) drive relay outcomes. | J. Wang, P. H. Pinheiro, S. Chakraborty, B. Johnson, R. G. Bainy, A. Hoke | 2025 | https://www.osti.gov/servlets/purl/3011876 `[V]` | METHOD/CONTEXT: which IBR model features the SC engine must expose. |
| EPRI report | Short-Circuit Modeling and Protection System Performance Analysis for Systems with High Levels of IBRs (product 3002028606) | EPRI | Dec 2023 | https://restservice.epri.com/publicdownload/000000003002028606/0/Product `[V]` | METHOD: GFL/GFM short-circuit model forms for phasor tools. |
| DOE/EPRI report | Adaptive Protection and Validated Models to Enable Deployment of High Penetrations of Solar PV (PV-MOD), DE-EE0009019 | EPRI (authors not shown) | (year not stated) | https://www.osti.gov/biblio/2477678 ; DOI 10.2172/2477678 `[V]` | DATA/ORACLE: generic validated PV models. |
| DOE SETO report | Utilities Perspective on Protection Challenges with High IBR Penetration (PG&E-led team incl. Sandia, ETAP, Quanta) | project team | ~2023+ | https://www.osti.gov/servlets/purl/2458239 `[V]` | CONTEXT: 9 field fault events; modelling gaps. |
| IEEE PES TR | Protection Challenges and Practices for Interconnecting IBRs to Utility Transmission Systems (TR-81, PSRC WG C32) | IEEE PES PSRC | 2020-07-20 (paid for non-members) | https://resourcecenter.ieee-pes.org/publications/technical-reports/pes_tp_tr81_psrc_wgc32_071520 `[V]` | METHOD/CONTEXT. |
| Slides | Fault current contribution from DG -- summary of IEC 60909-0:2016 converter treatment. Notes that 60909 ignores converter dynamics. | T. I. Reigstad, SINTEF Energi | 2016 | https://www.ntnu.edu/documents/1263763591/1269572391/SINTEF+Reigstad+Fault+current+contribution+from+DG.pdf/261b6be5-95ed-4318-a5a6-3f09703653aa `[V]` | CONTEXT. |

### 8.3 Oracles
- IEEE PES "DG Protection Test Case" (2011) -- https://cmte.ieee.org/pes-testfeeders/resources `[V]`.
- pandapower renewables short-circuit tutorial (see 1.3).
- No free, published IBR fault-current benchmark with numeric results was located. **Gap.**

### 8.4 Manufacturer guides
- None located this session. Inverter fault data is normally in each vendor's datasheet or OEM fault-current letter; the tool needs a per-device data field.

**Family 8 count:** 5 standards, 7 reports/papers, 2 oracles, 0 manufacturer guides.

---

## 9. DC short circuit (IEC 61660)

### 9.1 Governing standards

| Type | Title | Publisher | Year/Status | URL | Use |
|---|---|---|---|---|---|
| Standard | IEC 61660-1:1997 Short-circuit currents in d.c. auxiliary installations in power plants and substations -- Part 1: Calculation of short-circuit currents (sources: rectifiers, stationary lead-acid batteries, smoothing capacitors, DC motors; corrigenda 1999 & 2000 included) | IEC | Ed. 1.0, 1997-06-17, stability 2028 `[V]` | https://webstore.iec.ch/publication/5700 ; COR1 https://webstore.iec.ch/publication/5702 ; COR2 https://webstore.iec.ch/publication/5701 | METHOD: standard approximation function (ip, tp, Ik, tau1, tau2) per source and superposition. **Lithium batteries and active converters are outside scope.** |
| Recommended practice | IEEE 946-2020 DC auxiliary power systems for generating stations | IEEE | 2020, Active; revision PAR active `[L]` | https://standards.ieee.org/standard/946-2020/ | METHOD/DATA: battery short-circuit estimation in the IEEE context. |

### 9.2 Papers

| Type | Title | Authors | Year | URL / DOI | Use |
|---|---|---|---|---|---|
| IEEE Trans. IA | A General Methodology for Short-circuit Calculations in Hybrid AC/DC Microgrids | S. Favuzza, M. Mitolo, S. Moradi, R. Musca, G. Zizzo | 2023, vol. 59 no. 3, pp. 2742-2749 | DOI 10.1109/TIA.2023.3234232 ; post-print https://iris.unipa.it/retrieve/27a53cb3-12e4-45ed-91a9-27c113a971d1/POST_PRINT.pdf `[V]` | METHOD built on IEC 61660 equations. **ORACLE:** 4 case studies; underground-station microgrid 22.13 kA vs 21.77 kA in Neplan (1.6%). |
| IEEE PES GM | Estimation of short circuit currents in mesh DC networks | X. Feng, Q. Lin, Z. Wang | 2014 | DOI 10.1109/PESGM.2014.6939074 ; https://manuscript.isc.ac/Inventory/49/135010.htm `[V]` | METHOD: meshed DC networks (beyond 61660's radial focus). |
| IEEE Trans. IA | Das, Arc-flash in LV/MV DC -- Part I: Short-circuit calculations (see 4.2) | J. C. Das | 2014 | DOI 10.1109/TIA.2013.2288416 | METHOD: battery/rectifier/motor DC fault currents. |

### 9.3 Oracles
- Favuzza et al. 2023 case studies (post-print, free).
- IEC 61660-2 / IEC TR 61660-3 (examples) were **not located** this session.

### 9.4 Manufacturer guides

| Title | Publisher | URL | Use |
|---|---|---|---|
| Protection Devices for Direct Current Applications -- Technical Application Paper (9AKK108470A9606 rev B). Discusses IEC 61660-1 scope limits; PV string/array Isc per IEC 62548. | ABB | https://library.e.abb.com/public/5cd83dcb95a74dcdb571be5f256e1af8/9AKK108470A9606_en_B_Protection%20Devices%20for%20Direct%20Current%20Applications%20-%20Technical%20Application%20Paper.pdf `[V]` | METHOD/DATA: PV and battery DC fault estimation, breaker selection. |

**Family 9 count:** 2 standards (+2 corrigenda), 3 papers, 1 oracle, 1 manufacturer guide. **Thin.** BESS-specific (Li-ion) DC fault methods have no IEC standard; use vendor battery Isc/R data.

---

## 10. Motor starting and voltage dip (IEEE 399 / 3002.7)

### 10.1 Governing standards

| Type | Title | Publisher | Year/Status | URL | Use |
|---|---|---|---|---|---|
| Recommended practice | IEEE 3002.7-2018 Conducting Motor-Starting Studies and Analysis of Industrial and Commercial Power Systems | IEEE | 2018, **Active** `[L]` | https://standards.ieee.org/ieee/3002.7/4435 | METHOD: static (locked-rotor impedance), dynamic (speed-torque), transient methods; acceptance criteria. |
| Recommended practice (legacy) | IEEE 399-1997 Power Systems Analysis (Brown Book) | IEEE | **Inactive-Reserved** `[L]` | https://standards.ieee.org/ieee/399/613 | METHOD (legacy). |

### 10.2 Papers

| Type | Title | Authors | Year | URL / DOI | Use |
|---|---|---|---|---|---|
| IEEE IAS PCIC 2026 | Comprehensive Analysis of Induction Motor Starting in Islanded Systems Using IEEE Std 3002.7-2018 Methods (12,500 hp BOG compressor, islanded LNG) | B. Darnell; M. Jagtap, A. R. Khatib, D. Sharma (SEL) | 2026 | https://selinc.com/api/download/141966/?lang=en-us `[V]` | METHOD + ORACLE: static vs dynamic vs transient comparison on one case. SEL-hosted (also counts as manufacturer paper). |
| IEEE Trans. IA | Evaluating the Effects of Motor Starting on Industrial and Commercial Power Systems | A. J. Williams Jr., M. S. Griffith | 1978 | DOI 10.1109/TIA.1978.4503541 ; https://manuscript.isc.ac/Inventory/49/1190913.htm `[V]` | METHOD: classic voltage-dip procedure. |
| IEEE Trans. IGA | Service to Induction Motors | A. W. Cain | 1971 | DOI 10.1109/TIGA.1971.4181306 ; https://manuscript.isc.ac/Inventory/49/836054.htm `[V]` | CONTEXT. |
| IEEE IAS Annual Meeting | A simple methodology for estimating the effect of voltage sags produced by induction motor starting cycles on sensitive equipment | J. C. Gomez, M. M. Morcos | 2001 | DOI 10.1109/IAS.2001.955648 ; https://manuscript.isc.ac/Inventory/49/1617401.htm `[V]` | METHOD: sag-vs-equipment-tolerance check. |

### 10.3 Oracles
- The SEL PCIC 2026 case study (parameters in the paper).
- No free benchmark dataset was located. IEEE 3002.7 examples are licensed.
- Flicker (IEEE 1453-2022 listing: https://store.sfs.fi/fi/ieee-1453-2022 `[L]`) is relevant if repeated starts must be checked.

### 10.4 Manufacturer guides

| Title | Publisher | URL | Use |
|---|---|---|---|
| Cahier Technique 207: Electric motors... and how to improve their control and protection (French copy located) | Schneider Electric | https://sti.eduscol.education.fr/sites/eduscol.education.fr.sti/files/ressources/techniques/690/690-ct207-moteurs-elec.pdf `[L]` | METHOD: starting methods (DOL, star-delta, soft starter) current/torque ratios. |
| Cahier Technique 211: The protection of LV motors | Schneider Electric | https://www.se.com/lt/lt/download/document/ECT211/ `[L]` | DATA. |

**Family 10 count:** 2 standards (+1 flicker reference), 4 papers, 1 oracle, 2 manufacturer guides (+SEL paper).

---

## 11. Reliability (IEEE 493 Gold Book; IEEE 1366)

### 11.1 Governing standards

| Type | Title | Publisher | Year/Status | URL | Use |
|---|---|---|---|---|---|
| Recommended practice | IEEE 493-2007 Design of Reliable Industrial and Commercial Power Systems (Gold Book) | IEEE | 2007; revision **P493 Active PAR (2023-11-08)** `[V]` | https://ieeexplore.ieee.org/document/4264700 `[L]` ; PAR https://standards.ieee.org/ieee/493/11449/ `[V]` | METHOD + DATA: minimal cut-set / network reduction; equipment failure-rate and repair-time tables. |
| Guide | IEEE 1366-2022 Guide for Electric Power Distribution Reliability Indices | IEEE | Published 2022-11-22; **Active**; supersedes 1366-2012 `[V]` | https://standards.ieee.org/standard/1366-2022.html | METHOD: SAIFI, SAIDI, CAIDI, MAIFI, etc.; major-event-day (2.5-beta) method. |
| Recommended practice | IEEE 3006.5-2014 Use of Probability Methods for Conducting a Reliability Analysis of Industrial and Commercial Power Systems | IEEE | 2014, **Active** `[L]` | https://standards.ieee.org/ieee/3006.5/5448 | METHOD: replacement for Gold Book probability methods. |

### 11.2 Papers

| Type | Title | Authors | Year | URL / DOI | Use |
|---|---|---|---|---|---|
| IEEE Trans. PWRS | A reliability test system for educational purposes -- basic distribution system data and results (RBTS distribution) | R. N. Allan, R. Billinton, I. Sjarief, L. Goel, K. S. So | 1991, vol. 6 no. 2, pp. 813-820 | DOI 10.1109/59.76730 ; https://search.isc.ac/inventory/49/1514963.htm `[V]` | **ORACLE:** feeder load-point and system indices. |
| IEEE Trans. PWRS | A reliability test system for educational purposes -- basic results | R. Billinton, S. Kumar, N. Chowdhury, K. Chu, L. Goel, E. Khan, P. Kos, G. Nourbakhsh, J. Oteng-Adjei | 1990, vol. 5 no. 1, pp. 319-325 | DOI 10.1109/59.49123 ; https://manuscript.isc.ac/Inventory/49/840880.htm `[V]` | ORACLE (generation/composite). |
| IEEE Trans. PWRS | The IEEE Reliability Test System-1996 | P. Wong, P. Albrecht, R. Allan, R. Billinton, et al. (C. Grigg chaired) | 1999, vol. 14 no. 3, pp. 1010-1020 | DOI 10.1109/59.780914 ; https://manuscript.isc.ac/Inventory/49/1536410.htm ; PDF https://home.engineering.iastate.edu/jdm/ee553/IEEE-RTS1996.pdf `[L]` | DATA/ORACLE: incl. breaker reliability data table. |
| IEEE Trans. IA | Report on Reliability Survey of Industrial Plants, Part I: Reliability of Electrical Equipment | IEEE committee (authors not shown) | 1974, pp. 213-235 | DOI 10.1109/TIA.1974.349139 ; https://manuscript.isc.ac/inventory/49/790875.htm `[V]` | DATA: origin of the Gold Book failure-rate tables. |

### 11.3 Oracles

| Title | Source | URL | Use |
|---|---|---|---|
| IEEE RTS-1979 and RTS-1996 data (15 tables incl. generator & breaker reliability) | UW Power Systems Test Case Archive | https://www2.ee.washington.edu/research/pstca/rts/pg_tcarts.htm `[V]` | ORACLE/DATA. |
| RBTS distribution results (Allan et al. 1991) | paper | above | ORACLE for the SAIFI/SAIDI engine. |

### 11.4 Manufacturer guides
None located. Reliability data are IEEE survey-based, not vendor-based.

**Family 11 count:** 3 standards, 4 papers, 2 oracles, 0 manufacturer guides.

---

## 12. Voltage drop and NEC load calculations

### 12.1 Governing standards / codes

| Type | Title | Publisher | Year/Status | URL | Use |
|---|---|---|---|---|---|
| Code | NFPA 70 National Electrical Code 2026 -- Art. 220 (load calculations), 210.19/215.2 informational notes (3%/5% voltage-drop guidance), Chapter 9 Tables 8 & 9 (conductor R and effective Z), Informative Annex D (calculation examples) | NFPA | 2026 `[V]` listing | https://webstore.ansi.org/standards/nfpa/NFPA702026 | METHOD + DATA + ORACLE (Annex D examples; licensed; content not checked this session). |
| Standard | IEC 60364-5-52:2009 Selection and erection of electrical equipment -- Wiring systems (voltage-drop Annex G; consolidated version exists) | IEC | Ed. 3.0 2009; consolidated pub. 103734 `[L]` | https://webstore.iec.ch/publication/1878 ; consolidated https://webstore.iec.ch/en/publication/103734 | METHOD/DATA for IEC projects (b-factor, rho, lambda reactance). |
| Recommended practice (legacy) | IEEE 141-1993 (Red Book) -- voltage-drop approximation formula | IEEE | 1993, legacy `[L]` | https://standards.nimonik.com/products/ieee/ieee-141/ | METHOD: Vd ≈ I(R cosφ + X sinφ) and exact-form correction. |

### 12.2 Papers / articles
Peer-reviewed literature here is minimal (these are textbook methods). Located:

| Type | Title | Author | Year | URL | Use |
|---|---|---|---|---|---|
| Trade journal (IAEI) | Voltage Drop Calculations -- K-factor method on Ch. 9 Table 8 (K = 12.9 Cu, 21.2 Al at 75 °C; ×1.732 for 3-ph). Worked examples: 3% on 240 V; 440 V/180 A/620 ft Al RHW, 500 kcmil drops 13.4 V in steel conduit (so 600 kcmil, 12.3 V) vs 11.9 V in nonmagnetic. | IAEI (excerpt of *Ferm's Formulas and Calculations*, 2014) | 2019-10-15 | https://iaeimagazine.org/electrical-fundamentals/voltage-drop-calculations/ `[V]` | ORACLE: simple numeric tests for the Table 8 and Table 9 paths. |
| Course notes | Voltage drop tables / content (PDHonline E426) | PDHonline | n/a | https://pdhonline.com/courses/e426/e426content.pdf `[L]` | ORACLE (secondary). |

### 12.3 Oracles
- IAEI worked examples (free).
- NEC Informative Annex D examples (licensed). **Must be bought to validate Art. 220 dwelling/commercial calcs.**

### 12.4 Manufacturer guides

| Title | Publisher | URL | Use |
|---|---|---|---|
| Okonite EHB 2025, Sec. 3 Voltage Regulation (reactance Table 3-1) | Okonite | https://www.okonite.com/media/catalog/product/files/EHB_2025.pdf `[V]` | DATA: X per conductor size/spacing for the exact voltage-drop formula. |
| Eaton Bussmann electrical plan review (NEC compliance, available fault current & SCCR) | Eaton | https://www.eaton.com/content/dam/eaton/products/electrical-circuit-protection/fuses/technical-literature/bus-ele-an-3015-electrical-plan-review.pdf `[L]` | CONTEXT: NEC 110.9/110.10 checks linked to the load-calc report. |

**Family 12 count:** 3 standards/codes, 2 articles, 1 free oracle (+Annex D licensed), 2 manufacturer guides. **Thin on authoritative free sources.**

---

## Summary counts (located this session)

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

## Gaps and what needs licensed access

### A. Standard texts that must be bought (needed for equations, constants and official examples)
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

### B. Paywalled papers (DOIs verified; full text needs IEEE Xplore / IOP access)
All IEEE Transactions papers listed above, except those with an open copy (Schneider et al. 2018 on OSTI; Favuzza et al. 2023 post-print; NREL and EPRI reports; arXiv preprints).

### C. Sources searched for but NOT located (do not cite until found)
- **Stokes & Oppenlander (1991) "Electric arcs in open air"**, the primary J. Phys. D paper. Only seen cited through NREL ESW2021-05.
- **Paukert DC arc model**: not searched separately and not found in the NREL paper.
- SEL application guides on TOC curve equations (only third-party copies surfaced).
- A free numeric **IBR fault-current benchmark** with published results.
- A free **IEEE 80 grounding-grid benchmark** (Annex B is licensed).
- **IEC 61660-2 / TR 61660-3** example documents.
- **Li-ion BESS DC short-circuit method** from a standards body (none exists in IEC 61660-1 scope; ABB TAP confirms the scope limit).
- Siemens application guides (only third-party copies on Scribd surfaced; not cited).
- Peer-reviewed validation papers for NEC voltage-drop or Art. 220 load-calc methods (none expected; these are code methods).

### D. Licence cautions for oracles
- IEEE DataPort arc-flash calculators: BSD-3, but the page says they are **not part of IEEE 1584-2018**, and the "_M" workbook has reported discrepancies vs Annex D.1.
- `LiaungYip/arcflash`: MIT (safe to reuse test vectors with attribution).
- `frdmendoza/cbl_CIGRE_TB880`: **GPL-2.0**. Compare results only; do not copy code into a closed product.
- OpenDSS: BSD. pandapower: open source (licence not checked this session; verify before bundling).
- IEEE Arc Flash Phenomena dataset: IEEE DataPort subscription required.

### E. Status changes the developer must handle in the UI
- IEC 60909-0: 2016 replaced by 2026 (Ed. 3.0).
- IEEE 551-2006, 242-2001, 399-1997, 142-2007, 80-2013, 835-1994 and (per listing) 81-2012 are **Inactive-Reserved**. Label them "legacy reference" and point to the IEEE 3000-series (3002.x, 3003.1, 3006.5) where one exists.
- NFPA 70E: 2027 edition now listed. NFPA 70: 2026 edition.
- Active revision projects to watch: P1584, P80, P493, P1547, IEEE 519 PAR.
