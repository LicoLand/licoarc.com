#!/usr/bin/env python3
"""Resolve a configured source once. Publishing and review never share a mutable selector."""
import argparse
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHA = re.compile(r'^[0-9a-f]{40}$')

def validate(config, mode):
    if config.get('format') != 'licoarc.documentation-source.v1' or config.get('repository') != 'LicoLand/LicoArc':
        raise ValueError('unexpected source repository/configuration')
    selected = config[mode]
    if 'revision' in selected:
        if not SHA.fullmatch(selected['revision']):
            raise ValueError('revision must be an immutable commit SHA')
        return selected['revision'], None
    ref = selected.get('ref', '')
    if mode != 'public' or not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9/_-]*', ref):
        raise ValueError('preview must be pinned; public branch must be an explicit safe ref')
    return None, 'refs/heads/'+ref

def resolve(config, mode):
    revision, ref = validate(config, mode)
    if revision is not None:
        return revision
    output = subprocess.check_output(['git', 'ls-remote', '--exit-code',
        'https://github.com/LicoLand/LicoArc.git', ref], text=True, timeout=60)
    matches = [line.split()[0] for line in output.splitlines() if line.split()[1] == ref]
    if len(matches) != 1 or not SHA.fullmatch(matches[0]):
        raise ValueError('source branch did not resolve to one commit')
    return matches[0]

if __name__ == '__main__':
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--mode', choices=['public','preview'], required=True)
    ap.add_argument('--output', type=Path)
    args=ap.parse_args()
    revision=resolve(json.loads((ROOT/'docs/protocol-source.json').read_text()), args.mode)
    print(revision)
    if args.output:
        with args.output.open('a', encoding='utf-8') as f:
            f.write('revision='+revision+'\n')
