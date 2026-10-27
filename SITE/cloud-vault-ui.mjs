// Optional client-side encrypted cross-device study backups for public Fault Current Studio.
// Cloud Vault data never leaves the browser in plaintext. User-selected original-Site backups are imported locally after SHA-256 verification and only uploaded encrypted on an explicit separate action.
import { inspectCloudBackup } from './cloud-backup.mjs';
export const API = 'https://fault-studio-vault-functions.vercel.app/api/vault';
const RECOVERY_KEY = 'fault-studio-public-cloud-recovery-v1';
const SAVED_KEY = 'fault-network-studies-v2';
const DRAFT_KEY = 'fault-network-draft-v2';
const MAX_STUDIES = 800;
const bytes = n => crypto.getRandomValues(new Uint8Array(n));
const toHex = a => Array.from(a,b=>b.toString(16).padStart(2,'0')).join('');
const fromHex = s => Uint8Array.from(s.match(/.{2}/g).map(c=>parseInt(c,16)));
const base64url = a => {
  let s='';for(let i=0;i<a.length;i+=8192)s+=String.fromCharCode(...a.subarray(i,i+8192));
  return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
};
const decode64 = s => Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-s.length%4)%4)),c=>c.charCodeAt(0));
export function parseRecovery(s){
  const m=/^FCS1-([0-9a-f]{64})-([0-9a-f]{64})-([0-9a-f]{64})$/i.exec(String(s||'').trim());
  if(!m)throw Error('Enter a valid Fault Current Studio cloud recovery code.');
  return {id:m[1].toLowerCase(),token:m[2].toLowerCase(),key:m[3].toLowerCase()};
}
export function mergeStudies(existing,incoming){
  if(!Array.isArray(existing)||!Array.isArray(incoming))throw Error('The study list has an invalid format.');
  const valid=x=>x&&typeof x==='object'&&!Array.isArray(x)&&x.project&&typeof x.project==='object'&&!Array.isArray(x.project);
  const seen=new Set(),out=[];
  for(const row of [...existing,...incoming]){
    if(!valid(row))throw Error('An invalid saved study was found. No cloud update was made.');
    const signature=JSON.stringify(row);
    if(seen.has(signature))continue;
    seen.add(signature);out.push(row);
    if(out.length>MAX_STUDIES)throw Error('Over 800 saved versions. Export your local cases and archive old versions before cloud backup.');
  }
  return out;
}
/** Validate and convert ONLY the read-only owner backup exported by private Studio.
 * Every historical revision remains a distinct browser-local snapshot. Never
 * replace current drafts or an existing saved case; cloud upload is separate.
 */
