/* Pure helpers: DIFF (B6), EPUBV (E5), SSML (E9), FAM (D6), NAMES (G1), SUBS (E2), STY (G5), CITE (D3). UMD. */
(function(root,factory){const x=factory();if(typeof module=='object'&&module.exports)module.exports=x;else Object.assign(root,x)})(typeof self!='undefined'?self:this,function(){
// ---------- DIFF: LCS on tokens; paragraph hunks + word diff inside
function lcsOps(a,b){const n=a.length,m=b.length;if(n*m>25e6)return[{t:'del',v:a},{t:'ins',v:b}];const L=Array.from({length:n+1},()=>new Uint32Array(m+1));
 for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)L[i][j]=a[i]===b[j]?L[i+1][j+1]+1:Math.max(L[i+1][j],L[i][j+1]);
 const ops=[];let i=0,j=0;const push=(t,v)=>{const l=ops[ops.length-1];if(l&&l.t==t)l.v.push(v);else ops.push({t,v:[v]})};
 while(i<n&&j<m){if(a[i]===b[j]){push('eq',a[i]);i++;j++}else if(L[i+1][j]>=L[i][j+1]){push('del',a[i]);i++}else{push('ins',b[j]);j++}}
 while(i<n)push('del',a[i++]);while(j<m)push('ins',b[j++]);return ops}
const DIFF={words:(a,b)=>lcsOps(String(a).split(/(\s+)/).filter(x=>x!==''),String(b).split(/(\s+)/).filter(x=>x!=='')).map(o=>({t:o.t,v:o.v.join('')})),
 // paragraph hunks: [{t:'eq'|'chg',a:[paras],b:[paras]}] ; apply(textA,textB,hunkIndex,'revert') returns B with that hunk reverted to A
 hunks(a,b){const A=String(a).split('\n'),B=String(b).split('\n'),ops=lcsOps(A,B),h=[];for(const o of ops){if(o.t=='eq')h.push({t:'eq',a:o.v,b:o.v});else{const l=h[h.length-1];if(l&&l.t=='chg'){o.t=='del'?l.a.push(...o.v):l.b.push(...o.v)}else h.push({t:'chg',a:o.t=='del'?[...o.v]:[],b:o.t=='ins'?[...o.v]:[]})}}return h},
 revert(h,i){return h.map((x,k)=>k==i&&x.t=='chg'?x.a:x.b).flat().join('\n')},accept:h=>h.map(x=>x.b).flat().join('\n')};
// ---------- EPUBV: validate a list of entries [{name,data:string,stored:bool}]
function wellFormed(x){const st=[],re=/<(\/?)([A-Za-z_][\w:.-]*)([^>]*?)(\/?)>|<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!\[CDATA\[[\s\S]*?\]\]>|<!DOCTYPE[^>]*>/g;let m;const VOID=0;
 while((m=re.exec(x))){if(!m[2])continue;if(m[1]){if(st.pop()!==m[2])return false}else if(!m[4])st.push(m[2])}return st.length==0}
const EPUBV={wellFormed,validate(entries){const E=[],W=[],by=Object.fromEntries(entries.map(e=>[e.name,e.data])),has=n=>by[n]!==undefined;
 if(!entries.length||entries[0].name!='mimetype')E.push('mimetype must be the first entry');else{if(entries[0].stored===false)E.push('mimetype must be stored, not deflated');if(String(entries[0].data).trim()!='application/epub+zip')E.push('mimetype content must be application/epub+zip')}
 const cont=by['META-INF/container.xml'];if(!cont){E.push('META-INF/container.xml missing');return{errors:E,warnings:W}}
 const rf=/full-path="([^"]+)"/.exec(cont);if(!rf||!has(rf[1])){E.push('OPF package document not found');return{errors:E,warnings:W}}
 const opf=by[rf[1]],dir=rf[1].includes('/')?rf[1].replace(/[^/]+$/,''):'';if(!wellFormed(opf))E.push('OPF is not well-formed');
 const items=[...opf.matchAll(/<item\b([^>]*)\/?>/g)].map(m=>({id:(/id="([^"]*)"/.exec(m[1])||[])[1],href:(/href="([^"]*)"/.exec(m[1])||[])[1],props:(/properties="([^"]*)"/.exec(m[1])||[])[1]||''}));
 const ids=items.map(i=>i.id);if(new Set(ids).size!=ids.length)E.push('Manifest ids are not unique');
 items.forEach(i=>{if(i.href&&!has(dir+decodeURIComponent(i.href)))E.push('Manifest item not found in package: '+i.href)});
 [...opf.matchAll(/<itemref\b[^>]*idref="([^"]*)"/g)].forEach(m=>{if(!ids.includes(m[1]))E.push('Spine references unknown id '+m[1])});
 if(!items.some(i=>/\bnav\b/.test(i.props)))E.push('Navigation document (properties="nav") missing');
 if(!/dcterms:modified[^>]*>\s*\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ/.test(opf))E.push('dcterms:modified must be CCYY-MM-DDThh:mm:ssZ');
 ['dc:identifier','dc:title','dc:language'].forEach(t=>{if(!new RegExp('<'+t+'[\\s>]').test(opf))E.push('Missing '+t)});
 items.forEach(i=>{const d=by[dir+(i.href||'')];if(typeof d=='string'&&/\.x?html?$/.test(i.href||'')){if(!wellFormed(d))E.push('Not well-formed XHTML: '+i.href);
  if(/(src|href)="https?:\/\//i.test(d))W.push('External resource in '+i.href);[...d.matchAll(/<img\b[^>]*>/g)].forEach(m=>{if(!/\balt="/.test(m[0]))W.push('Image without alt text in '+i.href)});
  if((d.match(/<h1\b/g)||[]).length>1)W.push('More than one h1 in '+i.href);if(!/<html[^>]*\blang=|xml:lang=/.test(d))W.push('Missing lang in '+i.href)}});
 if(!items.some(i=>/cover-image/.test(i.props)))W.push('No cover image declared');return{errors:E,warnings:W}}};
