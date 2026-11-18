// V33 (list C4): bulk entry of operating-study bus data (net MW / Mvar, PQ or PV control, voltage setpoint, PV Q limits)
// through a CSV table. Pure functions: no page access. Nothing is filled in for the user: a blank cell leaves the stored
// value unchanged, the word "clear" empties it, and every rejected cell is reported with its row number and reason.
export const OPERATING_COLUMNS=['bus_id','bus_name','voltage_V','control','net_P_MW','net_Q_Mvar','voltage_setpoint_pu','pv_Q_min_Mvar','pv_Q_max_Mvar'];
const NUMBER_FIELDS=[['net_P_MW','pMW'],['net_Q_Mvar','qMvar'],['voltage_setpoint_pu','vSetPu'],['pv_Q_min_Mvar','qMinMvar'],['pv_Q_max_Mvar','qMaxMvar']];
const cell=v=>{let s=v==null?'':String(v);if(/^[ \t]*[=+@-]/.test(s)&&!/^-?\d+(\.\d+)?(e[+-]?\d+)?$/i.test(s))s="'"+s;return /[",\r\n]/.test(s)?'"'+s.replaceAll('"','""')+'"':s};

export function operatingCsv(project){
 const cfg=project.operatingStudy||{},buses=cfg.buses||{};
 const rows=[OPERATING_COLUMNS];
 for(const b of project.buses){const d=buses[b.id]||{},slack=b.id===cfg.slackBusId;
  rows.push([b.id,b.name,b.voltage,slack?'SLACK':(d.type||'PQ'),slack?'':d.pMW,slack?'':d.qMvar,d.vSetPu,d.qMinMvar,d.qMaxMvar])}
 return rows.map(r=>r.map(cell).join(',')).join('\r\n')+'\r\n';
}

// RFC 4180 reader: quoted cells, doubled quotes, commas and line breaks inside quotes. A semicolon file is accepted when
// the heading row has no comma (spreadsheets in some regions save it that way).
export function parseCsv(text){
 text=String(text??'').replace(/^\uFEFF/,'');const first=text.split(/\r?\n/,1)[0]||'',sep=!first.includes(',')&&first.includes(';')?';':',';
 const rows=[];let row=[],cur='',quoted=false,i=0;
 while(i<text.length){const c=text[i];
  if(quoted){if(c==='"'){if(text[i+1]==='"'){cur+='"';i+=2;continue}quoted=false;i++;continue}cur+=c;i++;continue}
  if(c==='"'&&cur===''){quoted=true;i++;continue}
  if(c===sep){row.push(cur);cur='';i++;continue}
  if(c==='\r'||c==='\n'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cur);cur='';rows.push(row);row=[];i++;continue}
  cur+=c;i++}
 if(quoted)throw Error('The file ends inside a quoted cell. Check for a missing closing quote.');
 if(cur!==''||row.length){row.push(cur);rows.push(row)}
 return {rows:rows.filter(r=>r.some(x=>x.trim()!=='')),separator:sep};
}

const plain=s=>String(s??'').trim().replace(/^'(?=[ \t]*[=+@-])/,'');
function number(raw,sep){
 let s=raw.trim();if(sep===';'&&/^-?\d+,\d+$/.test(s))s=s.replace(',','.');
 if(!/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(s))return NaN;return Number(s);
}

// Changes project.operatingStudy in place and returns what happened. Rows are matched by bus_id; a row without bus_id is
// matched by bus_name when exactly one bus has that name.
export function applyOperatingCsv(project,text){
 const {rows,separator}=parseCsv(text);if(!rows.length)throw Error('The file is empty.');
 const head=rows[0].map(h=>h.trim().replace(/^\uFEFF/,'')),col=name=>head.findIndex(h=>h.toLowerCase()===name.toLowerCase());
 if(col('bus_id')<0&&col('bus_name')<0)throw Error('The heading row needs a bus_id or bus_name column. Download the table first and keep its heading row.');
 const known=new Set(OPERATING_COLUMNS.map(c=>c.toLowerCase())),unknown=head.filter(h=>h&&!known.has(h.toLowerCase()));
 const cfg=project.operatingStudy??={buses:{},screening:{}};cfg.buses??={};
 const byId=new Map(project.buses.map(b=>[b.id,b])),byName=new Map();for(const b of project.buses){const k=b.name.trim().toLowerCase();byName.set(k,byName.has(k)?null:b)}
 const out={matched:0,changes:0,cleared:0,errors:[],unknownColumns:unknown,rows:rows.length-1,seen:new Set()};
 const get=(r,name)=>{const i=col(name);return i<0?'':(r[i]??'')};
 for(let n=1;n<rows.length;n++){const r=rows[n],line='Row '+(n+1),id=plain(get(r,'bus_id')),name=plain(get(r,'bus_name'));
  let bus=id?byId.get(id):undefined;
  if(!bus&&!id&&name){const hit=byName.get(name.toLowerCase());if(hit===null){out.errors.push(`${line}: more than one bus is named "${name}". Fill bus_id for this row.`);continue}bus=hit}
  if(!bus){out.errors.push(`${line}: no bus with ${id?'bus_id "'+id+'"':'bus_name "'+name+'"'} in this project. Row skipped.`);continue}
  if(out.seen.has(bus.id)){out.errors.push(`${line}: bus "${bus.name}" appears twice. The second row was skipped.`);continue}
  out.seen.add(bus.id);out.matched++;
  const slack=bus.id===cfg.slackBusId,control=get(r,'control').trim().toUpperCase();
  if(slack){if(control&&control!=='SLACK')out.errors.push(`${line}: "${bus.name}" is the slack bus. Its control cannot be changed in the table; choose the slack bus on the page.`);
   const rawV=get(r,'voltage_setpoint_pu').trim();if(rawV){const d=cfg.buses[bus.id]??={};if(rawV.toLowerCase()==='clear'){if(d.vSetPu!=null){d.vSetPu=null;out.cleared++}}else{const v=number(rawV,separator);if(!Number.isFinite(v)||v<0.5||v>1.5)out.errors.push(`${line}: voltage_setpoint_pu "${rawV}" must be a number from 0.5 to 1.5.`);else if(d.vSetPu!==v){d.vSetPu=v;out.changes++}}}
   continue}
  if(control==='SLACK'){out.errors.push(`${line}: "${bus.name}" is not the slack bus. Write PQ or PV; choose the slack bus on the page.`);continue}
  if(control&&control!=='PQ'&&control!=='PV'){out.errors.push(`${line}: control "${get(r,'control').trim()}" is not PQ or PV. Row skipped.`);continue}
  const d=cfg.buses[bus.id]??={};
  if(control&&(d.type||'PQ')!==control){d.type=control;out.changes++}
  for(const [column,key] of NUMBER_FIELDS){const raw=get(r,column).trim();if(raw==='')continue;
   if(raw.toLowerCase()==='clear'){if(d[key]!=null){d[key]=null;out.cleared++}continue}
   const v=number(raw,separator);
   if(!Number.isFinite(v)){out.errors.push(`${line}: ${column} "${raw}" is not a number. Cell skipped.`);continue}
   if(Math.abs(v)>1e6){out.errors.push(`${line}: ${column} ${raw} is outside ±1,000,000. Cell skipped.`);continue}
   if(key==='vSetPu'&&(v<0.5||v>1.5)){out.errors.push(`${line}: voltage_setpoint_pu ${raw} must be from 0.5 to 1.5. Cell skipped.`);continue}
   if(d[key]!==v){d[key]=v;out.changes++}}
  if(d.qMinMvar!=null&&d.qMaxMvar!=null&&d.qMinMvar>d.qMaxMvar)out.errors.push(`${line}: pv_Q_min_Mvar (${d.qMinMvar}) is above pv_Q_max_Mvar (${d.qMaxMvar}) for "${bus.name}". Both values were stored; correct one of them.`);
 }
 out.notInFile=project.buses.filter(b=>!out.seen.has(b.id)).length;delete out.seen;
 return out;
}
