// Multi-user mode. Files in data/:
//   users.json    sha256(session token) -> {id,name,role,exp?}   (plain tokens are never stored)
//   accounts.json id -> {name,role,salt,hash}                    (scrypt password hashes)
//   acl.json      "<owner>/<storyKey>" -> {members:{userId:'editor'|'reader'}}
// Enabled by KATHAKAAR_MULTIUSER=1, or automatically once users.json / accounts.json exists (and stays enabled: fail-closed).
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const DATA=process.env.KATHAKAAR_DATA||path.join(__dirname,'..','data'),FILE=process.env.KATHAKAAR_USERS_FILE||path.join(DATA,'users.json'),ACC=path.join(DATA,'accounts.json'),ACL=path.join(DATA,'acl.json'),AUDIT=path.join(DATA,'audit.log');
const SESSION_MS=(+process.env.KATHAKAAR_SESSION_DAYS||30)*864e5,sha=t=>crypto.createHash('sha256').update(String(t)).digest('hex');
const atomic=(f,o)=>{fs.mkdirSync(path.dirname(f),{recursive:true});const t=f+'.'+process.pid+'.tmp';fs.writeFileSync(t,JSON.stringify(o,null,1),{mode:0o600});fs.renameSync(t,f)};
// mtime-cached JSON reader; a corrupt/partial file keeps the last good copy instead of silently turning auth off
const cached=f=>{let c=null,mt=0;return()=>{try{const st=fs.statSync(f);if(!c||st.mtimeMs!==mt){c=JSON.parse(fs.readFileSync(f,'utf8'));mt=st.mtimeMs}}catch(e){if(e.code=='ENOENT'){c=null}}return c}};
const rdUsers=cached(FILE),rdAcc=cached(ACC),rdAcl=cached(ACL);
let sticky=process.env.KATHAKAAR_MULTIUSER=='1';
const enabled=()=>{if(sticky)return true;if(fs.existsSync(FILE)||fs.existsSync(ACC))sticky=true;return sticky};
const cleanId=s=>String(s).replace(/[^\w-]/g,'_');
function find(token){if(!enabled()||!token)return null;const u=rdUsers()||{},e=u[sha(token)];if(!e||(e.exp&&e.exp<Date.now()))return null;return{id:cleanId(e.id),name:e.name||e.id,role:e.role||'member'}}
// ---- accounts (username + password)
const ID_RE=/^[a-z0-9][a-z0-9_-]{2,31}$/,hashPw=(pw,salt)=>crypto.scryptSync(String(pw),salt,64,{N:16384,r:8,p:1}).toString('hex');
const accounts=()=>rdAcc()||{},hasAccounts=()=>Object.keys(accounts()).length>0;
const userExists=id=>{id=String(id);if(accounts()[id])return true;const u=rdUsers()||{};return Object.values(u).some(e=>e&&cleanId(e.id)==id)};
const RESERVED=['admin','administrator','root','system','support','kathakaar','moderator','staff','null','undefined','api'];
function register(id,name,pw,role,trusted){id=String(id||'').trim().toLowerCase();if(!ID_RE.test(id))return{error:'Username must be 3–32 characters: letters, digits, "_" or "-" (start with a letter or digit).'};
 if(!trusted&&RESERVED.includes(id))return{error:'That username is reserved.'};
 if(String(pw||'').length<8||String(pw).length>200)return{error:'Password must be at least 8 characters.'};if(userExists(id))return{error:'That username is taken.'};
 const a=accounts(),first=!Object.keys(a).length,salt=crypto.randomBytes(16).toString('hex');
 a[id]={name:String(name||id).slice(0,60),role:role||(first?'admin':'member'),salt,hash:hashPw(pw,salt)};atomic(ACC,a);sticky=true;if(!rdUsers())atomic(FILE,{});return{id,name:a[id].name,role:a[id].role}}
const DUMMY=crypto.randomBytes(16).toString('hex');
function login(id,pw){id=String(id||'').trim().toLowerCase();const a=accounts()[id],salt=a?a.salt:DUMMY,h=Buffer.from(hashPw(pw||'',salt),'hex');
 if(!a||!crypto.timingSafeEqual(h,Buffer.from(a.hash,'hex')))return null;
 const token=crypto.randomBytes(32).toString('hex'),u=rdUsers()||{},now=Date.now();for(const k in u)if(u[k].exp&&u[k].exp<now)delete u[k];
 u[sha(token)]={id,name:a.name,role:a.role,exp:now+SESSION_MS};atomic(FILE,u);return{token,id,name:a.name,role:a.role}}
