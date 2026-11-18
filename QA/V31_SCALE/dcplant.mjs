import {emptyProject} from '../../SITE/network-model.mjs';
// DC side of a PV plant: per inverter, C combiners x S strings; string source + fuse link -> combiner bus -> cable -> inverter DC bus
export function dcPlant({inverters=70,combiners=+process.env.CB||2,strings=+process.env.ST||3,stringV=1300,stringR=40,link=true}={}){
 const p=emptyProject();p.name='DC plant';p.settings.faultType='dc';p.settings.faultX=0;p.settings.faultR=0;let n=0;
 const bus=(name)=>{const b={id:'b'+(n++),name,voltage:1500,units:{voltage:'V'},position:{x:0,y:0},sequence:{}};p.buses.push(b);return b};
 for(let i=0;i<inverters;i++){const inv=bus('INV'+i+' DC');
  for(let c=0;c<combiners;c++){const cb=bus('INV'+i+' CB'+c);p.branches.push({id:'cc'+i+'_'+c,kind:'cable',name:'INV'+i+' CB'+c+' cable',from:cb.id,to:inv.id,length:120,runs:1,rPerM:1.3e-4,dcResistanceBasis:'matched-pair',dataReference:'test',enabled:true,units:{}});
   for(let s=0;s<strings;s++){const sb=bus('INV'+i+' CB'+c+' S'+s);p.sources.push({id:'s'+i+'_'+c+'_'+s,kind:'other',model:'voltage',dcModel:'resistive-voltage',dcResistanceBasis:'full-loop',dataReference:'test',name:'String '+i+'.'+c+'.'+s,bus:sb.id,voltage:1500,dcResistanceOhm:stringR,enabled:true,units:{}});
    if(link){const fb=bus('INV'+i+' CB'+c+' F'+s);const d={id:'f'+i+'_'+c+'_'+s,kind:'switchgear',equipmentType:'fuse',name:'Fuse '+i+'.'+c+'.'+s,bus:fb.id,enabled:true,units:{}};const l={id:'l'+i+'_'+c+'_'+s,kind:'link',name:d.name+' internal connection',from:sb.id,to:fb.id,enabled:true,deviceId:d.id};d.linkId=l.id;p.devices.push(d);p.branches.push(l);
     p.branches.push({id:'sc'+i+'_'+c+'_'+s,kind:'cable',name:'String cable '+i+'.'+c+'.'+s,from:fb.id,to:cb.id,length:80,runs:1,rPerM:4.6e-3,dcResistanceBasis:'matched-pair',dataReference:'test',enabled:true,units:{}})}
    else p.branches.push({id:'sc'+i+'_'+c+'_'+s,kind:'cable',name:'String cable',from:sb.id,to:cb.id,length:80,runs:1,rPerM:4.6e-3,dcResistanceBasis:'matched-pair',dataReference:'test',enabled:true,units:{}})}}}
 return p;
}
