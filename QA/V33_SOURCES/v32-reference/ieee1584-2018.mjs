/**
 * IEEE 1584-2018 arcing current, incident energy and arc-flash boundary, in the browser.
 *
 * JavaScript port of the MIT-licensed `arcflash-calc` library
 *   Copyright (c) 2022 Li-aung Yip - https://www.penwatch.net (MIT License)
 *   https://github.com/LiaungYip/arcflash
 * which reproduces IEEE 1584-2018 Annex D.1/D.2 and was compared by its author
 * with 144,000 results of the official IEEE 1584-2018 calculator spreadsheet.
 * The MIT notice is reproduced in IEEE1584_LICENSE below.
 *
 * Scope: three-phase AC, 208 V to 15 kV, bolted fault current 500 A-106 kA (<=600 V)
 * or 200 A-65 kA (>600 V), electrode configurations VCB, VCBB, HCB, VOA, HOA.
 * Clearing times are inputs. They must come from protective-device studies at the
 * calculated full AND reduced arcing currents. No PPE category is assigned.
 */
export const IEEE1584_LICENSE='MIT License. Copyright (c) 2022 Li-aung Yip - https://www.penwatch.net. Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.';
export const IEEE1584_ENGINE={id:'ieee1584-2018-local-v29',version:'29.0.0',port:'arcflash-calc (LiaungYip/arcflash, MIT)'};

const ECS=['VCB','VCBB','HCB','VOA','HOA'];
// IEEE 1584-2018 Table 1: k1..k10 for intermediate arcing current at 0.6, 2.7, 14.3 kV
const T1={
 VCB:{0.6:[-0.04287,1.035,-0.083,0,0,-4.783e-9,1.962e-6,-0.000229,0.003141,1.092],2.7:[0.0065,1.001,-0.024,-1.557e-12,4.556e-10,-4.186e-8,8.346e-7,5.482e-5,-0.003191,0.9729],14.3:[0.005795,1.015,-0.011,-1.557e-12,4.556e-10,-4.186e-8,8.346e-7,5.482e-5,-0.003191,0.9729]},
 VCBB:{0.6:[-0.017432,0.98,-0.05,0,0,-5.767e-9,2.524e-6,-0.00034,0.01187,1.013],2.7:[0.002823,0.995,-0.0125,0,-9.204e-11,2.901e-8,-3.262e-6,0.0001569,-0.004003,0.9825],14.3:[0.014827,1.01,-0.01,0,-9.204e-11,2.901e-8,-3.262e-6,0.0001569,-0.004003,0.9825]},
 HCB:{0.6:[0.054922,0.988,-0.11,0,0,-5.382e-9,2.316e-6,-0.000302,0.0091,0.9725],2.7:[0.001011,1.003,-0.0249,0,0,4.859e-10,-1.814e-7,-9.128e-6,-0.0007,0.9881],14.3:[0.008693,0.999,-0.02,0,-5.043e-11,2.233e-8,-3.046e-6,0.000116,-0.001145,0.9839]},
 VOA:{0.6:[0.043785,1.04,-0.18,0,0,-4.783e-9,1.962e-6,-0.000229,0.003141,1.092],2.7:[-0.02395,1.006,-0.0188,-1.557e-12,4.556e-10,-4.186e-8,8.346e-7,5.482e-5,-0.003191,0.9729],14.3:[0.005371,1.0102,-0.029,-1.557e-12,4.556e-10,-4.186e-8,8.346e-7,5.482e-5,-0.003191,0.9729]},
 HOA:{0.6:[0.111147,1.008,-0.24,0,0,-3.895e-9,1.641e-6,-0.000197,0.002615,1.1],2.7:[0.000435,1.006,-0.038,0,0,7.859e-10,-1.914e-7,-9.128e-6,-0.0007,0.9981],14.3:[0.000904,0.999,-0.02,0,0,7.859e-10,-1.914e-7,-9.128e-6,-0.0007,0.9981]}};
