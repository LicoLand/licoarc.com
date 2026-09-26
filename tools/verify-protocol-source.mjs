import {readFileSync} from 'node:fs';
const p=JSON.parse(readFileSync('site/provenance.json'));
if(p.repository!=='LicoLand/LicoArc'||!p.sourceDigest||!p.definition) throw Error('missing source provenance');
console.log('Generated source provenance:',p.revision,p.sourceDigest);
