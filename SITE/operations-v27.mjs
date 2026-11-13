/** Fault Current Studio V27: bounded, explainable operations calculations.
 * Pure functions; no API, globals, DOM, storage or hidden manufacturer assumptions.
 * Does NOT implement validated utility dispatch optimisation, full quasi-dynamics,
 * unbalanced power flow, dynamic inverter response or certified planning standards.
 */
import {solveBalancedPowerFlow,operatingNetworkFromStudio} from './operating-studies.mjs?v=20261108-v32';
const bad=message=>{throw Error('Operations study: '+message)};
const num=(value,name,low=-Infinity,high=Infinity)=>{if(typeof value!=='number'||!Number.isFinite(value)||value<low||value>high)bad(name+' must be a finite number between '+low+' and '+high);return value};
const entries=(array,limit,name)=>{if(!Array.isArray(array)||!array.length||array.length>limit)bad(name+' requires 1–'+limit+' entries');return array};
const safeName=(s,name)=>{if(typeof s!=='string'||!s.trim()||s.length>110)bad(name+' must be a nonempty short label');return s.trim()};
const round=(n,places=8)=>Number(n.toFixed(places));

/**
 * Positive gridPowerKW means import, negative means export.
 * All profile values are AC-side; battery state is usable nameplate kWh on DC side.
 * Charging AC→DC etaCharge; discharging DC→AC etaDischarge.
 * Dispatch is a transparent deterministic *rule*, never optimisation.
 */
