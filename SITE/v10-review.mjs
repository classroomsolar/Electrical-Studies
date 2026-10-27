/** Audited v10 add-only, read-only catalogue. No project or calculation mutations. */
export const BLOCKED_NOTE='REFERENCE ONLY. These records are not approved for fault calculations, equipment ratings, or saved-study migration.';
export function validateShadowManifest(data){
 if(!data||data.schema!==1||data.mode!=='REFERENCE_ONLY_NO_CALCULATION'||!(/^[a-f0-9]{64}$/).test(data.sourceSHA256)||!(/^[a-f0-9]{64}$/).test(data.activeCatalogueWorkbookSHA256)||data.sourceWorkbook!=='Engineering_Master_Database_v10_Audited.xlsx'||!Number.isSafeInteger(data.totalNoncurated)||data.totalNoncurated<0||!data.categories||typeof data.categories!=='object'||Array.isArray(data.categories))throw Error('Unexpected audited workbook manifest');
 let count=0;for(const [name,info] of Object.entries(data.categories)){
  if(!/^[A-Z][A-Z0-9_]*$/.test(name)||!info||!Number.isSafeInteger(info.count)||info.count<0||info.calculationEligible!==false||!(/^[a-z0-9_]+-index\.json$/).test(info.indexFile)||!(/^[a-z0-9_]+-samples\.json$/).test(info.sampleFile)||!(/^[a-f0-9]{64}$/).test(info.indexSHA256)||!(/^[a-f0-9]{64}$/).test(info.sampleSHA256))throw Error('Untrusted v10 category or file');
  count+=info.count;
 }if(count!==data.totalNoncurated)throw Error('Incomplete v10 candidate inventory');return data;
}
export function validateShadowIndex(payload,manifest,sheet){
 if(!manifest?.categories?.[sheet]||payload?.schema!==1||payload.sheet!==sheet||!Array.isArray(payload.items)||payload.items.length!==manifest.categories[sheet].count)throw Error('Incomplete or unexpected candidate ID index');
 const seen=new Set();for(const item of payload.items){if(!Array.isArray(item)||item.length!==3||typeof item[0]!=='string'||!item[0]||seen.has(item[0])||!Number.isSafeInteger(item[1])||item[1]<2||!['DOCUMENTED_REFERENCE_REVIEW','NOT_FAULT_QUALIFIED','SOURCE_UNDOCUMENTED','SOURCE_CONFLICT_REVIEW','UNCLASSIFIED_REVIEW'].includes(item[2]))throw Error('Invalid or repeated candidate identity');seen.add(item[0]);}return payload;
}
export function validateShadowSamples(payload,manifest,sheet,index=null){
 if(!manifest?.categories?.[sheet]||payload?.schema!==1||payload.sheet!==sheet||!Array.isArray(payload.items)||payload.items.length!==manifest.categories[sheet].sampleCount)throw Error('Invalid v10 candidate sample set');
 const ids=new Set(),indexed=index?new Map(index.items.map(([id,r,status])=>[id,{row:r,status}])):null;for(const row of payload.items){if(indexed&&(!indexed.has(row.id)||indexed.get(row.id).row!==row.row||indexed.get(row.id).status!==row.status))throw Error('Sample mismatch to verified ID index');if(typeof row.id!=='string'||!row.id||ids.has(row.id)||row.calculationEligible!==false||!Number.isSafeInteger(row.row)||row.row<2||!row.fields||typeof row.fields!=='object'||Array.isArray(row.fields))throw Error('Invalid candidate row');ids.add(row.id);}return payload;
}
export function searchShadowIndex(payload,search='',status=''){const term=String(search??'').trim().toLowerCase(),pick=String(status??'');return payload.items.filter(([id,row,state])=>(!pick||state===pick)&&(!term||id.toLowerCase().includes(term)||String(row)===term));}
export function applyV10CandidateToStudy(){throw Error(BLOCKED_NOTE)}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function formatShadowRows(rows,samples,{limit=40,offset=0}={}){
 const byID=new Map((samples?.items||[]).map(x=>[x.id,x]));
 return rows.slice(offset,offset+limit).map(([id,r,status])=>{const sample=byID.get(id);return `<tr><td><strong>${esc(id)}</strong></td><td>${r}</td><td>${esc(status.replaceAll('_',' '))}</td><td>${sample?`<details><summary>View source fields</summary><dl>${Object.entries(sample.fields).filter(([k])=>k!=='_row').slice(0,120).map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></details>`:'Full source: v10 workbook row '+r}</td><td><strong>Blocked</strong></td></tr>`;}).join('');
}
export async function startShadowReview({base='database/v10-shadow/'}={}){
 const $=sel=>document.querySelector(sel);const status=$('#status'),table=$('#records'),selector=$('#category'),q=$('#search'),filter=$('#status-filter');let manifest=null,index=null,samples=null,matched=[];let page=0;
 const api=async f=>{const r=await fetch(base+f,{cache:'no-cache'});if(!r.ok)throw Error('Could not load the selected v10 review file');return r.json()};
 function render(){matched=index?searchShadowIndex(index,q.value,filter.value):[];table.innerHTML=matched.length?formatShadowRows(matched,samples,{offset:page*40}):'<tr><td colspan="5">No matching candidate records</td></tr>';
   status.textContent=`${matched.length.toLocaleString()} non-curated ID matches · showing page ${page+1} · ${manifest.categories[selector.value].count.toLocaleString()} candidates in category · NONE are eligible to apply`;
   $('#previous').disabled=page===0;$('#next').disabled=(page+1)*40>=matched.length;
 }
 async function loadCategory(){const sheet=selector.value;page=0;status.textContent='Reading source index…';table.innerHTML='';try{const info=manifest.categories[sheet];const [ids,details]=await Promise.all([api(info.indexFile),api(info.sampleFile)]);if(selector.value!==sheet)return;index=validateShadowIndex(ids,manifest,sheet);samples=validateShadowSamples(details,manifest,sheet,index);render();}catch(e){index=null;samples=null;status.textContent=String(e.message);}}
 try{manifest=validateShadowManifest(await api('manifest.json'));for(const key of Object.keys(manifest.categories)){const opt=document.createElement('option');opt.value=key;opt.textContent=key.replaceAll('_',' ')+' ('+manifest.categories[key].count.toLocaleString()+')';selector.append(opt)};
   const download=$('#original-workbook');download.href=base+manifest.sourceWorkbook;download.textContent='Download complete audited v10 workbook · SHA-256 '+manifest.sourceSHA256.slice(0,16)+'…';selector.addEventListener('change',loadCategory);q.addEventListener('input',()=>{page=0;render()});filter.addEventListener('change',()=>{page=0;render()});$('#previous').addEventListener('click',()=>{page--;render()});$('#next').addEventListener('click',()=>{page++;render()});await loadCategory();}catch(e){status.textContent='Unable to verify v10 candidate index: '+String(e.message);}
}
