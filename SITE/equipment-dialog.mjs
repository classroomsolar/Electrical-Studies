const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// A click pair still opens the editor if a selection render replaced the SVG.
export function equipmentClickIntent(previous,{id,x,y,time,detail=1}){
 const positioned=Number.isFinite(x)&&Number.isFinite(y);
 const paired=positioned&&previous?.id===id&&time>=previous.time&&time-previous.time<=500&&Math.hypot(x-previous.x,y-previous.y)<=6;
 return {open:detail>=2||Boolean(paired),previous:positioned?{id,x,y,time}:null};
}
export function equipmentDialogMarkup({item,type,body,issues=[],message=''}){
 return `<div class="modal-backdrop equipment-data-backdrop"><section class="equipment-data-dialog" role="dialog" aria-modal="true" aria-labelledby="equipment-dialog-title" aria-describedby="equipment-dialog-help" data-equipment-dialog="${esc(item.id)}">
 <header class="equipment-dialog-heading"><div><span class="eyebrow">${esc(type)} · EQUIPMENT DATA</span><h2 id="equipment-dialog-title">${esc(item.name)}</h2></div><button class="icon-button" data-action="cancel-equipment-edit" aria-label="Cancel equipment changes">×</button></header>
 <p id="equipment-dialog-help">Enter the equipment values here. Save applies your changes to the single-line; Cancel keeps the previous values.</p>
 ${message?`<div class="equipment-dialog-message" role="status">${message}</div>`:''}
 ${issues.length?`<div class="equipment-dialog-errors" role="alert">${issues.map(i=>`<p>${esc(i.message)}</p>`).join('')}</div>`:''}
 <div class="equipment-dialog-body">${body}</div>
 <footer class="equipment-dialog-footer"><small>Esc: cancel · Ctrl + Enter: save</small><div><button data-action="cancel-equipment-edit">Cancel</button><button class="primary" data-action="save-equipment-edit">Save equipment</button></div></footer>
 </section></div>`;
}
