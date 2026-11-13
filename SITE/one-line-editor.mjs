import {pvArraySummary} from './pv-arrays.mjs?v=20261022-pv-final';
import {isDcStudy,isSplitPhaseFault,isExtendedStudy} from './analysis-models.mjs?v=20261022-pv-final';
import {isSinglePhase,hasBranchCurrents} from './single-phase.mjs?v=20261022-pv-final';
import {isBranchEnabled} from './network-model.mjs?v=20261022-pv-final';
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const short=(v,n=33)=>String(v??'').length>n?String(v).slice(0,n-1)+'…':String(v??'');
const number=(v,n=2)=>Number.isFinite(v)?v.toLocaleString('en-US',{maximumFractionDigits:n}):'—';
const scale=(v,f)=>Number.isFinite(v)?v*f:null;
const volts=v=>v>0?v>=1000?number(v/1000)+' kV':number(v)+' V':'Set voltage';
const amps=v=>!Number.isFinite(v)?'—':v>=1000?number(v/1000,3)+' kA':v>0&&v<.01?v.toExponential(2)+' A':number(v)+' A';
const coordinate=v=>Number.isFinite(v)?Math.max(-1e6,Math.min(1e6,v)):60;
const ohms=v=>!Number.isFinite(v)?'—':v!==0&&Math.abs(v)<1e-6?v.toExponential(3):number(v,6);
function sourceInputCaption(s,p){
 if(isDcStudy(p))return Number.isFinite(s.dcResistanceOhm)?'DC loop R '+ohms(s.dcResistanceOhm)+' Ω':'Enter documented DC loop R';
 if(isSplitPhaseFault(p))return Number.isFinite(s.splitUpstreamR)&&Number.isFinite(s.splitUpstreamX)?'Primary loop R '+ohms(s.splitUpstreamR)+' / X '+ohms(s.splitUpstreamX)+' Ω':'Enter documented primary loop';
 if(isSinglePhase(p)&&s.singlePhaseBasis==='documented-loop'){if(s.method==='impedance')return Number.isFinite(s.r)&&Number.isFinite(s.x)?'Loop R '+ohms(s.r)+' / X '+ohms(s.x)+' Ω':'Enter loop R / X';if(s.method==='mva')return s.faultMVA>0?'two-wire input '+number(s.faultMVA)+' MVA':'Enter single-phase MVA';return s.faultA>0?'two-wire input '+amps(s.faultA):'Enter two-wire data';}
 if(['pv','bess'].includes(s.kind)||s.model==='current')return s.faultA>0?'Manufacturer '+amps(s.faultA):s.power>0?number(s.power/1e6)+' MVA':'Enter manufacturer data';
 if(s.method==='impedance')return Number.isFinite(s.r)&&Number.isFinite(s.x)?'R '+ohms(s.r)+' / X '+ohms(s.x)+' Ω':'Enter source R / X';
 if(s.kind==='generator')return s.power>0?number(s.power/1e6)+' MVA':'Enter generator rating';
 if(s.method==='mva')return s.faultMVA>0?'3-phase input '+number(s.faultMVA)+' MVA':'Enter short-circuit MVA';
 return s.faultA>0?'3-phase input '+amps(s.faultA):s.power>0?number(s.power/1e6)+' MVA':'Enter source data';
}
const sourceNames={utility:'UTILITY',generator:'GENERATOR',motor:'MOTOR',pv:'PV INVERTER',bess:'BATTERY INVERTER',other:'SOURCE',otherSource:'SOURCE'};
export const LARGE_DIAGRAM_ITEMS=400,OVERVIEW_WIDTH=9000;
const WIDTH=180,MIN_BUS_WIDTH=60,MAX_BUS_WIDTH=10000,overlaps=(a,b)=>a.left<b.right+10&&a.right>b.left-10&&a.top<b.bottom+10&&a.bottom>b.top-10;
// Uniform-grid index for label placement: returns exactly the boxes that overlaps() reports, without scanning all.
function boxGrid(cell=400){const cells=new Map(),all=[];const span=(lo,hi)=>[Math.floor((lo-10)/cell),Math.floor((hi+10)/cell)];
 return{add(o){const k=all.length;all.push(o);if(![o.left,o.right,o.top,o.bottom].every(Number.isFinite)){(cells.get('inf')||cells.set('inf',[]).get('inf')).push(k);return}const [x0,x1]=span(o.left,o.right),[y0,y1]=span(o.top,o.bottom);if((x1-x0+1)*(y1-y0+1)>4096){(cells.get('inf')||cells.set('inf',[]).get('inf')).push(k);return}for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++){const key=x+','+y;(cells.get(key)||cells.set(key,[]).get(key)).push(k)}},
  query(b){const seen=new Set(),out=[];const visit=list=>{for(const k of list||[])if(!seen.has(k)){seen.add(k);if(overlaps(b,all[k]))out.push(k)}};visit(cells.get('inf'));if([b.left,b.right,b.top,b.bottom].every(Number.isFinite)){const [x0,x1]=span(b.left,b.right),[y0,y1]=span(b.top,b.bottom);if((x1-x0+1)*(y1-y0+1)>4096)for(let k=0;k<all.length;k++){if(!seen.has(k)){seen.add(k);if(overlaps(b,all[k]))out.push(k)}}else for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)visit(cells.get(x+','+y))}else for(let k=0;k<all.length;k++)if(!seen.has(k)&&overlaps(b,all[k])){seen.add(k);out.push(k)}return out.map(k=>all[k])}}}
