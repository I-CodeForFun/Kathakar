/* Shared rule logic — used by the browser (window.RULES) and the Node server/tests (require).
   Rule syntax (see README):
     ban   "flying, teleport*, magic"   comma/newline separated; * = any letters inside a word (fly* → fly, flying, flyer)
     trig  "gold + water|river"         groups joined by +, alternatives by | or ,  → rule applies when ALL groups appear together
     text  "Nobody may carry weapons in the temple" → if ban is empty the key concept ("weapons") is derived from the sentence
   `*` has ONE meaning everywhere: "any run of letters inside a word". On the server it is also stripped for meaning-matching. */
(function(root,factory){if(typeof module=='object'&&module.exports)module.exports=factory();else root.RULES=factory()})(typeof self!='undefined'?self:this,function(){
const NEG=/\b(no|not|never|cannot|can't|couldn't|won't|unable|without|nobody|nothing|none|neither|nor|failed|forbidden|impossible)\b/i;
const split=t=>String(t||'').split(/(?<=[.!?…])\s+|\n+/).map(s=>s.trim()).filter(s=>s.length>3);
function stem(w){w=String(w).toLowerCase().replace(/[^\p{L}\p{N}'-]/gu,'');const dbl=x=>/([^aeiouls])\1$/.test(x)?x.slice(0,-1):x;
 if(w.length>5&&/ing$/.test(w))return dbl(w.slice(0,-3));
 if(w.length>4&&/ied$/.test(w))return w.slice(0,-3)+'y';
 if(w.length>4&&/ed$/.test(w))return dbl(w.slice(0,-2));
 if(w.length>4&&/ies$/.test(w))return w.slice(0,-3)+'y';
 if(w.length>4&&/(ches|shes|sses|xes|zes)$/.test(w))return w.slice(0,-2);
 if(w.length>5&&/ly$/.test(w))return w.slice(0,-2);
 if(w.length>3&&/s$/.test(w)&&!/ss$/.test(w))return w.slice(0,-1);
 return w}
// Small built-in lexicon so related words match even with the fallback embedder / the offline checker.
const LEX={water:'river sea ocean lake rain stream pond flood wade swim drown wet',fire:'flame blaze burn torch inferno',ice:'frost snow freeze cold',
 flight:'fly flying flew soar levitate float hover wings',magic:'spell sorcery enchant wizard witch',death:'die kill dead murder',weapon:'sword knife dagger gun blade spear axe bow arrow',
 light:'sun sunlight daylight',dark:'night shadow darkness',gold:'golden gilded',money:'coin coins gold currency payment',teleport:'teleportation vanish blink'};
const LK=Object.entries(LEX).map(([k,v])=>[stem(k),k,v.split(' ')]);
const expand=t=>{const s=stem(t),out=new Set([t]);for(const [ks,k,v] of LK)if(s==ks||v.some(x=>stem(x)==s)){out.add(k);v.forEach(x=>out.add(x))}return [...out]};
const clean=x=>String(x).replace(/\*/g,'').trim();
// ---- wildcard → regex (word-bounded, `*` = letters inside a word)
const wre=t=>{t=String(t||'').trim().toLowerCase();if(!t)return null;const e=t.replace(/[.+?^${}()|[\]\\]/g,'\\$&').replace(/\*/g,'\\p{L}*');try{return new RegExp('(^|[^\\p{L}\\p{N}])'+e+'(?![\\p{L}\\p{N}])','iu')}catch(x){return null}};
// ---- lexical hit: does text contain any of the terms (stem-aware for single words, phrase-aware for multi-word)?
function lexHit(text,terms){text=String(text||'');const low=text.toLowerCase(),st=new Set((low.match(/[\p{L}\p{N}']+/gu)||[]).map(stem));
 for(const t of terms){const w=String(t).trim().toLowerCase();if(!w)continue;
  if(/\s/.test(w)){const re=wre(w);if(re&&re.test(low))return t;continue}
  if(w.includes('*')){const re=wre(w);if(re&&re.test(low))return t;continue}
  if(st.has(stem(w)))return t}return null}
const sentenceOf=(text,terms)=>{for(const s of split(text))if(lexHit(s,terms))return s;return''};
// ---- concept extraction from a rule sentence ----
const GEN=new Set('carry bring use have hold take do make go enter get be is are has possess own wield the a an of any anyone anything everyone people person persons one ones ever again here there it its this that these those their his her them they we you i not to and or but if when then than as at by for from in into on onto over under with within without about after before during near inside outside around across through between against may can could should shall must will would might allowed permitted tolerated possible faster slower more less most least very much many'.split(' '));
const TAIL=/\s+(?:in|inside|within|at|on|onto|into|during|near|around|across|over|under|from|after|before|throughout|outside|beyond|by|unless|where|when|while|because|since|if)\s+.*$/;
function objectOf(p){p=String(p||'').toLowerCase().replace(/[.!?;:]+$/,'').trim();
 p=p.replace(/^(?:(?:may|can|could|should|shall|must|will|would|might|ever|dare|be|is|are|am)\s+)+/,'');
 p=p.replace(/^(?:(?:allowed|permitted|able|possible|supposed|expected)\s+to\s+)/,'');
 p=p.replace(/^(?:(?:ever|again)\s+)+/,'');
 p=p.replace(TAIL,'').replace(/\s+(?:allowed|permitted|tolerated|possible|accepted|at all|ever|again)$/,'');
 return p.replace(/^(?:the|a|an|any|all|some|every|each)\s+/,'').trim()}
function candidates(p){p=objectOf(p);if(!p)return[];const words=p.split(/\s+/).filter(Boolean),content=words.filter(w=>!GEN.has(w)&&w.length>2),out=[];
 if(words.length>1&&words.length<=4&&content.length)out.push(p);content.forEach(w=>out.push(w));if(words.length==1&&content.length&&!out.length)out.push(p);return [...new Set(out)]}
const NEGLEAD=/^(?:no one|nobody|nothing|none|no|never|cannot|can't|forbidden|prohibited|impossible)\b[:,]?\s*(.+)$/i;
const SUBJNEG=/^(.+?)\s+(?:cannot|can't|can not|may not|must not|mustn't|shall not|should not|never|are not allowed to|is not allowed to|are not permitted to|is not permitted to|are forbidden to|is forbidden to|are prohibited from|is prohibited from|are unable to|is unable to|are unable to)\s+(.+)$/i;
const SUBJBAN=/^(.+?)\s+(?:is|are)\s+(?:strictly |absolutely |completely )?(?:forbidden|prohibited|banned|illegal|impossible|taboo|unheard of|not allowed|not permitted|outlawed)\b.*$/i;
const NOEXIST=/^(?:there (?:is|are) no\s+(.+)|(.+?)\s+(?:does|do) not exist)\b.*$/i;
function textConcepts(text){const t=String(text||'').trim();if(!t)return[];let m;
 if((m=NEGLEAD.exec(t)))return candidates(m[1]);
 if((m=NOEXIST.exec(t)))return candidates(m[1]||m[2]);
 if((m=SUBJBAN.exec(t)))return candidates(m[1]);
 if((m=SUBJNEG.exec(t)))return candidates(m[2]);
 return[]}
const banTerms=r=>String(r.ban||'').split(/[,\n]/).map(x=>x.trim()).filter(Boolean);
// base (un-expanded) concepts, then expanded
const baseConcepts=r=>{const b=banTerms(r).map(clean).filter(Boolean);return b.length?b:textConcepts(r.text)};
const concepts=r=>[...new Set(baseConcepts(r).flatMap(expand))];
const wildTerms=r=>banTerms(r).filter(t=>t.includes('*'));
const REACT=/^(?:any |all |the |a |an )?(.+?)\s+(?:reacts? (?:violently |strongly )?(?:with|to)|mix(?:es|ed)? with|combin(?:es|ed) with|touch(?:es|ing)|contact with|meets?|burns? (?:in|with)|dissolves? in)\s+(?:the |a |an )?(\w[\w\s-]*?)(?:\s+(?:and|then|causing|which|so|to)\b.*|[.,;].*)?$/i;
function triggers(r){const t=String(r.trig||'').trim();
 if(t)return {derived:false,groups:t.split('+').map(g=>[...new Set(g.split(/[|,]/).map(clean).filter(Boolean).flatMap(expand))]).filter(g=>g.length)};
 const m=REACT.exec(String(r.text||'').trim());
 return m?{derived:true,groups:[m[1],m[2]].map(x=>x.trim()).map(x=>[...new Set(expand(x))])}:null}
// ---- the offline (lexical) check of one rule against one text → [{how,term,quote,neg}]
function lexCheck(r,text){const out=[];text=String(text||'');
 banTerms(r).forEach(t=>{const re=wre(t);if(!re)return;const m=re.exec(text);if(m){const q=split(text).find(s=>re.test(s))||'';out.push({how:'forbidden word',term:t,quote:q.slice(0,200),score:1,neg:NEG.test(q)})}});
 if(!banTerms(r).length){const cs=concepts(r),h=cs.length&&lexHit(text,cs);if(h){const q=sentenceOf(text,[h]);out.push({how:'rule text',term:h,quote:q.slice(0,200),score:1,neg:NEG.test(q)})}}
 const tg=triggers(r);if(tg&&tg.groups.length){const hits=tg.groups.map(g=>lexHit(text,g));if(hits.every(Boolean))out.push({how:'trigger',term:hits.map(h=>'“'+h+'”').join(' meets '),quote:[...new Set(hits.map((h,i)=>sentenceOf(text,tg.groups[i])))].filter(Boolean).join(' ⟷ ').slice(0,260),score:1,neg:false})}
 return out}
return {NEG,split,stem,LEX,expand,clean,wre,lexHit,sentenceOf,objectOf,textConcepts,concepts,baseConcepts,wildTerms,triggers,lexCheck,banTerms}});
