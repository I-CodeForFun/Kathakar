/* Props (weapons, equipment, documents, artifacts…) tracked over time and place. Pure, UMD.
   prop = {id,name,kind,desc,owner?,place?,log:[{id,ev,holder,place,state,note}]}; event.props = [propId] (appears in that scene).
   State at an event = the latest custody-log entry at or before it in story order. */
(function(root,factory){const P=(typeof module=='object'&&module.exports)?require('./packs.js'):root.PACKS;const x=factory(P);if(typeof module=='object'&&module.exports)module.exports=x;else root.PROPS=x})(typeof self!='undefined'?self:this,function(PACKS){
const KINDS=['weapon','equipment','document','vehicle','clothing','artifact','money','other'];
const STATES=['intact','damaged','broken','lost','stolen','hidden','destroyed','consumed'];
const GONE=new Set(['lost','destroyed','consumed','stolen']);   // not usable on-page until a later log entry changes the state
const ord=S=>PACKS.order(S);
const name=(arr,id)=>{const x=(arr||[]).find(y=>y.id==id);return x?(x.name||x.title):null};
// log entries sorted in story order (ties keep array order)
function sortedLog(S,p){const o=ord(S);return(p.log||[]).filter(l=>o.has(l.ev)).map((l,i)=>({l,i,k:o.get(l.ev)})).sort((a,b)=>a.k-b.k||a.i-b.i).map(x=>x.l)}
// state at event: {holder,place,state,since,known}. Before the first log entry, falls back to prop.owner/prop.place (known:false if neither)
function stateAt(S,p,evId){const o=ord(S),at=o.get(evId);let cur=null;if(at!==undefined)for(const l of sortedLog(S,p)){if(o.get(l.ev)<=at)cur=l;else break}
 if(cur)return{holder:cur.holder||null,place:cur.place||null,state:cur.state||'intact',since:cur.ev,note:cur.note||'',known:true};
 return{holder:p.owner||null,place:p.place||null,state:'intact',since:null,note:'',known:!!(p.owner||p.place||(p.log||[]).length==0&&false)}}
// the effective location at an event: explicit place, else the scene place if the holder is in the scene
function whereAt(S,p,evId){const st=stateAt(S,p,evId),ev=(S.ev||[]).find(e=>e.id==evId);if(st.place)return st.place;if(st.holder&&ev&&(ev.chars||[]).includes(st.holder))return ev.place||null;return null}
// full timeline: one row per chapter in order
function timeline(S,p){const E=[...(S.ev||[])].sort((a,b)=>ord(S).get(a.id)-ord(S).get(b.id));return E.map(e=>({ev:e,...stateAt(S,p,e.id),where:whereAt(S,p,e.id),appears:(e.props||[]).includes(p.id)}))}
// chapters where the prop appears
const appearances=(S,p)=>(S.ev||[]).filter(e=>(e.props||[]).includes(p.id));
// props held by a character at an event
const heldBy=(S,charId,evId)=>(S.props||[]).filter(p=>{const s=stateAt(S,p,evId);return s.holder===charId&&!GONE.has(s.state)});
// props present at an event (appearing or held by someone in the scene or located at the scene place)
function presentAt(S,evId){const ev=(S.ev||[]).find(e=>e.id==evId);if(!ev)return[];return(S.props||[]).filter(p=>{if((ev.props||[]).includes(p.id))return true;const s=stateAt(S,p,evId);if(GONE.has(s.state))return false;return(s.holder&&(ev.chars||[]).includes(s.holder))||(s.place&&ev.place&&s.place===ev.place&&!s.holder)})}
// ---- checks (always on, no pack gate)
PACKS.register({id:'props.continuity',pack:null,label:'Prop continuity',run:S=>{const out=[],o=ord(S);(S.props||[]).forEach(p=>{const pn=p.name||'Prop',first=sortedLog(S,p)[0];
 for(const e of S.ev||[]){if(!(e.props||[]).includes(p.id))continue;const st=stateAt(S,p,e.id),ref={kind:'ev',id:e.id};
  if(GONE.has(st.state))out.push({sev:'error',msg:`“${pn}” appears in “${e.title}” but was ${st.state} earlier.`,ref});
  else if(st.state=='broken')out.push({sev:'warn',msg:`“${pn}” is broken when it appears in “${e.title}”.`,ref});
  if(st.holder&&!(e.chars||[]).includes(st.holder)&&!(st.place&&e.place&&st.place===e.place))out.push({sev:'warn',msg:`“${pn}” appears in “${e.title}” but its holder (${name(S.chars,st.holder)||'?'}) isn’t in the scene.`,ref});
  if(!st.holder&&st.place&&e.place&&st.place!==e.place)out.push({sev:'warn',msg:`“${pn}” is at ${name(S.places,st.place)||'?'} but appears in “${e.title}” set at ${name(S.places,e.place)||'?'}.`,ref});
  if(!st.known&&!first)out.push({sev:'info',msg:`“${pn}” has no custody recorded before “${e.title}”.`,ref})}
 // holder changes places without the prop (holder present elsewhere while prop sits at a fixed place)
 for(const e of S.ev||[]){const st=stateAt(S,p,e.id);if(st.holder&&e.place&&(e.chars||[]).includes(st.holder)&&st.place&&st.place!==e.place&&!GONE.has(st.state))out.push({sev:'info',msg:`${name(S.chars,st.holder)} holds “${pn}” but the log places it at ${name(S.places,st.place)}, while they are at ${name(S.places,e.place)} in “${e.title}”.`,ref:{kind:'ev',id:e.id}})}
 // Chekhov's gun: weapons introduced but never appearing again
 if(p.kind=='weapon'&&first){const intro=o.get(first.ev),later=(S.ev||[]).some(e=>(e.props||[]).includes(p.id)&&o.get(e.id)>intro);if(!later&&(S.ev||[]).length>5)out.push({sev:'info',msg:`Weapon “${pn}” is introduced but never used again (Chekhov’s gun).`,ref:{kind:'props',id:p.id}})}
 // consecutive log entries that contradict (same event twice with different holders)
 const seen=new Map();(p.log||[]).forEach(l=>{const k=l.ev;if(seen.has(k)&&(seen.get(k).holder!==l.holder||seen.get(k).state!==l.state))out.push({sev:'warn',msg:`“${pn}” has conflicting custody entries for one scene.`,ref:{kind:'props',id:p.id}});seen.set(k,l)})});return out}});
return{KINDS,STATES,GONE,stateAt,whereAt,timeline,appearances,heldBy,presentAt,sortedLog}});
