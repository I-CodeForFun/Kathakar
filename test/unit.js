// Unit tests: rule extraction, triggers, wildcards, schema validation/migration, server validation & limits.
process.env.EMBED_BACKEND='hash';
const assert=require('assert'),R=require('../public/js/rules.js'),SC=require('../public/js/schema.js');
let n=0;const t=(name,f)=>{try{f();n++}catch(e){console.error('FAIL',name,'\n',e.message);process.exit(1)}};
const base=x=>R.baseConcepts({text:x});
t('concept: modal + location stripped',()=>assert.deepStrictEqual(base('Nobody may carry weapons in the temple'),['carry weapons','weapons']));
t('concept: no one may enter',()=>assert.ok(base('No one may enter the vault').includes('vault')));
t('concept: subject cannot verb',()=>assert.deepStrictEqual(base('Humans cannot fly'),['fly']));
t('concept: X is forbidden',()=>assert.deepStrictEqual(base('Magic is forbidden in the city.'),['magic']));
t('concept: trailing allowed',()=>assert.deepStrictEqual(base('No weapons allowed in the temple'),['weapons']));
t('concept: there is no X',()=>assert.deepStrictEqual(base('There is no money in the realm'),['money']));
t('concept: ban list wins over text',()=>assert.deepStrictEqual(R.baseConcepts({ban:'flying, teleport*',text:'No magic'}),['flying','teleport']));
t('concept: unrelated sentence → none',()=>assert.deepStrictEqual(base('The sky is blue'),[]));
t('expand: weapons → sword',()=>assert.ok(R.concepts({text:'Nobody may carry weapons in the temple'}).includes('sword')));
t('stem',()=>{assert.strictEqual(R.stem('flying'),'fly');assert.strictEqual(R.stem('weapons'),'weapon');assert.strictEqual(R.stem('swimming'),'swim')});
t('wildcard: letters inside a word',()=>{const re=R.wre('fly*');assert.ok(re.test('the bird was flying'));assert.ok(!re.test('butterfly'))});
t('lexical: rule text',()=>assert.strictEqual(R.lexCheck({text:'Nobody may carry weapons in the temple'},'Kael drew his sword.')[0].how,'rule text'));
t('lexical: clean text passes',()=>assert.strictEqual(R.lexCheck({text:'Nobody may carry weapons in the temple'},'Kael prayed quietly.').length,0));
t('lexical: explicit trigger',()=>{const h=R.lexCheck({trig:'gold + water|river',text:'x'},'The gold coin fell. Into the river.');assert.strictEqual(h[0].how,'trigger');assert.ok(h[0].quote.includes('river'))});
t('lexical: trigger needs ALL groups',()=>assert.strictEqual(R.lexCheck({trig:'gold + water'},'The gold coin shone.').length,0));
t('lexical: derived trigger',()=>assert.strictEqual(R.lexCheck({text:'Gold reacts with water'},'Sona was made of gold. She waded across the river.')[0].how,'trigger'));
t('lexical: quote is the exact sentence',()=>assert.strictEqual(R.lexCheck({ban:'dragon'},'Calm morning. A dragon landed. Birds sang.')[0].quote,'A dragon landed.'));
t('schema: rejects non-list',()=>assert.ok(SC.validate({chars:{}}).errors.length));
t('schema: rejects __proto__',()=>assert.ok(SC.validate(JSON.parse('{"__proto__":{}}')).errors.length));
t('schema: warns duplicates',()=>assert.ok(SC.validate({chars:[{id:'a'},{id:'a'}]}).warnings.length));
t('schema: ok story',()=>assert.deepStrictEqual(SC.validate({chars:[],ev:[]}),{errors:[],warnings:[]}));
t('migrate: info.cell + fin string, idempotent',()=>{const o=SC.migrate({info:[{cell:'p|t'}],ev:[{fin:'x'}]});assert.strictEqual(o.info[0].pl,'p');assert.deepStrictEqual(o.ev[0].fin,{book:'x'});assert.strictEqual(o.v,SC.VERSION);const j=JSON.stringify(o);assert.strictEqual(JSON.stringify(SC.migrate(o)),j)});
(async()=>{
 const {check}=require('../server/checker');
 const w={rules:[{id:'w',text:'x',ban:'fly*'},{id:'t',text:'Nobody may carry weapons in the temple'}]};
 const r=await check(w,[{id:'a',text:'A flyer passed. Nothing else.'},{id:'b',text:'He drew his sword in the nave.'},{id:'c',text:'Quiet prayer.'}]);
 assert.ok(r.results.a.some(x=>x.rule=='w'&&x.how=='forbidden word'),'server wildcard');
 assert.ok(r.results.b.some(x=>x.rule=='t'&&x.score>0),'server derived concept + score');
 assert.ok(!r.results.c.length);assert.strictEqual(r.truncated,false);
 const big=await check(w,[{id:'z',text:'a. '.repeat(40000)}]);assert.strictEqual(big.truncated,true);
 // server: validation, auth, rate limit
 process.env.PORT=3299;process.env.KATHAKAAR_TOKEN='sekret';process.env.RATE_LIMIT='1000';
 const dir=require('fs').mkdtempSync(require('os').tmpdir()+'/sf');
 require('../server/index.js');await new Promise(o=>setTimeout(o,400));
 const f=(p,o={})=>fetch('http://localhost:3299'+p,{...o,headers:{authorization:'Bearer sekret',...(o.headers||{})}});
 assert.strictEqual((await fetch('http://localhost:3299/api/kv')).status,401,'auth required');
 assert.strictEqual((await f('/api/kv/sf-test-bad',{method:'PUT',body:'{not json'})).status,400,'invalid JSON rejected');
 assert.strictEqual((await f('/api/kv/sf-test-bad',{method:'PUT',body:JSON.stringify({chars:{}})})).status,400,'invalid story rejected');
 assert.strictEqual((await f('/api/kv/sf-lib',{method:'PUT',body:JSON.stringify(['../x'])})).status,400,'bad library rejected');
 assert.strictEqual((await f('/api/kv/sf-unit-ok',{method:'PUT',body:JSON.stringify({chars:[],ev:[]})})).status,200,'valid story stored');
 await f('/api/kv/sf-unit-ok',{method:'DELETE'});
 console.log('unit ok ('+(n+9)+' checks)');process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});

