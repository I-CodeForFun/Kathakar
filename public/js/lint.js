/* Style linter engine (B2). Pure, UMD. lint(text,{rules,ignore}) -> [{ruleId,sev,start,end,line,snippet,msg}] (UTF-16 offsets into text). */
(function(root,factory){if(typeof module=='object'&&module.exports)module.exports=factory();else root.LINT=factory()})(typeof self!='undefined'?self:this,function(){
const IRR=new Set('seen taken given done gone written broken chosen spoken stolen driven eaten fallen forgotten forgiven hidden known shown thrown worn torn born beaten bitten blown drawn flown frozen grown ridden risen shaken sworn woken built bought brought caught found held kept left lost made paid sent set sold taught told thought won'.split(' '));
const ADJ=new Set('red tired bored scared excited interested surprised worried married pleased relaxed confused amazed shocked embarrassed satisfied disappointed annoyed exhausted frightened terrified determined prepared pointed crooked naked wicked'.split(' '));
const LY_OK=new Set('only early family reply apply supply holy ugly silly likely lonely lovely daily weekly monthly yearly friendly orderly elderly belly jelly bully rally ally july italy fly rely lily'.split(' '));
const FILTER=/\b(saw|felt|realized|realised|noticed|watched|heard|seemed|wondered|decided|began to|started to)\b/gi;
const BADTAG=/\b(exclaimed|retorted|quipped|opined|chortled|ejaculated)\b/gi;
const TELL=/\b(felt|was|seemed|looked)\s+(happy|sad|angry|afraid|scared|nervous|excited|tired|furious|anxious|jealous|ashamed|lonely)\b/gi;
const WEAK=/\b(very|really|just|quite|rather|somewhat|suddenly|finally)\b/gi;
const CLICHES=['at the end of the day','avoid like the plague','heart skipped a beat','heart pounded in his chest','heart pounded in her chest','blood ran cold','time stood still','dead as a doorknob','calm before the storm','only time will tell','in the nick of time','tip of the iceberg','a shiver ran down','let out a breath she didn’t know','let out a breath he didn’t know','it was a dark and stormy night','needle in a haystack','smell the roses','against all odds','every fiber of her being','every fibre of his being'];
const RULES={passive:{sev:'info',label:'Passive voice'},adverb:{sev:'info',label:'Adverbs'},filter:{sev:'info',label:'Filter words'},tag:{sev:'warn',label:'Dialogue tags'},repeat:{sev:'warn',label:'Repetition'},longsent:{sev:'info',label:'Long sentences'},cliche:{sev:'warn',label:'Clichés'},tell:{sev:'info',label:'Telling emotion'},weak:{sev:'info',label:'Weak words'},spelling:{sev:'info',label:'Spelling variants'}};
const STOP=new Set('the a an and or but of to in on at for with as by from that this these those it its is was were be been are he she they we you i his her their our my your not no so if then than there here what which who whom when where why how all any some into out up down over under again also just very can could would should will shall may might must do did does had has have'.split(' '));
const VARIANTS=[['colour','color'],['realise','realize'],['grey','gray'],['favour','favor'],['honour','honor'],['neighbour','neighbor'],['organise','organize'],['travelling','traveling']];
const mkLines=t=>{const a=[0];for(let i=0;i<t.length;i++)if(t.charCodeAt(i)==10)a.push(i+1);return a};
const lineOf=(starts,i)=>{let lo=0,hi=starts.length-1;while(lo<hi){const m=(lo+hi+1)>>1;starts[m]<=i?lo=m:hi=m-1}return lo+1};
// dialogue spans: quotes toggle a span; unclosed quote resets at paragraph end
function dialogue(t){const sp=[];let open=-1;for(let i=0;i<t.length;i++){const c=t[i];if(c=='\n'){if(open>=0){sp.push([open,i]);open=-1}continue}
 if(c=='“'||(c=='"'&&open<0)){if(open<0)open=i}else if(c=='”'||(c=='"'&&open>=0)){if(open>=0){sp.push([open,i+1]);open=-1}}}
 if(open>=0)sp.push([open,t.length]);return sp}
const inSpan=(sp,i)=>{let lo=0,hi=sp.length-1;while(lo<=hi){const m=(lo+hi)>>1;if(i<sp[m][0])hi=m-1;else if(i>=sp[m][1])lo=m+1;else return true}return false};   // spans are sorted & disjoint
function lint(text,opt={}){text=String(text||'');const R=opt.rules||{},on=id=>R[id]!==false,out=[],sp=dialogue(text),LS=mkLines(text),ign=new Set(opt.ignore||[]),names=new Set((opt.names||[]).map(s=>s.toLowerCase()));
 const push=(ruleId,start,end,msg,sev)=>{const snippet=text.slice(start,end);if(ign.has(ruleId+':'+snippet.toLowerCase()))return;out.push({ruleId,sev:sev||RULES[ruleId].sev,start,end,line:lineOf(LS,start),snippet,msg})};
 const each=(re,f)=>{re.lastIndex=0;let m;while((m=re.exec(text)))f(m,m.index,m.index+m[0].length)};
 if(on('passive'))each(/\b(?:is|are|was|were|be|been|being|am)\s+(?:\w+ly\s+)?(\w+)\b/gi,(m,s,e)=>{const w=m[1].toLowerCase(),before=text.slice(Math.max(0,s-6),s).toLowerCase();if(inSpan(sp,s))return;
   if(IRR.has(w)||(/ed$/.test(w)&&w.length>4&&!ADJ.has(w)&&!/(very|too|so)\s$/.test(before)))push('passive',s,e,'Possible passive voice')});
 if(on('adverb')){const found=[];each(/\b([A-Za-z]{3,})ly\b/g,(m,s,e)=>{if(!LY_OK.has(m[0].toLowerCase()))found.push([s,e])});const per1k=found.length/Math.max(1,(text.match(/\S+/g)||[]).length)*1000;
   if(per1k>=8||found.length>=5)found.forEach(([s,e])=>push('adverb',s,e,'Adverb ('+per1k.toFixed(0)+' per 1,000 words)'))}
 if(on('filter'))each(FILTER,(m,s,e)=>{if(!inSpan(sp,s))push('filter',s,e,'Filter word — show the perception directly')});
 if(on('tag')){each(BADTAG,(m,s,e)=>push('tag',s,e,'Prefer “said”/“asked”'));each(/\b(said|asked|replied|whispered|shouted)\s+(\w+ly)\b/gi,(m,s,e)=>push('tag',s,e,'Adverb on a dialogue tag'))}
 if(on('longsent')){const max=opt.maxSentence||35;let pos=0;for(const part of text.split(/(?<=[.!?…]["”’']?)\s+/)){const i=text.indexOf(part,pos);pos=i+part.length;const n=(part.match(/\S+/g)||[]).length;if(n>max)push('longsent',i,i+part.length,n+' words in one sentence')}}
 if(on('cliche')){const low=text.toLowerCase();for(const c of CLICHES.concat(opt.cliches||[])){let i=-1;while((i=low.indexOf(c.toLowerCase(),i+1))>=0)push('cliche',i,i+c.length,'Cliché')}}
 if(on('tell'))each(TELL,(m,s,e)=>{if(!inSpan(sp,s))push('tell',s,e,'Telling an emotion — consider showing it')});
 if(on('weak'))each(WEAK,(m,s,e)=>push('weak',s,e,'Weak/filler word'));
 if(on('repeat')){const toks=[];each(/[A-Za-z’']{4,}/g,(m,s,e)=>{const w=m[0].toLowerCase().replace(/(ing|ed|es|s)$/,'');if(!STOP.has(w)&&!names.has(m[0].toLowerCase()))toks.push({w,s,e})});
   const W=40;for(let i=0;i<toks.length;i++){let c=0;const flagged=new Set();for(let j=i;j<toks.length&&j<i+W*1.5;j++)if(toks[j].w==toks[i].w)c++;
    if(c>=4&&!flagged.has(toks[i].w)&&!(i&&toks[i-1].w==toks[i].w)){push('repeat',toks[i].s,toks[i].e,'“'+toks[i].w+'” repeats '+c+'× nearby');i+=W}}
   // repeated sentence openers (3 in a row)
   const sents=text.split(/(?<=[.!?])\s+/);let p2=0,run=0,last='';for(const s of sents){const i=text.indexOf(s,p2);p2=i+s.length;const fw=(s.match(/^\W*(\w+)/)||[])[1];if(fw&&fw.toLowerCase()==last){run++;if(run==2)push('repeat',i,i+fw.length+ (s.match(/^\W*/)[0].length),'Three sentences in a row start with “'+fw+'”')}else run=0;last=fw?fw.toLowerCase():''}}
 if(on('spelling')){const low=text.toLowerCase();for(const [a,b] of VARIANTS){const ia=low.indexOf(a),ib=low.indexOf(b);if(ia>=0&&ib>=0)push('spelling',Math.max(ia,ib),Math.max(ia,ib)+(ia>ib?a:b).length,'Mixed spelling: '+a+' / '+b)}}
 return out.sort((x,y)=>x.start-y.start)}
// density per 1,000 words by rule, for tables
function summary(text,opt){const n=Math.max(1,(String(text).match(/\S+/g)||[]).length),by={};for(const h of lint(text,opt))by[h.ruleId]=(by[h.ruleId]||0)+1;
 const d={};for(const k in by)d[k]=+(by[k]*1000/n).toFixed(1);return{words:n,counts:by,density:d,total:Object.values(by).reduce((a,b)=>a+b,0)}}
return{lint,summary,RULES,dialogue}});
