/**
 * V29c: total clearing time of a protective device at a given current, chosen by the user from dropdowns.
 *
 * Device types (the user picks one; nothing is assumed):
 *  - relay   : inverse-time relay + optional definite-time and instantaneous elements + breaker interrupting time.
 *              IEC 60255-151 curves  t = TMS * k / (M^a - 1)
 *              IEEE C37.112-2018     t = TD * (A / (M^p - 1) + B)
 *  - curve   : manufacturer total-clearing curve points (current A, minimum s, maximum s) typed from the datasheet;
 *              the MAXIMUM total-clearing time is used (conservative for arc flash), log-log interpolation.
 *  - lsi     : LV breaker electronic trip unit, from its settings: long time Ir with delay tLT at 6 x Ir (I^2 t law),
 *              short time Isd / tsd (flat), instantaneous Ii with the manufacturer's total clearing time.
 *  - manual  : time typed by the user (from a protection study).
 * Breaker interrupting time comes from the breaker nameplate (rated cycles) or is typed in ms.
 * Tolerance band (relay only, values typed from the relay manual): pickup ±%, operate time ±% or ±ms (whichever is larger,
 * as IEC 60255-151 states accuracy). The slow edge of the band is used for arc flash and conductor withstand.
 * Not modelled: CT saturation, breaker opening-time spread, reset, directional supervision, zone interlocking,
 * current-limiting let-through of fuses below 0.01 s (the curve range is enforced).
 */
export const CLEARING_TIME_V29={id:'protective-device-clearing-time-v29',version:'29.3.0'};
export const IEC_CURVES=Object.freeze({
 SI:{label:'IEC Standard Inverse (C1)',k:0.14,a:0.02},
 VI:{label:'IEC Very Inverse (C2)',k:13.5,a:1},
 EI:{label:'IEC Extremely Inverse (C3)',k:80,a:2},
 LTI:{label:'IEC Long-Time Inverse',k:120,a:1}
});
export const IEEE_CURVES=Object.freeze({
 MI:{label:'IEEE Moderately Inverse',A:0.0515,B:0.114,p:0.02},
 VI:{label:'IEEE Very Inverse',A:19.61,B:0.491,p:2},
 EI:{label:'IEEE Extremely Inverse',A:28.2,B:0.1217,p:2}
});
export const BREAKER_CYCLES=Object.freeze([2,3,5,8]);
export const CURVE_SOURCES=Object.freeze({
 IEC:'IEC 60255-151:2009 inverse-time characteristic constants',
 IEEE:'IEEE Std C37.112-2018 inverse-time characteristic constants'
});
const fin=x=>typeof x==='number'&&Number.isFinite(x);
const bad=m=>{throw Error('Clearing time: '+m)};
const pos=(x,name,max=1e9)=>{if(!fin(x)||x<=0||x>max)bad(name+' must be a positive number.');return x};
const ms=s=>Math.round(s*1e6)/1e3;

export function breakerTimeS(d){
 if(d.breakerMode==='none')return {seconds:0,text:'no separate breaker time (curve already total clearing)'};
 if(d.breakerMode==='ms'){const t=pos(d.breakerMs,'Breaker interrupting time (ms)',500);return {seconds:t/1000,text:`breaker ${t} ms`}}
 const cyc=Number(d.breakerCycles),f=Number(d.frequencyHz);
 if(!BREAKER_CYCLES.includes(cyc))bad('choose the breaker rated interrupting time (cycles).');
 if(![50,60].includes(f))bad('system frequency must be 50 or 60 Hz.');
 return {seconds:cyc/f,text:`${cyc}-cycle breaker at ${f} Hz`};
}

function inverseElement(d,I){
 const pick=pos(d.pickupA,'Inverse-time pickup (primary A)'),M=I/pick;
 if(M<=1)return {pickedUp:false,multiple:M};
 if(d.standard==='IEC'){const c=IEC_CURVES[d.curve];if(!c)bad('choose an IEC curve.');const tms=pos(d.dial,'TMS',10);
  return {pickedUp:true,multiple:M,seconds:tms*c.k/Math.expm1(c.a*Math.log(M)),text:`${c.label}, TMS ${tms}, pickup ${pick} A`}}
 if(d.standard==='IEEE'){const c=IEEE_CURVES[d.curve];if(!c)bad('choose an IEEE curve.');const td=pos(d.dial,'Time dial',20);
  return {pickedUp:true,multiple:M,seconds:td*(c.A/Math.expm1(c.p*Math.log(M))+c.B),text:`${c.label}, TD ${td}, pickup ${pick} A`}}
 bad('choose IEC or IEEE curve family.');
}

