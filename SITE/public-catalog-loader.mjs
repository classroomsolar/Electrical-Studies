// Public deployment: recover JSON assets stored as gzip to meet hosting size limits.
// No change to calculation algorithms or project schemas.
const nativeFetch = window.fetch.bind(window);
window.fetch = async function(input, init) {
  const requested = typeof input === 'string' ? input : input instanceof URL ? input.href : input?.url;
  if (typeof requested !== 'string') return nativeFetch(input, init);
  const url = new URL(requested, location.href);
  if (url.origin !== location.origin || !url.pathname.endsWith('.json') ||
      (!url.pathname.includes('/database/') && !url.pathname.endsWith('/workbook.json'))) {
    return nativeFetch(input, init);
  }
  const response = await nativeFetch(url.href + '.txt', init);
  if (!response.ok) return response;
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const data = bytes.length > 2 && bytes[0] === 0x1f && bytes[1] === 0x8b
    ? await new Response(new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()
    : buffer;
  return new Response(data, {status:response.status, headers: {'content-type':'application/json','cache-control':'no-cache'}});
};
