// B-C-ground, ABC rotation: B and C share one fault impedance to ground.
// Z2/Z0 are bus equivalents; this does not construct connected sequence networks.
const C=(r=0,i=0)=>({r,i}),add=(a,b)=>C(a.r+b.r,a.i+b.i),mul=(a,b)=>C(a.r*b.r-a.i*b.i,a.r*b.i+a.i*b.r),scale=(a,k)=>C(a.r*k,a.i*k);
const finite=z=>Number.isFinite(z?.r)&&Number.isFinite(z?.i);
const divide=(a,b)=>{
 if(!finite(a)||!finite(b))throw Error('DLG calculation exceeds numerical range. Check sequence data and units.');
 const m=Math.max(Math.abs(b.r),Math.abs(b.i));if(m===0)throw Error('DLG sequence model has zero impedance.');
 const br=b.r/m,bi=b.i/m,d=br*br+bi*bi,result=C(((a.r/m)*br+(a.i/m)*bi)/d,((a.i/m)*br-(a.r/m)*bi)/d);
 if(!finite(result))throw Error('DLG calculation exceeds numerical range. Check sequence data and units.');return result;
};
export function calculateDlg({z1,z2,z0,faultZ,referenceVoltage}){
 const zg=add(z0,scale(faultZ,3)),sum=add(z2,zg),negativeRatio=divide(zg,sum),zeroRatio=divide(z2,sum);
 const i1=divide(referenceVoltage,add(z1,mul(z2,negativeRatio))),i2=scale(mul(i1,negativeRatio),-1),i0=scale(mul(i1,zeroRatio),-1);
 const a=C(-.5,Math.sqrt(3)/2),a2=C(-.5,-Math.sqrt(3)/2);
 const phaseCurrents={a:C(),b:add(i0,add(mul(a2,i1),mul(a,i2))),c:add(i0,add(mul(a,i1),mul(a2,i2)))};
 const groundPhasor=scale(i0,3),groundA=Math.hypot(groundPhasor.r,groundPhasor.i);
 const phaseRMSA=Object.fromEntries(Object.entries(phaseCurrents).map(([key,z])=>[key,Math.hypot(z.r,z.i)])),totalA=Math.max(...Object.values(phaseRMSA));
 if(![i0,i1,i2,groundPhasor,...Object.values(phaseCurrents)].every(finite)||![groundA,totalA,...Object.values(phaseRMSA)].every(Number.isFinite))throw Error('DLG calculation exceeds numerical range. Check sequence data and units.');
 return{phaseCurrents,phaseRMSA,groundPhasor,groundA,totalA,sequenceCurrents:{i0,i1,i2}};
}
