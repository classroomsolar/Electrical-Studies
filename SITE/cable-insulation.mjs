// Distilled reference data checked against the user's NEC 2023 PDF.
// These are designation/application references, not product impedance or ratings.
export const necCableSource=Object.freeze({edition:2023,file:'NFPA 70 NEC 2023 National Fire Protection Association National Electrical Code(1).pdf',sha256:'32b90230bffea6d7790b74ea32853614b280b710563838c4fef074eb302b6bc0'});
const row=(type,dry,wet,page,material,note='',damp=dry)=>({type,dry,damp,wet,material,section:'Table 310.4(1)',page,pdfPage:Number(page.split('-')[1])+3,note});
export const cableInsulations=Object.freeze([
 row('THHN',90,null,'70-180','PVC / nylon','Dry and damp locations; THHN alone has no wet-location rating.'),
 row('THWN',75,75,'70-180','PVC / nylon'),row('THWN-2',90,90,'70-180','PVC / nylon'),
 row('THHN/THWN-2',90,90,'70-180','PVC / nylon','Both markings must appear on the installed product.'),
 row('THHW',90,75,'70-180','PVC','90 °C dry; 75 °C wet. Damp suitability requires the product listing.',null),
 row('THW',75,75,'70-180','PVC'),row('THW-2',90,90,'70-180','PVC'),row('TW',60,60,'70-180','PVC'),
 row('RHH',90,null,'70-179','Thermoset'),row('RHW',75,75,'70-179','Thermoset'),row('RHW-2',90,90,'70-179','Thermoset'),
 row('XHH',90,null,'70-181','Thermoset'),row('XHHN',90,null,'70-181','Thermoset / nylon'),
 row('XHHW',90,75,'70-181','Thermoset'),row('XHHW-2',90,90,'70-181','Thermoset'),
 row('XHWN',75,75,'70-181','Thermoset / nylon'),row('XHWN-2',90,90,'70-181','Thermoset / nylon'),
 row('USE',75,75,'70-181','Service-entrance insulation','Application restrictions: Article 338.'),
 row('USE-2',90,90,'70-181','Service-entrance insulation','Application restrictions: Article 338. Exposed PV use also requires the markings in 690.31(C)(1).'),
 row('UF',null,null,'70-180','PVC','Use the actual cable marking and Article 340; the table has conditional 60/75 °C routes.',null),
 row('MTW',90,60,'70-179','Thermoplastic','Machine-tool wiring; application restrictions and NFPA 79 apply.',null),
 row('SIS',90,null,'70-180','Thermoset','Switchboard/switchgear wiring only.',null),row('TBS',90,null,'70-180','Thermoplastic / braid','Switchboard/switchgear wiring only.',null),
 row('FEP',90,null,'70-179','Fluoropolymer','Special higher-temperature applications require the applicable listing.'),
 row('FEPB',90,null,'70-179','Fluoropolymer / braid','Special higher-temperature applications require the applicable listing.'),
 row('PFA',90,null,'70-179','Fluoropolymer','Special higher-temperature applications require the applicable listing.'),
 row('PFAH',250,null,'70-179','Fluoropolymer','Special apparatus leads only; verify table restrictions.',null),
 row('TFE',250,null,'70-180','Fluoropolymer','Special apparatus leads only; verify table restrictions.',null),
 row('SA',90,null,'70-179','Silicone','Special higher-temperature applications require the applicable listing.'),
 row('MI',90,90,'70-179','Mineral insulation','Special higher-temperature applications require the applicable listing.'),
 row('Z',90,null,'70-181','Fluoropolymer','Special higher-temperature applications require the applicable listing.'),
 row('ZW',90,75,'70-181','Fluoropolymer','Special higher-temperature applications require the applicable listing.'),row('ZW-2',90,90,'70-181','Fluoropolymer'),
 {type:'PV wire',dry:null,damp:null,wet:null,material:'Product-specific',section:'690.31(C)',page:'70-609',pdfPage:612,note:'Listed PV wire: confirm UL 4703 product voltage, temperature and application markings. Studio calculates three-phase AC faults; PV DC circuits require a DC study.'},
 {type:'DG cable',dry:null,damp:null,wet:null,material:'Product-specific',section:'690.31(C)',page:'70-609',pdfPage:612,note:'Listed distributed-generation cable: confirm UL 3003 product voltage, temperature and application markings.'},
 ...['EPR','XLPE','TR-XLPE','Other / product-defined'].map(type=>({type,dry:null,damp:null,wet:null,material:type,section:'Product listing required',page:'',pdfPage:null,note:'Enter the exact manufacturer insulation, voltage and temperature data. A material name alone is not an NEC temperature designation.'}))
]);
export const cableVoltagePresets=[300,600,1000,1500,2000,5000,8000,15000,25000,35000,46000];
export const cableCategories=[['all','All workbook cable types'],['pv','PV wire — manufacturer records'],['building','Building wire / NEC conduit references'],['lv','Other LV cables — through 2000 V'],['mv','MV / HV cables — above 2000 V']];
export function cableCategory(record){
 const type=String(record.mapped?.values?.cableType||record.row?.Family||'');
 if(/(?:^|[-\s])PV(?:$|[-\s])/i.test(type))return 'pv';
 if(record.sheet==='CABLE_IMPEDANCE_DEFAULTS'||/^(NEC|ICEA)/i.test(type))return 'building';
 return record.mapped?.values?.ratedVoltage>2000?'mv':'lv';
}
export function insulationReference(item){
 const r=item.insulationType==='__custom__'?{type:item.insulationCustomDesignation||'Custom product marking',dry:null,damp:null,wet:null,material:'User-defined product',section:'Product listing required',page:'',pdfPage:null,note:'User-supplied product designation. Use documented listing, voltage, location and temperature data; no NEC designation is assigned.'}:cableInsulations.find(r=>r.type===item.insulationType);
 if(!r)return null;
 const location=item.insulationLocation||'dry';
 const productOnly=r.section!=='Table 310.4(1)',productTemperature=typeof item.insulationProductTemp==='number'&&Number.isFinite(item.insulationProductTemp)&&item.insulationProductTemp>0?item.insulationProductTemp:null;
 return {...r,edition:2023,location,maximumTemperature:productOnly?productTemperature:r[location]??null,temperatureBasis:productOnly?'Entered product marking':'NEC designation/location reference',voltageNote:r.section==='Table 310.4(1)'?'600 V table construction; use through 1000 V only when the product is listed and marked. A 2000 V RHH/RHW construction has separate requirements in Table 310.4(2).':'Voltage is the actual listed product rating; no universal rating is assigned by this designation.'};
}
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function cableInsulationMarkup(item){
 const ref=insulationReference(item),control=(key,label,options)=>`<label class="field" for="field-${esc(item.id)}-${key}"><span>${label}</span><select id="field-${esc(item.id)}-${key}" data-item="${esc(item.id)}" data-key="${key}">${options.map(([v,label])=>`<option value="${esc(v)}" ${String(item[key]||'')===v?'selected':''}>${esc(label)}</option>`).join('')}</select></label>`;
 const customMarking=item.insulationType==='__custom__'?`<label class="field" for="field-${esc(item.id)}-insulationCustomDesignation"><span>Custom insulation marking</span><input id="field-${esc(item.id)}-insulationCustomDesignation" data-item="${esc(item.id)}" data-key="insulationCustomDesignation" type="text" maxlength="1000" value="${esc(item.insulationCustomDesignation||'')}" placeholder="Exact manufacturer / product marking"><small>Recorded as user product data. Changing the marking clears the previous product temperature; enter its documented rating.</small></label>`:'';
 const manualTemperature=item.insulationType==='__custom__'||item.customProductTemperature||item.insulationProductTemp!=null&&![60,75,90,105,125,200,250].includes(item.insulationProductTemp);
 const productControl=ref?.section!=='Table 310.4(1)'&&ref?`<label class="field" for="cable-${esc(item.id)}-product-temperature"><span>Temperature on product marking</span><select id="cable-${esc(item.id)}-product-temperature" data-cable-product-temperature="${esc(item.id)}" data-cable-item="${esc(item.id)}"><option value="">Choose documented rating</option>${[60,75,90,105,125,200,250].map(v=>`<option value="${v}" ${!manualTemperature&&item.insulationProductTemp===v?'selected':''}>${v} °C</option>`).join('')}<option value="__custom__" ${manualTemperature?'selected':''}>Custom / user input…</option></select>${manualTemperature?`<input id="field-${esc(item.id)}-insulationProductTemp" data-item="${esc(item.id)}" data-key="insulationProductTemp" type="number" step="any" inputmode="decimal" aria-label="Custom product temperature (°C)" value="${esc(item.insulationProductTemp??'')}" placeholder="Documented product temperature (°C)">`:''}<small>Enter the actual listed product/location rating. NEC 690.31 references 105/125 °C conductors; it does not assign that temperature to every PV wire.</small></label>`:'';
 return `<section class="cable-marking-fields"><h4>Installed cable insulation</h4>${control('insulationType','Insulation designation',[['','Choose actual cable marking'],...cableInsulations.map(r=>[r.type,r.type]),['__custom__','Custom / user input…']])}${customMarking}${control('insulationLocation','Installation location',[['','Choose location'],['dry','Dry'],['damp','Damp'],['wet','Wet']])}${productControl}${ref?`<div class="insulation-reference" role="status"><strong>${esc(ref.type)}${item.insulationLocation?ref.maximumTemperature!=null?' · '+ref.maximumTemperature+' °C '+esc(ref.location):' · verify '+esc(ref.location)+' application':' · choose installation location'}</strong><p>${esc(ref.material)} · ${esc(ref.note)}</p><small>Source: ${esc(ref.section==='Product listing required'?'Manufacturer / product listing':'NEC 2023 · '+ref.section+' · '+ref.page)}${ref.section!=='Table 310.4(1)'&&ref.maximumTemperature!=null?' · temperature entered from product marking':''}.</small><p>${esc(ref.voltageNote)}</p>${item.insulationLocation&&ref.maximumTemperature==null?'<p class="catalog-missing">No generic temperature is applied for this selection. Confirm the applicable product/location rating.</p>':''}</div>`:'<p>Choose the conductor marking, such as THWN-2 or RHW-2. It is separate from the R/X library and conduit material.</p>'}</section>`;
}
export function cableRatingPresetMarkup(item){return `<label class="field" for="cable-${esc(item.id)}-nameplate-rating"><span>Choose cable nameplate voltage</span><select id="cable-${esc(item.id)}-nameplate-rating" data-cable-rating-preset="${esc(item.id)}" data-cable-item="${esc(item.id)}"><option value="">Choose preset / enter custom below</option>${cableVoltagePresets.map(v=>`<option value="${v}" ${item.ratedVoltage===v?'selected':''}>${v>=5000?v/1000+' kV':v+' V'}</option>`).join('')}<option value="__custom__">Custom / user input…</option></select><small>Use the actual product rating. PV DC markings do not establish an AC rating. This selection does not change bus voltage or R/X.</small></label>`;}
