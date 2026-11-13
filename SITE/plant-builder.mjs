// V31 plant builder: generates a complete PV / BESS plant one-line from block data entered by the user.
// It only arranges the user's own numbers into buses, connections, sources and devices. Nothing electrical is
// assumed: every impedance, rating and fault value must be supplied, and protective-device ratings left blank
// stay blank (the duty check then reports INPUT REQUIRED).
import {deleteItem} from './network-model.mjs?v=20261022-pv-final';
const fin=v=>typeof v==='number'&&Number.isFinite(v);
const pos=v=>fin(v)&&v>0;
let seq=0;const uid=p=>p+'-'+Date.now().toString(36)+'-'+(++seq).toString(36)+Math.random().toString(36).slice(2,6);
export const BUILDER_FIELDS=[
 // [key, label, unit, required]
 ['poiVoltageKV','POI / MV collector voltage','kV',true],
 ['utilityFaultKA','Utility available fault current at the POI','kA',true],
 ['utilityXR','Utility X/R at the POI','',true],
 ['feeders','Collector feeders','count',true],
 ['blocksPerFeeder','Inverter blocks per feeder','count',true],
 ['mvCableLengthM','MV cable length between blocks','m',true],
 ['mvCableROhmKm','MV cable resistance','Ω/km',true],
 ['mvCableXOhmKm','MV cable reactance','Ω/km',true],
 ['mvCableRuns','MV cable parallel runs','count',true],
 ['txKVA','Block transformer rating','kVA',true],
 ['txZPercent','Block transformer impedance','%',true],
 ['txXR','Block transformer X/R','',true],
 ['lvVoltageV','Inverter AC voltage','V',true],
 ['invPerBlock','Inverters per block','count',true],
 ['invKVA','Inverter rating','kVA',true],
 ['invFaultA','Inverter fault current (manufacturer RMS)','A',true],
 ['invAngleDeg','Inverter fault current angle (blank = unknown)','°',false],
 ['lvCableLengthM','LV cable length transformer → inverter (0 = none)','m',true],
 ['lvCableROhmKm','LV cable resistance','Ω/km',false],
 ['lvCableXOhmKm','LV cable reactance','Ω/km',false],
 ['lvCableRuns','LV cable parallel runs','count',false]
];
export const BUILDER_OPTIONS=[
 ['mainBreaker','Main breaker at the POI'],['feederBreakers','Breaker at the head of each feeder'],['blockFuses','MV fuse at each block transformer'],['inverterBreakers','AC breaker at each inverter'],['bess','Sources are battery inverters (BESS) instead of PV']
];
export function validateSpec(spec,{attach=false}={}){
 const errors=[];const need=(k,label,test,msg)=>{if(!test(spec[k]))errors.push(label+': '+msg)};
 for(const [k,label,unit,req] of BUILDER_FIELDS){
  if(attach&&(k==='utilityFaultKA'||k==='utilityXR'))continue;
  if(!req&&(spec[k]===null||spec[k]===undefined||spec[k]===''))continue;
  if(unit==='count')need(k,label,v=>Number.isInteger(v)&&v>=1&&v<=500,'enter a whole number from 1 to 500');
  else if(k==='invAngleDeg')need(k,label,v=>fin(v)&&v>=-180&&v<=180,'enter an angle from −180° to 180°, or leave blank');
  else if(k==='lvCableLengthM'||k==='mvCableLengthM')need(k,label,v=>fin(v)&&v>=0,'enter a length of zero or more');
  else need(k,label,pos,'enter a value greater than zero');
 }
 if(fin(spec.lvCableLengthM)&&spec.lvCableLengthM>0)for(const k of ['lvCableROhmKm','lvCableXOhmKm'])if(!(fin(spec[k])&&spec[k]>=0))errors.push(BUILDER_FIELDS.find(f=>f[0]===k)[1]+': required when the LV cable length is above zero');
 if(fin(spec.lvCableLengthM)&&spec.lvCableLengthM>0&&!(Number.isInteger(spec.lvCableRuns)&&spec.lvCableRuns>=1))errors.push('LV cable parallel runs: enter a whole number of 1 or more');
 if(fin(spec.mvCableROhmKm)&&fin(spec.mvCableXOhmKm)&&spec.mvCableROhmKm===0&&spec.mvCableXOhmKm===0)errors.push('MV cable: resistance and reactance cannot both be zero');
 const blocks=(spec.feeders|0)*(spec.blocksPerFeeder|0),buses=estimateCounts(spec).buses;
 if(blocks>2000)errors.push('More than 2,000 blocks; split the plant into separate projects');
 if(buses>20000)errors.push('More than 20,000 buses; split the plant into separate projects');
 return errors;
}
export function estimateCounts(spec){
 const F=spec.feeders|0,B=spec.blocksPerFeeder|0,I=spec.invPerBlock|0,blocks=F*B,lvCable=fin(spec.lvCableLengthM)&&spec.lvCableLengthM>0;
 const buses=1+(spec.mainBreaker?1:0)+1+F*(spec.feederBreakers?1:0)+blocks*(1+(spec.blockFuses?1:0)+1+I*((lvCable?1:0)+(spec.inverterBreakers?1:0)));
 const devices=(spec.mainBreaker?1:0)+F*(spec.feederBreakers?1:0)+blocks*((spec.blockFuses?1:0)+I*(spec.inverterBreakers?1:0));
 return {blocks,inverters:blocks*I,buses,devices,sources:1+blocks*I};
}
// Returns {buses,branches,sources,devices}; positions lay feeders out as columns and blocks as rows.
export function buildPlant(spec,{prefix='',attachTo=null}={}){
 // attachTo: {bus, x, y} - add feeders and blocks to an existing collector bus (no POI, utility or main breaker).
 const errors=validateSpec(spec,{attach:!!attachTo});if(errors.length)throw Error(errors.join('\n'));
 const out={buses:[],branches:[],sources:[],devices:[]},P=prefix?prefix+' ':'';
 const V=spec.poiVoltageKV*1e3,LV=spec.lvVoltageV,I=spec.invPerBlock,lvCable=spec.lvCableLengthM>0;
 const colW=Math.max(1400,I*460+900),blockH=1500+(lvCable?380:0);
 const bus=(name,v,x,y)=>{const b={id:uid('bus'),name:P+name,voltage:v,units:{voltage:v>=1000?'kV':'V'},position:{x:Math.round(x),y:Math.round(y)},sequence:{r0:null,x0:null,r2:null,x2:null}};out.buses.push(b);return b};
 const cable=(a,b,len,r,x,runs,name)=>{const c={id:uid('cable'),kind:'cable',name:P+name,from:a.id,to:b.id,length:len,runs,rPerM:r/1000,xPerM:x/1000,material:'',size:'',cableType:'',enabled:true,ratedVoltage:null,frequency:null,frequencyOverride:false,allowIdeal:len===0,units:{length:'m',rPerM:'Ω/km',xPerM:'Ω/km',ratedVoltage:'V'}};out.branches.push(c);return c};
 const device=(from,type,name,v,x,y)=>{const to=bus(name+' load side',v,x,y);const d={id:uid('switchgear'),kind:'switchgear',equipmentType:type,name:P+name,bus:to.id,ratedVoltage:null,interruptA:null,peakA:null,sccrA:null,enabled:true,units:{ratedVoltage:'V',interruptA:'kA',peakA:'kA',sccrA:'kA'}};const link={id:uid('connection'),kind:'link',name:P+name+' internal connection',from:from.id,to:to.id,enabled:true,deviceId:d.id};d.linkId=link.id;out.branches.push(link);out.devices.push(d);return to};
 const width=Math.max(colW*spec.feeders,1200);
 let mv;
 if(attachTo){mv=attachTo.bus;if(Math.abs((mv.voltage||0)-V)>1e-6*V)throw Error('The chosen collector bus is '+(mv.voltage/1000)+' kV; the block data is for '+spec.poiVoltageKV+' kV');}
 else{
 const poi=bus('POI',V,width/2-90,300);
 out.sources.push({id:uid('utility'),kind:'utility',name:P+'Utility',bus:poi.id,voltage:V,enabled:true,method:'ka',model:'voltage',faultA:spec.utilityFaultKA*1e3,faultMVA:null,power:null,xr:spec.utilityXR,angle:null,multiplier:null,duration:null,peakA:null,xdpp:null,xdp:null,xd:null,maxInclude:true,minInclude:true,maxStrength:1,minStrength:1,units:{voltage:'kV',faultA:'kA',power:'MVA',peakA:'kA'}});
 let top=poi;if(spec.mainBreaker)top=device(poi,'breaker','Main breaker',V,width/2-90,620);
 mv=bus('MV collector',V,60,spec.mainBreaker?940:640);mv.diagramWidth=Math.min(10000,Math.max(400,width-120));
 if(top!==poi)out.branches.push({id:uid('connection'),kind:'link',name:P+'Main bus connection',from:top.id,to:mv.id,enabled:true});else out.branches.push({id:uid('connection'),kind:'link',name:P+'POI to collector',from:poi.id,to:mv.id,enabled:true});
 }
 const baseX=attachTo?attachTo.x:60,baseY=attachTo?attachTo.y:mv.position.y;
 const kind=spec.bess?'bess':'pv',srcName=spec.bess?'BESS':'INV';
 for(let f=0;f<spec.feeders;f++){
  const x0=baseX+f*colW;let y=baseY+380,prev=mv;
  if(spec.feederBreakers){prev=device(mv,'breaker','F'+(f+1)+' breaker',V,x0,y);y+=380}
  for(let k=0;k<spec.blocksPerFeeder;k++){
   const tag='F'+(f+1)+'-B'+String(k+1).padStart(2,'0');
   const tap=bus(tag+' MV tap',V,x0,y);cable(prev,tap,spec.mvCableLengthM,spec.mvCableROhmKm,spec.mvCableXOhmKm,spec.mvCableRuns,tag+' MV cable');prev=tap;
   let hv=tap,yy=y+380;if(spec.blockFuses){hv=device(tap,'fuse',tag+' MV fuse',V,x0+260,yy);yy+=380}
   const lv=bus(tag+' LV',LV,x0+260,yy);lv.diagramWidth=Math.max(180,I*460);
   out.branches.push({id:uid('tx'),kind:'transformer',name:P+tag+' transformer',from:hv.id,to:lv.id,v1:V,v2:LV,power:spec.txKVA*1e3,zPercent:spec.txZPercent,xr:spec.txXR,shift:null,tapPercent:null,primaryConnection:'Unknown',secondaryConnection:'Unknown',neutralR:null,neutralX:null,grounding:'Unknown',enabled:true,allowIdeal:false,allowOneToOne:false,units:{v1:'kV',v2:'V',power:'kVA'}});
   for(let n=0;n<I;n++){
    const xi=x0+260+n*460;let at=lv,yi=yy+380;const inv=tag+'-'+srcName+(n+1);
    if(lvCable){const b=bus(inv+' cable end',LV,xi,yi);cable(lv,b,spec.lvCableLengthM,spec.lvCableROhmKm,spec.lvCableXOhmKm,spec.lvCableRuns,inv+' LV cable');at=b;yi+=380}
    if(spec.inverterBreakers)at=device(at,'breaker',inv+' AC breaker',LV,xi,yi);
    out.sources.push({id:uid(kind),kind,name:P+inv,bus:at.id,voltage:LV,enabled:true,method:'ka',model:'current',faultA:spec.invFaultA,faultMVA:null,power:spec.invKVA*1e3,xr:null,angle:fin(spec.invAngleDeg)?spec.invAngleDeg:null,multiplier:null,duration:null,peakA:null,xdpp:null,xdp:null,xd:null,maxInclude:true,minInclude:true,maxStrength:1,minStrength:1,units:{voltage:'V',faultA:'A',power:'kVA',peakA:'kA'}});
   }
   y+=blockH;
  }
 }
 return out;
}
// ---------- DC array (separate DC study) ----------
// Inverter DC bus <- combiner cables <- combiner buses <- string cables (<- string fuses) <- string sources.
// A string is the DC engine's resistive-voltage source: the user's own open-circuit voltage and full-loop source resistance.
export const DC_FIELDS=[
 ['dcVoltageV','Inverter DC bus nominal voltage','V',true],
 ['dcInverters','Inverter DC inputs (each with its own combiners)','count',true],
 ['combinersPerInverter','Combiner boxes per inverter','count',true],
 ['stringsPerCombiner','Strings per combiner box','count',true],
 ['stringVocV','String source voltage (documented open-circuit or test value)','V',true],
 ['stringSourceOhm','String source resistance, full loop','Ω',true],
 ['stringCableLengthM','String cable length (one way)','m',true],
 ['stringCableROhmKm','String cable resistance per conductor','Ω/km',true],
 ['combinerCableLengthM','Combiner → inverter cable length (one way)','m',true],
 ['combinerCableROhmKm','Combiner cable resistance per conductor','Ω/km',true],
 ['combinerCableRuns','Combiner cable parallel runs','count',true]
];
export const DC_OPTIONS=[['stringFuses','Fuse in each string'],['combinerSwitches','Disconnect at each combiner output']];
export function validateDcSpec(spec){
 const errors=[];for(const [k,label,unit] of DC_FIELDS){const v=spec[k];
  if(unit==='count'){if(!(Number.isInteger(v)&&v>=1&&v<=500))errors.push(label+': enter a whole number from 1 to 500')}
  else if(k.endsWith('LengthM')){if(!(fin(v)&&v>=0))errors.push(label+': enter a length of zero or more')}
  else if(!pos(v))errors.push(label+': enter a value greater than zero')}
 const c=estimateDcCounts(spec);if(c.buses>20000)errors.push('More than 20,000 buses; split the array into separate projects');
 return errors;
}
export function estimateDcCounts(spec){const I=spec.dcInverters|0,C=spec.combinersPerInverter|0,S=spec.stringsPerCombiner|0,strings=I*C*S;
 return {strings,combiners:I*C,buses:I+I*C*(1+(spec.combinerSwitches?1:0))+strings*(1+(spec.stringFuses?1:0)),devices:strings*(spec.stringFuses?1:0)+I*C*(spec.combinerSwitches?1:0)};}
