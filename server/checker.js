// Local semantic rule validation using embeddings. Two kinds of rule logic:
//  1. FORBIDDEN concepts: a sentence close in meaning to one of them is flagged.
//  2. TRIGGERS: when ALL trigger groups (e.g. "gold" + "water") appear in the same scene/character context,
//     the rule applies and the scene is flagged for review.  ("gold reacts with water" -> gold + water)
const crypto=require('crypto'),{embed,info,load}=require('./embedder'),J=require('./judge');
const R=require('../public/js/rules.js'),{NEG,split,expand,clean,concepts,triggers}=R;   // one shared implementation for browser + server
const cache=new Map(),key=t=>crypto.createHash('sha1').update(info().id+t).digest('hex');
async function vectors(texts){await load();const need=[...new Set(texts.filter(t=>!cache.has(key(t))))];
 if(need.length){(await embed(need)).forEach((v,i)=>cache.set(key(need[i]),v));while(cache.size>8000)cache.delete(cache.keys().next().value)}
 return texts.map(t=>cache.get(key(t)))}
const units=s=>{const w=s.split(/\s+/),u=[s];if(w.length>4)for(let i=0;i<=w.length-3;i++)u.push(w.slice(i,i+3).join(' '));return u};
const dot=(a,b)=>{let s=0;for(let i=0;i<a.length;i++)s+=a[i]*b[i];return s};
const threshold=sens=>info().defaultThreshold-.06*Math.max(-1,Math.min(1,+sens||0));
const JMARGIN=.05;   // when a judge verifies, retrieve a bit more broadly (recall) and let the judge restore precision
// Scores every (item, rule). rules:[{id,cs,tg}] items:[{id,sents}] -> {[itemId]:{[ruleId]:{forbidden:[],trigger}}}
async function analyze(rules,items,thr){
 const terms=[...new Set(rules.flatMap(r=>[...r.cs,...(r.tg?r.tg.groups.flat():[])]))],sents=[...new Set(items.flatMap(i=>i.sents.flatMap(units)))];
 const tv={},sv={};(await vectors(terms)).forEach((v,i)=>tv[terms[i]]=v);(await vectors(sents)).forEach((v,i)=>sv[sents[i]]=v);
 const best=(it,t,neg)=>{let b={score:-1,sentence:''};it.sents.forEach((s,i)=>{let sc=Math.max(...units(s).map(u=>dot(sv[u],tv[t])));const n=neg&&NEG.test(s);if(n)sc-=.1;if(sc>b.score)b={score:sc,sentence:s,neg:n,ctx:it.sents.slice(Math.max(0,i-1),i+2).join(' ')}});return b};
 const out={};
 for(const it of items){out[it.id]={};for(const r of rules){
  const forbidden=r.cs.map(c=>({concept:c,...best(it,c,true)})).map(x=>({...x,hit:x.score>=thr}));
  let trigger=null;
  if(r.tg){const groups=r.tg.groups.map(g=>{const b=g.map(t=>({term:t,...best(it,t,false)})).sort((a,b)=>b.score-a.score)[0];return {terms:g,term:b.term,sentence:b.sentence,score:b.score,hit:b.score>=thr}});
   trigger={derived:r.tg.derived,groups,fired:groups.every(g=>g.hit)}}
  out[it.id][r.id]={forbidden,trigger}}}
 return out}
