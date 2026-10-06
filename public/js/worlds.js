/* ---- Worlds & rules ---- */
TABS.push(['worlds','🌍 Worlds & Rules']);
const WCATS=['Physics','Chemistry','Biology','Economics','Hierarchy','Law & Order','Magic / Technology','Geography','Culture'];
const wl=()=>S.worlds=S.worlds||[],wget=id=>wl().find(w=>w.id==id),wact=()=>wget(S.wid)||wl()[0]||null;
const wre=RULES.wre;   // one wildcard meaning everywhere: * = letters inside a word
// The text that counts as the manuscript: edited final text if the writer made one, else the plan text.
const msText=e=>{const f=e.fin&&typeof e.fin=='object'?e.fin:null;if(!f||(f.book==null&&f.script==null))return e.prose||'';return [f.book!=null?f.book:(e.prose||''),f.script!=null?f.script:''].filter(Boolean).join('\n')};
function wdedupe(V){const m=new Map(),out=[];V.forEach(v=>{const k=v.src.k+'|'+v.src.id+'|'+v.r.id,why=v.why||[{how:v.sem?'meaning':'word',term:v.term,quote:v.quote||'',score:v.score}];const e=m.get(k);
 if(!e){v.why=[...why];m.set(k,v);out.push(v)}else why.forEach(x=>{if(!e.why.some(y=>y.how==x.how&&y.term==x.term&&y.quote==x.quote))e.why.push(x)})});
 out.forEach(v=>{if(v.why.length>1){v.term=v.why.map(x=>x.term).filter((x,i,a)=>x&&a.indexOf(x)==i).join(' · ');v.sem=v.why.every(x=>x.how=='meaning')}});return out}
function wchk(){const V=[];const scan=(src,wid,txt,waived)=>{const w=wget(wid)||wact();if(!w)return;(w.rules||[]).forEach(r=>{if(r.off||!(r.ban||r.text||r.trig))return;
  RULES.lexCheck(r,txt).forEach(h=>V.push({src,w,r,term:h.term,quote:h.quote,score:h.score,how:h.how,neg:h.neg,why:[{how:h.how,term:h.term,quote:h.quote,score:h.score,neg:h.neg}],waived:(waived||[]).includes(r.id)}))})};
S.ev.forEach(e=>scan({k:'ev',id:e.id,n:e.title||'Untitled'},e.world,[e.title,e.place,e.notes,msText(e),e.health].join('\n'),e.wx));
S.info.forEach(i=>scan({k:'info',id:i.id,n:i.title||'Untitled'},'',[i.title,i.text].join('\n'),i.wx));return wdedupe(V)}
const whyHtml=v=>{const W=v.why||[];if(!W.length)return'';const L={'forbidden word':'Forbidden word / pattern','rule text':'Concept taken from the rule sentence',trigger:'Trigger conditions all present',meaning:'Close in meaning (semantic check)',word:'Word match'};
 return`<details style="margin-top:4px"><summary>Why was this flagged?</summary>${W.map(x=>`<div style="font-size:12px;margin:4px 0;padding-left:8px;border-left:3px solid var(--line)"><b>${esc(L[x.how]||x.how||'match')}</b>${x.score!=null&&x.score<1?' · '+Math.round(x.score*100)+'% match':''}${x.neg?' · negation nearby – check context':''}${x.verdict?`<br>🤖 AI check (${esc(x.via||'verifier')}): <b>${x.verdict=='violation'?'confirmed':x.verdict=='unsure'?'unsure':'ok'}</b>${x.judge?' — '+esc(x.judge):''}`:''}<br>Matched: ${esc(x.term||'')}${x.quote?`<br>Sentence: “${esc(x.quote)}”`:''}</div>`).join('')}</details>`};