export function buildDcArray(spec){
 const errors=validateDcSpec(spec);if(errors.length)throw Error(errors.join('\n'));
 const out={buses:[],branches:[],sources:[],devices:[]},V=spec.dcVoltageV;let row=0;
 const bus=(name,x,y)=>{const b={id:uid('bus'),name,voltage:V,units:{voltage:'V'},position:{x:Math.round(x),y:Math.round(y)},sequence:{r0:null,x0:null,r2:null,x2:null}};out.buses.push(b);return b};
 const cable=(a,b,len,rKm,runs,name)=>{out.branches.push({id:uid('cable'),kind:'cable',name,from:a.id,to:b.id,length:len,runs,rPerM:rKm/1000,xPerM:0,dcResistanceBasis:'matched-pair',dataReference:'Plant builder: user-entered DC cable data (one-way length, resistance per conductor).',material:'',size:'',cableType:'',enabled:true,ratedVoltage:null,frequency:null,frequencyOverride:false,allowIdeal:len===0,units:{length:'m',rPerM:'Ω/km',xPerM:'Ω/km',ratedVoltage:'V'}})};
 const device=(from,type,name,x,y)=>{const to=bus(name+' load side',x,y);const d={id:uid('switchgear'),kind:'switchgear',equipmentType:type==='fuse'?'fuse':undefined,name,bus:to.id,ratedVoltage:null,interruptA:null,peakA:null,sccrA:null,enabled:true,units:{ratedVoltage:'V',interruptA:'kA',peakA:'kA',sccrA:'kA'}};if(!d.equipmentType){d.kind='disconnect';delete d.equipmentType}const l={id:uid('connection'),kind:'link',name:name+' internal connection',from:from.id,to:to.id,enabled:true,deviceId:d.id};d.linkId=l.id;out.branches.push(l);out.devices.push(d);return to};
 for(let i=0;i<spec.dcInverters;i++){const tagI='INV'+(i+1);const inv=bus(tagI+' DC input',200+i*600,200);
  for(let c=0;c<spec.combinersPerInverter;c++){const tagC=tagI+'-CB'+(c+1);let cb=bus(tagC,200,600+row*300);row++;let out_=cb;
   if(spec.combinerSwitches)out_=device(cb,'disconnect',tagC+' output disconnect',200,600+row*300);
   cable(out_,inv,spec.combinerCableLengthM,spec.combinerCableROhmKm,spec.combinerCableRuns,tagC+' cable');
   for(let k=0;k<spec.stringsPerCombiner;k++){const tagS=tagC+'-S'+(k+1);const sb=bus(tagS,200,600+row*300);row++;let at=sb;
    out.sources.push({id:uid('string'),kind:'other',model:'voltage',dcModel:'resistive-voltage',dcResistanceBasis:'full-loop',dataReference:'Plant builder: user-entered string source voltage and full-loop resistance.',name:tagS+' string',bus:sb.id,voltage:spec.stringVocV,dcResistanceOhm:spec.stringSourceOhm,enabled:true,units:{voltage:'V'}});
    if(spec.stringFuses)at=device(sb,'fuse',tagS+' fuse',200,600+row*300);
    cable(at,cb,spec.stringCableLengthM,spec.stringCableROhmKm,1,tagS+' cable');}}}
 return out;
}
// ---------- Equipment table (CSV) ----------
// Columns use engineering units; values are converted to the Studio's SI storage on import.
export const TABLE_COLUMNS=[
 ['action','',null],['id','',null],['type','',null],['name','',null],['from_bus','',null],['to_bus','',null],['bus','',null],['enabled','',null],
 ['voltage_V','V',['voltage',1]],['length_m','m',['length',1]],['runs','',['runs',1]],['r_ohm_per_km','Ω/km',['rPerM',1e-3]],['x_ohm_per_km','Ω/km',['xPerM',1e-3]],
 ['kva','kVA',['power',1e3]],['z_percent','%',['zPercent',1]],['xr','',['xr',1]],['v1_V','V',['v1',1]],['v2_V','V',['v2',1]],['tap_percent','%',['tapPercent',1]],
 ['fault_A','A',['faultA',1]],['angle_deg','°',['angle',1]],['interrupt_A','A',['interruptA',1]],['sccr_A','A',['sccrA',1]],['peak_A','A',['peakA',1]],['rated_V','V',['ratedVoltage',1]]
];
// CSV cell: quoted when needed; text that a spreadsheet would run as a formula is prefixed with an apostrophe.
const cell=v=>{if(v===null||v===undefined)return '';let s=String(v);if(typeof v!=='number'&&/^[ \t]*[=+@-]/.test(s))s="'"+s;return /[",\r\n']/.test(s)?'"'+s.replaceAll('"','""')+'"':s};
export function equipmentRows(p){
 const busName=new Map(p.buses.map(b=>[b.id,b.name])),rows=[];
 const row=(x,type,extra)=>{const r={id:x.id,type,name:x.name,from_bus:'',to_bus:'',bus:'',enabled:x.enabled===false?'no':'yes',...extra};for(const [col,,map] of TABLE_COLUMNS){if(!map||r[col]!==undefined)continue;const [key,f]=map;if(Object.hasOwn(x,key)){const v=x[key];r[col]=fin(v)?+(v/f).toPrecision(12):''}else r[col]=''}rows.push(r)};
 for(const b of p.buses)row(b,'bus',{enabled:''});
 for(const e of p.branches)row(e,e.kind,{from_bus:busName.get(e.from)||'',to_bus:busName.get(e.to)||''});
 for(const s of p.sources)row(s,'source:'+s.kind,{bus:busName.get(s.bus)||''});
 for(const d of p.devices)row(d,'device:'+(d.equipmentType||d.kind),{bus:busName.get(d.bus)||''});
 return rows;
}
export function equipmentCsv(p){const rows=equipmentRows(p),head=TABLE_COLUMNS.map(c=>c[0]+(c[1]?' ['+c[1]+']':''));return [head.join(','),...rows.map(r=>TABLE_COLUMNS.map(c=>cell(r[c[0]])).join(','))].join('\r\n')}
export function parseCsv(text){
 const rows=[];let row=[],f='',q=false;text=String(text).replace(/^﻿/,'');
 for(let i=0;i<text.length;i++){const ch=text[i];if(q){if(ch==='"'){if(text[i+1]==='"'){f+='"';i++}else q=false}else f+=ch}else if(ch==='"')q=true;else if(ch===','){row.push(f);f=''}else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(f);rows.push(row);row=[];f=''}else f+=ch}
 if(f!==''||row.length){row.push(f);rows.push(row)}return rows.filter(r=>r.some(c=>c.trim()!==''));
}
// Applies the table. action blank: edit the item matched by id (blank cells keep the stored value; type, id and connections
// are not changed). action "add": create a new item of the row's type from its cells (connections by bus name). action
// "delete": delete the item with that id (connected items are kept and shown as disconnected, as in the editor).
// Returns {changes, matched, added, deleted, errors}. Values are never invented: blank required data stays blank.
export function applyEquipmentCsv(p,text){
 const rows=parseCsv(text);if(!rows.length)throw Error('The file is empty');
 const head=rows[0].map(h=>h.trim().replace(/\s*\[.*\]$/,'')),idCol=head.indexOf('id');if(idCol<0)throw Error('The first row must contain the column names, including id');
 const items=new Map([...p.buses,...p.branches,...p.sources,...p.devices].map(x=>[x.id,x])),errors=[];let changes=0,matched=0,added=0,deleted=0;
 const actCol=head.indexOf('action'),cellOf=(vals,col)=>{const c=head.indexOf(col);return c<0?'':(vals[c]??'').trim().replace(/^'(?=[=+@-])/,'')};
 const adds=[],dels=[];
 for(let r=1;r<rows.length;r++){const a=actCol<0?'':(rows[r][actCol]||'').trim().toLowerCase();if(a==='add')adds.push(r);else if(a==='delete')dels.push(r);else if(a)errors.push('Row '+(r+1)+': action must be blank, add or delete')}
 // Adds first (buses before connections, so a new cable can reach a new bus), then edits, then deletes.
 const order=r=>{const t=cellOf(rows[r],'type').toLowerCase();return t==='bus'?0:t.startsWith('device:')?2:1};
 for(const r of adds.sort((a,b)=>order(a)-order(b)||a-b)){try{const x=addTableItem(p,head,rows[r],cellOf);items.set(x.id,x);added++}catch(e){errors.push('Row '+(r+1)+': '+e.message)}}
 for(let r=1;r<rows.length;r++){const vals=rows[r],id=(vals[idCol]||'').trim();if(!id||adds.includes(r)||dels.includes(r))continue;const x=items.get(id);if(!x){errors.push('Row '+(r+1)+': no equipment with id '+id);continue}matched++;
  head.forEach((col,c)=>{const raw=(vals[c]??'').trim().replace(/^'(?=[=+@-])/,'');if(raw===''||col==='id'||col==='type'||col==='from_bus'||col==='to_bus'||col==='bus')return;
   if(col==='name'){if(raw!==x.name){x.name=raw.slice(0,200);changes++}return}
   if(col==='enabled'){const on=/^(yes|true|1|on)$/i.test(raw),off=/^(no|false|0|off)$/i.test(raw);if(!on&&!off){errors.push('Row '+(r+1)+': enabled must be yes or no');return}if(p.buses.includes(x))return;if(x.enabled!==on){x.enabled=on;changes++}return}
   const spec=TABLE_COLUMNS.find(t=>t[0]===col);if(!spec||!spec[2])return;const [key,f]=spec[2];
   if(!Object.hasOwn(x,key)){errors.push('Row '+(r+1)+': '+col+' does not apply to '+(x.kind||'bus')+' '+x.name);return}
   const n=Number(raw.replace(/,/g,''));if(!Number.isFinite(n)){errors.push('Row '+(r+1)+': '+col+' must be a number');return}
   const v=key==='runs'?Math.round(n):+(n*f).toPrecision(15),cur=x[key];if(fin(cur)&&Math.abs(v-cur)<=1e-11*Math.max(Math.abs(cur),1e-300))return;if(cur!==v){x[key]=v;changes++}});
 }
 for(const r of dels){const id=(rows[r][idCol]||'').trim();if(!id){errors.push('Row '+(r+1)+': delete needs the id');continue}if(!items.has(id)){errors.push('Row '+(r+1)+': no equipment with id '+id);continue}deleteItem(p,id);items.delete(id);deleted++}
 return {changes,matched,added,deleted,errors};
}
const SOURCE_KINDS=['utility','pv','bess','generator','motor','other'],DEVICE_TYPES=['breaker','fuse','recloser','switchgear','disconnect','panel'];
function addTableItem(p,head,vals,cellOf){
 const type=cellOf(vals,'type').toLowerCase(),name=cellOf(vals,'name').slice(0,200);if(!name)throw Error('a name is required to add equipment');
 const num=(col,f=1)=>{const raw=cellOf(vals,col);if(raw==='')return null;const n=Number(raw.replace(/,/g,''));if(!Number.isFinite(n))throw Error(col+' must be a number');return +(n*f).toPrecision(15)};
 const byName=col=>{const v=cellOf(vals,col);if(!v)throw Error(col+' is required (bus name)');const hits=p.buses.filter(b=>b.name===v);if(!hits.length)throw Error('no bus named '+v);if(hits.length>1)throw Error('more than one bus is named '+v+'; rename one first');return hits[0]};
 const xy=b=>({x:(b?.position?.x||0)+40,y:(b?.position?.y||0)+300});
 if(type==='bus'){const v=num('voltage_V');if(!pos(v))throw Error('voltage_V must be a positive number for a new bus');if(p.buses.some(b=>b.name===name))throw Error('a bus named '+name+' already exists');const last=p.buses[p.buses.length-1];const b={id:uid('bus'),name,voltage:v,units:{voltage:v>=1000?'kV':'V'},position:{x:(last?.position?.x||0)+320,y:last?.position?.y||100},sequence:{r0:null,x0:null,r2:null,x2:null}};p.buses.push(b);return b}
 if(type==='cable'||type==='transformer'||type==='link'){const a=byName('from_bus'),b=byName('to_bus');if(a===b)throw Error('from_bus and to_bus must differ');
  if(type==='link'){const e={id:uid('connection'),kind:'link',name,from:a.id,to:b.id,enabled:true};p.branches.push(e);return e}
  if(type==='cable'){const len=num('length_m'),runs=num('runs');const e={id:uid('cable'),kind:'cable',name,from:a.id,to:b.id,length:len,runs:runs===null?null:Math.round(runs),rPerM:num('r_ohm_per_km',1e-3),xPerM:num('x_ohm_per_km',1e-3),material:'',size:'',cableType:'',enabled:true,ratedVoltage:null,frequency:null,frequencyOverride:false,allowIdeal:len===0,units:{length:'m',rPerM:'Ω/km',xPerM:'Ω/km',ratedVoltage:'V'}};p.branches.push(e);return e}
  const e={id:uid('tx'),kind:'transformer',name,from:a.id,to:b.id,v1:num('v1_V')??a.voltage??null,v2:num('v2_V')??b.voltage??null,power:num('kva',1e3),zPercent:num('z_percent'),xr:num('xr'),shift:null,tapPercent:num('tap_percent'),primaryConnection:'Unknown',secondaryConnection:'Unknown',neutralR:null,neutralX:null,grounding:'Unknown',enabled:true,allowIdeal:false,allowOneToOne:false,units:{v1:'kV',v2:'V',power:'kVA'}};p.branches.push(e);return e}
 if(type.startsWith('source:')){const kind=type.slice(7);if(!SOURCE_KINDS.includes(kind))throw Error('source type must be one of '+SOURCE_KINDS.map(k=>'source:'+k).join(', '));const b=byName('bus');
  const s={id:uid(kind),kind,name,bus:b.id,voltage:num('voltage_V')??b.voltage??null,enabled:true,method:'ka',model:['pv','bess'].includes(kind)?'current':'voltage',faultA:num('fault_A'),faultMVA:null,power:num('kva',1e3),xr:num('xr'),angle:num('angle_deg'),multiplier:null,duration:null,peakA:null,xdpp:null,xdp:null,xd:null,maxInclude:true,minInclude:true,maxStrength:1,minStrength:1,units:{voltage:'V',faultA:'A',power:'kVA',peakA:'kA'}};p.sources.push(s);return s}
 if(type.startsWith('device:')){const dt=type.slice(7);if(!DEVICE_TYPES.includes(dt))throw Error('device type must be one of '+DEVICE_TYPES.map(k=>'device:'+k).join(', '));const a=byName('from_bus');
  let to=cellOf(vals,'to_bus')?byName('to_bus'):null;if(!to){to={id:uid('bus'),name:name+' load side',voltage:a.voltage,units:{voltage:a.voltage>=1000?'kV':'V'},position:xy(a),sequence:{r0:null,x0:null,r2:null,x2:null}};p.buses.push(to)}
  const d={id:uid('switchgear'),kind:'switchgear',equipmentType:['breaker','fuse','recloser'].includes(dt)?dt:undefined,name,bus:to.id,ratedVoltage:num('rated_V'),interruptA:num('interrupt_A'),peakA:num('peak_A'),sccrA:num('sccr_A'),enabled:true,units:{ratedVoltage:'V',interruptA:'kA',peakA:'kA',sccrA:'kA'}};if(!d.equipmentType)delete d.equipmentType;
  if(['switchgear','disconnect','panel'].includes(dt)){d.kind=dt==='switchgear'?'switchgear':dt}
  const link={id:uid('connection'),kind:'link',name:name+' internal connection',from:a.id,to:to.id,enabled:true,deviceId:d.id};d.linkId=link.id;p.branches.push(link);p.devices.push(d);return d}
 throw Error('type must be bus, cable, transformer, link, source:<kind> or device:<type>');
}
