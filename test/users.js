// Multi-user mode: isolation, sharing roles, audit log, single-token compat unaffected (covered by test/server.js)
const assert=require('assert'),{spawn,execFileSync}=require('child_process'),os=require('os'),fs=require('fs'),path=require('path'),net=require('net');
(async()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sfu-')),env={...process.env,KATHAKAAR_DATA:dir,EMBED_BACKEND:'hash'};
 const tok=id=>execFileSync('node',[path.join(__dirname,'../server/tools/adduser.js'),id],{env}).toString().trim().split(': ')[1];
 const A=tok('ana'),B=tok('ben'),C=tok('cy');assert(!fs.readFileSync(path.join(dir,'users.json'),'utf8').includes(A),'tokens must not be stored in plain text');
 const port=await new Promise(r=>{const s=net.createServer().listen(0,()=>{const p=s.address().port;s.close(()=>r(p))})});
 const proc=spawn('node',[path.join(__dirname,'../server/index.js')],{env:{...env,PORT:port,HOST:'127.0.0.1'},stdio:'ignore'});
 try{const U='http://127.0.0.1:'+port,H=t=>({authorization:'Bearer '+t});for(let i=0;i<50;i++){try{await fetch(U+'/healthz');break}catch(e){await new Promise(r=>setTimeout(r,100))}}
  const put=(t,k,v,extra={})=>fetch(U+'/api/kv/'+k,{method:'PUT',headers:{...H(t),...extra},body:JSON.stringify(v)});
  assert.strictEqual((await fetch(U+'/api/kv-meta',{headers:H('nope')})).status,401);
  assert.strictEqual((await put(A,'sf2',{title:'Ana story'})).status,200);assert.strictEqual((await put(B,'sf2',{title:'Ben story'})).status,200);
  assert.strictEqual((await (await fetch(U+'/api/kv/sf2',{headers:H(A)})).json()).title,'Ana story');assert.strictEqual((await (await fetch(U+'/api/kv/sf2',{headers:H(B)})).json()).title,'Ben story');   // same key, separate namespaces
  assert.strictEqual((await (await fetch(U+'/api/me',{headers:H(A)})).json()).id,'ana');
  // not shared yet
  assert.strictEqual((await fetch(U+'/api/shared/ana/sf2',{headers:H(B)})).status,404);
  const share=(t,b)=>fetch(U+'/api/share',{method:'POST',headers:H(t),body:JSON.stringify(b)});
  assert.strictEqual((await share(A,{key:'sf2',user:'ben',role:'reader'})).status,200);assert.strictEqual((await share(A,{key:'sf2',user:'cy',role:'editor'})).status,200);
  assert.strictEqual((await share(B,{key:'sf2',user:'cy',role:'editor'})).status,200===0?0:200);   // Ben can only share HIS sf2, not Ana's
  assert.strictEqual((await (await fetch(U+'/api/shared/ana/sf2',{headers:H(B)})).json()).title,'Ana story');
  const sput=(t,v)=>fetch(U+'/api/shared/ana/sf2',{method:'PUT',headers:H(t),body:JSON.stringify(v)});
  assert.strictEqual((await sput(B,{title:'hack'})).status,403);assert.strictEqual((await sput(C,{title:'By Cy'})).status,200);
  assert.strictEqual((await (await fetch(U+'/api/kv/sf2',{headers:H(A)})).json()).title,'By Cy');assert.strictEqual((await (await fetch(U+'/api/kv/sf2',{headers:H(B)})).json()).title,'Ben story');
  assert.deepStrictEqual((await (await fetch(U+'/api/shared',{headers:H(B)})).json()).map(x=>x.role),['reader']);
  // revocation is immediate
  await share(A,{key:'sf2',user:'cy',role:'none'});assert.strictEqual((await sput(C,{title:'again'})).status,404);
  const log=fs.readFileSync(path.join(dir,'audit.log'),'utf8');assert(/"user":"cy"/.test(log)&&/put-shared:ana/.test(log)&&!/Ana story|By Cy/.test(log),'audit logs who/what/when, never content');
  console.log('users ok')}catch(e){console.error(e);process.exitCode=1}finally{proc.kill()}})();
