# V33 — check of the V32 feature list in a browser (lists A1 and A2 of the V33 prompt)

Runs on a local copy of `SITE/` at desktop 1440 × 900 and phone 390 × 844. Needs Python 3, Playwright and Chrome.

    python3 a1_verify.py ../../SITE 9310                     # everything (about 25 minutes)
    python3 a1_verify.py ../../SITE 9310 --only a,h --vp mobile   # some items, one screen size

Items: a report chooser + PDF + Excel + print · b SLG/LL/DLG and split-phase at 2,000 buses · c operating studies (sparse load flow,
fill-zero, closed switch) · d Arc flash at every bus · e engineering-studies arc-flash card · f equipment table · g Build plant
(AC, DC array, attach) · h auto-arrange · perf undo/redo/add on the 1,970-bus plant. Every item also records page and console errors.

Result on the final V33 files, 14 Nov 2026 (`results/a1_verify.json`): **124 passed, 2 failed, 2 not tested**.
Both failures are one event: at phone width, on the 1,970-bus plant, the report page with "All fault locations" chosen ran the browser tab out of memory
during or after the Excel download (test machine: 7 GB, 2 cores). It happened in 3 of 4 repeats on V33 and in 2 of 2 repeats on the untouched V32 files, so it is not new in V33.
An earlier full run on V33 (before the last engine speed-up) passed all 126.
Not tested: "typed clearing times give incident energy" in Arc flash at every bus on the 1,970-bus plant (both screen sizes) —
the test plant has no bus inside the IEEE 1584 range with typed clearing times.

Notes:
- Run it alone on a machine with more than 7 GB if you can.
- "Arc flash dialog opens 8 s" is the script's own 8 s wait before a fallback click, not the dialog's opening time.
- The layout audit at five widths (list B3) was not run in this round.
