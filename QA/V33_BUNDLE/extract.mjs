// Split public-bundle-v21.js into header, ordered module factories, footer. Exported for reuse.
import fs from 'node:fs';
export function splitBundle(code){
  const re=/^"([^"\n]+)": function\(module,exports,require\)\{\n/gm; const marks=[];let m;
  while((m=re.exec(code)))marks.push({name:m[1],start:m.index,bodyStart:m.index+m[0].length});
  const header=code.slice(0,marks[0].start);
  const mods=[];
  for(let i=0;i<marks.length;i++){const end=i+1<marks.length?marks[i+1].start:null;mods.push({...marks[i],end})}
  return {header,mods,marks};
}
if(process.argv[1].endsWith('extract.mjs')){
  const code=fs.readFileSync(process.argv[2],'utf8');const {header,mods}=splitBundle(code);
  console.log('modules',mods.length,'header chars',header.length);
  const last=mods.at(-1);console.log('last',last.name);console.log(JSON.stringify(code.slice(mods[1].start-40,mods[1].start+60)));
  console.log('TAIL',JSON.stringify(code.slice(-700)));
}
