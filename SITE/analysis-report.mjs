import {isDcStudy,isSplitPhaseFault,usesConnectedSequences,analysisScope,analysisQuantity,prepareSplitPhaseProject} from './analysis-models.mjs';
const kA=v=>Number.isFinite(v)?v/1000:null;
export function analysisProjectRows(p){const rows=[['Study model','Model',p.name,'Selected model scope',analysisScope(p),'']];
 if(usesConnectedSequences(p))rows.push(['Study model','Model',p.name,'Sequence-network method','connected',''],['Study model','Model',p.name,'Connected-network missing Z2 = Z1 explicitly selected',p.settings.connectedAssumeZ2===true,'']);
 if(isSplitPhaseFault(p)){const cfg=prepareSplitPhaseProject(p).splitPhaseNetwork;const visit=(value,path)=>{if(value&&typeof value==='object'){for(const [key,v] of Object.entries(value))visit(v,path?path+'.'+key:key);}else rows.push(['Split-phase configuration','Documented input',p.name,path,value??'Not supplied',/(?:\.r|\.x)$/.test(path)?'ohm':'']);};if(cfg)visit(cfg,'');}
 return rows;
}
export function analysisReportSheets(p,results){const sheets=[];
 if(usesConnectedSequences(p)){
  sheets.push({name:'Phase currents',headers:['Fault location','Voltage (V)','Phase A RMS (kA)','Phase B RMS (kA)','Phase C RMS (kA)','Maximum phase RMS (kA)','Ground RMS (kA)','Status'],rows:results.map(r=>[r.busName,r.voltage,kA(r.phaseRMSA?.a),kA(r.phaseRMSA?.b),kA(r.phaseRMSA?.c),kA(r.totalA),kA(r.groundA),r.status])});
  sheets.push({name:'Branch phases',headers:['Fault location','Connection','Terminal','Bus','A RMS (kA)','B RMS (kA)','C RMS (kA)','Maximum phase RMS (kA)'],rows:results.flatMap(r=>(r.branchFlows||[]).flatMap(e=>['from','to'].map(side=>[r.busName,e.name,side,e[side],...['a','b','c'].map(phase=>kA(e[side+'PhaseRMSA']?.[phase])),kA(e[side+'A'])])))});
 }
 if(results.some(r=>r.sourceTerminalCurrents?.length))sheets.push({name:'Source terminals',headers:['Fault location','Source','Current (kA)','Signed DC current (A)','A RMS (kA)','B RMS (kA)','C RMS (kA)','Basis'],rows:results.flatMap(r=>(r.sourceTerminalCurrents||[]).map(s=>[r.busName,s.name||p.sources.find(x=>x.id===s.sourceId)?.name||s.sourceId,kA(s.amps),s.signedA??null,kA(s.phaseRMSA?.a),kA(s.phaseRMSA?.b),kA(s.phaseRMSA?.c),isDcStudy(p)?'Actual DC terminal current including source circulation':'Actual source terminal current including passive sequence returns; independent fault contributions are separate']))});
 if(isSplitPhaseFault(p)){
  sheets.push({name:'Conductor currents',headers:['Fault location','Connection','Conductor','From RMS (kA)','To RMS (kA)','From real (A)','From imaginary (A)'],rows:results.flatMap(r=>(r.conductorFlows||[]).flatMap(e=>Object.entries(e.conductors).map(([leg,f])=>[r.busName,e.name,leg,kA(f.fromA),kA(f.toA),f.fromPhasor?.r??null,f.fromPhasor?.i??null])))});
  sheets.push({name:'Bond currents',headers:['Fault location','Bond','Bus','RMS (kA)','Real current (A)','Imaginary current (A)'],rows:results.flatMap(r=>(r.bondFlows||[]).map(b=>[r.busName,b.id,b.bus,kA(b.amps),b.fromPhasor?.r??null,b.fromPhasor?.i??null]))});
 }
 return sheets;
}
