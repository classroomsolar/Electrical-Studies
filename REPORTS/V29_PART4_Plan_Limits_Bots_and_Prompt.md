# Part 4: making Fault Current Studio do what the advanced tools do

Prepared 7 November 2026. Plain and honest.

## 1. Are your conditions acceptable?

| Your condition | Answer |
|---|---|
| Keep all progress | **Yes.** Every change is additive or a small patch, checked by running the old tests again (0 values changed in V29). |
| Make it do everything the advanced apps do | **Yes as the direction, no as a single job.** ETAP, SKM and EasyPower each took decades and large teams. We can add their study families one at a time, each with independent tests. Some, such as EMT switching transients and full dynamic stability, are research-scale projects. |
| Research online first | **Yes, done in part.** 100 tools surveyed and a 12-family method register built, each with source URLs (`REPORTS/research/`). |
| Read the NEC and books in your "library" | **Not possible from here.** Your library is in your ChatGPT account. I cannot open it. Attach the PDFs in this chat (or a new one) and I can read them page by page. A full NEC (about 900 pages) takes several sessions. NEC text is copyrighted: the calculator can use its methods and cite its sections, but must not republish its text or full tables on a public site. |
| "Read everything, each and everything" | **I will only say I read something if I actually read it,** and each report lists exactly which pages were read. |
| Results backed by complete logic and sources | **Yes.** Every method cites its standard and is checked against an independent implementation or a published example before release. |
| "No chance of error" | **No one can promise this.** What we can promise is error control: independent second calculations, published reference cases, adversarial tests, and a written audit trail. Remaining risk is always written down. |
| Use plugins / install more | **Yes.** The Wix connector is now in use (deployed V29). Useful next: a Google Drive connector, if your books are there. |
| Use bots | **Yes.** Two research bots ran in this session. The bot team below is the plan for the full build. |
| Work in a new chat, site opens there too | **Yes.** The public Wix site and the public repository can be opened from any chat. In a new chat: attach the latest ZIP (or point to the public repository), and connect Wix if you want deployment. The private ChatGPT site (`…chatgpt.site`) can never be opened from here. |

## 2. My limitations (honest list)

1. I cannot see your ChatGPT chats, ChatGPT library, or the private ChatGPT site.
2. Without a GitHub account with write access, I cannot save to the repository. I send ZIPs instead, and deploy to Wix through the connector.
3. My sandbox cannot open the live Wix site in a browser. I can check every live file over HTTP and byte-by-byte, but a real click-through of the live site must be done by you (or in a session whose network allows the site).
4. Paid standards (IEEE, IEC, NFPA) are not freely readable. Where a method needs the standard's tables, we need your licensed copy or an openly licensed implementation verified against the standard's published examples (as done for IEEE 1584-2018).
5. Very long tasks are split into stages. Each stage ends with tested, deployable files, so nothing is lost between sessions.

## 3. How to make it happen: the bot team

Each bot gets one job, a written brief, and must return sources plus test evidence. No bot's work is accepted until another bot has checked it.

| Bot | Job | Must deliver |
|---|---|---|
| 1. Research bot | Survey tools, manuals, help centres; collect features | Table with source URL per row |
| 2. Standards and methods bot | Find the governing standard edition, papers, worked examples, test oracles | Method register with URLs and licence notes |
| 3. Library reader bot | Read your attached books/NEC page by page, extract method rules (not copyrighted text) | Page-referenced notes |
| 4. Builder bot (one per study) | Implement one study as an add-on module plus UI | Code, inputs/outputs spec, limits |
| 5. Independent oracle bot | Write a second calculation in Python **without seeing the builder's code** | Oracle code and comparison results |
| 6. Adversarial tester bot | Try to break the study with 200+ logical scenarios and bad inputs | Failure list, fixed list |
| 7. Regression bot | Re-run every earlier test so nothing old breaks | Pass/fail table vs previous version |
| 8. Auditor bot | Check every citation exists and supports the claim; re-run a sample of tests | Audit report, list of unsupported claims |
| 9. Release bot | Build manifest, checksums, ZIP, deploy to the same Wix site, verify live | Release report, rollback steps |

## 4. Order of work (highest value first)