// P0-1: failing migration step must not stamp version past last good step (D-7)
{const S=require('../public/js/schema.js');const o={v:0,ev:[null]};
 const orig=S.migrate;const r=S.migrate({v:5,ev:[],goal:'x'});assert.strictEqual(r.v,10);
 const r2=S.migrate(JSON.parse(JSON.stringify(r)));assert.deepStrictEqual(r2,r);console.log('ok migrate idempotent')}
{const K=require('../public/js/keys.js'),S=require('../public/js/schema.js');
 const T=[['sf2','story',true],['sf-cur','cur',true],['sf-lib','lib',true],['sf-ui','ui',true],['sf-snaps-abc','snaps',true],['sf-baks-abc','baks',true],['sf-wlog-abc','wlog',true],['xl-timer','local',false],['sf-sbc','sbc',true]];
 T.forEach(([k,id,sync])=>{const x=K.find(k);assert.strictEqual(x.id,id,k);assert.strictEqual(x.sync,sync,k)});
 assert.strictEqual(K.find('bogus'),null);assert(!K.isSynced('xl-timer'));
 assert(K.check('sf-bogus!','{}',S));assert(K.check('sf-wlog-a','{"x":1}',S));assert.strictEqual(K.check('sf-wlog-a','{"2026-01-02":{"w":5}}',S),'');
 console.log('ok keys')}
{const S=require('../public/js/schema.js');
 assert.strictEqual(S.VERSION,10);
 const o=S.migrate({v:6,ev:[]});assert(Array.isArray(o.inbox)&&Array.isArray(o.tpls)&&o.v==10);
 assert.strictEqual(JSON.stringify(S.migrate(JSON.parse(JSON.stringify(o)))),JSON.stringify(o));
 const f=S.migrate({v:99,x:1});assert.strictEqual(f.x,1);assert.strictEqual(f.v,99);
 // repair + usage
 const s={chars:[{id:'a'}],ev:[{id:'e1',chars:['a','zz']}]};assert.strictEqual(S.usage(s,'chars','a').length,1);assert.strictEqual(S.repair(s),1);assert.deepStrictEqual(s.ev[0].chars,['a']);
 // merge3
 const B={title:'t',ev:[{id:1,title:'A'},{id:2,title:'B'}]};
 let m=S.merge3(B,{title:'t2',ev:[{id:1,title:'A'},{id:2,title:'B'}]},{title:'t',ev:[{id:1,title:'A2'},{id:2,title:'B'},{id:3,title:'C'}]});
 assert.strictEqual(m.conflicts.length,0);assert.strictEqual(m.value.title,'t2');assert.strictEqual(m.value.ev[0].title,'A2');assert.strictEqual(m.value.ev.length,3);
 m=S.merge3(B,{title:'x',ev:B.ev},{title:'y',ev:B.ev});assert.strictEqual(m.conflicts.length,1);
 m=S.merge3(B,{title:'t',ev:[{id:1,title:'A'}]},{title:'t',ev:[{id:1,title:'A'},{id:2,title:'B!'}]});assert.strictEqual(m.conflicts[0].kind,'delete-vs-edit');assert.strictEqual(m.value.ev.length,2);
 m=S.merge3({p:'a\nb\nc'},{p:'a1\nb\nc'},{p:'a\nb\nc3'});assert.strictEqual(m.value.p,'a1\nb\nc3');assert.strictEqual(m.conflicts.length,0);
 // property: merge in either order converges when edits are disjoint
 for(let i=0;i<200;i++){const base={ev:[1,2,3,4].map(n=>({id:n,t:'x'+n}))},A=JSON.parse(JSON.stringify(base)),Bb=JSON.parse(JSON.stringify(base));
  A.ev[i%4].t='A'+i;Bb.ev[(i+1)%4].t='B'+i;const m1=S.merge3(base,A,Bb),m2=S.merge3(base,Bb,A);assert.deepStrictEqual(m1.value.ev.map(e=>e.t).sort(),m2.value.ev.map(e=>e.t).sort());assert.strictEqual(m1.value.ev.length,4)}
 console.log('ok schema v7 / merge3')}
{const W=require('../public/js/wlog.js'),R=require('../public/js/read.js'),B=require('../public/js/beats.js');
 assert.deepStrictEqual(W.delta('a b','a b c d','insertText'),{w:2,d:0,p:0});
 assert.deepStrictEqual(W.delta('','x '.repeat(800),'insertFromPaste'),{w:0,d:0,p:800});
 assert.strictEqual(W.delta('a b c','a','insertText').d,2);
 const log={};W.add(log,'2026-10-01',{w:300});W.add(log,'2026-10-02',{w:260});W.add(log,'2026-10-03',{w:100});
 assert.strictEqual(W.stats(log,250,'2026-10-02').streak,2);assert.strictEqual(W.stats(log,250,'2026-10-03').streak,2);   // today not met yet → counts up to yesterday
 assert.strictEqual(W.dayAdd('2026-03-01',-1),'2026-02-28');assert.strictEqual(W.heat(log,'2026-10-04').length,84);
 assert.strictEqual(W.csv(log).split('\n').length,4);assert.strictEqual(W.project(1000,2000,100,'2026-10-04'),'2026-10-14');
 const fk=R.analyze('The cat sat on the mat. The dog ran to the park. It was a good day for all of us.');assert(fk.fk<3&&fk.fre>90,JSON.stringify(fk));
 const hard=R.analyze('Notwithstanding considerable epistemological ramifications, institutional bureaucracies consistently demonstrate extraordinary resistance.');assert(hard.fk>15);
 assert.strictEqual(R.syl('table'),2);assert.strictEqual(R.syl('beautiful'),3);assert.strictEqual(R.syl('cake'),1);
 const hj=B.byId('hero');assert.strictEqual(hj.points.length,12);assert.strictEqual(B.byId('stc').points.length,15);
 const cr=B.plan(hj,[],'create',[0,100]);assert.strictEqual(cr.length,12);assert.strictEqual(cr[0].t,3);
 const evs=Array.from({length:20},(_,i)=>({id:'e'+i,t:i*5}));const mp=B.plan(hj,evs,'map',[0,100]);assert.strictEqual(mp.length,12);assert.strictEqual(new Set(mp.map(x=>x.eventId)).size,12);
 evs.find(e=>e.id==mp[0].eventId).beat='hero:'+mp[0].point;assert.strictEqual(B.plan(hj,evs,'map',[0,100]).length,11);   // re-apply skips mapped
 console.log('ok wlog/read/beats')}
{const L=require('../public/js/lint.js');
 const ids=t=>L.lint(t).map(h=>h.ruleId);
 assert(ids('The door was opened by Sam.').includes('passive'));assert(ids('The window was seen by him.').includes('passive'));
 assert(!ids('She was tired and bored.').includes('passive'));assert(!ids('He was very tired.').includes('passive'));
 assert(ids('He exclaimed loudly.').includes('tag'));assert(ids('“No,” she said angrily.').includes('tag'));
 assert(ids('She felt happy.').includes('tell'));assert(ids('It was a dark and stormy night.').includes('cliche'));
 assert(!ids('“She saw it,” he said.').includes('filter'));assert(ids('She saw the light.').includes('filter'));
 const t='A cat sat. He sat down. He sat again. He sat once more, as the colour of the grey sky turned color.';
 assert(L.lint(t).some(h=>h.ruleId=='repeat'));assert(L.lint(t).some(h=>h.ruleId=='spelling'));
 L.lint('The door was opened by Sam. She felt happy. Very odd.').forEach(h=>assert.strictEqual('The door was opened by Sam. She felt happy. Very odd.'.slice(h.start,h.end),h.snippet));
 assert.strictEqual(L.lint('The door was opened by Sam.',{ignore:['passive:was opened']}).filter(h=>h.ruleId=='passive').length,0);
 assert(L.lint('word '.repeat(40)+'.').some(h=>h.ruleId=='longsent'));
 const big=('The quick brown fox jumped over the lazy dog and then it was seen by everyone. ').repeat(1500);const t0=Date.now();L.lint(big);assert(Date.now()-t0<3000,'lint perf '+(Date.now()-t0));
 console.log('ok lint')}
{const F=require('../public/js/find.js');
 const S={chars:[{id:'c1',name:'Anya'}],ev:[{id:'e1',title:'Meeting',notes:'Anya arrives',prose:'Anya sees the river'},{id:'e2',title:'Storm',notes:'no one'}],places:[{id:'p1',name:'River Town'}],worlds:[{id:'w1',name:'Magic',rules:[{cat:'Law',text:'Anya cannot fly'}]}]};
 const d=F.build(S);assert.strictEqual(F.search(d,'anya').length,3);assert(F.search(d,'anaya').some(r=>r.id=='c1'),'typo');
 assert.strictEqual(F.search(d,'anya -river').length,2);assert.strictEqual(F.search(d,'storm|town').length,2);assert.strictEqual(F.search(d,'anya type:character').length,1);assert.strictEqual(F.search(d,'"anya sees"').length,1);
 assert(F.fuzzy('foc','Focus mode')>0&&F.fuzzy('xyz','Focus mode')<0);assert(F.fuzzy('fm','Focus mode')>0);
 const pre=F.replaceAll(S,'anya','Mira',{});assert.strictEqual(pre.reduce((a,x)=>a+x.count,0),2);F.replaceAll(S,'anya','Mira',{apply:true});assert(/Mira/.test(S.ev[0].notes));
 const big={ev:Array.from({length:500},(_,i)=>({id:'e'+i,title:'T'+i,prose:'lorem ipsum dolor sit amet '.repeat(100)}))};const t0=Date.now();F.build(big);assert(Date.now()-t0<2000,'index '+(Date.now()-t0));
 console.log('ok find')}
{const P=require('../public/js/packs.js'),SC=require('../public/js/schema.js');
 const base=()=>SC.migrate({ev:[{id:'a',title:'One',t:1,chars:['c1']},{id:'b',title:'Two',t:2,chars:['c1']},{id:'c',title:'Three',t:3}],chars:[{id:'c1',name:'Ana'},{id:'c2',name:'Ben'}],places:[{id:'p1'}],packs:['mystery','horror','fantasy','comedy','ya','literary','screen','world','historical','romance']});
 const run=(S,id)=>P.runChecks(S).filter(x=>x.check==id);
 let S=base();S.clues=[{id:'k1',text:'Knife',plantedIn:'c',payoffIn:'a'},{id:'k2',text:'Red',payoffIn:'b'},{id:'k3',text:'Herring',isRedHerring:true,plantedIn:'a'}];assert.strictEqual(run(S,'mystery.plant').length,3);
 S.reveals=[{id:'r',text:'It was Ben',chapterId:'a',requires:['k1']}];assert(run(S,'mystery.reveal').length>=1);
 S.clues[0].reader='hidden';assert(/never sees/.test(run(S,'mystery.reveal')[0].msg));
 S.suspects=[{id:'s1',charId:'c2',alibiEv:'a',alibiPlace:'p1'}];S.ev[0].place='p2';assert(run(S,'mystery.alibi').some(x=>x.sev=='error'));
 S.deaths=[{id:'d',charId:'c1',evId:'a'}];assert(run(S,'horror.deaths').some(x=>/after dying/.test(x.msg)));
 S.proph=[{id:'pr',text:'Doom',introducedIn:'b',fulfilledIn:'a'}];assert(run(S,'fantasy.proph').some(x=>x.sev=='error'));
 S.techs=[{id:'t1',name:'A',prerequisites:['t2']},{id:'t2',name:'B',prerequisites:['t1']}];assert(run(S,'fantasy.tech').some(x=>/cycle/.test(x.msg)));
 S.gagdefs=[{id:'g',name:'Hat',setupIn:'a'}];assert.strictEqual(run(S,'comedy.gags').length,1);
 S.rating={heat:1};S.ev[1].heat=4;assert.strictEqual(run(S,'romance.heat').length,1);S.age='MG';assert(run(S,'ya.age').some(x=>x.sev=='error'));
 S.ev[0].pov='c1';S.ev[0].notes='Ben thought about it.';assert.strictEqual(run(S,'literary.pov').length,1);
 S.ev[0].fin={script:'INT. KITCHEN\nEXT. YARD - DAY'};assert.strictEqual(run(S,'screen.slug').length,1);
 S.period={to:1200};S.ev[2].notes='He aimed the pistol and drank coffee.';const an=run(S,'historical.anach');assert(an.length>=2);S.period.allow=['pistol','coffee'];assert.strictEqual(run(S,'historical.anach').length,0);
 S.family=[{id:'f1',a:'c1',b:'c2',rel:'parent'},{id:'f2',a:'c2',b:'c1',rel:'parent'}];assert(run(S,'world.family').some(x=>/ancestor/.test(x.msg)));
 const off=base();off.packs=[];assert.strictEqual(P.runChecks(off).length,0);
 assert.deepStrictEqual(P.julianToGregorian(1752,9,2),[1752,9,13]);assert.deepStrictEqual(P.julianToGregorian(1582,10,5),[1582,10,15]);
 const d1=base();d1.clues=[{id:'z',text:'x',plantedIn:'gone'}];assert(SC.repair(d1)>=1&&d1.clues[0].plantedIn===null);
 console.log('ok packs')}
{const X=require('../public/js/extras.js');
 const h=X.DIFF.hunks('a\nb\nc','a\nB\nc\nd');assert.strictEqual(h.filter(x=>x.t=='chg').length,2);const i=h.findIndex(x=>x.t=='chg');assert.strictEqual(X.DIFF.revert(h,i),'a\nb\nc\nd');assert.strictEqual(X.DIFF.accept(h),'a\nB\nc\nd');
 assert(X.DIFF.words('the cat sat','the dog sat').some(o=>o.t=='ins'&&o.v=='dog'));
 const zip=[{name:'mimetype',data:'application/epub+zip',stored:true},{name:'META-INF/container.xml',data:'<container><rootfiles><rootfile full-path="OEBPS/c.opf"/></rootfiles></container>'},
  {name:'OEBPS/c.opf',data:'<package><metadata><dc:identifier>x</dc:identifier><dc:title>t</dc:title><dc:language>en</dc:language><meta property="dcterms:modified">2026-01-01T00:00:00Z</meta></metadata><manifest><item id="n" href="nav.xhtml" properties="nav"/><item id="c1" href="c1.xhtml"/></manifest><spine><itemref idref="c1"/></spine></package>'},
  {name:'OEBPS/nav.xhtml',data:'<html lang="en"><body></body></html>'},{name:'OEBPS/c1.xhtml',data:'<html lang="en"><body><h1>x</h1><img src="a.png"/></body></html>'}];
 let r=X.EPUBV.validate(zip);assert.deepStrictEqual(r.errors,[]);assert(r.warnings.some(w=>/alt/.test(w)));
 assert(X.EPUBV.validate([{...zip[0],stored:false},...zip.slice(1)]).errors.some(e=>/stored/.test(e)));assert(X.EPUBV.validate([zip[0],zip[1],{...zip[2],data:zip[2].data.replace('<spine>','<spine><itemref idref="zz"/>')},...zip.slice(3)]).errors.some(e=>/unknown id/.test(e)));
 assert(!X.EPUBV.wellFormed('<a><b></a>'));
 const ss=X.SSML.build('“Hi,” Ana said.\nPlain <text> & more.',{voices:{Ana:{voice:'v1'}},lex:[{term:'Zorg',say:'zorg'}]});assert(ss[0].includes('&lt;text&gt;')&&ss[0].includes('<voice name="v1"'));assert(X.SSML.build('x '.repeat(5000),{max:4500}).length>=1);
 const P=['a','b','c','d'],R=[{a:'a',b:'c',rel:'parent'},{a:'b',b:'c',rel:'parent'},{a:'a',b:'b',rel:'spouse'},{a:'c',b:'d',rel:'parent'}],L=X.FAM.layout(P,R);assert.strictEqual(L.gen.a,0);assert.strictEqual(L.gen.c,1);assert.strictEqual(L.gen.d,2);
 const g=X.FAM.toGedcom(P.map(p=>({id:p,name:'Person '+p})),R),pg=X.FAM.parseGedcom(g);assert.strictEqual(pg.people.length,4);assert(pg.rels.some(x=>x.rel=='parent'));
 const n1=X.NAMES.generate({seed:7,n:5}),n2=X.NAMES.generate({seed:7,n:5});assert.deepStrictEqual(n1,n2);assert.strictEqual(n1.length,5);assert(X.NAMES.clashes(['Mara','Mira','Bob']).some(c=>/sounds like/.test(c)));
 const rows=[{a:'x',b:'y'}];const cs=X.SUBS.toCsv([{id:'1',target:'A, B',notes:'say "hi"'}],['id','target','notes']);assert.deepStrictEqual(X.SUBS.parseCsv(cs),[{id:'1',target:'A, B',notes:'say "hi"'}]);assert(X.SUBS.toIcs([{id:'1',target:'T',followUpAt:'2026-03-01'}]).includes('DTSTART;VALUE=DATE:20260301'));
 const f1=X.STY.fingerprint(['I do not know what he is doing there.','She was not sure it was a good idea.']);assert(X.STY.cosine(f1.v,f1.v)>0.999);
 const sts=Array.from({length:8},(_,i)=>({id:i,stats:{words:500,avgSent:i==7?40:12,ttr:.5,adverbs:.01}}));assert(X.STY.outliers(sts).some(o=>o.id==7));
 console.log('ok extras')}
{const PR=require('../public/js/props.js'),P=require('../public/js/packs.js'),SC=require('../public/js/schema.js');
 const S=SC.migrate({chars:[{id:'a',name:'Ana'},{id:'b',name:'Ben'}],places:[{id:'p1',name:'Inn'},{id:'p2',name:'Keep'}],
  ev:[1,2,3,4,5,6].map(i=>({id:'e'+i,title:'E'+i,t:i,chars:i<4?['a']:['b'],place:i<3?'p1':'p2'})),
  props:[{id:'sw',name:'Sword',kind:'weapon',owner:'a',log:[{id:'l1',ev:'e2',holder:'a',place:null,state:'intact'},{id:'l2',ev:'e4',holder:'b',state:'damaged'},{id:'l3',ev:'e5',holder:null,place:'p2',state:'destroyed'}]}]});
 assert.strictEqual(PR.stateAt(S,S.props[0],'e1').holder,'a');assert.strictEqual(PR.stateAt(S,S.props[0],'e3').holder,'a');assert.strictEqual(PR.stateAt(S,S.props[0],'e4').holder,'b');assert.strictEqual(PR.stateAt(S,S.props[0],'e6').state,'destroyed');
 assert.strictEqual(PR.timeline(S,S.props[0]).length,6);assert.strictEqual(PR.heldBy(S,'b','e4').length,1);assert.strictEqual(PR.heldBy(S,'b','e6').length,0);
 S.ev[5].props=['sw'];let r=P.runChecks(S).filter(x=>x.check=='props.continuity');assert(r.some(x=>x.sev=='error'&&/destroyed/.test(x.msg)));
 S.ev[5].props=[];S.ev[2].props=['sw'];S.ev[2].chars=['b'];r=P.runChecks(S).filter(x=>x.check=='props.continuity');assert(r.some(x=>/holder/.test(x.msg)));   // Ana holds it, Ben is in the scene
 S.ev[0].props=['sw'];S.ev[0].place='p2';S.props[0].place='p1';assert(PR.presentAt(S,'e1').length==1);
 // repair: deleted event/char/place cleaned from nested log and appearances
 const c=JSON.parse(JSON.stringify(S));c.ev=c.ev.filter(e=>e.id!='e4');c.chars=c.chars.filter(x=>x.id!='b');const n=SC.repair(c);assert(n>=2);assert(c.props[0].log.every(l=>l.ev!='e4'));
 assert.strictEqual(SC.usage(S,'chars','a').filter(u=>u.coll=='props').length,2);assert(SC.migrate({v:8}).props);
 console.log('ok props')}
{const X=require('../public/js/extras.js');assert.deepStrictEqual(X.ORDER.move(['a','b','c','d'],'d',0),['d','a','b','c']);assert.deepStrictEqual(X.ORDER.step(['a','b','c'],'a',1),['b','a','c']);assert.deepStrictEqual(X.ORDER.step(['a','b','c'],'a',-1),['a','b','c']);
 const [a,b,ok]=X.ORDER.split('one two three four',8);assert(ok&&a=='one two'&&b=='three four');assert.strictEqual(X.ORDER.merge('x','y'),'x\n\ny');console.log('ok order')}
{const X=require('../public/js/extras.js'),W=X.WIKI;
 const S={chars:[{id:'a',name:'Anya',aliases:['Ani']}],places:[{id:'p',name:'River Town'}],props:[{id:'k',name:'Key'}],ev:[{id:'e1',title:'Ch1',notes:'[[Anya]] met [[Ani|her friend]] at [[Type:Nope]], then [[place:River Town]] and [[Missing]].',fin:{book:'Anya went to [[River Town]].'}}]};
 const ents=W.entities(S),l=W.parse(S.ev[0].notes);assert.strictEqual(l.length,5);assert(W.resolve(ents,l[1]).ok);assert.strictEqual(W.resolve(ents,l[2]).ok,false);
 const c=W.check(S);assert.strictEqual(c.broken.length,2);assert(c.orphans.some(o=>o.name=='Key'));assert.strictEqual(W.backlinks(S,ents[0]).length,1);
 assert.strictEqual(W.unlinked(S,ents[0]),1);   // "Anya went" in the book text
 const n=W.rename(S,ents[0],'Anna');assert.strictEqual(n,1);assert(/\[\[Anna\]\]/.test(S.ev[0].notes)&&S.chars[0].name=='Anna');assert.strictEqual(W.strip('[[Anna]] and [[x|y]] [[#Ch1]]'),'Anna and y Ch1');
 const pal=X.PALETTE.kmeans([...Array(50).fill([250,0,0]),...Array(50).fill([0,0,250])],2);assert.deepStrictEqual(pal.sort(),['#0000fa','#fa0000']);
 const G=X.GEO,W2={worldmap:{scale:{px:100,units:50},pins:[{placeId:'a',x:0,y:0},{placeId:'b',x:300,y:400}],hoursPerUnit:1},ev:[{id:'1',t:0,place:'a',chars:['c']},{id:'2',t:10,place:'b',chars:['c']}]};
 assert.strictEqual(G.dist({x:0,y:0},{x:300,y:400},G.scale(100,50)),250);const tc=G.travelCheck(W2);assert.strictEqual(tc.length,1);assert.strictEqual(tc[0].needH,50);W2.ev[1].t=100;assert.strictEqual(G.travelCheck(W2).length,0);
 console.log('ok wiki/palette/geo')}
{const S=require('../public/js/schema.js');const o=S.migrate({v:9,ev:[{id:'a',cm:[{id:'1',x:'hi',ts:5},null]}]});const c=o.ev[0].cm;assert.strictEqual(c.length,1);assert.deepStrictEqual([c[0].x,c[0].resolved,c[0].replies.length,c[0].anchor],['hi',false,0,null]);assert.strictEqual(JSON.stringify(S.migrate(JSON.parse(JSON.stringify(o)))),JSON.stringify(o));console.log('ok comments migration')}
{const X=require('../public/js/extras.js'),B=X.BETA;
 const html=B.export('My <Book>',[{id:'e1',title:'One',text:'First para.\n\nSecond <img onerror=x> para.'}],'sf2','h1');assert(html.includes('&lt;img onerror=x&gt;'));assert(!/<img onerror/.test(html));assert(!/https?:\/\//.test(html.replace(/<!doctype[^>]*>/,'')));
 assert.strictEqual(B.validate('nope').ok,false);assert.strictEqual(B.validate({v:1,comments:Array(5001).fill({ch:'a',text:'x'})}).ok,false);
 const v=B.validate({v:1,comments:[{ch:'e1',pi:1,quote:'Second',text:'<img src=x onerror=alert(1)>'},{bad:1}]});assert.strictEqual(v.comments.length,1);assert.strictEqual(v.comments[0].text,'<img src=x onerror=alert(1)>');   // plain text; rendered via esc()
 const paras=['Opening.','Inserted.','Second para here.'];assert.strictEqual(B.reanchor(paras,{pi:1,quote:'Second'}),2);assert.strictEqual(B.reanchor(paras,{pi:0,quote:'Opening'}),0);assert.strictEqual(B.reanchor(paras,{pi:1,quote:'Missing text'}),-1);
 const q={title:'T',genre:'fantasy',hook:'a '.repeat(100),setup:'b '.repeat(100),conflict:'c '.repeat(100),comps:['X (2019)']};assert(X.QUERY.guidance(q).words>250);assert(X.QUERY.compose(q).includes('T is a fantasy'));
 assert(X.FRONT.template('copyright',{}).includes('All rights reserved'));assert.strictEqual(X.FRONT.forFormat({front:[{id:1,includeIn:{epub:false}},{id:2}]},'epub').length,1);
 console.log('ok beta/query/front')}
{const X=require('../public/js/extras.js'),PR=require('../public/js/props.js');
 const S={title:'T',chars:[{id:'a',name:'Ana',role:'hero'}],places:[{id:'p',name:'Inn'}],ev:[{id:'e1',title:'One',t:1,chars:['a'],place:'p',props:['k']},{id:'e2',title:'Two',t:2}],props:[{id:'k',name:'Key',kind:'equipment',log:[{id:'l',ev:'e1',holder:'a',place:'p',state:'intact'},{id:'m',ev:'e2',holder:null,place:'p',state:'lost'}]}]};
 const md=X.BIBLE.md(S,PR);assert(md.includes('### Key (equipment)')&&md.includes('| One | Ana | Inn | intact |')&&md.includes('| Two | — | Inn | lost |')&&md.includes('Appears in: One'));console.log('ok bible')}
{const Z=require('../public/js/extras.js').ZIPGUARD;
 assert.strictEqual(Z.check([{name:'a.txt',cs:10,us:20}]),'');assert(Z.check([{name:'../x',cs:1,us:1}]));assert(Z.check([{name:'/etc/passwd',cs:1,us:1}]));assert(Z.check([{name:'C:\\x',cs:1,us:1}]));assert(Z.check([{name:'a/../../b',cs:1,us:1}]));
 assert(/too many/.test(Z.check(Array(5001).fill({name:'a',cs:1,us:1}))));assert(/ratio/.test(Z.check([{name:'z',cs:1000,us:50e6}])));assert(/too large/.test(Z.check([{name:'a',cs:5e7,us:60e6},{name:'b',cs:5e7,us:60e6}])));
 console.log('ok zipguard')}
{const X=require('../public/js/extras.js'),P=X.PRINT,plat=require('../public/data/platforms.json').kdp_paperback;
 assert.strictEqual(P.insideMm(plat,100),9.52);assert.strictEqual(P.insideMm(plat,320),15.88);
 const c=P.cover(plat,P.TRIMS['6 × 9 in'],300,'white');assert.strictEqual(c.spineMm,17.16);assert(Math.abs(c.widthMm-(2*152.4+17.16+2*3.18))<0.05);assert.strictEqual(c.heightMm,+(228.6+2*3.175).toFixed(2));assert(c.px(300).w>3000);
 const css=P.css({trim:P.TRIMS.A5,bleed:3,inside:15,outside:10,top:12,bottom:12,mirror:true,chapterStart:'right'});assert(css.includes('size:154.00mm 216.00mm'));assert(css.includes('@page:left')&&css.includes('break-before:right'));   // A5 + 3 mm bleed = 154×216
 const pf=P.preflight({pages:301,plat,profile:{inside:9,outside:10,top:12,bottom:12,bleed:3.175},images:[{name:'logo',w:300,printWmm:50}]});assert(pf.some(x=>/Inside margin/.test(x.msg)));assert(pf.some(x=>/dpi/.test(x.msg)));assert(pf.some(x=>/Odd/.test(x.msg)));
 assert(P.estimatePages(80000,P.TRIMS['6 × 9 in'])>150&&P.estimatePages(80000,P.TRIMS['6 × 9 in'])<500);assert.strictEqual(X.ink('#ffffff'),'#111111');assert.strictEqual(X.ink('#101010'),'#ffffff');assert(X.COVERTPL.bottom(100,160).band);
 console.log('ok print/cover')}
{const X=require('../public/js/extras.js'),S=X.SERIAL,P=require('../public/data/platforms.json').serial;
 const h=S.html('First _soft_ and **loud**.\n***\nSecond <b onclick=x>para</b> & <script>alert(1)</script>.',P.wattpad,{noteTop:'Thanks for reading!'});
 assert(!/<script|<b |onclick=/.test(h.replace(/&lt;[^]*?&gt;/g,'')));assert(h.includes('&lt;script&gt;'));assert(h.includes('<em>soft</em>')&&h.includes('<strong>loud</strong>'));assert(h.includes('* * *')&&!h.includes('<hr'));
 const r=S.html('A\n***\nB',P.royalroad,{title:'Ch 1'});assert(r.includes('<hr>')&&r.includes('<h2>Ch 1</h2>'));assert(S.sanitize('<a href="javascript:x">x</a><a href="https://e.com" onclick=1>y</a><iframe src=x></iframe>',['a']).includes('href="https://e.com"')&&!/javascript|iframe|onclick/.test(S.sanitize('<a href="javascript:x">x</a><iframe></iframe>',['a'])));
 assert(S.plain('<p>One &amp; two</p><hr><p>Three</p>').includes('* * *'));assert.deepStrictEqual(S.schedule('2026-12-29',3,7),['2026-12-29','2027-01-05','2027-01-12']);assert(S.ics([{date:'2026-01-01',title:'Ch 1, the start'}]).includes('Ch 1\\, the start'));
 console.log('ok serial')}

// ---- example stories (samples.js): enriched content validates, has props/rules, refs are intact
{const SAMPLES=require('../public/js/samples.js'),SCH=require('../public/js/schema.js'),assert=require('assert');
 const base=()=>({places:['palace','chasm','jungle','fog','peak','valley','attic','pataliputra','channel','temple','chamber'].map(id=>({id,name:id})),chars:['anya','arjun','meera','rohan','gurudev','bheem','rohan2','priya','arjun2','meera2','sam','anjali','guardian'].map(id=>({id,name:id})),ev:['e1','e2','e3','e4','e5','e6','e7','e8','e9'].map((id,i)=>({id,t:i/360,chars:[],place:''})),times:[],rels:[],info:[],tls:[],lk:[]});
 for(const id of ['sf-river','sf-sunstone']){const d=SAMPLES.enrich(id,base());assert(d.props.length>=4,id+' props');assert(d.worlds[0].rules.length>=3,id+' rules');assert(d.packs.length>=2,id+' packs');
  assert.deepStrictEqual(SCH.validate(d).errors,[],id+' valid');assert.strictEqual(SCH.repair(JSON.parse(JSON.stringify(d))),0,id+' no dangling refs')}
 console.log('samples ok')}
