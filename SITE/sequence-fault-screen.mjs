/* Explicit reduced-sequence-network fault-current screening.
 * 3PH / AG / BC / BCG classical symmetrical components, single equivalent
 * voltage source. Not a complete IEC 60909 implementation. All Z are complex
 * sequence Thevenin ohms referred to the fault-voltage base.
 */
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const reject=x=>{throw Error('Sequence-fault input: '+x)};
function z(obj,name){if(!obj||!finite(obj.rOhm)||!finite(obj.xOhm)||obj.rOhm<0||obj.xOhm<0||obj.rOhm>1e8||obj.xOhm>1e8)reject(name+' requires documented nonnegative R and X ohms');const out=[obj.rOhm,obj.xOhm];if(!out[0]&&!out[1])reject(name+' cannot have zero impedance');return out}
const add=(a,b)=>[a[0]+b[0],a[1]+b[1]],mul=(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]],div=(a,b)=>{const n=b[0]*b[0]+b[1]*b[1];if(n<=1e-24)reject('Singular sequence impedance network');return [(a[0]*b[0]+a[1]*b[1])/n,(a[1]*b[0]-a[0]*b[1])/n]},neg=a=>[-a[0],-a[1]];
const A=[-0.5,Math.sqrt(3)/2],A2=[-0.5,-Math.sqrt(3)/2],ZERO=[0,0];
const shape=(name,a)=>({phase:name,realA:a[0],imagA:a[1],rmsA:Math.hypot(...a)});
export function reducedSequenceFault(x){
 if(!x||typeof x!=='object'||Array.isArray(x))reject('Documented fault case required');
 const V=x.nominalLLV,c=x.voltageFactor;if(!finite(V)||V<=0||V>550000||!finite(c)||c<.5||c>1.5)reject('Positive nominalLLV and explicitly selected voltage factor required');
 const type=x.faultType;if(!['3PH','AG','BC','BCG'].includes(type))reject('Supported fault types: 3PH, AG, BC, BCG');
 const Z1=z(x.positiveSequence,'Positive sequence');let Z2=null,Z0=null;
 if(type!=='3PH')Z2=z(x.negativeSequence,'Negative sequence');
 if(['AG','BCG'].includes(type))Z0=z(x.zeroSequence,'Zero sequence');
 const Zf=x.faultImpedance===undefined?ZERO:z(x.faultImpedance,'Fault impedance');
 const Z3=mul([3,0],Zf), E=[c*V/Math.sqrt(3),0];let I1,I2=ZERO,I0=ZERO;
 if(type==='3PH')I1=div(E,add(Z1,Zf));
 else if(type==='AG')I1=I2=I0=div(E,add(add(Z1,Z2),add(Z0,Z3)));
 else if(type==='BC'){I1=div(E,add(add(Z1,Z2),Zf));I2=neg(I1)}
 else{
  const S=add(Z2,add(Z0,Z3)),U=add(Z0,Z3),share=div(mul(Z2,U),S);
  I1=div(E,add(Z1,share));I2=neg(mul(I1,div(U,S)));I0=neg(mul(I1,div(Z2,S)));
 }
 const Ia=add(add(I0,I1),I2),Ib=add(add(I0,mul(A2,I1)),mul(A,I2)),Ic=add(add(I0,mul(A,I1)),mul(A2,I2));
 const max=Math.max(Math.hypot(...Ia),Math.hypot(...Ib),Math.hypot(...Ic));
 if(max>1e9)reject('Fault current exceeds bounded numerical model; check impedance input');
 const output={status:'BOUNDED_REDUCED_SEQUENCE_NETWORK',scope:'Single-source classical symmetrical-component voltage/impedance screen for initial steady phasors. Not full IEC 60909:2026. No positive/negative/zero transformer vector group correction, shunt/motor/IBR contribution, peak/interrupting duty, relay settings, fault minimum, multiple sources or detailed earthing design.',
  voltageLLV:V,voltageFactor:c,faultType:type,sequenceA:{positive:shape('I1',I1),negative:shape('I2',I2),zero:shape('I0',I0)},
  phaseA:{a:shape('A',Ia),b:shape('B',Ib),c:shape('C',Ic)},groundResidualA:3*Math.hypot(...I0),maximumPhaseRmsA:max};
 return output;
}
