// Text embeddings with pluggable engines (see aiconfig.js):
//   local  – transformers.js ONNX model run in this process (MiniLM … BGE-large, multilingual E5)
//   ollama – any embedding model served by a local Ollama
//   openai – OpenAI-compatible /embeddings endpoint (OpenAI, Azure-compatible gateways, LM Studio, vLLM, …)
//   hash   – built-in hashed n-gram fallback (always works, weak on synonyms)
// Falls back to `hash` (and says why) if the chosen engine can't be loaded.
const path=require('path'),AC=require('./aiconfig');
let ready=null,pipes={},state={provider:'hash',model:'',reason:'',dim:0};
const sigOf=()=>{const c=AC.get().embed;return[c.provider,c.model,AC.url('embed'),c.key?1:0].join('|')};
let loadedSig='';
const E5=/e5/i;
const prefix=m=>E5.test(m)?'query: ':'';
const norm=v=>{let n=0;for(const x of v)n+=x*x;n=Math.sqrt(n)||1;return Array.from(v,x=>x/n)};
async function http(url,opt,ms){const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),ms||AC.get().timeoutMs);
 try{const r=await fetch(url,{...opt,signal:ctl.signal});if(!r.ok){let b='';try{b=(await r.text()).slice(0,300)}catch(e){}throw new Error(`${url.replace(/\?.*/,'')} → HTTP ${r.status} ${b}`)}return await r.json()}
 catch(e){if(e.name=='AbortError')throw new Error('Timed out contacting '+url);throw e}finally{clearTimeout(t)}}
async function loadLocal(model){if(pipes[model])return pipes[model];
 const {pipeline,env}=await import('@xenova/transformers');env.localModelPath=path.join(__dirname,'..','models');env.cacheDir=path.join(__dirname,'..','models','.cache');
 if(process.env.EMBED_OFFLINE=='1')env.allowRemoteModels=false;
 return pipes[model]=await pipeline('feature-extraction',model,{quantized:true})}
function load(force){const sig=sigOf();if(!force&&ready&&sig==loadedSig)return ready;loadedSig=sig;
 return ready=(async()=>{const c=AC.get().embed;state={provider:c.provider,model:c.model,reason:'',dim:0};
  try{
   if(c.provider=='hash'){state={provider:'hash',model:'built-in hashed n-gram embedder',reason:'',dim:512};return}
   if(c.provider=='local'){await loadLocal(c.model||'Xenova/bge-base-en-v1.5');state.dim=0;if(!AC.calib()[engineId()])setImmediate(()=>calibrate().catch(()=>{}));return}
   if(c.provider=='ollama'||c.provider=='openai'){await embed(['ping'],true);if(!AC.calib()[engineId()])setImmediate(()=>calibrate().catch(()=>{}));return}   // probe
   throw new Error('unknown provider '+c.provider)}
  catch(e){const msg=String(e.message||e).split('\n')[0];console.warn('[embedder] '+c.provider+' unavailable, using built-in hash embedder:',msg);state={provider:'hash',model:'built-in hashed n-gram embedder',reason:`${c.provider} “${c.model}”: ${msg}`,dim:512,wanted:c.provider}}})()}
const STOP=new Set('a an the and or but of in on at to for with by from is are was were be been it its he she they his her their this that as into over under than then so'.split(' '));
const D=512,stem=w=>w.replace(/(ing|ed|es|s|ly)$/,'').replace(/(.)\1$/,'$1')||w;
const fnv=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
function hashEmbed(t){const v=new Float32Array(D),add=(f,w)=>{const h=fnv(f);v[h%D]+=(h&0x80000000?-1:1)*w};
 for(const w of t.toLowerCase().match(/\p{L}+/gu)||[]){if(STOP.has(w))continue;const s=stem(w);add('w'+s,1);const p='<'+s+'>';for(let i=0;i<p.length-2;i++)add('c'+p.slice(i,i+3),.2)}
 return norm(v)}
async function embed(texts,probe){const c=AC.get().embed;if(!probe)await load();
 const p=probe?c.provider:state.provider;
 if(p=='hash')return texts.map(hashEmbed);
 let out=[];
 if(p=='local'){const pipe=await loadLocal(c.model||'Xenova/bge-base-en-v1.5'),pre=prefix(c.model||'');
  for(let i=0;i<texts.length;i+=16){const o=await pipe(texts.slice(i,i+16).map(t=>pre+t),{pooling:'mean',normalize:true});out.push(...o.tolist())}}
 else if(p=='ollama'){const base=AC.url('embed');
  for(let i=0;i<texts.length;i+=32){const j=await http(base+'/api/embed',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({model:c.model,input:texts.slice(i,i+32)})});
   if(!Array.isArray(j.embeddings))throw new Error('Ollama returned no embeddings (is “'+c.model+'” an embedding model? try: ollama pull '+c.model+')');out.push(...j.embeddings.map(norm))}}
 else if(p=='openai'){const base=AC.url('embed'),h={'content-type':'application/json'};if(c.key)h.authorization='Bearer '+c.key;
  for(let i=0;i<texts.length;i+=96){const j=await http(base+'/embeddings',{method:'POST',headers:h,body:JSON.stringify({model:c.model,input:texts.slice(i,i+96)})});
   if(!j.data)throw new Error('Embedding API returned no data');out.push(...j.data.sort((a,b)=>a.index-b.index).map(d=>norm(d.embedding)))}}
 if(out[0])state.dim=out[0].length;return out}
