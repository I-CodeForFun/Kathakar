/* ---- Places: profiles + events over time ---- */
TABS.push(['places','📍 Places']);
let PINC=true;const PLN={};
const nrm=x=>String(x||'').trim().toLowerCase();
// An event belongs to the place named in its Place field (falls back to the scene-grid place when that field is empty).
const plFor=e=>S.places.find(p=>nrm(p.name)&&nrm(p.name)==nrm(e.place))||S.places.find(p=>p.id==e.gp)||null;   // name match first, then the scene-grid place (also when the typed text matches nothing)
const plSet=(id,inc)=>{const s=new Set([id]);if(inc){let c=1;while(c){c=0;S.places.forEach(n=>{if(!s.has(n.id)&&s.has(n.parent)){s.add(n.id);c=1}})}}return s};
// an event can take place in several places: its main Place field + the “Also at” list (e.px, comma separated)
const plAll=e=>{const out=[],add=p=>{if(p&&!out.includes(p))out.push(p)};add(plFor(e));String(e.px||'').split(/[,;]+/).map(x=>nrm(x)).filter(Boolean).forEach(n=>add(S.places.find(p=>nrm(p.name)==n)));return out};
const plEvents=(p,inc)=>{const ids=plSet(p.id,inc);return S.ev.filter(e=>plAll(e).some(q=>ids.has(q.id))).sort((a,b)=>a.t-b.t)};
// Facts of the event's place and of the places it sits inside (a bank of a river inherits the river's facts).
const plText=o=>{const L=[],seen=new Set();plAll(o).forEach(p0=>{let p=p0,n=0;while(p&&n++<8&&!seen.has(p.id)){seen.add(p.id);const f=[p.desc,p.feat,p.hist].filter(Boolean);if(f.length)L.push(p.name+' — '+f.join('; ')+'.');p=p.parent?up('places',p.parent):null}});return L};
function plOrder(p=null,o=[]){S.places.filter(n=>(n.parent||null)==p).forEach(n=>{o.push(n);plOrder(n.id,o)});return o}
function plCard(p){const d=depthOf('places',p),pth=path('places',p),ex=new Set([...plSet(p.id,true)]),n=plEvents(p,PINC).length,
 F=(f,ph)=>`<textarea rows="2" data-t="places" data-id="${p.id}" data-f="${f}" placeholder="${ph}">${esc(p[f])}</textarea>`;
 let h=`<div class="card" style="border-top:4px solid #6d5ae6;margin:8px 0 0 ${Math.min(d,5)*16}px"><small style="color:var(--mut)">${esc(PL[p.lv||0]||'Place')}${pth?' · in '+esc(pth):''}</small>
 <input data-t="places" data-id="${p.id}" data-f="name" value="${esc(p.name)}">
 <label>Inside</label><select data-pl="par" data-id="${p.id}"><option value="">— top level —</option>${S.places.filter(x=>!ex.has(x.id)).map(x=>`<option value="${x.id}" ${x.id==p.parent?'selected':''}>${esc((path('places',x)?path('places',x)+' › ':'')+x.name)}</option>`).join('')}</select>
 ${F('desc','Description — what it looks, sounds and feels like')}${F('imp','Importance — why this place matters to the story')}${F('hist','History — what happened here before and during the story')}${F('feat','Features & rules — climate, laws, resources, dangers')}
 <div class="row" style="margin-top:6px"><button data-pl="ev" data-id="${p.id}" class="${S.pe==p.id?'on':''}">📅 Events here (${n})</button><button data-pl="sub" data-id="${p.id}">+ Sub-place</button><button data-pl="del" data-id="${p.id}">Delete</button></div>`;
 if(S.pe==p.id){const E=plEvents(p,PINC),ids=plSet(p.id,PINC),G=[];S.times.forEach(t=>{const ch=[];Object.entries(S.cells).forEach(([k,l])=>{const[pk,tk]=k.split('|');if(tk==t.id&&ids.has(pk))l.forEach(x=>{const c=S.chars.find(c=>c.id==x.cid);if(c&&!ch.includes(c.name))ch.push(c.name)})});if(ch.length)G.push(`${esc(path('times',t)?path('times',t)+' › ':'')+esc(t.name)}: ${ch.map(esc).join(', ')}`)});
  h+=`<div style="margin-top:8px"><b>Events over time (${E.length})</b>${PINC&&plSet(p.id,false).size<ids.size?' <small style="color:var(--mut)">incl. sub-places</small>':''}`+
  (E.length?E.map(e=>{const l=S.tls.find(x=>x.id==e.tl),q=plFor(e);return`<div class="card" style="margin:4px 0"><small>${esc(fullT(e.t))} · ${esc(l?l.name:'?')}${q&&q.id!=p.id?' · at '+esc(q.name):''}</small><br><b>${esc(e.title||'Untitled')}</b> ${e.chars.map(c=>`<span style="color:${ch(c).color}">●</span>`).join('')} <small>${esc((e.notes||e.prose||'').slice(0,120))}</small> <button data-pl="oe" data-id="${e.id}">Open</button></div>`}).join(''):'<br><small style="color:var(--mut)">No events yet — set an event’s Place to “'+esc(p.name)+'”.</small>')+
  (G.length?`<div style="margin-top:6px"><b>Scene grid (Matrix)</b><br><small>${G.join('<br>')}</small></div>`:'')+'</div>'}
 return h+'</div>'}
