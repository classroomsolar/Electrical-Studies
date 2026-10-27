import {emptyProject} from './network-model.mjs?v=20261022-pv-final';
const document='Illustrative independent QA values only; not manufacturer or installation data.';
const bus=(id,name,voltage,y)=>({id,name,voltage,position:{x:100,y},units:{voltage:'V'}});
export function analysisExample(type){
 const p=emptyProject();p.name='Illustrative '+(type==='dc'?'DC':type.startsWith('split-')?'split-phase':'connected-sequence')+' worked example';p.notes=[document];p.settings.faultType=type;
 if(type==='dc'){
  p.buses=[bus('supply','12 V DC source bus',12,100),bus('load','DC receiving bus',12,400)];p.selectedBus='load';
  p.sources=[{id:'dc-source',kind:'other',name:'Illustrative DC voltage source',bus:'supply',voltage:12,model:'voltage',dcModel:'resistive-voltage',dcResistanceOhm:.2,dcResistanceBasis:'full-loop',dataReference:document}];
  p.branches=[{id:'dc-cable',kind:'cable',name:'Illustrative 0.1 Ω complete loop',from:'supply',to:'load',dcLoopResistanceOhm:.1,dataReference:document}];return p;
 }
 if(type.startsWith('split-')){
  p.buses=[bus('primary','480 V primary supply',480,100),bus('secondary','240 V center-tapped winding',240,390),bus('panel','120 V leg fault / 240 V panel',240,690)];p.selectedBus='panel';p.settings.splitTransformerId='split-tx';
  p.sources=[{id:'split-source',kind:'utility',name:'Illustrative documented primary loop',bus:'primary',voltage:480,model:'voltage',splitUpstreamR:.4,splitUpstreamX:0,dataReference:document}];
  p.branches=[{id:'split-tx',kind:'transformer',name:'Illustrative center-tapped transformer',from:'primary',to:'secondary',v1:480,v2:240,phaseRating:'single',splitUncoupled:true,splitDocument:document,splitHalfL1R:.05,splitHalfL1X:0,splitHalfL2R:.05,splitHalfL2X:0,dataReference:document},{id:'split-cable',kind:'cable',name:'Illustrative separate conductors',from:'secondary',to:'panel',splitL1R:.1,splitL1X:0,splitL2R:.1,splitL2X:0,splitNR:.2,splitNX:0,splitGR:.3,splitGX:0,dataReference:document}];
  Object.assign(p.buses[1],{splitBondEnabled:true,splitBondR:.01,splitBondX:0,dataReference:'Illustrative 0.01 ohm N-G bond; not installation data.'});return p;
 }
 p.settings.sequenceModel='connected';p.settings.connectedAssumeZ2=false;
 p.buses=[bus('source-bus','400 V utility terminals',400,100),bus('receiving-bus','400 V cable receiving end',400,400)];p.selectedBus='receiving-bus';
 p.sources=[{id:'sequence-source',kind:'utility',name:'Illustrative explicit sequence source',bus:'source-bus',voltage:400,model:'voltage',method:'impedance',r:.01,x:.05,angle:0,sequence:{r2:.02,x2:.06,r0:.03,x0:.07,zeroPath:'grounded',neutralR:0,neutralX:0},dataReference:document}];
 p.branches=[{id:'sequence-cable',kind:'cable',name:'Illustrative sequence feeder',from:'source-bus',to:'receiving-bus',length:10,runs:1,rPerM:.001,xPerM:.0002,r0PerM:.003,x0PerM:.0006,sequence:{r2PerM:.001,x2PerM:.0002},dataReference:document}];return p;
}
