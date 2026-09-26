#!/usr/bin/env node
import {readFile} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args=process.argv.slice(2);
if(args.length && (args.length!==2 || args[0]!=='--source-root')) throw Error('expected no arguments or --source-root DIRECTORY');
const pin=JSON.parse(await readFile(resolve(root,'docs/protocol-source.json'),'utf8'));
if(pin.repository!=='LicoLand/LicoArc' || !/^[0-9a-f]{40}$/.test(pin.revision) || /^0{40}$/.test(pin.revision)) throw Error('invalid immutable protocol source pin');
async function json(path){
 if(args.length) return JSON.parse(await readFile(resolve(args[1],path),'utf8'));
 const r=await fetch(`https://raw.githubusercontent.com/${pin.repository}/${pin.revision}/${path}`,{signal:AbortSignal.timeout(30000)});
 if(!r.ok) throw Error(`pinned source unavailable: ${r.status} ${path}`);
 return r.json();
}
const [bundle,manifest,requalification,targets]=await Promise.all([
 json('artifacts/v1/nostr-interop.bundle.json'),json('spec/v1/manifest.json'),
 json('formal/requalification.json'),json('spec/v1/foundation/targets.json')
]);
if(bundle.bindingId!==pin.bindingId || !bundle.sources[pin.path]) throw Error('binding identity/source mismatch');
if(manifest.generation!==1 || manifest.definitionStatus!=='PARTIAL' || manifest.sessionEligible!==false || manifest.publicationEligible!==false) throw Error('website lifecycle projection differs from pinned source');
if(requalification.status!=='required') throw Error('website proof-requalification projection is stale');
const core=targets.targets['licoarc.endpoint-core.v1'];
if(core.requiresNostr!==false || core.requiresLicoUp!==false || core.requiredCapabilities.length!==5) throw Error('website core/adapter projection is stale');
console.log('protocol source verification passed: exact binding, V1 lifecycle, proof boundary and carrier-independent core');
