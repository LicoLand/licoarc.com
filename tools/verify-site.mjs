import {spawnSync} from 'node:child_process';
const r=spawnSync('python3',['tools/check_site.py','site'],{stdio:'inherit'});
if(r.error) throw r.error; process.exit(r.status??1);
