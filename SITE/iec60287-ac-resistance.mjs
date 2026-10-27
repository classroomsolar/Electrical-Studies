/** IEC 60287-1-1:2023 conductor AC resistance preparatory calculation.
 * Inputs: independently verified R20/alpha/geometry/ks/kp. Does not derive
 * thermal or conductor-type correction factors and is NOT an ampacity rating.
 */
const valid = (n,lo,hi,k)=>{if(typeof n!=='number'||!Number.isFinite(n)||n<lo||n>hi)throw Error(k+' must be a documented finite value between '+lo+' and '+hi);return n};
export function conductorACResistanceIEC60287(x){
 if(!x||typeof x!=='object'||Array.isArray(x))throw Error('Provide conductor specifications');
 const R20=valid(x.r20OhmPerM,1e-11,100,'r20OhmPerM');
 const alpha=valid(x.alpha20PerC,0,0.02,'alpha20PerC');
 const theta=valid(x.operatingConductorC,-50,300,'operatingConductorC');
 const f=valid(x.frequencyHz,1,400,'frequencyHz');
 const ks=valid(x.skinFactorKS,0,3,'skinFactorKS');
 const kp=valid(x.proximityFactorKP,0,3,'proximityFactorKP');
 const dc=valid(x.conductorDiameterMM,0.01,1000,'conductorDiameterMM');
 const spacing=valid(x.axisSpacingMM,dc,100000,'axisSpacingMM');
 const geometry=x.geometry;
 if(geometry!=='three-core'&&geometry!=='two-single-core')throw Error('Geometry must be three-core or two-single-core; do not assume trefoil equivalence');
 const Rdc=R20*(1+alpha*(theta-20));
 if(!(Rdc>0))throw Error('Operating-temperature DC resistance is not positive');
 const xs2=8*Math.PI*f*1e-7*ks/Rdc;
 const xp2=8*Math.PI*f*1e-7*kp/Rdc;
 const xs=Math.sqrt(xs2),xp4=xp2*xp2;
 let skin;
 if(xs<=2.8){const xs4=xs2*xs2;skin=xs4/(192+0.8*xs4);}
 else if(xs<=3.8){skin=-0.136-0.0177*xs+0.0563*xs*xs;}
 else skin=0.354*xs-0.733;
 const xpCore=xp4/(192+0.8*xp4);
 const ratio=dc/spacing;
 const proximity=geometry==='three-core'
  ? xpCore*ratio*ratio*(0.312*ratio*ratio+1.18/(xpCore+0.27))
  : 2.9*xpCore*ratio*ratio;
 const rac=Rdc*(1+skin+proximity);
 if(!Number.isFinite(rac)||rac<Rdc||skin<0||proximity<0)throw Error('Nonphysical resistance result. Review conductor frequency and geometry.');
 return {status:'IEC60287_1_1_2023_CONDUCTOR_AC_RESISTANCE_COMPONENT',scope:'AC resistance only. k_s and k_p and conductor arrangements must be verified from cable construction.',
  dcAtOperatingTempOhmPerM:Rdc,skinFactor:skin,proximityFactor:proximity,skinParameterXs:xs,acResistanceOhmPerM:rac,
  acToDcRatio:rac/Rdc,extraACLossPercent:100*(skin+proximity),geometry,
  notIncluded:['Undocumented k_s/k_p / strand type interpolation','Sheath and armour circulating losses','Installation thermal resistances and grouping','IEC 60287 complete ampacity approval']};
}
