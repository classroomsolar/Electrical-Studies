import fs from 'node:fs';
const SITE=new URL('../../SITE/',import.meta.url).href;
const {calculateProject,deviceDuty}=await import(SITE+'network-engine.mjs');
const cases=JSON.parse(fs.readFileSync(process.argv[2],'utf8'),(k,v)=>v==='__NaN__'?NaN:v==='__Inf__'?Infinity:v);
const out=cases.map(p=>{try{const r=calculateProject(p);return {ok:true,issues:r.issues.map(i=>i.severity+': '+i.message),results:r.results.map(x=>({busId:x.busId,status:x.status,totalA:x.totalA,xr:x.xr===Infinity?'inf':x.xr,peakA:x.peakA,zth:x.zth,flows:(x.branchFlows||[]).map(f=>({id:f.id,fromA:f.fromA,toA:f.toA})),faultNote:x.faultNote,seq:x.sequence?{...x.sequence}:null}))}}catch(e){return {ok:false,error:String(e.stack||e)}}});
fs.writeFileSync(process.argv[3],JSON.stringify(out));