// Table 2: arcing current variation correction factor k1..k7
const T2={VCB:[0,-0.0000014269,0.000083137,-0.0019382,0.022366,-0.12645,0.30226],VCBB:[1.138e-6,-6.0287e-5,0.0012758,-0.013778,0.080217,-0.24066,0.33524],HCB:[0,-3.097e-6,0.00016405,-0.0033609,0.033308,-0.16182,0.34627],VOA:[9.5606e-7,-5.1543e-5,0.0011161,-0.01242,0.075125,-0.23584,0.33696],HOA:[0,-3.1555e-6,0.0001682,-0.0034607,0.034124,-0.1599,0.34629]};
// Tables 3, 4, 5: incident energy k1..k13 for 600 V, 2700 V, 14300 V
const T345={
 0.6:{VCB:[0.753364,0.566,1.752636,0,0,-4.783e-9,0.000001962,-0.000229,0.003141,1.092,0,-1.598,0.957],VCBB:[3.068459,0.26,-0.098107,0,0,-5.767e-9,0.000002524,-0.00034,0.01187,1.013,-0.06,-1.809,1.19],HCB:[4.073745,0.344,-0.370259,0,0,-5.382e-9,0.000002316,-0.000302,0.0091,0.9725,0,-2.03,1.036],VOA:[0.679294,0.746,1.222636,0,0,-4.783e-9,0.000001962,-0.000229,0.003141,1.092,0,-1.598,0.997],HOA:[3.470417,0.465,-0.261863,0,0,-3.895e-9,0.000001641,-0.000197,0.002615,1.1,0,-1.99,1.04]},
 2.7:{VCB:[2.40021,0.165,0.354202,-1.557e-12,4.556e-10,-4.186e-8,8.346e-7,5.482e-5,-0.003191,0.9729,0,-1.569,0.9778],VCBB:[3.870592,0.185,-0.736618,0,-9.204e-11,2.901e-8,-3.262e-6,0.0001569,-0.004003,0.9825,0,-1.742,1.09],HCB:[3.486391,0.177,-0.193101,0,0,4.859e-10,-1.814e-7,-9.128e-6,-0.0007,0.9881,0.027,-1.723,1.055],VOA:[3.880724,0.105,-1.906033,-1.557e-12,4.556e-10,-4.186e-8,8.346e-7,5.482e-5,-0.003191,0.9729,0,-1.515,1.115],HOA:[3.616266,0.149,-0.761561,0,0,7.859e-10,-1.914e-7,-9.128e-6,-0.0007,0.9981,0,-1.639,1.078]},
 14.3:{VCB:[3.825917,0.11,-0.999749,-1.557e-12,4.556e-10,-4.186e-8,8.346e-7,5.482e-5,-0.003191,0.9729,0,-1.568,0.99],VCBB:[3.644309,0.215,-0.585522,0,-9.204e-11,2.901e-8,-3.262e-6,0.0001569,-0.004003,0.9825,0,-1.677,1.06],HCB:[3.044516,0.125,0.245106,0,-5.043e-11,2.233e-8,-3.046e-6,0.000116,-0.001145,0.9839,0,-1.655,1.084],VOA:[3.405454,0.12,-0.93245,-1.557e-12,4.556e-10,-4.186e-8,8.346e-7,5.482e-5,-0.003191,0.9729,0,-1.534,0.979],HOA:[2.04049,0.177,1.005092,0,0,7.859e-10,-1.914e-7,-9.128e-6,-0.0007,0.9981,-0.05,-1.633,1.151]}};
// Table 7: enclosure size correction b1..b3
const T7={Typical:{VCB:[-0.000302,0.03441,0.4325],VCBB:[-0.0002976,0.032,0.479],HCB:[-0.0001923,0.01935,0.6899]},Shallow:{VCB:[0.002222,-0.02556,0.6222],VCBB:[-0.002778,0.1194,-0.2778],HCB:[-0.0005556,0.03722,0.4778]}};

const log10=Math.log10,fin=x=>typeof x==='number'&&Number.isFinite(x);
const fail=m=>{throw Error('IEEE 1584-2018: '+m)};
const MM_TO_IN=0.03937; // factor printed in IEEE 1584-2018 Table 6

