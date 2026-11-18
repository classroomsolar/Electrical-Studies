import {catalogRecord,recordCompatibility,catalogCategories} from './database-selection.mjs?v=20261022-pv-final';
import {cableCategory,cableCategories} from './cable-insulation.mjs?v=20261022-pv-final';
export const catalogSheets=catalogCategories;
const sorted=items=>[...new Set(items.filter(Boolean))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'}));
const known=v=>v===null||v===undefined||v===''?'—':String(v);
export function cableSizeLabel(row){
 const size=String(row['Conductor Size']||'').trim().replace(/(\d)\s*mcm\b/ig,'$1 kcmil').replace(/\bmcm\b/ig,'kcmil').replace(/mm(?:\^?2|²)/ig,'mm²');
 if(/awg|kcmil|mm/i.test(size))return size;
 if(String(row['Unit System']).toLowerCase()==='metric')return size+' mm²';
 if(String(row['Unit System']).toLowerCase()==='english')return size+(/\/0/.test(size)||/^#?\d+$/.test(size)&&Number(size.replace('#',''))<=40?' AWG':' kcmil');
 return size;
}
export function dropdownRecords(loaded,item,project){
 const types={breaker:['HV_BREAKERS','LV_BREAKERS'],fuse:['FUSES'],recloser:['RECLOSERS']};
 return (types[item.equipmentType]||catalogSheets[item.kind]||[]).flatMap(sheet=>(loaded.get(sheet)?.records||[]).map(row=>({sheet,row,mapped:catalogRecord(sheet,row),key:sheet+':'+row._row}))).filter(r=>!/^DC$/i.test(String(r.row['AC DC']))&&!recordCompatibility(r.sheet,r.row,item,project).length);
}
export function cableDropdowns(records,filters={}){
 const categoryRows=filters.category&&filters.category!=='all'?records.filter(r=>cableCategory(r)===filters.category):records;
 const systemRows=filters.system?categoryRows.filter(r=>cableUnitSystem(r.row)===filters.system):categoryRows;
 const materialRows=filters.material?systemRows.filter(r=>(r.mapped.values.material||'Not recorded')===filters.material):systemRows;
 const sizeOf=r=>cableSizeLabel(r.row),sizeRows=filters.size?materialRows.filter(r=>sizeOf(r)===filters.size):materialRows;
 const voltageRows=filters.rating?sizeRows.filter(r=>r.mapped.values.ratedVoltage===Number(filters.rating)):sizeRows;
 const familyOf=r=>r.mapped.values.cableType||r.row.Family||'Catalog record';
 const matches=filters.family?voltageRows.filter(r=>familyOf(r)===filters.family):voltageRows;
 return {materials:sorted(systemRows.map(r=>r.mapped.values.material||'Not recorded')),sizes:sorted(materialRows.map(sizeOf)).sort(compareCableSizes),ratings:[...new Set(sizeRows.map(r=>r.mapped.values.ratedVoltage).filter(v=>v>0))].sort((a,b)=>a-b),families:sorted(voltageRows.map(familyOf)),matches};
}
export function dropdownLabel(record){
 const {mapped:m,row:r,sheet}=record,v=m.values;
 if(sheet==='CABLES'||sheet==='CABLE_IMPEDANCE_DEFAULTS')return [r.Manufacturer||r.Family||'Screening fallback',cableSizeLabel(r),v.ratedVoltage>0?(v.ratedVoltage/1000)+' kV':'Rating not supplied',v.frequency?v.frequency+' Hz':'Frequency not supplied','R '+known(v.rPerM==null?null:Number((v.rPerM*304.8).toPrecision(5)))+' / X '+known(v.xPerM==null?null:Number((v.xPerM*304.8).toPrecision(5)))+' Ω/kft',m.db.id].join(' · ');
 return m.db.label+(v.zPercent!=null?' · Z '+v.zPercent+'%':'')+(v.xr!=null?' · X/R '+v.xr:'');
}
export function selectedCableFilters(records,item){
 const record=records.find(r=>r.sheet===item.db?.sheet&&r.row._row===item.db?.row);
 if(record)return {system:cableUnitSystem(record.row),material:record.mapped.values.material||'Not recorded',size:cableSizeLabel(record.row),rating:String(record.mapped.values.ratedVoltage||''),family:record.mapped.values.cableType||record.row.Family||'Catalog record'};
 // Old/manual labels are picker hints, never permission to replace entered data.
 const system=/mm/i.test(item.size||'')?'Metric':'English',rawMaterial=String(item.material||'').trim();
 const material=/^(cu|copper)$/i.test(rawMaterial)?'Copper':/^(al|aluminum|aluminium)$/i.test(rawMaterial)?'Aluminum':records.find(r=>String(r.mapped.values.material||'').toLowerCase()===rawMaterial.toLowerCase())?.mapped.values.material||'';
 const sizeKey=value=>String(value).toLowerCase().replace(/[\s#]/g,''),size=cableSizeLabel({'Conductor Size':item.size,'Unit System':system});
 const candidate=records.find(r=>cableUnitSystem(r.row)===system&&sizeKey(cableSizeLabel(r.row))===sizeKey(size)&&(!material||r.mapped.values.material===material));
 return {system,material:records.some(r=>r.mapped.values.material===material)?material:'',size:candidate?cableSizeLabel(candidate.row):'',rating:String(item.ratedVoltage||''),family:item.cableType||''};
}
export function cableUnitSystem(row){return String(row['Unit System']).toLowerCase()==='metric'||/mm/i.test(String(row['Conductor Size']))?'Metric':'English';}
function sizeArea(label){
 const value=parseFloat(label.replace(/^#/,''));
 if(/AWG/i.test(label)){const zeros=label.match(/^(\d+)\/0/),gauge=zeros?1-Number(zeros[1]):value;return (5*92**((36-gauge)/39))**2/1000;}
 return value;
}
export function compareCableSizes(a,b){const delta=sizeArea(a)-sizeArea(b);return Number.isFinite(delta)&&delta!==0?delta:a.localeCompare(b,undefined,{numeric:true});}
export function resolveCableFilters(records,item,filters){
 const f={category:item.cableCategory||'all',...selectedCableFilters(records,item),...filters};
 if(!cableCategories.some(([key])=>key===f.category))f.category='all';
 if(!['English','Metric'].includes(f.system))f.system='English';
 let choices=cableDropdowns(records,f);
 if(!choices.materials.includes(f.material))f.material='';
 choices=cableDropdowns(records,f);
 if(!choices.sizes.includes(f.size))f.size='';
 choices=cableDropdowns(records,f);
 if(!choices.ratings.includes(Number(f.rating)))f.rating=String(choices.ratings[0]||'');
 choices=cableDropdowns(records,f);
 if(!choices.families.includes(f.family))f.family='';
 // Expose a specific, named workbook basis for ordinary LV cables. Selecting
 // material/size can then apply its exact row without guessing among different
 // impedances. Existing linked records and an explicit All records choice keep
 // their own basis. Rendering this default never changes the saved cable.
 if(!f.family&&filters?.family===undefined&&!item.db&&choices.families.includes('NEC Tab9 PVC'))f.family='NEC Tab9 PVC';
 return f;
}
// Collapse only exact electrical/provenance duplicates. Different R/X,
// voltage, temperature, family, frequency or verification remain choices.
export function cableDataChoices(records){
 const groups=new Map();
 for(const r of records){const signature=JSON.stringify([r.sheet,cableUnitSystem(r.row),cableSizeLabel(r.row),r.mapped.values,r.mapped.db.source,r.mapped.db.status,r.mapped.db.notes,r.row.Available]);let entry=groups.get(signature);if(!entry){entry={...r,equivalentRows:[]};groups.set(signature,entry);}entry.equivalentRows.push(r.row._row);}
 return [...groups.values()].sort((a,b)=>(a.sheet==='CABLE_IMPEDANCE_DEFAULTS')-(b.sheet==='CABLE_IMPEDANCE_DEFAULTS')||String(a.row.Manufacturer||a.row.Family||'').localeCompare(String(b.row.Manufacturer||b.row.Family||''),undefined,{numeric:true})||(a.mapped.values.temperature||0)-(b.mapped.values.temperature||0)||a.row._row-b.row._row);
}
export function cableDataLabel(record){
 const v=record.mapped.values,factor=cableUnitSystem(record.row)==='Metric'?1000:304.8,num=value=>value==null?'?':Number((value*factor).toPrecision(4));
 const library=record.sheet==='CABLE_IMPEDANCE_DEFAULTS'?'Screening fallback':record.row.Manufacturer||record.row.Family||v.cableType||'Workbook cable';
 return [library,record.row['Variant No']?'variant '+record.row['Variant No']:null,v.temperature!=null?v.temperature+' °C':null,'R '+num(v.rPerM)+' · X '+num(v.xPerM)].filter(Boolean).join(' · ');
}
