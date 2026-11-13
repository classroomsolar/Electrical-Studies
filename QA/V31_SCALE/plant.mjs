import {emptyProject} from '../../SITE/network-model.mjs';
// Utility-scale PV plant: POI, main breaker, MV collector, F feeders x (I/F) pad-mount transformer blocks,
// each block: MV tap bus, MV fuse, transformer, LV bus, inverter breaker, inverter terminal bus (PV source), aux chain.
export function plant({inverters=70,feeders=7,aux=24,unknownAngle=true,motors=0}={}){
 const p=emptyProject();p.name='PV plant '+inverters;let nb=0,nl=0;
 const bus=(name,v,x=0,y=0)=>{const b={id:'b'+(nb++),name,voltage:v,units:{voltage:'V'},position:{x,y},sequence:{r0:null,x0:null,r2:null,x2:null}};p.buses.push(b);return b};
 const cable=(a,b,len,r,x,name)=>{const c={id:'c'+(nl++),kind:'cable',name:name||'Cable '+nl,from:a.id,to:b.id,length:len,runs:1,rPerM:r,xPerM:x,material:'Copper',size:'x',cableType:'',enabled:true,ratedVoltage:null,frequency:60,frequencyOverride:false,allowIdeal:false,units:{length:'m',rPerM:'Ω/km',xPerM:'Ω/km'}};p.branches.push(c);return c};
 const device=(a,name,type,v,interruptA,sccrA)=>{const to=bus(name+' load side',v);const d={id:'d'+(nl++),kind:'switchgear',equipmentType:type,name,bus:to.id,ratedVoltage:v*1.1,interruptA,peakA:null,sccrA,enabled:true,units:{}};const link={id:'l'+(nl++),kind:'link',name:name+' internal connection',from:a.id,to:to.id,enabled:true,deviceId:d.id};p.branches.push(link);d.linkId=link.id;p.devices.push(d);return to};
 const poi=bus('POI',34500);p.sources.push({id:'u',kind:'utility',name:'Utility',bus:poi.id,voltage:34500,faultA:20000,method:'ka',model:'voltage',xr:15,angle:0,enabled:true,units:{}});
 const main=device(poi,'Main breaker','breaker',34500,40000,40000);const mv=bus('MV collector',34500);cable(main,mv,50,1e-4,1e-4,'Main cable');
 const per=Math.ceil(inverters/feeders);let k=0;
 for(let f=0;f<feeders;f++){let prev=device(mv,'Feeder '+(f+1)+' breaker','breaker',34500,25000,25000);
  for(let j=0;j<per&&k<inverters;j++,k++){const tap=bus('F'+(f+1)+' tap '+(j+1),34500);cable(prev,tap,300,1.6e-4,1.2e-4);prev=tap;
   const fu=device(tap,'TX'+k+' MV fuse','fuse',34500,50000,50000);const lv=bus('INV'+k+' LV',690);
   p.branches.push({id:'t'+k,kind:'transformer',name:'TX'+k,from:fu.id,to:lv.id,v1:34500,v2:690,power:3e6,zPercent:6,xr:8,shift:0,primaryConnection:'Delta',secondaryConnection:'Wye Grounded',enabled:true,allowIdeal:false,allowOneToOne:false,units:{}});
   const ib=device(lv,'INV'+k+' AC breaker','breaker',690,65000,65000);
   p.sources.push({id:'pv'+k,kind:'pv',name:'INV'+k,bus:ib.id,voltage:690,power:2.5e6,multiplier:1.1,faultA:2500,angle:unknownAngle?null:-60,duration:null,model:'current',method:'ka',enabled:true,units:{}});
   let a=lv;for(let q=0;q<aux;q++){const b=bus('INV'+k+' aux '+q,690);cable(a,b,15,3e-4,1e-4);a=b}
  }}
 for(let m=0;m<motors;m++){const b=bus('Motor '+m,690);cable(p.buses.find(x=>x.name==='INV'+m+' LV'),b,20,3e-4,1e-4);p.sources.push({id:'m'+m,kind:'motor',name:'Motor '+m,bus:b.id,voltage:690,faultA:600,method:'ka',model:'voltage',xr:6,angle:0,enabled:true,units:{}})}
 p.selectedBus=poi.id;return p;
}
