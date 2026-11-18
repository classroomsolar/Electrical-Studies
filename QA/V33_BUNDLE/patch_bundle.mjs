// V33 bundle patcher: replaces the factory of each changed module inside public-bundle-v21.js with the
// TypeScript CommonJS transpile of the new source, after proving the old factory equals the transpile of the old source.
// usage: node patch_bundle.mjs <oldSiteDir> <newSiteDir> module.mjs [module.mjs ...]
import fs from 'node:fs';import {splitBundle} from './extract.mjs';import {factoryBody} from './rebuild.mjs';
const [OLD,NEW,...names]=process.argv.slice(2);let code=fs.readFileSync(NEW+'/public-bundle-v21.js','utf8');
for(const name of names){
  const oldCode=fs.readFileSync(OLD+'/public-bundle-v21.js','utf8');
  const get=(c)=>{const {mods}=splitBundle(c);const m=mods.find(x=>x.name===name);if(!m)throw Error('not bundled: '+name);const end=m.end??c.lastIndexOf('\n}\n};\nconst cache=')+1;return {start:m.bodyStart,end,body:c.slice(m.bodyStart,end)}};
  const ob=get(oldCode),tOld=factoryBody(fs.readFileSync(OLD+'/'+name,'utf8'));
  const tail=['\n},\n','},\n','\n}\n','}\n'].find(t=>ob.body===tOld+t);
  if(tail===undefined)throw Error(name+': old factory is not a plain transpile; patch by hand');
  const cur=get(code),tNew=factoryBody(fs.readFileSync(NEW+'/'+name,'utf8'));
  code=code.slice(0,cur.start)+tNew+tail+code.slice(cur.end);console.log('patched',name,'tail',JSON.stringify(tail),ob.body.length,'->',(tNew+tail).length);
}
fs.writeFileSync(NEW+'/public-bundle-v21.js',code);
