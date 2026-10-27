import {isDcStudy,isSplitPhaseFault,usesConnectedSequences,analysisScope,analysisQuantity} from './analysis-models.mjs?v=20261022-pv-final';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=v=>Number.isFinite(v)?v.toLocaleString('en-US',{maximumFractionDigits:6}):'—';
const amps=v=>Number.isFinite(v)?(v>=1000?number(v/1000)+' kA':number(v)+' A'):'—';
const table=(headers,rows)=>'<div class="table-scroll"><table><thead><tr>'+headers.map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
export function analysisCurrentMarkup(p,r){
 if(!r||r.totalA===null)return '<p>'+esc(r?.faultNote||'Complete the explicit model inputs to calculate this fault location.')+'</p>';
 let out='<div class="math-grid"><div>'+esc(analysisQuantity(p))+'<strong>'+amps(r.totalA)+'</strong></div><div>Fault voltage basis<strong>'+number(r.faultVoltage??r.voltage)+' V</strong></div></div>';
 if(usesConnectedSequences(p))out+=table(['Phase A RMS','Phase B RMS','Phase C RMS','Ground return RMS'],[[amps(r.phaseRMSA?.a),amps(r.phaseRMSA?.b),amps(r.phaseRMSA?.c),amps(r.groundA)]])+'<p class="micro">Independent-source maximum phase magnitudes are not additive scalar totals. The solver sums complex sequence currents before evaluating each phase.</p>';
 if(isDcStudy(p))out+='<p>Signed DC current: '+number(r.signedA)+' A. This is a steady-state prospective value; peak and interrupting current are not calculated.</p>';
 return out+'<p class="model-note">'+esc(r.faultNote||analysisScope(p))+'</p>';
}
export function analysisResultsMarkup(p,results){const r=results.find(r=>r.busId===p.selectedBus),bus=id=>p.buses.find(b=>b.id===id)?.name||id;
 let out='<section class="panel"><span class="eyebrow">DOCUMENTED MODEL</span><h2>'+esc(r?.busName||'Select a fault bus')+'</h2><p>'+esc(analysisScope(p))+'</p>'+analysisCurrentMarkup(p,r)+'</section>';
 out+='<section class="panel"><h2>All bus fault levels</h2>'+table(['Fault location','Fault voltage','Current','Status'],results.map(x=>[x.busName,number(x.faultVoltage??x.voltage)+' V',amps(x.totalA),x.status]))+'</section>';
 if(r?.totalA===null||!r)return out;
 out+='<section class="panel"><h2>Independent source contributions at the fault</h2>'+table(['Source',isDcStudy(p)?'Prospective DC contribution':'Maximum fault-phase contribution'],(r.details||[]).map(d=>[d.name,amps(d.amps)]))+'</section>';
 if(r.sourceTerminalCurrents?.length)out+='<section class="panel"><h2>Actual source terminal currents</h2><p class="micro">These include circulating and passive sequence return currents. They are distinct from independent-source contributions at the fault.</p>'+table(['Source','Terminal current',...(isDcStudy(p)?['Signed current (A)']:[])],r.sourceTerminalCurrents.map(d=>[d.name||p.sources.find(s=>s.id===d.sourceId)?.name||d.sourceId,amps(d.amps),...(isDcStudy(p)?[number(d.signedA)]:[])]))+'</section>';
 out+='<section class="panel"><h2>Branch currents at the selected fault</h2>'+table(['Connection','From','From current','To','To current'],(r.branchFlows||[]).map(e=>[e.name,bus(e.from),amps(e.fromA),bus(e.to),amps(e.toA)]))+(isDcStudy(p)&&r.idealBranchCurrentsAvailable===false?'<p class="micro">Ideal-link current division is indeterminate; those link currents are omitted.</p>':'')+'</section>';
 if(isSplitPhaseFault(p))out+='<section class="panel"><h2>Separate conductor currents</h2>'+table(['Connection','Conductor','From RMS','To RMS'],(r.conductorFlows||[]).flatMap(e=>Object.entries(e.conductors).map(([leg,f])=>[e.name,leg,amps(f.fromA),amps(f.toA)])))+'</section>';
 if(usesConnectedSequences(p))out+='<section class="panel"><h2>Branch phase currents</h2>'+table(['Connection','Terminal','Phase A RMS','Phase B RMS','Phase C RMS'],(r.branchFlows||[]).flatMap(e=>['from','to'].map(side=>[e.name,bus(e[side]),...['a','b','c'].map(phase=>amps(e[side+'PhaseRMSA']?.[phase]))])))+'</section>';
 return out;
}
