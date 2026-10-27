/* Fault Current Studio V25 — original capability-navigation enhancement.
 * Visual/navigation only. Does not read or modify project data or Cloud Vault.
 */
(()=>{
 'use strict';
 const commands=[
  ['network','Single-line editor','Connect equipment and model the fault network','⌁'],
  ['results','Results & calculations','Read calculated faults and equipment duty','∑'],
  ['operating','Operating studies','Inspect power flow and protection screening','◉'],
  ['advanced','Engineering studies','Advanced input and screening workspace','⚙'],
  ['database','Master database','Locate equipment and manufacturer references','▦'],
  ['projects','Saved studies & backups','Preserve, open and export local studies','▤'],
  ['report','Engineering reports','Generate and check reports','↗'],
  ['atlas','Capability atlas','Benchmark coverage, limits and next steps','◈']
 ];
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let dialog=null,focusReturn=null;
 function ensure(){
  if(dialog)return dialog;
  dialog=document.createElement('dialog');dialog.id='fcs-command-dialog';dialog.setAttribute('aria-label','Find a tool');
  dialog.innerHTML=`<div class="command-shell"><div class="command-top"><span class="command-brand">FAULT CURRENT STUDIO <b>/ QUICK NAVIGATION</b></span><button type="button" class="command-close" data-fcs-command-close aria-label="Close tool search">ESC ×</button></div><label for="fcs-command-search">Find a tool</label><input id="fcs-command-search" type="search" placeholder="Search calculations, projects, reports…" autocomplete="off" aria-controls="fcs-command-items" spellcheck="false"><div id="fcs-command-items" role="listbox" aria-label="Tools"></div><div class="command-help">Enter to open first result · Escape to close · Ctrl+K to toggle</div></div>`;
  document.body.append(dialog);dialog.addEventListener('close',()=>{focusReturn?.focus?.({preventScroll:true});focusReturn=null});
  render('');return dialog;
 }
 function render(q){
  if(!dialog)return;
  const list=dialog.querySelector('#fcs-command-items');
  const filtered=commands.filter(([id,label,desc])=>(id+' '+label+' '+desc).toLowerCase().includes(q.trim().toLowerCase()));
  list.innerHTML=filtered.length?filtered.map(([id,label,desc,mark],i)=>`<a role="option" class="command-item" aria-selected="${i===0}" href="#${esc(id)}" data-fcs-command-target="${esc(id)}"><span class="command-symbol" aria-hidden="true">${mark}</span><span><strong>${esc(label)}</strong><small>${esc(desc)}</small></span><span aria-hidden="true" class="command-arrow">↗</span></a>`).join(''):'<p class="command-empty">No matching tool. Try “fault”, “data”, or “report”.</p>';
 }
 function open(){const d=ensure();focusReturn=document.activeElement;if(!d.open){d.showModal()}d.querySelector('#fcs-command-search').value='';render('');d.querySelector('#fcs-command-search').focus();}
 function close(){if(dialog?.open)dialog.close();}
 document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(dialog?.open)close();else open();return;}
  if(e.key==='/'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.target.closest?.('input,select,textarea,[contenteditable]')){e.preventDefault();open();return;}
  if(e.key==='Enter'&&dialog?.open&&document.activeElement?.id==='fcs-command-search'){
   const first=dialog.querySelector('[data-fcs-command-target]');if(first){e.preventDefault();location.hash=first.getAttribute('href');close();}
  }
 });
 document.addEventListener('click',e=>{
  if(e.target.closest?.('[data-quick-nav="open"]')){e.preventDefault();open();return;}
  if(e.target.closest?.('[data-fcs-command-close]')){close();return;}
  const target=e.target.closest?.('[data-fcs-command-target]');if(target){close();return;}
  const f=e.target.closest?.('[data-atlas-filter]');if(f){
   const area=document.querySelector('.atlas-page');if(!area)return;
   for(const b of area.querySelectorAll('[data-atlas-filter]'))b.setAttribute('aria-pressed',String(b===f));
   filterAtlas();
  }
 });
 document.addEventListener('input',e=>{
  if(e.target?.id==='fcs-command-search')render(e.target.value);
  if(e.target?.id==='atlas-search')filterAtlas();
 });
 function filterAtlas(){
  const area=document.querySelector('.atlas-page');if(!area)return;
  const q=(area.querySelector('#atlas-search')?.value||'').toLowerCase().trim(),f=area.querySelector('[data-atlas-filter][aria-pressed=true]')?.dataset.atlasFilter||'all';
  let shown=0;const rows=area.querySelectorAll('[data-atlas-status]');
  for(const card of rows){const match=(f==='all'||card.dataset.atlasStatus===f)&&(!q||card.dataset.atlasText.includes(q));card.hidden=!match;if(match)shown++}
  const count=area.querySelector('#atlas-count');if(count)count.textContent=`${shown} of ${rows.length} shown`;
  const empty=area.querySelector('#atlas-empty');if(empty)empty.hidden=shown!==0;
 }
})();
