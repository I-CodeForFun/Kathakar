/* ---- v6: custom calendars · multiple places per event · tension/emotion graph · story weave ---- */
(()=>{
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const num=(v,d=0)=>{v=parseFloat(v);return isFinite(v)?v:d};
const EVT=()=>[...S.ev].sort((a,b)=>a.t-b.t);
const pal=i=>COL[i%COL.length];
window.XV=window.XV||{};
TABS.push(['cal','🗓 Calendar'],['tension','🎢 Tension & emotion'],['weave','🧵 Story weave']);

/* =============== CUSTOM CALENDAR =============== */
const CPRE={
 'Default (12 months × 30 days)':{era:'Year',hpd:24,months:Array.from({length:12},(_,i)=>({n:'Month '+(i+1),d:30})),hol:[]},
 'Real-world months (no leap years)':{era:'Year',hpd:24,months:[['January',31],['February',28],['March',31],['April',30],['May',31],['June',30],['July',31],['August',31],['September',30],['October',31],['November',30],['December',31]].map(([n,d])=>({n,d})),hol:[{n:'New Year',m:1,d:1},{n:'Midsummer',m:6,d:21},{n:'Midwinter',m:12,d:21}]},
 'Fantasy (10 months × 36 days)':{era:'Age',hpd:24,months:['Frostwane','Thawmoot','Seedfall','Bloomtide','Highsun','Goldreap','Harvestmoon','Mistfall','Emberdusk','Longnight'].map(n=>({n,d:36})),hol:[{n:'Harvest Festival',m:7,d:18},{n:'Longnight Vigil',m:10,d:36}]},
 'Thirteen lunar months (13 × 28)':{era:'Cycle',hpd:24,months:Array.from({length:13},(_,i)=>({n:'Moon '+(i+1),d:28})),hol:[]},
 'Short days (30-hour day, 8 months × 45)':{era:'Year',hpd:30,months:Array.from({length:8},(_,i)=>({n:'Season '+(i+1),d:45})),hol:[]}};
const cloneCal=c=>JSON.parse(JSON.stringify(c));
const mc=()=>{if(!S.cal)S.cal=cloneCal(CPRE['Default (12 months × 30 days)']);const c=S.cal;if(!Array.isArray(c.months)||!c.months.length)c.months=cloneCal(CPRE['Default (12 months × 30 days)']).months;c.hol=Array.isArray(c.hol)?c.hol:[];return c};
function vCal(){const C=cal(),c=mc(),first=EVT()[0];
 return`<div class="row"><h3 style="flex:3">🗓 Calendar</h3></div><p class="mut" style="font-size:12px;margin:0 0 8px">Define the calendar of your world: month names and lengths, hours per day, the name of the era and festivals. Dates on the Journey map, Life timeline, arcs and chapters use it. Events keep their position on the timeline, so changing the calendar changes how their dates are <i>named</i>, not their order.</p>
 <div class="card"><div class="row" style="margin:0"><select data-v6c="preset" style="width:auto"><option value="">Load a preset…</option>${Object.keys(CPRE).map(k=>`<option>${esc(k)}</option>`).join('')}</select><button data-v6="calreset">Reset to default</button></div>
 <div class="row"><div style="flex:1"><label>Name of a year / era</label><input data-v6c="era" value="${esc(c.era||'Year')}" maxlength="20"></div><div style="flex:1"><label>Hours per day</label><input type="number" min="1" max="100" data-v6c="hpd" value="${c.hpd||24}"></div></div>
 <b style="font-size:12px">Months</b>${c.months.map((m,i)=>`<div class="bt5"><input data-v6c="mn" data-i="${i}" value="${esc(m.n)}" aria-label="Month ${i+1} name" style="flex:2;min-width:120px"><input type="number" min="1" max="400" data-v6c="md" data-i="${i}" value="${m.d}" aria-label="Days in month ${i+1}" style="width:80px"><small class="mut">days</small><button data-v6="mup" data-i="${i}" aria-label="Move up" ${i?'':'disabled'}>↑</button><button data-v6="mdn" data-i="${i}" aria-label="Move down" ${i<c.months.length-1?'':'disabled'}>↓</button><button data-v6="mdel" data-i="${i}" aria-label="Remove month" ${c.months.length>1?'':'disabled'}>✕</button></div>`).join('')}
 <div class="row" style="margin:4px 0"><button data-v6="madd">+ Add month</button></div>
 <b style="font-size:12px">Holidays &amp; festivals</b>${c.hol.map((h,i)=>`<div class="bt5"><input data-v6c="hn" data-i="${i}" value="${esc(h.n)}" aria-label="Holiday name" style="flex:2;min-width:120px"><select data-v6c="hm" data-i="${i}" aria-label="Month" style="width:auto">${c.months.map((m,j)=>`<option value="${j+1}" ${h.m==j+1?'selected':''}>${esc(m.n)}</option>`).join('')}</select><input type="number" min="1" data-v6c="hd" data-i="${i}" value="${h.d}" aria-label="Day" style="width:70px"><button data-v6="hdel" data-i="${i}" aria-label="Remove holiday">✕</button></div>`).join('')||'<small class="mut" style="display:block">None yet.</small>'}
 <div class="row" style="margin:4px 0"><button data-v6="hadd">+ Add holiday</button></div></div>
 <div class="card" style="margin-top:10px"><b>Preview</b><small class="mut" style="display:block">A year has <b>${C.dpy}</b> days in <b>${C.M}</b> months · ${C.hpd} hours per day · ${C.U.toLocaleString()} minutes per year.</small>
 <small class="mut" style="display:block">Timeline start: ${esc(fullT(0))} · Half a year later: ${esc(fullT(.5))}${first?`<br>Your first event: ${esc(fullT(first.t))}`:''}</small>
 ${C.hol.length?`<small class="mut" style="display:block">Festivals: ${C.hol.map(h=>esc(h.n)+' ('+esc(C.mon[h.m-1].n)+' '+h.d+')').join(' · ')}</small>`:''}</div>`}
window.XV.cal=vCal;
document.addEventListener('change',e=>{const t=e.target,k=t.dataset&&t.dataset.v6c;if(!k)return;const c=mc(),i=+t.dataset.i;let ren=true;
 if(k=='preset'){if(!t.value)return;if(S.ev.length&&!confirm('Load this calendar? Event dates will be renamed to fit it (their order stays the same).'))return;S.cal=cloneCal(CPRE[t.value])}
 else if(k=='era')c.era=t.value.trim().slice(0,20)||'Year';
 else if(k=='hpd')c.hpd=Math.max(1,Math.min(100,Math.round(num(t.value,24))));
 else if(k=='mn')c.months[i].n=t.value.trim().slice(0,30)||'Month '+(i+1);
 else if(k=='md')c.months[i].d=Math.max(1,Math.min(400,Math.round(num(t.value,30))));
 else if(k=='hn')c.hol[i].n=t.value.trim().slice(0,40)||'Holiday';
 else if(k=='hm')c.hol[i].m=+t.value;
 else if(k=='hd')c.hol[i].d=Math.max(1,Math.round(num(t.value,1)));
 else return;
 c.hol=c.hol.filter(h=>h.m<=c.months.length);save();render()},true);
/* =============== TENSION & EMOTION =============== */
const MV=[[/happy|joy|love|excit|proud|relie|grate|content|hope/i,3],[/curious|calm|amus|determin/i,1],[/tired|bored|numb|confus/i,-1],[/afraid|fear|anx|worr|nerv|sad|angry|grie|lonely|guilt|despair|betray|shock|disgust|jealous/i,-3]];
const MT=[[/afraid|fear|angry|shock|terrif|panic/i,7],[/excit|anx|nerv|jealous|betray/i,6],[/curious|love|determin|proud/i,4],[/sad|tired|bored|numb/i,3],[/happy|joy|relie|calm|content/i,2]];
const moodV=e=>{const m=String(e.mood||'');if(!m)return null;for(const [re,v] of MV)if(re.test(m))return v;return 0};
const moodT=e=>{const m=String(e.mood||'');if(!m)return null;for(const [re,v] of MT)if(re.test(m))return v;return 3};
const valOf=e=>e.vl!==undefined&&e.vl!==''&&isFinite(+e.vl)?{v:+e.vl,auto:false}:(moodV(e)==null?null:{v:moodV(e),auto:true});
const TC={
 'Three-act structure':[[0,2],[.12,3],[.25,5],[.5,6],[.6,5],[.75,8],[.9,10],[1,3]],
 'Hero’s journey':[[0,1],[.15,3],[.25,5],[.4,4],[.5,7],[.65,6],[.8,9],[.9,10],[1,2]],
 'Freytag’s pyramid':[[0,1],[.2,3],[.5,10],[.75,6],[1,2]],
 'Mystery / thriller':[[0,4],[.2,5],[.4,6],[.6,7],[.8,9],[.92,10],[1,3]],
 'Slow burn':[[0,1],[.4,2],[.7,5],[.9,9],[1,4]],
 'Tragedy':[[0,2],[.3,4],[.55,6],[.75,9],[.95,10],[1,8]],
 'Rollercoaster (episodic)':[[0,3],[.15,7],[.3,3],[.45,8],[.6,4],[.75,9],[.9,5],[1,10]]};
const curveAt=(name,p)=>{const L=TC[name];if(!L)return null;for(let i=1;i<L.length;i++)if(p<=L[i][0]+1e-9){const a=L[i-1],b=L[i];return b[0]==a[0]?b[1]:a[1]+(b[1]-a[1])*(p-a[0])/(b[0]-a[0])}return L[L.length-1][1]};
function pacing(E){const out=[],T=E.map(e=>e.tn===undefined||e.tn===''?null:num(e.tn,null)),n=E.length,rated=T.filter(x=>x!=null).length;
 if(n<3)return['Add at least three chapters/events to see pacing notes.'];
 if(rated<Math.ceil(n/2))out.push(`Only ${rated} of ${n} chapters have a tension value — rate more (or use “Estimate from moods”) for useful notes.`);
 let run=[];const flush=()=>{if(run.length>=4)out.push(`Tension is flat for chapters ${run[0]+1}–${run[run.length-1]+1} (within ±1) — a possible “saggy middle”.`);run=[]};
 T.forEach((v,i)=>{if(v==null){flush();return}if(!run.length||Math.abs(v-T[run[run.length-1]])<=1)run.push(i);else{flush();run=[i]}});flush();
 const mx=Math.max(...T.filter(x=>x!=null));if(rated>=3){const idx=T.findIndex(x=>x==mx),pos=idx/(n-1);
  if(pos<.5)out.push(`The tension peak (chapter ${idx+1}) comes in the first half — the story may feel anticlimactic afterwards.`);
  else if(idx==n-1&&n>4)out.push('The peak is the very last chapter — there is no falling action / resolution.');
  const a=T.slice(0,Math.ceil(n/3)).filter(x=>x!=null),z=T.slice(-Math.ceil(n/3)).filter(x=>x!=null);if(a.length&&z.length&&z.reduce((p,q)=>p+q,0)/z.length<a.reduce((p,q)=>p+q,0)/a.length)out.push('The last third is calmer on average than the opening third — check that the stakes keep rising.')}
 const big=[];E.forEach((e,i)=>{const t=T[i],c=S.tnc&&curveAt(S.tnc,n>1?i/(n-1):0);if(t!=null&&c!=null&&Math.abs(t-c)>=3)big.push(`${i+1} (${t} vs ${Math.round(c)})`)});
 if(big.length)out.push(`Differs from “${S.tnc}” by 3+ at chapters: ${big.slice(0,8).join(', ')}${big.length>8?'…':''}.`);
 return out.length?out:['✓ No pacing problems detected.']}
function tensionSvg(E){const n=E.length,W=760,L=44,R=14,iw=W-L-R,X=i=>L+(n>1?i/(n-1):.5)*iw;
 const mk=(H,min,max,label,pts,cur,kind)=>{const T=14,B=26,ih=H-T-B,Y=v=>T+(max-v)/(max-min)*ih;let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}" style="width:100%;max-width:920px;background:var(--card);border:1px solid var(--line);border-radius:12px">`;
  for(let v=min;v<=max;v+=(max-min)>10?2:1)s+=`<line x1="${L}" x2="${W-R}" y1="${Y(v)}" y2="${Y(v)}" style="stroke:var(--line);stroke-width:${v==0&&min<0?1.6:.5}"/><text x="${L-6}" y="${Y(v)+3}" text-anchor="end" font-size="9" style="fill:var(--mut)">${v}</text>`;
  for(let i=0;i<n;i+=Math.max(1,Math.ceil(n/20)))s+=`<text x="${X(i)}" y="${H-8}" text-anchor="middle" font-size="9" style="fill:var(--mut)">${i+1}</text>`;
  if(cur){const P=E.map((e,i)=>[X(i),Y(curveAt(cur,n>1?i/(n-1):0))]);s+=`<path d="${P.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')}" fill="none" style="stroke:var(--acc);stroke-width:2;stroke-dasharray:6 5;opacity:.6"/>`}
  const have=pts.map((p,i)=>p?{i,...p}:null).filter(Boolean);
  if(have.length>1)s+=`<path d="${have.map((p,k)=>(k?'L':'M')+X(p.i).toFixed(1)+','+Y(p.v).toFixed(1)).join(' ')}" fill="none" style="stroke:${kind=='t'?'var(--ink)':'#2f7fd6'};stroke-width:2.4"/>`;
  have.forEach(p=>s+=`<circle cx="${X(p.i)}" cy="${Y(p.v)}" r="4.5" data-v6="goev" data-e="${E[p.i].id}" tabindex="0" role="button" aria-label="Chapter ${p.i+1}: ${esc(E[p.i].title||'Untitled')}, ${p.v}" style="cursor:pointer;stroke:${kind=='t'?'var(--ink)':'#2f7fd6'};stroke-width:2;fill:${p.auto?'var(--card)':(kind=='t'?'var(--ink)':'#2f7fd6')}"><title>${i18(E[p.i].title)} · ${p.v}${p.auto?' (from mood)':''}</title></circle>`);
  return s+'</svg>'};
 const i18=t=>esc(t||'Untitled');
 const tp=E.map(e=>e.tn===undefined||e.tn===''||!isFinite(+e.tn)?null:{v:+e.tn}),vp=E.map(e=>valOf(e));
 return`<b>Tension (0 calm → 10 climax)</b><div style="margin:4px 0 10px">${mk(230,0,10,'Tension graph',tp,S.tnc,'t')}</div><b>Emotional tone (−5 dark → +5 joyful)</b> <small class="mut">hollow dots = estimated from the chapter’s mood</small><div style="margin:4px 0">${mk(190,-5,5,'Emotion graph',vp,null,'v')}</div>`}
function vTension(){const E=EVT(),pc=pacing(E);
 return`<div class="row"><h3 style="flex:3">🎢 Tension &amp; emotion</h3></div><p class="mut" style="font-size:12px;margin:0 0 8px">Rate each chapter’s tension and emotional tone to see the shape of the whole story. Compare it with a classic structure (dashed) and get pacing notes.</p>
 <div class="row" style="margin:0 0 8px"><select data-v6t="curve" style="width:auto"><option value="">Compare with a structure…</option>${Object.keys(TC).map(k=>`<option ${S.tnc==k?'selected':''}>${esc(k)}</option>`).join('')}</select><button data-v6="tmood">Estimate from moods</button><button data-v6="tclear">Clear ratings</button></div>
 ${E.length?tensionSvg(E):'<div class="card"><small class="mut">No events yet.</small></div>'}
 <div class="card" style="margin-top:10px"><b>Pacing notes</b><ul style="margin:6px 0 0;padding-left:18px">${pc.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>
 <h4 style="margin:14px 0 6px">Chapters</h4>${E.map((e,i)=>{const v=valOf(e);return`<div class="bt5" style="border-bottom:1px solid var(--line);padding:3px 0"><small style="width:24px">${i+1}</small><b style="flex:2;min-width:140px;font-weight:600">${esc(e.title||'Untitled')}</b><small class="mut" style="min-width:80px">${esc(e.mood||'')}</small><label style="font-size:12px">Tension <input type="number" min="0" max="10" step="1" data-v6t="tn" data-e="${e.id}" value="${e.tn===undefined?'':e.tn}" style="width:64px" aria-label="Tension for chapter ${i+1}"></label><label style="font-size:12px">Tone <input type="number" min="-5" max="5" step="1" data-v6t="vl" data-e="${e.id}" value="${e.vl===undefined?'':e.vl}" placeholder="${v&&v.auto?v.v:''}" style="width:64px" aria-label="Emotional tone for chapter ${i+1}"></label></div>`}).join('')}`}
window.XV.tension=vTension;
document.addEventListener('change',e=>{const t=e.target,k=t.dataset&&t.dataset.v6t;if(!k)return;
 if(k=='curve'){if(t.value)S.tnc=t.value;else delete S.tnc}
 else{const ev=S.ev.find(x=>x.id==t.dataset.e);if(!ev)return;if(t.value===''||!isFinite(+t.value))delete ev[k];else ev[k]=Math.max(k=='tn'?0:-5,Math.min(k=='tn'?10:5,Math.round(+t.value)))}
 save();render()},true);
/* =============== STORY WEAVE =============== */
const WV=()=>(S.wv=S.wv&&typeof S.wv=='object'?S.wv:{by:'char',gap:4});
function lanes(by,E){const L=[];
 if(by=='char')S.chars.forEach((c,i)=>L.push({id:c.id,n:c.name,col:c.color||pal(i),has:e=>e.chars.includes(c.id)}));
 else if(by=='tl')S.tls.forEach((t,i)=>L.push({id:t.id,n:t.name,col:t.color||pal(i),has:e=>e.tl==t.id}));
 else if(by=='place'){const used=new Map();E.forEach(e=>(typeof plAll=='function'?plAll(e):[]).forEach(p=>used.set(p.id,p)));[...used.values()].forEach((p,i)=>L.push({id:p.id,n:p.name,col:pal(i),has:e=>plAll(e).some(q=>q.id==p.id)}))}
 else{const tags=[...new Set(E.map(e=>String(e.tag||'').trim()).filter(Boolean))];tags.forEach((t,i)=>L.push({id:t,n:t,col:pal(i),has:e=>String(e.tag||'').trim()==t}))}
 return L.map(l=>({...l,idx:E.map((e,i)=>l.has(e)?i:-1).filter(i=>i>=0)})).filter(l=>l.idx.length).sort((a,b)=>a.idx[0]-b.idx[0])}
function vWeave(){const w=WV(),E=EVT(),n=E.length,all=lanes(w.by,E),LM=all.slice(0,40),gap=Math.max(2,+w.gap||4),issues=[];
 LM.forEach(l=>{for(let k=1;k<l.idx.length;k++)if(l.idx[k]-l.idx[k-1]-1>=gap)issues.push(`“${l.n}” is absent for chapters ${l.idx[k-1]+2}–${l.idx[k]} (${l.idx[k]-l.idx[k-1]-1} in a row).`);
  const tail=n-1-l.idx[l.idx.length-1];if(tail>=gap&&l.idx.length>0)issues.push(`“${l.n}” last appears in chapter ${l.idx[l.idx.length-1]+1} and then vanishes for ${tail} chapters — is the thread resolved?`)});
 const step=Math.max(24,Math.min(56,Math.floor(720/Math.max(1,n)))),LW=140,RH=26,W=LW+n*step+20,H=40+LM.length*RH;
 let s=`<div style="overflow-x:auto;border:1px solid var(--line);border-radius:12px;background:var(--card)"><svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Story weave">`;
 E.forEach((e,i)=>{const x=LW+i*step+step/2;s+=`<line x1="${x}" x2="${x}" y1="22" y2="${H-8}" style="stroke:var(--line);stroke-width:.5"/><text x="${x}" y="14" text-anchor="middle" font-size="9" style="fill:var(--mut)">${i+1}</text>`});
 LM.forEach((l,r)=>{const y=34+r*RH,P=l.idx.map(i=>[LW+i*step+step/2,y]);
  s+=`<text x="${LW-8}" y="${y+4}" text-anchor="end" font-size="11" style="fill:var(--ink)">${esc(l.n.length>20?l.n.slice(0,19)+'…':l.n)}</text><rect x="${LW}" y="${y-9}" width="${n*step}" height="18" rx="9" style="fill:${l.col};opacity:.07"/>`;
  for(let k=1;k<P.length;k++){const far=l.idx[k]-l.idx[k-1]-1>=gap;s+=`<line x1="${P[k-1][0]}" x2="${P[k][0]}" y1="${y}" y2="${y}" style="stroke:${l.col};stroke-width:${far?1.5:3.5};${far?'stroke-dasharray:3 4;':''}opacity:${far?.6:.85}"/>`}
  P.forEach((p,k)=>{const e=E[l.idx[k]];s+=`<circle cx="${p[0]}" cy="${p[1]}" r="6" tabindex="0" role="button" data-v6="goev" data-e="${e.id}" aria-label="${esc(l.n)} in chapter ${l.idx[k]+1}: ${esc(e.title||'Untitled')}" style="fill:${l.col};cursor:pointer;stroke:var(--card);stroke-width:1.5"><title>${esc(l.n)} · ${l.idx[k]+1}. ${esc(e.title||'Untitled')}</title></circle>`})});
 s+='</svg></div>';
 return`<div class="row"><h3 style="flex:3">🧵 Story weave</h3></div><p class="mut" style="font-size:12px;margin:0 0 8px">Each row is a thread (characters, timelines, places or tags); each dot is a chapter where it appears. Dashes mark long absences. Click a dot to open that event.</p>
 <div class="row" style="margin:0 0 8px"><label style="font-size:12px">Threads by</label><select data-v6w="by" style="width:auto">${[['char','Characters'],['tl','Timelines / subplots'],['place','Places'],['tag','Tags / arcs']].map(([v,l])=>`<option value="${v}" ${w.by==v?'selected':''}>${l}</option>`).join('')}</select><label style="font-size:12px">Flag gaps of</label><input type="number" min="2" max="30" data-v6w="gap" value="${gap}" style="width:64px" aria-label="Gap length in chapters"><small class="mut">chapters</small></div>
 ${LM.length?s:'<div class="card"><small class="mut">Nothing to show for this grouping yet (tag events, add timelines, or put characters in events).</small></div>'}${all.length>40?`<small class="mut">Showing the first 40 of ${all.length} threads.</small>`:''}
 <div class="card" style="margin-top:10px"><b>Dropped &amp; dormant threads</b><ul style="margin:6px 0 0;padding-left:18px">${issues.map(x=>`<li>${esc(x)}</li>`).join('')||'<li>✓ Every thread appears regularly.</li>'}</ul></div>`}
window.XV.weave=vWeave;
document.addEventListener('change',e=>{const t=e.target,k=t.dataset&&t.dataset.v6w;if(!k)return;const w=WV();w[k]=k=='gap'?Math.max(2,Math.min(30,Math.round(num(t.value,4)))):t.value;save();render()},true);
document.addEventListener('click',e=>{const b=e.target.closest('[data-v6]');if(!b)return;const k=b.dataset.v6,i=+b.dataset.i;let did=true;
 if(k=='goev'){S.tab='map';render();setTimeout(()=>openEv(b.dataset.e),30);return}
 const c=['madd','mdel','mup','mdn','hadd','hdel','calreset'].includes(k)?mc():null;
 if(k=='madd')c.months.push({n:'Month '+(c.months.length+1),d:30});
 else if(k=='mdel'){if(c.months.length<2)return;c.months.splice(i,1);c.hol=c.hol.filter(h=>h.m<=c.months.length)}
 else if(k=='mup'&&i>0)[c.months[i-1],c.months[i]]=[c.months[i],c.months[i-1]];
 else if(k=='mdn'&&i<c.months.length-1)[c.months[i+1],c.months[i]]=[c.months[i],c.months[i+1]];
 else if(k=='hadd')c.hol.push({n:'Festival',m:1,d:1});
 else if(k=='hdel')c.hol.splice(i,1);
 else if(k=='calreset'){if(!confirm('Go back to the default calendar (12 months × 30 days)?'))return;delete S.cal}
 else if(k=='tmood'){let n=0;S.ev.forEach(e=>{if((e.tn===undefined||e.tn==='')&&moodT(e)!=null){e.tn=moodT(e);n++}});if(!n)SFX.notice('Nothing to estimate: every chapter with a mood already has a tension value.')}
 else if(k=='tclear'){if(!confirm('Remove all tension and tone ratings?'))return;S.ev.forEach(e=>{delete e.tn;delete e.vl})}
 else did=false;
 if(did){e.stopPropagation();save();render()}},true);
document.addEventListener('keydown',e=>{if((e.key=='Enter'||e.key==' ')&&e.target.dataset&&e.target.dataset.v6=='goev'){e.preventDefault();e.target.dispatchEvent(new MouseEvent('click',{bubbles:true}))}});
/* =============== MULTIPLE PLACES PER EVENT =============== */
const _oe=openEv;openEv=id=>{_oe(id);const inp=$('#dr input[data-ev="place"]'),e=S.ev.find(x=>x.id==id);if(!inp||!e)return;
 inp.setAttribute('list','dl-places');inp.insertAdjacentHTML('afterend',`<datalist id="dl-places">${S.places.map(p=>`<option value="${esc(p.name)}">`).join('')}</datalist><label>Also at <small class="mut">(other places in this scene, comma separated)</small></label><input data-ev="px" placeholder="e.g. The Market, Temple Door" value="${esc(e.px||'')}">`)};
document.head.insertAdjacentHTML('beforeend','<style>@media print{#sb,header,#dr{display:none!important}}</style>');
})();
