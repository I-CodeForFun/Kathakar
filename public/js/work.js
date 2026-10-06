/* Worker: runs lint / readability / search-index off the main thread. Falls back to main thread if Workers are unavailable. */
importScripts('lint.js','read.js','find.js');
onmessage=e=>{const{id,type,payload}=e.data;try{let r;
 if(type=='lint')r=LINT.lint(payload.text,payload.opt);
 else if(type=='summary')r=LINT.summary(payload.text,payload.opt);
 else if(type=='read')r=READ.analyze(payload.text);
 else if(type=='index')r=FIND.build(payload.S).length;
 postMessage({id,ok:true,r})}catch(x){postMessage({id,ok:false,error:String(x&&x.message||x)})}};
