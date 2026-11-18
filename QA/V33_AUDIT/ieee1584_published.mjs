// V33 (B1): IEEE 1584-2018 module against independently published worked cases.
// Source A: Reeves, Freyenberger, Hodder, "Understanding the Effect of Electrode Configuration on Incident Energy and
//   Arc-Flash Boundary", IEEE ESW 2020, paper ESW2020-45 (Eaton white paper WP027022EN), Tables I, II, III, V.
//   480 V, gap 32 mm, working distance 24 in, enclosure 20 x 20 in, Ibf 50 kA, clearing time 2000 ms. Depth not given (n/a):
//   a deep enclosure (508 mm) is used so no shallow-enclosure correction applies.
// The published values are rounded to 0.1, so the check is: our value rounds to the published value, or is within 0.06 %.
const {ieee1584Calculate}=await import(new URL('../../SITE/ieee1584-2018.mjs',import.meta.url).href);
let pass=0,fail=0;const rows=[];
const near=(ours,pub)=>Math.abs(ours-pub)<=0.05+1e-9||Math.abs(ours-pub)/pub<=6e-4;
const A={voltageKV:0.48,boltedFaultKA:50,gapMM:32,workingDistanceMM:24*25.4,enclosureHeightMM:20*25.4,enclosureWidthMM:20*25.4,enclosureDepthMM:508,clearingFullMS:2000,clearingReducedMS:2000};
const pub={VCB:{iarc:30.6,ie:105.0,afbIn:394.1},VCBB:{iarc:35.0,ie:145.3,afbIn:340.2},HCB:{iarc:30.1,ie:188.6,afbIn:289.9}};
for(const ec of Object.keys(pub)){
 const r=ieee1584Calculate({...A,electrodeConfiguration:ec}),full=r.cases.find(c=>/full|maximum/i.test(c.case||c.name||''))||r.cases[0];
 const iarc=full.arcingCurrentKA,ie=full.incidentEnergyCalPerCm2,afb=full.arcFlashBoundaryMM/25.4;
 for(const [what,ours,p,unit] of [['arcing current',iarc,pub[ec].iarc,'kA'],['incident energy',ie,pub[ec].ie,'cal/cm²'],['arc-flash boundary',afb,pub[ec].afbIn,'in']]){
  const ok=near(ours,p);ok?pass++:fail++;rows.push({source:'ESW2020-45',case:ec,what,published:p,ours:+ours.toFixed(3),unit,result:ok?'match':'MISMATCH'})}
}
// Source B: IEEE Std 1584-2018 Annex D sample cases (VCB), benchmark values as published by ETAP, "ETAP comparison results AF1"
//   (validation case document, etap.com). The document gives results but not every input. MV: 4.16 kV, 15 kA, gap 104 mm,
//   working distance 914.4 mm, enclosure 1143 x 762 x 762 mm. LV: 0.48 kV, gap 32 mm, working distance 609.6 mm; the bolted current
//   (45 kA) and enclosure (610 x 610 x 254 mm) are the values that reproduce all ten published LV numbers; they are inferred, not
//   printed in that document. Clearing times are the published ones. Arc-flash boundary is published in feet, rounded to 0.001 ft.
const nearB=(ours,p)=>Math.abs(ours-p)<=0.0015||Math.abs(ours-p)/p<=3e-4;
for(const [bus,inp,full,red] of [
 ['MV_Bus',{voltageKV:4.16,boltedFaultKA:15,gapMM:104,workingDistanceMM:914.4,enclosureHeightMM:1143,enclosureWidthMM:762,enclosureDepthMM:762,clearingFullMS:197,clearingReducedMS:223},{iarc:12.979,ie:2.904,afb:5.269},{iarc:12.675,ie:3.189,afb:5.591}],
 ['LV_Bus',{voltageKV:0.48,boltedFaultKA:45,gapMM:32,workingDistanceMM:609.6,enclosureHeightMM:610,enclosureWidthMM:610,enclosureDepthMM:254,clearingFullMS:61.3,clearingReducedMS:319},{iarc:28.793,ie:2.769,afb:3.376},{iarc:25.244,ie:12.705,afb:8.757}]]){
 const r=ieee1584Calculate({...inp,electrodeConfiguration:'VCB'});
 for(const [k,pub] of [[0,full],[1,red]]){const c=r.cases[k];
  for(const [what,ours,p,unit] of [['arcing current',c.arcingCurrentKA,pub.iarc,'kA'],['incident energy',c.incidentEnergyCalPerCm2,pub.ie,'cal/cm²'],['arc-flash boundary',c.arcFlashBoundaryMM/304.8,pub.afb,'ft']]){
   const ok=nearB(ours,p);ok?pass++:fail++;rows.push({source:'IEEE 1584-2018 Annex D (ETAP AF1)',case:bus+(k?' reduced':' full'),what,published:p,ours:+ours.toFixed(4),unit,result:ok?'match':'MISMATCH'})}}
}
console.table(rows);console.log({pass,fail});
(await import('node:fs')).writeFileSync(new URL('./results/ieee1584_published.json',import.meta.url),JSON.stringify(rows,null,1));
process.exit(fail?1:0);
