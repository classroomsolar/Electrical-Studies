# V33 audit report (list B) — 15 November 2026

This is a screening audit. It is not a full engineering acceptance. Every check below has a script that can be run again.

## B1 — calculators against published numbers
Expected values were typed into the test scripts from the public sources named in each script. They were not read from the site.

| Script | Source of the expected values | Result |
|---|---|---|
| `QA/V33_AUDIT/ieee1584_published.mjs` | IEEE 1584-2018 worked results published by Eaton (ESW2020-45: 480 V, 50 kA, gap 32 mm, 24 in, 20×20 in box, 2000 ms; VCB, VCBB, HCB) and IEEE 1584-2018 Annex D (4.16 kV / 15 kA and 0.48 kV / 45 kA cases) | 21 / 21 match (arcing current, incident energy, arc-flash boundary) |
| `QA/V33_AUDIT/iec60909_published.mjs` | Schneider Electric Electrical Installation Guide Fig. G71 (630 kVA, c·Un = 1.05 × 400 V, printed to 1 kA); EasyPower IEC 60909 slides (400 kVA and 1600 kVA examples, c = 1); IEC 60909-0 eq. (55) for κ | 28 / 28 match |
| `QA/V33_AUDIT/tables_published.mjs` | IEEE 519-2014 Tables 1, 2, 3; NEC 2023 Tables 250.122, 240.6(A), 240.4(D) | 46 / 46 match |

Notes:
- The EIG case also checks that the program adds R and X separately (|Z| 11.8 / 13.0 / 13.8 mΩ) and that IEC 60909 method C gives the same κ as the radial formula on a single path.
- The 0.48 kV Annex D enclosure depth (254 mm) is inferred from the published result; the other inputs are as printed.
- Not checked against published cases (no free worked example found, or the calculator does not exist): IEC TR 60909-4 multi-source example, IEEE 399/551 examples, ANSI C37 multiplying factors, IEC 61660 / IEEE 946 DC examples, IEC 60287 / 60853 cable ratings, IEEE 80 grounding (the site has no IEEE 80 calculator), manufacturer TCC curve points.
- The main network engine was not compared with a published multi-bus case in this round. It is still covered by the 220 oracle networks and the V32-vs-V33 comparison (4.8 million values, 0 differences).

## B2 — code audit (automatic part)
| Check | Finding |
|---|---|
| `eval(` / `new Function(` | Only `engine.mjs` has a method named `eval` — it evaluates the formula AST; no JavaScript is run from text. No `new Function`. |
| Text typed by a user shown as page code | 74 fields, 26 browser checks pass (`QA/V33_SECURITY/xss_browser.py`). |
| CSV / Excel formula injection | Pass (`QA/V33_SECURITY/csv_formula.py`). |
| `localStorage.setItem` without try/catch | Several modules. A full browser storage (quota) throws and the action stops with a console error. Low risk; listed in the backlog. |
| Cloud Vault recovery key | Kept in browser storage by design and shown to the user. Low risk; listed. |
| Line-by-line review of every module | **Not done.** |

## B3 — layout and accessibility at 360 / 768 / 1280 / 1440 / 1920 px
`QA/V33_UX/ux_widths.py` (axe-core 4, WCAG 2.0/2.1/2.2 A and AA rules) on the main studio and 14 tools, at five widths. Results: `QA/V33_UX/results/ux_widths.json`.

| Finding | Where | Severity |
|---|---|---|
| No sideways page scroll and no element cut off at the right edge | All views, all widths | Pass |
| `label-content-name-mismatch` — the one-line diagram symbols (transformer, cable) have an accessible name that does not contain their visible text | One-line diagram SVG, every view that shows it | Serious (WCAG 2.5.3). Open. |
| `nested-interactive` — focusable SVG groups inside a focusable diagram | One-line diagram SVG | Serious (WCAG 4.1.2). Open. |
| `label` — the "original backup" file input has no label | Cloud Vault | Critical (WCAG 4.1.2 / 1.3.1). Open, one-line fix. |
| 89 visible targets smaller than 24 × 24 px per width (axe accepts them by spacing) | Small icon buttons and table controls | Check by hand (WCAG 2.5.8) |

Nielsen heuristics and a manual screen-reader pass: **not done**.

## B4 — comparison with other tools
Paid tools (ETAP, SKM, EasyPower) are not used: the calculator is free and must be checked with free means. Comparison with free, open tools (pandapower IEC 60909 short circuit, OpenDSS load flow) on the same networks is **not done yet**. The IEEE 1584 Annex D values above are published results printed in the standard.

## Found while testing (not in list B)
- 390-px phone emulation, 1,970-bus plant, Operating studies: a **mouse** click on "Enter 0 MW / 0 Mvar at the blank buses" does not complete within 8 s when the new bus-table button (`operating-table-ui-v33.mjs`) is on the page. A **tap** on the same button works, a desktop mouse click works, and the same click works without the new script. Real phones tap, so users are probably not affected, but the cause is not found. This is the third failure in `QA/V33_VERIFY/a1_verify.py` (now 122 pass, 3 fail, 2 not tested; before the C4 change: 124 pass, 2 fail).
