#!/usr/bin/env python3
"""Check generated HTML, local targets, source mapping and publication provenance."""
from __future__ import annotations
from html.parser import HTMLParser
import hashlib
import json
from pathlib import Path
import sys
import xml.etree.ElementTree as ET
from urllib.parse import unquote, urljoin, urlsplit

class Page(HTMLParser):
    def __init__(self):
        super().__init__();self.ids=set();self.links=[];self.duplicates=[];self.canonical=[];self.robots=[]
    def handle_starttag(self, tag, attrs):
        d=dict(attrs)
        if 'id' in d:
            if d['id'] in self.ids:self.duplicates.append(d['id'])
            self.ids.add(d['id'])
        for attr in ('href','src'):
            if attr in d:self.links.append(d[attr])
        if tag=='link' and d.get('rel')=='canonical':self.canonical.append(d.get('href'))
        if tag=='meta' and d.get('name')=='robots':self.robots.append(d.get('content',''))

def check(root: Path) -> tuple[int,int]:
    root=root.resolve();pages={};fail=[]
    for path in root.rglob('*.html'):
        doc=Page();doc.feed(path.read_text(encoding='utf-8'));pages[path]=doc
        if doc.duplicates:fail.append(f'{path.relative_to(root)}: duplicate ids {doc.duplicates}')
    mapping=json.loads((root/'page-map.json').read_text()); provenance=json.loads((root/'provenance.json').read_text())
    for route, entry in mapping.items():
        path=root/route.lstrip('/')/'index.html'
        if path not in pages:fail.append('missing mapped route '+route);continue
        doc=pages[path]
        if doc.canonical!=['https://licoarc.com'+route]:fail.append('bad canonical '+route)
        if 'content' not in doc.ids:fail.append('missing content anchor '+route)
        if provenance['preview'] and not any('noindex' in s for s in doc.robots):fail.append('preview is indexable '+route)
    for path, doc in pages.items():
        relative=path.relative_to(root).as_posix()
        base='https://licoarc.com/'+relative
        for value in doc.links:
            u=urlsplit(urljoin(base,value))
            if u.scheme not in ('http','https','mailto'):fail.append('unsafe link '+value);continue
            if u.netloc!='licoarc.com':continue
            target=root/unquote(u.path).lstrip('/')
            if u.path.endswith('/'):target=target/'index.html'
            if not target.resolve().is_relative_to(root):fail.append('escaping link '+value);continue
            if not target.exists():fail.append(relative+' -> missing '+value);continue
            if u.fragment and target in pages and unquote(u.fragment) not in pages[target].ids:
                fail.append(relative+' -> missing anchor '+value)
    for source, expected in provenance['sourceFiles'].items():
        f=root/'raw'/source
        if not f.is_file() or hashlib.sha256(f.read_bytes()).hexdigest()!=expected:fail.append('raw source mismatch '+source)
    expected_digest=hashlib.sha256(json.dumps(provenance['sourceFiles'],sort_keys=True,separators=(',',':')).encode()).hexdigest()
    if expected_digest != provenance['sourceDigest']:fail.append('source manifest digest mismatch')
    sitemap=ET.parse(root/'sitemap.xml')
    urls=[node.text for node in sitemap.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
    if sorted(urls)!=sorted('https://licoarc.com'+r for r in mapping):fail.append('sitemap/page coverage mismatch')
    redirects=json.loads((root/'redirects.json').read_text())
    for old,target in redirects.items():
        if target not in mapping or old in mapping:fail.append('invalid redirect '+old)
        p=root/old.lstrip('/')/'index.html'
        if p not in pages or pages[p].canonical!=['https://licoarc.com'+target]:fail.append('missing redirect page '+old)
    llms=(root/'llms.txt').read_text()
    for route in mapping:
        if 'https://licoarc.com'+route+')' not in llms:fail.append('missing llms entry '+route)
    search=json.loads((root/'search-index.json').read_text())
    if sorted(x['url'] for x in search)!=sorted(mapping):fail.append('search/page coverage mismatch')
    if (root/'CNAME').read_text().strip()!='licoarc.com':fail.append('CNAME changed')
    if fail:raise ValueError('\n'.join(fail[:100])+f'\n{len(fail)} publishing errors')
    return len(mapping),len(pages)

if __name__=='__main__':
    n,total=check(Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).resolve().parents[1]/'site')
    print(f'Documentation verified: {n} source pages; {total} HTML pages; links, anchors, search, provenance and raw bytes agree.')
