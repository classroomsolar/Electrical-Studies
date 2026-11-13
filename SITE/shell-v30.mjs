/**
 * V30 workbench shell (Stitch theme). Layout only — no calculation code is touched.
 *  - Docks every floating launcher ("More engineering tools", "Conductor I²t duty", "Study guide")
 *    into the sidebar, so no button floats over page content.
 *  - Sizes each one-line label background to the text it holds, so labels never run past their box.
 */
const root=document.documentElement;root.classList.add('v30');
const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content='#0d1117';

const tools=document.createElement('div');tools.id='v30-sidebar-tools';
tools.innerHTML='<span class="v30-side-label">Engineering tools</span>';

function dock(){
 const side=document.querySelector('#app aside.sidebar');if(!side)return;
 if(tools.parentElement!==side){const nav=side.querySelector('nav');nav?nav.after(tools):side.append(tools)}
 const pop=document.getElementById('v26-tools-pop');
 if(pop&&pop.parentElement!==tools)tools.append(pop);
 const holder=document.getElementById('v26-launcher-holder');
 const i2t=document.getElementById('fcs-v28-launch');
 if(holder&&i2t&&i2t.parentElement!==holder){holder.append(i2t);i2t.style.position='static'}
 const help=document.getElementById('v26-help-button');
 if(help&&help.parentElement!==tools)tools.append(help);
}

// Bus bars coloured by voltage class (Stitch DESIGN.md): LV < 1 kV, MV 1–35 kV, HV > 35 kV.
function voltageClass(){
 for(const g of document.querySelectorAll('#one-line g.bus-node')){
  const m=(g.getAttribute('aria-label')||'').match(/;\s*([\d.,]+)\s*(kV|V)\b/);if(!m)continue;
  const kv=parseFloat(m[1].replace(/,/g,''))/(m[2]==='V'?1000:1);if(!Number.isFinite(kv))continue;
  const c=kv<1?'v30-lv':kv<=35?'v30-mv':'v30-hv';
  if(!g.classList.contains(c)){g.classList.remove('v30-lv','v30-mv','v30-hv');g.classList.add(c)}
 }
}
const SVGNS='http://www.w3.org/2000/svg';
function fitLabels(){
 const svg=document.getElementById('one-line');if(!svg)return;
 // Measure every label first, then write: interleaving getBBox with attribute writes forces one layout per
 // label, which stalls large one-lines.
 const jobs=[];
 for(const hit of svg.querySelectorAll('rect.label-hit')){
  const g=hit.parentNode;const texts=[...g.children].filter(n=>n.namespaceURI===SVGNS&&n.tagName==='text');
  if(!texts.length)continue;
  let left=Infinity,right=-Infinity,bottom=-Infinity,top=Infinity;
  for(const t of texts){try{const b=t.getBBox();if(!b.width)continue;left=Math.min(left,b.x);right=Math.max(right,b.x+b.width);bottom=Math.max(bottom,b.y+b.height);top=Math.min(top,b.y)}catch{}}
  if(!Number.isFinite(right))continue;
  const x=Math.floor(left-8),y=Math.floor(top-6);jobs.push([hit,x,y,Math.ceil(right-x+8),Math.ceil(bottom-y+6)]);
 }
 // The click target (label-hit) is left exactly as the editor drew it; only a separate, non-interactive
 // background is sized to the text.
 for(const [hit,x,y,w,h] of jobs){
  let bg=hit.nextElementSibling;
  if(!bg||!bg.classList||!bg.classList.contains('v30-label-bg')){bg=document.createElementNS(SVGNS,'rect');bg.setAttribute('class','v30-label-bg');bg.setAttribute('aria-hidden','true');bg.setAttribute('rx','4');hit.after(bg)}
  for(const [k,v] of [['x',x],['y',y],['width',w],['height',h]])if(bg.getAttribute(k)!==String(v))bg.setAttribute(k,String(v));
 }
}

// A table that cannot fit its panel even after wrapping is shown as one card per row ("column: value" pairs),
// so no column is ever cut off. Only a table without a header row falls back to sideways scrolling.
function headerLabels(t){
 const rows=[...t.querySelectorAll(':scope>thead>tr')];const hr=rows[rows.length-1]||[...t.rows].find(r=>r.querySelector('th')&&!r.querySelector('td'));
 if(!hr)return null;const out=[];for(const c of hr.cells){const n=c.colSpan||1;for(let i=0;i<n;i++)out.push(c.textContent.trim().replace(/\s+/g,' '))}return out;
}
function stack(t){
 const labels=headerLabels(t);if(!labels)return false;
 for(const r of t.tBodies.length?[...t.tBodies].flatMap(b=>[...b.rows]):[...t.rows]){
  if(r.parentElement.tagName==='THEAD')continue;let i=0;
  for(const c of r.cells){const n=c.colSpan||1;if(c.tagName==='TD'){if(n===1&&labels[i])c.setAttribute('data-v30-label',labels[i]);else c.removeAttribute('data-v30-label')}i+=n}
 }
 t.classList.add('v30-stack');return true;
}
// Three phases (reset all, measure all, then write) so the browser lays the page out once instead of once per table.
function fitTables(){
 const tables=[...document.querySelectorAll('table')].filter(t=>t.parentElement);
 for(const t of tables)t.classList.remove('v30-wide','v30-stack');
 const over=tables.filter(t=>t.offsetParent&&t.scrollWidth>t.parentElement.clientWidth+2);
 for(const t of over)if(!stack(t))t.classList.add('v30-wide');
}
let queued=false;
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;dock();voltageClass();fitLabels();fitTables()})}
// Docking runs synchronously (MutationObserver microtask, before the next paint or input event): when the app
// re-renders its sidebar the tools are back in place at once, so the page never shifts under a double-click.
new MutationObserver(()=>{dock();schedule()}).observe(document.body,{childList:true,subtree:true});
schedule();
addEventListener('resize',schedule);
