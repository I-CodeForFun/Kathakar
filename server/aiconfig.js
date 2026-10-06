require('./env');
// AI settings (embedding engine + optional "judge" that verifies candidate violations).
// Stored in data/ai-config.json — NOT in the story key/value store, so API keys are never synced to the browser/other devices.
const fs=require('fs'),path=require('path');
const DATA=process.env.KATHAKAAR_DATA||path.join(__dirname,'..','data'),FILE=path.join(DATA,'ai-config.json'),CAL=path.join(DATA,'ai-calibration.json');
const DEF={embed:{provider:'local',model:'Xenova/bge-base-en-v1.5',baseUrl:'',key:''},judge:{provider:'none',model:'',baseUrl:'',key:''},timeoutMs:60000};
const PRESETS={
 embed:{
  local:[ // run inside this server with transformers.js (ONNX, CPU). Downloaded once from huggingface.co, then offline.
   {id:'Xenova/all-MiniLM-L6-v2',label:'MiniLM L6 — 22M, ~25 MB, fastest (baseline)',lang:'en'},
   {id:'Xenova/bge-small-en-v1.5',label:'BGE small — 33M, ~35 MB, good',lang:'en'},
   {id:'Xenova/bge-base-en-v1.5',label:'BGE base — 109M, ~110 MB, recommended on CPU',lang:'en',rec:1},
   {id:'Xenova/bge-large-en-v1.5',label:'BGE large — 335M, ~340 MB, best local quality (slower)',lang:'en'},
   {id:'Xenova/multilingual-e5-small',label:'Multilingual E5 small — 118M, many languages',lang:'multi'},
   {id:'Xenova/multilingual-e5-base',label:'Multilingual E5 base — 278M, many languages',lang:'multi'}],
  ollama:[
   {id:'nomic-embed-text',label:'nomic-embed-text — 137M, ollama pull nomic-embed-text'},
   {id:'mxbai-embed-large',label:'mxbai-embed-large — 335M, high quality',rec:1},
   {id:'bge-m3',label:'bge-m3 — 568M, multilingual, long context'}],
  openai:[{id:'text-embedding-3-small',label:'OpenAI text-embedding-3-small'},{id:'text-embedding-3-large',label:'OpenAI text-embedding-3-large (best)'}]},
 judge:{
  local:[{id:'Xenova/nli-deberta-v3-small',label:'DeBERTa-v3 small NLI — ~140 MB, CPU, no GPU needed'},{id:'Xenova/nli-deberta-v3-xsmall',label:'DeBERTa-v3 xsmall NLI — ~90 MB, fastest'}],
  ollama:[
   {id:'llama3.2:3b',label:'Llama 3.2 3B — ~2 GB RAM, light'},
   {id:'qwen2.5:7b',label:'Qwen 2.5 7B — ~5 GB, good all-round',rec:1},
   {id:'llama3.1:8b',label:'Llama 3.1 8B — ~5 GB'},
   {id:'qwen2.5:14b',label:'Qwen 2.5 14B — ~9 GB, better judgement'},
   {id:'qwen2.5:32b',label:'Qwen 2.5 32B — ~20 GB, near-remote quality'}],
  openai:[{id:'gpt-4o-mini',label:'gpt-4o-mini (cheap)'},{id:'gpt-4o',label:'gpt-4o'}],
  anthropic:[{id:'claude-haiku-4-5-20251001',label:'Claude Haiku 4.5 (fast, cheap)',rec:1},{id:'claude-sonnet-5-5',label:'Claude Sonnet 5.5 (best judgement)'}]}};
