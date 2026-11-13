/**
 * V29c additive studies: IEEE 519 harmonic limits at the PCC, and power-factor correction with a parallel-resonance check.
 *
 * IEEE 519 limits (IEEE Std 519-2022, same voltage limits and odd/TDD current limits as 519-2014):
 *  - Table 1 voltage distortion: <=1 kV 5.0 % individual / 8.0 % THD; 1-69 kV 3.0 / 5.0; 69-161 kV 1.5 / 2.5; >161 kV 1.0 / 1.5.
 *  - Table 2 (120 V - 69 kV) and Table 3 (69-161 kV) odd current limits in % of IL by Isc/IL.
 *  - Even harmonics: 2022 edition — orders 2, 4, 6 limited to 50 % of the 3<=h<11 limit, higher even orders same as odd
 *    in their range; 2014 edition — all even orders 25 % of the odd limit in their range (selectable).
 *  - Systems above 161 kV (Table 4) are not covered here.
 * Power-factor correction: Qc = P (tan phi1 - tan phi2); parallel resonance order h = sqrt(Ssc / Qc);
 * voltage rise ~ Qc / Ssc. Textbook relations (IEEE 1531 / IEEE 18 practice); the capacitor bank and
 * any detuning reactor must be specified from the manufacturer's data.
 */
export const POWER_QUALITY_V29={id:'ieee519-pcc-and-pf-resonance-v29',version:'29.1.0'};
const fin=x=>typeof x==='number'&&Number.isFinite(x);
const bad=m=>{throw Error('Power quality: '+m)};
const need=(x,k,lo,hi,label=k)=>{if(!fin(x[k])||x[k]<lo||x[k]>hi)bad(`${label} must be a number from ${lo} to ${hi}.`);return x[k]};

export const VOLTAGE_LIMITS=[{maxKV:1,individual:5.0,thd:8.0,label:'V <= 1.0 kV'},{maxKV:69,individual:3.0,thd:5.0,label:'1 kV < V <= 69 kV'},{maxKV:161,individual:1.5,thd:2.5,label:'69 kV < V <= 161 kV'},{maxKV:Infinity,individual:1.0,thd:1.5,label:'V > 161 kV'}];
// rows: [upper Isc/IL bound (exclusive), [3-11, 11-17, 17-23, 23-35, 35-50], TDD]
const T2=[[20,[4.0,2.0,1.5,0.6,0.3],5.0],[50,[7.0,3.5,2.5,1.0,0.5],8.0],[100,[10.0,4.5,4.0,1.5,0.7],12.0],[1000,[12.0,5.5,5.0,2.0,1.0],15.0],[Infinity,[15.0,7.0,6.0,2.5,1.4],20.0]];
const T3=[[20,[2.0,1.0,0.75,0.3,0.15],2.5],[50,[3.5,1.75,1.25,0.5,0.25],4.0],[100,[5.0,2.25,2.0,0.75,0.35],6.0],[1000,[6.0,2.75,2.5,1.0,0.5],7.5],[Infinity,[7.5,3.5,3.0,1.25,0.7],10.0]];
const RANGES=[[3,11],[11,17],[17,23],[23,35],[35,51]];
const rangeIndex=h=>h<3?0:RANGES.findIndex(([a,b])=>h>=a&&h<b);
export function currentLimitRow(kV,ratio){
 if(kV>161)bad('systems above 161 kV (IEEE 519 Table 4) are not covered by this tool.');
 const T=kV>69?T3:T2,row=T.find(r=>ratio<r[0]);return {table:kV>69?'Table 3 (69–161 kV)':'Table 2 (120 V–69 kV)',odd:row[1],tdd:row[2],ratioBand:row[0]};
}
export function harmonicLimit(h,row,edition='2022'){
 const i=rangeIndex(h),odd=row.odd[i];
 if(h%2===1)return odd;
 if(edition==='2014')return 0.25*odd;
 return h<=6?0.5*row.odd[0]:odd;
}

