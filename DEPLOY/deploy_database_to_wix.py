#!/usr/bin/env python3
"""
Upload the V29d database update (engineering master database v13) to the SAME Wix site.

Why this script: the database update is ~10 MB of compressed files. The assistant could deploy the
code changes directly, but could not move 10 MB of binary files through its Wix connection.

What it does (Python 3 standard library only):
 1. Downloads the CURRENT live site files from Wix (nothing is changed yet).
 2. Checks that the live code files match this package (so nothing newer is overwritten).
 3. Replaces only the database files, database-reference-tables.mjs and public-bundle-v21.js
    with the versions in this package; every other live file is kept exactly as it is.
 4. Uploads the complete merged file set to the same site (Wix "drop"), then downloads it again
    and checks every SHA-256.

Run from the package root (the folder that has SITE/ and DEPLOY/):
    npx @wix/cli@latest login            (once, approve in the browser)
    python3 DEPLOY/deploy_database_to_wix.py              (dry run: shows what would change)
    python3 DEPLOY/deploy_database_to_wix.py --apply      (uploads)
The Wix CLI token lasts about 15 minutes; the script asks the CLI for a fresh one.
"""
import hashlib, io, json, os, subprocess, sys, urllib.request, uuid, zipfile

SITE_ID = '97613ac8-1f7d-4ecf-8fa4-2d589c387775'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOCAL = os.path.join(ROOT, 'SITE')
DOWNLOAD = f'https://www.wix.com/_api/wixstro-deployments/v1/instant-sites/{SITE_ID}/download.zip'
DROP = f'https://www.wixapis.com/headless-business-setup/v1/headless-business/{SITE_ID}/drop?campaign=mcp&agent=fault-current-studio-db-deploy'
UPDATE_PREFIXES = ('database/',)
UPDATE_FILES = {'database-reference-tables.mjs', 'public-bundle-v21.js'}
SKIP = {'wix.config.json'}

def sha(b): return hashlib.sha256(b).hexdigest()

def token():
    t = os.environ.get('WIX_TOKEN')
    if t: return t.strip()
    npx = 'npx.cmd' if os.name == 'nt' else 'npx'
    out = subprocess.run([npx, '@wix/cli@latest', 'token'], capture_output=True, text=True)
    t = (out.stdout or '').strip().splitlines()[-1:] if out.returncode == 0 else []
    if not t: sys.exit('Could not get a Wix token. Run "npx @wix/cli@latest login" first, or set WIX_TOKEN.\n' + (out.stderr or ''))
    return t[0].strip()

def http(url, tok, data=None, ctype=None):
    req = urllib.request.Request(url, data=data, method='POST' if data is not None else 'GET')
    req.add_header('Authorization', 'Bearer ' + tok)
    if ctype: req.add_header('Content-Type', ctype)
    with urllib.request.urlopen(req, timeout=300) as r: return r.status, r.read()

def live_files(tok):
    st, body = http(DOWNLOAD, tok)
    if st != 200: sys.exit(f'Download failed: HTTP {st}')
    z = zipfile.ZipFile(io.BytesIO(body))
    return {n: z.read(n) for n in z.namelist() if not n.endswith('/') and n not in SKIP}

def local_files():
    out = {}
    for d, _, fs in os.walk(LOCAL):
        for f in fs:
            p = os.path.join(d, f); out[os.path.relpath(p, LOCAL).replace(os.sep, '/')] = open(p, 'rb').read()
    return out

def is_update(path): return path.startswith(UPDATE_PREFIXES) or path in UPDATE_FILES

def strip_wix_tag(b):
    s = b.decode('utf-8', 'replace'); i = s.find('<script id="wix-site-script"')
    if i < 0: return b
    j = s.find('</script>', i) + len('</script>')
    while j < len(s) and s[j] in ' \t\r\n': j += 1
    return (s[:i] + s[j:]).encode('utf-8')

def plan(live, local):
    problems, merged, changes = [], dict(live), []
    for p, b in local.items():
        if is_update(p):
            if live.get(p) != b: changes.append(p)
            merged[p] = b
        else:
            lb = live.get(p)
            if lb is None: problems.append(f'missing on live site: {p}')
            elif (strip_wix_tag(lb) if p == 'index.html' else lb) != b: problems.append(f'live differs from package (not overwritten): {p}')
            else: merged[p] = b  # identical content; use the package copy (index.html without the Wix-injected tag)
    extra = sorted(set(live) - set(local))
    return problems, merged, changes, extra

def multipart(files):
    boundary = '----fcs' + uuid.uuid4().hex
    out = io.BytesIO()
    for p, b in sorted(files.items()):
        out.write(f'--{boundary}\r\nContent-Disposition: form-data; name="files"; filename="{p}"\r\nContent-Type: application/octet-stream\r\n\r\n'.encode())
        out.write(b); out.write(b'\r\n')
    out.write(f'--{boundary}--\r\n'.encode())
    return out.getvalue(), 'multipart/form-data; boundary=' + boundary

def main():
    apply = '--apply' in sys.argv
    tok = token()
    print('Reading the live site …'); live = live_files(tok); local = local_files()
    problems, merged, changes, extra = plan(live, local)
    print(f'live files: {len(live)}, package files: {len(local)}, database files to update: {len(changes)}')
    if extra: print('kept as-is (only on live site):', ', '.join(extra))
    if problems:
        print('\nSTOP — the live site does not match this package:'); [print('  -', x) for x in problems]
        print('Nothing was uploaded. Ask the assistant to re-check the site first.'); sys.exit(2)
    total = sum(len(b) for b in merged.values()); print(f'merged site size: {total/1048576:.2f} MiB (Wix limit 20 MiB)')
    if total > 20 * 1048576: sys.exit('Too large for Wix; nothing uploaded.')
    if not apply: print('\nDry run only. Re-run with --apply to upload.'); return
    body, ctype = multipart(merged)
    tok = token(); st, resp = http(DROP, tok, body, ctype); print('upload:', st, resp[:300].decode('utf-8', 'replace'))
    if st != 200: sys.exit('Upload failed.')
    print('Verifying …'); after = live_files(token()); bad = []
    for p, b in merged.items():
        a = after.get(p)
        if a is None or (strip_wix_tag(a) if p == 'index.html' else a) != (strip_wix_tag(b) if p == 'index.html' else b): bad.append(p)
    print('VERIFIED: every file matches.' if not bad else f'MISMATCH in {len(bad)} files: {bad[:10]}')
    sys.exit(1 if bad else 0)

if __name__ == '__main__': main()
