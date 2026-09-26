#!/usr/bin/env python3
"""Compare two clean static builds byte-for-byte; do not compare wall-clock metadata."""
import argparse
import hashlib
from pathlib import Path
import subprocess
import sys

ROOT=Path(__file__).resolve().parents[1]
def snapshot():
    return {p.relative_to(ROOT/'site').as_posix():hashlib.sha256(p.read_bytes()).hexdigest()
            for p in (ROOT/'site').rglob('*') if p.is_file()}
if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', required=True)
    parser.add_argument('--revision', default='working-tree')
    parser.add_argument('--preview', action='store_true')
    args=parser.parse_args()
    before=snapshot()
    if not before:raise ValueError('build the site once before comparing')
    command=[sys.executable,str(ROOT/'tools/docs_build.py'),'--source',args.source,'--revision',args.revision]
    if args.preview:command+=['--preview']
    subprocess.run(command,check=True)
    after=snapshot()
    changed=sorted(k for k in before.keys()|after.keys() if before.get(k)!=after.get(k))
    if changed:raise ValueError('non-reproducible outputs: '+', '.join(changed))
    print(f'Identical clean rebuild: {len(after)} files')
