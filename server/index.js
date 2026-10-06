require('./env');
const http=require('http'),fs=require('fs'),path=require('path'),store=require('./store'),SCHEMA=require('../public/js/schema.js'),{check,explain}=require('./checker'),{load,info,calibrate}=require('./embedder'),AC=require('./aiconfig'),blobs=require('./blobs'),zlib=require('zlib'),crypto=require('crypto'),JD=require('./judge');
const PUB=path.join(__dirname,'..','public'),MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const SEC={'x-content-type-options':'nosniff','referrer-policy':'no-referrer','cross-origin-opener-policy':'same-origin','permissions-policy':'camera=(), microphone=(), geolocation=()',
 'content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; worker-src 'self'"};
const TRUST=process.env.TRUST_PROXY=='1';
const hdrs=(req,h)=>{const o={...SEC,...h};if(TRUST&&req&&req.headers['x-forwarded-proto']=='https')o['strict-transport-security']='max-age=31536000';return o};
const send=(r,c,b,t='application/json',extra={})=>{r.writeHead(c,hdrs(r.req,{'content-type':t+'; charset=utf-8','cache-control':'no-store',...extra}));r.end(typeof b=='string'||Buffer.isBuffer(b)?b:JSON.stringify(b))};
const body=(req,cap=5e6)=>rawBody(req,cap).then(b=>b.toString('utf8'));
const rawBody=(req,cap)=>new Promise((ok,no)=>{const ch=[];let n=0;const to=setTimeout(()=>{no(Object.assign(new Error('Request timeout'),{status:408}));req.destroy()},30000);
 req.on('data',c=>{n+=c.length;if(n>cap){clearTimeout(to);no(Object.assign(new Error('Too large'),{status:413}));req.destroy()}else ch.push(c)});req.on('end',()=>{clearTimeout(to);ok(Buffer.concat(ch))});req.on('error',no)});
// ---- optional token auth (set KATHAKAAR_TOKEN in .env) + simple per-IP rate limit
const TOKEN=process.env.KATHAKAAR_TOKEN||'',LIM=+process.env.RATE_LIMIT||600,hits=new Map();
setInterval(()=>hits.clear(),60000).unref();
const clientIp=req=>{if(TRUST){const x=(req.headers['x-forwarded-for']||'').split(',').map(v=>v.trim()).filter(Boolean);if(x.length)return x[x.length-1]}return req.socket.remoteAddress||'?'};
const limited=req=>{const ip=clientIp(req),n=(hits.get(ip)||0)+1;hits.set(ip,n);return n>LIM};
const fails=new Map();   // ip -> {n,until}
const locked=req=>{const f=fails.get(clientIp(req));return f&&f.until>Date.now()?Math.ceil((f.until-Date.now())/1000):0};
const failed=req=>{const ip=clientIp(req),f=fails.get(ip)||{n:0,until:0,t:0};if(Date.now()-f.t>9e5)f.n=0;f.n++;f.t=Date.now();if(f.n>10)f.until=Date.now()+Math.min(36e5,1000*2**(f.n-10));fails.set(ip,f)};
const okAuth=req=>fails.delete(clientIp(req));
// "same machine" only when the request did NOT come through a reverse proxy (a proxy on localhost would otherwise make every visitor look local)
const loopback=req=>!TRUST&&!req.headers['x-forwarded-for']&&!req.headers['forwarded']&&/^(::1|127\.0\.0\.1|::ffff:127\.0\.0\.1)$/.test(req.socket.remoteAddress||'');
// AI settings contain API keys: without a token only the machine running the server may change them
const canConfigure=req=>(req.user&&req.user.multi)?req.user.role=='admin':TOKEN?true:(loopback(req)||process.env.AI_CONFIG_OPEN=='1');   // AI_CONFIG_OPEN=1: Docker, where the host browser does not arrive from 127.0.0.1
const aiStatus=()=>({embed:info(),judge:JD.info()});
const USERS=require('./users'),ROOTSTORE=require('./store');
const bearer=req=>{const h=req.headers.authorization||'';return h.startsWith('Bearer ')?h.slice(7):(req.headers['x-kathakaar-token']||'')};
const tokEq=(a,b)=>{const x=crypto.createHash('sha256').update(String(a)).digest(),y=crypto.createHash('sha256').update(String(b)).digest();return crypto.timingSafeEqual(x,y)};   // equal-length digests: no RangeError, no length leak
const mkUser=(id,name,role,multi)=>({id,name,role,multi,store:multi?ROOTSTORE.forUser(id):ROOTSTORE,blobs:multi?blobs.forUser(id):blobs});
const authed=req=>{if(USERS.enabled()){const u=USERS.find(bearer(req));if(!u)return false;req.user=mkUser(u.id,u.name,u.role,true);req.token=bearer(req);return true}
 if(!TOKEN){req.user=mkUser('_','_','admin',false);return true}
 if(tokEq(bearer(req),TOKEN)){req.user=mkUser('_','_','admin',false);return true}return false};
// Validate what a client wants to store under a key. Returns an error string or ''.
const KR=require('../public/js/keys.js');
function badValue(k,v){return KR.check(k,v,SCHEMA)}
// ---- F2 change feed (in-memory ring buffer; Last-Event-ID resume) + ephemeral presence
const BUS={seq:0,ring:[],subs:new Set(),presence:new Map()};
const emit=(owner,key,etag,by,type='kv',extra)=>{const ev={id:++BUS.seq,type,owner,k:key,etag,by,t:Date.now(),...extra};BUS.ring.push(ev);if(BUS.ring.length>500)BUS.ring.shift();for(const sub of BUS.subs)if(sub.wants(ev))sub.send(ev)};
const SWC={},GZ=new Map(),clipHits=new Map();const LOG=process.env.KATHAKAAR_LOG=='1';
const acctFails=new Map(),signups=new Map(),MAXQ=(process.env.KATHAKAAR_QUOTA_MB!==undefined?+process.env.KATHAKAAR_QUOTA_MB:(USERS.enabled()?50:0))*1e6;   // public platform default: 50 MB per user (0 = unlimited)
const sum=o=>Object.values(o).reduce((a,x)=>a+(x.n!==undefined?x.n:x),0),stSize=u=>sum(u.store.meta())+sum(u.blobs.list());
const srv=http.createServer(async(req,res)=>{res.req=req;const t0=Date.now();if(LOG)res.on('finish',()=>console.log(req.method,req.url.split('?')[0],res.statusCode,Date.now()-t0+'ms',clientIp(req)));
try{const p=new URL(req.url,'http://x').pathname;
 if(p=='/healthz')return send(res,200,{ok:1});   // cheap liveness probe (no model loading, no auth)
if(p=='/api/auth/config'&&req.method=='GET')return send(res,200,{multi:USERS.enabled(),signup:USERS.enabled()&&(USERS.signupOpen()||(USERS.needsBootstrap()&&loopback(req))),bootstrap:USERS.enabled()&&USERS.needsBootstrap()});
 if(p=='/api/auth/register'||p=='/api/auth/login'){if(req.method!='POST')return send(res,405,{error:'POST only'});if(!USERS.enabled())return send(res,404,{error:'Multi-user mode is off (set KATHAKAAR_MULTIUSER=1)'});
  const lk=locked(req);if(lk)return send(res,429,{error:'Too many failed attempts'},undefined,{'retry-after':String(lk)});if(limited(req))return send(res,429,{error:'Too many requests'},undefined,{'retry-after':'10'});
  let b;try{b=JSON.parse(await body(req,5000))}catch(e){return send(res,400,{error:'invalid JSON'})}
  if(p=='/api/auth/register'){if(!(USERS.signupOpen()||(USERS.needsBootstrap()&&loopback(req))))return send(res,403,{error:'Sign-up is closed. Ask the administrator for an account.'});const sw_=(signups.get(clientIp(req))||[]).filter(t=>Date.now()-t<36e5);if(sw_.length>=(+process.env.KATHAKAAR_SIGNUPS_PER_HOUR||10))return send(res,429,{error:'Too many sign-ups from this address. Try again later.'},undefined,{'retry-after':'600'});sw_.push(Date.now());signups.set(clientIp(req),sw_);
   const r=USERS.register(b.id,b.name,b.password,(USERS.needsBootstrap()&&loopback(req))?'admin':'member');if(r.error)return send(res,400,{error:r.error});USERS.audit(r.id,'register','');const l=USERS.login(r.id,b.password);return send(res,200,l)}
  const uk=String(b.id||'').toLowerCase().slice(0,40),uf=acctFails.get(uk)||{n:0,t:0};if(Date.now()-uf.t>9e5)uf.n=0;if(uf.n>=10)return send(res,429,{error:'Too many failed attempts for this account. Try again in 15 minutes, or ask the administrator to reset the password.'},undefined,{'retry-after':'900'});
  const l=USERS.login(b.id,b.password);if(!l){uf.n++;uf.t=Date.now();acctFails.set(uk,uf);if(acctFails.size>5000)acctFails.clear();failed(req);return send(res,401,{error:'Wrong username or password'})}okAuth(req);acctFails.delete(uk);USERS.audit(l.id,'login','');return send(res,200,l)}
 if(p.startsWith('/api/')){const lk=locked(req);if(lk)return send(res,429,{error:'Too many failed attempts'},undefined,{'retry-after':String(lk)});
  if(limited(req))return send(res,429,{error:'Too many requests'},undefined,{'retry-after':'10'});if(!authed(req)){failed(req);return send(res,401,{error:'Unauthorized'})}okAuth(req)}
 const store=(req.user&&req.user.store)||ROOTSTORE,UID=req.user&&req.user.id;   // per-user namespace in multi-user mode
 const aud=(a,k)=>{if(req.user&&req.user.multi)USERS.audit(UID,a,k)};
if(p=='/api/auth/logout'&&req.method=='POST'){if(req.token)USERS.logout(req.token);return send(res,200,{ok:1})}
 if(p=='/api/auth/password'&&req.method=='POST'&&req.user.multi){let b;try{b=JSON.parse(await body(req,5000))}catch(e){return send(res,400,{error:'invalid JSON'})}const e=USERS.changePassword(UID,b.old,b.new,req.token);if(e){failed(req);return send(res,400,{error:e})}aud('password','');return send(res,200,{ok:1})}
 if(p=='/api/auth/delete'&&req.method=='POST'&&req.user.multi){let b;try{b=JSON.parse(await body(req,5000))}catch(e){return send(res,400,{error:'invalid JSON'})}if(!USERS.login(UID,b.password)){failed(req);return send(res,400,{error:'Password is wrong.'})}
  USERS.audit(UID,'delete-account','');USERS.deleteAccount(UID);for(const d of [ROOTSTORE.forUser(UID).DIR,blobs.forUser(UID).DIR])try{fs.rmSync(d,{recursive:true,force:true})}catch(e){}return send(res,200,{ok:1})}
 if(p=='/api/me'&&req.method=='GET')return send(res,200,{id:UID,name:(req.user||{}).name||null,role:(req.user||{}).role||null,multi:!!(req.user&&req.user.multi)});
 if(p=='/api/kv'&&req.method=='GET')return send(res,200,store.all());
 if(p=='/api/kv-meta'&&req.method=='GET')return send(res,200,store.meta());
 if(p=='/api/storage'&&req.method=='GET'){const m=store.meta(),b=req.user.blobs.list();return send(res,200,{keys:m,blobs:b,total:stSize(req.user),quotaMB:MAXQ/1e6})}
 if(p=='/api/diag'&&req.method=='GET'){if(req.user.multi&&req.user.role!='admin')return send(res,403,{error:'admin only'})}
 if(p=='/api/diag'&&req.method=='GET')return send(res,200,{node:process.version,uptime:Math.round(process.uptime()),keys:Object.keys(store.meta()).length,blobs:Object.keys(req.user.blobs.list()).length,schema:SCHEMA.VERSION,embed:info()});
 if(p=='/api/clip'&&req.method=='POST'){if(process.env.KATHAKAAR_CLIP!='1')return send(res,404,{error:'clipping is disabled (set KATHAKAAR_CLIP=1)'});const ip=clientIp(req),now=Date.now(),w=(clipHits.get(ip)||[]).filter(t=>now-t<60000);if(w.length>=20)return send(res,429,{error:'clip rate limit'},undefined,{'retry-after':'30'});w.push(now);clipHits.set(ip,w);
  let b;try{b=JSON.parse(await body(req,1e4))}catch(e){return send(res,400,{error:'invalid JSON'})}try{const r=await require('./clip').clip(String(b.url||''));if(LOG)console.log('clip',r.url);return send(res,200,r)}catch(e){return send(res,422,{error:e.message})}}
 if(p=='/api/export'&&req.method=='GET'){const all=store.all(),bl=req.user.blobs.list();res.writeHead(200,hdrs(req,{'content-type':'application/x-ndjson','content-disposition':'attachment; filename="kathakaar-export.jsonl"'}));for(const k in all)res.write(JSON.stringify({k,v:all[k]})+'\n');for(const h in bl)res.write(JSON.stringify({blob:h,size:bl[h]})+'\n');return res.end()}
 if(p=='/sw.js'){if(SWC.body&&Date.now()-SWC.t<5000)return send(res,200,SWC.body,'text/javascript',SWC.h);const files=[];(function w(d){for(const n of fs.readdirSync(d)){const f=path.join(d,n);fs.statSync(f).isDirectory()?w(f):files.push(f)}})(PUB);const ver=crypto.createHash('sha1').update(files.map(f=>path.relative(PUB,f)+fs.statSync(f).mtimeMs+fs.statSync(f).size).join('|')).digest('hex').slice(0,12);
  const pre=files.map(f=>'/'+path.relative(PUB,f).split(path.sep).join('/')).filter(x=>x!='/sw.js');
  SWC.body=`const V='sf-${ver}',PRE=${JSON.stringify(['/',...pre])};\nself.addEventListener('install',e=>e.waitUntil(caches.open(V).then(c=>c.addAll(PRE))));\nself.addEventListener('message',e=>{if(e.data==='skip')self.skipWaiting()});\nself.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));\nself.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin||u.pathname.startsWith('/api/'))return;e.respondWith(caches.open(V).then(async c=>{const hit=await c.match(e.request);const net=fetch(e.request).then(r=>{if(r.ok)c.put(e.request,r.clone());return r}).catch(()=>hit);return hit||net}))});`;SWC.h={'cache-control':'no-cache','service-worker-allowed':'/'};SWC.t=Date.now();return send(res,200,SWC.body,'text/javascript',SWC.h)}
 if(p=='/api/events'&&req.method=='GET'){res.writeHead(200,hdrs(req,{'content-type':'text/event-stream','cache-control':'no-store','x-accel-buffering':'no',connection:'keep-alive'}));res.write(': ok\n\n');
  const wants=ev=>ev.owner==UID||(req.user&&req.user.multi&&!!USERS.role(ev.owner,ev.k||'',UID))||ev.type=='presence'&&(ev.owner==UID||(req.user&&req.user.multi&&!!USERS.role(ev.owner,ev.story||'',UID)));
  const sub={wants,send:ev=>res.write('id: '+ev.id+'\ndata: '+JSON.stringify(ev)+'\n\n')};const last=+(req.headers['last-event-id']||new URL(req.url,'http://x').searchParams.get('since')||0);
  if(last)for(const ev of BUS.ring)if(ev.id>last&&wants(ev))sub.send(ev);BUS.subs.add(sub);const hb=setInterval(()=>res.write(': hb\n\n'),25000);req.on('close',()=>{clearInterval(hb);BUS.subs.delete(sub)});return}
 if(p=='/api/presence'&&req.method=='POST'){let b;try{b=JSON.parse(await body(req,2000))}catch(e){return send(res,400,{error:'invalid JSON'})}
  const owner=String(b.owner||UID);if(owner!=UID&&!(req.user&&req.user.multi&&USERS.role(owner,String(b.story||''),UID)))return send(res,403,{error:'forbidden'});
  const rec={user:UID,name:(req.user&&req.user.name)||UID,story:String(b.story||'').slice(0,64),chapter:String(b.chapter||'').slice(0,64),ts:Date.now()};BUS.presence.set(UID+'|'+owner+'|'+rec.story,rec);
  for(const [k,v] of BUS.presence)if(Date.now()-v.ts>60000)BUS.presence.delete(k);const here=[...BUS.presence].filter(([k,v])=>k.split('|')[1]==owner&&v.story==rec.story).map(([k,v])=>v);
  emit(owner,null,null,UID,'presence',{story:rec.story,here});return send(res,200,{here})}
 if(p=='/api/kv-batch'&&req.method=='POST'){let b;try{b=JSON.parse(await body(req,2e7))}catch(e){return send(res,400,{error:'invalid JSON'})}
  const out={};let used=MAXQ?stSize(req.user):0;for(const [k,v] of Object.entries(b.puts||{})){if(!store.ok(k)){out[k]='400:bad key';continue}if(typeof v!='string'){out[k]='400:value must be a string';continue}const e=badValue(k,v);if(e){out[k]='400:'+e;continue}
   if(MAXQ&&used+v.length>MAXQ){out[k]='507:quota';continue}used+=v.length;store.set(k,v);aud('put',k);emit(UID,k,store.etag(k),UID);out[k]='ok'}
  for(const k of b.dels||[]){if(store.ok(k)){store.del(k);aud('delete',k);emit(UID,k,null,UID);out[k]='ok'}else out[k]='400:bad key'}return send(res,200,out)}
 const m=/^\/api\/kv\/([^/]+)$/.exec(p);
 if(m){if(!store.ok(m[1]))return send(res,400,{error:'bad key'});
  if(req.method=='GET'){const v=store.get(m[1]);if(v===null)return send(res,404,{error:'not found'});const et=store.etag(m[1]);if(req.headers['if-none-match']===et)return send(res,304,'',undefined,{etag:et});return send(res,200,v,'application/json',{etag:et})}
  if(req.method=='PUT'){const b=await body(req),e=badValue(m[1],b);if(e)return send(res,400,{error:e});
   const im=req.headers['if-match'];if(im){const cur=store.etag(m[1]);if(cur!==im)return send(res,412,{error:'conflict',etag:cur,value:store.get(m[1])})}
   if(MAXQ&&stSize(req.user)+b.length>MAXQ)return send(res,507,{error:'Storage quota exceeded'});
   store.set(m[1],b);aud('put',m[1]);emit(UID,m[1],store.etag(m[1]),UID);return send(res,200,{ok:1},undefined,{etag:store.etag(m[1])})}
  if(req.method=='DELETE'){store.del(m[1]);if(req.user.multi)USERS.dropAcl(UID,m[1]);aud('delete',m[1]);emit(UID,m[1],null,UID);return send(res,200,{ok:1})}}
 if(req.user&&req.user.multi){
  if(p=='/api/share'&&req.method=='POST'){let b;try{b=JSON.parse(await body(req,1e4))}catch(e){return send(res,400,{error:'invalid JSON'})}
   if(!store.ok(String(b.key||''))||!/^[\w-]{1,64}$/.test(String(b.user||'')))return send(res,400,{error:'bad key or user'});if(store.get(b.key)===null)return send(res,404,{error:'no such story'});
   if(b.user==UID)return send(res,400,{error:'You already own this story'});if(b.role!==null&&b.role!='none'&&!USERS.userExists(b.user))return send(res,404,{error:'No such user'});try{USERS.share(UID,b.key,b.user,b.role===null||b.role=='none'?null:b.role)}catch(e){return send(res,400,{error:e.message})}aud('share:'+b.user+':'+b.role,b.key);return send(res,200,{ok:1})}
  if(p=='/api/shares'&&req.method=='GET'){const k=new URL(req.url,'http://x').searchParams.get('key')||'';return send(res,200,store.ok(k)?USERS.sharesOf(UID,k):[])}
  if(p=='/api/users'&&req.method=='GET')return send(res,200,USERS.list().filter(u=>u.id!=UID).map(u=>({id:u.id,name:u.name})));
  if(p=='/api/shared'&&req.method=='GET')return send(res,200,USERS.sharedWith(UID));
  const sm=/^\/api\/shared\/([\w-]{1,64})\/([\w-]{1,64})$/.exec(p);
  if(sm){const[,owner,key]=sm,r=USERS.role(owner,key,UID);if(!r)return send(res,404,{error:'not found'});const os=ROOTSTORE.forUser(owner);
   if(req.method=='GET'){const v=os.get(key);return v===null?send(res,404,{error:'not found'}):send(res,200,v,'application/json',{etag:os.etag(key),'x-sf-role':r})}
   if(req.method=='PUT'){if(r!='editor'&&r!='owner')return send(res,403,{error:'read-only'});const b=await body(req),e=badValue(key,b);if(e)return send(res,400,{error:e});const im=req.headers['if-match'];if(im&&os.etag(key)!==im)return send(res,412,{error:'conflict',etag:os.etag(key)});if(MAXQ&&sum(os.meta())+b.length>MAXQ)return send(res,507,{error:'Owner storage quota exceeded'});os.set(key,b);aud('put-shared:'+owner,key);emit(owner,key,os.etag(key),UID);return send(res,200,{ok:1},undefined,{etag:os.etag(key)})}}}
 const BL=req.user&&req.user.blobs;
 if(p=='/api/blobs'&&req.method=='GET')return send(res,200,BL.list());
 const bm=/^\/api\/blob\/([0-9a-f]{64})$/.exec(p);
 if(bm){const h=bm[1];
  if(req.method=='PUT'){const buf=await rawBody(req,BL.MAX);if(MAXQ&&stSize(req.user)+buf.length>MAXQ)return send(res,507,{error:'Storage quota exceeded'});const e=BL.put(h,buf);return e?send(res,400,{error:e}):send(res,200,{ok:1})}
  if(req.method=='HEAD'){res.writeHead(BL.has(h)?200:404,hdrs(req,{}));return res.end()}
  if(req.method=='GET'){const b=BL.get(h);if(!b)return send(res,404,{error:'not found'});res.writeHead(200,hdrs(req,{'content-type':'application/octet-stream','cache-control':'private, max-age=31536000, immutable','content-length':b.length}));return res.end(b)}
  if(req.method=='DELETE'){BL.del(h);return send(res,200,{ok:1})}}
 if(p=='/api/check'&&req.method=='POST'){let b;try{b=JSON.parse(await body(req))}catch(e){return send(res,400,{error:'invalid JSON'})}
  if(!b.world||!Array.isArray(b.items))return send(res,400,{error:'world and items required'});
  return send(res,200,await check(b.world,b.items,b.sens))}
 if(p=='/api/explain'&&req.method=='POST'){let b;try{b=JSON.parse(await body(req))}catch(e){return send(res,400,{error:'invalid JSON'})}return send(res,200,await explain(b.rule||{},b.text,b.sens))}
 if(p=='/api/ai/config'&&req.method=='GET'){await load();return send(res,200,{...AC.publicView(),status:aiStatus(),canConfigure:canConfigure(req),calibration:AC.calib()})}
 if(p=='/api/ai/config'&&req.method=='POST'){if(!canConfigure(req))return send(res,403,{error:'AI settings can only be changed from the machine running the server (or set KATHAKAAR_TOKEN)'});
  let b;try{b=JSON.parse(await body(req))}catch(e){return send(res,400,{error:'invalid JSON'})}
  AC.set(b);await load(true);return send(res,200,{...AC.publicView(),status:aiStatus(),canConfigure:true,calibration:AC.calib()})}
 if(p=='/api/ai/test'&&req.method=='POST'){if(!canConfigure(req))return send(res,403,{error:'not allowed'});let b;try{b=JSON.parse(await body(req))}catch(e){b={}}
  const t=Date.now();try{if(b.kind=='judge'){if(!JD.enabled())return send(res,200,{ok:false,error:'Verification is switched off'});return send(res,200,await JD.test())}
   await load(true);const i=info();if(i.provider=='hash'&&i.wanted)return send(res,200,{ok:false,error:i.reason||'Engine unavailable',fallback:true});
   const {embed}=require('./embedder');const v=await embed(['dragon','a huge winged beast']);return send(res,200,{ok:true,ms:Date.now()-t,dim:v[0].length,engine:info()})}catch(e){return send(res,200,{ok:false,error:String(e.message||e)})}}
 if(p=='/api/ai/calibrate'&&req.method=='POST'){if(!canConfigure(req))return send(res,403,{error:'not allowed'});try{await load();return send(res,200,{ok:true,result:await calibrate(),engine:info()})}catch(e){return send(res,200,{ok:false,error:String(e.message||e)})}}
 if(p=='/api/ai/ollama-models'&&req.method=='GET'){if(!canConfigure(req))return send(res,403,{error:'not allowed'});const base=(AC.get().judge.provider=='ollama'?AC.url('judge'):AC.get().embed.provider=='ollama'?AC.url('embed'):AC.DEFAULT_URL.ollama);
  try{const r=await fetch(base+'/api/tags',{signal:AbortSignal.timeout(4000)});const j=await r.json();return send(res,200,{ok:true,models:(j.models||[]).map(m=>m.name)})}catch(e){return send(res,200,{ok:false,error:'Cannot reach Ollama at '+base+' — is it running? (https://ollama.com)'})}}
 if(p=='/api/health'){await load();return send(res,200,{ok:1,engine:info(),judge:JD.info()})};
 if(req.method!='GET')return send(res,404,{error:'not found'});
 let rel;try{rel=decodeURIComponent(p)}catch(e){return send(res,400,'Bad request','text/plain')}
 if(rel.includes('\0'))return send(res,400,'Bad request','text/plain');
 const f=path.resolve(PUB,'.'+path.posix.normalize('/'+(rel=='/'?'index.html':rel)));const r=path.relative(PUB,f);
 if(!r||r.startsWith('..')||path.isAbsolute(r)||!fs.existsSync(f)||fs.statSync(f).isDirectory())return send(res,404,'Not found','text/plain');
 const st=fs.statSync(f),et='"'+Math.round(st.mtimeMs)+'-'+st.size+'"';
 if(req.headers['if-none-match']===et){res.writeHead(304,hdrs(req,{etag:et}));return res.end()}
 const ext=path.extname(f),mime=(MIME[ext]||'application/octet-stream'),txt=/html|javascript|css|json|svg/.test(mime);let data=fs.readFileSync(f);
 const h={'content-type':mime+(txt?'; charset=utf-8':''),etag:et,'cache-control':'no-cache'};
 if(txt&&data.length>=1024&&/gzip/.test(req.headers['accept-encoding']||'')){let z=GZ.get(f+et);if(!z){z=zlib.gzipSync(data);if(GZ.size>200)GZ.clear();GZ.set(f+et,z)}data=z;h['content-encoding']='gzip'}if(txt)h.vary='accept-encoding'
 res.writeHead(200,hdrs(req,h));res.end(data)
}catch(e){if(!res.headersSent)send(res,e.status||500,{error:e.message})}});
srv.headersTimeout=15000;srv.requestTimeout=60000;srv.keepAliveTimeout=5000;
if(require.main===module||!process.env.SF_NO_LISTEN)srv.listen(+process.env.PORT||3000,process.env.HOST||((TOKEN||USERS.enabled())?'0.0.0.0':'127.0.0.1'),()=>console.log('Kathakaar on http://localhost:'+(process.env.PORT||3000)));
process.on('uncaughtException',e=>console.error('uncaught',e&&e.stack||e));process.on('unhandledRejection',e=>console.error('unhandled',e&&e.stack||e));
for(const sg of ['SIGTERM','SIGINT'])process.on(sg,()=>{srv.close(()=>process.exit(0));setTimeout(()=>process.exit(0),3000).unref()});   // stop accepting, finish in-flight, exit
