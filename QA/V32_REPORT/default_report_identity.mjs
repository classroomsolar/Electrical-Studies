const FIX=Date.parse('2026-11-08T00:00:00Z');const RD=Date;globalThis.Date=class extends RD{constructor(...a){super(...(a.length?a:[FIX]))}static now(){return FIX}};
import crypto from 'crypto';
const SITE=process.argv[2]; // usage: node default_report_identity.mjs <SITE folder>  (run on V31 and V32 SITE; outputs must be equal)
const {reportData}=await import(SITE+'/report-data.mjs');
const {browserReport}=await import(SITE+'/public-report-engine.mjs');
const {exampleProject}=await import(SITE+'/network-model.mjs');
const {analysisExample}=await import(SITE+'/analysis-examples.mjs');
const types=['3phase','slg','ll','dlg','dc','1phase','split-phase','3phase-ground'];
const out={};
const projects=[['example',exampleProject()],...types.map(t=>{try{return ['ex-'+t,analysisExample(t)]}catch(e){return null}}).filter(Boolean)];
for(const [k,p] of projects){for(const f of ['pdf','xlsx']){try{const b=await browserReport(p,f);out[k+'.'+f]=crypto.createHash('sha256').update(Buffer.from(await b.arrayBuffer())).digest('hex').slice(0,16)}catch(e){out[k+'.'+f]='ERR '+e.message}}}
console.log(JSON.stringify(out,null,1));
