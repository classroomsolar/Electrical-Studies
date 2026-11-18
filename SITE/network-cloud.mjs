const clone=value=>JSON.parse(JSON.stringify(value));
export function canonicalStudy(value) {
  const p=clone(value);p.caseName=p.caseName?.trim()||'Base study';
  const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
  return JSON.stringify(stable(p));
}
export class CloudError extends Error {
  constructor(message,status=0,details={}){super(message);this.status=status;this.details=details;}
}
export function createCloudStudies({fetcher=(...args)=>fetch(...args),onState=()=>{},remember=()=>{},debounce=900}={}) {
  let csrf='',csrfRequest=null,current=null,active=null,version=0,generation=0,dirty=false,timer=null,inFlight=null,createId=null,lastSaved=null;
  const state={available:false,loading:false,saving:false,conflict:false,message:'Draft saved on this device',active:null};
  const publish=()=>{state.active=active?{...active}:null;onState({...state});};
  const changedState=values=>{Object.assign(state,values);publish();};
  function queueSave(){clearTimeout(timer);const expectedGeneration=generation;timer=setTimeout(()=>{timer=null;if(generation===expectedGeneration&&active&&dirty&&state.available&&!state.conflict)save().catch(()=>{});},debounce);}
  async function api(path,{method='GET',body:payload,download=false}={}) {
    if(method!=='GET'&&!csrf)await ensureSession();
    let response;
    try{response=await fetcher(path,{method,credentials:'same-origin',headers:{...(payload?{'content-type':'application/json'}:{}),...(method!=='GET'?{'x-studio-csrf':csrf}:{})},...(payload?{body:JSON.stringify(payload)}:{}),signal:AbortSignal.timeout(download?90000:20000)});}catch{throw new CloudError('Cloud connection failed. Your edits are retained on this device.');}
    if(!response.ok){let info={};try{info=await response.json()}catch{}throw new CloudError(info.message||'The cloud request could not finish. Your edits are retained.',response.status,info);}
    return download?response.blob():response.json();
  }
  async function ensureSession(){if(csrf)return;if(!csrfRequest)csrfRequest=api('/api/session').then(auth=>{if(!auth.csrf)throw new CloudError('Private access is not ready. Refresh Studio and try again.');csrf=auth.csrf;});try{await csrfRequest;}finally{csrfRequest=null;}}
  const rememberActive=()=>{remember(active&&current?{projectId:current.id,...active}:null);};
  function attach(data,meta=null,{saved=false}={}) {
    clearTimeout(timer);generation++;version++;current=clone(data);active=meta?{id:meta.id,revision:meta.revision,createdAt:meta.createdAt,updatedAt:meta.updatedAt}:null;createId=null;
    lastSaved=saved?canonicalStudy(data):meta?.savedStudy||null;dirty=Boolean(active&&canonicalStudy(data)!==lastSaved);
    changedState({saving:false,conflict:false,message:active?(dirty?'Unsaved edits · ready to sync':'Saved revision '+active.revision):'Draft on this device · Save study to enable cloud autosave'});rememberActive();
  }
  function edit(data) {
    current=clone(data);version++;dirty=Boolean(active&&canonicalStudy(current)!==lastSaved);
    if(!active||!state.available)return;
    if(dirty){changedState({message:state.conflict?state.message:'Unsaved edits · autosave pending'});clearTimeout(timer);if(!state.conflict)queueSave();}
    else{clearTimeout(timer);if(!state.conflict)changedState({message:state.saving?'Saving private study…':'Saved in cloud · revision '+active.revision});}
  }
  async function save({asCopy=false}={}) {
    if(!state.available)throw new CloudError('Cloud saved studies are unavailable. Export JSON or keep a device backup.');
    clearTimeout(timer);
    if(inFlight){const expectedGeneration=generation;await inFlight;if(expectedGeneration!==generation)return {stale:true};return save({asCopy});}
    if(!current)throw new CloudError('There is no current study to save.');
    if(state.conflict&&!asCopy)throw new CloudError(state.message,409);
    if(active&&!dirty&&!asCopy)return {...active,data:clone(current)};
    if(asCopy){active=null;createId=null;generation++;lastSaved=null;dirty=false;rememberActive();changedState({conflict:false});}
    const snapshot=clone(current),startVersion=version,startGeneration=generation,previousActive=active?{...active}:null;
    if(!previousActive)createId??=crypto.randomUUID();
    changedState({saving:true,message:'Saving private study…'});
    const operation=(async()=>{
      try {
        const row=await api(previousActive?'/api/cases/'+previousActive.id:'/api/cases',{method:previousActive?'PUT':'POST',body:{data:snapshot,...(previousActive?{revision:previousActive.revision}:{id:createId})}});
        if(startGeneration!==generation)return {stale:true};
        active={id:row.id,revision:row.revision,createdAt:row.createdAt,updatedAt:row.updatedAt};createId=null;lastSaved=canonicalStudy(row.data);dirty=canonicalStudy(current)!==lastSaved;
        rememberActive();changedState({saving:false,conflict:false,message:dirty?'Saved revision '+row.revision+' · newer edits pending':'Saved in cloud · revision '+row.revision});
        if(dirty)queueSave();
        return row;
      }catch(error){if(startGeneration===generation){dirty=Boolean(active);changedState({saving:false,conflict:error.status===409,message:error.message});}throw error;}
    })();
    inFlight=operation;
    try{return await operation;}finally{if(inFlight===operation)inFlight=null;}
  }
  return {
    get state(){return {...state,active:active?{...active}:null,dirty};},
    attach,edit,save,api,
    async initialize(data,link=null) {
      attach(data,link);const expectedGeneration=generation;changedState({loading:true,message:'Connecting private saved studies…'});
      try {
        await ensureSession();await api('/api/config');changedState({available:true,loading:false,message:active?'Checking saved revision…':'Draft on this device · Save study to enable cloud autosave'});
        if(expectedGeneration!==generation)return;
        if(active){const row=await api('/api/cases/'+active.id);if(expectedGeneration!==generation)return;if(row.data.id!==current.id){attach(current);return;}if(row.revision!==active.revision){changedState({conflict:true,message:'A newer saved revision is available. Open it or save your edits as a copy.'});return;}
          lastSaved=canonicalStudy(row.data);dirty=canonicalStudy(current)!==lastSaved;rememberActive();changedState({message:dirty?'Unsaved device edits · autosave pending':'Saved in cloud · revision '+active.revision});if(dirty)queueSave();
        }
      }catch(error){if(error.status===404){attach(current);changedState({loading:false});}else changedState({available:false,loading:false,message:error.message});}
    },
    async flush(){clearTimeout(timer);if(inFlight)await inFlight;if(active&&dirty)return save();return active;},
    async list(options={}){const params=new URLSearchParams({q:options.search||'',sort:options.sort||'updated_desc',offset:String(options.offset||0)});return api('/api/cases?'+params);},
    async open(caseId,{revision=null}={}){return api('/api/cases/'+caseId+(revision===null?'':'?revision='+encodeURIComponent(revision)));},
    async rename(row,name){return api('/api/cases/'+row.id+'/rename',{method:'POST',body:{name,revision:row.revision}});},
    async duplicate(row,asScenario=false){return api('/api/cases/'+row.id+'/duplicate',{method:'POST',body:{id:crypto.randomUUID(),revision:row.revision,asScenario}});},
    async remove(row){const value=await api('/api/cases/'+row.id,{method:'DELETE',body:{revision:row.revision}});if(active?.id===row.id)attach(current);return value;},
    async report(data,format){return api('/api/reports/'+format,{method:'POST',body:{data},download:true});}
  };
}
