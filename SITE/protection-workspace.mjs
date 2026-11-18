import {reviewManufacturerCoordination,manufacturerEnvelopeInputsFromProtection} from './manufacturer-tcc.mjs?v=20261025-batch13';
import {compareProtectionPair,nominalDeviceTrip} from './protection-study.mjs?v=20261024-batch02';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const val=v=>v==null?'':esc(v);
const fmt=(v,n=4)=>Number.isFinite(v)?v.toLocaleString('en-US',{maximumFractionDigits:n}):'Not available';
const fields=[['ctPrimaryA','CT primary rating (A)'],['ctSecondaryA','CT secondary rating (A)'],['pickupSecondaryA','Relay secondary pickup (A)'],['tms','Time multiplier setting'],['breakerTimeS','Breaker opening time (s)'],['instantPickupSecondaryA','Optional instantaneous pickup (secondary A)'],['instantDelayS','Optional instantaneous delay (s)']];
function device(name,data={}){return `<fieldset class="operating-card"><legend>${name==='downstream'?'Downstream device':'Upstream device'}</legend><label class="operating-field">IEC curve<select data-protection-device="${name}" data-protection-field="curve"><option value="">Select documented curve</option>${[['normal','Normal inverse'],['very','Very inverse'],['extreme','Extremely inverse'],['long','Long-time inverse']].map(([v,l])=>`<option value="${v}" ${data.curve===v?'selected':''}>${l}</option>`).join('')}</select></label><div class="operating-grid">${fields.map(([key,label])=>`<label class="operating-field">${label}<input type="number" step="any" min="0" data-protection-device="${name}" data-protection-field="${key}" value="${val(data[key])}" placeholder="${key.startsWith('instant')?'Optional':'Required'}"></label>`).join('')}</div></fieldset>`;}

