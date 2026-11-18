# CHANGELOG — Fault Current Studio

## Batch 3 — 2026-11-15 (live)
- `network-engine.mjs` (+ bundle): IEC 60909-0 method C peak factor for meshed networks (`methodCRatio`, `methodCNet`, `peakXR`); result field `peakMethod`.
- `network-app.mjs` (+ bundle): peak card and result details name the method; database loader always reads the `master-*` sheet file.
- `report-data.mjs` (+ bundle): report row "Peak factor method".
- Version strings `20261115-b3`: `index.html`, `network-worker.mjs`, `network-calculation.mjs` (+ bundle), `arcflash-network-ui-v29.mjs`, `fault-envelope-ui-v29.mjs`, `power-quality-ui-v29.mjs`.
- `SITE/database/` (package only): 14 duplicate picker files removed, manifest points at `master-*` files.
- Live only: 16 unused files deleted (Batch 3 housekeeping).
- `QA/V29_QA_SCRIPTS/oracle.py`: independent method C; `gen.py`: taps in `tapPercent` (I-01); `cases.json`, `js.json`, `bundle.json` regenerated.
- `QA/B02_HOUSEKEEPING/db_whitelist.py`: also drops picker copies.
- New: `QA/B03_FAULT_AUDIT/` (`pandapower_crosscheck.py`, `db_picker_browser.py`, results), `REPORTS/B03_FAULT_AUDIT.md`.

## Batch 2 — 2026-11-15 (live)
- `operations-v27-ui.mjs`: BESS dispatch and size/cost modes hidden; default mode time-series AC load flow; scope note; saved/imported BESS scenarios refused.
- `fcs-theme-v30.css`, `public-style-v21.css`, `network-style.css`, `studio-v26.css`, `studio-workspace.css`, `operations-v27.css`: Sitka font stacks; Inter / JetBrains Mono `@font-face` and Google Fonts `@import` removed; system monospace.
- `cloud-vault-ui.mjs` (+ bundle): label for the backup file input; recovery-code storage guarded.
- `arcflash-network-ui-v29.mjs`: saving inputs guarded.
- `master-database.mjs` (+ bundle): shows "N of 117 sheets" when the import is reduced.
- `index.html`: version strings `20261115-b2`.
- `SITE/database/`: reduced to the keep list (package only).
- `SITE/fonts/` removed from the package; `THIRD_PARTY_NOTICES.md` updated.
- New tests: `QA/B02_HOUSEKEEPING/b02_browser.py`, `db_whitelist.py` (+ results).

## Batch 1 — 2026-11-15
- Added records: `REQUIREMENTS.md`, `DATABASE_MAP.md`, `DECISIONS.md`, `ISSUES.md`, `PROGRESS.md`, `REMAINING_WORK.md`, `CHANGELOG.md`.
- `REPORTS/V34_REMAINING_TASKS.md` now points to `REMAINING_WORK.md`.
- `NEW_CHAT_PROMPT_V34.txt`: read `REMAINING_WORK.md` first.
- No change to `SITE/`.

## V33 — 2026-11-14 / 15
- See `REPORTS/V33_Release_Report.md`.
