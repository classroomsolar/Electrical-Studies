const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function validateReportBlob(blob,format){
 const pdf=format==='pdf',mime=pdf?'application/pdf':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
 const bytes=new Uint8Array(await blob.slice(0,8).arrayBuffer()),signature=pdf?new TextDecoder().decode(bytes).startsWith('%PDF-'):bytes[0]===80&&bytes[1]===75&&bytes[2]===3&&bytes[3]===4;
 if(blob.type.split(';')[0].toLowerCase()!==mime||!signature)throw Error((pdf?'PDF':'Excel')+' report was not received. Refresh private access and try again.');
 return blob;
}
const browserAction=url=>url?`<a href="${esc(url)}" target="_blank" rel="noopener">Open this study in browser</a>`:'<button data-action="open-browser">Open this study in browser</button>';
const addressField=(url,kind)=>`<label class="browser-address">${kind==='report'?'Report address':'Study address'}<input type="url" readonly data-${kind==='report'?'report':'browser'}-copy-url value="${esc(url)}" aria-label="${kind==='report'?'Report':'Study'} address to copy into your browser"></label><button data-action="copy-${kind==='report'?'report':'browser'}-url">Copy address</button>`;
export function browserHandoffMarkup(state){
 if(!state)return '';
 const close='<button data-action="close-browser-handoff" aria-label="Close browser address">× Close</button>';
 if(state.phase==='preparing')return `<section class="report-download-panel no-print" data-browser-handoff role="status"><div><strong>Saving this study for your browser…</strong><p>Keeping the current equipment, connections and inputs. If a new tab opens, it will load when saving finishes.</p></div>${close}</section>`;
 if(state.phase==='error')return `<section class="report-download-panel no-print error" data-browser-handoff role="alert"><div><strong>Browser address could not be prepared</strong><p>${esc(state.message)}</p><button data-action="open-browser">Retry</button></div>${close}</section>`;
 return `<section class="report-download-panel no-print" data-browser-handoff role="status"><div><strong>This study is ready for your browser</strong><p>Check the browser tab requested by your click. If no tab appeared, use the link below or copy its address into your browser address bar. Your private saved revision ${esc(state.revision)} opens with the same inputs. Use the same authorized ChatGPT account if sign-in is requested.</p><div class="actions">${browserAction(state.url)}</div>${addressField(state.url,'browser')}</div>${close}</section>`;
}
// handoff=false: no saved-study browser address can be made on this host (no cloud), so the option is not offered.
export function reportDownloadMarkup(state,{pending=false,embedded=false,handoff=true}={}){
 if(!state)return '';
 const browserLink=state.browserUrl||handoff?browserAction(state.browserUrl):'';
 const title=state.format==='pdf'?'PDF':'Excel',close='<button data-action="close-report-download" aria-label="Close report download">× Close</button>';
 if(state.phase==='print-preview')return `<section class="report-download-panel no-print" data-report-download role="status"><div><strong>Print current study</strong><p>Printing uses the current calculated report. PDF and Excel downloads are also available.</p><div class="actions"><button data-action="print-ready" ${pending?'disabled':''}>${pending?'Updating print preview…':'Print current report'}</button><button data-action="pdf">Download PDF</button><button data-action="xlsx">Download Excel</button>${browserLink}</div></div>${close}</section>`;
 if(state.phase==='preparing')return `<section class="report-download-panel no-print" data-report-download role="status"><div><strong>Preparing ${title} report…</strong><p>Using the current study inputs. You can continue working.</p></div>${close}</section>`;
 if(state.phase==='error')return `<section class="report-download-panel no-print error" data-report-download role="alert"><div><strong>Report could not be prepared</strong><p>${esc(state.message)}</p><div class="actions"><button data-action="${state.print?'print':state.format}">Retry ${title}</button>${browserLink}</div></div>${close}</section>`;
 const url=state.directUrl||state.url,inlineDirect=state.directUrl?state.directUrl+'&display=inline':null;
 const pdfView=state.print&&embedded&&state.url?state.url:inlineDirect||state.url;
 const copyUrl=state.directUrl&&(state.print&&state.format==='pdf'?inlineDirect:state.directUrl);
 return `<section class="report-download-panel no-print" data-report-download role="status"><div><strong>${title} ready · ${esc(state.name)}</strong><p>${esc(state.message||'If the automatic download did not start, use the file link below.')}</p>${embedded?(state.print?'<p>Check the PDF tab requested by Print. Use the PDF viewer’s Print button or Ctrl+P there. If no tab appeared, use Open PDF below. ChatGPT may block new tabs and file delivery.</p>':'<p>The ChatGPT embedded view may block downloads. Open the file in your browser. If the link is blocked, copy the report address below into the browser address bar.</p>'):''}<div class="actions"><a class="button primary" href="${esc(url)}" download="${esc(state.name)}" target="_blank" rel="noopener">Download ${title}</a>${state.format==='pdf'?`<a class="button" href="${esc(pdfView)}" target="_blank" rel="noopener">Open PDF to view / print</a>`:''}${state.print&&!embedded?`<button data-action="print-ready" ${pending?'disabled':''}>${pending?'Updating print preview…':'Print current report'}</button>`:''}${browserLink}</div>${copyUrl?addressField(copyUrl,'report'):''}<small>Report uses the inputs captured when you requested it.${state.revision?' Private saved revision '+esc(state.revision)+'.':''}</small></div>${close}</section>`;
}
