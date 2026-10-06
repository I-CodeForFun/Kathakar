// Loads .env BEFORE any other server module reads process.env (store/crypt/blobs/aiconfig read it at require time).
// Legacy STORYFLOW_* variables keep working: they are copied to KATHAKAAR_* when the new name is unset.
const fs=require('fs'),path=require('path');
try{for(const l of fs.readFileSync(path.join(__dirname,'..','.env'),'utf8').split(/\r?\n/)){const m=/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/.exec(l);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^(['"])(.*)\1$/,'$2')}}catch(e){}
for(const k of Object.keys(process.env))if(k.startsWith('STORYFLOW_')&&process.env['KATHAKAAR_'+k.slice(10)]===undefined)process.env['KATHAKAAR_'+k.slice(10)]=process.env[k];