export const busDrawingWidth=b=>Number.isFinite(b.diagramWidth)?Math.max(MIN_BUS_WIDTH,Math.min(MAX_BUS_WIDTH,b.diagramWidth)):WIDTH;
export function busGeometry(p,b){return{id:b.id,bus:b,sources:p.sources.filter(s=>s.bus===b.id),devices:p.devices.filter(d=>d.bus===b.id),x:coordinate(b.position?.x),y:coordinate(b.position?.y),width:busDrawingWidth(b),height:p.settings.faultType==='dlg'?104:80,barY:0};}
// Only presentation metadata changes. The opposite end stays fixed.
export function resizeBusEnd(bus,end,delta,start={...bus.position,width:busDrawingWidth(bus)}){
 if(!['left','right'].includes(end)||!Number.isFinite(delta)||!Number.isFinite(start.x)||!Number.isFinite(start.y)||!Number.isFinite(start.width))return false;
 let width=Math.max(MIN_BUS_WIDTH,Math.min(MAX_BUS_WIDTH,start.width+(end==='left'?-delta:delta)));
 if(end==='left')width=Math.max(MIN_BUS_WIDTH,start.x+start.width-1e6,Math.min(width,start.x+start.width+1e6));
 bus.position={x:end==='left'?start.x+start.width-width:start.x,y:start.y};bus.diagramWidth=width;return true;
}

// Deterministic vertical arrangement of the existing topology. Layout only.
// Larger components: a tidy tree on the breadth-first spanning tree. Each bus sits centred above its children, so feeders
// never cross; a bus with many end buses (strings, inverters) places them in a grid of up to LEAF_COLUMNS columns below it.
export const TREE_LAYOUT_MIN_BUSES=40;const LEAF_COLUMNS=6,ROW=260;
function treeLayout(order,levels,adj,at,positions,x0,y0){
 const children=new Map(order.map(id=>[id,[]])),parent=new Map();
 for(const id of order)for(const next of adj.get(id))if(levels.get(next)===levels.get(id)+1&&!parent.has(next)){parent.set(next,id);children.get(id).push(next);}
 const slot=id=>Math.max(520,at.get(id).width+300),volt=id=>at.get(id).bus.voltage,size=new Map(),own=new Map(),cont=new Map();
 // A same-voltage child of a bus that also feeds other equipment continues the feeder to the right, on the same row.
 for(const id of order){const kids=children.get(id);if(kids.length<2)continue;const c=kids.filter(k=>children.get(k).length&&volt(k)===volt(id));if(c.length)cont.set(id,c[c.length-1]);}
 const parts=id=>{const kids=children.get(id).filter(k=>k!==cont.get(id));return {inner:kids.filter(c=>children.get(c).length),leaves:kids.filter(c=>!children.get(c).length)}};
 for(let k=order.length-1;k>=0;k--){const id=order[k],{inner,leaves}=parts(id);let w=0;for(const c of inner)w+=size.get(c);
  if(leaves.length){const cols=Math.min(LEAF_COLUMNS,leaves.length),cw=Math.max(...leaves.map(slot));w+=cols*cw;}
  own.set(id,Math.max(slot(id),w));size.set(id,own.get(id)+(cont.has(id)?size.get(cont.get(id)):0));}
 const place=new Map([[order[0],{x:x0,y:y0}]]);
 for(const id of order){const {x,y}=place.get(id),{inner,leaves}=parts(id),w=own.get(id);
  let used=0;for(const c of inner)used+=size.get(c);const cols=leaves.length?Math.min(LEAF_COLUMNS,leaves.length):0,cw=leaves.length?Math.max(...leaves.map(slot)):0;used+=cols*cw;
  let cx=x+(w-used)/2;const below=[];
  for(const c of inner){place.set(c,{x:cx,y:y+ROW});below.push(c);cx+=size.get(c);}
  leaves.forEach((c,i)=>{place.set(c,{x:cx+(i%cols)*cw,y:y+ROW*(1+Math.floor(i/cols))});if(i<cols)below.push(c)});
  if(cont.has(id))place.set(cont.get(id),{x:x+w,y});
  // Centre the bus over the first row of what hangs below it.
  if(below.length){const xs=below.map(c=>place.get(c).x),mid=(Math.min(...xs)+Math.max(...xs))/2;positions.set(id,{x:Math.round(Math.max(x,Math.min(mid,x+w-slot(id)))),y});}
  else positions.set(id,{x:Math.round(x),y});
 }
 return size.get(order[0]);
}
export function arrangeNetwork(p){
 const nodes=p.buses.map(b=>busGeometry(p,b)),at=new Map(nodes.map(n=>[n.id,n])),adj=new Map(nodes.map(n=>[n.id,[]]));
 for(const e of p.branches)if(at.has(e.from)&&at.has(e.to)&&e.from!==e.to){adj.get(e.from).push(e.to);adj.get(e.to).push(e.from);}
 const positions=new Map(),visited=new Set(),gap=Math.max(520,...nodes.map(n=>n.width+300));let componentX=100;
 for(const first of nodes){
  if(visited.has(first.id))continue;const component=[first.id];visited.add(first.id);
  for(let i=0;i<component.length;i++)for(const next of adj.get(component[i]))if(!visited.has(next)){visited.add(next);component.push(next);}
  const rank=n=>n.sources.some(s=>s.kind==='utility')?0:n.sources.some(s=>!['pv','bess'].includes(s.kind)&&s.model!=='current')?1:n.sources.length?2:3;
  const root=component.map(id=>at.get(id)).sort((a,b)=>rank(a)-rank(b)||component.indexOf(a.id)-component.indexOf(b.id))[0];
  const queue=[root.id],levels=new Map([[root.id,0]]);
  for(let i=0;i<queue.length;i++)for(const next of adj.get(queue[i]))if(!levels.has(next)){levels.set(next,levels.get(queue[i])+1);queue.push(next);}
  const layers=new Map();for(const id of queue){const level=levels.get(id);if(!layers.has(level))layers.set(level,[]);layers.get(level).push(at.get(id));}
  let widest=1;const sourceRows=Math.max(1,Math.ceil(root.sources.length/3));
  if(component.length>TREE_LAYOUT_MIN_BUSES){componentX+=treeLayout(queue,levels,adj,at,positions,componentX,sourceRows*150+50)+120;continue;}
  for(const [level,layer] of layers){widest=Math.max(widest,layer.length);layer.forEach((n,i)=>positions.set(n.id,{x:componentX+i*gap,y:sourceRows*150+50+level*260}));}
  componentX+=widest*gap+120;
 }return positions;
}
const point=(item,fallback)=>({x:coordinate(item.position?.x??fallback.x),y:coordinate(item.position?.y??fallback.y)});
const busPort=(n,x)=>({x:Math.max(n.x+16,Math.min(n.x+n.width-16,x)),y:n.y});
const routeTo=(a,s,top)=>`M ${a.x} ${a.y} V ${s.y+(top?-52:52)} H ${s.x} V ${s.y+(top?-30:30)}`;
// Geometry depends only on placement, topology and fault type. Large one-lines ask for it several times per
// render, so the last result is reused while that signature is unchanged.
let geometryCache=null;
const geometryKey=p=>{const parts=[p.settings?.faultType];const pos=x=>(x.position?x.position.x+','+x.position.y:'-');
 for(const b of p.buses)parts.push(b.id,pos(b),b.diagramWidth);for(const e of p.branches)parts.push(e.id,e.from,e.to,pos(e),e.enabled,e.deviceId);
 for(const s of p.sources)parts.push(s.id,s.bus,pos(s));for(const d of p.devices)parts.push(d.id,d.bus,d.linkId,pos(d),d.enabled);for(const a of p.pvArrays||[])parts.push(a.id,a.inverterId,pos(a));return parts.join('|')};
