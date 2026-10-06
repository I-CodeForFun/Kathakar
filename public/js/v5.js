/* ---- v5: relationship arcs · collapsible lists · editable final manuscript · writing aids ---- */
(()=>{
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const h5=s=>{let h=5381;s=String(s||'');for(let i=0;i<s.length;i++)h=(h*33^s.charCodeAt(i))>>>0;return h.toString(36)};
const wcount=t=>(String(t||'').match(/\S+/g)||[]).length;
const sg=v=>(v>0?'+':'')+v;
const rnd=v=>Math.round(v*10)/10;
const UIK='sf-ui';let UI={};try{UI=JSON.parse(localStorage.getItem(UIK))||{}}catch(e){}
UI.cl=UI.cl||{};UI.tg=UI.tg||{};const FLT={};
const uis=()=>{try{localStorage.setItem(UIK,JSON.stringify(UI))}catch(e){}};

/* =========================================================
   1. RELATIONSHIP ARCS
   r.bt = beats  [{id, ev?, t, v:-5..5, type, note}]   (story as written)
   r.tg = intended arc points [{id, t, v}]               (story as planned)
   S.ar = {a:[ids], b:[ids]} current selection · S.grps = saved groups
   ========================================================= */
TABS.push(['arcs','📈 Relationship arcs']);
const TV={Lover:5,Family:3,Friend:3,Ally:2,Mentor:2,Servant:0,Stranger:0,Rival:-2,Enemy:-4};
// ---- genre arc templates: [name, description, [[position 0..1, closeness -5..5, beat label], ...]]
const GEN={
'Romance':[
['Enemies to lovers','Open hostility thaws under forced proximity, a spark, a dark-moment rupture, then a grand reconciliation.',[[0,-4,'Clash'],[.2,-3,'Forced together'],[.4,-1,'Thaw'],[.55,2,'Spark'],[.75,-2,'Dark moment'],[.9,4,'Grand gesture'],[1,5,'Together']]],
['Slow burn','Almost nothing happens for a long time — then everything does. Closeness creeps up in tiny steps.',[[0,0,'Strangers'],[.25,1,'Ease'],[.5,2,'Almost'],[.7,3,'Longing'],[.85,1,'Obstacle'],[1,5,'Confession']]],
['Friends to lovers','A safe, warm friendship; a realisation; fear of ruining it; a leap.',[[0,3,'Best friends'],[.3,3,'Comfort'],[.5,4,'Realisation'],[.65,2,'Fear of ruining it'],[.85,3,'The choice'],[1,5,'Together']]],
['Second chance','A past love, a painful break, years apart, a reunion and a hard-won rekindling.',[[0,5,'Past love'],[.15,-3,'The break'],[.4,-2,'Years apart'],[.55,0,'Reunion'],[.75,2,'Rekindling'],[.9,-1,'Old wound'],[1,4,'Choosing again']]],
['Opposites attract','Friction becomes curiosity becomes admiration; a values clash; meeting halfway.',[[0,-1,'Friction'],[.3,1,'Curiosity'],[.55,3,'Admiration'],[.75,0,'Clash of values'],[1,4,'Meeting halfway']]],
['Forbidden love (tragic)','A secret bond that peaks and is torn apart by discovery.',[[0,0,'Meeting'],[.25,3,'Secret bond'],[.5,5,'Peak'],[.7,3,'Discovery'],[.85,-2,'Forced apart'],[1,-4,'Loss']]]],
'Thriller & Mystery':[
['Trust → betrayal','Trust is carefully built so the betrayal lands hard.',[[0,1,'Meet'],[.3,3,'Trust built'],[.6,4,'Full trust'],[.75,-4,'Betrayal revealed'],[1,-3,'Reckoning']]],
['Uneasy alliance','Distrust, a common enemy, a secret surfacing, grudging respect.',[[0,-3,'Distrust'],[.3,-1,'Common enemy'],[.55,1,'Working together'],[.75,-1,'Secret surfaces'],[1,2,'Grudging respect']]],
['The mole','Teammates grow close — until the twist exposes one as the traitor.',[[0,3,'Teammates'],[.4,4,'Bond deepens'],[.6,4,'Calm before'],[.7,-4,'Mole exposed'],[1,-5,'Confrontation']]],
['Suspect to ally','From prime suspect to trusted partner as the evidence turns.',[[0,-3,'Suspicion'],[.3,-4,'Evidence mounts'],[.55,-1,'Doubt'],[.75,2,'Cleared'],[1,4,'Partners']]]],
'Fantasy & Adventure':[
['Mentor’s guidance and loss','Apprenticeship, deep trust, then the mentor is lost and the legacy carried on.',[[0,1,'Meeting'],[.25,3,'Apprenticeship'],[.5,4,'Bond'],[.7,5,'Trust complete'],[.82,2,'Mentor lost'],[1,4,'Carrying the legacy']]],
['Fellowship forms','Reluctant companions bicker, win together, split, and reunite as a true fellowship.',[[0,-2,'Reluctant companions'],[.25,-1,'Bickering'],[.5,2,'First victory'],[.7,0,'Rift'],[.85,3,'Reunite'],[1,5,'Fellowship']]],
['Hero and rival','Rivalry escalates, respect creeps in, a forced truce, mutual regard.',[[0,-3,'Rivalry'],[.3,-4,'Escalation'],[.55,-2,'Respect'],[.75,1,'Forced truce'],[1,3,'Mutual regard']]],
['Corrupted ally','A trusted friend is tempted, turns, and becomes the final enemy.',[[0,4,'Ally'],[.3,3,'Doubts'],[.5,1,'Tempted'],[.7,-2,'Turns'],[.9,-5,'Open enemy'],[1,-3,'Final confrontation']]]],
'Drama & Family':[
['Estranged siblings reconcile','Cold distance, a forced reunion, old wounds aired, understanding.',[[0,-3,'Estranged'],[.3,-3,'Forced reunion'],[.5,-1,'Old wounds aired'],[.7,1,'Understanding'],[1,4,'Reconciled']]],
['Parent–child rift','Close, drifting, rupture, silence, tentative repair.',[[0,4,'Close'],[.3,2,'Growing apart'],[.55,-3,'Rupture'],[.75,-2,'Silence'],[1,3,'Repair']]],
['Found family','An outsider is slowly welcomed, tested, and finally belongs.',[[0,-1,'Outsider'],[.3,1,'Welcomed'],[.55,3,'Belonging'],[.75,1,'The test'],[1,5,'Family']]],
['Growing apart','Inseparable friends whose lives pull them away from each other.',[[0,5,'Inseparable'],[.3,4,'Changing lives'],[.55,2,'Distance'],[.8,0,'Strangers'],[1,-1,'Goodbye']]]],
'Comedy':[
['Frenemies','Bicker, truce, fallout, team-up — affection hidden behind insults.',[[0,-1,'Bicker'],[.25,1,'Truce'],[.5,-2,'Fallout'],[.75,2,'Teaming up'],[1,3,'Frenemies forever']]],
['Odd couple','Forced together, chaos escalates, grudging help, a blow-up, real affection.',[[0,-2,'Forced together'],[.3,-3,'Escalating chaos'],[.6,0,'Grudging help'],[.8,-1,'Big blow-up'],[1,3,'Affection']]]],
'Tragedy & Horror':[
['Doomed devotion','Devotion deepens to a peak, then fate takes it all.',[[0,2,'Devotion'],[.3,4,'Deeper'],[.6,5,'Peak'],[.8,2,'Fate intervenes'],[1,-5,'Loss']]],
['Fall from grace','Admired and trusted — until cracks, disillusion and ruin.',[[0,4,'Admired'],[.4,3,'Cracks'],[.6,0,'Disillusion'],[.8,-3,'Estrangement'],[1,-5,'Ruin']]],
['Fracturing trust','A safe group slides into suspicion, paranoia and turning on each other.',[[0,4,'Safe'],[.4,2,'Something’s wrong'],[.6,-1,'Suspicion'],[.8,-3,'Paranoia'],[1,-5,'Turned on each other']]]],
'War & Historical':[
['Brothers in arms','Strangers forged into an unbreakable bond by shared hardship.',[[0,0,'Strangers'],[.3,2,'Shared hardship'],[.6,4,'Bond'],[.8,5,'Under fire'],[1,4,'Unbreakable']]],
['Loyalty tested','Sworn loyalty strained by orders, division, then a chosen reunion.',[[0,3,'Sworn'],[.4,4,'Proven'],[.6,1,'Orders vs loyalty'],[.8,-2,'Divided'],[1,2,'Choosing each other']]]],
'General shapes':[
['Rivals → Allies','',[[0,-3,''],[.2,-2,''],[.4,-1,''],[.6,1,''],[.8,3,''],[1,4,'']]],
['Redemption (with a dip)','',[[0,-4,''],[.2,-4,''],[.4,-2,''],[.6,-3,''],[.8,0,''],[1,3,'']]],
['Drifting apart','',[[0,4,''],[.2,3,''],[.4,2,''],[.6,1,''],[.8,0,''],[1,-1,'']]],
['Steady bond','',[[0,3,''],[.5,3,''],[1,3,'']]]]};
const BUILT=Object.entries(GEN).flatMap(([g,L])=>L.map(([n,d,p])=>({g,n,d,p})));
const allT=()=>[...BUILT,...((UI.ct||[]).map(x=>({...x,g:'My templates'})))];
const tplDesc=r=>{const x=r.tgn&&allT().find(y=>y.g==r.tgn.g&&y.n==r.tgn.n);return x?x.d:''};
const cl5=v=>Math.max(-5,Math.min(5,Math.round(+v||0)));
const B=r=>{r.bt=Array.isArray(r.bt)?r.bt.filter(b=>b&&typeof b=='object'):[];r.bt.forEach(b=>{if(!b.id)b.id=uid();b.v=cl5(b.v);if(!RT.includes(b.type))b.type=r.type;if(typeof b.note!='string')b.note='';if(!isFinite(b.t))b.t=0;if(b.ev&&!S.ev.some(e=>e.id==b.ev))b.ev=''});return r.bt};
const bT=b=>{const e=b.ev&&S.ev.find(x=>x.id==b.ev);return e?e.t:(+b.t||0)};
const SB=r=>[...B(r)].sort((x,y)=>bT(x)-bT(y));
const T=r=>{r.tg=Array.isArray(r.tg)?r.tg.filter(x=>x&&typeof x=='object'):[];r.tg.forEach(x=>{if(!x.id)x.id=uid();x.v=cl5(x.v);if(typeof x.l!='string')x.l='';if(!isFinite(x.t))x.t=0});return r.tg};
const ST=r=>[...T(r)].sort((x,y)=>x.t-y.t);
const at=(L,t,tf)=>{if(!L.length)return null;const n=L.length;if(t<tf(L[0])-1e-9||t>tf(L[n-1])+1e-9)return null;for(let i=0;i<n;i++)if(t<=tf(L[i])+1e-9){if(!i)return L[0].v;const a=L[i-1],b=L[i],ta=tf(a),tb=tf(b);return tb==ta?b.v:a.v+(b.v-a.v)*(t-ta)/(tb-ta)}return L[n-1].v};
const typeAt=(r,t)=>{let ty=r.type;SB(r).forEach(b=>{if(bT(b)<=t+1e-9)ty=b.type});return ty};
const lbl=r=>esc(ch(r.a).name)+' ↔ '+esc(ch(r.b).name);
const pc=i=>COL[i%COL.length];
function ar(){const o=S.ar=(S.ar&&typeof S.ar=='object')?S.ar:{a:[],b:[]};const ok=x=>(Array.isArray(x)?x:[]).filter(id=>S.chars.some(c=>c.id==id));o.a=ok(o.a);o.b=ok(o.b);if(!o.a.length&&!o.init){o.init=1;if(S.rels[0])o.a=[S.rels[0].a]}
 S.grps=(Array.isArray(S.grps)?S.grps:[]).filter(g=>g&&g.id).map(g=>({...g,m:ok(g.m)}));return o}
function pairs(){const o=ar(),A=o.a,Bs=o.b;if(!A.length)return[];return S.rels.filter(r=>{const ia=A.includes(r.a),ib=A.includes(r.b);return Bs.length?(ia&&Bs.includes(r.b))||(ib&&Bs.includes(r.a)):(ia||ib)})}
const cand=r=>{const u=new Set(B(r).map(b=>b.ev).filter(Boolean));return S.ev.filter(e=>e.chars.includes(r.a)&&e.chars.includes(r.b)&&!u.has(e.id)).sort((x,y)=>x.t-y.t)};
function span(r){let ts=r?S.ev.filter(e=>e.chars.includes(r.a)&&e.chars.includes(r.b)).map(e=>e.t):[];if(new Set(ts).size<2)ts=S.ev.map(e=>e.t);if(new Set(ts).size<2)ts=[...ts,...S.rels.flatMap(x=>B(x).map(bT))];
 if(!ts.length)return[0,1];let a=Math.min(...ts),b=Math.max(...ts);if(b-a<1e-9){a-=1/360;b+=1/360}return[a,b]}
function drift(R){const out=[];R.forEach(r=>{const Bt=SB(r),Tg=ST(r);if(!Tg.length)return;if(!Bt.length){out.push(`${lbl(r)}: intended arc set, but no beats written yet`);return}
 Tg.forEach(x=>{const v=at(Bt,x.t,bT);if(v==null){out.push(`${lbl(r)} at ${esc(fullT(x.t))}: no beat covers this point (planned ${sg(x.v)})`);return}const d=v-x.v;if(Math.abs(d)>=2)out.push(`${lbl(r)} at ${esc(fullT(x.t))}: planned ${sg(x.v)}, story shows ${sg(rnd(v))} — ${d>0?'warmer':'colder'} than intended by ${Math.abs(rnd(d))}`)})});return out}
function arcViz(R){const o=ar();
 if(!R.length)return`<div class="card"><small class="mut">Pick one or more characters in <b>Side A</b>. With only Side A you see every relationship they have; add <b>Side B</b> to compare two people, a person against a group, or two groups.</small></div>`;
 const ts=[];R.forEach(r=>{B(r).forEach(b=>ts.push(bT(b)));T(r).forEach(x=>ts.push(x.t))});
 const ids=new Set([...o.a,...o.b]),EV=S.ev.filter(e=>e.chars.some(c=>ids.has(c))).sort((a,b)=>a.t-b.t);EV.forEach(e=>ts.push(e.t));
 if(!ts.length)return`<div class="card"><small class="mut">No events or beats yet. Add beats below.</small></div>`;
 let mn=Math.min(...ts),mx=Math.max(...ts);if(mx-mn<1e-9){mn-=1/360;mx+=1/360}
 const W=760,Ht=300,L=50,Rm=16,Tm=14,Bm=44,iw=W-L-Rm,ih=Ht-Tm-Bm,X=t=>L+(t-mn)/(mx-mn)*iw,Y=v=>Tm+(5-v)/10*ih;
 const P=(A,tf)=>A.map((p,i)=>(i?'L':'M')+X(tf(p)).toFixed(1)+','+Y(p.v).toFixed(1)).join(' ');
 let s=`<svg viewBox="0 0 ${W} ${Ht}" role="img" aria-label="Relationship arc chart" style="width:100%;max-width:920px;background:var(--card);border:1px solid var(--line);border-radius:12px">`;
 for(let v=-5;v<=5;v++){s+=`<line x1="${L}" x2="${W-Rm}" y1="${Y(v)}" y2="${Y(v)}" style="stroke:var(--line);stroke-width:${v?.6:1.6}"/>`;if(v%5==0||v%2==0&&v)s+=`<text x="${L-6}" y="${Y(v)+3}" text-anchor="end" font-size="10" style="fill:var(--mut)">${sg(v)}</text>`}
 s+=`<text x="4" y="${Y(4.6)}" font-size="9" style="fill:var(--mut)">Close</text><text x="4" y="${Y(0)-5}" font-size="9" style="fill:var(--mut)">Neutral</text><text x="4" y="${Y(-4.4)}" font-size="9" style="fill:var(--mut)">Hostile</text>`;
 const raw=(mx-mn)/5,step=STEPS.find(q=>q>=raw)||bigStep(raw);let n=0;for(let k=Math.ceil(mn/step-1e-9);k*step<=mx+1e-9&&n<9;k++,n++){const t=k*step;s+=`<line x1="${X(t)}" x2="${X(t)}" y1="${Tm}" y2="${Tm+ih}" style="stroke:var(--line);stroke-width:.5;stroke-dasharray:3 4"/><text x="${X(t)}" y="${Tm+ih+30}" text-anchor="${X(t)>W-70?'end':'middle'}" font-size="9" style="fill:var(--mut)">${esc(fmtT(t,step))}</text>`}
 EV.forEach(e=>{s+=`<g><line x1="${X(e.t)}" x2="${X(e.t)}" y1="${Tm+ih}" y2="${Tm+ih+8}" style="stroke:var(--mut);stroke-width:1.5"/><title>${esc(e.title||'Untitled')} · ${esc(fullT(e.t))}</title></g>`});
 const mean=(get,tf)=>{const Ls=R.map(get).filter(q=>q.length);if(!Ls.length)return[];const tt=[...new Set(Ls.flatMap(q=>q.map(tf)))].sort((a,b)=>a-b);return tt.map(t=>{const v=Ls.map(q=>at(q,t,tf)).filter(x=>x!=null);return v.length?{t,v:v.reduce((a,b)=>a+b,0)/v.length}:null}).filter(Boolean)};
 R.forEach((r,i)=>{const c=pc(i),Tg=ST(r),Bt=SB(r);
  if(Tg.length>1)s+=`<path d="${P(Tg,x=>x.t)}" fill="none" style="stroke:${c};stroke-width:2;stroke-dasharray:6 5;opacity:.55"/>`;
  if(R.length<=2)Tg.forEach(x=>{if(x.l)s+=`<text x="${Math.max(L+24,Math.min(W-Rm-24,X(x.t)))}" y="${Y(x.v)+(x.v>=3?16:-9)}" text-anchor="middle" font-size="9" style="fill:${c};opacity:.9">${esc(x.l)}</text>`});
  Tg.forEach(x=>s+=`<rect x="${X(x.t)-4}" y="${Y(x.v)-4}" width="8" height="8" transform="rotate(45 ${X(x.t)} ${Y(x.v)})" style="fill:var(--card);stroke:${c};stroke-width:1.5;opacity:.8"><title>Intended ${sg(x.v)} · ${esc(fullT(x.t))}</title></rect>`);
  if(Bt.length>1)s+=`<path d="${P(Bt,bT)}" fill="none" style="stroke:${c};stroke-width:2.6"/>`;
  Bt.forEach(b=>s+=`<circle cx="${X(bT(b))}" cy="${Y(b.v)}" r="5.5" fill="${RC[b.type]||'#888'}" style="stroke:${c};stroke-width:2"><title>${esc(b.type)} ${sg(b.v)} · ${esc(fullT(bT(b)))}${b.note?' — '+esc(b.note):''}</title></circle>`)});
 if(R.length>1){const m=mean(r=>SB(r),bT),mt=mean(r=>ST(r),x=>x.t);
  if(mt.length>1)s+=`<path d="${P(mt,p=>p.t)}" fill="none" style="stroke:var(--ink);stroke-width:2;stroke-dasharray:3 5;opacity:.45"/>`;
  if(m.length>1)s+=`<path d="${P(m,p=>p.t)}" fill="none" style="stroke:var(--ink);stroke-width:4;opacity:.3"/>`}
 s+='</svg>';
 const used=[...new Set(R.flatMap(r=>[r.type,...B(r).map(b=>b.type)]))];
 s+=`<div class="lgd">${R.map((r,i)=>`<span class="lg5"><i style="background:${pc(i)}"></i>${lbl(r)}</span>`).join('')}${R.length>1?'<span class="lg5"><i style="background:var(--ink);opacity:.4"></i>Group average</span>':''}</div><div class="lgd"><small class="mut">Dot colour = relationship type:</small>${used.map(t=>`<span class="lg5"><i style="background:${RC[t]||'#888'};border-radius:50%"></i>${esc(t)}</span>`).join('')}<small class="mut">· solid = the story as written · dashed ◇ = your intended arc</small></div>`;
 const D=drift(R),planned=R.some(r=>T(r).length);
 s+=planned?(D.length?`<div class="card" style="border-color:var(--bad);margin-top:8px"><b style="color:var(--bad)">⚠ ${D.length} spot${D.length>1?'s':''} where the story differs from your intended arc</b><ul style="margin:6px 0 0;padding-left:18px">${D.map(x=>`<li>${x}</li>`).join('')}</ul></div>`:`<div class="card" style="border-color:var(--ok);margin-top:8px"><b style="color:var(--ok)">✓ The story follows your intended arc</b></div>`):`<small class="mut" style="display:block;margin-top:6px">Tip: give a relationship an <b>intended arc</b> below (or pick a preset shape) and this chart will tell you where the story drifts from it.</small>`;
 return s}
const evOpt=sel=>'<option value="">— year —</option>'+[...S.ev].sort((a,b)=>a.t-b.t).map(e=>`<option value="${e.id}" ${e.id==sel?'selected':''}>${esc((e.title||'Untitled').slice(0,34))} · ${esc(fmtT(e.t,1/360))}</option>`).join('');
const numT=t=>+(+t).toFixed(5);
function pairCard(r,i){const Bt=SB(r),last=Bt[Bt.length-1],c=cand(r),A=`data-r="${r.id}"`;
 const typeOpt=sel=>RT.map(t=>`<option ${t==sel?'selected':''}>${t}</option>`).join('');
 return`<div class="card" data-cli="ar:${r.id}" data-cltitle="${esc(ch(r.a).name+' ↔ '+ch(r.b).name)}" data-clmeta="${esc(r.type+(last?' · now '+sg(last.v)+' ('+last.type+')':'')+' · '+Bt.length+' beat'+(Bt.length==1?'':'s')+(T(r).length?' · arc planned':''))}" style="border-left:5px solid ${pc(i)}">
 <div class="row" style="margin:0"><b style="flex:3">${lbl(r)}</b><small class="mut" style="flex:2">base: ${esc(r.type)}${r.note?' — '+esc(r.note):''}</small></div>
 <b style="font-size:12px">Beats — how it actually changes</b><small class="mut">Anchor a beat to an event (it then moves with that event) or type a year (0.5 = six months).</small>
 ${Bt.map(b=>`<div class="bt5"><select data-v5="be" ${A} data-b="${b.id}" aria-label="Anchor to event">${evOpt(b.ev)}</select>${b.ev?'':`<input type="number" step="any" data-v5="bt" ${A} data-b="${b.id}" value="${numT(b.t)}" title="Year (decimals = months/days)" aria-label="Year">`}<input type="range" min="-5" max="5" step="1" data-v5="bv" ${A} data-b="${b.id}" value="${b.v}" aria-label="Closeness"><b class="vv">${sg(b.v)}</b><select data-v5="bty" ${A} data-b="${b.id}">${typeOpt(b.type)}</select><input data-v5="bn" ${A} data-b="${b.id}" placeholder="What shifts here?" value="${esc(b.note)}"><button data-v5="bdel" ${A} data-b="${b.id}" aria-label="Delete beat">✕</button></div>`).join('')||'<small class="mut">No beats yet.</small>'}
 <div class="row" style="margin:2px 0"><button data-v5="badd" ${A}>+ Add beat</button><button data-v5="seed" ${A} ${c.length?'':'disabled'}>⚡ Seed from ${c.length} shared event${c.length==1?'':'s'}</button></div>
 <b style="font-size:12px">Intended arc — what you want it to be</b><small class="mut">Start from a genre template, or add your own points: year (or copy an event’s time) and how close you want them to be.</small>${r.tgn?`<small class="mut">Based on template: <b>${esc(r.tgn.g)} › ${esc(r.tgn.n)}</b>${tplDesc(r)?' — '+esc(tplDesc(r)):''}</small>`:''}
 ${ST(r).map(x=>`<div class="bt5"><input type="number" step="any" data-v5="tt" ${A} data-b="${x.id}" value="${numT(x.t)}" aria-label="Year"><input data-v5="tl" ${A} data-b="${x.id}" value="${esc(x.l)}" placeholder="Beat name" aria-label="Beat name" style="max-width:150px"><select data-v5="te" ${A} data-b="${x.id}" aria-label="Copy time from event"><option value="">time from event…</option>${[...S.ev].sort((a,b)=>a.t-b.t).map(e=>`<option value="${e.id}">${esc((e.title||'Untitled').slice(0,30))}</option>`).join('')}</select><input type="range" min="-5" max="5" step="1" data-v5="tv" ${A} data-b="${x.id}" value="${x.v}" aria-label="Intended closeness"><b class="vv">${sg(x.v)}</b><button data-v5="tdel" ${A} data-b="${x.id}" aria-label="Delete point">✕</button></div>`).join('')}
 <div class="row" style="margin:2px 0"><button class="pri" data-v5="tpl" ${A}>🎭 Genre templates…</button><button data-v5="tadd" ${A}>+ Point</button>${T(r).length?`<button data-v5="tsave" ${A}>💾 Save as my template</button><button data-v5="tclr" ${A}>Clear</button>`:''}</div></div>`}
function vArcs(){const o=ar(),R=pairs(),G=S.grps,chips=s=>S.chars.map(c=>`<button data-v5="t${s}" data-c="${c.id}" class="${o[s].includes(c.id)?'on':''}" style="--c:${c.color}">${esc(c.name)}</button>`).join('');
 const miss=[];if(o.a.length&&o.b.length)o.a.forEach(x=>o.b.forEach(y=>{if(x!=y&&!S.rels.some(r=>(r.a==x&&r.b==y)||(r.a==y&&r.b==x))&&!miss.some(m=>m[0]==y&&m[1]==x))miss.push([x,y])}));
 const gs=s=>`<select data-v5="gl" data-s="${s}" style="width:auto"><option value="">Load group into ${s.toUpperCase()}…</option>${G.map(g=>`<option value="${g.id}">${esc(g.name)} (${g.m.length})</option>`).join('')}</select>`;
 return`<div class="row"><h3 style="flex:3">📈 Relationship arcs</h3></div><p class="mut" style="font-size:12px;margin:0 0 8px">See how a relationship changes over time — between two people, a person and a group, or two groups — and compare it with the arc you intend. Each <b>beat</b> is a point on the story’s timeline: closeness from −5 (hostile) to +5 (inseparable) and the relationship type at that moment.</p>
 <div class="card" style="margin-bottom:10px"><div class="pal" style="margin:0"><b>Side A</b><div class="tg">${chips('a')}</div></div><div class="pal" style="margin:0"><b>Side B</b><small class="mut">(optional)</small><div class="tg">${chips('b')}</div></div>
 <details><summary>Groups (${G.length})</summary><div class="row" style="margin-top:6px">${gs('a')}${gs('b')}<button data-v5="sg" data-s="a">💾 Save A as group</button><button data-v5="sg" data-s="b">💾 Save B as group</button>${G.length?`<select data-v5="gd" style="width:auto"><option value="">Delete a group…</option>${G.map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join('')}</select>`:''}</div></details></div>
 <div id="arcviz">${arcViz(R)}</div>
 ${miss.length?`<div class="card" style="margin-top:8px"><small>Not related yet: ${miss.map(m=>`${esc(ch(m[0]).name)} ↔ ${esc(ch(m[1]).name)} <button data-v5="mk" data-x="${m[0]}" data-y="${m[1]}">Create</button>`).join(' · ')}</small></div>`:''}
 <h4 style="margin:14px 0 6px">Relationships in view (${R.length})</h4><div style="display:flex;flex-direction:column;gap:8px">${R.map(pairCard).join('')||'<small class="mut">None.</small>'}</div>`}
window.vArcs=vArcs;
const refreshViz=()=>{const e=$('#arcviz');if(e)e.innerHTML=arcViz(pairs())};
const relOf=id=>S.rels.find(r=>r.id==id),beatOf=(r,id)=>r&&B(r).find(b=>b.id==id),tgOf=(r,id)=>r&&T(r).find(b=>b.id==id);
function updMeta(r){const el=document.querySelector(`[data-cli="ar:${r.id}"]`);if(!el)return;const L=SB(r),l=L[L.length-1];el.dataset.clmeta=r.type+(l?' · now '+sg(l.v)+' ('+l.type+')':'')+' · '+L.length+' beat'+(L.length==1?'':'s')+(T(r).length?' · arc planned':'');const m=el.querySelector(':scope>.clh .m');if(m)m.textContent=el.dataset.clmeta}

/* =========================================================
   2. COLLAPSIBLE LISTS (+ filter, collapse/expand all)
   ========================================================= */
const thr=k=>k.startsWith('ed:')?12:6;
const isCol=(k,n)=>UI.cl[k]!==undefined?!!UI.cl[k]:n>thr(k);
function annotate(app,t){
 if(t=='chars'||t=='info')$$('.grid2>.card',app).forEach(el=>{const ni=el.querySelector(t=='chars'?'[data-f="name"]':'[data-f="title"]');if(!ni)return;const id=ni.dataset.id;el.dataset.cli=(t=='chars'?'c:':'i:')+id;el.dataset.cltitle=ni.value||(t=='chars'?'(unnamed)':'Untitled');
  if(t=='chars'){const r=el.querySelector('[data-f="role"]');el.dataset.clmeta=r?r.value:''}else{const o=S.info.find(x=>x.id==id);el.dataset.clmeta=o?o.who.map(w=>ch(w).name).join(', '):''}});
 if(t=='rels')$$('.card',app).forEach(el=>{const a=el.querySelector('select[data-f="a"]'),b=el.querySelector('select[data-f="b"]'),ty=el.querySelector('select[data-f="type"]');if(!a||!b||!ty)return;el.dataset.cli='r:'+a.dataset.id;el.dataset.cltitle=a.selectedOptions[0].text+' → '+b.selectedOptions[0].text;el.dataset.clmeta=ty.value});
 if(t=='places')$$('.card',app).forEach(el=>{const ni=el.querySelector('input[data-t="places"][data-f="name"]');if(!ni)return;const id=ni.dataset.id,p=S.places.find(x=>x.id==id),k=p?plSet(id,true).size-1:0;el.dataset.cli='p:'+id;el.dataset.cltitle=ni.value||'(unnamed)';el.dataset.clmeta=(p?(PL[p.lv||0]||'Place'):'')+(k?` · ${k} inside`:'')})}
function autosize(t){if(t&&t.scrollHeight>0){t.style.height='auto';t.style.height=Math.min(t.scrollHeight+4,1400)+'px'}}
function applyCl(){const app=$('#app');if(!app)return;const t=S.tab;$$('.x5more',app).forEach(x=>x.remove());annotate(app,t);
 const items=$$('[data-cli]',app),q=(FLT[t]||'').trim().toLowerCase(),st={};let total=items.length,shown=0;
 items.forEach(el=>{const k=el.dataset.cli,col=isCol(k,items.length);st[k]=col;
  let hd=el.querySelector(':scope>.clh');if(!hd){el.classList.add('cl');el.insertAdjacentHTML('afterbegin',`<div class="clh" data-cl="${esc(k)}" role="button" tabindex="0" aria-label="Expand or collapse"><span class="chv"></span><b class="t"></b><small class="m"></small></div>`);hd=el.querySelector(':scope>.clh')}
  hd.querySelector('.t').textContent=el.dataset.cltitle||'';hd.querySelector('.m').textContent=el.dataset.clmeta||'';hd.dataset.n=items.length;
  const hay=((el.dataset.cltitle||'')+' '+(el.dataset.clmeta||'')+' '+$$('input,textarea',el).map(i=>i.value).join(' ')).toLowerCase(),hide=!!q&&!hay.includes(q);
  el.classList.toggle('cfh',hide);el.classList.toggle('cc',q?false:col);if(!hide)shown++});
 if(t=='places'){const pa=id=>(S.places.find(p=>p.id==id)||{}).parent;items.forEach(el=>{const k=el.dataset.cli;if(!k.startsWith('p:'))return;let a=pa(k.slice(2)),hid=false,n=0;while(a&&n++<40){if(st['p:'+a]&&!q){hid=true;break}a=pa(a)}el.classList.toggle('cch',hid)})}
 if(t=='worlds'){total=0;shown=0;$$('h4',app).forEach(h=>{const sib=[];let n=h.nextElementSibling;while(n&&n.tagName!='H4'&&n.classList.contains('card')){sib.push(n);n=n.nextElementSibling}
  if(!sib.length)return;const chk=/^Story check/.test(h.textContent),k='w:'+(chk?'check':(S.wsel||S.wid||'')+':'+h.textContent.replace(/\s*\(.*$/,'').trim()),col=isCol(k,sib.length);
  h.classList.add('clg');h.dataset.cl=k;h.dataset.n=sib.length;h.classList.toggle('cc',!q&&col);if(!chk){h.dataset.cnt=' ('+sib.length+')';total+=sib.length}
  sib.forEach(c=>{const hide=!!q&&!c.textContent.toLowerCase().includes(q)&&![...c.querySelectorAll('input')].some(i=>i.value.toLowerCase().includes(q));c.classList.toggle('cch',!q&&col);c.classList.toggle('cfh',hide);if(!chk&&!hide)shown++})})}
 let tb=$('.cltb',app);
 if(total>=4&&(t!='book'||items.length)){if(!tb){const f=app.firstElementChild;if(f)f.insertAdjacentHTML('afterend',`<div class="cltb"><input data-v5="flt" placeholder="🔎 Filter this list…" value="${esc(FLT[t]||'')}" aria-label="Filter list"><button data-v5="cla" data-m="1">Collapse all</button><button data-v5="cla" data-m="0">Expand all</button><small class="mut"></small></div>`);tb=$('.cltb',app)}
  if(tb)tb.querySelector('small').textContent=`${shown} of ${total} shown`}else if(tb)tb.remove();
 trimTg(app);$$('.ed5',app).forEach(autosize)}
function trimTg(app){$$('.pal',app).forEach((p,pi)=>{let box=p.querySelector(':scope>.tg'),its=box?[...box.children].filter(x=>x.tagName=='BUTTON'):[];if(its.length<2){box=p;its=$$(':scope>.pc',p)}
 if(its.length<=14)return;const key=S.tab+':'+pi,open=UI.tg[key],hid=its.filter((x,i)=>i>=14&&!x.classList.contains('on')&&!x.classList.contains('sel'));hid.forEach(x=>x.classList.toggle('cch',!open));
 if(!hid.length)return;const b=document.createElement('button');b.className='x5more';b.dataset.v5='more';b.dataset.k=key;b.textContent=open?'Show fewer':`+${hid.length} more`;its[its.length-1].after(b)})}
document.addEventListener('click',e=>{const h=e.target.closest('[data-cl]');if(!h)return;const k=h.dataset.cl,n=+h.dataset.n||0;UI.cl[k]=isCol(k,n)?0:1;uis();applyCl()},true);
document.addEventListener('keydown',e=>{if((e.key=='Enter'||e.key==' ')&&e.target.matches&&e.target.matches('.clh')){e.preventDefault();e.target.click()}});
// a place that was just created / opened for editing must not stay hidden
document.addEventListener('click',e=>{const t=e.target.closest('[data-pl]');if(!t||!['add','sub','mk','go','ev'].includes(t.dataset.pl)||!S.pe)return;let id=S.pe,n=0;while(id&&n++<40){UI.cl['p:'+id]=0;id=(S.places.find(p=>p.id==id)||{}).parent}uis();applyCl()},true);
const _render=window.render;window.render=function(){_render();applyCl()};

/* =========================================================
   3. EDITABLE FINAL MANUSCRIPT
   e.fin = {book?, script?}  edited final text per format;  e.fh = hash of plan text when edited
   ========================================================= */
const STS=['Idea','Draft','Revised','Final'],FR={f:'',r:'',c:false,msg:''};
const FM=()=>(S.bk&&S.bk.fmt=='script')?'script':'book';
const isHd=q=>/^#\s+\S/.test(q),isTr=q=>/^>\s*\S/.test(q);
const novelParas=e=>{const L=(e.prose||'').split(/\n+/).filter(x=>x.trim()),out=[];L.forEach((q,i)=>{if(isHd(q)){if(out.length)out.push('* * *');return}if(isTr(q))return;const m=dlg(q);out.push(m?say(m[0],m[1],m[2]):q)});return out};
const autoHd=e=>`INT./EXT. ${(e.place||'UNKNOWN').toUpperCase()} — YEAR ${parts(e.t).y}`;
const fdHd=h=>/^(INT|EXT|I\/E|EST)[.\/ ]/i.test(h)?h.toUpperCase():'.'+h.toUpperCase();
const scriptTxt=e=>{const ps=(e.prose||'').split(/\n+/).filter(x=>x.trim()),first=ps.length&&isHd(ps[0]),L=[first?fdHd(ps[0].replace(/^#\s+/,'').trim()):autoHd(e),''];
 if(!ps.length)L.push('('+(e.title||'Untitled')+' — no text yet)');
 ps.forEach((q,i)=>{if(i==0&&first)return;if(isHd(q)){L.push(fdHd(q.replace(/^#\s+/,'').trim()),'');return}if(isTr(q)){L.push('> '+q.replace(/^>\s*/,'').toUpperCase(),'');return}
  const m=dlg(q);if(m){L.push(m[0].toUpperCase());if(m[2])L.push('('+m[2].replace(/^\(|\)$/g,'')+')');L.push(m[1],'')}else L.push(q,'')});return L.join('\n').trim()};
window.scriptTxtOf=e=>e.fin&&e.fin.script!=null?e.fin.script:scriptTxt(e);
// final screenplay text -> plan syntax (lossless for headings, cues, parentheticals, transitions)
function scriptToProse(txt,e){const out=[];let cue=null,par='',first=true;const auto=e?autoHd(e):'';
 scriptBlocks(txt).forEach(([c,t])=>{
  if(c=='sl'){const h=t.replace(/^\./,'').trim();if(!(first&&auto&&h.toUpperCase()==auto.toUpperCase()))out.push('# '+h);first=false;return}first=false;
  if(c=='cu'){cue=t;par='';return}if(c=='pa'){par=t.replace(/^\(|\)$/g,'');return}
  if(c=='dl'){const nm=cue?(S.chars.find(x=>x.name.trim().toLowerCase()==cue.toLowerCase())||{}).name||cue.toLowerCase().replace(/\b\p{L}/gu,y=>y.toUpperCase()):'?';out.push(nm+(par?' ('+par+')':'')+': '+t);par='';return}
  if(c=='tr'){out.push('> '+t);return}out.push(t)});return out.join('\n')}
window.scriptToProse=scriptToProse;
const finTxt=(e,f)=>e.fin&&e.fin[f]!=null?e.fin[f]:(f=='script'?scriptTxt(e):novelParas(e).join('\n\n'));
const isEd=(e,f)=>!!(e.fin&&e.fin[f]!=null);
window.finParas=e=>isEd(e,'book')?e.fin.book.split(/\n+/).filter(x=>x.trim()):novelParas(e);
window.finWords=e=>isEd(e,'book')?e.fin.book:(e.prose||'');
window.finScriptTxt=e=>e.fin.script;
// screenplay text -> blocks (headings, action, character cue, dialogue)
function scriptBlocks(txt){const out=[],Ls=String(txt||'').split('\n'),HD=/^(INT|EXT|I\/E|EST)[.\/ ]/i,isP=l=>/^\(.*\)$/.test(l);
 for(let i=0;i<Ls.length;i++){const l=Ls[i].trim();if(!l)continue;
  if(HD.test(l)||/^\.[\p{L}\d]/u.test(l)){out.push(['sl',l.replace(/^\./,'')]);continue}
  if(/^>\s*\S/.test(l)){out.push(['tr',l.replace(/^>\s*/,'')]);continue}
  if(l==l.toUpperCase()&&/TO:$/.test(l)&&l.length<30){out.push(['tr',l]);continue}
  const prevBlank=i==0||!Ls[i-1].trim(),nx=(Ls[i+1]||'').trim();
  if(prevBlank&&/^[A-Z][A-Z0-9 .'-]{0,28}(\s*\([^)]*\))?$/.test(l)&&l==l.toUpperCase()&&!/[.!?:]$/.test(l.replace(/\([^)]*\)$/,'').trim())&&nx&&!HD.test(nx)&&!/^>/.test(nx)){
   out.push(['cu',l.replace(/\s*\([^)]*\)$/,'')]);const ext=/\(([^)]*)\)$/.exec(l);if(ext)out.push(['pa','('+ext[1]+')']);i++;let d=[];
   while(i<Ls.length&&Ls[i].trim()){const q=Ls[i].trim();if(isP(q)){if(d.length){out.push(['dl',d.join(' ')]);d=[]}out.push(['pa',q])}else d.push(q);i++}
   if(d.length)out.push(['dl',d.join(' ')]);continue}
  out.push(['ac',l])}return out}
window.bookPages=function(){const b=S.bk||{},sc=b.fmt=='script',cap=sc?50:1000,P=[];let cur=[],w=0;
 const nl=()=>{if(cur.length)P.push(cur);cur=[];w=0};
 const add=(c,t,cpl=60,ex=0)=>{const x=(sc?Math.ceil(t.length/cpl)+1:t.length)+ex;if(w+x>cap&&w>0&&x<=cap)nl();
  if(x>cap){const fit=Math.max(20,Math.floor(t.length*(cap-w)/x));let cut=t.lastIndexOf(' ',fit);if(cut<10)cut=fit;cur.push([c,t.slice(0,cut)]);nl();return add(c+' k',t.slice(cut).trim(),cpl)}cur.push([c,t]);w+=x};
 cur.push(['tt',S.title||'Untitled story']);nl();
 bookEv().forEach((e,i)=>{if(sc)scriptBlocks(finTxt(e,'script')).forEach(([c,t])=>add(c,t,c=='cu'?1000:c=='dl'||c=='pa'?34:60));
  else{nl();add('ch','Chapter '+(i+1),60,250);add('ct',e.title||'Untitled',60);const ps=finParas(e);if(!ps.length)add('ph','(No manuscript text yet — click this event on the Journey map and write the scene.)');ps.forEach(q=>add('p',q))}});
 nl();return P};
function ctx(e){const L=[];e.chars.forEach(id=>{const c=S.chars.find(x=>x.id==id);if(!c)return;const f=[['Role',c.role],['Goal',c.goal],['Flaw',c.flaw],['Secret',c.secret]].filter(x=>x[1]).map(x=>`<b>${x[0]}:</b> ${esc(x[1])}`).join(' · ');L.push(`<div><span style="color:${c.color}">●</span> <b>${esc(c.name)}</b> — ${f||'<i>no profile yet</i>'}</div>`)});
 if(e.mood||e.health)L.push(`<div>Scene state: ${esc(e.mood||'')} ${e.health?'· health: '+esc(e.health):''}</div>`);
 const p=typeof plFor=='function'?plFor(e):null;if(p){const f=[p.desc,p.feat].filter(Boolean).join(' · ');if(f)L.push(`<div>📍 <b>${esc(p.name)}</b> — ${esc(f)}</div>`)}
 S.rels.forEach(r=>{if(e.chars.includes(r.a)&&e.chars.includes(r.b)){const v=at(SB(r),e.t,bT);L.push(`<div>💞 ${lbl(r)} — ${esc(typeAt(r,e.t))}${v==null?'':' ('+sg(rnd(v))+')'}</div>`)}});
 return L.join('')||'<small class="mut">No characters tagged on this event.</small>'}
function vEdit(tog){const f=FM(),E=bookEv(),words=E.reduce((a,e)=>a+wcount(finTxt(e,f)),0),goal=+S.goal||0,pct=goal?Math.min(100,Math.round(words/goal*100)):0;
 const empty=E.filter(e=>!wcount(finTxt(e,f))||(!isEd(e,f)&&!(e.prose||'').trim())),used=new Set(S.ev.flatMap(e=>e.chars)),unused=S.chars.filter(c=>!used.has(c.id)),noPl=typeof plFor=='function'?E.filter(e=>(e.place||'').trim()&&!plFor(e)):[],stale=E.filter(e=>isEd(e,f)&&e.fh!==h5(e.prose||''));
 const chk=[...(empty.length?[`${empty.length} chapter${empty.length>1?'s':''} without text: ${empty.slice(0,6).map(e=>esc(e.title||'Untitled')).join(', ')}${empty.length>6?'…':''}`]:[]),...(unused.length?[`Characters not in any event: ${unused.slice(0,8).map(c=>esc(c.name)).join(', ')}${unused.length>8?'…':''}`]:[]),...(noPl.length?[`${noPl.length} chapter${noPl.length>1?'s':''} whose place has no profile: ${[...new Set(noPl.map(e=>esc((e.place||'').trim())))].slice(0,5).join(', ')} (see the Places tab)`]:[]),...(stale.length?[`${stale.length} edited chapter${stale.length>1?'s':''} whose plan text changed afterwards`]:[])];
 return`<div class="pal">${tog}<div class="tg"><button data-a="bk" data-f="book" class="${f=='book'?'on':''}" style="--c:var(--acc)">📖 Novel</button><button data-a="bk" data-f="script" class="${f=='script'?'on':''}" style="--c:var(--acc)">🎬 Screenplay</button></div><span class="sp"></span><small class="mut">${E.length} chapters · ${words} words</small><label style="display:flex;gap:4px;align-items:center;font-size:12px">Goal<input type="number" data-v5="goal" value="${goal||''}" placeholder="words" style="width:90px"></label></div>
 ${goal?`<div class="pbar"><i style="width:${pct}%"></i><span>${pct}% of ${goal} words</span></div>`:''}
 <div class="card" style="margin-bottom:10px"><b>✏ Edit the final text</b><small class="mut">This is the rendered ${f=='script'?'screenplay (character names in CAPS on their own line, then the dialogue)':'novel text'}. Edit it freely — your changes are kept separately and used for the preview, print and every export. The plan on the Journey map is never overwritten unless you choose <i>Use as manuscript text</i>.</small>
 <div class="row" style="margin:6px 0 0"><input data-v5="fr" data-f="f" placeholder="Find" value="${esc(FR.f)}"><input data-v5="fr" data-f="r" placeholder="Replace with" value="${esc(FR.r)}"><label style="display:flex;gap:4px;align-items:center;font-size:12px;flex:none"><input type="checkbox" data-v5="fr" data-f="c" ${FR.c?'checked':''} style="width:auto">Match case</label><button data-v5="frall">Replace all</button><button data-v5="revall">↩ Revert all edits</button><button data-v5="fcs" data-e="">🖋 Focus mode</button><button data-v5="hist">🕘 History (${rdS().length})</button></div>${FR.msg?`<small class="mut">${esc(FR.msg)}</small>`:''}
 ${chk.length?`<details style="margin-top:6px"><summary>📋 Checklist (${chk.length})</summary><ul style="margin:4px 0 0;padding-left:18px">${chk.map(x=>`<li>${x}</li>`).join('')}</ul></details>`:''}</div>
 ${E.map((e,i)=>{const txt=finTxt(e,f),ed=isEd(e,f),sl=ed&&e.fh!==h5(e.prose||''),st=e.st||'Idea',A=`data-e="${e.id}"`;
 return`<div class="card" data-cli="ed:${e.id}" data-cltitle="${esc((i+1)+'. '+(e.title||'Untitled'))}" data-clmeta="${esc(st+' · '+wcount(txt)+(e.wg?' / '+e.wg:'')+' words'+(ed?' · ✎ edited':''))}" style="margin-bottom:10px"><div class="row" style="margin:0"><small style="flex:none;min-width:0">Chapter ${i+1}</small><input data-t="ev" data-id="${e.id}" data-f="title" value="${esc(e.title)}" style="flex:3" aria-label="Chapter title"><input type="number" min="0" data-v5="wg" ${A} value="${e.wg||''}" placeholder="Goal" title="Word goal for this chapter" aria-label="Chapter word goal" style="flex:none;width:84px"><select data-v5="st" ${A} style="flex:1" aria-label="Status">${STS.map(s=>`<option ${s==st?'selected':''}>${s}</option>`).join('')}</select></div>
 ${sl?`<div class="warnb">⚠ The plan text of this event changed after you edited it. <button data-v5="keep" ${A}>Keep my edit</button><button data-v5="regen" ${A}>Regenerate from plan</button></div>`:''}
 <textarea class="ed5 ${f=='script'?'scr':''}" data-v5="fin" ${A} spellcheck="true" rows="${Math.min(30,Math.max(6,txt.split('\n').length+2))}" aria-label="Final text">${esc(txt)}</textarea>
 <div class="row" style="margin:0"><button data-v5="fcs" data-e="${e.id}">🖋 Focus</button><small class="mut wc5" style="flex:none">${wcount(txt)} words${ed?' · ✎ edited':''}</small>${ed?`<button data-v5="rev" ${A}>↩ Revert to generated</button><button data-v5="accept" ${A}>Use as manuscript text</button>`:''}</div>
 ${e.wg?`<div class="pbar" style="height:14px;margin:0"><i style="width:${Math.min(100,Math.round(wcount(txt)/e.wg*100))}%;${wcount(txt)>=e.wg?'':'background:var(--acc)'}"></i><span style="line-height:14px">${wcount(txt)} / ${e.wg} words</span></div>`:''}
 <details><summary>📌 Context for this chapter</summary><div class="ctx5">${ctx(e)}</div></details></div>`}).join('')}`}
const _vBook=window.vBook;
window.vBook=()=>{const b=S.bk=S.bk||{fmt:'book',ord:'time'},tog=`<div class="tg"><button data-v5="bm" data-m="0" class="${b.edit?'':'on'}" style="--c:var(--acc)">👁 Preview</button><button data-v5="bm" data-m="1" class="${b.edit?'on':''}" style="--c:var(--acc)">✏ Edit final</button></div>`;
 if(b.edit)return vEdit(tog);return _vBook().replace('<div class="pal"><small>Render as</small>','<div class="pal">'+tog+'<small>Render as</small>')};

/* =========================================================
   4. EVENT HANDLERS
   ========================================================= */
const ev5=id=>S.ev.find(x=>x.id==id);
document.addEventListener('click',e=>{const t=e.target.closest('[data-v5]');if(!t||t.tagName!='BUTTON')return;const d=t.dataset,k=d.v5,r=relOf(d.r),f=FM();e.stopPropagation();
 if(k=='ta'||k=='tb'){const o=ar(),s=k[1],c=d.c;o[s]=o[s].includes(c)?o[s].filter(x=>x!=c):[...o[s],c]}
 else if(k=='sg'){const o=ar(),m=o[d.s];if(!m.length){SFX.notice('Select at least one character on that side first.');return}const n=prompt('Name this group',(o[d.s].length>1?'Group':ch(m[0]).name+"'s circle"));if(!n)return;S.grps.push({id:uid(),name:n.trim(),m:[...m]})}
 else if(k=='mk')S.rels.push({id:uid(),a:d.x,b:d.y,type:'Friend',note:''});
 else if(k=='badd'&&r){const L=SB(r),last=L[L.length-1],c=cand(r),ev=last?(c.find(x=>x.t>bT(last))||c[0]):c[0],sp=span(r);B(r).push({id:uid(),ev:ev?ev.id:'',t:ev?ev.t:(last?bT(last)+(sp[1]-sp[0])/10:sp[0]),v:last?last.v:(TV[r.type]??0),type:last?last.type:r.type,note:''})}
 else if(k=='bdel'&&r)r.bt=B(r).filter(b=>b.id!=d.b);
 else if(k=='seed'&&r){cand(r).forEach(ev=>{const prev=SB(r).filter(b=>bT(b)<ev.t).pop();B(r).push({id:uid(),ev:ev.id,t:ev.t,v:prev?prev.v:(TV[r.type]??0),type:prev?prev.type:r.type,note:''})})}
 else if(k=='tadd'&&r){const L=ST(r),last=L[L.length-1],sp=span(r);T(r).push({id:uid(),t:last?+(last.t+(sp[1]-sp[0])/6).toFixed(6):sp[0],v:last?last.v:(TV[r.type]??0)})}
 else if(k=='tdel'&&r)r.tg=T(r).filter(x=>x.id!=d.b);
 else if(k=='tclr'&&r){if(!confirm('Remove the whole intended arc for this relationship?'))return;r.tg=[];delete r.tgn}
 else if(k=='cla'){$$('#app [data-cl]').forEach(h=>UI.cl[h.dataset.cl]=+d.m);uis();applyCl();return}
 else if(k=='more'){UI.tg[d.k]=UI.tg[d.k]?0:1;uis();applyCl();return}
 else if(k=='bm'){S.bk=S.bk||{};S.bk.edit=+d.m}
 else if(k=='frall'){if(!FR.f){FR.msg='Type the text to find first.'}else{const re=new RegExp(FR.f.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),FR.c?'g':'gi');let n=0,sn=0;bookEv().forEach(ev=>{const x=finTxt(ev,f),m=x.match(re);if(!m)return;n+=m.length;if(!sn){snapNow('Before replace “'+FR.f+'”');sn=1}ev.fin=ev.fin||{};ev.fin[f]=x.replace(re,()=>FR.r);ev.fh=h5(ev.prose||'')});FR.msg=n?`Replaced ${n} occurrence${n>1?'s':''}.`:'No matches found.'}}
 else if(k=='revall'){const n=S.ev.filter(x=>isEd(x,f)).length;if(!n)return;if(!confirm(`Discard your edits in ${n} chapter${n>1?'s':''} and go back to the generated text?`))return;snapNow('Before reverting all edits');S.ev.forEach(x=>{if(x.fin){delete x.fin[f];if(!Object.keys(x.fin).length)delete x.fin}})}
 else if(['rev','accept','keep','regen'].includes(k)){const ev=ev5(d.e);if(!ev)return;
  if(k=='keep')ev.fh=h5(ev.prose||'');
  else if(k=='rev'||k=='regen'){if(!confirm('Discard your edits to this chapter and regenerate it from the plan?'))return;snapNow('Before regenerating a chapter');if(ev.fin){delete ev.fin[f];if(!Object.keys(ev.fin).length)delete ev.fin}}
  else{if(!confirm('Replace this event’s Manuscript text (the plan) with the edited text? The Journey map event will change.'+(f=='script'?'\n\nScene headings, character cues, parentheticals and transitions are kept using the plan syntax (# heading, Name (paren): line, > transition).':'')))return;snapNow('Before using edit as manuscript text');const x=ev.fin[f];
   if(f=='script')ev.prose=scriptToProse(x,ev);else ev.prose=x;
   delete ev.fin[f];if(!Object.keys(ev.fin).length)delete ev.fin}}
 else return;
 render()},true);
document.addEventListener('input',e=>{const t=e.target,d=t.dataset;if(!d||!d.v5)return;const k=d.v5,r=relOf(d.r);
 if(k=='flt'){FLT[S.tab]=t.value;applyCl();return}
 if(k=='fr'){if(d.f!='c')FR[d.f]=t.value;return}
 if(k=='goal'){S.goal=+t.value||0;save();return}
 if(k=='fin'){const ev=ev5(d.e);if(!ev)return;const f=FM();maybeAuto();ev.fin=ev.fin||{};ev.fin[f]=t.value;ev.fh=h5(ev.prose||'');save();autosize(t);const c=t.closest('.card'),w=wcount(t.value);const s=c&&c.querySelector('.wc5');if(s)s.textContent=w+' words · ✎ edited';if(c){c.dataset.clmeta=(ev.st||'Idea')+' · '+w+(ev.wg?' / '+ev.wg:'')+' words · ✎ edited';const m=c.querySelector(':scope>.clh .m');if(m)m.textContent=c.dataset.clmeta}return}
 if(k=='bn'){const b=beatOf(r,d.b);if(b){b.note=t.value;save()}return}
 if(k=='tl'){const b=tgOf(r,d.b);if(b){b.l=t.value;refreshViz();save()}return}
 if(k=='bv'||k=='tv'){const b=k=='bv'?beatOf(r,d.b):tgOf(r,d.b);if(!b)return;b.v=cl5(t.value);const l=t.parentNode.querySelector('.vv');if(l)l.textContent=sg(b.v);refreshViz();updMeta(r);save()}},true);
document.addEventListener('change',e=>{const t=e.target,d=t.dataset;if(!d||!d.v5)return;const k=d.v5,r=relOf(d.r),v=t.value;
 if(k=='be'){const b=beatOf(r,d.b);if(!b)return;if(v){const ev=ev5(v);b.ev=v;if(ev)b.t=ev.t}else{b.t=bT(b);b.ev=''}}
 else if(k=='bt'){const b=beatOf(r,d.b);if(b){b.t=+v||0;b.ev=''}}
 else if(k=='bty'){const b=beatOf(r,d.b);if(b){if(b.v==(TV[b.type]??0))b.v=TV[v]??b.v;b.type=v}}
 else if(k=='tt'){const b=tgOf(r,d.b);if(b)b.t=+v||0}
 else if(k=='te'){const b=tgOf(r,d.b),ev=ev5(v);if(b&&ev)b.t=ev.t}
 else if(k=='gl'&&v){const g=S.grps.find(x=>x.id==v);if(g)ar()[d.s]=[...g.m]}
 else if(k=='gd'&&v){if(!confirm('Delete this group? (Characters are not affected.)'))return;S.grps=S.grps.filter(x=>x.id!=v)}
 else if(k=='st'){const ev=ev5(d.e);if(ev)ev.st=v}
 else if(k=='wg'){const ev=ev5(d.e);if(ev){const n=Math.max(0,Math.round(+v||0));if(n)ev.wg=n;else delete ev.wg}}
 else if(k=='fr'){if(d.f=='c')FR.c=t.checked;return}
 else if(k!='goal')return;
 else return;
 render()},true);

/* =========================================================
   6. FOCUS WRITING VIEW + SNAPSHOTS (version history)
   Snapshots live in localStorage key  sf-snaps-<storyKey>  (kept out of the story JSON / undo stack)
   ========================================================= */
const SK=()=>'sf-snaps-'+KEY;
const rdS=()=>{try{const a=JSON.parse(localStorage.getItem(SK()));return Array.isArray(a)?a:[]}catch(e){return[]}};
const wrS=a=>{try{localStorage.setItem(SK(),JSON.stringify(a));return true}catch(e){return false}};
const chapSnap=()=>S.ev.map(e=>({id:e.id,ti:e.title||'',pr:e.prose||'',fi:e.fin?JSON.parse(JSON.stringify(e.fin)):null,fh:e.fh||'',st:e.st||'',pl:e.place||'',t:e.t}));
const asEv=c=>({id:c.id,title:c.ti,prose:c.pr,fin:c.fi,place:c.pl,t:c.t,fh:c.fh});
const sigS=c=>h5(JSON.stringify(c.map(x=>[x.id,x.ti,x.pr,x.fi])));
const snName=x=>x.n||(x.auto?'Auto-save':'Snapshot');
const lines5=t=>String(t||'').split('\n').map(x=>x.trim()).filter(Boolean);
let LA=0;
function mkSnap(name,auto){const c=chapSnap(),sig=sigS(c);let a=rdS();if(auto&&a.length&&a[0].sg==sig)return null;
 const n={id:uid(),ts:Date.now(),n:name||'',auto:!!auto,sg:sig,c};a.unshift(n);
 a.filter(x=>x.auto).slice(12).forEach(x=>a.splice(a.indexOf(x),1));
 while(a.length>40){let i=a.map(x=>x.auto).lastIndexOf(true);if(i<0)i=a.length-1;a.splice(i,1)}
 if(!wrS(a)){a=a.filter(x=>!x.auto||x===n);if(!wrS(a)){warn('⚠ Not enough browser storage for a snapshot. Use Export to keep a copy.');return null}}
 return n}
const snapNow=name=>mkSnap(name,true);
const maybeAuto=()=>{if(Date.now()-LA>6e5){LA=Date.now();mkSnap('Auto-save',true)}};
const toast=m=>{const el=document.getElementById('sv5');if(el)el.textContent=m;const f=document.getElementById('fmsg');if(f){f.textContent=m;setTimeout(()=>{if(f.textContent==m)f.textContent=''},2500)}};
function applyEntry(c,ev){ev.title=c.ti;ev.prose=c.pr;if(c.fi)ev.fin=JSON.parse(JSON.stringify(c.fi));else delete ev.fin;if(c.fh)ev.fh=c.fh;else delete ev.fh;if(c.st)ev.st=c.st;else delete ev.st}
function ldiff(A,B){const n=A.length,m=B.length,L=Array.from({length:n+1},()=>new Int32Array(m+1));for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)L[i][j]=A[i]==B[j]?L[i+1][j+1]+1:Math.max(L[i+1][j],L[i][j+1]);
 const o=[];let i=0,j=0;while(i<n&&j<m){if(A[i]==B[j]){o.push([' ',A[i]]);i++;j++}else if(L[i+1][j]>=L[i][j+1])o.push(['-',A[i++]]);else o.push(['+',B[j++]])}while(i<n)o.push(['-',A[i++]]);while(j<m)o.push(['+',B[j++]]);return o}
let HV={v:'list',sid:null,eid:null};
function histHtml(){const f=FM(),a=rdS(),cur=bookEv(),curW=cur.reduce((x,e)=>x+wcount(finTxt(e,f)),0),sn=a.find(x=>x.id==HV.sid),
 head=(t,back)=>`<div id="hist5" class="row"><h3 style="flex:3">${t}</h3>${back?`<button data-v5="sback" data-m="${back}">‹ Back</button>`:''}<button data-a="cd">Close</button></div>`;
 if(HV.v!='list'&&!sn)HV.v='list';
 if(HV.v=='diff'){const e=S.ev.find(x=>x.id==HV.eid),c=sn.c.find(x=>x.id==HV.eid);if(e&&c){const D=ldiff(lines5(finTxt(asEv(c),f)),lines5(finTxt(e,f))),keep=D.map((x,i)=>x[0]!=' '||(D[i-1]&&D[i-1][0]!=' ')||(D[i+1]&&D[i+1][0]!=' '));let out='',gap=0;
  D.forEach(([k,t],i)=>{if(!keep[i]){gap++;return}if(gap){out+=`<div class="df gp">… ${gap} unchanged paragraph${gap>1?'s':''}</div>`;gap=0}out+=`<div class="df ${k=='-'?'dd':k=='+'?'da':''}">${k=='-'?'− ':k=='+'?'+ ':''}${esc(t)}</div>`});if(gap)out+=`<div class="df gp">… ${gap} unchanged paragraph${gap>1?'s':''}</div>`;
  return head('Changes · '+esc(e.title||'Untitled'),'cmp')+`<small class="mut">Compared with “${esc(snName(sn))}”. <b class="dfd">red</b> = only in the snapshot · <b class="dfa">green</b> = only in your current text.</small><div class="dfw">${out||'<small class="mut">No differences.</small>'}</div><div class="row"><button class="pri" data-v5="srestc" data-s="${sn.id}" data-e="${e.id}">↩ Restore this chapter from the snapshot</button></div>`}HV.v='cmp'}
 if(HV.v=='cmp'){const gone=sn.c.filter(c=>!S.ev.some(e=>e.id==c.id));let nch=0;
  const rows=cur.map((e,i)=>{const c=sn.c.find(x=>x.id==e.id);if(!c)return`<div class="card"><b>${i+1}. ${esc(e.title||'Untitled')}</b><small class="mut">new since this snapshot</small></div>`;
   const x=finTxt(asEv(c),f),y=finTxt(e,f),chg=x!==y||c.ti!==(e.title||'');if(!chg)return'';nch++;const dw=wcount(y)-wcount(x);
   return`<div class="card"><b>${i+1}. ${esc(e.title||'Untitled')}</b><small class="mut">changed · ${dw>=0?'+':''}${dw} words now vs then</small><div class="row" style="margin:0"><button data-v5="sdiff" data-s="${sn.id}" data-e="${e.id}">View changes</button><button data-v5="srestc" data-s="${sn.id}" data-e="${e.id}">↩ Restore chapter</button></div></div>`}).join('');
  return head('Compare · '+esc(snName(sn)),'list')+`<small class="mut">${esc(new Date(sn.ts).toLocaleString())} · ${nch} of ${cur.length} chapters differ from now</small><div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">${rows||'<small class="mut">Identical to the current text.</small>'}${gone.length?`<small class="mut">${gone.length} chapter${gone.length>1?'s':''} existed then but were deleted since (${gone.slice(0,4).map(c=>esc(c.ti||'Untitled')).join(', ')}) — restoring skips them.</small>`:''}</div><div class="row" style="margin-top:10px"><button class="pri" data-v5="srest" data-s="${sn.id}">↩ Restore the whole manuscript</button></div>`}
 return head('🕘 History')+`<p class="mut" style="font-size:12px;margin:0 0 8px">A snapshot stores every chapter (plan text + your edited final text). Snapshots are also taken automatically every ~10 minutes of writing and before risky actions (replace all, revert, restore). Up to 40 are kept; auto-saves are pruned first. Ctrl/⌘+S saves one. They live in this browser (and the server copy, if running) and are not part of the exported story JSON.</p><div class="row"><input id="snn" placeholder="Name this version (optional)"><button class="pri" data-v5="snew">💾 Save snapshot</button></div>`+
 (a.map(x=>{const w=x.c.reduce((q,c)=>q+wcount(finTxt(asEv(c),f)),0),dw=curW-w;return`<div class="card" style="margin-bottom:8px"><b>${x.auto?'⏱ ':'💾 '}${esc(snName(x))}</b><small class="mut">${esc(new Date(x.ts).toLocaleString())} · ${w} words${dw?` · now ${dw>0?'+':''}${dw}`:' · same length as now'}</small><div class="row" style="margin:0"><button data-v5="scmp" data-s="${x.id}">Compare</button><button data-v5="srest" data-s="${x.id}">↩ Restore all</button><button data-v5="sdel" data-s="${x.id}" aria-label="Delete snapshot">🗑</button></div></div>`}).join('')||'<small class="mut">No snapshots yet.</small>')}
function openHist(){const d=$('#dr');d.style.width='min(600px,100%)';drawer=null;HV={v:'list',sid:null,eid:null};d.innerHTML=histHtml();d.classList.add('open')}
const reHist=()=>{const d=$('#dr');if(d.classList.contains('open')&&d.querySelector('#hist5'))d.innerHTML=histHtml()};
/* ---- focus view ---- */
let FOC=null;
const fWords=()=>bookEv().reduce((a,e)=>a+wcount(finTxt(e,FM())),0);
function fcount(){const t=document.getElementById('focta'),c=document.getElementById('fcnt');if(!t||!c)return;const n=wcount(t.value),d=FOC.others+n-FOC.w0;c.textContent=`${n} words in this chapter · ${d>=0?'+':''}${d} this session`}
function drawFocus(){const f=FM(),E=bookEv(),i=Math.max(0,E.findIndex(x=>x.id==FOC.id)),e=E[i];if(!e)return closeFocus();FOC.id=e.id;UI.lf=e.id;uis();
 let o=document.getElementById('foc');if(!o){o=document.createElement('div');o.id='foc';document.body.appendChild(o);document.body.classList.add('focus5')}
 o.className=(FOC.ctx?'wctx ':'')+(f=='script'?'scr':'');const txt=finTxt(e,f);FOC.others=E.reduce((a,x)=>a+(x.id==e.id?0:wcount(finTxt(x,f))),0);if(FOC.w0==null)FOC.w0=FOC.others+wcount(txt);
 o.innerHTML=`<div class="fbar"><button data-v5="fnav" data-d="-1" ${i?'':'disabled'} aria-label="Previous chapter">‹</button><small>${i+1} / ${E.length}</small><button data-v5="fnav" data-d="1" ${i<E.length-1?'':'disabled'} aria-label="Next chapter">›</button><input data-v5="ftitle" value="${esc(e.title)}" placeholder="Chapter title" aria-label="Chapter title"><span class="sp"></span><button data-v5="fsz" data-d="-1" aria-label="Smaller text">A−</button><button data-v5="fsz" data-d="1" aria-label="Larger text">A+</button><button data-v5="fctxb" class="${FOC.ctx?'on':''}">📌 Context</button><button data-v5="fsnap">💾 Snapshot</button><button data-v5="fhist" aria-label="History">🕘</button><button data-v5="ffs" aria-label="Full screen">⛶</button><button data-v5="fx" class="pri">Done</button></div>
 <div class="fbody"><textarea id="focta" data-v5="ftxt" spellcheck="true" placeholder="Start writing…" style="font-size:${UI.fz||19}px">${esc(txt)}</textarea><aside class="fctx"><b>Chapter context</b>${ctx(e)}</aside></div><div class="fft"><span id="fcnt"></span><span id="fmsg"></span><span>Esc = done · Alt+←/→ = chapter · Ctrl+S = snapshot</span></div>`;
 fcount();const t=document.getElementById('focta');t.focus();t.setSelectionRange(t.value.length,t.value.length);t.scrollTop=t.scrollHeight}
function openFocus(id){const E=bookEv();if(!E.length){SFX.notice('Add an event on the Journey map first — each event becomes a chapter.');return}
 FOC=FOC||{};if(!FOC.id||id){FOC.id=id||(E.find(x=>x.id==UI.lf)||E[0]).id}FOC.w0=null;drawFocus()}
function closeFocus(){const o=document.getElementById('foc');if(o)o.remove();document.body.classList.remove('focus5');FOC=null;if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});render()}
const afterH=()=>{reHist();if(FOC)drawFocus()};
document.addEventListener('click',e=>{const t=e.target.closest('[data-v5]');if(!t||t.tagName!='BUTTON')return;const d=t.dataset,k=d.v5;
 if(!['fcs','fx','fnav','fsz','fctxb','fsnap','fhist','ffs','hist','snew','scmp','sdiff','srest','srestc','sdel','sback'].includes(k))return;e.stopPropagation();
 const fin=()=>{const n=FOC&&FOC.id;if(n)FOC.id=n};
 if(k=='fcs')return openFocus(d.e);
 if(k=='fx')return closeFocus();
 if(k=='fnav'){const E=bookEv(),i=E.findIndex(x=>x.id==FOC.id)+ +d.d;if(E[i]){FOC.id=E[i].id;drawFocus()}return}
 if(k=='fsz'){UI.fz=Math.max(13,Math.min(34,(UI.fz||19)+ +d.d*2));uis();const ta=document.getElementById('focta');if(ta)ta.style.fontSize=UI.fz+'px';return}
 if(k=='fctxb'){FOC.ctx=!FOC.ctx;const o=document.getElementById('foc');o.classList.toggle('wctx',!!FOC.ctx);t.classList.toggle('on',!!FOC.ctx);return}
 if(k=='ffs'){document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen().catch(()=>{});return}
 if(k=='fsnap'){const n=prompt('Name this version (optional)','');if(n===null)return;toast(mkSnap(n.trim(),false)?'✓ Snapshot saved':'Not saved');return}
 if(k=='fhist'||k=='hist')return openHist();
 if(k=='snew'){const i=document.getElementById('snn');mkSnap(i?i.value.trim():'',false);HV={v:'list'};return afterH()}
 if(k=='scmp'){HV={v:'cmp',sid:d.s};return reHist()}
 if(k=='sdiff'){HV={v:'diff',sid:d.s,eid:d.e};return reHist()}
 if(k=='sback'){HV.v=d.m;return reHist()}
 const sn=rdS().find(x=>x.id==d.s);if(!sn)return reHist();
 if(k=='sdel'){if(!confirm('Delete this snapshot?'))return;wrS(rdS().filter(x=>x.id!=d.s));return afterH()}
 if(k=='srestc'){const ev=S.ev.find(x=>x.id==d.e),c=sn.c.find(x=>x.id==d.e);if(!ev||!c)return;if(!confirm('Replace this chapter with the version from “'+snName(sn)+'”? (Your current text is snapshotted first.)'))return;snapNow('Before restoring a chapter');applyEntry(c,ev);HV={v:'cmp',sid:d.s};render();return afterH()}
 if(k=='srest'){if(!confirm('Restore every chapter to “'+snName(sn)+'”? (Your current text is snapshotted first.)'))return;snapNow('Before restoring “'+snName(sn)+'”');let skip=0;sn.c.forEach(c=>{const ev=S.ev.find(x=>x.id==c.id);if(ev)applyEntry(c,ev);else skip++});if(skip)SFX.notice(skip+' chapter(s) no longer exist and were skipped.');HV={v:'list'};render();afterH()}},true);
document.addEventListener('input',e=>{const t=e.target,k=t.dataset&&t.dataset.v5;if(k!='ftxt'&&k!='ftitle')return;const ev=S.ev.find(x=>x.id==FOC.id);if(!ev)return;
 if(k=='ftitle'){ev.title=t.value;save();return}
 maybeAuto();const f=FM();ev.fin=ev.fin||{};ev.fin[f]=t.value;ev.fh=h5(ev.prose||'');save();fcount();const o=document.getElementById('foc');o.classList.add('typing')},true);
document.addEventListener('mousemove',()=>{const o=document.getElementById('foc');if(o&&o.classList.contains('typing'))o.classList.remove('typing')});
document.addEventListener('keydown',e=>{const k=(e.key||'').toLowerCase();
 if((e.ctrlKey||e.metaKey)&&k=='s'&&(FOC||document.querySelector('.ed5'))){e.preventDefault();toast(mkSnap('',false)?'✓ Snapshot saved':'Not saved');return}
 if(!FOC)return;
 if(e.key=='Escape'&&!$('#dr.open')){e.preventDefault();closeFocus()}
 else if(e.altKey&&(e.key=='ArrowRight'||e.key=='ArrowLeft')){e.preventDefault();const b=document.querySelector(`#foc [data-v5=fnav][data-d="${e.key=='ArrowRight'?1:-1}"]`);if(b&&!b.disabled)b.click()}},true);

/* =========================================================
   7. GENRE ARC TEMPLATES (browser drawer, apply, save your own)
   ========================================================= */
let TG5='';
const spark=p=>{const X=q=>2+q*116,Y=v=>3+(5-v)/10*34;return`<svg viewBox="0 0 120 40" width="120" height="40" aria-hidden="true"><line x1="2" x2="118" y1="${Y(0)}" y2="${Y(0)}" style="stroke:var(--line);stroke-dasharray:3 3"/><polyline fill="none" style="stroke:var(--acc);stroke-width:2" stroke-linejoin="round" points="${p.map(q=>X(q[0]).toFixed(1)+','+Y(q[1]).toFixed(1)).join(' ')}"/>${p.map(q=>`<circle cx="${X(q[0])}" cy="${Y(q[1])}" r="2.4" style="fill:var(--acc)"/>`).join('')}</svg>`};
function tplHtml(rid){const r=relOf(rid);if(!r)return'';const L=allT(),genres=[...new Set(L.map(x=>x.g))];if(TG5&&!genres.includes(TG5))TG5='';
 return`<div id="tpl5" data-r="${rid}"><div class="row"><h3 style="flex:3">🎭 Genre arc templates</h3><button data-a="cd">Close</button></div>
 <p class="mut" style="font-size:12px;margin:0 0 8px">For <b>${lbl(r)}</b>. A template becomes your <i>intended arc</i> — its beats are stretched across the events these two share. Edit the points afterwards, or compare it with what you actually wrote.</p>
 <div class="tg" style="margin-bottom:10px"><button data-v5="tgf" data-g="" class="${TG5?'':'on'}">All</button>${genres.map(g=>`<button data-v5="tgf" data-g="${esc(g)}" class="${TG5==g?'on':''}">${esc(g)}</button>`).join('')}</div>
 ${genres.filter(g=>!TG5||g==TG5).map(g=>`<h4 style="margin:12px 0 6px">${esc(g)}</h4>${L.map((x,i)=>[x,i]).filter(([x])=>x.g==g).map(([x,i])=>`<div class="card" style="margin-bottom:8px"><div class="row" style="margin:0;flex-wrap:nowrap"><div style="flex:none;min-width:0">${spark(x.p)}</div><div style="flex:1"><b>${esc(x.n)}</b><small class="mut">${esc(x.d||'')}</small></div></div>${x.p.some(q=>q[2])?`<small class="mut">${x.p.filter(q=>q[2]).map(q=>esc(q[2])).join(' → ')}</small>`:''}<div class="row" style="margin:0"><button class="pri" data-v5="tuse" data-i="${i}">Use for this relationship</button>${x.g=='My templates'?`<button data-v5="tdelc" data-i="${i-BUILT.length}" aria-label="Delete template">🗑</button>`:''}</div></div>`).join('')}`).join('')}</div>`}
function openTpl(rid){const d=$('#dr');d.style.width='min(560px,100%)';drawer=null;d.innerHTML=tplHtml(rid);d.classList.add('open')}
document.addEventListener('click',e=>{const t=e.target.closest('[data-v5]');if(!t||t.tagName!='BUTTON')return;const d=t.dataset,k=d.v5;if(!['tpl','tgf','tuse','tsave','tdelc'].includes(k))return;e.stopPropagation();
 const box=t.closest('#tpl5'),rid=box?box.dataset.r:d.r,r=relOf(rid);if(!r)return;
 if(k=='tpl')return openTpl(rid);
 if(k=='tgf'){TG5=d.g;return openTpl(rid)}
 if(k=='tuse'){const x=allT()[+d.i];if(!x)return;if(T(r).length&&!confirm('Replace the current intended arc of '+ch(r.a).name+' ↔ '+ch(r.b).name+' with “'+x.n+'”?'))return;
  const sp=span(r);r.tg=x.p.map(([p,v,l])=>({id:uid(),t:+(sp[0]+(sp[1]-sp[0])*p).toFixed(6),v,l:l||''}));r.tgn={g:x.g,n:x.n};$('#dr').classList.remove('open');render();return}
 if(k=='tsave'){const L=ST(r);if(L.length<2){SFX.notice('Add at least two points first.');return}const n=prompt('Name your template',(r.tgn?r.tgn.n+' (mine)':''));if(!n||!n.trim())return;const sp=span(r),w=(sp[1]-sp[0])||1;
  UI.ct=UI.ct||[];UI.ct.push({n:n.trim(),d:'Saved from '+ch(r.a).name+' ↔ '+ch(r.b).name,p:L.map(x=>[Math.max(0,Math.min(1,+((x.t-sp[0])/w).toFixed(3))),x.v,x.l||''])});uis();r.tgn={g:'My templates',n:n.trim()};save();render();toast('✓ Template saved — find it under “My templates”');return}
 if(k=='tdelc'){if(!confirm('Delete this saved template?'))return;UI.ct.splice(+d.i,1);uis();openTpl(rid)}},true);

/* =========================================================
   8. BACKUP HISTORY (rotating) · EXPORT / IMPORT WHOLE LIBRARY
   ========================================================= */
const BK=k=>'sf-baks-'+k,rdB=k=>{try{const a=JSON.parse(localStorage.getItem(BK(k)));return Array.isArray(a)?a:[]}catch(e){return[]}};
window.rotateBak=(k,j,why)=>{let a=rdB(k);if(a[0]&&a[0].j===j)return;a.unshift({ts:Date.now(),why:why||'',j});let tot=0;a=a.filter((x,i)=>{tot+=x.j.length;return i<1||(i<8&&tot<1.5e6)});try{localStorage.setItem(BK(k),JSON.stringify(a))}catch(e){}};
window.openBackups=function(){const d=$('#dr');d.style.width='min(520px,100%)';drawer=null;let a=rdB(KEY);
 if(!a.length){try{const j=localStorage.getItem('sf-bak-'+KEY);if(j)a=[{ts:0,why:'last automatic backup',j}]}catch(e){}}
 const info=x=>{try{const o=JSON.parse(x.j);return{t:o.title||'Untitled',w:(o.ev||[]).reduce((n,e)=>n+wcount(e.prose),0),n:(o.ev||[]).length}}catch(e){return{t:'?',w:0,n:0}}};
 d.innerHTML=`<div class="row"><h3 style="flex:3">🕘 Backup history</h3><button data-a="cd">Close</button></div><p class="mut" style="font-size:12px;margin:0 0 8px">A full copy of this story is kept every ~5 minutes while you work, before sync conflicts are resolved and before a restore. The newest 8 are kept (older ones rotate out).</p><div class="row"><button class="pri" data-v5="bknow">💾 Back up now</button></div>`+
 (a.map((x,i)=>{const f=info(x);return`<div class="card" style="margin-bottom:8px"><b>${esc(f.t)}</b><small class="mut">${x.ts?esc(new Date(x.ts).toLocaleString()):'time unknown'} · ${f.n} events · ${f.w} words${x.why?' · '+esc(x.why):''}</small><div class="row" style="margin:0"><button data-v5="bkrest" data-i="${i}">↩ Restore</button><button data-v5="bkdl" data-i="${i}">⬇ Download</button><button data-v5="bkdel" data-i="${i}" aria-label="Delete backup">🗑</button></div></div>`}).join('')||'<small class="mut">No backups yet.</small>');d.classList.add('open')};
function exportAll(){flush();const stories={},snaps={};LIB().forEach(id=>{const o=id==KEY?S:ld(id);if(o)stories[id]=o;try{const sn=localStorage.getItem('sf-snaps-'+id);if(sn)snaps[id]=JSON.parse(sn)}catch(e){}});
 dl(JSON.stringify({format:'kathakaar-library',v:1,exported:new Date().toISOString(),lib:Object.keys(stories),stories,snaps,templates:UI.ct||[]},null,1),'kathakaar-library-'+new Date().toISOString().slice(0,10)+'.json','application/json')}
function importAll(){const f=$('#fi');f.onchange=()=>{const file=f.files[0];f.value='';if(!file)return;file.text().then(t=>{let j;try{j=JSON.parse(t)}catch(e){return SFX.notice('That is not a valid JSON file.')}
  if(!j||!['kathakaar-library','storyflow-library'].includes(j.format)||!j.stories||typeof j.stories!='object')return SFX.notice('This is not a Kathakaar library export. (Use “Import JSON” for a single story.)');
  const lib=LIB();let added=0,same=0,bad=0;
  Object.entries(j.stories).forEach(([id,st])=>{const v=SCHEMA.validate(st);if(v.errors.length){bad++;return}const o=norm(st);if(!o){bad++;return}const cur=lib.includes(id)?(id==KEY?S:ld(id)):null;
   if(cur&&JSON.stringify(norm(JSON.parse(JSON.stringify(cur))))==JSON.stringify(o)){same++;return}
   const nid=cur?'s'+uid():id;if(cur)o.title=(o.title||'Untitled')+' (imported)';try{localStorage.setItem(nid,JSON.stringify(o))}catch(e){bad++;return}
   if(!lib.includes(nid))lib.push(nid);if(j.snaps&&Array.isArray(j.snaps[id]))try{localStorage.setItem('sf-snaps-'+nid,JSON.stringify(j.snaps[id]))}catch(e){}added++});
  setLib(lib);if(Array.isArray(j.templates)&&j.templates.length){UI.ct=UI.ct||[];j.templates.forEach(x=>{if(x&&x.n&&Array.isArray(x.p)&&!UI.ct.some(y=>y.n==x.n))UI.ct.push(x)});uis()}
  SFX.notice(`Imported ${added} stor${added==1?'y':'ies'}${same?`, ${same} already identical`:''}${bad?`, ${bad} skipped (invalid or storage full)`:''}. Existing stories were never overwritten.`);openLib()})};f.click()}
const _openLib=window.openLib;window.openLib=function(){_openLib();const b=$('#dr [data-a="si"]');if(b)b.insertAdjacentHTML('afterend','<button data-v5="expall">⬇ Export all</button><button data-v5="impall">⬆ Import all</button>')};
document.addEventListener('click',e=>{const t=e.target.closest('[data-v5]');if(!t||t.tagName!='BUTTON')return;const d=t.dataset,k=d.v5;if(!['expall','impall','bknow','bkrest','bkdl','bkdel'].includes(k))return;e.stopPropagation();
 if(k=='expall')return exportAll();if(k=='impall')return importAll();
 if(k=='bknow'){flush();rotateBak(KEY,JSON.stringify(S),'manual');return openBackups()}
 const a=rdB(KEY),x=a[+d.i]||(k!='bknow'&&!a.length?{ts:0,j:localStorage.getItem('sf-bak-'+KEY)}:null);if(!x||!x.j)return;
 if(k=='bkdl')return dl(x.j,(JSON.parse(x.j).title||'story')+' backup.json','application/json');
 if(k=='bkdel'){if(!confirm('Delete this backup?'))return;a.splice(+d.i,1);try{localStorage.setItem(BK(KEY),JSON.stringify(a))}catch(e){}return openBackups()}
 if(k=='bkrest'){let b=null;try{b=norm(JSON.parse(x.j))}catch(e){}if(!b)return SFX.notice('This backup is damaged.');if(!confirm('Replace the current story with this backup? (The current version is backed up first.)'))return;flush();rotateBak(KEY,JSON.stringify(S),'before restoring a backup');S=b;drawer=null;$('#dr').classList.remove('open');render()}},true);

/* =========================================================
   5. EXPORT, DOCS, SAVE INDICATOR
   ========================================================= */
const _toMD=window.toMD;
window.toMD=function(){let m=_toMD();const R=S.rels.filter(r=>B(r).length||T(r).length);if(!R.length)return m;
 return m+'\n\n## Relationship arcs\n'+R.map(r=>`\n### ${ch(r.a).name} ↔ ${ch(r.b).name} (${r.type})\n`+SB(r).map(b=>`- ${fullT(bT(b))} — ${b.type} ${sg(b.v)}${b.note?': '+b.note:''}`).join('\n')+(T(r).length?'\n- _Intended:_ '+ST(r).map(x=>`${fullT(x.t)} ${sg(x.v)}`).join(' → '):'')).join('\n')+'\n'};

{const q=$('header #q');if(q&&!$('#sv5'))q.insertAdjacentHTML('beforebegin','<span id="sv5" aria-live="polite" style="font-size:11px;color:var(--mut);white-space:nowrap"></span><button id="rc5" hidden style="font-size:11px;padding:2px 8px">↻ Reconnect</button>');
 const sv=()=>document.getElementById('sv5'),rc=()=>document.getElementById('rc5'),SM={offline:'⚠ Server unreachable — saved locally, retrying',auth:'🔒 Server needs an access token',local:'',online:''};
 let last='';const say5=t=>{last=t;const e=sv();if(e)e.textContent=t};
 addEventListener('sf:write',e=>{if(e.detail&&e.detail.k===KEY)say5('✓ Saved '+new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}))});
 addEventListener('sf:sync',e=>{const st=e.detail,r=rc();if(r)r.hidden=!(st=='offline'||st=='auth');if(SM[st])say5(SM[st]);else if(st=='online'&&/^⚠|^🔒/.test(last))say5('✓ Server connected')});
 document.addEventListener('click',e=>{if(e.target.id=='rc5'&&window.SFSYNC){e.target.disabled=true;SFSYNC.retry().then(ok=>{e.target.disabled=false;if(!ok)say5(SM[SFSYNC.status]||'')})}});
 if(window.SFSYNC&&(SFSYNC.status=='offline'||SFSYNC.status=='auth')){say5(SM[SFSYNC.status]);const r=rc();if(r)r.hidden=false}}
document.head.insertAdjacentHTML('beforeend',`<style>
.cl>.clh{display:flex;gap:8px;align-items:center;cursor:pointer;user-select:none}.cl>.clh .t{display:none}.cl.cc>.clh .t{display:inline}.clh .m{color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.chv::before{content:"▾";color:var(--mut);display:inline-block;width:14px}.cc>.clh .chv::before,h4.clg.cc .chv::before{content:"▸"}
.card.cc>:not(.clh){display:none!important}.cch,.cfh{display:none!important}
h4.clg{cursor:pointer;user-select:none}h4.clg::before{content:"▾ ";color:var(--mut)}h4.clg.cc::before{content:"▸ "}h4.clg[data-cnt]::after{content:attr(data-cnt);color:var(--mut);font-weight:400}
.cltb{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:0 0 10px}.cltb input{max-width:240px}.x5more{font-size:12px;padding:2px 9px;border-radius:99px}
.mut{color:var(--mut)}small.mut{display:block}.bt5{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:3px 0}.bt5 select,.bt5 input[type=number]{width:auto;max-width:260px}.bt5 select[data-v5=be]{min-width:170px}.bt5 input[type=range]{width:110px;padding:0}.bt5 input[data-v5=bn]{flex:1;min-width:140px}.vv{min-width:24px;text-align:center}
.lgd{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin:6px 0;font-size:12px}.lg5{display:inline-flex;gap:5px;align-items:center}.lg5 i{width:12px;height:12px;display:inline-block;border-radius:3px}
.ed5{font:15px/1.65 Georgia,serif;resize:vertical;overflow:hidden;min-height:120px;padding:12px 14px}.ed5.scr{font:13px/1.4 "Courier New",monospace}
.pbar{position:relative;height:18px;background:var(--line);border-radius:9px;overflow:hidden;margin:0 0 10px}.pbar i{display:block;height:100%;background:#2fa86b}.pbar span{position:absolute;inset:0;text-align:center;font-size:11px;line-height:18px}
.warnb{background:#d6303118;border:1px solid #d63031;border-radius:8px;padding:6px 8px;font-size:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center}.ctx5{font-size:12px;display:flex;flex-direction:column;gap:3px;margin-top:4px}
details>summary{cursor:pointer;color:var(--mut);font-size:12px}
body.focus5{overflow:hidden}#foc{position:fixed;inset:0;z-index:40;background:var(--bg);display:flex;flex-direction:column;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
#foc .fbar{display:flex;gap:6px;align-items:center;padding:8px 14px;border-bottom:1px solid var(--line);background:var(--card);transition:opacity .4s;flex-wrap:wrap}#foc .fbar input{flex:1;min-width:120px;max-width:380px;font-weight:600}#foc .fbar .sp{flex:1}
#foc .fft{display:flex;gap:16px;flex-wrap:wrap;justify-content:space-between;padding:6px 16px;font-size:12px;color:var(--mut);transition:opacity .4s}
#foc.typing .fbar,#foc.typing .fft{opacity:.06}#foc.typing{cursor:none}
#foc .fbody{flex:1;display:flex;justify-content:center;min-height:0}
#focta{width:min(740px,100%);height:100%;border:0;background:transparent;resize:none;font-family:Georgia,serif;line-height:1.85;padding:48px 24px 40vh;outline:none!important;border-radius:0}
#foc.scr #focta{font-family:"Courier New",monospace;line-height:1.5}
#foc .fctx{display:none;width:300px;flex:none;overflow:auto;padding:16px;border-left:1px solid var(--line);font-size:12px;background:var(--card)}#foc.wctx .fctx{display:flex;flex-direction:column;gap:6px}
@media(max-width:800px){#foc.wctx .fctx{position:absolute;right:0;top:52px;bottom:30px;width:min(300px,85%);z-index:2;box-shadow:-6px 0 18px #0004}}
.df{padding:3px 8px;border-radius:5px;margin:2px 0;font-size:13px;line-height:1.5;white-space:pre-wrap}.df.dd{background:#d6303120;text-decoration:line-through;text-decoration-color:var(--bad)88}.df.da{background:#2fa86b22}.df.gp{color:var(--mut);font-size:11px;text-align:center}
.dfd{color:var(--bad)}.dfa{color:var(--ok)}.dfw{margin:8px 0}
</style>`);
window.V5={finTxt,isEd,wcount,scriptBlocks,scriptTxt,novelParas,h5,uis,UI};
if(typeof S!='undefined'&&S.tab=='arcs')render();
})();
