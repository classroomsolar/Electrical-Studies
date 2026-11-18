// IEEE 1584-2018 arc-flash calculation interface; opt-in isolated module.
// V29: computed in the browser by ieee1584-2018.mjs (port of MIT arcflash-calc). No study data leaves the browser.
// Explicit documented full/reduced-current clearing times are mandatory.
import {parseManufacturerCurve,evaluateManufacturerCurve} from './manufacturer-tcc.mjs';
import {ieee1584Calculate} from './ieee1584-2018.mjs'; // V29: computed locally in the browser
const API = 'https://fault-studio-ieee1584-api.vercel.app/api/arcflash';
const exampleTcc = Object.freeze({model:'ILLUSTRATIVE SAMPLE — NOT OEM',source:'DEMONSTRATION ONLY — REPLACE WITH OEM DOCUMENT',revision:'illustrative-2026-10',singleRadialPathConfirmed:false,curveCsv:'1000,1.2,1.5\n5000,0.35,0.50\n15000,0.10,0.18\n40000,0.045,0.08\n60000,0.03,0.05'});
const example = Object.freeze({
  voltageKV:0.480,boltedFaultKA:45,electrodeConfiguration:'VCB',gapMM:32,
  workingDistanceMM:609.6,enclosureHeightMM:610,enclosureWidthMM:610,
  enclosureDepthMM:254,clearingFullMS:61.3,clearingReducedMS:319
});
function setup(){
 if(document.getElementById('fcs-ieee-arc-open'))return;
 const css=document.createElement('style');
 css.textContent=`#fcs-ieee-arc-open{position:fixed;bottom:299px;right:17px;z-index:3900;border:2px solid #d6a86a;color:#fff;background:#503e48;padding:11px 14px;border-radius:24px;font:600 13px system-ui;cursor:pointer;max-width:185px}
 #fcs-ieee-arc-overlay{display:none;position:fixed;inset:0;background:#071826df;z-index:4025;align-items:center;justify-content:center;padding:12px;box-sizing:border-box;font:14px system-ui}
 #fcs-ieee-arc-overlay[data-open=true]{display:flex}
 #fcs-ieee-arc-panel{background:#f8fafb;color:#152d3a;width:min(790px,100%);max-height:94vh;overflow:auto;border-radius:14px;padding:20px;box-sizing:border-box}
 #fcs-ieee-arc-panel h2{font:700 21px system-ui;margin:0 0 10px}
 #fcs-ieee-arc-panel .warning{border-left:4px solid #b15c28;background:#fff0e3;padding:10px;line-height:1.45}
 #fcs-ieee-arc-panel button{padding:10px 13px;margin:5px;background:#28566e;color:white;border:0;border-radius:7px;font:600 13px system-ui;cursor:pointer}
 #fcs-ieee-arc-panel button:disabled{opacity:.5;cursor:wait}
 #fcs-ieee-arc-input{width:100%;min-height:220px;box-sizing:border-box;resize:vertical;font:12px ui-monospace,monospace;line-height:1.45;border:1px solid #9fb6c0;border-radius:7px;padding:10px}
#fcs-ieee-arc-tcc{width:100%;min-height:145px;box-sizing:border-box;font:12px ui-monospace,monospace;border:1px solid #9fb6c0;border-radius:7px;padding:10px} #fcs-ieee-arc-output{background:#eaf1f5;white-space:pre-wrap;word-break:break-word;max-height:300px;overflow:auto;padding:12px;font:12px ui-monospace,monospace}
 #fcs-ieee-arc-status{min-height:24px}
 @media(max-height:650px){#fcs-ieee-arc-open{bottom:10px;left:10px;right:auto}}
 `;document.head.append(css);
 const open=document.createElement('button');open.id='fcs-ieee-arc-open';open.type='button';open.textContent='Arc flash · IEEE 1584';document.body.append(open);
 const o=document.createElement('div');o.id='fcs-ieee-arc-overlay';o.innerHTML=`<section id="fcs-ieee-arc-panel" role="dialog" aria-modal="true" aria-label="IEEE 1584 arc-flash calculations">
 <div style="display:flex;justify-content:space-between;gap:10px"><h2>IEEE 1584-2018 arc-flash calculations</h2><button data-arc="close">Close</button></div>
 <p class="warning"><strong>Qualified-engineer study required.</strong> This method is only applicable to documented three-phase AC systems 208 V–15 kV within the IEEE test envelope. BOTH clearing times must be independently determined at the calculated <em>full and reduced arcing currents</em>, including relay plus breaker operation. Do not infer these from bolted fault current alone. No PPE selection, approved arc-flash label, or construction sign-off is issued. The sample inputs are illustrative IEEE Annex D.2 data, NOT your actual plant.</p>
 <label for="fcs-ieee-arc-input"><b>Reviewed inputs (explicit units; JSON)</b></label>
 <textarea id="fcs-ieee-arc-input" spellcheck="false"></textarea>
 <div><button data-arc="run">Compute with documented times</button><button data-arc="example">Restore Annex D.2 example</button><button data-arc="export">Export auditable JSON</button></div>
 <details><summary><b>Optional: derive times from documented manufacturer TCC envelope</b></summary><p>For a <strong>single radial fault path only</strong>, if every ampere of calculated arcing current passes through the studied device, enter its documented total-clearing envelope (primary amperes, min clearing seconds, max clearing seconds). No extrapolation or guessed CT/source factors. Set <code>singleRadialPathConfirmed=true</code> only after verifying that condition. Curves have not been authenticated by this software.</p>
 <label for="fcs-ieee-arc-tcc">Documented TCC input (JSON)</label><textarea id="fcs-ieee-arc-tcc" spellcheck="false"></textarea><button data-arc="curve">Compute from documented worst-case total clearing curve</button></details>
 <p id="fcs-ieee-arc-status" role="status" aria-live="polite"></p><pre id="fcs-ieee-arc-output">No result. Enter studied protection clearing times.</pre>
 <small>Independent Python engine: MIT-licensed <a href="https://github.com/LiaungYip/arcflash" target="_blank" rel="noopener noreferrer">arcflash-calc</a>, validated against IEEE Annex D examples. Calculated in your browser by a JavaScript port of the same library, checked against IEEE Annex D.1/D.2 and 105,120 official IEEE 1584-2018 calculator results. Study inputs are not sent anywhere.</small>
 </section>`;document.body.append(o);
 const input=o.querySelector('#fcs-ieee-arc-input'),curveInput=o.querySelector('#fcs-ieee-arc-tcc'),result=o.querySelector('#fcs-ieee-arc-output'),status=o.querySelector('#fcs-ieee-arc-status');
 let last=null,busy=false;
 const restore=()=>{input.value=JSON.stringify(example,null,2);curveInput.value=JSON.stringify(exampleTcc,null,2);last=null;result.textContent='No result; illustrative IEEE Annex D.2 example only.';status.textContent='';};restore();
 const close=()=>o.dataset.open='false';open.addEventListener('click',()=>o.dataset.open='true');o.addEventListener('click',e=>{if(e.target===o)close()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&o.dataset.open==='true')close()});
 o.addEventListener('click',async e=>{
  const btn=e.target.closest('button[data-arc]');if(!btn)return;const action=btn.dataset.arc;
  if(action==='close')return close();if(action==='example')return restore();
  if(action==='export'){
   if(!last){status.textContent='No verified calculation to export.';return;}
   const u=URL.createObjectURL(new Blob([JSON.stringify(last,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=u;a.download='fault-studio-ieee1584-both-current-cases.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);status.textContent='Calculation inputs, method and both current cases exported.';return;
  }
  if(action==='run'||action==='curve'){
   if(busy)return;
   let data;try{
    if(input.value.length>8192)throw Error('Input exceeds maximum JSON size');
    data=JSON.parse(input.value);
    if(!data||Array.isArray(data)||typeof data!=='object')throw Error('Input must be a JSON object');
   }catch(err){last=null;result.textContent='NO RESULT';status.textContent='Blocked: '+err.message;return;}
   busy=true;btn.disabled=true;last=null;result.textContent='No results until the calculation passes';status.textContent='Calculating full and reduced arcing-current cases…';
   const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),25000);
   try{
    const call=async payload=>{const val=ieee1584Calculate(payload);if(val.status!=='IEEE1584_2018_EXPLICIT_CLEARING_TIMES'||!Array.isArray(val.cases)||val.cases.length!==2)throw Error('Unrecognized IEEE calculation response');return val;};
    let val=await call(data);let protectionTrace=null;
    if(action==='curve'){
     if(curveInput.value.length>16000)throw Error('TCC input is oversized');
     const config=JSON.parse(curveInput.value);
     if(config?.singleRadialPathConfirmed!==true)throw Error('Cannot equate bus arcing current with device primary current without explicit, documented single-radial-path confirmation');
     const parsed=parseManufacturerCurve(config),trace=[];
     for(const c of val.cases){const at=evaluateManufacturerCurve(parsed,c.arcingCurrentKA*1000);
      if(at.status!=='WITHIN_ENTERED_SOURCE_POINTS')throw Error('Arcing current outside documented protective device total-clearing curve: '+c.arcingCurrentKA.toFixed(3)+' kA');
      if(!(at.maxS>=at.minS&&at.maxS<=2&&at.maxS>=.001))throw Error('Device worst-case clearing time falls outside calculation service 1–2000 ms domain');
      trace.push({case:c.case,arcingCurrentKA:c.arcingCurrentKA,primaryA:at.primaryA,minTotalClearingS:at.minS,maxTotalClearingS:at.maxS,method:at.interpolation});
     }
     const times={...data,clearingFullMS:trace[0].maxTotalClearingS*1000,clearingReducedMS:trace[1].maxTotalClearingS*1000};
     const final=await call(times);
     for(let i=0;i<2;i++)if(Math.abs(final.cases[i].arcingCurrentKA-val.cases[i].arcingCurrentKA)>1e-7)throw Error('Arcing-current mismatch during documented-curve recalculation');
     val=final;protectionTrace={device:parsed.model,publication:parsed.source,revision:parsed.revision,singleRadialPathConfirmed:true,sourcePoints:parsed.points,evaluated:trace,scope:'Documented user-digitized total clearing maximum envelope; not independently authenticated to manufacturer and not device-setting approval.'};
    }
    last={source:'IEEE1584_2018_APPLICABILITY_BOUNDED',timestamp:new Date().toISOString(),...val,...(protectionTrace?{protectionTrace}:{})};
    result.textContent=JSON.stringify(last,null,2);
    status.textContent='Both arcing-current cases computed'+(protectionTrace?' with interpolated documented total-clearing upper envelope':'')+'. Verify manufacturer source, device current path and ALL operating scenarios before use.';
    status.style.color='#205f39';
   }catch(err){status.textContent='NO VALID INCIDENT ENERGY: '+err.message;status.style.color='#ae2020';result.textContent='NO RESULT';}
   finally{clearTimeout(timeout);busy=false;btn.disabled=false;}
  }
 });
}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();}
