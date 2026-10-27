import {isDcStudy,calculateDcProject,validateDcProject,dcScope} from './dc-network.mjs?v=20261022-pv-final';
import {calculateConnectedProject,validateConnectedSequences} from './connected-sequences.mjs?v=20261022-pv-final';
import {isSplitPhaseFault,calculateSplitPhaseProject,splitPhaseIssues,splitPhaseScope} from './split-phase-network.mjs?v=20261022-pv-final';

export const analysisFaultTypes=[['single-ll','Single/split-phase · L1–L2 full winding'],['split-l1-n','Split-phase · L1–neutral'],['split-l2-n','Split-phase · L2–neutral'],['split-l1-g','Split-phase · L1–ground'],['split-l2-g','Split-phase · L2–ground'],['3phase','3-phase fault'],['3phase-ground','3-phase-to-ground fault'],['ll','Line-to-line'],['slg','Single-line-to-ground'],['dlg','Double-line-to-ground · B–C–ground'],['dc','DC pole-to-pole · documented resistive loop']];
export const usesConnectedSequences=p=>p?.settings?.faultType==='3phase-ground'||(['3phase','ll','slg','dlg'].includes(p?.settings?.faultType)&&p?.settings?.sequenceModel==='connected');
export const isExtendedStudy=p=>isDcStudy(p)||isSplitPhaseFault(p)||usesConnectedSequences(p);
export const analysisFaultLabel=p=>analysisFaultTypes.find(([key])=>key===p?.settings?.faultType)?.[1]||'Unknown fault type';
export const analysisQuantity=p=>isDcStudy(p)?'Prospective DC current':isSplitPhaseFault(p)?'Single-leg RMS':usesConnectedSequences(p)?'Maximum phase RMS':'Fault RMS';
export function analysisScope(p){return isDcStudy(p)?dcScope():isSplitPhaseFault(p)?splitPhaseScope:usesConnectedSequences(p)?'Connected positive-, negative- and zero-sequence RMS network with explicit source, conductor and transformer grounding data. Source superposition and actual terminal currents are separate quantities. No unbalanced IBR controls, transient decay, peak or complete IEC/ANSI procedures.':'';}
const active=(e,p)=>e.enabled!==false&&(!e.deviceId||p.devices.find(d=>d.id===e.deviceId)?.enabled!==false);
const supplied=v=>v!==undefined&&v!==null&&v!=='';
const value=(x,key,fallback)=>x&&Object.hasOwn(x,key)?x[key]:fallback;
const record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const referenceText=docs=>[...new Set(docs.filter(x=>typeof x==='string'&&x.trim()))].join('\n');
const documented=(item,prior,docs)=>Object.hasOwn(item||{},'dataReference')&&item.dataReference!==referenceText(docs)?item.dataReference:prior;
// Expose explicitly imported canonical data in the same editable controls as newly entered studies.
// Preserve null/false edits, separate imported documents, and parallel bond records.
export function hydrateSplitPhaseInputs(p){
 const cfg=p.splitPhaseNetwork;if(!record(cfg))return p;
 const fill=(item,key,v)=>{if(item&&!Object.hasOwn(item,key)&&v!==undefined)item[key]=v;};
 const reference=(item,docs)=>{const text=referenceText(docs);if(text.length<=1000&&text)fill(item,'dataReference',text);};
 const tx=p.branches.find(e=>e.id===cfg.transformerId),source=p.sources.find(s=>s.id===cfg.sourceId);
 fill(p.settings,'splitTransformerId',cfg.transformerId);
 if(tx){fill(tx,'splitDocument',cfg.document);if(cfg.impedanceModel==='documented-uncoupled')fill(tx,'splitUncoupled',true);for(const leg of ['L1','L2'])for(const part of ['r','x'])fill(tx,'splitHalf'+leg+part.toUpperCase(),cfg.halfWinding?.[leg]?.[part]);reference(tx,['L1','L2'].map(leg=>cfg.halfWinding?.[leg]?.document));}
 if(source){fill(source,'voltage',cfg.upstream?.voltage);fill(source,'splitUpstreamR',cfg.upstream?.r);fill(source,'splitUpstreamX',cfg.upstream?.x);reference(source,[cfg.upstream?.document]);}
 for(const e of p.branches){if(!record(e.splitPhase?.conductors))continue;for(const leg of ['L1','L2','N','G']){const c=e.splitPhase.conductors[leg];if(!record(c))continue;fill(e,'split'+leg+'Open',c.open===true);for(const part of ['r','x'])fill(e,'split'+leg+part.toUpperCase(),c[part]);}reference(e,Object.values(e.splitPhase.conductors).map(c=>c?.document));}
 for(const b of p.buses){const bonds=Array.isArray(cfg.bonds)?cfg.bonds.filter(x=>record(x)&&x.bus===b.id):[];if(bonds.length!==1)continue;fill(b,'splitBondEnabled',true);fill(b,'splitBondR',bonds[0].r);fill(b,'splitBondX',bonds[0].x);reference(b,[bonds[0].document]);}
 return p;
}
// This adapter only assembles explicitly entered properties. It supplies no impedance or bonding defaults.
export function prepareSplitPhaseProject(input){
 const p=structuredClone(input),prior=p.splitPhaseNetwork;
 const tx=p.branches.find(e=>e.id===p.settings.splitTransformerId)||(!Object.hasOwn(p.settings,'splitTransformerId')?p.branches.find(e=>e.id===prior?.transformerId):null);
 if(!tx){delete p.splitPhaseNetwork;return p;}
 const old=tx.id===prior?.transformerId?prior:undefined;
 const source=p.sources.find(s=>s.id===old?.sourceId&&s.bus===tx.from&&s.enabled!==false)||p.sources.find(s=>s.bus===tx.from&&s.enabled!==false),upstream=source?.id===old?.sourceId?old?.upstream:undefined;
 const scope=new Set([tx.to]),queue=[tx.to];
 for(let k=0;k<queue.length;k++)for(const e of p.branches)if(e.kind!=='transformer'&&active(e,p)&&(e.from===queue[k]||e.to===queue[k])){const next=e.from===queue[k]?e.to:e.from;if(!scope.has(next)){scope.add(next);queue.push(next);}}
 const document=value(tx,'splitDocument',old?.document),halfDocs=['L1','L2'].map(leg=>old?.halfWinding?.[leg]?.document);
 const half=leg=>({r:value(tx,'splitHalf'+leg+'R',old?.halfWinding?.[leg]?.r),x:value(tx,'splitHalf'+leg+'X',old?.halfWinding?.[leg]?.x),document:documented(tx,old?.halfWinding?.[leg]?.document,halfDocs)});
 const bonds=[];
 for(const b of p.buses){const priors=old?.bonds?.filter(x=>x.bus===b.id)||[],prior=priors.length===1?priors[0]:undefined;if(b.splitBondEnabled===undefined){bonds.push(...priors);continue;}if(b.splitBondEnabled===true)bonds.push({id:prior?.id||'bond-'+b.id,bus:b.id,r:value(b,'splitBondR',prior?.r),x:value(b,'splitBondX',prior?.x),document:value(b,'dataReference',prior?.document)});}
 p.splitPhaseNetwork={busId:tx.to,busIds:[...scope],transformerId:tx.id,sourceId:source?.id,fullVoltage:tx.v2,frequency:p.settings.frequency,impedanceModel:tx.splitUncoupled===true?'documented-uncoupled':tx.splitUncoupled===false?'unconfirmed':old?.impedanceModel,document,halfWinding:{basis:'documented-half-winding-ohms',L1:half('L1'),L2:half('L2')},upstream:{basis:'documented-primary-loop',voltage:tx.v1,r:value(source,'splitUpstreamR',upstream?.r),x:value(source,'splitUpstreamX',upstream?.x),document:value(source,'dataReference',upstream?.document)},bonds};
 for(const e of p.branches){if(e.kind==='transformer'||!scope.has(e.from)||!scope.has(e.to))continue;const conductors={},docs=['L1','L2','N','G'].map(leg=>e.splitPhase?.conductors?.[leg]?.document);for(const leg of ['L1','L2','N','G']){const prior=e.splitPhase?.conductors?.[leg],open=e['split'+leg+'Open'];conductors[leg]=open===true?{open:true}:open===undefined&&prior?.open===true?{open:true}:{r:value(e,'split'+leg+'R',prior?.r),x:value(e,'split'+leg+'X',prior?.x),document:documented(e,prior?.document,docs)};}e.splitPhase={...e.splitPhase,conductors};}
 return p;
}
const connected=p=>p.settings.faultType==='3phase-ground'&&p.settings.sequenceModel!=='connected'?{...p,settings:{...p.settings,sequenceModel:'connected'}}:p;
export function calculateExtendedProject(p){let result;if(isDcStudy(p))result=calculateDcProject(p);else if(isSplitPhaseFault(p))result=calculateSplitPhaseProject(prepareSplitPhaseProject(p));else if(usesConnectedSequences(p))result=calculateConnectedProject(connected(p));else return null;return {...result,results:result.results.map(r=>({...r,faultType:p.settings.faultType}))};}
export function validateExtendedProject(p){if(isDcStudy(p))return validateDcProject(p);if(isSplitPhaseFault(p))return splitPhaseIssues(prepareSplitPhaseProject(p));if(usesConnectedSequences(p))return validateConnectedSequences(connected(p));return null;}
export {isDcStudy,isSplitPhaseFault};
