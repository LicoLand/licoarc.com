"""MkDocs hooks: provenance, source links, generated discovery and legacy redirects."""
from __future__ import annotations
import fnmatch
import hashlib
from html import escape
from html.parser import HTMLParser
import json
from pathlib import Path, PurePosixPath
import posixpath
from urllib.parse import quote, unquote, urlsplit, urlunsplit
import xml.etree.ElementTree as ET
import markdown
from markdown.extensions import Extension
from markdown.treeprocessors import Treeprocessor

MODEL = {}; CURRENT = ''; SOURCE_FILES = set(); INDEX = []; PAGES = {}; URLS = {}

def sha(data): return hashlib.sha256(data).hexdigest()

def source_url(name, directory=False):
    revision = MODEL['revision'] if MODEL['revision'] != 'working-tree' else 'nightly'
    return 'https://github.com/LicoLand/LicoArc/'+('tree' if directory else 'blob')+'/'+revision+'/'+quote(name, safe='/')

class SourceLinks(Treeprocessor):
    def run(self, root):
        for el in root.iter():
            attr = 'href' if el.tag == 'a' else 'src' if el.tag == 'img' else None
            if attr is None: continue
            value = el.get(attr, '')
            url = urlsplit(value)
            if url.scheme or url.netloc:
                if url.scheme not in ('http', 'https', 'mailto') or (url.netloc and not url.scheme):
                    raise ValueError('unsupported URL scheme in '+CURRENT+': '+value)
                continue
            if not url.path or url.path.startswith('/'):
                continue
            target = posixpath.normpath(posixpath.join(posixpath.dirname(CURRENT), unquote(url.path)))
            if target.startswith('../') or target == '..':
                raise ValueError('link escapes source repository: '+CURRENT+' -> '+value)
            if target in SOURCE_FILES or target in MODEL['catalog']['generated']:
                continue
            f = (Path(MODEL['sourceRoot'])/target)
            if not f.resolve().is_relative_to(Path(MODEL['sourceRoot']).resolve()) or f.is_symlink():
                raise ValueError('unsafe source link '+value)
            if not f.exists():
                # Let MkDocs report the precise page/anchor for a missing document.
                continue
            el.set(attr, source_url(target, f.is_dir()) + ('#'+url.fragment if url.fragment else ''))
        return root

class DocumentationMarkdown(Extension):
    def extendMarkdown(self, md):
        # Content may not inject scripts or executable HTML. Code fences remain literal.
        md.preprocessors.deregister('html_block')
        md.inlinePatterns.deregister('html')
        md.treeprocessors.register(SourceLinks(md), 'source-links', 1)

class Text(HTMLParser):
    def __init__(self): super().__init__();self.text=[]
    def handle_data(self, data): self.text.append(data)

class Headings(HTMLParser):
    def __init__(self): super().__init__();self.ids=set()
    def handle_starttag(self, tag, attrs):
        d=dict(attrs)
        if 'id' in d:self.ids.add(d['id'])

def on_config(config):
    global MODEL, SOURCE_FILES, INDEX, PAGES, URLS
    MODEL=json.loads(Path(config.extra['model_path']).read_text())
    SOURCE_FILES=set(MODEL['sources']);INDEX=[];PAGES={};URLS={}
    config.markdown_extensions.append(DocumentationMarkdown())
    return config

def on_page_markdown(markdown_text, page, config, files):
    global CURRENT
    CURRENT=page.file.src_uri
    kind=next((r['kind'] for r in MODEL['catalog']['classification'] if fnmatch.fnmatchcase(CURRENT,r['pattern'])), 'Documentation')
    if CURRENT in MODEL['catalog']['generated']:kind='Generated reference'
    page.meta.update({'document_kind':kind,'source_url':source_url(CURRENT) if CURRENT in MODEL['sources'] else source_url('docs/catalog.json'),
                      'revision':MODEL['revision'], 'preview':MODEL['preview'],
                      'lifecycle':MODEL['manifest']['lifecycle'],'definition_status':MODEL['manifest']['definitionStatus'],
                      'language':'zh-CN' if CURRENT.endswith('.zh-CN.md') else 'en'})
    return markdown_text

def on_page_content(html, page, config, files):
    # Standard Markdown renderer owns parsing and heading generation; this only wraps tables.
    html=html.replace('<table>', '<div class="table-wrap"><table>').replace('</table>','</table></div>')
    text=Text();text.feed(html); plain=' '.join(' '.join(text.text).split())
    route='/'+page.url
    INDEX.append({'url':route,'title':page.title,'summary':plain[:180], 'kind':page.meta['document_kind'],
                  'search':(page.title+' '+plain).lower()})
    page.meta['description'] = plain[:180]
    ids=Headings();ids.feed(html)
    PAGES[route]={'source':page.file.src_uri,'title':page.title,'kind':page.meta['document_kind'],'anchors':sorted(ids.ids|{'content'})}
    URLS[page.file.src_uri]=route
    return html

