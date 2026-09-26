"""Offline publishing tests. Upstream content is data, not build-time executable code."""
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
from docs_build import safe_path, select_sources
from resolve_source import validate
from check_site import check

class SourceContractTests(unittest.TestCase):
    def test_public_and_preview_are_separate(self):
        config={'format':'licoarc.documentation-source.v1','repository':'LicoLand/LicoArc',
                'public':{'ref':'release'},'preview':{'revision':'a'*40}}
        self.assertEqual(validate(config,'public'),(None,'refs/heads/release'))
        self.assertEqual(validate(config,'preview'),('a'*40,None))
        config['preview']={'ref':'nightly'}
        with self.assertRaises(ValueError):validate(config,'preview')

    def test_bad_selectors_are_rejected(self):
        for ref in ('../main','--upload-pack=evil','https://other.example/repo','release\nrevision=bad'):
            c={'format':'licoarc.documentation-source.v1','repository':'LicoLand/LicoArc','public':{'ref':ref}}
            with self.assertRaises(ValueError):validate(c,'public')

    def test_paths_do_not_escape_or_follow_symlinks(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);(root/'real').mkdir();(root/'link').symlink_to(root/'real',target_is_directory=True)
            for path in ('../secret','/tmp/file','docs/../file','a\\b','link/file'):
                with self.assertRaises(ValueError):safe_path(root,path)

class BuildTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        root=Path(self.tmp.name);self.source=root/'protocol';self.renderer=root/'renderer'
        self.source.mkdir();self.renderer.mkdir()
        for folder in ('tools','theme','static'):
            shutil.copytree(ROOT/folder,self.renderer/folder,ignore=shutil.ignore_patterns('__pycache__'))
        shutil.copyfile(ROOT/'requirements.lock',self.renderer/'requirements.lock')
        self.write('README.md','# Example Protocol\n\nA single source.\n\n[Read guide](docs/README.md#next-step)\n')
        self.write('CONTRIBUTING.md','# Contributing\n\nOpen a documentation change.\n')
        self.write('docs/README.md','# Guide\n\n## Next step\n\n| Field | Meaning |\n| --- | --- |\n| x | Example |\n\n```json\n{"x":1}\n```\n')
        self.write('docs/STATUS.md','# Status\n\nThe manifest is the source.\n')
        self.write('LICENSE','Example permissive license\n')
        self.manifest={'wireId':'example.v1','generation':1,'lifecycle':'Candidate','definitionStatus':'PARTIAL',
                       'sessionEligible':False,'publicationEligible':False,'protocolLineId':'b'*64}
        self.write('spec/v1/manifest.json',json.dumps(self.manifest))
        self.write('spec/v1/foundation/targets.json',json.dumps({'targets':{'core':{'requiredCapabilities':['identity','messaging']}}}))
        self.catalog={'format':'licoarc.documentation-catalog.v1','siteName':'Example','description':'Example source',
                      'include':['*.md','docs/catalog.json','spec/**/*.json','LICENSE'], 'exclude':[],
                      'generated':['reference/status.md','reference/sources.md','reference/license.md'],
                      'navigation':[{'Start':[{'Overview':'README.md'},{'Guide':'docs/README.md'},{'Contribute':'CONTRIBUTING.md'},
                                  {'Status':'reference/status.md'},{'Reference':'reference/sources.md'},{'License':'reference/license.md'}]}],
                      'classification':[{'pattern':'*','kind':'Documentation'}],
                      'redirects':{'/old-guide/':'docs/README.md'}}
        self.write('docs/catalog.json',json.dumps(self.catalog))
        subprocess.run(['git','init','-q',str(self.source)],check=True)
        self.track()

    def write(self,name,text):
        p=self.source/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text,encoding='utf-8')
    def track(self):subprocess.run(['git','-C',str(self.source),'add','.'],check=True)
    def build(self,success=True):
        run=subprocess.run([sys.executable,str(self.renderer/'tools/docs_build.py'),'--source',str(self.source),'--preview'],
                           text=True,capture_output=True,timeout=40)
        if success:self.assertEqual(run.returncode,0,run.stdout+run.stderr)
        else:self.assertNotEqual(run.returncode,0,run.stdout+run.stderr)
        return run

    def test_generated_pages_links_tables_search_and_source_bytes(self):
        self.build();site=self.renderer/'site'
        html=(site/'docs/index.html').read_text()
        self.assertIn('<table>',html);self.assertIn('language-json',html)
        self.assertIn('noindex',html)
        self.assertEqual((site/'raw/README.md').read_bytes(),(self.source/'README.md').read_bytes())
        self.assertIn('docs/catalog.json',json.loads((site/'provenance.json').read_text())['sourceFiles'])
        self.assertEqual(json.loads((site/'redirects.json').read_text())['/old-guide/'],'/docs/')
        self.assertGreater(len(json.loads((site/'search-index.json').read_text())),4)

    def test_same_inputs_rebuild_identically(self):
        self.build()
        run=subprocess.run([sys.executable,str(self.renderer/'tools/check_reproducible.py'),'--source',str(self.source),'--preview'],capture_output=True,text=True,timeout=40)
        self.assertEqual(run.returncode,0,run.stdout+run.stderr)

    def test_source_edit_updates_page_search_and_status_without_html_edits(self):
        self.build();site=self.renderer/'site'
        before=json.loads((site/'provenance.json').read_text())['sourceDigest']
        self.write('docs/README.md','# Guide\n\n## Next step\n\nUnique revised document content.\n')
        self.manifest['definitionStatus']='COMPLETE';self.manifest['sessionEligible']=True
        self.write('spec/v1/manifest.json',json.dumps(self.manifest));self.track();self.build()
        self.assertIn('Unique revised document content',(site/'docs/index.html').read_text())
        self.assertIn('unique revised document content',(site/'search-index.json').read_text().lower())
        self.assertIn('COMPLETE',(site/'reference/status/index.html').read_text())
        self.assertNotEqual(before,json.loads((site/'provenance.json').read_text())['sourceDigest'])

    def test_missing_anchor_fails_build(self):
        self.write('README.md','# Bad link\n\n[Wrong](docs/README.md#not-a-heading)\n');self.track()
        self.assertIn('not-a-heading',self.build(False).stderr)

    def test_untracked_and_executable_source_are_not_published_or_run(self):
        self.write('docs/untrusted.py','raise RuntimeError("DO NOT EXECUTE")\n')
        self.write('docs/plans/private.md','# Do not publish\n');self.track()
        self.write('docs/scratch.md','# Untracked scratch\n')
        self.build();p=json.loads((self.renderer/'site/provenance.json').read_text())
        self.assertNotIn('docs/untrusted.py',p['sourceFiles'])
        self.assertNotIn('docs/plans/private.md',p['sourceFiles'])
        self.assertNotIn('docs/scratch.md',p['sourceFiles'])

    def test_raw_html_does_not_become_an_executable_script(self):
        self.write('docs/README.md','# Guide\n\n## Next step\n\n<script>alert("bad")</script>\n')
        self.track();self.build();html=(self.renderer/'site/docs/index.html').read_text()
        self.assertNotIn('<script>alert',html);self.assertIn('&lt;script&gt;',html)

    def test_unsafe_link_fails_build(self):
        self.write('docs/README.md','# Guide\n\n## Next step\n\n[bad](javascript:alert)\n');self.track()
        self.assertIn('unsupported URL scheme',self.build(False).stderr)

    def test_raw_source_tampering_is_detected(self):
        self.build();site=self.renderer/'site';(site/'raw/README.md').write_text('changed')
        with self.assertRaisesRegex(ValueError,'raw source mismatch'):check(site)

    def test_missing_navigation_and_redirect_shadow_are_rejected(self):
        self.catalog['navigation'].append({'Missing':'missing.md'})
        self.write('docs/catalog.json',json.dumps(self.catalog));self.track()
        self.assertIn('navigation target',self.build(False).stderr)
        self.catalog['navigation'].pop();self.catalog['redirects']={'/docs/':'README.md'}
        self.write('docs/catalog.json',json.dumps(self.catalog));self.track()
        self.assertIn('redirect shadows',self.build(False).stderr)

if __name__=='__main__':unittest.main()
