/* v14: worker client (A6) + Edit-final lint panel (B2). */
(function(){const X=window.SFX,esc=X.esc,ea=X.escAttr;let W=null,seq=0;const pend=new Map();
try{W=new Worker('js/work.js');W.onmessage=e=>{const p=pend.get(e.data.id);if(!p)return;pend.delete(e.data.id);e.data.ok?p.res(e.data.r):p.rej(new Error(e.data.error))};W.onerror=()=>{W=null}}catch(e){W=null}
X.work=(type,payload)=>new Promise((res,rej)=>{if(W){const id=++seq;pend.set(id,{res,rej});W.postMessage({id,type,payload})}
 else X.scheduleHeavy(()=>{try{res(type=='lint'?LINT.lint(payload.text,payload.opt):type=='summary'?LINT.summary(payload.text,payload.opt):type=='read'?READ.analyze(payload.text):FIND.build(payload.S).length)}catch(x){rej(x)}})});
const cache=new Map();const hsh=s=>{let h=5381;for(let i=0;i<s.length;i++)h=(h*33^s.charCodeAt(i))>>>0;return h+':'+s.length};
X.lintText=async(text,opt)=>{const k=hsh(text)+JSON.stringify(opt||{});if(cache.has(k))return cache.get(k);const r=await X.work('lint',{text,opt});cache.set(k,r);if(cache.size>200)cache.delete(cache.keys().next().value);return r};
// ----- panel: button beside the Edit-final textarea; results never edit the text -----
const ui=()=>{try{return JSON.parse(localStorage.getItem('sf-ui')||'{}')}catch(e){return{}}};
const rules=()=>(ui().lint||{});
let panel=null,deb=null;
async function run(t){if(!panel)return;const names=[...S.chars.map(c=>c.name),...S.places.map(p=>p.name)].filter(Boolean),R=rules(),ign=(S.lintIgnore||[]);
 const hits=await X.lintText(t.value,{rules:R,names,ignore:ign}),by={};hits.forEach(h=>(by[h.ruleId]=by[h.ruleId]||[]).push(h));
 const live=panel.querySelector('[aria-live]');live.textContent=hits.length+' suggestion'+(hits.length==1?'':'s');
 panel.querySelector('#lt-list').innerHTML=Object.keys(by).map(k=>`<details open><summary>${esc(LINT.RULES[k].label)} <b>${by[k].length}</b> <label style="font-size:11px"><input type="checkbox" data-l14="off" data-r="${k}" ${R[k]===false?'checked':''}> off</label></summary><ul style="list-style:none;padding:0;margin:0">${by[k].slice(0,40).map(h=>`<li style="font-size:12px;padding:2px 0"><button data-l14="go" data-s="${h.start}" data-e="${h.end}">line ${h.line}</button> “${esc(h.snippet.slice(0,40))}” — ${esc(h.msg)} <button data-l14="ign" data-r="${k}" data-sn="${ea(h.snippet.toLowerCase())}" aria-label="Ignore this one">ignore</button></li>`).join('')}</ul></details>`).join('')||'<p class="mut">Nothing to flag.</p>'}
document.addEventListener('click',e=>{const b=e.target.closest('[data-l14]');if(!b)return;const k=b.dataset.l14,t=document.querySelector('textarea[data-v5=fin]');
 if(k=='toggle'){if(panel){panel.remove();panel=null;return}if(!t){X.toast('Open a chapter in Edit-final first',{kind:'warn'});return}panel=document.createElement('aside');panel.setAttribute('aria-label','Style lint');panel.style.cssText='position:fixed;right:8px;top:70px;width:min(340px,92vw);max-height:75vh;overflow:auto;background:var(--card);color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:8px;z-index:50';
  panel.innerHTML='<div class="row"><b style="flex:1">Style lint</b><span aria-live="polite" class="mut" style="font-size:12px"></span><button data-l14="toggle" aria-label="Close lint panel">✕</button></div><div id="lt-list"></div>';document.body.appendChild(panel);run(t)}
 if(k=='go'&&t){t.focus();t.setSelectionRange(+b.dataset.s,+b.dataset.e);const lh=parseFloat(getComputedStyle(t).lineHeight)||20,ln=t.value.slice(0,+b.dataset.s).split('\n').length;t.scrollTop=Math.max(0,ln*lh-t.clientHeight/2)}
 if(k=='ign'){S.lintIgnore=[...(S.lintIgnore||[]),b.dataset.r+':'+b.dataset.sn];save();t&&run(t)}});
document.addEventListener('change',e=>{const b=e.target.closest&&e.target.closest('[data-l14=off]');if(!b)return;const u=ui();u.lint=u.lint||{};if(b.checked)u.lint[b.dataset.r]=false;else delete u.lint[b.dataset.r];localStorage.setItem('sf-ui',JSON.stringify(u));const t=document.querySelector('textarea[data-v5=fin]');t&&run(t)});
document.addEventListener('input',e=>{if(panel&&e.target.dataset&&e.target.dataset.v5=='fin'){clearTimeout(deb);deb=setTimeout(()=>run(e.target),800)}});
CMD.register({id:'lint',label:'Toggle style lint panel',keywords:'style grammar passive adverb',run:()=>{const b=document.createElement('button');b.dataset.l14='toggle';document.body.appendChild(b);b.click();b.remove()}});
// hotspot table in Craft now uses the worker cache too
})();
