/* v8: word log (B1), inbox (B10), command palette + search (B5/B9), Craft tab (B2 lint, C9.3 readability, B3 beat sheets). */
(function(){window.XV=window.XV||{};const X=window.SFX,esc=X.esc,tr=X.tr,$q=s=>document.querySelector(s);
const fm=()=>typeof FM=='function'?FM():'book',ftxt=e=>{try{return typeof finTxt=='function'?finTxt(e,fm()):(e.prose||'')}catch(x){return e.prose||''}};
const rerender=()=>{try{render()}catch(e){}};
// ================= B1 word log =================
const WK=()=>'sf-wlog-'+KEY;let LOG={},LK=null,dirty=false,wt=null,before=new WeakMap();
const loadLog=()=>{if(LK===KEY)return;flushLog();LK=KEY;try{LOG=JSON.parse(localStorage.getItem(WK())||'{}')||{}}catch(e){LOG={}}chip()};
function flushLog(){if(!dirty||!LK)return;dirty=false;try{localStorage.setItem('sf-wlog-'+LK,JSON.stringify(LOG))}catch(e){X.toast('Word log not saved (storage full)',{kind:'warn'})}}
const bc=window.BroadcastChannel?new BroadcastChannel('sf-wlog'):null;let focused=true;addEventListener('focus',()=>focused=true);addEventListener('blur',()=>focused=false);
const isEd=t=>t&&t.dataset&&(t.dataset.v5=='fin'||t.dataset.v5=='ftxt');
document.addEventListener('beforeinput',e=>{if(isEd(e.target))before.set(e.target,e.target.value)},true);
document.addEventListener('input',e=>{const t=e.target;if(!isEd(t)||X.quiet>0)return;loadLog();const b=before.get(t);if(b===undefined)return;before.delete(t);
 const d=WLOG.delta(b,t.value,e.inputType);WLOG.add(LOG,WLOG.day(),d);dirty=true;clearTimeout(wt);wt=setTimeout(()=>{flushLog()},5000);chip()},true);
addEventListener('pagehide',flushLog);addEventListener('visibilitychange',()=>{if(document.hidden)flushLog()});
const goal=()=>+S.dgoal>0?+S.dgoal:250;
function chip(){const h=$q('header #q');if(!h)return;let b=document.getElementById('wl8');if(!b){h.insertAdjacentHTML('beforebegin','<button id="wl8" data-x8="wl" style="font-size:11px"></button><button id="ib8" data-x8="inbox" title="Inbox (Ctrl+Shift+I)" aria-label="Inbox">✉</button>');b=document.getElementById('wl8')}
 const n=(LOG[WLOG.day()]||{}).w||0;b.textContent=tr('b1.today',{n,goal:goal()});b.setAttribute('aria-label','Words today: '+n+' of '+goal())}
function wlDialog(){loadLog();const t=WLOG.day(),st=WLOG.stats(LOG,goal(),t),cells=WLOG.heat(LOG,t),mx=Math.max(goal(),...cells.map(c=>c.w));
 const col=w=>w<=0?'var(--line,#ddd)':`hsl(150 55% ${Math.round(85-Math.min(1,w/mx)*50)}%)`;
 const svg='<svg viewBox="0 0 '+(12*14+4)+' 104" width="100%" role="img" aria-label="Writing heatmap, last 12 weeks">'+cells.map((c,i)=>`<rect x="${Math.floor(i/7)*14+2}" y="${(i%7)*14+2}" width="12" height="12" rx="2" style="fill:${col(c.w)}"><title>${c.d}: ${c.w} words</title></rect>`).join('')+'</svg>';
 const tot=S.ev?S.ev.reduce((a,e)=>a+(ftxt(e).match(/\S+/g)||[]).length,0):0,pj=S.goal>0?WLOG.project(tot,+S.goal,st.pace,t):null;
 const d=document.createElement('dialog');d.setAttribute('aria-label','Writing progress');d.style.cssText='max-width:min(520px,94vw);border-radius:12px;border:1px solid var(--line);background:var(--card);color:var(--ink);padding:16px';
 d.innerHTML=`<h3 style="margin:0 0 6px">✍ ${esc(tr('b1.today',{n:st.today,goal:goal()}))}</h3><p style="margin:0 0 8px">${esc(tr('b1.streak',{n:st.streak}))} · best ${st.best.w||0} · avg/day ${st.avg}${pj?' · at your 30-day pace: '+pj:''}</p>${svg}
 <details style="margin-top:8px"><summary>Last 30 days (table)</summary><table style="font-size:12px"><tr><th>Date</th><th>Words</th></tr>${st.last30.map(x=>`<tr><td>${x.d}</td><td>${x.w}</td></tr>`).join('')}</table></details>
 <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><button data-d="goal">Set daily target</button><button data-d="csv">Export CSV</button><button data-d="reset">Reset today</button><button data-d="x" style="margin-left:auto">Close</button></div>`;
 document.body.appendChild(d);d.addEventListener('close',()=>d.remove());d.addEventListener('click',async e=>{const k=e.target.dataset&&e.target.dataset.d;if(!k)return;
  if(k=='x')d.close();
  if(k=='goal'){d.close();const v=await X.askText({title:'Daily word target',label:'Words per day',value:String(goal())});if(v&&+v>0){S.dgoal=Math.round(+v);save();chip()}}
  if(k=='csv'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([WLOG.csv(LOG)],{type:'text/csv'}));a.download='wordlog-'+KEY+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)}
  if(k=='reset'){if(await X.ask({title:'Reset today?',body:'Today’s word count will be cleared.',confirm:'Reset',danger:true})){delete LOG[WLOG.day()];dirty=true;flushLog();chip()}}});d.showModal()}