export function evaluateBessDispatch(input){
 if(!input||Array.isArray(input)||typeof input!=='object')bad('a dispatch configuration is required');
 const rows=entries(input.intervals,8784,'Time-series profile');
 const capacity=num(input.capacityKWh,'Battery capacity (kWh)',0,1e9);
 const power=num(input.powerKW,'Battery inverter rating (kW)',0,1e9);
 const minSoc=num(input.minimumSocPercent,'Minimum SOC (%)',0,100);
 const maxSoc=num(input.maximumSocPercent,'Maximum SOC (%)',minSoc,100);
 const startSoc=num(input.initialSocPercent,'Starting SOC (%)',minSoc,maxSoc);
 const chargeEfficiency=num(input.chargeEfficiency,'Charging efficiency',0.01,1);
 const dischargeEfficiency=num(input.dischargeEfficiency,'Discharging efficiency',0.01,1);
 const exportCap=num(input.exportLimitKW,'Grid export limit (kW)',0,1e12);
 const importCap=num(input.importLimitKW,'Grid import limit (kW)',0,1e12);
 const mode=input.mode||'self-consumption';
 if(!['self-consumption','peak-shave'].includes(mode))bad('choose self-consumption or peak-shave mode');
 const target=num(input.importTargetKW??0,'Peak-shaving grid import target (kW)',0,1e12);
 if(power>0&&capacity===0)bad('a zero-energy battery cannot have nonzero power');
 const minEnergy=capacity*minSoc/100,maxEnergy=capacity*maxSoc/100;
 let energy=capacity*startSoc/100,priorTime=null;
 const summary={loadKWh:0,pvKWh:0,gridImportKWh:0,gridExportKWh:0,batteryChargeACKWh:0,batteryDischargeACKWh:0,batteryLossKWh:0,pvCurtailedKWh:0,unservedKWh:0,annualized:false,chargedFromPVOnly:true,intervalCount:rows.length,totalHours:0,maximumImportKW:0,maximumExportKW:0,estimatedImportCost:0,estimatedExportRevenue:0};
 const details=[];
 for(let i=0;i<rows.length;i++){
  const r=rows[i];if(!r||Array.isArray(r)||typeof r!=='object')bad('interval '+(i+1)+' must be an object');
  const time=safeName(r.time,'Interval '+(i+1)+' time');
  if(priorTime!==null&&time===priorTime)bad('interval labels must not repeat consecutively');priorTime=time;
  const hours=num(r.hours,'Interval duration',1e-8,8760);
  summary.totalHours+=hours;if(summary.totalHours>8784+1e-6)bad('total interval duration exceeds 8784 hours');
  const load=num(r.loadKW,'Load power (kW)',0,1e9),pv=num(r.pvKW,'Available PV power (kW)',0,1e9);
  const importTariff=num(r.importPricePerKWh??0,'Import price',0,1e9),exportTariff=num(r.exportPricePerKWh??0,'Export price',0,1e9);
  const net=load-pv;
  const capacityToChargeKW=Math.max(0,(maxEnergy-energy)/chargeEfficiency/hours);
  const capacityToDischargeKW=Math.max(0,(energy-minEnergy)*dischargeEfficiency/hours);
  let chargeKW=0,dischargeKW=0;
  if(net<0)chargeKW=Math.min(-net,power,capacityToChargeKW);
  if(net>0){
   const requested=mode==='peak-shave'?Math.max(0,net-target):net;
   dischargeKW=Math.min(requested,power,capacityToDischargeKW);
  }
  // Split residual into physically satisfied demand, grid exchange and curtailment.
  const afterStorage=net+chargeKW-dischargeKW;
  const importKW=Math.min(Math.max(0,afterStorage),importCap);
  const exportKW=Math.min(Math.max(0,-afterStorage),exportCap);
  const unservedKW=Math.max(0,afterStorage-importKW);
  const curtailedKW=Math.max(0,-afterStorage-exportKW);
  const incomingDc=chargeKW*hours*chargeEfficiency,outgoingDc=dischargeKW*hours/dischargeEfficiency;
  const endEnergy=energy+incomingDc-outgoingDc;
  if(endEnergy<minEnergy-1e-7||endEnergy>maxEnergy+1e-7)bad('battery exceeded SOC constraints');
  const lossesKWh=chargeKW*hours-incomingDc+outgoingDc-dischargeKW*hours;
  // Conservation: PV + imports + storage discharge + shortage = load + charge + export + curtailment.
  const conservation=pv+importKW+dischargeKW+unservedKW-load-chargeKW-exportKW-curtailedKW;
  if(Math.abs(conservation)>1e-7*Math.max(1,pv,load,power))bad('AC energy conservation failed');
  energy=Math.max(minEnergy,Math.min(maxEnergy,endEnergy));
  summary.loadKWh+=load*hours;summary.pvKWh+=pv*hours;summary.gridImportKWh+=importKW*hours;
  summary.gridExportKWh+=exportKW*hours;summary.batteryChargeACKWh+=chargeKW*hours;
  summary.batteryDischargeACKWh+=dischargeKW*hours;summary.batteryLossKWh+=lossesKWh;
  summary.unservedKWh+=unservedKW*hours;summary.pvCurtailedKWh+=curtailedKW*hours;
  summary.maximumImportKW=Math.max(summary.maximumImportKW,importKW);summary.maximumExportKW=Math.max(summary.maximumExportKW,exportKW);
  summary.estimatedImportCost+=importKW*hours*importTariff;summary.estimatedExportRevenue+=exportKW*hours*exportTariff;
  details.push({time,hours,loadKW:load,pvAvailableKW:pv,chargeKW,dischargeKW,gridImportKW:importKW,gridExportKW:exportKW,unservedKW,pvCurtailedKW:curtailedKW,endSocPercent:capacity?100*energy/capacity:0,estimatedNetCost:importKW*hours*importTariff-exportKW*hours*exportTariff,energyBalanceResidualKW:conservation});
 }
 summary.finalSocPercent=capacity?100*energy/capacity:0;
 summary.netGridCost=summary.estimatedImportCost-summary.estimatedExportRevenue;
 summary.energyConservationResidualKWh=summary.pvKWh+summary.gridImportKWh+summary.batteryDischargeACKWh+summary.unservedKWh-summary.loadKWh-summary.batteryChargeACKWh-summary.gridExportKWh-summary.pvCurtailedKWh;
 summary.hasSupplyShortfall=summary.unservedKWh>1e-8;
 summary.supplyFullyServed=!summary.hasSupplyShortfall;
 return {status:summary.hasSupplyShortfall?'GRID_LIMIT_INFEASIBLE_SUPPLY_SHORTFALL':'BOUNDED_DISPATCH_SCREEN',
  method:'Deterministic AC PV/BESS self-consumption or threshold-based peak-shaving. Energy-conserving interval screen; never an economic dispatch optimisation or power-flow/transformer feasibility approval.',
  summary:Object.fromEntries(Object.entries(summary).map(([k,v])=>[k,typeof v==='number'?round(v):v])),intervals:details,
  assumptions:['AC power values in kW are average over each documented interval','Charging is supplied only from contemporaneous surplus PV (no grid charging)','Discharging is limited by power, efficiency and remaining usable DC state of charge','Grid caps may create unserved load or PV curtailment, which is explicitly reported','No battery C-rate derating, degradation, auxiliary power, power factor, thermal constraint or dispatch optimisation','Prices are user-entered in arbitrary consistent currency/kWh; this is not a tariff model']};
}

