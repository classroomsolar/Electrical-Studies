# DECISIONS — Fault Current Studio

| ID | Date | Decision | Reason / note |
|---|---|---|---|
| D-01 | 2026-11-15 | GitHub is the home of the code. Until access is set up, the AI delivers one ZIP per batch and the owner uploads it. | Owner. Replaces the older "no GitHub" rule. |
| D-02 | 2026-11-15 | Code edition: NEC 2023 and the standards it references. | Owner (Master Prompt Appendix F item 1). |
| D-03 | 2026-11-15 | MV upper limit stays at the 35 kV class for the studies. The database is **not** filtered by voltage (owner, 15 Nov: "database me 35 kV ki limitation mat laga"). | Owner (Appendix F item 6). |
| D-04 | 2026-11-15 | Generator and BESS stay as equipment and sources in the network model and in all studies (fault, load flow, protection, arc flash, duty). Generator sizing and BESS sizing, charging, discharging and dispatch studies are out of scope and are hidden, not deleted. | Owner: they affect whole-system results. **Conflict:** Master Prompt V5.0 Section 16 excludes generators as sources. The owner's current instruction has precedence (Master Prompt "Precedence" rule 1). Do not remove generator or BESS code. |
| D-05 | 2026-11-15 | Phone layout and edit speed on very large one-lines (about 2,000 buses) are low priority. | Owner: phone users can zoom; large one-lines are not the normal case. |
| D-06 | 2026-11-15 | No paid tools or licences. Independent checks use free tools (pandapower, OpenDSS, Python). | Owner: the calculator is free. |
| D-07 | 2026-11-15 | Take from the master database only the tables this calculator needs (see DATABASE_MAP.md). Motors stay. | Owner. |
| D-08 | 2026-11-14 | Database v13 goes live only after the owner approves. | Owner (repeated). |
| D-09 | 2026-11-15 | Font: Sitka, referenced by name only (Windows system font, not bundled). AI chose Sitka Heading for headings and Sitka Text for body text, with Georgia / serif fallback. | Owner: "koi sa bhi". Sitka Text reads better at small sizes. |
| D-10 | 2026-11-15 | Work goes in batches. After every batch: one ZIP with all files and `REMAINING_WORK.md` stating what is left and how to do it. | Owner (limited data). |