const wopen=()=>wchk().filter(v=>!v.waived);
function wvHtml(V){return V.length?V.map(v=>`<div class="card" style="border-color:${v.waived?'var(--line)':'#d63031'};margin:4px 0;opacity:${v.waived?.6:1}"><small>${v.waived?'✓ Waived':'⚠ Breaks'} <b>${esc(v.w.name)}</b> · ${esc(v.r.cat)}: ${esc(v.r.text)}<br>${v.sem?"Meaning":"Found"}: ${esc(v.term)}</small>${whyHtml(v)}</div>`).join(''):'<small style="color:var(--mut)">✓ No rule violations</small>'}
function vWorlds(){const W=wl(),a=wact(),sel=wget(S.wsel)||a||W[0]||null,V=wchk(),open=V.filter(v=>!v.waived);
let h=`<div class="row"><h3 style="flex:3">🌍 Worlds & Rules</h3><button class="pri" data-w="nw">+ New world</button></div><p style="color:var(--mut);font-size:12px;margin:0 0 10px">Define each world's laws (physics, economics, hierarchy, law…). Add <b>Violation words</b> to a rule — any event, manuscript text or shared info that uses them is flagged. Use <code>*</code> as a wildcard (e.g. <code>fly*, teleport*</code>).</p>`;
if(!W.length)return h+'<div class="card">No worlds yet. Click <b>+ New world</b> to create one.</div>';
h+=`<label>This story takes place in</label><select data-wf="wid">${W.map(w=>`<option value="${w.id}" ${w.id==S.wid?'selected':''}>${esc(w.name)}</option>`).join('')}</select><div class="tg" style="margin:8px 0">${W.map(w=>`<button data-w="sel" data-id="${w.id}" class="${sel&&w.id==sel.id?'on':''}">${esc(w.name)}</button>`).join('')}</div>`;
if(sel){h+=`<div class="card"><label>World name</label><input data-wf="name" value="${esc(sel.name)}"><label>Description</label><textarea rows="2" data-wf="desc">${esc(sel.desc||'')}</textarea><div class="row" style="margin-top:6px"><button data-w="dw" data-id="${sel.id}">Delete world</button></div></div>`;
const R=sel.rules||[],cats=[...new Set([...WCATS.filter(c=>R.some(r=>r.cat==c)),...R.map(r=>r.cat)])];
cats.forEach(c=>{h+=`<h4 style="margin:12px 0 4px">${esc(c)}</h4>`+R.filter(r=>r.cat==c).map(r=>`<div class="card" style="margin-bottom:6px;border-left:4px solid ${r.off?'#9aa0a6':'#2fa86b'};${r.off?'background:var(--bg2,transparent)':''}"><div class="row"><input style="flex:4;${r.off?'text-decoration:line-through;opacity:.6':''}" data-wr="text" data-id="${r.id}" placeholder="Rule, e.g. Nothing can travel faster than light" value="${esc(r.text)}"><button data-w="tr" data-id="${r.id}" class="wsw ${r.off?'':'on'}" role="switch" aria-checked="${!r.off}" title="${r.off?'Rule is OFF (not checked) – click to enable':'Rule is ON (checked) – click to disable'}"><i></i><span>${r.off?'OFF':'ON'}</span></button><button data-w="dr" data-id="${r.id}" aria-label="Delete rule">🗑</button></div><input data-wr="ban" data-id="${r.id}" placeholder="Forbidden words/concepts (comma-separated): flying, teleportation" value="${esc(r.ban||'')}" style="margin-top:4px"><input data-wr="trig" data-id="${r.id}" placeholder="Triggers (optional): gold + water|river — applies when all appear together" value="${esc(r.trig||'')}" style="margin-top:4px"></div>`).join('')});
h+=`<label style="margin-top:10px">Add rule</label><div class="tg">${WCATS.map(c=>`<button data-w="ar" data-c="${esc(c)}">+ ${esc(c)}</button>`).join('')}<button data-w="ar" data-c="">+ Custom…</button></div>`}
h+=`<h4 style="margin:16px 0 4px">Story check ${open.length?`<span style="color:var(--bad)">(${open.length} issue${open.length>1?'s':''})</span>`:'✓'}</h4>`;
h+=V.length?V.map((v,i)=>`<div class="card" style="margin:4px 0;border-color:${v.waived?'var(--line)':'#d63031'};opacity:${v.waived?.6:1}"><b>${v.src.k=='ev'?'🎬':'💬'} ${esc(v.src.n)}</b><br><small>${v.waived?'✓ Waived':'⚠ Breaks'} <b>${esc(v.w.name)}</b> · ${esc(v.r.cat)}: ${esc(v.r.text)} — ${v.sem?"Meaning":"found"}: ${esc(v.term)}</small>${whyHtml(v)}<div style="display:flex;gap:6px;margin-top:4px">${v.src.k=='ev'?`<button data-w="oe" data-id="${v.src.id}">Open event</button>`:''}<button data-w="wv" data-k="${v.src.k}" data-id="${v.src.id}" data-r="${v.r.id}">${v.waived?'Re-enforce':'Allow exception'}</button></div></div>`).join(''):'<small style="color:var(--mut)">✓ Story follows all active rules.</small>';
return h}
const _wRD=render;render=function(){_wRD();const b=document.querySelector('[data-tab="worlds"]');if(b&&S.worlds&&S.worlds.length){const n=wopen().length;if(n)b.insertAdjacentHTML('beforeend',`<b style="background:#d63031;color:#fff;border-radius:9px;padding:0 6px;font-size:11px;margin-left:4px">${n}</b>`)}};
const _wVM=vMap;vMap=()=>{const o=wopen();return _wVM()+(o.length?`<div class="card" style="margin-top:10px;border-color:var(--bad)">🌍 World rules: ${o.length} violation${o.length>1?'s':''} — <a href="#" data-tab="worlds">review</a></div>`:'')};
const _wOE=openEv;openEv=function(id){_wOE(id);const d=$('#dr'),l=[...d.querySelectorAll('label')].find(x=>x.textContent=='Timeline');if(!l||!S.worlds||!S.worlds.length)return;const e=S.ev.find(x=>x.id==id);l.insertAdjacentHTML('beforebegin',`<label>World</label><select data-wev="world"><option value="">Story default${wact()?' ('+esc(wact().name)+')':''}</option>${S.worlds.map(w=>`<option value="${w.id}" ${w.id==e.world?'selected':''}>${esc(w.name)}</option>`).join('')}</select><div id="wv"></div>`);wup()};
function wup(){const el=$('#wv');if(el)wwv(el)}
function wwv(el){const e=S.ev.find(x=>x.id==evId);el.innerHTML=wvHtml(wchk().filter(v=>v.src.k=='ev'&&e&&v.src.id==e.id))}
document.addEventListener('input',e=>{const t=e.target,d=t.dataset;if(d.wev&&t.closest('#dr')){const o=S.ev.find(x=>x.id==evId);if(o)o.world=t.value}
if(d.wf){const w=wget(S.wsel)||wact()||S.worlds[0];if(d.wf=='wid')S.wid=t.value;else if(w)w[d.wf]=t.value}
if(d.wr){const w=wget(S.wsel)||wact()||S.worlds[0],r=w&&w.rules.find(x=>x.id==d.id);if(r)r[d.wr]=t.value}
if(t.closest('#dr'))wup()},true);
document.addEventListener('change',e=>{if(e.target.dataset.wf=='wid'||e.target.dataset.wev)render()},true);
document.addEventListener('click',e=>{const t=e.target.closest('[data-w]');if(!t)return;const k=t.dataset.w,d=t.dataset,w=wget(S.wsel)||wact()||(S.worlds||[])[0];e.stopPropagation();
if(k=='nw'){const n=prompt('Name of the new world');if(!n)return;const x={id:'w'+uid(),name:n.trim(),desc:'',rules:[]};wl().push(x);S.wsel=x.id;if(!S.wid)S.wid=x.id}
else if(k=='sel')S.wsel=d.id;
else if(k=='dw'){if(!confirm('Delete this world and its rules?'))return;S.worlds=S.worlds.filter(x=>x.id!=d.id);if(S.wid==d.id)S.wid=(S.worlds[0]||{}).id||'';S.wsel=S.wid;S.ev.forEach(x=>{if(x.world==d.id)x.world=''})}
else if(k=='ar'&&w){let c=d.c;if(!c){c=prompt('Category name (e.g. Religion, Medicine)');if(!c)return}w.rules.push({id:'r'+uid(),cat:c.trim(),text:'',ban:'',off:0})}
else if(k=='tr'&&w){const r=w.rules.find(x=>x.id==d.id);if(r)r.off=r.off?0:1}
else if(k=='dr'&&w)w.rules=w.rules.filter(x=>x.id!=d.id);
else if(k=='oe'){S.tab='map';render();return openEv(d.id)}
else if(k=='wv'){const o=d.k=='ev'?S.ev.find(x=>x.id==d.id):S.info.find(x=>x.id==d.id);if(o){o.wx=o.wx||[];const i=o.wx.indexOf(d.r);i<0?o.wx.push(d.r):o.wx.splice(i,1)}}
render()},true);
