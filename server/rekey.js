// node server/rekey.js  — re-encrypt all kv files (including per-user folders): OLD_KEY (or plaintext if unset) -> KATHAKAAR_KEY (or plaintext if unset)
require('./env');const fs=require('fs'),path=require('path'),C=require('./crypt'),store=require('./store');
const oldK=C.load(process.env.OLD_KEY),newK=C.keyFrom(process.env);let n=0;
(function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith('.json')){const pl=C.dec(fs.readFileSync(p),oldK);fs.writeFileSync(p+'.tmp',newK?C.enc(pl,newK):pl);fs.renameSync(p+'.tmp',p);n++}}})(store.DIR);
console.log('re-keyed',n,'files');
