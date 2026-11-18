# V33 — security checks in a browser (part of list B2)

Needs Python 3, Playwright and Chrome. Test project: `QA/V31_SCALE/results/plant80.json`.

| Command | What it checks | Result (14 Nov 2026) |
|---|---|---|
| `python3 xss_browser.py ../../SITE 9441` | 74 free-text fields (project name, notes, every bus, cable, source and device name) are set to text that would create an `<img onerror>` or a `<script>` if it reached the page unescaped. Then: all 8 views, 12 tool dialogs, the property panel, the report page, Excel and PDF export. | 26 / 26. The text is shown as text everywhere. No script ran, no element was created, no page error. The project still calculates. |
| `python3 csv_formula.py ../../SITE 9443` | Bus names that start with `=`, `+`, `-`, `@`. Equipment-table CSV and Excel report. | Pass. CSV cells are written with a leading `'`. The Excel report has 0 formula cells. |

Not checked: text inside imported IDs, the database pages with a modified database file, and cloud-vault file names.
A line-by-line read of every `innerHTML` use (static audit) was not done.
