// Server tests: security headers, traversal, auth lock-out, ETag/If-Match, batch, blobs
const assert=require('assert'),{spawn}=require('child_process'),os=require('os'),fs=require('fs'),path=require('path'),crypto=require('crypto'),net=require('net');
const free=()=>new Promise(r=>{const s=net.createServer().listen(0,()=>{const p=s.address().port;s.close(()=>r(p))})});
(async()=>{const port=await free(),dir=fs.mkdtempSync(path.join(os.tmpdir(),'sf-'));
 const proc=spawn('node',[path.join(__dirname,'../server/index.js')],{env:{...process.env,PORT:port,HOST:'127.0.0.1',KATHAKAAR_DATA:dir,KATHAKAAR_TOKEN:'tok',EMBED_BACKEND:'hash'},stdio:'ignore'});
 const U='http://127.0.0.1:'+port,A={authorization:'Bearer tok'};
 try{for(let i=0;i<50;i++){try{await fetch(U+'/healthz');break}catch(e){await new Promise(r=>setTimeout(r,100))}}
  let r=await fetch(U+'/');assert.strictEqual(r.status,200);assert(/default-src 'self'/.test(r.headers.get('content-security-policy')));assert.strictEqual(r.headers.get('x-content-type-options'),'nosniff');
  const et=r.headers.get('etag');r=await fetch(U+'/',{headers:{'if-none-match':et}});assert.strictEqual(r.status,304);
  // gzip identical bytes
  r=await fetch(U+'/js/boot.js',{headers:{'accept-encoding':'gzip'}});const t1=await r.text();assert.strictEqual(t1,fs.readFileSync(path.join(__dirname,'../public/js/boot.js'),'utf8'));
  // traversal
  for(const p of ['/..%2fserver/index.js','//etc/passwd','/..%2f..%2fetc%2fpasswd','/%00']){r=await fetch(U+p);assert([400,404].includes(r.status),p+' '+r.status)}
  // kv + etag + if-match
  const put=(k,v,h={})=>fetch(U+'/api/kv/'+k,{method:'PUT',body:v,headers:{...A,...h}});
  r=await put('sf2',JSON.stringify({title:'a',ev:[]}));assert.strictEqual(r.status,200);const e1=r.headers.get('etag');assert(e1);
  r=await fetch(U+'/api/kv/sf2',{headers:{...A,'if-none-match':e1}});assert.strictEqual(r.status,304);
  r=await put('sf2',JSON.stringify({title:'b'}),{'if-match':'"bogus"'});assert.strictEqual(r.status,412);
  r=await put('sf2',JSON.stringify({title:'b'}),{'if-match':e1});assert.strictEqual(r.status,200);
  r=await put('sf2','[1]');assert.strictEqual(r.status,400);
  // batch
  r=await fetch(U+'/api/kv-batch',{method:'POST',headers:A,body:JSON.stringify({puts:{sf3:'{"title":"x"}',sfbad:'nope'},dels:['sf2']})});const b=await r.json();assert.strictEqual(b.sf3,'ok');assert(/^400/.test(b.sfbad));assert.strictEqual(b.sf2,'ok');
  // blobs
  const buf=crypto.randomBytes(1000),h=crypto.createHash('sha256').update(buf).digest('hex');
  r=await fetch(U+'/api/blob/'+'0'.repeat(64),{method:'PUT',headers:A,body:buf});assert.strictEqual(r.status,400);
  r=await fetch(U+'/api/blob/'+h,{method:'PUT',headers:A,body:buf});assert.strictEqual(r.status,200);
  r=await fetch(U+'/api/blob/'+h,{headers:A});assert(/immutable/.test(r.headers.get('cache-control')));assert.strictEqual(Buffer.from(await r.arrayBuffer()).compare(buf),0);
  // lockout: 11 wrong tokens → 429
  let last;for(let i=0;i<12;i++)last=(await fetch(U+'/api/kv-meta',{headers:{authorization:'Bearer no'}})).status;assert.strictEqual(last,429);
  console.log('server ok')}catch(e){console.error(e);process.exitCode=1}finally{proc.kill()}})();
// encryption at rest + export + sw
(async()=>{const crypto=require('crypto'),{spawn}=require('child_process'),fs=require('fs'),os=require('os'),path=require('path'),net=require('net');
 const C=require('../server/crypt');const k=C.load('passphrase'),pt=Buffer.from('{"title":"secret"}'),ct=C.enc(pt,k);assert(C.isEnc(ct));assert(!ct.includes('secret'));assert.strictEqual(C.dec(ct,k).toString(),'{"title":"secret"}');
 assert.throws(()=>{const bad=Buffer.from(ct);bad[20]^=1;C.dec(bad,k)});assert.throws(()=>C.dec(ct,null));assert.strictEqual(C.dec(pt,k),pt);
 const port=await new Promise(r=>{const s=net.createServer().listen(0,()=>{const p=s.address().port;s.close(()=>r(p))})}),dir=fs.mkdtempSync(path.join(os.tmpdir(),'sfe-'));
 const proc=spawn('node',[path.join(__dirname,'../server/index.js')],{env:{...process.env,PORT:port,HOST:'127.0.0.1',KATHAKAAR_DATA:dir,KATHAKAAR_TOKEN:'t',KATHAKAAR_KEY:'passphrase',EMBED_BACKEND:'hash'},stdio:'ignore'});
 try{const U='http://127.0.0.1:'+port,A={authorization:'Bearer t'};for(let i=0;i<50;i++){try{await fetch(U+'/healthz');break}catch(e){await new Promise(r=>setTimeout(r,100))}}
  let r=await fetch(U+'/api/kv/sf9',{method:'PUT',headers:A,body:'{"title":"visible only through the API"}'});assert.strictEqual(r.status,200);
  assert(!fs.readFileSync(path.join(dir,'kv','sf9.json')).includes('visible only'),'file must be encrypted on disk');
  r=await fetch(U+'/api/kv/sf9',{headers:A});assert.strictEqual((await r.json()).title,'visible only through the API');
  r=await fetch(U+'/api/export',{headers:A});assert(/"k":"sf9"/.test(await r.text()));
  r=await fetch(U+'/sw.js');assert(/caches\.open/.test(await r.text()));assert.strictEqual((await fetch(U+'/manifest.webmanifest')).status,200);
  console.log('crypto/export/sw ok')}catch(e){console.error(e);process.exitCode=1}finally{proc.kill()}})();
