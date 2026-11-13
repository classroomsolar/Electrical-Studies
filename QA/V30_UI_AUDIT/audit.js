(()=>{
const vw=innerWidth,issues=[];
const vis=e=>{const cd=e.closest('details:not([open])');if(cd&&!e.closest('summary')&&e!==cd)return false;const cs=getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0)return false;const r=e.getBoundingClientRect();return r.width>0&&r.height>0};
const label=e=>(e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+(e.className&&typeof e.className==='string'?'.'+e.className.trim().split(/\s+/).slice(0,2).join('.'):''))+' "'+(e.innerText||e.value||e.textContent||'').trim().replace(/\s+/g,' ').slice(0,40)+'"';
const parse=c=>{const m=c.match(/rgba?\(([^)]+)\)/);if(!m)return null;const p=m[1].split(/[ ,\/]+/).filter(Boolean).map(Number);return [p[0],p[1],p[2],p.length>3?p[3]:1]};
const bgOf=e=>{let stack=[];for(let n=e;n&&n.nodeType===1;n=n.parentElement){const cs=getComputedStyle(n);const c=parse(cs.backgroundColor);if(cs.backgroundImage&&cs.backgroundImage!=='none'&&cs.backgroundImage.includes('gradient')){const g=cs.backgroundImage.match(/rgba?\([^)]+\)/);if(g){const gc=parse(g[0]);if(gc){stack.push(gc);if(gc[3]>=0.99)break}}}
 if(c&&c[3]>0){stack.push(c);if(c[3]>=0.99)break}}
 let col=[255,255,255];for(const c of stack.reverse()){col=col.map((v,i)=>v*(1-c[3])+c[i]*c[3])}return col};