// F2: change feed + presence + resume
(async()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sff-')),env={...process.env,KATHAKAAR_DATA:dir,EMBED_BACKEND:'hash'};
 const tok=id=>execFileSync('node',[path.join(__dirname,'../server/tools/adduser.js'),id],{env}).toString().trim().split(': ')[1];const A=tok('ana'),B=tok('ben'),C=tok('cy');
 const port=await new Promise(r=>{const s=net.createServer().listen(0,()=>{const p=s.address().port;s.close(()=>r(p))})});
 const proc=spawn('node',[path.join(__dirname,'../server/index.js')],{env:{...env,PORT:port,HOST:'127.0.0.1'},stdio:'ignore'});
 try{const U='http://127.0.0.1:'+port,H=t=>({authorization:'Bearer '+t});for(let i=0;i<50;i++){try{await fetch(U+'/healthz');break}catch(e){await new Promise(r=>setTimeout(r,100))}}
  const listen=async(t,since)=>{const ctl=new AbortController(),r=await fetch(U+'/api/events'+(since?'?since='+since:''),{headers:H(t),signal:ctl.signal}),evs=[];(async()=>{const rd=r.body.getReader(),td=new TextDecoder();let buf='';try{for(;;){const{done,value}=await rd.read();if(done)break;buf+=td.decode(value);let i;while((i=buf.indexOf('\n\n'))>=0){const m=/data: (.*)/.exec(buf.slice(0,i));buf=buf.slice(i+2);if(m)evs.push(JSON.parse(m[1]))}}}catch(e){}})();return{evs,stop:()=>ctl.abort()}};
  const put=(t,k,v)=>fetch(U+'/api/kv/'+k,{method:'PUT',headers:H(t),body:JSON.stringify(v)});
  const la=await listen(A),lb=await listen(B),lc=await listen(C);await put(A,'sf2',{title:'x'});await new Promise(r=>setTimeout(r,300));
  assert(la.evs.some(e=>e.k=='sf2'&&e.owner=='ana'),'owner gets own change');assert.strictEqual(lb.evs.filter(e=>e.k=='sf2').length,0,'others do not see unshared keys');
  await fetch(U+'/api/share',{method:'POST',headers:H(A),body:JSON.stringify({key:'sf2',user:'ben',role:'editor'})});await put(A,'sf2',{title:'y'});await new Promise(r=>setTimeout(r,300));
  assert(lb.evs.some(e=>e.k=='sf2'),'shared member sees changes');assert.strictEqual(lc.evs.filter(e=>e.k=='sf2').length,0,'non-member does not');
  // presence reaches members; non-members forbidden
  const pr=await fetch(U+'/api/presence',{method:'POST',headers:H(B),body:JSON.stringify({owner:'ana',story:'sf2',chapter:'e7'})});assert.strictEqual(pr.status,200);assert.strictEqual((await fetch(U+'/api/presence',{method:'POST',headers:H(C),body:JSON.stringify({owner:'ana',story:'sf2',chapter:'e7'})})).status,403);
  await new Promise(r=>setTimeout(r,300));assert(la.evs.some(e=>e.type=='presence'&&e.here.some(h=>h.user=='ben'&&h.chapter=='e7')));
  // resume without gaps
  const lastId=la.evs[la.evs.length-1].id;la.stop();await put(A,'sf3',{title:'while offline'});const la2=await listen(A,lastId);await new Promise(r=>setTimeout(r,300));assert(la2.evs.some(e=>e.k=='sf3'),'Last-Event-ID resume replays missed changes');
  [lb,lc,la2].forEach(l=>l.stop());console.log('events/presence ok')}catch(e){console.error(e);process.exitCode=1}finally{proc.kill()}})();
