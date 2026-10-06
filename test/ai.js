// AI stack tests with mock Ollama / OpenAI / Anthropic servers (no network, no models needed).
const fs=require('fs'),os=require('os'),path=require('path'),assert=require('assert'),http=require('http');
process.env.KATHAKAAR_DATA=fs.mkdtempSync(path.join(os.tmpdir(),'sfai-'));
const AC=require('../server/aiconfig'),EM=require('../server/embedder'),JD=require('../server/judge'),{check,explain}=require('../server/checker');
const seen=[];
const mock=http.createServer((q,r)=>{let b='';q.on('data',c=>b+=c);q.on('end',()=>{const j=b?JSON.parse(b):{};seen.push({url:q.url,auth:q.headers.authorization||q.headers['x-api-key']||'',body:j});
 const verdictFor=t=>/\b(never|nobody|no one|nothing)\b/i.test(t)?{verdict:'ok',reason:'only a denial'}:{verdict:'violation',reason:'shows it happening'};
 const passage=s=>{const m=/"""([\s\S]*?)"""/.exec(s||'');return m?m[1]:''};
 const out=o=>{r.writeHead(200,{'content-type':'application/json'});r.end(JSON.stringify(o))};
 if(q.url=='/v1/embeddings'||q.url=='/embeddings')return out({data:j.input.map((t,i)=>({index:i,embedding:EM.hashEmbed(t)}))});
 if(q.url=='/api/embed')return out({embeddings:j.input.map(EM.hashEmbed)});
 if(q.url=='/api/chat')return out({message:{content:JSON.stringify(verdictFor(passage(j.messages[1].content)))}});
 if(q.url=='/chat/completions')return out({choices:[{message:{content:'Sure: '+JSON.stringify(verdictFor(passage(j.messages[1].content)))}}]});
 if(q.url=='/v1/messages')return out({content:[{type:'text',text:JSON.stringify(verdictFor(passage(j.messages[0].content)))}]});
 if(q.url=='/api/tags')return out({models:[{name:'qwen2.5:7b'}]});
 r.writeHead(404);r.end('{}')})}).listen(0);
(async()=>{await new Promise(o=>mock.once('listening',o));const base='http://127.0.0.1:'+mock.address().port;
 const world={rules:[{id:'f',cat:'Physics',text:'Nobody can fly',ban:'flying'}]},items=[{id:'a',text:'The wizard was flying above the market.'},{id:'b',text:'Nobody was flying above the market that day.'}];
 // 1. config: validation + secrets never exposed
 assert.throws(()=>AC.set({judge:{provider:'bogus'}}),/provider/);assert.throws(()=>AC.set({judge:{baseUrl:'ftp://x'}}),/http/);
 AC.set({embed:{provider:'hash'},judge:{provider:'anthropic',model:'claude-haiku-4-5-20251001',baseUrl:base,key:'sk-ant-SECRET1234'}});
 const pv=JSON.stringify(AC.publicView());assert.ok(!pv.includes('SECRET1234')&&pv.includes('••••1234'),'key masked');
 assert.ok((fs.statSync(path.join(process.env.KATHAKAAR_DATA,'ai-config.json')).mode&0o077)==0,'config file private');
 AC.set({judge:{key:'••••'}});assert.strictEqual(AC.get().judge.key,'sk-ant-SECRET1234','masked value keeps key');
 // 2. no judge: both sentences flagged (embeddings can't see negation)
 AC.set({judge:{provider:'none'}});let r=await check(world,items,0);assert.ok(r.results.a.length&&r.results.b.length,'without judge both flagged');
 // 3. judge via each provider dismisses the negated one and keeps the real one
 for(const [prov,model,expUrl,hdr] of [['anthropic','claude-haiku-4-5-20251001','/v1/messages','sk-ant-SECRET1234'],['openai','gpt-4o-mini','/chat/completions','Bearer sk-oa'],['ollama','qwen2.5:7b','/api/chat','']]){
  AC.set({judge:{provider:prov,model,baseUrl:base,key:prov=='openai'?'sk-oa':prov=='anthropic'?'sk-ant-SECRET1234':''}});seen.length=0;
  r=await check(world,items,0);assert.ok(r.results.a.length&&r.results.a[0].verdict=='violation','real violation kept ('+prov+')');
  assert.ok(!r.results.b.length&&r.judge.dismissed==1,'negation dismissed ('+prov+')');assert.strictEqual(r.judge.provider,prov);
  const call=seen.find(x=>x.url==expUrl);assert.ok(call,'called '+expUrl);if(hdr)assert.strictEqual(call.auth,hdr,'auth header');
  const sent=JSON.stringify(call.body);assert.ok(!/ploughed|market that day\.\s*Nothing/.test(sent)&&sent.includes('flying'),'only candidate passage + rule sent');}
 // 4. cache: second run makes no new judge calls
 seen.length=0;await check(world,items,0);assert.strictEqual(seen.filter(x=>x.url=='/api/chat').length,0,'verdicts cached');
 // 5. explain() returns the verdict
 const ex=await explain({text:'Nobody can fly',ban:'flying'},'The wizard was flying above the market.',0);assert.ok(ex.judge&&ex.judge.verdict=='violation');
 // 6. failure falls back to embedding result and reports error
 AC.set({judge:{provider:'ollama',model:'x',baseUrl:'http://127.0.0.1:1'}});r=await check(world,[{id:'z',text:'The wizard was flying again.'}],0);assert.ok(r.results.z.length&&r.judge.errors.length,'judge failure keeps flag + reports');
 // 7. remote / ollama embeddings
 AC.set({judge:{provider:'none'},embed:{provider:'openai',model:'text-embedding-3-small',baseUrl:base+'/v1',key:'k'}});await EM.load(true);assert.strictEqual(EM.info().provider,'openai');
 r=await check(world,items,0);assert.ok(r.results.a.length,'openai-compatible embeddings work');
 AC.set({embed:{provider:'ollama',model:'nomic-embed-text',baseUrl:base,key:''}});await EM.load(true);assert.strictEqual(EM.info().provider,'ollama');assert.ok(EM.info().neural);
 const cal=await EM.calibrate();assert.ok(cal.thr>0&&cal.f1>=0,'calibration runs');assert.ok(EM.info().calibrated,'calibration stored per engine');
 // 8. unreachable engine → falls back to hash with a reason
 AC.set({embed:{provider:'ollama',model:'nomic-embed-text',baseUrl:'http://127.0.0.1:1'}});await EM.load(true);assert.strictEqual(EM.info().provider,'hash');assert.ok(/ollama/.test(EM.info().reason));
 console.log('ai ok');mock.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
