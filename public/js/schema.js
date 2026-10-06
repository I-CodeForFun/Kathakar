/* Story schema: validate() + migrate().  Works in the browser (window.SCHEMA) and in Node (server, tests). */
(function(root,factory){if(typeof module=='object'&&module.exports)module.exports=factory();else root.SCHEMA=factory()})(typeof self!='undefined'?self:this,function(){
const VERSION=10,BAD=['__proto__','constructor','prototype'],MAXN=50000;
const isObj=o=>o&&typeof o=='object'&&!Array.isArray(o);
// Collection registry (A1): single source of truth for validate / migrate / norm / ref repair.
// {kind, since: schema version, max: entries, refs: {field:'targetCollection'} (list fields end with [])}
const COLLECTIONS={chars:{kind:'list',since:1,max:50000},places:{kind:'list',since:1,max:50000},times:{kind:'list',since:1,max:50000},rels:{kind:'list',since:1,max:50000,refs:{}},
 info:{kind:'list',since:1,max:50000},tls:{kind:'list',since:1,max:50000},ev:{kind:'list',since:1,max:50000,refs:{'chars[]':'chars'}},lk:{kind:'list',since:1,max:50000},worlds:{kind:'list',since:1,max:50000},
 inbox:{kind:'list',since:7,max:500},tpls:{kind:'list',since:7,max:100},
 // v8 genre packs
 clues:{kind:'list',since:8,max:2000,refs:{plantedIn:'ev',payoffIn:'ev'}},suspects:{kind:'list',since:8,max:200,refs:{charId:'chars',alibiEv:'ev',alibiPlace:'places'}},reveals:{kind:'list',since:8,max:500,refs:{chapterId:'ev','requires[]':'clues'}},
 evid:{kind:'list',since:8,max:2000,refs:{sceneId:'ev',usedIn:'ev'}},systems:{kind:'list',since:8,max:100,refs:{'practitioners[]':'chars'}},factions:{kind:'list',since:8,max:300,refs:{'members[]':'chars'}},
 techs:{kind:'list',since:8,max:500,refs:{'prerequisites[]':'techs',firstUse:'ev'}},lexicon:{kind:'list',since:8,max:5000,refs:{firstAppearance:'ev'}},proph:{kind:'list',since:8,max:100,refs:{introducedIn:'ev',fulfilledIn:'ev'}},
 deaths:{kind:'list',since:8,max:200,refs:{charId:'chars',evId:'ev'}},gagdefs:{kind:'list',since:8,max:200,refs:{setupIn:'ev',payoffIn:'ev','beats[]':'ev'}},motifs:{kind:'list',since:8,max:100,refs:{'appearances[]':'ev'}},
 realev:{kind:'list',since:8,max:5000},threads:{kind:'list',since:8,max:20},research:{kind:'list',since:8,max:2000},family:{kind:'list',since:8,max:2000,refs:{a:'chars',b:'chars'}},subs:{kind:'list',since:8,max:2000},
 props:{kind:'list',since:9,max:5000,refs:{owner:'chars',place:'places'}},
 names:{kind:'list',since:8,max:200},eras:{kind:'list',since:8,max:200},worldev:{kind:'list',since:8,max:5000},dismissed:{kind:'list',since:8,max:5000}};
const LISTS_V8=Object.keys(COLLECTIONS).filter(k=>COLLECTIONS[k].since==8),LISTS=Object.keys(COLLECTIONS).filter(k=>COLLECTIONS[k].kind=='list'&&COLLECTIONS[k].since<=VERSION),ARR=LISTS;
// Returns {errors:[...fatal], warnings:[...fixable]}.  Fatal => refuse to import / store.
function validate(o){const errors=[],warnings=[];
 if(!isObj(o))return{errors:['Not a JSON object'],warnings};
 BAD.forEach(k=>{if(Object.prototype.hasOwnProperty.call(o,k))errors.push('Forbidden key: '+k)});
 ARR.forEach(k=>{if(o[k]===undefined)return;if(!Array.isArray(o[k])){errors.push(`"${k}" must be a list`);return}
  if(o[k].length>(COLLECTIONS[k].max||MAXN))errors.push(`"${k}" has too many entries (${o[k].length})`);
  const bad=o[k].filter(x=>!isObj(x)).length;if(bad)warnings.push(`${bad} invalid entr${bad>1?'ies':'y'} in "${k}" will be dropped`);
  const ids=new Set();let dup=0;o[k].forEach(x=>{if(isObj(x)&&x.id){if(ids.has(x.id))dup++;ids.add(x.id)}});if(dup)warnings.push(`${dup} duplicate id${dup>1?'s':''} in "${k}"`)});
 ['cells','sc'].forEach(k=>{if(o[k]===undefined)return;if(!isObj(o[k]))errors.push(`"${k}" must be an object`);else BAD.forEach(b=>{if(Object.prototype.hasOwnProperty.call(o[k],b))errors.push(`Forbidden key in "${k}": ${b}`)})});
 if(o.title!==undefined&&typeof o.title!='string')warnings.push('"title" is not text and will be reset');
 if(Array.isArray(o.ev)){const n=o.ev.filter(e=>isObj(e)&&e.t!==undefined&&!isFinite(+e.t)).length;if(n)warnings.push(`${n} event${n>1?'s have':' has'} an invalid time (set to 0)`)}
 if(o.v!==undefined&&(!(+o.v>=0)||+o.v>VERSION))warnings.push(`File was made by a newer version (v${o.v}); some data may be ignored`);
 return{errors,warnings}}
// Ordered, idempotent upgrades. Each step upgrades from version (n-1) to n.
const STEPS={
 1:o=>{(o.info||[]).forEach(i=>{if(isObj(i)&&i.pl===undefined&&typeof i.cell=='string'&&i.cell.includes('|')){const q=i.cell.split('|');i.pl=q[0];i.tm=q[1]}})},          // info.cell "place|time" → pl / tm
 2:o=>{(o.rels||[]).forEach(r=>{if(!isObj(r))return;['from','to'].forEach(k=>{if(r[k]!==undefined&&r[k]!==''&&!isFinite(+r[k]))delete r[k]})})},                           // relationship year range must be numeric
 3:o=>{(o.ev||[]).forEach(e=>{if(!isObj(e))return;if(typeof e.fin=='string')e.fin={book:e.fin};if(e.fin&&!isObj(e.fin))delete e.fin;if(e.prose!==undefined&&typeof e.prose!='string')e.prose=String(e.prose)})},  // final-text edits are {book,script}
 4:o=>{(o.rels||[]).forEach(r=>{if(!isObj(r))return;if(r.bt!==undefined&&!Array.isArray(r.bt))r.bt=[];if(r.tg!==undefined&&!Array.isArray(r.tg))r.tg=[]});if(o.grps!==undefined&&!Array.isArray(o.grps))o.grps=[]},   // relationship arcs
 5:o=>{(o.worlds||[]).forEach(w=>{if(!isObj(w))return;if(!Array.isArray(w.rules))w.rules=[];w.rules.forEach(r=>{if(isObj(r)){if(r.off===true)r.off=1;if(r.off===false)r.off=0}})})},                // world rule flags
 6:o=>{if(o.goal!==undefined&&!(+o.goal>=0))delete o.goal},
 7:o=>{['inbox','tpls'].forEach(k=>{if(!Array.isArray(o[k]))o[k]=[]});if(o.dgoal!==undefined&&!(+o.dgoal>=0))delete o.dgoal},
 8:o=>{LISTS_V8.forEach(k=>{if(!Array.isArray(o[k]))o[k]=[]});if(!Array.isArray(o.packs))o.packs=[]},
 9:o=>{if(!Array.isArray(o.props))o.props=[];if(Array.isArray(o.ev))o.ev.forEach(e=>{if(e&&e.props!==undefined&&!Array.isArray(e.props))e.props=[]})},
 10:o=>{if(Array.isArray(o.ev))o.ev.forEach(e=>{if(!e||!Array.isArray(e.cm))return;e.cm=e.cm.filter(c=>c&&typeof c=='object').map(c=>({...c,x:String(c.x??c.text??''),by:c.by||'',resolved:!!c.resolved,replies:Array.isArray(c.replies)?c.replies:[],anchor:c.anchor||null}))})}};   // v10: comment threads (additive; legacy {id,x,ts} kept)   // v9: props (weapons, equipment…) tracked over time and place   // v8: genre-pack containers (all optional, empty)   // v7: inbox, beat templates, daily goal
function migrate(o){if(!isObj(o))return o;let v=Math.max(0,Math.floor(+o.v)||0);if(v>VERSION)return o;const errs=[];
 for(let n=v+1;n<=VERSION;n++){try{STEPS[n](o);v=n}catch(e){errs.push({step:n,error:String(e&&e.message||e)});break}}   // stop at first failure; never stamp past the last good step
 o.v=v;if(errs.length)Object.defineProperty(o,'__migrationErrors',{value:errs,enumerable:false,configurable:true,writable:true});else if(o.__migrationErrors)delete o.__migrationErrors;return o}
// Referential integrity (A9): drop dangling refs declared in COLLECTIONS[x].refs. Returns number of repairs.
function repair(s){let n=0;if(!isObj(s))return 0;
 for(const c of LISTS){const refs=COLLECTIONS[c].refs;if(!refs||!Array.isArray(s[c]))continue;
  for(const f in refs){const multi=f.endsWith('[]'),fld=multi?f.slice(0,-2):f,tgt=new Set((s[refs[f]]||[]).map(x=>x&&x.id));
   for(const it of s[c]){if(!isObj(it))continue;if(multi){if(Array.isArray(it[fld])){const keep=it[fld].filter(id=>tgt.has(id));n+=it[fld].length-keep.length;it[fld]=keep}}
    else if(it[fld]&&!tgt.has(it[fld])){it[fld]=null;n++}}}}
 // props: nested custody log + event appearances
 const evs=new Set((s.ev||[]).map(x=>x&&x.id)),chs=new Set((s.chars||[]).map(x=>x&&x.id)),pls=new Set((s.places||[]).map(x=>x&&x.id)),pr=new Set((s.props||[]).map(x=>x&&x.id));
 (s.props||[]).forEach(p=>{if(!isObj(p)||!Array.isArray(p.log))return;const keep=p.log.filter(l=>l&&evs.has(l.ev));n+=p.log.length-keep.length;p.log=keep;p.log.forEach(l=>{if(l.holder&&!chs.has(l.holder)){l.holder=null;n++}if(l.place&&!pls.has(l.place)){l.place=null;n++}})});
 (s.ev||[]).forEach(e=>{if(e&&Array.isArray(e.props)){const k=e.props.filter(id=>pr.has(id));n+=e.props.length-k.length;e.props=k}});return n}
// Where is an entity used? → [{coll,item,field}]
function usage(s,kind,id){const out=[];if(kind=='ev'||kind=='chars'||kind=='places')(s.props||[]).forEach(p=>(p.log||[]).forEach(l=>{if((kind=='ev'&&l.ev===id)||(kind=='chars'&&l.holder===id)||(kind=='places'&&l.place===id))out.push({coll:'props',item:p,field:'log'})}));if(kind=='ev'&&Array.isArray(s.ev))s.ev.forEach(e=>{if(Array.isArray(e.props)&&false)out.push({coll:'ev',item:e,field:'props'})});for(const c of LISTS){const refs=COLLECTIONS[c].refs;if(!refs||!Array.isArray(s[c]))continue;
 for(const f in refs){if(refs[f]!=kind)continue;const multi=f.endsWith('[]'),fld=multi?f.slice(0,-2):f;
  s[c].forEach(it=>{if(isObj(it)&&(multi?Array.isArray(it[fld])&&it[fld].includes(id):it[fld]===id))out.push({coll:c,item:it,field:fld})})}}return out}
// 3-way merge (P0-4). base/local/remote are plain JSON values. Lists of {id} objects merge by id; objects field by field;
// multi-paragraph strings merge per paragraph when paragraph counts match. Unresolvable → local wins + conflict recorded.
const eq=(a,b)=>a===b||JSON.stringify(a)===JSON.stringify(b);
const hasIds=a=>Array.isArray(a)&&a.length>0&&a.every(x=>isObj(x)&&x.id!==undefined);
function merge3(base,local,remote){const conflicts=[];
 const m=(b,l,r,path)=>{if(eq(l,r))return l;if(eq(b,l))return r;if(eq(b,r))return l;
  if(isObj(l)&&isObj(r)){const bb=isObj(b)?b:{},o={};for(const k of new Set([...Object.keys(l),...Object.keys(r)])){if(BAD.includes(k))continue;
    const inL=k in l,inR=k in r,inB=k in bb;
    if(inL&&inR)o[k]=m(bb[k],l[k],r[k],path+'.'+k);
    else if(inL){if(inB&&eq(bb[k],l[k])){/* removed remotely, untouched locally */}else if(inB){conflicts.push({path:path+'.'+k,base:bb[k],local:l[k],remote:undefined});o[k]=l[k]}else o[k]=l[k]}
    else{if(inB&&eq(bb[k],r[k])){/* removed locally */}else if(inB){conflicts.push({path:path+'.'+k,base:bb[k],local:undefined,remote:r[k]});o[k]=r[k]}else o[k]=r[k]}}
   return o}
  if(Array.isArray(l)&&Array.isArray(r)&&(hasIds(l)||hasIds(r))&&(b===undefined||Array.isArray(b))){
   const bm=new Map((b||[]).filter(x=>isObj(x)).map(x=>[x.id,x])),lm=new Map(l.map(x=>[x.id,x])),rm=new Map(r.map(x=>[x.id,x])),out=[],seen=new Set();
   const ids=[...l.map(x=>x.id),...r.map(x=>x.id)];
   for(const id of ids){if(seen.has(id))continue;seen.add(id);const bi=bm.get(id),li=lm.get(id),ri=rm.get(id);
    if(li&&ri)out.push(m(bi,li,ri,path+'['+id+']'));
    else if(li){if(bi&&eq(bi,li)){/* deleted remotely */}else if(bi){conflicts.push({path:path+'['+id+']',base:bi,local:li,remote:undefined,kind:'edit-vs-delete'});out.push(li)}else out.push(li)}
    else{if(bi&&eq(bi,ri)){/* deleted locally */}else if(bi){conflicts.push({path:path+'['+id+']',base:bi,local:undefined,remote:ri,kind:'delete-vs-edit'});out.push(ri)}else out.push(ri)}}
   return out}
  if(typeof l=='string'&&typeof r=='string'&&typeof b=='string'&&l.includes('\n')){const L=l.split('\n'),R=r.split('\n'),B=b.split('\n');
   if(L.length==R.length&&L.length==B.length){let bad=false;const o=L.map((x,i)=>{if(x===R[i])return x;if(x===B[i])return R[i];if(R[i]===B[i])return x;bad=true;return x});if(!bad)return o.join('\n')}}
  conflicts.push({path,base:b,local:l,remote:r});return l};
 return{value:m(base,local,remote,''),conflicts}}
return{VERSION,COLLECTIONS,LISTS,validate,migrate,repair,usage,merge3}});
