from playwright.sync_api import sync_playwright
import json,urllib.request
errs=[];B='http://localhost:3111'
def srv(p,method='GET',data=None):
    r=urllib.request.Request(B+p,method=method,data=data.encode() if data else None)
    try: return urllib.request.urlopen(r).read().decode()
    except urllib.error.HTTPError as e: return 'HTTP%d'%e.code
with sync_playwright() as p:
    b=p.chromium.launch();ctx=b.new_context(viewport={'width':1300,'height':900});pg=ctx.new_page()
    pg.on('pageerror',lambda e:errs.append('PAGEERR '+str(e)))
    pg.on('console',lambda m:errs.append('CONSOLE '+m.text) if m.type=='error' and 'Failed to load resource' not in m.text else None)
    pg.on('dialog',lambda d:d.accept())
    # --- 1 first render has every tab; 12 tab restore
    pg.goto(B);pg.wait_for_timeout(1200)
    print('tabs on first paint',pg.evaluate("document.querySelectorAll('#sb [data-tab]').length"),pg.evaluate("[...document.querySelectorAll('#sb [data-tab]')].some(b=>b.dataset.tab=='arcs')"))
    pg.evaluate("S.tab='docs';render();flush()");pg.reload();pg.wait_for_timeout(1000)
    print('docs tab restored',pg.evaluate("S.tab"))
    # --- 2 merge: local-only story survives when server has other keys
    pg.evaluate("localStorage.setItem('sf-localonly',JSON.stringify({title:'Only local',chars:[],ev:[]}))");pg.wait_for_timeout(900)
    srv('/api/kv/sf-srvonly','PUT',json.dumps({'title':'Only server','chars':[],'ev':[]}))
    pg.evaluate("localStorage.removeItem('xsync')")  # simulate a device that has never synced
    pg.reload();pg.wait_for_timeout(1200)
    print('local kept',pg.evaluate("!!localStorage.getItem('sf-localonly')"),'server pulled',pg.evaluate("!!localStorage.getItem('sf-srvonly')"),'local pushed',(json.loads(srv('/api/kv')).get('sf-localonly') or 'MISSING')[:20])
    # conflict -> dialog accepted = keep local
    pg.evaluate("localStorage.setItem('sf-conf',JSON.stringify({title:'Conf local',chars:[],ev:[]}))");pg.wait_for_timeout(900)
    srv('/api/kv/sf-conf','PUT',json.dumps({'title':'Conf server','chars':[],'ev':[]}));pg.evaluate("localStorage.removeItem('xsync')")
    pg.reload();pg.wait_for_timeout(1200)
    print('conflict kept local',json.loads(json.loads(srv('/api/kv'))['sf-conf'])['title'],'| backup saved',pg.evaluate("(JSON.parse(localStorage.getItem('sf-baks-sf-conf')||'[]')).length"))
    # --- server validation
    print('bad json',srv('/api/kv/sf-x','PUT','{nope'),'bad story',srv('/api/kv/sf-x','PUT','{"chars":{}}'))
    # --- 3 cycles
    pg.evaluate("""(()=>{const o=norm({places:[{id:'a',name:'A',parent:'b'},{id:'b',name:'B',parent:'c'},{id:'c',name:'C',parent:'a'}],times:[],chars:[],ev:[]});window.__cyc=o.places.map(p=>p.parent)})()""")
    print('cycle broken',pg.evaluate("__cyc.filter(x=>!x).length>=1"))
    # --- 7 zoom
    pg.evaluate("S.tab='map';S.mv.sc=1e12;render()");print('STEP',pg.evaluate("STEP>0&&isFinite(STEP)"))
    pg.evaluate("S.mv.sc=1e-9;render()");print('STEP far out',pg.evaluate("STEP>0&&isFinite(STEP)"))
    # --- 5/6/15 offline world checks incl. final text + triggers + wildcard
    pg.evaluate("sw('sf-river')");pg.wait_for_timeout(200)
    pg.evaluate("""S.worlds=[{id:'w',name:'W',desc:'',rules:[{id:'r1',cat:'Law & Order',text:'Nobody may carry weapons in the temple',ban:'',trig:'',off:0},{id:'r2',cat:'Physics',text:'Gold reacts with water',ban:'',trig:'',off:0},{id:'r3',cat:'Physics',text:'x',ban:'fly*',trig:'',off:0}]}];S.wid='w';
      S.ev.forEach(e=>{e.prose='Quiet.';delete e.fin});S.ev[0].fin={book:'Kael drew his sword inside the temple. A flyer passed.'};S.ev[1].prose='The gold coin sank into the river.';S.info=[];""")
    print('violations',pg.evaluate("wchk().map(v=>v.r.id+':'+v.how).join(',')"))
    pg.evaluate("S.tab='worlds';render()")
    print('why shown',pg.evaluate("document.querySelectorAll('#app details summary').length>0"))
    # dedupe simple+semantic
    pg.evaluate("SEM[S.ev[0].id]={h:shash(wsig(S.worlds[0])+itemTxt('ev',S.ev[0])),v:[{rule:'r3',how:'forbidden word',score:1,quote:'A flyer passed.',reason:'Matches forbidden pattern'}]}")
    print('dedupe',pg.evaluate("wchk().filter(v=>v.src.id==S.ev[0].id&&v.r.id=='r3').length"))
    # --- 13 plFor
    pg.evaluate("S.places=[{id:'pp',name:'Castle',lv:0,parent:null}];S.ev[2].place='Casle';S.ev[2].gp='pp'")
    print('plFor fallback',pg.evaluate("plFor(S.ev[2])&&plFor(S.ev[2]).name"))
    # --- backups, export all/import all
    pg.evaluate("flush();rotateBak(KEY,JSON.stringify(S),'t')");pg.click('[data-a=lib]') if False else None
    pg.evaluate("openBackups()");print('backup list',pg.evaluate("document.querySelectorAll('#dr [data-v5=bkrest]').length"))
    pg.evaluate("openLib()");print('export/import btns',pg.evaluate("!!document.querySelector('#dr [data-v5=expall]')&&!!document.querySelector('#dr [data-v5=impall]')"))
    # per-chapter goal
    pg.evaluate("S.tab='book';S.bk={fmt:'book',ord:'time',edit:1};render()")
    pg.fill('input[data-v5=wg] >> nth=0','100');pg.keyboard.press('Tab');pg.wait_for_timeout(150)
    print('chapter goal',pg.evaluate("S.ev.find(e=>e.wg)&&S.ev.find(e=>e.wg).wg"),pg.evaluate("!!document.querySelector('.pbar')"))
    # --- offline: stop server, check status + retry
    b.close()
print('ERRORS',errs)
