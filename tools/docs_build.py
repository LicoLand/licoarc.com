#!/usr/bin/env python3
"""Stage tracked protocol documentation and build it with pinned MkDocs.

Content is data: no upstream Python, macros, plugins, YAML tags or shell hooks run.
Only this repository supplies the renderer, theme and deployment configuration.
"""
from __future__ import annotations
import argparse
import fnmatch
import hashlib
import json
import os
import re
from pathlib import Path, PurePosixPath
import shutil
import subprocess
import sys
import yaml

ROOT = Path(__file__).resolve().parents[1]
GENERATED = {'reference/status.md', 'reference/sources.md', 'reference/license.md'}

def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def read_json(path: Path):
    return json.loads(path.read_text(encoding='utf-8'))

def safe_path(root: Path, name: str) -> Path:
    p = PurePosixPath(name)
    if not name or '\\' in name or p.is_absolute() or str(p) != name or any(x in ('.', '..', '.git') for x in p.parts):
        raise ValueError(f'unsafe source path: {name!r}')
    f = root / name
    if not f.resolve().is_relative_to(root.resolve()) or f.is_symlink() or any(x.is_symlink() for x in f.parents if x != root and x.is_relative_to(root)):
        raise ValueError(f'source escapes repository: {name}')
    return f

def tracked_files(root: Path) -> list[str]:
    result = subprocess.run(['git', '-C', str(root), 'ls-files', '-z'], check=True, capture_output=True)
    return sorted(set(result.stdout.decode('utf-8').rstrip('\0').split('\0')))

def nav_leaves(nav):
    for item in nav:
        if not isinstance(item, dict) or len(item) != 1:
            raise ValueError('navigation entries must have one title')
        title, value = next(iter(item.items()))
        if not isinstance(title, str) or not title.strip():
            raise ValueError('empty navigation title')
        if isinstance(value, list):
            yield from nav_leaves(value)
        elif isinstance(value, str):
            yield value
        else:
            raise ValueError('navigation target must be a source path or section')

def select_sources(root: Path, catalog: dict) -> list[str]:
    if catalog.get('format') != 'licoarc.documentation-catalog.v1':
        raise ValueError('unsupported documentation catalogue')
    if set(catalog.get('generated', [])) != GENERATED:
        raise ValueError('unknown generated documentation page')
    selected = []
    for name in tracked_files(root):
        # Fixed publication boundary, even if a catalogue pattern is overly broad.
        eligible = ('/' not in name and (name.endswith('.md') or name == 'LICENSE')) or (
            name.startswith(('docs/', 'spec/')) and name.endswith(('.md', '.json', '.cddl'))
        ) or name == 'formal/requalification.json'
        if not eligible or any(x.startswith('.') for x in PurePosixPath(name).parts):
            continue
        if name.startswith(('docs/plans/', 'docs/reports/', 'docs/references/')):
            continue
        if not any(fnmatch.fnmatchcase(name, p) for p in catalog['include']):
            continue
        if any(fnmatch.fnmatchcase(name, p) for p in catalog['exclude']):
            continue
        f = safe_path(root, name)
        if not f.is_file():
            raise ValueError(f'missing tracked source: {name}')
        selected.append(name)
    leaves = list(nav_leaves(catalog['navigation']))
    if len(leaves) != len(set(leaves)):
        raise ValueError('duplicate navigation target')
    for name in leaves:
        safe_path(root, name)
        if name not in selected and name not in GENERATED:
            raise ValueError(f'navigation target outside publication set: {name}')
    for route, name in catalog['redirects'].items():
        if not route.startswith('/') or not route.endswith('/') or '..' in route or '?' in route or '#' in route:
            raise ValueError(f'invalid legacy route: {route}')
        if name not in selected and name not in GENERATED:
            raise ValueError(f'legacy target outside publication set: {name}')
    return selected

