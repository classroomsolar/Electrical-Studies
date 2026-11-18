# Standalone Python 3 verifier for the outer ZIP. No extra dependencies.
import json,sys,zipfile,hashlib
p=sys.argv[1] if len(sys.argv)>1 else 'Fault_Current_Studio_V28_LATEST_ONLY_Complete_Transfer_2026-10-26.zip'
with zipfile.ZipFile(p) as z:
 assert z.testzip() is None,'ZIP CRC failure'
 d=json.loads(z.read('TRANSFER_MANIFEST_SHA256.json'))
 for name,e in d['files'].items():
  raw=z.read(name)
  assert len(raw)==e['bytes'] and hashlib.sha256(raw).hexdigest()==e['sha256'],name
 with zipfile.ZipFile(__import__('io').BytesIO(z.read('SITE/Fault_Current_Studio_V28_Complete_Website_236_FILES.zip'))) as s:
  assert s.testzip() is None
  m=json.loads(z.read('QA/V28_SHA256_Manifest.json'))
  assert len(m['files'])==236 and len(s.namelist())==236
  for e in m['files']:
   raw=s.read(e['path'])
   assert len(raw)==e['bytes'] and hashlib.sha256(raw).hexdigest()==e['sha256'],e['path']
print('PASS: outer ZIP hashes/CRC and all 236 V28 source-file hashes/CRC')