// ================= B10 inbox =================
function inboxDialog(){if(!Array.isArray(S.inbox))S.inbox=[];const prev=document.activeElement,d=document.createElement('dialog');d.setAttribute('aria-label','Inbox');d.style.cssText='width:min(520px,94vw);border-radius:12px;border:1px solid var(--line);background:var(--card);color:var(--ink);padding:16px';
 const draw=()=>{d.innerHTML=`<h3 style="margin:0 0 6px">✉ ${esc(tr('inbox.title'))}</h3><textarea id="ib-t" rows="2" style="width:100%" aria-label="New note" placeholder="Quick capture…"></textarea><div style="display:flex;gap:8px;margin:6px 0"><button data-i="add" class="pri">${esc(tr('inbox.add'))}</button><button data-i="x" style="margin-left:auto">Close</button></div>
  <ul style="list-style:none;padding:0;margin:0;max-height:50vh;overflow:auto">${S.inbox.map(n=>`<li style="border-top:1px solid var(--line);padding:6px 0"><div>${esc(n.text)}</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;font-size:12px"><span>Promote:</span>${['event','character','place'].map(k=>`<button data-i="p" data-k="${k}" data-id="${n.id}">${k}</button>`).join('')}<button data-i="del" data-id="${n.id}">Delete</button></div></li>`).join('')||'<li class="mut">Empty</li>'}</ul>`;const t=d.querySelector('#ib-t');if(t)t.focus()};
 draw();document.body.appendChild(d);d.addEventListener('close',()=>{d.remove();try{prev&&prev.focus&&prev.focus()}catch(e){}});
 d.addEventListener('keydown',e=>{if(e.key=='Enter'&&(e.ctrlKey||e.metaKey)&&e.target.id=='ib-t')d.querySelector('[data-i=add]').click()});
 d.addEventListener('click',e=>{const t=e.target,i=t.dataset&&t.dataset.i;if(!i)return;
  if(i=='x')return d.close();
  if(i=='add'){const v=d.querySelector('#ib-t').value.trim();if(!v)return;S.inbox.unshift({id:uid(),text:v.slice(0,4000),ts:Date.now(),tags:[]});if(S.inbox.length>500){S.inbox.length=500;X.toast('Inbox full: oldest notes removed',{kind:'warn'})}save();draw()}
  if(i=='del'){S.inbox=S.inbox.filter(n=>n.id!=t.dataset.id);save();draw()}
  if(i=='p'){const n=S.inbox.find(x=>x.id==t.dataset.id);if(!n)return;snap();const k=t.dataset.k,first=n.text.split('\n')[0].slice(0,60);
   if(k=='event')S.ev.push({id:uid(),tl:(S.tls[0]||{}).id,t:S.ev.length?Math.max(...S.ev.map(e=>+e.t||0))+1:0,title:first,place:'',chars:[],mood:'',notes:n.text});
   if(k=='character')S.chars.push({id:uid(),name:first,role:'',color:COL[S.chars.length%7],notes:n.text});
   if(k=='place')S.places.push({id:uid(),name:first,desc:n.text});
   S.inbox=S.inbox.filter(x=>x.id!=n.id);save();rerender();draw();X.toast('Promoted to '+k,{kind:'ok'})}});d.showModal()}
// ================= B5/B9 palette + search =================
const CMDS=[];window.CMD={register:c=>{const i=CMDS.findIndex(x=>x.id==c.id);i>=0?CMDS[i]=c:CMDS.push(c)},all:()=>CMDS};
const go=tab=>{S.tab=tab;const d=$q('#dr');d&&d.classList.remove('open');rerender()};
function builtins(){CMD.register({id:'inbox',label:'New inbox note',keywords:'capture scratch',run:inboxDialog});CMD.register({id:'wl',label:'Writing progress (word count)',keywords:'streak goal heatmap',run:wlDialog});
 CMD.register({id:'snap',label:'Save a snapshot',run:()=>{typeof snapNow=='function'&&snapNow('Manual (palette)');X.toast('Snapshot saved',{kind:'ok'})}});
 CMD.register({id:'theme',label:'Toggle theme',run:()=>{const b=$q('[data-a=th]');b&&b.click()}});
 (typeof TABS!='undefined'?TABS:[]).forEach(t=>CMD.register({id:'go-'+t[0],label:'Go to '+t[1].replace(/^\S+\s+/,''),group:'tab',run:()=>go(t[0])}))}
let docs=null,docsKey='';const index=()=>{const k=KEY+':'+(S.ev||[]).length+':'+JSON.stringify(S.ev||[]).length;if(!docs||docsKey!=k){docs=FIND.build(S);docsKey=k}return docs};
function jump(r){if(r.type=='ev'){if(typeof openEv=='function')openEv(r.id)}else if(r.type=='chars'){S.sel=r.id;go('chars')}else if(r.type=='places'){S.pe=r.id;go('places')}else if(r.type=='worlds'){go('worlds')}else if(r.type=='info'){go('info')}else if(r.type=='props'){S.tab='props';rerender()}else if(r.type=='inbox')inboxDialog()}
function palette(){builtins();const prev=document.activeElement,d=document.createElement('dialog');d.setAttribute('aria-label','Command palette');d.style.cssText='width:min(560px,94vw);border-radius:12px;border:1px solid var(--line);background:var(--card);color:var(--ink);padding:12px;margin-top:10vh';
 d.innerHTML=`<input id="pl-q" role="combobox" aria-expanded="true" aria-controls="pl-l" aria-autocomplete="list" placeholder="${esc(tr('pal.placeholder'))}" style="width:100%" aria-label="Command or search"><ul id="pl-l" role="listbox" style="list-style:none;padding:0;margin:8px 0 0;max-height:50vh;overflow:auto"></ul><div id="pl-s" class="mut" style="font-size:11px" aria-live="polite"></div>`;
 document.body.appendChild(d);const q=d.querySelector('#pl-q'),l=d.querySelector('#pl-l'),st=d.querySelector('#pl-s');let items=[],sel=0;
 const rec=()=>{try{return JSON.parse(localStorage.getItem('xl-pal')||'[]')}catch(e){return[]}};
 const draw=()=>{const v=q.value;let list;if(v[0]=='>'||!v){const t=v.replace(/^>/,'').trim(),R=rec();list=CMDS.map(c=>({k:'cmd',c,s:FIND.fuzzy(t,c.label+' '+(c.keywords||''))+(R.includes(c.id)?2:0)})).filter(x=>x.s>=0).sort((a,b)=>b.s-a.s).slice(0,12)}
  else{const pre=v[0],map={'@':'type:character','#':'type:event','/':'type:place'},qq=map[pre]?map[pre]+' '+v.slice(1):v;list=[...CMDS.map(c=>({k:'cmd',c,s:FIND.fuzzy(v,c.label)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).slice(0,4),...FIND.search(index(),qq,6).slice(0,12).map(r=>({k:'hit',r}))]}
  items=list;sel=Math.min(sel,Math.max(0,items.length-1));l.innerHTML=items.map((x,i)=>`<li role="option" id="pl-${i}" data-n="${i}" aria-selected="${i==sel}" style="padding:6px 8px;border-radius:6px;cursor:pointer;${i==sel?'background:var(--line)':''}">${x.k=='cmd'?esc(x.c.label):'<small>'+esc(x.r.type)+'</small> '+esc(x.r.title)}</li>`).join('');q.setAttribute('aria-activedescendant','pl-'+sel);st.textContent=items.length+' results'};
 const run=i=>{const x=items[i];if(!x)return;d.close();if(x.k=='cmd'){localStorage.setItem('xl-pal',JSON.stringify([x.c.id,...rec().filter(y=>y!=x.c.id)].slice(0,8)));setTimeout(()=>x.c.run(),0)}else setTimeout(()=>jump(x.r),0)};
 q.addEventListener('input',()=>{sel=0;draw()});q.addEventListener('keydown',e=>{if(e.key=='ArrowDown'){sel=Math.min(items.length-1,sel+1);draw();e.preventDefault()}else if(e.key=='ArrowUp'){sel=Math.max(0,sel-1);draw();e.preventDefault()}else if(e.key=='Enter'){run(sel);e.preventDefault()}});
 l.addEventListener('click',e=>{const li=e.target.closest('li');if(li)run(+li.dataset.n)});d.addEventListener('close',()=>{d.remove();try{prev&&prev.focus&&prev.focus()}catch(e){}});draw();d.showModal();q.focus()}
document.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&k=='k'){e.preventDefault();if(!document.querySelector('dialog[open]'))palette()}
 else if((e.ctrlKey||e.metaKey)&&e.shiftKey&&k=='i'){e.preventDefault();if(!document.querySelector('dialog[open]'))inboxDialog()}});
