#!/usr/bin/env node
// Kathakaar administration (run on the server; needs shell access to the data directory)
//   node server/tools/admin.js create-admin <user> [display name]   create an administrator (or promote an existing account)
//   node server/tools/admin.js set-password <user>                  set / reset a password (also signs the user out everywhere)
//   node server/tools/admin.js create-user  <user> [display name]
//   node server/tools/admin.js promote|demote <user>
//   node server/tools/admin.js list
//   node server/tools/admin.js sign-out <user>                      revoke all sessions
//   node server/tools/admin.js delete-user <user> [--purge]         remove the account (--purge also deletes their stories and images)
// Passwords are read from a hidden prompt, or from stdin when piped, or from KATHAKAAR_PASSWORD. They are never taken from the command line.
// Docker:  docker compose exec kathakaar node server/tools/admin.js create-admin yourname
require('../env');const fs=require('fs'),path=require('path'),U=require('../users');
const [cmd,rawId,...rest]=process.argv.slice(2),id=String(rawId||'').trim().toLowerCase();
const die=m=>{console.error(m);process.exit(1)};
function ask(q){return new Promise(res=>{if(process.env.KATHAKAAR_PASSWORD)return res(process.env.KATHAKAAR_PASSWORD);
 if(!process.stdin.isTTY){let d='';process.stdin.on('data',c=>d+=c).on('end',()=>res(d.split(/\r?\n/)[0]));return}
 process.stdout.write(q);const rl=require('readline').createInterface({input:process.stdin,output:process.stdout,terminal:true});rl._writeToOutput=()=>{};rl.question('',a=>{rl.close();process.stdout.write('\n');res(a)})})}
async function pw(){const a=await ask('Password: ');if(a.length<8)die('Password must be at least 8 characters.');if(process.stdin.isTTY&&!process.env.KATHAKAAR_PASSWORD){const b=await ask('Repeat password: ');if(a!==b)die('Passwords do not match.')}return a}
const exists=()=>U.accounts()[id];
(async()=>{
 if(cmd=='list'){const l=U.list();if(!l.length)console.log('(no accounts)');l.forEach(u=>console.log(u.id.padEnd(20),u.role.padEnd(8),u.name));return}
 if(!id)die('usage: admin.js create-admin|create-user|set-password|promote|demote|sign-out|delete-user|list <user>');
 if(cmd=='create-admin'||cmd=='create-user'){const role=cmd=='create-admin'?'admin':'member';
  if(exists()){if(role=='admin'){const e=U.setRole(id,'admin');if(e)die(e);console.log(id+' is now an administrator.');if(process.env.KATHAKAAR_PASSWORD||process.stdin.isTTY){}return}die('Account already exists. Use set-password.')}
  const r=U.register(id,rest.filter(x=>!x.startsWith('--')).join(' ')||id,await pw(),role,true);if(r.error)die(r.error);console.log('Created '+role+' account: '+r.id);return}
 if(cmd=='set-password'){if(!exists())die('No such account: '+id);const e=U.setPassword(id,await pw());if(e)die(e);console.log('Password updated for '+id+'. All their sessions were signed out.');return}
 if(cmd=='promote'||cmd=='demote'){const e=U.setRole(id,cmd=='promote'?'admin':'member');if(e)die(e);console.log(id+' is now '+(cmd=='promote'?'an administrator':'a member')+'.');return}
 if(cmd=='sign-out'){console.log('Revoked '+U.revokeSessions(id)+' session(s) for '+id);return}
 if(cmd=='delete-user'){if(!exists())die('No such account: '+id);const admins=U.list().filter(u=>u.role=='admin'&&u.id!=id);if(exists().role=='admin'&&!admins.length)die('Refusing to delete the last administrator.');
  U.deleteAccount(id);if(rest.includes('--purge')){const data=process.env.KATHAKAAR_DATA||path.join(__dirname,'..','..','data'),safe=id.replace(/[^\w-]/g,'_');for(const d of [path.join(data,'kv','u-'+safe),path.join(data,'blobs','u-'+safe)])fs.rmSync(d,{recursive:true,force:true})}
  console.log('Deleted '+id+(rest.includes('--purge')?' and all their data.':'. Their stories remain on disk (use --purge to remove them).'));return}
 die('Unknown command: '+cmd)})();
