/* Foundation (loaded before app.js): SFX namespace, toasts, dialogs, escaping, i18n, idle scheduling, svg a11y. */
(function(){const SFX=window.SFX=window.SFX||{};window.XV=window.XV||{};
 const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 SFX.esc=esc;SFX.escAttr=s=>esc(s).replace(/'/g,'&#39;').replace(/`/g,'&#96;');
 // ---- i18n (A4): tr('key',{n:3}) with {x} substitution and ICU-lite plurals
 const DICT={};let LOC='en';
 const plural=(t,p)=>t.replace(/\{(\w+),\s*plural,\s*one\{([^}]*)\}\s*other\{([^}]*)\}\}/g,(m,k,o,x)=>(+p[k]===1?o:x).replace(/#/g,p[k]));
 const tr=(k,p={})=>{let t=DICT[k];if(t===undefined){if(!tr.miss)tr.miss=new Set();tr.miss.add(k);t=k}t=plural(t,p);return t.replace(/\{(\w+)\}/g,(m,x)=>p[x]!==undefined?p[x]:m)};
 window.I18N={t:tr,locale:()=>LOC,load:async l=>{try{const r=await fetch('i18n/'+l+'.json');Object.assign(DICT,await r.json());LOC=l;document.documentElement.lang=l}catch(e){}}};
 window.tr=tr;SFX.tr=tr;I18N.load('en');
 // ---- toasts (A3): non-blocking, never take focus
 const host=()=>{let h=document.getElementById('toasts');if(!h){h=document.createElement('div');h.id='toasts';h.setAttribute('role','status');h.setAttribute('aria-live','polite');
  h.style.cssText='position:fixed;right:12px;bottom:12px;display:flex;flex-direction:column;gap:6px;z-index:9999;max-width:min(360px,90vw)';document.body.appendChild(h)}return h};
 SFX.toast=(msg,o={})=>{const h=host(),el=document.createElement('div'),k=o.kind||'info';
  el.style.cssText='background:var(--card,#fff);color:var(--ink,#222);border:1px solid var(--line,#ccc);border-left:4px solid '+({ok:'#2a8',warn:'#c80',err:'#c33',info:'#58c'}[k]||'#58c')+';border-radius:8px;padding:8px 12px;font-size:13px;box-shadow:0 2px 8px rgba(0,0,0,.15)';
  el.textContent=msg;if(o.action){const b=document.createElement('button');b.textContent=o.action.label;b.style.marginLeft='8px';b.onclick=()=>{o.action.run();el.remove()};el.appendChild(b)}
  while(h.children.length>=4)h.firstChild.remove();h.appendChild(el);let t=setTimeout(()=>el.remove(),o.ms||3500);
  el.onmouseenter=el.onfocusin=()=>clearTimeout(t);el.onmouseleave=()=>{t=setTimeout(()=>el.remove(),1500)};return el};
 addEventListener('keydown',e=>{if(e.key=='Escape'){const h=document.getElementById('toasts');if(h&&h.lastChild&&!document.querySelector('dialog[open]'))h.lastChild.remove()}});
 // ---- dialogs: native <dialog> (focus trap + Esc), focus restored to opener
 const dlg=(title,inner,okLabel,danger,wantInput,val)=>new Promise(res=>{const prev=document.activeElement,d=document.createElement('dialog');
  d.style.cssText='border:1px solid var(--line,#ccc);border-radius:12px;padding:16px;max-width:min(440px,92vw);background:var(--card,#fff);color:var(--ink,#222)';
  d.setAttribute('aria-label',title||'Dialog');
  d.innerHTML='<form method="dialog"><h3 style="margin:0 0 8px">'+esc(title||'')+'</h3>'+inner+'<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px"><button value="cancel" type="button" data-cancel="1">'+esc(tr('ui.cancel'))+'</button><button value="ok" type="submit" class="pri" style="'+(danger?'background:#c33;color:#fff':'')+'">'+esc(okLabel||tr('ui.ok'))+'</button></div></form>';
  document.body.appendChild(d);d.querySelector('[data-cancel]').onclick=()=>d.close('cancel');const inp=d.querySelector('input');if(inp&&val!==undefined)inp.value=val;
  d.addEventListener('close',()=>{const ok=d.returnValue=='ok',v=inp?inp.value:null;d.remove();try{prev&&prev.focus&&prev.focus()}catch(e){}res(wantInput?(ok?v:null):ok)});d.showModal();if(inp)inp.select()});
 SFX.notice=m=>SFX.toast(String(m),{kind:'warn',ms:7000});   // replaces native alert()
 SFX.ask=o=>dlg(o.title,'<p style="margin:0">'+esc(o.body||'')+'</p>',o.confirm,o.danger,false);
 SFX.choose=o=>new Promise(res=>{const prev=document.activeElement,d=document.createElement('dialog');d.style.cssText='border:1px solid var(--line,#ccc);border-radius:12px;padding:16px;max-width:min(480px,92vw);background:var(--card,#fff);color:var(--ink,#222)';d.setAttribute('aria-label',o.title||'Choose');
  d.innerHTML='<form method="dialog"><h3 style="margin:0 0 8px">'+esc(o.title||'')+'</h3><p style="margin:0 0 10px;white-space:pre-wrap">'+esc(o.body||'')+'</p><div style="display:flex;flex-direction:column;gap:6px">'+o.options.map(x=>'<button type="submit" value="'+SFX.escAttr(x[0])+'">'+esc(x[1])+'</button>').join('')+'</div></form>';document.body.appendChild(d);
  d.addEventListener('close',()=>{const v=d.returnValue;d.remove();try{prev&&prev.focus&&prev.focus()}catch(e){}res(v||o.options[o.options.length-1][0])});d.showModal()});
 SFX.askText=o=>dlg(o.title,'<label style="display:block;font-size:12px;margin-bottom:4px">'+esc(o.label||'')+'</label><input style="width:100%" aria-label="'+SFX.escAttr(o.label||o.title||'')+'">',o.confirm,false,true,o.value||'');
 // ---- account dialog (multi-user): sign in / create account; resolves true once a session is stored
 SFX.authDialog=cfg=>new Promise(res=>{const d=document.createElement('dialog');d.style.cssText='border:1px solid var(--line,#ccc);border-radius:12px;padding:16px;width:min(380px,92vw);background:var(--card,#fff);color:var(--ink,#222)';d.setAttribute('aria-label','Sign in to Kathakaar');
  let mode=cfg&&cfg.bootstrap?'up':'in';const can=!!(cfg&&cfg.signup);
  const draw=()=>{const up=mode=='up';d.innerHTML='<form method="dialog" id="af"><h3 style="margin:0 0 4px">'+(up?'Create your account':'Sign in to Kathakaar')+'</h3><p style="margin:0 0 10px;font-size:12px;opacity:.75">'+(up&&cfg.bootstrap?'This is the first account, so it becomes the administrator.':'Your stories are private to your account.')+'</p>'+
   '<label style="display:block;font-size:12px">Username</label><input id="au" autocomplete="username" autocapitalize="off" spellcheck="false" style="width:100%;margin-bottom:8px">'+(up?'<label style="display:block;font-size:12px">Display name (optional)</label><input id="an" autocomplete="name" style="width:100%;margin-bottom:8px">':'')+
   '<label style="display:block;font-size:12px">Password'+(up?' (8+ characters)':'')+'</label><input id="ap" type="password" autocomplete="'+(up?'new-password':'current-password')+'" style="width:100%;margin-bottom:8px">'+
   '<div id="ae" role="alert" style="color:#c33;font-size:12px;min-height:16px"></div><div style="display:flex;gap:8px;justify-content:space-between;align-items:center;margin-top:8px">'+(can||up?'<button type="button" id="am" class="lnk">'+(up?'I have an account':'Create account')+'</button>':'<span></span>')+'<span><button type="button" id="ac">Work offline</button> <button type="submit" class="pri">'+(up?'Create account':'Sign in')+'</button></span></div></form>';
   const $=i=>d.querySelector('#'+i);$('ac').onclick=()=>{d.close();res(false)};const m=$('am');if(m)m.onclick=()=>{mode=up?'in':'up';draw()};
   $('af').onsubmit=async e=>{e.preventDefault();const err=$('ae');err.textContent='';const b=$('af').querySelector('button.pri');b.disabled=true;
    try{const r=await fetch('/api/auth/'+(up?'register':'login'),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:$('au').value,name:up?$('an').value:undefined,password:$('ap').value})}),j=await r.json().catch(()=>({}));
     if(!r.ok){err.textContent=j.error||('Error '+r.status);b.disabled=false;return}
     await window.SFSYNC.useSession(j);d.close();res(true)}catch(x){err.textContent='Cannot reach the server.';b.disabled=false}};$('au').focus()};
  draw();d.addEventListener('cancel',()=>res(false));d.addEventListener('close',()=>d.remove());document.body.appendChild(d);d.showModal()});
 // ---- idle scheduling (A6)
 SFX.scheduleHeavy=(fn,o={})=>window.requestIdleCallback?requestIdleCallback(fn,{timeout:o.timeout||500}):setTimeout(fn,50);
 SFX.quiet=0;   // >0 while a programmatic mutation runs (restore/import/replace) so counters ignore it
 SFX.quietly=f=>{SFX.quiet++;try{return f()}finally{SFX.quiet--}};
 // ---- svg a11y (A5)
 SFX.svgA11y=(svg,label,desc)=>svg.replace(/<svg\b/,'<svg role="img" aria-label="'+SFX.escAttr(label)+'"')+(desc?'':'');
 // ---- overlay host (A11): never re-rendered by render()
 SFX.overlay=()=>{let o=document.getElementById('ov');if(!o){o=document.createElement('div');o.id='ov';document.body.appendChild(o)}return o};
 // ---- diagnostics ring buffer (A13)
 const err=m=>{try{const a=JSON.parse(localStorage.getItem('xl-errors')||'[]');a.push({t:Date.now(),m:String(m).slice(0,300)});localStorage.setItem('xl-errors',JSON.stringify(a.slice(-50)))}catch(e){}};
 addEventListener('error',e=>err(e.message));addEventListener('unhandledrejection',e=>err(e.reason&&e.reason.message||e.reason));
})();
