import {mapRecord} from './database-map.mjs?v=20261022-pv-final';
import {cableSizeLabel} from './catalog-dropdowns.mjs?v=20261022-pv-final';
import {manufacturerRecord,manufacturerAppliedValues} from './manufacturer-library.mjs?v=20261022-pv-final';

export const customChoice='__custom__';
const modes=['workbook','manufacturer','custom'];
export function propertyValueSource(item){
 return modes.includes(item.valueSource)?item.valueSource:item.db?.origin==='manufacturer'?'manufacturer':'workbook';
}
export function setPropertyValueSource(item,source){
 if(!modes.includes(source))throw Error('Choose database, manufacturer or custom values.');
 // Choosing the editor mode never changes the electrical values or evidence.
 item.valueSource=source;
 return item;
}
export function referenceFieldValue(item,key){
 const ref=item.db;if(!ref)return undefined;
 let values;
 if(ref.origin==='manufacturer'){
  const record=manufacturerRecord(ref.id),original=Object.fromEntries((ref.fields||[]).filter(field=>Object.hasOwn(ref.originalValues||{},field)).map(field=>[field,ref.originalValues[field]]));
  // Legacy studies reconstruct the same applicable form values; raw source facts
  // such as lowercase delta/wye are never used as form enum values.
  values={...(ref.appliedValues||(record&&!record.referenceOnly?manufacturerAppliedValues(item,record):{})),...original};
  if(key==='interruptA')values.interruptA=ref.dutyBasis?.interruptA??undefined;
 }
 else values={...(ref.originalValues?mapRecord(ref.sheet,ref.originalValues).values:{}),...ref.appliedValues};
 if(key==='size'&&item.kind==='cable'&&ref.origin!=='manufacturer'&&ref.originalValues&&!String(ref.originalValues['Conductor Size']??'').trim())return undefined;
 const value=key==='size'&&item.kind==='cable'&&ref.origin!=='manufacturer'&&ref.originalValues?cableSizeLabel(ref.originalValues):values[key];
 return value!==null&&value!==undefined&&value!==''&&(!(typeof value==='number')||Number.isFinite(value))?value:undefined;
}
export function restoreReferenceField(item,key){
 if(!item.db?.overrides?.includes(key))throw Error('This field has no user override to restore.');
 const value=referenceFieldValue(item,key);
 if(value===undefined)throw Error('The selected record does not supply this property. Enter documented user data.');
 item[key]=value;
 item.db.overrides=item.db.overrides.filter(field=>field!==key);
 return value;
}
