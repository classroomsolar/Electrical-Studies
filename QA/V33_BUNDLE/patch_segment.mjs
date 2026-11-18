// V33: patch a hand-wrapped bundled module. Transpiles the old and the new source, finds the changed part,
// and replaces exactly that part inside the bundle (it must occur exactly once).
// usage: node patch_segment.mjs <old source file> <new source file> <bundle file>
import fs from 'node:fs';import {factoryBody} from './rebuild.mjs';
const [oldF,newF,bundleF]=process.argv.slice(2);const a=factoryBody(fs.readFileSync(oldF,'utf8')),b=factoryBody(fs.readFileSync(newF,'utf8'));
let i=0;while(i<a.length&&a[i]===b[i])i++;let j=0;while(j<a.length-i&&j<b.length-i&&a[a.length-1-j]===b[b.length-1-j])j++;
// widen to whole lines so the anchor is unique
while(i>0&&a[i-1]!=='\n')i--;while(j>0&&a[a.length-j]!=='\n')j--;
const oldSeg=a.slice(i,a.length-j),newSeg=b.slice(i,b.length-j);let code=fs.readFileSync(bundleF,'utf8');
const n=code.split(oldSeg).length-1;if(n!==1)throw Error('old segment occurs '+n+' times in the bundle');
fs.writeFileSync(bundleF,code.replace(oldSeg,()=>newSeg));console.log('patched segment',oldSeg.length,'->',newSeg.length);
