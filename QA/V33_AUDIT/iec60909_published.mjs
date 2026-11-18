// B1 audit: IEC 60909-style radial and peak screens against freely published worked numbers.
// Sources (public): Schneider Electric Electrical Installation Guide, Fig. G71 (630 kVA, c·Un = 1.05·400 V, results printed to 1 kA);
// EasyPower "Short Circuit Currents According to IEC 60909" slides (single-transformer examples, c = 1, Un/(√3·Z));
// IEC 60909-0 eq. (55) kappa = 1.02 + 0.98·e^(-3R/X) (also printed in Schneider Cahier Technique ECT158).
import {radialSourceFault} from '../../SITE/engineering-core-methods.mjs';
import {peakMakingNetworkScreen} from '../../SITE/iec60909-peak-network.mjs';
import {writeFileSync} from 'node:fs';
const out=[];let pass=0,fail=0;
const chk=(name,got,want,tol)=>{const ok=Math.abs(got-want)<=tol;ok?pass++:fail++;out.push({name,got:+got.toFixed(4),want,tol,ok});console.log((ok?'PASS ':'FAIL ')+name+' got '+got.toFixed(3)+' want '+want+' ±'+tol)};
const m=v=>v/1000; // mΩ → Ω
// 1) EIG Fig G71: cumulative R/X sums and Ikmax (rounded to 1 kA)
const parts=[['MV network',0.035,0.351],['Transformer 630 kVA',2.90,10.8],['Cable C1',0.19,0.20],['Cable C3',1.54,0.80],['Cable C7',0.97,0.40]];
const want=[[2,11.8,21],[3,13.0,19],[4,13.8,18]];
for(const [n,z,ik] of want){const r=radialSourceFault({nominalLLV:400,voltageFactor:1.05,frequencyHz:50,seriesImpedances:parts.slice(0,n+1).map(([id,R,X])=>({id,rOhm:m(R),xOhm:m(X)}))});
 chk('EIG G71 |Z| after '+parts[n][0]+' (mΩ)',r.impedanceMagnitudeOhm*1000,z,0.06);chk('EIG G71 Ikmax after '+parts[n][0]+' (kA)',r.initialSymmetricalKA,ik,0.5)}
// 2) EasyPower slides: 400 kVA 20/0.4 kV 4 % on 500 MVA, and 1600 kVA 22/0.4 kV 6 % on 750 MVA (impedances added as magnitudes, c = 1)
let r=radialSourceFault({nominalLLV:400,voltageFactor:1,frequencyHz:50,seriesImpedances:[{id:'grid',rOhm:0,xOhm:m(0.32)},{id:'mv cable',rOhm:0,xOhm:m(0.004)},{id:'tx',rOhm:0,xOhm:m(16)}]});
chk('EasyPower 400 kVA Ik at LV terminals (kA)',r.initialSymmetricalKA,14.1,0.06);
r=radialSourceFault({nominalLLV:400,voltageFactor:1,frequencyHz:50,seriesImpedances:[{id:'grid',rOhm:0,xOhm:0.4**2/750},{id:'tx',rOhm:0,xOhm:0.4**2/1.6*0.06}]});
chk('EasyPower 1600 kVA total Z (mΩ)',r.impedanceMagnitudeOhm*1000,6.2133,0.0005);chk('EasyPower 1600 kVA Isc (kA)',r.initialSymmetricalKA,37.168,0.005);
// 3) kappa equation (IEC 60909-0 eq. 55) at reference R/X points, radial and network method C (single branch, so method C must equal radial)
for(const rx of [0,0.05,0.1,0.2,0.3,0.5,1,1.2]){const k=1.02+0.98*Math.exp(-3*rx);
 r=radialSourceFault({nominalLLV:400,voltageFactor:1,frequencyHz:50,seriesImpedances:[{id:'z',rOhm:rx*0.01,xOhm:0.01}]});
 chk('kappa radial R/X='+rx,r.kappa,k,1e-12);chk('peak = kappa·√2·Ik, R/X='+rx,r.peakA,k*Math.SQRT2*r.initialSymmetricalA,1e-6)}
chk('kappa R/X=0 equals 2.0',radialSourceFault({nominalLLV:400,voltageFactor:1,frequencyHz:50,seriesImpedances:[{id:'z',rOhm:0,xOhm:0.01}]}).kappa,2.0,1e-12);
// method C on one source + one branch: Rc/Xc·fc/f = R/X when R const and X ∝ f, so kappa must match radial
const pk=peakMakingNetworkScreen({nominalLLV:400,voltageFactor:1.05,frequencyHz:50,faultBus:'B',buses:['A','B'],branches:[{id:'tx',from:'A',to:'B',rOhm:m(2.9+0.19),xOhm:m(10.8+0.2)}],sources:[{id:'grid',bus:'A',rOhm:m(0.035),xOhm:m(0.351),angleDeg:0,emScale:1}]});
const rad=radialSourceFault({nominalLLV:400,voltageFactor:1.05,frequencyHz:50,seriesImpedances:parts.slice(0,3).map(([id,R,X])=>({id,rOhm:m(R),xOhm:m(X)}))});
chk('method C single path kappa = radial kappa',pk.kappaMethodC,rad.kappa,1e-9);chk('method C single path Ik = radial Ik (kA)',pk.initialSymmetricalKA,rad.initialSymmetricalKA,1e-9);
writeFileSync(new URL('./results/iec60909_published.json',import.meta.url),JSON.stringify({pass,fail,checks:out},null,1));
console.log({pass,fail});process.exit(fail?1:0);