const prep=rules=>(rules||[]).map(r=>({...r,cs:concepts(r),tg:triggers(r),wild:R.wildTerms(r)})).filter(r=>r.id&&(r.cs.length||r.tg||r.wild.length));
// world:{rules:[{id,text,ban,trig}]} items:[{id,text}] sens:-1 loose .. +1 strict
const MAXI=500,MAXC=60000;
async function check(world,items,sens=0){await load();const rules=prep(world.rules),thr0=threshold(sens),thr=J.enabled()?thr0-JMARGIN:thr0,results={},cand=[];
 const truncated=items.length>MAXI||items.some(i=>String(i.text||'').length>MAXC);
 items=items.slice(0,MAXI).map(i=>({id:i.id,sents:split(String(i.text||'').slice(0,MAXC))}));items.forEach(i=>results[i.id]=[]);
 if(rules.length){const A=await analyze(rules,items,thr);
  for(const it of items)for(const r of rules){const a=A[it.id][r.id];
   if(r.wild.length){const txt=it.sents.join('\n'),h=r.wild.map(t=>({t,re:R.wre(t)})).find(x=>x.re&&x.re.test(txt));if(h){results[it.id].push({rule:r.id,how:'forbidden word',score:1,quote:(it.sents.find(q=>h.re.test(q))||'').slice(0,200),reason:`Matches forbidden pattern “${h.t}”`});continue}}
   if(a.trigger&&a.trigger.fired){const g=a.trigger.groups;results[it.id].push({rule:r.id,how:'trigger',score:Math.min(...g.map(x=>x.score)),quote:[...new Set(g.map(x=>x.sentence))].join(' ⟷ ').slice(0,260),_ctx:[...new Set(g.map(x=>x.ctx))].join('\n…\n').slice(0,1200),_rule:r,
    reason:`Rule applies here: “${g.map(x=>x.term).join('” meets “')}” — check the story honours “${String(r.text||'').trim()}”`});continue}
   const f=a.forbidden.filter(x=>x.hit).sort((x,y)=>y.score-x.score)[0];
   if(f)results[it.id].push({rule:r.id,how:'meaning',score:f.score,concept:f.concept,_concept:f.concept,_ctx:f.ctx,_rule:r,quote:f.sentence.slice(0,200),reason:`Close in meaning to forbidden “${f.concept}” (${Math.round(f.score*100)}% match${f.neg?', negation present – check context':''})`})}}
 let judge={...J.info(),judged:0,dismissed:0,errors:[],skipped:0};
 if(J.enabled()){for(const id of Object.keys(results))results[id].forEach(x=>{if(x._rule&&(x.how=='meaning'||x.how=='trigger'))cand.push(x)});
  const r=await J.judgeAll(cand);judge.judged=r.judged;judge.errors=r.errors;judge.skipped=r.skipped;
  for(const id of Object.keys(results))results[id]=results[id].filter(x=>{if(x.verdict=='ok'){judge.dismissed++;return false}return true})}
 for(const id of Object.keys(results))results[id].forEach(x=>{delete x._rule;delete x._ctx;delete x._concept});
 return {results,truncated,limits:{items:MAXI,chars:MAXC},judge,engine:{...info(),threshold:+thr.toFixed(2)}}}
// Detailed scores for the AI test page.
async function explain(rule,text,sens=0){await load();const rules=prep([{id:'t',...rule}]),thr=J.enabled()?threshold(sens)-JMARGIN:threshold(sens),items=[{id:'t',sents:split(String(text||'').slice(0,20000))}];
 const a=rules.length&&items[0].sents.length?(await analyze(rules,items,thr)).t.t:null;
 return {engine:{...info(),threshold:+thr.toFixed(2)},checkable:!!rules.length,sentences:items[0].sents.length,
  forbidden:a?a.forbidden.sort((x,y)=>y.score-x.score).slice(0,6):[],trigger:a?a.trigger:null,
  flagged:!!a&&((a.trigger&&a.trigger.fired)||(!(a.trigger&&a.trigger.fired)&&a.forbidden.some(x=>x.hit))),
  judge:await (async()=>{if(!a||!J.enabled())return null;const f=a.forbidden.filter(x=>x.hit).sort((x,y)=>y.score-x.score)[0],t=a.trigger&&a.trigger.fired;if(!f&&!t)return{...J.info(),skipped:'nothing was flagged, so nothing to verify'};
   try{const r=await J.judgeOne({rule:rules[0],passage:t?a.trigger.groups.map(g=>g.sentence).join(' … '):(f.ctx||f.sentence),concept:f&&!t?f.concept:'',how:t?'trigger':'meaning'});return{...J.info(),...r}}catch(e){return{...J.info(),error:String(e.message||e)}}})()}}
module.exports={check,explain,concepts,triggers};
