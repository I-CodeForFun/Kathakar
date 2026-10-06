/* New story: start a blank story, asking what to do with the current one first. */
(function(){
const DK='sf-drafts',view=['tab','sel','q','mv','dr'];
const drafts=()=>{try{return JSON.parse(localStorage.getItem(DK))||[]}catch(e){return[]}},setDr=a=>{try{localStorage.setItem(DK,JSON.stringify(a))}catch(e){}};
const strip=o=>{const c=JSON.parse(JSON.stringify(o||{}));view.forEach(k=>delete c[k]);return JSON.stringify(c)};
let FULL='',BASE='',BK=null;
const mark=()=>{try{BK=KEY;FULL=JSON.stringify(S);BASE=strip(S)}catch(e){}};
const _sw=window.sw;window.sw=function(){const r=_sw.apply(this,arguments);mark();return r};
setTimeout(mark,1500);
const title=()=>esc((S&&S.title)||'Untitled story');
function fresh(done){const id='s'+uid(),d=drafts();d.push(id);setDr(d);sw(id,blank());flush();if(done)done()}
function ask(html,btns,done){
 const o=document.createElement('div');o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');
 o.style.cssText='position:fixed;inset:0;z-index:9999;background:#0008;display:flex;align-items:center;justify-content:center;padding:14px';
 o.innerHTML=`<div class="card" style="max-width:460px;width:100%;background:var(--card);padding:18px;border-radius:12px"><h3 style="margin:0 0 8px">Start a new story</h3><div style="margin-bottom:12px;font-size:14px">${html}</div><div style="display:grid;gap:8px">${btns.map((b,i)=>`<button data-i="${i}" class="${b[2]||''}" style="text-align:left;padding:9px 12px">${b[0]}<br><small style="opacity:.75">${b[1]}</small></button>`).join('')}<button data-i="x">Cancel — stay on this story</button></div></div>`;
 const close=()=>{o.remove();document.removeEventListener('keydown',kd,true)},kd=e=>{if(e.key=='Escape'){e.stopPropagation();close()}};
 document.addEventListener('keydown',kd,true);
 o.addEventListener('click',e=>{if(e.target===o)return close();const b=e.target.closest('[data-i]');if(!b)return;close();if(b.dataset.i!='x')btns[+b.dataset.i][3](done)});
 document.body.appendChild(o);const f=o.querySelector('button');f&&f.focus()}
function drop(id){const l=LIB().filter(x=>x!=id);setLib(l);try{for(const k of [id,'sf-snaps-'+id,'sf-baks-'+id])localStorage.removeItem(k)}catch(e){}setDr(drafts().filter(x=>x!=id))}
window.newStory=function(done){
 if(BK!==KEY)mark();
 const isDraft=drafts().includes(KEY),ch=strip(S)!==BASE;
 if(isDraft&&!ch){SFX.notice('You are already on a new, empty story. Start writing, or open another from Kathākośa.');return}
 if(!ch){fresh(done);return}
 if(isDraft){
  ask(`<b>“${title()}”</b> is a new story that you haven’t saved yet.`,[
   ['💾 Save it, then start a new story','Keeps “'+title()+'” in Kathākośa.','pri',d=>{setDr(drafts().filter(x=>x!=KEY));flush();fresh(d)}],
   ['🗑 Discard it, then start a new story','Deletes this unsaved story permanently.','',d=>{const id=KEY;clearTimeout(saveT);drop(id);const n='s'+uid(),a=drafts();a.push(n);setDr(a);sw(n,blank(),1);flush();if(d)d()}]],done);return}
 ask(`You have changed <b>“${title()}”</b> since you opened it. What should happen to those changes?`,[
  ['✏ Continue on the old story','Keep the changes in this story, then start a new one.','pri',d=>fresh(d)],
  ['📄 Save as a new story','Changes go into a copy “(copy)”; the original returns to how it was.','',d=>{const copy=JSON.parse(JSON.stringify(S));copy.title=(copy.title||'Untitled story')+' (copy)';const orig=JSON.parse(FULL);sw(KEY,orig,1);flush();sw('s'+uid(),copy);flush();fresh(d)}],
  ['↩ Discard the changes','Restore the story as it was when you opened it, then start a new one.','',d=>{sw(KEY,JSON.parse(FULL),1);flush();fresh(d)}]],done)};
document.addEventListener('click',e=>{const t=e.target.closest('[data-nw]');if(!t)return;e.preventDefault();newStory()});
})();
