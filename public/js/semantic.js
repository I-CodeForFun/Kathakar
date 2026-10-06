/* ---- Semantic (local) rule check: client side ---- */
const SEM={};                                   // itemId -> {h, v:[{rule,quote,reason}]}
const shash=s=>{let h=5381;for(let i=0;i<s.length;i++)h=(h*33^s.charCodeAt(i))>>>0;return h.toString(36)};
const wsig=w=>shash(JSON.stringify((w.rules||[]).map(r=>[r.id,r.text,r.ban,r.trig,r.off])));
// Events also carry facts about the characters involved (tagged, or named in the text), e.g. "Sona — made of gold".
const chText=(o,base)=>{const low=base.toLowerCase();return S.chars.filter(c=>(o.chars||[]).includes(c.id)||(c.name&&c.name.length>1&&low.includes(c.name.toLowerCase())))
 .map(c=>{const f=[c.role,c.desc,c.secret].filter(Boolean).join('; ');return f?c.name+' — '+f+'.':''}).filter(Boolean)};
const itemTxt=(k,o)=>{if(k!='ev')return [o.title,o.text].filter(Boolean).join('\n');const b=[o.title,o.place,o.notes,msText(o)].filter(Boolean).join('\n');return [b,...chText(o,b),...(typeof plText=='function'?plText(o):[])].join('\n')};
const _wchk=wchk;
wchk=function(){const V=_wchk();
 const add=(k,o)=>{const w=wget(o.world)||wact(),s=SEM[o.id];if(!w||!s||s.h!=shash(wsig(w)+itemTxt(k,o)))return;
  s.v.forEach(x=>{const r=(w.rules||[]).find(r=>r.id==x.rule);if(r&&!r.off)V.push({src:{k,id:o.id,n:o.title||'Untitled'},w,r,term:x.reason,quote:x.quote,score:x.score,sem:1,how:x.how||'meaning',why:[{how:x.how||'meaning',term:x.reason,quote:x.quote||'',score:x.score,verdict:x.verdict,judge:x.judge,via:x.via}],waived:(o.wx||[]).includes(r.id)})})};
 S.ev.forEach(e=>add('ev',e));S.info.forEach(i=>add('info',i));return wdedupe(V)};   // simple + semantic hits on the same rule/event are merged into one
const SEMI={dismissed:0,judged:0,provider:'',errors:new Set(),skipped:0};
async function semRun(onlyId){
 const groups={};let trunc=null;Object.assign(SEMI,{dismissed:0,judged:0,provider:'',errors:new Set(),skipped:0});
 const push=(k,o)=>{const w=wget(o.world)||wact();if(!w||!(w.rules||[]).some(r=>!r.off&&(r.text||r.ban||r.trig)))return;(groups[w.id]=groups[w.id]||{w,items:[]}).items.push({id:o.id,text:itemTxt(k,o),k,o})};
 S.ev.filter(e=>!onlyId||e.id==onlyId).forEach(e=>push('ev',e));if(!onlyId)S.info.forEach(i=>push('info',i));
 if(!Object.keys(groups).length){
  const ws=S.worlds||[];
  if(!ws.length)throw new Error('Create a world first (Worlds & Rules tab).');
  if(!ws.some(w=>(w.rules||[]).some(r=>!r.off&&(r.text||r.ban||r.trig))))throw new Error('Add at least one rule with text to a world.');
  throw new Error(onlyId?'This event has no active world rule to check against.':'Nothing to check yet: add events (with title, notes or manuscript text) or shared info first.')}
 for(const g of Object.values(groups)){
  const world={name:g.w.name,desc:g.w.desc,rules:g.w.rules.filter(r=>!r.off).map(r=>({id:r.id,cat:r.cat,text:r.text,ban:r.ban,trig:r.trig}))};
  for(let n=0;n<g.items.length;n+=100){const part=g.items.slice(n,n+100),tok=localStorage.getItem('xl-token');
   const res=await fetch('/api/check',{method:'POST',headers:{'content-type':'application/json',...(tok?{authorization:'Bearer '+tok}:{})},body:JSON.stringify({world,items:part.map(i=>({id:i.id,text:i.text})),sens:+(($('#sens')||{}).value||0)})});
   const j=await res.json();if(!res.ok)throw new Error(j.error||'Check failed');
   if(j.truncated)trunc=j.limits;
   if(j.judge){SEMI.dismissed+=j.judge.dismissed||0;SEMI.judged+=j.judge.judged||0;SEMI.provider=j.judge.enabled?j.judge.provider:'';(j.judge.errors||[]).forEach(m=>SEMI.errors.add(m));SEMI.skipped+=j.judge.skipped||0}
   part.forEach(i=>SEM[i.id]={h:shash(wsig(g.w)+itemTxt(i.k,i.o)),v:j.results[i.id]||[]})}}
 if(trunc)SFX.notice('Some very long texts were only checked up to '+trunc.chars+' characters each.')}
async function semBtn(t,id){const l=t.textContent;t.disabled=true;t.textContent='Checking…';
 try{await semRun(id)}catch(e){SFX.notice(e.message)}t.disabled=false;t.textContent=l;render();semNote();if(id&&$('#dr.open'))wup()}
document.addEventListener('click',e=>{const t=e.target.closest('[data-w="sem"]');if(t)semBtn(t,t.dataset.id)},true);
function semNote(){const a=$('#app'),b=a&&a.querySelector('[data-w="sem"]');if(!b||!SEMI.provider&&!SEMI.errors.size)return;let n=a.querySelector('#semnote');if(!n){b.insertAdjacentHTML('afterend','<div id="semnote" style="font-size:12px;margin:4px 0"></div>');n=a.querySelector('#semnote')}
 n.innerHTML=(SEMI.provider?`🤖 ${esc(SEMI.provider)} verifier read ${SEMI.judged} candidate${SEMI.judged==1?'':'s'} and dismissed <b>${SEMI.dismissed}</b> false alarm${SEMI.dismissed==1?'':'s'}.${SEMI.skipped?' ('+SEMI.skipped+' more were not verified — limit per run.)':''}`:'')+(SEMI.errors.size?`<br><span style="color:var(--bad)">⚠ Verifier problem: ${esc([...SEMI.errors][0])} — embedding results shown unverified.</span>`:'')}
const _sRD=render;render=function(){_sRD();const a=$('#app'),h=[...a.querySelectorAll('h4')].find(x=>/^Story check/.test(x.textContent));
 if(h&&!a.querySelector('[data-w="sem"]'))h.insertAdjacentHTML('beforebegin','<button class="pri" data-w="sem" style="margin-top:12px">🧠 Run semantic check</button> <select id="sens" style="width:auto"><option value="1">Strict</option><option value="0" selected>Balanced</option><option value="-1">Loose</option></select> <small style="color:var(--mut)">Local embeddings · matches meaning, not just words</small>')};
const _sOE=openEv;openEv=function(id){_sOE(id);const v=$('#wv');if(v)v.insertAdjacentHTML('afterend',`<button data-w="sem" data-id="${id}" style="margin:4px 0">🧠 Semantic check this event</button>`)};
