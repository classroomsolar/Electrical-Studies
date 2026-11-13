# Electrical-Studies — Fault Current Studio

This is the source, tests and reports for the Fault Current Studio website (connected-network fault, arc flash, cable and power-quality studies).

Live site: https://headless-dlrpfrynayh-classroomsolar-140e.wix-site-host.com/

## Repository layout

Upload the folders exactly as they are in the release ZIP.

| Folder / file | What it holds |
|---|---|
| `SITE/` | The website. Every file the Wix site serves (index.html, modules, styles, fonts, `database/`). This folder is what gets deployed. |
| `QA/` | Test suites and their recorded results. Start with the `QA/V32_*/` folders, `QA/V31_SCALE/README.md`, `QA/V29_QA_SCRIPTS/README.md` and `QA/V30_UI_AUDIT/README.md`. `QA/V32_SHA256_Manifest.json` lists the SHA-256 of every file in `SITE/`. |
| `REPORTS/` | Release reports, test results, backlog and research notes. Read `REPORTS/V32_Release_Report.md` first. |
| `REQUIREMENTS/` | Requirements and the Stitch design-system sources. |
| `DEPLOY/` | Database deployment script (database v13 is **not** live yet; it goes live only when you decide). |
| `Spreadsheets/` | Master equipment workbook and reference spreadsheets. |
| `COMPARISON/` | Feature-comparison references. |
| `START_HERE.md` | Release history and hand-off notes. |
| `THIRD_PARTY_NOTICES.md` | Licences of included third-party material (fonts, reference data). |
| `RELEASE_STATE.json` | Machine-readable release state. |

All files are below GitHub's 25 MB browser-upload limit. The largest is `QA/V29_QA_SCRIPTS/ieee1584/ieee_1584_spreadsheet_results.csv` at 22.8 MB.

## Your project files

Projects are **not** stored in this repository or on the website. They live on your computer.

1. Open the website in Chrome or Edge on a computer.
2. Go to **Saved studies & backups → Projects on your computer**.
3. Click **Connect project folder** and choose a folder, for example `Documents/Electrical projects`.
4. Use **Save project to folder**.

Each project becomes a `name.fcs.json` file in that folder. Open a file from the list to continue working on it; every change saves back to the same file. You can copy, back up, rename or delete these files like any other file. If you also want them in a repository, use a separate private repository.

## Running the tests locally

1. Install Node 22+ and Python 3.
2. Install Playwright and Chrome for the browser tests.
3. From `QA/V29_QA_SCRIPTS/` run:
   - `node run_engine.mjs cases.json js.json && python3 compare.py`
   - the other suites listed in that folder's README.
4. From `QA/V31_SCALE/` and the `QA/V32_*/` folders run the plant-scale suites.

The website itself needs no build step. `SITE/` is served as static files.