function interp(points,I){
 // log-log interpolation on the maximum total clearing curve
 if(I<points[0].a||I>points[points.length-1].a)return null;
 for(let i=1;i<points.length;i++){const p=points[i-1],q=points[i];if(I<=q.a){
  const f=(Math.log(I)-Math.log(p.a))/(Math.log(q.a)-Math.log(p.a));
  const g=(lo,hi)=>Math.exp(Math.log(lo)+f*(Math.log(hi)-Math.log(lo)));
  return {min:p.min===null?null:g(p.min,q.min),max:g(p.max,q.max)}}}
 return null;
}
export function parseCurvePoints(csv){
 if(typeof csv!=='string'||!csv.trim()||csv.length>12000)bad('paste the datasheet curve as rows: current A, minimum s, maximum s.');
 const rows=csv.trim().split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
 if(rows.length<2||rows.length>160)bad('2 to 160 curve points are needed.');
 const pts=rows.map((r,i)=>{const c=r.split(/[,;\t]/).map(s=>s.trim());if(c.length!==3&&c.length!==2)bad(`row ${i+1}: need current A, minimum s, maximum s (or current A, maximum clearing s).`);
  const v=c.map(Number);if(v.some(x=>!fin(x)||x<=0))bad(`row ${i+1}: values must be positive numbers.`);if(c.length===2)return {a:v[0],min:null,max:v[1]};if(v[1]>v[2])bad(`row ${i+1}: minimum time is above maximum time.`);return {a:v[0],min:v[1],max:v[2]}});
 if(new Set(pts.map(q=>q.min===null)).size>1)bad('use the same number of columns on every row.');
 for(let i=1;i<pts.length;i++){if(pts[i].a<=pts[i-1].a)bad('current must increase from row to row.');if(pts[i].max>pts[i-1].max*(1+1e-9)||(pts[i].min!==null&&pts[i].min>pts[i-1].min*(1+1e-9)))bad('time must not increase as current increases.')}
 return pts;
}

