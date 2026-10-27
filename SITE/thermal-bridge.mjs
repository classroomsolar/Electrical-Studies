/*
 * Batch05: schema-safe and unit-explicit BRIDGE for the recovered Python
 * Cable Thermal Archive. This is NOT a merge of the archived solver into
 * the private production Thermal Studio v3.6.2, nor a browser-executed solver.
 */
import {solveBalancedPowerFlow,operatingNetworkFromStudio} from './operating-studies.mjs?v=20261024-batch01';
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const thermalFields=['ambient_c','max_temp_c','soil_rho_km_w','burial_depth_m','cable_od_m','r20_ohm_m','alpha_per_c','ac_factor','dielectric_w_m','r_internal_km_w','r_dielectric_internal_km_w','group_multiplier','phases'];
export function buildThermalCompanionCase(project,cableId,documented){
 if(!documented||typeof documented!=='object'||Array.isArray(documented))throw Error('Thermal: explicitly documented input object required');
 if(!project||!project.buses||!project.branches)throw Error('Thermal: Studio project required');
 const cable=project.branches.find(e=>e.id===cableId&&e.kind==='cable'&&e.enabled!==false);
 if(!cable)throw Error('Thermal: choose one enabled actual cable branch');
 if(!Number.isSafeInteger(cable.runs)||cable.runs<=0)throw Error('Thermal: actual parallel runs required');
 const currentNet=operatingNetworkFromStudio(project),operating=solveBalancedPowerFlow(currentNet);
 const flow=operating.branches.find(b=>b.id===cableId);if(!flow||!finite(flow.currentPu))throw Error('Thermal: no validated operating current for selected feeder');
 const volt=project.buses.find(b=>b.id===cable.from)?.voltage;if(!finite(volt)||volt<=0)throw Error('Thermal: selected cable voltage unknown');
 const phaseAmp=flow.currentPu*operating.baseMVA*1e6/(Math.sqrt(3)*volt);
 if(!finite(phaseAmp)||phaseAmp<0)throw Error('Thermal: invalid RMS branch current');
 const input={load_a:phaseAmp/cable.runs};for(const f of thermalFields){if(!Object.hasOwn(documented,f)||!finite(documented[f]))throw Error('Thermal: supply documented '+f);input[f]=documented[f];}
 if(input.phases!==3||!Number.isSafeInteger(input.phases))throw Error('Thermal: balanced three-phase companion case only');
 if(input.ambient_c>=input.max_temp_c||input.soil_rho_km_w<=0||input.r20_ohm_m<=0||input.ac_factor<=0||input.alpha_per_c<=0||input.cable_od_m<=0||input.burial_depth_m<=input.cable_od_m/2||input.group_multiplier<=0||input.dielectric_w_m<0||input.r_internal_km_w<0||input.r_dielectric_internal_km_w<0)throw Error('Thermal: outside the archived Python solver validity gates');
 const extra=Object.keys(documented).filter(k=>!thermalFields.includes(k));if(extra.length)throw Error('Thermal: unsupported undocumented parameter(s): '+extra.join(','));
 return {format:'fault-current-studio-thermal-companion-case',schemaVersion:1,status:'CANDIDATE_FOR_SEPARATE_PYTHON_VALIDATION',cableId,sourceProjectId:project.id,caseName:project.caseName||project.name,branchCurrentRmsA:phaseAmp,parallelRuns:cable.runs,perConductorCurrentA:input.load_a,thermal_input:input,provenance:{branchId:cable.id,operatingBaseMVA:operating.baseMVA,operatingMethod:'balanced Ybus power flow',parameterBasis:'User-supplied explicitly documented thermal parameters',limitations:'Archived Python approximation; not official/current private Thermal Studio engine, no full 60287 conformity'}};
}
