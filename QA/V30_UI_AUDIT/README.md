# V30 layout audit

`audit.py SITE PORT OUTDIR [only,these,views]` serves the site, opens every page (single line, results, operating, engineering studies, print report, saved studies, master database, capability atlas) and every tool dialog/panel, presses the dialog's calculate button where there is one, and runs `audit.js` in the page. Set `VPS=1440,1280,1024,768,390` for the widths (default 1440 and 390). Output: `OUTDIR/issues.json`, a screenshot per state, and a summary on stdout. Needs Python 3, Playwright and Google Chrome.

`audit.js` flags: text below WCAG AA contrast (4.5:1, 3:1 for large text); text clipped by its own box or a clipping parent; ellipsis; drop-down and placeholder text that does not fit; words squeezed onto 3+ lines in buttons, labels, headers and badges; a word wider than its box; controls or text covered by fixed elements; white/light surfaces left in the dark theme; content off the right edge; boxes that scroll sideways; one-line labels running past their background.

Other helpers: `shot.py` (full-page screenshots), `dlgshot.py` (open a dialog, run it, scroll to a target), `probe.py` (run a JS expression in the page), `collect.py` (inventory of element backgrounds/colours used to build the theme).

`results/`: final run (5 widths, 0 findings), the same detector on the V29e site for comparison, and sample screenshots before/after.