/** x: {pccVoltageKV, iscA, ilA, edition:'2022'|'2014', currents:{h:amps}|currentPercent:{h:% of IL}, voltagesPercent:{h:%}, includesGeneration} */
export function ieee519Check(x){
 if(!x||typeof x!=='object')bad('enter the PCC data.');
 const kV=need(x,'pccVoltageKV',0.12,161,'PCC voltage (kV)'),isc=need(x,'iscA',1,1e7,'Maximum short-circuit current at the PCC (A)'),il=need(x,'ilA',0.1,1e6,'Maximum demand load current IL (A)');
 if(isc<=il)bad('Isc must be larger than IL.');
 const edition=x.edition==='2014'?'2014':'2022',ratio=isc/il,row=currentLimitRow(kV,ratio);
 const src=x.currentPercent&&Object.keys(x.currentPercent).length?'percent':'amps',data=src==='percent'?x.currentPercent:(x.currents||{});
 const rows=[];let sumsq=0;
 for(const [k,v] of Object.entries(data)){const h=Number(k);if(!Number.isInteger(h)||h<2||h>50)bad('harmonic order must be 2 to 50.');if(v===''||v===null||v===undefined)continue;if(!fin(v)||v<0)bad(`harmonic ${h}: enter a non-negative number.`);
  const pct=src==='percent'?v:100*v/il,lim=harmonicLimit(h,row,edition);sumsq+=pct*pct;rows.push({h,percentOfIL:pct,amps:pct*il/100,limitPercent:lim,ok:pct<=lim+1e-12})}
 rows.sort((a,b)=>a.h-b.h);
 const tdd=Math.sqrt(sumsq),vl=VOLTAGE_LIMITS.find(r=>kV<=r.maxKV);
 const vrows=[];let vsq=0;
 for(const [k,v] of Object.entries(x.voltagesPercent||{})){const h=Number(k);if(!Number.isInteger(h)||h<2||h>50)bad('voltage harmonic order must be 2 to 50.');if(v===''||v===null||v===undefined)continue;if(!fin(v)||v<0)bad(`voltage harmonic ${h}: enter a non-negative number.`);vsq+=v*v;vrows.push({h,percent:v,limitPercent:vl.individual,ok:v<=vl.individual+1e-12})}
 vrows.sort((a,b)=>a.h-b.h);const thd=vrows.length?Math.sqrt(vsq):null;
 const notes=[];
 if(x.includesGeneration)notes.push(edition==='2022'?'IEEE 519-2022: where the PCC includes inverter-based or distributed generation, IEEE 1547-2018 or IEEE 2800-2022 current-distortion requirements may apply instead; check which applies.':'IEEE 519-2014 footnote: power generation equipment is limited to the Isc/IL < 20 row regardless of the actual ratio.');
 let usedRow=row;if(x.includesGeneration&&edition==='2014'){usedRow={...currentLimitRow(kV,1),ratioBand:20};for(const r of rows){r.limitPercent=harmonicLimit(r.h,usedRow,edition);r.ok=r.percentOfIL<=r.limitPercent+1e-12}}
 const currentOk=rows.every(r=>r.ok)&&tdd<=usedRow.tdd+1e-12,voltageOk=vrows.every(r=>r.ok)&&(thd===null||thd<=vl.thd+1e-12);
 return {status:currentOk&&voltageOk?'WITHIN LIMITS':'EXCEEDS LIMITS',method:POWER_QUALITY_V29.id,edition:'IEEE Std 519-'+edition,
  iscOverIl:ratio,currentTable:usedRow.table,oddLimits:usedRow.odd,tddLimit:usedRow.tdd,tddPercent:tdd,tddOk:tdd<=usedRow.tdd+1e-12,currentRows:rows,
  voltageBand:vl.label,voltageIndividualLimit:vl.individual,voltageThdLimit:vl.thd,thdPercent:thd,voltageRows:vrows,currentOk,voltageOk,notes,
  limitations:['Compare against measured 95th-percentile very-short (3 s) and short (10 min) values over a week as the standard describes; a single snapshot is a screening check.','IL is the maximum demand load current at the PCC (average of the 12 previous monthly peaks, or the design estimate for a new facility).','Interharmonics, notching and systems above 161 kV are not checked.']};
}

