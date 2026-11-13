// Browser-hosted report export. Study data and calculations reuse Studio's original report-data module.
// No cloud transmission. For construction, calculations and report fidelity require engineering review.
import {reportData} from './report-data.mjs';
import {applyReportChoice} from './report-contents.mjs';
const enc=new TextEncoder();
// Excel XML 1.0 forbids most C0 controls and unpaired UTF-16 surrogates.
// Replace prohibited code points rather than producing a ZIP with invalid worksheet XML.
const xml=v=>String(v??'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uD800-\uDFFF\uFFFE\uFFFF]/gu,'\uFFFD').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const escapePdf=v=>String(v??'').replace(/[\u2012-\u2015]/g,'-').replace(/Ω/g,'Ohm').replace(/φ/g,'phase').replace(/²/g,'^2').replace(/≤/g,'<=').replace(/≥/g,'>=').normalize('NFKD').replace(/[^\x20-\x7e]/g,'?').replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
const crcTable=Array.from({length:256},(_,i)=>{let c=i;for(let j=0;j<8;j++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
function crc32(data){let c=0xffffffff;for(let i=0;i<data.length;i++)c=crcTable[(c^data[i])&255]^(c>>>8);return (c^0xffffffff)>>>0;}
function zipStored(entries){return zipEntries(entries.map(({name,text})=>{const bytes=enc.encode(text);return {name,bytes,stored:bytes,method:0};}));}
function zipEntries(entries){
  let off=0;const all=[],cd=[];
  const u16=n=>[n&255,(n>>8)&255],u32=n=>[n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255];
  for(const {name,bytes,stored,method} of entries){
    const n=enc.encode(name),c=crc32(bytes);
    if(n.length>65535||bytes.length>200*1024*1024)throw Error('One report sheet is too large for browser export.');
    const lh=Uint8Array.from([...u32(0x04034b50),...u16(20),...u16(0x0800),...u16(method),...u16(0),...u16(0),...u32(c),...u32(stored.length),...u32(bytes.length),...u16(n.length),...u16(0)]);
    all.push(lh,n,stored);
    const ch=Uint8Array.from([...u32(0x02014b50),...u16(20),...u16(20),...u16(0x0800),...u16(method),...u16(0),...u16(0),...u32(c),...u32(stored.length),...u32(bytes.length),...u16(n.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(off)]);
    cd.push(ch,n);off+=lh.length+n.length+stored.length;
  }
  const cdSize=cd.reduce((n,x)=>n+x.length,0),cdoff=off;
  if(entries.length>65535||off+cdSize>=0xffffffff)throw Error('The browser export exceeds XLSX ZIP limits.');
  const end=Uint8Array.from([...u32(0x06054b50),...u16(0),...u16(0),...u16(entries.length),...u16(entries.length),...u32(cdSize),...u32(cdoff),...u16(0)]);
  return new Blob([...all,...cd,end],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
function excelColumn(i){let out='';do{out=String.fromCharCode(65+(i%26))+out;i=Math.floor(i/26)-1;}while(i>=0);return out;}
function worksheet(sheet){
  const rows=[sheet.headers,...sheet.rows];
  if(rows.length>100000)throw Error('Too many report rows for browser export.');
  let body='';
  for(let i=0;i<rows.length;i++){
    const cells=rows[i].map((v,j)=>{
      const r=excelColumn(j)+(i+1);
      if(typeof v==='number'&&Number.isFinite(v))return `<c r="${r}"><v>${v}</v></c>`;
      return `<c r="${r}" t="inlineStr"><is><t xml:space="preserve">${xml(v)}</t></is></c>`;
    }).join('');body+=`<row r="${i+1}">${cells}</row>`;
  }
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="15"/><sheetData>${body}</sheetData></worksheet>`;
}
const SHEET_ROWS=99999;
// A sheet longer than the per-sheet row budget continues on numbered sheets instead of failing.
function splitSheets(sheets){
  if(!sheets.some(s=>s.rows.length>SHEET_ROWS))return sheets;
  const out=[];
  for(const s of sheets){if(s.rows.length<=SHEET_ROWS){out.push(s);continue;}for(let i=0,part=1;i<s.rows.length;i+=SHEET_ROWS,part++){const tag=part===1?'':' ('+part+')';out.push({...s,name:String(s.name).slice(0,31-tag.length)+tag,rows:s.rows.slice(i,i+SHEET_ROWS)});}}
  return out;
}
export function workbookBlob(report){return zipStored(workbookEntries(report));}
// Large workbooks are deflate-compressed where the browser supports CompressionStream; small ones stay byte-identical.
const DEFLATE_FROM=8*1024*1024;
async function deflateRaw(bytes){const stream=new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));return new Uint8Array(await new Response(stream).arrayBuffer());}
export async function workbookBlobCompact(report){
  const entries=workbookEntries(report),coded=entries.map(({name,text})=>({name,bytes:enc.encode(text)}));
  const total=coded.reduce((n,e)=>n+e.bytes.length,0);
  let deflate=total>=DEFLATE_FROM&&typeof CompressionStream==='function';
  if(deflate){try{for(const e of coded){const z=await deflateRaw(e.bytes);if(z.length<e.bytes.length){e.stored=z;e.method=8;}else{e.stored=e.bytes;e.method=0;}}}catch{deflate=false;}}
  if(!deflate)for(const e of coded){e.stored=e.bytes;e.method=0;}
  return zipEntries(coded);
}
function workbookEntries(report){
  const sheets=splitSheets(report.sheets);
  const paths=sheets.map((s,i)=>({name:`xl/worksheets/sheet${i+1}.xml`,text:worksheet(s)}));
  const names=sheets.map((s,i)=>`<sheet name="${xml(s.name.replace(/[\\/?*\[\]:]/g,' ').slice(0,31))}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('');
  const relationships=sheets.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('');
  const contentTypes=sheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('');
  return ([
    {name:'[Content_Types].xml',text:`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${contentTypes}</Types>`},
    {name:'_rels/.rels',text:`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`},
    {name:'xl/workbook.xml',text:`<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${names}</sheets></workbook>`},
    {name:'xl/_rels/workbook.xml.rels',text:`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relationships}</Relationships>`},
    ...paths
  ]);
}
const PDF_LINES=118000;
function pageLines(report){
  const all=[`FAULT CURRENT STUDIO - ENGINEERING REPORT`, `BROWSER EXPORT - ENGINEERING REVIEW REQUIRED`, ''];
  const include=new Set(report.pdfSheets||['Summary','Bus results','Source contributions','Branch currents','Equipment duty','Study inputs','Assumptions & QA','PV arrays','Database screens']);
  const limit=report.pdfSheets?PDF_LINES:16000,counts=[];
  for(const sheet of report.sheets){
    if(!include.has(sheet.name))continue;
    all.push('',`===== ${sheet.name.toUpperCase()} =====`);const start=all.length;counts.push([sheet.name,0]);
    for(let i=0;i<sheet.rows.length;i++){
      const row=sheet.rows[i];const line=sheet.name==='Summary'?`${row[0]}: ${row[1]??'—'}`:row.map((v,j)=>`${sheet.headers[j]}: ${v??'—'}`).join(' | ');
      // Word-wrap engineering context without splitting ordinary words midline.
      // The original underlying XLSX/JSON values are left byte-for-byte intact.
      let remain=String(line);
      while(remain.length>99){
        const space=remain.lastIndexOf(' ',99);
        const cut=space>=35?space:99;
        all.push(remain.slice(0,cut));
        remain=remain.slice(cut).replace(/^ +/,'');
      }
      if(remain.length)all.push(remain);
      counts[counts.length-1][1]=all.length-start;
      if(all.length>limit){if(!report.pdfSheets)throw Error('PDF report is too long for browser export. Download Excel instead.');const big=counts.sort((a,b)=>b[1]-a[1]).slice(0,3).map(([n,c])=>n+' (≥'+Math.ceil(c/59)+' pages)').join(', ');throw Error('PDF report would exceed '+Math.round(limit/59)+' pages. Largest sections: '+big+'. '+(report.choice?'Untick sections or choose “Selected fault bus only” in Report contents, or download Excel.':'Download Excel instead (no row limit).'));}
    }
  }
  return all;
}
export function pdfBlob(report){
  const lines=pageLines(report),perPage=59,pages=[];
  for(let i=0;i<lines.length;i+=perPage)pages.push(lines.slice(i,i+perPage));
  if(!pages.length)pages.push(['No report data']);
  const objects=[];
  const add=s=>{objects.push(s);return objects.length;};
  const catalog=add(''),pagesNode=add(''),font=add('<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>');
  const kids=[];
  for(let i=0;i<pages.length;i++){
    const stream=pages[i].map((v,j)=>`BT /F1 8 Tf 32 ${792-j*13} Td (${escapePdf(v)}) Tj ET`).join('\n');
    const content=add(`<< /Length ${enc.encode(stream).length} >>\nstream\n${stream}\nendstream`);
    const page=add(`<< /Type /Page /Parent ${pagesNode} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${font} 0 R >> >> /Contents ${content} 0 R >>`);
    kids.push(page);
  }
  objects[catalog-1]=`<< /Type /Catalog /Pages ${pagesNode} 0 R >>`;
  objects[pagesNode-1]=`<< /Type /Pages /Kids [${kids.map(id=>`${id} 0 R`).join(' ')}] /Count ${kids.length} >>`;
  const head='%PDF-1.4\n',parts=[head],offsets=[0];let position=enc.encode(head).length;
  for(let i=0;i<objects.length;i++){
    const p=`${i+1} 0 obj\n${objects[i]}\nendobj\n`;
    offsets.push(position);position+=enc.encode(p).length;parts.push(p);
  }
  const xref=position;
  parts.push(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);
  for(const off of offsets.slice(1))parts.push(String(off).padStart(10,'0')+' 00000 n \n');
  parts.push(`trailer\n<< /Size ${offsets.length} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(parts,{type:'application/pdf'});
}
export async function browserReport(project,format,options){
  let report=reportData(project);
  if(options?.choice){const selectedName=report.results?.find(r=>r.busId===report.project?.selectedBus)?.busName||'';report=applyReportChoice(report,options.choice,{project:report.project,selectedName,studies:options.studies||[]});}
  if(report.issues.some(x=>x.severity==='error'))throw Error('Resolve engineering input errors before exporting a report.');
  if(format==='pdf')return pdfBlob(report);
  if(format==='xlsx')return options?.choice?workbookBlobCompact(report):workbookBlob(report);
  throw Error('Unsupported report format.');
}
