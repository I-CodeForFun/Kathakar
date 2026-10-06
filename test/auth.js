// Accounts (username+password), sessions, isolation, admin-only AI settings, blob isolation, UTF-8 integrity
const assert=require('assert'),{spawn}=require('child_process'),os=require('os'),fs=require('fs'),path=require('path'),net=require('net'),crypto=require('crypto');
(async()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ska-')),port=await new Promise(r=>{const s=net.createServer().listen(0,()=>{const p=s.address().port;s.close(()=>r(p))})});
 const proc=spawn('node',[path.join(__dirname,'../server/index.js')],{env:{...process.env,KATHAKAAR_DATA:dir,KATHAKAAR_MULTIUSER:'1',KATHAKAAR_SIGNUP:'0',PORT:port,HOST:'127.0.0.1',EMBED_BACKEND:'hash'},stdio:'ignore'});
 try{const U='http://127.0.0.1:'+port;for(let i=0;i<50;i++){try{await fetch(U+'/healthz');break}catch(e){await new Promise(r=>setTimeout(r,100))}}
  const post=(p,b,t)=>fetch(U+p,{method:'POST',headers:{'content-type':'application/json',...(t?{authorization:'Bearer '+t}:{})},body:JSON.stringify(b)}),H=t=>({authorization:'Bearer '+t});
  assert.strictEqual((await (await fetch(U+'/api/auth/config')).json()).bootstrap,true);
  assert.strictEqual((await post('/api/auth/register',{id:'ab',password:'longenough'})).status,400);   // bad username
  assert.strictEqual((await post('/api/auth/register',{id:'asha',password:'short'})).status,400);      // weak password
  const A=await (await post('/api/auth/register',{id:'asha',name:'Asha',password:'correct horse'})).json();assert(A.token&&A.role=='admin');   // first account = admin
  assert.strictEqual((await post('/api/auth/register',{id:'ravi',password:'another pass'})).status,403);   // signup closed once bootstrapped
  assert.strictEqual((await post('/api/auth/login',{id:'asha',password:'wrong'})).status,401);
  assert(!fs.readFileSync(path.join(dir,'accounts.json'),'utf8').includes('correct horse')&&!fs.readFileSync(path.join(dir,'users.json'),'utf8').includes(A.token));
  const me=await (await fetch(U+'/api/me',{headers:H(A.token)})).json();assert.strictEqual(me.id,'asha');
  // second user via CLI-created account
  require('child_process').execFileSync('node',[path.join(__dirname,'../server/tools/adduser.js'),'ravi','Ravi'],{env:{...process.env,KATHAKAAR_DATA:dir,KATHAKAAR_PASSWORD:'another pass'}});
  const R=await (await post('/api/auth/login',{id:'ravi',password:'another pass'})).json();assert(R.token&&R.role=='member');
  // UTF-8 must survive large bodies split across chunks
  const text='कथाकार '.repeat(40000),big=JSON.stringify({title:text});assert((await fetch(U+'/api/kv/sf2',{method:'PUT',headers:H(A.token),body:big})).status==200);
  assert.strictEqual((await (await fetch(U+'/api/kv/sf2',{headers:H(A.token)})).json()).title,text);
  assert.strictEqual((await fetch(U+'/api/kv/sf2',{headers:H(R.token)})).status,404);   // isolation
  // blobs are per user
  const bb=Buffer.from('cover-image'),h=crypto.createHash('sha256').update(bb).digest('hex');assert.strictEqual((await fetch(U+'/api/blob/'+h,{method:'PUT',headers:H(A.token),body:bb})).status,200);
  assert.strictEqual((await fetch(U+'/api/blob/'+h,{headers:H(R.token)})).status,404);assert.strictEqual((await fetch(U+'/api/blob/'+h,{method:'DELETE',headers:H(R.token)})).status,200);assert.strictEqual((await fetch(U+'/api/blob/'+h,{headers:H(A.token)})).status,200);
  // AI settings (API keys) are admin-only
  assert.strictEqual((await post('/api/ai/config',{},R.token)).status,403);
  // sharing needs an existing user
  assert.strictEqual((await post('/api/share',{key:'sf2',user:'ghost',role:'reader'},A.token)).status,404);assert.strictEqual((await post('/api/share',{key:'sf2',user:'ravi',role:'reader'},A.token)).status,200);
  assert.strictEqual((await (await fetch(U+'/api/shares?key=sf2',{headers:H(A.token)})).json())[0].user,'ravi');
  // deleting the story revokes its shares
  await fetch(U+'/api/kv/sf2',{method:'DELETE',headers:H(A.token)});assert.strictEqual((await fetch(U+'/api/shared/asha/sf2',{headers:H(R.token)})).status,404);
  // logout kills the session; changing the password signs out other sessions
  const A2=await (await post('/api/auth/login',{id:'asha',password:'correct horse'})).json();assert.strictEqual((await post('/api/auth/password',{old:'correct horse',new:'new password 1'},A2.token)).status,200);
  assert.strictEqual((await fetch(U+'/api/me',{headers:H(A.token)})).status,401);assert.strictEqual((await fetch(U+'/api/me',{headers:H(A2.token)})).status,200);
  await post('/api/auth/logout',{},A2.token);assert.strictEqual((await fetch(U+'/api/me',{headers:H(A2.token)})).status,401);
  // public mode: open sign-up gives plain members, never admins
  const pub=spawn('node',[path.join(__dirname,'../server/index.js')],{env:{...process.env,KATHAKAAR_DATA:fs.mkdtempSync(path.join(os.tmpdir(),'skb-')),KATHAKAAR_MULTIUSER:'1',PORT:port+1,HOST:'127.0.0.1',EMBED_BACKEND:'hash'},stdio:'ignore'});
  try{const P='http://127.0.0.1:'+(port+1);for(let i=0;i<50;i++){try{await fetch(P+'/healthz');break}catch(e){await new Promise(r=>setTimeout(r,100))}}
   const cfg=await (await fetch(P+'/api/auth/config')).json();assert(cfg.signup);const pr=(id)=>fetch(P+'/api/auth/register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id,password:'password123'})}).then(r=>r.json());
   assert.strictEqual((await pr('first-user')).role,'admin');assert.strictEqual((await pr('writer2')).role,'member');
  }finally{pub.kill()}
  // admin CLI: reset forgotten password, sessions revoked, role changes, reserved names, self-delete
  const CLI=(args,pw)=>require('child_process').spawnSync('node',[path.join(__dirname,'../server/tools/admin.js'),...args],{env:{...process.env,KATHAKAAR_DATA:dir,...(pw?{KATHAKAAR_PASSWORD:pw}:{})},encoding:'utf8'});
  const R2=await (await post('/api/auth/login',{id:'ravi',password:'another pass'})).json();assert.strictEqual(CLI(['set-password','ravi'],'reset-pass-99').status,0);
  assert.strictEqual((await fetch(U+'/api/me',{headers:H(R2.token)})).status,401);assert.strictEqual((await post('/api/auth/login',{id:'ravi',password:'another pass'})).status,401);assert.strictEqual((await post('/api/auth/login',{id:'ravi',password:'reset-pass-99'})).status,200);
  assert.strictEqual(CLI(['set-password','ravi'],'short').status,1);assert.strictEqual(CLI(['create-admin','newadmin'],'admin-pass-1').status,0);assert(/newadmin\s+admin/.test(CLI(['list']).stdout));
  assert.strictEqual(CLI(['demote','newadmin']).status,0);assert.strictEqual(CLI(['create-admin','newadmin']).status,0);
  assert.strictEqual(CLI(['delete-user','asha']).status,0);assert.strictEqual(CLI(['delete-user','newadmin']).status,1);   // last admin protected
  const T=await (await post('/api/auth/login',{id:'newadmin',password:'admin-pass-1'})).json();assert.strictEqual(T.role,'admin');
  const Z=await (await post('/api/auth/login',{id:'ravi',password:'reset-pass-99'})).json();assert.strictEqual((await post('/api/auth/delete',{password:'nope'},Z.token)).status,400);assert.strictEqual((await post('/api/auth/delete',{password:'reset-pass-99'},Z.token)).status,200);assert.strictEqual((await fetch(U+'/api/me',{headers:H(Z.token)})).status,401);
  console.log('auth ok')}catch(e){console.error(e);process.exitCode=1}finally{proc.kill()}})();
