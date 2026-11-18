// Transpile one SITE .mjs to the bundle factory form and compare/patch.
import fs from 'node:fs';import {createRequire} from 'node:module';import {splitBundle} from './extract.mjs';
const require=createRequire('/opt/npm-tools/node_modules/');const ts=require('typescript');
export function factoryBody(src,target){
  return ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget[target||'ES2022'],removeComments:false}}).outputText;
}
export function moduleBody(code,name){const {mods}=splitBundle(code);const m=mods.find(x=>x.name===name);if(!m)return null;
  const end=m.end??code.lastIndexOf('\n}\n};\nconst cache=')+1;return {m,body:code.slice(m.bodyStart,end)}}
if(process.argv[1].endsWith('rebuild.mjs')){
  const SITE=process.argv[2];const code=fs.readFileSync(SITE+'/public-bundle-v21.js','utf8');const {mods}=splitBundle(code);
  let same=0,diff=[];
  for(const m of mods){const f=SITE+'/'+m.name;if(!fs.existsSync(f)){diff.push(m.name+':nofile');continue}
    const {body}=moduleBody(code,m.name);const src=fs.readFileSync(f,'utf8');let ok=false;
    for(const t of ['ES2022','ESNext','ES2020','ES2021']){const out=factoryBody(src,t)+'\n},\n';const out2=factoryBody(src,t)+'\n}\n';if(body===out||body===out2){ok=t;break}}
    if(ok)same++;else{const out=factoryBody(src,'ES2022')+'\n},\n';let i=0;while(i<out.length&&out[i]===body[i])i++;diff.push(m.name+'@'+i+'/'+body.length+' '+JSON.stringify(body.slice(i,i+60))+' vs '+JSON.stringify(out.slice(i,i+60)))}
  }
  console.log('identical',same,'of',mods.length);console.log(diff.join('\n'));
}