/** Time-sweep the EXISTING validated bounded Newton-Raphson solver.
 * Uses explicit case multipliers on net injections. No network topology changes.
 * Nonconvergence is reported individually, never filled with invented numbers.
 */
export function evaluateAcTimeSeries(input){
 if(!input||typeof input!=='object'||!input.network)bad('an explicit balanced AC network is required');
 const intervals=entries(input.intervals,500,'AC operating profile');
 const network=input.network;
 const low=num(input.planningMinPu,'Entered voltage planning lower bound',0.01,2);
 const high=num(input.planningMaxPu,'Entered voltage planning upper bound',low,2.5);
 const ratings=input.branchCurrentLimitsA??{};if(!ratings||typeof ratings!=='object'||Array.isArray(ratings))bad('branch current limits map must be an object');
 const buses=network.buses||[],branches=network.branches||[],validIds=new Set(branches.map(b=>b.id));
 const baseVolts=input.nominalBusVoltageV??{};
 for(const id of Object.keys(ratings))if(!validIds.has(id))bad('unknown branch rating ID '+id);
 for(const id of Object.keys(baseVolts))if(!new Set(buses.map(x=>x.id)).has(id))bad('unknown bus nominal voltage ID '+id);
 for(const [id,limit] of Object.entries(ratings))num(limit,id+' current rating A',0.001,1e12);
 const knownVoltage=(id)=>{const v=baseVolts[id];return v==null?null:num(v,id+' nominal bus voltage V',1,1e9)};
 const originalP=Object.fromEntries(buses.filter(b=>b.type!=='SLACK').map(b=>[b.id,b.pMW]));
 const originalQ=Object.fromEntries(buses.filter(b=>b.type==='PQ').map(b=>[b.id,b.qMvar]));
 let minimumV=Infinity,maximumV=-Infinity,totalLossMWh=0,solvedHours=0,failed=0,voltageViolationCount=0,overloadCount=0;
 const rows=[];
 for(let i=0;i<intervals.length;i++){
  const row=intervals[i];if(!row||typeof row!=='object')bad('invalid interval');
  const time=safeName(row.time,'Interval time');const hours=num(row.hours,'AC interval duration',1e-8,8760);
  const loadScale=num(row.loadMultiplier,'Load multiplier',0,100);
  const generationScale=num(row.generationMultiplier,'Generation multiplier',0,100);
  const net={...network,buses:buses.map(b=>{
   if(b.type==='SLACK')return {...b};
   const factor=originalP[b.id]<0?loadScale:generationScale;
   const qfactor=originalQ[b.id]<0?loadScale:generationScale;
   return {...b,pMW:originalP[b.id]*factor,qMvar:b.type==='PQ'?originalQ[b.id]*qfactor:b.qMvar};
  })};
  try{
   const r=solveBalancedPowerFlow(net);
   const lowV=Math.min(...r.buses.map(b=>b.voltagePu)),highV=Math.max(...r.buses.map(b=>b.voltagePu));
   minimumV=Math.min(minimumV,lowV);maximumV=Math.max(maximumV,highV);totalLossMWh+=r.totalLossMW*hours;solvedHours+=hours;
   const violatingBuses=r.buses.filter(b=>b.voltagePu<low-1e-9||b.voltagePu>high+1e-9).map(b=>b.id);
   const overloadedBranches=[];
   const branchCurrentA=[];
   for(const b of r.branches){
     const nominal=knownVoltage(b.from);
     const currentA=nominal==null?null:b.currentPu*network.baseMVA*1e6/(Math.sqrt(3)*nominal);
     branchCurrentA.push({id:b.id,currentA});
     if(ratings[b.id]!=null){if(currentA==null)bad('a nominal bus voltage V is required to compare rated branch '+b.id);if(currentA>ratings[b.id]*(1+1e-9))overloadedBranches.push(b.id)}
   }
   voltageViolationCount+=violatingBuses.length;overloadCount+=overloadedBranches.length;
   rows.push({time,hours,status:'SOLVED',loadMultiplier:loadScale,generationMultiplier:generationScale,lowestVoltagePu:lowV,highestVoltagePu:highV,lossMW:r.totalLossMW,lossMWh:r.totalLossMW*hours,violatingBusIds:violatingBuses,overloadedBranchIds:overloadedBranches,branchCurrentsA:branchCurrentA,iterations:r.iterations});
  }catch(e){if(String(e.message).startsWith('Operations study:'))throw e;failed++;rows.push({time,hours,status:'NOT_SOLVED_REVIEW_REQUIRED',loadMultiplier:loadScale,generationMultiplier:generationScale,reason:String(e.message).slice(0,300)});}
 }
 return {status:failed?'INCOMPLETE_INTERVALS_REQUIRE_REVIEW':(voltageViolationCount||overloadCount?'PLANNING_LIMIT_FLAGS':'BOUNDED_TIME_SERIES_SCREEN'),
  method:'Existing balanced steady-state AC Newton-Raphson solver run independently for each scaled-injection interval; no load switching, fault cases, tap controllers, unbalanced phases, inverter dynamics, temperature or auto-optimal dispatch.',
  summary:{intervalCount:rows.length,solvedIntervals:rows.length-failed,failedIntervals:failed,solvedHours,minimumVoltagePu:failed===rows.length?null:minimumV,maximumVoltagePu:failed===rows.length?null:maximumV,lossMWh:round(totalLossMWh),voltageFlagCount:voltageViolationCount,branchOverloadFlagCount:overloadCount,ratedBranchCount:Object.keys(ratings).length},intervals:rows,
  assumptions:['Net bus injections are signed: generation positive, consumption negative','Load multiplier applies only to originally consuming real-power buses; generation multiplier applies to exporting buses','Reactive demand/injection scales by its original sign for PQ buses','Entered planning voltage band and any documented current ratings are user-provided, not automatic code limits','Failed power-flow solves remain failed, and no invented interpolated results are presented']};
}