/** x: {pKW, pfExisting, pfTarget, kvarInstalled?, voltageKV, scMVA (at the capacitor bus), harmonics:[5,7,11,13], marginPercent:10} */
export function pfCorrection(x){
 if(!x||typeof x!=='object')bad('enter the load data.');
 const P=need(x,'pKW',0.1,1e7,'Real power (kW)'),pf1=need(x,'pfExisting',0.05,1,'Existing power factor'),pf2=need(x,'pfTarget',0.05,1,'Target power factor');
 if(pf2<pf1)bad('target power factor must be at least the existing one.');
 const tan=pf=>Math.sqrt(1-pf*pf)/pf,qReq=P*(tan(pf1)-tan(pf2));
 const qc=fin(x.kvarInstalled)&&x.kvarInstalled>0?x.kvarInstalled:qReq;
 const sc=need(x,'scMVA',0.01,1e6,'Short-circuit MVA at the capacitor bus');
 const kV=need(x,'voltageKV',0.1,800,'Bus voltage (kV)');
 const out={method:POWER_QUALITY_V29.id,requiredKvar:qReq,bankKvar:qc,voltageKV:kV,scMVA:sc,
  pfWithBank:P/Math.hypot(P,P*tan(pf1)-qc),leading:P*tan(pf1)-qc<0};
 if(qc<=0){out.status='NO CORRECTION NEEDED';out.resonance=null;return out}
 const h=Math.sqrt(sc*1000/qc),harm=Array.isArray(x.harmonics)&&x.harmonics.length?x.harmonics:[5,7,11,13],m=fin(x.marginPercent)?x.marginPercent:10;
 if(harm.some(v=>!Number.isInteger(v)||v<2||v>50))bad('harmonic orders must be whole numbers 2–50.');
 if(m<0||m>50)bad('resonance margin must be 0–50 %.');
 const near=harm.filter(n=>Math.abs(h-n)/n<=m/100);
 out.resonance={order:h,frequencyFactor:h,nearHarmonics:near,marginPercent:m};
 out.voltageRisePercent=100*qc/(sc*1000);
 out.status=near.length?'RESONANCE RISK':'NO RESONANCE NEAR LISTED HARMONICS';
 out.notes=[`Parallel resonance at about h = sqrt(Ssc/Qc) = ${h.toFixed(2)} (${(h*(x.frequencyHz||60)).toFixed(0)} Hz at ${x.frequencyHz||60} Hz).`];
 if(near.length)out.notes.push(`Within ±${m} % of harmonic(s) ${near.join(', ')} present at this bus: use a detuned (harmonic-blocking) or filter bank designed with the manufacturer, or change the bank size or steps.`);
 out.notes.push('Check each switched step, not only the full bank: smaller steps resonate at higher orders.');
 out.steps=fin(x.steps)&&x.steps>1?Array.from({length:Math.round(x.steps)},(_,i)=>{const q=qc*(i+1)/Math.round(x.steps),hh=Math.sqrt(sc*1000/q);return {kvar:q,order:hh,near:harm.filter(n=>Math.abs(hh-n)/n<=m/100)}}):null;
 if(out.steps?.some(s=>s.near.length)&&out.status!=='RESONANCE RISK')out.status='RESONANCE RISK AT A STEP';
 out.limitations=['Single-bus approximation: source short-circuit MVA only, other capacitors, cables and motors ignored.','Harmonic currents, capacitor rated voltage/current/kvar limits (IEEE 18) and switching transients need the bank manufacturer’s data.'];
 return out;
}
