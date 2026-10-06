// "Judge": verifies candidate violations found by the embedding stage, so meaning-based checks are precise
// (handles negation, hypotheticals, characters merely discussing a thing, …).  Only the few candidate passages
// (≤3 sentences each) + the rule are ever sent — never the whole manuscript.
const crypto=require('crypto'),path=require('path'),AC=require('./aiconfig');
const cache=new Map();let nli={};
const SYSTEM=`You are a continuity checker for fiction. A world has rules that are TRUE in the story. You are given one rule and a short passage.
Decide whether the passage BREAKS the rule: the passage must actually show (or clearly imply) the forbidden thing happening, existing or being possible in this world.
It does NOT break the rule if the thing is merely denied or negated ("nobody flew"), asked about, joked about, imagined, remembered as a legend the story treats as false, or only superficially related by topic.
For "trigger" rules the rule APPLIES when the passage shows the listed things coming together; then judge whether the passage handles them consistently with the rule — answer "violation" only if the passage contradicts the rule, "unsure" if the rule is relevant here but the passage does not show the outcome.
Reply with ONLY compact JSON: {"verdict":"violation"|"ok"|"unsure","reason":"<=25 words, concrete"}`;
const userMsg=({rule,passage,concept,how})=>`Rule (${rule.cat||'world rule'}): ${String(rule.text||'').trim()||'(no text)'}${rule.ban?`\nForbidden words/concepts: ${rule.ban}`:''}${rule.trig?`\nTrigger: ${rule.trig}`:''}${concept?`\nMatched concept: ${concept}`:''}\nCheck type: ${how||'meaning'}\n\nPassage:\n"""${passage}"""`;
const parse=t=>{t=String(t||'');const m=/\{[\s\S]*?\}/.exec(t);if(!m)return null;try{const o=JSON.parse(m[0]);const v=String(o.verdict||'').toLowerCase();return['violation','ok','unsure'].includes(v)?{verdict:v,reason:String(o.reason||'').slice(0,240)}:null}catch(e){return null}};
async function http(url,opt){const ctl=new AbortController(),ms=AC.get().timeoutMs,t=setTimeout(()=>ctl.abort(),ms);
 try{const r=await fetch(url,{...opt,signal:ctl.signal});const txt=await r.text();if(!r.ok)throw new Error(`HTTP ${r.status} ${txt.slice(0,200)}`);return JSON.parse(txt)}
 catch(e){if(e.name=='AbortError')throw new Error('timed out after '+Math.round(ms/1000)+'s');throw e}finally{clearTimeout(t)}}
const enabled=()=>AC.get().judge.provider!='none';
const info=()=>{const j=AC.get().judge;return{provider:j.provider,model:j.model,enabled:j.provider!='none',remote:j.provider=='openai'||j.provider=='anthropic'}};
async function llm(j,msg){
 if(j.provider=='ollama'){const o=await http(AC.url('judge')+'/api/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({model:j.model,stream:false,format:'json',options:{temperature:0,num_ctx:4096},messages:[{role:'system',content:SYSTEM},{role:'user',content:msg}]})});return o.message&&o.message.content}
 if(j.provider=='openai'){const h={'content-type':'application/json'};if(j.key)h.authorization='Bearer '+j.key;const o=await http(AC.url('judge')+'/chat/completions',{method:'POST',headers:h,body:JSON.stringify({model:j.model,temperature:0,max_tokens:200,messages:[{role:'system',content:SYSTEM},{role:'user',content:msg}]})});return o.choices&&o.choices[0]&&o.choices[0].message.content}
 if(j.provider=='anthropic'){if(!j.key)throw new Error('Anthropic API key missing');const o=await http(AC.url('judge')+'/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':j.key,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:j.model,max_tokens:200,temperature:0,system:SYSTEM,messages:[{role:'user',content:msg}]})});return o.content&&o.content.map(c=>c.text||'').join('')}
 throw new Error('no judge provider')}
async function nliJudge(j,req){ // local zero-shot NLI: does the passage entail "This text describes <concept>"?
 if(!req.concept||req.how=='trigger')return{verdict:'unsure',reason:'local NLI judge only verifies concept matches; trigger rules are kept for your review',via:'local'};
 const model=j.model||'Xenova/nli-deberta-v3-small';
 if(!nli[model]){const {pipeline,env}=await import('@xenova/transformers');env.localModelPath=path.join(__dirname,'..','models');env.cacheDir=path.join(__dirname,'..','models','.cache');if(process.env.EMBED_OFFLINE=='1')env.allowRemoteModels=false;nli[model]=await pipeline('zero-shot-classification',model,{quantized:true})}
 const o=await nli[model](req.passage,[`This text describes ${req.concept}.`],{hypothesis_template:'{}',multi_label:true}),p=o.scores[0];
 return{verdict:p>=.6?'violation':p>=.3?'unsure':'ok',reason:`NLI entailment ${Math.round(p*100)}% for “${req.concept}”`,via:'local'}}
async function judgeOne(req){const j=AC.get().judge;if(j.provider=='none')return null;
 const key=crypto.createHash('sha1').update([j.provider,j.model,req.rule.text,req.rule.ban,req.rule.trig,req.concept,req.passage].join('\u0001')).digest('hex');if(cache.has(key))return cache.get(key);
 let out;if(j.provider=='local')out=await nliJudge(j,req);
 else{const raw=await llm(j,userMsg(req)),p=parse(raw);if(!p)throw new Error('judge replied with something that is not JSON: '+String(raw).slice(0,80));out={...p,via:j.provider+':'+j.model}}
 cache.set(key,out);while(cache.size>5000)cache.delete(cache.keys().next().value);return out}
// judge many candidates with limited concurrency; returns {judged, errors:[msg]}; mutates each entry: verdict/judge/via
async function judgeAll(entries,{max=60,conc=4}={}){const todo=entries.slice(0,max),errs=new Set();let i=0;
 await Promise.all(Array.from({length:Math.min(conc,todo.length)},async()=>{while(i<todo.length){const e=todo[i++];
  try{const r=await judgeOne({rule:e._rule,passage:e._ctx||e.quote,concept:e._concept,how:e.how});if(r){e.verdict=r.verdict;e.judge=r.reason;e.via=r.via}}catch(x){errs.add(String(x.message||x).slice(0,160));if(errs.size>=3){i=todo.length}}}}));
 return{judged:todo.filter(e=>e.verdict).length,skipped:Math.max(0,entries.length-max),errors:[...errs]}}
async function test(){const t=Date.now(),r=await judgeOne({rule:{cat:'Physics',text:'Nobody can fly.',ban:'flying'},passage:'The old wizard soared above the rooftops on his broom, laughing.',concept:'flying',how:'meaning'});return{ok:true,ms:Date.now()-t,sample:r,expected:'violation'}}
module.exports={enabled,info,judgeAll,judgeOne,test};
