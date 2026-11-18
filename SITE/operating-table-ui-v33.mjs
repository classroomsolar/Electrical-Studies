// V33 (list C4): "Bus table (CSV)" on the Operating studies page. Download every bus with its operating data, fill it in a
// spreadsheet, upload it. Changes go through the Studio hook: normal validation, undo history, draft save and recalculation.
import {operatingCsv,applyOperatingCsv} from './operating-table-v33.mjs?v=20261114-v33c4';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const studio=()=>{const s=globalThis.__fcsStudio;if(!s)throw Error('The Studio is still loading. Try again in a moment.');return s};
function download(name,text){const u=URL.createObjectURL(new Blob(['\uFEFF'+text],{type:'text/csv'}));const a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000)}
function openDialog(){
 let p;try{p=studio().snapshot()}catch(e){alert(e.message);return}
 document.getElementById('v33-operating-table')?.remove();
 const d=document.createElement('dialog');d.id='v33-operating-table';d.className='v31-dialog';d.setAttribute('aria-labelledby','v33-operating-table-title');
 d.innerHTML=`<form method="dialog" class="v31-dialog-form"><header><h2 id="v33-operating-table-title">Operating data · bus table</h2><button type="button" class="v31-close" data-v31-close aria-label="Close">×</button></header><div class="v31-dialog-body">
  <p class="v31-lead">Download the ${p.buses.length} buses of <strong>${esc(p.name)}</strong> with their load-flow data as a CSV table. Fill net MW and Mvar in a spreadsheet, then upload the file to enter them in one step.</p>
  <ul class="v31-notes"><li>Rows are matched by <strong>bus_id</strong>. If bus_id is blank, the bus name is used when only one bus has that name.</li><li><strong>net_P_MW / net_Q_Mvar</strong>: generation is positive, load is negative.</li><li><strong>control</strong>: PQ or PV. The slack bus is chosen on the page, not in the table.</li><li>A blank cell leaves the stored value unchanged. Write <em>clear</em> to empty a value. Nothing is filled in for you.</li><li>Rows may be left out. Buses that are not in the file keep their values.</li></ul>
  <div class="v31-actions"><button type="button" class="primary" id="ot-download">Download bus table (CSV)</button><label class="v31-file"><input type="file" id="ot-file" accept=".csv,text/csv"><span>Upload filled table…</span></label></div>
  <p class="v31-summary" role="status" id="ot-status"></p><ul class="v31-errors" id="ot-errors"></ul><footer><button type="button" data-v31-close>Close</button></footer></div></form>`;
 document.body.appendChild(d);d.addEventListener('click',e=>{if(e.target.closest('[data-v31-close]'))d.close()});d.addEventListener('close',()=>d.remove());d.showModal();
 d.querySelector('#ot-download').addEventListener('click',()=>{const q=studio().snapshot(),name=(q.name||'project').replace(/[^a-z0-9_-]+/gi,'-').slice(0,80)+'-operating-buses.csv';download(name,operatingCsv(q))});
 d.querySelector('#ot-file').addEventListener('change',async e=>{
  const file=e.target.files[0];if(!file)return;const status=d.querySelector('#ot-status'),list=d.querySelector('#ot-errors');list.innerHTML='';status.textContent='';
  try{if(file.size>20e6)throw Error('The table exceeds 20 MB.');const text=await file.text();let result;
   studio().apply(q=>{result=applyOperatingCsv(q,text)},'');
   status.textContent=`${result.matched} of ${result.rows} rows matched · ${result.changes} values changed · ${result.cleared} cleared${result.notInFile?` · ${result.notInFile} buses not in the file kept their values`:''}${result.errors.length?` · ${result.errors.length} rows or cells skipped`:''}.`;
   const extra=result.unknownColumns.length?[`Columns not used: ${result.unknownColumns.join(', ')}.`]:[];
   const all=[...extra,...result.errors];list.innerHTML=all.slice(0,50).map(x=>`<li>${esc(x)}</li>`).join('')+(all.length>50?`<li>…and ${all.length-50} more</li>`:'');
  }catch(err){list.innerHTML=`<li>${esc(err.message)}</li>`}e.target.value='';
 });
}
// The button sits above the bus table of the Operating studies page.
function place(){
 const wrap=[...document.querySelectorAll('.operating-table-wrap')].find(w=>/Net P \(MW\)/.test(w.querySelector('thead')?.textContent||''));if(!wrap)return;
 if(wrap.previousElementSibling?.classList?.contains('v33-operating-bulk'))return;
 const bar=document.createElement('div');bar.className='operating-fill v33-operating-bulk';
 bar.innerHTML='<p>Many buses? Enter load and generation for all of them from a spreadsheet.</p><button type="button" data-operating-table>Bus table (CSV): download / upload…</button>';
 wrap.parentNode.insertBefore(bar,wrap);
}
let queued=false;const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;try{place()}catch{}})};
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});schedule();
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-operating-table]');if(!b)return;e.preventDefault();e.stopPropagation();openDialog()},true);