const lum=c=>{const f=v=>{v/=255;return v<=0.03928?v/12.92:((v+0.055)/1.055)**2.4};return 0.2126*f(c[0])+0.7152*f(c[1])+0.0722*f(c[2])};
const ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05)};
const root=(window.__auditScope&&document.querySelector(window.__auditScope))||document.body;const all=[...root.querySelectorAll('*')].filter(e=>!['SCRIPT','STYLE','svg','OPTION','BR'].includes(e.tagName)&&!e.closest('svg'));
const seen=new Set();
for(const e of all){
 if(!vis(e))continue;
 const own=[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim().length>0);
 const r=e.getBoundingClientRect(),cs=getComputedStyle(e);
 // contrast
 if((own||['INPUT','SELECT','TEXTAREA'].includes(e.tagName))&&!['checkbox','radio','range','color'].includes(e.type)){
  const fg=parse(cs.color);if(fg&&!e.disabled&&!e.closest('[disabled],[aria-disabled=true]')){const bg=bgOf(e);const fgc=fg.slice(0,3).map((v,i)=>v*fg[3]+bg[i]*(1-fg[3]));const cr=ratio(fgc,bg);const large=parseFloat(cs.fontSize)>=18.5||(parseFloat(cs.fontSize)>=14&&+cs.fontWeight>=700);
   if(cr<(large?3:4.5))issues.push({type:'contrast',el:label(e),value:Math.round(cr*100)/100})}}
 // clipped inside own box
 if(own&&(e.scrollWidth>e.clientWidth+2)&&['hidden','clip','auto','scroll'].includes(cs.overflowX)&&e.clientWidth>0&&!['auto','scroll'].includes(cs.overflowX))issues.push({type:'clipped-x',el:label(e),value:e.scrollWidth-e.clientWidth});
 if(own&&cs.textOverflow==='ellipsis'&&e.scrollWidth>e.clientWidth+1)issues.push({type:'ellipsis',el:label(e)});
 // select text cut
 if(e.tagName==='SELECT'&&cs.appearance==='base-select'&&e.scrollWidth>e.clientWidth+2)issues.push({type:'select-cut',el:label(e),value:e.scrollWidth-e.clientWidth});
 if(e.tagName==='SELECT'&&cs.appearance!=='base-select'&&e.selectedOptions[0]){const c=document.createElement('canvas').getContext('2d');c.font=`${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;const w=c.measureText(e.selectedOptions[0].text).width;const avail=e.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight)-(cs.appearance==='none'?0:18);if(w>avail+2)issues.push({type:'select-cut',el:label(e),value:Math.round(w-avail)})}
 if(e.tagName==='INPUT'&&['text','search',''].includes(e.type)&&e.placeholder&&!e.value){const pcs=getComputedStyle(e,'::placeholder');const c=document.createElement('canvas').getContext('2d');c.font=`${pcs.fontWeight} ${pcs.fontSize} ${pcs.fontFamily}`;const w=c.measureText(e.placeholder).width;if(w>e.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight)+2)issues.push({type:'placeholder-cut',el:label(e)})}
 // text exceeding a clipping ancestor
 if(own){for(let a=e.parentElement;a&&a!==document.body;a=a.parentElement){const acs=getComputedStyle(a);if(acs.overflowX!=='visible'||acs.overflowY!=='visible'){if(['auto','scroll'].includes(acs.overflowX)||['auto','scroll'].includes(acs.overflowY))break;const ar=a.getBoundingClientRect();if(r.right>ar.right+2||r.left<ar.left-2||r.bottom>ar.bottom+2){issues.push({type:'cut-by-parent',el:label(e),value:label(a)})}break}}}
 // narrow word-wrap squeeze: text box much narrower than longest word
 if(own&&r.width<140){const words=(e.innerText||'').split(/\s+/);const c=document.createElement('canvas').getContext('2d');c.font=`${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;const lw=Math.max(0,...words.map(w=>c.measureText(w).width));if(lw>r.width+2)issues.push({type:'word-overflow',el:label(e),value:Math.round(lw-r.width)});
   }
 if(own){const rg=document.createRange();let tops=new Set();for(const n of e.childNodes){if(n.nodeType!==3||!n.textContent.trim())continue;rg.selectNodeContents(n);for(const q of rg.getClientRects())if(q.width>1)tops.add(Math.round(q.top/4))}
  const lh=parseFloat(cs.lineHeight)||parseFloat(cs.fontSize)*1.3;const nl=tops.size;
  if(nl>=3&&r.width<200&&(e.closest('button,th,label,.badge,a,summary')))issues.push({type:'squeezed',el:label(e),value:nl})}
 if(!['INPUT','SELECT','TEXTAREA','BUTTON','svg','IMG','CANVAS','OPTION','PROGRESS','METER'].includes(e.tagName)){const b=parse(cs.backgroundColor);if(b&&b[3]>0.5&&lum(b)>0.35&&r.width>30&&r.height>16)issues.push({type:'light-surface',el:label(e),value:cs.backgroundColor})}
 // horizontal offscreen
 if(r.right>vw+1&&cs.position!=='fixed'){let scrollP=false;for(let a=e.parentElement;a;a=a.parentElement){const o=getComputedStyle(a).overflowX;if(o==='auto'||o==='scroll'||o==='hidden'){scrollP=true;break}}if(!scrollP)issues.push({type:'offscreen-x',el:label(e),value:Math.round(r.right-vw)})}
}
// fixed/sticky overlays covering content
const fixed=all.filter(e=>vis(e)&&getComputedStyle(e).position==='fixed'&&e.getBoundingClientRect().width<vw*0.9&&e.getBoundingClientRect().height<innerHeight*0.9);
for(const f of fixed){const fr=f.getBoundingClientRect();
 for(const e of all){if(f.contains(e)||e.contains(f)||!vis(e))continue;const own=[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());if(!own&&!['BUTTON','INPUT','SELECT','A'].includes(e.tagName))continue;const er=e.getBoundingClientRect();
  if(er.right>fr.left+2&&er.left<fr.right-2&&er.bottom>fr.top+2&&er.top<fr.bottom-2&&getComputedStyle(e).position!=='fixed'&&!e.closest('[role=dialog],dialog')){const k=label(f)+label(e);if(!seen.has(k)){seen.add(k);issues.push({type:'overlap-fixed',el:label(e),value:label(f)})}}}}
// SVG text outside its label box
for(const t of root.querySelectorAll('svg text')){if(!vis(t))continue;const g=t.parentElement;const rect=g.querySelector(':scope>rect.v30-label-bg')||g.querySelector(':scope>rect.label-hit');if(!rect)continue;const tb=t.getBoundingClientRect(),rb=rect.getBoundingClientRect();if(tb.right>rb.right+1||tb.bottom>rb.bottom+1)issues.push({type:'svg-text-overflow',el:'svg text "'+t.textContent.slice(0,40)+'"',value:Math.round(tb.right-rb.right)})}
for(const e of all){if(!vis(e))continue;const cs=getComputedStyle(e);if(['auto','scroll'].includes(cs.overflowX)&&e.scrollWidth>e.clientWidth+4&&e.clientWidth>0&&e.tagName!=='TEXTAREA'&&e.tagName!=='PRE')issues.push({type:'hscroll',el:label(e),value:e.scrollWidth-e.clientWidth})}
if(document.documentElement.scrollWidth>vw+1)issues.push({type:'page-hscroll',el:'document',value:document.documentElement.scrollWidth-vw});
return issues;})()