// ---------- SSML
const xe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const SSML={xe,build(text,{voices={},def={},lex=[],max=4500}={}){const paras=String(text).split(/\n{1,}/).map(s=>s.trim()).filter(Boolean),chunks=[];let cur='';
 const wrap=b=>'<speak version="1.0" xml:lang="en-US">'+b+'</speak>',sub=t=>{let o=xe(t);lex.forEach(l=>{if(l.term&&l.say)o=o.split(xe(l.term)).join('<sub alias="'+xe(l.say)+'">'+xe(l.term)+'</sub>')});return o};
 for(const p of paras){let body;const m=/^(?:“|")([^”"]+)(?:”|")\s*(?:,\s*)?(?:(\w[\w .'-]*?)\s+(?:said|asked|replied|whispered|shouted))?/.exec(p);const v=m&&m[2]&&voices[m[2].trim()];
  body=v?`<voice name="${xe(v.voice||def.voice||'')}"><prosody rate="${xe(v.rate||'medium')}" pitch="${xe(v.pitch||'medium')}">${sub(p)}</prosody></voice>`:sub(p);body+='<break time="600ms"/>';
  if(cur.length+body.length>max&&cur){chunks.push(wrap(cur));cur=''}cur+=body}if(cur)chunks.push(wrap(cur));return chunks},
 sentences:t=>String(t).split(/(?<=[.!?…]["”’']?)\s+/).filter(Boolean).flatMap(s=>{const o=[];while(s.length>200){let i=s.lastIndexOf(',',200);if(i<40)i=s.lastIndexOf(' ',200);if(i<1)i=200;o.push(s.slice(0,i+1));s=s.slice(i+1).trim()}o.push(s);return o})};
// ---------- FAM: layered layout + GEDCOM subset
const FAM={layout(people,rels){const par=new Map(),sp=[];people.forEach(p=>par.set(p,[]));rels.forEach(r=>{if(r.rel=='parent'&&par.has(r.b)&&par.has(r.a))par.get(r.b).push(r.a);else if(r.rel=='spouse'||r.rel=='partner')sp.push([r.a,r.b])});
 const gen={};const g=(id,seen=new Set())=>{if(gen[id]!==undefined)return gen[id];if(seen.has(id))return 0;seen.add(id);return gen[id]=par.get(id).length?1+Math.max(...par.get(id).map(p=>g(p,seen))):0};people.forEach(p=>g(p));
 sp.forEach(([a,b])=>{const m=Math.max(gen[a]||0,gen[b]||0);gen[a]=gen[b]=m});
 const rows={};people.forEach(p=>(rows[gen[p]]=rows[gen[p]]||[]).push(p));
 // spouse adjacency + barycenter sweeps
 const pos={};Object.keys(rows).sort((a,b)=>a-b).forEach((k,ri)=>{let r=rows[k];if(ri>0)r=r.sort((a,b)=>{const bc=x=>{const ps=par.get(x).map(p=>pos[p]).filter(v=>v!==undefined);return ps.length?ps.reduce((s,v)=>s+v,0)/ps.length:1e9};return bc(a)-bc(b)});
  const out=[],used=new Set();r.forEach(x=>{if(used.has(x))return;out.push(x);used.add(x);sp.forEach(([a,b])=>{const o=a==x?b:b==x?a:null;if(o&&!used.has(o)&&r.includes(o)){out.push(o);used.add(o)}})});rows[k]=out;out.forEach((x,i)=>pos[x]=i)});
 return{gen,rows,pos}},
 toGedcom(people,rels){const L=['0 HEAD','1 GEDC','2 VERS 5.5','1 CHAR UTF-8'],id=new Map(people.map((p,i)=>[p.id,'@I'+(i+1)+'@']));people.forEach(p=>{L.push('0 '+id.get(p.id)+' INDI','1 NAME '+String(p.name||'').replace(/\s+/g,' ').trim()+' //');if(p.sex)L.push('1 SEX '+p.sex);if(p.born)L.push('1 BIRT','2 DATE '+p.born);if(p.died)L.push('1 DEAT','2 DATE '+p.died)});
  let f=0;const fam=new Map();rels.filter(r=>r.rel=='spouse'||r.rel=='partner').forEach(r=>{const k='@F'+(++f)+'@';fam.set([r.a,r.b].sort().join('|'),k);L.push('0 '+k+' FAM','1 HUSB '+id.get(r.a),'1 WIFE '+id.get(r.b))});
  rels.filter(r=>r.rel=='parent').forEach(r=>{let k=[...fam].find(([s])=>s.split('|').includes(r.a));if(!k){const kk='@F'+(++f)+'@';L.push('0 '+kk+' FAM','1 HUSB '+id.get(r.a));fam.set(r.a,kk);k=[r.a,kk]}L.push('1 CHIL '+id.get(r.b))});L.push('0 TRLR');return L.join('\n')},
 parseGedcom(t){const people=[],fams=[];let cur=null,sub='';if(String(t).length>5e6)throw new Error('too large');for(const line of String(t).split(/\r?\n/)){const m=/^(\d)\s+(?:(@\w+@)\s+)?(\w+)\s*(.*)$/.exec(line);if(!m)continue;const[,lv,ref,tag,val]=m;
  if(lv=='0'){cur=null;if(tag=='INDI'){if(people.length>=1e4)break;cur={ref,type:'I',name:'',sex:''};people.push(cur)}else if(tag=='FAM'){cur={ref,type:'F',ch:[]};fams.push(cur)}}
  else if(cur&&lv=='1'){sub=tag;if(cur.type=='I'&&tag=='NAME')cur.name=val.replace(/\//g,'').trim();if(cur.type=='I'&&tag=='SEX')cur.sex=val;if(cur.type=='F'){if(tag=='HUSB')cur.h=val;if(tag=='WIFE')cur.w=val;if(tag=='CHIL')cur.ch.push(val)}}
  else if(cur&&lv=='2'&&tag=='DATE'&&cur.type=='I'){if(sub=='BIRT')cur.born=val;if(sub=='DEAT')cur.died=val}}
  const rels=[];fams.forEach(f=>{if(f.h&&f.w)rels.push({a:f.h,b:f.w,rel:'spouse'});f.ch.forEach(c=>{if(f.h)rels.push({a:f.h,b:c,rel:'parent'});if(f.w)rels.push({a:f.w,b:c,rel:'parent'})})});return{people,rels}}};
// ---------- NAMES (G1): seedable RNG, syllable generator, phonetic key, clash warnings
const rng=seed=>{let s=seed>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296}};
const CUL={fantasy:{on:['Ael','Bar','Cal','Dor','El','Fen','Gal','Hal','Ith','Kor','Lor','Mar','Nar','Or','Quin','Ryn','Sel','Thal','Val','Wyn'],mid:['a','e','i','o','an','en','ar','or','ia','el'],end:['n','th','ra','dan','wen','mir','las','dor','iel','ys']},
 english:{on:['Al','Beth','Cla','Dan','El','Fran','Grace','Hen','Is','Jo','Kath','Liv','Mar','Nel','Ol','Pen','Rob','Sam','Tom','Wil'],mid:['i','e','a','ri','li'],end:['ce','ry','na','ton','ly','son','ard','ie','ard','ley']},
 scifi:{on:['Zy','Kex','Ori','Vex','Nyx','Tal','Rho','Axi','Jor','Sy'],mid:['x','n','ra','ko','ve'],end:['on','is','ar','ex','a','us','ix']}};
const meta=s=>{s=String(s).toLowerCase().replace(/[^a-z]/g,'');if(!s)return'';const c={b:1,f:1,p:1,v:1,c:2,g:2,j:2,k:2,q:2,s:2,x:2,z:2,d:3,t:3,l:4,m:5,n:5,r:6};let o=s[0],last=c[s[0]]||0;for(const ch of s.slice(1)){const k=c[ch]||0;if(k&&k!=last)o+=k;last=k}return(o+'000').slice(0,4)};
const NAMES={rng,meta,generate({culture='fantasy',n=10,seed=1,start='',len=[2,3],avoid=[]}={}){const R=rng(seed),C=CUL[culture]||CUL.fantasy,pick=a=>a[Math.floor(R()*a.length)],out=[],used=new Set(avoid.map(a=>a.toLowerCase()));
  for(let t=0;t<n*30&&out.length<n;t++){let w=pick(C.on);const k=Math.floor(R()*(len[1]-len[0]+1))+len[0]-1;for(let i=1;i<k;i++)w+=pick(C.mid);w+=pick(C.end);w=w[0].toUpperCase()+w.slice(1).toLowerCase();if(start&&!w.toLowerCase().startsWith(start.toLowerCase()))continue;if(used.has(w.toLowerCase()))continue;used.add(w.toLowerCase());out.push(w)}return out},
 clashes(names){const out=[],seen=new Map(),ini=new Map();names.forEach(n=>{const k=meta(n),i=(n[0]||'').toUpperCase();if(seen.has(k))out.push(`“${n}” sounds like “${seen.get(k)}”`);else seen.set(k,n);if(ini.has(i)&&ini.get(i)!==n)out.push(`“${n}” and “${ini.get(i)}” share the initial ${i}`);else ini.set(i,n)});return out}};
// ---------- SUBS (E2): CSV + ICS
const csvEsc=v=>{v=String(v??'');return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
const SUBS={toCsv(rows,cols){return[cols.join(','),...rows.map(r=>cols.map(c=>csvEsc(r[c])).join(','))].join('\n')},
 parseCsv(t){const rows=[];let row=[],f='',q=false;t=String(t);for(let i=0;i<t.length;i++){const c=t[i];if(q){if(c=='"'){if(t[i+1]=='"'){f+='"';i++}else q=false}else f+=c}else if(c=='"')q=true;else if(c==','){row.push(f);f=''}else if(c=='\n'||c=='\r'){if(c=='\r'&&t[i+1]=='\n')i++;row.push(f);f='';if(row.some(x=>x!==''))rows.push(row);row=[]}else f+=c}row.push(f);if(row.some(x=>x!==''))rows.push(row);
  const h=rows.shift()||[];return rows.slice(0,5000).map(r=>Object.fromEntries(h.map((k,i)=>[k,String(r[i]??'').slice(0,4000)])))},
 toIcs(subs){const L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Kathakaar//EN'],ic=s=>String(s).replace(/[\\;,]/g,m=>'\\'+m).replace(/\n/g,'\\n');subs.filter(s=>/^\d{4}-\d\d-\d\d$/.test(s.followUpAt||'')).forEach(s=>{L.push('BEGIN:VEVENT','UID:'+s.id+'@kathakaar','DTSTAMP:20260101T000000Z','DTSTART;VALUE=DATE:'+s.followUpAt.replace(/-/g,''),'SUMMARY:'+ic('Follow up: '+(s.target||'submission')),'END:VEVENT')});L.push('END:VCALENDAR');return L.join('\r\n')}};
// ---------- STY (G5): chapter stats, z-score outliers, voice fingerprint
const FW='the a an and or but of to in on at for with as by from that this it is was i you he she they we not no so if then there what which who when'.split(' ');
const mean=a=>a.reduce((s,x)=>s+x,0)/(a.length||1),sd=a=>{const m=mean(a);return Math.sqrt(mean(a.map(x=>(x-m)**2)))};
const STY={stats(t){const w=(String(t).toLowerCase().match(/[a-z']+/g)||[]),s=String(t).split(/(?<=[.!?])\s+/).filter(Boolean),lens=s.map(x=>(x.match(/\S+/g)||[]).length);return{words:w.length,avgSent:mean(lens),sdSent:sd(lens),ttr:w.length?new Set(w).size/w.length:0,adverbs:w.filter(x=>/ly$/.test(x)).length/(w.length||1)}},
 outliers(rows,keys=['avgSent','ttr','adverbs']){const out=[];keys.forEach(k=>{const v=rows.map(r=>r.stats[k]),m=mean(v),s=sd(v);if(!s)return;rows.forEach(r=>{const z=(r.stats[k]-m)/s;if(Math.abs(z)>=2&&r.stats.words>=100)out.push({id:r.id,key:k,z:+z.toFixed(2)})})});return out},
 fingerprint(lines){const w=lines.join(' ').toLowerCase().match(/[a-z']+/g)||[],v=FW.map(f=>w.filter(x=>x==f).length/(w.length||1));const sl=lines.map(l=>(l.match(/\S+/g)||[]).length);return{words:w.length,v:[...v,mean(sl)/20,w.filter(x=>/n't$/.test(x)).length/(w.length||1)*5]}},
 cosine(a,b){let d=0,na=0,nb=0;a.forEach((x,i)=>{d+=x*b[i];na+=x*x;nb+=b[i]*b[i]});return na&&nb?d/Math.sqrt(na*nb):0}};
// ---------- CITE
const CITE={apa:r=>`${r.author||'Unknown'} (${r.year||'n.d.'}). ${r.title||''}.${r.url?' '+r.url:''}`,mla:r=>`${r.author||'Unknown'}. “${r.title||''}.” ${r.year||''}.${r.url?' '+r.url:''}`,
 bibtex:r=>`@misc{${(r.id||'ref')},\n  title={${r.title||''}},\n  author={${r.author||''}},\n  year={${r.year||''}},\n  url={${r.url||''}}\n}`};
// ---------- ORDER: reorder helpers (corkboard) — pure
const ORDER={move(ids,id,to){const a=ids.slice(),i=a.indexOf(id);if(i<0)return a;a.splice(i,1);a.splice(Math.max(0,Math.min(a.length,to)),0,id);return a},
 step(ids,id,d){const i=ids.indexOf(id);return i<0?ids.slice():ORDER.move(ids,id,i+d)},
 // split text at a character offset (chapter split) and merge texts (chapter merge); word counts are preserved
 split(text,at){const w=t=>(t.match(/\S+/g)||[]).length,a=text.slice(0,at).trimEnd(),b=text.slice(at).trimStart();return[a,b,w(a)+w(b)==w(text)]},merge:(a,b)=>[a,b].filter(Boolean).join('\n\n')};
// ---------- WIKI (D1): [[Name]], [[Name|shown]], [[Type:Name]], [[#Chapter]] — parsed at render time only
const LINK=/\[\[([^\[\]|]{1,80})(?:\|([^\[\]]{1,80}))?\]\]/g;
const WIKI={entities(S){const o=[];(S.chars||[]).forEach(c=>o.push({type:'character',kind:'chars',id:c.id,name:c.name,aliases:c.aliases||[]}));(S.places||[]).forEach(c=>o.push({type:'place',kind:'places',id:c.id,name:c.name,aliases:c.aliases||[]}));
  (S.props||[]).forEach(c=>o.push({type:'prop',kind:'props',id:c.id,name:c.name,aliases:c.aliases||[]}));(S.factions||[]).forEach(c=>o.push({type:'faction',kind:'factions',id:c.id,name:c.name,aliases:[]}));(S.lexicon||[]).forEach(c=>o.push({type:'term',kind:'lexicon',id:c.id,name:c.term,aliases:[]}));
  (S.ev||[]).forEach(c=>o.push({type:'chapter',kind:'ev',id:c.id,name:c.title,aliases:[]}));return o.filter(x=>x.name)},
 parse(text){const out=[];String(text||'').replace(LINK,(m,t,d,i)=>{let target=t.trim(),type=null;const m2=/^(\w+):(.+)$/.exec(target);if(m2){type=m2[1].toLowerCase();target=m2[2].trim()}else if(target[0]=='#'){type='chapter';target=target.slice(1).trim()}out.push({raw:m,target,type,shown:(d||target).trim(),at:i});return m});return out},
 resolve(ents,l){const f=s=>String(s).toLowerCase(),hit=ents.filter(e=>(!l.type||e.type==l.type)&&(f(e.name)==f(l.target)||(e.aliases||[]).some(a=>f(a)==f(l.target))));return hit.length==1?{ok:true,entity:hit[0]}:{ok:false,ambiguous:hit.length>1,candidates:hit}},
 // every text field in the story, as [{where,id,field,text}]
 texts(S){const o=[];(S.ev||[]).forEach(e=>{['notes','prose'].forEach(f=>e[f]&&o.push({where:'ev',id:e.id,field:f,text:e[f],title:e.title}));['book','script'].forEach(f=>e.fin&&e.fin[f]&&o.push({where:'ev',id:e.id,field:'fin.'+f,text:e.fin[f],title:e.title}))});
  (S.chars||[]).forEach(c=>c.notes&&o.push({where:'chars',id:c.id,field:'notes',text:c.notes,title:c.name}));(S.places||[]).forEach(c=>c.desc&&o.push({where:'places',id:c.id,field:'desc',text:c.desc,title:c.name}));(S.props||[]).forEach(c=>c.desc&&o.push({where:'props',id:c.id,field:'desc',text:c.desc,title:c.name}));return o},
 check(S){const ents=WIKI.entities(S),broken=[],ambiguous=[],linked=new Set();WIKI.texts(S).forEach(t=>WIKI.parse(t.text).forEach(l=>{const r=WIKI.resolve(ents,l);if(r.ok)linked.add(r.entity.id);else(r.ambiguous?ambiguous:broken).push({...t,link:l})}));
  return{broken,ambiguous,orphans:ents.filter(e=>e.type!='chapter'&&!linked.has(e.id))}},
 backlinks(S,entity){const ents=WIKI.entities(S),out=[];WIKI.texts(S).forEach(t=>{if(WIKI.parse(t.text).some(l=>{const r=WIKI.resolve(ents,l);return r.ok&&r.entity.id==entity.id}))out.push(t)});return out},
 unlinked(S,entity){const re=new RegExp('(?<!\\[\\[)\\b'+entity.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b(?![^\\[]*\\]\\])','g');let n=0;WIKI.texts(S).forEach(t=>{n+=(t.text.match(re)||[]).length});return n},
 // rename propagation: updates [[old]] links in every text field; returns the number of links changed
 rename(S,entity,newName){const old=entity.name,f=s=>s.toLowerCase();let n=0;const fix=t=>t.replace(LINK,(m,tg,d)=>{const m2=/^(\w+:)?(.+)$/.exec(tg.trim());if(f(m2[2].trim())!=f(old))return m;if(m2[1]&&m2[1].slice(0,-1).toLowerCase()!=entity.type)return m;n++;return '[['+(m2[1]||'')+newName+(d?'|'+d:'')+']]'});
  WIKI.texts(S).forEach(t=>{const o=t.where=='ev'?S.ev.find(x=>x.id==t.id):S[t.where].find(x=>x.id==t.id);if(!o)return;if(t.field.startsWith('fin.'))o.fin[t.field.slice(4)]=fix(o.fin[t.field.slice(4)]);else o[t.field]=fix(o[t.field])});
  const rec=(S[entity.kind]||[]).find(x=>x.id==entity.id);if(rec){if(rec.name!==undefined)rec.name=newName;else if(rec.term!==undefined)rec.term=newName;else rec.title=newName}return n},
 // render for export: 'plain' | 'text' (strips markup)
 strip:t=>String(t).replace(LINK,(m,tg,d)=>(d||tg.replace(/^(\w+:|#)/,'')).trim())};
// ---------- PALETTE (D4): k-means over RGB pixels [[r,g,b],...]
const PALETTE={kmeans(px,k=5,iters=8){if(!px.length)return[];const C=[];for(let i=0;i<k;i++)C.push(px[Math.floor(i*px.length/k)].slice());
 for(let it=0;it<iters;it++){const sum=C.map(()=>[0,0,0,0]);for(const p of px){let b=0,bd=1e9;C.forEach((c,i)=>{const d=(c[0]-p[0])**2+(c[1]-p[1])**2+(c[2]-p[2])**2;if(d<bd){bd=d;b=i}});const s=sum[b];s[0]+=p[0];s[1]+=p[1];s[2]+=p[2];s[3]++}sum.forEach((s,i)=>{if(s[3])C[i]=[s[0]/s[3],s[1]/s[3],s[2]/s[3]]})}
 return C.map(c=>'#'+c.map(v=>Math.round(v).toString(16).padStart(2,'0')).join(''))}};
// ---------- GEO (D2): scale calibration + distances; TRAVEL (C3.8)
const GEO={scale:(px,units)=>units/px,dist:(a,b,spu)=>Math.hypot(a.x-b.x,a.y-b.y)*spu,
 travelCheck(S,speedKmh=5){const out=[],pins=(S.worldmap&&S.worldmap.pins)||[],spu=S.worldmap&&S.worldmap.scale&&S.worldmap.scale.px?S.worldmap.scale.units/S.worldmap.scale.px:0;if(!spu)return out;const pin=pid=>pins.find(p=>p.placeId==pid);
  const E=[...(S.ev||[])].sort((a,b)=>(+a.t||0)-(+b.t||0));const last={};E.forEach(e=>(e.chars||[]).forEach(c=>{const pv=last[c];if(pv&&pv.place&&e.place&&pv.place!=e.place){const a=pin(pv.place),b=pin(e.place);if(a&&b){const km=GEO.dist(a,b,spu),hours=km/speedKmh,gap=(+e.t-+pv.t)*(S.worldmap.hoursPerUnit||24);if(gap<hours)out.push({char:c,from:pv.ev,to:e,km:+km.toFixed(1),needH:+hours.toFixed(1),gapH:+gap.toFixed(1)})}}last[c]={place:e.place,t:e.t,ev:e}}));return out}};
// ---------- BETA (E6): self-contained reader HTML + untrusted feedback import
const he=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const BETA={
 export(title,chapters,storyId,hash){const body=chapters.map((c,i)=>`<section id="c${i}" data-ch="${he(c.id)}"><h2>${he(c.title)}</h2>${String(c.text).split(/\n{1,}/).filter(Boolean).map((p,pi)=>`<div class="p" data-pi="${pi}"><p>${he(p)}</p><button class="cb" data-ch="${he(c.id)}" data-pi="${pi}" aria-label="Comment on paragraph ${pi+1}">💬</button></div>`).join('')}</section>`).join('');
  const js=`const K='sfbeta:'+${JSON.stringify(storyId)};let C=[];try{C=JSON.parse(localStorage.getItem(K)||'[]')}catch(e){}
document.addEventListener('click',e=>{const b=e.target.closest('.cb');if(b){const t=prompt('Your comment');if(t&&t.trim()){const p=b.parentNode.querySelector('p').textContent;C.push({ch:b.dataset.ch,pi:+b.dataset.pi,quote:p.slice(0,40),text:t.trim().slice(0,4000),ts:Date.now(),reader:document.getElementById('rn').value.slice(0,60)});try{localStorage.setItem(K,JSON.stringify(C))}catch(x){}document.getElementById('n').textContent=C.length}}
if(e.target.id=='ex'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({v:1,story:{id:${JSON.stringify(storyId)},hash:${JSON.stringify(hash||'')}},comments:C})],{type:'application/json'}));a.download='feedback.json';a.click()}});document.getElementById('n').textContent=C.length;`;
  return`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${he(title)} — beta read</title><style>body{font:18px/1.6 Georgia,serif;max-width:40em;margin:2em auto;padding:0 1em}.p{position:relative}.cb{position:absolute;right:-2em;top:0;opacity:.4}.p:hover .cb,.cb:focus{opacity:1}header{position:sticky;top:0;background:#fff;padding:.5em 0;border-bottom:1px solid #ccc}@media(prefers-color-scheme:dark){body,header{background:#111;color:#ddd}}</style></head><body><header><b>${he(title)}</b> · <label>Your name <input id="rn" aria-label="Your name"></label> · <span id="n">0</span> comments · <button id="ex">Export feedback</button></header>${body}<script>${js}<\/script></body></html>`},
 // untrusted input: size caps, schema, plain text only
 validate(raw){if(typeof raw=='string'){if(raw.length>2e6)return{ok:false,error:'file too large'};try{raw=JSON.parse(raw)}catch(e){return{ok:false,error:'not valid JSON'}}}
  if(!raw||raw.v!==1||!Array.isArray(raw.comments))return{ok:false,error:'not a feedback file'};if(raw.comments.length>5000)return{ok:false,error:'too many comments'};
  const out=raw.comments.filter(c=>c&&typeof c=='object'&&typeof c.text=='string'&&typeof c.ch=='string').map(c=>({ch:c.ch.slice(0,64),pi:Math.max(0,Math.min(1e5,+c.pi||0)),quote:String(c.quote||'').slice(0,60),text:c.text.slice(0,4000),ts:+c.ts||0,reader:String(c.reader||'').slice(0,60)}));return{ok:true,comments:out,story:raw.story||{}}},
 // re-anchor to the paragraph that still matches: same index+quote, else search the chapter for the quote
 reanchor(paras,c){if(paras[c.pi]!==undefined&&(!c.quote||paras[c.pi].startsWith(c.quote)||paras[c.pi].includes(c.quote)))return c.pi;const q=c.quote;if(!q)return-1;const i=paras.findIndex(p=>p.includes(q));if(i>=0)return i;
  const k=q.slice(0,20);const j=paras.findIndex(p=>p.includes(k));return j}};
// ---------- QUERY (E1) + FRONT (E7)
const QUERY={words:t=>(String(t).match(/\S+/g)||[]).length,
 compose(q){const parts=[q.hook,q.setup,q.conflict,q.stakes].filter(Boolean),body=parts.join('\n\n'),meta=`${q.title||'TITLE'} is a ${q.genre||'GENRE'} novel${q.words?' complete at '+q.words+' words':''}.`,comps=(q.comps||[]).length?`It will appeal to readers of ${(q.comps||[]).join(' and ')}.`:'';return[body,[meta,comps].filter(Boolean).join(' '),q.bio].filter(Boolean).join('\n\n')},
 guidance(q){const n=QUERY.words(QUERY.compose(q)),m=[];if(n<250)m.push('Short: most query letters run about 250–350 words.');else if(n>400)m.push('Long: consider trimming toward 350 words.');(q.comps||[]).forEach(c=>{if(!/\d{4}/.test(c))m.push('Comp titles: note publication years — agents often prefer recent (last ~5 years) comps.')});return{words:n,notes:[...new Set(m)]}},
 // beat-based synopsis skeleton from mapped beat events (no AI)
 synopsis(S,BEATS){const mapped=(S.ev||[]).filter(e=>e.beat).sort((a,b)=>(+a.t||0)-(+b.t||0));return mapped.map(e=>{const id=e.beat.split(':')[0],pt=e.beat.split(':')[1],t=BEATS&&BEATS.byId(id),p=t&&t.points.find(x=>x.id==pt);return(p?p.t+': ':'')+(e.title||'')+(e.notes?' — '+e.notes.split(/(?<=[.!?])\s/)[0]:'')}).join('\n')}};
const FRONT={KINDS:['title','copyright','dedication','epigraph','acknowledgements','about','also-by','content-warnings','sources'],
 template(kind,S){const y=new Date().getFullYear();return({title:`${S.title||'Title'}\n\nby Author Name`,copyright:`Copyright © ${y} Author Name\nAll rights reserved.\n\nThis is a work of fiction. Names, characters, places and incidents are products of the author’s imagination.`,dedication:'For …',epigraph:'“…”\n— Source',acknowledgements:'Thank you to …',about:'About the author …','also-by':'Also by Author Name\n\n…','content-warnings':'Content notes: '+(((S.rating||{}).cw||[]).join(', ')||'…'),sources:(S.research||[]).filter(r=>r.status=='used').map(r=>CITE.apa(r)).join('\n')})[kind]||''},
 // matter for an export format
 forFormat(S,fmt){return(S.front||[]).filter(f=>!f.includeIn||f.includeIn[fmt]!==false)}};
// ---------- BIBLE: story-bible Markdown for editors and co-writers (characters, places, props over time, lexicon, timeline)
const BIBLE={md(S,PROPS){const nm=(a,id)=>((a||[]).find(x=>x.id==id)||{}).name||'',L=[`# ${S.title||'Story'} — story bible`,''],o=new Map();[...(S.ev||[])].sort((a,b)=>(+a.t||0)-(+b.t||0)).forEach((e,i)=>o.set(e.id,i));
 const sec=(t,rows)=>{if(rows.length)L.push('## '+t,'',...rows,'')};
 sec('Characters',(S.chars||[]).map(c=>`- **${c.name}**${c.role?' — '+c.role:''}${c.notes?': '+String(c.notes).replace(/\n+/g,' '):''}`));
 sec('Places',(S.places||[]).map(c=>`- **${c.name}**${c.desc?': '+String(c.desc).replace(/\n+/g,' '):''}`));
 if((S.props||[]).length&&PROPS){L.push('## Props','');(S.props||[]).forEach(p=>{L.push(`### ${p.name||'Prop'} (${p.kind||'other'})`,'',...(p.desc?[p.desc,'']:[]));const rows=PROPS.sortedLog(S,p);if(rows.length){L.push('| From chapter | Held by | Located at | State |','|---|---|---|---|');rows.forEach(l=>L.push(`| ${((S.ev||[]).find(e=>e.id==l.ev)||{}).title||'?'} | ${nm(S.chars,l.holder)||'—'} | ${nm(S.places,l.place)||'—'} | ${l.state||'intact'} |`))}else L.push('_No custody recorded._');const ap=PROPS.appearances(S,p).map(e=>e.title).filter(Boolean);if(ap.length)L.push('','Appears in: '+ap.join(', '));L.push('')})}
 sec('Glossary',(S.lexicon||[]).map(l=>`- **${l.term}** — ${l.meaning||''}`));
 sec('Timeline',[...(S.ev||[])].sort((a,b)=>o.get(a.id)-o.get(b.id)).map((e,i)=>`${i+1}. **${e.title||'Untitled'}**${e.place?' ('+nm(S.places,e.place)+')':''}${(e.chars||[]).length?' — '+e.chars.map(c=>nm(S.chars,c)).filter(Boolean).join(', '):''}`));
 return L.join('\n')}};
// ---------- ZIPGUARD (E11): limits for importers
const ZIPGUARD={MAX_ENTRIES:5000,MAX_ENTRY:100e6,MAX_TOTAL:100e6,MAX_RATIO:200,
 badName:n=>/(^|[\\/])\.\.([\\/]|$)/.test(n)||/^([\\/]|[A-Za-z]:)/.test(n)||n.includes('\0'),
 // central-directory sanity check before inflating: [{name,cs,us}] -> error string or ''
 check(entries){if(entries.length>ZIPGUARD.MAX_ENTRIES)return'ZIP has too many entries';let tot=0;for(const e of entries){if(ZIPGUARD.badName(e.name))return'ZIP contains an unsafe path: '+e.name;if(e.us>ZIPGUARD.MAX_ENTRY)return'ZIP entry too large: '+e.name;tot+=e.us;if(e.cs>0&&e.us/e.cs>ZIPGUARD.MAX_RATIO&&e.us>1e6)return'ZIP compression ratio is suspicious (possible zip bomb): '+e.name}return tot>ZIPGUARD.MAX_TOTAL?'ZIP is too large when unpacked':''}};
// ---------- PRINT (E4) + COVER (E3): pure geometry, margins, preflight. Platform numbers come from data/platforms.json.
const IN=25.4;
const PRINT={TRIMS:{'5 × 8 in':[127,203.2],'5.25 × 8 in':[133.35,203.2],'5.5 × 8.5 in':[139.7,215.9],'6 × 9 in':[152.4,228.6],'A5':[148,210],'A6':[105,148],'B-format (129 × 198 mm)':[129,198]},
 insideMm(plat,pages){const b=(plat&&plat.insideMarginIn)||[[0,1e9,0.5]];const r=b.find(x=>pages>=x[0]&&pages<=x[1])||b[b.length-1];return +(r[2]*IN).toFixed(2)},
 // estimate pages from words: characters per line / lines per page for a body font
 estimatePages(words,trimMm,fontPt=11,lh=1.5,marginMm=18){const [w,h]=trimMm,tw=w-2*marginMm,th=h-2*marginMm,ptMm=0.3528,cpl=tw/(fontPt*0.5*ptMm),lines=th/(fontPt*lh*ptMm),wpp=Math.max(80,cpl/6*lines*0.92);return Math.max(1,Math.ceil(words/wpp))},
 // profile: {trim:[w,h] mm, bleed mm, inside mm, outside mm, top mm, bottom mm, mirror, chapterStart:'right'|'any'}
 css(p){const W=p.trim[0]+2*p.bleed,H=p.trim[1]+2*p.bleed,b=p.bleed,ins=p.inside+b,out=p.outside+b,t=p.top+b,bt=p.bottom+b;
  return`@page{size:${W.toFixed(2)}mm ${H.toFixed(2)}mm;margin:${t.toFixed(2)}mm ${out.toFixed(2)}mm ${bt.toFixed(2)}mm ${ins.toFixed(2)}mm}`+(p.mirror?`@page:left{margin-left:${out.toFixed(2)}mm;margin-right:${ins.toFixed(2)}mm}@page:right{margin-left:${ins.toFixed(2)}mm;margin-right:${out.toFixed(2)}mm}`:'')+
  (p.chapterStart=='right'?'.ch{break-before:right!important}':'')+'p{orphans:2;widows:2}'+(p.oldstyle?'html{font-variant-numeric:oldstyle-nums}':'')},
 // full-wrap paperback cover: width = 2*trimW + spine + 2*bleed ; spine = pages * paper thickness
 cover(plat,trim,pages,paper='white',bleedIn){const th=((plat.paperThicknessIn||{})[paper]||0.0025)*IN,spine=pages*th,b=(bleedIn??plat.coverBleedIn??0.125)*IN;
  return{spineMm:+spine.toFixed(2),widthMm:+(2*trim[0]+spine+2*b).toFixed(2),heightMm:+(trim[1]+2*b).toFixed(2),bleedMm:+b.toFixed(2),frontX:+(trim[0]+spine+b).toFixed(2),spineX:+(trim[0]+b).toFixed(2),
   px:dpi=>({w:Math.round((2*trim[0]+spine+2*b)/IN*dpi),h:Math.round((trim[1]+2*b)/IN*dpi)}),spineTextOk:pages>=(plat.spineMinPages||79)}},
 preflight({pages,plat,profile,images=[],fonts=[],widows=0}){const out=[];if(pages<plat.minPages)out.push({sev:'error',msg:`${pages} pages is below the minimum of ${plat.minPages}.`});if(pages>plat.maxPages)out.push({sev:'error',msg:`${pages} pages is above the maximum of ${plat.maxPages}.`});
  if(pages%2)out.push({sev:'warn',msg:'Odd page count — printers add a blank page; plan for an even count.'});
  const need=PRINT.insideMm(plat,pages);if(profile.inside<need-0.01)out.push({sev:'error',msg:`Inside margin ${profile.inside} mm is below the ${need} mm needed for ${pages} pages.`});
  if(plat.outsideMinIn&&profile.outside<plat.outsideMinIn*IN-0.01)out.push({sev:'error',msg:`Outside margin is below ${(plat.outsideMinIn*IN).toFixed(1)} mm.`});
  if(plat.topBottomMinIn&&(profile.top<plat.topBottomMinIn*IN-0.01||profile.bottom<plat.topBottomMinIn*IN-0.01))out.push({sev:'error',msg:`Top/bottom margin is below ${(plat.topBottomMinIn*IN).toFixed(1)} mm.`});
  if(profile.bleed&&plat.bleedMm&&profile.bleed<plat.bleedMm-0.01)out.push({sev:'warn',msg:`Bleed ${profile.bleed} mm is less than the usual ${plat.bleedMm} mm.`});
  images.forEach(i=>{const dpi=i.w/(i.printWmm/IN);if(dpi<300)out.push({sev:'warn',msg:`Image “${i.name||'image'}” prints at about ${Math.round(dpi)} dpi (300 recommended).`})});
  if(widows)out.push({sev:'info',msg:widows+' possible widow/orphan lines.'});
  if(fonts.length)out.push({sev:'info',msg:'Fonts used: '+fonts.join(', ')+'. Browser PDFs embed fonts but are not PDF/X; check with your printer.'});return out}};
// cover layout: rectangles for each template, in a w×h box; used by the canvas designer
const COVERTPL={centered:(w,h)=>({title:{x:w/2,y:h*0.38,size:h*0.08,align:'center'},author:{x:w/2,y:h*0.88,size:h*0.04,align:'center'}}),
 bottom:(w,h)=>({title:{x:w/2,y:h*0.72,size:h*0.07,align:'center'},author:{x:w/2,y:h*0.9,size:h*0.04,align:'center'},band:{x:0,y:h*0.6,w,h:h*0.4,a:0.55}}),
 top:(w,h)=>({title:{x:w/2,y:h*0.16,size:h*0.07,align:'center'},author:{x:w/2,y:h*0.3,size:h*0.04,align:'center'},band:{x:0,y:0,w,h:h*0.38,a:0.55}}),
 split:(w,h)=>({title:{x:w*0.08,y:h*0.45,size:h*0.065,align:'left'},author:{x:w*0.08,y:h*0.9,size:h*0.035,align:'left'},band:{x:0,y:0,w:w*0.5,h,a:0.6}}),
 type:(w,h)=>({title:{x:w/2,y:h*0.45,size:h*0.1,align:'center'},author:{x:w/2,y:h*0.62,size:h*0.045,align:'center'}})};
// pick black or white text for contrast against a hex background
const ink=hex=>{const n=parseInt(String(hex).replace('#',''),16)||0,r=n>>16,g=n>>8&255,b=n&255;return(0.299*r+0.587*g+0.114*b)>150?'#111111':'#ffffff'};
// ---------- SERIAL (E8): chapter text -> platform-safe HTML/plain, author notes, release schedule
const SERIAL={SCENE:/^\s*(\*\s*\*\s*\*|\*{3,}|-{3,}|#{1,3}|—{2,})\s*$/,
 // allowed-tag sanitiser: drops tags not in `allow`, strips all attributes except href on <a> (http/https only)
 sanitize(html,allow){const A=new Set(allow);return String(html).replace(/<(\/?)([a-zA-Z][\w-]*)([^>]*)>/g,(m,sl,tag,rest)=>{tag=tag.toLowerCase();if(!A.has(tag))return'';if(tag=='a'&&!sl){const h=/href\s*=\s*"(https?:\/\/[^"]*)"/i.exec(rest);return h?`<a href="${he(h[1])}" rel="noopener noreferrer">`:'<a>'}return'<'+sl+tag+'>'})},
 html(text,plat,{noteTop,noteBottom,title}={}){const allow=new Set(plat.tags),paras=String(text).split(/\n+/).map(s=>s.trim()).filter(Boolean),out=[];
  const note=n=>n&&n.trim()?(allow.has('blockquote')?`<blockquote><p><em>${he(n.trim())}</em></p></blockquote>`:`<p><em>${he(n.trim())}</em></p>`):'';
  if(noteTop)out.push(note(noteTop));if(title&&allow.has('h2'))out.push(`<h2>${he(title)}</h2>`);
  for(const p of paras){if(SERIAL.SCENE.test(p)){out.push(plat.sceneBreak=='hr'&&allow.has('hr')?'<hr>':'<p style="text-align:center">* * *</p>'.replace(/ style="[^"]*"/,''));continue}
   let t=he(p).replace(/(^|[\s(])_([^_]+)_(?=[\s).,;:!?]|$)/g,(m,a,b)=>a+(allow.has('em')?'<em>'+b+'</em>':b)).replace(/\*\*([^*]+)\*\*/g,(m,b)=>allow.has('strong')?'<strong>'+b+'</strong>':b);out.push('<p>'+t+'</p>')}
  if(noteBottom)out.push(note(noteBottom));return SERIAL.sanitize(out.join('\n'),plat.tags)},
 plain:html=>String(html).replace(/<\/(p|h\d|blockquote|li)>/g,'\n\n').replace(/<hr\s*\/?>/g,'\n* * *\n').replace(/<br\s*\/?>/g,'\n').replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\n{3,}/g,'\n\n').trim(),
 // release dates: every `everyDays` starting `start` (YYYY-MM-DD), skipping weekdays not in `days` (0=Sun)
 schedule(start,n,everyDays=7){const[y,m,d]=start.split('-').map(Number),out=[];for(let i=0;i<n;i++){const t=new Date(Date.UTC(y,m-1,d+i*everyDays));out.push(t.getUTCFullYear()+'-'+String(t.getUTCMonth()+1).padStart(2,'0')+'-'+String(t.getUTCDate()).padStart(2,'0'))}return out},
 ics(items){const L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Kathakaar//EN'];items.forEach((x,i)=>L.push('BEGIN:VEVENT','UID:serial'+i+'@kathakaar','DTSTAMP:20260101T000000Z','DTSTART;VALUE=DATE:'+x.date.replace(/-/g,''),'SUMMARY:'+String(x.title).replace(/[\\;,]/g,m=>'\\'+m),'END:VEVENT'));L.push('END:VCALENDAR');return L.join('\r\n')}};
return{DIFF,EPUBV,SSML,FAM,NAMES,SUBS,STY,CITE,ORDER,WIKI,PALETTE,GEO,BETA,QUERY,FRONT,BIBLE,ZIPGUARD,PRINT,COVERTPL,ink,SERIAL}});
