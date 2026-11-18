/** Fault Current Studio V26 — independent, original presentation and interactive guidance.
 * No external API, no reads/writes to study data, databases, storage, Cloud Vault or report code.
 */
(()=>{
 'use strict';
 const guideTasks={
  fault:{label:'Calculate a fault',page:'network',steps:[
   ['Open the single-line editor','Create or select a bus and connect actual sources and equipment.'],
   ['Choose fault location and scenario','Use the Fault location selector and Study setup to enter the correct case.'],
   ['Run and review the calculation','Choose Calculate system, check issues and examine Results & calculations.']]},
  database:{label:'Find equipment data',page:'database',steps:[
   ['Open Master database','Select equipment category, filter records and inspect source/provenance.'],
   ['Check the exact product','Compare manufacturer, model, rating, revision and application limits.'],
   ['Use in a study','Return to Single line to select appropriate equipment; do not assume every catalogue record is approved.']]},
  save:{label:'Save or reopen a study',page:'projects',steps:[
   ['Save current inputs','Use Save study in the top toolbar or export a study JSON backup.'],
   ['Open Saved studies & backups','Review local snapshots; private cloud access requires authenticated ownership.'],
   ['Reopen and calculate','Select your saved study and rerun to verify the current inputs and results.']]},
  export:{label:'Export PDF or Excel',page:'report',steps:[
   ['Calculate the network','Run the current case so reports do not contain stale results.'],
   ['Open Print report','Inspect assumptions, units, source labels and warning messages.'],
   ['Download the report','Use PDF or Excel controls and review the saved file before use.']]},
  compare:{label:'Explore engineering methods',page:'atlas',steps:[
   ['Open Capability atlas','Search the 18 assessment areas and filter by status.'],
   ['Read limitations','Bounded methods are not equivalent to IEC/IEEE certification.'],
   ['Go to related workspace','Select a card to inspect the implementation and reference.']]}
 };
 let current=null,help=null,trigger=null,utilities=null;
 const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function hero(){
  const area=document.querySelector('.atlas-page');
  if(!area||area.querySelector('.v26-overview'))return;
  area.insertAdjacentHTML('afterbegin',`
   <section class="v26-overview" aria-label="Fault Current Studio engineering workspace introduction">
    <div class="v26-intro">
     <span class="v26-kicker">Fault Current Studio · Product workspace</span>
     <h2>Complex engineering.<br><em>Clear decisions.</em></h2>
     <p>Build networks, inspect calculation limits, compare equipment and preserve engineering evidence — without losing your existing project workflow.</p>
     <div class="v26-hero-buttons"><a href="#network" class="v26-button v26-button-primary">Open engineering studio <span aria-hidden="true">↗</span></a><button type="button" class="v26-button v26-button-secondary" data-v26-help-open="fault">Guide me through a study ✦</button></div>
     <div class="v26-hero-subline"><span><i aria-hidden="true"></i> 16 advanced calculation modes</span><b>·</b><span>18 capability areas</span><b>·</b><span>V26 visual update</span></div>
    </div>
    <div class="v26-visual" aria-hidden="false"><div class="v26-orbit" aria-hidden="true"></div>
     <div class="v26-preview-card"><div class="v26-preview-top"><b>Engineering guide</b><span>WORKFLOW / 01</span></div>
      <div class="v26-preview-inner"><span class="v26-mini-label">Guided workflow</span><h3>Start a fault study</h3><p>A clear path through your existing calculation tools.</p>
       <div class="v26-path-step done"><span>✓</span>Select your network</div><div class="v26-path-step done"><span>✓</span>Set fault location</div><div class="v26-path-step active"><span>3</span>Calculate &amp; review</div>
       <div class="v26-preview-footer"><span>3 steps · local guidance</span><button type="button" data-v26-help-open="fault">Show me ↗</button></div>
      </div>
     </div><div class="v26-float-badge" aria-hidden="true">Study controls, connected</div>
    </div>
   </section>`);
 }
 function prepareUtilities(){
  if(utilities)return;
  utilities=document.createElement('details');utilities.id='v26-tools-pop';
  utilities.innerHTML='<summary>☷ More engineering tools</summary><div id="v26-launcher-holder" aria-label="Additional existing engineering tools"></div>';
  document.body.append(utilities);
 }
 function arrangeUtilities(){
  prepareUtilities();
  const holder=utilities.querySelector('#v26-launcher-holder');
  for(const id of ['fcs-ieee-arc-open','fcs-method-open','fcs-harmonic-open','fcs-cloud-open']){
   const el=document.getElementById(id);
   if(el&&el.parentElement!==holder)holder.append(el);
  }
 }
 function createGuide(){
  if(help)return;
  trigger=document.createElement('button');trigger.id='v26-help-button';trigger.type='button';trigger.setAttribute('aria-controls','v26-help-panel');trigger.setAttribute('aria-expanded','false');trigger.innerHTML='<span class="v26-help-star" aria-hidden="true">✦</span> Study guide';
  help=document.createElement('section');help.id='v26-help-panel';help.setAttribute('aria-label','Guided workflows');help.hidden=true;
  document.body.append(trigger,help);
  trigger.addEventListener('click',()=>help.hidden?openGuide():closeGuide());
  renderGuide();
 }
 function renderGuide(){
  if(!help)return;
  const choice=current&&guideTasks[current];
  const list=choice?`<p>Follow these steps in the existing engineering workspace. This guide does not perform calculations or change study data.</p>${choice.steps.map(([name,details],i)=>`<div class="v26-guide-step"><span>${i+1}</span><div><strong>${safe(name)}</strong><p>${safe(details)}</p></div></div>`).join('')}<div class="v26-guide-bottom"><button type="button" data-v26-guide="back">← All guides</button><button type="button" data-v26-guide="go">Open ${safe(choice.page==='network'?'single line':choice.page==='projects'?'saved studies':choice.page==='report'?'reports':choice.page==='atlas'?'atlas':'database')} ↗</button></div>`:
   `<p>Choose a task to see a short, practical walkthrough. Your calculations and saved project stay untouched.</p><div class="v26-guide-options">${Object.entries(guideTasks).map(([id,task])=>`<button type="button" class="v26-guide-option" data-v26-help-open="${safe(id)}">${safe(task.label)} <span aria-hidden="true">↗</span></button>`).join('')}</div>`;
  help.innerHTML=`<div class="v26-guide-head"><div><span>Fault Current Studio · Assistance</span><h2>${choice?safe(choice.label):'How can I help?'}</h2></div><button type="button" data-v26-guide="close" aria-label="Close study guide">×</button></div><div class="v26-guide-content">${list}<div class="v26-guide-note">Guided product navigation only. Not a conversational AI service or an engineering validation.</div></div>`;
 }
 function openGuide(task=null){createGuide();if(task&&guideTasks[task])current=task;renderGuide();help.hidden=false;trigger.setAttribute('aria-expanded','true');help.querySelector('[data-v26-guide="close"]')?.focus({preventScroll:true});}
 function closeGuide(){if(help){help.hidden=true;trigger.setAttribute('aria-expanded','false');trigger.focus({preventScroll:true});}}
 document.addEventListener('click',e=>{
  const task=e.target.closest?.('[data-v26-help-open]');if(task){e.preventDefault();openGuide(task.dataset.v26HelpOpen);return;}
  const action=e.target.closest?.('[data-v26-guide]');if(action){if(action.dataset.v26Guide==='close')closeGuide();else if(action.dataset.v26Guide==='back'){current=null;renderGuide()}else if(action.dataset.v26Guide==='go'&&guideTasks[current]){location.hash=guideTasks[current].page;closeGuide()}}
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&help&&!help.hidden){e.preventDefault();closeGuide()}});
 let tick=false;
 function enhance(){tick=false;hero();arrangeUtilities();}
 const observer=new MutationObserver(()=>{if(tick)return;tick=true;requestAnimationFrame(enhance)});
 function init(){createGuide();enhance();const host=document.querySelector('#app');if(host)observer.observe(host,{childList:true,subtree:false});observer.observe(document.body,{childList:true,subtree:false});}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