def on_post_build(config):
    out=Path(config.site_dir)
    # Stable order, no wall-clock timestamps: identical inputs produce identical artifacts.
    index=sorted(INDEX,key=lambda x:('Decision history' in x['kind'],x['url']))
    (out/'search-index.json').write_text(json.dumps(index,ensure_ascii=False,sort_keys=True)+'\n',encoding='utf-8')
    llms=['# '+MODEL['catalog']['siteName'],'',MODEL['catalog']['description'],'',
          'Source revision: '+MODEL['revision'], 'Protocol status: '+MODEL['manifest']['lifecycle']+' / '+MODEL['manifest']['definitionStatus'],
          'Normative references define shared rules. Guides explain them; decision history does not override them.','']
    for row in index:
        source=PAGES[row['url']]['source']
        llms.append(f"- [{row['title']}](https://licoarc.com{row['url']}): {row['kind']}")
        if source in MODEL['sources']:llms.append('  Markdown: https://licoarc.com/raw/'+quote(source,safe='/'))
    (out/'llms.txt').write_text('\n'.join(llms)+'\n',encoding='utf-8')
    for name in MODEL['sources']:
        target=out/'raw'/name;target.parent.mkdir(parents=True,exist_ok=True)
        target.write_bytes((Path(MODEL['sourceRoot'])/name).read_bytes())
    ns='http://www.sitemaps.org/schemas/sitemap/0.9';ET.register_namespace('',ns)
    sitemap=ET.Element('{'+ns+'}urlset')
    for route in sorted(PAGES):
        entry=ET.SubElement(sitemap,'{'+ns+'}url');ET.SubElement(entry,'{'+ns+'}loc').text='https://licoarc.com'+route
    (out/'sitemap.xml').write_bytes(ET.tostring(sitemap,encoding='utf-8',xml_declaration=True))
    redirects={}
    for old,source in MODEL['catalog']['redirects'].items():
        target=URLS[source]
        if old in PAGES or (out/old.lstrip('/')/'index.html').exists():raise ValueError('redirect shadows a document: '+old)
        redirects[old]=target
        f=out/old.lstrip('/')/'index.html';f.parent.mkdir(parents=True,exist_ok=True)
        # A removed legacy heading falls back to the replacement document, never to an invalid fragment.
        f.write_text('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex">'
          '<meta name="viewport" content="width=device-width, initial-scale=1"><link rel="canonical" href="https://licoarc.com'+escape(target)+'">'
          '<title>Document moved — LicoArc</title></head><body><main id="content"><h1>Document moved</h1><p><a id="redirect-target" href="'+escape(target)+'">'
          'Read the current source document</a></p></main><script src="/assets/redirect.js" defer></script></body></html>\n',encoding='utf-8')
    (out/'redirects.json').write_text(json.dumps(redirects,sort_keys=True)+'\n')
    (out/'page-map.json').write_text(json.dumps(PAGES,sort_keys=True,ensure_ascii=False)+'\n',encoding='utf-8')
    renderer=Path(__file__).resolve().parents[1]
    render_inputs={str(p.relative_to(renderer)):sha(p.read_bytes()) for folder in ('tools','theme','static') for p in sorted((renderer/folder).rglob('*')) if p.is_file() and '__pycache__' not in p.parts}
    provenance={'format':'licoarc.documentation-build.v1','repository':MODEL['repository'], 'revision':MODEL['revision'],
                'preview':MODEL['preview'],'sourceDigest':MODEL['inputDigest'],'sourceFiles':MODEL['sources'],
                'rendererDigest':sha(json.dumps(render_inputs,sort_keys=True,separators=(',',':')).encode()),
                'definition':{k:MODEL['manifest'][k] for k in ('wireId','generation','lifecycle','definitionStatus','protocolLineId')},
                'builder':'MkDocs 1.6.1', 'toolchainDigest':sha((renderer/'requirements.lock').read_bytes())}
    (out/'provenance.json').write_text(json.dumps(provenance,indent=2,sort_keys=True)+'\n')
    (out/'robots.txt').write_text('User-agent: *\n'+('Disallow: /\n' if MODEL['preview'] else 'Allow: /\nSitemap: https://licoarc.com/sitemap.xml\n'))
    (out/'.nojekyll').write_text('')