export function diagramGeometry(p){const key=geometryKey(p);if(geometryCache&&geometryCache.p===p&&geometryCache.key===key)return geometryCache.g;const g=computeGeometry(p);geometryCache={p,key,g};return g}
function computeGeometry(p){
 const sourcesAt=new Map(),devicesAt=new Map();for(const s of p.sources){if(!sourcesAt.has(s.bus))sourcesAt.set(s.bus,[]);sourcesAt.get(s.bus).push(s)}for(const d of p.devices){if(!devicesAt.has(d.bus))devicesAt.set(d.bus,[]);devicesAt.get(d.bus).push(d)}
 const deviceByLink=new Map();for(const d of p.devices)if(d.linkId!==undefined&&!deviceByLink.has(d.linkId))deviceByLink.set(d.linkId,d);
 const nodes=p.buses.map(b=>({...busGeometry({...p,sources:sourcesAt.get(b.id)||[],devices:devicesAt.get(b.id)||[]},b)})),at=new Map(nodes.map(n=>[n.id,n])),edges=[],missing=[],sources=[],devices=[],arrays=[],pairs=new Map();
 for(const edge of p.branches){
  const a=at.get(edge.from),b=at.get(edge.to),device=deviceByLink.get(edge.id);if(!a||!b)missing.push(edge);
  const key=[edge.from,edge.to].sort().join('|'),i=pairs.get(key)||0;pairs.set(key,i+1);
  const fallback=a&&b?{x:(a.x+a.width/2+b.x+b.width/2)/2+i*230,y:(a.y+b.y)/2+i*150}:a?{x:a.x+a.width/2,y:a.y+180}:b?{x:b.x+b.width/2,y:b.y-180}:{x:100+edges.length*360,y:200};
  const s=point(device?.position?device:edge,fallback),path=[a?routeTo(busPort(a,s.x),s,true):`M ${s.x} ${s.y-65} V ${s.y-30}`,b?routeTo(busPort(b,s.x),s,false):`M ${s.x} ${s.y+30} V ${s.y+65}`].join(' ');
  edges.push({id:device?.id||edge.id,edge,device,a,b,...s,path,hit:path,vertical:true,enabled:isBranchEnabled(edge,p),labelOffset:0,labelBox:{left:s.x+44,right:s.x+304,top:s.y-38,bottom:s.y+62},extent:{left:s.x-30,right:s.x+304,top:s.y-65,bottom:s.y+65}});
 }
 const incomingTo=new Map(),outgoingFrom=new Map();for(const edge of p.branches){if(!incomingTo.has(edge.to))incomingTo.set(edge.to,[]);incomingTo.get(edge.to).push(edge);if(!outgoingFrom.has(edge.from))outgoingFrom.set(edge.from,[]);outgoingFrom.get(edge.from).push(edge)}
 const linkedDevices=new Set(edges.filter(e=>e.device).map(e=>e.device.id)),looseAt=new Map();for(const d of p.devices)if(!linkedDevices.has(d.id)){if(!looseAt.has(d.bus))looseAt.set(d.bus,[]);looseAt.get(d.bus).push(d)}
 for(const source of p.sources){
  const bus=at.get(source.bus),siblings=sourcesAt.get(source.bus)||[],i=siblings.indexOf(source),rows=Math.ceil(siblings.length/3);
  const incoming=bus&&(incomingTo.get(bus.id)||[]).some(edge=>at.get(edge.from)?.y<bus.y);
  const s=point(source,bus?{x:incoming?bus.x-320-(i%3)*340:bus.x+bus.width/2+(i%3-(Math.min(3,siblings.length)-1)/2)*340,y:bus.y-130-(rows-1-Math.floor(i/3))*150}:{x:120+sources.length*340,y:70});if(!bus)missing.push(source);
  sources.push({id:source.id,source,bus,...s,path:bus?`M ${s.x} ${s.y+28} V ${bus.y-36} H ${busPort(bus,s.x).x} V ${bus.y}`:`M ${s.x} ${s.y+28} V ${s.y+68}`,extent:{left:s.x-30,right:s.x+300,top:s.y-30,bottom:s.y+75}});
 }
 for(const device of p.devices){
  if(linkedDevices.has(device.id))continue;
  const bus=at.get(device.bus),i=(looseAt.get(device.bus)||[]).indexOf(device);
  const outgoing=bus&&(outgoingFrom.get(bus.id)||[]).some(edge=>at.get(edge.to)?.y>bus.y);
  const s=point(device,bus?{x:outgoing?bus.x-260-i*330:bus.x+bus.width/2+i*330,y:bus.y+125}:{x:100+devices.length*350,y:350});if(!bus)missing.push(device);
  devices.push({id:device.id,device,bus,...s,path:bus?routeTo(busPort(bus,s.x),s,true):`M ${s.x} ${s.y-65} V ${s.y-30}`,extent:{left:s.x-30,right:s.x+290,top:s.y-65,bottom:s.y+60}});
 }
 for(const [index,array] of (p.pvArrays||[]).entries()){const inverter=sources.find(n=>n.id===array.inverterId&&n.source.kind==='pv'),pos=point(array,inverter?{x:inverter.x-340,y:inverter.y-130}:{x:100+index*360,y:-120}),path=inverter?`M ${pos.x} ${pos.y+24} V ${inverter.y-50} H ${inverter.x} V ${inverter.y-28}`:'';arrays.push({id:array.id,array,inverter,...pos,path,extent:{left:pos.x-32,right:pos.x+300,top:pos.y-34,bottom:pos.y+76}});}
 // Shift annotations, never symbols, so a mesh's labels cannot hide busbars.
 const occupied=[...nodes.map(n=>({left:n.x-12,right:n.x+n.width+300,top:n.y-18,bottom:n.y+(p.settings.faultType==='dlg'?94:70)})),...[...sources,...devices,...arrays].map(n=>({left:n.x+44,right:n.extent.right,top:n.y-24,bottom:n.y+60}))];
 const footprints=[...edges,...sources,...devices,...arrays].map(n=>({left:n.x-32,right:n.x+32,top:n.y-34,bottom:n.y+34}));
 const grid=boxGrid();for(const o of occupied)grid.add(o);for(const o of footprints)grid.add(o);
 for(const e of edges){let box={...e.labelBox},attempts=0;
  while(attempts++<nodes.length+edges.length+sources.length+devices.length+6){const hits=grid.query(box);if(!hits.length)break;const dy=Math.max(...hits.map(o=>o.bottom))+14-box.top;box.top+=dy;box.bottom+=dy;}
  e.labelOffset=box.top-e.labelBox.top;e.labelBox=box;occupied.push(box);grid.add(box);e.extent={left:e.x-32,right:box.right,top:Math.min(e.y-65,box.top),bottom:Math.max(e.y+65,box.bottom)};
 }
 const items=[...nodes,...sources,...edges,...devices,...arrays],extents=[...nodes.map(n=>({left:n.x-12,right:n.x+n.width+300,top:n.y-20,bottom:n.y+n.height})),...sources.map(n=>n.extent),...edges.map(n=>n.extent),...devices.map(n=>n.extent),...arrays.map(n=>n.extent)];
 const left=Math.min(0,...extents.map(e=>e.left))-70,top=Math.min(0,...extents.map(e=>e.top))-70;
 const bounds={x:left,y:top,width:Math.max(700,Math.max(0,...extents.map(e=>e.right))+70-left),height:Math.max(500,Math.max(0,...extents.map(e=>e.bottom))+70-top)};
 return{nodes,edges,sources,devices,arrays,items,missing:[...new Map(missing.map(x=>[x.id,x])).values()],bounds};
}
export function zoomViewport(v,f,anchor={x:.5,y:.5}){const width=Math.max(120,Math.min(1e7,v.width/f)),height=width*v.height/v.width;return{x:v.x+(v.width-width)*anchor.x,y:v.y+(v.height-height)*anchor.y,width,height};}
export const panViewport=(v,dx,dy)=>({...v,x:v.x-dx,y:v.y-dy});
function symbol(k,on=true){
 if(k==='transformer')return '<circle cy="-12" r="18"/><circle cy="12" r="18"/>';
 if(k==='cable')return '<path d="M 0 -30 V 30 M -7 -14 L 7 -5 M -7 5 L 7 14"/>';
 if(k==='breaker')return '<path d="M 0 -30 V -19 M 0 19 V 30"/><rect x="-12" y="-19" width="24" height="38"/><path d="M -7 -9 L 7 9"/>';
 if(k==='fuse')return '<path d="M 0 -30 V -19 M 0 19 V 30"/><rect x="-8" y="-19" width="16" height="38"/><path d="M 0 -14 V 14"/>';
 if(k==='recloser')return '<circle r="21"/><path d="M 0 -30 V -21 M 0 21 V 30 M -10 -8 L 10 8 M -12 9 H 12"/>';
 if(k==='utility')return '<circle r="23"/><path d="M -15 0 C -12 -14 -5 -14 0 0 C 5 14 12 14 15 0"/>';
 if(k==='pv-array')return '<rect x="-27" y="-18" width="54" height="36"/><path d="M -9 -18 V 18 M 9 -18 V 18 M -27 -6 H 27 M -27 6 H 27 M 0 18 V 28 M -16 28 H 16"/>';
 if(k==='pv')return '<rect x="-23" y="-23" width="46" height="46"/><path d="M -23 23 L 23 -23 M -13 -9 H -4 M 4 9 C 7 2 10 2 13 9"/>';
 if(k==='bess')return '<rect x="-22" y="-19" width="44" height="38"/><path d="M -12 -9 V 9 M -6 -5 V 5 M 6 -9 V 9 M 12 -5 V 5"/>';
 if(k==='dc-source')return '<circle r="23"/><text class="symbol-letter" text-anchor="middle" y="6">±</text>';
 if(['generator','motor','other','otherSource'].includes(k))return '<circle r="23"/><text class="symbol-letter" text-anchor="middle" y="6">'+(k==='generator'?'G':k==='motor'?'M':'~')+'</text>';
 if(k==='disconnect'||k==='link')return on?'<path d="M 0 -30 V 30"/><circle cy="-12" r="3"/><circle cy="12" r="3"/>':'<path d="M 0 -30 V -12 M 0 -12 L 19 10 M 0 12 V 30"/><circle cy="-12" r="3"/><circle cy="12" r="3"/>';
 return '<rect x="-18" y="-22" width="36" height="44"/><path d="M 0 -30 V 30 M -10 -8 H 10 M -10 8 H 10"/>';
}
export const equipmentIcon=kind=>`<svg viewBox="-36 -38 72 76" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2">${kind==='bus'?'<path d="M -28 0 H 28" stroke-width="5"/>':symbol(kind)}</g></svg>`;
export const diagramStyles=`
.diagram-grid{fill:#fbfdfd}.diagram-grid-dot{fill:#dae5e6}
.one-line text{font-family:Arial,system-ui,sans-serif;fill:#203d49;font-size:17px;pointer-events:none}
.one-line .wire{fill:none;stroke:#345766;stroke-width:2;stroke-linejoin:round;stroke-linecap:round}
.one-line .edge-hit{fill:none;stroke:transparent;stroke-width:22}
.one-line .symbol{fill:#fbfdfd;stroke:#294e5c;stroke-width:2}.one-line .symbol path{fill:none}.one-line .symbol-letter{stroke:none;font-size:18px;font-weight:700}
.one-line .edge,.one-line .source-tag,.one-line .device-tag,.one-line .pv-array-tag,.one-line .bus-node{cursor:grab}
.one-line .symbol-hit{fill:#fff;fill-opacity:0;stroke:none;pointer-events:all}.one-line .selection-ring{fill:#e2f4ee;stroke:#158067;stroke-width:1.5;opacity:0}
.one-line .chosen .selection-ring,.one-line [role=button]:focus .selection-ring{opacity:1}.one-line [role=button]:focus{outline:none}
.one-line .busbar{stroke:#213e4c;stroke-width:5;stroke-linecap:round}.one-line .bus-node.selected .busbar{stroke:#d28b22}.one-line .bus-node.chosen .busbar{stroke:#138064}
.one-line .label-hit{fill:#fff;fill-opacity:0;pointer-events:all}
.one-line .bus-resize-handle{cursor:ew-resize}.one-line .bus-resize-hit{fill:#fff;fill-opacity:0;pointer-events:all}.one-line .bus-resize-grip{fill:#fff;stroke:#709a8f;stroke-width:1.5;pointer-events:none}.one-line .chosen .bus-resize-grip,.one-line .bus-resize-handle:hover .bus-resize-grip,.one-line .bus-resize-handle:focus .bus-resize-grip{fill:#e2f4ee;stroke:#138064;stroke-width:2}
.one-line .node-name,.one-line .edge-name{font-weight:700;font-size:17px}.one-line .node-voltage{fill:#5d7480;font-size:16px}
.one-line .node-fault{fill:#11735b;font-weight:700;font-size:17px}.one-line .node-ground{fill:#647b88;font-size:15px}.one-line .node-error{fill:#a33a32}
.one-line .source-meta,.one-line .edge-small{fill:#647b86;font-size:15px}.one-line .edge-current{fill:#146c55;font-size:15px}
.one-line .fault-label{fill:#a26714;font-size:12px;font-weight:700}.one-line .disabled{opacity:.6}.one-line .disabled>.wire{stroke-dasharray:7 5}
.one-line .metadata-leader{fill:none;stroke:#a0b8bf;stroke-width:1;stroke-dasharray:2 5}.one-line .issue-dot{fill:#c85d46}
.one-line .connection-port{fill:#fff;stroke:#138064;stroke-width:1.5;opacity:0}.one-line .bus-node:hover .connection-port,.one-line.connecting .connection-port{opacity:1}
.one-line.connecting .bus-node{cursor:crosshair}.one-line .missing-end{fill:#fff1ed;stroke:#ba5c4c;stroke-width:1.5}
`;
export function renderOneLine(p,{results=[],issues=[],pending=false,selection=null,viewport=null,showCurrents=true,connecting=false,interactive=false}={}){
 const g=diagramGeometry(p),v=viewport||g.bounds,resultAt=new Map();for(const r of results)if(r&&!resultAt.has(r.busId))resultAt.set(r.busId,r);const selected=resultAt.get(p.selectedBus),flowAt=new Map();for(const f of selected?.branchFlows||[])if(!flowAt.has(f.id))flowAt.set(f.id,f);
 // Large interactive one-lines draw only what is inside (or near) the visible window, and draw symbols without
 // text when zoomed out so far that labels could not be read. Exports and reports always draw everything.
 const large=interactive&&g.items.length>LARGE_DIAGRAM_ITEMS,overview=large&&v.width>OVERVIEW_WIDTH,mx=v.width*.25,my=v.height*.25;
 const inView=box=>!large||(box.right>=v.x-mx&&box.left<=v.x+v.width+mx&&box.bottom>=v.y-my&&box.top<=v.y+v.height+my);
 const span=(box,...ns)=>{const out={...box};for(const n of ns)if(n){out.left=Math.min(out.left,n.x);out.right=Math.max(out.right,n.x+n.width);out.top=Math.min(out.top,n.y);out.bottom=Math.max(out.bottom,n.y)}return out};
 const faultText=id=>{const r=resultAt.get(id);return pending?'Inputs changed':r?.totalA!=null?(isDcStudy(p)?'DC prospective ':isSplitPhaseFault(p)?p.settings.faultType.replace('split-','').toUpperCase().replace('-','–')+' RMS ':p.settings.faultType==='3phase-ground'?'3φ–G RMS ':isSinglePhase(p)?'L1–L2 RMS ':p.settings.faultType==='3phase'?'3-phase RMS ':p.settings.faultType==='ll'?'LL RMS ':p.settings.faultType==='dlg'?'DLG max RMS ':'SLG RMS ')+amps(r.totalA):r?.status||'No result';};
 const attrs=(id,label)=>`data-select="${escape(id)}" data-item-drag="${escape(id)}" role="button" tabindex="0" aria-label="${escape(label)}"`;
 const ring='<rect class="selection-ring" x="-34" y="-38" width="68" height="76" rx="8"/><rect class="symbol-hit" x="-38" y="-40" width="76" height="80"/>';
 const errorIds=new Set(issues.filter(i=>i.severity==='error').map(i=>i.id)),error=id=>!pending&&errorIds.has(id)?'<circle class="issue-dot" cx="31" cy="-29" r="5"/>':'';
 const end=(x,y)=>`<circle class="missing-end" cx="${x}" cy="${y}" r="5"/>`;
 const resizeHandles=(bus,width)=>interactive&&!connecting?['left','right'].map(side=>`<g class="bus-resize-handle" data-bus-resize="${escape(bus.id)}" data-resize-end="${side}" transform="translate(${side==='left'?0:width} 0)" role="button" tabindex="0" aria-label="Resize ${side} end of ${escape(bus.name)}; drag or use Left and Right arrow keys"><title>Drag this end to resize the bus. Left / Right arrows adjust length; Shift uses a larger step.</title><rect class="bus-resize-hit" x="-12" y="-14" width="24" height="28"/><rect class="bus-resize-grip" x="-5" y="-7" width="10" height="14" rx="2"/></g>`).join(''):'';
 const edges=g.edges.filter(e=>inView(span(e.extent,e.a,e.b))).map(e=>{
  const {edge,device,x,y,a,b,enabled,labelOffset}=e,id=device?.id||edge.id,kind=['breaker','fuse','recloser'].includes(device?.equipmentType)?device.equipmentType:device?.kind||edge.kind,flow=hasBranchCurrents(p)&&!pending?flowAt.get(edge.id):null;
  if(overview)return `<g class="edge ${kind}${selection===id||selection===edge.id?' chosen':''}${!enabled?' disabled':''}" ${attrs(id,(device?.name||edge.name)+'; zoom in for details')}><path class="wire" d="${e.path}"/><g transform="translate(${x} ${y})">${ring}<g class="symbol">${symbol(kind,enabled)}</g>${error(id)}</g></g>`;
  const details=(isDcStudy(p)||isSplitPhaseFault(p))&&edge.kind==='cable'?(isDcStudy(p)?'Documented complete DC loop':'Separate L1 / L2 / neutral / ground conductors'):edge.kind==='transformer'?`${number(scale(edge.power,.001))} kVA · ${volts(edge.v1)} / ${volts(edge.v2)}`:edge.kind==='cable'?`${short(edge.size||'Choose size',16)} ${short(edge.material||'',12)} · ${number(scale(edge.length,edge.units?.length==='m'?1:1/.3048))} ${edge.units?.length||'ft'} · ${edge.runs||1} run(s)`:device?kind.toUpperCase():'INTERNAL CONNECTION';
  const extra=isDcStudy(p)&&edge.kind==='cable'?'Loop R '+number(edge.dcLoopResistanceOhm,6)+' Ω':isSplitPhaseFault(p)&&edge.kind==='transformer'?'Documented half-winding model':isSplitPhaseFault(p)&&edge.kind==='cable'?'Actual conductor loop data · open properties':edge.kind==='transformer'?`Z ${number(edge.zPercent,3)}% · X/R ${number(edge.xr,3)}`:edge.kind==='cable'?`R ${number(scale(edge.rPerM,304.8),5)} / X ${number(scale(edge.xPerM,304.8),5)} Ω/kft`:device?`Rated ${volts(device.ratedVoltage)} · SCCR ${amps(device.sccrA)}`:'';
  const current=flow?`${isDcStudy(p)?'Selected-fault DC':flow.bound?'Bound RMS':'Selected-fault RMS'}: ${amps(flow.fromA)}${edge.kind==='transformer'?' / '+amps(flow.toA):''}`:'';
  return `<g class="edge ${kind}${selection===id||selection===edge.id?' chosen':''}${!enabled?' disabled':''}" ${attrs(id,(device?.name||edge.name)+'; drag to place; double-click for properties')}><title>${escape(device?.name||edge.name)}. From ${escape(a?.bus.name||'Disconnected')} to ${escape(b?.bus.name||'Disconnected')}.</title><path class="wire" d="${e.path}"/><path class="edge-hit" d="${e.hit}"/>${!a?end(x,y-65):''}${!b?end(x,y+65):''}<g transform="translate(${x} ${y})">${ring}<g class="symbol">${symbol(kind,enabled)}</g>${error(id)}${labelOffset?`<path class="metadata-leader" d="M 34 0 H 40 V ${labelOffset}"/>`:''}<g transform="translate(45 ${labelOffset})"><rect class="label-hit" x="0" y="-38" width="260" height="105"/><text class="edge-name" y="-21">${escape(short(device?.name||edge.name))}</text><text class="edge-small" y="0">${escape(details)}</text><text class="edge-small" y="21">${escape(extra)}</text>${showCurrents&&current?`<text class="edge-current" y="43">${escape(current)}</text>`:''}</g></g></g>`;
 }).join('');
 const sources=g.sources.filter(n=>inView(span(n.extent,n.bus))).map(({source:s,bus,x,y,path})=>overview?`<g class="source-tag${s.enabled===false?' disabled':''}${selection===s.id?' chosen':''}" ${attrs(s.id,s.name+'; zoom in for details')}><path class="wire" d="${path}"/><g transform="translate(${x} ${y})">${ring}<g class="symbol">${symbol(isDcStudy(p)?'dc-source':s.kind)}</g>${error(s.id)}</g></g>`:`<g class="source-tag${s.enabled===false?' disabled':''}${selection===s.id?' chosen':''}" ${attrs(s.id,s.name+'; '+(sourceNames[s.kind]||'SOURCE')+'; drag to place; double-click for properties')}><path class="wire" d="${path}"/>${!bus?end(x,y+68):''}<g transform="translate(${x} ${y})">${ring}<g class="symbol">${symbol(isDcStudy(p)?'dc-source':s.kind)}</g>${error(s.id)}<rect class="label-hit" x="40" y="-30" width="260" height="91"/><text class="node-name" x="44" y="-13">${escape(short(s.name))}</text><text class="source-meta" x="44" y="8">${escape(sourceNames[s.kind]||'SOURCE')} · ${escape(volts(s.voltage))}</text><text class="source-meta" x="44" y="29">${escape(sourceInputCaption(s,p))}${!isDcStudy(p)&&!isSplitPhaseFault(p)&&s.xr>0?' · X/R '+number(s.xr):''}</text>${s.enabled===false?'<text class="source-meta" x="44" y="49">OUT OF SERVICE</text>':''}</g></g>`).join('');
 const devices=g.devices.filter(n=>inView(span(n.extent,n.bus))).map(({device:d,bus,x,y,path})=>overview?`<g class="device-tag${d.enabled===false?' disabled':''}${selection===d.id?' chosen':''}" ${attrs(d.id,d.name+'; zoom in for details')}><path class="wire" d="${path}"/><g transform="translate(${x} ${y})">${ring}<g class="symbol">${symbol(d.kind,d.enabled!==false)}</g>${error(d.id)}</g></g>`:`<g class="device-tag${d.enabled===false?' disabled':''}${selection===d.id?' chosen':''}" ${attrs(d.id,d.name+'; drag to place; double-click for properties')}><path class="wire" d="${path}"/>${!bus?end(x,y-65):''}<g transform="translate(${x} ${y})">${ring}<g class="symbol">${symbol(d.kind,d.enabled!==false)}</g>${error(d.id)}<rect class="label-hit" x="40" y="-30" width="260" height="91"/><text class="node-name" x="44" y="-10">${escape(short(d.name))}</text><text class="source-meta" x="44" y="11">${escape(d.kind.toUpperCase())} · ${escape(volts(d.ratedVoltage))}</text><text class="source-meta" x="44" y="32">SCCR ${escape(amps(d.sccrA))} · Interrupting ${escape(amps(d.interruptA))}</text></g></g>`).join('');
 const arrays=g.arrays.filter(n=>inView(n.extent)).map(({array:a,x,y,path})=>{const summary=pvArraySummary(a);return `<g class="pv-array-tag${selection===a.id?' chosen':''}" ${attrs(a.id,a.name+'; PV module/array nameplate reference; drag to place; double-click for properties')}><title>PV module/array nameplate reference. Dashed line associates the array with its inverter; it does not connect an AC bus.</title>${path?`<path class="metadata-leader pv-association" d="${path}"/>`:''}<g transform="translate(${x} ${y})">${ring}<g class="symbol">${symbol('pv-array')}</g><rect class="label-hit" x="40" y="-30" width="260" height="100"/><text class="node-name" x="44" y="-12">${escape(short(a.name))}</text><text class="source-meta" x="44" y="9">PV module/array · nameplate reference</text><text class="source-meta" x="44" y="30">${escape(summary.moduleCount==null?'Set series / parallel counts':summary.moduleCount+' modules')}${summary.powerW==null?'':' · '+number(summary.powerW/1000)+' kW DC'}</text><text class="source-meta" x="44" y="51">${escape(a.moduleModel?short(a.moduleModel,30):'Choose module in properties')}</text></g></g>`;}).join('');
 const nodes=g.nodes.filter(n=>inView({left:n.x-12,right:n.x+n.width+300,top:n.y-30,bottom:n.y+n.height})).map(({bus,x,y,width})=>overview?`<g class="bus-node${bus.id===p.selectedBus?' selected':''}${selection===bus.id?' chosen':''}" transform="translate(${x} ${y})" data-bus-drag="${escape(bus.id)}" ${attrs(bus.id,bus.name+'; '+volts(bus.voltage)+'; '+faultText(bus.id))}><title>${escape(bus.name)} · ${escape(faultText(bus.id))}</title><rect class="selection-ring" x="-12" y="-15" width="${width+24}" height="30" rx="6"/><path class="edge-hit" d="M 0 0 H ${width}"/><line class="busbar" x1="0" y1="0" x2="${width}" y2="0"/></g>`:`<g class="bus-node${bus.id===p.selectedBus?' selected':''}${selection===bus.id?' chosen':''}" transform="translate(${x} ${y})" data-bus-drag="${escape(bus.id)}" ${attrs(bus.id,bus.name+'; '+volts(bus.voltage)+'; '+faultText(bus.id))}><title>${escape(bus.name)}. Drag the middle to move; drag either end to resize; double-click for properties.</title><rect class="selection-ring" x="-12" y="-15" width="${width+24}" height="30" rx="6"/><path class="edge-hit" d="M 0 0 H ${width}"/><line class="busbar" x1="0" y1="0" x2="${width}" y2="0"/><circle class="connection-port" cx="${width/2}" cy="0" r="6"/>${resizeHandles(bus,width)}<rect class="label-hit" x="${width+12}" y="-27" width="280" height="${p.settings.faultType==='dlg'?114:90}"/><text class="node-name" x="${width+17}" y="-8">${escape(short(bus.name,27))}</text><text class="node-voltage" x="${width+17}" y="13">${escape(volts(bus.voltage))}</text><text class="node-fault${!pending&&resultAt.get(bus.id)?.totalA==null?' node-error':''}" x="${width+17}" y="35">${escape(faultText(bus.id))}</text>${p.settings.faultType==='dlg'&&!pending&&resultAt.get(bus.id)?.groundA!=null?`<text class="node-ground" x="${width+17}" y="56">Ground RMS ${escape(amps(resultAt.get(bus.id).groundA))}</text>`:''}${bus.id===p.selectedBus?`<text class="fault-label" x="${width+17}" y="${p.settings.faultType==='dlg'?77:56}">ϟ FAULT BUS</text>`:''}</g>`).join('');
 const selectedItem=g.items.find(n=>n.id===selection||n.edge?.id===selection),selectedName=selectedItem?.bus?.name||selectedItem?.source?.name||selectedItem?.device?.name||selectedItem?.edge?.name||selectedItem?.array?.name;
 const deleteControl=selectedItem&&!connecting?`<g data-delete="${escape(selection)}" class="diagram-delete" transform="translate(${selectedItem.x+(Number.isFinite(selectedItem.width)?selectedItem.width-30:48)} ${selectedItem.y-50})" role="button" tabindex="0" aria-label="Delete ${escape(selectedName)}; Undo is available"><title>Delete ${escape(selectedName)} (Delete key). Undo restores it.</title><rect x="-17" y="-17" width="34" height="34" rx="7" fill="#fff1ee" stroke="#be594a"/><path d="M -8 -7 H 8 M -4 -7 V -11 H 4 V -7 M -6 -4 L -5 9 H 5 L 6 -4 M -2 -3 V 6 M 2 -3 V 6" fill="none" stroke="#a3372e" stroke-width="1.7" style="pointer-events:none"/></g>`:'';
 return `<svg id="one-line" class="one-line${connecting?' connecting':''}${overview?' overview':''}" xmlns="http://www.w3.org/2000/svg" viewBox="${v.x} ${v.y} ${v.width} ${v.height}" role="group" aria-label="Electrical single-line editor. Double-click any equipment, cable or bus to open its properties. Drag bus ends to resize; drag equipment or bus middles to place them. Connections follow equipment. Bus results are available fault currents; branch results are for the selected fault."><style>${diagramStyles}</style><defs><pattern id="diagram-dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle class="diagram-grid-dot" cx="1" cy="1" r="1"/></pattern></defs><rect class="diagram-grid" data-diagram-background="true" x="${v.x}" y="${v.y}" width="${v.width}" height="${v.height}"/><rect data-diagram-background="true" x="${v.x}" y="${v.y}" width="${v.width}" height="${v.height}" fill="url(#diagram-dots)"/>${edges}${arrays}${sources}${devices}${nodes}${deleteControl}</svg>`;
}
