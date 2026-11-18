// V33: patch a hand-edited bundled module hunk by hunk. Transpiles old and new source, and for every changed block of lines
// replaces exactly that block (plus as many neighbour lines as needed to make it unique) inside the bundle.
// usage: node patch_hunks.mjs <old source> <new source> <bundle file>
import fs from 'node:fs';import {factoryBody} from './rebuild.mjs';
const [oldF,newF,bundleF]=process.argv.slice(2);const a=factoryBody(fs.readFileSync(oldF,'utf8')).split('\n'),b=factoryBody(fs.readFileSync(newF,'utf8')).split('\n');
// longest common subsequence on lines
const n=a.length,m=b.length,L=Array.from({length:n+1},()=>new Uint16Array(m+1));
for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)L[i][j]=a[i]===b[j]?L[i+1][j+1]+1:Math.max(L[i+1][j],L[i][j+1]);
const hunks=[];let i=0,j=0,cur=null;
while(i<n||j<m){if(i<n&&j<m&&a[i]===b[j]){cur=null;i++;j++;continue}if(!cur){cur={i0:i,i1:i,j0:j,j1:j};hunks.push(cur)}if(j<m&&(i>=n||L[i][j+1]>=L[i+1][j])){j++;cur.j1=j}else{i++;cur.i1=i}}
let code=fs.readFileSync(bundleF,'utf8');
for(const h of hunks.reverse()){let lo=h.i0,hi=h.i1;for(;;){const f=a.slice(lo,hi).join('\n');const c=f?code.split(f).length-1:0;if(c===1){code=code.replace(f,()=>[...a.slice(lo,h.i0),...b.slice(h.j0,h.j1),...a.slice(h.i1,hi)].join('\n'));break}if(c===0&&f)throw Error('block not in bundle near old line '+h.i0);if(lo===0&&hi===n)throw Error('cannot make block unique');if(lo>0)lo--;if(hi<n)hi++}}
fs.writeFileSync(bundleF,code);console.log('patched',hunks.length,'blocks');
