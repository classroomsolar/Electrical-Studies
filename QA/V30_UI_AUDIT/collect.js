(()=>{const out={};const parse=c=>{const m=c.match(/rgba?\(([^)]+)\)/);if(!m)return null;const p=m[1].split(/[ ,\/]+/).filter(Boolean).map(Number);return [p[0],p[1],p[2],p.length>3?p[3]:1]};
const lum=c=>{const f=v=>{v/=255;return v<=0.03928?v/12.92:((v+0.055)/1.055)**2.4};return 0.2126*f(c[0])+0.7152*f(c[1])+0.0722*f(c[2])};
for(const e of document.querySelectorAll('body *')){if(e.closest('svg')&&e.tagName!=='svg')continue;const cs=getComputedStyle(e);if(cs.display==='none')continue;const r=e.getBoundingClientRect();if(!r.width||!r.height)continue;
 const bg=parse(cs.backgroundColor),gi=cs.backgroundImage!=='none';
 const key=e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+(typeof e.className==='string'&&e.className.trim()?'.'+e.className.trim().split(/\s+/).join('.'):'')+(e.getAttribute('style')?'[style]':'');
 const rec=out[key]||(out[key]={n:0,bg:null,grad:false,fg:cs.color,border:cs.borderTopColor+' '+cs.borderTopWidth,style:(e.getAttribute('style')||'').slice(0,120),text:(e.innerText||'').trim().slice(0,30),parent:''});rec.n++;
 if(bg&&bg[3]>0)rec.bg=cs.backgroundColor;if(gi)rec.grad=cs.backgroundImage.slice(0,80);
 const p=e.parentElement;rec.parent=p?(p.tagName.toLowerCase()+(p.id?'#'+p.id:'')+(typeof p.className==='string'&&p.className.trim()?'.'+p.className.trim().split(/\s+/)[0]:'')):''}
return out})()