const DEFAULT_URL={ollama:'http://localhost:11434',openai:'https://api.openai.com/v1',anthropic:'https://api.anthropic.com'};
let cfg=null;
const read=f=>{try{return JSON.parse(fs.readFileSync(f,'utf8'))}catch(e){return null}};
function envOverlay(c){const e=process.env;
 if(e.EMBED_BACKEND=='hash')c.embed.provider='hash';
 if(e.EMBED_MODEL)c.embed.model=e.EMBED_MODEL;
 if(e.AI_EMBED_PROVIDER)c.embed.provider=e.AI_EMBED_PROVIDER;if(e.AI_EMBED_MODEL)c.embed.model=e.AI_EMBED_MODEL;
 if(e.AI_JUDGE_PROVIDER)c.judge.provider=e.AI_JUDGE_PROVIDER;if(e.AI_JUDGE_MODEL)c.judge.model=e.AI_JUDGE_MODEL;
 if(e.OLLAMA_URL){['embed','judge'].forEach(k=>{if(c[k].provider=='ollama'&&!c[k].baseUrl)c[k].baseUrl=e.OLLAMA_URL})}
 ['embed','judge'].forEach(k=>{const p=c[k].provider;if(!c[k].key){if(p=='openai'&&e.OPENAI_API_KEY)c[k].key=e.OPENAI_API_KEY;if(p=='anthropic'&&e.ANTHROPIC_API_KEY)c[k].key=e.ANTHROPIC_API_KEY}});
 return c}
function get(){if(cfg)return cfg;const s=read(FILE)||{};cfg=envOverlay({embed:{...DEF.embed,...(s.embed||{})},judge:{...DEF.judge,...(s.judge||{})},timeoutMs:+s.timeoutMs||DEF.timeoutMs});return cfg}
const url=k=>{const c=get()[k];return String(c.baseUrl||DEFAULT_URL[c.provider]||'').replace(/\/+$/,'')};
const ALLOWED={embed:['local','hash','ollama','openai'],judge:['none','local','ollama','openai','anthropic']};
function set(patch){const cur=read(FILE)||{},n={embed:{...DEF.embed,...(cur.embed||{})},judge:{...DEF.judge,...(cur.judge||{})},timeoutMs:cur.timeoutMs||DEF.timeoutMs};
 for(const k of ['embed','judge']){const p=patch&&patch[k];if(!p||typeof p!='object')continue;
  if(p.provider!==undefined){if(!ALLOWED[k].includes(p.provider))throw Object.assign(new Error('bad '+k+' provider'),{status:400});n[k].provider=p.provider}
  ['model','baseUrl'].forEach(f=>{if(typeof p[f]=='string')n[k][f]=p[f].trim().slice(0,300)});
  if(typeof p.baseUrl=='string'&&p.baseUrl.trim()&&!/^https?:\/\//i.test(p.baseUrl.trim()))throw Object.assign(new Error('Base URL must start with http:// or https://'),{status:400});
  if(typeof p.key=='string'&&p.key!=='••••')n[k].key=p.key.trim()}   // '••••' = unchanged
 if(patch&&+patch.timeoutMs>0)n.timeoutMs=Math.min(600000,+patch.timeoutMs);
 fs.mkdirSync(path.dirname(FILE),{recursive:true});const t=FILE+'.tmp';fs.writeFileSync(t,JSON.stringify(n,null,1),{mode:0o600});fs.renameSync(t,FILE);cfg=null;return get()}
const mask=k=>k?'••••'+String(k).slice(-4):'';
function publicView(){const c=get();return{embed:{...c.embed,key:'',hasKey:!!c.embed.key,keyHint:mask(c.embed.key),baseUrl:c.embed.baseUrl,defaultUrl:DEFAULT_URL[c.embed.provider]||''},
 judge:{...c.judge,key:'',hasKey:!!c.judge.key,keyHint:mask(c.judge.key),defaultUrl:DEFAULT_URL[c.judge.provider]||''},timeoutMs:c.timeoutMs,presets:PRESETS}}
const calib=()=>read(CAL)||{};
function saveCalib(id,v){const c=calib();c[id]=v;fs.mkdirSync(path.dirname(CAL),{recursive:true});fs.writeFileSync(CAL,JSON.stringify(c,null,1))}
module.exports={get,set,url,publicView,calib,saveCalib,PRESETS,DEFAULT_URL};
