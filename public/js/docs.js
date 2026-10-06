/* ---- Docs / Help page: detailed, searchable, with diagrams. One file; replaces the old docs.js, docs2.js and the cards appended by v5/v7/v13. ---- */
TABS.push(['docs','📘 Docs']);
(function(){
const SEC=[],sec=(id,group,title,lead,html)=>SEC.push({id,group,title,lead,html});
const kbd=k=>`<kbd>${k}</kbd>`;
let Q='';
/* ---------- tiny SVG toolkit (theme-aware via CSS classes) ---------- */
const FG=(w,h,b,cap)=>`<figure class="hpf"><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${cap}">${b}</svg><figcaption>${cap}</figcaption></figure>`;
const tx=(x,y,t,c='hs',a='middle')=>`<text class="${c}" x="${x}" y="${y}" text-anchor="${a}">${t}</text>`;
const bx=(x,y,w,h,t,c='')=>{const L=String(t).split('|');return `<rect class="hb ${c}" x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/>`+L.map((l,i)=>tx(x+w/2,y+h/2+(i-(L.length-1)/2)*14+4,l,i?'hs':'ht')).join('')};
const ar=(x1,y1,x2,y2,d)=>`<line class="ha${d?' dash':''}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="url(#hpar)"/>`;
const callout=(k,t)=>`<div class="hpc ${k}"><b>${{tip:'💡 Tip',warn:'⚠ Careful',note:'ℹ Note'}[k]}</b> ${t}</div>`;
const tbl=(h,rows)=>`<table class="docT"><tr>${h.map(x=>`<th>${x}</th>`).join('')}</tr>${rows.map(r=>`<tr>${r.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')}</table>`;

/* ---------- diagrams ---------- */
const G={
flow:FG(720,120,bx(10,30,140,56,'1 · Plan|events, cast, places','acc')+ar(150,58,190,58)+bx(190,30,140,56,'2 · Write|manuscript text in events')+ar(330,58,370,58)+bx(370,30,140,56,'3 · Check|rules, problems, lint','warn')+ar(510,58,550,58)+bx(550,30,160,56,'4 · Publish|DOCX · EPUB · PDF …','ok')+`<path class="ha dash" d="M630 88 C630 118 90 118 80 90" marker-end="url(#hpar)"/>`+tx(360,112,'revise — the plan is always the single source of truth'),'The Kathakaar loop: the plan feeds the writing, the checks feed back into the plan.'),
layout:FG(720,250,bx(10,10,150,230,'','mu')+tx(85,34,'SIDEBAR','ht')+tx(85,58,'Plan · Write · People')+tx(85,74,'World · Tools · Help')+tx(85,104,'Library: Kathākośa,')+tx(85,120,'Story Markdown')+tx(85,150,'Data: Export · Import')+tx(85,166,'Sync · Backup · Reset')+tx(85,210,'Account · Sign out')+bx(175,10,535,36,'TOP BAR  ·  title · search · ↶ ↷ · theme · word log · inbox · ✓ Saved','acc')+bx(175,58,350,182,'MAIN AREA|the tab you picked (Journey map, Book, Matrix …)')+bx(540,58,170,182,'DRAWER|opens on the right when you|click an event, a chapter|or Kathākośa','warn'),'Screen anatomy. The sidebar collapses to icons with « .'),
model:FG(720,300,bx(290,120,140,60,'EVENT|a scene / chapter','acc')+bx(20,20,150,48,'Timeline (lane)|when in the story')+bx(285,10,150,48,'Characters|who is in it')+bx(550,20,150,48,'Place (nestable)|where it happens')+bx(20,232,150,48,'Props|objects it uses')+bx(285,242,150,48,'Manuscript text|becomes the chapter')+bx(550,232,150,48,'World & rules|constraints to obey','warn')+ar(170,60,290,125)+ar(360,58,360,120)+ar(550,60,430,125)+ar(170,238,290,175)+ar(360,242,360,180)+ar(550,238,430,175),'Everything in a story hangs off events. Change an event and every view and export follows.'),
journey:FG(720,200,tx(8,24,'Present','hl','start')+`<line class="hl2" x1="70" y1="38" x2="710" y2="38"/>`+bx(90,50,120,40,'Ev 1|Arrival')+bx(260,50,120,40,'Ev 2|The letter')+bx(470,50,120,40,'Ev 3|Fog','acc')+tx(8,134,'Past','hl','start')+`<line class="hl2" x1="70" y1="148" x2="710" y2="148"/>`+bx(150,150,120,40,'Ev 4|Flashback','mu')+ar(210,70,260,70)+ar(380,70,470,70)+ar(270,150,320,92,1)+tx(335,128,'dashed = crosses lanes','hs','start')+tx(640,70,'drag ↔ time','hs')+tx(640,100,'double-click a lane','hs')+tx(640,114,'to add an event','hs'),'Journey map: one lane per timeline; solid arrows stay in a lane, dashed ones cross lanes or go back in time.'),
status:FG(720,90,bx(10,20,150,46,'Idea','mu')+ar(160,43,205,43)+bx(205,20,150,46,'Draft')+ar(355,43,400,43)+bx(400,20,150,46,'Revised','warn')+ar(550,43,595,43)+bx(595,20,115,46,'Final','ok'),'Chapter status. Corkboard cards and Kanban columns follow it.'),
rules:FG(720,150,bx(10,40,150,60,'Rule|“No flight in the|temple”','acc')+ar(160,70,200,70)+bx(200,40,140,60,'Concept|flying, levitation,|hovering')+ar(340,70,380,70)+bx(380,40,150,60,'Meaning match|every sentence|scored 0–100%','warn')+ar(530,70,570,70)+bx(570,40,140,60,'Flagged|sentence + score')+ar(640,100,640,128)+tx(640,142,'You decide: edit · Allow exception','hs')+tx(280,24,'derived automatically — or type exact words yourself','hs'),'How a rule becomes a warning.'),
arc:FG(720,190,`<line class="hl2" x1="50" y1="95" x2="700" y2="95"/>`+tx(40,38,'+5','hs','end')+tx(40,98,'0','hs','end')+tx(40,158,'−5','hs','end')+`<polyline class="intended" points="60,150 220,110 380,70 540,40 690,30"/><polyline class="actual" points="60,148 220,118 380,90 540,125 690,60"/><circle class="dot" cx="540" cy="125" r="5"/>`+tx(540,148,'drift: story falls','hs')+tx(540,162,'below the intended arc','hs')+tx(110,22,'— actual (beats)','ht','start')+tx(260,22,'- - intended arc','hs','start'),'Relationship arc: closeness from −5 (hostile) to +5 (close), against the arc you intended.'),
sync:FG(720,170,bx(10,50,110,56,'You type','acc')+ar(120,78,160,78)+bx(160,50,170,56,'This device|localStorage + IndexedDB')+ar(330,78,370,78)+bx(370,50,120,56,'Write queue|retries 5 s → 60 s')+ar(490,78,530,78)+bx(530,50,180,56,'Server (optional)|merged copy, other devices','ok')+tx(430,134,'offline? nothing is lost — the queue waits and sends later','hs')+tx(430,26,'instant save','hs')+`<line class="ha dash" x1="245" y1="34" x2="245" y2="48"/>`,'Saving is local first; the server is a mirror that catches up.'),
share:FG(720,130,bx(10,34,130,56,'Owner|full control','acc')+ar(140,62,200,62)+bx(200,34,150,56,'Server|checks permission|on every request','warn')+ar(350,50,420,28)+ar(350,74,420,98)+bx(420,6,170,44,'Reader|view + copy to own library')+bx(420,78,170,44,'Editor|view + edit the story','ok')+tx(650,62,'Role “none”','hs')+tx(650,76,'revokes at once','hs'),'Sharing roles.'),
newflow:FG(720,230,bx(10,90,130,50,'＋ New story','acc')+ar(140,115,180,115)+bx(180,80,150,70,'Changed since|you opened it?','warn')+ar(330,100,380,45)+tx(355,62,'no','hs')+bx(380,15,150,50,'Blank story opens','ok')+ar(330,130,380,175)+tx(355,160,'yes','hs')+bx(380,150,160,70,'Is the story|new (never saved)?','warn')+ar(540,165,580,120)+bx(580,60,130,60,'Save · Discard|· Cancel')+ar(540,200,580,200)+bx(580,175,130,50,'Continue on old|Save as new copy|Discard · Cancel'.replace('|Save','|Save'),'acc'),'New story: Kathakaar asks only when there is something to lose.'),
modes:FG(720,130,bx(10,20,220,90,'Just me|npm start|binds to 127.0.0.1','mu')+bx(250,20,220,90,'Private server|KATHAKAAR_MULTIUSER=1|KATHAKAAR_SIGNUP=0','acc')+bx(490,20,220,90,'Public site|docker-compose.prod.yml|HTTPS, quotas, open sign-up','ok'),'Choose how to run it.')
};

/* ---------- content ---------- */
sec('start','Getting started','What Kathakaar is and the 5-minute start','Plan first, write inside the plan, let the app catch contradictions.',
`<p>Kathakaar (कथाकार, “storyteller”) is a <b>story planner and writing studio</b>. Instead of keeping notes, outline and manuscript in separate files, you describe <i>what happens, where, when and to whom</i> as <b>events</b>. Each event carries its own manuscript text, so the plan <i>is</i> the book. Because the app knows your cast, places, props and rules, it can warn you when the story contradicts itself.</p>${G.flow}
<h5>Start in five minutes</h5><ol>
<li>Open <b>Kathākośa</b> (sidebar → Library) and pick <i>The Secret of the Sunstone</i> or <i>The Secret of the Singing River</i>. Both are fully filled in; <b>Restore original</b> resets them.</li>
<li>Press <b>+ New story</b> and type a title in the top bar.</li>
<li><b>People → Characters</b>: add your cast. <b>World → Places</b>: add locations.</li>
<li><b>Plan → Journey map</b>: double-click a lane to create an event. Set title, place, characters, notes and <b>Manuscript text</b>.</li>
<li><b>Write → Book / Script</b>: your events appear as chapters. Export when ready.</li>
<li><b>World → Worlds &amp; Rules</b>: add a rule and press <b>Run semantic check</b>.</li></ol>
${callout('tip','Press '+kbd('Ctrl/⌘+K')+' anywhere for the command palette — the fastest way to jump to a tab, chapter, character or place.')}`);

sec('screen','Getting started','The screen: sidebar, top bar, main area, drawer','Know where everything lives.',
`${G.layout}<ul><li><b>Sidebar groups</b> — <b>Plan</b> (Journey map, Corkboard, Matrix, Life timeline, Calendar) · <b>Write</b> (Book/Script, Craft, Packs, Tension, Story weave) · <b>People</b> (Characters, Relationships, Relationship arcs, Shared info) · <b>World</b> (Worlds &amp; Rules, Places, World map, Encyclopedia, Props, Mood board) · <b>Tools</b> (AI Engine, Data &amp; storage) · <b>Help</b> (Docs).</li>
<li><b>Top bar</b> — story title, search, undo/redo, theme, the word log, the Inbox and the <b>save chip</b>: <i>✓ Saved</i>, <i>⚠ Server unreachable — saved locally, retrying</i> (press <b>↻ Reconnect</b>) or <i>🔒 needs an access token / sign-in</i>. Nothing is lost in any of these states.</li>
<li><b>Drawer</b> — the panel that slides in for an event, chapter, Kathākośa or Story Markdown. Genre packs add extra sections to it.</li>
<li><b>Inbox</b> (${kbd('Ctrl+Shift+I')}) — capture a stray idea in seconds and promote it to an event later. <b>Problems</b> (${kbd('Ctrl+Shift+M')}) — every check from every feature in one list; click a row to jump to the cause.</li></ul>`);

sec('model','Getting started','Core concepts: how a story is built','Learn these eight words and every tab makes sense.',
`${G.model}${tbl(['Concept','What it is','Where you edit it'],[
['<b>Timeline</b>','A lane of events, e.g. <i>Past</i> and <i>Present</i>.','Journey map'],
['<b>Event</b>','One scene or chapter: title, time, place, characters, mood, notes, manuscript text.','Journey map → drawer'],
['<b>Character</b>','A person with role, traits, goal, flaw, secret. “Nature &amp; traits” is read by the rules checker.','People → Characters'],
['<b>Place</b>','A location; places nest (room → building → city).','World → Places'],
['<b>Prop</b>','A tracked object with a custody log.','World → Props'],
['<b>World / Rule</b>','A set of constraints your story must obey.','World → Worlds &amp; Rules'],
['<b>Pack</b>','A genre toolkit switched on per story.','Write → Packs'],
['<b>Matrix cell</b>','A place × time slot holding each character’s state.','Plan → Matrix']])}`);

sec('journey','Plan','Journey map','The main canvas: events on timelines.',
`${G.journey}${tbl(['You do','What happens'],[
['Double-click a lane','Creates an event at that time.'],
['Drag a box','Changes its time or moves it to another lane.'],
['Drag from a box’s handle onto another box','Draws an arrow (cause, flashback link…). Click the arrow label to edit or delete it.'],
['Click a character chip','Filters the map to events involving that person.'],
['Fit all · zoom · scroll','Navigate long stories.'],
['Click an event','Opens the drawer: title, place, “also at”, mood, health, notes, manuscript text, world used, props.']])}
<p><b>Also at</b> lets one scene happen in several places. <b>Render to book</b> jumps to the Book tab. Undo/redo (${kbd('Ctrl/⌘+Z')} / ${kbd('Y')}) covers every plan change.</p>`);

sec('views','Plan','Corkboard, Matrix, Life timeline, Calendar','Four other ways to look at the same events.',
`<h5>Corkboard &amp; Kanban</h5><p>Cards in book order showing word count against target, status and characters.</p>${G.status}
<p>Drag a card, or focus it and press ${kbd('Space')}, move with arrows, ${kbd('Space')} to drop, ${kbd('Esc')} to cancel. Select several cards to change status in bulk, <b>split</b> or <b>merge</b>. Kanban shows one column per status.</p>
<h5>Matrix</h5><p>A grid of <b>places × times</b>. Each cell lists the characters there with mood, clothing, health, powers and a note. <b>+ Place</b> / <b>+ Time</b> add rows and columns that can nest (▸/▾). A <b>⚠ continuity warning</b> appears when a character is in two places at the same time — click a cell to add a scene note.</p>
<h5>Life timeline</h5><p>One lane per character. Set a birth year to see ages; select several characters to compare overlapping lives. The coloured bar shows health: green healthy · amber other · red hurt.</p>
<h5>Calendar</h5><p>Define your own months, weekdays, hours per day, era and holidays, plus an optional moon cycle. Every date in the app follows it, and the checker warns when a scene says “full moon” on the wrong night or two full moons fall too close together.</p>`);

sec('write','Write','Book / Script, Edit final, History','Turn events into a manuscript and keep every version safe.',
`<p>Each event becomes a <b>chapter</b> (novel) or <b>scene</b> (screenplay) from its manuscript text; order by time or timeline by timeline. In screenplay mode the plan syntax is: ${tbl(['Write this','Becomes'],[['<code># INT. HALL - NIGHT</code>','Scene heading'],['<code>KAEL: We should go.</code>','Dialogue'],['<code>Name (softly): line</code>','Dialogue with a parenthetical'],['<code>&gt; CUT TO:</code>','Transition']])}</p>
<h5>Edit final</h5><p>Edit the rendered text directly. Edits are stored <i>separately</i> from the plan and feed the preview, print and every export. You get find &amp; replace across the manuscript, <b>Revert</b> (back to generated text), <b>Use as manuscript text</b> (push your edit into the plan) and a warning if you change the plan afterwards. <b>Focus mode 🖋</b> is a distraction-free full-screen editor with a session word count: ‹ › change chapter, A−/A+ resize, 📌 shows goals, flaws and place, ${kbd('Esc')} finishes.</p>
<h5>History</h5><p>${kbd('Ctrl/⌘+S')} saves a named snapshot; automatic ones are taken about every 10 minutes and before risky actions (max 40 kept). Compare any snapshot with now paragraph by paragraph and restore one chapter or everything — restoring snapshots your current text first, so it can always be undone.</p>`);

sec('export','Write','Export, import and publishing','Get your story out in the format a reader, editor or printer needs.',
`${tbl(['Format','Use it for','Notes'],[
['<b>.docx</b>','Editors, agents, Word users','Chapters, headings and book details.'],
['<b>.epub</b>','Ebook stores and readers','Validated before download: structural errors block the file, accessibility warnings are listed.'],
['<b>PDF / Print</b>','Paperback and review copies','Craft → Print: trim size, bleed, mirrored margins and a preflight for print-on-demand. Chromium does not insert blank pages for recto chapter starts.'],
['<b>.fountain / .fdx</b>','Screenplays','Fountain text or Final Draft.'],
['<b>Scrivener-ready ZIP, .txt, copy</b>','Moving to other tools','Import accepts .fdx, Fountain, .docx, .rtf, Markdown and Scrivener ZIP as a new story.'],
['<b>Serial HTML</b>','Royal Road, Wattpad, AO3, Substack, Ream','Craft → Serial: platform-safe HTML, author notes, release schedule as a calendar file.']])}
<p><b>Book details</b> sets author, language, series, ISBN and cover. <b>Cover</b> designs an ebook cover and a full-wrap paperback cover with spine width from the page count. Platform numbers in <code>data/platforms.json</code> are unverified — check your printer’s specs.</p>`);

sec('craft','Write','Craft, Packs, Tension and Weave','Polish, genre tools and pacing.',
`<ul><li><b>Style lint</b> — suggestions only (passive voice, filter words, adverbs, “tell” words); it never edits your text. Ignore one instance or switch a rule off for the story.</li>
<li><b>Readability</b> by age band · <b>Beat sheets</b> (Save the Cat, Hero’s Journey…) · <b>Compare</b> versions · <b>Tools</b> (name generator with clash warnings, outlier finder) · reading &amp; audio options (SSML using your lexicon).</li>
<li><b>Genre packs</b> — Mystery, Romance, Fantasy/Sci-Fi, Historical, Horror, Comedy, Literary, Screenwriting, YA/MG, Research &amp; family. A pack adds ledgers (clues, magic systems, motifs…), drawer sections and checks shown in <b>Problems</b>. Turning a pack off only hides it; data is kept.</li>
<li><b>Tension &amp; emotion</b> — a curve built from event moods against a classic structure, with pacing notes (flat middle, early peak, calm final third).</li>
<li><b>Story weave</b> — a braid of which characters, timelines, places or tags appear in which chapters; spots dropped and dormant threads.</li></ul>`);

sec('people','People','Characters, Relationships, Arcs, Shared info','Keep the cast, their bonds and their secrets straight.',
`<ul><li><b>Characters</b> — name, role, colour, <b>Nature &amp; traits</b> (read by the rules checker, e.g. “made of gold”), goal, flaw, secret.</li>
<li><b>Relationships</b> — typed links (Friend, Ally, Mentor, Rival, Romance…) with notes and optional years.</li>
<li><b>Shared info</b> — who knows what, where and when, attached to a place × time cell.</li></ul>
<h5>Relationship arcs</h5>${G.arc}<p>Add <b>beats</b> anchored to events or years; each can change the relationship type. <b>⚡ Seed</b> creates beats from events two characters share. Give a relationship an <b>intended arc</b> — draw it or choose from 25+ genre templates (e.g. <i>Enemies → Lovers</i>) — and the chart lists every place the story drifts from it. Save character sets as <b>groups</b>; several pairs show a group-average line.</p>`);

sec('world','World','Places, Props, Encyclopedia, World map, Mood board','Build the setting and track everything in it.',
`<ul><li><b>Places</b> — description, importance, history, features. Nest with <b>Inside</b> / <b>+ Sub-place</b> (the temple chamber sits inside the temple, inside Pataliputra); <b>Events here</b> lists what happened there. Events link by place <i>name</i>; renaming a place renames it in events.</li>
<li><b>Props</b> — from a chapter onward, the <b>custody log</b> records holder, place and state (intact, damaged, broken, lost, stolen, hidden, destroyed, consumed); the latest entry at or before a chapter wins. Problems: used after being destroyed, appears without its holder, holder and scene in different places, conflicting entries, a weapon introduced but never used.</li>
<li><b>Encyclopedia</b> — automatic entries for characters, places, props and chapters. Link with <code>[[Name]]</code>, <code>[[Name|shown text]]</code> or <code>[[character:Name]]</code> (case-insensitive). Broken links and orphan entries are reported; exports show plain names.</li>
<li><b>World map</b> — upload a map, drop pins, link them to places, calibrate with two points of known distance. <b>Travel-time warnings</b> compare the time between two scenes with the distance between their pins.</li>
<li><b>Mood board</b> — reference images, resized and stripped of metadata; <b>alt text is required</b>.</li></ul>`);

sec('rules','World','Worlds &amp; Rules: how consistency is checked','Matching is by meaning, not exact words.',
`${G.rules}${tbl(['Field','Syntax','Example and effect'],[
['Forbidden concepts','comma list; <code>*</code> wildcard','<code>flying, levitation, fly*</code> — a close sentence is flagged. Rules written “No flight…” derive this automatically.'],
['Triggers','<code>+</code> = all groups in the same scene; <code>|</code> = alternatives','<code>gold + water|river</code> — flags a scene where gold (character traits count) meets water or river, so you verify the outcome.'],
['Rule text only','free text','Used to derive the above; vague rules cannot be checked.']])}
<p><b>Reading results:</b> the % is similarity to the forbidden concept. <b>Allow exception</b> waives a rule for one event (<b>Re-enforce</b> undoes it). Sensitivity <b>Strict</b> finds more but with more false alarms; <b>Loose</b> finds fewer. Negation (“never flew”) is reported as <i>check context</i>. Results clear when text or rules change.</p>
<p><b>Worked example:</b> rule “Gold reacts with water and explodes”; Sona (Nature: made of gold) has an event “Sona crosses the river” → flagged. Embeddings measure closeness, not logic, so expect some false alarms and use exceptions.</p>`);

sec('data','Tools & data','Saving, sync, backups and the AI Engine','Your work is local first and never blocked by the network.',
`${G.sync}<ul><li><b>Where is my story?</b> In the browser (localStorage plus an IndexedDB mirror) and, when a server is running, on the server. If the ~5 MB browser limit fills, values spill to IndexedDB and a warning appears.</li>
<li><b>Two devices:</b> changes merge automatically using a three-way merge. If both edited the same field you choose <i>Merge</i>, <i>Keep this device</i> or <i>Use server</i>; both versions are kept in Backup history. Live updates arrive in about a second.</li>
<li><b>Back up:</b> <b>Export</b> (one story, JSON), Data → <b>Export all</b> (whole library with snapshots), <b>Backup</b> (last 8 automatic copies). <b>Import all</b> never overwrites an existing story.</li>
<li><b>Data &amp; storage tab:</b> sizes per story, snapshots and images, sync status, recent client errors, <i>Prune snapshots (keep 20)</i>, <i>Ask browser to keep my data</i> and <i>Copy diagnostic report</i> (no manuscript text).</li>
<li><b>AI Engine:</b> shows which engine is active — built-in, <b>MiniLM</b> (run <code>npm run setup-model</code> once), BGE, Ollama or an OpenAI-compatible API — and an optional <b>verifier</b> (Claude or OpenAI) that re-reads flagged passages to drop false alarms. Only flagged passages go to a remote verifier. The Test bench scores a rule against any text.</li></ul>`);

sec('accounts','Accounts & hosting','Accounts, sharing and running a server','For families, teams and public sites.',
`${G.modes}<ul><li><b>Sign-in:</b> username (3–32 letters, digits, <code>_</code>, <code>-</code>) and a password of 8+ characters. <b>Account</b> (change password — other sessions are signed out; delete account) and <b>Sign out</b> sit at the bottom of the sidebar. There is no email reset: an administrator resets it.</li>
<li><b>One account per browser copy:</b> signing in as someone else wipes the local copy first (it stays on the server), so stories never leak between accounts.</li></ul>${G.share}
<p>Open <b>Kathākośa → Share</b>, type a username and pick <b>reader</b> or <b>editor</b>. Recipients find it under <b>Shared with me</b> and can copy it into their own library.</p>
${tbl(['Administrator command','Purpose'],[['<code>node server/tools/admin.js create-admin &lt;user&gt;</code>','First admin (or promote an account)'],['<code>set-password &lt;user&gt;</code>','Reset a forgotten password; revokes sessions'],['<code>create-user · promote · demote · sign-out · list</code>','Manage members'],['<code>delete-user &lt;user&gt; --purge</code>','Remove an account and its stories']])}
${callout('note','Public sites use <code>docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build</code>. Quotas default to 50 MB per account. Full details: <code>docs/MULTI_USER.md</code>, <code>DEPLOYMENT.md</code>, <code>CONFIGURATION.md</code> and <code>SECURITY.md</code>.')}`);


sec('library','Getting started','Kathākośa and the New story button','Create, open, copy, delete and protect stories.',
`${G.newflow}<h5>Starting a new story</h5><p>Press <b>＋ New story</b> in the sidebar (or <b>+ New story</b> inside Kathākośa). Your current story is already auto-saved, so the question is only what to do with <i>changes you made since opening it</i>:</p>
${tbl(['Situation','What you are asked','Choices'],[
['Nothing changed','Nothing — a blank story opens at once.','—'],
['You are on a new story you never saved, and typed something','“This is a new story you haven’t saved yet.”','<b>Save</b> (keeps it in Kathākośa) · <b>Discard</b> (deletes it) · Cancel'],
['You are on an existing story and changed it','“You changed this story since you opened it.”','<b>Continue on the old story</b> (changes stay in it) · <b>Save as a new story</b> (changes go to a “(copy)”, the original returns to how it was) · <b>Discard the changes</b> · Cancel'],
['You are on a new, still-empty story','A notice: you are already on an empty story.','Nothing is created, so you never collect blank stories']])}
<p>A new story starts with one place, one time slot, one character and one timeline so every tab has something to show. Rename the title in the top bar.</p>
<h5>The Kathākośa drawer</h5>${tbl(['Button','What it does'],[['Open','Switches to that story (the current one is saved first).'],['Duplicate','Makes an independent copy named “… (copy)”.'],['Delete','Removes a story, its snapshots and its backups after a confirmation. Cannot be undone — export first.'],['Restore original','Only on the two built-in examples; resets them to the shipped content.'],['Import JSON','Adds a story from a file as a <i>new</i> story; nothing is overwritten.'],['Share','Gives another user reader or editor access (accounts mode).']])}
${callout('tip','Unsure whether to discard? Choose <b>Save as a new story</b> — you lose nothing and can delete the copy later.')}`);

sec('fields','People','Field reference: characters, places and events','What every box in the editors means.',
`${tbl(['Record','Field','Meaning and effect'],[
['Character','Name','Used for dialogue lines (<code>Name: text</code>), chips on the map, encyclopedia links and the rules checker. Renaming updates everywhere.'],
['Character','Role','Free text such as Protagonist or Mentor; shown on cards and in Shared info.'],
['Character','Colour','Tints chips, Matrix cells, Life timeline bars and the Story weave.'],
['Character','Nature &amp; traits','Read by Worlds &amp; Rules. “Made of gold” plus a rule about gold and water produces a warning.'],
['Character','Goal · Flaw · Secret','Shown in Focus mode (📌) and used by arc templates; never exported.'],
['Place','Name','Events link to a place by <i>name</i>; renaming updates the events.'],
['Place','Inside','Parent place. Events at a child also appear under the parent.'],
['Place','Importance · History · Features','Notes for you and entries in the Encyclopedia.'],
['Event','Title · Time · Timeline','Title becomes the chapter title; time and timeline decide order and the lane.'],
['Event','Place · Also at','Main location and extra locations for scenes in several places.'],
['Event','Characters','Who is present; drives the Matrix, Life timeline and character filters.'],
['Event','Mood · Health','Mood feeds the Tension curve; health colours the Life timeline.'],
['Event','Manuscript text','The chapter text. Plan syntax (<code>#</code>, <code>&gt;</code>, <code>Name:</code>) works here.'],
['Event','World used · Props','Which world’s rules apply to the event and which objects appear in it.']])}`);

sec('workflow','Getting started','Worked example: from idea to published book','Follow one story all the way through.',
`<ol><li><b>Capture</b> — jot ideas in the Inbox (${kbd('Ctrl+Shift+I')}). Promote the good ones to events.</li>
<li><b>Cast and setting</b> — add characters (goal, flaw, secret) and nested places; set a world with rules if the setting has magic or technology limits.</li>
<li><b>Outline</b> — create events on the Journey map, order them, link causes with arrows, pick a beat sheet and compare against it.</li>
<li><b>Draft</b> — write each event’s Manuscript text; use Focus mode and watch the word log.</li>
<li><b>Check</b> — open Problems; fix prop, rule, calendar and timeline warnings; run Style lint and Readability.</li>
<li><b>Revise</b> — use Edit final for line edits; save History snapshots before large changes.</li>
<li><b>Publish</b> — fill Book details and Cover, export EPUB or DOCX, print a PDF, or serialise to a web platform.</li>
<li><b>Back up</b> — Data → Export all, and keep a copy off this device.</li></ol>`);

sec('keys','Reference','Keyboard shortcuts','',
tbl(['Keys','Action'],[[kbd('Ctrl/⌘+K'),'Command palette &amp; search — prefix <code>@</code> characters, <code>#</code> chapters, <code>/</code> places'],[kbd('Ctrl/⌘+Z')+' · '+kbd('Ctrl/⌘+Y'),'Undo / redo'],[kbd('Ctrl/⌘+S'),'Save a history snapshot'],[kbd('Ctrl+Shift+I'),'Inbox'],[kbd('Ctrl+Shift+M'),'Problems panel'],[kbd('Space')+' · arrows · '+kbd('Esc'),'Grab, move, cancel on Corkboard and map pins']]));

sec('trouble','Reference','Troubleshooting, FAQ and glossary','',
`${tbl(['Symptom','Fix'],[
['“Access token needed”','The server uses <code>KATHAKAAR_TOKEN</code>. Enter it once, or open <code>http://host:3000/#token=…</code>. Cancel to work locally.'],
['Chip says saved locally','Server unreachable. Keep writing; it retries and syncs. Press ↻ Reconnect.'],
['“Not saved to server”','Invalid data or over quota (default 50 MB). Export, then prune snapshots and images in Data &amp; storage.'],
['Broke an example story','Kathākośa → Restore original.'],
['Lost something','Undo, History snapshots, or Data → Backup.'],
['No semantic matches / too many','Use Strict or Loose, add trigger alternatives, add exceptions, or enable MiniLM and a verifier.'],
['I pressed New story and my text vanished','Open Kathākośa: the story is there. If you chose Discard, use Undo-history (Data → Backup) or Export backups; discarded edits are not recoverable.'],
['Two blank stories keep appearing','Press New story only once; a second press on an empty story just shows a notice.'],
['Example story looks edited','Kathākośa → Restore original (your edits are lost; a backup is kept in Backup history).'],
['Word counts differ between tabs','Corkboard counts the plan text; Edit final counts your edited text. Use <b>Use as manuscript text</b> to align them.'],
['Rule never fires','Add a trigger or forbidden concept; vague rule text cannot be checked. Check the story has manuscript text.'],
['Map pins vanish after upload','The image was replaced; re-drop pins or restore a snapshot.'],
['Sign-in loops','Clear this site’s data, sign in again; the server copy is untouched.'],
['EPUB blocked','The validator names the structural error; fix it and export again.']])}
<dl class="hpd"><dt>Event</dt><dd>One box on the Journey map; becomes a chapter or scene.</dd><dt>Timeline</dt><dd>A lane of events.</dd><dt>Drawer</dt><dd>The side panel for an event, extended by packs.</dd><dt>Kathākośa</dt><dd>Your library of stories (कथाकोश, “treasury of stories”).</dd><dt>Story Markdown</dt><dd>The current story as one read-only Markdown document for wikis or AI assistants.</dd></dl>`);

sec('faq','Reference','FAQ — quick answers','',
`<dl class="hpd"><dt>Do I have to press Save?</dt><dd>No. Every change is saved on this device within a moment and synced if a server is running. ${kbd('Ctrl/⌘+S')} only creates a named history snapshot.</dd>
<dt>Where are my stories stored?</dt><dd>In your browser and, optionally, on the server you log in to. Clearing site data erases the browser copy, so export backups.</dd>
<dt>Can I use it offline?</dt><dd>Yes. Everything but sync, sharing and remote AI engines works offline.</dd>
<dt>How do I move a story to another computer?</dt><dd>Export (JSON) and Import JSON there, or sign in to the same server account.</dd>
<dt>How do I write a full novel?</dt><dd>One event per chapter, text in <b>Manuscript text</b>, order in Corkboard, polish in Edit final, export EPUB/DOCX.</dd>
<dt>What is the difference between an event and a chapter?</dt><dd>An event is a plan item; a chapter is how it appears in the Book. One event = one chapter.</dd>
<dt>Can two people edit one story?</dt><dd>Yes with accounts and an <b>editor</b> share; edits merge, conflicts ask you.</dd>
<dt>Does my text go to an AI?</dt><dd>Not unless you enable a remote verifier or API engine, and then only flagged passages.</dd>
<dt>Is there an undo for deleting a story?</dt><dd>No. Export first.</dd></dl>`);

/* ---------- tab -> docs section map (checked by test/guards.js: every tab must be documented) ---------- */
const COVER={},D=(section,tab)=>{COVER[tab]=section};window.DOCTAB=COVER;
D('start','docs');D('data','ai');D('data','data');D('views','life');D('views','cork');D('views','cal');
D('write','book');D('craft','craft');D('craft','packs');D('people','arcs');
D('world','places');D('world','props');D('world','board');D('world','wmap');D('world','wiki');D('rules','worlds');

/* ---------- page ---------- */
const plain=h=>h.replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').toLowerCase();
const match=s=>!Q||plain(s.title+' '+s.lead+' '+s.html).includes(Q);
const body=()=>{const L=SEC.filter(match);if(!L.length)return `<p class="mut">No section mentions “${Q.replace(/[<&>"]/g,'')}”. Try a shorter word such as <i>props</i>, <i>export</i> or <i>sync</i>.</p>`;
 return L.map(s=>`<section class="card dc" id="doc-${s.id}"><span class="hpg">${s.group}</span><h4>${s.title}</h4>${s.lead?`<p class="hpl">${s.lead}</p>`:''}${s.html}</section>`).join('')};
const toc=()=>{const g=[...new Set(SEC.map(s=>s.group))];return g.map(n=>`<div class="hpt"><b>${n}</b>`+SEC.filter(s=>s.group==n&&match(s)).map(s=>`<a href="#doc-${s.id}" data-dj="${s.id}">${s.title.replace(/<[^>]+>/g,'').replace(/&amp;/g,'&')}</a>`).join('')+`</div>`).join('')};
window.DOCSEC=SEC;
window.vDocs=function(){return `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><marker id="hpar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#8a8780"/></marker></defs></svg>
<div class="hp"><h3>📘 Kathakaar guide</h3><p class="mut">Everything the app does, with diagrams. Use the contents, or search.</p>
<input id="docq" type="search" value="${Q.replace(/"/g,'&quot;')}" placeholder="Search: props, export, shortcut, sync…" aria-label="Search the docs">
<div class="hpw"><nav class="hpn" id="hpn" aria-label="Contents">${toc()}</nav><div id="hpb">${body()}</div></div></div>`};
document.head.insertAdjacentHTML('beforeend',`<style>
.hp{max-width:1100px}.hp #docq{width:100%;max-width:420px;margin:6px 0 10px}.hpw{display:grid;grid-template-columns:210px minmax(0,1fr);gap:16px;align-items:start}
.hpn{position:sticky;top:64px;max-height:calc(100vh - 80px);overflow:auto;font-size:13px;display:grid;gap:8px}.hpt{display:grid;gap:2px}.hpt b{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--mut)}.hpt a{color:var(--ink);text-decoration:none;padding:2px 6px;border-radius:6px}.hpt a:hover{background:var(--hl)}
.dc{margin:0 0 12px}.dc h4{font-size:19px;margin:0}.dc h5{font-size:14px;margin:12px 0 4px}.hpg{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--acc);font-weight:600}.hpl{color:var(--mut);margin:0 0 6px}
.docT{border-collapse:collapse;width:100%;font-size:13px;margin:6px 0}.docT td,.docT th{border:1px solid var(--line);padding:5px 8px;text-align:left;vertical-align:top}.docT th{background:var(--hl)}
kbd{border:1px solid var(--line);border-bottom-width:2px;border-radius:4px;padding:0 5px;font-size:11px}.dc code{background:var(--hl);border-radius:4px;padding:0 4px;font-size:12.5px}.hpd dt{font-weight:600;margin-top:6px}.hpd dd{margin:0 0 0 14px}
.hpf{margin:8px 0;overflow-x:auto}.hpf svg{width:100%;min-width:560px;height:auto;display:block}.hpf figcaption{font-size:12px;color:var(--mut);margin-top:2px}
.hb{fill:var(--card);stroke:var(--line);stroke-width:1.5}.hb.acc{fill:var(--hl);stroke:var(--acc)}.hb.warn{fill:color-mix(in srgb,var(--warn) 14%,var(--card));stroke:var(--warn)}.hb.ok{fill:color-mix(in srgb,var(--ok) 14%,var(--card));stroke:var(--ok)}.hb.mu{fill:color-mix(in srgb,var(--mut) 10%,var(--card))}
.ht{fill:var(--ink);font-size:12.5px;font-weight:600}.hs{fill:var(--mut);font-size:11px}.hl{fill:var(--ink);font-size:12px;font-weight:700}.hl2{stroke:var(--line);stroke-width:1.5}
.ha{stroke:#8a8780;stroke-width:1.6;fill:none}.ha.dash{stroke-dasharray:5 4}.intended{fill:none;stroke:var(--mut);stroke-width:2;stroke-dasharray:6 4}.actual{fill:none;stroke:var(--acc);stroke-width:2.5}.dot{fill:var(--bad)}
.hpc{border-left:4px solid var(--acc);background:var(--hl);padding:6px 10px;border-radius:6px;margin:8px 0;font-size:13px}.hpc.warn{border-color:var(--warn)}
@media(max-width:800px){.hpw{grid-template-columns:1fr}.hpn{position:static;max-height:none}}</style>`);
document.addEventListener('input',e=>{if(e.target.id!='docq')return;Q=e.target.value.trim().toLowerCase();const b=document.getElementById('hpb'),n=document.getElementById('hpn');if(b)b.innerHTML=body();if(n)n.innerHTML=toc()});
document.addEventListener('click',e=>{const a=e.target.closest('[data-dj]');if(!a)return;e.preventDefault();const t=document.getElementById('doc-'+a.dataset.dj);if(t){t.scrollIntoView({behavior:'smooth',block:'start'});t.tabIndex=-1;t.focus({preventScroll:true})}});
})();