function intermediateIarc(ec,v,ibf,g){const k=T1[ec][v];const x1=k[0]+k[1]*log10(ibf)+k[2]*log10(g);const x2=k[3]*ibf**6+k[4]*ibf**5+k[5]*ibf**4+k[6]*ibf**3+k[7]*ibf**2+k[8]*ibf+k[9];return 10**x1*x2}
function varCF(ec,voc){const k=T2[ec];return k[0]*voc**6+k[1]*voc**5+k[2]*voc**4+k[3]*voc**3+k[4]*voc**2+k[5]*voc+k[6]}
function enclosure(ec,voc,h,w,d){
 if(ec==='HOA'||ec==='VOA')return {type:'Open air',height1In:null,width1In:null,EESIn:null,CF:1};
 const type=(voc<0.6&&h<508&&w<508&&d<=203.2)?'Shallow':'Typical';
 const [A,B]={VCB:[4,20],VCBB:[10,24],HCB:[10,22]}[ec];
 const eq1112=dim=>(660.4+(dim-660.4)*((voc+A)/B))/25.4;
 let w1,h1;
 if(w<508)w1=type==='Typical'?20:MM_TO_IN*w;else if(w<=660.4)w1=MM_TO_IN*w;else if(w<=1244.6)w1=eq1112(w);else w1=eq1112(1244.6);
 if(h<508)h1=type==='Typical'?20:MM_TO_IN*h;else if(h<=660.4)h1=MM_TO_IN*h;else if(h<=1244.6)h1=ec==='VCB'?MM_TO_IN*h:eq1112(h);else h1=ec==='VCB'?49:eq1112(1244.6);
 const EES=(h1+w1)/2,b=T7[type][ec],x=b[0]*EES**2+b[1]*EES+b[2];
 return {type,height1In:h1,width1In:w1,EESIn:EES,CF:type==='Typical'?x:1/x};
}
function intermediateE(ec,vKey,iarc,ibf,tMS,g,cf,dMM,iarc600){
 const k=T345[vKey][ec];const x1=12.552/50*tMS,x2=k[0]+k[1]*log10(g);
 const x3=(k[2]*(iarc600??iarc))/(k[3]*ibf**7+k[4]*ibf**6+k[5]*ibf**5+k[6]*ibf**4+k[7]*ibf**3+k[8]*ibf**2+k[9]*ibf);
 const x4=k[10]*log10(ibf)+k[12]*log10(iarc)+log10(1/cf),x5=k[11]*log10(dMM);
 return x1*10**(x2+x3+x4+x5);
}
function afbFromE(ec,vKey,E,dMM){const k12=T345[vKey][ec][11];const F=E/dMM**k12;return (5.0208/F)**(1/k12)}
function interpolate(voc,x600,x2700,x14300){const x1=((x2700-x600)/2.1)*(voc-2.7)+x2700,x2=((x14300-x2700)/11.6)*(voc-14.3)+x14300,x3=(x1*(2.7-voc))/2.1+(x2*(voc-0.6))/2.1;return voc<=2.7?x3:x2}
function finalIarcLV(voc,i600,ibf){return 1/Math.sqrt((0.6/voc)**2*(1/i600**2-(0.6**2-voc**2)/(0.6**2*ibf**2)))}

export function validateIeee1584Input(x){
 if(!x||typeof x!=='object'||Array.isArray(x))fail('enter a JSON object.');
 const need=['voltageKV','boltedFaultKA','gapMM','workingDistanceMM','enclosureHeightMM','enclosureWidthMM','enclosureDepthMM','clearingFullMS','clearingReducedMS'];
 for(const k of need)if(!fin(x[k]))fail(k+' must be a finite number.');
 if(!ECS.includes(x.electrodeConfiguration))fail('electrodeConfiguration must be one of '+ECS.join(', ')+'.');
 const v=x.voltageKV,lv=v<=0.6;
 if(!(v>=0.208&&v<=15))fail('voltageKV must be 0.208 to 15 kV (IEEE 1584-2018 model range).');
 if(lv&&!(x.boltedFaultKA>=0.5&&x.boltedFaultKA<=106))fail('bolted fault current must be 0.5 to 106 kA for 208-600 V.');
 if(!lv&&!(x.boltedFaultKA>=0.2&&x.boltedFaultKA<=65))fail('bolted fault current must be 0.2 to 65 kA above 600 V.');
 if(lv&&!(x.gapMM>=6.35&&x.gapMM<=76.2))fail('conductor gap must be 6.35 to 76.2 mm for 208-600 V.');
 if(!lv&&!(x.gapMM>=19.05&&x.gapMM<=254))fail('conductor gap must be 19.05 to 254 mm above 600 V.');
 if(!(x.workingDistanceMM>=305))fail('working distance must be at least 305 mm.');
 for(const k of ['enclosureHeightMM','enclosureWidthMM','enclosureDepthMM'])if(!(x[k]>0&&x[k]<=10000))fail(k+' must be greater than 0 and at most 10,000 mm.');
 if(!(x.enclosureWidthMM>=4*x.gapMM))fail('enclosure width must be at least four times the conductor gap.');
 for(const k of ['clearingFullMS','clearingReducedMS'])if(!(x[k]>=1&&x[k]<=2000))fail(k+' must be 1 to 2,000 ms.');
}