function logout(token){const u=rdUsers();if(!u)return;const h=sha(token);if(u[h]){delete u[h];atomic(FILE,u)}}
function changePassword(id,oldPw,newPw,keepToken){const a=accounts();if(!a[id])return'no such account';if(String(newPw||'').length<8)return'Password must be at least 8 characters.';
 if(!crypto.timingSafeEqual(Buffer.from(hashPw(oldPw||'',a[id].salt),'hex'),Buffer.from(a[id].hash,'hex')))return'Current password is wrong.';
 a[id].salt=crypto.randomBytes(16).toString('hex');a[id].hash=hashPw(newPw,a[id].salt);atomic(ACC,a);
 const u=rdUsers()||{};for(const k in u)if(cleanId(u[k].id)==id&&k!=sha(keepToken))delete u[k];atomic(FILE,u);return''}   // other sessions are signed out
// ---- administration (used by server/tools/admin.js; no old password needed — the operator has shell access)
const setPassword=(id,pw)=>{const a=accounts();if(!a[id])return'No such account: '+id;if(String(pw||'').length<8)return'Password must be at least 8 characters.';a[id].salt=crypto.randomBytes(16).toString('hex');a[id].hash=hashPw(pw,a[id].salt);atomic(ACC,a);revokeSessions(id);return''};
const revokeSessions=id=>{const u=rdUsers()||{};let n=0;for(const k in u)if(cleanId(u[k].id)==id){delete u[k];n++}if(n)atomic(FILE,u);return n};
const setRole=(id,role)=>{const a=accounts();if(!a[id])return'No such account: '+id;if(!['admin','member'].includes(role))return'Role must be admin or member';a[id].role=role;atomic(ACC,a);revokeSessions(id);return''};   // sessions are re-issued so the new role applies at once
function deleteAccount(id){const a=accounts();if(!a[id])return false;delete a[id];atomic(ACC,a);revokeSessions(id);const l={...readAcl()};for(const k in l){const[o]=k.split('/');if(o==id)delete l[k];else if(l[k].members[id]){l[k]={members:{...l[k].members}};delete l[k].members[id];if(!Object.keys(l[k].members).length)delete l[k]}}atomic(ACL,l);return true}
const signupOpen=()=>process.env.KATHAKAAR_SIGNUP!='0'   // public platform: anyone can sign up unless KATHAKAAR_SIGNUP=0
,needsBootstrap=()=>!hasAccounts();
const list=()=>Object.entries(accounts()).map(([id,a])=>({id,name:a.name,role:a.role}));
// ---- ACL: {"<owner>/<storyKey>":{members:{userId:'editor'|'reader'}}}
const readAcl=()=>rdAcl()||{};
const ROLES=['editor','reader'];
const share=(owner,key,user,role)=>{const a={...readAcl()},k=owner+'/'+key;a[k]={members:{...((a[k]||{}).members||{})}};if(role===null)delete a[k].members[user];else if(ROLES.includes(role))a[k].members[user]=role;else throw new Error('bad role');if(!Object.keys(a[k].members).length)delete a[k];atomic(ACL,a)};
const role=(owner,key,user)=>owner==user?'owner':((readAcl()[owner+'/'+key]||{members:{}}).members[user]||null);
const sharedWith=user=>{const o=[],a=readAcl();for(const k in a){const r=a[k].members[user];if(r){const[owner,key]=k.split('/');o.push({owner,key,role:r})}}return o};
const sharesOf=(owner,key)=>Object.entries(((readAcl()[owner+'/'+key])||{members:{}}).members).map(([user,role])=>({user,role}));
const dropAcl=(owner,key)=>{const a={...readAcl()};if(a[owner+'/'+key]){delete a[owner+'/'+key];atomic(ACL,a)}};
const audit=(u,action,key)=>{try{try{if(fs.statSync(AUDIT).size>5e6)fs.renameSync(AUDIT,AUDIT+'.1')}catch(e){}fs.appendFileSync(AUDIT,JSON.stringify({t:new Date().toISOString(),user:u,action,key})+'\n')}catch(e){}};   // who/what/when/key — never content
module.exports={setPassword,revokeSessions,setRole,deleteAccount,RESERVED,enabled,find,sha,share,role,sharedWith,sharesOf,dropAcl,audit,FILE,register,login,logout,changePassword,signupOpen,needsBootstrap,userExists,list,atomic,accounts};
