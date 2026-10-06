/* Search index + fuzzy matcher (B5/B9). Pure, UMD. */
(function(root,factory){if(typeof module=='object'&&module.exports)module.exports=factory();else root.FIND=factory()})(typeof self!='undefined'?self:this,function(){
const fold=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const tok=s=>fold(s).match(/[a-z0-9]+/g)||[];
function dl(a,b){if(a==b)return 0;const n=a.length,m=b.length;if(Math.abs(n-m)>1)return 2;const d=Array.from({length:n+1},(_,i)=>[i]);for(let j=1;j<=m;j++)d[0][j]=j;
 for(let i=1;i<=n;i++)for(let j=1;j<=m;j++){const c=a[i-1]==b[j-1]?0:1;d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+c);if(i>1&&j>1&&a[i-1]==b[j-2]&&a[i-2]==b[j-1])d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1)}return d[n][m]}
const TYPES={ev:'event',chars:'character',places:'place',info:'info',worlds:'rule'};
function build(S){const docs=[],add=(type,id,title,text)=>{const t=fold(title+' '+text);docs.push({type,id,title:title||'(untitled)',text:String(text||''),f:t,tokens:new Set(tok(title+' '+text))})};
 (S.ev||[]).forEach(e=>add('ev',e.id,e.title,[e.notes,e.prose,e.fin&&e.fin.book,e.fin&&e.fin.script,e.tag,e.mood].filter(Boolean).join(' ')));
 (S.chars||[]).forEach(c=>add('chars',c.id,c.name,[c.role,c.notes,c.desc].filter(Boolean).join(' ')));
 (S.places||[]).forEach(p=>add('places',p.id,p.name,[p.desc,p.notes].filter(Boolean).join(' ')));
 (S.info||[]).forEach(i=>add('info',i.id,i.title||i.text,i.text||''));
 (S.worlds||[]).forEach(w=>{add('worlds',w.id,w.name,w.desc);(w.rules||[]).forEach(r=>add('worlds',w.id,w.name+': '+(r.cat||'rule'),r.text))});
 (S.props||[]).forEach(p=>add('props',p.id,p.name,[p.kind,p.desc].filter(Boolean).join(' ')));
 (S.inbox||[]).forEach(n=>add('inbox',n.id,n.text.slice(0,40),n.text));return docs}
// query syntax: space=AND, a|b=OR, -x=NOT, "phrase", type:event
function parse(q){const terms=[],not=[],phr=[];let type=null;q=String(q||'');q=q.replace(/"([^"]+)"/g,(m,p)=>{phr.push(fold(p));return ' '});
 for(const raw of q.split(/\s+/).filter(Boolean)){if(/^type:/i.test(raw)){type=raw.slice(5).toLowerCase();continue}if(raw[0]=='-'&&raw.length>1){not.push(fold(raw.slice(1)));continue}terms.push(raw.split('|').map(fold).filter(Boolean))}return{terms,not,phr,type}}
const hit=(d,w)=>{if(d.f.includes(w))return true;if(w.length>=5)for(const t of d.tokens)if(Math.abs(t.length-w.length)<=1&&dl(t,w)<=1)return true;return false};
function search(docs,q,limit=50){const P=parse(q);if(!P.terms.length&&!P.phr.length)return[];const out=[];
 for(const d of docs){if(P.type&&(TYPES[d.type]||d.type)!=P.type&&d.type!=P.type)continue;
  if(P.not.some(w=>d.f.includes(w)))continue;if(!P.phr.every(p=>d.f.includes(p)))continue;if(!P.terms.every(alt=>alt.some(w=>hit(d,w))))continue;
  const tl=fold(d.title);let sc=0;P.terms.forEach(alt=>alt.forEach(w=>{if(tl==w)sc+=10;else if(tl.startsWith(w))sc+=6;else if(tl.includes(w))sc+=4;else sc+=1}));out.push({...d,score:sc})}
 out.sort((a,b)=>b.score-a.score);const per={},res=[];for(const r of out){per[r.type]=(per[r.type]||0)+1;if(per[r.type]<=limit)res.push(r)}return res}
function snippet(text,q,n=80){const P=parse(q),w=(P.phr[0]||(P.terms[0]||[])[0]||''),f=fold(text),i=w?f.indexOf(w):-1;if(i<0)return text.slice(0,n);const s=Math.max(0,i-20);return(s?'…':'')+text.slice(s,s+n)}
// fuzzy subsequence score for the command palette (higher = better, -1 = no match)
function fuzzy(q,s){q=fold(q);s=fold(s);if(!q)return 0;let qi=0,sc=0,last=-2;for(let i=0;i<s.length&&qi<q.length;i++){if(s[i]==q[qi]){sc+=1+(i==last+1?2:0)+(i==0||s[i-1]==' '?3:0);last=i;qi++}}return qi<q.length?-1:sc-s.length*0.01}
// replace all (returns [{id,field,count}] preview and applies when apply=true)
function replaceAll(S,find,rep,{whole=false,cs=false,apply=false}={}){if(!find)return[];const esc=find.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),re=new RegExp(whole?'\\b'+esc+'\\b':esc,cs?'g':'gi'),out=[];
 for(const e of S.ev||[]){for(const [obj,key] of [[e,'title'],[e,'notes'],[e,'prose'],[e.fin||{},'book'],[e.fin||{},'script']]){const v=obj[key];if(typeof v!='string')continue;const c=(v.match(re)||[]).length;if(c){out.push({id:e.id,field:key,count:c});if(apply)obj[key]=v.replace(re,()=>rep)}}}return out}
return{fold,tok,dl,build,parse,search,snippet,fuzzy,replaceAll}});
