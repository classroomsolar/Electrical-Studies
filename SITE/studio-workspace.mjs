import {equipmentIcon,diagramGeometry} from './network-diagram.mjs?v=20261022-pv-final';
import {addItem,addBus,addConnection,deleteItem,applyVoltages,id} from './network-model.mjs?v=20261022-pv-final';
import {cableDropdowns,dropdownLabel,selectedCableFilters,resolveCableFilters,cableDataChoices,cableDataLabel} from './catalog-dropdowns.mjs?v=20261022-pv-final';
import {recordReadiness} from './master-database.mjs?v=20261022-pv-final';
import {cableCategories} from './cable-insulation.mjs?v=20261022-pv-final';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const palette=[['utility','Utility'],['bus','Bus'],['transformer','Transformer'],['cable','Cable'],['breaker','Breaker'],['fuse','Fuse'],['recloser','Recloser'],['generator','Generator'],['pv-array','PV module / array'],['pv','PV inverter'],['bess','Battery'],['switchgear','Switchgear'],['disconnect','Disconnect'],['panel','Panel'],['motor','Motor']];
export function workspaceMarkup({diagram,editor,placement=null,connecting=null,repeat=false,editAfterPlace=false}){
 return `<div class="studio-workspace"><aside class="drawing-palette" aria-label="Equipment palette"><strong>Equipment</strong><button data-action="draw-select" class="${!placement&&!connecting?'active':''}" aria-pressed="${!placement&&!connecting}"><span class="select-glyph">↖</span>Select / move</button>${palette.map(([kind,label])=>`<button data-place-kind="${kind}" class="${placement===kind?'active':''}" aria-pressed="${placement===kind}" title="Place ${label} on the drawing">${equipmentIcon(kind)}<span>${label}</span></button>`).join('')}<label class="repeat-placement"><input id="repeat-placement" type="checkbox" ${repeat?'checked':''}>Keep adding</label><label class="repeat-placement"><input id="edit-after-place" type="checkbox" ${editAfterPlace?'checked':''}>Open data after placing</label><small>Double-click equipment or cables for properties. Drag either bus end to resize. Choose a symbol, then click the drawing. Select / move or Esc ends placement.</small></aside>${diagram}<aside class="drawing-inspector" aria-label="Drawing selection">${editor}</aside></div>`;
}
const customOption='<option value="__custom__">Custom / user input…</option>';
const option=(v,label,selected)=>`<option value="${esc(v)}" ${selected===v?'selected':''}>${esc(label)}</option>`;
export function catalogPickerMarkup(item,records,{filters=null,error='',loading=false,selectionPending=false}={}){
 const key=item.id;
 if(error)return `<div class="inline-catalog"><strong>Master database</strong><p role="alert">${esc(error)}</p><button data-action="inline-catalog-retry">Retry dropdowns</button></div>`;
 if(loading)return `<div class="inline-catalog" role="status"><strong>Master database</strong><p>Loading equipment dropdowns…</p></div>`;
 if(item.kind==='cable')return cablePickerMarkup(item,records,{filters,selectionPending});
 if(!records.length)return `<div class="inline-catalog"><strong>Master database</strong><p>No matching record for the connected voltage and study frequency. Use documented project values or browse the catalog.</p></div>`;
 const f=filters||{},manufacturers=[...new Set(records.map(r=>r.row.Manufacturer||r.row.Family||'Not specified'))].sort((a,b)=>a.localeCompare(b)),terms=String(f.search||'').toLowerCase().split(/\s+/).filter(Boolean),matchingRecords=records.filter(r=>(!f.manufacturer||(r.row.Manufacturer||r.row.Family||'Not specified')===f.manufacturer)&&terms.every(t=>(r.mapped.search||Object.values(r.row).join(' ').toLowerCase()).includes(t)));
 const selectedKey=item.db?item.db.sheet+':'+item.db.row:'',visible=matchingRecords.slice(0,100),selected=matchingRecords.find(r=>r.key===selectedKey);if(selected&&!visible.includes(selected))visible.unshift(selected);
 const ready=item.db&&records.find(r=>r.key===selectedKey)?recordReadiness(item.db.sheet,records.find(r=>r.key===selectedKey).row):null;
 return `<section class="inline-catalog"><div class="catalog-heading"><strong>Master database</strong>${item.db?'<span class="db-chip">Linked record</span>':''}</div><label class="field" for="equipment-${key}-manufacturer"><span>Manufacturer / library</span><select id="equipment-${key}-manufacturer" data-equipment-item="${key}" data-equipment-filter="manufacturer">${option('','All compatible manufacturers',f.manufacturer||'')}${manufacturers.map(v=>option(v,v,f.manufacturer||'')).join('')}${customOption}</select></label><label class="field" for="equipment-${key}-search"><span>Find equipment model</span><input id="equipment-${key}-search" data-equipment-item="${key}" data-equipment-filter="search" type="search" value="${esc(f.search||'')}" placeholder="Model, manufacturer or record ID"></label><label class="field" for="equipment-${key}-record"><span>Equipment model</span><select id="equipment-${key}-record" data-inline-record="${key}">${option('','Choose a matching record',selectedKey)}${visible.map(r=>option(r.key,dropdownLabel(r)+(recordReadiness(r.sheet,r.row).missing.length?' · incomplete fault data':''),selectedKey)).join('')}${customOption}</select></label><p>${matchingRecords.length.toLocaleString()} compatible records${matchingRecords.length>100?' · showing the first 100; search to narrow the list':''}. ${item.kind==='pv-array'?'Module nameplate values fill the array. Missing values remain editable and unknown.':'Available fields fill the item. Missing fault data stays editable and required.'}</p>${ready?.missing.length?`<p class="catalog-missing">${esc(ready.label)}.</p>`:''}${item.db&&['transformer','generator'].includes(item.kind)&&item.xr==null?'<p class="catalog-missing">This master record has no X/R value. Enter the documented project or test value.</p>':''}</section>`;

}
function cablePickerMarkup(item,records,{filters,selectionPending}){
 const f=resolveCableFilters(records,item,filters),choices=cableDropdowns(records,f),search=String(f.search||'').trim().toLowerCase();
 const candidates=f.material&&f.size?cableDataChoices(choices.matches):[],matching=candidates.filter(r=>!search||[r.row.Manufacturer,r.row.Family,r.mapped.values.cableType,r.mapped.db.id].join(' ').toLowerCase().includes(search));
 const current=item.db?item.db.sheet+':'+item.db.row:'',selected=matching.find(r=>r.key===current||r.sheet===item.db?.sheet&&r.equivalentRows.includes(item.db?.row));
 const voltage=v=>!(v>0)?'Rating not recorded':v>=1000?Number((v/1000).toPrecision(5))+' kV':v+' V';
 const control=(name,label,values,{placeholder='',disabled=false}={})=>`<label class="field" for="cable-${item.id}-${name}"><span>${label}</span><select id="cable-${item.id}-${name}" data-cable-filter="${name}" data-cable-item="${item.id}" aria-label="${label}" ${disabled?'disabled':''}>${placeholder?option('',placeholder,f[name]):''}${values.map(v=>option(Array.isArray(v)?v[0]:v,Array.isArray(v)?v[1]:v,f[name])).join('')}${['material','size','rating','family'].includes(name)?customOption:''}</select></label>`;
 const preferred=['NEC Tab9 PVC','NEC Tab9 ST','NEC Tab9 AL'],rank=value=>preferred.includes(value)?preferred.indexOf(value):preferred.length;
 const references=[...choices.families].sort((a,b)=>rank(a)-rank(b)||a.localeCompare(b,undefined,{numeric:true})).map(value=>[value,value.replace('Tab9','Table 9')]);
 const units=f.system==='Metric'?'Ω/km':'Ω/kft',factor=f.system==='Metric'?1000:304.8,impedance=value=>selectionPending||!Number.isFinite(value)?'—':Number((value*factor).toPrecision(5));
 const applied=item.db&&!selectionPending,overridden=item.db?.overrides?.some(key=>['rPerM','xPerM','r0PerM','x0PerM','frequency'].includes(key));
 const needsVariant=matching.length!==1,showSearch=candidates.length>1||Boolean(search),loadReady=matching.length===1&&(!applied||!selected||overridden);
 return `<section class="inline-catalog cable-picker" aria-label="Cable selection">
 <div class="catalog-heading"><strong>Select cable</strong><span class="db-chip">${applied?overridden?'Manual impedance override':'Workbook values applied':'Master workbook'}</span></div>
 <p class="catalog-workbook">Engineering_Master_Database_Audited.xlsx</p>
 ${control('category','Cable type',cableCategories)}
 ${control('system','Size system',[['English','AWG / kcmil'],['Metric','mm²']])}
 <div class="cable-selection-grid">${control('material','Conductor material',choices.materials,{placeholder:'Choose material'})}${control('size','Conductor size',choices.sizes,{placeholder:f.material?'Choose size':'Choose material first',disabled:!f.material})}</div>
 ${control('rating','Workbook cable voltage rating',choices.ratings.map(v=>[String(v),v===1000?'1000 V (1 kV)':v===2000?'2000 V (2 kV)':voltage(v)]),{placeholder:choices.ratings.length?'':'No compatible rating'})}
 ${control('family','R/X library / construction',references,{placeholder:'All workbook references — select an exact variant'})}
 <p class="catalog-reference-note">${!item.db&&f.family==='NEC Tab9 PVC'?'New LV choices use the shown NEC Table 9 PVC reference. Change the type to match your cable.':'R/X loads automatically when this type has one matching workbook variant.'}</p>
 ${showSearch?`<label class="field" for="cable-${item.id}-search"><span>Find cable library, manufacturer or record <small>optional</small></span><input id="cable-${item.id}-search" type="search" data-cable-search="${item.id}" data-cable-item="${item.id}" value="${esc(f.search||'')}" placeholder="For example: NEC, ICEA, CAB-000019"></label>`:''}
 ${needsVariant?`<label class="field" for="cable-${item.id}-record"><span>Workbook variant${matching.length?` <small>${matching.length} choices</small>`:''}</span><select id="cable-${item.id}-record" data-inline-record="${item.id}" data-cable-item="${item.id}" aria-label="Workbook variant">${option('',!f.material?'Choose material first':!f.size?'Choose conductor size':!matching.length?'No matching workbook row':'Choose the matching R / X variant',selectionPending?'':selected?.key||'')}${matching.map(r=>option(r.key,cableDataLabel(r),selectionPending?'':selected?.key||'')).join('')}${customOption}</select></label>`:''}
 ${selectionPending?`<p class="catalog-selection-pending" role="status">Choose the cable type or workbook variant to load R/X. Calculations wait for this choice.</p><button data-cable-keep="${item.id}">Keep current cable values</button>`:''}
 ${!records.length?'<p class="catalog-selection-pending">No cable records cover the connected voltage at the study frequency. Check the bus voltage and study frequency, or enter documented R/X.</p>':''}
 <div class="cable-impedance-summary" aria-label="Cable resistance and reactance" aria-live="polite"><div><span>Resistance R1 <small>${units}</small></span><strong data-cable-r-summary>${impedance(item.rPerM)}</strong></div><div><span>Reactance X1 <small>${units}</small></span><strong data-cable-x-summary>${impedance(item.xPerM)}</strong></div></div>
 <div class="catalog-derived"><span>Cable X/R from R1 and X1</span><output>${!selectionPending&&item.rPerM>0&&Number.isFinite(item.xPerM)?Number((item.xPerM/item.rPerM).toPrecision(5)):'—'}</output></div>
 ${loadReady?`<p class="catalog-ready">Matching workbook data: ${esc(cableDataLabel(matching[0]))}</p><button class="catalog-load" data-cable-load="${item.id}">${overridden&&selected?'Restore workbook R / X':'Load R / X from workbook'}</button>`:''}
 ${applied?`<p class="catalog-applied">${esc(item.material||'Material not recorded')} · ${esc(item.size||f.size)} · ${esc(voltage(item.ratedVoltage||0))}${item.temperature!=null?' · '+esc(item.temperature)+' °C':''}<small>Source: ${esc(item.db.sheet)} · row ${esc(item.db.row)}${overridden?' · current impedance has manual overrides':''}</small></p>`:'<p>Select material, size and cable type above. The matching workbook row fills resistance and reactance automatically.</p>'}
 ${item.inferredMaterial&&applied?'<small class="catalog-material-note">This workbook infers the material. Confirm it matches the installed cable.</small>':''}
 <button class="catalog-manual" data-cable-manual="${item.id}">Enter documented R / X manually</button></section>`;
}
export function connectExisting(p,kind,from,to){
 if(!p.buses.some(b=>b.id===from)||!p.buses.some(b=>b.id===to)||from===to)throw Error('Choose two different buses.');
 if(kind==='cable'){const cable=addConnection(p,from,to);p.selectedBus=to;return cable;}
 if(kind==='link'){const edge={id:id('connection'),kind:'link',name:'Bus connection '+(p.branches.filter(e=>e.kind==='link').length+1),from,to,enabled:true};p.branches.push(edge);p.selectedBus=to;return edge;}
 if(kind!=='transformer')throw Error('Choose a cable, transformer or direct connection.');
 p.selectedBus=from;const tx=addItem(p,'transformer'),createdBus=tx.to;tx.to=to;tx.v2=p.buses.find(b=>b.id===to).voltage;deleteItem(p,createdBus);p.selectedBus=to;return tx;
}
export function placeEquipment(p,kind,point,busId=null){
 if(kind==='pv-array'){const array=addItem(p,kind);array.position={x:point.x,y:point.y};p.diagramLayoutVersion=2;return array;}
 if(busId)p.selectedBus=busId;
 const oldIds=new Set(p.buses.map(b=>b.id));
 // A source placed in empty space gets its own actual terminal bus.
 if(!busId&&p.buses.length&&['utility','pv','bess','generator','motor','other'].includes(kind)){const bus=addBus(p,kind+' terminals');p.selectedBus=bus.id;}
 const aliases={breaker:'Breaker',fuse:'Fuse',recloser:'Recloser'};
 const item=addItem(p,aliases[kind]?'switchgear':kind);item.position={x:point.x,y:point.y};
 if(aliases[kind]){const oldName=item.name;item.equipmentType=kind;item.name=aliases[kind]+' '+p.devices.filter(d=>d.equipmentType===kind).length;const bus=p.buses.find(b=>b.id===item.bus),link=p.branches.find(e=>e.id===item.linkId);if(bus?.name===oldName)bus.name=item.name;if(link)link.name=item.name+' internal connection';}
 for(const bus of p.buses.filter(b=>!oldIds.has(b.id)&&b.id!==item.id)){bus.position={x:point.x-90,y:point.y+155};}
 if(p.sources.includes(item)&&busId)item.position={x:point.x,y:point.y-105};
 if(p.branches.includes(item)){if(busId)item.position={x:point.x,y:point.y+130};const from=p.buses.find(b=>b.id===item.from),bus=p.buses.find(b=>b.id===item.to);if(from&&!oldIds.has(from.id))from.position={x:point.x-90,y:item.position.y-130};if(bus&&!oldIds.has(bus.id))bus.position={x:point.x-90,y:item.position.y+150};}
 const link=p.branches.find(e=>e.id===item.linkId);if(link){if(busId)item.position={x:point.x,y:point.y+130};const from=p.buses.find(b=>b.id===link.from),to=p.buses.find(b=>b.id===link.to);if(from&&!oldIds.has(from.id))from.position={x:point.x-90,y:item.position.y-130};if(to&&!oldIds.has(to.id))to.position={x:point.x-90,y:item.position.y+150};link.position={...item.position};}
 p.diagramLayoutVersion=2;return item;
}
export function itemDrawingPosition(p,item){return item.position||diagramGeometry(p).items.find(n=>n.id===item.id||n.edge?.id===item.id)||{x:100,y:100};}
