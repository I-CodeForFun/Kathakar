/* Genre packs (C0-C9): pack registry, field configs for generic editors, and pure CHECKS. UMD. */
(function(root,factory){if(typeof module=='object'&&module.exports)module.exports=factory();else root.PACKS=factory()})(typeof self!='undefined'?self:this,function(){
const ids=(a)=>new Set((a||[]).map(x=>x&&x.id));
// event order: by time, ties by custom book order
function order(S){const cu=(S.bk&&S.bk.cu)||[],ix=new Map();[...(S.ev||[])].sort((a,b)=>(+a.t||0)-(+b.t||0)||((cu.indexOf(a.id)+1||1e9)-(cu.indexOf(b.id)+1||1e9))).forEach((e,i)=>ix.set(e.id,i));return ix}
const txt=e=>[e.title,e.notes,e.prose,e.fin&&e.fin.book,e.fin&&e.fin.script].filter(Boolean).join(' ');
const nm=(arr,id)=>{const x=(arr||[]).find(y=>y.id==id);return x?(x.name||x.title||x.text||id):'?'};
// field configs for generic ledgers: [key,label,type,extra]
const T={text:'text',area:'area',sel:'sel',ev:'ev',evs:'evs',char:'char',chars:'chars',num:'num',bool:'bool',place:'place'};
const COLL={
 clues:{label:'Clues',title:'text',fields:[['text','Clue','text'],['kind','Kind','sel',['physical','testimony','document','circumstantial','misdirection']],['plantedIn','Planted in','ev'],['payoffIn','Payoff in','ev'],['reader','Reader sees','sel',['seen','implied','hidden']],['isRedHerring','Red herring','bool'],['status','Status','sel',['open','paid','abandoned']]]},
 suspects:{label:'Suspects',title:'motive',fields:[['charId','Character','char'],['motive','Motive','text'],['means','Means','text'],['opportunity','Opportunity','text'],['alibi','Alibi','text'],['alibiEv','Alibi event','ev'],['alibiPlace','Alibi place','place']]},
 reveals:{label:'Reveals',title:'text',fields:[['text','Reveal','text'],['chapterId','Chapter','ev'],['requires','Requires clues','ids:clues']]},
 evid:{label:'Evidence',title:'description',fields:[['description','Item','text'],['sceneId','Found in','ev'],['usedIn','Used in','ev'],['status','Status','sel',['found','lost','planted','contaminated']]]},
 systems:{label:'Magic / tech systems',title:'name',fields:[['name','Name','text'],['source','Source','text'],['cost','Cost','text'],['limits','Limits','area'],['practitioners','Practitioners','chars']]},
 factions:{label:'Species & factions',title:'name',fields:[['name','Name','text'],['kind','Kind','sel',['species','faction']],['members','Members','chars'],['notes','Notes','area']]},
 techs:{label:'Tech / magic tree',title:'name',fields:[['name','Name','text'],['prerequisites','Prerequisites','ids:techs'],['firstUse','First used in','ev']]},
 lexicon:{label:'Lexicon',title:'term',fields:[['term','Term','text'],['meaning','Meaning','text'],['kind','Kind','sel',['invented','real-period']],['firstAppearance','First appears in','ev']]},
 proph:{label:'Prophecies',title:'text',fields:[['text','Prophecy','text'],['introducedIn','Introduced in','ev'],['fulfilledIn','Fulfilled in','ev'],['subverted','Subverted','bool']]},
 deaths:{label:'Death order',title:'method',fields:[['charId','Character','char'],['evId','Death scene','ev'],['method','Method','text']]},
 gagdefs:{label:'Running gags',title:'name',fields:[['name','Gag','text'],['setupIn','Setup','ev'],['beats','Beat scenes','evs'],['payoffIn','Payoff','ev']]},
 motifs:{label:'Motifs',title:'name',fields:[['name','Motif','text'],['keywords','Keywords (comma)','text'],['appearances','Appearances','evs']]},
 realev:{label:'Real-world events',title:'title',fields:[['title','Event','text'],['date','Year','num'],['source','Source','text']]},
 threads:{label:'A/B/C threads',title:'name',fields:[['name','Thread','text'],['kind','Kind','sel',['A','B','C','D']]]},
 research:{label:'Research notes',title:'title',fields:[['title','Title','text'],['kind','Kind','sel',['general','science','history','language']],['status','Status','sel',['to-read','read','used']],['reliability','Reliability 1-5','num'],['url','URL / citation','text'],['body','Notes','area']]},
 family:{label:'Family tree',title:'rel',fields:[['a','Person A','char'],['rel','Relation','sel',['parent','spouse','partner','sibling','guardian']],['b','Person B','char']]},
 subs:{label:'Submissions',title:'target',fields:[['target','Agent / publisher','text'],['sent','Sent (YYYY-MM-DD)','text'],['status','Status','sel',['planned','sent','partial','full','rejected','offer']],['followUpAt','Follow-up (YYYY-MM-DD)','text'],['notes','Notes','area']]}};
const PACKS=[
 {id:'mystery',label:'Mystery / Thriller',icon:'🔍',blurb:'Clues, suspects, reveals, evidence',colls:['clues','suspects','reveals','evid']},
 {id:'romance',label:'Romance',icon:'💞',blurb:'Heat level, content warnings, tropes',colls:[],event:['heat','cw','tropes'],beats:'rtb'},
 {id:'fantasy',label:'Fantasy / Sci-Fi',icon:'🐉',blurb:'Systems, factions, tech tree, lexicon, prophecies',colls:['systems','factions','techs','lexicon','proph']},
 {id:'historical',label:'Historical',icon:'🏛',blurb:'Anachronism checker, real events',colls:['realev','lexicon']},
 {id:'horror',label:'Horror',icon:'🕯',blurb:'Dread curve, death order',colls:['deaths'],event:['dread']},
 {id:'comedy',label:'Comedy',icon:'🎭',blurb:'Running gags and payoffs',colls:['gagdefs']},
 {id:'literary',label:'Literary',icon:'📚',blurb:'Motifs, POV and tense',colls:['motifs'],event:['pov','tense']},
 {id:'screen',label:'Screenwriting',icon:'🎬',blurb:'Threads, sluglines, page counts',colls:['threads']},
 {id:'ya',label:'YA / MG / Children’s',icon:'🧒',blurb:'Age-band and chapter-length checks',colls:[]},
 {id:'world',label:'Research & family',icon:'🗂',blurb:'Research notes, family tree, submissions',colls:['research','family','subs']}];
const AGE={PB:{heat:0,len:[0,600],words:300},MG:{heat:0,len:[800,1500]},YA:{heat:2,len:[1500,3000]},NA:{heat:4,len:[1500,4500]},Adult:{heat:5,len:[2000,6000]}};
// ---- checks
const C=[];const reg=c=>C.push(c);
const on=(S,p)=>(S.packs||[]).includes(p);
reg({id:'mystery.plant',pack:'mystery',label:'Clue planting order',run:S=>{const o=order(S),out=[];(S.clues||[]).forEach(c=>{const label=c.text||'Clue';
 if(c.payoffIn&&!c.plantedIn)out.push({sev:'error',msg:`“${label}” pays off but is never planted.`,ref:{kind:'clues',id:c.id}});
 if(c.plantedIn&&c.payoffIn&&o.has(c.plantedIn)&&o.has(c.payoffIn)&&o.get(c.plantedIn)>o.get(c.payoffIn))out.push({sev:'error',msg:`“${label}” is planted after its payoff.`,ref:{kind:'clues',id:c.id}});
 if(c.isRedHerring&&c.status!='paid'&&c.status!='abandoned')out.push({sev:'warn',msg:`Red herring “${label}” is never resolved.`,ref:{kind:'clues',id:c.id}})});return out}});
reg({id:'mystery.desert',pack:'mystery',label:'Clue density',run:S=>{const n=(S.ev||[]).length,o=order(S),out=[];if(n<6||!(S.clues||[]).length)return out;
 for(let k=0;k<3;k++){const lo=n*k/3,hi=n*(k+1)/3;if(!(S.clues||[]).some(c=>c.plantedIn&&o.has(c.plantedIn)&&o.get(c.plantedIn)>=lo&&o.get(c.plantedIn)<hi))out.push({sev:'warn',msg:`No clues planted in part ${k+1} of 3 of the story (a clue desert).`,ref:{kind:'ev'}})}return out}});
reg({id:'mystery.reveal',pack:'mystery',label:'Reveal prerequisites',run:S=>{const o=order(S),out=[];(S.reveals||[]).forEach(r=>(r.requires||[]).forEach(cid=>{const c=(S.clues||[]).find(x=>x.id==cid);if(!c)return;
 if(c.reader=='hidden')out.push({sev:'error',msg:`Reveal “${r.text}” needs clue “${c.text}”, which the reader never sees.`,ref:{kind:'reveals',id:r.id}});
 else if(c.plantedIn&&r.chapterId&&o.get(c.plantedIn)>o.get(r.chapterId))out.push({sev:'error',msg:`Reveal “${r.text}” comes before its clue “${c.text}” is planted.`,ref:{kind:'reveals',id:r.id}})}));return out}});
reg({id:'mystery.alibi',pack:'mystery',label:'Suspect alibis',run:S=>{const out=[];(S.suspects||[]).forEach(s=>{const who=nm(S.chars,s.charId);
 if(!s.alibi&&!s.alibiEv)out.push({sev:'warn',msg:`${who} has no alibi recorded.`,ref:{kind:'suspects',id:s.id}});
 if(s.alibiEv&&s.alibiPlace){const e=(S.ev||[]).find(x=>x.id==s.alibiEv);if(e&&e.place&&e.place!=s.alibiPlace)out.push({sev:'error',msg:`${who}’s alibi places them somewhere other than where “${e.title}” is set.`,ref:{kind:'suspects',id:s.id}});
  if(e&&e.chars&&!e.chars.includes(s.charId))out.push({sev:'warn',msg:`${who} is not in their alibi scene “${e.title}”.`,ref:{kind:'suspects',id:s.id}})}});return out}});
reg({id:'mystery.evidence',pack:'mystery',label:'Evidence chain',run:S=>{const o=order(S),out=[];(S.evid||[]).forEach(v=>{if(v.sceneId&&v.usedIn&&o.get(v.usedIn)<o.get(v.sceneId))out.push({sev:'error',msg:`“${v.description}” is used before it is found.`,ref:{kind:'evid',id:v.id}})});return out}});
reg({id:'romance.heat',pack:'romance',label:'Heat vs declared level',run:S=>{const h=(S.rating&&+S.rating.heat)||0,out=[];(S.ev||[]).forEach(e=>{if(+e.heat>=h+2)out.push({sev:'warn',msg:`“${e.title}” has heat ${e.heat}, ≥2 above the story’s declared ${h}.`,ref:{kind:'ev',id:e.id}})});return out}});
reg({id:'ya.age',pack:'ya',label:'Age band',run:S=>{const b=AGE[S.age||'YA'],out=[];(S.ev||[]).forEach(e=>{if(+e.heat>b.heat)out.push({sev:'error',msg:`“${e.title}” heat ${e.heat} exceeds the ${S.age||'YA'} band (max ${b.heat}).`,ref:{kind:'ev',id:e.id}});
 const w=(txt(e).match(/\S+/g)||[]).length,L=(S.ctgt&&S.ctgt.min!=null)?[+S.ctgt.min,+S.ctgt.max]:b.len;if(w>200&&(w<L[0]||w>L[1]))out.push({sev:'info',msg:`“${e.title}” is ${w} words; ${S.age||'YA'} chapters usually run ${L[0]}–${L[1]}.`,ref:{kind:'ev',id:e.id}})});return out}});
reg({id:'fantasy.proph',pack:'fantasy',label:'Prophecies',run:S=>{const o=order(S),out=[],n=(S.ev||[]).length;(S.proph||[]).forEach(p=>{
 if(p.introducedIn&&p.fulfilledIn&&o.get(p.fulfilledIn)<o.get(p.introducedIn))out.push({sev:'error',msg:`Prophecy “${p.text}” is fulfilled before it is introduced.`,ref:{kind:'proph',id:p.id}});
 if(p.introducedIn&&!p.fulfilledIn&&!p.subverted)out.push({sev:'warn',msg:`Prophecy “${p.text}” is never fulfilled or subverted.`,ref:{kind:'proph',id:p.id}})});return out}});
reg({id:'fantasy.tech',pack:'fantasy',label:'Tech tree',run:S=>{const out=[],T=S.techs||[],by=new Map(T.map(t=>[t.id,t])),st=new Map();
 const dfs=(id,path)=>{if(st.get(id)==2)return;if(st.get(id)==1){out.push({sev:'error',msg:`Tech cycle: ${[...path.slice(path.indexOf(id)),id].map(i=>(by.get(i)||{}).name).join(' → ')}`,ref:{kind:'techs',id}});return}st.set(id,1);const t=by.get(id);((t&&t.prerequisites)||[]).forEach(p=>by.has(p)&&dfs(p,[...path,id]));st.set(id,2)};T.forEach(t=>dfs(t.id,[]));
 const o=order(S);T.forEach(t=>(t.prerequisites||[]).forEach(p=>{const q=by.get(p);if(q&&t.firstUse&&q.firstUse&&o.get(t.firstUse)<o.get(q.firstUse))out.push({sev:'warn',msg:`${t.name} is used before its prerequisite ${q.name}.`,ref:{kind:'techs',id:t.id}})}));return out}});
reg({id:'fantasy.lexicon',pack:'fantasy',label:'Lexicon',run:S=>{const o=order(S),out=[];(S.lexicon||[]).forEach(l=>{if(!l.term||!l.firstAppearance||!o.has(l.firstAppearance))return;const re=new RegExp('\\b'+l.term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b','i');
 for(const e of S.ev||[])if(o.get(e.id)<o.get(l.firstAppearance)&&re.test(txt(e))){out.push({sev:'warn',msg:`“${l.term}” appears in “${e.title}” before its first-appearance scene.`,ref:{kind:'lexicon',id:l.id}});break}});return out}});
reg({id:'fantasy.power',pack:'fantasy',label:'Power scaling',run:S=>{const o=order(S),out=[],by={};(S.ev||[]).filter(e=>e.power).sort((a,b)=>o.get(a.id)-o.get(b.id)).forEach(e=>{for(const c in e.power){const prev=by[c];if(prev&&Math.abs(e.power[c]-prev.v)>=3&&!/train|upgrade|power/i.test(e.tag||''))out.push({sev:'warn',msg:`${nm(S.chars,c)}’s power jumps ${prev.v}→${e.power[c]} in “${e.title}” without a stated reason.`,ref:{kind:'ev',id:e.id}});by[c]={v:e.power[c]}}});return out}});
reg({id:'horror.deaths',pack:'horror',label:'Death order',run:S=>{const o=order(S),out=[];(S.deaths||[]).forEach(d=>{if(!d.evId||!o.has(d.evId))return;for(const e of S.ev||[])if(o.get(e.id)>o.get(d.evId)&&(e.chars||[]).includes(d.charId)){out.push({sev:'error',msg:`${nm(S.chars,d.charId)} appears in “${e.title}” after dying.`,ref:{kind:'deaths',id:d.id}});break}
 if(!(S.ev||[]).some(e=>o.get(e.id)<o.get(d.evId)&&(e.chars||[]).includes(d.charId)))out.push({sev:'warn',msg:`${nm(S.chars,d.charId)} dies with no earlier on-page scene.`,ref:{kind:'deaths',id:d.id}})});return out}});
reg({id:'horror.dread',pack:'horror',label:'Dread curve',run:S=>{const E=[...(S.ev||[])].sort((a,b)=>order(S).get(a.id)-order(S).get(b.id)).filter(e=>e.dread!==undefined&&e.dread!=='');if(E.length<6)return[];const n=E.length,last=E.slice(Math.floor(n*2/3));
 const out=[];if(Math.max(...last.map(e=>+e.dread))<7)out.push({sev:'warn',msg:'No dread peak (≥7) in the final third.',ref:{kind:'ev'}});let run=0;E.forEach(e=>{run=+e.dread<3?run+1:0;if(run==5)out.push({sev:'warn',msg:'Five chapters in a row with dread below 3.',ref:{kind:'ev',id:e.id}})});return out}});
reg({id:'comedy.gags',pack:'comedy',label:'Gags',run:S=>{const out=[];(S.gagdefs||[]).forEach(g=>{if(g.setupIn&&!g.payoffIn)out.push({sev:'warn',msg:`Gag “${g.name}” has a setup but no payoff.`,ref:{kind:'gagdefs',id:g.id}});if(g.payoffIn&&!g.setupIn)out.push({sev:'warn',msg:`Gag “${g.name}” pays off without a setup.`,ref:{kind:'gagdefs',id:g.id}});
 const b=(g.beats||[]).length;if(b==2||b==4)out.push({sev:'info',msg:`Gag “${g.name}” has ${b} beats; the rule of three suggests 3.`,ref:{kind:'gagdefs',id:g.id}})});return out}});
reg({id:'literary.motif',pack:'literary',label:'Motifs',run:S=>{const out=[];(S.motifs||[]).forEach(m=>{const kw=String(m.keywords||m.name||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);if(!kw.length)return;
 const hit=(S.ev||[]).filter(e=>kw.some(k=>txt(e).toLowerCase().includes(k))).length;if(hit==1)out.push({sev:'warn',msg:`Motif “${m.name}” appears in only one chapter.`,ref:{kind:'motifs',id:m.id}})});return out}});
reg({id:'literary.pov',pack:'literary',label:'POV head-hopping',run:S=>{const out=[];(S.ev||[]).forEach(e=>{if(!e.pov)return;const t=txt(e);(S.chars||[]).forEach(c=>{if(c.id==e.pov||!c.name)return;const re=new RegExp('\\b'+c.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s+(thought|felt|wondered|knew|realized|realised)\\b');if(re.test(t))out.push({sev:'warn',msg:`“${e.title}”: possible head-hop — ${c.name} “${(re.exec(t)[1])}” in ${nm(S.chars,e.pov)}’s POV scene.`,ref:{kind:'ev',id:e.id}})})});return out}});
reg({id:'screen.slug',pack:'screen',label:'Sluglines',run:S=>{const out=[];(S.ev||[]).forEach(e=>{const t=(e.fin&&e.fin.script)||'';t.split('\n').forEach(l=>{if(/^(INT|EXT|INT\.\/EXT|I\/E)\b/i.test(l.trim())&&!/^(INT|EXT|INT\.\/EXT|I\/E)\.\s+.+\s-\s+\S+/i.test(l.trim()))out.push({sev:'warn',msg:`“${e.title}”: malformed slugline “${l.trim().slice(0,40)}”.`,ref:{kind:'ev',id:e.id}})})});return out}});
reg({id:'screen.threads',pack:'screen',label:'B/C thread balance',run:S=>{const E=S.ev||[],n=E.length,out=[];if(n<8)return out;(S.threads||[]).filter(t=>t.kind&&t.kind!='A').forEach(t=>{const c=E.filter(e=>e.thread==t.id).length;if(c<n*0.05)out.push({sev:'warn',msg:`Thread “${t.name}” is on screen in only ${c} of ${n} scenes.`,ref:{kind:'threads',id:t.id}})});return out}});
reg({id:'world.family',pack:'world',label:'Family tree',run:S=>{const out=[],par=new Map();(S.family||[]).filter(f=>f.rel=='parent'&&f.a&&f.b).forEach(f=>{(par.get(f.b)||par.set(f.b,[]).get(f.b)).push(f.a)});
 const anc=(id,seen=new Set())=>{for(const p of par.get(id)||[]){if(seen.has(p))continue;seen.add(p);anc(p,seen)}return seen};for(const id of par.keys())if(anc(id).has(id))out.push({sev:'error',msg:`${nm(S.chars,id)} is their own ancestor.`,ref:{kind:'family'}});
 for(const [id,ps] of par)if(ps.length>2)out.push({sev:'warn',msg:`${nm(S.chars,id)} has ${ps.length} parents listed.`,ref:{kind:'family'}});return out}});
// anachronisms (C4.2): [term, first attested year, note]
const ANACH=[['gunpowder',900],['telescope',1608],['microscope',1590],['potato',1570],['tomato',1540],['tobacco',1530],['coffee',1450],['revolver',1836],['telephone',1876],['telegram',1844],['railway',1825],['train',1804],['photograph',1839],['electricity',1600],['scientist',1833],['teenager',1941],['okay',1839],['ok',1839],['sandwich',1762],['cigarette',1830],['dynamite',1867],['bicycle',1860],['automobile',1890],['airplane',1900],['aeroplane',1873],['television',1926],['radio',1900],['computer',1613],['spaghetti',1600],['chocolate',1550],['pistol',1500],['musket',1500],['clock',1300],['spectacles',1286],['paper',1100],['printing press',1440],['soccer',1880],['hello',1827],['nice',1300],['alcohol',1540]];
reg({id:'historical.anach',pack:'historical',label:'Anachronisms',run:S=>{const p=S.period,out=[];if(!p||!(+p.to||+p.from))return out;const yr=+p.to||+p.from,allow=new Set((p.allow||[]).map(s=>s.toLowerCase()));
 for(const e of S.ev||[]){const t=txt(e).toLowerCase();for(const [w,y] of ANACH){if(y<=yr||allow.has(w))continue;if(new RegExp('\\b'+w+'s?\\b').test(t))out.push({sev:'warn',msg:`“${w}” in “${e.title}” — first attested c. ${y}, but the story is set around ${yr}.`,ref:{kind:'ev',id:e.id},key:'anach:'+w})}}return out}});
// Julian -> Gregorian via Julian Day Number
function julianToGregorian(y,m,d){const a=Math.floor((14-m)/12),Y=y+4800-a,M=m+12*a-3,J=d+Math.floor((153*M+2)/5)+365*Y+Math.floor(Y/4)-32083;
 let f=J+1401+Math.floor((Math.floor((4*J+274277)/146097)*3)/4)-38,e=4*f+3,g=Math.floor((e%1461)/4),h=5*g+2;
 const D=Math.floor((h%153)/5)+1,Mo=(Math.floor(h/153)+2)%12+1,Yr=Math.floor(e/1461)-4716+Math.floor((12+2-Mo)/12);return[Yr,Mo,D]}
function runChecks(S,only){const out=[];for(const c of C){if(c.pack&&!on(S,c.pack))continue;if(only&&!only(c))continue;let r=[];try{r=c.run(S)||[]}catch(e){r=[{sev:'info',msg:'Check “'+c.label+'” failed: '+e.message}]}r.forEach(x=>out.push({...x,check:c.id,pack:c.pack,label:c.label}))}return out}
const hash=s=>{let h=5381;s=String(s);for(let i=0;i<s.length;i++)h=(h*33^s.charCodeAt(i))>>>0;return h.toString(36)};
const keyOf=p=>p.check+'|'+((p.ref&&(p.ref.id||p.ref.kind))||'')+'|'+hash(p.msg);
return{PACKS,COLL,AGE,ANACH,CHECKS:C,register:reg,julianToGregorian,runChecks,order,keyOf,hash}});