// default match thresholds per engine (replaced by calibration when available); similarity scales differ a lot between models
const DEFAULTS=[[/all-MiniLM/i,.42],[/bge-(small|base)/i,.62],[/bge-large/i,.6],[/e5/i,.82],[/nomic/i,.55],[/mxbai/i,.55],[/bge-m3/i,.5],[/text-embedding-3/i,.33]];
const engineId=()=>state.provider=='hash'?'hash':state.provider+':'+state.model;
function defaultThreshold(){if(state.provider=='hash')return .4;const cal=AC.calib()[engineId()];if(cal&&cal.thr)return cal.thr;for(const [re,v] of DEFAULTS)if(re.test(state.model))return v;return .5}
const info=()=>({backend:state.provider=='hash'?'hash':(state.provider=='local'?'neural':state.provider),provider:state.provider,id:engineId(),model:state.model,reason:state.reason,wanted:state.wanted||'',dim:state.dim,defaultThreshold:defaultThreshold(),calibrated:!!(AC.calib()[engineId()]),neural:state.provider!='hash'});
// ---- calibration: find the cosine threshold that best separates "means the concept" from "unrelated" on a built-in sample set
const CAL_SET=[
 ['flying','The wizard soared above the rooftops on his broom.',1],['flying','Wings beating, the dragon rose into the clouds.',1],['flying','She levitated a foot off the floor.',1],['flying','He ploughed the field at dawn.',0],['flying','The baker sold twelve loaves before noon.',0],
 ['weapons','Guards carried swords and spears into the hall.',1],['weapons','He drew a dagger from his boot.',1],['weapons','The archer notched an arrow.',1],['weapons','She poured tea into two cups.',0],['weapons','The children sang a lullaby.',0],
 ['water','They waded across the river at dawn.',1],['water','Rain hammered the roof all night.',1],['water','He dived into the lake.',1],['water','The desert stretched dry and endless.',0],['water','She sharpened her pencil.',0],
 ['death','The old king died in his sleep.',1],['death','The assassin murdered the minister.',1],['death','Villagers mourned the dead.',1],['death','The market bustled with life and laughter.',0],['death','He planted tomatoes in spring.',0],
 ['money','He paid three gold coins for the horse.',1],['money','The merchant counted his profits.',1],['money','The treasury was nearly empty of silver.',1],['money','The moon rose over the quiet hills.',0],['money','She hummed while she walked.',0],
 ['magic','The witch cast a spell over the cauldron.',1],['magic','Sorcery crackled in the air.',1],['magic','The enchanted door glowed blue.',1],['magic','They ate bread and cheese by the fire.',0],['magic','He mended the broken fence.',0]];
async function calibrate(){await load();if(state.provider=='hash')return{thr:.4,f1:null,note:'built-in embedder uses a fixed threshold'};
 const terms=[...new Set(CAL_SET.map(x=>x[0]))],sents=CAL_SET.map(x=>x[1]),tv=await embed(terms),sv=await embed(sents),dot=(a,b)=>{let s=0;for(let i=0;i<a.length;i++)s+=a[i]*b[i];return s};
 const sc=CAL_SET.map((x,i)=>({s:dot(tv[terms.indexOf(x[0])],sv[i]),y:x[2]})),pos=sc.filter(x=>x.y),neg=sc.filter(x=>!x.y),mean=a=>a.reduce((p,q)=>p+q.s,0)/a.length;
 let best={thr:.5,f1:-1};const all=sc.map(x=>x.s).sort((a,b)=>a-b);
 for(let i=0;i<all.length-1;i++){const t=(all[i]+all[i+1])/2,tp=pos.filter(x=>x.s>=t).length,fp=neg.filter(x=>x.s>=t).length,fn=pos.length-tp,f=2*tp/(2*tp+fp+fn||1);if(f>best.f1+1e-9)best={thr:t,f1:f}}
 const out={thr:+Math.max(.2,best.thr-.015).toFixed(3),f1:+best.f1.toFixed(3),posMean:+mean(pos).toFixed(3),negMean:+mean(neg).toFixed(3),n:sc.length,at:Date.now()};AC.saveCalib(engineId(),out);return out}
module.exports={embed,info,load,calibrate,hashEmbed};
