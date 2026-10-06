from playwright.sync_api import sync_playwright
errs=[]
def ok(c,m):
    print(('PASS ' if c else 'FAIL ')+m)
    if not c: errs.append(m)
with sync_playwright() as p:
    b=p.chromium.launch();ctx=b.new_context();pg=ctx.new_page()
    pg.on('pageerror',lambda e:errs.append('PAGEERR '+str(e)));pg.on('dialog',lambda d:d.accept())
    pg.route('**/api/**',lambda r:r.abort())          # local-only mode: IndexedDB must protect the data by itself
    pg.goto('http://localhost:3111');pg.wait_for_timeout(1200)
    ok(pg.evaluate("SFSTORE.idb"),'IndexedDB available')
    pg.evaluate("sw('sf-river');S.title='Durable';flush()");pg.wait_for_timeout(800)
    pg.evaluate("localStorage.setItem('sf-mine',JSON.stringify({title:'Mine',chars:[],ev:[]}))");pg.wait_for_timeout(600)
    # simulate "clear site data" of localStorage only
    pg.evaluate("Storage.prototype.clear.call(localStorage)");ok(pg.evaluate("localStorage.getItem('sf-mine')===null"),'localStorage wiped')
    pg.reload();pg.wait_for_timeout(1500)
    ok(pg.evaluate("localStorage.getItem('sf-mine')!==null"),'story recovered from IndexedDB after localStorage loss')
    # overflow: fill localStorage, then write a big story
    pg.evaluate("""(()=>{try{const chunk='x'.repeat(200000);for(let i=0;i<60;i++)Storage.prototype.setItem.call(localStorage,'zfill'+i,chunk)}catch(e){}})()""")
    big=pg.evaluate("""(()=>{const o={title:'Big',chars:[],ev:[]};for(let i=0;i<30;i++)o.ev.push({id:'e'+i,title:'E'+i,t:i/360,tl:'t1',chars:[],prose:'word '.repeat(20000)});localStorage.setItem('sf-big',JSON.stringify(o));return SFSTORE.overflow().includes('sf-big')})()""")
    ok(big,'big story kept via overflow when localStorage is full')
    ok(pg.evaluate("JSON.parse(localStorage.getItem('sf-big')).ev.length==30"),'getItem serves overflow value')
    pg.evaluate("Object.keys(localStorage).filter(k=>k.startsWith('zfill')).forEach(k=>localStorage.removeItem(k))");pg.wait_for_timeout(500)
    pg.reload();pg.wait_for_timeout(1500)
    ok(pg.evaluate("localStorage.getItem('sf-big')!==null&&JSON.parse(localStorage.getItem('sf-big')).ev.length==30"),'overflow story survives reload')
    b.close()
print('ERRORS',errs)
