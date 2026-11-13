import fs from 'node:fs';
const src=fs.readFileSync(new URL('../../../SITE/ieee1584-2018.mjs',import.meta.url),'utf8');
const m={};new Function('m',src.replace(/export /g,'').split('const log10')[0]+';m.T1=T1;m.T2=T2;m.T345=T345;m.T7=T7;')(m);
const py=JSON.parse(fs.readFileSync('pytables.json'));let n=0,bad=0;
const cmp=(a,b,l)=>{if(a.length!==b.length){bad++;console.log('len',l);return}a.forEach((x,i)=>{n++;if(x!==b[i]){bad++;console.log(l,i,x,b[i])}})};
for(const [k,v] of Object.entries(py.T1)){const [ec,vv]=k.split('|');cmp(m.T1[ec][Number(vv)],v,'T1 '+k)}
for(const [k,v] of Object.entries(py.T2))cmp(m.T2[k],v,'T2 '+k);
for(const [t,kv] of [['T3',0.6],['T4',2.7],['T5',14.3]])for(const [k,v] of Object.entries(py[t]))cmp(m.T345[kv][k],v,t+' '+k);
for(const [k,v] of Object.entries(py.T7)){const [ty,ec]=k.split('|');cmp(m.T7[ty][ec],v,'T7 '+k)}
console.log('coefficients compared',n,'mismatches',bad);
