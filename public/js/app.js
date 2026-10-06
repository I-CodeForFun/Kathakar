
const MOODS=['😊 Happy','😢 Sad','😠 Angry','😨 Afraid','😐 Neutral','🤩 Excited','😴 Tired','🤔 Curious','😍 In love','😈 Scheming'];
const RT=['Family','Friend','Lover','Ally','Rival','Enemy','Mentor','Servant','Stranger'];
const RC={Family:'#e6a23c',Friend:'#3cb371',Lover:'#e0507a',Ally:'#4a90e2',Rival:'#e67e22',Enemy:'#d63031',Mentor:'#9b59b6',Servant:'#888',Stranger:'#aaa'};
const COL=['#6d5ae6','#e0507a','#2fa86b','#e6a23c','#2b9ad8','#c0504d','#8e6bbf'];
const uid=()=>Math.random().toString(36).slice(2,8);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function seed(){const s=seedOld(),m=(n,l,p,e)=>({id:uid(),name:n,lv:l,parent:p,exp:e});
const pl=m('Aurelia',2,null,1),ct=m('Northlands',3,pl.id,1),yr=m('Year 1042',3,null,1),dy=m('Day 1',5,yr.id,1);
s.places.forEach((p,i)=>{p.parent=ct.id;p.lv=[10,10,8][i];p.exp=0});
s.times.forEach(t=>{t.parent=dy.id;t.lv=6;t.exp=0});
s.places.unshift(pl,ct);s.times.unshift(yr,dy);s.times.push(m('Day 2',5,yr.id,0));
s.info.forEach(i=>{[i.pl,i.tm]=i.cell.split('|')});s.sc={[s.info[0].cell]:{t:'The escape plan',s:'Aria and Kael plot a way out under the chapel.',pov:s.chars[0].id}};return s}
function seedOld(){const P=['Castle','Forest','Village'].map(n=>({id:uid(),name:n})),T=['Dawn','Noon','Dusk','Night'].map(n=>({id:uid(),name:n}));
const C=[['Aria','Princess'],['Kael','Rogue'],['Mira','Healer']].map((a,i)=>({id:uid(),name:a[0],role:a[1],color:COL[i]}));
const ch=(c,m,e,cl,w,h,p)=>({cid:C[c].id,mood:MOODS[m],emotion:e,clothing:cl,wealth:w,health:h,powers:p,notes:''});
const k=(p,t)=>P[p].id+'|'+T[t].id;
return{tab:'matrix',places:P,times:T,chars:C,cells:{[k(0,0)]:[ch(0,4,'Restless','Royal gown','Rich','Healthy','')],[k(1,0)]:[ch(1,7,'Wary','Dark cloak','Poor','Healthy','Stealth')],[k(1,1)]:[ch(0,3,'Fleeing','Torn cloak','Rich','Wounded',''),ch(1,5,'Determined','Dark cloak','Poor','Healthy','Stealth')],[k(2,2)]:[ch(2,0,'Hopeful','Plain dress','Modest','Healthy','Healing')],[k(2,3)]:[ch(0,1,'Exhausted','Borrowed shawl','Penniless','Wounded',''),ch(2,0,'Caring','Plain dress','Modest','Healthy','Healing')]},
rels:[{id:uid(),a:C[0].id,b:C[1].id,type:'Ally',note:'Uneasy pact to escape the castle'},{id:uid(),a:C[2].id,b:C[0].id,type:'Friend',note:'Tends her wounds'}],
info:[{id:uid(),title:'The secret passage',text:'Kael: "There\'s a way out under the chapel."\nAria: "Then take me there. Tonight."',who:[C[0].id,C[1].id],cell:k(0,0)}],sel:null}}
const PROT=['sf-river','sf-sunstone'];
const enr=(id,d)=>window.SAMPLES?SAMPLES.enrich(id,d):d;
function seedRiver(){
const C=[
{id:'anya',name:'Princess Anya',role:'The Leader',color:'#6d5ae6',goal:'Save her kingdom from the drought',flaw:'Takes every burden on herself',secret:'Fears she is not ready to rule'},
{id:'arjun',name:'Arjun',role:"The Woodcutter's Son \u2014 Strength",color:'#e0507a',goal:'Prove his worth beyond brute strength',flaw:'Impatient, trusts muscle over thought',secret:'Secretly afraid of failing the group'},
{id:'meera',name:'Meera',role:"The Potter's Daughter \u2014 Memory",color:'#2fa86b',goal:'Be trusted for her mind, not just her hands',flaw:'Doubts her own knowledge until it almost costs them',secret:'Memorized the whole route in secret, afraid she misremembered it'},
{id:'rohan',name:'Rohan',role:'The Orphan \u2014 Agility',color:'#e6a23c',goal:'Find a place where he truly belongs',flaw:'Too shy to speak up until the last moment',secret:'Has no family waiting for him at home'},
{id:'gurudev',name:'Guru Dev',role:'The Scholar \u2014 Wisdom',color:'#2b9ad8',goal:'Pass on the old knowledge before it is lost',flaw:'Overly cautious, slow to act',secret:'Once failed a quest like this one, long ago'},
{id:'bheem',name:'Bheem',role:'The Elephant Keeper \u2014 Gentleness',color:'#c0504d',goal:'Protect his friends and his elephant, Gaja',flaw:'Underestimates his own courage',secret:'Believes he is the least important member of the group'},
{id:'aditya',name:'King Aditya',role:"Anya's Father, King of Vijaya",color:'#8e6bbf',goal:'Save his kingdom and keep his daughter safe',flaw:'Overprotective',secret:''}];
const P=[{id:'palace',name:'Vijaya \u2014 the Royal Palace'},{id:'chasm',name:'The Great Chasm'},{id:'jungle',name:'The Lost Jungle'},{id:'fog',name:'The Misty Mountains'},{id:'peak',name:'The Windy Peak'},{id:'valley',name:'Hidden Valley \u2014 the Singing River'}].map(p=>({...p,lv:0,parent:null,exp:0}));
const T=[{id:'d1',name:'Day 1 \u2014 Departure'},{id:'d2',name:'Day 2 \u2014 The Chasm'},{id:'d3',name:'Day 3 \u2014 The Jungle'},{id:'d4',name:'Day 4 \u2014 The Fog'},{id:'d5',name:'Day 5 \u2014 The Peak'},{id:'d6',name:'Day 6 \u2014 The River'},{id:'d7',name:'Day 7 \u2014 The Return'}].map(t=>({...t,lv:5,parent:null,exp:0}));
const cell=(cid,mood,emotion,clothing,wealth,health,powers,notes)=>({cid,mood,emotion,clothing,wealth,health,powers,notes});
const cells={
'palace|d1':[cell('anya','😨 Afraid','Worried for her people','Royal gown','Rich','Healthy','',"Asks her father to let her seek the Sanjeevani Herb"),cell('aditya','😐 Neutral','Torn between fear and pride',"King's robes",'Rich','Healthy','','Agrees to send five companions with her')],
'chasm|d2':[cell('arjun','😠 Angry','Frustrated the vine is too heavy','Simple tunic','Modest','Healthy','Great strength','Tries and fails to pull a new vine across'),cell('rohan','🤔 Curious','Quietly confident','Worn traveling clothes','Poor','Healthy','Climbing, keen hearing','Climbs the peepal tree and swings a rope across')],
'jungle|d3':[cell('bheem','😨 Afraid','Fears they are lost for good','Simple tunic','Modest','Healthy','Calms animals','Cries out that they will wander forever'),cell('meera','🤩 Excited','Proud of remembering the map','Clay-stained dress','Modest','Healthy','Perfect memory for maps',"Spots the Ganesha-shaped rock from the King's map")],
'fog|d4':[cell('gurudev','🤔 Curious','Calm and listening',"Scholar's robes",'Modest','Healthy','Speaks the language of birds','Chirps to the mountain mynahs and follows their reply')],
'peak|d5':[cell('anya','😴 Tired','Cold but resolute','Royal gown, travel-worn','Rich','Wounded','Herbal knowledge','Gives up her own shawl and lights a fire with fire-weed'),cell('bheem','🤩 Excited',"Inspired by Anya's sacrifice",'Simple tunic','Modest','Healthy','Calms animals','Has Gaja block the wind for the group'),cell('arjun','🤩 Excited','Determined','Simple tunic','Modest','Healthy','Great strength','Builds a wall of stones'),cell('meera','🤩 Excited','Inspired','Clay-stained dress','Modest','Healthy','Pottery, memory','Shapes clay bowls to hold the fire'),cell('rohan','🤩 Excited','Inspired','Worn traveling clothes','Poor','Healthy','Climbing, keen hearing','Finds a hidden cave to shelter in')],
'valley|d6':[cell('anya','😍 In love','Awed by the glowing herb','Royal gown','Rich','Healthy','Herbal knowledge','Carefully takes only a sapling and seeds, as instructed'),cell('gurudev','😊 Happy','Relieved and reverent',"Scholar's robes",'Modest','Healthy','Ancient knowledge','Instructs the group to leave the main plant to thrive')],
'palace|d7':[cell('anya','😊 Happy','Joyful as the rain returns','Royal gown','Rich','Healthy','','Plants the sapling by the dry riverbed'),cell('aditya','😊 Happy','Proud of his daughter',"King's robes",'Rich','Healthy','','Declares a great feast for the kingdom')]};
const rels=[{id:'r1',a:'anya',b:'aditya',type:'Family',note:'Father and daughter, King and Princess'},
{id:'r2',a:'anya',b:'arjun',type:'Ally',note:'Trusted companions on the quest'},
{id:'r3',a:'anya',b:'meera',type:'Ally',note:'Trusted companions on the quest'},
{id:'r4',a:'anya',b:'rohan',type:'Ally',note:'Trusted companions on the quest'},
{id:'r5',a:'anya',b:'bheem',type:'Ally',note:'Trusted companions on the quest'},
{id:'r6',a:'gurudev',b:'anya',type:'Mentor',note:'Guides the group with ancient wisdom'},
{id:'r7',a:'bheem',b:'rohan',type:'Friend',note:'Look out for each other on the journey'},
{id:'r8',a:'arjun',b:'rohan',type:'Friend',note:'Combine strength and agility at the Chasm'}];
const info=[{id:'i1',title:'The Vine Bridge Plan',text:`Arjun: "I can pull a new vine across!"\n(He fails \u2014 the gap is too wide.)\nRohan: "I can climb that tall peepal tree, swing across, and drop a rope."`,who:['arjun','rohan'],pl:'chasm',tm:'d2'},
{id:'i2',title:"Ganesha's Rock",text:`Bheem: "We will wander forever!"\nMeera: "I remember the map in the King's court \u2014 a rock shaped like Lord Ganesha's head marks the path. Look!"`,who:['bheem','meera'],pl:'jungle',tm:'d3'},
{id:'i3',title:"The Mynah Birds' Song",text:`Guru Dev: "Listen." (He chirps like a bird; a faint chirp answers.)\n"The mountain mynah birds know the way. They are guiding us."`,who:['gurudev'],pl:'fog',tm:'d4'},
{id:'i4',title:"A Leader's Sacrifice",text:`Anya: "A leader's strength is not in giving orders, but in serving."\n(She wraps her own shawl around Guru Dev and lights a fire with fire-weed.)`,who:['anya','gurudev'],pl:'peak',tm:'d5'},
{id:'i5',title:'The Moral: Unity Is the Greatest Magic',text:`Anya: "We did not succeed because of one great hero. A woodcutter's strength, a potter's memory, an orphan's agility, a scholar's wisdom, an elephant keeper's gentleness, and a princess's care all came together. True strength is not in being the same, but in weaving our different talents together for a common good."`,who:['anya','arjun','meera','rohan','gurudev','bheem'],pl:'palace',tm:'d7'}];
const tls=[{id:'tl1',name:'The Quest for the Sanjeevani Herb',color:'#6d5ae6'}];
const ev=[
{id:'e1',tl:'tl1',t:1/360,title:'A Kingdom in Drought',place:'Vijaya Palace',chars:['anya','aditya'],mood:'😨 Afraid',health:'Healthy',notes:'',prose:`For three months no rain had fallen on Vijaya. The river was shrinking and the fields were turning brown.\nAnya: Father, the old legends speak of the Sanjeevani Herb. Let me go and find it.\nAditya: You will not go alone.`},
{id:'e2',tl:'tl1',t:1.5/360,title:'Six Companions Chosen',place:'Vijaya Palace',chars:['anya','arjun','meera','rohan','gurudev','bheem'],mood:'🤩 Excited',health:'Healthy',notes:'',prose:"The King summoned five remarkable young people to join his daughter: Arjun the strongest woodcutter's son, Meera the potter's daughter with a map-like memory, Rohan the swift and nimble orphan, Guru Dev the old scholar, and Bheem the gentle elephant keeper.\nAt dawn, the six companions set off together."},
{id:'e3',tl:'tl1',t:2/360,title:'The Broken Bridge',place:'The Great Chasm',chars:['arjun','rohan'],mood:'😠 Angry',health:'Healthy',notes:'',prose:`The bridge of vines across the Great Chasm had snapped.\nArjun: I can pull a new vine across!\n(The vine is too heavy, the gap too wide.)\nRohan: I can climb that tall peepal tree and drop a rope.\nRohan scurries up the tree, swings across, and ties a rope so Arjun can pull a sturdy vine over. They all cross safely.`},
{id:'e4',tl:'tl1',t:3/360,title:"Ganesha's Rock",place:'The Lost Jungle',chars:['meera','bheem'],mood:'😨 Afraid',health:'Healthy',notes:'',prose:`All the jungle paths looked the same.\nBheem: We will wander forever!\nMeera: I remember the map in the King's court \u2014 look, a rock shaped like Lord Ganesha's head!\nHer memory leads them safely onward.`},
{id:'e5',tl:'tl1',t:4/360,title:'Guided by Birdsong',place:'The Misty Mountains',chars:['gurudev','anya','arjun','meera','rohan','bheem'],mood:'🤔 Curious',health:'Healthy',notes:'',prose:`A thick magical fog rolled in, so thick they could not see their own hands.\nGuru Dev: Listen.\n(He chirps like a bird; a faint chirp answers.)\nGuru Dev: The mountain mynah birds know the way. They are guiding us.\nFollowing the birdsong, they walk safely through the fog.`},
{id:'e6',tl:'tl1',t:5/360,title:"A Leader's Sacrifice",place:'The Windy Peak',chars:['anya','arjun','meera','rohan','gurudev','bheem'],mood:'😴 Tired',health:'Wounded',notes:'',prose:`A fierce, cold wind blocked their path on the high mountain peak.\nAnya: A leader's strength is not in giving orders, but in serving.\nShe wraps her own shawl around Guru Dev and lights a small fire with fire-weed. Inspired, Bheem has Gaja block the wind, Arjun builds a wall of stones, Meera shapes clay bowls to hold the fire, and Rohan finds a hidden cave to shelter in.`},
{id:'e7',tl:'tl1',t:6/360,title:'The Glowing Herb',place:'Hidden Valley',chars:['anya','arjun','meera','rohan','gurudev','bheem'],mood:'😍 In love',health:'Healthy',notes:'',prose:'Beyond the wind-beaten peak lay a hidden valley, and there flowed the Singing River \u2014 its waters humming a soft, musical tune. On its banks grew the Sanjeevani Herb, glowing with a soft green light.\nGuru Dev: Take only a sapling and a handful of seeds \u2014 leave the rest to thrive.'},
{id:'e8',tl:'tl1',t:7/360,title:'Rain Returns to Vijaya',place:'Vijaya Palace',chars:['anya','aditya'],mood:'😊 Happy',health:'Healthy',notes:'',prose:'Anya planted the sapling by the dry riverbed. As the first leaf touched the earth, the sky darkened and a gentle, soaking rain began to fall. The river swelled, the fields turned green, and the people of Vijaya cheered.'},
{id:'e9',tl:'tl1',t:8/360,title:'The Feast and the Lesson',place:'Vijaya Palace',chars:['anya','arjun','meera','rohan','gurudev','bheem','aditya'],mood:'😊 Happy',health:'Healthy',notes:'',prose:`At the feast, Anya stood and spoke.\nAnya: We did not succeed because of one great hero. A woodcutter's strength, a potter's memory, an orphan's agility, a scholar's wisdom, an elephant keeper's gentleness, and a princess's care all came together. Like the many tributaries that feed a great river, our different strengths made us powerful. Unity is the greatest magic of all.`}];
return enr('sf-river',{tab:'map',places:P,times:T,chars:C,cells,rels,info,sel:null,sc:{},title:'The Secret of the Singing River',tls,ev,lk:[],mv:{ox:0,sc:40000}});
}
function seedSunstone(){
const C=[
{id:'rohan2',name:'Rohan',role:'The Curious Leader',color:'#6d5ae6',goal:'Find the treasure and prove he can lead',flaw:'Jumps into adventure without thinking it through',secret:''},
{id:'priya',name:'Priya',role:'The Problem-Solver',color:'#e0507a',goal:'Be heard when things get chaotic',flaw:'Gets impatient with noise and disorder',secret:''},
{id:'arjun2',name:'Arjun',role:'The Strong, Athletic One',color:'#2fa86b',goal:'Prove his strength is useful, not just for show',flaw:'Acts before thinking',secret:''},
{id:'meera2',name:'Meera',role:'The Artist Who Notices Everything',color:'#e6a23c',goal:'Be the one who spots what others miss',flaw:'Quiet, rarely speaks up first',secret:''},
{id:'sam',name:'Sam',role:'The Joker',color:'#2b9ad8',goal:"Keep everyone's spirits up",flaw:'Uses jokes to avoid facing fear',secret:''},
{id:'anjali',name:'Anjali',role:'The Quiet, Kind One',color:'#c0504d',goal:'Help others, even when no one is watching',flaw:'Stays quiet and lets others take the spotlight',secret:''},
{id:'guardian',name:'The Guardian',role:'A Mysterious Old Traveller / Goddess in Disguise',color:'#8e6bbf',goal:'Test whether the children truly understand what treasure means',flaw:'',secret:"Is really the goddess guarding the Sunstone's treasure"}];
const P=[{id:'attic',name:"Grandparents' Attic, Mumbai"},{id:'pataliputra',name:'Pataliputra \u2014 the Market Square'},{id:'channel',name:'The Old Water Channel'},{id:'temple',name:'The Temple Door'},{id:'chamber',name:"The Temple's Inner Chamber"}].map(p=>({...p,lv:0,parent:null,exp:0}));
const T=[{id:'t1',name:'Arrival'},{id:'t2',name:'First Challenge'},{id:'t3',name:'Second Challenge'},{id:'t4',name:'Third Challenge'},{id:'t5',name:'The Return'}].map(t=>({...t,lv:5,parent:null,exp:0}));
const cell=(cid,mood,emotion,clothing,wealth,health,powers,notes)=>({cid,mood,emotion,clothing,wealth,health,powers,notes});
const cells={
'attic|t1':[cell('rohan2','🤔 Curious','Amazed by the glowing stone','Everyday clothes','Modest','Healthy','',"Finds the Sunstone in a carved wooden box"),cell('priya','😨 Afraid','Startled by the flash of light','Everyday clothes','Modest','Healthy','','Touches the stone and triggers the journey')],
'pataliputra|t1':[cell('guardian','😊 Happy','Warm and watchful',"Simple white clothes",'Modest','Healthy','Ancient magic','Explains the Sunstone and its three challenges')],
'channel|t2':[cell('sam','😠 Angry','Deflated by the blocked road','Everyday clothes','Modest','Healthy','',"We'll never get through"),cell('meera2','🤔 Curious','Observant','Everyday clothes','Modest','Healthy','Sharp eye for detail','Spots the old water channel'),cell('arjun2','🤩 Excited','Determined','Everyday clothes','Modest','Healthy','Strength','Moves the heavy stone blocking the entrance')],
'temple|t3':[cell('priya','🤔 Curious','Calm and focused','Everyday clothes','Modest','Healthy','Logic and memory','Arranges the symbols to open the sealed door')],
'chamber|t4':[cell('anjali','😍 In love','Moved to help','Everyday clothes','Modest','Healthy','Kindness','Sweeps up the spilled water and fetches a fresh bowl'),cell('guardian','😊 Happy','Revealed at last','Shimmering, goddess-like','Rich','Healthy','Ancient magic','Transforms and reveals the true treasure')],
'attic|t5':[cell('rohan2','😊 Happy','Changed by the journey','Everyday clothes','Modest','Healthy','','Back in the attic, stone now dull and cold')]};
const rels=[{id:'r1',a:'rohan2',b:'priya',type:'Friend',note:'Childhood friends on the quest'},
{id:'r2',a:'rohan2',b:'arjun2',type:'Friend',note:'Childhood friends on the quest'},
{id:'r3',a:'rohan2',b:'meera2',type:'Friend',note:'Childhood friends on the quest'},
{id:'r4',a:'rohan2',b:'sam',type:'Friend',note:'Childhood friends on the quest'},
{id:'r5',a:'rohan2',b:'anjali',type:'Friend',note:'Childhood friends on the quest'},
{id:'r6',a:'guardian',b:'anjali',type:'Mentor',note:"Tests, then rewards, Anjali's kindness"}];
const info=[{id:'i1',title:'The Old Water Channel',text:`Sam: We'll never get through.\nMeera: Look \u2014 an old water channel. It might lead to the other side.`,who:['sam','meera2'],pl:'channel',tm:'t2'},
{id:'i2',title:'The Puzzle of the Three Rivers',text:`Priya: Quiet, everyone! Let's think.\n(She arranges mountain, cloud, raindrop, river, flower, bee and sun \u2014 and the great door swings open.)`,who:['priya'],pl:'temple',tm:'t3'},
{id:'i3',title:'The True Treasure',text:'Guardian: You saw past the glitter of gold and recognized the true treasure: a helpful heart. The bowl and broom represent service, the greatest treasure of all.',who:['anjali','guardian'],pl:'chamber',tm:'t4'}];
const tls=[{id:'tl1',name:"The Sunstone's Quest",color:'#e0507a'}];
const ev=[
{id:'e1',tl:'tl1',t:1/360,title:'The Sunstone',place:'Grandparents\u2019 Attic',chars:['rohan2','priya','arjun2','meera2','sam','anjali'],mood:'🤔 Curious',health:'Healthy',notes:'',prose:`In a dusty Mumbai attic, Rohan found a small carved wooden box holding a warm, sun-colored stone.\nRohan: Whoa, look at this!\n(As Priya touches it, a blinding flash of golden light fills the room.)`},
{id:'e2',tl:'tl1',t:1.2/360,title:'Welcome to Pataliputra',place:'Pataliputra',chars:['rohan2','priya','arjun2','meera2','sam','anjali','guardian'],mood:'😨 Afraid',health:'Healthy',notes:'',prose:`The six friends find themselves in the ancient city of Pataliputra. A kind old traveller approaches.\nGuardian: Welcome, little travellers. The Sunstone is a key to a great treasure \u2014 guarded by three challenges that only true friends can overcome.\nArjun: We'll find it!`},
{id:'e3',tl:'tl1',t:2/360,title:'Through the Old Channel',place:'The Old Water Channel',chars:['sam','meera2','arjun2'],mood:'😠 Angry',health:'Healthy',notes:'',prose:`A royal procession blocks the market square.\nSam: We'll never get through.\nMeera: Look \u2014 an old water channel.\nArjun moves a heavy stone aside and they crawl through together, emerging dusty but triumphant.`},
{id:'e4',tl:'tl1',t:3/360,title:'The Puzzle of the Three Rivers',place:'The Temple Door',chars:['priya','rohan2','arjun2','meera2','sam','anjali'],mood:'🤔 Curious',health:'Healthy',notes:'',prose:`Everyone shouts ideas at once at the sealed temple door.\nPriya: Quiet, everyone! Let's think.\nShe calmly arranges the symbols \u2014 mountain, cloud, raindrop, river, flower, bee, sun \u2014 and the great door swings open.`},
{id:'e5',tl:'tl1',t:4/360,title:'A Helpful Heart',place:"The Temple's Inner Chamber",chars:['anjali','guardian'],mood:'😍 In love',health:'Healthy',notes:'',prose:`Inside, the "treasure" is only a worn bowl and broom. An old woman trips and spills her water.\nAnjali: Are you alright, Maa?\nAnjali sweeps up the mess and fetches fresh water. The old woman transforms into a shimmering goddess.\nGuardian: You saw past the glitter of gold and recognized the true treasure: a helpful heart.`},
{id:'e6',tl:'tl1',t:5/360,title:'Home Again',place:'Grandparents\u2019 Attic',chars:['rohan2','priya','arjun2','meera2','sam','anjali'],mood:'😊 Happy',health:'Healthy',notes:'',prose:'With a flash of golden light, the six friends are back in the attic, clothes still smelling faintly of sandalwood and spices. The greatest moral lesson of all: true treasure lies not in what you can get, but in what you can give.'}];
return enr('sf-sunstone',{tab:'map',places:P,times:T,chars:C,cells,rels,info,sel:null,sc:{},title:'The Secret of the Sunstone',tls,ev,lk:[],mv:{ox:0,sc:30000}});
}
function norm(s){if(!s||typeof s!='object'||Array.isArray(s))return null;if(typeof SCHEMA!='undefined'){SCHEMA.migrate(s);if(s.__migrationErrors&&!window.__migWarned){window.__migWarned=1;setTimeout(()=>{try{toast('Upgrade step '+s.__migrationErrors[0].step+' failed; data kept as-is')}catch(e){}},0)}}
const arr=k=>{s[k]=Array.isArray(s[k])?s[k].filter(x=>x&&typeof x=='object'):[]},obj=k=>{if(!s[k]||typeof s[k]!='object'||Array.isArray(s[k]))s[k]={}},hx=(c,d)=>/^#[0-9a-f]{6}$/i.test(c)?c:d,str=(o,k,d='')=>{if(typeof o[k]!='string')o[k]=d};
(typeof SCHEMA!='undefined'?SCHEMA.LISTS:['chars','places','times','rels','info','tls','ev','lk','worlds']).forEach(arr);(s.worlds||[]).forEach(w=>{if(!w.id)w.id=uid();str(w,'name','World');str(w,'desc');w.rules=(Array.isArray(w.rules)?w.rules:[]).filter(r=>r&&typeof r=='object');w.rules.forEach(r=>{if(!r.id)r.id=uid();['cat','text','ban','trig'].forEach(k=>str(r,k));r.off=r.off?1:0})});obj('cells');obj('sc');
if(typeof s.title!='string')s.title='';if(s.cal!==undefined){const c=s.cal;if(!c||typeof c!='object'||Array.isArray(c))delete s.cal;else{c.months=(Array.isArray(c.months)?c.months:[]).filter(m=>m&&typeof m=='object').slice(0,60).map((m,i)=>({n:String(m.n||'Month '+(i+1)).slice(0,30),d:Math.max(1,Math.min(400,Math.round(+m.d)||30))}));if(!c.months.length)delete c.months;c.hpd=Math.max(1,Math.min(100,Math.round(+c.hpd)||24));c.era=String(c.era||'Year').slice(0,20);c.hol=(Array.isArray(c.hol)?c.hol:[]).filter(h=>h&&h.n).slice(0,200).map(h=>({n:String(h.n).slice(0,40),m:Math.max(1,Math.round(+h.m)||1),d:Math.max(1,Math.round(+h.d)||1)}))}}
if(!s.mv||typeof s.mv!='object')s.mv={ox:0,sc:60};if(!(s.mv.sc>0))s.mv.sc=60;if(!isFinite(s.mv.ox))s.mv.ox=0;
s.chars.forEach((c,i)=>{if(!c.id)c.id=uid();str(c,'name','?');str(c,'role');c.color=hx(c.color,COL[i%7])});
['places','times'].forEach(a=>{s[a].forEach(n=>{if(!n.id)n.id=uid();str(n,'name','?')});const ids=new Set(s[a].map(n=>n.id));s[a].forEach(n=>{if(n.parent&&(!ids.has(n.parent)||n.parent==n.id))n.parent=null});const by=Object.fromEntries(s[a].map(n=>[n.id,n]));s[a].forEach(n=>{const seen=new Set([n.id]);let c=n;while(c.parent){if(seen.has(c.parent)){c.parent=null;break}seen.add(c.parent);c=by[c.parent]||{}}})});
if(!s.tls.length)s.tls=[{id:'t1',name:'Main timeline',color:'#6d5ae6'}];
s.tls.forEach((l,i)=>{if(!l.id)l.id='t'+uid();str(l,'name','Timeline');l.color=hx(l.color,COL[i%7])});
const cid=new Set(s.chars.map(c=>c.id)),keep=a=>(Array.isArray(a)?a:[]).filter(c=>cid.has(c));
s.ev.forEach(e=>{if(!e.id)e.id=uid();e.t=+e.t||0;if(!s.tls.some(l=>l.id==e.tl))e.tl=s.tls[0].id;e.chars=keep(e.chars);['title','place','mood','health','notes'].forEach(k=>str(e,k))});
s.lk=s.lk.filter(k=>s.ev.some(e=>e.id==k.a)&&s.ev.some(e=>e.id==k.b));s.lk.forEach(k=>{if(!k.id)k.id=uid();k.chars=keep(k.chars);str(k,'label')});
s.info.forEach(i=>{if(!i.id)i.id=uid();if(i.pl===undefined&&typeof i.cell=='string'&&i.cell.includes('|')){const q=i.cell.split('|');i.pl=q[0];i.tm=q[1]};['pl','tm','title','text'].forEach(k=>str(i,k));i.who=keep(i.who)});
s.rels.forEach(r=>{if(!r.id)r.id=uid();if(!RT.includes(r.type))r.type='Friend';str(r,'note')});s.rels=s.rels.filter(r=>cid.has(r.a)&&cid.has(r.b));
Object.keys(s.cells).forEach(k=>{if(!Array.isArray(s.cells[k]))return delete s.cells[k];s.cells[k]=s.cells[k].filter(x=>x&&typeof x=='object'&&cid.has(x.cid));s.cells[k].forEach(x=>{str(x,'mood',MOODS[4]);['emotion','clothing','wealth','health','powers','notes'].forEach(f=>str(x,f))})});
Object.keys(s.sc).forEach(k=>{const v=s.sc[k];if(!v||typeof v!='object')return delete s.sc[k];str(v,'t');str(v,'s');str(v,'pov')});
if(Array.isArray(s.lc))s.lc=keep(s.lc);else delete s.lc;if(s.sel&&!cid.has(s.sel))s.sel=null;
if(!['map','matrix','chars','rels','info','life','book','arcs','places','worlds','ai','docs','cal','tension','weave'].includes(s.tab))s.tab='map';
return s}
const mj=m=>esc(String(m||'').split(' ')[0]);
const dl=(txt,name,type)=>{const u=URL.createObjectURL(new Blob([txt],{type})),l=document.createElement('a');l.href=u;l.download=name.replace(/[\\/:*?"<>|]+/g,'_');document.body.appendChild(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(u),1000)};
function pickJSON(cb){const f=$('#fi');f.onchange=()=>{const file=f.files[0];f.value='';if(!file)return;file.text().then(t=>{let o=null,errs=[],wr=[];try{const j=JSON.parse(t),v=typeof SCHEMA!='undefined'?SCHEMA.validate(j):{errors:[],warnings:[]};errs=v.errors;wr=v.warnings;if(!errs.length)o=norm(j)}catch(x){}o?(cb(o),wr.length&&SFX.notice('Imported, with fixes:\n• '+wr.join('\n• '))):SFX.notice('That file is not a valid Kathakaar JSON.'+(errs.length?'\n• '+errs.join('\n• '):''))})};f.click()}
const mq=e=>{const q=(S.q||'').trim().toLowerCase();return !q||[e.title,e.place,e.mood,e.health,e.notes,e.prose,e.tag,...e.chars.map(c=>ch(c).name)].join(' ').toLowerCase().includes(q)};
let KEY='sf2';try{KEY=localStorage.getItem('sf-cur')||'sf2'}catch(e){}let S,fresh=false;try{S=norm(JSON.parse(localStorage.getItem(KEY)))}catch(e){}if(!S){S=norm(blank());fresh=true}
let saveT,lastBk=0;const flush=()=>{clearTimeout(saveT);try{const j=JSON.stringify(S);localStorage.setItem(KEY,j);warn('');syncOut();if(Date.now()-lastBk>3e5){lastBk=Date.now();localStorage.setItem('sf-bak-'+KEY,j);if(typeof rotateBak=='function')rotateBak(KEY,j,'automatic')}}catch(e){warn('⚠ Could not save: storage is full or blocked. Use Export to keep a copy.')}},save=()=>{clearTimeout(saveT);saveT=setTimeout(flush,300)};
addEventListener('beforeunload',flush);addEventListener('pagehide',flush);document.addEventListener('visibilitychange',()=>{if(document.hidden)flush()});
const ch=id=>S.chars.find(c=>c.id==id)||{name:'?',color:'#999'};
const $=s=>document.querySelector(s);
let drawer=null;
const TABS=[['matrix','🗺 Matrix'],['chars','👤 Characters'],['rels','💞 Relationships'],['info','💬 Shared Info']];
function vRels(){const n=S.chars.length,R=130,pos=S.chars.map((c,i)=>[160+R*Math.cos(i/n*6.283-1.57),150+R*Math.sin(i/n*6.283-1.57)]);
const idx=id=>S.chars.findIndex(c=>c.id==id);
const svg=`<svg viewBox="0 0 320 300" style="max-width:340px;width:100%;background:var(--card);border:1px solid var(--line);border-radius:12px">`+S.rels.map(r=>{const a=pos[idx(r.a)],b=pos[idx(r.b)];return a&&b?`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${RC[r.type]||'#888'}" stroke-width="3"/><text x="${(a[0]+b[0])/2}" y="${(a[1]+b[1])/2}" font-size="10" text-anchor="middle" fill="currentColor">${r.type}</text>`:''}).join('')+S.chars.map((c,i)=>`<circle cx="${pos[i][0]}" cy="${pos[i][1]}" r="20" fill="${c.color}"/><text x="${pos[i][0]}" y="${pos[i][1]+4}" font-size="10" text-anchor="middle" fill="#fff">${esc(c.name.slice(0,6))}</text>`).join('')+`</svg>`;
const o=id=>S.chars.map(c=>`<option value="${c.id}" ${c.id==id?'selected':''}>${esc(c.name)}</option>`).join('');
return`<div class="row"><h3 style="flex:3">Relationships</h3><button class="pri" data-a="ar">+ Add relationship</button></div><div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start">${svg}<div style="flex:1;min-width:300px">`+S.rels.map(r=>`<div class="card" style="margin-bottom:8px"><div class="row" style="margin:0"><select data-t="rels" data-id="${r.id}" data-f="a" data-r="1">${o(r.a)}</select><select data-t="rels" data-id="${r.id}" data-f="type" data-r="1">${RT.map(t=>`<option ${t==r.type?'selected':''}>${t}</option>`).join('')}</select><select data-t="rels" data-id="${r.id}" data-f="b" data-r="1">${o(r.b)}</select><button data-a="dr" data-id="${r.id}">✕</button></div><input data-t="rels" data-id="${r.id}" data-f="note" placeholder="Kind of interaction…" value="${esc(r.note)}"></div>`).join('')+`</div></div>`}
function openDr(k,i){drawer=[k,i];const x=S.cells[k][i],f=(l,n,ph)=>`<label>${l}</label><input data-t="chip" data-f="${n}" placeholder="${ph}" value="${esc(x[n])}">`;
$('#dr').innerHTML=`<div class="row"><h3 style="flex:3;color:${ch(x.cid).color}">${esc(ch(x.cid).name)}</h3><button data-a="cd">Close</button></div><label>Mood</label><select data-t="chip" data-f="mood" data-r="1">${MOODS.map(m=>`<option ${m==x.mood?'selected':''}>${m}</option>`).join('')}</select>`+f('Emotional state','emotion','e.g. Grieving, hopeful')+f('Clothing','clothing','What they wear')+f('Wealth','wealth','Rich, poor, 3 gold coins…')+f('Health','health','Healthy, wounded, cursed…')+f('Powers / abilities','powers','Magic, skills, items')+`<label>Notes / actions</label><textarea rows="5" data-t="chip" data-f="notes">${esc(x.notes)}</textarea><div class="row" style="margin-top:12px"><button data-a="rm">Remove from scene</button></div>`;$('#dr').classList.add('open')}
document.addEventListener('click',e=>{const t=e.target.closest('[data-a],[data-tab],[data-i],[data-sel]');if(!t)return;
const d=t.dataset,a=d.a;
if(d.tab){S.tab=d.tab;$('#dr').classList.remove('open');return render()}
if(!a&&d.i!==undefined&&t.classList.contains('chip'))return openDr(d.k,+d.i);
if(!a&&d.sel){S.sel=S.sel==d.sel?null:d.sel;return render()}
const rm=(arr,id)=>S[arr]=S[arr].filter(x=>x.id!=id);
if(a=='ac'){const c={id:uid(),name:'New character',role:'',color:COL[S.chars.length%7]};S.chars.push(c);if(S.lc)S.lc.push(c.id)}
else if(a=='at')S.times.push({id:uid(),name:'New time'});
else if(a=='ap')S.places.push({id:uid(),name:'New place'});
else if(a=='dt'){rm('times',d.id);for(const k in S.cells)if(k.split('|')[1]==d.id)delete S.cells[k]}
else if(a=='dp'){rm('places',d.id);for(const k in S.cells)if(k.split('|')[0]==d.id)delete S.cells[k]}
else if(a=='dc'){if(!confirm('Delete this character from every scene, event and relationship?'))return;const id=d.id;rm('chars',id);S.rels=S.rels.filter(r=>r.a!=id&&r.b!=id);for(const k in S.cells)S.cells[k]=S.cells[k].filter(x=>x.cid!=id);S.ev.forEach(e=>e.chars=e.chars.filter(c=>c!=id));S.lk.forEach(k=>k.chars=k.chars.filter(c=>c!=id));S.info.forEach(i=>i.who=i.who.filter(w=>w!=id));for(const k in S.sc)if(S.sc[k].pov==id)S.sc[k].pov='';if(S.lc)S.lc=S.lc.filter(c=>c!=id);if(S.sel==id)S.sel=null}
else if(a=='ar'&&S.chars.length>1)S.rels.push({id:uid(),a:S.chars[0].id,b:S.chars[1].id,type:'Friend',note:''});
else if(a=='dr')rm('rels',d.id);
else if(a=='ai')S.info.push({id:uid(),title:'',text:'',who:[],pl:'',tm:''});
else if(a=='di')rm('info',d.id);
else if(a=='tw'){const i=S.info.find(x=>x.id==d.id);i.who=i.who.includes(d.c)?i.who.filter(w=>w!=d.c):[...i.who,d.c]}
else if(a=='cd'){$('#dr').classList.remove('open');return}
else if(a=='rm'){if(drawer&&S.cells[drawer[0]])S.cells[drawer[0]].splice(drawer[1],1);drawer=null;$('#dr').classList.remove('open')}
else if(a=='exp'){dl(JSON.stringify(S,null,1),(S.title||'story')+'.json','application/json');return}
else if(a=='imp'){pickJSON(o=>{S=o;drawer=null;$('#dr').classList.remove('open');render()});return}
else if(a=='rst'){if(!confirm('Clear the current story and start blank? (Undo ↶ can bring it back.)'))return;S=blank();drawer=null;$('#dr').classList.remove('open')}
render()});
const kf=fn=>{const a=document.activeElement,k=a&&a.dataset&&a.dataset.t&&a.closest('#app')?{t:a.dataset.t,i:a.dataset.id,f:a.dataset.f,s:a.selectionStart,e:a.selectionEnd}:null;fn();if(k){const el=[...document.querySelectorAll('#app [data-t]')].find(x=>x.dataset.t==k.t&&x.dataset.id==k.i&&x.dataset.f==k.f);if(el){el.focus();try{el.setSelectionRange(k.s,k.e)}catch(x){}}}};
document.addEventListener('input',e=>{const t=e.target,d=t.dataset;if(!d.t)return;
const o=d.t=='chip'?(drawer&&(S.cells[drawer[0]]||[])[drawer[1]]):(S[d.t]||[]).find(x=>x.id==d.id);if(!o)return;o[d.f]=t.value;save();
if(d.r&&t.type!='color')kf(render)});
document.addEventListener('change',e=>{const d=e.target.dataset;if(d.t&&(!d.r||e.target.type=='color'))setTimeout(()=>kf(render),0)});
let drag=null;
document.addEventListener('dragstart',e=>{const t=e.target.closest('[data-new],.chip');if(!t)return;drag=t.dataset.new?{n:t.dataset.new}:{k:t.dataset.k,i:+t.dataset.i};e.dataTransfer.setData('text/plain','x');e.dataTransfer.effectAllowed='move'});
document.addEventListener('dragover',e=>{const c=e.target.closest('.cell');document.querySelectorAll('.over').forEach(x=>x!=c&&x.classList.remove('over'));if(c&&drag){e.preventDefault();c.classList.add('over')}});
document.addEventListener('drop',e=>{const c=e.target.closest('.cell');if(!c||!drag||!c.dataset.k)return;e.preventDefault();const k=c.dataset.k,L=S.cells[k]=S.cells[k]||[];
if(drag.n){if(!L.some(x=>x.cid==drag.n))L.push({cid:drag.n,mood:MOODS[4],emotion:'',clothing:'',wealth:'',health:'',powers:'',notes:''})}
else if(drag.k!=k&&S.cells[drag.k]&&S.cells[drag.k][drag.i]){const x=S.cells[drag.k][drag.i];if(L.some(y=>y.cid==x.cid))SFX.notice(ch(x.cid).name+' is already in that cell.');else{S.cells[drag.k].splice(drag.i,1);L.push(x)}}
drag=null;drawer=null;$('#dr').classList.remove('open');render()});
document.addEventListener('dragend',()=>{drag=null;document.querySelectorAll('.over').forEach(x=>x.classList.remove('over'))});
window.addEventListener('resize',()=>{drawPath();paint()});
document.head.insertAdjacentHTML('beforeend','<style>.hd{flex-wrap:wrap}.zm{display:flex;gap:4px;align-items:center;color:var(--mut)}.chip small.s{font-size:10px}</style>');
const PL=['Galaxy','Solar system','Planet','Continent','Ocean','Country','State','District','Village','Town','Place','Building','Room'],TL=['Era','Century','Decade','Year','Month','Day','Time of day','Hour','Minute'],AX={places:PL,times:TL};
const kids=(a,id)=>S[a].filter(n=>(n.parent||null)==id);
function vis(a,p=null,d=0,o=[]){kids(a,p).forEach(n=>{o.push({n,d});if(n.exp)vis(a,n.id,d+1,o)});return o}
const up=(a,id)=>S[a].find(x=>x.id==id);
const path=(a,n)=>{const r=[];while(n&&n.parent){n=up(a,n.parent);n&&r.unshift(n.name)}return r.join(' › ')};
const depthOf=(a,n)=>{let d=0;while(n&&n.parent){n=up(a,n.parent);d++}return d};
const nm=(a,id)=>(up(a,id)||{}).name;
const rep=(a,id,F)=>{let n=up(a,id),m=n;while(m){if(F.has(m.id))return m.id;m=up(a,m.parent)}m=n;while(m&&!F.has(m.id))m=kids(a,m.id)[0];return m&&m.id};
const hdr=(a,{n,d},cls)=>{const has=kids(a,n.id).length,P=path(a,n),at=`data-ax="${a}" data-id="${n.id}"`;
return`<div class="hd ${cls}" style="${cls=='r'?`padding-left:${6+d*14}px`:''}"><button class="x" data-a="tg" ${at}>${has?(n.exp?'▾':'▸'):'·'}</button><input style="flex:1;min-width:60px" data-t="${a}" data-id="${n.id}" data-f="name" value="${esc(n.name)}"><button class="x" data-a="dn" ${at}>✕</button><div style="flex-basis:100%;display:flex;gap:4px;align-items:center"><select style="font-size:11px;padding:1px 4px;width:auto" data-t="${a}" data-id="${n.id}" data-f="lv" data-r="1">${AX[a].map((l,i)=>`<option value="${i}" ${i==(+n.lv||0)?'selected':''}>${l}</option>`).join('')}</select><button class="x" data-a="ach" ${at}>＋ inside</button></div>${cls!='r'&&P?`<small style="flex-basis:100%;color:var(--mut)">${esc(P)}</small>`:''}</div>`};
function vMatrix(){const R=vis('places'),C=vis('times'),FP=new Set(R.map(x=>x.n.id)),FT=new Set(C.map(x=>x.n.id)),B={},IC={};
for(const kk in S.cells){const[pk,tk]=kk.split('|'),a=rep('places',pk,FP),b=rep('times',tk,FT);if(a&&b)S.cells[kk].forEach((x,i)=>(B[a+'|'+b]=B[a+'|'+b]||[]).push({kk,i,x,pk,tk}))}
S.info.forEach(i=>{const a=rep('places',i.pl,FP),b=rep('times',i.tm,FT);if(a&&b)IC[a+'|'+b]=(IC[a+'|'+b]||0)+1});
const pal=S.chars.map(c=>`<div class="pc ${S.sel==c.id?'sel':''}" draggable="true" data-new="${c.id}" data-sel="${c.id}" style="border-color:${c.color}"><span class="dot" style="background:${c.color}"></span>${esc(c.name)}</div>`).join('');
const z=(a,l)=>`<span class="zm">${l} zoom <button data-a="zm" data-ax="${a}" data-d="-1">−</button><button data-a="zm" data-ax="${a}" data-d="1">+</button></span>`;
let g=`<div class="hd c0"><small style="color:var(--mut)">Place ↓ / Time →</small></div>`+C.map(x=>hdr('times',x,'')).join('');
R.forEach(r=>{g+=hdr('places',r,'r');C.forEach((c,ci)=>{const k=r.n.id+'|'+c.n.id,n=IC[k];
g+=`<div class="cell" data-k="${k}" data-c="${ci}">${(S.sc||{})[k]&&S.sc[k].t?`<div class="sc">🎬 ${esc(S.sc[k].t)}</div>`:''}`+(B[k]||[]).map(({kk,i,x,pk,tk})=>`<div class="chip ${S.sel&&S.sel!=x.cid?'dim':''}" draggable="true" data-k="${kk}" data-i="${i}" data-cid="${x.cid}" style="border-color:${ch(x.cid).color}"><b>${esc(ch(x.cid).name)}</b> ${mj(x.mood)}<small>${esc([x.emotion,x.clothing,x.health].filter(Boolean).join(' · '))}</small>${kk!=k?`<small class="s">↳ ${esc(nm('places',pk))} · ${esc(nm('times',tk))}</small>`:''}</div>`).join('')+(n?`<span class="info" data-tab="info">💬 ${n} shared</span>`:'')+`</div>`})});
return`<div class="pal"><small>Drag onto grid · click to trace journey:</small>${pal}<button data-a="ac">+ Character</button><span class="sp"></span>${z('places','Place')}${z('times','Time')}<button data-a="at">+ Time</button><button data-a="ap">+ Place</button></div>
<div id="mw"><div id="grid" style="grid-template-columns:190px repeat(${C.length},minmax(190px,1fr))">${g}<svg id="svg"></svg></div></div>
<p style="color:var(--mut)">▸/▾ expands a place or time into its sub-levels (collapsed cells roll up everything inside). “＋ inside” adds a child (galaxy → planet → country → building; year → month → day → hour). Use zoom −/+ to change every level at once.</p>`}
function drawPath(){const s=$('#svg'),g=$('#grid');if(!s)return;if(!S.sel){s.innerHTML='';return}
s.setAttribute('width',g.scrollWidth);s.setAttribute('height',g.scrollHeight);const r=g.getBoundingClientRect(),L=[];
document.querySelectorAll(`.chip[data-cid="${S.sel}"]`).forEach(e=>{const b=e.getBoundingClientRect();L.push([+e.closest('.cell').dataset.c,b.left-r.left+b.width/2,b.top-r.top+b.height/2])});
L.sort((a,b)=>a[0]-b[0]);const pts=L.map(p=>[p[1],p[2]]),c=ch(S.sel).color;
s.innerHTML=`<polyline points="${pts.join(' ')}" fill="none" stroke="${c}" stroke-width="3" stroke-dasharray="7 5" stroke-linecap="round"/>`+pts.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="${c}"/>`).join('')}
function vInfo(){const o=(a,v)=>`<option value="">— any —</option>`+S[a].map(n=>`<option value="${n.id}" ${n.id==v?'selected':''}>${esc((path(a,n)?path(a,n)+' › ':'')+n.name)}</option>`).join('');
return`<div class="row"><h3 style="flex:3">Shared Info & Dialogue</h3><button class="pri" data-a="ai">+ Add entry</button></div><div class="grid2">`+S.info.map(i=>`<div class="card"><input data-t="info" data-id="${i.id}" data-f="title" placeholder="Title" value="${esc(i.title)}"><textarea rows="5" data-t="info" data-id="${i.id}" data-f="text" placeholder="Dialogue or knowledge shared…">${esc(i.text)}</textarea><div class="tg">`+S.chars.map(c=>`<button data-a="tw" data-id="${i.id}" data-c="${c.id}" class="${i.who.includes(c.id)?'on':''}" style="--c:${c.color}">${esc(c.name)}</button>`).join('')+`</div><select data-t="info" data-id="${i.id}" data-f="pl" data-r="1">${o('places',i.pl)}</select><select data-t="info" data-id="${i.id}" data-f="tm" data-r="1">${o('times',i.tm)}</select><button data-a="di" data-id="${i.id}">Delete</button></div>`).join('')+`</div>`}
document.addEventListener('click',e=>{const t=e.target.closest('[data-a]');if(!t)return;const d=t.dataset,a=d.a,ax=d.ax;
if(!['tg','ach','zm','dn'].includes(a))return;e.stopPropagation();
if(a=='tg'){const n=up(ax,d.id);if(kids(ax,n.id).length)n.exp=!n.exp}
else if(a=='ach'){const n=up(ax,d.id),l=Math.min((+n.lv||0)+1,AX[ax].length-1);n.exp=1;S[ax].push({id:uid(),name:'New '+AX[ax][l].toLowerCase(),lv:l,parent:n.id,exp:0})}
else if(a=='zm'){const mx=Math.max(0,...S[ax].map(n=>depthOf(ax,n)));S.z=S.z||{};S.z[ax]=Math.max(0,Math.min(mx+1,(S.z[ax]??2)+ +d.d));S[ax].forEach(n=>n.exp=depthOf(ax,n)<S.z[ax])}
else{const del=new Set([d.id]);let c=1;while(c){c=0;S[ax].forEach(n=>{if(!del.has(n.id)&&del.has(n.parent)){del.add(n.id);c=1}})}
if(S[ax].every(n=>del.has(n.id))){SFX.notice('Keep at least one '+(ax=='places'?'place':'time')+'.');return}
const hit=k=>{const[p,q]=k.split('|');return del.has(p)||del.has(q)};
if((del.size>1||Object.keys(S.cells).some(hit))&&!confirm('Delete this and everything inside it?'))return;
S[ax]=S[ax].filter(n=>!del.has(n.id));for(const k in S.cells)if(hit(k))delete S.cells[k];for(const k in S.sc||{})if(hit(k))delete S.sc[k];
S.info.forEach(i=>{if(del.has(i.pl))i.pl='';if(del.has(i.tm))i.tm=''})}
render()},true);
TABS.push(['life','⏳ Life timeline']);
const hc=h=>!h?'#999':/wound|sick|\bill|unwell|unhealth|curs|poison|dying|injur|weak|fever|hurt/i.test(h)?'#d63031':/health|well|fine|strong|good|fit/i.test(h)?'#2fa86b':'#e6a23c';
function vLife(){const C=vis('times'),FT=new Set(C.map(x=>x.n.id)),sel=S.lc||S.chars.map(c=>c.id),E={};
for(const kk in S.cells){const[pk,tk]=kk.split('|'),b=rep('times',tk,FT);if(b)S.cells[kk].forEach((x,i)=>(E[x.cid+'|'+b]=E[x.cid+'|'+b]||[]).push({kk,i,x,pk}))}
const met=(c,b,kk)=>S.chars.filter(m=>m.id!=c&&(E[m.id+'|'+b]||[]).some(q=>q.kk==kk));
const tg=S.chars.map(c=>`<button data-a="lc" data-id="${c.id}" class="${sel.includes(c.id)?'on':''}" style="--c:${c.color}">${esc(c.name)}</button>`).join('');
let g=`<div class="hd c0"><small style="color:var(--mut)">Character ↓ / Time →</small></div>`+C.map(({n})=>`<div class="hd"><button class="x" data-a="tg" data-ax="times" data-id="${n.id}">${kids('times',n.id).length?(n.exp?'▾':'▸'):'·'}</button><b>${esc(n.name)}</b><small style="flex-basis:100%;color:var(--mut)">${esc(path('times',n))}</small></div>`).join('');
S.chars.filter(c=>sel.includes(c.id)).forEach(c=>{const P=new Set(),M=new Set();
C.forEach(({n})=>(E[c.id+'|'+n.id]||[]).forEach(e=>{P.add(e.pk);met(c.id,n.id,e.kk).forEach(m=>M.add(m.name))}));
g+=`<div class="hd r" style="border-left:5px solid ${c.color}"><div><b>${esc(c.name)}</b><br><small style="color:var(--mut)">📍 ${P.size} places · 👥 ${M.size} met</small></div></div>`;
C.forEach(({n})=>{const L=E[c.id+'|'+n.id]||[],I=S.info.filter(i=>i.who.includes(c.id)&&rep('times',i.tm,FT)==n.id);
g+=`<div class="cell">`+(L.length?L.map(({kk,i,x,pk})=>{const o=met(c.id,n.id,kk),w=[x.clothing,x.wealth,x.powers].filter(Boolean).join(' · ');
return`<div class="chip" data-k="${kk}" data-i="${i}" style="border-color:${c.color};${o.length?'outline:2px solid var(--acc);':''}"><div style="height:4px;border-radius:3px;background:${hc(x.health)};margin-bottom:4px"></div><b>📍 ${esc(nm('places',pk))}</b><small>${mj(x.mood)} ${esc(x.emotion)}</small><small>❤ ${esc(x.health||'—')}</small>${w?`<small>👕 ${esc(w)}</small>`:''}${o.length?`<small style="color:var(--acc)">🤝 ${o.map(m=>esc(m.name)).join(', ')}</small>`:''}</div>`}).join(''):'<small style="color:var(--mut)">—</small>')+I.map(i=>`<span class="info" data-tab="info">💬 ${esc(i.title||'Untitled')}</span>`).join('')+`</div>`})});
return`<div class="pal"><small>Show lifelines:</small><div class="tg">${tg}</div><span class="sp"></span><span class="zm">Time zoom <button data-a="zm" data-ax="times" data-d="-1">−</button><button data-a="zm" data-ax="times" data-d="1">+</button></span></div>
<div id="mw"><div id="grid" style="grid-template-columns:170px repeat(${C.length},minmax(210px,1fr))">${g}</div></div>
<p style="color:var(--mut)">Each lane is one character's life through time: places, mood, health (coloured bar: green healthy · amber other · red hurt), and 🤝 people met at the same place and time (outlined). Select several characters to compare overlapping lifelines. Click a card to edit.</p>`}
let lastTab=null,pendS=0;
function render(){const V={map:vMap,book:vBook,matrix:vMatrix,chars:vChars,rels:vRels,info:vInfo,life:vLife,worlds:()=>typeof vWorlds=='function'?vWorlds():'',ai:()=>typeof vAI=='function'?vAI():'',docs:()=>typeof vDocs=='function'?vDocs():'',places:()=>typeof vPlaces=='function'?vPlaces():'',arcs:()=>typeof vArcs=='function'?vArcs():'',...(window.XV||{})};if(!V[S.tab])S.tab='map';
const mw=$('#mw'),jm=$('#jm'),same=lastTab==S.tab,sp=same&&mw?[mw.scrollLeft,mw.scrollTop]:null;pendS=same&&jm?jm.scrollTop:0;
{const GR=[['Plan',['map','cork','matrix','life','cal']],['Write',['book','craft','packs','tension','weave']],['People',['chars','rels','arcs','info']],['World',['worlds','places','wmap','wiki','props','board']],['Tools',['ai','data']],['Help',['docs']]],used=new Set(GR.flatMap(g=>g[1])),more=TABS.filter(x=>!used.has(x[0])).map(x=>x[0]);if(more.length)GR.splice(GR.length-1,0,['More',more]);
$('#nav').innerHTML=GR.map(g=>{const it=g[1].map(id=>TABS.find(x=>x[0]==id)).filter(Boolean);return it.length?`<div class="gl">${g[0]}</div>`+it.map(x=>{const m=/^(\S+)\s+(.*)$/.exec(x[1])||['',x[1],''];return`<button class="si ${S.tab==x[0]?'on':''}" data-tab="${x[0]}" title="${esc(m[2])}"><i>${m[1]}</i><span>${esc(m[2])}</span></button>`}).join(''):''}).join('')}
$('#app').innerHTML=V[S.tab]();lastTab=S.tab;
if(sp){const m=$('#mw');if(m){m.scrollLeft=sp[0];m.scrollTop=sp[1]}}
if(S.th)document.documentElement.dataset.theme=S.th;const ti=$('#ttl');if(ti&&document.activeElement!==ti)ti.value=S.title||'';
if(S.tab=='map')paint();if(S.tab=='matrix'){post();requestAnimationFrame(drawPath)}snap();save()}
document.addEventListener('click',e=>{const t=e.target.closest('[data-a="lc"]');if(!t)return;e.stopPropagation();
S.lc=S.lc||S.chars.map(c=>c.id);const id=t.dataset.id;S.lc=S.lc.includes(id)?S.lc.filter(x=>x!=id):[...S.lc,id];render()},true);
document.head.insertAdjacentHTML('beforeend','<style>.cell{position:relative}.cell[data-c]{cursor:cell}.cell[data-c]:hover::after{content:"✎ scene note";position:absolute;right:6px;bottom:3px;font-size:10px;color:var(--mut)}.sc{font-size:11px;font-weight:600;color:var(--acc)}.chip.warn{outline:2px solid #d63031}.chip.warn b::after{content:" ⚠"}.chip.fd{opacity:.2}</style>');
let H=[],hi=-1,sceneK=null;
const snap=()=>{const j=JSON.stringify({...S,tab:0,sel:0,lc:0,q:0,th:0,mv:0});if(H[hi]!==j){H=H.slice(0,hi+1);H.push(j);if(H.length>60)H.shift();hi=H.length-1}};
const go=d=>{const n=hi+d;if(n<0||n>=H.length)return;hi=n;const k={tab:S.tab,sel:S.sel,lc:S.lc,q:S.q,th:S.th,mv:S.mv};S=Object.assign(JSON.parse(H[hi]),k);$('#dr').classList.remove('open');drawer=null};
function post(){if(S.tab!='matrix')return;const C=vis('times'),q=(S.q||'').toLowerCase(),seen={},msgs=[],done=new Set(),cs=[...document.querySelectorAll('.cell[data-c] .chip')];
cs.forEach(e=>{const c=e.closest('.cell'),k=c.dataset.c+'|'+e.dataset.cid;(seen[k]=seen[k]||new Set()).add(c.dataset.k)});
cs.forEach(e=>{const c=e.closest('.cell'),k=c.dataset.c+'|'+e.dataset.cid,hit=seen[k].size>1,x=(S.cells[e.dataset.k]||[])[e.dataset.i];
e.classList.toggle('warn',hit);e.classList.toggle('fd',!!q&&!(JSON.stringify(x||{}).toLowerCase()+ch(e.dataset.cid).name.toLowerCase()).includes(q));
if(hit&&!done.has(k)){done.add(k);msgs.push(`${esc(ch(e.dataset.cid).name)} is in ${seen[k].size} places at “${esc(C[+c.dataset.c].n.name)}”`)}});
const m=$('#mw');if(m){let d=$('#iss');if(!d){d=document.createElement('div');d.id='iss';m.after(d)}d.innerHTML=msgs.length?`<div class="card" style="margin-top:10px;border-color:var(--bad)">⚠ Continuity check: ${msgs.join(' · ')}</div>`:''}}
function vChars(){return`<div class="row"><h3 style="flex:3">Characters</h3><button class="pri" data-a="ac">+ Add character</button></div><div class="grid2">`+S.chars.map(c=>{const F=(f,p)=>`<textarea rows="2" data-t="chars" data-id="${c.id}" data-f="${f}" placeholder="${p}">${esc(c[f])}</textarea>`;return`<div class="card" style="border-top:4px solid ${c.color}"><input data-t="chars" data-id="${c.id}" data-f="name" value="${esc(c.name)}"><input data-t="chars" data-id="${c.id}" data-f="role" placeholder="Role (protagonist, mentor…)" value="${esc(c.role)}">${F('desc','Nature & traits (e.g. made of gold, immortal)')}${F('goal','Goal / want')}${F('flaw','Flaw / fear')}${F('secret','Secret')}<div class="row"><input type="color" data-t="chars" data-id="${c.id}" data-f="color" data-r="1" value="${c.color}"><button data-a="dc" data-id="${c.id}">Delete</button></div><small style="color:var(--mut)">${S.rels.filter(r=>r.a==c.id||r.b==c.id).length} relationships · ${Object.values(S.cells).filter(l=>l.some(x=>x.cid==c.id)).length} scenes</small></div>`}).join('')+`</div>`}
function toMD(){const L=[`# ${S.title||'Untitled story'}`,'','## Characters'],all=(a,p=null,o=[])=>{kids(a,p).forEach(n=>{o.push(n);all(a,n.id,o)});return o},sc=S.sc||{};
S.chars.forEach(c=>L.push(`- **${c.name}** — ${c.role||'role?'}. Goal: ${c.goal||'—'}. Flaw: ${c.flaw||'—'}. Secret: ${c.secret||'—'}`));
L.push('','## Relationships');S.rels.forEach(r=>L.push(`- ${ch(r.a).name} → ${ch(r.b).name} (${r.type}): ${r.note||''}`));
L.push('','## Story timeline');
all('times').forEach(t=>{[...new Set([...Object.keys(S.cells),...Object.keys(sc)])].filter(k=>k.split('|')[1]==t.id&&((S.cells[k]||[]).length||sc[k])).forEach(k=>{const s=sc[k];L.push('',`### ${[path('times',t),t.name].filter(Boolean).join(' › ')} — ${nm('places',k.split('|')[0])}${s&&s.t?': '+s.t:''}`);if(s&&s.s)L.push(s.s);
(S.cells[k]||[]).forEach(x=>L.push(`- **${ch(x.cid).name}**${s&&s.pov==x.cid?' (POV)':''}: ${[x.mood,x.emotion,x.health,x.clothing,x.wealth,x.powers,x.notes].filter(Boolean).join('; ')}`))})});
L.push('','## Journey events');[...S.ev].sort((a,b)=>a.t-b.t).forEach(e=>{const tl=S.tls.find(l=>l.id==e.tl);L.push(`- ${fullT(e.t)} [${tl?tl.name:'?'}] **${e.title||'Untitled'}**${e.place?' @ '+e.place:''} — ${e.chars.map(c=>ch(c).name).join(', ')||'—'}${e.mood?' '+e.mood:''}${e.health?' · '+e.health:''}${e.notes?' — '+e.notes:''}`)});L.push('','## Shared info');S.info.forEach(i=>L.push(`### ${i.title||'Untitled'}`,`Known by: ${i.who.map(w=>ch(w).name).join(', ')||'—'}`,i.text,''));return L.join('\n')}
function openMD(){drawer=null;const d=$('#dr');d.style.width='min(560px,100%)';d.innerHTML=`<div class="row"><h3 style="flex:3">📜 Story Markdown</h3><button data-a="cd">Close</button></div><textarea id="mdt" rows="26" readonly style="font-family:monospace;font-size:12px">${esc(toMD())}</textarea><div class="row" style="margin-top:8px"><button class="pri" data-a="cp">Copy</button><button data-a="dlm">Download .md</button></div>`;d.classList.add('open')}
function openScene(k){sceneK=k;drawer=null;const[p,t]=k.split('|'),s=(S.sc||{})[k]||{t:'',s:'',pov:''},d=$('#dr');d.style.width='';
d.innerHTML=`<div class="row"><h3 style="flex:3">🎬 Scene</h3><button data-a="cd">Close</button></div><small style="color:var(--mut)">${esc(nm('places',p))} · ${esc(nm('times',t))}</small><label>Scene title</label><input data-sc="t" value="${esc(s.t)}"><label>POV character</label><select data-sc="pov"><option value="">—</option>${S.chars.map(c=>`<option value="${c.id}" ${c.id==s.pov?'selected':''}>${esc(c.name)}</option>`).join('')}</select><label>What happens (beats, conflict, stakes)</label><textarea rows="10" data-sc="s">${esc(s.s)}</textarea>`;d.classList.add('open')}
const _od=openDr;openDr=(k,i)=>{_od(k,i);$('#dr').style.width='';$('#dr').insertAdjacentHTML('beforeend','<div class="row" style="margin-top:8px"><button data-a="nx">⏭ Continue in next time</button></div>')};
document.addEventListener('click',e=>{const t=e.target.closest('[data-a]'),c=e.target.closest('.cell[data-c]');
if(!t){if(c&&(e.target===c||e.target.closest('.sc')))openScene(c.dataset.k);return}
const a=t.dataset.a;if(!['undo','redo','th','md','cp','dlm','nx'].includes(a))return;e.stopPropagation();
if(a=='md')return openMD();
if(a=='cp'){const x=$('#mdt');x.select();try{navigator.clipboard.writeText(x.value)}catch(z){}document.execCommand('copy');t.textContent='Copied ✓';return}
if(a=='dlm'){const l=document.createElement('a');l.href=URL.createObjectURL(new Blob([toMD()]));l.download=(S.title||'story')+'.md';l.click();return}
if(a=='undo')go(-1);else if(a=='redo')go(1);
else if(a=='th'){const r=document.documentElement,dk=r.dataset.theme?r.dataset.theme=='dark':matchMedia('(prefers-color-scheme:dark)').matches;S.th=dk?'light':'dark';r.dataset.theme=S.th}
else if(a=='nx'&&drawer){const[k,i]=drawer,x=S.cells[k][i],[pk,tk]=k.split('|'),C=vis('times'),b=rep('times',tk,new Set(C.map(c=>c.n.id))),nx=C[C.findIndex(c=>c.n.id==b)+1];
if(!nx){SFX.notice('No later time column — add or expand a time first.');return}
const nk=pk+'|'+nx.n.id,L=S.cells[nk]=S.cells[nk]||[];if(!L.some(y=>y.cid==x.cid))L.push({...x,notes:''});$('#dr').classList.remove('open')}
render()},true);
document.addEventListener('input',e=>{const t=e.target,d=t.dataset;
if(t.id=='ttl'){S.title=t.value;save();return}
if(t.id=='q'){S.q=t.value;post();if(S.tab=='map')paint();return}
if(d.sc!==undefined){S.sc=S.sc||{};const o=S.sc[sceneK]=S.sc[sceneK]||{t:'',s:'',pov:''};o[d.sc]=t.value;save()}});
document.addEventListener('change',e=>{if(e.target.dataset.sc!==undefined)render();snap()});
document.addEventListener('keydown',e=>{const inp=/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
const kk=(e.key||'').toLowerCase();if((e.ctrlKey||e.metaKey)&&!inp&&(kk=='z'||kk=='y')){e.preventDefault();go(kk=='z'&&!e.shiftKey?-1:1);render()}
else if(e.key=='/'&&!inp){e.preventDefault();$('#q').focus()}
else if(e.key=='Escape')$('#dr').classList.remove('open')});
TABS.unshift(['map','🧭 Journey map']);TABS.find(t=>t[0]=='matrix')[1]='🗺 Scene grid';
document.head.insertAdjacentHTML('beforeend','<style>#jm{position:relative;overflow:hidden auto;border:1px solid var(--line);border-radius:12px;background:var(--card);height:calc(100vh - 190px);min-height:380px;touch-action:none;cursor:grab;user-select:none}#jm.pn{cursor:grabbing}.ln{position:absolute;left:0;right:0}.lb{position:absolute;left:0;width:150px;z-index:8;background:var(--bg);border-right:1px solid var(--line);border-bottom:1px solid var(--line);padding:8px;display:flex;flex-direction:column;gap:5px;box-sizing:border-box;cursor:default}.lb input[type=text],.lb input:not([type]){font-weight:600}.ev{position:absolute;width:160px;height:56px;border-radius:9px;background:var(--bg);border:2px solid;padding:4px 8px;cursor:pointer;z-index:4;box-shadow:0 2px 6px #0003;box-sizing:border-box}.ev b{font-size:12px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ev small{display:block;color:var(--mut);font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ev.dim{opacity:.25}.lh{position:absolute;right:-10px;top:50%;margin-top:-10px;width:20px;height:20px;border-radius:50%;background:var(--acc);color:#fff;font-size:12px;text-align:center;line-height:20px;cursor:crosshair;display:none}.ev:hover .lh{display:block}.tk{position:absolute;bottom:0;border-left:1px dashed var(--line)}#ax{position:sticky;top:0;height:28px;margin-bottom:-28px;background:var(--bg);z-index:7;border-bottom:1px solid var(--line)}</style>');
let MP={},LG=[],STEP=1,evId=null,G=null;
function initMap(){const[a,k]=S.chars;S.tls=[{id:'t1',name:'Present',color:'#6d5ae6'},{id:'t2',name:'The past',color:'#e6a23c'}];S.unit='Year';S.mv={ox:0,sc:60};
const e=(id,tl,t,title,place,cs,mood,health)=>({id,tl,t,title,place,chars:cs.filter(Boolean).map(c=>c.id),mood:mood||'',health:health||'',notes:''});
S.ev=[e('e1','t1',1,'Leaves the castle','Castle',[a,k],MOODS[7]),e('e2','t1',3,'Ambush in the forest','Forest',[a,k],MOODS[3],'Wounded'),e('e3','t1',6,'Uses the time gem','Village',[a],MOODS[1],'Wounded'),e('e4','t2',1.5,'Arrives in the past','Castle (past)',[a],MOODS[7]),e('e5','t2',2.5,'Warns Kael','Forest (past)',[a,k],MOODS[5]),e('e6','t1',8,'The camp is empty','Forest',[a,k],MOODS[4])];
S.lk=[{id:'l1',a:'e3',b:'e4',chars:S.ev[2].chars,label:'Time travel!'},{id:'l2',a:'e5',b:'e6',chars:S.ev[4].chars,label:''}]}
function vMap(){if(!S.mv)S.mv={ox:0,sc:60};const sel=S.lc||S.chars.map(c=>c.id),tg=S.chars.map(c=>`<button data-a="lc" data-id="${c.id}" class="${sel.includes(c.id)?'on':''}" style="--c:${c.color}">${esc(c.name)}</button>`).join('');
return`<div class="pal"><small>Journeys:</small><div class="tg">${tg}</div><span class="sp"></span><button data-a="tobk">📖 Render to book</button><button data-a="fit">Fit all</button><button data-a="tladd">+ Timeline</button><button class="pri" data-a="eadd">+ Event</button></div><div id="jm"></div><p style="color:var(--mut)"><b>Scroll</b> = zoom time · <b>drag background</b> = pan · <b>drag a box</b> = move in time or to another timeline · drag the <b>➜</b> handle (on hover) onto another box = journey arrow · arrows to another timeline or back in time become dashed ⏳ time travel · <b>double-click</b> a timeline to add an event · click an arrow label to edit/delete · Shift+scroll = scroll timelines.</p>`}
function paint(){const el=$('#jm');if(!el)return;const W=el.clientWidth,v=S.mv,LW=150,AH=28,BW=160,BH=56,st0=el.scrollTop||pendS,X=t=>LW+(t-v.ox)*v.sc,sel=S.lc||S.chars.map(c=>c.id),raw=140/v.sc,p=Math.pow(10,Math.floor(Math.log10(raw)));
STEP=(raw>1000?bigStep(raw):STEPS.find(s=>s>=raw))||(isFinite(raw)&&raw>1?bigStep(raw):0)||STEPS[0];let ax=`<span style="position:absolute;left:8px;top:6px;font-size:11px;font-weight:700;color:var(--acc)">🔎 ${unitName(STEP)}</span>`,gl='',lanes='',lab='',bx='',y=AH;MP={};LG=[];
for(let k=Math.ceil(v.ox/STEP);k<=Math.floor((v.ox+(W-LW)/v.sc)/STEP);k++){const t=k*STEP,x=X(t);gl+=`<div class="tk" style="left:${x}px;top:${AH}px"></div>`;ax+=`<span style="position:absolute;left:${x+4}px;top:6px;font-size:11px;color:var(--mut)">${fmtT(t,STEP)}</span>`}
S.tls.forEach(l=>{const re=[];S.ev.filter(e=>e.tl==l.id).sort((a,b)=>a.t-b.t).forEach(e=>{const x=X(e.t);let r=re.findIndex(q=>q<=x-8);if(r<0)r=re.length;re[r]=x+BW;MP[e.id]={x,y:y+8+r*(BH+10),l,e}});
const h=Math.max(90,re.length*(BH+10)+14);LG.push({id:l.id,y,h});
lanes+=`<div class="ln" style="top:${y}px;height:${h}px;background:${l.color}14;border-bottom:1px solid var(--line)"></div>`;
lab+=`<div class="lb" style="top:${y}px;height:${h}px;border-left:5px solid ${l.color}"><input data-t="tls" data-id="${l.id}" data-f="name" value="${esc(l.name)}"><div style="display:flex;gap:4px"><input type="color" data-t="tls" data-id="${l.id}" data-f="color" data-r="1" value="${l.color}"><button class="x" data-a="tld" data-id="${l.id}">✕</button></div></div>`;y+=h});
Object.values(MP).forEach(({x,y,l,e})=>{if(x+BW<LW||x>W)return;const dim=!mq(e)||(e.chars.length&&!e.chars.some(c=>sel.includes(c)));
bx+=`<div class="ev ${dim?'dim':''}" title="${fullT(e.t)}" data-ev="${e.id}" style="left:${x}px;top:${y}px;border-color:${l.color}"><b>${esc(e.title||'Untitled')}</b><small>${e.chars.map(c=>`<span style="color:${ch(c).color}">●</span>`).join('')} ${esc(e.place)} ${mj(e.mood)}</small><small>${e.health?'❤ '+esc(e.health):''}${e.tag?' #'+esc(e.tag):''}</small><div class="lh" data-lh="${e.id}">➜</div></div>`});
const cut=new Set(S.lk.flatMap(k=>k.chars.map(c=>k.a+'|'+c))),A=[];
S.tls.forEach(l=>{const E=S.ev.filter(e=>e.tl==l.id).sort((a,b)=>a.t-b.t);S.chars.forEach(c=>{const L=E.filter(e=>e.chars.includes(c.id));for(let i=1;i<L.length;i++)if(!cut.has(L[i-1].id+'|'+c.id))A.push({a:L[i-1].id,b:L[i].id,c:c.id})})});
S.lk.forEach(k=>(k.chars.length?k.chars:['']).forEach((c,i)=>A.push({a:k.a,b:k.b,c,k,f:!i})));
let sv='',cnt={};const mk={},lblDone=new Set();
A.filter(r=>(r.c===''||sel.includes(r.c))&&MP[r.a]&&MP[r.b]).forEach(r=>{const a=MP[r.a],b=MP[r.b],n=cnt[r.a+'|'+r.b]=(cnt[r.a+'|'+r.b]||0)+1,off=(n-1)*6,c=ch(r.c).color,tr=a.l!==b.l||b.e.t<a.e.t,x1=a.x+BW,y1=a.y+BH/2+off,x2=b.x,y2=b.y+BH/2+off,dx=Math.max(50,Math.abs(x2-x1)/2);mk[r.c]=c;
sv+=`<path d="M${x1},${y1} C${x1+dx},${y1} ${x2-dx},${y2} ${x2},${y2}" fill="none" stroke="${c}" stroke-width="2.5" ${tr?'stroke-dasharray="7 5"':''} marker-end="url(#m${r.c})"/>`;
if(r.k&&!lblDone.has(r.k.id)){lblDone.add(r.k.id);const d=b.e.t-a.e.t,lbl=(tr?'⏳ ':'')+(r.k.label||(tr?(d<0?'back ':d>0?'ahead ':'same time')+(d?dur(d):''):'↗'));
sv+=`<text data-lk="${r.k.id}" x="${(x1+x2)/2}" y="${(y1+y2)/2-6}" text-anchor="middle" font-size="12" font-weight="600" style="fill:${c};stroke:var(--card);stroke-width:4px;paint-order:stroke;pointer-events:all;cursor:pointer">${esc(lbl)}</text>`}});
const defs=Object.entries(mk).map(([id,c])=>`<marker id="m${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" fill="${c}"/></marker>`).join(''),H=Math.max(y,el.clientHeight-2);
el.innerHTML=`<div id="ji" style="position:relative;height:${H}px"><div id="ax">${ax}</div>${lanes}${gl}<svg style="position:absolute;left:0;top:0;z-index:3;pointer-events:none" width="${W}" height="${H}"><defs>${defs}</defs>${sv}</svg>${bx}${lab}<svg style="position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:30"><line id="tmp" style="display:none;stroke:var(--acc);stroke-width:3px;stroke-dasharray:4 4"/></svg></div>`;el.scrollTop=st0;pendS=0;save()}
function fit(){if(!S.ev.length)return;const W=($('#jm')?.clientWidth||900)-150-60,ts=S.ev.map(e=>e.t),mn=Math.min(...ts),sp=Math.max(Math.max(...ts)-mn,1e-6);S.mv.sc=Math.max(...ts)-mn<1e-4?60:Math.min(5e8,Math.max(.002,(W-160)/sp));S.mv.ox=mn-30/S.mv.sc}
function openEv(id){const e=S.ev.find(x=>x.id==id);if(!e)return;evId=id;drawer=null;const d=$('#dr'),f=(l,k,ph)=>`<label>${l}</label><input data-ev="${k}" placeholder="${ph}" value="${esc(e[k])}">`;d.style.width='';
d.innerHTML=`<div class="row"><h3 style="flex:3">Event</h3><button data-a="cd">Close</button></div>${f('Title','title','What happens')}<label>Timeline</label><select data-ev="tl">${S.tls.map(l=>`<option value="${l.id}" ${l.id==e.tl?'selected':''}>${esc(l.name)}</option>`).join('')}</select><label>When — year · month · day · hour · min</label><div style="display:flex;gap:4px">${['y','m','d','h','mi'].map(k=>`<input type="number" data-tp="${k}" value="${parts(e.t)[k]}">`).join('')}</div>${f('Place','place','Where')}<label>Characters here</label><div class="tg">${S.chars.map(c=>`<button data-a="evc" data-c="${c.id}" class="${e.chars.includes(c.id)?'on':''}" style="--c:${c.color}">${esc(c.name)}</button>`).join('')}</div><label>Mood</label><select data-ev="mood"><option value=""></option>${MOODS.map(m=>`<option ${m==e.mood?'selected':''}>${m}</option>`).join('')}</select>${f('Health','health','Healthy, wounded…')}<label>Manuscript text (use NAME: line for dialogue)</label><textarea rows="9" data-ev="prose">${esc(e.prose)}</textarea><label>Notes</label><textarea rows="3" data-ev="notes">${esc(e.notes)}</textarea><div class="row" style="margin-top:10px"><button data-a="evd">Delete event</button></div>`;d.classList.add('open')}
function editLk(id){const k=S.lk.find(x=>x.id==id);if(!k)return;const v=prompt('Arrow label (leave empty to delete the arrow)',k.label||'');if(v===null)return;if(v===''){if(confirm('Delete this arrow?'))S.lk=S.lk.filter(x=>x!=k)}else k.label=v;render()}
document.addEventListener('pointerdown',e=>{const jm=e.target.closest('#jm');if(!jm||e.button)return;const lk=e.target.closest('[data-lk]');if(lk)return editLk(lk.dataset.lk);
if(e.target.closest('.lb'))return;const lh=e.target.closest('[data-lh]'),ev=e.target.closest('[data-ev]');
G=lh?{m:'lk',id:lh.dataset.lh}:ev?{m:'ev',id:ev.dataset.ev}:{m:'pan',ox:S.mv.ox};G.sx=e.clientX;G.sy=e.clientY;G.mv=0;e.preventDefault()});
window.addEventListener('pointermove',e=>{if(!G)return;const dx=e.clientX-G.sx,dy=e.clientY-G.sy;if(Math.abs(dx)+Math.abs(dy)>4)G.mv=1;if(!G.mv)return;
if(G.m=='pan'){S.mv.ox=G.ox-dx/S.mv.sc;$('#jm').classList.add('pn');paint()}
else if(G.m=='ev'){const el=document.querySelector(`.ev[data-ev="${G.id}"]`);if(el){el.style.transform=`translate(${dx}px,${dy}px)`;el.style.zIndex=20}}
else{const r=$('#ji').getBoundingClientRect(),a=MP[G.id],l=$('#tmp');if(a&&l){l.style.display='';l.setAttribute('x1',a.x+160);l.setAttribute('y1',a.y+28);l.setAttribute('x2',e.clientX-r.left);l.setAttribute('y2',e.clientY-r.top)}}});
window.addEventListener('pointerup',e=>{if(!G)return;const g=G;G=null;const jm=$('#jm');jm&&jm.classList.remove('pn');
if(g.m=='ev'){if(!g.mv)return openEv(g.id);const r=$('#ji').getBoundingClientRect(),ev=S.ev.find(x=>x.id==g.id),s=STEP/10,y=e.clientY-r.top,l=LG.find(l=>y>=l.y&&y<l.y+l.h)||LG[LG.length-1];if(!ev)return render();ev.t=+(Math.round((ev.t+(e.clientX-g.sx)/S.mv.sc)/s)*s).toFixed(9);if(l)ev.tl=l.id;render()}
else if(g.m=='lk'){const b=document.elementFromPoint(e.clientX,e.clientY)?.closest('.ev[data-ev]'),a=S.ev.find(x=>x.id==g.id);if(b&&a&&b.dataset.ev!=g.id&&!S.lk.some(k=>k.a==g.id&&k.b==b.dataset.ev))S.lk.push({id:uid(),a:g.id,b:b.dataset.ev,chars:[...a.chars],label:''});render()}
else if(g.mv)render()});
document.addEventListener('wheel',e=>{const jm=e.target.closest('#jm');if(!jm)return;e.preventDefault();if(e.shiftKey){jm.scrollTop+=e.deltaY||e.deltaX;return}
const dy=e.deltaMode==1?e.deltaY*33:e.deltaY,mx=e.clientX-jm.getBoundingClientRect().left,v=S.mv,t=v.ox+(mx-150)/v.sc;v.sc=Math.min(5e8,Math.max(.002,v.sc*Math.exp(-dy*.0015)));v.ox=t-(mx-150)/v.sc;paint()},{passive:false});
document.addEventListener('dblclick',e=>{if(!e.target.closest('#jm')||e.target.closest('[data-ev],.lb,[data-lk]'))return;const r=$('#ji').getBoundingClientRect(),y=e.clientY-r.top,l=LG.find(l=>y>=l.y&&y<l.y+l.h);if(!l)return;const v=S.mv,s=STEP/10,id=uid();
S.ev.push({id,tl:l.id,t:+(Math.round((v.ox+(e.clientX-r.left-150)/v.sc)/s)*s).toFixed(9),title:'New event',place:'',chars:[],mood:'',health:'',notes:''});render();openEv(id)});
document.addEventListener('click',e=>{const t=e.target.closest('[data-a]');if(!t)return;const a=t.dataset.a,d=t.dataset;if(!['evc','evd','eadd','tladd','tld','fit'].includes(a))return;e.stopPropagation();const ev=S.ev&&S.ev.find(x=>x.id==evId);
if(a=='evc'&&ev)ev.chars=ev.chars.includes(d.c)?ev.chars.filter(c=>c!=d.c):[...ev.chars,d.c];
else if(a=='evd'&&ev){S.ev=S.ev.filter(x=>x!=ev);S.lk=S.lk.filter(k=>k.a!=ev.id&&k.b!=ev.id);$('#dr').classList.remove('open')}
else if(a=='eadd'){const v=S.mv,W=$('#jm')?.clientWidth||800,id=uid();S.ev.push({id,tl:S.tls[0]?.id,t:+(v.ox+(W-150)/v.sc/2).toFixed(9),title:'New event',place:'',chars:[],mood:'',health:'',notes:''});render();openEv(id);return}
else if(a=='tladd')S.tls.push({id:uid(),name:'Timeline '+(S.tls.length+1),color:COL[S.tls.length%7]});
else if(a=='tld'){if(S.tls.length<2)return;S.ev.filter(x=>x.tl==d.id).forEach(x=>S.lk=S.lk.filter(k=>k.a!=x.id&&k.b!=x.id));S.ev=S.ev.filter(x=>x.tl!=d.id);S.tls=S.tls.filter(l=>l.id!=d.id)}
else if(a=='fit')fit();
render();if(a=='evc'&&ev)openEv(ev.id)},true);
document.addEventListener('input',e=>{const t=e.target,k=t.dataset.ev;if(k!==undefined&&t.closest('#dr')){const o=S.ev.find(x=>x.id==evId);if(o){o[k]=k=='t'?+t.value||0:t.value;paint()}}if(t.dataset.un!==undefined){S.unit=t.value;paint()}});
/* ---- calendar helpers: 1 year = 12 months x 30 days x 24 h ---- */
let U=518400;const two=n=>String(n).padStart(2,'0');
const STEPS=[1000,500,200,100,50,20,10,5,2,1,6/12,3/12,2/12,1/12,15/360,10/360,5/360,2/360,1/360,12/8640,6/8640,3/8640,1/8640,30/U,15/U,10/U,5/U,1/U].sort((a,b)=>a-b);
/* ---- calendar: default 12 months × 30 days × 24 h; stories may define their own (S.cal) ---- */
const DEFCAL={era:'Year',hpd:24,months:Array.from({length:12},(_,i)=>({n:'Month '+(i+1),d:30})),hol:[]};
let CALK='',CALC=null;
function cal(){const c=(typeof S!='undefined'&&S&&S.cal)||null,k=c?JSON.stringify(c):'';if(CALC&&k===CALK)return CALC;CALK=k;
 const hpd=c&&c.hpd>=1&&c.hpd<=100?Math.round(c.hpd):24,mon=c&&Array.isArray(c.months)&&c.months.length?c.months.filter(m=>m&&m.d>=1).map((m,i)=>({n:String(m.n||'Month '+(i+1)).slice(0,30),d:Math.min(400,Math.round(m.d))})):DEFCAL.months;
 const M=mon.length||1,dpy=mon.reduce((a,m)=>a+m.d,0)||360,mpd=hpd*60,cum=[];let t=0;mon.forEach(m=>{cum.push(t);t+=m.d});
 const hol=(c&&Array.isArray(c.hol)?c.hol:[]).filter(h=>h&&h.n&&h.m>=1&&h.m<=M&&h.d>=1);
 CALC={era:(c&&c.era)||'Year',hpd,mon,M,dpy,mpd,cum,hol,U:dpy*mpd,custom:!!(c&&(c.months||c.hpd||c.era))};
 U=CALC.U;rebuildSteps();return CALC}
function rebuildSteps(){const C=CALC||cal(),a=[1000,500,200,100,50,20,10,5,2,1],div=n=>{const r=[];for(let d=1;d<n;d++)if(n%d==0)r.push(d);return r};
 div(C.M).forEach(d=>a.push(d/C.M));[1,2,5,10,15].forEach(d=>{if(d<C.dpy)a.push(d/C.dpy)});
 [12,6,3,1].forEach(h=>{if(h<=C.hpd)a.push(h/(C.dpy*C.hpd))});[30,15,10,5,1].forEach(m=>a.push(m/C.U));
 const u=[...new Set(a.map(x=>+x.toPrecision(12)))].sort((x,y)=>x-y);if(typeof STEPS!='undefined'){STEPS.length=0;STEPS.push(...u)}return u}
const parts=t=>{const C=cal();let M=Math.round(t*C.U),y=Math.floor(M/C.U);M-=y*C.U;const day=Math.floor(M/C.mpd);M-=day*C.mpd;let m=C.M-1;for(let i=0;i<C.M;i++)if(day<C.cum[i]+C.mon[i].d){m=i;break}return{y,m:m+1,d:day-C.cum[m]+1,h:Math.floor(M/60),mi:M%60}};
const timeOf=(y,m,d,h,mi)=>{const C=cal();m=Math.min(C.M,Math.max(1,Math.round(m||1)));d=Math.max(1,Math.round(d||1));return((+y||0)*C.U+(C.cum[m-1]+d-1)*C.mpd+(+h||0)*60+(+mi||0))/C.U};
const holAt=t=>{const C=cal();if(!C.hol.length)return'';const p=parts(t),h=C.hol.find(x=>x.m==p.m&&x.d==p.d);return h?h.n:''};
const bigStep=r=>{if(!isFinite(r)||r<=0)return 1000;const k=Math.pow(10,Math.floor(Math.log10(r)));return[1,2,5,10].map(m=>m*k).find(s=>s>=r)||10*k};
const fmtT=(t,s)=>{const C=cal(),p=parts(t),mn=C.mon[p.m-1].n,E=C.era=='Year'?'Year':C.era;return s>=1?`${E} ${p.y.toLocaleString('en-US')}`:s>=1/C.M-1e-9?`Y${p.y} · ${mn}`:s>=1/C.dpy-1e-9?`Y${p.y} ${mn} · Day ${p.d}`:s>=1/(C.dpy*C.hpd)-1e-9?`Y${p.y} ${mn} ${p.d} · ${two(p.h)}:00`:`D${p.d} · ${two(p.h)}:${two(p.mi)}`};
const fullT=t=>{const C=cal(),p=parts(t),h=holAt(t);return C.custom?`${C.era} ${p.y}, ${C.mon[p.m-1].n} ${p.d}, ${two(p.h)}:${two(p.mi)}${h?' ('+h+')':''}`:`Year ${p.y}, month ${p.m}, day ${p.d}, ${two(p.h)}:${two(p.mi)}`};
const dur=d=>{const C=cal(),m=Math.round(Math.abs(d)*C.U),f=(n,u)=>(+n.toFixed(2))+' '+u;return m>=C.U?f(m/C.U,'yr'):m>=C.U/C.M?f(m/(C.U/C.M),'mo'):m>=C.mpd?f(m/C.mpd,'d'):m>=60?f(m/60,'h'):m+' min'};
const unitName=s=>{const C=cal();return s>=1e6?'Million-year spans':s>=1000?'Millennia':s>=100?'Centuries':s>=10?'Decades':s>=1?'Years':s>=1/C.M-1e-9?'Months':s>=1/C.dpy-1e-9?'Days':s>=1/(C.dpy*C.hpd)-1e-9?'Hours':'Minutes'};
/* ---- story library ---- */
const LIB=()=>{let l;try{l=JSON.parse(localStorage.getItem('sf-lib'))}catch(e){l=null}if(!Array.isArray(l))l=['sf2'];PROT.forEach(id=>{if(!l.includes(id))l.push(id)});return l};
const setLib=a=>{try{localStorage.setItem('sf-lib',JSON.stringify(a))}catch(e){}};
const ld=id=>{try{const v=JSON.parse(localStorage.getItem(id));if(v){if(PROT.includes(id)&&window.SAMPLES&&(+v.sv||0)<SAMPLES.VERSION){try{const bk='sf-baks-'+id,a=JSON.parse(localStorage.getItem(bk)||'[]');a.unshift({ts:Date.now(),why:'before example-story update',j:JSON.stringify(v)});localStorage.setItem(bk,JSON.stringify(a.slice(0,8)))}catch(x){}const n=id=='sf-river'?seedRiver():seedSunstone();try{localStorage.setItem(id,JSON.stringify(n))}catch(x){}return n}return v}}catch(e){}if(id=='sf-river')return seedRiver();if(id=='sf-sunstone')return seedSunstone();return null};
function blank(){return{tab:'map',places:[{id:'p'+uid(),name:'Place 1',lv:0,parent:null,exp:0}],times:[{id:'m'+uid(),name:'Time 1',lv:0,parent:null,exp:0}],chars:[{id:uid(),name:'Character 1',role:'',color:COL[0]}],cells:{},rels:[],info:[],sel:null,sc:{},title:'Untitled story',tls:[{id:'t1',name:'Main timeline',color:'#6d5ae6'}],ev:[],lk:[],mv:{ox:0,sc:60}}}
function sw(id,data,skip){if(!skip)flush();KEY=id;try{localStorage.setItem('sf-cur',id)}catch(e){}const l=LIB();if(!l.includes(id)){l.push(id);setLib(l)}S=norm(data||ld(id))||norm(blank());H=[];hi=-1;$('#dr').classList.remove('open');drawer=null;const q=$('#q');if(q)q.value=S.q||'';render()}
function openLib(){const d=$('#dr');d.style.width='min(460px,100%)';drawer=null;
d.innerHTML=`<div class="row"><h3 style="flex:3">📚 Kathākośa</h3><button data-a="cd">Close</button></div><div class="row"><button class="pri" data-a="sn">+ New story</button><button data-a="si">Import JSON</button></div><p style="color:var(--mut);font-size:12px;margin:0 0 10px">★ The two built-in example stories show how to use every tab (Characters, Relationships, Shared Info, Scene grid, Journey map, Book). They can be edited or duplicated, but not deleted.</p>`+LIB().map(id=>{const s=id==KEY?S:ld(id)||{};const prot=PROT.includes(id);return`<div class="card" style="margin-bottom:8px;${id==KEY?'border-color:var(--acc)':''}"><b>${prot?'★ ':''}${esc(s.title||'Untitled story')}</b><small style="color:var(--mut)">${(s.chars||[]).length} characters · ${(s.ev||[]).length} events · ${(s.tls||[]).length} timelines</small><div style="display:flex;gap:6px"><button data-a="so" data-id="${id}">${id==KEY?'Current':'Open'}</button><button data-a="sd" data-id="${id}">Duplicate</button>${prot?`<button data-a="rs" data-id="${id}" title="Restore this example to its original content">Restore original</button>`:`<button data-a="sx" data-id="${id}">Delete</button>`}</div></div>`}).join('');d.classList.add('open')}
/* ---- book / screenplay renderer ---- */
TABS.push(['book','📖 Book / Script']);
document.head.insertAdjacentHTML('beforeend','<style>.bkw{display:flex;flex-wrap:wrap;gap:18px;justify-content:center;padding:6px}.pg{width:420px;min-height:600px;background:#fff;color:#222;padding:46px 44px 56px;box-shadow:0 4px 18px #0004;position:relative;box-sizing:border-box;font:15px/1.65 Georgia,serif}.pg.script{font:13px/1.35 "Courier New",monospace;width:460px;min-height:620px}.pg .tt{font-size:30px;text-align:center;margin-top:200px;font-weight:700}.pg .ch{text-align:center;font-size:12px;letter-spacing:.2em;text-transform:uppercase;margin-top:30px;color:#6b6b6b}.pg .ct{text-align:center;font-size:22px;font-weight:700;margin-bottom:26px}.pg .p{text-indent:1.4em;text-align:justify}.pg .k{text-indent:0}.pg .ph{color:#aaa;font-style:italic}.pg .sl{font-weight:700;text-transform:uppercase;margin-top:14px}.pg .ac{margin:8px 0}.pg .cu{margin:12px 0 0 190px;text-transform:uppercase}.pg .dl{margin:0 80px 0 90px}.pgn{position:absolute;bottom:20px;left:0;right:0;text-align:center;font-size:11px;color:#999}@media print{header,.pal,#dr,.hint{display:none!important}body{background:#fff}main{padding:0}.bkw{display:block;padding:0}.pg{box-shadow:none;page-break-after:always;margin:0 auto}}</style>');
// Dialogue line syntax:  Name: text   or   Name (softly): text      (see also '# scene heading' and '> transition' lines)
const DLG=/^(\p{Lu}[\p{L}\d .'-]{0,24}?)(?:\s*\(([^()]{1,40})\))?:\s*(.+)$/u,dlg=q=>{const m=q.match(DLG);if(!m)return null;const n=m[1].trim(),pa=(m[2]||'').trim(),c=S.chars.find(c=>c.name.trim().toLowerCase()==n.toLowerCase());if(c)return[c.name,m[3],pa];return n==n.toUpperCase()?[n.toLowerCase().replace(/\b\p{L}/gu,x=>x.toUpperCase()),m[3],pa]:null},say=(n,s,pa)=>{s=s.trim().replace(/^["“]+|["”]+$/g,'');const p=/[?!…]$/.test(s)?'':',';return`“${s.replace(/[.,]$/,'')}${p}” ${n} said${pa?' '+pa.replace(/^\(|\)$/g,''):''}.`};
function bookPages(){const b=S.bk||{},sc=b.fmt=='script',cap=sc?50:1000,P=[];let cur=[],w=0;
const nl=()=>{if(cur.length)P.push(cur);cur=[];w=0};
const add=(c,t,cpl=60,ex=0)=>{const x=(sc?Math.ceil(t.length/cpl)+1:t.length)+ex;if(w+x>cap&&w>0&&x<=cap)nl();
if(x>cap){const fit=Math.max(20,Math.floor(t.length*(cap-w)/x));let cut=t.lastIndexOf(' ',fit);if(cut<10)cut=fit;cur.push([c,t.slice(0,cut)]);nl();return add(c+' k',t.slice(cut).trim(),cpl)}cur.push([c,t]);w+=x};
cur.push(['tt',S.title||'Untitled story']);nl();
const o=b.ord=='tl'?e=>S.tls.findIndex(l=>l.id==e.tl):()=>0;
bookEv().forEach((e,i)=>{const ps=(e.prose||'').split(/\n+/).filter(x=>x.trim());
if(sc){add('sl',`INT./EXT. ${(e.place||'UNKNOWN').toUpperCase()} — YEAR ${parts(e.t).y}`,60);
if(!ps.length)add('ac','('+(e.title||'Untitled')+' — no text yet)',60);
ps.forEach(q=>{const m=dlg(q);if(m){add('cu',m[0],1000);add('dl',m[1],34)}else add('ac',q,60)})}
else{nl();add('ch','Chapter '+(i+1),60,250);add('ct',e.title||'Untitled',60);
if(!ps.length)add('ph','(No manuscript text yet — click this event on the Journey map and write the scene.)');
ps.forEach(q=>{const m=dlg(q);add('p',m?say(m[0],m[1]):q)})}});
nl();return P}
function vBook(){const b=S.bk=S.bk||{fmt:'book',ord:'time'},pg=bookPages();
return`<div class="pal"><small>Render as</small><div class="tg"><button data-a="bk" data-f="book" class="${b.fmt=='book'?'on':''}" style="--c:var(--acc)">📖 Novel</button><button data-a="bk" data-f="script" class="${b.fmt=='script'?'on':''}" style="--c:var(--acc)">🎬 Screenplay</button></div><select data-bo style="width:auto"><option value="time" ${b.ord!='tl'?'selected':''}>Order: by time (timelines merged)</option><option value="tl" ${b.ord=='tl'?'selected':''}>Order: timeline by timeline</option></select><span class="sp"></span><small>${pg.length} pages</small><button data-a="bt">Copy text</button><button class="pri" data-a="pr">Print / Save PDF</button></div><div class="bkw">${pg.map((p,i)=>`<div class="pg ${b.fmt=='script'?'script':''}">${p.map(([c,t])=>`<div class="${c}">${esc(t)}</div>`).join('')}<div class="pgn">${i||''}</div></div>`).join('')}</div><p class="hint" style="color:var(--mut)">Every event on the Journey map becomes a chapter (novel) or scene (screenplay) using its “Manuscript text”. In screenplay mode, lines like <code>KAEL: We should go.</code> become dialogue.</p>`}
document.addEventListener('click',e=>{const t=e.target.closest('[data-a]');if(!t)return;const a=t.dataset.a,d=t.dataset;if(!['lib','sn','si','so','sd','sx','rs','bk','pr','bt','tobk'].includes(a))return;e.stopPropagation();
if(a=='lib')return openLib();
if(a=='sn'){newStory(openLib);return}
if(a=='si'){pickJSON(o=>{sw('s'+uid(),o);openLib()});return}
if(a=='so'){if(d.id!=KEY)sw(d.id);return openLib()}
if(a=='sd'){const c=JSON.parse(JSON.stringify((d.id==KEY?S:ld(d.id))||blank()));c.title=(c.title||'Untitled story')+' (copy)';sw('s'+uid(),c);return openLib()}
if(a=='sx'){if(PROT.includes(d.id)){SFX.notice("This is a built-in example story and can't be deleted. You can still edit it, duplicate it, or use Restore original to reset it.");return openLib()}
if(!confirm('Delete this story permanently?'))return;const l=LIB().filter(x=>x!=d.id);setLib(l);try{for(const k of [d.id,'sf-snaps-'+d.id,'sf-baks-'+d.id])localStorage.removeItem(k)}catch(x){}
if(d.id==KEY){clearTimeout(saveT);l.length?sw(l[0],null,1):sw('s'+uid(),blank(),1)}return openLib()}
if(a=='rs'){if(!PROT.includes(d.id))return openLib();if(!confirm('Restore this example story to its original content? Any edits you made to it will be lost.'))return;
const data=d.id=='sf-river'?seedRiver():seedSunstone();try{localStorage.setItem(d.id,JSON.stringify(data))}catch(x){}
if(d.id==KEY)sw(d.id,data,1);return openLib()}
if(a=='bk'){S.bk=S.bk||{};S.bk.fmt=d.f}
else if(a=='tobk')S.tab='book';
else if(a=='pr'){typeof openPrint=='function'?openPrint():window.print();return}
else if(a=='bt'){const x=document.createElement('textarea');x.value=bookPages().map(p=>p.map(b=>b[1]).join('\n\n')).join('\n\n———\n\n');const done=()=>{t.textContent='Copied ✓'};if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(x.value).then(done,()=>SFX.notice('Copy failed — select the text and copy manually.'));else{document.body.appendChild(x);x.select();document.execCommand('copy');x.remove();done()}return}
render()},true);
document.addEventListener('input',e=>{const t=e.target;
if(t.dataset.bo!==undefined){S.bk.ord=t.value;render();return}
if(t.dataset.tp!==undefined){const o=S.ev.find(x=>x.id==evId),v={};document.querySelectorAll('#dr [data-tp]').forEach(i=>v[i.dataset.tp]=+i.value||0);v.m=Math.max(1,v.m);v.d=Math.max(1,v.d);if(o){o.t=timeOf(v.y,v.m,v.d,v.h,v.mi);paint()}}});
const SP={e1:'Aria: I can\'t stay here another night.\nKael: Then we leave before dawn.\nThe castle gates groaned as the two slipped into the cold morning mist.',e2:'The forest closed around them. An arrow hissed from the dark.\nKael: Down!\nAria fell hard, a line of fire across her shoulder.',e3:'In the empty village square, Aria turned the glowing gem in her palm.\nAria: Take me back before it all went wrong.\nThe world folded like paper.'};
(S.ev||[]).forEach(e=>{if(SP[e.id]&&e.prose===undefined)e.prose=SP[e.id]});
const demo=()=>{initMap();S.tab='map';S.ev.forEach(e=>{if(SP[e.id])e.prose=SP[e.id]});norm(S)};
window.addEventListener('pointercancel',()=>{if(G){G=null;render()}});
document.head.insertAdjacentHTML('beforeend','<style>#dr{visibility:hidden;transition:transform .25s,visibility 0s .25s}#dr.open{visibility:visible;transition:transform .25s}</style>');

/* ---- v3 additions ---- */
function warn(m){let b=$('#wn');if(!b){b=document.createElement('div');b.id='wn';b.setAttribute('role','alert');b.style.cssText='position:fixed;left:8px;bottom:8px;z-index:99;background:#d63031;color:#fff;padding:6px 10px;border-radius:8px;max-width:80%';document.body.appendChild(b)}b.textContent=m;b.style.display=m?'':'none'}
const wc=()=>S.ev.reduce((a,e)=>a+((typeof finWords=='function'?finWords(e):e.prose||'').match(/\S+/g)||[]).length,0);
const _vc=vChars;vChars=()=>_vc().replace(/<div class="row"><input type="color" data-t="chars" data-id="([^"]+)"/g,(m,id)=>`<input type="number" data-t="chars" data-id="${id}" data-f="born" placeholder="Birth year (for ages)" value="${esc(ch(id).born)}">`+m);
const _vb=vBook;vBook=()=>_vb().replace(/(\d+) pages<\/small>/,(m,n)=>`${n} pages · ${wc()} words</small>`).replace('<button data-a="bt">','<button data-a="ft">.fountain</button><button data-a="tx">.txt</button><button data-a="bt">');
const _oe=openEv;openEv=id=>{_oe(id);const e=S.ev.find(x=>x.id==id);if(!e)return;const y=parts(e.t).y,ag=e.chars.map(c=>ch(c)).filter(c=>c.born!==undefined&&c.born!==''&&isFinite(c.born)).map(c=>`${esc(c.name)} ${y-c.born}`);
$('#dr').insertAdjacentHTML('beforeend',`<small style="display:block;margin-top:8px;color:var(--mut)">${(e.prose||'').match(/\S+/g)?.length||0} words${ag.length?' · Ages: '+ag.join(', '):''}</small>`)};
function chk(){const m=[];S.chars.forEach(c=>{const E=S.ev.filter(e=>e.chars.includes(c.id));
for(let i=0;i<E.length;i++)for(let j=i+1;j<E.length;j++){const a=E[i],b=E[j];if(Math.abs(a.t-b.t)<1e-6&&(a.place||'').trim().toLowerCase()!=(b.place||'').trim().toLowerCase()&&!S.lk.some(k=>k.a==a.id&&k.b==b.id||k.a==b.id&&k.b==a.id))m.push(`${esc(c.name)} is in “${esc(a.place||'?')}” and “${esc(b.place||'?')}” at ${fullT(a.t)}`)}
S.tls.forEach(l=>{const L=E.filter(e=>e.tl==l.id).sort((a,b)=>a.t-b.t);for(let i=1;i<L.length;i++)if(hc(L[i-1].health)=='#d63031'&&hc(L[i].health)=='#2fa86b')m.push(`${esc(c.name)} goes from “${esc(L[i-1].health)}” (${esc(L[i-1].title)}) to “${esc(L[i].health)}” (${esc(L[i].title)}) with no recovery`)})});return m}
const _vm=vMap;vMap=()=>{const m=chk();return _vm().replace('<button data-a="fit">','<button data-a="mz" data-d="-1" aria-label="Zoom out">−</button><button data-a="mz" data-d="1" aria-label="Zoom in">＋</button><button data-a="fit">')+(m.length?`<div class="card" style="margin-top:10px;border-color:var(--bad)">⚠ Continuity: ${m.join(' · ')}</div>`:'')};
const _p=post;post=function(){_p();document.querySelectorAll('.cell[data-c]').forEach(c=>{if(c.querySelector('.ca'))return;c.insertAdjacentHTML('beforeend','<select class="ca" data-ca aria-label="Add a character here" style="width:auto;font-size:11px;opacity:.7"><option value="">＋ add…</option>'+S.chars.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')+'</select>')})};
const _o2=openDr;openDr=(k,i)=>{_o2(k,i);const o=[];S.places.forEach(p=>S.times.forEach(q=>{const z=p.id+'|'+q.id;if(z!=k)o.push(`<option value="${z}">${esc(p.name)} @ ${esc(q.name)}</option>`)}));$('#dr').insertAdjacentHTML('beforeend',`<label>Move to</label><select data-mv><option value="">Choose a cell…</option>${o.join('')}</select>`)};
document.addEventListener('click',e=>{const t=e.target.closest('[data-a]');if(!t)return;const a=t.dataset.a;if(!['mz','ft','tx','rb','dx','ep','cu','cma','cmd','evg','cs'].includes(a))return;e.stopPropagation();
if(a=='mz'){const jm=$('#jm'),v=S.mv,mx=((jm&&jm.clientWidth)||800)/2+75,tt=v.ox+(mx-150)/v.sc;v.sc=Math.min(5e8,Math.max(.002,v.sc*(+t.dataset.d>0?1.5:1/1.5)));v.ox=tt-(mx-150)/v.sc;render()}
else if(a=='rb'&&typeof openBackups=='function'){openBackups();return}
else if(a=='rb'){let b=null;try{b=norm(JSON.parse(localStorage.getItem('sf-bak-'+KEY)))}catch(x){}if(!b)SFX.notice('No automatic backup yet.');else if(confirm('Replace the current story with the last automatic backup?')){S=b;drawer=null;$('#dr').classList.remove('open');render()}}
else if(a=='cs'){if(!window.showSaveFilePicker)return SFX.notice('This browser cannot write to files directly. Use Chrome or Edge, or use Export.');showSaveFilePicker({suggestedName:(S.title||'story')+'.json',types:[{accept:{'application/json':['.json']}}]}).then(h=>{FH=h;syncOut();t.textContent='☁ Synced'}).catch(()=>{})}
else if(a=='dx')dl(zip(docxFiles()),(S.title||'story')+'.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document');
else if(a=='ep')dl(zip(epubFiles()),(S.title||'story')+'.epub','application/epub+zip');
else if(a=='cu'){const cur=bookEv().map(e=>e.id),i=cur.indexOf(t.dataset.id),j=i+ +t.dataset.d;if(j>=0&&j<cur.length)[cur[i],cur[j]]=[cur[j],cur[i]];S.bk=S.bk||{};S.bk.cu=cur;S.bk.ord='custom';render()}
else if(a=='cma'){const o=S.ev.find(x=>x.id==evId),x=$('#cmt');if(!o||!x||!x.value.trim())return;o.cm=Array.isArray(o.cm)?o.cm:[];o.cm.push({id:uid(),x:x.value.trim(),ts:Date.now()});render();openEv(o.id)}
else if(a=='cmd'){const o=S.ev.find(x=>x.id==evId);if(!o)return;o.cm=(o.cm||[]).filter(c=>c.id!=t.dataset.id);render();openEv(o.id)}
else if(a=='evg'){const o=S.ev.find(x=>x.id==evId);if(!o)return;const sp=document.querySelector('#dr [data-ev=gp]'),st=document.querySelector('#dr [data-ev=gt]');if(sp&&sp.value)o.gp=sp.value;if(st&&st.value)o.gt=st.value;if(!o.gp||!o.gt){const m=document.getElementById('evgmsg');if(m)m.textContent='Choose both a place and a time above first.';(!o.gp?sp:st)?.focus();return}const k=o.gp+'|'+o.gt,L=S.cells[k]=S.cells[k]||[];o.chars.forEach(c=>{if(!L.some(x=>x.cid==c))L.push({cid:c,mood:o.mood||MOODS[4],emotion:'',clothing:'',wealth:'',health:o.health||'',powers:'',notes:o.title||''})});render();openEv(o.id)}
else if(a=='tx')dl(bookPages().map(p=>p.map(b=>b[1]).join('\n\n')).join('\n\n'),(S.title||'story')+'.txt','text/plain');
else{const ev=bookEv();let s=`Title: ${S.title||'Untitled'}\n\n===\n\n`;
ev.forEach(e=>{s+=(typeof scriptTxtOf=='function'?scriptTxtOf(e):(e.prose||''))+'\n\n'});dl(s,(S.title||'story')+'.fountain','text/plain')}},true);
document.addEventListener('change',e=>{const t=e.target,v=t.value;
if(t.dataset.ca!==undefined&&v){const k=t.closest('.cell').dataset.k,L=S.cells[k]=S.cells[k]||[];if(!L.some(x=>x.cid==v))L.push({cid:v,mood:MOODS[4],emotion:'',clothing:'',wealth:'',health:'',powers:'',notes:''});render()}
else if(t.dataset.mv!==undefined&&v&&drawer){const[k,i]=drawer,x=(S.cells[k]||[])[i],L=S.cells[v]=S.cells[v]||[];if(!x)return;if(L.some(y=>y.cid==x.cid)){SFX.notice(ch(x.cid).name+' is already in that cell.');t.value=''}else{S.cells[k].splice(i,1);L.push(x);drawer=null;$('#dr').classList.remove('open');render()}}});
document.head.insertAdjacentHTML('beforeend','<style>@media(hover:none){.lh{display:block}}:focus-visible{outline:2px solid var(--acc);outline-offset:2px}</style>');
const _r=render;render=function(){_r();document.querySelectorAll('.chip[data-k],.ev[data-ev]').forEach(e=>{const b=e.querySelector('b');e.tabIndex=0;e.setAttribute('role','button');e.setAttribute('aria-label',(e.classList.contains('ev')?'Event: ':'Character: ')+(b?b.textContent:''))});document.querySelectorAll('button.x').forEach(b=>b.setAttribute('aria-label',b.dataset.a=='tg'?'Expand or collapse':b.dataset.a=='tld'?'Delete timeline':'Delete'))};
const refocus=id=>{const n=document.querySelector(`.ev[data-ev="${id}"]`);n&&n.focus()};
document.addEventListener('keydown',e=>{const t=e.target;if(!t.matches)return;
if(t.matches('.chip[data-k]')&&e.key=='Enter'){e.preventDefault();openDr(t.dataset.k,+t.dataset.i)}
else if(t.matches('.ev[data-ev]')){const o=S.ev.find(x=>x.id==t.dataset.ev);if(!o)return;
if(e.key=='Enter'){e.preventDefault();openEv(o.id)}
else if(e.key=='ArrowLeft'||e.key=='ArrowRight'){e.preventDefault();o.t=+(o.t+(e.key=='ArrowLeft'?-1:1)*STEP/10).toFixed(9);render();refocus(o.id)}
else if(e.key=='ArrowUp'||e.key=='ArrowDown'){e.preventDefault();const l=S.tls[S.tls.findIndex(l=>l.id==o.tl)+(e.key=='ArrowUp'?-1:1)];if(l){o.tl=l.id;render();refocus(o.id)}}
else if(e.key=='Delete'&&confirm('Delete this event?')){S.ev=S.ev.filter(x=>x!=o);S.lk=S.lk.filter(k=>k.a!=o.id&&k.b!=o.id);render()}}});
/* ---- v4 additions ---- */
var FH=null;async function syncOut(){if(!FH)return;try{const w=await FH.createWritable();await w.write(JSON.stringify(S,null,1));await w.close()}catch(e){warn('⚠ File sync failed. Click ☁ Sync to reconnect.');FH=null}}
function bookEv(){const b=S.bk||{};if(b.ord=='custom'){const c=b.cu||[];return[...S.ev].sort((x,y)=>{const i=c.indexOf(x.id),j=c.indexOf(y.id);return(i<0?1e9:i)-(j<0?1e9:j)||x.t-y.t})}const tl=b.ord=='tl';return[...S.ev].sort((x,y)=>(tl?S.tls.findIndex(l=>l.id==x.tl)-S.tls.findIndex(l=>l.id==y.tl):0)||x.t-y.t)}
const _vb2=vBook;vBook=()=>{const o=(S.bk||{}).ord;let h=_vb2();if(o=='custom')h=h.replace('value="time" selected','value="time"');
h=h.replace('</select>',`<option value="custom"${o=='custom'?' selected':''}>Order: custom</option></select>`).replace('<button data-a="ft">','<button data-a="dx">.docx</button><button data-a="ep">.epub</button><button data-a="ft">');
return h.replace('<div class="bkw">',`<details style="margin:0 0 10px"><summary>Chapter order</summary><div class="card">${bookEv().map((e,i)=>`<div class="row" style="margin:2px 0"><span style="flex:3">${i+1}. ${esc(e.title||'Untitled')}</span><button data-a="cu" data-d="-1" data-id="${e.id}" aria-label="Move up">▲</button><button data-a="cu" data-d="1" data-id="${e.id}" aria-label="Move down">▼</button></div>`).join('')}</div></details><div class="bkw">`)};
const crcT=(()=>{const T=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;T[n]=c>>>0}return T})(),crc=b=>{let c=-1;for(const x of b)c=crcT[(c^x)&255]^(c>>>8);return(c^-1)>>>0};
function zipParts(files){const E=new TextEncoder(),lf=[],cd=[],u2=n=>[n&255,n>>8&255],u4=n=>[n&255,n>>8&255,n>>16&255,n>>24&255];let off=0;
files.forEach(([name,data])=>{const nb=E.encode(name),d=data instanceof Uint8Array?data:E.encode(data),c=crc(d),h=[0x50,0x4b,3,4,...u2(20),...u2(0),...u2(0),...u2(0),...u2(33),...u4(c),...u4(d.length),...u4(d.length),...u2(nb.length),...u2(0)];
lf.push(new Uint8Array(h),nb,d);cd.push(new Uint8Array([0x50,0x4b,1,2,...u2(20),...u2(20),...u2(0),...u2(0),...u2(0),...u2(33),...u4(c),...u4(d.length),...u4(d.length),...u2(nb.length),...u2(0),...u2(0),...u2(0),...u2(0),...u4(0),...u4(off)]),nb);off+=h.length+nb.length+d.length});
return[...lf,...cd,new Uint8Array([0x50,0x4b,5,6,0,0,0,0,...u2(files.length),...u2(files.length),...u4(cd.reduce((a,x)=>a+x.length,0)),...u4(off),0,0])]}
const zip=f=>new Blob(zipParts(f));
const chap=()=>bookEv().map(e=>({t:e.title||'Untitled',p:typeof finParas=='function'?finParas(e):(e.prose||'').split(/\n+/).filter(x=>x.trim()).map(q=>{const m=dlg(q);return m?say(m[0],m[1]):q})}));
const X='<?xml version="1.0" encoding="UTF-8"?>',run=(s,o='')=>`<w:r><w:rPr>${o}</w:rPr><w:t xml:space="preserve">${esc(s)}</w:t></w:r>`,pg='<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
function docxFiles(){const B=chap().map(c=>pg+`<w:p><w:pPr><w:jc w:val="center"/></w:pPr>${run(c.t,'<w:b/><w:sz w:val="32"/>')}</w:p>`+c.p.map(q=>`<w:p><w:pPr><w:ind w:firstLine="360"/></w:pPr>${run(q)}</w:p>`).join('')).join('');
return[['[Content_Types].xml',X+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'],
['_rels/.rels',X+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="r1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'],
['word/document.xml',X+`<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="3000"/></w:pPr>${run(S.title||'Untitled story','<w:b/><w:sz w:val="56"/>')}</w:p>${B}</w:body></w:document>`]]}
function epubFiles(){const C=chap(),ti=esc(S.title||'Untitled story'),xh=(h,b)=>X+`<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>${h}</title></head><body>${b}</body></html>`;
return[['mimetype','application/epub+zip'],['META-INF/container.xml',X+'<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>'],
['OEBPS/content.opf',X+`<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="id"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="id">urn:uuid:${KEY}</dc:identifier><dc:title>${ti}</dc:title><dc:language>en</dc:language><meta property="dcterms:modified">${new Date().toISOString().slice(0,19)}Z</meta></metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>${C.map((c,i)=>`<item id="c${i}" href="c${i}.xhtml" media-type="application/xhtml+xml"/>`).join('')}</manifest><spine>${C.map((c,i)=>`<itemref idref="c${i}"/>`).join('')}</spine></package>`],
['OEBPS/nav.xhtml',xh(ti,`<nav epub:type="toc"><ol>${C.map((c,i)=>`<li><a href="c${i}.xhtml">${esc(c.t)}</a></li>`).join('')}</ol></nav>`)],
...C.map((c,i)=>[`OEBPS/c${i}.xhtml`,xh(esc(c.t),`<h1>${esc(c.t)}</h1>`+c.p.map(q=>`<p>${esc(q)}</p>`).join(''))])]}
const _o3=openEv;openEv=id=>{_o3(id);const e=S.ev.find(x=>x.id==id);if(!e)return;if(!e.gp&&e.place){const pm=S.places.find(p=>p.name.trim().toLowerCase()==String(e.place).trim().toLowerCase());if(pm)e.gp=pm.id}const op=(a,v)=>'<option value="">—</option>'+S[a].map(n=>`<option value="${n.id}" ${n.id==v?'selected':''}>${esc((path(a,n)?path(a,n)+' › ':'')+n.name)}</option>`).join('');
$('#dr').insertAdjacentHTML('beforeend',`<label>Tag / arc</label><input data-ev="tag" placeholder="e.g. Act 1, Romance" value="${esc(e.tag)}"><label>Scene grid cell</label><div style="display:flex;gap:4px"><select data-ev="gp">${op('places',e.gp)}</select><select data-ev="gt">${op('times',e.gt)}</select></div><button data-a="evg" style="margin-top:6px">Put characters in that grid cell</button><small id="evgmsg" style="display:block;color:var(--bad);margin-top:4px"></small><label>Comments</label>${(Array.isArray(e.cm)?e.cm:[]).map(c=>`<div class="card" style="margin-bottom:4px;padding:6px"><small style="color:var(--mut)">${esc(new Date(c.ts).toLocaleString())}</small>${esc(c.x)}<button class="x" data-a="cmd" data-id="${c.id}" aria-label="Delete comment">✕</button></div>`).join('')}<textarea id="cmt" rows="2" placeholder="Add a comment or note-to-self"></textarea><button data-a="cma">Add comment</button>`)};
const _vr=vRels;vRels=()=>{const y=S.ry,all=S.rels,any=y===undefined||y==='',on=r=>(r.from===undefined||r.from===''||+y>=+r.from)&&(r.to===undefined||r.to===''||+y<=+r.to);let h=_vr();
if(!any){let g;try{S.rels=all.filter(on);g=_vr()}finally{S.rels=all}h=h.replace(/<svg[\s\S]*?<\/svg>/,()=>(g.match(/<svg[\s\S]*?<\/svg>/)||[''])[0])}
h=h.replace(/<input data-t="rels" data-id="([^"]+)" data-f="note"[^>]*>/g,(m,id)=>{const r=all.find(x=>x.id==id)||{};return m+`<div class="row" style="margin:6px 0 0"><input type="number" data-t="rels" data-id="${id}" data-f="from" placeholder="From year" value="${esc(r.from)}"><input type="number" data-t="rels" data-id="${id}" data-f="to" placeholder="Until year" value="${esc(r.to)}"></div>`});
return h.replace('<div style="display:flex;gap:16px',`<div class="row"><label>Show relationships in year</label><input type="number" data-ry placeholder="all years" value="${esc(y)}" style="max-width:140px"></div><div style="display:flex;gap:16px`)};
document.addEventListener('input',e=>{if(e.target.dataset.ry!==undefined){S.ry=e.target.value;render();const n=$('[data-ry]');n&&n.focus()}});
const PT={};let pz=null;
document.addEventListener('pointerdown',e=>{const jm=e.target.closest('#jm');if(!jm)return;PT[e.pointerId]=[e.clientX,e.clientY];const k=Object.keys(PT);if(k.length==2){G=null;const a=PT[k[0]],b=PT[k[1]],mx=(a[0]+b[0])/2-jm.getBoundingClientRect().left;pz={d:Math.hypot(a[0]-b[0],a[1]-b[1])||1,sc:S.mv.sc,mx,t:S.mv.ox+(mx-150)/S.mv.sc}}});
window.addEventListener('pointermove',e=>{if(!PT[e.pointerId])return;PT[e.pointerId]=[e.clientX,e.clientY];const k=Object.keys(PT);if(pz&&k.length==2){const a=PT[k[0]],b=PT[k[1]],v=S.mv;v.sc=Math.min(5e8,Math.max(.002,pz.sc*Math.hypot(a[0]-b[0],a[1]-b[1])/pz.d));v.ox=pz.t-(pz.mx-150)/v.sc;paint()}});
const pu=e=>{delete PT[e.pointerId];if(Object.keys(PT).length<2)pz=null};window.addEventListener('pointerup',pu);window.addEventListener('pointercancel',pu);
document.addEventListener('click',e=>{const b=document.body;if(e.target.closest('[data-a=sbt]')){if(innerWidth<=800)b.classList.toggle('sbo');else{b.classList.toggle('sbc');try{localStorage.setItem('sf-sbc',b.classList.contains('sbc')?'1':'0')}catch(x){}}}else if(e.target.closest('#scrim,[data-tab],#sb [data-a]'))b.classList.remove('sbo')});
render();