/** Safe read-only adapter for existing Studio projects; never mutates draft. */
export function operatingCaseFromStudio(project){
 if(!project||typeof project!=='object')bad('existing Studio project JSON required');
 const net=operatingNetworkFromStudio(project);
 const nominalBusVoltageV=Object.fromEntries((project.buses||[]).map(b=>[b.id,b.voltage]));
 return {network:net,nominalBusVoltageV,projectName:project.name||'Untitled Studio project'};
}

/** Explicit size-sensitivity evaluation of the same dispatch heuristic.
 * Financial metric is discounted customer-entered profile net grid cost plus
 * initial capex. It does not optimise operations or predict real battery life.
 */
export function compareBessSizeCases(input){
 if(!input||typeof input!=='object'||Array.isArray(input))bad('battery sizing input is required');
 const capacities=entries(input.capacityCandidatesKWh,12,'Battery capacity candidates');
 const powers=entries(input.powerCandidatesKW,12,'Inverter power candidates');
 const cycles=num(input.profileRepetitionsPerYear,'Profile repetitions per year',1,10000);
 if(!Number.isSafeInteger(cycles))bad('profile repetitions per year must be an integer');
 const years=num(input.analysisYears,'Financial analysis years',1,50);
 const discount=num(input.discountRate,'Annual discount fraction',0,0.5);
 const costKWh=num(input.batteryCostPerKWh,'Battery capital cost per kWh',0,1e9);
 const costKW=num(input.inverterCostPerKW,'Inverter capital cost per kW',0,1e9);
 const rows=entries(input.intervals,168,'Representative size-sweep profile');
 const hours=rows.reduce((s,r)=>s+num(r.hours,'Interval duration',1e-8,8760),0);
 if(hours*cycles>8784+1e-6)bad('repeated input profile exceeds one year (8784 h). Enter a valid repetition count');
 if(rows.length*cycles>10000)bad('annual input profile exceeds the 10,000-interval size sweep limit');
 const config={...input,intervals:rows,mode:input.mode??'self-consumption'};
 // Check a no-battery baseline with matching tariffs/grid limits.
 const baseline=evaluateBessDispatch({...config,capacityKWh:0,powerKW:0,minimumSocPercent:0,maximumSocPercent:100,initialSocPercent:0});
 const annuity=discount===0?years:(1-(1+discount)**-years)/discount;
 const compared=[];
 const taken=new Set();
 for(const capacityKWh of capacities){num(capacityKWh,'Candidate capacity kWh',0,1e9);
  for(const powerKW of powers){num(powerKW,'Candidate inverter kW',0,1e9);if(capacityKWh===0&&powerKW!==0)bad('zero capacity cannot have nonzero inverter power');
   const id=`${capacityKWh}/${powerKW}`;if(taken.has(id))bad('duplicate sizing candidate '+id);taken.add(id);
   let soc=config.initialSocPercent,annualNetGridCost=0,annualUnservedKWh=0,annualPvCurtailedKWh=0,annualImportKWh=0,annualExportKWh=0;
   // Annual dispatch retains SOC between profile repetitions; each day's battery
   // inventory is physically carried into the next (no fictitious daily recharge).
   for(let repeat=0;repeat<cycles;repeat++){
     const r=evaluateBessDispatch({...config,capacityKWh,powerKW,initialSocPercent:soc});
     annualNetGridCost+=r.summary.netGridCost;annualUnservedKWh+=r.summary.unservedKWh;
     annualPvCurtailedKWh+=r.summary.pvCurtailedKWh;annualImportKWh+=r.summary.gridImportKWh;
     annualExportKWh+=r.summary.gridExportKWh;soc=r.summary.finalSocPercent;
   }
   const capitalCost=capacityKWh*costKWh+powerKW*costKW;
   const discountedCost=capitalCost+annualNetGridCost*annuity;
   const fullyServed=annualUnservedKWh<1e-8;
   compared.push({capacityKWh,powerKW,status:fullyServed?'BOUNDED_DISPATCH_SCREEN':'GRID_LIMIT_INFEASIBLE_SUPPLY_SHORTFALL',supplyFullyServed:fullyServed,
     annualUnservedKWh,annualPvCurtailedKWh,annualImportKWh,annualExportKWh,
     annualNetGridCost,capitalCost,discountedLifecycleCost:discountedCost,finalSocPercent:soc,
     annualStoredEnergyChangeKWh:(soc-input.initialSocPercent)*capacityKWh/100});
  }
 }
 compared.sort((a,b)=>Number(b.supplyFullyServed)-Number(a.supplyFullyServed)||a.discountedLifecycleCost-b.discountedLifecycleCost||a.capacityKWh-b.capacityKWh||a.powerKW-b.powerKW);
 const best=compared.find(c=>c.supplyFullyServed)||null;
 return {status:best?'BOUNDED_FINANCIAL_SCREEN':'NO_FULLY_SERVED_CANDIDATE',method:'Enumerated battery capacity/inverter combinations with identical rule-based dispatch. The lowest modelled discounted cost is chosen only among cases with no unserved load; this is NOT mixed-integer optimisation, equivalence with commercial optimisation software or an equipment sizing approval.',
  summary:{candidateCount:compared.length,feasibleCount:compared.filter(x=>x.supplyFullyServed).length,profileHours:hours,profileRepetitionsPerYear:cycles,analysisYears:years,annualDiscountFraction:discount,baselineAnnualGridCost:baseline.summary.netGridCost*cycles,baselineAnnualUnservedKWh:baseline.summary.unservedKWh*cycles,bestCapacityKWh:best?.capacityKWh??null,bestPowerKW:best?.powerKW??null,bestDiscountedLifecycleCost:best?.discountedLifecycleCost??null},intervals:compared,
  assumptions:['Candidate battery capacities and inverter kW are explicit; no continuous optimisation','Same simple PV-only battery charging and peak shaving/self-consumption rule applied to every case','Representative intervals are repeated sequentially with battery SOC carried forward between repetitions; not simulated seasonality','Capex is one upfront payment; energy costs repeat each year and are discounted at the entered real annual rate','No demand charges, financing, replacement batteries, degradation, cycle limits, maintenance, taxes, reliability valuation or escalation','Annual terminal SOC may differ from starting SOC; energy inventory change is reported and should be reconciled before comparing long-run cases','Any scenario with modelled unserved demand is rejected from the feasible best-case selection']};
}
