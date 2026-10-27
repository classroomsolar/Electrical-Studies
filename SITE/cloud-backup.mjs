/* Owner-authorised, read-only backup assembly. This module never restores, alters,
 * deletes, or uploads a study. Authentication and workspace isolation are enforced
 * by the existing Studio cloud API, not by this helper. */
const fail=msg=>{throw Error('Cloud backup: '+msg)};
const uid=x=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
const enc=new TextEncoder();
async function digest(data){if(!globalThis.crypto?.subtle)fail('secure SHA-256 implementation required');return [...new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(data)))].map(x=>x.toString(16).padStart(2,'0')).join('')}
function expectRecord(row,id,rev=null){if(!row||row.id!==id||!Number.isSafeInteger(row.revision)||row.revision<=0||(rev!==null&&row.revision!==rev)||!row.data||typeof row.data!=='object'||Array.isArray(row.data))fail('missing, moved, or inconsistent revision for '+id);return row;}
function listIds(result){if(!result||!Array.isArray(result.cases)||typeof result.hasMore!=='boolean')fail('malformed paginated study index');const ids=new Set();for(const row of result.cases){if(!uid(row.id)||!Number.isSafeInteger(row.revision)||row.revision<1||ids.has(row.id))fail('invalid or duplicate saved study in page');ids.add(row.id)}return ids}
/**
 * @param {object} opts
 * @param {Function} opts.api Existing cloud.api(path) from authenticated session.
 * @param {number} opts.maxCases Safety cap; fail closed if exceeded.
 * @param {number} opts.maxSnapshots Historical revision cap; fail closed if exceeded.
 * @param {number} opts.maxBytes Safety cap; no partial backup returned.
 */
export async function assembleCloudBackup({api,maxCases=1000,maxSnapshots=10000,maxBytes=64*1024*1024,onProgress=()=>{}}={}){
 if(typeof api!=='function')fail('authenticated API required');
 if(!Number.isSafeInteger(maxCases)||maxCases<1||maxCases>5000||!Number.isSafeInteger(maxSnapshots)||maxSnapshots<1||maxSnapshots>50000||!Number.isSafeInteger(maxBytes)||maxBytes<1024||maxBytes>256*1024*1024)fail('invalid safety bounds');
 const read=async path=>api(path);const pageSize=50;
 async function inventory(){
  const found=[];const unique=new Set();let offset=0;
  for(;;){
   const page=await read('/api/cases?sort=name&offset='+offset);
   const ids=listIds(page);
   if(page.cases.length>pageSize||page.cases.length===0&&page.hasMore)fail('invalid or truncated cloud inventory page');
   for(const row of page.cases){if(unique.has(row.id))fail('duplicate study identity across pages; inventory changed during backup');unique.add(row.id);found.push({id:row.id,revision:row.revision});if(found.length>maxCases)fail('case safety cap exceeded; no partial backup created');}
   offset+=page.cases.length;
   if(!page.hasMore)break;
   if(!page.cases.length||offset>maxCases)fail('incomplete cloud study inventory');
  }
  return found.sort((a,b)=>a.id.localeCompare(b.id));
 }
 const before=await inventory(),records=[];let count=0,bytes=0;
 for(const summary of before){
  const row=expectRecord(await read('/api/cases/'+summary.id),summary.id);
  if(row.revision!==summary.revision)fail('study changed while reading '+summary.id);
  const history=await read('/api/cases/'+summary.id+'/revisions');
  if(!Array.isArray(history)||!history.length)fail('revision history unavailable for '+summary.id);
  const seen=new Set();for(const r of history){if(!Number.isSafeInteger(r?.revision)||r.revision<1||seen.has(r.revision))fail('invalid or repeated historical revision');seen.add(r.revision);}
  if(!seen.has(summary.revision)||Math.max(...seen)!==summary.revision||seen.size!==summary.revision)fail('history is missing one or more revisions; complete backup impossible');
  if(count+history.length>maxSnapshots)fail('snapshot cap exceeded; no partial backup created');
  const snapshots=[];
  for(const r of history.sort((a,b)=>a.revision-b.revision)){
   const snap=r.revision===row.revision?row:expectRecord(await read('/api/cases/'+row.id+'?revision='+r.revision),row.id,r.revision);
   const data=JSON.stringify(snap.data);bytes+=enc.encode(data).length;
   if(bytes>maxBytes)fail('backup exceeds memory safety cap; no partial backup created');
   snapshots.push({revision:r.revision,savedAt:r.savedAt??(r.revision===row.revision?row.updatedAt:null),sha256:await digest(data),data:snap.data});count++;
  }
  // Re-read current revision before finishing this case: detect an update even
  // if the original inventory has not yet changed.
  const still=await read('/api/cases/'+row.id);
  if(still.revision!==summary.revision||await digest(JSON.stringify(still.data))!==snapshots.at(-1).sha256)fail('study changed during backup '+row.id);
  records.push({id:row.id,projectName:row.projectName,caseName:row.caseName,revision:row.revision,createdAt:row.createdAt,updatedAt:row.updatedAt,snapshots});
  onProgress({cases:records.length,totalCases:before.length,snapshots:count});
 }
 const after=await inventory();if(JSON.stringify(after)!==JSON.stringify(before))fail('cloud study inventory changed during export');
 return {schema:'fault-current-studio-owner-cloud-backup-v1',createdAt:new Date().toISOString(),scope:'Authorised Studio workspace via authenticated GET requests; read-only archive',caseCount:records.length,snapshotCount:count,records};
}
/** Validate backup before any external restore tool consumes it. Does not write. */
export async function inspectCloudBackup(archive){
 if(!archive||archive.schema!=='fault-current-studio-owner-cloud-backup-v1'||!Array.isArray(archive.records)||archive.records.length!==archive.caseCount||!Number.isSafeInteger(archive.snapshotCount))fail('unrecognized/incomplete backup');
 const ids=new Set();let count=0;for(const row of archive.records){if(!uid(row.id)||ids.has(row.id)||!Number.isSafeInteger(row.revision)||!Array.isArray(row.snapshots)||!row.snapshots.length)fail('invalid case identity or empty case');ids.add(row.id);const revisions=new Set();for(const snap of row.snapshots){if(!Number.isSafeInteger(snap.revision)||snap.revision<1||revisions.has(snap.revision)||!snap.data||typeof snap.data!=='object'||Array.isArray(snap.data)||snap.sha256!==await digest(JSON.stringify(snap.data)))fail('tampered or invalid snapshot');revisions.add(snap.revision);count++;}if(Math.max(...revisions)!==row.revision||revisions.size!==row.revision)fail('historical revision sequence is incomplete: historical revision is missing');}
 if(count!==archive.snapshotCount)fail('snapshot count mismatch');return {valid:true,caseCount:ids.size,snapshotCount:count,readOnly:true};
}
