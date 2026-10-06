// node server/tools/adduser.js <id> [name] [role]       — legacy: creates a user + prints a long-lived token ONCE (only its hash is stored)
// KATHAKAAR_PASSWORD=... node server/tools/adduser.js <id> [name] [role]  — creates a password account (log in from the app)
const fs=require('fs'),path=require('path'),crypto=require('crypto'),U=require('../users');
const [id,name,role]=process.argv.slice(2);if(!id){console.error('usage: adduser.js <id> [name] [role]');process.exit(1)}
if(process.env.KATHAKAAR_PASSWORD){const r=U.register(id,name,process.env.KATHAKAAR_PASSWORD,role);if(r.error){console.error(r.error);process.exit(1)}console.log('account created: '+r.id+' ('+r.role+')')}
else{let j={};try{j=JSON.parse(fs.readFileSync(U.FILE,'utf8'))}catch(e){}
 const token=crypto.randomBytes(24).toString('hex');j[U.sha(token)]={id,name:name||id,role:role||'member'};U.atomic(U.FILE,j);console.log('token for '+id+': '+token)}
