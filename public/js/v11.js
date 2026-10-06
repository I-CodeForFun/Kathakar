/* v11: Corkboard + Kanban (B4). Pointer drag, keyboard (Space grab, arrows move, Space drop, Esc cancel), Move earlier/later buttons, bulk status/split/merge. */
(function(){const X=window.SFX,esc=X.esc,ea=X.escAttr,rr=()=>{try{render()}catch(e){}};
const V=window.__cork=window.__cork||{mode:'cork',filter:'',status:'',char:'',sel:new Set(),grab:null};
const fm=()=>typeof FM=='function'?FM():'book',txt=e=>{try{return typeof finTxt=='function'?finTxt(e,fm()):(e.prose||'')}catch(x){return e.prose||''}};
const STAT=typeof STS!='undefined'?STS:['Idea','Draft','Revised','Final'],words=t=>(t.match(/\S+/g)||[]).length;
const order=()=>bookEv(),ids=()=>order().map(e=>e.id);
const setOrder=a=>{S.bk=S.bk||{};S.bk.cu=a;S.bk.ord='custom'};
const cm=e=>(Array.isArray(e.cm)?e.cm.length:0);
function visible(){return order().filter(e=>(!V.status||(e.st||'Idea')==V.status)&&(!V.char||(e.chars||[]).includes(V.char))&&(!V.filter||(e.title+' '+txt(e)).toLowerCase().includes(V.filter.toLowerCase())))}
function card(e,i,pos){const w=words(txt(e)),T=(S.ctgt&&+S.ctgt.max)||+e.wg||0,pct=T?Math.min(100,Math.round(w*100/T)):0,st=e.st||'Idea',cs=(e.chars||[]).map(id=>{const c=S.chars.find(x=>x.id==id);return c?`<span title="${ea(c.name)}" style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${ea(c.color||'#888')}"></span>`:''}).join(''),sel=V.sel.has(e.id),g=V.grab==e.id;
 return`<div class="card cork9" tabindex="0" role="listitem" data-ck="${e.id}" aria-label="${ea((pos+1)+'. '+(e.title||'Untitled')+', '+w+' words, '+st+(g?', grabbed. Use arrow keys to move, Space to drop':''))}" style="position:relative;touch-action:none;${g?'outline:3px solid #58c;':''}${sel?'box-shadow:0 0 0 2px #58c;':''}">
 <div style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-k9="sel" data-id="${e.id}" ${sel?'checked':''} aria-label="Select ${ea(e.title||'chapter')}"><b style="flex:1">${pos+1}. ${esc(e.title||'Untitled')}</b><span class="mut" style="font-size:11px">${esc(st)}</span></div>
 <div class="mut" style="font-size:12px;margin:4px 0;min-height:2.6em">${esc(txt(e).slice(0,80))}</div>
 <div style="display:flex;gap:6px;align-items:center;font-size:11px"><span>${w} words</span>${cs}${(S.props||[]).some(p=>(e.props||[]).includes(p.id))?'<span title="has props">🗡</span>':''}${cm(e)?'<span title="comments">💬'+cm(e)+'</span>':''}<span style="flex:1"></span>
  <button data-k9="up" data-id="${e.id}" aria-label="Move ${ea(e.title||'chapter')} earlier">◀</button><button data-k9="dn" data-id="${e.id}" aria-label="Move ${ea(e.title||'chapter')} later">▶</button><button data-k9="open" data-id="${e.id}">Open</button></div>
 ${T?`<div role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Word target" style="height:4px;background:var(--line);border-radius:2px;margin-top:4px"><div style="height:4px;width:${pct}%;background:#2a8;border-radius:2px"></div></div>`:''}</div>`}
XV.cork=function vCork(){const L=visible(),all=ids();
 let h=`<div class="row" style="gap:8px;flex-wrap:wrap"><h3 style="margin:0;flex:1">📌 Corkboard <small class="mut">${L.length}/${S.ev.length}</small></h3>
 <div role="tablist" class="row" style="gap:4px">${[['cork','Corkboard'],['kanban','Kanban']].map(([k,l])=>`<button role="tab" aria-selected="${V.mode==k}" data-k9="mode" data-m="${k}" class="${V.mode==k?'pri':''}">${l}</button>`).join('')}</div>
 <input data-k9="q" placeholder="Filter…" value="${ea(V.filter)}" aria-label="Filter chapters" style="width:140px"><select data-k9="fs" aria-label="Status filter"><option value="">Any status</option>${STAT.map(s=>`<option ${s==V.status?'selected':''}>${s}</option>`).join('')}</select>
 <select data-k9="fc" aria-label="Character filter"><option value="">Any character</option>${S.chars.map(c=>`<option value="${ea(c.id)}" ${c.id==V.char?'selected':''}>${esc(c.name)}</option>`).join('')}</select></div>`;
 if(V.sel.size)h+=`<div class="row" style="gap:6px;margin:6px 0" role="toolbar" aria-label="Bulk actions"><b>${V.sel.size} selected</b><select data-k9="bst" aria-label="Set status"><option value="">Set status…</option>${STAT.map(s=>`<option>${s}</option>`).join('')}</select><button data-k9="merge" ${V.sel.size<2?'disabled':''}>Merge</button><button data-k9="clear">Clear</button></div>`;
 h+=`<p class="mut" style="font-size:12px">Drag a card, or focus it and press <kbd>Space</kbd>, move with arrow keys, <kbd>Space</kbd> to drop, <kbd>Esc</kbd> to cancel. Order is saved as the book’s custom order.</p><div id="live9" class="sr-only" aria-live="polite" style="position:absolute;left:-9999px"></div>`;
 if(V.mode=='kanban')h+=`<div style="display:grid;grid-template-columns:repeat(${STAT.length},minmax(190px,1fr));gap:10px;overflow-x:auto">`+STAT.map(s=>{const col=L.filter(e=>(e.st||'Idea')==s);return`<div data-col="${ea(s)}" role="list" aria-label="${ea(s)}" style="background:var(--line);border-radius:10px;padding:8px;min-height:120px"><b>${esc(s)}</b> <small class="mut">${col.length} · ${col.reduce((a,e)=>a+words(txt(e)),0)} words</small>${col.map(e=>card(e,0,all.indexOf(e.id))).join('')}</div>`}).join('')+'</div>';
 else h+=`<div role="list" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px">${L.map(e=>card(e,0,all.indexOf(e.id))).join('')||'<p class="mut">No chapters match.</p>'}</div>`;
 return h};
TABS.push(['cork','📌 Corkboard']);
const say=m=>{const l=document.getElementById('live9');if(l)l.textContent=m};
function moveTo(id,to){const a=ids();setOrder(ORDER.move(a,id,to));save()}
// keyboard
document.addEventListener('keydown',e=>{const c=e.target.closest&&e.target.closest('.cork9');if(!c||e.target.matches('input,select,button,textarea'))return;const id=c.dataset.ck;
 if(e.key==' '){e.preventDefault();V.grab=V.grab==id?null:id;rr();const n=document.querySelector(`[data-ck="${id}"]`);n&&n.focus();say(V.grab?'Grabbed '+(S.ev.find(x=>x.id==id)||{}).title:'Dropped')}
 else if(V.grab==id&&['ArrowLeft','ArrowUp','ArrowRight','ArrowDown'].includes(e.key)){e.preventDefault();const d=(e.key=='ArrowLeft'||e.key=='ArrowUp')?-1:1;snap();setOrder(ORDER.step(ids(),id,d));save();rr();document.querySelector(`[data-ck="${id}"]`)?.focus();say('Moved to position '+(ids().indexOf(id)+1)+' of '+S.ev.length)}
 else if(e.key=='Escape'&&V.grab){V.grab=null;rr()}});
// pointer drag (long-press on touch)
let drag=null;document.addEventListener('pointerdown',e=>{const c=e.target.closest&&e.target.closest('.cork9');if(!c||e.target.matches('input,select,button,textarea')||e.button>0)return;
 drag={id:c.dataset.ck,x:e.clientX,y:e.clientY,on:false,t:e.pointerType=='touch'?setTimeout(()=>{if(drag)drag.on=true},350):0,touch:e.pointerType=='touch'}});
document.addEventListener('pointermove',e=>{if(!drag)return;if(!drag.on&&!drag.touch&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>6)drag.on=true;if(drag.on){e.preventDefault();document.body.style.cursor='grabbing'}},{passive:false});
document.addEventListener('pointerup',e=>{if(!drag)return;clearTimeout(drag.t);const d=drag;drag=null;document.body.style.cursor='';if(!d.on)return;const el=document.elementFromPoint(e.clientX,e.clientY),c=el&&el.closest&&el.closest('.cork9'),col=el&&el.closest&&el.closest('[data-col]');
 if(col&&V.mode=='kanban'){const ev=S.ev.find(x=>x.id==d.id);if(ev&&(ev.st||'Idea')!=col.dataset.col){snap();ev.st=col.dataset.col;save();rr();say('Moved to '+col.dataset.col)}}
 if(c&&c.dataset.ck!=d.id){snap();moveTo(d.id,ids().indexOf(c.dataset.ck));rr()}});
document.addEventListener('change',e=>{const k=e.target.dataset&&e.target.dataset.k9;if(!k)return;
 if(k=='fs'){V.status=e.target.value;rr()}if(k=='fc'){V.char=e.target.value;rr()}
 if(k=='sel'){e.target.checked?V.sel.add(e.target.dataset.id):V.sel.delete(e.target.dataset.id);rr()}
 if(k=='bst'&&e.target.value){snap();V.sel.forEach(id=>{const ev=S.ev.find(x=>x.id==id);if(ev)ev.st=e.target.value});save();rr()}});
document.addEventListener('input',e=>{if(e.target.dataset&&e.target.dataset.k9=='q'){V.filter=e.target.value;const p=e.target.selectionStart;rr();const n=document.querySelector('[data-k9=q]');if(n){n.focus();n.setSelectionRange(p,p)}}});
document.addEventListener('click',async e=>{const b=e.target.closest('[data-k9]');if(!b||b.matches('input,select'))return;const k=b.dataset.k9,id=b.dataset.id;
 if(k=='mode'){V.mode=b.dataset.m;rr()}if(k=='open')openEv(id);if(k=='clear'){V.sel.clear();rr()}
 if(k=='up'||k=='dn'){snap();setOrder(ORDER.step(ids(),id,k=='up'?-1:1));save();rr();document.querySelector(`[data-ck="${id}"] [data-k9="${k}"]`)?.focus();say('Moved to position '+(ids().indexOf(id)+1))}
 if(k=='merge'){const sel=ids().filter(i=>V.sel.has(i));if(sel.length<2)return;if(!await X.ask({title:'Merge '+sel.length+' chapters?',body:'Text is joined in book order into the first chapter; the others are removed. You can undo.',confirm:'Merge'}))return;snap();
  const first=S.ev.find(x=>x.id==sel[0]),f=fm();const parts=sel.map(i=>txt(S.ev.find(x=>x.id==i)));first.fin=first.fin||{};first.fin[f]=parts.reduce((a,t)=>ORDER.merge(a,t));
  sel.slice(1).forEach(i=>{const ev=S.ev.find(x=>x.id==i);(ev.chars||[]).forEach(c=>{if(!(first.chars||(first.chars=[])).includes(c))first.chars.push(c)})});S.ev=S.ev.filter(x=>x.id==sel[0]||!sel.includes(x.id));V.sel.clear();setOrder(ids().filter(i=>S.ev.some(x=>x.id==i)));save();rr();X.toast('Merged',{kind:'ok'})}});
// split the chapter currently being edited at the caret (palette command)
CMD.register({id:'split',label:'Split chapter at cursor',keywords:'divide',run:()=>{const t=document.querySelector('textarea[data-v5=fin]');if(!t){X.toast('Open a chapter in Edit-final and place the cursor first',{kind:'warn'});return}
 const ev=S.ev.find(x=>x.id==t.dataset.e);if(!ev)return;const at=t.selectionStart,[a,b,ok]=ORDER.split(t.value,at);if(!b){X.toast('Nothing after the cursor',{kind:'warn'});return}snap();
 const nid=uid(),n={...JSON.parse(JSON.stringify(ev)),id:nid,title:(ev.title||'Chapter')+' (2)',t:+ev.t+0.0001,prose:'',fin:{...(ev.fin||{}),[fm()]:b}};delete n.fh;ev.fin=ev.fin||{};ev.fin[fm()]=a;S.ev.push(n);const o=ids().filter(i=>i!=nid),ix=o.indexOf(ev.id);o.splice(ix+1,0,nid);setOrder(o);save();rr();X.toast('Split into two chapters'+(ok?'':' (word count differs)'),{kind:'ok'})}});
})();
