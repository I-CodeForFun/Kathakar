// Boot: merge local data with the server (never silently overwrite), mirror later writes with retry,
// load all feature scripts, then render ONCE so every tab exists on first paint.
(async()=>{
 try{if(localStorage.getItem('sf-sbc')=='1')document.body.classList.add('sbc')}catch(e){}
 const own=k=>KEYREG.isSynced(k),J=s=>{try{return JSON.parse(s)}catch(e){return null}};
 const H=s=>{s=String(s);let h=5381;for(let i=0;i<s.length;i++)h=(h*33^s.charCodeAt(i))>>>0;return h.toString(36)+'.'+s.length};
 try{for(const [o,n] of [['xtoken','xl-token'],['xsync','xl-sync']]){const v=localStorage.getItem(o);if(v!==null){if(localStorage.getItem(n)===null)localStorage.setItem(n,v);localStorage.removeItem(o)}}}catch(e){}
 try{const m=/[#&?]token=([^&]+)/.exec(location.hash);if(m){localStorage.setItem('xl-token',decodeURIComponent(m[1]));history.replaceState(null,'',location.pathname+location.search)}}catch(e){}
 const ls=localStorage,sI=Storage.prototype.setItem,rI=Storage.prototype.removeItem,gI=Storage.prototype.getItem;
 // ---- IndexedDB: durable second copy of every sf* key + overflow store when localStorage (~5 MB) is full
 const OV=new Map(),pend=new Map();let idb=null,idbT=null;
 const isQuota=e=>e&&(e.name=='QuotaExceededError'||e.name=='NS_ERROR_DOM_QUOTA_REACHED'||e.code==22||e.code==1014);
 try{idb=await new Promise(res=>{try{const r=indexedDB.open('storyflow',3);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains('kv'))d.createObjectStore('kv');if(!d.objectStoreNames.contains('base'))d.createObjectStore('base');if(!d.objectStoreNames.contains('blobs'))d.createObjectStore('blobs')};r.onsuccess=()=>res(r.result);r.onerror=r.onblocked=()=>res(null)}catch(e){res(null)}})}catch(e){idb=null}
 const idbFlush=()=>{if(!idb||!pend.size)return;const items=[...pend];pend.clear();try{const tx=idb.transaction('kv','readwrite'),st=tx.objectStore('kv');items.forEach(([k,r])=>r===null?st.delete(k):st.put(r,k))}catch(e){}};
 const BASE=new Map();   // last value both sides agreed on, per story key (3-way merge base)
 const baseQ=(k,v)=>{if(v===null)BASE.delete(k);else BASE.set(k,v);if(!idb)return;try{const st=idb.transaction('base','readwrite').objectStore('base');v===null?st.delete(k):st.put(v,k)}catch(e){}};
 const baseAll=()=>new Promise(res=>{if(!idb)return res([]);try{const st=idb.transaction('base','readonly').objectStore('base'),k=st.getAllKeys(),v=st.getAll();v.onsuccess=()=>res(k.result.map((key,i)=>[key,v.result[i]]));v.onerror=()=>res([])}catch(e){res([])}});
 const idbQ=(k,rec)=>{pend.set(k,rec);clearTimeout(idbT);idbT=setTimeout(idbFlush,250)};
 addEventListener('pagehide',idbFlush);addEventListener('visibilitychange',()=>{if(document.hidden)idbFlush()});
 const idbAll=()=>new Promise(res=>{if(!idb)return res([]);try{const st=idb.transaction('kv','readonly').objectStore('kv'),k=st.getAllKeys(),v=st.getAll();v.onsuccess=()=>res(k.result.map((key,i)=>[key,v.result[i]]));v.onerror=()=>res([])}catch(e){res([])}});
 // store(): write to localStorage; if it does not fit keep it in memory + IndexedDB; always mirror to IndexedDB
 function store(k,v){v=String(v);let over=false;try{sI.call(ls,k,v);OV.delete(k)}catch(e){if(!isQuota(e))throw e;OV.set(k,v);over=true;window.dispatchEvent(new CustomEvent('sf:overflow',{detail:{k}}))}idbQ(k,{v,o:over?1:0})}
 Storage.prototype.getItem=function(k){return this===ls&&OV.has(k)?OV.get(k):gI.call(this,k)};
 const KEYS=()=>[...new Set([...Object.keys(ls).filter(own),...OV.keys()])];
 if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{});
 // recover anything IndexedDB has that localStorage lost (cleared site data, quota eviction)
 for(const [k,rec] of await idbAll()){if(!own(k)||!rec||typeof rec.v!='string')continue;if(gI.call(ls,k)===null&&!OV.has(k)){try{store(k,rec.v)}catch(e){}}}
 for(const [k,v] of await baseAll())BASE.set(k,v);
 window.SFSTORE={idb:!!idb,overflow:()=>[...OV.keys()],keys:KEYS};
 // local-only metadata (not synced): xsync = {key:{h: hash of the value last known to be identical on both sides}}
 let meta=J(ls.getItem('xl-sync'))||{};const saveMeta=()=>{try{sI.call(ls,'xl-sync',JSON.stringify(meta))}catch(e){}};
 const hdr=(x={})=>{const t=ls.getItem('xl-token');return t?{...x,authorization:'Bearer '+t}:x};
 const api=(p,o={})=>fetch(p,{...o,headers:hdr(o.headers||{})});
 const q={};let online=false,everOnline=false,timer=null,delay=5000,busy=false,flushT=null;
 const SF=window.SFSYNC={status:'local',pending:()=>Object.keys(q).length,retry:()=>connect(true),rejectedKeys:[],retryRejected:()=>{Object.keys(rej).forEach(k=>{const v=ls.getItem(k);q[k]=v;delete rej[k]});SF.rejectedKeys=[];clearTimeout(flushT);flushT=setTimeout(flush,0)}};
 // Local data belongs to ONE account: when another account signs in on this browser, the previous account's stories are removed locally (they stay on the server) so they are never uploaded into the wrong account.
 const wipe=async()=>{for(const k of KEYS())rI.call(ls,k);OV.clear();pend.clear();for(const k of ['xl-sync','xl-dirty'])rI.call(ls,k);meta={};Object.keys(q).forEach(k=>delete q[k]);D.clear();BASE.clear();
  if(idb)await Promise.all(['kv','base'].map(n=>new Promise(r=>{try{const t=idb.transaction(n,'readwrite');t.objectStore(n).clear();t.oncomplete=t.onerror=t.onabort=()=>r()}catch(e){r()}})))};
 SF.wipeLocal=wipe;SF.useSession=async x=>{const prev=ls.getItem('xl-user');if(prev&&prev!==x.id)await wipe();sI.call(ls,'xl-token',x.token);sI.call(ls,'xl-user',x.id);sI.call(ls,'xl-uname',x.name||x.id);SF.me=x.id;SF.name=x.name;SF.multi=true;SF.role=x.role;return true};
 SF.signOut=async()=>{try{await api('/api/auth/logout',{method:'POST'})}catch(e){}await wipe();for(const k of ['xl-token','xl-user','xl-uname'])rI.call(ls,k);location.reload()};
 const status=s=>{if(SF.status==s)return;SF.status=s;window.dispatchEvent(new CustomEvent('sf:sync',{detail:s}))};
 const later=()=>{clearTimeout(timer);timer=setTimeout(()=>online?flush():connect(false),delay);delay=Math.min(delay*2,60000)};
 let asked=false;   // ask at most once per page load; a manual "Retry" in the sync chip asks again
 async function askToken(manual){if(asked&&!manual)return false;asked=true;let t=null,cfg=null;
  try{cfg=await(await fetch('/api/auth/config')).json()}catch(e){}
  if(cfg&&cfg.multi&&window.SFX&&SFX.authDialog){try{return !!await SFX.authDialog(cfg)}catch(e){return false}}
  try{t=window.SFX&&SFX.askText?await SFX.askText({title:'Access token needed',label:'This server requires an access token (KATHAKAAR_TOKEN). Cancel to keep working locally.',confirm:'Connect'}):null}catch(e){}
  if(t&&t.trim()){try{sI.call(ls,'xl-token',t.trim())}catch(e){}return true}return false}
 // ---- writes -> server (queued, retried with back-off)
 const rej={},D=new Set(J(ls.getItem('xl-dirty'))||[]);
 const saveD=()=>{try{const a=[...new Set([...Object.keys(q),...D])];a.length?sI.call(ls,'xl-dirty',JSON.stringify(a)):rI.call(ls,'xl-dirty')}catch(e){}};
 const note=m=>{try{window.SFX&&SFX.toast?SFX.toast(m,{kind:'warn'}):typeof toast=='function'&&toast(m)}catch(e){}};
 const isStory=k=>{const x=KEYREG.find(k);return !!x&&x.id=='story'};
 async function put(k,v){const im=meta[k]&&meta[k].e,r=await api('/api/kv/'+k,{method:'PUT',body:v,keepalive:v.length<60000,headers:im?{'if-match':im}:{}});
  if(r.status==401)throw Object.assign(new Error('auth'),{auth:1});
  if(r.status==412)throw Object.assign(new Error('conflict'),{retry:1,conflict:1});
  if([408,425,429].includes(r.status)||r.status>=500){const ra=+r.headers.get('retry-after');throw Object.assign(new Error('server '+r.status),{retry:1,wait:ra>0?Math.min(ra,60)*1000:0})}
  if(r.status>=400){const m=(await r.text().catch(()=>'')).slice(0,200);rej[k]=m||('HTTP '+r.status);delete meta[k];SF.rejectedKeys=Object.keys(rej);status('rejected');note('Not saved to server: '+k+' ('+rej[k]+')');return}
  delete rej[k];SF.rejectedKeys=Object.keys(rej);meta[k]={h:H(v),e:r.headers.get('etag')||undefined};if(isStory(k))baseQ(k,v)}
 async function del(k){const r=await api('/api/kv/'+k,{method:'DELETE',keepalive:true});if(!r.ok&&r.status!=404)throw new Error('server '+r.status);delete meta[k]}
 async function flush(){if(busy||!online)return;busy=true;let fail=false;
  for(const k of Object.keys(q)){const v=q[k];try{v===null?await del(k):await put(k,v);if(q[k]===v)delete q[k]}catch(e){if(e.conflict){Object.keys(q).forEach(x=>D.add(x));busy=false;saveD();saveMeta();setTimeout(()=>connect(false),0);return}fail=true;if(e.auth&&await askToken(false)){continue}if(e.wait)delay=Math.max(delay,e.wait);online=false;status(e.auth?'auth':'offline');break}}
  busy=false;saveMeta();saveD();if(fail&&!online)later();else if(Object.keys(q).length)flushT=setTimeout(flush,400);else{delay=5000;(SF.rejectedKeys.length?status('rejected'):status('online'))}}
 // Always patch (even in local-only mode) so the UI can show "saved" and the queue is ready for reconnection.
 Storage.prototype.setItem=function(k,v){if(this!==ls||!own(k))return sI.call(this,k,v);store(k,v);window.dispatchEvent(new CustomEvent('sf:write',{detail:{k}}));q[k]=String(v);saveD();clearTimeout(flushT);flushT=setTimeout(flush,400)};
 Storage.prototype.removeItem=function(k){if(this!==ls||!own(k))return rI.call(this,k);OV.delete(k);rI.call(this,k);idbQ(k,null);q[k]=null;saveD();clearTimeout(flushT);flushT=setTimeout(flush,400)};
 addEventListener('pagehide',()=>{if(online)Object.keys(q).forEach(k=>{const v=q[k];try{v===null?api('/api/kv/'+k,{method:'DELETE',keepalive:true}):v.length<60000&&api('/api/kv/'+k,{method:'PUT',body:v,keepalive:true})}catch(e){}})});
 // ---- merge helpers
 const byId=(a,b,key,cap)=>{const m=new Map();[...(b||[]),...(a||[])].forEach(x=>{if(x&&x[key]!=null)m.set(x[key],x)});return[...m.values()].sort((x,y)=>(y.ts||0)-(x.ts||0)).slice(0,cap)};
 const addBak=(k,json,why)=>{const bk='sf-baks-'+k,a=J(ls.getItem(bk))||[];a.unshift({ts:Date.now(),why,j:json});try{store(bk,JSON.stringify(a.slice(0,8)));q[bk]=ls.getItem(bk)}catch(e){}};
 async function resolve(k,L,S){ // returns {value}
  let mc=null;
  const l=J(L),s=J(S);
  const x=KEYREG.find(k);if(x&&x.merge=='maxPerKey'&&l&&s){const o={...s};for(const d in l){const a=l[d],b=s[d];o[d]=!b?a:{w:Math.max(a.w||0,b.w||0),d:Math.max(a.d||0,b.d||0),s:Math.max(a.s||0,b.s||0),p:Math.max(a.p||0,b.p||0)}}return{value:JSON.stringify(o)}}
  if(isStory(k)&&l&&s&&BASE.has(k)&&window.SCHEMA&&SCHEMA.merge3){const b=J(BASE.get(k));if(b){const m=SCHEMA.merge3(b,l,s);addBak(k,L,'before 3-way merge (this device)');addBak(k,S,'before 3-way merge (server)');if(!m.conflicts.length){note('Merged changes from another device');return{value:JSON.stringify(m.value)}}mc=m}}
  if(k=='sf-cur'||k=='sf-sbc')return{value:L};
  if(k=='sf-lib'&&Array.isArray(l)&&Array.isArray(s))return{value:JSON.stringify([...new Set([...l,...s])])};
  if(k=='sf-ui'&&l&&s)return{value:JSON.stringify({...s,...l,cl:{...s.cl,...l.cl},tg:{...s.tg,...l.tg},ct:byId(l.ct,s.ct,'n',200)})};
  if(/^sf-snaps-/.test(k)&&Array.isArray(l)&&Array.isArray(s))return{value:JSON.stringify(byId(l,s,'id',40))};
  if(/^sf-baks-/.test(k)&&Array.isArray(l)&&Array.isArray(s))return{value:JSON.stringify(byId(l,s,'ts',8))};
  const t=(l&&l.title)||(s&&s.title)||k;
  let keepLocal;
  if(mc&&window.SFX&&SFX.choose){const list=mc.conflicts.slice(0,6).map(c=>'• '+String(c.path||'(root)').replace(/^\./,'')).join('\n');
   const ch=await SFX.choose({title:'“'+t+'” changed on both devices',body:mc.conflicts.length+' item'+(mc.conflicts.length>1?'s':'')+' conflict'+(mc.conflicts.length>1?'':'s')+':\n'+list+(mc.conflicts.length>6?'\n…':'')+'\n\nBoth versions are saved under Backup history first.',options:[['merge','Merge (this device wins conflicts)'],['local','Keep this device’s version'],['server','Use the server’s version']]});
   if(ch=='merge'){addBak(k,S,'server version before merge (sync conflict)');return{value:JSON.stringify(mc.value)}}keepLocal=ch!='server'}
  else keepLocal=confirm('“'+t+'” was changed on this device AND on the server.\n\nOK = keep THIS DEVICE’s version\nCancel = use the SERVER’s version\n\n(The version you don’t keep is saved under Backup history.)');
  addBak(k,keepLocal?S:L,keepLocal?'server version replaced by this device (sync conflict)':'local version replaced by server (sync conflict)');
  return{value:keepLocal?L:S}}
 async function getKey(k){const r=await api('/api/kv/'+k);if(r.status==401)throw Object.assign(new Error('auth'),{auth:1});if(!r.ok)throw new Error('http '+r.status);return r.text()}
 async function connect(manual){
  let M;
  try{const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),manual?8000:3500);const r=await api('/api/kv-meta',{signal:ctl.signal});clearTimeout(to);
   if(r.status==401){status('auth');if(await askToken(manual))return connect(manual);return false}
   if(!r.ok)throw new Error('http '+r.status);M=await r.json()}
  catch(e){online=false;status(everOnline?'offline':'local');later();return false}
  try{const me=await api('/api/me').then(r=>r.ok?r.json():null);if(me){SF.me=me.id;SF.multi=!!me.multi;SF.role=me.role;SF.name=me.name;
    if(me.multi){const prev=ls.getItem('xl-user');if(prev&&prev!==me.id){await wipe();sI.call(ls,'xl-user',me.id);location.reload();return false}sI.call(ls,'xl-user',me.id);sI.call(ls,'xl-uname',me.name||me.id);window.dispatchEvent(new Event('sf:account'))}}}catch(e){}
  const pulled=[];SF.lastPulled=pulled;meta=J(ls.getItem('xl-sync'))||{};
  const cur=ls.getItem('sf-cur')||'sf2',order=[...new Set([...Object.keys(M),...KEYS()])].sort((a,b)=>(a==cur?0:own(a)&&isStory(a)?1:2)-(b==cur?0:own(b)&&isStory(b)?1:2));
  try{for(const k of order){
   const sm=M[k],se=sm?'"'+sm.m+'-'+sm.n+'"':null,L=ls.getItem(k);if(L===null&&!sm)continue;
   if(D.has(k)&&L!==null&&(!sm||(meta[k]||{}).e===se)){await put(k,L);continue}   // unsent local write from a previous session wins: upload before pulling
   if(!sm){await put(k,L);continue}                    // only here → upload
   const hL=L===null?null:H(L),mk=meta[k]||{},B=mk.h;
   if(mk.e===se&&L!==null){if(hL!==B)await put(k,L);continue}   // server unchanged since last sync (no download needed)
   const S=await getKey(k),hS=H(S);
   if(hL===hS){meta[k]={h:hL,e:se};if(isStory(k))baseQ(k,S);continue}
   if(L===null){store(k,S);meta[k]={h:hS,e:se};if(isStory(k))baseQ(k,S);pulled.push(k);continue}
   const lc=hL!==B||D.has(k),sc=hS!==B;
   if(!sc){meta[k]={...mk,e:se};await put(k,L)}
   else if(!lc){store(k,S);meta[k]={h:hS,e:se};if(isStory(k))baseQ(k,S);pulled.push(k)}
   else{const r=await resolve(k,L,S);if(r.value!==L)store(k,r.value);meta[k]={h:hS,e:se};await put(k,r.value);if(r.value!==S)pulled.push(k)}
  }}catch(e){if(e.wait)delay=Math.max(delay,e.wait);online=false;status(e.auth?'auth':'offline');saveMeta();later();return false}
  Object.keys(q).forEach(k=>delete q[k]);D.clear();saveD();saveMeta();online=true;everOnline=true;delay=5000;clearTimeout(timer);status(SF.rejectedKeys.length?'rejected':'online');
  if(manual&&pulled.length&&typeof S!='undefined'&&confirm('Newer data was found on the server ('+pulled.length+' item'+(pulled.length>1?'s':'')+'). Reload to use it?'))location.reload();
  return true}
 for(const s of ['ui','rules','wlog','read','lint','beats','find','extras','packs','props','schema','samples','app','worlds','places','semantic','ai','docs','v5','v6','v7','v8','v9','v10','v11','v12','v13','v14','v15','v16','v17','newstory'])await new Promise(ok=>{const e=document.createElement('script');e.src='js/'+s+'.js';e.onload=e.onerror=ok;document.body.appendChild(e)});
 if(typeof render=='function')render();           // all feature scripts have registered their tabs now
 window.dispatchEvent(new Event('sf:ready'));
 if('serviceWorker' in navigator&&location.protocol!='file:')navigator.serviceWorker.register('/sw.js').then(reg=>{reg.addEventListener('updatefound',()=>{const w=reg.installing;w&&w.addEventListener('statechange',()=>{if(w.state=='installed'&&navigator.serviceWorker.controller&&window.SFX)SFX.toast('Update available',{ms:15000,action:{label:'Reload',run:()=>{w.postMessage('skip');setTimeout(()=>location.reload(),300)}}})})})}).catch(()=>{});
 // first paint is from local data; sync runs afterwards
 let dirtyLocal=false;const mark=()=>{dirtyLocal=true};addEventListener('sf:write',mark);
 // live adoption of newer remote data into the running app (no reload) when the user isn't mid-edit
 let lastLocal=0;addEventListener('sf:write',()=>{lastLocal=Date.now()});
 const adopt=pulled=>{if(!pulled.includes(ls.getItem('sf-cur')||'sf2'))return false;if(Date.now()-lastLocal<3000){note('A newer version arrived from another device — finish your edit, then reload');return false}
  try{const k=ls.getItem('sf-cur')||'sf2',keep={tab:S.tab,sel:S.sel};const n=norm(JSON.parse(ls.getItem(k)));n.tab=keep.tab||n.tab;n.sel=keep.sel||n.sel;S=n;render();window.SFX&&SFX.toast('Updated from another device',{kind:'ok'});return true}catch(e){return false}};
 SF.adopt=adopt;
 connect(false).then(()=>{removeEventListener('sf:write',mark);const pulled=SF.lastPulled||[];
  if(pulled.length){if(!dirtyLocal&&!sessionStorage.getItem('xl-reloaded')){sessionStorage.setItem('xl-reloaded','1');location.reload()}else if(!adopt(pulled))note('Newer data on server — reload to use it')}else sessionStorage.removeItem('xl-reloaded');startFeed()});
 // ---- F2: change feed via fetch streaming (EventSource can't send Authorization) with Last-Event-ID resume
 let feedOn=false,lastId=0,feedDelay=1000,syncT=null;
 async function startFeed(){if(feedOn||!window.ReadableStream)return;feedOn=true;
  for(;;){try{const r=await api('/api/events'+(lastId?'?since='+lastId:''));if(!r.ok||!r.body)throw new Error('feed '+r.status);feedDelay=1000;const rd=r.body.getReader(),td=new TextDecoder();let buf='';
    for(;;){const{done,value}=await rd.read();if(done)break;buf+=td.decode(value,{stream:true});let i;while((i=buf.indexOf('\n\n'))>=0){const blk=buf.slice(0,i);buf=buf.slice(i+2);const m=/data: (.*)/.exec(blk);if(!m)continue;let ev;try{ev=JSON.parse(m[1])}catch(e){continue}lastId=Math.max(lastId,ev.id||0);onFeed(ev)}}
   }catch(e){}
   await new Promise(r=>setTimeout(r,feedDelay));feedDelay=Math.min(30000,feedDelay*2)}}
 function onFeed(ev){if(ev.type=='presence'){window.dispatchEvent(new CustomEvent('sf:presence',{detail:ev}));return}
  if(ev.type!='kv'||!own(ev.k)||ev.owner!=(SF.me||ev.owner))return;if(ev.etag&&meta[ev.k]&&meta[ev.k].e===ev.etag)return;   // our own write echoing back
  clearTimeout(syncT);syncT=setTimeout(async()=>{if(Object.keys(q).length)return;const ok=await connect(false);if(ok)adopt(SF.lastPulled||[])},300)}
})();
