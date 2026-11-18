/**
 * Bounded IEC 60287 single-core cable direct burial thermal geometry.
 * Specific scope: one or an equally loaded flat row of identical, single-core,
 * independently insulated cables, homogeneous undried soil at common depth.
 * Excludes ducts, backfill zones, trefoil, cable spacing below outer diameter,
 * crossings, soil dry-out, cyclic load, heterogeneous soil and armour geometry.
 *
 * Radial material-layer thermal impedance T = rho * ln(Dout/Din)/(2*pi).
 * Single buried cylinder external T4 = rho_soil acosh(2L/D)/(2*pi).
 * Group mutual resistance, method of images, per cable j:
 * rho_soil/(2*pi) * sum_{k != j} ln(sqrt(dx^2 + (2L)^2)/abs(dx)).
 * The hottest equal-load cable sets the group rating.
 * Unit: rho K m/W, T K m/W, diameters and depth in mm; Rac ohm/m.
 * Requires independently documented losses and AC conductor resistance at the entered conductor limit temperature.
 * Does not apply the two-single-core proximity formula to a three-cable flat circuit.
 */
import {thermalSteadyCore} from './engineering-core-methods.mjs';
const PI=Math.PI;
function err(t){throw Error(t)}
function finite(n,k,lo,hi){if(typeof n!=='number'||!Number.isFinite(n)||n<lo||n>hi)err(k+' must be a documented finite number between '+lo+' and '+hi);return n}
function layerGroup(layers,label,initial){
 if(!Array.isArray(layers)||layers.length>20)err(label+' requires 0–20 explicit annular layers');
 let T=0,inner=initial;
 for(const [i,layer] of layers.entries()){
  if(!layer||typeof layer!=='object'||Array.isArray(layer))err(label+' layer '+i+' not an object');
  const from=finite(layer.innerDiameterMM,label+'.innerDiameterMM',0.001,10000);
  const to=finite(layer.outerDiameterMM,label+'.outerDiameterMM',0.001,10000);
  const rho=finite(layer.thermalResistivityKmPerW,label+'.thermalResistivityKmPerW',0.001,10000);
  if(Math.abs(inner-from)>1e-7*Math.max(1,inner))err(label+' annular layers must be radially contiguous; gap at '+inner+' mm');
  if(to<=from)err(label+' outer diameter must exceed inner diameter');
  T+=rho/(2*PI)*Math.log(to/from);inner=to;
 }
 return {thermalResistanceKmPerW:T,outerDiameterMM:inner};
}
export function directBuriedSingleCoreRating(x){
 if(!x||typeof x!=='object'||Array.isArray(x))err('Document a single-core direct burial case');
 if(x.installation!=='single-core-homogeneous-direct-burial')err('Only an isolated or equally loaded flat row of identical single-core cables directly buried in homogeneous soil is modelled');
 const conductorDiameter=finite(x.conductorDiameterMM,'conductorDiameterMM',0.1,500);
 const insulation=layerGroup(x.insulationLayers,'insulationLayers',conductorDiameter);
 if(x.insulationLayers.length<1||insulation.thermalResistanceKmPerW<=0)err('Document at least one insulation annular layer');
 const bedding=layerGroup(x.beddingLayers,'beddingLayers',insulation.outerDiameterMM);
 const jacket=layerGroup(x.jacketLayers,'jacketLayers',bedding.outerDiameterMM);
 if(!x.jacketLayers.length)err('Document the final outer-serving layer for the cable exterior diameter');
 const outerD=jacket.outerDiameterMM;
 const depth=finite(x.burialDepthToAxisMM,'burialDepthToAxisMM',1,100000);
 if(depth<=outerD/2)err('Cable exterior would protrude above grade');
 const soilRho=finite(x.soilThermalResistivityKmPerW,'soilThermalResistivityKmPerW',0.05,20);
 const ambient=finite(x.ambientSoilC,'ambientSoilC',-40,120);
 const limit=finite(x.conductorLimitC,'conductorLimitC',0,150);
 if(limit<=ambient)err('Conductor temperature must exceed soil temperature');
 const wd=finite(x.dielectricLossWPerM,'dielectricLossWPerM',0,1e4);
 const lambda1=finite(x.sheathLossFactor,'sheathLossFactor',0,100);
 const lambda2=finite(x.armourLossFactor,'armourLossFactor',0,100);
 const rac=finite(x.acResistanceAtLimitOhmPerM,'acResistanceAtLimitOhmPerM',1e-12,100);
 const provenance=x.acResistanceSource;
 if(typeof provenance!=='string'||provenance.length<10||provenance.length>300)err('Provide documented acResistanceSource description for the user-entered AC resistance');
 const positions=x.centerOffsetsMM;
 if(!Array.isArray(positions)||positions.length<1||positions.length>12)err('Document 1–12 cable-axis x-coordinates in a flat row');
 const xs=positions.map((q,i)=>finite(q,'centerOffsetsMM['+i+']',-1e6,1e6));
 const sorted=[...xs].sort((a,b)=>a-b);
 for(let i=1;i<sorted.length;i++)if(sorted[i]-sorted[i-1]+1e-8<outerD)err('Cables overlap; flat row spacing must be at least cable exterior diameter');
 const u=2*depth/outerD;
 const selfExternal=soilRho/(2*PI)*Math.acosh(u);
 const thermal=[];
 for(let i=0;i<xs.length;i++){
  let mutual=0;
  for(let j=0;j<xs.length;j++)if(i!==j){
   const dx=Math.abs(xs[i]-xs[j]);
   mutual+=soilRho/(2*PI)*Math.log(Math.hypot(dx,2*depth)/dx);
  }
  const T4=selfExternal+mutual;
  const core=thermalSteadyCore({ambientC:ambient,conductorLimitC:limit,racOhmPerM:rac,loadedConductors:1,
   t1KmPerW:insulation.thermalResistanceKmPerW,t2KmPerW:bedding.thermalResistanceKmPerW,t3KmPerW:jacket.thermalResistanceKmPerW,t4KmPerW:T4,
   dielectricLossWPerM:wd,sheathLossFactor:lambda1,armourLossFactor:lambda2});
  thermal.push({index:i,centerOffsetMM:xs[i],mutualThermalResistanceKmPerW:mutual,externalThermalResistanceKmPerW:T4,continuousRatingA:core.ratedCurrentA,dielectricTemperatureRiseC:core.dielectricTemperatureRiseC,heatingCoefficient:core.conductorHeatingCoefficient});
 }
 let controlling=thermal[0];for(const row of thermal)if(row.continuousRatingA<controlling.continuousRatingA)controlling=row;
 const I=Object.hasOwn(x,'loadCurrentA')?finite(x.loadCurrentA,'loadCurrentA',0,1e7):null;
 return {status:'BOUNDED_IEC60287_SINGLE_CORE_HOMOGENEOUS_DIRECT_BURIAL',installation:x.installation,
  scope:'One or a flat row of equally loaded identical single-core cables in uniform, undried soil at equal burial depth. Not trefoil, duct banks, cyclic/drying-out or heterogeneous soil.',
  cableOuterDiameterMM:outerD,burialDepthToAxisMM:depth,conductorResistanceOhmPerM:rac,acResistanceSource:provenance,
  t1KmPerW:insulation.thermalResistanceKmPerW,t2KmPerW:bedding.thermalResistanceKmPerW,t3KmPerW:jacket.thermalResistanceKmPerW,
  isolatedExternalThermalResistanceKmPerW:selfExternal,cableRatings:thermal,limitingCableIndex:controlling.index,
  groupContinuousCurrentRatingA:controlling.continuousRatingA,enteredLoadCurrentA:I,
  withinGroupRating:I===null?null:I<=controlling.continuousRatingA,
  warnings:['AC resistance skin/proximity correction inputs, dielectric losses and sheath/armour loss factors require manufacturer qualification.',
    'This is a constrained homogeneous direct-burial steady-state calculation and is NOT a verified full IEC 60287 installation/NEC ampacity rating.',
    'Soil dry-out, thermal backfill, ducts, other heated circuits and cyclic/seasonal conditions are excluded.',
    'Use project-specific thermophysical and conductor data and engineering review for final cable sizing.']};
}
