// Selecting a different product cannot attest the prior product's sequence or loop data.
export function invalidateAnalysisData(item){
 let changed=false;
 for(const key of Object.keys(item))if(/^dc(?:Resistance|LoopResistance)/.test(key)||/^split(?:Half|Upstream|L1|L2|N|G|Uncoupled|Document)/.test(key)){item[key]=typeof item[key]==='boolean'?false:typeof item[key]==='string'?'':null;changed=true;}
 if(item.sequence&&typeof item.sequence==='object'){item.sequence=Object.fromEntries(Object.keys(item.sequence).map(key=>[key,['zeroPath','zeroMode'].includes(key)?'':null]));changed=true;}
 if(item.splitPhase){delete item.splitPhase;changed=true;}
 if(changed)item.dataReference='';
 return changed;
}