export function ieee1584Calculate(x){
 validateIeee1584Input(x);
 const ec=x.electrodeConfiguration,voc=x.voltageKV,ibf=x.boltedFaultKA,g=x.gapMM,d=x.workingDistanceMM,lv=voc<=0.6;
 const enc=enclosure(ec,voc,x.enclosureHeightMM,x.enclosureWidthMM,x.enclosureDepthMM);
 if(!(enc.CF>=0&&enc.CF<=3))fail('enclosure correction factor outside 0-3; check enclosure dimensions.');
 if(enc.type==='Typical'&&enc.EESIn<19.999)fail('equivalent enclosure size below 20 in for a typical enclosure.');
 const vcf=varCF(ec,voc),red=1-0.5*vcf;
 const kv=[0.6,2.7,14.3],iFull=kv.map(v=>intermediateIarc(ec,v,ibf,g));
 const cases=[['full',x.clearingFullMS,1],['reduced',x.clearingReducedMS,red]].map(([name,t,f])=>{
  let iarc,E,AFB,intermediates;
  if(lv){
   const i600=iFull[0],iFinal=finalIarcLV(voc,i600,ibf);iarc=iFinal*f;
   E=intermediateE(ec,0.6,iarc,ibf,t,g,enc.CF,d,i600);AFB=afbFromE(ec,0.6,E,d);
   intermediates={iArc600KA:i600};
  }else{
   const ii=iFull.map(i=>i*f);iarc=interpolate(voc,...ii);
   const Es=kv.map((v,j)=>intermediateE(ec,v,ii[j],ibf,t,g,enc.CF,d));const As=kv.map((v,j)=>afbFromE(ec,v,Es[j],d));
   E=interpolate(voc,...Es);AFB=interpolate(voc,...As);
   intermediates={iArc600KA:ii[0],iArc2700KA:ii[1],iArc14300KA:ii[2],e600JPerCm2:Es[0],e2700JPerCm2:Es[1],e14300JPerCm2:Es[2],afb600MM:As[0],afb2700MM:As[1],afb14300MM:As[2]};
  }
  if(![iarc,E,AFB].every(fin)||iarc<=0||E<0||AFB<=0)fail('calculation left the numerical range; check inputs.');
  return {case:name,arcingCurrentKA:iarc,clearingTimeMS:t,incidentEnergyJPerCm2:E,incidentEnergyCalPerCm2:E/4.184,arcFlashBoundaryMM:AFB,arcFlashBoundaryFt:AFB/304.8,intermediates};
 });
 const governing=cases[0].incidentEnergyJPerCm2>=cases[1].incidentEnergyJPerCm2?'full':'reduced';
 const warnings=[];
 if(x.clearingFullMS>x.clearingReducedMS)warnings.push('Reduced-current clearing time is shorter than the full-current time; confirm both from the device curve.');
 if(Math.max(x.clearingFullMS,x.clearingReducedMS)>=2000)warnings.push('Clearing time at the 2 s limit; IEEE 1584-2018 discusses when a 2 s maximum arc duration may be reasonable. Confirm the basis.');
 if(enc.type==='Shallow')warnings.push('Shallow enclosure correction applied (below 600 V, height and width under 508 mm, depth 203.2 mm or less).');
 return {status:'IEEE1584_2018_EXPLICIT_CLEARING_TIMES',engine:IEEE1584_ENGINE,computedIn:'browser (no data sent to any server)',
  inputs:{...x},voltageLevel:lv?'208-600 V model':'601 V-15 kV model',enclosure:enc,arcingCurrentVariationFactor:vcf,reducedCurrentFactor:red,
  cases,governingCase:governing,maximumIncidentEnergyCalPerCm2:Math.max(...cases.map(c=>c.incidentEnergyCalPerCm2)),maximumArcFlashBoundaryMM:Math.max(...cases.map(c=>c.arcFlashBoundaryMM)),
  warnings,scope:'IEEE 1584-2018 empirical model, three-phase AC 208 V-15 kV within the tested ranges. Clearing times are user inputs from protective-device studies. Not for single-phase, DC or above 15 kV. No PPE category or label approval is issued.',
  reference:'IEEE Std 1584-2018, Guide for Performing Arc-Flash Hazard Calculations: equations 1-25, Tables 1-7.',license:IEEE1584_LICENSE};
}
