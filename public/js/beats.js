/* Beat-sheet templates (B3): built-ins as code constants + pure apply planning. UMD. */
(function(root,factory){if(typeof module=='object'&&module.exports)module.exports=factory();else root.BEATS=factory()})(typeof self!='undefined'?self:this,function(){
const P=(a)=>a.map((x,i)=>({id:'p'+(i+1),t:x[0],pos:x[1],act:x[2],note:x[3]||''}));
const T=[
 {id:'stc',ver:1,name:'Save the Cat',structure:'15 beats',points:P([['Opening Image',0.01,1,'A snapshot of the hero’s flawed world'],['Theme Stated',0.05,1],['Set-Up',0.08,1],['Catalyst',0.10,1,'Life-changing event'],['Debate',0.15,1],['Break into Two',0.20,2],['B Story',0.22,2],['Fun and Games',0.35,2],['Midpoint',0.50,2],['Bad Guys Close In',0.62,2],['All Is Lost',0.75,2],['Dark Night of the Soul',0.80,2],['Break into Three',0.85,3],['Finale',0.92,3],['Final Image',0.99,3]])},
 {id:'hero',ver:1,name:'Hero’s Journey',structure:'12 stages',points:P([['Ordinary World',0.03,1],['Call to Adventure',0.10,1],['Refusal of the Call',0.15,1],['Meeting the Mentor',0.20,1],['Crossing the Threshold',0.25,2],['Tests, Allies, Enemies',0.38,2],['Approach to the Inmost Cave',0.48,2],['The Ordeal',0.55,2],['Reward',0.65,2],['The Road Back',0.77,3],['Resurrection',0.90,3],['Return with the Elixir',0.98,3]])},
 {id:'circle',ver:1,name:'Story Circle',structure:'8 steps',points:P([['You (comfort)',0.04,1],['Need',0.14,1],['Go',0.27,2],['Search',0.40,2],['Find',0.52,2],['Take',0.65,2],['Return',0.80,3],['Change',0.95,3]])},
 {id:'3act',ver:1,name:'Three-Act',structure:'7 key beats',points:P([['Setup',0.05,1],['Inciting Incident',0.12,1],['Plot Point 1',0.25,1],['Midpoint',0.50,2],['Plot Point 2',0.75,2],['Climax',0.90,3],['Resolution',0.98,3]])},
 {id:'7pt',ver:1,name:'Seven-Point',structure:'7 points',points:P([['Hook',0.02,1],['Plot Turn 1',0.25,1],['Pinch 1',0.375,2],['Midpoint',0.50,2],['Pinch 2',0.625,2],['Plot Turn 2',0.75,3],['Resolution',0.98,3]])},
 {id:'kish',ver:1,name:'Kishōtenketsu',structure:'4 parts',points:P([['Ki (introduction)',0.10,1],['Shō (development)',0.40,2],['Ten (twist)',0.70,3],['Ketsu (reconciliation)',0.95,4]])},
 {id:'fichtean',ver:1,name:'Fichtean Curve',structure:'crisis sequence',points:P([['Immediate crisis',0.03,1],['Rising crisis 1',0.20,1],['Rising crisis 2',0.40,2],['Rising crisis 3',0.60,2],['Climax',0.85,3],['Falling action',0.96,3]])},
 {id:'freytag',ver:1,name:'Freytag’s Pyramid',structure:'5 parts',points:P([['Exposition',0.08,1],['Rising action',0.30,2],['Climax',0.55,3],['Falling action',0.80,4],['Denouement',0.96,5]])},
 {id:'rtb',ver:1,name:'Romancing the Beat',structure:'12 beats',points:P([['Setup',0.05,1],['Meet-cute',0.12,1],['No way this will work',0.20,1],['Adhesion',0.28,2],['Deepening desire',0.40,2],['Maybe this could work',0.48,2],['Midpoint',0.50,2],['Retreat',0.62,3],['Ruin',0.75,3],['Dark moment',0.82,3],['Grand gesture',0.92,4],['HEA / HFN',0.99,4]])}];
const byId=id=>T.find(t=>t.id==id)||null;
// Plan how to apply a template. mode 'create' → events to create at fractions of [mn,mx]; mode 'map' → nearest unmapped event per point.
function plan(tpl,events,mode,span){const pts=tpl.points,mn=span?span[0]:0,mx=span?span[1]:100,at=p=>mn+(mx-mn)*p.pos;
 const done=new Set(events.filter(e=>e.beat&&e.beat.startsWith(tpl.id+':')).map(e=>e.beat.split(':')[1]));
 if(mode=='create')return pts.filter(p=>!done.has(p.id)).map(p=>({point:p.id,t:Math.round(at(p)*100)/100,title:p.t,note:p.note,act:p.act}));
 const sorted=[...events].filter(e=>!e.beat||!e.beat.startsWith(tpl.id+':')).sort((a,b)=>(+a.t||0)-(+b.t||0)),used=new Set(),out=[];
 for(const p of pts){if(done.has(p.id))continue;let best=null,bd=Infinity;for(const e of sorted){if(used.has(e.id))continue;const d=Math.abs((+e.t||0)-at(p));if(d<bd){bd=d;best=e}}if(best){used.add(best.id);out.push({point:p.id,eventId:best.id,act:p.act})}}return out}
// Checklist status per point: unmapped | mapped | out-of-band (event outside ±10% of target position)
function checklist(tpl,events,span){const mn=span?span[0]:0,mx=span?span[1]:100,rng=(mx-mn)||1;
 return tpl.points.map(p=>{const e=events.find(x=>x.beat==tpl.id+':'+p.id);if(!e)return{point:p,status:'unmapped'};const pos=((+e.t||0)-mn)/rng,d=pos-p.pos;return{point:p,event:e,status:Math.abs(d)>0.1?'out-of-band':'mapped',delta:Math.round(d*100)}})}
return{TEMPLATES:T,byId,plan,checklist}});