/** device: see header. currentA: current through the device (A). Returns {status, seconds, text, ...}. */
export function clearingTime(device,currentA){
 if(!device||typeof device!=='object')bad('choose a protective device.');
 const I=pos(currentA,'Device current (A)',1e7);
 if(device.type==='manual'){const t=pos(device.ms,'Clearing time (ms)',10000);return {status:'OK',seconds:t/1000,ms:t,text:`entered ${t} ms`+(device.source?` (${String(device.source).slice(0,120)})`:''),currentA:I}}
 if(device.type==='curve'){
  const pts=parseCurvePoints(device.csv),v=interp(pts,I);
  if(!device.model||String(device.model).trim().length<2)bad('enter the device model the curve belongs to.');
  if(!v)return {status:'OUTSIDE CURVE RANGE',seconds:null,text:`current ${Math.round(I)} A is outside the entered curve (${pts[0].a}–${pts[pts.length-1].a} A)`,currentA:I};
  const br=breakerTimeS({...device,breakerMode:device.breakerMode||'none'});
  const t=v.max+br.seconds;
  return {status:'OK',seconds:t,ms:ms(t),minCurveS:v.min,maxCurveS:v.max,text:`${String(device.model).slice(0,80)} maximum total-clearing curve ${ms(v.max)} ms`+(br.seconds?` + ${br.text}`:''),currentA:I};
 }
 if(device.type==='lsi')return lsiTime(device,I);
 if(device.type==='relay'){
  const br=breakerTimeS(device);
  const evalRelay=(pk,timeAdj)=>{const parts=[];
   const inv=device.pickupA!==undefined&&device.pickupA!==null&&device.pickupA!==''?inverseElement({...device,pickupA:pos(device.pickupA,'Inverse-time pickup (primary A)')*pk},I):null;
   if(inv?.pickedUp)parts.push({element:'51 inverse time',seconds:timeAdj(inv.seconds),text:inv.text});
   if(fin(device.dtPickupA)){pos(device.dtPickupA,'Definite-time pickup');const d=device.dtDelayS;if(!fin(d)||d<0||d>60)bad('definite-time delay must be 0–60 s.');if(I>device.dtPickupA*pk)parts.push({element:'51 definite time',seconds:timeAdj(d),text:`definite time ${d} s above ${device.dtPickupA} A`})}
   if(fin(device.instPickupA)){pos(device.instPickupA,'Instantaneous pickup');const d=fin(device.instDelayS)?device.instDelayS:0;if(d<0||d>1)bad('instantaneous delay must be 0–1 s.');if(I>device.instPickupA*pk)parts.push({element:'50 instantaneous',seconds:timeAdj(d),text:`instantaneous above ${device.instPickupA} A`+(d?` + ${d} s`:'')})}
   if(!inv&&!fin(device.dtPickupA)&&!fin(device.instPickupA))bad('enter at least one relay element (inverse-time, definite-time or instantaneous).');
   return parts.length?parts.reduce((a,b)=>b.seconds<a.seconds?b:a):null};
  const nom=evalRelay(1,t=>t);
  const tol=['tolPickupPercent','tolTimePercent','tolTimeMs'].some(k=>fin(device[k]));
  let band=null;
  if(tol){const pp=fin(device.tolPickupPercent)?device.tolPickupPercent:0,tp=fin(device.tolTimePercent)?device.tolTimePercent:0,tm=fin(device.tolTimeMs)?device.tolTimeMs:0;
   if(pp<0||pp>20||tp<0||tp>30||tm<0||tm>200)bad('tolerance limits: pickup 0–20 %, time 0–30 %, time 0–200 ms.');
   const dev=t=>Math.max(t*tp/100,tm/1000);
   const slow=evalRelay(1+pp/100,t=>t+dev(t)),fast=evalRelay(1-pp/100,t=>Math.max(0,t-dev(t)));
   band={pickupPercent:pp,timePercent:tp,timeMs:tm,slowS:slow?slow.seconds+br.seconds:null,fastS:fast?fast.seconds+br.seconds:null,slowElement:slow?.element??null,slowTrips:!!slow}}
  if(!nom&&!(band&&band.fastS!==null))return {status:'DOES NOT TRIP',seconds:null,text:`no element picks up at ${Math.round(I)} A`,currentA:I};
  if(band&&!band.slowTrips)return {status:'MAY NOT TRIP (TOLERANCE)',seconds:null,text:`at ${Math.round(I)} A the relay may not pick up at the upper edge of its pickup tolerance`,band,currentA:I};
  const nominalS=nom.seconds+br.seconds,useS=band?band.slowS:nominalS;
  return {status:'OK',seconds:useS,ms:ms(useS),nominalS,nominalMs:ms(nominalS),band,usedEdge:band?'slow edge of tolerance band':'nominal curve (no tolerance entered)',relayS:nom.seconds,breakerS:br.seconds,governingElement:band?band.slowElement:nom.element,
   text:`${nom.text} → relay ${ms(nom.seconds)} ms + ${br.text}`+(band?`; tolerance band ${ms(band.fastS)}–${ms(band.slowS)} ms, ${ms(band.slowS)} ms used`:''),currentA:I,curveSource:device.standard?CURVE_SOURCES[device.standard]:null};
 }
 bad('unknown device type.');
}

