/* Readability (C9.3): Flesch, Flesch-Kincaid, Gunning Fog + basic text stats. Pure, UMD. */
(function(root,factory){if(typeof module=='object'&&module.exports)module.exports=factory();else root.READ=factory()})(typeof self!='undefined'?self:this,function(){
const EXC={beautiful:3,the:1,he:1,she:1,me:1,we:1,be:1,fire:1,hour:1,our:1,every:2,evening:2,different:3,business:2,area:3,idea:3,being:2,create:2,science:2,quiet:2,poem:2,video:3,radio:3,real:1,really:2,people:2,table:2,little:2,simple:2,people:2,eye:1,eyes:1,bone:1,done:1,come:1,some:1,more:1};
function syl(w){w=w.toLowerCase().replace(/[^a-z]/g,'');if(!w)return 0;if(EXC[w]!==undefined)return EXC[w];if(w.length<=3)return 1;
 let t=w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/,'').replace(/^y/,'');const m=t.match(/[aeiouy]{1,2}/g);let n=m?m.length:1;if(/[^aeiouy]le$/.test(w)&&!/(?:[^laeiouy]es|ed)$/.test(w)&&n<2)n++;if(/[^aeiouy]le$/.test(w)&&m&&n>=1&&!/^.?[aeiouy]*le$/.test(w)){}return Math.max(1,n)}
const ABBR=/\b(?:Mr|Mrs|Ms|Dr|St|Prof|Sr|Jr|vs|etc|e\.g|i\.e)\.$/;
function sentences(t){const out=[];let cur='';for(const part of String(t).split(/(?<=[.!?…]["'”’)]*)\s+/)){cur=cur?cur+' '+part:part;if(!ABBR.test(cur.trim())){if(cur.trim())out.push(cur.trim());cur=''}}if(cur.trim())out.push(cur.trim());return out}
function analyze(text){const ws=(String(text).match(/[A-Za-z][A-Za-z'’-]*/g)||[]),sn=sentences(text).length||(ws.length?1:0),w=ws.length;
 if(!w)return{words:0,sentences:0,syllables:0,fre:0,fk:0,fog:0,avgSentence:0,longWordPct:0,dialoguePct:0};
 let sy=0,cx=0,lw=0;for(const x of ws){const s=syl(x);sy+=s;if(s>=3)cx++;if(x.length>=7)lw++}
 const dl=(String(text).match(/[“"][^”"]*[”"]/g)||[]).join(' ').split(/\s+/).filter(Boolean).length;
 return{words:w,sentences:sn,syllables:sy,fre:206.835-1.015*(w/sn)-84.6*(sy/w),fk:0.39*(w/sn)+11.8*(sy/w)-15.59,fog:0.4*((w/sn)+100*(cx/w)),avgSentence:w/sn,longWordPct:100*lw/w,dialoguePct:100*dl/w}}
const BANDS={PB:{fk:[0,3]},MG:{fk:[3,7]},YA:{fk:[5,9]},NA:{fk:[6,11]},Adult:{fk:[6,14]}};
return{syl,sentences,analyze,BANDS}});
