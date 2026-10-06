/* Sample-story enrichment: adds props, world rules, place profiles, wiki links, packs, inbox notes and statuses
   to the two built-in example stories so every tab has something to explore. Pure (no DOM) → unit-testable. */
(function(root,factory){if(typeof module=='object'&&module.exports)module.exports=factory();else root.SAMPLES=factory()})(typeof self!='undefined'?self:this,function(){
const VERSION=2;
const ev=(d,id)=>d.ev.find(e=>e.id==id),pl=(d,id)=>d.places.find(p=>p.id==id);
const note=(e,t)=>{if(e)e.notes=(e.notes?e.notes+'\n':'')+t};
const log=(ev,holder,place,state,n)=>({id:'l'+ev+(holder||'')+state,ev,holder,place,state,note:n||''});
function river(d){
 const P={palace:['Vijaya Palace','The seat of King Aditya. Sandstone halls, dry fountains, a courtyard where the royal tree once grew.','Where the quest begins and ends — the kingdom’s wellbeing is measured here.','Built by Aditya’s grandfather beside the Singing River, which has since run dry.','Throne hall; dry fountain; royal courtyard'],
  chasm:['The Great Chasm','A gorge too wide to jump, spanned by a vine bridge that has snapped.','First test of teamwork: strength alone fails, planning succeeds.','Said to have been split open by a falling star.','Broken vine bridge; peepal tree on the far rim'],
  jungle:['The Lost Jungle','Every path looks the same under the dense canopy.','Tests memory and trust in one another.','Travellers mark their way with carved stones, one of which is Ganesha’s Rock.','Carved waymarker stones; thorn thickets'],
  fog:['The Misty Mountains','A fog so thick you cannot see your own hand.','Teaches the group to listen rather than look.','Home of the guiding birds of the old tales.','Birdsong echoes; narrow ledges'],
  peak:['The Windy Peak','A bare summit where the wind pushes back.','The price of the quest is paid here — Anya gives up something of herself.','No one has crossed it in living memory.','Gale-force wind; no cover'],
  valley:['Hidden Valley','A green bowl where the Singing River still flows and the Sanjeevani herb glows.','The goal of the journey.','Guarded by an old promise: take only a sapling and seeds.','Singing river; glowing herb bed']};
 Object.entries(P).forEach(([id,[name,desc,imp,hist,feat]])=>{const p=pl(d,id);if(p)Object.assign(p,{name,desc,imp,hist,feat})});
 const o=(id,t)=>note(ev(d,id),t);
 o('e1','[[Vijaya Palace]] is dry. [[King Aditya]] fears for his people — see the world rule on drought.');
 o('e2','Guru Dev hands over the [[Royal Map]]. Each companion brings one strength (see Relationship arcs).');
 o('e3','[[Arjun]] fails with raw strength; [[Rohan]] swings across with the [[Rohan’s Rope]]. Try the Matrix tab to see who is where.');
 o('e5','The [[Royal Map]] is lost in the fog. Meera must trust her own memory.');
 o('e6','Guru Dev’s [[Guru Dev’s Staff]] snaps holding back the wind — a prop state change.');
 o('e7','Only a sapling and seeds may be taken from the valley. Try the Craft tab to lint this chapter.');
 const st={e1:'Final',e2:'Final',e3:'Revised',e4:'Revised',e5:'Draft',e6:'Draft',e7:'Draft',e8:'Idea',e9:'Idea'};d.ev.forEach(e=>{if(st[e.id])e.st=st[e.id]});
 d.props=[
  {id:'map',name:'Royal Map',kind:'document',desc:'An old route map drawn by Guru Dev’s teacher.',owner:'gurudev',log:[log('e2','gurudev',null,'intact','Handed to Meera'),log('e4','meera',null,'damaged','Torn by thorns'),log('e5','meera',null,'lost','Blown away in the fog')]},
  {id:'rope',name:'Rohan’s Rope',kind:'equipment',desc:'A long hemp rope Rohan carries on his belt.',owner:'rohan',log:[log('e3','rohan','chasm','intact','Tied across the chasm'),log('e6','arjun',null,'damaged','Frayed holding the group on the peak')]},
  {id:'staff',name:'Guru Dev’s Staff',kind:'artifact',desc:'A carved walking staff, older than the kingdom.',owner:'gurudev',log:[log('e6','gurudev','peak','broken','Snaps against the wind')]},
  {id:'sapling',name:'Sanjeevani Sapling',kind:'artifact',desc:'A single glowing sapling taken from Hidden Valley.',owner:null,log:[log('e7','anya','valley','intact','Taken with permission'),log('e8','anya','palace','consumed','Planted by the dry riverbed')]}];
 const ap={e2:['map'],e3:['rope'],e4:['map'],e5:['map'],e6:['rope','staff'],e7:['sapling'],e8:['sapling']};Object.entries(ap).forEach(([id,a])=>{const e=ev(d,id);if(e)e.props=a});
 d.worlds=[{id:'w-vijaya',name:'Vijaya & the Singing River',desc:'A drought-struck kingdom of old tales.',rules:[
  {id:'rw1',cat:'Nature',text:'People cannot fly or levitate.',ban:'flying, levitation',off:0},
  {id:'rw2',cat:'Magic',text:'The Sanjeevani herb grows only where the Singing River flows.',ban:'',off:0},
  {id:'rw3',cat:'Law & Order',text:'Only the royal family may send a quest.',ban:'',off:0},
  {id:'rw4',cat:'Nature',text:'Animals do not speak. (Switched OFF — try toggling it.)',ban:'talking animal',off:1}]}];d.wid='w-vijaya';
 d.packs=['fantasy','ya'];
 d.systems=[{id:'sy1',name:'Old Magic of the Herb',source:'The Singing River',cost:'Take only what is needed',limits:'Works only in Hidden Valley; needs a pure heart.',practitioners:['gurudev']}];
 d.factions=[{id:'fa1',name:'The Six Companions',kind:'faction',members:['anya','arjun','meera','rohan','gurudev','bheem'],notes:'Chosen by King Aditya.'}];
 d.lexicon=[{id:'lx1',term:'Sanjeevani',meaning:'A healing herb of legend',kind:'invented',firstAppearance:'e2'},{id:'lx2',term:'Vijaya',meaning:'“Victory” — name of the kingdom',kind:'invented',firstAppearance:'e1'}];
 d.proph=[{id:'pr1',text:'The river will sing again when the kingdom is led by one who gives before she takes.',introducedIn:'e1',fulfilledIn:'e8',subverted:false}];
 d.inbox=[{id:'ib1',text:'Idea: a sequel where Gaja the elephant finds a second valley.',ts:1,tags:[]},{id:'ib2',text:'Check: how many days does the journey take? Keep the timeline consistent.',ts:2,tags:[]}];
 d.grps=[{id:'g1',name:'The Six Companions',m:['anya','arjun','meera','rohan','gurudev','bheem']}];
 return d}
function sunstone(d){
 const P={attic:['Grandparents’ Attic','Dusty beams, trunks and a window that catches the evening sun.','Frames the story: the way out and the way home.','Hasn’t been opened in years.','Carved wooden box; round window'],
  pataliputra:['Pataliputra','A bustling ancient capital with royal processions and crowded markets.','The world the friends are thrown into.','Capital of a great empire, thousands of years ago.','Market square; processions'],
  channel:['The Old Water Channel','A narrow stone channel that runs under the market square.','A shortcut that rewards noticing details.','Built to bring river water into the city.','Carved stone; dry bed'],
  temple:['The Temple Door','A great sealed door carved with mountains, clouds, a river and a bee.','The group’s teamwork puzzle.','Opens only when the symbols are arranged in the order of the water cycle.','Seven carved symbols'],
  chamber:['The Temple’s Inner Chamber','A plain room holding only a worn bowl and a broom.','Where the real treasure is revealed.','Guarded by a goddess in disguise.','Bowl, broom, an old woman']};
 Object.entries(P).forEach(([id,[name,desc,imp,hist,feat]])=>{const p=pl(d,id);if(p)Object.assign(p,{name,desc,imp,hist,feat})});
 [['channel','pataliputra'],['temple','pataliputra'],['chamber','temple']].forEach(([c,p])=>{const x=pl(d,c);if(x)x.parent=p});
 const o=(id,t)=>note(ev(d,id),t);
 o('e1','[[The Sunstone]] glows only for the curious. Open the Props tab to see its custody log.');
 o('e2','The [[The Guardian]] appears in disguise. Use Characters → Secret to track what the reader knows.');
 o('e4','[[Priya]] solves the puzzle with the [[Symbol Tiles]]. Try the Corkboard to reorder chapters.');
 o('e5','The true treasure is a [[Water Bowl & Broom]] — kindness over gold.');
 const st={e1:'Final',e2:'Revised',e3:'Revised',e4:'Draft',e5:'Draft',e6:'Idea'};d.ev.forEach(e=>{if(st[e.id])e.st=st[e.id]});
 d.props=[
  {id:'stone',name:'The Sunstone',kind:'artifact',desc:'A small stone that glows gold.',owner:'rohan2',log:[log('e1','rohan2','attic','intact','Found in the carved box'),log('e5','guardian','chamber','hidden','Returned to the Guardian'),log('e6','rohan2','attic','damaged','Dull and cold')]},
  {id:'box',name:'Carved Wooden Box',kind:'equipment',desc:'A box with a lid carved with suns.',owner:null,log:[log('e1',null,'attic','intact','Opened by Rohan')]},
  {id:'tiles',name:'Symbol Tiles',kind:'equipment',desc:'Seven carved tiles: mountain, cloud, raindrop, river, flower, bee, sun.',owner:'priya',log:[log('e4','priya','temple','intact','Arranged to open the door')]},
  {id:'bowl',name:'Water Bowl & Broom',kind:'artifact',desc:'A worn bowl and a broom — the true treasure.',owner:null,log:[log('e5','anjali','chamber','intact','Used by Anjali to help the old woman')]}];
 const ap={e1:['stone','box'],e4:['tiles'],e5:['bowl','stone'],e6:['stone']};Object.entries(ap).forEach(([id,a])=>{const e=ev(d,id);if(e)e.props=a});
 d.worlds=[{id:'w-pata',name:'Ancient Pataliputra',desc:'A real ancient capital, retold as a fairy tale.',rules:[
  {id:'rs1',cat:'Technology',text:'No modern technology in Pataliputra.',ban:'phone, electricity, plastic',off:0},
  {id:'rs2',cat:'Magic',text:'The Sunstone glows only for those with a kind heart.',ban:'',off:0},
  {id:'rs3',cat:'Chemistry',text:'Gold reacts with water and explodes.',ban:'',off:0}]}];d.wid='w-pata';
 d.packs=['ya','literary'];
 d.motifs=[{id:'mo1',name:'Water',keywords:'water, river, bowl, rain',appearances:['e3','e4','e5']},{id:'mo2',name:'Gold vs kindness',keywords:'gold, treasure, kind',appearances:['e1','e5']}];
 d.inbox=[{id:'ib1',text:'Idea: a second quest where the friends must return the Sunstone.',ts:1,tags:[]}];
 d.grps=[{id:'g1',name:'The Six Friends',m:['rohan2','priya','arjun2','meera2','sam','anjali']}];
 return d}
function enrich(id,d){if(!d||typeof d!='object')return d;if(id=='sf-river')river(d);else if(id=='sf-sunstone')sunstone(d);else return d;d.sv=VERSION;return d}
return{VERSION,enrich}});