// Accessible, numeric-only SVG. Sample both devices on a COMMON primary ampere
// axis. No route/device current inferred: actual independent CT currents remain inputs.
export function nominalTccSvg(cfg){
 try{
   compareProtectionPair(cfg);
   const ds=cfg.downstream,us=cfg.upstream;
   const pickups=[ds,us].map(d=>d.pickupSecondaryA*d.ctPrimaryA/d.ctSecondaryA);
   const x0=Math.log10(Math.min(...pickups)*1.02),x1=Math.log10(Math.max(...pickups)*30);
   const y0=Math.log10(0.005),y1=Math.log10(1000);
   const W=720,H=270,L=72,R=26,T=18,B=48;
   const xx=v=>L+(Math.log10(v)-x0)/(x1-x0)*(W-L-R);
   const yy=v=>T+(y1-Math.log10(v))/(y1-y0)*(H-T-B);
   const curves=[[ds,'#185780','Downstream'],[us,'#b45e29','Upstream']];
   const paths=curves.map(([d,color,label])=>{
     let path='',drawing=false;
     for(let i=0;i<140;i++){
       const current=Math.pow(10,x0+(x1-x0)*i/139);
       const time=nominalDeviceTrip(d,current).clearingTimeS;
       if(time!=null&&time>=Math.pow(10,y0)&&time<=Math.pow(10,y1)){
         path+=(drawing?'L':'M')+xx(current).toFixed(2)+','+yy(time).toFixed(2)+' ';
         drawing=true;
       }else drawing=false;
     }
     return `<path d="${path.trim()}" stroke="${color}" stroke-width="2.6" fill="none" aria-label="${label} nominal clearing time curve"/>`;
   }).join('');
   const yGrid=[0.01,.1,1,10,100,1000].map(t=>`<line x1="${L}" x2="${W-R}" y1="${yy(t)}" y2="${yy(t)}" stroke="#d8e3e7"/><text x="${L-12}" y="${yy(t)+4}" font-size="12" fill="#4b6471" text-anchor="end">${t}</text>`).join('');
   const xGrid=Array.from({length:6},(_,i)=>Math.pow(10,x0+(x1-x0)*i/5)).map(v=>`<line x1="${xx(v)}" x2="${xx(v)}" y1="${T}" y2="${H-B}" stroke="#e5edf1"/><text x="${xx(v)}" y="${H-B+18}" font-size="10" fill="#4b6471" text-anchor="middle">${v<1000?v.toFixed(0):(v/1000).toFixed(1)+'k'}</text>`).join('');
   return `<figure class="tcc-chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Nominal inverse time versus primary current for downstream and upstream protective devices. Values are not manufacturer tolerance certified." preserveAspectRatio="xMidYMid meet"><title>Nominal protection curves — screening only</title><desc>Two device clearing time curves on common logarithmic CT primary ampere axis. Inverse-time curves and modeled instantaneous stage, plus user-entered breaker opening times. No manufacturer tolerances.</desc>${yGrid}${xGrid}${paths}<text x="${W/2}" y="${H-7}" text-anchor="middle" font-size="12">CT primary current (A; logarithmic)</text><text transform="translate(18 ${H/2}) rotate(-90)" text-anchor="middle" font-size="12">Nominal clearing time (s; log)</text></svg><figcaption><span class="downstream">Downstream</span> <span class="upstream">Upstream</span> — arithmetic-only preview. Device tolerances and actual path currents require engineering verification.</figcaption></figure>`;
 }catch{return '';}
}
function manufacturerFields(name,data={}){
 const inp=(key,label,wide=false)=>`<label class="operating-field">${label}${wide?`<textarea rows="5" spellcheck="false" data-protection-device="${name}" data-protection-field="${key}" placeholder="100,0.10,0.15\n200,0.04,0.06">${val(data[key])}</textarea>`:`<input type="text" data-protection-device="${name}" data-protection-field="${key}" value="${val(data[key])}" placeholder="Required source reference">`}</label>`;
 return `<fieldset class="operating-card"><legend>${name==='downstream'?'Downstream':'Upstream'} verified-source envelope</legend>${inp('manufacturerModel','Exact device model')}${inp('manufacturerSource','Manufacturer publication identifier / reference')}${inp('manufacturerRevision','Publication revision / date')}${inp('manufacturerCurveCsv','Primary current (A), MINIMUM total clearing (s), MAXIMUM total clearing (s) — comma-separated rows',true)}</fieldset>`;
}
function manufacturerReview(cfg){
 return reviewManufacturerCoordination(manufacturerEnvelopeInputsFromProtection(cfg));
}
export function protectionWorkspaceMarkup(project){const cfg=project.operatingStudy?.protection||{};let result,err='',vendor=null,vendorError='';const vendorAttempted=['downstream','upstream'].some(name=>['manufacturerModel','manufacturerSource','manufacturerRevision','manufacturerCurveCsv'].some(key=>String(cfg[name]?.[key]??'').trim()));try{result=compareProtectionPair(cfg)}catch(e){err=e.message}if(vendorAttempted)try{vendor=manufacturerReview(cfg)}catch(e){vendorError=e.message}
 return `<section class="operating-protection" aria-label="Two device protection screening"><header><span class="eyebrow">BATCH 02 · PROTECTION / TCC · NOMINAL ONLY</span><h3>Two-device protection coordination screening</h3></header>
 <p>Enter <strong>actual current at each protective CT independently</strong>. The fault current at a selected bus is not necessarily the current through each device, particularly with multiple sources. CT inputs are assumed ideal; this does not check CT class, burden or saturation.</p>
 <div class="operating-grid"><label class="operating-field">Downstream CT primary fault current (A)<input type="number" step="any" min="0" data-protection-top="downstreamPrimaryA" value="${val(cfg.downstreamPrimaryA)}" placeholder="Required"></label><label class="operating-field">Upstream CT primary fault current (A)<input type="number" step="any" min="0" data-protection-top="upstreamPrimaryA" value="${val(cfg.upstreamPrimaryA)}" placeholder="Required"></label><label class="operating-field">Required coordination margin (s)<input type="number" step="any" min="0" data-protection-top="requiredMarginS" value="${val(cfg.requiredMarginS)}" placeholder="Required from project criteria"></label></div>
 <div class="operating-card-grid">${device('downstream',cfg.downstream)}${device('upstream',cfg.upstream)}</div>
 ${err?`<p class="operating-blocker" role="status">Cannot compare device operation: ${esc(err)}</p>`:`<div role="status" class="${result.status==='NOMINAL_MARGIN_MET'?'operating-ok':'operating-blocker'}"><strong>${esc(result.status.replaceAll('_',' '))}</strong><p>Downstream: ${fmt(result.downstream.relayOperateS)} s relay + ${fmt(result.downstream.breakerTimeS)} s breaker = ${fmt(result.downstream.clearingTimeS)} s | Upstream: ${fmt(result.upstream.relayOperateS)} s relay + ${fmt(result.upstream.breakerTimeS)} s breaker = ${fmt(result.upstream.clearingTimeS)} s.</p><p>Nominal clearing margin: ${fmt(result.marginS)} s. Required (project entry): ${fmt(result.requiredMarginS)} s. Not an approved coordination outcome.</p></div>`}
 ${nominalTccSvg(cfg)}
 <section class="operating-card"><h4>Manufacturer documented total-clearing envelope — separate preview</h4><p>Paste only traceable, device-specific published or approved coordination-study points. Each row is primary current (A), minimum and maximum <strong>total clearing</strong> time (s), including the breaker. Strictly continuous inverse segments only; split discontinuities into separate evaluations. Input is never substituted into the nominal IEC curves.</p><div class="operating-card-grid">${manufacturerFields('downstream',cfg.downstream)}${manufacturerFields('upstream',cfg.upstream)}</div>
 <p role="status" class="${vendor?.status==='ENTERED_ENVELOPE_MARGIN_MET'?'operating-ok':'operating-blocker'}">${!vendorAttempted?'Enter documented source curves for both devices to start the independent envelope review.':vendorError?esc('Manufacturer envelope not evaluated: '+vendorError):vendor?esc(vendor.status.replaceAll('_',' '))+'. Worst-case upstream MINUS downstream clearing margin: '+fmt(vendor.worstCaseMarginS)+' s. Required margin: '+fmt(vendor.requiredMarginS)+' s.':'No qualified source data supplied.'}</p><button data-action="manufacturer-tcc-csv" ${vendor?'':'disabled'}>Export entered source points and envelope review CSV</button><p class="operating-limits">No extrapolation outside the provided curve range. User-entered source values are not automatically authenticated; confirm source suitability, fault-path currents, CT performance, OEM trip tolerances, standards and field settings independently. Not construction-approved coordination.</p></section>
 <button data-action="protection-tcc-csv" ${result?'':'disabled'}>Export nominal TCC samples CSV</button>
 <p class="operating-limits">No automatic protective settings, manufacturer time/current tolerance bands, fuse curves, short-time/long-time breaker characteristics, CT saturation, ZSI, ground protection or sequence of operation. Unsupported / incomplete inputs explicitly block the preview.</p></section>`;
}
