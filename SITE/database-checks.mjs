import {hasBranchCurrents} from './single-phase.mjs?v=20261022-pv-final';
import {isBranchEnabled} from './network-model.mjs?v=20261022-pv-final';
import {thermalFactors,conductorSizes} from './database-reference-tables.mjs?v=20261022-pv-final';
import {insulationReference} from './cable-insulation.mjs?v=20261022-pv-final';
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const norm=s=>String(s||'').toLowerCase().replaceAll('aluminium','aluminum').trim();
const sizeKey=s=>String(s||'').toLowerCase().replace(/mcm/g,'kcmil').replace(/^#/,'').replace(/\s+/g,'');
export function conductorArea(cable,sizeRows=conductorSizes,sourceRow=null){
 if(finite(cable.thermal?.areaMM2)&&cable.thermal.areaMM2>0)return {areaMM2:cable.thermal.areaMM2,basis:'Entered conductor area',manual:true};
 if(sourceRow&&finite(sourceRow['Area mm²'])&&sourceRow['Area mm²']>0)return {areaMM2:sourceRow['Area mm²'],basis:'CABLES · row '+sourceRow._row};
 const metric=String(cable.size||'').match(/^([0-9]+(?:\.[0-9]+)?)\s*mm(?:²|2|\^2)$/i);
 if(metric)return {areaMM2:Number(metric[1]),basis:'Selected metric conductor size'};
 const row=sizeRows.find(r=>sizeKey(r['Conductor Size'])===sizeKey(cable.size));
 if(row&&finite(row['kcmil Equivalent'])&&row['kcmil Equivalent']>0)return {areaMM2:row['kcmil Equivalent']*Math.PI/4*.0254**2*1000,basis:'CONDUCTOR_SIZES · row '+row._row};
 return {areaMM2:null,basis:'Enter the documented conductor area'};
}
export function cableThermalScreen(project,cable,results,kRows=thermalFactors,sizeRows=conductorSizes,sourceRow=null){
 const cfg=cable.thermal||{},area=conductorArea(cable,sizeRows,sourceRow),required=message=>({status:'INPUT REQUIRED',message,...area});
 if(!cfg.class&&!cfg.clearingTime&&!cfg.initialTemp&&!cfg.areaMM2)return {status:'NOT CONFIGURED',message:'Select the actual insulation class and enter clearing time / initial temperature to check conductor withstand.',...area};
 if(!isBranchEnabled(cable,project))return {status:'OUT OF SERVICE',message:'No conducting cable path.',...area};
 if(!hasBranchCurrents(project))return required('Branch thermal screening needs a three-phase branch-current calculation.');
 if(results.some(r=>!finite(r.totalA)))return required('Complete all connected fault-result inputs before checking the maximum branch current.');
 if(!(finite(area.areaMM2)&&area.areaMM2>0&&Number.isInteger(cable.runs)&&cable.runs>0))return required('Enter a positive conductor area and integer parallel-conductor count.');
 if(!(finite(cfg.clearingTime)&&cfg.clearingTime>=.1&&cfg.clearingTime<=5))return required('Enter total protective-device clearing time from 0.1 to 5 s. For shorter clearing or current limiting use manufacturer let-through I²t. Study time is a separate input.');
 const kRow=kRows.find(row=>row['Thermal Class']===cfg.class&&norm(row.Material)===norm(cable.material));
 if(!kRow||!(kRow['k A√s/mm²']>0))return required('Choose a thermal class with a database k factor for the installed conductor material.');
 if(cfg.class.startsWith('PVC')&&((cfg.class.includes('<=300')&&area.areaMM2>300)||(cfg.class.includes('>300')&&area.areaMM2<=300)))return required('Choose the PVC thermal class for this conductor area.');
 if(!finite(cfg.initialTemp)||!finite(kRow['Max Initial Temp °C'])||cfg.initialTemp>kRow['Max Initial Temp °C']||cfg.initialTemp< -50)return required('Enter an initial conductor temperature no higher than the database k-factor temperature limit. Product-specific limits still apply.');
 const insulation=insulationReference(cable);
 if(insulation&&/^PVC(?:\s|$)/.test(insulation.material)&&!cfg.class.startsWith('PVC'))return required('The selected NEC insulation is PVC-based. Choose the matching PVC k-factor class; an EPR/XLPE factor does not apply. The workbook PVC factor is based on a maximum 70 °C initial temperature.');
 if(insulation&&['EPR','XLPE','TR-XLPE'].includes(insulation.type)&&cfg.class!=='EPR/XLPE')return required('Choose the EPR/XLPE k-factor class for the selected insulation material.');
 if(insulation&&/Fluoropolymer|Mineral insulation/.test(insulation.material))return required('The workbook has no documented k-factor class for this insulation material. Use a product-specific short-circuit withstand/let-through study.');
 if(insulation&&cable.insulationLocation&&insulation.section==='Table 310.4(1)'&&insulation.maximumTemperature==null)return required('The selected insulation designation has no general temperature rating for this location. Verify the actual cable marking before applying the withstand screen.');
 if(insulation&&cable.insulationLocation&&finite(insulation.maximumTemperature)&&cfg.initialTemp>insulation.maximumTemperature)return required('Initial conductor temperature exceeds the selected insulation/location reference limit of '+insulation.maximumTemperature+' °C. Check the insulation marking and temperature assumption.');
 const flows=results.flatMap(r=>(r.branchFlows||[]).filter(f=>f.id===cable.id&&finite(f.fromA)&&finite(f.toA)).map(f=>({currentA:Math.max(f.fromA,f.toA),busId:r.busId,bound:f.bound||r.bound})));
 if(!flows.length)return required('No calculated conducting branch current is available.');
 const worst=flows.reduce((a,b)=>a.currentA>b.currentA?a:b),perConductorA=worst.currentA/cable.runs,k=kRow['k A√s/mm²'],ratingA=k*area.areaMM2/Math.sqrt(cfg.clearingTime),dutyI2t=perConductorA**2*cfg.clearingTime,ratingI2t=(k*area.areaMM2)**2;
 if(![ratingA,dutyI2t,ratingI2t].every(finite))return required('Thermal input values are outside the supported numeric range.');
 return {...area,status:dutyI2t>ratingI2t*(1+1e-9)?'EXCEEDS RMS SCREEN':'REVIEW REQUIRED',message:'Constant symmetrical RMS adiabatic screen: equal sharing between parallel conductors. DC offset, current-limiting let-through, changing source contributions and exact product limits require review.',k,kRow:kRow._row,maxInitialTemp:kRow['Max Initial Temp °C'],clearingTime:cfg.clearingTime,initialTemp:cfg.initialTemp,perConductorA,ratingA,dutyI2t,ratingI2t,busId:worst.busId,bound:worst.bound};
}
export function shortTimeScreen(project,device,results){
 if(device.withstandTime==null||device.withstandTime==='')return {status:'NOT CONFIGURED',message:'Enter a fault clearing duration to compare the published short-time rating.'};
 if(device.enabled===false)return {status:'OUT OF SERVICE',message:'Equipment is out of service.'};
 if(!(finite(device.withstandTime)&&device.withstandTime>0&&finite(device.shortTimeA)&&device.shortTimeA>0&&finite(device.shortTimeDuration)&&device.shortTimeDuration>0))return {status:'INPUT REQUIRED',message:'A numeric short-time current rating, published duration and clearing duration are required.'};
 if(device.withstandTime>device.shortTimeDuration)return {status:'INPUT REQUIRED',message:'Clearing exceeds the published short-time duration; no thermal extrapolation is made.'};
 const result=results.find(r=>r.busId===device.bus);if(!finite(result?.totalA))return {status:'INPUT REQUIRED',message:'Calculate the equipment-bus RMS fault level.'};
 return {status:result.totalA>device.shortTimeA*(1+1e-9)?'EXCEEDS RMS SCREEN':'REVIEW REQUIRED',currentA:result.totalA,ratingA:device.shortTimeA,time:device.withstandTime,message:'Conservative equipment-bus symmetrical RMS screen within the published duration. Interrupting duty, peak duty and total clearing performance are separate checks.'};
}