function vPlaces(){const known=new Set(S.places.map(p=>nrm(p.name))),un={};S.ev.forEach(e=>[e.place,...String(e.px||'').split(/[,;]+/)].forEach(nm=>{const k=nrm(nm);if(k&&!known.has(k)&&!S.places.some(p=>p.id==e.gp&&nm==e.place&&false)){(un[k]=un[k]||{n:String(nm).trim(),c:0}).c++}}));
 let h=`<div class="row"><h3 style="flex:3">📍 Places</h3><label style="display:flex;gap:4px;align-items:center;font-size:12px"><input type="checkbox" data-pl="inc" ${PINC?'checked':''}> include sub-places</label><button class="pri" data-pl="add">+ Add place</button></div><p style="color:var(--mut);font-size:12px;margin:0 0 6px">Describe each location. Events are linked by their <b>Place</b> name, so “Events here” shows everything that happened there, in time order. Places can nest (e.g. Kingdom › Castle › Throne room).</p>`;
 h+=plOrder().map(plCard).join('');
 return h}
const _plRD=render;render=function(){S.places.forEach(p=>PLN[p.id]=p.name);_plRD()};
const _plOE=openEv;openEv=function(id){_plOE(id);const inp=$('#dr').querySelector('input[data-ev="place"]');if(!inp)return;inp.setAttribute('list','pl-names');
 inp.insertAdjacentHTML('afterend',`<datalist id="pl-names">${S.places.map(p=>`<option value="${esc(p.name)}">`).join('')}</datalist><div id="pl-go"></div>`);plGo()};
function plGo(){const el=$('#pl-go');if(!el)return;const e=S.ev.find(x=>x.id==evId),p=e&&plFor(e);
 el.innerHTML=p?`<button data-pl="go" data-id="${p.id}" style="margin:3px 0">📍 ${esc(p.name)} — open place profile</button>`:(e&&nrm(e.place)?`<button data-pl="mk" data-n="${esc(e.place.trim())}" style="margin:3px 0">＋ Create place “${esc(e.place.trim())}”</button>`:'')}
document.addEventListener('input',ev=>{const t=ev.target,d=t.dataset||{};
 if(d.ev=='place'&&t.closest('#dr'))setTimeout(plGo,0);
 if(d.t=='places'&&d.f=='name')setTimeout(()=>{const p=S.places.find(x=>x.id==d.id),old=PLN[d.id];if(p&&old!=null&&old!==p.name){S.ev.forEach(e=>{if(nrm(e.place)==nrm(old))e.place=p.name});}if(p)PLN[p.id]=p.name},0)},true);
const plNew=(name,par)=>{const p=par?up('places',par):null,n={id:uid(),name:name||'New place',lv:p?Math.min((+p.lv||0)+1,PL.length-1):0,parent:p?p.id:null,exp:0};if(p)p.exp=1;S.places.push(n);return n};
const plClick=e=>{const t=e.target.closest('[data-pl]');if(!t||t.tagName=='SELECT'||t.type=='checkbox')return;const k=t.dataset.pl,d=t.dataset;e.stopPropagation();
 if(k=='add'){S.pe=plNew().id}else if(k=='sub')S.pe=plNew('New place',d.id).id;
 else if(k=='mk'){S.pe=plNew(d.n).id;S.tab='places';$('#dr').classList.remove('open')}
 else if(k=='ev')S.pe=S.pe==d.id?null:d.id;
 else if(k=='go'){S.tab='places';S.pe=d.id;$('#dr').classList.remove('open')}
 else if(k=='oe'){S.tab='map';render();return openEv(d.id)}
 else if(k=='del'){const del=plSet(d.id,true);if(S.places.every(p=>del.has(p.id)))return SFX.notice('Keep at least one place.');if(!confirm('Delete this place'+(del.size>1?' and its sub-places':'')+'? Events keep their place text.'))return;
  S.places=S.places.filter(p=>!del.has(p.id));for(const c in S.cells)if(del.has(c.split('|')[0]))delete S.cells[c];S.ev.forEach(x=>{if(del.has(x.gp))x.gp=''});if(del.has(S.pe))S.pe=null}
 render()};
document.addEventListener('click',plClick,true);
document.addEventListener('change',e=>{const t=e.target,d=t.dataset||{};
 if(d.pl=='inc'){PINC=t.checked;render()}
 else if(d.pl=='par'){const p=up('places',d.id),n=t.value?up('places',t.value):null;if(!p||(n&&plSet(p.id,true).has(n.id)))return;p.parent=n?n.id:null;p.lv=n?Math.min((+n.lv||0)+1,PL.length-1):0;if(n)n.exp=1;render()}},true);
const _plMD=toMD;toMD=function(){let m=_plMD();const P=plOrder();if(!P.length)return m;
 return m+'\n\n## Places\n'+P.map(p=>`\n${'#'.repeat(Math.min(3+depthOf('places',p),6))} ${p.name}${p.lv!=null?' ('+(PL[p.lv||0]||'Place')+')':''}\n`+[['Description',p.desc],['Importance',p.imp],['History',p.hist],['Features & rules',p.feat]].filter(x=>x[1]).map(x=>`- **${x[0]}:** ${x[1]}`).join('\n')).join('\n')+'\n'};