def generated_pages(source: Path, selected: list[str]) -> dict[str, str]:
    manifest = read_json(source / 'spec/v1/manifest.json')
    targets = read_json(source / 'spec/v1/foundation/targets.json')
    rows = ['# Definition snapshot', '', 'Generated from this exact source checkout; no status is maintained in the website.', '',
            '| Property | Value |', '| --- | --- |']
    for key in ('wireId', 'generation', 'lifecycle', 'definitionStatus', 'sessionEligible', 'publicationEligible', 'protocolLineId'):
        rows.append(f'| {key} | `{json.dumps(manifest[key], ensure_ascii=False)}` |')
    rows += ['', '## Conformance targets', '']
    for key, value in targets['targets'].items():
        rows += [f'### {key}', '', *[f'- `{cap}`' for cap in value['requiredCapabilities']], '']
    rows += ['## Sources', '', '[Manifest](../spec/v1/manifest.json) · [Targets](../spec/v1/foundation/targets.json) · [Status explanation](../docs/STATUS.md)', '',
             'Document publication does not change the status of the protocol definition.']
    refs = ['# Machine-readable reference', '', 'Direct copies of the selected specification sources. Their bytes are unchanged.', '']
    for ext, label in (('.json', 'JSON schemas and registries'), ('.cddl', 'CBOR grammars')):
        refs += [f'## {label}', '']
        refs.extend(f'- [{n}](../{n})' for n in selected if n.startswith('spec/') and n.endswith(ext))
        refs.append('')
    license_text = (source/'LICENSE').read_text(encoding='utf-8')
    return {'reference/status.md': '\n'.join(rows)+'\n', 'reference/sources.md': '\n'.join(refs)+'\n',
            'reference/license.md': '# License\n\nSource: [LICENSE](../LICENSE).\n\n```text\n'+license_text+'\n```\n'}

def prepare(source: Path, revision: str, preview: bool) -> Path:
    source = source.resolve()
    if revision != 'working-tree':
        actual = subprocess.check_output(['git', '-C', str(source), 'rev-parse', 'HEAD'], text=True).strip()
        if revision != actual or not re.fullmatch(r'[0-9a-f]{40}', revision):
            raise ValueError('requested source revision differs from checkout HEAD')
        if subprocess.check_output(['git', '-C', str(source), 'status', '--porcelain', '--untracked-files=no'], text=True).strip():
            raise ValueError('pinned source checkout is dirty; use --revision working-tree for local previews')
    if not (source/'docs/catalog.json').is_file():
        raise ValueError('selected source has no docs/catalog.json; promote the companion documentation sources first')
    catalog = read_json(safe_path(source, 'docs/catalog.json'))
    selected = select_sources(source, catalog)
    build = ROOT/'.build'
    if build.exists():
        shutil.rmtree(build)
    docs = build/'docs'; docs.mkdir(parents=True)
    sources = {}
    for name in selected:
        data = safe_path(source, name).read_bytes()
        dest = docs/name;dest.parent.mkdir(parents=True, exist_ok=True);dest.write_bytes(data)
        sources[name] = digest(data)
    for name, text in generated_pages(source, selected).items():
        dest = docs/name;dest.parent.mkdir(parents=True, exist_ok=True);dest.write_text(text, encoding='utf-8')
    shutil.copytree(ROOT/'static', docs, dirs_exist_ok=True)
    model = {'revision': revision, 'preview': preview or revision == 'working-tree',
             'repository': 'LicoLand/LicoArc', 'sourceRoot': str(source),
             'catalog': catalog, 'sources': sources,
             'inputDigest': digest(json.dumps(sources, sort_keys=True, separators=(',', ':')).encode()),
             'manifest': read_json(source/'spec/v1/manifest.json')}
    (build/'model.json').write_text(json.dumps(model, ensure_ascii=False), encoding='utf-8')
    config = {'site_name': catalog['siteName'], 'site_description': catalog['description'],
              'site_url': 'https://licoarc.com/', 'repo_url': 'https://github.com/LicoLand/LicoArc',
              'docs_dir': str(docs), 'site_dir': str(ROOT/'site'), 'use_directory_urls': True,
              'theme': {'name': None, 'custom_dir': str(ROOT/'theme')},
              'nav': catalog['navigation'], 'plugins': [],
              'hooks': [str(ROOT/'tools/docs_hooks.py')],
              'markdown_extensions': ['tables', 'fenced_code', {'toc': {'permalink': True}}],
              'validation': {'nav': {'omitted_files': 'ignore', 'not_found': 'warn'},
                             'links': {'not_found': 'warn', 'anchors': 'warn', 'unrecognized_links': 'warn'}},
              'extra': {'model_path': str(build/'model.json')}}
    path = build/'mkdocs.yml';path.write_text(yaml.safe_dump(config, allow_unicode=True, sort_keys=False), encoding='utf-8')
    return path

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--revision', default='working-tree')
    parser.add_argument('--preview', action='store_true')
    parser.add_argument('--prepare-only', action='store_true')
    args = parser.parse_args()
    config = prepare(args.source, args.revision, args.preview)
    if not args.prepare_only:
        subprocess.run([sys.executable, '-m', 'mkdocs', 'build', '--strict', '--clean', '-f', str(config)], check=True)
        subprocess.run([sys.executable, str(ROOT/'tools/check_site.py'), str(ROOT/'site')], check=True)

if __name__ == '__main__':
    main()
