// Complex sparse LU for nodal / modified-nodal network matrices. Rows are Map(column -> [re, im]).
// Pivot order: column with the fewest entries first; within it, threshold partial pivoting (|a| >= 0.1 max) preferring short rows.
// Returns solve(rhs, typed): rhs as an array of {r,i} or, with typed=true, as [Float64Array re, Float64Array im]; result [re, im].
export function sparseFactorC(rows,{tiny=1e-13,message='Singular sequence network: floating path or indeterminate ideal-link cycle.'}={}){
 const n=rows.length,cols=Array.from({length:n},()=>new Set());for(let r=0;r<n;r++)for(const c of rows[r].keys())cols[c].add(r);
 const done=new Uint8Array(n),heap=[],less=(a,b)=>a[0]<b[0]||(a[0]===b[0]&&a[1]<b[1]);
 const push=(x,k)=>{heap.push([x,k]);let c=heap.length-1;while(c>0){const q=(c-1)>>1;if(!less(heap[c],heap[q]))break;[heap[c],heap[q]]=[heap[q],heap[c]];c=q}};
 const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let c=0;for(;;){const l=2*c+1,r=l+1;let m=c;if(l<heap.length&&less(heap[l],heap[m]))m=l;if(r<heap.length&&less(heap[r],heap[m]))m=r;if(m===c)break;[heap[c],heap[m]]=[heap[m],heap[c]];c=m}}return top};
 for(let c=0;c<n;c++)push(cols[c].size,c);
 const steps=[];
 while(steps.length<n){if(!heap.length)throw Error(message);const [x,c]=pop();if(done[c]||x!==cols[c].size)continue;
  let max=0;for(const r of cols[c]){const v=rows[r].get(c);max=Math.max(max,Math.hypot(v[0],v[1]))}
  if(!(max>tiny))throw Error(message);
  let r=-1,best=Infinity,bestMag=0;for(const q of cols[c]){const v=rows[q].get(c),m=Math.hypot(v[0],v[1]);if(m<0.1*max)continue;const cnt=rows[q].size;if(cnt<best||(cnt===best&&m>bestMag)){best=cnt;bestMag=m;r=q}}
  const row=rows[r],[pr,pi]=row.get(c),pd=pr*pr+pi*pi,U=[];for(const [j,v] of row)if(j!==c)U.push(j,v[0],v[1]);
  for(const j of row.keys())cols[j].delete(r);
  const L=[];
  for(const i of cols[c]){const ri=rows[i],[ar,ai]=ri.get(c);ri.delete(c);const lr=(ar*pr+ai*pi)/pd,li=(ai*pr-ar*pi)/pd;L.push(i,lr,li);
   for(let q=0;q<U.length;q+=3){const j=U[q],ur=U[q+1],ui=U[q+2],v=ri.get(j);const dr=lr*ur-li*ui,di=lr*ui+li*ur;if(v){v[0]-=dr;v[1]-=di}else{ri.set(j,[-dr,-di]);cols[j].add(i)}}}
  cols[c].clear();done[c]=1;rows[r]=null;steps.push({r,c,pr,pi,pd,L,U});
  for(let q=0;q<U.length;q+=3)push(cols[U[q]].size,U[q]);
 }
 return (rhs,typed)=>{const br=typed?Float64Array.from(rhs[0]):new Float64Array(n),bi=typed?Float64Array.from(rhs[1]):new Float64Array(n);if(!typed)for(let k=0;k<n;k++){br[k]=rhs[k].r;bi[k]=rhs[k].i}
  for(const {r,L} of steps){const xr=br[r],xi=bi[r];if(xr===0&&xi===0)continue;for(let q=0;q<L.length;q+=3){const i=L[q],lr=L[q+1],li=L[q+2];br[i]-=lr*xr-li*xi;bi[i]-=lr*xi+li*xr}}
  const xr=new Float64Array(n),xi=new Float64Array(n);
  for(let t=steps.length-1;t>=0;t--){const {r,c,pr,pi,pd,U}=steps[t];let sr=br[r],si=bi[r];for(let q=0;q<U.length;q+=3){const j=U[q],ur=U[q+1],ui=U[q+2];sr-=ur*xr[j]-ui*xi[j];si-=ur*xi[j]+ui*xr[j]}xr[c]=(sr*pr+si*pi)/pd;xi[c]=(si*pr-sr*pi)/pd}
  return [xr,xi]};
}
