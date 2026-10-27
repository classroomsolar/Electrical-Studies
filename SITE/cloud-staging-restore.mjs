/*
 * Batch 12 — explicit, opt-in restoration to a CLEAN, SEPARATE staging workspace.
 * This is NOT invoked by the ordinary Studio UI or production Site. It refuses
 * production, nonempty staging, incomplete archives, and mismatching revisions.
 * Destination writes are necessarily non-atomic across separate saved studies:
 * on failure preserve the isolated test workspace for forensic review.
 */
import {inspectCloudBackup} from './cloud-backup.mjs';

const fail=(s)=>{throw Error('Staging restore refused: '+s)};
const encoder=new TextEncoder();
const sha=async data=>{
  if(!globalThis.crypto?.subtle)fail('cryptographically secure SHA-256 required');
  const bytes=await crypto.subtle.digest('SHA-256',encoder.encode(JSON.stringify(data)));
  return Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,'0')).join('');
};
const isUuid=x=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
const phrase='RESTORE TO EMPTY ISOLATED STAGING WORKSPACE';

export async function planStagingRestore({archive,maxCases=500,maxSnapshots=5000}={}) {
  const inspection=await inspectCloudBackup(archive);
  if(!Number.isSafeInteger(maxCases)||maxCases<1||maxCases>5000||!Number.isSafeInteger(maxSnapshots)||maxSnapshots<1||maxSnapshots>50000)
    fail('invalid restoration safety caps');
  if(inspection.caseCount>maxCases||inspection.snapshotCount>maxSnapshots)
    fail('safety cap exceeded before any write');
  const rows=[];
  for(const record of archive.records){
    if(!record.snapshots.length||record.snapshots.length!==record.revision)
      fail('a historical revision is missing; original sequential revision history cannot be reconstructed');
    const snapshots=[...record.snapshots].sort((a,b)=>a.revision-b.revision);
    for(let k=0;k<snapshots.length;k++)if(snapshots[k].revision!==k+1)
      fail('non-contiguous revision history cannot be restored exactly');
    rows.push({sourceId:record.id,originalRevision:record.revision,snapshots:snapshots.length});
  }
  return {status:'VALIDATED_STAGING_PLAN_ONLY',cases:inspection.caseCount,snapshots:inspection.snapshotCount,rows};
}

/**
 * @param {object} options
 * @param {function(string, object=): Promise<any>} options.api - authenticated
 * staging Studio API; existing `cloud.api` supports same arguments.
 * @param {string} options.confirm - the exact irreversible staging-only phrase.
 * @param {function():string} options.newId - crypto.randomUUID by default.
 * @returns mapping and verification counts; never a claim of live restoration.
 */
export async function restoreToIsolatedStaging({archive,api,confirm,newId=()=>crypto.randomUUID(),maxCases=500,maxSnapshots=5000}={}){
  if(confirm!==phrase)fail('explicit staging restoration confirmation required');
  if(typeof api!=='function'||typeof newId!=='function')fail('authenticated staging API and UUID provider required');
  const plan=await planStagingRestore({archive,maxCases,maxSnapshots});
  const config=await api('/api/config');
  if(config?.deploymentEnvironment!=='staging'||config?.isolatedRestoreAllowed!==true)
    fail('destination is not an explicitly approved isolated staging environment');
  // The destination is required to be EMPTY, and must stay empty until restore.
  const checkEmpty=async()=>{
    const page=await api('/api/cases?sort=name&offset=0');
    if(!page||!Array.isArray(page.cases)||page.cases.length!==0||page.hasMore!==false)
      fail('destination is nonempty or its cloud inventory is incomplete');
  };
  await checkEmpty();await checkEmpty();
  const identities=new Set(archive.records.map(r=>r.id));
  const assigned=new Set(),mapping=[];
  // Generate and validate all destination IDs *before* writing any case.
  for(const r of archive.records){
    const id=newId();
    if(!isUuid(id)||identities.has(id)||assigned.has(id))fail('unsafe or duplicate destination UUID');
    assigned.add(id);mapping.push({sourceId:r.id,stagingId:id,revision:r.revision});
  }
  const audit={status:'STAGING_RESTORE_UNDERWAY',casesRestored:0,snapshotsVerified:0,mapping};
  try {
    for(let i=0;i<archive.records.length;i++){
      const record=archive.records[i],destination=mapping[i].stagingId;
      const snapshots=[...record.snapshots].sort((a,b)=>a.revision-b.revision);
      for(const snap of snapshots){
        const path=snap.revision===1?'/api/cases':'/api/cases/'+destination;
        const options=snap.revision===1?{method:'POST',body:{id:destination,data:snap.data}}:{method:'PUT',body:{data:snap.data,revision:snap.revision-1}};
        const saved=await api(path,options);
        if(saved?.id!==destination||saved.revision!==snap.revision||await sha(saved.data)!==snap.sha256)
          fail('destination changed a case during the revision write');
        const reread=await api('/api/cases/'+destination+'?revision='+snap.revision);
        if(reread?.id!==destination||reread.revision!==snap.revision||await sha(reread.data)!==snap.sha256)
          fail('read-after-write checksum mismatch at revision '+snap.revision);
        audit.snapshotsVerified++;
      }
      const latest=await api('/api/cases/'+destination);
      if(latest?.revision!==record.revision||await sha(latest.data)!==snapshots.at(-1).sha256)
        fail('current saved case differs from the restored archive');
      audit.casesRestored++;
    }
    // Re-read the entire destination index to ensure no writes were skipped.
    const observed=new Map();let offset=0;
    while(true){
      const page=await api('/api/cases?sort=name&offset='+offset);
      if(!page||!Array.isArray(page.cases)||page.cases.length>50||!page.cases.length&&page.hasMore)
        fail('destination final inventory unreadable');
      for(const row of page.cases){if(observed.has(row.id))fail('duplicate destination case');observed.set(row.id,row.revision);}
      offset+=page.cases.length;if(!page.hasMore)break;
      if(offset>maxCases)fail('unexpected extra destination cases');
    }
    if(observed.size!==mapping.length||mapping.some(row=>observed.get(row.stagingId)!==row.revision))
      fail('destination inventory differs from the restored archive');
    audit.status='ISOLATED_STAGING_RESTORE_VERIFIED';
    return audit;
  }catch(e){
    const error=Error('Staging restore incomplete after '+audit.casesRestored+' full cases and '+audit.snapshotsVerified+' revisions. Do not use this staging workspace as production. Cause: '+e.message);
    error.partialStagingAudit=audit;
    throw error;
  }
}