| Stage | Study / feature | Reference to test against |
|---|---|---|
| Done in V29 | NEC 110.24 label, %Z tolerance envelope, plausibility warnings, IEEE 1584-2018 arc flash in the browser, SLD fixes | Annex D.1/D.2, 105,120 official IEEE spreadsheet cases |
| Done in V29b | Arc flash at every bus with labels; transformer off-nominal tap in fault engines; combined conductor sizing | Oracle with taps; IEEE 1584 engine; hand checks + 3,000 random sizing cases |
| Done in V29e | Tap in load flow; one-line device link to arc flash; relay tolerance bands; LSI trip model; OCPD + EGC check; TCC plot-point library | π-equivalent oracle 300 networks; 1,799 OCPD checks; 103 LSI; 11 tolerance; 9 + browser one-line |
| Done in V30 | Stitch theme, docked tools, palette/inspector/label/table layout fixes | Layout audit 5 widths × 34 states = 0 findings; 10 browser suites unchanged |
| Next 2 | TCC: tolerance bands, let-through, curve clipping, coordination gap check, auto evaluation | Manufacturer published curves; IEEE C37.112 / IEC 60255-151 equations |
| Next 3 | Off-nominal tap in load flow; clearing times taken from TCC data into the per-bus arc flash | Independent oracle; pandapower |
| Next 4 | Conductor sizing: fill R/X gaps (14–10 AWG, 3 AWG), OCPD check, IEC 60364-5-52 methods | NEC Ch. 9 Table 9 from your licensed copy, IEC 60364-5-52 |
| Next 5 | IEEE 519 PCC compliance, PF correction with resonance check | IEEE 519-2022, IEEE test systems |
| Next 6 | IEC 60909-0:2026 full maximum/minimum with all correction factors | IEC 60909-4 examples, pandapower |
| Later | Generator step loading, motor starting over time, IEEE 80 grounding with soil model, IEEE 485 battery sizing, BESS resilience sizing, reliability indices, unbalanced load flow, DC arc flash (several methods), scenario manager | See `REPORTS/research/method_reference_register.md` |

## 5. Prompt to use in a new chat

Copy everything in the box. Attach the latest ZIP (`Fault_Current_Studio_V30_Complete.zip`) and any books or PDFs you want read.

```
I have attached the complete latest Fault Current Studio package (V30). Extract it and read, in this order: START_HERE.md, REPORTS/V29_Release_Report.md, REPORTS/V29_ISSUES_AND_BACKLOG.md, REPORTS/V29_PART4_Plan_Limits_Bots_and_Prompt.md, MASTER_CONTINUATION_PROMPT.txt, REQUIREMENTS/PRIOR_MASTER_HANDOFF_2026-10-25.md, REPORTS/research/calculator_survey.md and REPORTS/research/method_reference_register.md.

Rules:
1. Do not restart, remove or overwrite working features, formulas, dropdowns, saved-study formats or reports. Add new studies as add-on modules, as V27-V29 did. After every change, re-run QA/V29_QA_SCRIPTS (including ieee1584/) and show that no earlier value changed.
2. Website: the original Wix site only (metaSiteId 97613ac8-1f7d-4ecf-8fa4-2d589c387775). Before any upload, read the live file inventory and revision and compare with the package. Upload only checksum-verified files; never a partial or broken set. After upload, verify every changed file on the live site. Never create a new Wix site.
3. Already done (V29b–V29e): per-bus arc flash with labels and device clearing-time dropdowns, transformer off-nominal tap in fault studies and load flow, combined conductor sizing with NEC 240.4 OCPD and 250.122 EGC, IEEE 519 PCC check, PF correction with resonance, one-line devices linked to the arc-flash picker, relay tolerance bands, LSI trip model, TCC plot-point library, master database v13 import (not live until the owner decides; DEPLOY/deploy_database_to_wix.py). Stitch theme applied in V30 (keep `fcs-theme-v30.css` + `shell-v30.mjs` loaded last; rerun `QA/V30_UI_AUDIT/audit.py` after any UI change and keep it at 0 findings). Next work, in order: (a) the full audit from zero to finish the owner asked for; (b) read the NEC books and re-verify the NEC tables; (d) IEC 60909-0:2026 full max/min; (e) relay coordination check. Use the bot team in Part 4 if sub-agents are available: builder, independent oracle that never sees the builder's code, adversarial tester (200+ logical scenarios), regression, auditor, release.
4. Read every attached book or PDF page by page and report exactly which pages were read. Use code books for methods and section references only; do not copy copyrighted text or full tables into the public site.
5. Every method must cite its standard edition and a source URL, state its limits, and match an independent calculation or published example before release. Never invent coefficients, manufacturer data or test results.
6. Be honest: say plainly what was not done, what could not be accessed, and what remains. Do not claim 100 % completion.
7. Reply in Hinglish (simple Hindi-English mix). Deliver all updated files as one ZIP with the same folder structure.
```

## 6. Missing from your attachment

Your attached text ends with "These are some of the examples of what the calculator should contain…" but no list followed it. Please paste that list. Until then, the ranked list in `REPORTS/research/calculator_survey.md` (Top 25 features) is used as the target.
