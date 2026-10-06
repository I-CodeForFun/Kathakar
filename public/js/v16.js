/* v16: EPUB validation gate (E5/E10) and serial/platform export (E8). */
(function(){const X=window.SFX,esc=X.esc,ea=X.escAttr,rr=()=>{try{render()}catch(e){}};let PL=null;
fetch('data/platforms.json').then(r=>r.json()).then(j=>{PL=j.serial;rr()}).catch(()=>{});
const td=new TextDecoder();
// files: [[name, string|Uint8Array], ...]  →  true if exportable
X.epubGate=files=>{const entries=files.map((f,i)=>({name:f[0],data:typeof f[1]=='string'?f[1]:(/\.(x?html?|opf|ncx|xml|css)$/.test(f[0])?td.decode(f[1]):''),stored:i==0?true:undefined}));
 const v=EPUBV.validate(entries);X.lastEpubReport=v;
 if(v.errors.length){X.toast('EPUB not exported — '+v.errors.length+' problem(s): '+v.errors.slice(0,2).join('; '),{kind:'err',ms:9000});return false}
 if(v.warnings.length)X.toast('EPUB exported with '+v.warnings.length+' accessibility/quality note(s): '+v.warnings.slice(0,2).join('; '),{kind:'warn',ms:8000});return true};
const fm=()=>typeof FM=='function'?FM():'book',txt=e=>{try{return finTxt(e,fm())}catch(x){return e.prose||''}};
const V=window.__serial=window.__serial||{plat:'royalroad',ch:null,top:'',bottom:'',start:new Date().toISOString().slice(0,10),every:7};
const chapters=()=>[...S.ev].sort((a,b)=>(+a.t||0)-(+b.t||0));
const render1=()=>{const P=PL[V.plat],E=chapters(),ev=E.find(x=>x.id==V.ch)||E[0];return ev?{ev,html:SERIAL.html(txt(ev),P,{noteTop:V.top,noteBottom:V.bottom,title:ev.title})}:null};
XV.craftExtra=XV.craftExtra||{};
XV.craftExtra.serial=()=>{if(!PL)return'<p class="mut">Loading…</p>';const r=render1(),E=chapters();
 return`<h4>Serial / platform export</h4><p class="mut" style="font-size:12px">Allowed tags are per platform and change over time — check the platform’s current rules before posting.</p>
 <div class="row" style="gap:8px;flex-wrap:wrap"><label>Platform <select data-s16="plat">${Object.keys(PL).filter(k=>PL[k].label).map(k=>`<option value="${k}" ${k==V.plat?'selected':''}>${esc(PL[k].label)}</option>`).join('')}</select></label><label>Chapter <select data-s16="ch">${E.map(e=>`<option value="${ea(e.id)}" ${r&&e.id==r.ev.id?'selected':''}>${esc(e.title||'Untitled')}</option>`).join('')}</select></label></div>
 <label>Author’s note (top)<textarea data-s16="top" rows="2" style="width:100%">${esc(V.top)}</textarea></label><label>Author’s note (bottom)<textarea data-s16="bottom" rows="2" style="width:100%">${esc(V.bottom)}</textarea></label>
 <div class="row" style="margin:6px 0"><button data-s16b="rich">Copy formatted</button><button data-s16b="plain">Copy plain text</button><button data-s16b="html">Copy HTML source</button></div>
 <details open><summary>Preview (${r?r.html.length:0} characters)</summary><div style="border:1px solid var(--line);border-radius:8px;padding:8px;max-height:260px;overflow:auto">${r?r.html:''}</div></details>
 <h5>Release schedule</h5><div class="row"><label>First release <input type="date" data-s16="start" value="${ea(V.start)}"></label><label>Every <input type="number" min="1" max="60" data-s16="every" value="${ea(V.every)}" style="width:60px"> days</label><button data-s16b="ics">Download calendar (.ics)</button></div>`};
document.addEventListener('change',e=>{const k=e.target.dataset&&e.target.dataset.s16;if(!k)return;V[k]=k=='every'?+e.target.value||7:e.target.value;rr()});
document.addEventListener('click',async e=>{const b=e.target.closest('[data-s16b]');if(!b||!PL)return;const k=b.dataset.s16b;
 if(k=='ics'){const E=chapters(),d=SERIAL.schedule(V.start,E.length,+V.every||7),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([SERIAL.ics(E.map((x,i)=>({date:d[i],title:'Publish: '+(x.title||'Chapter '+(i+1))})))],{type:'text/calendar'}));a.download='release-schedule.ics';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);return}
 const r=render1();if(!r)return;
 try{if(k=='rich'&&window.ClipboardItem)await navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([r.html],{type:'text/html'}),'text/plain':new Blob([SERIAL.plain(r.html)],{type:'text/plain'})})]);
  else await navigator.clipboard.writeText(k=='html'?r.html:SERIAL.plain(r.html));X.toast('Copied',{kind:'ok'})}catch(x){X.toast('Copy failed — your browser blocked clipboard access',{kind:'err'})}});
})();
// ===== GEDCOM import (D6) =====
(function(){const X=window.SFX,rr=()=>{try{render()}catch(e){}};const ex=XV.craftExtra;const _t=ex.tools;ex.tools=()=>_t()+'<div class="row" style="margin-top:6px"><button data-g16="imp">Import family tree (GEDCOM)…</button></div>';
 document.addEventListener('click',async e=>{const b=e.target.closest('[data-g16]');if(!b)return;const i=document.createElement('input');i.type='file';i.accept='.ged,.gedcom,text/plain';i.onchange=async()=>{const f=i.files[0];if(!f)return;if(f.size>5e6){X.toast('File too large (5 MB max)',{kind:'err'});return}
  try{const r=FAM.parseGedcom(await f.text());if(!r.people.length)throw new Error('no people found');snap();const map=new Map();let added=0;
   r.people.forEach(p=>{const nm=(p.name||'Unnamed').slice(0,80);let c=S.chars.find(x=>x.name.toLowerCase()==nm.toLowerCase());if(!c){c={id:uid(),name:nm,role:'',color:COL[S.chars.length%7],notes:[p.born?'Born '+p.born:'',p.died?'Died '+p.died:''].filter(Boolean).join('. ')};S.chars.push(c);added++}map.set(p.ref,c.id)});
   let rel=0;r.rels.forEach(x=>{const a=map.get(x.a),bb=map.get(x.b);if(a&&bb&&!S.family.some(y=>y.a==a&&y.b==bb&&y.rel==x.rel)){S.family.push({id:uid(),a,b:bb,rel:x.rel});rel++}});save();rr();X.toast(`Imported ${r.people.length} people (${added} new characters) and ${rel} relations`,{kind:'ok'})}catch(x){X.toast('GEDCOM import failed: '+x.message,{kind:'err'})}};i.click()})})();
