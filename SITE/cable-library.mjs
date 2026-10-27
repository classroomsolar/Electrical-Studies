export function decodeCableLibrary(data){
 if(data?.schema!==1||data.sheet!=='CABLES'||!Array.isArray(data.columns)||!Array.isArray(data.records)||!data.columns.includes('_row')||new Set(data.columns).size!==data.columns.length||data.columns.some(key=>typeof key!=='string'||['__proto__','prototype','constructor'].includes(key)))throw Error('Unexpected cable library contents.');
 const rows=new Set();
 const records=data.records.map(values=>{
  if(!Array.isArray(values)||values.length!==data.columns.length)throw Error('Incomplete cable library row.');
  const row=Object.fromEntries(data.columns.flatMap((key,index)=>values[index]===null?[]:[[key,values[index]]]));
  if(!Number.isInteger(row._row)||row._row<2||rows.has(row._row))throw Error('Invalid cable library row identity.');
  rows.add(row._row);return row;
 });
 return {sheet:'CABLES',workbook:data.workbook,records,compact:true};
}