// ================= Craft tab: lint / readability / beat sheets =================
TABS.push(['craft','✍ Craft']);
const ages=['PB','MG','YA','NA','Adult'];
const CR=window.__craft=window.__craft||{sec:'lint'};
function chapters(){return[...S.ev].sort((a,b)=>(+a.t||0)-(+b.t||0))}
const hotCache=new Map();
function lintRows(){const names=[...S.chars.map(c=>c.name),...S.places.map(p=>p.name)].filter(Boolean),ign=(S.lintIgnore||[]);
 return chapters().map(e=>{const t=ftxt(e),key=e.id+':'+t.length+':'+t.slice(0,40)+t.slice(-40);let r=hotCache.get(key);if(!r){r=LINT.summary(t,{names,ignore:ign});hotCache.set(key,r)}return{e,r}})}
XV.craft=function vCraft(){const sec=CR.sec,tabs=[['lint','Style lint'],['read','Readability'],['beats','Beat sheets'],['diff','Compare'],['tools','Tools'],['pub','Publish'],['serial','Serial'],['print','Print'],['cover','Cover'],['rd','Reading & audio']];
 let h=`<div class="row"><h3 style="flex:3">✍ Craft</h3></div><div class="row" role="tablist" style="gap:6px;margin-bottom:8px">${tabs.map(([k,l])=>`<button role="tab" aria-selected="${sec==k}" data-x8="sec" data-k="${k}" class="${sec==k?'pri':''}">${l}</button>`).join('')}</div>`;
 if(sec=='lint'){const rows=lintRows(),R=LINT.RULES;h+=`<p class="mut" style="font-size:12px">Density = hits per 1,000 words. Click a chapter to open it. Suggestions only — style is your call.</p><div style="overflow-x:auto"><table style="font-size:12px;border-collapse:collapse"><tr><th align="left">Chapter</th><th>Words</th>${Object.keys(R).map(k=>`<th title="${esc(R[k].label)}">${esc(R[k].label)}</th>`).join('')}<th>Hotspot</th></tr>`+
  rows.map(({e,r})=>`<tr><td><button data-x8="open" data-id="${e.id}">${esc(e.title||'Untitled')}</button></td><td align="right">${r.words}</td>${Object.keys(R).map(k=>`<td align="right">${r.density[k]||''}</td>`).join('')}<td align="right"><b>${Object.values(r.density).reduce((a,b)=>a+b,0).toFixed(0)}</b></td></tr>`).join('')+'</table></div>'}
 if(sec=='read'){const age=S.age||'Adult';h+=`<div class="row"><label>Age band <select data-x8="age">${ages.map(a=>`<option ${a==age?'selected':''}>${a}</option>`).join('')}</select></label></div><table style="font-size:12px"><tr><th align="left">Chapter</th><th>Words</th><th>Flesch</th><th>Grade</th><th>Fog</th><th>Avg sentence</th><th>Dialogue %</th><th>Band</th></tr>`+
  chapters().map(e=>{const a=READ.analyze(ftxt(e)),b=READ.BANDS[age].fk,out=a.words&&(a.fk<b[0]||a.fk>b[1]);return`<tr><td>${esc(e.title||'Untitled')}</td><td align="right">${a.words}</td><td align="right">${a.fre.toFixed(0)}</td><td align="right">${a.fk.toFixed(1)}</td><td align="right">${a.fog.toFixed(1)}</td><td align="right">${a.avgSentence.toFixed(1)}</td><td align="right">${a.dialoguePct.toFixed(0)}</td><td>${a.words?(out?'⚠ outside '+b.join('–'):'✓'):''}</td></tr>`}).join('')+'</table>'}
 if(sec=='beats'){const tid=CR.tid||'hero',tpl=BEATS.byId(tid),ts=ev=>S.ev.map(e=>+e.t||0),span=S.ev.length?[Math.min(...ts()),Math.max(...ts())||100]:[0,100],cl=BEATS.checklist(tpl,S.ev,span);
  h+=`<div class="row"><label>Template <select data-x8="tpl">${BEATS.TEMPLATES.map(t=>`<option value="${t.id}" ${t.id==tid?'selected':''}>${esc(t.name)} (${esc(t.structure)})</option>`).join('')}</select></label>
  <button data-x8="bcreate">Create events</button><button data-x8="bmap" ${S.ev.length?'':'disabled'}>Map to existing events</button></div>
  <p class="mut" style="font-size:12px">Create adds one event per beat; Map links the nearest existing event to each beat without creating anything. One undo step.</p>
  <table style="font-size:12px"><tr><th align="left">Beat</th><th>Target</th><th align="left">Event</th><th>Status</th></tr>${cl.map(c=>`<tr><td>${esc(c.point.t)}</td><td align="right">${Math.round(c.point.pos*100)}%</td><td>${c.event?`<button data-x8="open" data-id="${c.event.id}">${esc(c.event.title||'Untitled')}</button>`:''}</td><td>${c.status=='unmapped'?'–':c.status=='mapped'?'✓ mapped':'⚠ off by '+c.delta+'%'}</td></tr>`).join('')}</table>`}
 if(XV.craftExtra&&XV.craftExtra[sec])h+=XV.craftExtra[sec]();
 return h};
