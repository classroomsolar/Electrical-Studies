// Preserve the original bytes before recovering from malformed browser storage.
// Nothing is uploaded; recovery downloads and studies remain on this device.
export function createStudyStorage(storage){
 const protectedKeys=new Set(),recoveryKey='fault-network-recovery-v2';let available=true,recoveryMessage='';
 const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
 const write=(key,value)=>{if(protectedKeys.has(key))return false;try{storage.setItem(key,JSON.stringify(value));return true}catch{available=false;return false}};
 const preserve=(key,raw)=>{
  if(!raw)return true;
  try{
   const entries=JSON.parse(storage.getItem(recoveryKey)||'[]');
   if(!Array.isArray(entries))throw Error('Invalid recovery archive');
   if(!entries.some(x=>x.key===key&&x.raw===raw)){entries.push({key,raw,saved:new Date().toISOString()});storage.setItem(recoveryKey,JSON.stringify(entries))}
   recoveryMessage='Stored data could not be read. Its original JSON was preserved in Saved studies & backups.';return true;
  }catch{available=false;protectedKeys.add(key);recoveryMessage='Stored data could not be read or backed up. The original has been kept unchanged; export the current study before leaving.';return false}
 };
 const backup=key=>{try{return preserve(key,storage.getItem(key))}catch{available=false;protectedKeys.add(key);return false}};
 const read=(key,fallback)=>{
  let raw;try{
   raw=storage.getItem(key);if(raw===null||raw==='')return fallback;const value=JSON.parse(raw);if(value===null)return fallback;
   if(Array.isArray(fallback)&&!Array.isArray(value))throw Error('Expected saved-study list');
   if(key==='fault-network-studies-v2'&&value.some(x=>!object(x)||!object(x.project)))throw Error('Invalid saved study');
   if(key==='fault-studies-v1'&&value.some(x=>!object(x)||!object(x.inputs)))throw Error('Invalid earlier study');
   return value;
  }catch{if(raw)preserve(key,raw);else available=false;return fallback}
 };
 const recoveries=()=>{try{const value=JSON.parse(storage.getItem(recoveryKey)||'[]');return Array.isArray(value)?value.filter(x=>object(x)&&typeof x.raw==='string'):[]}catch{return []}};
 return {read,write,backup,recoveries,get available(){return available},get recoveryMessage(){return recoveryMessage}};
}
