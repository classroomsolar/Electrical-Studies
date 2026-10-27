import {busGeometry,equipmentIcon} from './network-diagram.mjs?v=20261022-pv-final';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const finite=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
export function busAtPoint(project,point,tolerance=12){
 if(!finite(point)||!Number.isFinite(tolerance)||tolerance<0)return null;
 let nearest=null,distance=Infinity;
 for(const bus of project.buses){const g=busGeometry(project,bus),x=Math.max(g.x,Math.min(g.x+g.width,point.x)),d=Math.hypot(point.x-x,point.y-g.y);if(d<=tolerance&&d<distance){nearest={id:bus.id,name:bus.name,x,y:g.y,width:g.width,left:g.x};distance=d;}}
 return nearest;
}
export function busAnchor(project,busId,point){
 const bus=project.buses.find(b=>b.id===busId);if(!bus)return null;
 const g=busGeometry(project,bus),inset=Math.min(16,g.width/2);
 return {id:bus.id,name:bus.name,x:Math.max(g.x+inset,Math.min(g.x+g.width-inset,finite(point)?point.x:g.x+g.width/2)),y:g.y,width:g.width,left:g.x};
}
export function drawingFeedback(project,{point,kind=null,connection=null,sourcePoint=null,scale=1}={}){
 if(!finite(point)||(!kind&&!connection))return '';
 scale=Number.isFinite(scale)&&scale>0?scale:1;
 const hit=kind==='pv-array'?null:busAtPoint(project,point,12/scale),halo=hit?`<rect data-preview-bus="${esc(hit.id)}" x="${hit.left-5}" y="${hit.y-8}" width="${hit.width+10}" height="16" rx="5" fill="#d8f2e9" stroke="#138064" stroke-width="2"/>`:'';
 let shape='',label='';
 if(connection){
  const start=busAnchor(project,connection.from,sourcePoint),end=hit||point,valid=hit&&hit.id!==connection.from;
  if(start){const mid=(start.y+end.y)/2;shape=`<path data-preview-wire="true" d="M ${start.x} ${start.y} V ${mid} H ${end.x} V ${end.y}" fill="none" stroke="${valid?'#138064':'#8a98a0'}" stroke-width="2.5" stroke-dasharray="8 5"/><circle cx="${start.x}" cy="${start.y}" r="5" fill="#138064"/><circle cx="${end.x}" cy="${end.y}" r="6" fill="white" stroke="${valid?'#138064':'#8a98a0'}" stroke-width="2"/>`;label=valid?'Release or click to connect to '+hit.name:hit?'Choose a different bus':'Choose the destination bus';}
  else label=hit?'Start at '+hit.name:'Choose the starting bus';
 }else{
  const upstream=['utility','pv','bess','generator','motor','other'].includes(kind),at={x:point.x,y:point.y+(hit?(upstream?-105:kind==='bus'?0:130):0)};
  shape=kind==='bus'?`<line x1="${at.x}" y1="${at.y}" x2="${at.x+180}" y2="${at.y}" stroke="#138064" stroke-width="6"/>`:`<g transform="translate(${at.x-36} ${at.y-38})" color="#138064" opacity=".7">${equipmentIcon(kind).replace('<svg ','<svg width="72" height="76" ')}</g>`;
  if(hit&&kind!=='bus')shape+=`<path d="M ${at.x} ${at.y+(upstream?28:-28)} V ${hit.y}" stroke="#138064" stroke-width="2" stroke-dasharray="6 4"/>`;
  label=hit&&kind!=='bus'?'Attach to '+hit.name:'Click to place '+(kind==='bus'?'bus':kind);
 }
 const labelText=label.length>72?label.slice(0,69)+'…':label,labelWidth=Math.max(170,labelText.length*7+18);
 return `<g data-drawing-feedback="true" pointer-events="none" aria-hidden="true">${halo}${shape}<rect data-preview-label="true" x="${point.x+14/scale}" y="${point.y-54/scale}" width="${labelWidth/scale}" height="${28/scale}" rx="${5/scale}" fill="#fff" fill-opacity=".97" stroke="#bddfd2" stroke-width="${1/scale}"/><text x="${point.x+23/scale}" y="${point.y-35/scale}" fill="#12664f" style="font: ${13/scale}px Arial,sans-serif;fill:#12664f">${esc(labelText)}</text></g>`;
}