document.addEventListener('change',e=>{const k=e.target.dataset&&e.target.dataset.x8;if(!k)return;if(k=='tpl'){CR.tid=e.target.value;rerender()}if(k=='age'){S.age=e.target.value;save();rerender()}});
document.addEventListener('click',e=>{const b=e.target.closest('[data-x8]');if(!b)return;const k=b.dataset.x8;
 if(k=='wl')wlDialog();else if(k=='inbox')inboxDialog();else if(k=='sec'){CR.sec=b.dataset.k;rerender()}else if(k=='open'){typeof openEv=='function'&&openEv(b.dataset.id)}
 else if(k=='bcreate'||k=='bmap'){const tpl=BEATS.byId(CR.tid||'hero'),tt=S.ev.map(x=>+x.t||0),span=S.ev.length?[Math.min(...tt),Math.max(...tt)||100]:[0,100];snap();
  if(k=='bcreate'){const p=BEATS.plan(tpl,S.ev,'create',span);p.forEach(x=>S.ev.push({id:uid(),tl:(S.tls[0]||{}).id,t:x.t,title:x.title,place:'',chars:[],mood:'',notes:x.note,beat:tpl.id+':'+x.point,act:x.act}));X.toast('Created '+p.length+' events',{kind:'ok'})}
  else{const p=BEATS.plan(tpl,S.ev,'map',span);p.forEach(x=>{const ev=S.ev.find(y=>y.id==x.eventId);if(ev){ev.beat=tpl.id+':'+x.point;ev.act=x.act}});X.toast('Mapped '+p.length+' beats',{kind:'ok'})}save();rerender()}});
addEventListener('sf:ready',()=>{loadLog();chip()});addEventListener('sf:write',()=>{if(LK!==KEY)loadLog();chip()});
setTimeout(()=>{try{loadLog();chip()}catch(e){}},0);
})();
