export function oneLineProtection(project,result){
 const devs=(project.devices||[]).filter(d=>d.kind==='switchgear'&&['breaker','fuse','recloser'].includes(d.equipmentType)&&d.enabled!==false&&d.linkId);
 const live=(project.branches||[]).filter(e=>e.enabled!==false&&(!e.deviceId||(project.devices||[]).find(d=>d.id===e.deviceId)?.enabled!==false));
 const srcBuses=new Set((project.sources||[]).filter(x=>x.enabled!==false).map(x=>x.bus));
 const reach=(start,skip)=>{const adj=new Map();for(const e of live){if(e.id===skip)continue;(adj.get(e.from)||adj.set(e.from,[]).get(e.from)).push(e.to);(adj.get(e.to)||adj.set(e.to,[]).get(e.to)).push(e.from)}
  const dist=new Map([[start,0]]),q=[start];for(let i=0;i<q.length;i++)for(const n of adj.get(q[i])||[])if(!dist.has(n)){dist.set(n,dist.get(q[i])+1);q.push(n)}return dist};
 const bus=result?.busId;if(!bus)return null;
 const d0=reach(bus,null),s0=[...srcBuses].filter(b=>d0.has(b));if(!s0.length)return {status:'NO SOURCE',candidates:[]};
 const flows=new Map((result.branchFlows||[]).map(f=>[f.id,Math.max(Math.abs(f.fromA||0),Math.abs(f.toA||0))]));
 const cands=[];for(const d of devs){const link=live.find(e=>e.id===d.linkId);if(!link)continue;const d1=reach(bus,link.id),s1=s0.filter(b=>d1.has(b));if(s1.length===s0.length)continue;
  const hops=Math.min(d0.get(link.from)??1e9,d0.get(link.to)??1e9),share=result.totalA>0&&flows.has(link.id)?Math.min(100,100*flows.get(link.id)/result.totalA):null;
  cands.push({deviceId:d.id,name:d.name,equipmentType:d.equipmentType,hops,isolatesAll:s1.length===0,sharePercent:share})}
 cands.sort((a,b)=>(b.isolatesAll-a.isolatesAll)||(a.hops-b.hops)||((b.sharePercent??0)-(a.sharePercent??0)));
 return {status:cands.length?'FOUND':'NO PROTECTIVE DEVICE ON THE ONE-LINE',primary:cands[0]||null,candidates:cands};
}
