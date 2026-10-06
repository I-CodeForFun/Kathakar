/* v10: Props tab — track weapons, equipment, documents… by character, place and time. */
(function(){const X=window.SFX,esc=X.esc,ea=X.escAttr,rr=()=>{try{render()}catch(e){}};
const E=()=>[...S.ev].sort((a,b)=>PACKS.order(S).get(a.id)-PACKS.order(S).get(b.id));
const cn=id=>(S.chars.find(c=>c.id==id)||{}).name||'',pn=id=>(S.places.find(c=>c.id==id)||{}).name||'';
const opt=(arr,sel,k='name',blank='—')=>`<option value="">${blank}</option>`+arr.map(x=>`<option value="${ea(x.id)}" ${x.id==sel?'selected':''}>${esc(x[k]||x.title||'Untitled')}</option>`).join('');
const sopt=(arr,sel)=>arr.map(x=>`<option ${x==sel?'selected':''}>${x}</option>`).join('');
const V=window.__props=window.__props||{mode:'cards',kind:'',char:''};
const GL={intact:'',damaged:'◐',broken:'✂',lost:'?',stolen:'⚠',hidden:'◌',destroyed:'✖',consumed:'✖'};
function journey(p){const rows=PROPS.sortedLog(S,p);if(!rows.length)return'<span class="mut">No custody recorded yet.</span>';return rows.map(l=>{const ev=S.ev.find(e=>e.id==l.ev);return`${esc(l.holder?cn(l.holder):(l.place?'at '+pn(l.place):'nobody'))}${l.holder&&l.place?' @ '+esc(pn(l.place)):''}${l.state&&l.state!='intact'?' ('+esc(l.state)+')':''} <small class="mut">[${esc((ev||{}).title||'?')}]</small>`}).join(' → ')}
function card(p){const log=PROPS.sortedLog(S,p),all=p.log||[];return`<section style="border:1px solid var(--line);border-radius:10px;padding:10px;margin:10px 0">
 <div class="row" style="gap:8px;flex-wrap:wrap"><input data-pr9="f" data-id="${p.id}" data-k="name" value="${ea(p.name||'')}" aria-label="Prop name" style="font-weight:600;flex:1;min-width:140px"><select data-pr9="f" data-id="${p.id}" data-k="kind" aria-label="Kind">${sopt(PROPS.KINDS,p.kind||'other')}</select>
  <label>Starts with <select data-pr9="f" data-id="${p.id}" data-k="owner">${opt(S.chars,p.owner)}</select></label><label>Starts at <select data-pr9="f" data-id="${p.id}" data-k="place">${opt(S.places,p.place)}</select></label><button data-pr9="del" data-id="${p.id}" aria-label="Delete prop ${ea(p.name||'')}">✕</button></div>
 <textarea data-pr9="f" data-id="${p.id}" data-k="desc" rows="2" placeholder="Description, markings, history…" aria-label="Description" style="width:100%;margin-top:6px">${esc(p.desc||'')}</textarea>
 <p style="font-size:12px;margin:6px 0">${journey(p)}</p>
 <table style="font-size:12px"><tr><th align="left">From chapter</th><th align="left">Held by</th><th align="left">Located at</th><th align="left">State</th><th align="left">Note</th><th></th></tr>
 ${all.map(l=>`<tr><td><select data-pr9="l" data-id="${p.id}" data-lid="${l.id}" data-k="ev" aria-label="Chapter">${E().map(e=>`<option value="${ea(e.id)}" ${e.id==l.ev?'selected':''}>${esc(e.title||'Untitled')}</option>`).join('')}</select></td>
  <td><select data-pr9="l" data-id="${p.id}" data-lid="${l.id}" data-k="holder" aria-label="Held by">${opt(S.chars,l.holder,'name','nobody')}</select></td><td><select data-pr9="l" data-id="${p.id}" data-lid="${l.id}" data-k="place" aria-label="Located at">${opt(S.places,l.place,'name','(with holder)')}</select></td>
  <td><select data-pr9="l" data-id="${p.id}" data-lid="${l.id}" data-k="state" aria-label="State">${sopt(PROPS.STATES,l.state||'intact')}</select></td><td><input data-pr9="l" data-id="${p.id}" data-lid="${l.id}" data-k="note" value="${ea(l.note||'')}" aria-label="Note"></td>
  <td><button data-pr9="ldel" data-id="${p.id}" data-lid="${l.id}" aria-label="Remove entry">✕</button></td></tr>`).join('')}</table>
 <button data-pr9="ladd" data-id="${p.id}" ${S.ev.length?'':'disabled'}>+ Custody change</button> <small class="mut">${PROPS.appearances(S,p).length} appearance${PROPS.appearances(S,p).length==1?'':'s'} in scenes</small></section>`}
function matrix(props){const ev=E();if(!ev.length||!props.length)return'<p class="mut">Add chapters and props to see the matrix.</p>';
 return`<div style="overflow:auto;max-height:70vh"><table style="font-size:11px;border-collapse:collapse"><tr><th style="position:sticky;left:0;background:var(--card);text-align:left">Prop</th>${ev.map(e=>`<th style="writing-mode:vertical-rl;text-align:left;max-height:120px">${esc((e.title||'').slice(0,22))}</th>`).join('')}</tr>`+
  props.map(p=>`<tr><th style="position:sticky;left:0;background:var(--card);text-align:left">${esc(p.name||'?')}</th>`+PROPS.timeline(S,p).map(r=>{const who=r.holder?cn(r.holder).slice(0,6):(r.place?'@'+pn(r.place).slice(0,5):'·'),gone=PROPS.GONE.has(r.state),t=`${p.name}: ${r.holder?cn(r.holder):'nobody'}${r.where?' @ '+pn(r.where):''} — ${r.state}${r.appears?' (appears)':''}`;
   return`<td title="${ea(t)}" aria-label="${ea(t)}" style="border:1px solid var(--line);padding:2px 4px;white-space:nowrap;${gone?'text-decoration:line-through;opacity:.6;':''}${r.appears?'font-weight:700;background:var(--line);':''}">${esc(who)}${GL[r.state]||''}${r.appears?'●':''}</td>`}).join('')+'</tr>').join('')+'</table></div><p class="mut" style="font-size:12px">● appears in the scene · ✖ gone · ◐ damaged · ✂ broken · ? lost · ⚠ stolen · ◌ hidden · strikethrough = unusable</p>'}
function byChar(){const ev=E();if(!ev.length||!S.chars.length)return'<p class="mut">Add characters and chapters first.</p>';
 return`<div style="overflow:auto;max-height:70vh"><table style="font-size:11px;border-collapse:collapse"><tr><th style="position:sticky;left:0;background:var(--card);text-align:left">Character</th>${ev.map(e=>`<th style="writing-mode:vertical-rl;text-align:left;max-height:120px">${esc((e.title||'').slice(0,22))}</th>`).join('')}</tr>`+
  S.chars.filter(c=>!V.char||c.id==V.char).map(c=>`<tr><th style="position:sticky;left:0;background:var(--card);text-align:left">${esc(c.name)}</th>${ev.map(e=>{const h=PROPS.heldBy(S,c.id,e.id);return`<td style="border:1px solid var(--line);padding:2px 4px;vertical-align:top" ${h.length?`title="${ea(h.map(p=>p.name).join(', '))}"`:''}>${h.map(p=>esc((p.name||'').slice(0,12))).join('<br>')}</td>`}).join('')}</tr>`).join('')+'</table></div>'}
XV.props=function vProps(){const L=S.props.filter(p=>(!V.kind||p.kind==V.kind)&&(!V.char||p.owner==V.char||(p.log||[]).some(l=>l.holder==V.char)));
 return`<div class="row" style="gap:8px;flex-wrap:wrap"><h3 style="flex:1;margin:0">🗡 Props <small class="mut">${S.props.length}</small></h3>
  <div role="tablist" class="row" style="gap:4px">${[['cards','Props'],['matrix','Over time'],['char','By character']].map(([k,l])=>`<button role="tab" aria-selected="${V.mode==k}" data-pr9="mode" data-k="${k}" class="${V.mode==k?'pri':''}">${l}</button>`).join('')}</div>
  <select data-pr9="fk" aria-label="Filter by kind"><option value="">All kinds</option>${sopt(PROPS.KINDS,V.kind)}</select><select data-pr9="fc" aria-label="Filter by character">${opt(S.chars,V.char,'name','Any character')}</select><button class="pri" data-pr9="add">+ New prop</button></div>
  <p class="mut" style="font-size:12px">Record who holds a prop, where it is, and its condition from a given chapter onward. Checks flag props used after being destroyed, appearing without their holder, or in the wrong place.</p>`+
  (V.mode=='matrix'?matrix(L):V.mode=='char'?byChar():(L.map(card).join('')||'<p class="mut">No props yet. Add a sword, a letter, a key…</p>'))};
TABS.push(['props','🗡 Props']);
document.addEventListener('change',e=>{const t=e.target,k=t.dataset&&t.dataset.pr9;if(!k)return;
 if(k=='fk'){V.kind=t.value;rr();return}if(k=='fc'){V.char=t.value;rr();return}
 const p=S.props.find(x=>x.id==t.dataset.id);if(!p)return;snap();
 if(k=='f'){const f=t.dataset.k;if(t.value)p[f]=t.value;else delete p[f];save();if(f=='kind'||f=='owner'||f=='place')rr()}
 if(k=='l'){const l=(p.log||[]).find(x=>x.id==t.dataset.lid);if(!l)return;l[t.dataset.k]=t.value||null;save();rr()}});
document.addEventListener('click',e=>{const b=e.target.closest('[data-pr9]');if(!b)return;const k=b.dataset.pr9;
 if(k=='mode'){V.mode=b.dataset.k;rr()}
 if(k=='add'){snap();S.props.push({id:uid(),name:'New prop',kind:'equipment',log:[]});save();V.mode='cards';rr()}
 if(k=='del'){const p=S.props.find(x=>x.id==b.dataset.id);X.ask({title:'Delete “'+(p&&p.name||'prop')+'”?',body:'Its custody log is removed from the story. You can undo.',confirm:'Delete',danger:true}).then(ok=>{if(ok){snap();S.props=S.props.filter(x=>x.id!=b.dataset.id);S.ev.forEach(ev=>{if(ev.props)ev.props=ev.props.filter(i=>i!=b.dataset.id)});save();rr()}})}
 if(k=='ladd'){const p=S.props.find(x=>x.id==b.dataset.id),ev=E(),last=PROPS.sortedLog(S,p).slice(-1)[0],lastIx=last?ev.findIndex(x=>x.id==last.ev):-1,next=ev[Math.min(ev.length-1,lastIx+1)]||ev[0];snap();p.log=p.log||[];
  p.log.push({id:uid(),ev:next.id,holder:last?last.holder:p.owner||null,place:last?last.place:p.place||null,state:last?last.state:'intact',note:''});save();rr()}
 if(k=='ldel'){const p=S.props.find(x=>x.id==b.dataset.id);snap();p.log=p.log.filter(l=>l.id!=b.dataset.lid);save();rr()}
 if(k=='here'){const p=S.props.find(x=>x.id==b.dataset.id),st=PROPS.stateAt(S,p,b.dataset.ev);snap();p.log=p.log||[];p.log.push({id:uid(),ev:b.dataset.ev,holder:st.holder,place:st.place,state:st.state,note:''});save();openEv(b.dataset.ev);X.toast('Custody logged for this scene',{kind:'ok'})}});
// event drawer: which props appear here, where they are right now
DRAWER.section({id:'props',order:20,label:'Props',summary:e=>(e.props||[]).length?(e.props.length+' in scene'):'',render:e=>{if(!S.props.length)return'<small class="mut">No props yet — add them in the Props tab.</small>';
 const here=PROPS.presentAt(S,e.id);return field9(e)+`<div style="font-size:12px">${here.map(p=>{const st=PROPS.stateAt(S,p,e.id),w=PROPS.whereAt(S,p,e.id);return`<div>${esc(p.name)} — ${esc(st.holder?cn(st.holder):'nobody')}${w?' @ '+esc(pn(w)):''}${st.state!='intact'?' ('+esc(st.state)+')':''} <button data-pr9="here" data-id="${p.id}" data-ev="${e.id}">Log here</button></div>`}).join('')||'<span class="mut">Nothing tracked here yet.</span>'}</div>`}});
const field9=e=>`<label>Appears in this scene<select multiple size="4" data-d9="props" data-t="multi">${S.props.map(p=>`<option value="${ea(p.id)}" ${(e.props||[]).includes(p.id)?'selected':''}>${esc(p.name||'?')}</option>`).join('')}</select></label>`;
})();
