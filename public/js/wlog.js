/* Word log logic (B1): pure functions. log = {"YYYY-MM-DD":{w,d,s,p}} */
(function(root,factory){if(typeof module=='object'&&module.exports)module.exports=factory();else root.WLOG=factory()})(typeof self!='undefined'?self:this,function(){
const words=t=>(String(t||'').match(/\S+/g)||[]).length;
const day=(d=new Date())=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');   // local date, never UTC
const BULK=/^(insertFromPaste|insertFromDrop|historyUndo|historyRedo|insertFromYank|deleteByCut)$/;
// Classify one input event: {w,d,p} deltas for the log. Bulk edits (paste, undo, >400 words) go to p, not w.
function delta(before,after,inputType){const a=words(after)-words(before);
 if(BULK.test(inputType||'')||Math.abs(a)>400)return{w:0,d:0,p:Math.max(0,a)};
 return a>=0?{w:a,d:0,p:0}:{w:0,d:-a,p:0}}
function add(log,date,x){const o=log[date]||(log[date]={w:0,d:0,s:0,p:0});o.w+=x.w||0;o.d+=x.d||0;o.p+=x.p||0;o.s+=x.s||0;return log}
const dayAdd=(s,n)=>{const [y,m,d]=s.split('-').map(Number),t=new Date(y,m-1,d+n);return day(t)};
// streak = consecutive days (ending today, or yesterday if today not yet met) with w>=goal; optional grace (1 skip per 7)
function streak(log,goal,today,grace){let n=0,d=today,skips=0,run=0;if(!((log[d]||{}).w>=goal))d=dayAdd(d,-1);
 for(let i=0;i<3650;i++){const ok=((log[d]||{}).w||0)>=goal;if(ok){n++;run++}else if(grace&&run>=1&&skips<Math.floor((n+1)/7)+0&&skips<1+Math.floor(n/7)){skips++}else break;d=dayAdd(d,-1)}return n}
function stats(log,goal,today){const ds=Object.keys(log).sort(),act=ds.filter(d=>log[d].w>0),tot=act.reduce((a,d)=>a+log[d].w,0),best=act.reduce((b,d)=>log[d].w>(b.w||0)?{d,w:log[d].w}:b,{});
 const last30=[];for(let i=29;i>=0;i--){const d=dayAdd(today,-i);last30.push({d,w:(log[d]||{}).w||0})}
 const avg=act.length?Math.round(tot/act.length):0,r30=last30.reduce((a,x)=>a+x.w,0)/30;
 return{today:(log[today]||{}).w||0,streak:streak(log,goal,today),total:tot,best,avg,last30,pace:r30}}
// projected finish date toward a total goal given words so far and 30-day pace (words/day)
function project(total,goalWords,pace,today){if(!(goalWords>total)||!(pace>0))return null;return dayAdd(today,Math.ceil((goalWords-total)/pace))}
function heat(log,today,weeks=12){const cells=[],start=dayAdd(today,-(weeks*7-1));for(let i=0;i<weeks*7;i++){const d=dayAdd(start,i);cells.push({d,w:(log[d]||{}).w||0})}return cells}
const csv=log=>'date,written,deleted,pasted,sessions\n'+Object.keys(log).sort().map(d=>[d,log[d].w||0,log[d].d||0,log[d].p||0,log[d].s||0].join(',')).join('\n');
return{words,day,dayAdd,delta,add,streak,stats,project,heat,csv}});
