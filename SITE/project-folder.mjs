// V31 project folder: the user's projects live as files in a folder on their own computer.
// The browser asks the user to choose the folder and to allow editing; nothing is uploaded.
// Uses the File System Access API (Chrome, Edge and other Chromium browsers on desktop). Where it is not
// available, the Studio keeps the existing Export / Import project JSON route.
const DB='fcs-project-folder-v31',STORE='handles',KEY='projects';
export const PROJECT_SUFFIX='.fcs.json';
export function projectFileName(name){
 const base=String(name||'').normalize('NFKC').replace(/[\\/:*?"<>|\u0000-\u001f]+/g,' ').replace(/\s+/g,' ').trim().slice(0,90)||'fault-study';
 return base.toLowerCase().endsWith(PROJECT_SUFFIX)?base:base+PROJECT_SUFFIX;
}
export const isProjectFileName=n=>typeof n==='string'&&n.toLowerCase().endsWith('.json')&&!n.startsWith('.');
function idbOpen(idb){return new Promise((resolve,reject)=>{const r=idb.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function idbDo(idb,mode,fn){const db=await idbOpen(idb);try{return await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,mode),req=fn(tx.objectStore(STORE));tx.oncomplete=()=>resolve(req?.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)})}finally{db.close()}}
export function createProjectFolder({win=globalThis,onChange=()=>{},autosaveDelay=1200}={}){
 const idb=win.indexedDB,supported=typeof win.showDirectoryPicker==='function'&&!!idb&&win.isSecureContext!==false;
 const state={supported,handle:null,folderName:'',permission:supported?'none':'unsupported',files:[],linkedFile:null,autosave:true,busy:false,message:'',lastSaved:null};
 let timer=null,pendingProject=null,saving=Promise.resolve();
 const changed=()=>{try{onChange(state)}catch{}};
 const fail=(e,prefix)=>{state.message=(prefix?prefix+': ':'')+(e?.name==='AbortError'?'cancelled.':e?.message||String(e));changed();};
 async function permission(handle,ask){const opts={mode:'readwrite'};if(typeof handle.queryPermission==='function'){let p=await handle.queryPermission(opts);if(p!=='granted'&&ask&&typeof handle.requestPermission==='function')p=await handle.requestPermission(opts);return p}return 'granted'}
 async function refresh(){
  if(!state.handle||state.permission!=='granted')return;state.busy=true;changed();
  try{const files=[];for await(const [name,entry] of state.handle.entries()){if(entry.kind!=='file'||!isProjectFileName(name))continue;try{const f=await entry.getFile();files.push({name,size:f.size,modified:f.lastModified})}catch{}}
   files.sort((a,b)=>b.modified-a.modified||a.name.localeCompare(b.name));state.files=files;state.message=''}
  catch(e){fail(e,'Could not read the folder')}finally{state.busy=false;changed()}
 }
 async function adopt(handle){state.handle=handle;state.folderName=handle.name;state.permission=await permission(handle,false);changed();if(state.permission==='granted')await refresh()}
 return {state,
  async restore(){if(!supported)return;try{const h=await idbDo(idb,'readonly',s=>s.get(KEY));if(h)await adopt(h)}catch{}},
  async connect(){if(!supported)return false;try{const h=await win.showDirectoryPicker({id:'fcs-projects',mode:'readwrite'});await idbDo(idb,'readwrite',s=>s.put(h,KEY));state.linkedFile=null;await adopt(h);if(state.permission!=='granted'){state.permission=await permission(h,true);changed();if(state.permission==='granted')await refresh()}return state.permission==='granted'}catch(e){fail(e,'Folder not connected');return false}},
  async reconnect(){if(!state.handle)return this.connect();try{state.permission=await permission(state.handle,true);changed();if(state.permission==='granted')await refresh();return state.permission==='granted'}catch(e){fail(e,'Folder access');return false}},
  async disconnect(){clearTimeout(timer);timer=null;try{await idbDo(idb,'readwrite',s=>s.delete(KEY))}catch{}Object.assign(state,{handle:null,folderName:'',permission:supported?'none':'unsupported',files:[],linkedFile:null,message:'Folder disconnected. Your files are unchanged.'});changed()},
  refresh,
  async read(name){if(!state.handle)throw Error('No project folder is connected');const fh=await state.handle.getFileHandle(name);const f=await fh.getFile();if(f.size>50e6)throw Error('Project file exceeds 50 MB');return JSON.parse(await f.text())},
  async write(name,project){if(!state.handle||state.permission!=='granted')throw Error('Connect the project folder first');const text=JSON.stringify(project,null,1);const run=async()=>{const fh=await state.handle.getFileHandle(name,{create:true});const w=await fh.createWritable();try{await w.write(text)}catch(e){await w.abort?.();throw e}await w.close();state.lastSaved=Date.now()};saving=saving.then(run,run);await saving;await refresh();return name},
  async remove(name){if(!state.handle)throw Error('No project folder is connected');await state.handle.removeEntry(name);if(state.linkedFile===name)state.linkedFile=null;await refresh()},
  link(name){state.linkedFile=name;changed()},
  unlink(){clearTimeout(timer);timer=null;state.linkedFile=null;changed()},
  setAutosave(on){state.autosave=Boolean(on);changed()},
  exists(name){return state.files.some(f=>f.name===name)},
  // Debounced write of the open project to its linked file; the latest state always wins.
  schedule(project){if(!state.linkedFile||!state.autosave||state.permission!=='granted')return;pendingProject=project;const file=state.linkedFile;clearTimeout(timer);timer=setTimeout(async()=>{timer=null;const p=pendingProject;pendingProject=null;if(state.linkedFile!==file||!p)return;try{await this.write(file,p)}catch(e){fail(e,'Autosave to '+file+' failed')}},autosaveDelay)},
  async flush(){if(timer){clearTimeout(timer);timer=null;const p=pendingProject;pendingProject=null;if(p&&state.linkedFile)await this.write(state.linkedFile,p)}await saving}
 };
}
