import {ieee1584Calculate} from '../../../SITE/ieee1584-2018.mjs';
let p=0,f=0;const ck=(n,got,exp,dp)=>{const ok=Math.abs(got-exp)<=0.5*10**-dp+1e-12;ok?p++:f++;console.log((ok?'PASS ':'FAIL ')+n,got.toFixed(dp+2),'expected',exp)};
// Annex D.1: 4.16 kV VCB
let r=ieee1584Calculate({voltageKV:4.16,boltedFaultKA:15,electrodeConfiguration:'VCB',gapMM:104,workingDistanceMM:914.4,enclosureHeightMM:1143,enclosureWidthMM:762,enclosureDepthMM:508,clearingFullMS:197,clearingReducedMS:223});
const [a,b]=r.cases;
ck('D.1 I_arc_600',a.intermediates.iArc600KA,11.117,3);ck('D.1 I_arc_2700',a.intermediates.iArc2700KA,12.816,3);ck('D.1 I_arc_14300',a.intermediates.iArc14300KA,14.116,3);ck('D.1 I_arc',a.arcingCurrentKA,12.979,3);
ck('D.1 width1',r.enclosure.width1In,27.632,3);ck('D.1 height1',r.enclosure.height1In,45,3);ck('D.1 EES',r.enclosure.EESIn,36.316,3);ck('D.1 CF',r.enclosure.CF,1.284,3);
ck('D.1 E600',a.intermediates.e600JPerCm2,8.652,3);ck('D.1 E2700',a.intermediates.e2700JPerCm2,11.977,3);ck('D.1 E14300',a.intermediates.e14300JPerCm2,13.367,3);ck('D.1 E',a.incidentEnergyJPerCm2,12.152,3);
ck('D.1 AFB600',a.intermediates.afb600MM,1285,0);ck('D.1 AFB2700',a.intermediates.afb2700MM,1591,0);ck('D.1 AFB14300',a.intermediates.afb14300MM,1707,0);ck('D.1 AFB',a.arcFlashBoundaryMM,1606,0);
ck('D.1 VarCF',r.arcingCurrentVariationFactor,0.047,3);ck('D.1 reduced I600',b.intermediates.iArc600KA,10.856,3);ck('D.1 reduced I2700',b.intermediates.iArc2700KA,12.515,3);ck('D.1 reduced I14300',b.intermediates.iArc14300KA,13.786,3);ck('D.1 reduced I_arc',b.arcingCurrentKA,12.675,3);ck('D.1 reduced E600',b.intermediates.e600JPerCm2,8.980,3);
// Annex D.2: 480 V VCB (same as UI example)
r=ieee1584Calculate({voltageKV:0.48,boltedFaultKA:45,electrodeConfiguration:'VCB',gapMM:32,workingDistanceMM:609.6,enclosureHeightMM:610,enclosureWidthMM:610,enclosureDepthMM:254,clearingFullMS:61.3,clearingReducedMS:319});
console.log(JSON.stringify(r.cases.map(c=>[c.arcingCurrentKA,c.incidentEnergyJPerCm2,c.arcFlashBoundaryMM])),r.enclosure);
console.log(`\n${p} passed, ${f} failed`);