function lsiTime(d,I){
 const In=pos(d.inA,'Trip unit rating In (A)',10000),Ir=In*pos(d.irMult,'Long-time pickup Ir (× In)',1.2);
 const tLT=pos(d.ltDelayS,'Long-time delay at 6 × Ir (s)',100);
 const add=fin(d.clearAddMs)?d.clearAddMs/1000:0;if(add<0||add>0.5)bad('extra clearing time for long/short-time zones must be 0–500 ms.');
 const isd=fin(d.sdMult)?d.sdMult*Ir:null,tsd=fin(d.sdDelayS)?d.sdDelayS:null;if((isd===null)!==(tsd===null))bad('enter both short-time pickup (× Ir) and delay (s), or neither.');if(tsd!==null&&(tsd<0||tsd>1))bad('short-time delay must be 0–1 s.');
 const ii=fin(d.iiMult)?d.iiMult*In:null,tii=fin(d.instClearMs)?d.instClearMs/1000:null;if((ii===null)!==(tii===null))bad('enter both instantaneous pickup (× In) and its total clearing time (ms, from the manufacturer), or neither.');if(tii!==null&&(tii<=0||tii>0.2))bad('instantaneous clearing time must be 1–200 ms.');
 const pp=fin(d.tolPickupPercent)?d.tolPickupPercent:0,tp=fin(d.tolTimePercent)?d.tolTimePercent:0,tm=fin(d.tolTimeMs)?d.tolTimeMs:0;
 if(pp<0||pp>20||tp<0||tp>30||tm<0||tm>200)bad('tolerance limits: pickup 0–20 %, time 0–30 %, time 0–200 ms.');
 const run=(k,adj)=>{const parts=[];
  if(I>Ir*k)parts.push({element:'long time',seconds:adj(tLT*(6*Ir/I)**2)+add});
  if(isd!==null&&I>isd*k)parts.push({element:'short time',seconds:adj(tsd)+add});
  if(ii!==null&&I>ii*k)parts.push({element:'instantaneous',seconds:tii});
  return parts.length?parts.reduce((a,b)=>b.seconds<a.seconds?b:a):null};
 const dev=t=>Math.max(t*tp/100,tm/1000),tol=pp||tp||tm;
 const nom=run(1,t=>t),slow=tol?run(1+pp/100,t=>t+dev(t)):nom,fast=tol?run(1-pp/100,t=>Math.max(0,t-dev(t))):nom;
 if(!nom&&!fast)return {status:'DOES NOT TRIP',seconds:null,text:`below long-time pickup ${Math.round(Ir)} A`,currentA:I};
 if(!slow)return {status:'MAY NOT TRIP (TOLERANCE)',seconds:null,text:`near long-time pickup ${Math.round(Ir)} A`,currentA:I};
 const band=tol?{pickupPercent:pp,timePercent:tp,timeMs:tm,slowS:slow.seconds,fastS:fast?.seconds??null,slowElement:slow.element,slowTrips:true}:null;
 return {status:'OK',seconds:slow.seconds,ms:ms(slow.seconds),nominalS:nom?.seconds??null,nominalMs:nom?ms(nom.seconds):null,band,usedEdge:tol?'slow edge of tolerance band':'nominal settings (no tolerance entered)',governingElement:slow.element,
  text:`electronic trip Ir ${Math.round(Ir)} A, tLT ${tLT} s at 6×Ir${isd!==null?`, Isd ${Math.round(isd)} A / ${tsd} s`:''}${ii!==null?`, Ii ${Math.round(ii)} A / ${ms(tii)} ms clearing`:''} → ${slow.element} ${ms(slow.seconds)} ms`+(band?` (band ${band.fastS!==null?ms(band.fastS):'—'}–${ms(band.slowS)} ms)`:''),currentA:I};
}

/** clearing times at the full and reduced arcing currents (kA); share = fraction of bus arcing current seen by the device. */
export function arcFlashClearingTimes(device,fullKA,reducedKA){
 const share=fin(device?.sharePercent)?device.sharePercent:100;
 if(share<=0||share>100)bad('device share of the arcing current must be 1–100 %.');
 const full=clearingTime(device,fullKA*1000*share/100),reduced=clearingTime(device,reducedKA*1000*share/100);
 return {full,reduced,sharePercent:share};
}
export function describeDevice(d){
 if(!d)return '';
 if(d.type==='manual')return 'Typed clearing times';
 if(d.type==='curve')return 'Manufacturer curve: '+String(d.model||'').slice(0,60);
 if(d.type==='lsi')return `Electronic trip · In ${d.inA} A · Ir ${d.irMult}×`+(fin(d.sdMult)?` · Isd ${d.sdMult}× / ${d.sdDelayS} s`:'')+(fin(d.iiMult)?` · Ii ${d.iiMult}×`:'');
 if(d.type==='relay'){const fam=d.standard==='IEC'?IEC_CURVES[d.curve]?.label:IEEE_CURVES[d.curve]?.label;return (fam||'Relay')+(d.pickupA?` · pickup ${d.pickupA} A`:'')+(d.dial?` · dial ${d.dial}`:'')+(d.instPickupA?` · inst ${d.instPickupA} A`:'')+(fin(d.tolTimePercent)||fin(d.tolTimeMs)||fin(d.tolPickupPercent)?' · with tolerance band':'')}
 return '';
}
