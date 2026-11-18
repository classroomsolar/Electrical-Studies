# V33 — how `public-bundle-v21.js` is patched

`SITE/public-bundle-v21.js` holds 78 modules. Each one is the TypeScript CommonJS transpile of the `.mjs` file of the same name.
V33 found this by test: `rebuild.mjs` transpiles every `.mjs` and compares it with the bundle. 52 modules match byte for byte,
19 more differ only by one line break at the end, and 7 were edited by hand in earlier releases
(`public-entry`, `public-catalog-loader`, `database-reference-tables`, `ieee1584-2018`, `arcflash-study-ui`, `network-app`, `network-calculation`).

Needs: Node 22 and TypeScript 6.0.3 (`/opt/npm-tools/node_modules/typescript` here; change the path in `rebuild.mjs` if yours differs).

| Command | What it does |
|---|---|
| `node rebuild.mjs ../../SITE` | Lists how many bundled modules equal the transpile of their source, and where the others differ. |
| `node patch_bundle.mjs <old SITE> ../../SITE network-engine.mjs report-data.mjs` | Replaces the named modules inside the bundle with the transpile of the new source. It first proves that the old bundled module equals the transpile of the old source, and stops if it does not. |

After patching, `QA/V29_QA_SCRIPTS/run_bundle.mjs` must give the same numbers as `run_engine.mjs` (V33: 220 networks, 4,680 values, 0 differences).
For the hand-edited modules, patch by hand.

`node patch_segment.mjs <old source> <new source> ../../SITE/public-bundle-v21.js` patches a hand-edited module (V33 used it for
`network-app.mjs`): it transpiles the old and new source, finds the changed lines and replaces exactly those lines in the bundle.
