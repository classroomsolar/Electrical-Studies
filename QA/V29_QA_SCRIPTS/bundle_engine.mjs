// Loads the LIVE public bundle's embedded engine (not the source .mjs) for parity testing.
import fs from 'node:fs'; import vm from 'node:vm';
const B=new URL('../../SITE/public-bundle-v21.js',import.meta.url);
export function loadBundle(path=B){let code=fs.readFileSync(path,'utf8');
 code=code.replace("require('public-entry.mjs');\n})();","globalThis.__bundleRequire=require;\n})();");
 const ctx={console,globalThis:null,crypto:globalThis.crypto,URL,TextEncoder,TextDecoder,setTimeout,clearTimeout,structuredClone};ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(code,ctx);return ctx.__bundleRequire;}
