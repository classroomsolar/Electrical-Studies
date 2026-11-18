# Fault Current Studio V28 — bounded conductor I²t screen and comprehensive V20/V27 export QA

**Status: validated offline cumulative candidate; NOT deployed to public Wix; NOT a fully accepted engineering platform.**

## Preserved project and source

This is an incremental continuation of V27, itself descended from V20. The complete original V27 234-file website was retained: **233 files byte-for-byte unchanged, one file (`index.html`) changed only to load a new independent module, two new files added, zero files removed**. The new complete website has **236 files**. The entire V27 cumulative recovery ZIP is embedded without modification, preserving the previous V26→V20→V19→older historical chain. No existing browser-local saved-study keys, project schema, Cloud Vault, reports, OEM catalogue or original private owner data were altered. The V28 site source and full cumulative package have SHA-256 manifests.

## New functional study (V28)

`conductor-duty-v28.mjs` implements a bounded **single-conductor adiabatic short-circuit I²t thermal screening**: `I²t <= (k S)²`, using explicitly entered conductor cross-sectional area S in mm², user-qualified k in A√s/mm², conductor material and temperature limits, and independent traceable sources. Three current-input methods: (1) constant RMS and clearing time, (2) exact I² integral for a documented *piecewise-linear RMS* current trace, and (3) externally documented I²t. The output includes raw/adjusted thermal stress, permissible adiabatic stress, minimum area for the entered case, maximum constant RMS for entered duration, and pass/fail against the **entered assumptions**. No manufacturer k values are auto-selected. The user-entered margin is ≥1. No parallel conductor sharing, protective device clearing curve, dynamic waveform/DC offset or non-adiabatic correction is inferred.

`conductor-duty-ui-v28.mjs` adds a responsive accessible modal, illustrative input, calculations, JSON/PDF/XLSX reports and a **separate isolated browser-local input-case archive** with merge-only import, save and reopen. Existing advanced 16 modes and their saved-case format are untouched.

## V20 priority: resolved local 32-export isolation

- Opened and SHA-256 verified **all 232 entries** in the original V20 handoff manifest; archive CRC passed.
- Reproduced the exact **11th automatic-download timeout** in Chromium after five modes × PDF/XLSX, with no JS page errors and a successful report-generation status. The `multisequence` PDF succeeds in a fresh context. This is consistent with **browser per-origin automatic multiple-download gating**, not a proven malformed PDF or calculation failure. The hosted HTTP 429 from the previous handoff remains a separate issue; it was **not reproduced or cleared** in a live remote Chromium session.
- Isolated download contexts to batches of **four modes (eight downloads)**, with **no requests to Wix**. Verified all **16 modes × PDF/XLSX × desktop/mobile** for both original **V20 and V27**: **128 actual browser downloads** total, all parsed as valid PDF or XLSX.
- Independently checked **19,848 input/output data paths across 128 documents** (9,924 unique path checks in PDFs and 9,924 in Excel), including source labels, numeric values, status, warning text, exact row counts, and workbook sheets. All passed. V20 and V27 both pass; V27's improved report engine remains unchanged in V28.

## V28 engineering and UI QA

- **1,200** deterministic transformer nameplate scenarios, **24,000** numeric comparisons of the original V20/V27 transformer function against independently coded Python complex arithmetic, **zero mismatches**. **16** invalid transformer inputs rejected.
- **1,500** deterministic conductor-duty scenarios across three methods, **9,000** independent Python-vs-JavaScript numeric comparisons, **zero mismatches**. **27** invalid inputs rejected.
- **18** V28 browser downloads (three methods × PDF/XLSX/JSON × desktop/mobile), with PDF text and Excel sheet contents checked. Browser save/reopen/recalculation and unchanged legacy project/studies storage sentinel checks passed.
- **236** complete website files, **all** JS/MJS syntax checks passed, no deleted prior files. Source and archive hash/CRC verification passed.

## Verified primary manufacturer/software source context

- DIgSILENT PowerFactory knowledge base explicitly gives the IEC 60909-0:2016 transformer correction factor `Kt = 0.95*cmax/(1+0.6*xt)` and explains its application to both maximum and minimum fault calculations: https://faq.digsilent.de/en/faq-reader-powerfactory/why-are-the-results-of-short-citcuit-calculation-depending-on-max-voltage-tolerance.html
- Schneider Electric Conext solution guide TP20180605 documents transformer impedance calculation using nameplate quantities and voltage factors: https://solar.se.com/au/wp-content/uploads/sites/3/2021/11/TP20180605_Conext-CL125-Solution-Guide-IEC-975-0797-01-01_Rev-A_ENG.pdf
- Schneider Electric's technical cable/protection guide distinguishes conductor permissible I²t stress from protective-device let-through stress: https://iportal.se.com/Contents/docs/SQD-M9F11325_CATALOGUE.PDF
- Nexans published cable product data shows conductor material, section and maximum fault temperature are **product-specific**, underscoring why V28 requires a documented k coefficient instead of assuming one: https://latrivenetacavi.nexans.com/en/products/industrial-and-logistics/industrial-Eca-class/NPE-SUN-H138532/product~180029101~.html

These sources establish method context, **not** full standards conformity or a verified coefficient for any project cable.

## Outstanding gates (do not mark complete)

1. Public Wix browser hydration, JS/CSS HTTP 200 status and intermittent HTTP 429 recovery **not independently verified**. The Wix site is published, but an external live browser test could not run (remote browser wallet unavailable); a static extractor returned the initial loading placeholder, which is not evidence of a permanently broken app. **Do not deploy V28 without a complete 236-file Wix upload and a post-deploy browser check.**
2. Full IEC 60909/60287/60949, IEEE 1584 and ANSI/NEC engineering conformity, OEM protective coordination, arc flash, complete cable thermal/dynamic/BESS and commercial feature parity remain **unverified or incomplete**.
3. Original private ChatGPT Site cloud studies require **owner-authorized export**. They are not contained in public source or cumulative ZIP and have not been fabricated.
4. Site production security, backup/restore, source provenance and release acceptance remain separate signoff gates. All new methods are labelled bounded engineering screens.

## Reproduction

Run `QA/SCRIPTS/browser_32_ui.py` against the extracted V20 and V27 historical source trees, `QA/SCRIPTS/validate_128_reports.py` against the archived downloads, `QA/SCRIPTS/conductor_reference.py`, `QA/SCRIPTS/transformer_reference.py`, and `QA/SCRIPTS/browser_v28.py` against the extracted V28 site. Original scripts include their own explicit paths for the working environment and can be adapted to any local directory. No production Wix requests are necessary for these tests.