export async function convertOriginalStudioBackup(archive){
 const result=await inspectCloudBackup(archive);
 if(result.snapshotCount>MAX_STUDIES)throw Error('More than 800 history revisions: use a smaller verified backup; nothing imported.');
 const entries=[];
 for(const record of archive.records){
  for(const snap of record.snapshots){
   const project=snap.data;
   if(!project||typeof project.id!=='string'||!project.id||!Array.isArray(project.buses)||!Array.isArray(project.sources)||!Array.isArray(project.branches))throw Error('Original backup includes a project requiring conversion before import: '+record.id+'. No data was imported.');
   entries.push({saved:snap.savedAt||record.updatedAt||archive.createdAt,project,
    source:'original-private-cloud-backup-v1',originalCaseId:record.id,originalRevision:snap.revision,originalSha256:snap.sha256});
  }
 }
 return {entries,cases:result.caseCount,revisions:result.snapshotCount};
}
const getSaved=()=>{
  let v;
  try{v=JSON.parse(localStorage.getItem(SAVED_KEY)||'[]');}
  catch{throw Error('Saved studies are unreadable. Export a local backup before cloud sync.');}
  if(!Array.isArray(v))throw Error('Saved studies have an invalid format. Export a backup before syncing.');
  return mergeStudies([],v);
};
const getDraft=()=>{try{const v=JSON.parse(localStorage.getItem(DRAFT_KEY)||'null');return v&&typeof v==='object'&&!Array.isArray(v)?v:null;}catch{throw Error('The current draft is unreadable. Export it before syncing.');}};
export async function encrypt(value,key){
  const k=await crypto.subtle.importKey('raw',fromHex(key),{name:'AES-GCM'},false,['encrypt']);
  const iv=bytes(12),data=new TextEncoder().encode(JSON.stringify(value));
  const encrypted=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},k,data));
  const packed=new Uint8Array(12+encrypted.length);packed.set(iv);packed.set(encrypted,12);return base64url(packed);
}
export async function decrypt(value,key){
  const raw=decode64(value);
  if(raw.length<29)throw Error('Encrypted backup is incomplete.');
  const k=await crypto.subtle.importKey('raw',fromHex(key),{name:'AES-GCM'},false,['decrypt']);
  let dec;try{dec=await crypto.subtle.decrypt({name:'AES-GCM',iv:raw.slice(0,12)},k,raw.slice(12));}
  catch{throw Error('Unable to decrypt this vault. Recovery code or backup integrity is incorrect.');}
  let data;try{data=JSON.parse(new TextDecoder().decode(dec));}catch{throw Error('Decrypted backup format is invalid.');}
  if(data?.schema!==1||!Array.isArray(data.studies)||data.studies.length>MAX_STUDIES||data.studies.some(x=>!x?.project)||data.draft&&(typeof data.draft!=='object'||Array.isArray(data.draft)))throw Error('Unsupported or malformed cloud backup.');
  return data;
}
async function request(creds,method,body,version){
  const headers={Authorization:'Bearer '+creds.token};
  if(body!==undefined)headers['Content-Type']='application/json';
  if(version!==undefined)headers['If-Match']=String(version);
  let response;try{response=await fetch(API+'?id='+creds.id,{method,headers,cache:'no-store',body:body===undefined?undefined:JSON.stringify({ciphertext:body})});}
  catch{throw Error('Cannot reach cloud storage. Your browser-local studies remain available.');}
  let payload;try{payload=await response.json();}catch{throw Error('Cloud storage gave an unexpected response.');}
  if(!response.ok)throw Error(payload.error||'Cloud error HTTP '+response.status);
  return payload;
}
const credentialText=c=>'FCS1-'+c.id+'-'+c.token+'-'+c.key;
const stash=c=>localStorage.setItem(RECOVERY_KEY,credentialText(c));
function current(){try{return parseRecovery(localStorage.getItem(RECOVERY_KEY)||'')}catch{return null;}}
function snapshot(){return {schema:1,studies:getSaved(),draft:getDraft(),savedAt:new Date().toISOString()};}
const dialogCss=`
#fcs-cloud-open{position:fixed;right:17px;bottom:90px;z-index:3900;background:#0e6178;color:white;border:2px solid #a5e0e7;border-radius:25px;padding:12px 17px;box-shadow:0 8px 22px #102e3b80;font:600 14px system-ui;cursor:pointer}
#fcs-cloud-dialog{position:fixed;inset:0;z-index:4000;background:#10222ccd;display:none;align-items:center;justify-content:center;padding:12px;font:14px system-ui}
#fcs-cloud-dialog[data-open='true']{display:flex}
#fcs-cloud-panel{box-sizing:border-box;background:#f8fcfd;color:#172c38;max-width:600px;width:100%;max-height:calc(100vh - 30px);overflow:auto;border-radius:14px;padding:21px;box-shadow:0 12px 50px #0b1525bd}
#fcs-cloud-panel button{background:#0d5873;color:white;border:0;border-radius:8px;padding:10px 12px;margin:4px 5px 4px 0;cursor:pointer;font:600 13px system-ui}
#fcs-cloud-panel button:disabled{opacity:.45;cursor:wait}
#fcs-cloud-panel textarea{font:12px ui-monospace,monospace;width:100%;box-sizing:border-box;min-height:72px;margin:8px 0;padding:9px;border:1px solid #a9b8c2;border-radius:6px}
#fcs-cloud-panel p{line-height:1.48;margin:9px 0}#fcs-cloud-message{min-height:24px;white-space:pre-wrap;padding:6px 0}#fcs-cloud-panel .cloud-row{display:flex;gap:6px;flex-wrap:wrap;align-items:center}#fcs-cloud-panel .cloud-badge{color:#315d4f;font-weight:700}
`;
function install(){
  if(document.getElementById('fcs-cloud-open'))return;
  const style=document.createElement('style');style.textContent=dialogCss;document.head.append(style);
  const open=document.createElement('button');open.id='fcs-cloud-open';open.type='button';open.textContent='☁ Cloud Vault';open.setAttribute('aria-haspopup','dialog');document.body.append(open);
  const overlay=document.createElement('div');overlay.id='fcs-cloud-dialog';overlay.setAttribute('aria-hidden','true');
  overlay.innerHTML=`<div id="fcs-cloud-panel" role="dialog" aria-modal="true" aria-label="Encrypted study cloud backup"><div class="cloud-row" style="justify-content:space-between"><h2 style="margin:0;font:700 22px system-ui">Encrypted Cloud Vault</h2><button data-cloud="close">Close ×</button></div><p>Optional cross-device study backup. All calculations and browser-local saves still work without cloud. Your studies are encrypted in this browser before upload.</p><p><strong id="fcs-cloud-state">Not connected</strong></p><div class="cloud-row"><button data-cloud="create">Create new vault</button><button data-cloud="save">Back up local studies</button><button data-cloud="import">Import saved cloud studies</button></div><label for="fcs-cloud-code">Recovery code (save it somewhere private; anyone with this code can access the vault)</label><textarea spellcheck="false" id="fcs-cloud-code" placeholder="Paste a recovery code to connect from another device"></textarea><p><strong>Bring studies from the original private Studio</strong></p><p>Choose a complete owner cloud-backup JSON export. Every revision is verified before local import; nothing is uploaded or overwritten automatically.</p><input type="file" id="fcs-original-backup" accept=".json,application/json" style="max-width:100%;margin-bottom:7px"><div class="cloud-row"><button data-cloud="legacy">Verify & import original Studio backup</button></div><div class="cloud-row"><button data-cloud="connect">Connect using code</button><button data-cloud="copy">Copy recovery code</button><button data-cloud="download">Download recovery code</button><button data-cloud="forget">Disconnect this device</button></div><p id="fcs-cloud-message" role="status"></p><p style="font-size:12px;color:#415d6b">Import adds saved cases only; your active diagram/draft is never overwritten. Existing saved studies are preserved. Cross-device changes need manual Back up/Import; this is not continuous automatic sync.</p></div>`;
  document.body.append(overlay);
  const codeBox=overlay.querySelector('#fcs-cloud-code'),state=overlay.querySelector('#fcs-cloud-state'),message=overlay.querySelector('#fcs-cloud-message');
  let active=false;
  const setMsg=(s,ok=true)=>{message.textContent=s;message.style.color=ok?'#17603a':'#9b2525'};
  const display=()=>{const c=current();state.textContent=c?'Connected on this device':'Not connected';state.className=c?'cloud-badge':'';return c};
  const busy=async fn=>{if(active)return;active=true;overlay.querySelectorAll('button').forEach(b=>b.disabled=true);setMsg('Working…');try{await fn();}catch(e){setMsg(e?.message||'Cloud operation failed',false);}finally{active=false;overlay.querySelectorAll('button').forEach(b=>b.disabled=false);display();}};
  open.onclick=()=>{display();overlay.dataset.open='true';overlay.setAttribute('aria-hidden','false');};
  overlay.addEventListener('click',e=>{if(e.target===overlay){overlay.dataset.open='false';overlay.setAttribute('aria-hidden','true');}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&overlay.dataset.open==='true'){overlay.dataset.open='false';overlay.setAttribute('aria-hidden','true');}});
  overlay.addEventListener('click',async e=>{
    const el=e.target.closest('[data-cloud]');if(!el)return;
    const command=el.dataset.cloud;
    if(command==='close'){overlay.dataset.open='false';overlay.setAttribute('aria-hidden','true');return;}
    if(command==='create')return busy(async()=>{
      if(current()&&!confirm('Create a DIFFERENT vault? Your existing vault will remain online, but the recovery code must be saved separately.'))return;
      const c={id:toHex(bytes(32)),token:toHex(bytes(32)),key:toHex(bytes(32))};
      const ciphertext=await encrypt(snapshot(),c.key);
      await request(c,'POST',ciphertext);
      stash(c);codeBox.value=credentialText(c);
      setMsg('Cloud vault created and saved. IMPORTANT: Copy or download the recovery code now, before changing devices.');
    });
    if(command==='connect')return busy(async()=>{
      const c=parseRecovery(codeBox.value);
      const data=await request(c,'GET');await decrypt(data.ciphertext,c.key);
      stash(c);setMsg('Connected successfully. Select Import to add cloud cases to this device, or Back up to merge this device’s cases into cloud.');
    });
    if(command==='save')return busy(async()=>{
      const c=display();if(!c)throw Error('Create a vault or paste and connect with your recovery code first.');
      const remote=await request(c,'GET');const old=await decrypt(remote.ciphertext,c.key);
      const local=snapshot();
      const cloudDraft=old.draft&&!old.studies.some(x=>JSON.stringify(x.project)===JSON.stringify(old.draft))? [{saved:old.savedAt||new Date().toISOString(),project:old.draft}]:[];
      const merged={schema:1,studies:mergeStudies([...old.studies,...cloudDraft],local.studies),draft:local.draft||old.draft,savedAt:new Date().toISOString()};
      const encrypted=await encrypt(merged,c.key);
      const done=await request(c,'PUT',encrypted,remote.version);
      setMsg('Encrypted cloud backup updated to revision '+done.version+' with '+merged.studies.length+' saved study snapshots. Existing cloud studies retained.');
    });
    if(command==='import')return busy(async()=>{
      const c=display();if(!c)throw Error('Connect to a vault first.');
      const data=await request(c,'GET');const downloaded=await decrypt(data.ciphertext,c.key);
      const incoming=[...downloaded.studies];
      if(downloaded.draft)incoming.push({saved:downloaded.savedAt||new Date().toISOString(),project:downloaded.draft});
      const existing=getSaved(),merged=mergeStudies(existing,incoming);
      if(merged.length===existing.length){setMsg('Cloud vault checked; no new saved studies to import. Your current draft remains untouched.');return;}
      if(!confirm('Add '+(merged.length-existing.length)+' cloud study snapshot(s) to this browser? Current working drawing will not be replaced.')){setMsg('Import cancelled; no changes made.');return;}
      const backupKey='fault-network-pre-cloud-import-'+Date.now();
      const raw=localStorage.getItem(SAVED_KEY);
      if(raw!==null)localStorage.setItem(backupKey,raw);
      localStorage.setItem(SAVED_KEY,JSON.stringify(merged));
      setMsg('Imported '+(merged.length-existing.length)+' saved studies. Open Saved studies & backups or reload the page to see them. Current drawing was not changed.');
    });
    if(command==='legacy')return busy(async()=>{
      const file=overlay.querySelector('#fcs-original-backup').files?.[0];
      if(!file)throw Error('Select a complete original Studio owner-backup JSON file first.');
      if(file.size<30||file.size>16*1024*1024)throw Error('Original backup file must be between 30 bytes and 16 MB. No import performed.');
      let source;try{source=JSON.parse(await file.text());}catch{throw Error('The selected original backup is not valid JSON. No import performed.');}
      const verified=await convertOriginalStudioBackup(source);
      const existing=getSaved(),merged=mergeStudies(existing,verified.entries);
      const added=merged.length-existing.length;
      if(!added){setMsg('Original backup verified: '+verified.cases+' cases / '+verified.revisions+' revisions. All snapshots are already present.');return;}
      if(!confirm('Verified '+verified.cases+' original cases and '+verified.revisions+' historical revisions. Add '+added+' snapshots to THIS device? Active drawing will remain untouched. Cloud upload requires a separate Back up click.')){setMsg('Verified backup; import cancelled. No changes made.');return;}
      const previous=localStorage.getItem(SAVED_KEY),backupKey='fault-network-before-original-import-'+Date.now();
      if(previous!==null)localStorage.setItem(backupKey,previous);
      localStorage.setItem(SAVED_KEY,JSON.stringify(merged));
      setMsg('Imported '+added+' verified original Studio revision snapshots into this browser. Active diagram unchanged. Back up local studies separately to upload them encrypted to your Cloud Vault.');
    });
    if(command==='copy')return busy(async()=>{const c=current();if(!c)throw Error('No vault connected on this device.');await navigator.clipboard.writeText(credentialText(c));codeBox.value=credentialText(c);setMsg('Recovery code copied. Keep it confidential.');});
    if(command==='download')return busy(async()=>{const c=current();if(!c)throw Error('No vault connected.');const blob=new Blob([credentialText(c)+'\n'],{type:'text/plain'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='fault-studio-vault-recovery-code.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);codeBox.value=credentialText(c);setMsg('Recovery code downloaded. Anyone with the code can access the cloud backup.');});
    if(command==='forget')return busy(async()=>{if(!current()){setMsg('No vault connected.');return;}if(!confirm('Disconnect this device? You will need the recovery code to reconnect. Cloud backup will not be deleted.'))return;localStorage.removeItem(RECOVERY_KEY);codeBox.value='';setMsg('Disconnected. Local saved studies remain on this device.');});
  });
  display();
}
if(typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
}
