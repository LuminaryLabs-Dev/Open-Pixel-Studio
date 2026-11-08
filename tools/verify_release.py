#!/usr/bin/env python3
"""Offline structural and checksum verification for the prepared repository."""
from pathlib import Path
import hashlib, json, sys
root=Path(__file__).resolve().parents[1]
required=[
'studio/index.html','studio/app.js','studio/style.css','studio/workspace.css','studio/standalone.html',
'release/html5/index.html','release/windows/Nexus-Pixel-Studio-v0.2.0-Windows.exe',
'desktop/main.go','desktop/main_test.go','desktop/editor.html',
'media/video/Open-Pixel-Studio-60s-Workspace-Tour.mp4',
'media/images/Open-Pixel-Studio-Hero-1920x1080.png',
'examples/Five-Sprite-QA/Moss-Slime.npx',
'docs/qa/v0.2.0/workspace-qa-results.json']
issues=[]
for rel in required:
    p=root/rel
    if not p.is_file() or p.stat().st_size==0: issues.append('missing or empty: '+rel)
exe=root/'release/windows/Nexus-Pixel-Studio-v0.2.0-Windows.exe'
if exe.exists():
    digest=hashlib.sha256(exe.read_bytes()).hexdigest()
    if digest!='16336c06edb67e7ef29c33dcec08961680a839b6440627fa980942ae228027b9':issues.append('shipped exe checksum mismatch')
for rel in ['release/html5/index.html','studio/standalone.html']:
    p=root/rel
    if p.is_file() and b'<html' not in p.read_bytes().lower(): issues.append('HTML entrypoint invalid: '+rel)
if (root/'.github/workflows').exists():issues.append('unexpected GitHub Actions workflow')
print(json.dumps({'status':'PASS' if not issues else 'FAIL','files':sum(1 for p in root.rglob('*') if p.is_file()),'issues':issues},indent=2))
sys.exit(1 if issues else 0)
