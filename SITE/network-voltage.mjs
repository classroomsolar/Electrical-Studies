// All stored voltages are SI volts. Cable insulation ratings never set bus voltage.
const positive=v=>typeof v==='number'&&Number.isFinite(v)&&v>0;
const formatter=new Intl.NumberFormat('en-US',{maximumFractionDigits:6});
export function voltageLabel(v){
 if(!positive(v))return 'Not supplied';
 const value=v>=1000?v/1000:v;
 return (value<1e-6?value.toExponential(3):formatter.format(value))+(v>=1000?' kV':' V');
}
export function voltageRatingBelow(rating,operating){
 if(!positive(rating)||!positive(operating))return false;
 // Ignore floating-point representation noise, without an engineering tolerance.
 return operating-rating>128*Number.EPSILON*Math.max(1,rating,operating);
}
export function cableVoltageDetails(project,cable){
 const from=project.buses.find(b=>b.id===cable.from),to=project.buses.find(b=>b.id===cable.to);
 const operatingVoltage=Math.max(positive(from?.voltage)?from.voltage:0,positive(to?.voltage)?to.voltage:0)||null;
 return {from,to,operatingVoltage,ratingKnown:positive(cable.ratedVoltage),busesKnown:positive(from?.voltage)&&positive(to?.voltage),differentBusVoltages:positive(from?.voltage)&&positive(to?.voltage)&&Math.abs(from.voltage-to.voltage)>1e-3,below:voltageRatingBelow(cable.ratedVoltage,operatingVoltage)};
}
export function cableVoltageMessage(project,cable){
 const check=cableVoltageDetails(project,cable);
 if(!check.below)return null;
 return cable.name+': cable insulation rating '+voltageLabel(cable.ratedVoltage)+' is below the connected bus voltage '+voltageLabel(check.operatingVoltage)+'. Check From/To assignments and bus-voltage units, or select documented cable data rated for this voltage. A transformer must connect different voltage levels.';
}
